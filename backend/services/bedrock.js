const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const fs = require('fs');
const path = require('path');

require('dotenv').config();

// ---------------------------------------------------------------------------
// Bedrock Client
// ---------------------------------------------------------------------------
const client = new BedrockRuntimeClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// ---------------------------------------------------------------------------
// Model Cascade — ordered by quality (best first).
// The system automatically falls back to the next model on rate-limit errors.
// All models support vision and produce equivalent JSON output.
// ---------------------------------------------------------------------------
const MODEL_CASCADE = [
    {
        id: "anthropic.claude-3-5-sonnet-20240620-v1:0",
        label: "Claude 3.5 Sonnet",
        maxTokens: 1024,
    },
    {
        id: "anthropic.claude-3-sonnet-20240229-v1:0",
        label: "Claude 3 Sonnet",
        maxTokens: 1024,
    },
    {
        id: "anthropic.claude-3-haiku-20240307-v1:0",
        label: "Claude 3 Haiku",
        maxTokens: 1000,
    },
    {
        id: "amazon.titan-text-express-v1",
        label: "Amazon Titan Text Express",
        maxTokens: 1024,
        textOnly: true // Flag to skip vision-related payload
    },
];

/**
 * Determine if a Bedrock error is a rate-limit / quota error that warrants
 * trying the next model in the cascade.
 * @param {Error} error
 * @returns {boolean}
 */
function isRateLimitError(error) {
    const msg = (error.message || '').toLowerCase();
    return (
        error.name === 'ThrottlingException' ||
        error.name === 'ServiceQuotaExceededException' ||
        error.name === 'LimitExceededException' ||
        msg.includes('too many tokens') ||
        msg.includes('rate limit') ||
        msg.includes('throttl') ||
        msg.includes('quota') ||
        msg.includes('tokens per day') ||
        msg.includes('requests per minute')
    );
}

// ---------------------------------------------------------------------------
// Knowledge Context Loaders
// ---------------------------------------------------------------------------
const legislationPath = path.join(__dirname, '../knowledge/section_27.txt');
let legislationContext = "Legislation text not found.";
try {
    legislationContext = fs.readFileSync(legislationPath, 'utf8');
} catch (err) {
    console.error("Warning: Could not load legislation context:", err.message);
}

const fireExitPath = path.join(__dirname, '../knowledge/fire_exit_requirements.txt');
let fireExitContext = "Fire exit requirements not found.";
try {
    fireExitContext = fs.readFileSync(fireExitPath, 'utf8');
} catch (err) {
    console.error("Warning: Could not load fire exit context:", err.message);
}

// ---------------------------------------------------------------------------
// Core Analysis Function
// ---------------------------------------------------------------------------

/**
 * Invoke a single Bedrock model with the prepared payload.
 * @param {string} modelId
 * @param {number} maxTokens
 * @param {string} systemPrompt
 * @param {Array}  contentPayload
 * @returns {Promise<object>} Parsed AI result JSON
 */
async function invokeModel(modelId, maxTokens, systemPrompt, contentPayload) {
    const input = {
        modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: [{ role: "user", content: contentPayload }]
        }),
    };

    const command = new InvokeModelCommand(input);
    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const aiText = responseBody.content[0].text;

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    return jsonMatch
        ? JSON.parse(jsonMatch[0])
        : { error: "Failed to parse AI JSON", raw: aiText };
}

/**
 * Analyse a venue image using the Bedrock model cascade.
 * Automatically falls back to the next model on rate-limit errors.
 *
 * @param {Buffer}   imageBuffer        - Main video frame
 * @param {object}   venueDetails       - { name, capacity }
 * @param {object}   [proceduralContext] - Questionnaire answers
 * @param {string}   [verbalNotes]      - Audio transcript
 * @param {Buffer[]} [evidenceBuffers]  - Evidence document images
 * @param {Buffer}   [mapBuffer]        - Satellite map image
 * @returns {Promise<object>} Risk assessment result with `_model_used` field
 */
async function analyzeRisk(
    imageBuffer,
    venueDetails,
    proceduralContext = null,
    verbalNotes = null,
    evidenceBuffers = [],
    mapBuffer = null
) {
    // --- Build Content Payload ---
    const base64Image = imageBuffer.toString('base64');

    const evidenceImages = evidenceBuffers.map((buf) => ({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: buf.toString('base64') }
    }));

    const mapObject = mapBuffer
        ? { type: "image", source: { type: "base64", media_type: "image/jpeg", data: mapBuffer.toString('base64') } }
        : null;

    const systemPrompt = `You are a UK Counter-Terrorism Security Advisor conducting a Martyn's Law compliance audit.
    
    LEGAL CONTEXT (THE LAW):
    ${legislationContext}
    
    FIRE SAFETY & SIGNAGE CONTEXT (BS EN ISO 7010):
    ${fireExitContext}

    PROCEDURAL COMPLIANCE CONTEXT (USER SELF-DECLARATION):
    ${proceduralContext ? JSON.stringify(proceduralContext, null, 2) : "No procedural context provided."}
    
    VERBAL OBSERVATIONS (USER COMMENTARY):
    ${verbalNotes ? `"${verbalNotes}"` : "No verbal commentary provided."}
    
    EVIDENCE DOCUMENTS ATTACHED: ${evidenceBuffers.length}
    GEO-SPATIAL CONTEXT: ${mapBuffer ? "Satellite Map Attached" : "None"}
    
    Scan this image for UK standard safety signage adhering to BS EN ISO 7010. 
    - Fire Exits are rectangular GREEN signs featuring a white pictogram of a person running through a doorway.
    - Assembly Points are square GREEN signs featuring a white pictogram of four arrows pointing inward toward a central figure.
    - Fire Equipment signs are RED squares featuring a white flame.
    
    VENUE DETAILS:
    - Name: ${venueDetails.name}
    - Capacity: ${venueDetails.capacity} (Tier: ${venueDetails.capacity >= 800 ? 'Enhanced' : 'Standard'})`;

    const userMessage = `
        Perform a valid Risk Assessment under Section 27 of the Terrorism (Protection of Premises) Bill.
        
        CRITICAL INSTRUCTIONS FOR HYBRID ANALYSIS:
        1. **Procedural Verification:** Check the "PROCEDURAL COMPLIANCE CONTEXT" above.
           - If the user said "YES" to having signs/CCTV: Verify if they are visible in this image OR in the attached Evidence Documents.
           - If a Document is attached (e.g., Lockdown Plan), verify it is a valid document, not just a random photo.
           - If the user said "NO" to any question: Immediately flag this as a CRITICAL Procedural Hazard.
        
        2. **Verbal Cross-Check:** 
           - Read the "VERBAL OBSERVATIONS". If the user mentions a specific hazard (e.g., "Door is jammed"), prioritize verifying this visually.
           - If the user says "This is compliant" but image shows otherwise -> Flag as "Conflict".

        3. **Geo-Spatial Analysis (External Risks):**
           - If a SATELLITE MAP is attached, analyze it for external threats.
           - Look for: Vehicle Ramming access points (VBIED), lack of standoff distance, or crowded external queuing areas.
           - If the venue is near a road with no bollards -> Flag as "High External Risk".

        ANALYSIS STEPS:
        1. Analyze the provided image frame, evidence documents, and satellite map.
        2. Identify specific security hazards (Internal & External).
        3. Assess the RISK (Likelihood x Impact).
        4. Propose a MITIGATION.
        5. APPLY THE TEST: Is this mitigation "Reasonably Practicable"?
        
        OUTPUT FORMAT (JSON ONLY):
        {
            "hazard_type": "string",
            "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
            "description": "string",
            "mitigation": "string",
            "reasonably_practicable": boolean,
            "legal_justification": "string"
        }
    `;

    const contentPayload = [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64Image } },
        ...(mapObject ? [mapObject] : []),
        ...evidenceImages,
        { type: "text", text: userMessage }
    ];

    // --- Model Cascade ---
    const errors = [];

    for (const model of MODEL_CASCADE) {
        try {
            console.log(`[Bedrock] Attempting analysis with ${model.label} (${model.id})...`);
            const result = await invokeModel(model.id, model.maxTokens, systemPrompt, contentPayload);

            // Attach which model was used so the frontend can display it
            result._model_used = model.label;
            console.log(`[Bedrock] ✅ Success with ${model.label}`);
            return result;

        } catch (error) {
            console.warn(`[Bedrock] ⚠️  ${model.label} failed: ${error.message}`);
            errors.push({ model: model.label, error: error.message });

            if (isRateLimitError(error)) {
                // Rate limit — try next model in cascade
                console.warn(`[Bedrock] Rate limit hit on ${model.label}, falling back...`);
                continue;
            }

            // Non-rate-limit errors: handle specifically and stop cascade
            if (error.message && (error.message.includes('PAYMENT') || error.message.includes('subscription'))) {
                return {
                    hazard_type: "AWS Billing Issue",
                    severity: "CRITICAL",
                    description: "AWS denied access due to payment/subscription issues. Check AWS Billing Dashboard.",
                    mitigation: "Log in to AWS Console > Billing and update payment method.",
                    reasonably_practicable: true,
                    legal_justification: "Service availability depends on valid account status.",
                    _model_used: "None"
                };
            }

            if (
                error.name === 'UnrecognizedClientException' ||
                error.name === 'AccessDeniedException' ||
                error.name === 'CredentialsProviderError'
            ) {
                return {
                    hazard_type: "AWS Auth Error",
                    severity: "CRITICAL",
                    description: `AWS Access Denied. Error: ${error.message}`,
                    mitigation: "Check .env file for valid AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.",
                    reasonably_practicable: true,
                    legal_justification: "System cannot function without valid credentials.",
                    _model_used: "None"
                };
            }

            if (error.message && error.message.includes('access to the model')) {
                // Model not enabled — skip to next in cascade
                console.warn(`[Bedrock] Model access not granted for ${model.label}, trying next...`);
                continue;
            }

            // Unknown error — bubble up
            throw new Error(`Bedrock API Verification Failed: ${error.message}`);
        }
    }

    // All models exhausted
    const summary = errors.map(e => `${e.model}: ${e.error}`).join(' | ');
    throw new Error(`All AI models rate-limited or unavailable. Errors: ${summary}`);
}

module.exports = { analyzeRisk };

const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const fs = require('fs');
const path = require('path');

require('dotenv').config(); // Load vars if not already loaded

// Initialize Bedrock Client (Region must match where you enabled the model)
const client = new BedrockRuntimeClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0"; // Verified Working

// Load Legislation Context
const legislationPath = path.join(__dirname, '../knowledge/section_27.txt');
let legislationContext = "Legislation text not found.";
try {
    legislationContext = fs.readFileSync(legislationPath, 'utf8');
} catch (err) {
    console.error("Warning: Could not load legislation context:", err.message);
}

// Load Fire Safety Context
const fireExitPath = path.join(__dirname, '../knowledge/fire_exit_requirements.txt');
let fireExitContext = "Fire exit requirements not found.";
try {
    fireExitContext = fs.readFileSync(fireExitPath, 'utf8');
} catch (err) {
    console.error("Warning: Could not load fire exit context:", err.message);
}

async function analyzeRisk(imageBuffer, venueDetails) {

    // Convert Image to Base64
    const base64Image = imageBuffer.toString('base64');

    // 1. Construct the Prompt (The "Blue Team" approach)
    // 1. Construct the Prompt (The "Blue Team" approach)
    const systemPrompt = `You are a UK Counter-Terrorism Security Advisor conduction a Martyn's Law compliance audit.
    
    LEGAL CONTEXT (THE LAW):
    ${legislationContext}
    
    FIRE SAFETY & SIGNAGE CONTEXT (BS EN ISO 7010):
    ${fireExitContext}
    
    Scan this image for UK standard safety signage adhering to BS EN ISO 7010. 
    - Fire Exits are rectangular GREEN signs featuring a white pictogram of a person running through a doorway.
    - Assembly Points are square GREEN signs featuring a white pictogram of four arrows pointing inward toward a central figure.
    - Fire Equipment signs are RED squares featuring a white flame.
    
    VENUE DETAILS:
    - Name: ${venueDetails.name}
    - Capacity: ${venueDetails.capacity} (Tier: ${venueDetails.capacity >= 800 ? 'Enhanced' : 'Standard'})`;

    const userMessage = `
        Perform a valid Risk Assessment under Section 27 of the Terrorism (Protection of Premises) Bill.
        
        CRITICAL INSTRUCTIONS FOR FIRE EXIT IDENTIFICATION:
        - A door is ONLY a fire exit if it has the GREEN "RUNNING MAN" SIGN (BS 5499-4:2013 / ISO 7010)
        - DO NOT assume a regular door is a fire exit just because it leads outside.
        - If no fire exit signage is visible, it is NOT a fire exit.

        ANALYSIS STEPS:
        1. Analyze the provided image frame.
        2. Identify specific security hazards.
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

    // Reference Images (Placeholders as requested)
    const REF_FIRE_EXIT_B64 = "PLACEHOLDER_BASE64_FIRE_EXIT_SIGN";
    const REF_ASSEMBLY_B64 = "PLACEHOLDER_BASE64_ASSEMBLY_POINT_SIGN";

    // 2. Call Bedrock
    const input = {
        modelId: MODEL_ID,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 1000,
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: [
                        // Few-Shot: Reference 1 (Fire Exit)
                        /*
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: "image/jpeg",
                                data: REF_FIRE_EXIT_B64
                            }
                        },
                        {
                            type: "text",
                            text: "Reference: Standard UK Fire Exit Sign (BS EN ISO 7010)"
                        },
                        // Few-Shot: Reference 2 (Assembly Point)
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: "image/jpeg",
                                data: REF_ASSEMBLY_B64
                            }
                        },
                        {
                            type: "text",
                            text: "Reference: Standard UK Assembly Point Sign"
                        },
                        */
                        // User Input
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: "image/jpeg",
                                data: base64Image
                            }
                        },
                        {
                            type: "text",
                            text: userMessage
                        }
                    ]
                }
            ]
        }),
    };

    try {
        const command = new InvokeModelCommand(input);
        const response = await client.send(command);

        // 3. Parse Response
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const aiText = responseBody.content[0].text;

        // Extract JSON from the text
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Failed to parse AI JSON", raw: aiText };

        return result;

    } catch (error) {
        console.error("Bedrock API Error:", error);

        // Specific handling for Payment / Subscription Issues
        if (error.message && (error.message.includes('PAYMENT') || error.message.includes('subscription'))) {
            return {
                hazard_type: "AWS Billing Issue",
                severity: "CRITICAL",
                description: "AWS denied access due to payment/subscription issues. Check AWS Billing Dashboard.",
                mitigation: "Log in to AWS Console > Billing and update payment method.",
                reasonably_practicable: true,
                legal_justification: "Service availability depends on valid account status."
            };
        }

        // Fallback for demo if keys are missing or invalid
        if (error.name === 'UnrecognizedClientException' || error.name === 'AccessDeniedException') {
            return {
                hazard_type: "Demo: AWS Creds Missing",
                severity: "LOW",
                description: "Cannot connect to Bedrock. Please check server logs for AWS Key issues.",
                mitigation: "Add AWS_ACCESS_KEY_ID to .env",
                reasonably_practicable: true,
                legal_justification: "System configuration required."
            };
        }
        throw new Error(`AI Analysis Failed: ${error.message}`);
    }
}

module.exports = { analyzeRisk };

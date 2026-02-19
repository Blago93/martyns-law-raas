require('dotenv').config();
const { analyzeRisk } = require('./services/bedrock');
const fs = require('fs');
const path = require('path');
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

// ⚡️ OVERRIDE: Try Haiku directly in this test script
const HAIKU_ID = "anthropic.claude-3-5-haiku-20241022-v1:0";
const SONNET_ID = "anthropic.claude-3-5-sonnet-20241022-v2:0";

async function testAI() {
    console.log("🧪 Testing AI Risk Engine...");
    console.log("Using Region:", process.env.AWS_REGION);

    // Create dummy image buffer
    const dummyBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

    // --- TEST 1: Haiku ---
    try {
        console.log(`\nAttempting with Haiku (${HAIKU_ID})...`);
        const result = await analyzeRiskWithModel(dummyBuffer, { name: "Test Venue", capacity: 50 }, HAIKU_ID);
        console.log("✅ SUCCESS with Haiku!");
        console.log(JSON.stringify(result, null, 2));
        return;
    } catch (err) {
        console.log("❌ Haiku Failed:", err.message);
    }

    // --- TEST 2: Sonnet ---
    try {
        console.log(`\nAttempting with Sonnet (${SONNET_ID})...`);
        const result = await analyzeRiskWithModel(dummyBuffer, { name: "Test Venue", capacity: 50 }, SONNET_ID);
        console.log("✅ SUCCESS with Sonnet!");
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.log("❌ Sonnet Failed:", err.message);
    }
}

// Minimal implementation to test specific models
async function analyzeRiskWithModel(imageBuffer, venueDetails, modelId) {
    const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

    const input = {
        modelId: modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 1000,
            messages: [
                {
                    role: "user",
                    content: [{ type: "text", text: "Hello AI, respond with JSON: { \"status\": \"ok\" }" }] // Simplify prompt for connection test
                }
            ]
        }),
    };

    const command = new InvokeModelCommand(input);
    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody;
}

testAI();

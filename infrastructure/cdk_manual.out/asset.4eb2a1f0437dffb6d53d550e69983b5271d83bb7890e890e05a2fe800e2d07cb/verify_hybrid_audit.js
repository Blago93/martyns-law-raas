const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// --- SETUP DUMMY FILES ---
const framePath = path.join(__dirname, 'test_frame.jpg');
const evidencePath = path.join(__dirname, 'test_evidence.jpg');

// Create dummy files if not exist (just binary noise)
if (!fs.existsSync(framePath)) fs.writeFileSync(framePath, Buffer.from('FFD8FFE000104A4649460001', 'hex'));
if (!fs.existsSync(evidencePath)) fs.writeFileSync(evidencePath, Buffer.from('FFD8FFE000104A4649460001', 'hex'));

async function runTest() {
    console.log("🚀 Starting Hybrid Audit Integration Test...");

    const form = new FormData();

    // 1. Video Frame
    form.append('frame', fs.createReadStream(framePath));

    // 2. Evidence Document (Document Verification)
    form.append('evidence_docs', fs.createReadStream(evidencePath));

    // 3. Venue Details (Geo-Spatial Context)
    // Using a known address to trigger the mock map logic
    const venue = {
        name: "Test Venue",
        capacity: 5000,
        address: "Manchester Arena, Victoria Station"
    };
    form.append('venue', JSON.stringify(venue));

    // 4. Verbal Notes (Audio Narration)
    const audioNote = "I am walking towards the North Exit. The sign is visible but the door appears jammed.";
    form.append('verbal_notes', audioNote);

    // 5. Procedural Context (Hybrid)
    const context = {
        q1_signs: "YES",
        q2_cctv: "NO" // Should trigger procedural hazard
    };
    form.append('context', JSON.stringify(context));

    try {
        // Use BASE_URL env var to switch between local and cloud.
        // Default: live App Runner deployment.
        const BASE_URL = process.env.BASE_URL || 'https://qgfbkqqhvm.eu-west-2.awsapprunner.com';
        console.log(`📡 Sending Request to ${BASE_URL}...`);
        const res = await axios.post(`${BASE_URL}/api/audit/analyze`, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log("\n✅ RESPONSE RECEIVED:");
        console.log("------------------------------------------------");
        console.log(JSON.stringify(res.data, null, 2));
        console.log("------------------------------------------------");

        // VALIDATION CHECKS
        const data = res.data.data; // structure depends on backend response format

        if (data.hazard_type) {
            console.log("✅ AI Analysis Returned a Finding.");
            console.log(`   Type: ${data.hazard_type}`);
            console.log(`   Severity: ${data.severity}`);
        } else {
            console.warn("⚠️  AI Response format unexpected:", data);
        }

    } catch (error) {
        console.error("\n❌ TEST FAILED");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            const errorMsg = error.response.data.error || '';
            const hint = error.response.data.hint || '';

            console.error(`Error: ${errorMsg}`);
            if (hint) {
                console.log("\n💡 ACTIONABLE HINT:");
                console.log("------------------------------------------------");
                console.log(hint);
                console.log("------------------------------------------------");
            }

            if (error.response.status === 500 && errorMsg.includes('quota')) {
                console.log("\n🚨 QUOTA EXCEEDED:");
                console.log("All AI models in the cascade are currently rate-limited.");
                console.log("1. Wait until midnight UTC for automatic reset.");
                console.log("2. Request a quota increase in the AWS Console (Service Quotas -> Bedrock).");
            }
        } else if (error.request) {
            console.error("No response received. Request was sent. Is the backend server running?");
        } else {
            console.error("Error Message:", error.message);
        }
    } finally {
        // Cleanup
        if (fs.existsSync(framePath)) fs.unlinkSync(framePath);
        if (fs.existsSync(evidencePath)) fs.unlinkSync(evidencePath);
    }
}

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

runTest();

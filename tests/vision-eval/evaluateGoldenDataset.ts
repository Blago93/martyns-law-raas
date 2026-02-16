const fs = require('fs');
const path = require('path');
const { analyzeRisk } = require('../../backend/services/bedrock');
const assert = require('assert');

// Simple mock if backend modules aren't fully loadable in standalone test script
// But since we are requiring the real service, we need to ensure environment vars are loaded.
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const GROUND_TRUTH_PATH = path.join(__dirname, 'ground_truth.json');

async function evaluateGoldenDataset() {
    console.log("🔍 Starting Vision Model Evaluation...");

    // Check if fixtures exist
    if (!fs.existsSync(FIXTURES_DIR)) {
        console.error("❌ Fixtures directory not found. Please add test images to tests/vision-eval/fixtures/");
        process.exit(1);
    }

    const files = fs.readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    if (files.length === 0) {
        console.warn("⚠️ No test images found. Skipping evaluation.");
        return;
    }

    // Load Ground Truth
    let groundTruth = {};
    if (fs.existsSync(GROUND_TRUTH_PATH)) {
        groundTruth = JSON.parse(fs.readFileSync(GROUND_TRUTH_PATH, 'utf8'));
    } else {
        console.warn("⚠️ No ground_truth.json found. Creating template...");
        const template = {};
        files.forEach(f => template[f] = { "expected_hazard": "fire_exit_blocked", "expected_severity": "HIGH" });
        fs.writeFileSync(GROUND_TRUTH_PATH, JSON.stringify(template, null, 2));
        console.log("✅ Created ground_truth.json template. Please populate it.");
        return; // Exit so user can populate
    }

    let correctPredictions = 0;
    let totalImages = 0;

    for (const file of files) {
        totalImages++;
        console.log(`\n📸 Analyzing: ${file}`);
        const imagePath = path.join(FIXTURES_DIR, file);
        const imageBuffer = fs.readFileSync(imagePath);

        try {
            // Mock venue details
            const venueDetails = { name: "Test Venue", capacity: 500 };

            // Call AI
            const result = await analyzeRisk(imageBuffer, venueDetails);

            console.log("🤖 AI Result:", JSON.stringify(result, null, 2));

            // Comparison Logic
            const truth = groundTruth[file];
            if (!truth) {
                console.warn(`⚠️ No ground truth for ${file}`);
                continue;
            }

            // Simple assertion: Check if hazard type matches roughly
            const aiHazard = result.hazard_type.toLowerCase();
            const expectedHazard = truth.expected_hazard.toLowerCase();

            // We use 'includes' for loose matching as AI text varies
            if (aiHazard.includes(expectedHazard) || result.description.toLowerCase().includes(expectedHazard)) {
                console.log("✅ MATCH");
                correctPredictions++;
            } else {
                console.error(`❌ MISMATCH. Expected '${expectedHazard}', got '${aiHazard}'`);
            }

        } catch (error) {
            console.error(`💥 Error processing ${file}:`, error.message);
        }
    }

    // Statistics
    console.log("\n--- Evaluation Report ---");
    const accuracy = (correctPredictions / totalImages) * 100;
    console.log(`Total Images: ${totalImages}`);
    console.log(`Accuracy: ${accuracy.toFixed(2)}%`);

    // Fail if accuracy < 90%
    try {
        assert(accuracy >= 90, "Model accuracy dropped below 90%!");
        console.log("✅ TEST PASSED");
    } catch (e) {
        console.error("❌ TEST FAILED:", e.message);
        process.exit(1);
    }
}

evaluateGoldenDataset();

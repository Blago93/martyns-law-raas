const fs = require('fs');
const path = require('path');

// Mock Satellite Map (Base64 placeholder)
// In production, this would fetch from Google Maps Static API
const getSatelliteMap = async (address) => {
    console.log(`[Maps Service] Fetching satellite view for: ${address}`);

    // For demo purposes, we return a static "Map" image
    // This allows us to test the pipeline without a Google API Key
    try {
        const mapPath = path.join(__dirname, '../knowledge/mock_satellite_map.jpg');
        if (fs.existsSync(mapPath)) {
            return fs.readFileSync(mapPath);
        } else {
            // Fallback if file missing (should replace with real base64 string for robustness in pro)
            console.warn("Mock map file not found. Returning null.");
            return null;
        }
    } catch (e) {
        console.error("Map fetch error:", e);
        return null;
    }
};

module.exports = { getSatelliteMap };

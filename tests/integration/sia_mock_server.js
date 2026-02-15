
const express = require('express');
const app = express();
const port = 4000;

app.use(express.json());

// Mock Data Store
const notifications = [];

// Endpoint: Submit Notification
app.post('/v1/notifications/submit', (req, res) => {
    const { venue_name, capacity, responsible_person_email } = req.body;

    // 1. Regulatory Validation Scope
    if (!capacity) {
        return res.status(400).json({ error: "Missing Capacity" });
    }

    const capacityInt = parseInt(capacity, 10);

    // RT-S1 Edge Case: Below Threshold
    if (capacityInt < 200) {
        // Technically strict API might reject, or warn. 
        // Spec says "Reject payload where capacity < 200"
        return res.status(400).json({
            error: "Standard Tier Duty applies to 200+ capacity. Use Voluntary Submission endpoint."
        });
    }

    if (!responsible_person_email) {
        return res.status(400).json({ error: "Missing Responsible Person Email" });
    }

    // 2. Chaos Engineering (Simulate 503 Outage)
    // Randomly fail 20% of requests to test resilience
    if (Math.random() < 0.2) {
        return res.status(503).json({ error: "SIA Gateway Unavailable - Maintenance" });
    }

    // Success
    const id = `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    notifications.push({ id, ...req.body });

    return res.status(201).json({
        notification_id: id,
        status: "RECEIVED",
        timestamp: new Date().toISOString()
    });
});

app.listen(port, () => {
    console.log(`SIA Mock Gateway running at http://localhost:${port}`);
});

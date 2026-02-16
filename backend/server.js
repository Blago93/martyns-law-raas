require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for frontend (localhost for dev, Vercel for production)
app.use(cors({
    origin: ['http://localhost:3000', 'https://martyns-law-raas.vercel.app'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

// Middleware: Chunking Video
// Splits video into 10-second segments
const chunkVideo = (req, res, next) => {
    if (!req.file) {
        return next(); // No file to chunk
    }

    const filePath = req.file.path;
    const outputPattern = path.join(uploadDir, `chunk_${Date.now()}_%03d.mp4`);

    console.log(`Starting chunking for ${filePath}...`);

    // In a real environment (e.g. AWS App Runner), ensure ffmpeg is installed via Dockerfile
    // Audio Processing Note: 
    // - The '-c copy' flag preserves the audio stream captured by the frontend.
    // - Future Enhancement: Extract audio track here using `ffmpeg -i input -vn audio.mp3`
    //   and send to AWS Transcribe or OpenAI Whisper for text context injection into Bedrock.

    ffmpeg(filePath)
        .outputOptions([
            '-c copy', // Fast copy without re-encoding (Preserves Audio)
            '-map 0',
            '-segment_time 10',
            '-f segment',
            '-reset_timestamps 1'
        ])
        .output(outputPattern)
        .on('end', () => {
            console.log('Chunking finished successfully');
            req.videoChunks = {
                original: filePath,
                pattern: outputPattern
            };
            next();
        })
        .on('error', (err) => {
            console.error('Error chunking video:', err);
            // We proceed with error info instead of crashing request
            req.chunkingError = err.message;
            next();
        })
        .run();
};

// Route: /api/audit/video
app.post('/api/audit/video', upload.single('video'), chunkVideo, (req, res) => {
    if (!req.file) {
        return res.status(400).send('No video file uploaded.');
    }

    if (req.chunkingError) {
        return res.status(500).json({
            message: 'Video upload successful but chunking failed.',
            error: req.chunkingError,
            userHint: 'Ensure ffmpeg is installed in the environment.',
            file: req.file
        });
    }

    res.json({
        message: 'Video uploaded and chunked successfully.',
        file: req.file,
        chunkingStatus: 'completed',
        chunks: req.videoChunks
    });
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

const db = require('./db');

app.get('/api/health/db', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json({
            status: 'connected',
            serverTime: result.rows[0].now
        });
    } catch (error) {
        console.error('DB Connection Failed:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// --- DATABASE SCHEMA INITIALIZATION ---
const initDB = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS findings (
                id SERIAL PRIMARY KEY,
                digital_thread_id VARCHAR(255),
                hazard_type VARCHAR(255),
                severity VARCHAR(50),
                description TEXT,
                mitigation TEXT,
                reasonably_practicable BOOLEAN,
                status VARCHAR(50) DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, VALIDATED, OVERRIDDEN
                justification TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Database 'findings' table verified/created.");
    } catch (err) {
        console.error("❌ Database Schema Error:", err);
    }
};

initDB();

// Route: /api/audit/analyze
// Triggers AI Risk Assessment on the uploaded video
const { analyzeRisk } = require('./services/bedrock');

app.post('/api/audit/analyze', upload.single('frame'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No frame image provided for analysis.');
        }

        const venueDetails = {
            name: JSON.parse(req.body.venue || '{}').name || "Unknown Venue",
            capacity: JSON.parse(req.body.venue || '{}').capacity || 1000
        };

        const digitalThreadId = req.body.threadId || `THREAD-${Date.now()}`;

        console.log(`Analyzing frame for ${venueDetails.name}...`);

        // Read file buffer
        const imageBuffer = fs.readFileSync(req.file.path);

        // Call AI
        const riskAssessment = await analyzeRisk(imageBuffer, venueDetails);

        // Clean up temp file
        fs.unlinkSync(req.file.path);

        // SAVE TO DB
        const insertQuery = `
            INSERT INTO findings (digital_thread_id, hazard_type, severity, description, mitigation, reasonably_practicable, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'PENDING_REVIEW')
            RETURNING *;
        `;
        const values = [
            digitalThreadId,
            riskAssessment.hazard_type,
            riskAssessment.severity,
            riskAssessment.description,
            riskAssessment.mitigation,
            riskAssessment.reasonably_practicable
        ];

        const dbResult = await db.query(insertQuery, values);
        const savedFinding = dbResult.rows[0];

        res.json({
            status: 'success',
            data: savedFinding
        });

    } catch (error) {
        console.error('Analysis failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route: Get Findings
app.get('/api/audit/findings', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM findings ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching findings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route: Update Finding Status (Accept/Override)
app.put('/api/audit/findings/:id', async (req, res) => {
    const { id } = req.params;
    const { status, justification } = req.body;

    try {
        const result = await db.query(
            'UPDATE findings SET status = $1, justification = $2 WHERE id = $3 RETURNING *',
            [status, justification, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating finding:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route: Get Audit History (Grouped by Digital Thread)
app.get('/api/audit/history', async (req, res) => {
    try {
        const query = `
            SELECT 
                digital_thread_id,
                MIN(created_at) as date,
                COUNT(*) as total_findings,
                COUNT(CASE WHEN status = 'PENDING_REVIEW' THEN 1 END) as pending_count,
                COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical_count
            FROM findings
            GROUP BY digital_thread_id
            ORDER BY date DESC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`RaaS Backend listening on port ${port}`);
});

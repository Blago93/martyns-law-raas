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

// Route: /api/audit/analyze
// Triggers AI Risk Assessment on the uploaded video
const { analyzeRisk } = require('./services/bedrock');

app.post('/api/audit/analyze', upload.single('frame'), async (req, res) => {
    try {
        // In a real app, this would process the video file from the DB or S3.
        // For this prototype, we accept a single "frame" image upload for immediate analysis.
        // OR we can extract a frame from the previously uploaded video chunks.

        // Option A: Client sends a frame snapshot (Easier for MVP)
        if (!req.file) {
            return res.status(400).send('No frame image provided for analysis.');
        }

        const venueDetails = {
            name: JSON.parse(req.body.venue || '{}').name || "Unknown Venue",
            capacity: JSON.parse(req.body.venue || '{}').capacity || 1000
        };

        console.log(`Analyzing frame for ${venueDetails.name}...`);

        // Read file buffer
        const imageBuffer = fs.readFileSync(req.file.path);

        // Call AI
        const riskAssessment = await analyzeRisk(imageBuffer, venueDetails);

        // Clean up temp file
        fs.unlinkSync(req.file.path);

        res.json({
            status: 'success',
            data: riskAssessment
        });

    } catch (error) {
        console.error('Analysis failed:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`RaaS Backend listening on port ${port}`);
});

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
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

app.listen(port, () => {
    console.log(`RaaS Backend listening on port ${port}`);
});

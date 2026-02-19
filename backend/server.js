require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authenticateToken = require('./middleware/auth');
const cors = require('cors');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

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
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS findings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                digital_thread_id VARCHAR(255),
                hazard_type VARCHAR(255),
                severity VARCHAR(50),
                description TEXT,
                mitigation TEXT,
                reasonably_practicable BOOLEAN,
                status VARCHAR(50) DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, VALIDATED, OVERRIDDEN
                justification TEXT,
                model_used VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS venue_settings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE REFERENCES users(id),
                venue_name VARCHAR(255),
                max_capacity INTEGER,
                address TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS responsible_persons (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                name VARCHAR(255),
                role VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Database tables verified/created (Multi-Tenant Schema).");
    } catch (err) {
        console.error("❌ Database Schema Error:", err);
    }
};

initDB();

// Route: Register User
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            [email, hashedPassword]
        );
        res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'Email already registered' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Route: Login User
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route: /api/audit/analyze
// Triggers AI Risk Assessment on the uploaded video
const { analyzeRisk } = require('./services/bedrock');

const { getSatelliteMap } = require('./services/maps');

// 5. Audit Analysis Route (Hybrid)
// 5. Audit Analysis Route (Hybrid) - Protected
app.post('/api/audit/analyze', authenticateToken, upload.fields([{ name: 'frame', maxCount: 1 }, { name: 'evidence_docs', maxCount: 5 }]), async (req, res) => {
    try {
        if (!req.files || !req.files['frame'] || req.files['frame'].length === 0) {
            return res.status(400).json({ error: 'No video frame uploaded' });
        }

        const frameFile = req.files['frame'][0];
        const evidenceFiles = req.files['evidence_docs'] || [];

        // Parse Venue Details
        const venueDetails = req.body.venue ? JSON.parse(req.body.venue) : {
            name: "Unknown Venue",
            capacity: 0,
            address: "Unknown Address"
        };

        const digitalThreadId = req.body.threadId || `THREAD-${Date.now()}`;
        const proceduralContext = req.body.context ? JSON.parse(req.body.context) : null;
        const verbalNotes = req.body.verbal_notes || null;

        // FETCH GEO CONTEXT (MOCK)
        let mapBuffer = null;
        if (venueDetails.address) {
            mapBuffer = await getSatelliteMap(venueDetails.address);
        }

        console.log(`Analyzing frame for ${venueDetails.name}...`);
        if (proceduralContext) console.log("Context Injected:", proceduralContext);
        if (verbalNotes) console.log("Verbal Notes:", verbalNotes);
        if (evidenceFiles.length > 0) console.log(`Evidence Docs: ${evidenceFiles.length} files attached.`);
        if (mapBuffer) console.log("Geo-Spatial Context: Map Loaded.");

        // Read file buffers
        const imageBuffer = fs.readFileSync(frameFile.path);

        // Read evidence buffers
        const evidenceBuffers = evidenceFiles.map(f => fs.readFileSync(f.path));

        // Call AI with Hybrid Context + Geo
        const riskAssessment = await analyzeRisk(imageBuffer, venueDetails, proceduralContext, verbalNotes, evidenceBuffers, mapBuffer);

        // Clean up temp files
        fs.unlinkSync(frameFile.path);
        evidenceFiles.forEach(f => fs.unlinkSync(f.path));

        // SAVE TO DB (Optional for Verification)
        let savedFinding = {
            ...riskAssessment,
            id: 'temp-' + Date.now(),
            status: 'PENDING_REVIEW',
            model_used: riskAssessment._model_used // Preserve model info
        };

        try {
            const insertQuery = `
                INSERT INTO findings (user_id, digital_thread_id, hazard_type, severity, description, mitigation, reasonably_practicable, status, model_used)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING_REVIEW', $8)
                RETURNING *;
            `;
            const values = [
                req.user.id,
                digitalThreadId,
                riskAssessment.hazard_type,
                riskAssessment.severity,
                riskAssessment.description,
                riskAssessment.mitigation,
                riskAssessment.reasonably_practicable,
                riskAssessment._model_used
            ];

            const dbResult = await db.query(insertQuery, values);
            // Merge DB ID with AI model metadata
            savedFinding = { ...dbResult.rows[0], model_used: riskAssessment._model_used };
        } catch (dbError) {
            console.warn("⚠️ Database Insert Failed (Running in Verification/Offline Mode):", dbError.message);
        }

        res.json({
            status: 'success',
            data: savedFinding
        });

    } catch (error) {
        console.error('Analysis failed:', error);

        // Return a structured error with a hint for the user
        const isQuotaError = error.message.includes('rate-limited') || error.message.includes('quota');

        res.status(500).json({
            error: error.message,
            hint: isQuotaError
                ? 'AI daily quotas are currently exhausted. Please try again after midnight UTC or contact support for a quota increase.'
                : 'An unexpected error occurred during AI analysis.'
        });
    }
});

// Route: Get Findings
// Route: Get Findings - Protected
app.get('/api/audit/findings', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM findings WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching findings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route: Update Finding Status (Accept/Override)
// Route: Update Finding Status (Accept/Override) - Protected
app.put('/api/audit/findings/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status, justification } = req.body;

    try {
        const result = await db.query(
            'UPDATE findings SET status = $1, justification = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
            [status, justification, id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Finding not found or unauthorized' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating finding:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route: Get Audit History (Grouped by Digital Thread)
// Route: Get Audit History (Grouped by Digital Thread) - Protected
app.get('/api/audit/history', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT 
                digital_thread_id,
                MIN(created_at) as date,
                COUNT(*) as total_findings,
                COUNT(CASE WHEN status = 'PENDING_REVIEW' THEN 1 END) as pending_count,
                COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical_count
            FROM findings
            WHERE user_id = $1
            GROUP BY digital_thread_id
            ORDER BY date DESC
        `;
        const result = await db.query(query, [req.user.id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- SETTINGS API ---

// Route: Get Venue Settings & Responsible Persons
// Route: Get Venue Settings & Responsible Persons - Protected
app.get('/api/settings', authenticateToken, async (req, res) => {
    try {
        // 1. Get Venue Config (User Specific)
        const venueRes = await db.query('SELECT * FROM venue_settings WHERE user_id = $1', [req.user.id]);
        let venue = venueRes.rows[0];

        // Default if not exists
        if (!venue) {
            venue = { venue_name: 'My Venue', max_capacity: 0, address: '' };
        }

        // 2. Get Responsible Persons
        const personsRes = await db.query('SELECT * FROM responsible_persons WHERE user_id = $1 ORDER BY created_at ASC', [req.user.id]);

        res.json({
            venue,
            responsiblePersons: personsRes.rows
        });
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route: Save Venue Settings
// Route: Save Venue Settings - Protected
app.post('/api/settings', authenticateToken, async (req, res) => {
    const { venue, responsiblePersons } = req.body;

    try {
        await db.query('BEGIN');

        // 1. Upsert Venue Settings (Key off user_id)
        const venueQuery = `
            INSERT INTO venue_settings (user_id, venue_name, max_capacity, address, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (user_id) DO UPDATE 
            SET venue_name = EXCLUDED.venue_name, 
                max_capacity = EXCLUDED.max_capacity,
                address = EXCLUDED.address,
                updated_at = NOW()
            RETURNING *;
        `;
        await db.query(venueQuery, [req.user.id, venue.venue_name, venue.max_capacity, venue.address]);

        // 2. Sync Responsible Persons (Delete all for user & Re-insert)
        await db.query('DELETE FROM responsible_persons WHERE user_id = $1', [req.user.id]);

        if (responsiblePersons && responsiblePersons.length > 0) {
            const personValues = responsiblePersons.map((p, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(',');
            const queryParams = responsiblePersons.flatMap(p => [req.user.id, p.name, p.role, p.email, p.phone || '']);

            await db.query(`INSERT INTO responsible_persons (user_id, name, role, email, phone) VALUES ${personValues}`, queryParams);
        }

        await db.query('COMMIT');
        res.json({ status: 'success', message: 'Settings saved successfully' });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error saving settings:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`RaaS Backend listening on port ${port}`);
});

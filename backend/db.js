const { Pool } = require('pg');
require('dotenv').config();

/**
 * Parse database credentials from either:
 * - DB_SECRET: JSON string injected by App Runner from Secrets Manager (production)
 * - DB_USER / DB_PASSWORD: individual env vars (local development)
 * @returns {{ user: string, password: string }}
 */
function getDbCredentials() {
    if (process.env.DB_SECRET) {
        try {
            const secret = JSON.parse(process.env.DB_SECRET);
            return { user: secret.username, password: secret.password };
        } catch (e) {
            console.error('Failed to parse DB_SECRET JSON:', e.message);
        }
    }
    return {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
    };
}

const { user, password } = getDbCredentials();

const pool = new Pool({
    user,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME || 'martyns_law_db',
    password,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    ssl: {
        rejectUnauthorized: false // Required for AWS RDS connections
    }
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = pool;


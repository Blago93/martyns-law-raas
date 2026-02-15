const https = require('https');
const url = require('url');

// Script to initialize OpenSearch index for Digital Thread
// Usage: node scripts/init_opensearch.js [OPENSEARCH_DOMAIN_ENDPOINT]
// or set OPENSEARCH_ENDPOINT env var

const main = async () => {
    let endpoint = process.env.OPENSEARCH_ENDPOINT || process.argv[2];

    if (!endpoint) {
        console.error('Error: OPENSEARCH_ENDPOINT not set. Usage: node init_opensearch.js <endpoint>');
        process.exit(1);
    }

    // Strip protocol if present for url.parse but we need it for request
    if (!endpoint.startsWith('https://') && !endpoint.startsWith('http://')) {
        endpoint = 'https://' + endpoint;
    }

    const indexName = 'audit_thread';
    const indexUrl = `${endpoint}/${indexName}`;

    console.log(`Checking index: ${indexName} at ${endpoint}...`);

    // Check if index exists
    const exists = await makeRequest(endpoint, 'HEAD', `/${indexName}`);

    if (exists.statusCode === 200) {
        console.log(`Index '${indexName}' already exists.`);
        return;
    }

    // Creating index with mapping
    const mappingConfig = {
        settings: {
            "index.knn": true
        },
        mappings: {
            properties: {
                venue_id: {
                    type: "keyword"
                },
                risk_vector: {
                    type: "knn_vector",
                    dimension: 768
                },
                gdf_ratio: {
                    type: "float"
                },
                timestamp: {
                    type: "date"
                },
                metadata: {
                    type: "object"
                },
                user_overrides: {
                    type: "nested",
                    properties: {
                        original_ai_finding: { type: "text" },
                        user_modified_finding: { type: "text" },
                        justification: { type: "text" },
                        timestamp: { type: "date" }
                    }
                }
            }
        }
    };

    console.log(`Creating index '${indexName}'...`);

    try {
        const createRes = await makeRequest(endpoint, 'PUT', `/${indexName}`, mappingConfig);
        console.log('Index creation response:', createRes.body);
    } catch (err) {
        console.error('Failed to create index:', err);
    }
};

function makeRequest(baseUrl, method, path, body = null) {
    return new Promise((resolve, reject) => {
        const parsedUrl = url.parse(baseUrl);
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            // For local/test envs with self-signed certs
            rejectUnauthorized: false
        };

        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
        }

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    // Try parsing JSON if content implies it, else raw
                    const parsedData = data ? JSON.parse(data) : {};
                    resolve({
                        statusCode: res.statusCode,
                        body: parsedData
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        body: data
                    });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

main();

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function testAuthFlow() {
    console.log("🧪 Testing Authentication Flow...");

    const email = `test_user_${Date.now()}@example.com`;
    const password = 'Password123!';

    // 1. Register
    try {
        console.log(`\n1. Registering user: ${email}`);
        const regRes = await axios.post(`${API_URL}/auth/register`, { email, password });
        console.log("✅ Registration Successful:", regRes.data);
    } catch (err) {
        console.error("❌ Registration Failed:", err.response ? err.response.data : err.message);
        return;
    }

    // 2. Login
    let token;
    try {
        console.log(`\n2. Logging in...`);
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
        console.log("✅ Login Successful. Token received.");
        token = loginRes.data.token;
    } catch (err) {
        console.error("❌ Login Failed:", err.response ? err.response.data : err.message);
        return;
    }

    // 3. Access Protected Route (Settings)
    try {
        console.log(`\n3. Accessing Protected Route (/api/settings) with Token...`);
        const settingsRes = await axios.get(`${API_URL}/settings`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("✅ Protected Route Access Successful:", settingsRes.data);
    } catch (err) {
        console.error("❌ Protected Route Access Failed:", err.response ? err.response.data : err.message);
    }

    // 4. Access Protected Route (No Token) - Should Fail
    try {
        console.log(`\n4. Accessing Protected Route WITHOUT Token (Expected Failure)...`);
        await axios.get(`${API_URL}/settings`);
        console.error("❌ Failed: Route should have rejected request but didn't.");
    } catch (err) {
        if (err.response && err.response.status === 401) {
            console.log("✅ Access Denied as expected (401 Unauthorized).");
        } else {
            console.error("❌ Unexpected Error:", err.message);
        }
    }
}

testAuthFlow();

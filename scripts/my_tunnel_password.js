
const https = require('https');

console.log('\n=================================================');
console.log('       YOUR TUNNEL PASSWORD (PUBLIC IP)');
console.log('=================================================\n');

https.get('https://api.ipify.org', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(`PASSWORD:   ${data}`);
        console.log('\n(Type this EXACT number into the Tunnel Password box)');
        console.log('=================================================\n');
    });
}).on('error', (err) => {
    console.log('Error fetching IP. Please visit https://whatismyip.com manually.');
});

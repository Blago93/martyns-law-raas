
const os = require('os');
const interfaces = os.networkInterfaces();

console.log('\n=======================================================');
console.log('       RaaS Mobile Testing Access Guide');
console.log('=======================================================\n');

let found = false;

Object.keys(interfaces).forEach((ifname) => {
    interfaces[ifname].forEach((iface) => {
        // Skip internal (non-127.0.0.0) and non-ipv4 addresses
        if ('IPv4' !== iface.family || iface.internal) {
            return;
        }

        console.log(`[${ifname}] Available at:`);
        console.log(`   http://${iface.address}:3000`);
        found = true;
    });
});

if (!found) {
    console.log("Could not detect local IP. Ensure you are connected to a network.");
}

console.log('\n-------------------------------------------------------');
console.log('INSTRUCTIONS:');
console.log('1. Ensure your phone is connected to the SAME Wi-Fi as this PC.');
console.log('2. Open the browser (Chrome/Safari) on your phone.');
console.log('3. Type one of the IP addresses above into the address bar.');
console.log('4. Login with: testowner / Safety1st');
console.log('=======================================================\n');

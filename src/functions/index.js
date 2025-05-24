const admin = require('firebase-admin');
const verifyIpFunction = require('./verify-ip');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export the functions
exports.verifyIp = verifyIpFunction.verifyIp;

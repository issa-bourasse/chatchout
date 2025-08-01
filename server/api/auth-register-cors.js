// Special handler for the auth/register endpoint that properly handles OPTIONS preflight requests
const allowCors = fn => async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Forward to actual handler for other methods
  return await fn(req, res);
};

// Import the real handler
const registerHandler = require('./auth/register');

// Wrap the handler with CORS
module.exports = allowCors(registerHandler);

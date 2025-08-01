// Simple test endpoint with CORS handling
const allowCors = require('./allowCors');

function handler(req, res) {
  res.status(200).json({
    success: true,
    message: 'CORS test endpoint working',
    method: req.method,
    headers: req.headers,
    body: req.body || null
  });
}

// Export with CORS wrapper
module.exports = allowCors(handler);

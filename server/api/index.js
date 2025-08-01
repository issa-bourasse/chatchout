// Vercel serverless function entry point
const app = require('../server.js');

// Add CORS headers for Vercel deployment
app.use((req, res, next) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://chatchout.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Handle OPTIONS method
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

module.exports = app;

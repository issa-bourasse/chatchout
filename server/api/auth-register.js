// Special route handler for auth/register with extra CORS handling
const express = require('express');
const router = express.Router();

// Import the auth route from the main app
const authRoutes = require('../routes/auth');

// Add specific CORS headers for registration endpoint
router.options('/register', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).send();
});

// Add extra CORS headers for the register route
router.post('/register', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Forward to the original route handler
  authRoutes.stack
    .filter(r => r.route && r.route.path === '/register' && r.route.methods.post)
    .forEach(r => r.handle(req, res, next));
});

module.exports = router;

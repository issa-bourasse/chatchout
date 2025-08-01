// Auth test endpoint for troubleshooting
const allowCors = require('./allowCors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function handler(req, res) {
  console.log('Auth test request received, method:', req.method);
  console.log('Headers:', req.headers);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Get token from header
    let token = req.headers.authorization;
    
    // Handle different authorization header formats
    if (token && token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }
    
    console.log('Token present:', !!token);
    
    if (!token) {
      return res.status(200).json({ 
        success: false,
        message: 'No token provided',
        tokenPresent: false
      });
    }

    // Verify token without accessing the database
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully:', decoded);
      
      return res.status(200).json({
        success: true,
        message: 'Token is valid',
        tokenInfo: {
          id: decoded.id || decoded.userId,
          exp: decoded.exp,
          iat: decoded.iat
        }
      });
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      
      return res.status(200).json({
        success: false,
        message: 'Token is invalid',
        tokenPresent: true,
        tokenError: jwtError.message
      });
    }
  } catch (error) {
    console.error('Auth test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during auth test',
      error: error.message
    });
  }
}

module.exports = allowCors(handler);

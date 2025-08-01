// Improved authentication middleware for Vercel serverless functions
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected in auth middleware');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Extract token from headers
const getToken = (req) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  // Handle both "Bearer token" and just "token" formats
  return authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;
};

// Middleware function
const auth = async (req, res) => {
  try {
    // Get token
    const token = getToken(req);
    
    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Authentication required. No token provided.'
      });
      return null;
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError.message);
      
      if (tokenError.name === 'TokenExpiredError') {
        res.status(401).json({ 
          success: false, 
          message: 'Token expired. Please login again.' 
        });
      } else {
        res.status(401).json({ 
          success: false, 
          message: 'Invalid token. Please login again.' 
        });
      }
      
      return null;
    }
    
    // Connect to database
    await connectDB();
    
    // Extract user ID (handle both formats)
    const userId = decoded.id || decoded.userId;
    
    if (!userId) {
      console.error('No user ID in token payload:', decoded);
      res.status(401).json({ 
        success: false, 
        message: 'Invalid token format. Missing user ID.' 
      });
      return null;
    }
    
    // Find user
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      console.error(`User not found with ID: ${userId}`);
      res.status(401).json({ 
        success: false, 
        message: 'User not found. Please login again.' 
      });
      return null;
    }
    
    // Return authenticated user
    return user;
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
    return null;
  }
};

module.exports = auth;
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    } else if (error.name === 'TokenExpiredError') {
      res.status(401).json({ 
        success: false,
        message: 'Token has expired' 
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Server error during authentication',
        error: error.message
      });
    }
    
    return null;
  }
}

// Export the middleware
module.exports = auth;
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token has expired' 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: 'Server error during authentication',
      error: error.message
    });
  }
}

// Export the middleware
module.exports = allowCors(auth);

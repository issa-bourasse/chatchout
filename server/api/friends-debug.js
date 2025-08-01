// Friends API diagnostics endpoint
const allowCors = require('./allowCors');
const mongoose = require('mongoose');
const User = require('../models/User');
const auth = require('./auth-middleware-new');
const config = require('../utils/config');
require('dotenv').config();

// Connect to MongoDB if not already connected
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('[FriendsDiagnostics] MongoDB connected');
  } catch (err) {
    console.error('[FriendsDiagnostics] MongoDB connection error:', err);
    throw err;
  }
}

/**
 * Diagnostic endpoint for friends functionality
 */
async function handler(req, res) {
  // Extract the endpoint path from the URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  console.log(`[FriendsDiagnostics] Request received for path: ${path}, method: ${req.method}`);
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Connect to database first
    await connectDB();
    
    // Get query parameters
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Initialize missing fields if needed
    if (!user.friends) {
      user.friends = [];
    }
    
    if (!user.friendRequests) {
      user.friendRequests = { sent: [], received: [] };
    }
    
    if (!user.friendRequests.sent) {
      user.friendRequests.sent = [];
    }
    
    if (!user.friendRequests.received) {
      user.friendRequests.received = [];
    }
    
    // Create diagnostic report
    const diagnostics = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        friends: {
          count: user.friends.length,
          data: user.friends.map(f => ({
            id: f.user,
            since: f.since
          }))
        },
        friendRequests: {
          sent: {
            count: user.friendRequests.sent.length,
            data: user.friendRequests.sent.map(r => ({
              id: r.user,
              sentAt: r.sentAt
            }))
          },
          received: {
            count: user.friendRequests.received.length,
            data: user.friendRequests.received.map(r => ({
              id: r.user,
              receivedAt: r.receivedAt
            }))
          }
        }
      },
      config: {
        friends: config.features.friends,
        socket: config.features.socket,
        debug: config.debug.friends
      }
    };
    
    // Return the diagnostic report
    return res.status(200).json({
      success: true,
      diagnostics
    });
    
  } catch (error) {
    console.error('[FriendsDiagnostics] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error processing diagnostics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = allowCors(handler);

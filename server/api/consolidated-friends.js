// Consolidated friends API handler for Vercel serverless functions
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
    console.log('[FriendsAPI] MongoDB connected');
  } catch (err) {
    console.error('[FriendsAPI] MongoDB connection error:', err);
    throw err;
  }
}

/**
 * Combined Friends API handler for multiple endpoints
 */
async function handler(req, res) {
  // Extract the endpoint path from the URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  console.log(`[FriendsAPI] Request received for path: ${path}, method: ${req.method}`);
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Connect to database first (common for all handlers)
    await connectDB();
    
    // Authenticate user for all endpoints
    const authResult = await auth(req, res);
    if (!authResult || !authResult.success) {
      // Authentication error response already sent by middleware
      return;
    }
    
    // Route to appropriate handler based on path
    if (path === '/api/friends/request') {
      return await handleSendFriendRequest(req, res);
    } else if (path === '/api/friends/accept') {
      return await handleAcceptFriendRequest(req, res);
    } else if (path === '/api/friends/reject') {
      return await handleRejectFriendRequest(req, res);
    } else if (path === '/api/friends/cancel-request') {
      return await handleCancelFriendRequest(req, res);
    } else if (path === '/api/friends/remove') {
      return await handleRemoveFriend(req, res);
    } else if (path === '/api/users/me/friends') {
      return await handleGetFriends(req, res);
    } else if (path === '/api/users/me/friend-requests') {
      return await handleGetFriendRequests(req, res);
    } else {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not found'
      });
    }
  } catch (error) {
    console.error(`[FriendsAPI] Error in ${path}:`, error);
    return res.status(500).json({
      success: false,
      message: `Server error processing ${path}`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Handle send friend request
 */
async function handleSendFriendRequest(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
  
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;
    
    console.log('[FriendsAPI] Send friend request from', currentUserId, 'to', userId);
    
    // Validate user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    // Check if trying to send request to self
    if (userId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself'
      });
    }
    
    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const currentUser = await User.findById(currentUserId);
    
    // Check if already friends
    const isAlreadyFriend = currentUser.friends && 
      currentUser.friends.some(friend => friend.user && friend.user.toString() === userId);
    
    if (isAlreadyFriend) {
      return res.status(400).json({
        success: false,
        message: 'You are already friends with this user'
      });
    }
    
    // Ensure friendRequests fields exist
    if (!currentUser.friendRequests) {
      currentUser.friendRequests = { sent: [], received: [] };
    }
    
    if (!targetUser.friendRequests) {
      targetUser.friendRequests = { sent: [], received: [] };
    }
    
    // Check if request already sent
    const requestAlreadySent = currentUser.friendRequests.sent && 
      currentUser.friendRequests.sent.some(request => request.user && request.user.toString() === userId);
    
    if (requestAlreadySent) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already sent'
      });
    }
    
    // Check if request already received from this user
    const requestAlreadyReceived = currentUser.friendRequests.received && 
      currentUser.friendRequests.received.some(request => request.user && request.user.toString() === userId);
    
    if (requestAlreadyReceived) {
      return res.status(400).json({
        success: false,
        message: 'This user has already sent you a friend request'
      });
    }
    
    // Add to sender's sent requests
    currentUser.friendRequests.sent.push({
      user: userId,
      sentAt: new Date()
    });
    
    // Add to receiver's received requests
    targetUser.friendRequests.received.push({
      user: currentUserId,
      receivedAt: new Date()
    });
    
    await Promise.all([currentUser.save(), targetUser.save()]);
    
    // Return success
    return res.status(200).json({
      success: true,
      message: 'Friend request sent successfully',
      sentTo: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        avatar: targetUser.avatar
      }
    });
  } catch (error) {
    console.error('[FriendsAPI] Send friend request error:', error);
    throw error;
  }
}

/**
 * Handle accept friend request
 */
async function handleAcceptFriendRequest(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
  
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;
    
    console.log('[FriendsAPI] Accept friend request from', userId, 'by', currentUserId);
    
    // Validate user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    // Get both users
    const [currentUser, requestUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);
    
    if (!requestUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Ensure friendRequests fields exist
    if (!currentUser.friendRequests) {
      currentUser.friendRequests = { sent: [], received: [] };
    }
    
    if (!requestUser.friendRequests) {
      requestUser.friendRequests = { sent: [], received: [] };
    }
    
    // Check if request exists
    const requestExists = currentUser.friendRequests.received && 
      currentUser.friendRequests.received.some(request => request.user && request.user.toString() === userId);
    
    if (!requestExists) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }
    
    // Check if they are already friends
    if (!currentUser.friends) {
      currentUser.friends = [];
    }
    
    if (!requestUser.friends) {
      requestUser.friends = [];
    }
    
    const isAlreadyFriend = currentUser.friends.some(friend => friend.user && friend.user.toString() === userId);
    
    if (isAlreadyFriend) {
      return res.status(400).json({
        success: false,
        message: 'You are already friends with this user'
      });
    }
    
    // Add both users to each other's friends list
    currentUser.friends.push({
      user: userId,
      since: new Date()
    });
    
    requestUser.friends.push({
      user: currentUserId,
      since: new Date()
    });
    
    // Remove the request from both users
    currentUser.friendRequests.received = currentUser.friendRequests.received.filter(
      request => request.user && request.user.toString() !== userId
    );
    
    requestUser.friendRequests.sent = requestUser.friendRequests.sent.filter(
      request => request.user && request.user.toString() !== currentUserId.toString()
    );
    
    await Promise.all([currentUser.save(), requestUser.save()]);
    
    // Return success
    return res.status(200).json({
      success: true,
      message: 'Friend request accepted',
      friend: {
        id: requestUser._id,
        name: requestUser.name,
        email: requestUser.email,
        avatar: requestUser.avatar,
        isOnline: requestUser.isOnline,
        lastSeen: requestUser.lastSeen
      }
    });
  } catch (error) {
    console.error('[FriendsAPI] Accept friend request error:', error);
    throw error;
  }
}

/**
 * Handle reject friend request
 */
async function handleRejectFriendRequest(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
  
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;
    
    console.log('[FriendsAPI] Reject friend request from', userId, 'by', currentUserId);
    
    // Validate user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    // Get both users
    const [currentUser, requestUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);
    
    if (!requestUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Ensure friendRequests fields exist
    if (!currentUser.friendRequests) {
      currentUser.friendRequests = { sent: [], received: [] };
    }
    
    if (!requestUser.friendRequests) {
      requestUser.friendRequests = { sent: [], received: [] };
    }
    
    // Check if request exists
    const requestExists = currentUser.friendRequests.received && 
      currentUser.friendRequests.received.some(request => request.user && request.user.toString() === userId);
    
    if (!requestExists) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }
    
    // Remove the request from both users
    currentUser.friendRequests.received = currentUser.friendRequests.received.filter(
      request => request.user && request.user.toString() !== userId
    );
    
    requestUser.friendRequests.sent = requestUser.friendRequests.sent.filter(
      request => request.user && request.user.toString() !== currentUserId.toString()
    );
    
    await Promise.all([currentUser.save(), requestUser.save()]);
    
    // Return success
    return res.status(200).json({
      success: true,
      message: 'Friend request rejected'
    });
  } catch (error) {
    console.error('[FriendsAPI] Reject friend request error:', error);
    throw error;
  }
}

/**
 * Handle cancel friend request
 */
async function handleCancelFriendRequest(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
  
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;
    
    console.log('[FriendsAPI] Cancel friend request to', userId, 'by', currentUserId);
    
    // Validate user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    // Get both users
    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Ensure friendRequests fields exist
    if (!currentUser.friendRequests) {
      currentUser.friendRequests = { sent: [], received: [] };
    }
    
    if (!targetUser.friendRequests) {
      targetUser.friendRequests = { sent: [], received: [] };
    }
    
    // Check if request exists
    const requestExists = currentUser.friendRequests.sent && 
      currentUser.friendRequests.sent.some(request => request.user && request.user.toString() === userId);
    
    if (!requestExists) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }
    
    // Remove the request from both users
    currentUser.friendRequests.sent = currentUser.friendRequests.sent.filter(
      request => request.user && request.user.toString() !== userId
    );
    
    targetUser.friendRequests.received = targetUser.friendRequests.received.filter(
      request => request.user && request.user.toString() !== currentUserId.toString()
    );
    
    await Promise.all([currentUser.save(), targetUser.save()]);
    
    // Return success
    return res.status(200).json({
      success: true,
      message: 'Friend request cancelled'
    });
  } catch (error) {
    console.error('[FriendsAPI] Cancel friend request error:', error);
    throw error;
  }
}

/**
 * Handle remove friend
 */
async function handleRemoveFriend(req, res) {
  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
  
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;
    
    console.log('[FriendsAPI] Remove friend', userId, 'by', currentUserId);
    
    // Validate user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    // Get both users
    const [currentUser, friendUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);
    
    if (!friendUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Ensure friends field exists
    if (!currentUser.friends) {
      currentUser.friends = [];
    }
    
    if (!friendUser.friends) {
      friendUser.friends = [];
    }
    
    // Check if they are friends
    const areFriends = currentUser.friends.some(friend => friend.user && friend.user.toString() === userId);
    
    if (!areFriends) {
      return res.status(404).json({
        success: false,
        message: 'Friend relationship not found'
      });
    }
    
    // Remove from both users' friends list
    currentUser.friends = currentUser.friends.filter(
      friend => friend.user && friend.user.toString() !== userId
    );
    
    friendUser.friends = friendUser.friends.filter(
      friend => friend.user && friend.user.toString() !== currentUserId.toString()
    );
    
    await Promise.all([currentUser.save(), friendUser.save()]);
    
    // Return success
    return res.status(200).json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    console.error('[FriendsAPI] Remove friend error:', error);
    throw error;
  }
}

/**
 * Handle get friends list
 */
async function handleGetFriends(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
  
  try {
    const currentUserId = req.user._id;
    
    console.log('[FriendsAPI] Get friends for user', currentUserId);
    
    // Get user with populated friends
    const user = await User.findById(currentUserId)
      .populate('friends.user', '_id name email avatar isOnline lastSeen');
    
    if (!user.friends) {
      user.friends = [];
    }
    
    // Extract friend data
    const friends = user.friends.map(friend => ({
      id: friend.user._id,
      name: friend.user.name,
      email: friend.user.email,
      avatar: friend.user.avatar,
      isOnline: friend.user.isOnline,
      lastSeen: friend.user.lastSeen,
      since: friend.since
    }));
    
    // Return success
    return res.status(200).json({
      success: true,
      friends
    });
  } catch (error) {
    console.error('[FriendsAPI] Get friends error:', error);
    throw error;
  }
}

/**
 * Handle get friend requests
 */
async function handleGetFriendRequests(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
  
  try {
    const currentUserId = req.user._id;
    
    console.log('[FriendsAPI] Get friend requests for user', currentUserId);
    
    // Get user with populated friend requests
    const user = await User.findById(currentUserId)
      .populate('friendRequests.sent.user', '_id name email avatar isOnline lastSeen')
      .populate('friendRequests.received.user', '_id name email avatar isOnline lastSeen');
    
    // Ensure the fields exist
    if (!user.friendRequests) {
      user.friendRequests = { sent: [], received: [] };
    }
    
    if (!user.friendRequests.sent) {
      user.friendRequests.sent = [];
    }
    
    if (!user.friendRequests.received) {
      user.friendRequests.received = [];
    }
    
    // Extract request data
    const sent = user.friendRequests.sent.map(request => ({
      id: request.user._id,
      name: request.user.name,
      email: request.user.email,
      avatar: request.user.avatar,
      isOnline: request.user.isOnline,
      lastSeen: request.user.lastSeen,
      sentAt: request.sentAt
    }));
    
    const received = user.friendRequests.received.map(request => ({
      id: request.user._id,
      name: request.user.name,
      email: request.user.email,
      avatar: request.user.avatar,
      isOnline: request.user.isOnline,
      lastSeen: request.user.lastSeen,
      receivedAt: request.receivedAt
    }));
    
    // Return success
    return res.status(200).json({
      success: true,
      sent,
      received
    });
  } catch (error) {
    console.error('[FriendsAPI] Get friend requests error:', error);
    throw error;
  }
}

module.exports = allowCors(handler);

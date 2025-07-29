const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const streamService = require('../services/streamService');
const User = require('../models/User');
const Chat = require('../models/Chat');
const { v4: uuidv4 } = require('uuid');

// Get Stream.io configuration
router.get('/config', auth, async (req, res) => {
  try {
    if (!streamService.isConfigured()) {
      return res.status(503).json({
        message: 'Video calling service not configured'
      });
    }

    // Generate user token for Stream.io
    const token = streamService.generateUserToken(
      req.user._id.toString(),
      req.user.name
    );

    res.json({
      apiKey: streamService.getApiKey(),
      token,
      userId: req.user._id.toString(),
      userName: req.user.name
    });
  } catch (error) {
    console.error('Get video config error:', error);
    res.status(500).json({ message: 'Failed to get video configuration' });
  }
});

// Create a video call
router.post('/create', auth, async (req, res) => {
  try {
    const { chatId, callType = 'default' } = req.body;

    if (!streamService.isConfigured()) {
      return res.status(503).json({
        message: 'Video calling service not configured'
      });
    }

    // Verify user has access to the chat
    console.log('📹 Creating video call for chat:', chatId, 'by user:', req.user._id);
    const chat = await Chat.findById(chatId).populate('participants.user');

    if (!chat) {
      console.log('❌ Chat not found:', chatId);
      return res.status(404).json({ message: 'Chat not found' });
    }

    console.log('📹 Chat found, checking if user is participant...');
    console.log('📹 Chat participants:', chat.participants.map(p => ({ userId: p.user?._id, name: p.user?.name })));
    console.log('📹 Current user:', req.user._id);

    if (!chat.isParticipant(req.user._id)) {
      console.log('❌ User is not a participant in this chat');
      return res.status(403).json({ message: 'Access denied to this chat' });
    }

    console.log('✅ User is a participant, proceeding with video call creation');

    // Generate unique call ID
    const callId = uuidv4();

    // Get all participant user IDs
    const memberIds = chat.participants.map(p => p.user._id.toString());

    // Create call in Stream.io
    const callData = await streamService.createCall(
      callId,
      req.user._id.toString(),
      memberIds,
      callType
    );

    // Store call information in database (optional - you can create a Call model)
    // For now, we'll just return the call data

    res.json({
      success: true,
      call: callData,
      message: 'Video call created successfully'
    });

  } catch (error) {
    console.error('Create video call error:', error);
    res.status(500).json({ message: 'Failed to create video call' });
  }
});

// Join a video call
router.get('/join/:callType/:callId', auth, async (req, res) => {
  try {
    const { callType, callId } = req.params;

    if (!streamService.isConfigured()) {
      return res.status(503).json({
        message: 'Video calling service not configured'
      });
    }

    // Get call details from Stream.io
    const callData = await streamService.getCall(callType, callId);

    // Generate user token
    const token = streamService.generateUserToken(
      req.user._id.toString(),
      req.user.name
    );

    res.json({
      success: true,
      call: callData,
      config: {
        apiKey: streamService.getApiKey(),
        token,
        userId: req.user._id.toString(),
        userName: req.user.name
      }
    });

  } catch (error) {
    console.error('Join video call error:', error);
    res.status(500).json({ message: 'Failed to join video call' });
  }
});

// End a video call
router.post('/end/:callType/:callId', auth, async (req, res) => {
  try {
    const { callType, callId } = req.params;

    if (!streamService.isConfigured()) {
      return res.status(503).json({
        message: 'Video calling service not configured'
      });
    }

    // End call in Stream.io
    const response = await streamService.endCall(callType, callId);

    res.json({
      success: true,
      message: 'Video call ended successfully',
      response
    });

  } catch (error) {
    console.error('End video call error:', error);
    res.status(500).json({ message: 'Failed to end video call' });
  }
});

// Add members to a call
router.post('/add-members/:callType/:callId', auth, async (req, res) => {
  try {
    const { callType, callId } = req.params;
    const { userIds } = req.body;

    if (!streamService.isConfigured()) {
      return res.status(503).json({
        message: 'Video calling service not configured'
      });
    }

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    // Add members to call
    const response = await streamService.addMembersToCall(callType, callId, userIds);

    res.json({
      success: true,
      message: 'Members added to call successfully',
      response
    });

  } catch (error) {
    console.error('Add members to call error:', error);
    res.status(500).json({ message: 'Failed to add members to call' });
  }
});

// Remove members from a call
router.post('/remove-members/:callType/:callId', auth, async (req, res) => {
  try {
    const { callType, callId } = req.params;
    const { userIds } = req.body;

    if (!streamService.isConfigured()) {
      return res.status(503).json({
        message: 'Video calling service not configured'
      });
    }

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    // Remove members from call
    const response = await streamService.removeMembersFromCall(callType, callId, userIds);

    res.json({
      success: true,
      message: 'Members removed from call successfully',
      response
    });

  } catch (error) {
    console.error('Remove members from call error:', error);
    res.status(500).json({ message: 'Failed to remove members from call' });
  }
});

// Get call status
router.get('/status/:callType/:callId', auth, async (req, res) => {
  try {
    const { callType, callId } = req.params;

    if (!streamService.isConfigured()) {
      return res.status(503).json({
        message: 'Video calling service not configured'
      });
    }

    // Get call details
    const callData = await streamService.getCall(callType, callId);

    res.json({
      success: true,
      call: callData
    });

  } catch (error) {
    console.error('Get call status error:', error);
    res.status(500).json({ message: 'Failed to get call status' });
  }
});

module.exports = router;

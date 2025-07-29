const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/messages/:chatId
// @desc    Get messages for a chat
// @access  Private
router.get('/:chatId', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if chat exists and user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        message: 'Chat not found'
      });
    }

    if (!chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    // Get messages
    const messages = await Message.getChatMessages(chatId, parseInt(page), parseInt(limit));

    // Reverse to get chronological order (oldest first)
    messages.reverse();

    res.json({
      messages,
      pagination: {
        current: parseInt(page),
        hasMore: messages.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      message: 'Server error getting messages'
    });
  }
});

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', auth, [
  body('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  body('type')
    .optional()
    .isIn(['text', 'emoji'])
    .withMessage('Invalid message type'),
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid reply message ID')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { chatId, content, type = 'text', replyTo } = req.body;

    // Check if chat exists and user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        message: 'Chat not found'
      });
    }

    if (!chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    // If replying to a message, check if it exists and belongs to this chat
    if (replyTo) {
      const replyMessage = await Message.findById(replyTo);
      if (!replyMessage || replyMessage.chat.toString() !== chatId) {
        return res.status(400).json({
          message: 'Invalid reply message'
        });
      }
    }

    // Create message
    const message = new Message({
      content,
      type,
      sender: req.user._id,
      chat: chatId,
      replyTo: replyTo || undefined
    });

    await message.save();

    // Populate message with sender details
    await message.populate('sender', 'name email avatar');
    if (replyTo) {
      await message.populate('replyTo', 'content sender type');
    }

    // Update chat last activity
    await chat.updateLastActivity();

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      message: 'Server error sending message'
    });
  }
});

// @route   PUT /api/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.put('/:messageId/read', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        message: 'Message not found'
      });
    }

    // Check if user is participant of the chat
    const chat = await Chat.findById(message.chat);
    if (!chat || !chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    // Mark as read
    await message.markAsRead(req.user._id);

    res.json({
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      message: 'Server error marking message as read'
    });
  }
});

// @route   PUT /api/messages/read-multiple
// @desc    Mark multiple messages as read
// @access  Private
router.put('/read-multiple', auth, [
  body('messageIds')
    .isArray({ min: 1 })
    .withMessage('Message IDs array is required'),
  body('messageIds.*')
    .isMongoId()
    .withMessage('Invalid message ID')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { messageIds } = req.body;

    // Get messages to verify chat access
    const messages = await Message.find({ _id: { $in: messageIds } }).distinct('chat');
    
    // Check if user is participant of all chats
    const chats = await Chat.find({ _id: { $in: messages } });
    const hasAccess = chats.every(chat => chat.isParticipant(req.user._id));
    
    if (!hasAccess) {
      return res.status(403).json({
        message: 'Access denied to one or more chats'
      });
    }

    // Mark messages as read
    await Message.markMultipleAsRead(messageIds, req.user._id);

    res.json({
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Mark multiple messages as read error:', error);
    res.status(500).json({
      message: 'Server error marking messages as read'
    });
  }
});

// @route   PUT /api/messages/:messageId/react
// @desc    Add reaction to message
// @access  Private
router.put('/:messageId/react', auth, [
  body('emoji')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji is required and must be valid')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        message: 'Message not found'
      });
    }

    // Check if user is participant of the chat
    const chat = await Chat.findById(message.chat);
    if (!chat || !chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    // Add reaction
    await message.addReaction(req.user._id, emoji);

    res.json({
      message: 'Reaction added successfully'
    });

  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      message: 'Server error adding reaction'
    });
  }
});

// @route   DELETE /api/messages/:messageId/react
// @desc    Remove reaction from message
// @access  Private
router.delete('/:messageId/react', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        message: 'Message not found'
      });
    }

    // Check if user is participant of the chat
    const chat = await Chat.findById(message.chat);
    if (!chat || !chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    // Remove reaction
    await message.removeReaction(req.user._id);

    res.json({
      message: 'Reaction removed successfully'
    });

  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      message: 'Server error removing reaction'
    });
  }
});

// @route   PUT /api/messages/:messageId
// @desc    Edit message
// @access  Private
router.put('/:messageId', auth, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        message: 'Message not found'
      });
    }

    // Check if user can modify this message
    if (!message.canModify(req.user._id)) {
      return res.status(403).json({
        message: 'You can only edit your own text messages'
      });
    }

    // Edit message
    await message.editMessage(content);

    res.json({
      message: 'Message edited successfully',
      data: message
    });

  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      message: error.message || 'Server error editing message'
    });
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete message
// @access  Private
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        message: 'Message not found'
      });
    }

    // Check if user can modify this message or is admin/owner of group
    const chat = await Chat.findById(message.chat);
    const canDelete = message.canModify(req.user._id) || 
                     (chat.type === 'group' && chat.isAdminOrOwner(req.user._id));

    if (!canDelete) {
      return res.status(403).json({
        message: 'You can only delete your own messages'
      });
    }

    // Delete message
    await message.deleteMessage(req.user._id);

    res.json({
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      message: 'Server error deleting message'
    });
  }
});

module.exports = router;

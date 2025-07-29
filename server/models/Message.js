const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: function() {
      return this.type === 'text' || this.type === 'system';
    },
    trim: true,
    maxlength: [2000, 'Message content cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system', 'emoji'],
    default: 'text',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.type !== 'system';
    }
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  file: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  edited: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    originalContent: String
  },
  deleted: {
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  metadata: {
    deliveredAt: Date,
    failedAt: Date,
    retryCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ 'readBy.user': 1 });

// Virtual for read count
messageSchema.virtual('readCount').get(function() {
  return this.readBy ? this.readBy.length : 0;
});

// Virtual for reaction count
messageSchema.virtual('reactionCount').get(function() {
  return this.reactions ? this.reactions.length : 0;
});

// Virtual to check if message is system message
messageSchema.virtual('isSystem').get(function() {
  return this.type === 'system';
});

// Pre-save middleware to update chat's last message and activity
messageSchema.pre('save', async function(next) {
  if (this.isNew && !this.deleted.isDeleted) {
    try {
      const Chat = mongoose.model('Chat');
      await Chat.findByIdAndUpdate(this.chat, {
        lastMessage: this._id,
        lastActivity: new Date()
      });
    } catch (error) {
      console.error('Error updating chat last message:', error);
    }
  }
  next();
});

// Instance method to mark as read by user
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(read => 
    read.user.toString() === userId.toString()
  );
  
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Instance method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(reaction => 
    reaction.user.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji,
    createdAt: new Date()
  });
  
  return this.save();
};

// Instance method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(reaction => 
    reaction.user.toString() !== userId.toString()
  );
  
  return this.save();
};

// Instance method to edit message
messageSchema.methods.editMessage = function(newContent) {
  if (this.type !== 'text') {
    throw new Error('Only text messages can be edited');
  }
  
  if (this.deleted.isDeleted) {
    throw new Error('Cannot edit deleted message');
  }
  
  this.edited.originalContent = this.content;
  this.content = newContent;
  this.edited.isEdited = true;
  this.edited.editedAt = new Date();
  
  return this.save();
};

// Instance method to delete message
messageSchema.methods.deleteMessage = function(deletedBy) {
  this.deleted.isDeleted = true;
  this.deleted.deletedAt = new Date();
  this.deleted.deletedBy = deletedBy;
  this.content = 'This message was deleted';
  
  return this.save();
};

// Instance method to check if user can edit/delete
messageSchema.methods.canModify = function(userId) {
  return this.sender.toString() === userId.toString() && 
         !this.deleted.isDeleted &&
         this.type === 'text';
};

// Static method to get chat messages with pagination
messageSchema.statics.getChatMessages = function(chatId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({
    chat: chatId,
    'deleted.isDeleted': false
  })
  .populate('sender', 'name email avatar')
  .populate('replyTo', 'content sender type')
  .populate('readBy.user', 'name')
  .populate('reactions.user', 'name')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to mark multiple messages as read
messageSchema.statics.markMultipleAsRead = async function(messageIds, userId) {
  return await this.updateMany(
    {
      _id: { $in: messageIds },
      'readBy.user': { $ne: userId }
    },
    {
      $push: {
        readBy: {
          user: userId,
          readAt: new Date()
        }
      }
    }
  );
};

// Static method to get unread message count for user in chat
messageSchema.statics.getUnreadCount = function(chatId, userId) {
  return this.countDocuments({
    chat: chatId,
    'readBy.user': { $ne: userId },
    'deleted.isDeleted': false,
    sender: { $ne: userId } // Don't count own messages
  });
};

// Static method to create system message
messageSchema.statics.createSystemMessage = function(chatId, content) {
  return this.create({
    content,
    type: 'system',
    chat: chatId
  });
};

module.exports = mongoose.model('Message', messageSchema);

const { socketAuth } = require('../middleware/auth');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

// Store active connections
const activeUsers = new Map();

const socketHandler = (io) => {
  // Authentication middleware for Socket.IO
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    try {
      const user = socket.user;
      console.log(`✅ User ${user.name} connected with socket ID: ${socket.id}`);

      // Store user connection
      activeUsers.set(user._id.toString(), {
        socketId: socket.id,
        user: user,
        joinedAt: new Date()
      });

      // Update user online status
      await User.updateOnlineStatus(user._id, true);

      // Join user to their personal room
      socket.join(`user_${user._id}`);

      // Get user's chats and join chat rooms
      const userChats = await Chat.find({
        'participants.user': user._id,
        isActive: true
      });

      userChats.forEach(chat => {
        socket.join(`chat_${chat._id}`);
      });

      // Notify friends that user is online
      const userWithFriends = await User.findById(user._id).populate('friends.user');
      if (userWithFriends && userWithFriends.friends) {
        userWithFriends.friends
          .filter(friend => friend && friend.user) // Filter out undefined friends
          .forEach(friend => {
            socket.to(`user_${friend.user._id}`).emit('friend_online', {
              userId: user._id,
              name: user.name,
              isOnline: true
            });
          });
      }

      // Send current online users to the connected user
      socket.emit('online_users', Array.from(activeUsers.values()).map(conn => ({
        userId: conn.user._id,
        name: conn.user.name,
        avatar: conn.user.avatar
      })));

      // Handle joining a chat room
      socket.on('join_chat', async (data) => {
        try {
          const { chatId } = data;
          
          // Verify user is participant of the chat
          const chat = await Chat.findById(chatId);
          if (chat && chat.isParticipant(user._id)) {
            socket.join(`chat_${chatId}`);
            
            // Notify other participants that user joined
            socket.to(`chat_${chatId}`).emit('user_joined_chat', {
              userId: user._id,
              name: user.name,
              chatId
            });

            console.log(`User ${user.name} joined chat ${chatId}`);
          }
        } catch (error) {
          console.error('Join chat error:', error);
          socket.emit('error', { message: 'Failed to join chat' });
        }
      });

      // Handle leaving a chat room
      socket.on('leave_chat', (data) => {
        try {
          const { chatId } = data;
          socket.leave(`chat_${chatId}`);
          
          // Notify other participants that user left
          socket.to(`chat_${chatId}`).emit('user_left_chat', {
            userId: user._id,
            name: user.name,
            chatId
          });

          console.log(`User ${user.name} left chat ${chatId}`);
        } catch (error) {
          console.error('Leave chat error:', error);
        }
      });

      // Handle sending messages
      socket.on('send_message', async (data) => {
        try {
          const { chatId, content, type = 'text', replyTo } = data;

          // Verify user is participant of the chat
          const chat = await Chat.findById(chatId);
          if (!chat || !chat.isParticipant(user._id)) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          // Create message
          const message = new Message({
            content,
            type,
            sender: user._id,
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

          // Emit message to all participants in the chat
          io.to(`chat_${chatId}`).emit('new_message', {
            message: message.toObject(),
            chatId
          });

          // Send push notification to offline users (placeholder)
          const offlineParticipants = chat.participants.filter(p => 
            p.user.toString() !== user._id.toString() && 
            !activeUsers.has(p.user.toString())
          );

          // TODO: Implement push notifications for offline users

          console.log(`Message sent in chat ${chatId} by ${user.name}`);
        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        try {
          const { chatId } = data;
          socket.to(`chat_${chatId}`).emit('user_typing', {
            userId: user._id,
            name: user.name,
            chatId
          });
        } catch (error) {
          console.error('Typing start error:', error);
        }
      });

      socket.on('typing_stop', (data) => {
        try {
          const { chatId } = data;
          socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
            userId: user._id,
            name: user.name,
            chatId
          });
        } catch (error) {
          console.error('Typing stop error:', error);
        }
      });

      // Handle message reactions
      socket.on('add_reaction', async (data) => {
        try {
          const { messageId, emoji } = data;

          const message = await Message.findById(messageId);
          if (!message) {
            socket.emit('error', { message: 'Message not found' });
            return;
          }

          // Verify user is participant of the chat
          const chat = await Chat.findById(message.chat);
          if (!chat || !chat.isParticipant(user._id)) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          // Add reaction
          await message.addReaction(user._id, emoji);

          // Emit reaction to all participants in the chat
          io.to(`chat_${message.chat}`).emit('message_reaction', {
            messageId,
            userId: user._id,
            emoji,
            action: 'add'
          });

        } catch (error) {
          console.error('Add reaction error:', error);
          socket.emit('error', { message: 'Failed to add reaction' });
        }
      });

      // Handle removing reactions
      socket.on('remove_reaction', async (data) => {
        try {
          const { messageId } = data;

          const message = await Message.findById(messageId);
          if (!message) {
            socket.emit('error', { message: 'Message not found' });
            return;
          }

          // Verify user is participant of the chat
          const chat = await Chat.findById(message.chat);
          if (!chat || !chat.isParticipant(user._id)) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          // Remove reaction
          await message.removeReaction(user._id);

          // Emit reaction removal to all participants in the chat
          io.to(`chat_${message.chat}`).emit('message_reaction', {
            messageId,
            userId: user._id,
            action: 'remove'
          });

        } catch (error) {
          console.error('Remove reaction error:', error);
          socket.emit('error', { message: 'Failed to remove reaction' });
        }
      });

      // Handle message read receipts
      socket.on('mark_messages_read', async (data) => {
        try {
          const { chatId, messageIds } = data;

          // Verify user is participant of the chat
          const chat = await Chat.findById(chatId);
          if (!chat || !chat.isParticipant(user._id)) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          // Mark messages as read
          await Message.markMultipleAsRead(messageIds, user._id);

          // Emit read receipt to other participants
          socket.to(`chat_${chatId}`).emit('messages_read', {
            userId: user._id,
            messageIds,
            chatId
          });

        } catch (error) {
          console.error('Mark messages read error:', error);
          socket.emit('error', { message: 'Failed to mark messages as read' });
        }
      });

      // Handle friend requests
      socket.on('friend_request_sent', (data) => {
        try {
          const { targetUserId, senderInfo } = data;
          
          // Notify target user if online
          socket.to(`user_${targetUserId}`).emit('friend_request_received', {
            from: senderInfo,
            timestamp: new Date()
          });

        } catch (error) {
          console.error('Friend request notification error:', error);
        }
      });

      // Handle friend request responses
      socket.on('friend_request_response', (data) => {
        try {
          const { targetUserId, response, userInfo } = data;
          
          // Notify target user if online
          socket.to(`user_${targetUserId}`).emit('friend_request_responded', {
            from: userInfo,
            response, // 'accepted' or 'rejected'
            timestamp: new Date()
          });

        } catch (error) {
          console.error('Friend request response notification error:', error);
        }
      });

      // Handle group invitations
      socket.on('group_invitation', (data) => {
        try {
          const { targetUserIds, groupInfo, inviterInfo } = data;
          
          // Notify all target users if online
          targetUserIds.forEach(userId => {
            socket.to(`user_${userId}`).emit('group_invitation_received', {
              group: groupInfo,
              inviter: inviterInfo,
              timestamp: new Date()
            });
          });

        } catch (error) {
          console.error('Group invitation notification error:', error);
        }
      });

      // Handle video call invitations
      socket.on('send_video_call_invitation', async (data) => {
        try {
          const { chatId, callId, callType = 'default', invitedUserIds } = data;

          // Verify user has access to the chat
          const chat = await Chat.findById(chatId);
          if (!chat || !chat.isParticipant(user._id)) {
            socket.emit('error', { message: 'Access denied to this chat' });
            return;
          }

          // Send video call invitation to invited users
          invitedUserIds.forEach(invitedUserId => {
            if (invitedUserId !== user._id.toString()) {
              socket.to(`user_${invitedUserId}`).emit('video_call_invitation', {
                callId,
                callType,
                chatId,
                chatName: chat.type === 'group' ? chat.name : `${user.name}`,
                invitedBy: {
                  _id: user._id,
                  name: user.name,
                  avatar: user.avatar
                },
                joinUrl: `${process.env.CLIENT_URL}/video-call/${callType}/${callId}`
              });
            }
          });

          console.log(`📹 Video call invitation sent by ${user.name} for chat ${chatId}`);

        } catch (error) {
          console.error('Video call invitation error:', error);
          socket.emit('error', { message: 'Failed to send video call invitation' });
        }
      });

      // Handle video call responses
      socket.on('video_call_response', async (data) => {
        try {
          const { callId, response, invitedBy } = data; // response: 'accepted' | 'declined'

          // Notify the caller about the response
          socket.to(`user_${invitedBy}`).emit('video_call_response_received', {
            callId,
            response,
            respondedBy: {
              _id: user._id,
              name: user.name,
              avatar: user.avatar
            }
          });

          console.log(`📹 Video call ${response} by ${user.name} for call ${callId}`);

        } catch (error) {
          console.error('Video call response error:', error);
        }
      });

      // Handle video call ended notification
      socket.on('video_call_ended', async (data) => {
        try {
          const { callId, chatId } = data;

          // Verify user has access to the chat
          const chat = await Chat.findById(chatId);
          if (!chat || !chat.isParticipant(user._id)) {
            socket.emit('error', { message: 'Access denied to this chat' });
            return;
          }

          // Notify all chat participants that the call ended
          io.to(`chat_${chatId}`).emit('video_call_ended_notification', {
            callId,
            endedBy: {
              _id: user._id,
              name: user.name
            }
          });

          console.log(`📹 Video call ${callId} ended by ${user.name}`);

        } catch (error) {
          console.error('Video call ended notification error:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        try {
          console.log(`❌ User ${user.name} disconnected`);

          // Remove from active users
          activeUsers.delete(user._id.toString());

          // Update user offline status
          await User.updateOnlineStatus(user._id, false);

          // Notify friends that user is offline
          const userWithFriends = await User.findById(user._id).populate('friends.user');
          if (userWithFriends && userWithFriends.friends) {
            userWithFriends.friends
              .filter(friend => friend && friend.user) // Filter out undefined friends
              .forEach(friend => {
                socket.to(`user_${friend.user._id}`).emit('friend_offline', {
                  userId: user._id,
                  name: user.name,
                  isOnline: false,
                  lastSeen: new Date()
                });
              });
          }

        } catch (error) {
          console.error('Disconnect error:', error);
        }
      });

    } catch (error) {
      console.error('Socket connection error:', error);
      socket.emit('error', { message: 'Connection failed' });
      socket.disconnect();
    }
  });

  // Handle connection errors
  io.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });
};

module.exports = socketHandler;

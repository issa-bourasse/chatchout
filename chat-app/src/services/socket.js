import { io } from 'socket.io-client';
import { getAuthToken } from './api';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect() {
    const token = getAuthToken();
    if (!token) {
      console.error('No auth token found');
      return;
    }

    // Use dedicated Socket URL if available, otherwise fallback to API URL without /api
    const serverUrl = import.meta.env.VITE_SOCKET_URL || 
                      import.meta.env.VITE_API_URL?.replace('/api', '') || 
                      'http://localhost:5000';

    this.socket = io(serverUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Set up default event listeners
    this.setupDefaultListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  setupDefaultListeners() {
    // Online users
    this.socket.on('online_users', (users) => {
      this.emit('online_users', users);
    });

    // Friend status updates
    this.socket.on('friend_online', (data) => {
      this.emit('friend_online', data);
    });

    this.socket.on('friend_offline', (data) => {
      this.emit('friend_offline', data);
    });

    // Friend requests
    this.socket.on('friend_request_received', (data) => {
      this.emit('friend_request_received', data);
    });

    this.socket.on('friend_request_responded', (data) => {
      this.emit('friend_request_responded', data);
    });

    // Messages
    this.socket.on('new_message', (data) => {
      this.emit('new_message', data);
    });

    this.socket.on('message_reaction', (data) => {
      this.emit('message_reaction', data);
    });

    this.socket.on('messages_read', (data) => {
      this.emit('messages_read', data);
    });

    // Typing indicators
    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    this.socket.on('user_stopped_typing', (data) => {
      this.emit('user_stopped_typing', data);
    });

    // Chat events
    this.socket.on('user_joined_chat', (data) => {
      this.emit('user_joined_chat', data);
    });

    this.socket.on('user_left_chat', (data) => {
      this.emit('user_left_chat', data);
    });

    // Group invitations
    this.socket.on('group_invitation_received', (data) => {
      this.emit('group_invitation_received', data);
    });
  }

  // Event emitter methods
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // Chat methods
  joinChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_chat', { chatId });
    }
  }

  leaveChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_chat', { chatId });
    }
  }

  sendMessage(chatId, content, type = 'text', replyTo = null) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', {
        chatId,
        content,
        type,
        replyTo
      });
    }
  }

  // Typing indicators
  startTyping(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', { chatId });
    }
  }

  stopTyping(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', { chatId });
    }
  }

  // Message reactions
  addReaction(messageId, emoji) {
    if (this.socket && this.isConnected) {
      this.socket.emit('add_reaction', { messageId, emoji });
    }
  }

  removeReaction(messageId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('remove_reaction', { messageId });
    }
  }

  // Message read receipts
  markMessagesRead(chatId, messageIds) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_messages_read', { chatId, messageIds });
    }
  }

  // Friend requests
  sendFriendRequestNotification(targetUserId, senderInfo) {
    if (this.socket && this.isConnected) {
      this.socket.emit('friend_request_sent', { targetUserId, senderInfo });
    }
  }

  sendFriendRequestResponse(targetUserId, response, userInfo) {
    if (this.socket && this.isConnected) {
      this.socket.emit('friend_request_response', { targetUserId, response, userInfo });
    }
  }

  // Group invitations
  sendGroupInvitation(targetUserIds, groupInfo, inviterInfo) {
    if (this.socket && this.isConnected) {
      this.socket.emit('group_invitation', { targetUserIds, groupInfo, inviterInfo });
    }
  }

  // Utility methods
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;

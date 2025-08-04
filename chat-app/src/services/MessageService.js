import api from './api';

export const MessageService = {
  // Get messages for a specific chat
  getMessages: async (chatId) => {
    try {
      const response = await api.get(`/api/messages/${chatId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  },

  // Send a new message
  sendMessage: async (chatId, content, type = 'text', replyTo = null) => {
    try {
      const response = await api.post('/api/messages', {
        chatId,
        content,
        type,
        replyTo
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
};

export default MessageService;

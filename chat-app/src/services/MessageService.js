import api from './api';

export const MessageService = {
  // Get messages for a specific chat
  getMessages: async (chatId) => {
    try {
      const response = await api.get(`/messages/${chatId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  },

  // Send a new message
  sendMessage: async (chatId, content, type = 'text', replyTo = null) => {
    try {
      console.log('MessageService.sendMessage called with:', { chatId, content, type, replyTo });

      // Build request body, only include replyTo if it's not null
      const requestBody = {
        chatId,
        content,
        type
      };

      // Only add replyTo if it's not null/undefined
      if (replyTo) {
        requestBody.replyTo = replyTo;
      }

      const response = await api.post('/messages', requestBody);

      console.log('MessageService.sendMessage success:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      // Log specific validation errors
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
        error.response.data.errors.forEach((err, index) => {
          console.error(`Validation error ${index + 1}:`, err);
        });
      }

      throw error;
    }
  }
};

export default MessageService;

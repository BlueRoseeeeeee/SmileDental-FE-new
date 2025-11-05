import api from './api';

const CHATBOT_API_URL = '/api/ai';

const chatbotService = {
  /**
   * Send message to chatbot
   * @param {string} message - User message
   * @param {string} userId - User ID (optional)
   * @returns {Promise} Response from chatbot
   */
  async sendMessage(message, userId = null) {
    try {
      const response = await api.post(`${CHATBOT_API_URL}/chat`, {
        message,
        userId: userId || localStorage.getItem('userId') || 'anonymous'
      });
      return response.data;
    } catch (error) {
      console.error('❌ Send message error:', error);
      throw error;
    }
  },

  /**
   * Get chat history
   * @param {number} limit - Number of messages to retrieve
   * @returns {Promise} Chat history
   */
  async getHistory(limit = 50) {
    try {
      const response = await api.get(`${CHATBOT_API_URL}/history`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Get history error:', error);
      throw error;
    }
  },

  /**
   * Clear chat history
   * @returns {Promise}
   */
  async clearHistory() {
    try {
      const response = await api.delete(`${CHATBOT_API_URL}/history`);
      return response.data;
    } catch (error) {
      console.error('❌ Clear history error:', error);
      throw error;
    }
  }
};

export default chatbotService;

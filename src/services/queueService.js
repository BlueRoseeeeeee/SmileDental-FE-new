import axios from 'axios';

// Use appointment-service URL for queue endpoints
const API_BASE_URL = import.meta.env.VITE_APPOINTMENT_SERVICE_URL || 'http://localhost:3006';

// Create axios instance with interceptor for token
const queueApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
queueApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
queueApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Get next queue number for a specific date and room
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Next queue number info
 */
export const getNextQueueNumber = async (date, roomId) => {
  try {
    const response = await queueApi.get('/api/record/queue/next-number', {
      params: { date, roomId }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting next queue number:', error);
    throw error;
  }
};

/**
 * Get queue status for a specific date and room
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Queue status with current, next, and upcoming records
 */
export const getQueueStatus = async (date, roomId) => {
  try {
    const response = await queueApi.get('/api/record/queue/status', {
      params: { date, roomId }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting queue status:', error);
    throw error;
  }
};

/**
 * Call a record (assign queue number and start service)
 * @param {string} recordId - Record ID
 * @returns {Promise<Object>} Updated record
 */
export const callRecord = async (recordId) => {
  try {
    const response = await queueApi.post(`/api/record/${recordId}/call`, {});
    return response.data;
  } catch (error) {
    console.error('Error calling record:', error);
    throw error;
  }
};

/**
 * Complete a record (finish service and create payment)
 * @param {string} recordId - Record ID
 * @returns {Promise<Object>} Completed record and payment data
 */
export const completeRecord = async (recordId) => {
  try {
    const response = await queueApi.post(`/api/record/${recordId}/complete`, {});
    return response.data;
  } catch (error) {
    console.error('Error completing record:', error);
    throw error;
  }
};

/**
 * Cancel a record
 * @param {string} recordId - Record ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Cancelled record
 */
export const cancelRecord = async (recordId, reason) => {
  try {
    const response = await queueApi.post(`/api/record/${recordId}/cancel`, { reason });
    return response.data;
  } catch (error) {
    console.error('Error cancelling record:', error);
    throw error;
  }
};

/**
 * Confirm cash payment
 * @param {string} paymentId - Payment ID
 * @returns {Promise<Object>} Updated payment
 */
export const confirmCashPayment = async (paymentId) => {
  try {
    const response = await queueApi.post(`/api/payment/${paymentId}/confirm-cash`, {});
    return response.data;
  } catch (error) {
    console.error('Error confirming cash payment:', error);
    throw error;
  }
};

/**
 * Get VNPay payment URL
 * @param {string} paymentId - Payment ID
 * @returns {Promise<Object>} Payment URL
 */
export const getVNPayPaymentUrl = async (paymentId) => {
  try {
    const response = await queueApi.post(`/api/payment/${paymentId}/vnpay`, {});
    return response.data;
  } catch (error) {
    console.error('Error getting VNPay URL:', error);
    throw error;
  }
};

// ============================================
// 🔥 NEW QUEUE MANAGEMENT METHODS
// ============================================

/**
 * Get queue for all rooms or specific room
 * @param {String} roomId - Optional room ID
 * @returns {Promise}
 */
export const getQueue = async (roomId = null) => {
  try {
    const params = roomId ? { roomId } : {};
    const response = await queueApi.get('/api/appointments/queue', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting queue:', error);
    throw error;
  }
};

/**
 * Get queue statistics
 * @returns {Promise}
 */
export const getQueueStats = async () => {
  try {
    const response = await queueApi.get('/api/appointments/queue/stats');
    return response.data;
  } catch (error) {
    console.error('Error getting queue stats:', error);
    throw error;
  }
};

/**
 * Manually trigger auto-start (for testing)
 * @returns {Promise}
 */
export const triggerAutoStart = async () => {
  try {
    const response = await queueApi.post('/api/appointments/queue/auto-start');
    return response.data;
  } catch (error) {
    console.error('Error triggering auto-start:', error);
    throw error;
  }
};

export default {
  getNextQueueNumber,
  getQueueStatus,
  callRecord,
  completeRecord,
  cancelRecord,
  confirmCashPayment,
  getVNPayPaymentUrl,
  getQueue,
  getQueueStats,
  triggerAutoStart
};

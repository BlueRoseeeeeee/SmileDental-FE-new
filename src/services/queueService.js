import axios from 'axios';

// ⚠️ HARDCODED - Production backend URLs
// Use record-service URL for queue operations (call, complete, cancel)
const RECORD_SERVICE_URL = 'https://be.smilecare.io.vn';

// Use appointment-service URL for queue viewing (getQueue, getQueueStats)
const APPOINTMENT_SERVICE_URL = 'https://be.smilecare.io.vn';

// Create axios instance for record-service
const recordApi = axios.create({
  baseURL: RECORD_SERVICE_URL,
  timeout: 30000, // 30s
  headers: {
    'Content-Type': 'application/json'
  }
});

// Create axios instance for appointment-service
const appointmentApi = axios.create({
  baseURL: APPOINTMENT_SERVICE_URL,
  timeout: 30000, // 30s
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token (record-service)
recordApi.interceptors.request.use(
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

// Request interceptor to add token (appointment-service)
appointmentApi.interceptors.request.use(
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

// Response interceptor for error handling (record-service)
recordApi.interceptors.response.use(
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

// Response interceptor for error handling (appointment-service)
appointmentApi.interceptors.response.use(
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
    const response = await recordApi.get('/api/record/queue/next-number', {
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
    const response = await recordApi.get('/api/record/queue/status', {
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
    const response = await recordApi.post(`/api/record/${recordId}/call`, {});
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
    const response = await recordApi.post(`/api/record/${recordId}/complete`, {});
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
    const response = await recordApi.post(`/api/record/${recordId}/cancel`, { reason });
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
    const response = await recordApi.post(`/api/payment/${paymentId}/confirm-cash`, {});
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
    const response = await recordApi.post(`/api/payments/${paymentId}/vnpay-url`, {});
    return response.data;
  } catch (error) {
    console.error('Error getting VNPay URL:', error);
    throw error;
  }
};

/**
 * Get Stripe payment URL
 * @param {string} paymentId - Payment ID
 * @returns {Promise<Object>} Payment URL
 */
export const getStripePaymentUrl = async (paymentId) => {
  try {
    const response = await recordApi.post(`/api/payments/${paymentId}/stripe-url`, {});
    return response.data;
  } catch (error) {
    console.error('Error getting Stripe URL:', error);
    throw error;
  }
};

// ============================================
// 🔥 APPOINTMENT QUEUE MANAGEMENT METHODS
// ============================================

/**
 * Get queue for all rooms or specific room
 * @param {String} roomId - Optional room ID
 * @returns {Promise}
 */
export const getQueue = async (roomId = null) => {
  try {
    const params = roomId ? { roomId } : {};
    const response = await appointmentApi.get('/api/appointments/queue', { params });
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
    const response = await appointmentApi.get('/api/appointments/queue/stats');
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
    const response = await appointmentApi.post('/api/appointments/queue/auto-start');
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
  getStripePaymentUrl,
  getQueue,
  getQueueStats,
  triggerAutoStart
};

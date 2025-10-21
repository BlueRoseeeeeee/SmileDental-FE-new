import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Get next queue number for a specific date and room
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Next queue number info
 */
export const getNextQueueNumber = async (date, roomId) => {
  try {
    const response = await axios.get(`${API_URL}/api/record/queue/next-number`, {
      params: { date, roomId },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
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
    const response = await axios.get(`${API_URL}/api/record/queue/status`, {
      params: { date, roomId },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
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
    const response = await axios.post(
      `${API_URL}/api/record/${recordId}/call`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
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
    const response = await axios.post(
      `${API_URL}/api/record/${recordId}/complete`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
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
    const response = await axios.post(
      `${API_URL}/api/record/${recordId}/cancel`,
      { reason },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
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
    const response = await axios.post(
      `${API_URL}/api/payment/${paymentId}/confirm-cash`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
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
    const response = await axios.post(
      `${API_URL}/api/payment/${paymentId}/vnpay`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting VNPay URL:', error);
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
  getVNPayPaymentUrl
};

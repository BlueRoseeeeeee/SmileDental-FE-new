/**
 * Payment API Service
 * Handles all payment-related API calls
 */

import { paymentApi } from './apiFactory.js';

/**
 * Get list of payments with filters
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status (pending, processing, completed, failed, cancelled, refunded)
 * @param {string} params.method - Filter by method (cash, vnpay, visa)
 * @param {string} params.type - Filter by type (payment, refund, adjustment, deposit)
 * @param {string} params.fromDate - Start date (ISO string)
 * @param {string} params.toDate - End date (ISO string)
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise} Payment list response
 */
export const getPayments = async (params = {}) => {
  try {
    const response = await paymentApi.get('/payments', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
};

/**
 * Search payments by patient name or payment code
 * @param {string} keyword - Search keyword
 * @returns {Promise} Search results
 */
export const searchPayments = async (keyword) => {
  try {
    const response = await paymentApi.get('/payments/search', {
      params: { keyword }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching payments:', error);
    throw error;
  }
};

/**
 * Get payment by ID
 * @param {string} id - Payment ID
 * @returns {Promise} Payment details
 */
export const getPaymentById = async (id) => {
  try {
    const response = await paymentApi.get(`/payments/id/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment:', error);
    throw error;
  }
};

/**
 * Get payment by payment code
 * @param {string} code - Payment code
 * @returns {Promise} Payment details
 */
export const getPaymentByCode = async (code) => {
  try {
    const response = await paymentApi.get(`/payments/code/${code}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment by code:', error);
    throw error;
  }
};

/**
 * Get payments by patient ID
 * @param {string} patientId - Patient ID
 * @param {Object} params - Query parameters (status, method, fromDate, toDate)
 * @returns {Promise} Patient payments
 */
export const getPaymentsByPatient = async (patientId, params = {}) => {
  try {
    const response = await paymentApi.get(`/payments/patient/${patientId}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching patient payments:', error);
    throw error;
  }
};

/**
 * Get payments by appointment ID
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise} Appointment payments
 */
export const getPaymentsByAppointment = async (appointmentId) => {
  try {
    const response = await paymentApi.get(`/payments/appointment/${appointmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching appointment payments:', error);
    throw error;
  }
};

/**
 * Get payments by invoice ID
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise} Invoice payments
 */
export const getPaymentsByInvoice = async (invoiceId) => {
  try {
    const response = await paymentApi.get(`/payments/invoice/${invoiceId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching invoice payments:', error);
    throw error;
  }
};

/**
 * Get payments by record ID
 * @param {string} recordId - Record ID
 * @returns {Promise} Record payments
 */
export const getPaymentsByRecord = async (recordId) => {
  try {
    const response = await paymentApi.get(`/payments/by-record/${recordId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching record payments:', error);
    throw error;
  }
};

/**
 * Get pending payments
 * @returns {Promise} Pending payments
 */
export const getPendingPayments = async () => {
  try {
    const response = await paymentApi.get('/payments/status/pending');
    return response.data;
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    throw error;
  }
};

/**
 * Get processing payments
 * @returns {Promise} Processing payments
 */
export const getProcessingPayments = async () => {
  try {
    const response = await paymentApi.get('/payments/status/processing');
    return response.data;
  } catch (error) {
    console.error('Error fetching processing payments:', error);
    throw error;
  }
};

/**
 * Get failed payments
 * @returns {Promise} Failed payments
 */
export const getFailedPayments = async () => {
  try {
    const response = await paymentApi.get('/payments/status/failed');
    return response.data;
  } catch (error) {
    console.error('Error fetching failed payments:', error);
    throw error;
  }
};

/**
 * Get today's payments
 * @returns {Promise} Today's payments
 */
export const getTodayPayments = async () => {
  try {
    const response = await paymentApi.get('/payments/today');
    return response.data;
  } catch (error) {
    console.error('Error fetching today payments:', error);
    throw error;
  }
};

/**
 * Create cash payment
 * @param {Object} paymentData - Payment data
 * @returns {Promise} Created payment
 */
export const createCashPayment = async (paymentData) => {
  try {
    const response = await paymentApi.post('/payments/cash', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error creating cash payment:', error);
    throw error;
  }
};

/**
 * Confirm payment
 * @param {string} id - Payment ID
 * @returns {Promise} Confirmed payment
 */
export const confirmPayment = async (id) => {
  try {
    const response = await paymentApi.post(`/payments/${id}/confirm`);
    return response.data;
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};

/**
 * Confirm cash payment
 * @param {string} id - Payment ID
 * @returns {Promise} Confirmed payment
 */
export const confirmCashPayment = async (id) => {
  try {
    const response = await paymentApi.post(`/payments/${id}/confirm-cash`);
    return response.data;
  } catch (error) {
    console.error('Error confirming cash payment:', error);
    throw error;
  }
};

/**
 * Cancel payment
 * @param {string} id - Payment ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise} Cancelled payment
 */
export const cancelPayment = async (id, reason) => {
  try {
    const response = await paymentApi.post(`/payments/${id}/cancel`, { reason });
    return response.data;
  } catch (error) {
    console.error('Error cancelling payment:', error);
    throw error;
  }
};

/**
 * Create refund payment
 * @param {string} originalPaymentId - Original payment ID
 * @param {Object} refundData - Refund data (amount, reason)
 * @returns {Promise} Refund payment
 */
export const createRefund = async (originalPaymentId, refundData) => {
  try {
    const response = await paymentApi.post(`/payments/${originalPaymentId}/refund`, refundData);
    return response.data;
  } catch (error) {
    console.error('Error creating refund:', error);
    throw error;
  }
};

/**
 * Verify payment
 * @param {string} id - Payment ID
 * @returns {Promise} Verified payment
 */
export const verifyPayment = async (id) => {
  try {
    const response = await paymentApi.post(`/payments/${id}/verify`);
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

/**
 * Get payment statistics
 * @param {Object} params - Query parameters (fromDate, toDate, groupBy)
 * @returns {Promise} Payment statistics
 */
export const getPaymentStatistics = async (params = {}) => {
  try {
    const response = await paymentApi.get('/payments/stats/payments', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    throw error;
  }
};

/**
 * Get revenue statistics
 * @param {Object} params - Query parameters (fromDate, toDate, groupBy)
 * @returns {Promise} Revenue statistics
 */
export const getRevenueStatistics = async (params = {}) => {
  try {
    const response = await paymentApi.get('/payments/stats/revenue', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching revenue statistics:', error);
    throw error;
  }
};

/**
 * Get refund statistics
 * @param {Object} params - Query parameters (fromDate, toDate)
 * @returns {Promise} Refund statistics
 */
export const getRefundStatistics = async (params = {}) => {
  try {
    const response = await paymentApi.get('/payments/stats/refunds', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching refund statistics:', error);
    throw error;
  }
};

export default {
  getPayments,
  searchPayments,
  getPaymentById,
  getPaymentByCode,
  getPaymentsByPatient,
  getPaymentsByAppointment,
  getPaymentsByInvoice,
  getPaymentsByRecord,
  getPendingPayments,
  getProcessingPayments,
  getFailedPayments,
  getTodayPayments,
  createCashPayment,
  confirmPayment,
  confirmCashPayment,
  cancelPayment,
  createRefund,
  verifyPayment,
  getPaymentStatistics,
  getRevenueStatistics,
  getRefundStatistics
};

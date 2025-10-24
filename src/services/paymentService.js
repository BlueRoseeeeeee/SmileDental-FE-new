/**
 * @author: TrungNghia
 * Payment Service - Quản lý thanh toán
 */
import axios from 'axios';

const PAYMENT_API_URL = import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:3007/api';

// Create axios instance for payment service
const paymentApi = axios.create({
  baseURL: PAYMENT_API_URL,
  timeout: 30000, // 30s for payment processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
paymentApi.interceptors.request.use(
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

// Response interceptor to handle errors
paymentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const paymentService = {
  // Process Visa payment
  processVisaPayment: async (paymentData) => {
    const response = await paymentApi.post('/payment/visa/process', paymentData);
    return response.data;
  },

  // Get payment by ID
  getPaymentById: async (paymentId) => {
    const response = await paymentApi.get(`/payment/${paymentId}`);
    return response.data;
  },

  // Get payment by reservation ID
  getPaymentByReservation: async (reservationId) => {
    const response = await paymentApi.get(`/payment/reservation/${reservationId}`);
    return response.data;
  },

  // Get patient payments
  getMyPayments: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);

    const url = `/payment/my${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await paymentApi.get(url);
    return response.data;
  },

  // Get payment by recordId
  getPaymentByRecordId: async (recordId) => {
    const response = await paymentApi.get(`/payments/by-record/${recordId}`);
    return response.data;
  },

  // Confirm cash payment
  confirmCashPayment: async (paymentId, paidAmount, notes = '') => {
    const response = await paymentApi.post(`/payments/${paymentId}/confirm-cash`, {
      paidAmount,
      notes
    });
    return response.data;
  },

  // Verify payment status
  verifyPayment: async (transactionId) => {
    const response = await paymentApi.get(`/payment/verify/${transactionId}`);
    return response.data;
  }
};

export default paymentService;
export { paymentApi };

import axios from 'axios';

const INVOICE_API_BASE = import.meta.env.VITE_INVOICE_SERVICE_URL || 'http://localhost:3008/api/invoice';

// Create API instance with base URL
const api = axios.create({
  baseURL: INVOICE_API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class InvoiceService {
  /**
   * Get all invoices with filters (Admin/Staff only)
   * @param {Object} params - Filter parameters
   * @returns {Promise<Object>} { success, data: { invoices: [...], pagination: {...} } }
   */
  async getAllInvoices(params = {}) {
    try {
      const response = await api.get('/', { params });
      return response.data;
    } catch (error) {
      console.error('getAllInvoices error:', error);
      throw error;
    }
  }

  /**
   * Get invoices for current patient (Patient only)
   * @param {Object} params - Filter parameters (status, dateFrom, dateTo, paymentMethod, page, limit)
   * @returns {Promise<Object>} { success, data: { invoices: [...], pagination: {...} } }
   */
  async getMyInvoices(params = {}) {
    try {
      const response = await api.get('/my-invoices', { params });
      return response.data;
    } catch (error) {
      console.error('getMyInvoices error:', error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   * @param {String} id - Invoice ID
   * @returns {Promise<Object>} { success, data: {...} }
   */
  async getInvoiceById(id) {
    try {
      const response = await api.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('getInvoiceById error:', error);
      throw error;
    }
  }

  /**
   * Search invoices
   * @param {String} query - Search query
   * @returns {Promise<Object>} { success, data: [...] }
   */
  async searchInvoices(query) {
    try {
      const response = await api.get('/search', { params: { q: query } });
      return response.data;
    } catch (error) {
      console.error('searchInvoices error:', error);
      throw error;
    }
  }

  /**
   * Create new invoice
   * @param {Object} invoiceData - Invoice data
   * @returns {Promise<Object>} { success, message, data: {...} }
   */
  async createInvoice(invoiceData) {
    try {
      const response = await api.post('/', invoiceData);
      return response.data;
    } catch (error) {
      console.error('createInvoice error:', error);
      throw error;
    }
  }

  /**
   * Update invoice
   * @param {String} id - Invoice ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} { success, message, data: {...} }
   */
  async updateInvoice(id, updateData) {
    try {
      const response = await api.put(`/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('updateInvoice error:', error);
      throw error;
    }
  }

  /**
   * Update invoice status
   * @param {String} id - Invoice ID
   * @param {String} status - New status
   * @returns {Promise<Object>} { success, message, data: {...} }
   */
  async updateInvoiceStatus(id, status) {
    try {
      const response = await api.patch(`/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('updateInvoiceStatus error:', error);
      throw error;
    }
  }

  /**
   * Cancel invoice
   * @param {String} id - Invoice ID
   * @param {Object} cancelData - Cancel data (reason, cancelledBy)
   * @returns {Promise<Object>} { success, message, data: {...} }
   */
  async cancelInvoice(id, cancelData) {
    try {
      const response = await api.post(`/${id}/cancel`, cancelData);
      return response.data;
    } catch (error) {
      console.error('cancelInvoice error:', error);
      throw error;
    }
  }

  /**
   * Delete invoice
   * @param {String} id - Invoice ID
   * @returns {Promise<Object>} { success, message }
   */
  async deleteInvoice(id) {
    try {
      const response = await api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('deleteInvoice error:', error);
      throw error;
    }
  }

  /**
   * Get invoice details (line items)
   * @param {String} invoiceId - Invoice ID
   * @returns {Promise<Object>} { success, data: [...] }
   */
  async getInvoiceDetails(invoiceId) {
    try {
      const response = await api.get(`/${invoiceId}/details`);
      return response.data;
    } catch (error) {
      console.error('getInvoiceDetails error:', error);
      throw error;
    }
  }

  /**
   * Send invoice reminder
   * @param {String} id - Invoice ID
   * @returns {Promise<Object>} { success, message }
   */
  async sendInvoiceReminder(id) {
    try {
      const response = await api.post(`/${id}/remind`);
      return response.data;
    } catch (error) {
      console.error('sendInvoiceReminder error:', error);
      throw error;
    }
  }

  /**
   * Export invoice to PDF
   * @param {String} id - Invoice ID
   * @returns {Promise<Object>} { success, data: { pdfUrl: "..." } }
   */
  async exportInvoiceToPDF(id) {
    try {
      const response = await api.get(`/${id}/pdf`);
      return response.data;
    } catch (error) {
      console.error('exportInvoiceToPDF error:', error);
      throw error;
    }
  }

  /**
   * Get invoice statistics
   * @param {Object} params - Filter parameters (startDate, endDate)
   * @returns {Promise<Object>} { success, data: {...} }
   */
  async getInvoiceStatistics(params = {}) {
    try {
      const response = await api.get('/stats/dashboard', { params });
      return response.data;
    } catch (error) {
      console.error('getInvoiceStatistics error:', error);
      throw error;
    }
  }

  /**
   * Get revenue statistics
   * @param {Object} params - Filter parameters (startDate, endDate)
   * @returns {Promise<Object>} { success, data: {...} }
   */
  async getRevenueStatistics(params = {}) {
    try {
      const response = await api.get('/stats/revenue', { params });
      return response.data;
    } catch (error) {
      console.error('getRevenueStatistics error:', error);
      throw error;
    }
  }

  /**
   * Get service statistics
   * @param {Object} params - Filter parameters (startDate, endDate)
   * @returns {Promise<Object>} { success, data: {...} }
   */
  async getServiceStatistics(params = {}) {
    try {
      const response = await api.get('/stats/services', { params });
      return response.data;
    } catch (error) {
      console.error('getServiceStatistics error:', error);
      throw error;
    }
  }
}

export default new InvoiceService();

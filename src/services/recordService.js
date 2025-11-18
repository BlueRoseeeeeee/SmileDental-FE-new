import axios from 'axios';

// ⚠️ HARDCODED - Production backend URL
const RECORD_API_BASE = 'https://be.smilecare.io.vn';

// Create API instance with base URL
const api = axios.create({
  baseURL: `${RECORD_API_BASE}/api/record`,
  timeout: 30000, // 30s
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

class RecordService {
  /**
   * Get all records with filters
   * @param {Object} params - Filter parameters
   * @returns {Promise<Object>} { success, data: [...], total }
   */
  async getAllRecords(params = {}) {
    try {
      const response = await api.get('/', { params });
      return response.data;
    } catch (error) {
      console.error('getAllRecords error:', error);
      throw error;
    }
  }

  /**
   * Get record by ID
   * @param {String} id - Record ID
   * @returns {Promise<Object>} { success, data: {...} }
   */
  async getRecordById(id) {
    try {
      const response = await api.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('getRecordById error:', error);
      throw error;
    }
  }

  /**
   * Get record by code
   * @param {String} code - Record code
   * @returns {Promise<Object>} { success, data: {...} }
   */
  async getRecordByCode(code) {
    try {
      const response = await api.get(`/code/${code}`);
      return response.data;
    } catch (error) {
      console.error('getRecordByCode error:', error);
      throw error;
    }
  }

  /**
   * Get records by patient
   * @param {String} patientId - Patient ID
   * @param {Number} limit - Limit results
   * @returns {Promise<Object>} { success, data: [...], total }
   */
  async getRecordsByPatient(patientId, limit = 10) {
    try {
      const response = await api.get(`/patient/${patientId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('getRecordsByPatient error:', error);
      throw error;
    }
  }

  /**
   * ✅ Get unused services from exam records (for booking service selection)
   * @param {String} patientId - Patient ID
   * @returns {Promise<Object>} { success, data: [...], total }
   */
  async getUnusedServices(patientId) {
    try {
      const response = await api.get(`/patient/${patientId}/unused-services`);
      return response.data;
    } catch (error) {
      console.error('getUnusedServices error:', error);
      throw error;
    }
  }

  /**
   * 🆕 Get treatment indications for a patient and service
   * @param {String} patientId - Patient ID
   * @param {String} serviceId - Service ID
   * @returns {Promise<Object>} { success, data: [...], total }
   */
  async getTreatmentIndications(patientId, serviceId) {
    try {
      const response = await api.get(`/patient/${patientId}/treatment-indications`, {
        params: { serviceId }
      });
      return response.data;
    } catch (error) {
      console.error('getTreatmentIndications error:', error);
      throw error;
    }
  }

  /**
   * Get records by dentist
   * @param {String} dentistId - Dentist ID
   * @param {String} startDate - Start date (YYYY-MM-DD)
   * @param {String} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} { success, data: [...], total }
   */
  async getRecordsByDentist(dentistId, startDate, endDate) {
    try {
      const response = await api.get(`/dentist/${dentistId}`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('getRecordsByDentist error:', error);
      throw error;
    }
  }

  /**
   * Get pending records
   * @returns {Promise<Object>} { success, data: [...], total }
   */
  async getPendingRecords() {
    try {
      const response = await api.get('/status/pending');
      return response.data;
    } catch (error) {
      console.error('getPendingRecords error:', error);
      throw error;
    }
  }

  /**
   * Create new record
   * @param {Object} recordData - Record data
   * @returns {Promise<Object>} { success, message, data: {...} }
   */
  async createRecord(recordData) {
    try {
      const response = await api.post('/', recordData);
      return response.data;
    } catch (error) {
      console.error('createRecord error:', error);
      throw error;
    }
  }

  /**
   * Update record
   * @param {String} id - Record ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} { success, message, data: {...} }
   */
  async updateRecord(id, updateData) {
    try {
      const response = await api.put(`/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('updateRecord error:', error);
      throw error;
    }
  }

  /**
   * Update record status
   * @param {String} id - Record ID
   * @param {String} status - New status
   * @returns {Promise<Object>} { success, message, data: {...} }
   */
  async updateRecordStatus(id, status) {
    try {
      const response = await api.patch(`/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('updateRecordStatus error:', error);
      throw error;
    }
  }

  /**
   * Add prescription to record
   * @param {String} id - Record ID
   * @param {Object} prescription - Prescription data
   * @returns {Promise<Object>} { success, message, data: {...} }
   */
  async addPrescription(id, prescription) {
    try {
      const response = await api.post(`/${id}/prescription`, { prescription });
      return response.data;
    } catch (error) {
      console.error('addPrescription error:', error);
      throw error;
    }
  }

  /**
   * Update treatment indication
   * @param {String} id - Record ID
   * @param {String} indicationId - Indication ID
   * @param {Boolean} used - Used status
   * @param {String} notes - Notes
   * @returns {Promise<Object>} { success, message, data: {...} }
   */
  async updateTreatmentIndication(id, indicationId, used, notes) {
    try {
      const response = await api.patch(`/${id}/indications/${indicationId}`, {
        used,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('updateTreatmentIndication error:', error);
      throw error;
    }
  }

  /**
   * Complete record
   * @param {String} id - Record ID
   * @returns {Promise<Object>} { success, message, data: {...} }
   */
  async completeRecord(id, paymentMethod = 'cash') {
    try {
      const response = await api.patch(`/${id}/complete`, { paymentMethod });
      return response.data;
    } catch (error) {
      console.error('completeRecord error:', error);
      throw error;
    }
  }

  /**
   * Get payment info for record (preview before completing)
   * Fetches appointment and invoice data to calculate deposit
   * @param {String} id - Record ID
   * @returns {Promise<Object>} { success, data: { totalCost, depositAmount, finalAmount, hasDeposit, ... } }
   */
  async getPaymentInfo(id) {
    try {
      console.log(`📞 [recordService.getPaymentInfo] Calling API for record: ${id}`);
      const response = await api.get(`/${id}/payment-info`);
      console.log('✅ [recordService.getPaymentInfo] Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [recordService.getPaymentInfo] Error:', error);
      throw error;
    }
  }

  /**
   * Delete record
   * @param {String} id - Record ID
   * @returns {Promise<Object>} { success, message }
   */
  async deleteRecord(id) {
    try {
      const response = await api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('deleteRecord error:', error);
      throw error;
    }
  }

  /**
   * Search records
   * @param {String} query - Search query
   * @returns {Promise<Object>} { success, data: [...], total }
   */
  async searchRecords(query) {
    try {
      const response = await api.get('/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('searchRecords error:', error);
      throw error;
    }
  }

  /**
   * Get statistics
   * @param {String} startDate - Start date
   * @param {String} endDate - End date
   * @returns {Promise<Object>} { success, data: {...} }
   */
  async getStatistics(startDate, endDate) {
    try {
      const response = await api.get('/statistics', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('getStatistics error:', error);
      throw error;
    }
  }

  /**
   * Add additional service to record
   * @param {String} recordId - Record ID
   * @param {Object} serviceData - Service data
   * @returns {Promise<Object>} { success, message, data: {...} }
   */
  async addAdditionalService(recordId, serviceData) {
    try {
      const response = await api.post(`/${recordId}/additional-services`, serviceData);
      return response.data;
    } catch (error) {
      console.error('addAdditionalService error:', error);
      throw error;
    }
  }

  /**
   * Remove additional service from record
   * @param {String} recordId - Record ID
   * @param {String} serviceItemId - Service item ID
   * @returns {Promise<Object>} { success, message, data: {...} }
   */
  async removeAdditionalService(recordId, serviceItemId) {
    try {
      const response = await api.delete(`/${recordId}/additional-services/${serviceItemId}`);
      return response.data;
    } catch (error) {
      console.error('removeAdditionalService error:', error);
      throw error;
    }
  }

  /**
   * Update additional service (quantity/notes)
   * @param {String} recordId - Record ID
   * @param {String} serviceItemId - Service item ID
   * @param {Object} updateData - Update data { quantity, notes }
   * @returns {Promise<Object>} { success, message, data: {...} }
   */
  async updateAdditionalService(recordId, serviceItemId, updateData) {
    try {
      const response = await api.patch(`/${recordId}/additional-services/${serviceItemId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('updateAdditionalService error:', error);
      throw error;
    }
  }

  /**
   * 🆕 Get patients with unused indications for a dentist (for walk-in)
   * @param {String} dentistId - Dentist ID
   * @returns {Promise<Object>} { success, message, data: [...] }
   */
  async getPatientsWithUnusedIndications(dentistId) {
    try {
      const response = await api.get(`/dentist/${dentistId}/patients-with-unused-indications`);
      return response.data;
    } catch (error) {
      console.error('getPatientsWithUnusedIndications error:', error);
      throw error;
    }
  }
}

export default new RecordService();

/**
 * @author: Medicine Service
 * Medicine API service - Handle medicine catalog management
 */
import { getApiInstance } from './apiFactory.js';

// Get medicine API instance
const medicineApi = getApiInstance('medicine');

const medicineService = {
  /**
   * Get list of medicines
   * @param {Object} params - Query parameters
   * @returns {Promise} List of medicines
   */
  getMedicines: async (params = {}) => {
    const { page = 1, limit = 20, isActive, category, search } = params;
    const queryParams = new URLSearchParams();
    
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    if (isActive !== undefined) {
      queryParams.append('isActive', isActive);
    }
    if (category) {
      queryParams.append('category', category);
    }
    if (search) {
      queryParams.append('search', search);
    }
    
    const response = await medicineApi.get(`/medicine?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get medicine by ID
   * @param {string} id - Medicine ID
   * @returns {Promise} Medicine details
   */
  getMedicineById: async (id) => {
    const response = await medicineApi.get(`/medicine/${id}`);
    return response.data;
  },

  /**
   * Create new medicine
   * @param {Object} medicineData - Medicine data
   * @returns {Promise} Created medicine
   */
  createMedicine: async (medicineData) => {
    const response = await medicineApi.post('/medicine', medicineData);
    return response.data;
  },

  /**
   * Update medicine
   * @param {string} id - Medicine ID
   * @param {Object} medicineData - Updated medicine data
   * @returns {Promise} Updated medicine
   */
  updateMedicine: async (id, medicineData) => {
    const response = await medicineApi.put(`/medicine/${id}`, medicineData);
    return response.data;
  },

  /**
   * Toggle medicine status (active/inactive)
   * @param {string} id - Medicine ID
   * @returns {Promise} Updated medicine
   */
  toggleMedicineStatus: async (id) => {
    const response = await medicineApi.patch(`/medicine/${id}/toggle`);
    return response.data;
  },

  /**
   * Delete medicine
   * @param {string} id - Medicine ID
   * @returns {Promise} Success message
   */
  deleteMedicine: async (id) => {
    const response = await medicineApi.delete(`/medicine/${id}`);
    return response.data;
  },

  /**
   * Search medicines
   * @param {string} query - Search query
   * @param {Object} params - Additional parameters
   * @returns {Promise} Search results
   */
  searchMedicine: async (query, params = {}) => {
    const { page = 1, limit = 20 } = params;
    const response = await medicineApi.get('/medicine/search', {
      params: { q: query, page, limit }
    });
    return response.data;
  }
};

export default medicineService;

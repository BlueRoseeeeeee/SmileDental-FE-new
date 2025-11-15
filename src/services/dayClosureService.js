/**
 * Day Closure Service - Quản lý lịch đóng cửa khẩn cấp và bệnh nhân bị hủy
 * @author: System
 */
import { scheduleApi } from './apiFactory.js';

const dayClosureService = {
  /**
   * Get all day closure records with filters
   * @param {Object} filters - Query filters
   * @param {String} filters.startDate - Start date (YYYY-MM-DD)
   * @param {String} filters.endDate - End date (YYYY-MM-DD)
   * @param {String} filters.status - Status filter (active, partially_restored, fully_restored)
   * @param {String} filters.roomId - Filter by room ID
   * @param {Number} filters.page - Page number (default: 1)
   * @param {Number} filters.limit - Items per page (default: 20)
   */
  getDayClosures: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);
    if (filters.roomId) params.append('roomId', filters.roomId);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await scheduleApi.get(`/day-closure?${params.toString()}`);
    return response.data;
  },

  /**
   * Get day closure details by ID
   * @param {String} id - DayClosure record ID
   */
  getDayClosureById: async (id) => {
    const response = await scheduleApi.get(`/day-closure/${id}`);
    return response.data;
  },

  /**
   * Get statistics for day closures
   * @param {String} startDate - Start date (YYYY-MM-DD)
   * @param {String} endDate - End date (YYYY-MM-DD)
   */
  getDayClosureStats: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await scheduleApi.get(`/day-closure/stats?${params.toString()}`);
    return response.data;
  },

  /**
   * Get cancelled patients for a specific closure
   * @param {String} id - DayClosure record ID
   */
  getCancelledPatients: async (id) => {
    const response = await scheduleApi.get(`/day-closure/${id}/patients`);
    return response.data;
  },

  /**
   * Get all cancelled patients with filters
   * @param {Object} filters
   * @param {String} filters.startDate - Start date (YYYY-MM-DD)
   * @param {String} filters.endDate - End date (YYYY-MM-DD)
   * @param {String} filters.roomId - Filter by room ID
   * @param {String} filters.dentistId - Filter by dentist ID
   * @param {String} filters.patientName - Search by patient name/email/phone
   * @param {Number} filters.page - Page number
   * @param {Number} filters.limit - Items per page
   */
  getAllCancelledPatients: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.roomId) params.append('roomId', filters.roomId);
    if (filters.dentistId) params.append('dentistId', filters.dentistId);
    if (filters.patientName) params.append('patientName', filters.patientName);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await scheduleApi.get(`/day-closure/patients/all?${params.toString()}`);
    return response.data;
  }
};

export default dayClosureService;

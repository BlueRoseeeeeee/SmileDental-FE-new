/**
 * @author: HoTram, TrungNghia
 * Appointment Service - Quản lý đặt lịch khám
 */
import axios from 'axios';

const APPOINTMENT_API_URL = import.meta.env.VITE_APPOINTMENT_API_URL || 'http://localhost:3006/api';

// Create axios instance for appointment service
const appointmentApi = axios.create({
  baseURL: APPOINTMENT_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
appointmentApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken'); // Changed from 'token' to 'accessToken'
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
appointmentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const appointmentService = {
  // Reserve appointment (tạo reservation tạm thời)
  reserveAppointment: async (reservationData) => {
    const response = await appointmentApi.post('/appointment/reserve', reservationData);
    return response.data;
  },

  // Create offline appointment (walk-in) - tạo trực tiếp, không qua payment
  createOfflineAppointment: async (appointmentData) => {
    console.log('🚀 [appointmentService] Sending createOfflineAppointment request:', JSON.stringify(appointmentData, null, 2));
    const response = await appointmentApi.post('/appointment/create-offline', appointmentData);
    return response.data;
  },

  // Tạo appointment mới (reserve/book) - Legacy method
  createAppointment: async (appointmentData) => {
    const response = await appointmentApi.post('/appointment/reserve', appointmentData);
    return response.data;
  },

  // Lấy danh sách appointments của patient hiện tại
  getMyAppointments: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const url = `/appointment/my-appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await appointmentApi.get(url);
    return response.data;
  },

  // Lấy danh sách appointments của patient
  getPatientAppointments: async (patientId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const url = `/appointment/patient/${patientId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await appointmentApi.get(url);
    return response.data;
  },

  // Lấy chi tiết appointment theo ID
  getAppointmentById: async (appointmentId) => {
    const response = await appointmentApi.get(`/appointment/${appointmentId}`);
    return response.data;
  },

  // Lấy chi tiết appointment theo code
  getAppointmentByCode: async (appointmentCode) => {
    const response = await appointmentApi.get(`/appointment/code/${appointmentCode}`);
    return response.data;
  },

  // Hủy appointment
  cancelAppointment: async (appointmentId, reason) => {
    const response = await appointmentApi.post(`/appointment/${appointmentId}/cancel`, {
      reason: reason
    });
    return response.data;
  },

  // Check-in appointment
  checkInAppointment: async (appointmentId, notes = '') => {
    const response = await appointmentApi.post(`/appointment/${appointmentId}/check-in`, {
      notes
    });
    return response.data;
  },

  // Complete appointment
  completeAppointment: async (appointmentId, notes = '') => {
    const response = await appointmentApi.post(`/appointment/${appointmentId}/complete`, {
      notes
    });
    return response.data;
  },

  // Cập nhật trạng thái appointment (deprecated - use specific methods above)
  updateAppointmentStatus: async (appointmentId, status, notes) => {
    const response = await appointmentApi.patch(`/appointment/${appointmentId}/status`, {
      status,
      notes
    });
    return response.data;
  },

  // Lấy tất cả appointments (Admin/Manager)
  getAllAppointments: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.dentistId) queryParams.append('dentistId', params.dentistId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const url = `/appointment${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🔵 [AppointmentService] Calling getAllAppointments:', url);
      
      const response = await appointmentApi.get(url);
      console.log('🟢 [AppointmentService] getAllAppointments response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('🔴 [AppointmentService] getAllAppointments error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  // Check-in appointment
  checkInAppointment: async (appointmentId, notes) => {
    const response = await appointmentApi.post(`/appointment/${appointmentId}/check-in`, {
      notes
    });
    return response.data;
  },

  // Complete appointment
  completeAppointment: async (appointmentId, notes) => {
    const response = await appointmentApi.post(`/appointment/${appointmentId}/complete`, {
      notes
    });
    return response.data;
  },

  // Lấy appointments theo ngày
  getAppointmentsByDate: async (date) => {
    const response = await appointmentApi.get(`/appointment/by-date/${date}`);
    return response.data;
  },

  // Lấy appointments theo dentist
  getAppointmentsByDentist: async (dentistId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.status) queryParams.append('status', params.status);

    const url = `/appointment/dentist/${dentistId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await appointmentApi.get(url);
    return response.data;
  }
};

export default appointmentService;
export { appointmentApi };

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
  // Tạo appointment mới (reserve/book)
  createAppointment: async (appointmentData) => {
    const response = await appointmentApi.post('/appointment/reserve', appointmentData);
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
    const response = await appointmentApi.patch(`/appointment/${appointmentId}/cancel`, {
      cancelReason: reason
    });
    return response.data;
  },

  // Cập nhật trạng thái appointment
  updateAppointmentStatus: async (appointmentId, status, notes) => {
    const response = await appointmentApi.patch(`/appointment/${appointmentId}/status`, {
      status,
      notes
    });
    return response.data;
  }
};

export default appointmentService;
export { appointmentApi };

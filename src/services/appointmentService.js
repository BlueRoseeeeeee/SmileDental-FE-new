/**
 * @author: HoTram, TrungNghia
 * Appointment Service - Quản lý đặt lịch khám
 */
import axios from 'axios';

// ⚠️ HARDCODED - Production backend URL
const APPOINTMENT_API_URL = 'https://be.smilecare.io.vn/api';

// Create axios instance for appointment service
const appointmentApi = axios.create({
  baseURL: APPOINTMENT_API_URL,
  timeout: 30000, // 30s
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
appointmentApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    console.log('🔵 [appointmentService] Request interceptor:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'N/A'
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ [appointmentService] Authorization header set');
    } else {
      console.warn('⚠️ [appointmentService] No token found in localStorage');
    }
    
    // Note: Role information is already included in the JWT token payload as 'activeRole'
    // No need to send separate role header
    return config;
  },
  (error) => {
    console.error('❌ [appointmentService] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
appointmentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ [appointmentService] Response error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
    
    if (error.response?.status === 401) {
      console.error('🔴 [appointmentService] 401 Unauthorized - Token invalid/expired');
      // ⚠️ TEMPORARY: Comment out redirect for debugging
      // localStorage.removeItem('accessToken');
      // localStorage.removeItem('refreshToken');
      // localStorage.removeItem('user');
      // window.location.href = '/login';
      
      // Show alert instead of redirect
      alert('⚠️ DEBUG: 401 Unauthorized error. Check console logs before this alert.');
    }
    return Promise.reject(error);
  }
);

const appointmentService = {
  // Reserve appointment (tạo reservation tạm thời)
  reserveAppointment: async (reservationData) => {
    const response = await appointmentApi.post('/appointments/reserve', reservationData);
    return response.data;
  },

  // Create offline appointment (walk-in) - tạo trực tiếp, không qua payment
  createOfflineAppointment: async (appointmentData) => {
    console.log('🚀 [appointmentService] Sending createOfflineAppointment request:', JSON.stringify(appointmentData, null, 2));
    const response = await appointmentApi.post('/appointments/create-offline', appointmentData);
    return response.data;
  },

  // Tạo appointment mới (reserve/book) - Legacy method
  createAppointment: async (appointmentData) => {
    const response = await appointmentApi.post('/appointments/reserve', appointmentData);
    return response.data;
  },

  // Lấy danh sách appointments của patient hiện tại
  getMyAppointments: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const url = `/appointments/my-appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await appointmentApi.get(url);
    return response.data;
  },

  // Lấy danh sách appointments của patient
  getPatientAppointments: async (patientId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const url = `/appointments/patient/${patientId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await appointmentApi.get(url);
    return response.data;
  },

  // Lấy chi tiết appointment theo ID
  getAppointmentById: async (appointmentId) => {
    const response = await appointmentApi.get(`/appointments/${appointmentId}`);
    return response.data;
  },

  // Lấy chi tiết appointment theo code
  getAppointmentByCode: async (appointmentCode) => {
    const response = await appointmentApi.get(`/appointments/code/${appointmentCode}`);
    return response.data;
  },

  // Hủy appointment
  cancelAppointment: async (appointmentId, reason) => {
    const response = await appointmentApi.post(`/appointments/${appointmentId}/cancel`, {
      reason: reason
    });
    return response.data;
  },

  // Check-in appointment
  checkInAppointment: async (appointmentId, notes = '') => {
    const response = await appointmentApi.post(`/appointments/${appointmentId}/check-in`, {
      notes
    });
    return response.data;
  },

  // Complete appointment
  completeAppointment: async (appointmentId, notes = '') => {
    const response = await appointmentApi.post(`/appointments/${appointmentId}/complete`, {
      notes
    });
    return response.data;
  },

  // Cập nhật trạng thái appointment (deprecated - use specific methods above)
  updateAppointmentStatus: async (appointmentId, status, notes) => {
    const response = await appointmentApi.patch(`/appointments/${appointmentId}/status`, {
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

      const url = `/appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
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
    const response = await appointmentApi.post(`/appointments/${appointmentId}/check-in`, {
      notes
    });
    return response.data;
  },

  // Complete appointment
  completeAppointment: async (appointmentId, notes) => {
    const response = await appointmentApi.post(`/appointments/${appointmentId}/complete`, {
      notes
    });
    return response.data;
  },

  // Lấy appointments theo ngày
  getAppointmentsByDate: async (date) => {
    const response = await appointmentApi.get(`/appointments/by-date/${date}`);
    return response.data;
  },

  // Lấy appointments theo dentist
  getAppointmentsByDentist: async (dentistId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.status) queryParams.append('status', params.status);

    const url = `/appointments/dentist/${dentistId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await appointmentApi.get(url);
    return response.data;
  },

  // Lấy appointments theo staff (dentist/nurse) với date filter
  getAppointmentsByStaff: async (staffId, date) => {
    const queryParams = new URLSearchParams();
    if (date) queryParams.append('date', date);

    const url = `/appointments/by-staff/${staffId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await appointmentApi.get(url);
    return response.data;
  },

  // Admin/Manager/Receptionist cancel appointment (no time restrictions)
  adminCancelAppointment: async (appointmentId, reason) => {
    const response = await appointmentApi.post(`/appointments/${appointmentId}/admin-cancel`, {
      reason: reason
    });
    return response.data;
  },

  // Patient request cancellation (must be >=1 day before appointment)
  requestCancellation: async (appointmentId, reason) => {
    const response = await appointmentApi.post(`/appointments/${appointmentId}/request-cancellation`, {
      reason: reason
    });
    return response.data;
  }
};

export default appointmentService;
export { appointmentApi };

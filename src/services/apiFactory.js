/**
 * @author: HoTram
 * API Factory - Tạo axios instances cho các microservices khác nhau
 */
import axios from 'axios';

// Configuration cho các microservices
const MICROSERVICES_CONFIG = {
  auth: {
    baseURL: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3001/api',
    timeout: 15000, // 15s 
  },
  room: {
    baseURL: import.meta.env.VITE_ROOM_API_URL || 'http://localhost:3002/api',
    timeout: 8000,  // 8s - CRUD operations nhanh
  },
  service: {
    baseURL: import.meta.env.VITE_SERVICE_API_URL || 'http://localhost:3003/api',
    timeout: 10000, // 10s - Service data có thể lớn
  },
  user: {
    baseURL: import.meta.env.VITE_USER_API_URL || 'http://localhost:3001/api',
    timeout: 12000, // 12s - User data + file upload
  },
  schedule: {
    baseURL: import.meta.env.VITE_SCHEDULE_API_URL || 'http://localhost:3005/api',
    timeout: 20000, 
  },
  payment: {
    baseURL: import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:3007/api', // ✅ Fix: Payment service runs on port 3007
    timeout: 15000, // 15s - Payment processing
  },
  medicine: {
    baseURL: import.meta.env.VITE_MEDICINE_API_URL || 'http://localhost:3009/api',
    timeout: 10000, // 10s - Medicine catalog management
  }
};

// Cache cho các axios instances
const axiosInstances = {};

/**
 * Tạo axios instance với interceptors chuẩn
 * - Request interceptor để thêm token
 * - Response interceptor để handle token refresh
 * 
 * Lưu ý: Tránh circular dependency bằng cách không import authService trực tiếp
 * mà lấy token từ localStorage.
 */
const createAxiosInstance = (serviceName, config) => {
  const instance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - thêm token
  instance.interceptors.request.use(
    (config) => {
      // Get token from localStorage only
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

  // Response interceptor - handle token refresh
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Handle 401 Unauthorized - try to refresh token first
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // 🔍 DEBUG: Log 401 error details
        const token = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        console.error('🔴 401 Unauthorized Error:', {
          url: originalRequest.url,
          method: originalRequest.method,
          hasAuthHeader: !!originalRequest.headers?.Authorization,
          hasToken: !!token,
          hasRefreshToken: !!refreshToken,
          token: token?.substring(0, 20) + '...',
          refreshToken: refreshToken?.substring(0, 20) + '...'
        });

        try {
          // Try to refresh token
          if (refreshToken) {
            console.log('🔄 Attempting to refresh token...');
            
            // Call refresh token endpoint
            const refreshResponse = await axios.post(
              `${MICROSERVICES_CONFIG.auth.baseURL}/auth/refresh`,
              { refreshToken }
            );

            if (refreshResponse.data?.accessToken) {
              console.log('✅ Token refresh successful');
              
              // Save new access token to localStorage
              localStorage.setItem('accessToken', refreshResponse.data.accessToken);
              if (refreshResponse.data.refreshToken) {
                localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
              }
              
              // Update authorization header for the original request
              originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
              
              // Retry original request with new token
              return instance(originalRequest);
            }
          } else {
            console.error('❌ No refresh token found in localStorage');
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError.response?.data || refreshError.message);
        }

        // If refresh failed, clear tokens and redirect to login
        console.error('🔴 Logging out - clearing tokens and redirecting to /login');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Handle 403 Forbidden (không có quyền)
      if (error.response?.status === 403) {
        // Don't logout for 403 - user is authenticated but not authorized
        return Promise.reject(error);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * Get hoặc tạo axios instance cho service cụ thể
 */
export const getApiInstance = (serviceName) => {
  if (!MICROSERVICES_CONFIG[serviceName]) {
    throw new Error(`Unknown service: ${serviceName}`);
  }

  // Return cached instance nếu đã tồn tại
  if (axiosInstances[serviceName]) {
    return axiosInstances[serviceName];
  }

  // Tạo instance mới và cache
  const config = MICROSERVICES_CONFIG[serviceName];
  axiosInstances[serviceName] = createAxiosInstance(serviceName, config);
  
  return axiosInstances[serviceName];
};

/**
 * Convenience exports cho từng service
 */
export const authApi = getApiInstance('auth');
export const roomApi = getApiInstance('room');
export const serviceApi = getApiInstance('service');
export const userApi = getApiInstance('user');
export const scheduleApi = getApiInstance('schedule');
export const paymentApi = getApiInstance('payment');
export const medicineApi = getApiInstance('medicine');

export default {
  getApiInstance,
  authApi,
  roomApi,
  serviceApi,
  userApi,
  scheduleApi,
  medicineApi,
};
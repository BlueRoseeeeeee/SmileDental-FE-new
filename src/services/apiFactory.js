/**
 * @author: HoTram
 * API Factory - Tạo axios instances cho các microservices khác nhau
 */
import axios from 'axios';
import { toast } from './toastService.js';

// ⚠️ HARDCODED Configuration - Directly pointing to production backend
// Configuration cho các microservices
const MICROSERVICES_CONFIG = {
  auth: {
    baseURL: 'https://be.smilecare.io.vn/api',
    timeout: 30000, // 30s
  },
  room: {
    baseURL: 'https://be.smilecare.io.vn/api',
    timeout: 30000, // 30s
  },
  service: {
    baseURL: 'https://be.smilecare.io.vn/api',
    timeout: 30000, // 30s
  },
  user: {
    baseURL: 'https://be.smilecare.io.vn/api',
    timeout: 30000, // 30s
  },
  schedule: {
    baseURL: 'https://be.smilecare.io.vn/api',
    timeout: 30000, // 30s
  },
  appointment: {
    baseURL: 'https://be.smilecare.io.vn/api',
    timeout: 30000, // 30s
  },
  payment: {
    baseURL: 'https://be.smilecare.io.vn/api',
    timeout: 30000, // 30s
  },
  medicine: {
    baseURL: 'https://be.smilecare.io.vn/api',
    timeout: 30000, // 30s
  },
  record: {
    baseURL: 'https://be.smilecare.io.vn',
    timeout: 30000, // 30s
  },
  invoice: {
    baseURL: 'https://be.smilecare.io.vn/api/invoice',
    timeout: 30000, // 30s
  },
  statistic: {
    baseURL: 'https://be.smilecare.io.vn/api',
    timeout: 30000, // 30s
  },
  chatbot: {
    baseURL: 'https://be.smilecare.io.vn/api',
    timeout: 30000, // 30s
  },
  statistic: {
    baseURL: import.meta.env.VITE_STATISTIC_API_URL || 'http://localhost:3011/api',
    timeout: 30000, // 30s
  },
  appointment: {
    baseURL: import.meta.env.VITE_APPOINTMENT_API_URL || 'http://localhost:3006/api',
    timeout: 30000, // 30s
  },
  chatbot: {
    baseURL: import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:3013/api',
    timeout: 30000, // 30s
  }
};

// Log để debug
console.log('🔧 [apiFactory] Hardcoded baseURLs:', Object.fromEntries(
  Object.entries(MICROSERVICES_CONFIG).map(([k, v]) => [k, v.baseURL])
));

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
      
      // ✅ CRITICAL FIX: If sending FormData, remove Content-Type header
      // Browser will automatically set it with correct boundary
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
        console.log('🔧 [apiFactory] Removed Content-Type header for FormData upload');
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

        //  IMPORTANT: Bỏ qua 401 từ login/register endpoint (đó là lỗi sai mật khẩu, không phải token hết hạn)
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                              originalRequest.url?.includes('/auth/register') ||
                              originalRequest.url?.includes('/auth/refresh');
        
        if (isAuthEndpoint) {
          // Đây là lỗi login/register, không phải token hết hạn
          // Component Login/Register sẽ tự xử lý message lỗi
          return Promise.reject(error);
        }
        const refreshToken = localStorage.getItem('refreshToken');
        
        try {
          // Try to refresh token
          if (refreshToken) {
            console.log(' Attempting to refresh token...');
            
            // Call refresh token endpoint
            const refreshResponse = await axios.post(
              `${MICROSERVICES_CONFIG.auth.baseURL}/auth/refresh`,
              { refreshToken }
            );

            if (refreshResponse.data?.accessToken) {
              console.log(' Token refresh successful');
              
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
            console.error(' No refresh token found in localStorage');
          }
        } catch (refreshError) {
          console.error(' Token refresh failed:', refreshError.response?.data || refreshError.message);
        }
        
        // Chỉ hiển thị thông báo token hết hạn khi thực sự là token hết hạn
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 4000);
        
        // Clear tokens và auth data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('selectedRole');
        
        // Đợi một chút để user thấy thông báo trước khi redirect
        setTimeout(() => {
          // Redirect to login
          window.location.href = '/login';
        }, 2000); // Đợi 2 giây để user thấy thông báo
        
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

  // Tạo instance mới và     cache
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
export const statisticApi = getApiInstance('statistic');
export const appointmentApi = getApiInstance('appointment');
export const chatbotApi = getApiInstance('chatbot');

export default {
  getApiInstance,
  authApi,
  roomApi,
  serviceApi,
  userApi,
  scheduleApi,
  medicineApi,
};
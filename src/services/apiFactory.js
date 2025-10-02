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
      // Trực tiếp get token từ localStorage để tránh circular dependency
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

      // Handle 401 Unauthorized & 403 Forbidden (token expired/invalid)
      if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
        originalRequest._retry = true;

        // Clear invalid tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Redirect to login
        window.location.href = '/login';
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

export default {
  getApiInstance,
  authApi,
  roomApi,
  serviceApi,
  userApi,
};
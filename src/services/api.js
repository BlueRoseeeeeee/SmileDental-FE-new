/*
 * Compatibility API wrapper
 * Many legacy services import './api' — create a small default axios instance
 * HARDCODED to production backend
 */
import axios from 'axios';
import { toast } from 'react-toastify';

// ⚠️ HARDCODED - Directly pointing to production backend
const API_BASE_URL = 'https://be.smilecare.io.vn/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30s
});

// Log để debug
console.log('🔧 [API Config] Hardcoded baseURL:', API_BASE_URL);

// Request interceptor: add token if present in localStorage
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }

      // If sending FormData, let browser set Content-Type boundary
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
    } catch (e) {
      // ignore (e.g., SSR or tests without localStorage)
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: simple handling for 401/403 to redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        // Clear all auth data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('selectedRole');
        
        // Show warning message (if running in browser)
        if (typeof window !== 'undefined') {
          toast.warn(' Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          // Redirect to login page
          window.location.href = '/login';
        }
      } catch (e) {
        console.error('Error during 401 handling:', e);
      }
    }
    
    // Xử lý 403 với thông báo "Invalid or expired token"
    if (error?.response?.status === 403) {
      const message = error?.response?.data?.message;
      if (message === 'Invalid or expired token') {
        try {
          
          // Clear all auth data từ localStorage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('selectedRole');
          
          // Show error message
          if (typeof window !== 'undefined') {
            toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            // Redirect to login page
            setTimeout(() => {
              window.location.href = '/login';
            }, 4000);
          }
        } catch (e) {
          console.error('Error during 403 handling:', e);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

/*
 * Compatibility API wrapper
 * Many legacy services import './api' — create a small default axios instance
 * Uses VITE_STATISTIC_API_URL for statistics endpoints
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_STATISTIC_API_URL || import.meta.env.VITE_API_URL || 'https://be.smilecare.io.vn/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30s
});

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

// Response interceptor: simple handling for 401 to redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Redirect to login page
        window.location.href = '/login';
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

export default api;

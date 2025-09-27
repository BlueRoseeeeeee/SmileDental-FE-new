/*
* @author: HoTram
*/
import axios from 'axios';
import { authService } from './authService.js';

// Base API URL - Update to match your backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor để thêm token
api.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await authService.refreshTokenIfNeeded();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        // Token refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(originalRequest);
      }
    }

    // Handle 403 Forbidden (insufficient permissions)
    if (error.response?.status === 403) {
      // Forbidden access
    }

    // Handle network errors
    if (!error.response) {
      // Network error occurred
    }

    return Promise.reject(error);
  }
);

export default api;
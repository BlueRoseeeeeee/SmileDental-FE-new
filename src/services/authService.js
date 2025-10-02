/*
* @author: HoTram
*/
import { authApi } from './apiFactory.js';

// Authentication Service
export const authService = {
  // Send OTP for registration
  sendOtpRegister: async (email) => {
    const response = await authApi.post('/auth/send-otp-register', { email });
    return response.data;
  },

  // Send OTP for password reset
  sendOtpResetPassword: async (email) => {
    const response = await authApi.post('/auth/send-otp-reset-password', { email });
    return response.data;
  },

  // Register user with OTP verification
  register: async (userData) => {
    const response = await authApi.post('/auth/register', userData);
    return response.data;
  },

  // Login user (supports email or employeeCode)
  login: async (credentials) => {
    const response = await authApi.post('/auth/login', credentials);
    const { accessToken, refreshToken, user } = response.data;
    
    // Save tokens and user info to localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  },

  // Logout user with refresh token
  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await authApi.post('/auth/logout', { refreshToken });
      } catch {
        // Silently handle logout API errors
      }
    }
    
    // Clear tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authToken'); // Remove authToken if exists
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberLogin');
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    const response = await authApi.post('/auth/refresh', { refreshToken });
    const { accessToken } = response.data;
    
    // Update access token in localStorage
    localStorage.setItem('accessToken', accessToken);
    
    return response.data;
  },

  // Change password (requires current password)
  changePassword: async (passwordData) => {
    const response = await authApi.post('/auth/change-password', passwordData);
    return response.data;
  },

  // Reset password with OTP
  resetPassword: async (resetData) => {
    const response = await authApi.post('/auth/reset-password', resetData);
    return response.data;
  },

  // Verify OTP for registration
  verifyOtp: async (otp, email) => {
    const response = await authApi.post('/auth/verify-otp-register', { email, otp });
    return response.data;
  },

  // Auto refresh token when needed
  refreshTokenIfNeeded: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      // Reuse existing refreshToken method for consistency
      const response = await authService.refreshToken(refreshToken);
      return response.accessToken;
    } catch {
      // If refresh fails, logout user
      await authService.logout();
      return false;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get access token
  getAccessToken: () => {
    return localStorage.getItem('accessToken');
  },

  // Get refresh token
  getRefreshToken: () => {
    return localStorage.getItem('refreshToken');
  },

  // Update user info in localStorage
  updateUserInfo: (userData) => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    }
    return null;
  },

  // Clear all auth data
  clearAuthData: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

export default authService;

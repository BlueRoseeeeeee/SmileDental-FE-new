/*
* @author: HoTram
*/
import api from './api.js';

// Auth Service - Updated to match backend API
export const authService = {
  // Gửi OTP cho đăng ký
  sendOtpRegister: async (email) => {
    const response = await api.post('/auth/send-otp-register', { email });
    return response.data;
  },

  // Gửi OTP cho reset password
  sendOtpResetPassword: async (email) => {
    const response = await api.post('/auth/send-otp-reset-password', { email });
    return response.data;
  },

  // Đăng ký với OTP verification
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Đăng nhập (hỗ trợ email hoặc employeeCode)
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const { accessToken, refreshToken, user } = response.data;
    
    // Lưu tokens và user info vào localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  },

  // Đăng xuất với refresh token
  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch {
        // Silently handle logout API errors
      }
    }
    
    // Xóa tokens khỏi localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authToken'); // Remove authToken if exists
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberLogin');
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    const { accessToken } = response.data;
    
    // Update access token in localStorage
    localStorage.setItem('accessToken', accessToken);
    
    return response.data;
  },

  // Đổi mật khẩu (yêu cầu mật khẩu hiện tại)
  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  },

  // Reset mật khẩu với OTP
  resetPassword: async (resetData) => {
    const response = await api.post('/auth/reset-password', resetData);
    return response.data;
  },

  // Verify OTP for registration
  verifyOtp: async (otp, email) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  // Auto refresh token when needed
  refreshTokenIfNeeded: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await authService.refreshToken(refreshToken);
      return response.accessToken;
    } catch (error) {
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

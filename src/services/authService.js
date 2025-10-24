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
    // 🆕 Nhiệm vụ 3.2: Tự động phát hiện role dựa vào format của login
    // Email: có @
    // EmployeeCode: NV00000001 format
    const { login: loginValue, password, remember } = credentials;
    
    let role = null;
    if (loginValue) {
      // Nếu có @ → patient (email)
      if (loginValue.includes('@')) {
        role = 'patient';
      } 
      // Nếu bắt đầu bằng NV và 8 số → staff
      else if (/^NV\d{8}$/.test(loginValue)) {
        role = 'staff'; // BE sẽ tìm trong tất cả staff roles
      }
    }
    
    const response = await authApi.post('/auth/login', {
      login: loginValue,
      password,
      role // 🆕 Gửi role cho BE
    });
    
    const { accessToken, refreshToken, user } = response.data;
    
    // Kiểm tra trạng thái tài khoản
    if (!user.isActive) {
      // Import và hiển thị toast ngay lập tức
      const { toast } = await import('./toastService.js');
      toast.error('Tài khoản đã bị tạm khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.');
      
      // Throw error đặc biệt để AuthContext biết không cần hiển thị Alert
      const error = new Error('ACCOUNT_DISABLED');
      error.isAccountDisabled = true;
      throw error;
    }
    
    // 🆕 Kiểm tra isFirstLogin - nếu true, trả về flag để FE xử lý
    if (user.isFirstLogin) {
      response.data.requirePasswordChange = true;
    }
    
    // 🆕 Kiểm tra specialties - nếu có nhiều hơn 1, yêu cầu chọn
    if (user.specialties && Array.isArray(user.specialties) && user.specialties.length > 1) {
      response.data.requireSpecialtySelection = true;
    }
    
    // Save tokens and user info to localStorage
    // 🆕 Chỉ lưu tạm thời nếu cần đổi mật khẩu hoặc chọn specialty
    if (remember && !response.data.requirePasswordChange && !response.data.requireSpecialtySelection) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    } else if (!response.data.requirePasswordChange && !response.data.requireSpecialtySelection) {
      // Không remember → dùng sessionStorage
      sessionStorage.setItem('accessToken', accessToken);
      sessionStorage.setItem('refreshToken', refreshToken);
      sessionStorage.setItem('user', JSON.stringify(user));
    } else {
      // Cần đổi mật khẩu hoặc chọn specialty → lưu tạm vào sessionStorage
      sessionStorage.setItem('tempAccessToken', accessToken);
      sessionStorage.setItem('tempRefreshToken', refreshToken);
      sessionStorage.setItem('tempUser', JSON.stringify(user));
    }
    
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
  },

  // 🆕 Nhiệm vụ 3.2: Complete login sau khi đổi mật khẩu hoặc chọn specialty
  completeLogin: (remember = false) => {
    const tempAccessToken = sessionStorage.getItem('tempAccessToken');
    const tempRefreshToken = sessionStorage.getItem('tempRefreshToken');
    const tempUser = sessionStorage.getItem('tempUser');
    
    if (!tempAccessToken || !tempUser) {
      throw new Error('No temporary login data found');
    }
    
    // Move from temp to permanent storage
    if (remember) {
      localStorage.setItem('accessToken', tempAccessToken);
      localStorage.setItem('refreshToken', tempRefreshToken);
      localStorage.setItem('user', tempUser);
    } else {
      sessionStorage.setItem('accessToken', tempAccessToken);
      sessionStorage.setItem('refreshToken', tempRefreshToken);
      sessionStorage.setItem('user', tempUser);
    }
    
    // Clear temp data
    sessionStorage.removeItem('tempAccessToken');
    sessionStorage.removeItem('tempRefreshToken');
    sessionStorage.removeItem('tempUser');
    
    return JSON.parse(tempUser);
  },

  // 🆕 Get temporary user (khi đang trong trạng thái chờ đổi mật khẩu/chọn specialty)
  getTempUser: () => {
    const tempUser = sessionStorage.getItem('tempUser');
    return tempUser ? JSON.parse(tempUser) : null;
  }
};

export default authService;

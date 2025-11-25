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
    const { login: loginValue, password, remember } = credentials;
    
    console.log('🔵 [authService] Login request:', { 
      loginValue, 
      hasPassword: !!password,
      remember 
    });
    
    try {
      const response = await authApi.post('/auth/login', {
        login: loginValue,
        password
        // ❌ Không gửi role - để backend tự tìm user
      });
      
      console.log('✅ [authService] Login API success - RAW response:', response);
      console.log('✅ [authService] Login API success - response.data:', response.data);
      console.log('📋 [authService] response.data.pendingData:', response.data.pendingData);
      console.log('📋 [authService] typeof response.data.pendingData:', typeof response.data.pendingData);
      
      // ✅ Check if has pendingData (multiple roles, first login, etc)
      if (response.data.pendingData) {
        console.log('📋 [authService] Has pendingData:', response.data.pendingData);
        console.log('🎯 [authService] RETURNING response.data (with pendingData)');
        return response.data;
      }
      
      console.log('🎯 [authService] NO pendingData - processing normal login');
      
      const { accessToken, refreshToken, user } = response.data;
      
      console.log('✅ [authService] Extracted data:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasUser: !!user,
        userRole: user?.role,
        userRoles: user?.roles,
        isActive: user?.isActive,
        isFirstLogin: user?.isFirstLogin
      });
      
      // Backend đã kiểm tra isActive, nếu tài khoản bị khóa sẽ throw error
      // Error handling sẽ được xử lý ở catch block bên dưới
      
      // 🆕 Kiểm tra isFirstLogin - nếu true, trả về flag để FE xử lý
      if (user.isFirstLogin) {
        response.data.requirePasswordChange = true;
      }
      
      // 🆕 Kiểm tra specialties - nếu có nhiều hơn 1, yêu cầu chọn
      if (user.specialties && Array.isArray(user.specialties) && user.specialties.length > 1) {
        response.data.requireSpecialtySelection = true;
      }
      
      // Save tokens and user info to localStorage
      //  LUÔN LƯU VÀO localStorage (checkbox "remember" chỉ ảnh hưởng token expiry ở backend)
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
       // Nếu người dùng chỉ có 1 role -> tự động lưu role đó vào localStorage.
       // Nếu người dùng có nhiều role -> chờ người dùng chọn (xử lý tại Login.jsx).
      /// Lấy danh sách role của người dùng, đảm bảo luôn là mảng (array)
      const userRoles = user.roles || (user.role ? [user.role] : []);
      // Trường hợp người dùng chỉ có 1 role: tự động chọn và lưu lại
      if (userRoles.length === 1) {
        localStorage.setItem('selectedRole', userRoles[0]);
      } else if (userRoles.length > 1) {
        //  Trường hợp có nhiều role: chưa lưu gì, chờ người dùng chọn ở màn hình Login
         console.log('[authService] Phát hiện nhiều role - cần người dùng chọn sau');
      }
      return response.data;
    } catch (error) {
      console.error('❌ [authService] Login API error - Full error:', error);
      console.error('❌ [authService] Login API error - message:', error.message);
      console.error('❌ [authService] Login API error - response:', error.response);
      console.error('❌ [authService] Login API error - response.data:', error.response?.data);
      console.error('❌ [authService] Login API error - response.status:', error.response?.status);
      throw error;
    }
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
    localStorage.removeItem('selectedRole'); // ✅ Clear selected role on logout
    
    //Clear any booking/appointment data from previous session
    localStorage.removeItem('booking_service');
    localStorage.removeItem('booking_serviceAddOn');
    localStorage.removeItem('booking_dentist');
    localStorage.removeItem('booking_recordId');
    
    console.log('✅ [authService] Logout complete - all data cleared');
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
    localStorage.removeItem('selectedRole'); // ✅ Clear selected role
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
  },

  // 🆕 Select role (for users with multiple roles)
  selectRole: async (tempToken, selectedRole) => {
    console.log('🔵 [authService] Selecting role:', { tempToken, selectedRole });
    const response = await authApi.post('/auth/select-role', {
      tempToken,
      selectedRole
    });
    console.log('✅ [authService] Select role response:', response.data);
    
    const { accessToken, refreshToken, user } = response.data;
    
    // Save tokens and user to localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    // ✅ Save selected role for future reference
    localStorage.setItem('selectedRole', selectedRole);
    
    return response.data;
  },

  // 🆕 Complete forced password change (default password or first login)
  completePasswordChange: async (tempToken, newPassword, confirmPassword) => {
    console.log('🔵 [authService] Completing password change');
    const response = await authApi.post('/auth/complete-password-change', {
      tempToken,
      newPassword,
      confirmPassword
    });
    console.log('✅ [authService] Password change response:', response.data);
    
    // ✅ Check if role selection is required (multi-role user)
    if (response.data.pendingData?.requiresRoleSelection) {
      console.log('🔄 [authService] Role selection required');
      return response.data; // Return pendingData with requiresRoleSelection
    }
    
    // ✅ Single role user - save tokens
    const { accessToken, refreshToken, user } = response.data;
    
    // Save tokens and user to localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    // ✅ Save selectedRole for single-role users
    const userRoles = user.roles || (user.role ? [user.role] : []);
    if (userRoles.length === 1) {
      localStorage.setItem('selectedRole', userRoles[0]);
      console.log('💾 [authService] Auto-selected role after password change:', userRoles[0]);
    }
    
    return response.data;
  }
};

export default authService;

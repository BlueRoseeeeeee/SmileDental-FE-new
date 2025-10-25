/*
* @author: HoTram
* 
*/
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      // Get token and user from localStorage
      const token = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setIsAuthenticated(true);
          setUser(parsedUser);
        } catch {
          // Clear invalid data
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          localStorage.removeItem('refreshToken');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
 
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call your existing authService (đã tự lưu localStorage)
      const { authService } = await import('../services/authService.js');
      
      console.log('🔵 [AuthContext] Calling authService.login with:', { 
        login: credentials.login, 
        hasPassword: !!credentials.password,
        remember: credentials.remember 
      });
      
      const response = await authService.login(credentials);
      
      console.log('✅ [AuthContext] Login response:', {
        hasUser: !!response.user,
        hasAccessToken: !!response.accessToken,
        hasPendingData: !!response.pendingData,
        userRole: response.user?.role,
        userRoles: response.user?.roles
      });
      console.log('✅ [AuthContext] Full response:', response);
      console.log('📋 [AuthContext] response.pendingData:', response.pendingData);
      
      // 🆕 Nhiệm vụ 3.2: Nếu có pendingData, không cập nhật state (chưa hoàn tất login)
      if (response.pendingData) {
        console.log('🎯 [AuthContext] HAS PENDING DATA - returning to Login.jsx');
        setLoading(false);
        return response; // Return pendingData to Login.jsx
      }
      
      console.log('🎯 [AuthContext] NO PENDING DATA - completing login');
      
      // Update state (không cần lưu localStorage nữa vì authService đã lưu)
      setIsAuthenticated(true);
      setUser(response.user);
      setLoading(false);
      
      return response;
    } catch (error) {
      console.error('❌ [AuthContext] Login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        isAccountDisabled: error.isAccountDisabled
      });
      
      // Không hiển thị Alert nếu là lỗi tài khoản bị khóa (đã có toast)
      if (!error.isAccountDisabled) {
        setError(error.response?.data?.message || error.message || 'Đăng nhập thất bại');
      }
      setLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call your existing authService (đã tự xóa localStorage)
      const { authService } = await import('../services/authService.js');
      await authService.logout();
    } catch {
      // Handle error silently or log if needed
    } finally {
      // Update state (không cần xóa localStorage nữa vì authService đã xóa)
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Send OTP for registration
  const sendOtpRegister = async (email) => {
    try {
      setLoading(true);
      setError(null);
      const { authService } = await import('../services/authService.js');
      const response = await authService.sendOtpRegister(email);
      setLoading(false);
      return response;
    } catch (error) {
      setError(error.response?.data?.message || 'Gửi OTP thất bại');
      setLoading(false);
      throw error;
    }
  };

  // Verify OTP
  const verifyOtp = async (otp, email) => {
    try {
      setLoading(true);
      setError(null);
      const { authService } = await import('../services/authService.js');
      const response = await authService.verifyOtp(otp, email);
      setLoading(false);
      return response;
    } catch (error) {
      setError(error.response?.data?.message || 'Xác thực OTP thất bại');
      setLoading(false);
      throw error;
    }
  };

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const { authService } = await import('../services/authService.js');
      const response = await authService.register(userData);
      setLoading(false);
      return response;
    } catch (error) {
      setError(error.response?.data?.message || 'Đăng ký thất bại');
      setLoading(false);
      throw error;
    }
  };

  // Send OTP for reset password
  const sendOtpResetPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      const { authService } = await import('../services/authService.js');
      const response = await authService.sendOtpResetPassword(email);
      setLoading(false);
      return response;
    } catch (error) {
      setError(error.response?.data?.message || 'Gửi OTP thất bại');
      setLoading(false);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (resetData) => {
    try {
      setLoading(true);
      setError(null);
      const { authService } = await import('../services/authService.js');
      const response = await authService.resetPassword(resetData);
      setLoading(false);
      return response;
    } catch (error) {
      setError(error.response?.data?.message || 'Reset mật khẩu thất bại');
      setLoading(false);
      throw error;
    }
  };

  // Update user info
  const updateUser = async (userData) => {
    try {
      // Update user in localStorage and state
      const updatedUser = { ...user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  // 🆕 Nhiệm vụ 3.2: Complete login after password change or specialty selection
  const completeLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    clearError,
    sendOtpRegister,
    verifyOtp,
    register,
    sendOtpResetPassword,
    resetPassword,
    updateUser,
    completeLogin // 🆕 Export completeLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

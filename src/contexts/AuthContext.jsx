/*
* @author: HoTram
*/
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService.js';

// Auth Context
const AuthContext = createContext(null);

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        error: null,
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Kiểm tra localStorage trước (ghi nhớ đăng nhập)
      let token = localStorage.getItem('accessToken');
      let userData = localStorage.getItem('userData');
      
      // Nếu không có trong localStorage, kiểm tra sessionStorage
      if (!token) {
        token = sessionStorage.getItem('accessToken');
      }
      
      // Nếu có token và user data
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          
          // Kiểm tra token validity với backend (optional)
          try {
          } catch (error) {
            
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('rememberLogin');
            sessionStorage.removeItem('accessToken');
            return;
          }
          
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user },
          });
        } catch (error) {
          console.error('Error parsing user data:', error);
          // Xóa dữ liệu không hợp lệ
          localStorage.removeItem('accessToken');
          localStorage.removeItem('userData');
          localStorage.removeItem('rememberLogin');
          sessionStorage.removeItem('accessToken');
        }
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authService.login(credentials);
      
      // Xử lý ghi nhớ đăng nhập
      if (credentials.remember) {
        // Lưu token vào localStorage để ghi nhớ
        localStorage.setItem('accessToken', response.token);
        localStorage.setItem('rememberLogin', 'true');
        localStorage.setItem('userData', JSON.stringify(response.user));
      } else {
        // Chỉ lưu vào sessionStorage (sẽ mất khi đóng browser)
        sessionStorage.setItem('accessToken', response.token);
        localStorage.removeItem('rememberLogin');
        localStorage.removeItem('userData');
      }
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.user },
      });
      return response;
    } catch (error) {
      dispatch({
        type: 'LOGIN_ERROR',
        payload: error.response?.data?.message || 'Đăng nhập thất bại',
      });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Xóa tất cả dữ liệu authentication
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('rememberLogin');
      sessionStorage.removeItem('accessToken');
      
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await authService.register(userData);
      dispatch({ type: 'SET_LOADING', payload: false });
      return response;
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.message || 'Đăng ký thất bại',
      });
      throw error;
    }
  };

  // Send OTP functions
  const sendOtpRegister = async (email) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await authService.sendOtpRegister(email);
      dispatch({ type: 'SET_LOADING', payload: false });
      return response;
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.message || 'Gửi OTP thất bại',
      });
      throw error;
    }
  };

  const sendOtpResetPassword = async (email) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await authService.sendOtpResetPassword(email);
      dispatch({ type: 'SET_LOADING', payload: false });
      return response;
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.message || 'Gửi OTP thất bại',
      });
      throw error;
    }
  };

  // Verify OTP function
  const verifyOtp = async (otp, email) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await authService.verifyOtp(otp, email);
      dispatch({ type: 'SET_LOADING', payload: false });
      return response;
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.message || error.message || 'Xác thực OTP thất bại',
      });
      throw error;
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await authService.changePassword(passwordData);
      dispatch({ type: 'SET_LOADING', payload: false });
      return response;
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.message || 'Đổi mật khẩu thất bại',
      });
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (resetData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await authService.resetPassword(resetData);
      dispatch({ type: 'SET_LOADING', payload: false });
      return response;
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.message || 'Đặt lại mật khẩu thất bại',
      });
      throw error;
    }
  };

  // Update user info
  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
    // Also update localStorage
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      localStorage.setItem('user', JSON.stringify({ ...currentUser, ...userData }));
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Clear remember login
  const clearRememberLogin = () => {
    localStorage.removeItem('rememberLogin');
    localStorage.removeItem('userData');
    localStorage.removeItem('accessToken');
  };

  const value = {
    ...state,
    login,
    logout,
    register,
    sendOtpRegister,
    sendOtpResetPassword,
    verifyOtp,
    changePassword,
    resetPassword,
    updateUser,
    clearError,
    clearRememberLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
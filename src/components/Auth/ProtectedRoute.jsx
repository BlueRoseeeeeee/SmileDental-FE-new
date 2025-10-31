/*
* @author: HoTram
* 
*/
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #2596be',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#666', fontSize: '16px' }}>Đang kiểm tra xác thực...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user account is active
  if (user.isActive === false) { // ✅ Strict check - only logout if explicitly false
    console.error('🔴 ProtectedRoute: User account is INACTIVE', {
      userId: user._id,
      email: user.email,
      isActive: user.isActive
    });
    
    // Clear auth data and show toast notification
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Import toast service and show notification
    import('../../services/toastService.js').then(({ toast }) => {
      toast.error('Tài khoản đã bị tạm khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.');
    });
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 🔍 DEBUG: Log user active status
  if (user.isActive === undefined) {
    console.warn('⚠️ ProtectedRoute: user.isActive is UNDEFINED - allowing access', {
      userId: user._id,
      email: user.email,
      userKeys: Object.keys(user)
    });
  }

  // ✅ Get user roles
  const userRoles = user.roles || (user.role ? [user.role] : []);
  const isPatient = userRoles.includes('patient') && userRoles.length === 1;
  
  // 🚫 Block patient from accessing /dashboard and staff routes
  if (isPatient && location.pathname.startsWith('/dashboard')) {
    console.log('🚫 ProtectedRoute: Patient blocked from dashboard', {
      userRoles,
      path: location.pathname
    });
    return <Navigate to="/patient" replace />;
  }
  
  // Check if user has required role
  if (roles.length > 0) {
    // ✅ Support both roles array and legacy single role
    const hasAccess = userRoles.some(userRole => roles.includes(userRole));
    
    if (!hasAccess) {
      console.log('❌ ProtectedRoute: Access denied', {
        requiredRoles: roles,
        userRoles: userRoles,
        path: location.pathname
      });
      return <Navigate to="/unauthorized" replace />;
    }
  }

  console.log('✅ ProtectedRoute: Access granted', {
    requiredRoles: roles,
    userRoles: user.roles || [user.role],
    path: location.pathname
  });

  return children;
};

export default ProtectedRoute;

/*
 * @author: AI Assistant
 * Task 3.5 - Role-based Permission Guard
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

/**
 * PermissionGuard - HOC to protect routes based on user role
 * @param {Array} allowedRoles - Array of roles allowed to access
 * @param {React.Component} children - Component to render if authorized
 * @param {Boolean} redirectToHome - Redirect to home if unauthorized (default: show 403 page)
 */
const PermissionGuard = ({ allowedRoles = [], children, redirectToHome = false }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Still loading auth state
  if (loading) {
    return <div>Loading...</div>;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user role is in allowed roles
  const hasPermission = allowedRoles.includes(user.role);

  if (!hasPermission) {
    if (redirectToHome) {
      return <Navigate to="/dashboard" replace />;
    }

    // Show 403 Forbidden page
    return (
      <Result
        status="403"
        title="403"
        subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
        icon={<LockOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />}
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            Quay lại
          </Button>
        }
      />
    );
  }

  return children;
};

/**
 * hasPermission - Helper function to check permission
 * @param {Object} user - User object
 * @param {Array} allowedRoles - Array of allowed roles
 */
export const hasPermission = (user, allowedRoles = []) => {
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
};

/**
 * canManageUsers - Check if user can manage other users
 * Admin: Can manage ALL users (including other admins and themselves)
 * Manager: Can manage staff (dentist, nurse, receptionist) but NOT admin/manager
 */
export const canManageUsers = (currentUser, targetUser) => {
  if (!currentUser || !targetUser) return false;

  // ✅ Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const selectedRole = localStorage.getItem('selectedRole');
  const currentUserRoles = userData.roles || [];

  // ✅ Admin can manage ALL users (including other admins and themselves)
  if (selectedRole === 'admin' || currentUserRoles.includes('admin')) {
    return true;
  }

  // ✅ Manager cannot manage users with admin or manager in their roles
  if (selectedRole === 'manager' || currentUserRoles.includes('manager')) {
    const restrictedRoles = ['admin', 'manager'];
    const targetRoles = targetUser.roles || [targetUser.role];
    return !targetRoles.some(role => restrictedRoles.includes(role));
  }

  return false; // Other roles cannot manage users
};

/**
 * Role hierarchy for permission checking
 */
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DENTIST: 'dentist',
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist',
  PATIENT: 'patient'
};

/**
 * Permission presets for common use cases
 */
export const PERMISSIONS = {
  ADMIN_ONLY: ['admin'],
  ADMIN_MANAGER: ['admin', 'manager'],
  STAFF_ONLY: ['admin', 'manager', 'dentist', 'nurse', 'receptionist'],
  MEDICAL_STAFF: ['admin', 'manager', 'dentist', 'nurse'],
  DENTIST_ONLY: ['dentist'],
  ALL_USERS: ['admin', 'manager', 'dentist', 'nurse', 'receptionist', 'patient']
};

export default PermissionGuard;

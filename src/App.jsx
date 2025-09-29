/*
* @author: HoTram
*/
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';

// Auth Components
import Login from './components/Auth/Login.jsx';
import Register from './components/Auth/Register.jsx';
import ForgotPassword from './components/Auth/ForgotPassword.jsx';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';

// Layout
import DashboardLayout from './components/Layout/DashboardLayout.jsx';

// Pages
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import UserManagement from './components/User/UserManagement.jsx';
import EditUser from './pages/EditUser.jsx';
import DetailStaff from './pages/DetailStaff.jsx';
import CertificateManagement from './components/User/CertificateManagement.jsx';
import ChangePassword from './components/Auth/ChangePassword.jsx';

import { Result, Button } from 'antd';
import { 
  HomeOutlined, 
  LockOutlined, 
  SettingOutlined,
  CalendarOutlined,
  FileTextOutlined,
  HeartOutlined,
  ClockCircleOutlined,
  TeamOutlined
} from '@ant-design/icons';

// Error Pages
const NotFound = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Result
      status="404"
      title="404"
      subTitle="Xin lỗi, trang bạn truy cập không tồn tại."
      extra={
        <Button type="primary" icon={<HomeOutlined />} href="/dashboard">
          Về trang chủ
        </Button>
      }
    />
  </div>
);

const Unauthorized = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Result
      status="403"
      title="403"
      subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
      extra={
        <Button type="primary" icon={<LockOutlined />} href="/dashboard">
          Về trang chủ
        </Button>
      }
    />
  </div>
);

// Placeholder pages for development
const Settings = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <SettingOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#262626', margin: 0 }}>Cài đặt</h1>
    </div>
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <p style={{ color: '#8c8c8c', margin: 0 }}>Trang cài đặt sẽ được phát triển ở đây...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            {/* Default redirect */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard */}
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Profile */}
            <Route path="profile" element={<Profile />} />
            
            {/* Change Password */}
            <Route path="change-password" element={<ChangePassword />} />
            
            {/* Admin/Manager routes */}
            <Route path="users" element={<UserManagement />} />
            <Route path="users/edit/:id" element={<EditUser />} />
            <Route path="users/detail/:id" element={<DetailStaff />} />
            
            {/* Certificate Management (Dentist only) */}
            <Route path="certificates" element={
              <ProtectedRoute roles={['dentist']}>
                <CertificateManagement />
              </ProtectedRoute>
            } />
            
            {/* Settings */}
            <Route path="settings" element={<Settings />} />
            
            
            {/* Placeholder routes for future development */}
            <Route path="appointments" element={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CalendarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                  <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#262626', margin: 0 }}>Lịch hẹn</h1>
                </div>
                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <p style={{ color: '#8c8c8c', margin: 0 }}>Đang phát triển...</p>
                </div>
              </div>
            } />
            
            <Route path="patients" element={
              <ProtectedRoute roles={['dentist', 'nurse']}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <HeartOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#262626', margin: 0 }}>Quản lý bệnh nhân</h1>
                  </div>
                  <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <p style={{ color: '#8c8c8c', margin: 0 }}>Đang phát triển...</p>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="schedules" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ClockCircleOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#262626', margin: 0 }}>Quản lý lịch làm việc</h1>
                  </div>
                  <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <p style={{ color: '#8c8c8c', margin: 0 }}>Đang phát triển...</p>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="dentists" element={
              <ProtectedRoute roles={['patient']}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <TeamOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#262626', margin: 0 }}>Danh sách nha sĩ</h1>
                  </div>
                  <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <p style={{ color: '#8c8c8c', margin: 0 }}>Đang phát triển...</p>
                  </div>
                </div>
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Error routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
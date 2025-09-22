
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
  <div className="min-h-screen flex items-center justify-center">
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
  <div className="min-h-screen flex items-center justify-center">
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
  <div className="space-y-6">
    <div className="flex items-center space-x-3">
      <SettingOutlined className="text-2xl text-blue-600" />
      <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
    </div>
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <p className="text-gray-600">Trang cài đặt sẽ được phát triển ở đây...</p>
    </div>
  </div>
);

function App() {
  console.log('App component is rendering...');
  
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
            
            {/* Admin/Manager routes */}
            <Route path="users" element={<UserManagement />} />
            
            {/* Settings */}
            <Route path="settings" element={<Settings />} />
            
            {/* Placeholder routes for future development */}
            <Route path="appointments" element={
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <CalendarOutlined className="text-2xl text-blue-600" />
                  <h1 className="text-2xl font-bold text-gray-900">Lịch hẹn</h1>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <p className="text-gray-600">Đang phát triển...</p>
                </div>
              </div>
            } />
            
            <Route path="certificates" element={
              <ProtectedRoute roles={['dentist']}>
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <FileTextOutlined className="text-2xl text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý chứng chỉ</h1>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <p className="text-gray-600">Đang phát triển...</p>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="patients" element={
              <ProtectedRoute roles={['dentist', 'nurse']}>
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <HeartOutlined className="text-2xl text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý bệnh nhân</h1>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <p className="text-gray-600">Đang phát triển...</p>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="schedules" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <ClockCircleOutlined className="text-2xl text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý lịch làm việc</h1>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <p className="text-gray-600">Đang phát triển...</p>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="dentists" element={
              <ProtectedRoute roles={['patient']}>
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <TeamOutlined className="text-2xl text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Danh sách nha sĩ</h1>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <p className="text-gray-600">Đang phát triển...</p>
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

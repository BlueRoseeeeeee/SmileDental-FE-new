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
import HomepageLayout from './components/Layout/HomepageLayout.jsx';

// Pages
import Homepage from './pages/Homepage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import UserManagement from './components/User/UserManagement.jsx';
import EditUser from './pages/EditUser.jsx';
import DetailStaff from './pages/DetailStaff.jsx';
import CertificateManagement from './components/User/CertificateManagement.jsx';
import ChangePassword from './components/Auth/ChangePassword.jsx';
import RoomList from './pages/RoomList.jsx';
import RoomManagement from './pages/RoomManagement.jsx';
import ServiceList from './pages/ServiceList.jsx';
import ServiceDetails from './pages/ServiceDetails.jsx';
import AddService from './pages/AddService.jsx';
import EditService from './pages/EditService.jsx';
import AddServiceAddOn from './pages/AddServiceAddOn.jsx';
import EditServiceAddOn from './pages/EditServiceAddOn.jsx';
import PublicServiceAddOnDetail from './pages/PublicServiceAddOnDetail.jsx';
import PublicServiceAddOns from './pages/PublicServiceAddOns.jsx';

// Schedule Management
import ScheduleConfig from './pages/Schedule/ScheduleConfig.jsx';
import HolidayManagement from './pages/Schedule/HolidayManagement.jsx';
import ScheduleManagement from './pages/Schedule/ScheduleManagement.jsx';
import ScheduleCalendar from './pages/Schedule/ScheduleCalendar.jsx';
import StaffAssignment from './pages/Schedule/StaffAssignment.jsx';

import { Result, Button } from 'antd';
import { 
  HomeOutlined, 
  LockOutlined, 
  SettingOutlined,
  CalendarOutlined,
  HeartOutlined,
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
          {/* Public routes - Trang chủ công khai */}
          <Route path="/" element={
            <HomepageLayout>
              <Homepage />
            </HomepageLayout>
          } />
          <Route path="/login" element={
            <HomepageLayout>
              <Login />
            </HomepageLayout>
          } />
          <Route path="/register" element={
            <HomepageLayout>
              <Register />
            </HomepageLayout>
          } />
          <Route path="/forgot-password" element={
            <HomepageLayout>
              <ForgotPassword />
            </HomepageLayout>
          } />
           
           {/* Public Service AddOns Route */}
           <Route path="/services/pl/:serviceName/addons" element={
             <HomepageLayout>
               <PublicServiceAddOns />
             </HomepageLayout>
           } />
           
           {/* Public Service AddOn Detail Route */}
           <Route path="/services/pl/:serviceName/addons/:addOnName/detail" element={
             <HomepageLayout>
               <PublicServiceAddOnDetail />
             </HomepageLayout>
           } />
           
          
          {/* Protected routes - Dashboard cho người đã đăng nhập */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            {/* Default redirect cho dashboard */}
            <Route index element={<Dashboard />} />
          </Route>

          {/* Individual protected routes outside dashboard layout */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Profile />} />
          </Route>
          
          <Route path="/change-password" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ChangePassword />} />
          </Route>
          
          {/* Admin/Manager routes */}
          <Route path="/users" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<UserManagement />} />
          </Route>
          <Route path="/users/edit/:id" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<EditUser />} />
          </Route>
          <Route path="/users/detail/:id" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DetailStaff />} />
          </Route>
            
          {/* Room Management (Admin/Manager only) */}
          <Route path="/rooms" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<RoomList />} />
          </Route>
          <Route path="/rooms/:roomId" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<RoomManagement />} />
          </Route>
            
          {/* Service Management (Admin/Manager only) */}
          <Route path="/services" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ServiceList />} />
          </Route>
          <Route path="/services/:serviceId" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ServiceDetails />} />
          </Route>
          
          {/* Edit Service (Admin/Manager only) */}
          <Route path="/services/:serviceId/edit" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<EditService />} />
          </Route>
          
          {/* Add Service (Admin/Manager only) */}
          <Route path="/services/add" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AddService />} />
          </Route>
          
          {/* Add Service Add-On (Admin/Manager only) */}
          <Route path="/services/:serviceId/addons/add" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AddServiceAddOn />} />
          </Route>
          
          {/* Edit Service Add-On (Admin/Manager only) */}
          <Route path="/services/:serviceId/addons/:addOnId/edit" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<EditServiceAddOn />} />
          </Route>
            
          {/* Certificate Management (Dentist only) */}
          <Route path="/certificates" element={
            <ProtectedRoute roles={['dentist']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<CertificateManagement />} />
          </Route>
          
          {/* Settings */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Settings />} />
          </Route>
            
          {/* Placeholder routes for future development */}
          <Route path="/appointments" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={
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
          </Route>
            
          <Route path="/patients" element={
            <ProtectedRoute roles={['dentist', 'nurse']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <HeartOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                  <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#262626', margin: 0 }}>Quản lý bệnh nhân</h1>
                </div>
                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <p style={{ color: '#8c8c8c', margin: 0 }}>Đang phát triển...</p>
                </div>
              </div>
            } />
          </Route>
            
          {/* Schedule Management (Admin/Manager only) */}
          <Route path="/schedules" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ScheduleConfig />} />
          </Route>
          <Route path="/schedules/management" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ScheduleManagement />} />
          </Route>
          <Route path="/schedules/calendar" element={
            <ProtectedRoute roles={['admin', 'manager', 'dentist', 'nurse']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ScheduleCalendar />} />
          </Route>
          <Route path="/schedules/holidays" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<HolidayManagement />} />
          </Route>
          <Route path="/schedules/staff-assignment" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<StaffAssignment />} />
          </Route>
            
          <Route path="/dentists" element={
            <ProtectedRoute roles={['patient']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <TeamOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                  <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#262626', margin: 0 }}>Danh sách nha sĩ</h1>
                </div>
                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <p style={{ color: '#8c8c8c', margin: 0 }}>Đang phát triển...</p>
                </div>
              </div>
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
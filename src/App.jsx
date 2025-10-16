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
import PatientLayout from './components/Layout/PatientLayout.jsx';

// Pages
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

// Schedule Management
import ScheduleConfig from './pages/Schedule/ScheduleConfig.jsx';
import HolidayManagementPage from './pages/Schedule/HolidayManagementPage.jsx';
import ScheduleCalendar from './pages/Schedule/ScheduleCalendar.jsx';
import StaffAssignment from './pages/Schedule/StaffAssignment.jsx';
import StaffAssignmentNew from './pages/Schedule/StaffAssignmentNew.jsx';
import StaffAssignmentDetail from './pages/Schedule/StaffAssignmentDetail.jsx';
import AssignStaffForm from './pages/Schedule/AssignStaffForm.jsx';
import CreateScheduleForRoom from './pages/Schedule/CreateScheduleForRoom.jsx';
import StaffAssignmentUnified from './pages/Schedule/StaffAssignmentUnified.jsx';
import StaffReplacement from './pages/Schedule/StaffReplacement.jsx';

// Patient Pages
import BookingSelectService from './pages/Patient/BookingSelectService.jsx';
import BookingSelectDentist from './pages/Patient/BookingSelectDentist.jsx';
import BookingSelectDate from './pages/Patient/BookingSelectDate.jsx';
import BookingSelectTime from './pages/Patient/BookingSelectTime.jsx';
import CreateAppointment from './pages/Patient/CreateAppointment.jsx';
import PatientHomePage from './pages/Patient/HomePage.jsx';
import PatientProfile from './pages/Patient/PatientProfile.jsx';
import PatientAppointments from './pages/Patient/PatientAppointments.jsx';

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
          {/* Public routes - Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Patient Public Routes with Layout */}
          <Route path="/patient" element={<PatientLayout />}>
            <Route index element={<PatientHomePage />} />
            
            {/* Patient Booking Flow */}
            <Route path="booking">
              <Route index element={<Navigate to="/patient/booking/select-service" replace />} />
              <Route path="select-service" element={<BookingSelectService />} />
              <Route path="select-dentist" element={<BookingSelectDentist />} />
              <Route path="select-date" element={<BookingSelectDate />} />
              <Route path="select-time" element={<BookingSelectTime />} />
              <Route path="create-appointment" element={
                <ProtectedRoute>
                  <CreateAppointment />
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Patient Protected Routes */}
            <Route path="profile" element={
              <ProtectedRoute roles={['patient']}>
                <PatientProfile />
              </ProtectedRoute>
            } />
            <Route path="appointments" element={
              <ProtectedRoute roles={['patient']}>
                <PatientAppointments />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute roles={['patient']}>
                <Settings />
              </ProtectedRoute>
            } />
          </Route>
          
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
            
            {/* Room Management (Admin/Manager only) */}
            <Route path="rooms" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <RoomList />
              </ProtectedRoute>
            } />
            <Route path="rooms/:roomId" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <RoomManagement />
              </ProtectedRoute>
            } />
            
            {/* Service Management (Admin/Manager only) */}
            <Route path="services" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <ServiceList />
              </ProtectedRoute>
            } />
            <Route path="services/:serviceId" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <ServiceDetails />
              </ProtectedRoute>
            } />
            
            {/* Add Service (Admin/Manager only) */}
            <Route path="services/add" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <AddService />
              </ProtectedRoute>
            } />
            
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
            
            {/* Schedule Management (Admin/Manager only) */}
            <Route path="schedules" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <ScheduleConfig />
              </ProtectedRoute>
            } />
            <Route path="schedules/create-for-room" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <CreateScheduleForRoom />
              </ProtectedRoute>
            } />
            <Route path="schedules/calendar" element={
              <ProtectedRoute roles={['admin', 'manager', 'dentist', 'nurse']}>
                <ScheduleCalendar />
              </ProtectedRoute>
            } />
            <Route path="schedules/holidays" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <HolidayManagementPage />
              </ProtectedRoute>
            } />
            <Route path="schedules/staff-assignment" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <StaffAssignmentUnified />
              </ProtectedRoute>
            } />
            <Route path="schedules/staff-assignment/detail" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <StaffAssignmentDetail />
              </ProtectedRoute>
            } />
            <Route path="schedules/staff-assignment/assign" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <AssignStaffForm />
              </ProtectedRoute>
            } />
            <Route path="schedules/staff-assignment-unified" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <StaffAssignmentUnified />
              </ProtectedRoute>
            } />
            <Route path="schedules/staff-replacement" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <StaffReplacement />
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
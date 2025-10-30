/*
* @author: HoTram
*/
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntApp } from 'antd'; // 🆕 Import App từ antd
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { ToastContainer } from 'react-toastify';

// Auth Components
import Login from './components/Auth/Login.jsx';
import Register from './components/Auth/Register.jsx';
import ForgotPassword from './components/Auth/ForgotPassword.jsx';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';

// Layout
import DashboardLayout from './components/Layout/DashboardLayout.jsx';
import PatientLayout from './components/Layout/PatientLayout.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import HomepageLayout from './components/Layout/HomepageLayout.jsx';

// Pages
import Homepage from './pages/Homepage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import UserManagement from './components/User/UserManagement.jsx';
import CertificateManagement from './components/User/CertificateManagement.jsx';
import EditUser from './pages/EditUser.jsx';
import DetailStaff from './pages/DetailStaff.jsx';
import ChangePassword from './components/Auth/ChangePassword.jsx';
import RoomList from './pages/RoomList.jsx';
import ServiceList from './pages/ServiceList.jsx';
import ServiceDetails from './pages/ServiceDetails.jsx';
import AddService from './pages/AddService.jsx';
import EditService from './pages/EditService.jsx';
import AddServiceAddOn from './pages/AddServiceAddOn.jsx';
import EditServiceAddOn from './pages/EditServiceAddOn.jsx';
import PublicServiceAddOnDetail from './pages/PublicServiceAddOnDetail.jsx';
import PublicServiceAddOns from './pages/PublicServiceAddOns.jsx';
import PublicDentistDetail from './pages/PublicDentistDetail.jsx';

// Admin - Patient Appointments Management
import AdminPatientAppointments from './pages/Admin/PatientAppointments.jsx';

// Admin - Patient Management
import PatientManagement from './pages/Admin/PatientManagement.jsx';

// Admin - Appointment Management (All appointments)
import AppointmentManagement from './pages/Admin/AppointmentManagement.jsx';

// Cash Payment & Walk-in
import CashPaymentModal from './components/CashPayment/CashPaymentModal.jsx';
import WalkInAppointmentForm from './components/CashPayment/WalkInAppointmentForm.jsx';

// Medical Records Management
import QueueDashboard from './pages/QueueDashboard.jsx';
import QueueManagement from './pages/Staff/QueueManagement.jsx'; // 🔥 New Queue UI
import StaffSchedule from './pages/Staff/StaffSchedule.jsx'; // 🔥 Staff Schedule View
import RecordList from './pages/Records/RecordList.jsx';
import RecordFormModal from './pages/Records/RecordFormModal.jsx';
import PrescriptionForm from './pages/Records/PrescriptionForm.jsx';
import RecordDetailDrawer from './pages/Records/RecordDetailDrawer.jsx';

// Invoice Management
import InvoiceList from './pages/Invoices/InvoiceList.jsx';
import InvoiceFormModal from './pages/Invoices/InvoiceFormModal.jsx';
import InvoiceDetailDrawer from './pages/Invoices/InvoiceDetailDrawer.jsx';
import InvoiceTemplate from './pages/Invoices/InvoiceTemplate.jsx';

// Payment Management
import PaymentList from './pages/Payment/PaymentList.jsx';

// Statistics Dashboard
import StatisticsDashboard from './pages/Statistics/StatisticsDashboard.jsx';

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
import BookingSelectAddOn from './pages/Patient/BookingSelectAddOn.jsx';
import BookingSelectDentist from './pages/Patient/BookingSelectDentist.jsx';
import BookingSelectDate from './pages/Patient/BookingSelectDate.jsx';
import BookingSelectTime from './pages/Patient/BookingSelectTime.jsx';
import CreateAppointment from './pages/Patient/CreateAppointment.jsx';
import PatientHomePage from './pages/Patient/HomePage.jsx';
import PatientProfile from './pages/Patient/PatientProfile.jsx';
import PatientAppointments from './pages/Patient/PatientAppointments.jsx';
import PatientRecords from './pages/Patient/PatientRecords.jsx';
import PatientInvoices from './pages/Patient/PatientInvoices.jsx';
import PaymentSelection from './pages/Patient/PaymentSelection.jsx';
import PaymentResult from './pages/Patient/PaymentResult.jsx';
import VisaPayment from './pages/Patient/VisaPayment.jsx';
import PaymentSuccess from './pages/Patient/PaymentSuccess.jsx';
import PaymentFailed from './pages/Patient/PaymentFailed.jsx';

import { Result, Button } from 'antd';
import { 
  HomeOutlined, 
  LockOutlined,
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

// Root redirect component
const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading for a maximum of 2 seconds, then show homepage
  const [showHomepage, setShowHomepage] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHomepage(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (loading && !showHomepage) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }
  
  return <HomepageLayout><Homepage /></HomepageLayout>;
};

function App() {
  return (
    <AntApp>
      <AuthProvider>
        <Router>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          <Routes>
          {/* Root redirect - redirect based on auth status */}
          <Route path="/" element={<RootRedirect />} />
          
          {/* Public routes - Auth with HomepageLayout */}
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
          
          {/* Public Homepage */}
          <Route path="/home" element={
            <HomepageLayout>
              <Homepage />
            </HomepageLayout>
          } />
           
          {/* Public Service Routes */}
          <Route path="/services/pl/:serviceName/addons" element={
            <HomepageLayout>
              <PublicServiceAddOns />
            </HomepageLayout>
          } />
          
          <Route path="/services/pl/:serviceName/addons/:addOnName/detail" element={
            <HomepageLayout>
              <PublicServiceAddOnDetail />
            </HomepageLayout>
          } />
          
          <Route path="/dentist-detail/:id" element={
            <HomepageLayout>
              <PublicDentistDetail />
            </HomepageLayout>
          } />
          
          {/* Patient Public Routes with Layout */}
          <Route path="/patient" element={<PatientLayout />}>
            <Route index element={<PatientHomePage />} />
            
            {/* Patient Booking Flow */}
            <Route path="booking">
              <Route index element={<Navigate to="/patient/booking/select-service" replace />} />
              <Route path="select-service" element={<BookingSelectService />} />
              <Route path="select-addon" element={<BookingSelectAddOn />} />
              <Route path="select-dentist" element={<BookingSelectDentist />} />
              <Route path="select-date" element={<BookingSelectDate />} />
              <Route path="select-time" element={<BookingSelectTime />} />
              <Route path="create-appointment" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <CreateAppointment />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Payment Flow */}
            <Route path="payment">
              <Route path="select" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <PaymentSelection />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="result" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <PaymentResult />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="visa" element={
                <ProtectedRoute>
                  <VisaPayment />
                </ProtectedRoute>
              } />
              <Route path="success" element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              } />
              <Route path="failed" element={
                <ProtectedRoute>
                  <PaymentFailed />
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
            <Route path="records" element={
              <ProtectedRoute roles={['patient']}>
                <PatientRecords />
              </ProtectedRoute>
            } />
            <Route path="invoices" element={
              <ProtectedRoute roles={['patient']}>
                <PatientInvoices />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Protected routes - Dashboard cho người đã đăng nhập */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            {/* Default redirect */}
            <Route index element={<Dashboard />} />
            
            {/* Profile */}
            <Route path="profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            {/* Change Password */}
            <Route path="change-password" element={<ChangePassword />} />
            
            {/* User Management */}
            <Route path="users" element={<UserManagement />} />
            <Route path="users/edit/:id" element={<EditUser />} />
            <Route path="users/detail/:id" element={<DetailStaff />} />
            
            {/* Queue Dashboard */}
            <Route path="queue" element={
              <ProtectedRoute roles={['admin', 'manager', 'receptionist']}>
                <QueueManagement />
              </ProtectedRoute>
            } />
            
            {/* Queue Dashboard (Receptionist alias) */}
            <Route path="queue-receptionist" element={
              <ProtectedRoute roles={['admin', 'manager', 'receptionist']}>
                <QueueManagement />
              </ProtectedRoute>
            } />
            
            {/* Staff Schedule */}
            <Route path="staff-schedule" element={
              <ProtectedRoute roles={['admin', 'manager', 'dentist', 'nurse']}>
                <StaffSchedule />
              </ProtectedRoute>
            } />
            
            {/* Patient Appointments Management */}
            <Route path="patient-appointments" element={
              <ProtectedRoute roles={['admin', 'manager', 'receptionist']}>
                <AdminPatientAppointments />
              </ProtectedRoute>
            } />
            
            {/* Patient Appointments (Receptionist alias) */}
            <Route path="patient-appointments-receptionist" element={
              <ProtectedRoute roles={['admin', 'manager', 'receptionist']}>
                <AdminPatientAppointments />
              </ProtectedRoute>
            } />
            
            {/* Patient Management */}
            <Route path="patients" element={
              <ProtectedRoute roles={['admin', 'manager', 'receptionist']}>
                <PatientManagement />
              </ProtectedRoute>
            } />
            
            {/* Walk-in Appointments */}
            <Route path="walk-in-appointments" element={
              <ProtectedRoute roles={['admin', 'manager', 'receptionist']}>
                <WalkInAppointmentForm />
              </ProtectedRoute>
            } />
            
            {/* Medical Records */}
            <Route path="records" element={
              <ProtectedRoute roles={['admin', 'manager', 'dentist', 'nurse']}>
                <RecordList />
              </ProtectedRoute>
            } />
            
            {/* Invoices */}
            <Route path="invoices" element={
              <ProtectedRoute roles={['admin', 'manager', 'receptionist']}>
                <InvoiceList />
              </ProtectedRoute>
            } />
            
            {/* Payments */}
            <Route path="payments" element={
              <ProtectedRoute roles={['admin', 'manager', 'receptionist']}>
                <PaymentList />
              </ProtectedRoute>
            } />
            
            {/* Statistics Dashboard */}
            <Route path="statistics" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <StatisticsDashboard />
              </ProtectedRoute>
            } />
            
            {/* Room Management */}
            <Route path="rooms" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <RoomList />
              </ProtectedRoute>
            } />
            <Route path="rooms/:roomId" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <RoomList />
              </ProtectedRoute>
            } />
            
            {/* Service Management */}
            <Route path="services" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <ServiceList />
              </ProtectedRoute>
            } />
            <Route path="services/add" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <AddService />
              </ProtectedRoute>
            } />
            <Route path="services/:serviceId" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <ServiceDetails />
              </ProtectedRoute>
            } />
            <Route path="services/:serviceId/edit" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <EditService />
              </ProtectedRoute>
            } />
            <Route path="services/:serviceId/addons/:addonId/edit" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <EditServiceAddOn />
              </ProtectedRoute>
            } />
            <Route path="services/:serviceId/addons/add" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <AddServiceAddOn />
              </ProtectedRoute>
            } />
            
            {/* Schedule Management */}
            <Route path="schedules" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <ScheduleConfig />
              </ProtectedRoute>
            } />
            <Route path="schedules/holidays" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <HolidayManagementPage />
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
            <Route path="schedules/staff-replacement" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <StaffReplacement />
              </ProtectedRoute>
            } />
            
            {/* Certificate Management */}
            <Route path="certificates" element={
              <ProtectedRoute roles={['dentist']}>
                <CertificateManagement />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Error routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
    </AntApp>
  );
}

export default App;
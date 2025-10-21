/*
* @author: HoTram
*/
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
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
import RecordList from './pages/Records/RecordList.jsx';
import RecordFormModal from './pages/Records/RecordFormModal.jsx';
import PrescriptionForm from './pages/Records/PrescriptionForm.jsx';
import RecordDetailDrawer from './pages/Records/RecordDetailDrawer.jsx';

// Invoice Management
import InvoiceList from './pages/Invoices/InvoiceList.jsx';
import InvoiceFormModal from './pages/Invoices/InvoiceFormModal.jsx';
import InvoiceDetailDrawer from './pages/Invoices/InvoiceDetailDrawer.jsx';
import InvoiceTemplate from './pages/Invoices/InvoiceTemplate.jsx';

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
import PaymentSelection from './pages/Patient/PaymentSelection.jsx';
import PaymentResult from './pages/Patient/PaymentResult.jsx';
import VisaPayment from './pages/Patient/VisaPayment.jsx';
import PaymentSuccess from './pages/Patient/PaymentSuccess.jsx';
import PaymentFailed from './pages/Patient/PaymentFailed.jsx';

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
            <Route path="settings" element={
              <ProtectedRoute roles={['patient']}>
                <Settings />
              </ProtectedRoute>
            } />
          </Route>
         
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
           
           {/* Dentist Detail Route - Public */}
           <Route path="/dentist-detail/:id" element={
             <HomepageLayout>
               <PublicDentistDetail />
             </HomepageLayout>
           } />
           
          
          {/* Protected routes - Dashboard cho người đã đăng nhập */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            {/* Default redirect */}
            <Route index element={<Dashboard />} />
          </Route>
          
          {/* Queue Dashboard */}
          <Route path="/queue" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<QueueDashboard />} />
          </Route>
          
          {/* Profile - Direct access with DashboardLayout */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Profile />} />
          </Route>
          
          {/* Change Password */}
          <Route path="/change-password" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ChangePassword />} />
          </Route>
          
          {/* User Management */}
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
          
          {/* Patient Appointments Management */}
          <Route path="/patient-appointments" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminPatientAppointments />} />
          </Route>
          
          {/* Patient Management */}
          <Route path="/patients" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<PatientManagement />} />
          </Route>
          
          {/* Walk-in Appointments */}
          <Route path="/walk-in-appointments" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<WalkInAppointmentForm />} />
          </Route>
          
          {/* Medical Records */}
          <Route path="/records" element={
            <ProtectedRoute roles={['admin', 'manager', 'dentist']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<RecordList />} />
          </Route>
          
          {/* Invoices */}
          <Route path="/invoices" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<InvoiceList />} />
          </Route>
          
          {/* Statistics Dashboard */}
          <Route path="/statistics" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<StatisticsDashboard />} />
          </Route>
          
          {/* Room Management */}
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
          
          {/* Service Management */}
          <Route path="/services" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ServiceList />} />
          </Route>
          <Route path="/services/add" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AddService />} />
          </Route>
          <Route path="/services/:serviceId" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ServiceDetails />} />
          </Route>
          <Route path="/services/:serviceId/edit" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<EditService />} />
          </Route>
          <Route path="/services/:serviceId/addons/:addonId/edit" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<EditServiceAddOn />} />
          </Route>
          <Route path="/services/:serviceId/addons/add" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AddServiceAddOn />} />
          </Route>
          
          {/* Schedule Management */}
          <Route path="/schedules" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ScheduleConfig />} />
          </Route>
          <Route path="/schedules/holidays" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<HolidayManagementPage />} />
          </Route>
          <Route path="/schedules/create-for-room" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<CreateScheduleForRoom />} />
          </Route>
          <Route path="/schedules/calendar" element={
            <ProtectedRoute roles={['admin', 'manager', 'dentist', 'nurse']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ScheduleCalendar />} />
          </Route>
          <Route path="/schedules/staff-assignment" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<StaffAssignmentUnified />} />
          </Route>
          <Route path="/schedules/staff-assignment/detail" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<StaffAssignmentDetail />} />
          </Route>
          <Route path="/schedules/staff-assignment/assign" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AssignStaffForm />} />
          </Route>
          <Route path="/schedules/staff-replacement" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<StaffReplacement />} />
          </Route>
          
          {/* Certificate Management */}
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
          
          {/* Error routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
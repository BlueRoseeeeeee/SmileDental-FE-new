/*
* @author: HoTram
*/
import React from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Card, Row, Col, Typography, Button, Avatar, Space } from 'antd';
import { 
  CalendarOutlined, 
  UserAddOutlined,
  MedicineBoxOutlined,
  BarChartOutlined,
  HeartOutlined,
  UserOutlined,
  FileDoneOutlined,
  SettingOutlined,
  TeamOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LineChartOutlined,
  CheckCircleOutlined,
  UserSwitchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.fullName || 'Bạn';
    
    if (hour < 12) return `Chào buổi sáng, ${name}!`;
    if (hour < 18) return `Chào buổi chiều, ${name}!`;
    return `Chào buổi tối, ${name}!`;
  };

  const getRoleTitle = () => {
    const roleTitles = {
      admin: 'Quản trị viên hệ thống',
      manager: 'Quản lý phòng khám',
      dentist: 'Nha sĩ nha khoa',
      nurse: 'Y tá',
      receptionist: 'Nhân viên lễ tân',
      patient: 'Bệnh nhân',
    };
    return roleTitles[user?.role] || 'Người dùng';
  };

  const getPrimaryRole = () => {
    const userRoles = user?.roles || (user?.role ? [user.role] : []);
    if (userRoles.length === 1) return userRoles[0];
    const selectedRole = localStorage.getItem('selectedRole');
    if (selectedRole && userRoles.includes(selectedRole)) return selectedRole;
    const rolePriority = ['admin', 'manager', 'dentist', 'nurse', 'receptionist', 'patient'];
    for (const role of rolePriority) {
      if (userRoles.includes(role)) return role;
    }
    return userRoles[0] || 'patient';
  };

  const role = getPrimaryRole();

  // Quick actions based on role
  const getQuickActions = () => {
    if (role === 'admin' || role === 'manager') {
      return [
        // Hệ thống & nhân viên
        { key: 'schedules-config', label: 'Cấu hình phòng khám', icon: <SettingOutlined />, path: '/dashboard/schedules', color: '#1890ff' },
        { key: 'users', label: 'Quản lý nhân viên', icon: <UserSwitchOutlined />, path: '/dashboard/users', color: '#52c41a' },
        { key: 'staff-assignment', label: 'Phân công nhân viên', icon: <CalendarOutlined />, path: '/dashboard/schedules/staff-assignment', color: '#fa8c16' },
        { key: 'rooms', label: 'Quản lý phòng khám', icon: <EnvironmentOutlined />, path: '/dashboard/rooms', color: '#722ed1' },
        { key: 'services', label: 'Quản lý dịch vụ', icon: <MedicineBoxOutlined />, path: '/dashboard/services', color: '#eb2f96' },
        // Lịch & Vận hành
        { key: 'schedules', label: 'Lịch làm việc tổng', icon: <CalendarOutlined />, path: '/dashboard/schedules/calendar', color: '#13c2c2' },
        { key: 'create-for-room', label: 'Tạo lịch cho phòng', icon: <CalendarOutlined />, path: '/dashboard/schedules/create-for-room', color: '#2f54eb' },
        { key: 'holidays', label: 'Quản lý ngày nghỉ', icon: <CalendarOutlined />, path: '/dashboard/schedules/holidays', color: '#fa541c' },
        { key: 'day-closures', label: 'Đóng cửa khẩn cấp', icon: <CloseCircleOutlined />, path: '/dashboard/day-closures', color: '#f5222d' },
        // Khám & Điều trị
        { key: 'walk-in', label: 'Lịch Walk-in', icon: <UserAddOutlined />, path: '/dashboard/walk-in-appointments', color: '#1890ff' },
        { key: 'queue', label: 'Hàng đợi khám', icon: <ClockCircleOutlined />, path: '/dashboard/queue', color: '#52c41a' },
        { key: 'patients', label: 'Danh sách bệnh nhân', icon: <HeartOutlined />, path: '/dashboard/patients', color: '#fa8c16' },
        { key: 'records', label: 'Hồ sơ bệnh án', icon: <FileDoneOutlined />, path: '/dashboard/records', color: '#722ed1' },
        { key: 'appointments', label: 'Lịch hẹn khám', icon: <CalendarOutlined />, path: '/dashboard/patient-appointments-receptionist', color: '#eb2f96' },
        { key: 'cancelled-patients', label: 'Bệnh nhân bị hủy phiếu', icon: <UserOutlined />, path: '/dashboard/cancelled-patients', color: '#595959' },
        { key: 'medicine', label: 'Danh mục thuốc', icon: <MedicineBoxOutlined />, path: '/dashboard/medicine', color: '#13c2c2' },
        // Dịch vụ & Tài chính
        { key: 'invoices', label: 'Quản lý hóa đơn', icon: <FileTextOutlined />, path: '/dashboard/invoices', color: '#fa541c' },
        { key: 'payments', label: 'Quản lý thanh toán', icon: <DollarOutlined />, path: '/dashboard/payments', color: '#2f54eb' },
        // Thống kê
        { key: 'statistics-revenue', label: 'Thống kê doanh thu', icon: <DollarOutlined />, path: '/dashboard/statistics/revenue', color: '#52c41a' },
        { key: 'statistics-booking', label: 'Phiếu hẹn Online/Offline', icon: <CalendarOutlined />, path: '/dashboard/statistics/booking-channels', color: '#1890ff' },
        { key: 'statistics-clinic', label: 'Hiệu suất Phòng khám', icon: <LineChartOutlined />, path: '/dashboard/statistics/clinic-utilization', color: '#722ed1' },
        { key: 'statistics-status', label: 'Trạng thái Lịch hẹn', icon: <CheckCircleOutlined />, path: '/dashboard/statistics/appointment-status', color: '#eb2f96' },
      ];
    } else if (role === 'dentist') {
      return [
        { key: 'schedules', label: 'Lịch làm việc', icon: <CalendarOutlined />, path: '/dashboard/schedules/calendar', color: '#1890ff' },
        { key: 'walk-in', label: 'Lịch Walk-in', icon: <UserAddOutlined />, path: '/dashboard/walk-in-appointments', color: '#52c41a' },
        { key: 'records', label: 'Hồ sơ bệnh án', icon: <FileDoneOutlined />, path: '/dashboard/records', color: '#fa8c16' },
        { key: 'certificates', label: 'Bằng cấp & Chứng chỉ', icon: <FileTextOutlined />, path: '/dashboard/certificates', color: '#722ed1' },
        { key: 'profile', label: 'Hồ sơ cá nhân', icon: <UserOutlined />, path: '/dashboard/profile', color: '#eb2f96' },
      ];
    } else if (role === 'receptionist' || role === 'staff') {
      return [
        // Khám & Điều trị
        { key: 'walk-in', label: 'Lịch Walk-in', icon: <UserAddOutlined />, path: '/dashboard/walk-in-appointments', color: '#1890ff' },
        { key: 'queue', label: 'Hàng đợi khám', icon: <ClockCircleOutlined />, path: '/dashboard/queue-receptionist', color: '#52c41a' },
        { key: 'appointments', label: 'Lịch hẹn khám', icon: <CalendarOutlined />, path: '/dashboard/patient-appointments-receptionist', color: '#fa8c16' },
        { key: 'patients', label: 'Danh sách bệnh nhân', icon: <HeartOutlined />, path: '/dashboard/patients', color: '#722ed1' },
        { key: 'cancelled-patients', label: 'Bệnh nhân bị hủy phiếu', icon: <UserOutlined />, path: '/dashboard/cancelled-patients', color: '#595959' },
        // Dịch vụ & Tài chính
        { key: 'invoices', label: 'Quản lý hóa đơn', icon: <FileTextOutlined />, path: '/dashboard/invoices', color: '#eb2f96' },
        { key: 'payments', label: 'Quản lý thanh toán', icon: <DollarOutlined />, path: '/dashboard/payments', color: '#13c2c2' },
        { key: 'profile', label: 'Hồ sơ cá nhân', icon: <UserOutlined />, path: '/dashboard/profile', color: '#2f54eb' },
      ];
    } else if (role === 'nurse') {
      return [
        { key: 'schedules', label: 'Lịch làm việc', icon: <CalendarOutlined />, path: '/dashboard/schedules/calendar', color: '#1890ff' },
        { key: 'profile', label: 'Hồ sơ cá nhân', icon: <UserOutlined />, path: '/dashboard/profile', color: '#52c41a' },
      ];
    } else {
      // Patient role
      return [
        { key: 'dentists', label: 'Danh sách nha sĩ', icon: <TeamOutlined />, path: '/dentists', color: '#1890ff' },
        { key: 'profile', label: 'Hồ sơ cá nhân', icon: <UserOutlined />, path: '/dashboard/profile', color: '#52c41a' },
      ];
    }
  };

  const quickActions = getQuickActions();

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 112px)',
      background: '#E8F2F7',
      margin: '-24px',
      padding: '16px'
    }}>
      {/* Welcome Section */}
      <Card 
        style={{ 
          background: 'linear-gradient(135deg, #2596be 0%, #1890ff 100%)',
          border: 'none',
          borderRadius: '12px',
          marginBottom: '16px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Row align="middle" justify="space-between" style={{ padding: '8px 0' }}>
          <Col>
            <h5 style={{ marginBottom: '4px', color: 'white', fontSize: '26px', fontWeight: '600' }}>
              {getGreeting()}
            </h5>
            <Text style={{ fontSize: '14px', color: 'white', opacity: 0.95 }}>
              {getRoleTitle()} • {new Date().toLocaleDateString('vi-VN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </Col>
          <Col>
            <Avatar 
              size={64} 
              src={user?.avatar} 
              icon={<UserOutlined />}
              style={{ 
                border: '3px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
              }}
            />
          </Col>
        </Row>
      </Card>

      {/* Quick Actions */}
      <Card 
        title={
          <Space>
            <SettingOutlined style={{ color: '#2596be', fontSize: '18px' }} />
            <Text strong style={{ fontSize: '16px' }}>Truy cập nhanh</Text>
          </Space>
        }
        bordered={false}
        style={{ 
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          marginBottom: '16px'
        }}
        bodyStyle={{ padding: '16px' }}
      >
        <Row gutter={[16, 16]}>
          {quickActions.map((action) => (
            <Col xs={12} sm={12} md={8} lg={6} key={action.key}>
              <Button 
                type="primary" 
                block
                style={{ 
                  height: '110px', 
                  borderRadius: '12px',
                  background: action.color,
                  borderColor: action.color,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  boxShadow: `0 2px 8px ${action.color}40`,
                  transition: 'all 0.3s ease',
                  whiteSpace: 'normal',
                  lineHeight: '1.4',
                  color: '#fff',
                  gap: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${action.color}60`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 2px 8px ${action.color}40`;
                }}
                onClick={() => navigate(action.path)}
              >
                <div style={{ 
                  fontSize: '32px', 
                  lineHeight: '1',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {action.icon}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  textAlign: 'left',
                  overflow: 'visible',
                  wordBreak: 'keep-all',
                  color: '#fff',
                  flex: 1
                }}>
                  {action.label}
                </div>
              </Button>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Info Card */}
      <Card 
        bordered={false}
        style={{ 
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <div style={{ textAlign: 'center' }}>
          <Title level={4} style={{ marginBottom: '8px', color: '#2596be' }}>
            Chào mừng đến với SmileCare Dental
          </Title>
          <Text style={{ fontSize: '14px', color: '#595959' }}>
            Hệ thống quản lý phòng khám nha khoa hiện đại và chuyên nghiệp
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
/*
* @author: HoTram
*/
import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Button, Input, Badge, Typography, Space, Drawer, Tooltip } from 'antd';
import {
  MenuOutlined,
  HomeOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  SearchOutlined,
  CalendarOutlined,
  FileTextOutlined,
  SafetyOutlined,
  TeamOutlined,
  UserSwitchOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  EnvironmentOutlined,
  MedicineBoxOutlined,
  UserAddOutlined,
  DollarOutlined,
  FileDoneOutlined,
  BarChartOutlined,
  CloseCircleOutlined,
  SettingOutlined,
  LineChartOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { COLOR_BRAND_NAME } from '../../utils/common-colors.js';
import logo from '../../assets/image/smile-dental-logo.png';
import './DashboardLayout.css';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  const handleLogout = async () => {
    await logout();
    // Clear navigation state to prevent redirect to old routes after re-login
    navigate('/login', { replace: true, state: null });
  };

  const handleRoleSwitch = (role) => {
    localStorage.setItem('selectedRole', role);
    navigate('/dashboard');
    window.location.reload(); // Reload to apply new role
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: 'Quản trị viên',
      manager: 'Quản lý',
      dentist: 'Nha sĩ',
      nurse: 'Y tá',
      receptionist: 'Lễ tân',
      patient: 'Bệnh nhân',
    };
    return roleNames[role] || role;
  };

  // ✅ Get primary role to display based on selectedRole from login
  const getPrimaryRole = () => {
    const userRoles = user?.roles || (user?.role ? [user.role] : []);
    
    // If user has only 1 role, return it directly (no need for selectedRole)
    if (userRoles.length === 1) {
      return userRoles[0];
    }
    
    // Priority 1: Use the role selected during login (only if it's valid)
    const selectedRole = localStorage.getItem('selectedRole');
    if (selectedRole && userRoles.includes(selectedRole)) {
      return selectedRole;
    }
    
    // Priority 2: Fall back to role priority if selectedRole is invalid or doesn't exist
    const rolePriority = ['admin', 'manager', 'dentist', 'nurse', 'receptionist', 'patient'];
    for (const role of rolePriority) {
      if (userRoles.includes(role)) return role;
    }
    return userRoles[0] || 'patient';
  };

  // Menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      {
        key: '/dashboard',
        icon: <HomeOutlined />,
        label: 'Trang chủ',
      }
    ];

    const roleBasedItems = [];
    const addedKeys = new Set(['/dashboard']); // Track added keys to prevent duplicates

    // ✅ Check ONLY selectedRole - user sees menu of the role they logged in as
    const selectedRole = localStorage.getItem('selectedRole');
    const hasRole = (roleToCheck) => selectedRole === roleToCheck;

    // Helper function to add item only if key doesn't exist
    const addMenuItem = (item) => {
      if (!addedKeys.has(item.key)) {
        addedKeys.add(item.key);
        roleBasedItems.push(item);
      }
    };

    // ==================== ADMIN & MANAGER ====================
    if (hasRole('admin') || hasRole('manager')) {
      // 🧩 I. HỆ THỐNG & nhân viên
      addMenuItem({
        key: 'system-staff',
        icon: <TeamOutlined />,
        label: 'Hệ thống & Nhân viên',
        children: [
          { key: '/dashboard/schedules', label: 'Cấu hình phòng khám', icon: <SettingOutlined /> },
          { key: '/dashboard/users', label: 'Quản lý nhân viên', icon: <UserSwitchOutlined /> },
          { key: '/dashboard/rooms', label: 'Quản lý phòng khám', icon: <EnvironmentOutlined /> },
          { key: '/dashboard/services', label: 'Quản lý dịch vụ', icon: <MedicineBoxOutlined /> },
        ]
      });

      // 📅 II. LỊCH & VẬN HÀNH
      addMenuItem({
        key: 'schedules-operations',
        icon: <CalendarOutlined />,
        label: 'Lịch & Vận hành',
        children: [
          { key: '/dashboard/schedules/calendar', label: 'Lịch làm việc tổng', icon: <CalendarOutlined /> },
          { key: '/dashboard/schedules/create-for-room', label: 'Tạo lịch cho phòng', icon: <CalendarOutlined /> },
          { key: '/dashboard/schedules/staff-assignment', label: 'Phân công nhân viên', icon: <TeamOutlined /> },
          { key: '/dashboard/schedules/holidays', label: 'Quản lý ngày nghỉ', icon: <CalendarOutlined /> },
          { key: '/dashboard/day-closures', label: 'Lịch đóng cửa khẩn cấp', icon: <CloseCircleOutlined /> },
        ]
      });

      // 🩺 III. KHÁM & ĐIỀU TRỊ
      addMenuItem({
        key: 'medical-treatment',
        icon: <MedicineBoxOutlined />,
        label: 'Khám & Điều trị',
        children: [
          { key: '/dashboard/walk-in-appointments', label: 'Phiếu hẹn trực tiếp', icon: <UserAddOutlined /> },
          { key: '/dashboard/queue', label: 'Hàng đợi khám', icon: <ClockCircleOutlined /> },
          { key: '/dashboard/patients', label: 'Danh sách bệnh nhân', icon: <HeartOutlined /> },
          { key: '/dashboard/records', label: 'Hồ sơ bệnh án', icon: <FileDoneOutlined /> },
          { key: '/dashboard/patient-appointments-receptionist', label: 'Phiếu hẹn', icon: <CalendarOutlined /> },
          { key: '/dashboard/cancelled-patients', label: 'Bệnh nhân bị hủy phiếu', icon: <UserOutlined /> },
          { key: '/dashboard/medicine', label: 'Danh mục thuốc', icon: <MedicineBoxOutlined /> },
        ]
      });

      // 💰 IV. DỊCH VỤ & TÀI CHÍNH
      addMenuItem({
        key: 'finance',
        icon: <DollarOutlined />,
        label: 'Dịch vụ & Tài chính',
        children: [
          { key: '/dashboard/invoices', label: 'Quản lý hóa đơn', icon: <FileTextOutlined /> },
          { key: '/dashboard/payments', label: 'Quản lý thanh toán', icon: <DollarOutlined /> },
        ]
      });

      // 📊 V. THỐNG KÊ & BÁO CÁO (New - 4 pages based on model analysis)
      addMenuItem({
        key: 'statistics',
        icon: <BarChartOutlined />,
        label: 'Thống kê',
        children: [
          { key: '/dashboard/statistics/revenue', label: 'Doanh thu', icon: <DollarOutlined /> },
          { key: '/dashboard/statistics/booking-channels', label: 'Phiếu hẹn Online/Offline', icon: <CalendarOutlined /> },
          { key: '/dashboard/statistics/clinic-utilization', label: 'Hiệu suất Phòng khám', icon: <LineChartOutlined /> },
          { key: '/dashboard/statistics/appointment-status', label: 'Trạng thái Lịch hẹn', icon: <CheckCircleOutlined /> },
        ]
      });
    }

    // ==================== DENTIST ====================
    if (hasRole('dentist')) {
      // 📅 Lịch làm việc
      addMenuItem({
        key: '/dashboard/schedules/calendar',
        icon: <CalendarOutlined />,
        label: 'Lịch làm việc',
      });
      
      // 🩺 Lịch Walk-in
      addMenuItem({
        key: '/dashboard/walk-in-appointments',
        icon: <UserAddOutlined />,
        label: 'Phiếu hẹn trực tiếp',
      });
      
      // 🩺 Hồ sơ bệnh án
      addMenuItem({
        key: '/dashboard/records',
        icon: <FileDoneOutlined />,
        label: 'Hồ sơ bệnh án',
      });
      
      addMenuItem({
        key: '/dashboard/certificates',
        icon: <FileTextOutlined />,
        label: 'Bằng cấp & chứng chỉ',
      });
    }

    // ==================== NURSE ====================
    if (hasRole('nurse')) {
      // 📅 Lịch làm việc
      addMenuItem({
        key: '/dashboard/schedules/calendar',
        icon: <CalendarOutlined />,
        label: 'Lịch làm việc',
      });
    }

    // ==================== RECEPTIONIST & STAFF ====================
    if (hasRole('receptionist') || hasRole('staff')) {
      // 🩺 Khám & Điều trị
      addMenuItem({
        key: 'medical-treatment-receptionist',
        icon: <MedicineBoxOutlined />,
        label: 'Khám & Điều trị',
        children: [
          { key: '/dashboard/walk-in-appointments', label: 'Phiếu hẹn trực tiếp', icon: <UserAddOutlined /> },
          { key: '/dashboard/queue-receptionist', label: 'Hàng đợi khám', icon: <ClockCircleOutlined /> },
          { key: '/dashboard/patient-appointments-receptionist', label: 'Lịch hẹn khám', icon: <CalendarOutlined /> },
          { key: '/dashboard/patients', label: 'Danh sách bệnh nhân', icon: <HeartOutlined /> },
          { key: '/dashboard/cancelled-patients', label: 'Bệnh nhân bị hủy phiếu', icon: <UserOutlined /> },
        ]
      });
      
      // � Dịch vụ & Tài chính
      addMenuItem({
        key: 'finance-receptionist',
        icon: <DollarOutlined />,
        label: 'Dịch vụ & Tài chính',
        children: [
          { key: '/dashboard/invoices', label: 'Quản lý hóa đơn', icon: <FileTextOutlined /> },
          { key: '/dashboard/payments', label: 'Quản lý thanh toán', icon: <DollarOutlined /> },
        ]
      });
    }

    // ==================== PATIENT ====================
    if (hasRole('patient')) {
      // 🧑‍🦷 Dành cho bệnh nhân
      addMenuItem({
        key: '/dentists',
        icon: <TeamOutlined />,
        label: 'Danh sách nha sĩ',
      });
    }

    // ==================== COMMON ITEMS ====================
    addMenuItem({
      key: '/dashboard/profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ cá nhân',
    });

    return [...baseItems, ...roleBasedItems];
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ cá nhân',
      onClick: () => navigate('/dashboard/profile'),
    },
    {
      key: 'change-password',
      icon: <SafetyOutlined />,
      label: 'Đổi mật khẩu',
      onClick: () => navigate('/dashboard/change-password'),
    },
    // Show role switcher only if user has multiple roles
    ...(user?.roles && user.roles.length > 1 ? [{
      type: 'divider',
    }, {
      key: 'role-switcher',
      icon: <UserSwitchOutlined />,
      label: 'Chuyển vai trò',
      children: user.roles.map(role => ({
        key: `role-${role}`,
        label: getRoleDisplayName(role),
        onClick: () => handleRoleSwitch(role),
        style: {
          fontWeight: localStorage.getItem('selectedRole') === role ? 'bold' : 'normal',
          backgroundColor: localStorage.getItem('selectedRole') === role ? '#e6f7ff' : 'transparent',
        }
      }))
    }] : []),
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  const menuItems = getMenuItems();

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Mobile Drawer */}
      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        width={280}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <img src={logo} alt="Smile Dental" style={{ width: '100%', height: '100%' }} />
          <h2 style={{ color: COLOR_BRAND_NAME, fontSize: '18px', fontWeight: '600', marginTop: '8px' }}>SmileCare Dental</h2>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => {
            navigate(key);
            setMobileMenuVisible(false);
          }}
          style={{ border: 'none' }}
        />
      </Drawer>

      {/* Desktop Sider */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        collapsedWidth={80}
        style={{
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
        }}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          if (broken) {
            setCollapsed(true);
          }
        }}
        className="dashboard-sider"
      >
        <div style={{ 
          padding: '16px', 
          textAlign: 'center', 
          borderBottom: '1px solid #f0f0f0',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'center'
        }}>
          {!collapsed && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              gap: '8px'
            }}>
              <img 
                src={logo} 
                alt="SmileCare Dental" 
                style={{
                  width: '32px',
                  height: '32px',
                  filter: 'drop-shadow(0 2px 4px rgba(37, 150, 190, 0.2))'
                }}
              />
              <h2 
                style={{
                  fontSize: '18px',
                  color: COLOR_BRAND_NAME,
                  letterSpacing: '0.5px',
                  fontWeight: '600',
                  margin: 0,
                  lineHeight: '1'
                }}
              >
                SmileCare Dental
              </h2>
            </div>
          )}
          {collapsed && (
            <img 
              src={logo} 
              alt="SmileCare Dental" 
              style={{
                width: '28px',
                height: '28px',
                filter: 'drop-shadow(0 2px 4px rgba(37, 150, 190, 0.2))'
              }}
            />
          )}
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ 
            border: 'none',
            background: 'transparent'
          }}
        />
      </Sider>

      <Layout>
        {/* Header */}
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
          borderBottom: '1px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          {/* Left Section - Menu Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="header-toggle-btn"
              style={{ 
                fontSize: '18px', 
                width: '48px', 
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
            />
            
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuVisible(true)}
              style={{ 
                fontSize: '18px', 
                width: '48px', 
                height: '48px',
                display: 'none',
                borderRadius: '8px'
              }}
              className="mobile-menu-btn"
            />
            
            {/* Mobile Search Button */}
            <Button
              type="text"
              icon={<SearchOutlined />}
              onClick={() => setMobileMenuVisible(true)}
              style={{ 
                fontSize: '18px', 
                width: '48px', 
                height: '48px',
                display: 'none',
                borderRadius: '8px'
              }}
              className="mobile-search-btn"
            />
          </div>

          {/* Right Section - Notifications & User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* User Profile Dropdown */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div 
                className="user-profile-dropdown"
                style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  border: '1px solid transparent',
                  minWidth: '200px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                  e.currentTarget.style.borderColor = '#d9d9d9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}>
                <Avatar 
                  src={user?.avatar} 
                  icon={<UserOutlined />}
                  style={{ 
                    marginRight: '12px',
                    width: '36px',
                    height: '36px',
                    backgroundColor: '#2596be'
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: '14px',
                    color: '#262626',
                    lineHeight: '1.2',
                    marginBottom: '2px'
                  }}>
                    {user?.fullName || 'Admin'}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#8c8c8c',
                    lineHeight: '1.2'
                  }}>
                    {getRoleDisplayName(getPrimaryRole())}
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content */}
        <Content style={{ 
          margin: '24px', 
          padding: '24px', 
          background: 'transparent', 
          borderRadius: '8px',
          minHeight: 'calc(100vh - 112px)'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;

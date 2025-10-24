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
  SettingOutlined,
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
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext.jsx';
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
    navigate('/login');
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

    // ==================== ADMIN & MANAGER ====================
    if (user?.role === 'admin' || user?.role === 'manager') {
      roleBasedItems.push(
        // Quản lý nhân sự
        {
          key: 'staff-management',
          icon: <TeamOutlined />,
          label: 'Quản lý nhân sự',
          children: [
            { key: '/dashboard/users', label: 'Danh sách nhân viên', icon: <UserSwitchOutlined /> },
            { key: '/dashboard/schedules/staff-assignment', label: 'Phân công nhân sự', icon: <CalendarOutlined /> },
          ]
        },
        
        // Quản lý lịch làm việc
        {
          key: 'schedules-menu',
          icon: <ClockCircleOutlined />,
          label: 'Quản lý lịch làm việc',
          children: [
            { key: '/dashboard/schedules', label: 'Cấu hình hệ thống' },
            { key: '/dashboard/schedules/calendar', label: 'Lịch làm việc' },
            { key: '/dashboard/schedules/create-for-room', label: 'Tạo lịch cho phòng' },
            { key: '/dashboard/schedules/holidays', label: 'Quản lý ngày nghỉ' },
          ]
        },

        // Quản lý lịch hẹn
        {
          key: 'appointments-menu',
          icon: <CalendarOutlined />,
          label: 'Quản lý lịch hẹn',
          children: [
            { key: '/patient-appointments', label: 'Lịch khám bệnh nhân', icon: <CalendarOutlined /> },
            { key: '/walk-in-appointments', label: 'Lịch hẹn Walk-in', icon: <UserAddOutlined /> },
          ]
        },
        {
          key: '/dashboard/services',
          icon: <MedicineBoxOutlined />,
          label: 'Quản lý dịch vụ',
        },

        // Quản lý hàng đợi
        {
          key: '/queue',
          icon: <UserAddOutlined />,
          label: 'Quản lý hàng đợi',
        },

        // Quản lý hồ sơ & bệnh án
        {
          key: 'medical-records',
          icon: <FileDoneOutlined />,
          label: 'Hồ sơ & Bệnh án',
          children: [
            { key: '/records', label: 'Hồ sơ bệnh án', icon: <FileDoneOutlined /> },
            { key: '/patients', label: 'Quản lý bệnh nhân', icon: <HeartOutlined /> },
          ]
        },

        // Quản lý phòng khám & dịch vụ
        {
          key: 'facility-menu',
          icon: <EnvironmentOutlined />,
          label: 'Cơ sở vật chất',
          children: [
            { key: '/dashboard/rooms', label: 'Quản lý phòng khám', icon: <EnvironmentOutlined /> },
            // { key: '/services', label: 'Quản lý dịch vụ', icon: <MedicineBoxOutlined /> },
          ]
        },

        // Quản lý tài chính
        {
          key: '/dashboard/invoices',
          icon: <DollarOutlined />,
          label: 'Quản lý hóa đơn',
        },
        
        // Thống kê & Báo cáo
        {
          key: '/statistics',
          icon: <BarChartOutlined />,
          label: 'Thống kê & Báo cáo',
        }
      );
    }

    // ==================== DENTIST ====================
    if (user?.role === 'dentist') {
      roleBasedItems.push(
        {
          key: '/dashboard/certificates',
          icon: <FileTextOutlined />,
          label: 'Quản lý chứng chỉ',
        },
        {
          key: '/dashboard/records',
          icon: <FileDoneOutlined />,
          label: 'Hồ sơ bệnh án',
        },
        {
          key: '/patients',
          icon: <HeartOutlined />,
          label: 'Quản lý bệnh nhân',
        }
      );
    }

    // ==================== NURSE ====================
    if (user?.role === 'nurse') {
      roleBasedItems.push(
        {
          key: '/patients',
          icon: <HeartOutlined />,
          label: 'Quản lý bệnh nhân',
        }
      );
    }

    // ==================== RECEPTIONIST & STAFF ====================
    if (user?.role === 'receptionist' || user?.role === 'staff') {
      roleBasedItems.push(
        {
          key: '/queue',
          icon: <UserAddOutlined />,
          label: 'Quản lý hàng đợi',
        },
        {
          key: '/patient-appointments',
          icon: <CalendarOutlined />,
          label: 'Lịch hẹn',
        }
      );
    }

    // ==================== PATIENT ====================
    if (user?.role === 'patient') {
      roleBasedItems.push(
        {
          key: '/dentists',
          icon: <TeamOutlined />,
          label: 'Danh sách nha sĩ',
        }
      );
    }

    // ==================== COMMON ITEMS ====================
    const commonItems = [
      {
        key: '/dashboard/profile',
        icon: <UserOutlined />,
        label: 'Hồ sơ cá nhân',
      },
      {
        key: '/dashboard/settings',
        icon: <SettingOutlined />,
        label: 'Cài đặt',
      }
    ];

    return [...baseItems, ...roleBasedItems, ...commonItems];
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
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
      onClick: () => navigate('/dashboard/settings'),
    },
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
    <Layout style={{ minHeight: '100vh' }}>
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
          <Text strong>Smile Dental</Text>
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
              width: '100%'
            }}>
              <img 
                src={logo} 
                alt="Smile Dental" 
                style={{
                  width: '32px',
                  height: '32px',
                  marginRight: '8px',
                  filter: 'drop-shadow(0 2px 4px rgba(37, 150, 190, 0.2))'
                }}
              />
              <Text 
                strong 
                style={{
                  fontSize: '18px',
                  color: '#2596be',
                  letterSpacing: '0.5px',
                  fontWeight: '600',
                  textAlign: 'center',
                  background: 'linear-gradient(45deg, #2596be, #40a9ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Smile Dental
              </Text>
            </div>
          )}
          {collapsed && (
            <img 
              src={logo} 
              alt="Smile Dental" 
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
          borderBottom: '1px solid #f0f0f0'
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
            {/* Notification Bell */}
            <Tooltip title="Thông báo">
              <Badge 
                count={5} 
                size="small"
                style={{ 
                  backgroundColor: '#ff4d4f',
                  boxShadow: '0 0 0 1px #fff'
                }}
              >
                <Button 
                  type="text" 
                  icon={<BellOutlined />}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}
                />
              </Badge>
            </Tooltip>

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
                    {getRoleDisplayName(user?.role)}
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
          background: '#fff', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          minHeight: 'calc(100vh - 112px)'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
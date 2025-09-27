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
  BarChartOutlined,
  SafetyOutlined,
  TeamOutlined,
  UserSwitchOutlined,
  MedicineBoxOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
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

  const getRoleColor = (role) => {
    const colors = {
      admin: 'red',
      manager: 'blue',
      dentist: 'green',
      nurse: 'orange',
      receptionist: 'purple',
      patient: 'cyan',
    };
    return colors[role] || 'default';
  };

  // Menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      {
        key: '/dashboard',
        icon: <HomeOutlined />,
        label: 'Trang chủ',
      },
      {
        key: '/profile',
        icon: <UserOutlined />,
        label: 'Hồ sơ cá nhân',
      },
    ];

    const roleBasedItems = [];

    if (user?.role === 'admin' || user?.role === 'manager') {
      roleBasedItems.push(
        {
          key: '/users',
          icon: <UserSwitchOutlined />,
          label: 'Quản lý người dùng',
        }
      );
    }

    if (user?.role === 'dentist') {
      roleBasedItems.push(
        {
          key: '/certificates',
          icon: <FileTextOutlined />,
          label: 'Quản lý chứng chỉ',
        }
      );
    }

    if (user?.role === 'patient') {
      roleBasedItems.push(
        {
          key: '/dentists',
          icon: <TeamOutlined />,
          label: 'Danh sách nha sĩ',
        }
      );
    }

    if (user?.role === 'dentist' || user?.role === 'nurse') {
      roleBasedItems.push(
        {
          key: '/patients',
          icon: <HeartOutlined />,
          label: 'Quản lý bệnh nhân',
        }
      );
    }

    if (user?.role === 'admin' || user?.role === 'manager') {
      roleBasedItems.push(
        {
          key: '/schedules',
          icon: <ClockCircleOutlined />,
          label: 'Quản lý lịch làm việc',
        }
      );
    }

    roleBasedItems.push(
      {
        key: '/appointments',
        icon: <CalendarOutlined />,
        label: 'Lịch hẹn',
      },
      {
        key: '/settings',
        icon: <SettingOutlined />,
        label: 'Cài đặt',
      }
    );

    return [...baseItems, ...roleBasedItems];
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ cá nhân',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'change-password',
      icon: <SafetyOutlined />,
      label: 'Đổi mật khẩu',
      onClick: () => navigate('/change-password'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
      onClick: () => navigate('/settings'),
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
        bodyStyle={{ padding: 0 }}
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
      >
        <div style={{ 
          padding: '16px', 
          textAlign: 'center', 
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start'
        }}>
          <div style={{ fontSize: '24px', marginRight: collapsed ? 0 : '8px' }}>🦷</div>
          {!collapsed && <Text strong>Smile Dental</Text>}
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none', marginTop: '16px' }}
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
              style={{ 
                fontSize: '18px', 
                width: '48px', 
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px'
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
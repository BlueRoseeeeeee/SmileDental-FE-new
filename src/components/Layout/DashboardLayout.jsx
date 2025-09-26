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
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🦷</div>
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
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuVisible(true)}
              style={{ 
                fontSize: '16px', 
                width: 64, 
                height: 64,
                display: 'none'
              }}
              className="mobile-menu-btn"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Input
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
            />
            
            <Tooltip title="Thông báo">
              <Badge count={5} size="small">
                <Button type="text" icon={<BellOutlined />} />
              </Badge>
            </Tooltip>

            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'background-color 0.3s'
              }}>
                <Avatar 
                  src={user?.avatar} 
                  icon={<UserOutlined />}
                  style={{ marginRight: '8px' }}
                />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>
                    {user?.fullName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
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
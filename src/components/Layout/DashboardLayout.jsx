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
import smileDentalLogo from '../../assets/image/smile-dental-logo.png';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { key: '/dashboard', icon: <HomeOutlined />, label: 'Trang chủ' },
      { key: '/profile', icon: <UserOutlined />, label: 'Hồ sơ cá nhân' },
      { key: '/users', icon: <TeamOutlined />, label: 'Quản lý nhân viên' },
    ];

    const roleBasedItems = {
      admin: [
        { key: '/users', icon: <TeamOutlined />, label: 'Quản lý nhân viên' },
        { key: '/permissions', icon: <SafetyOutlined />, label: 'Phân quyền' },
        { key: '/statistics', icon: <BarChartOutlined />, label: 'Thống kê' },
      ],
      manager: [
        { key: '/users', icon: <TeamOutlined />, label: 'Quản lý nhân viên' },
        { key: '/schedules', icon: <ClockCircleOutlined />, label: 'Lịch làm việc' },
        { key: '/reports', icon: <FileTextOutlined />, label: 'Báo cáo' },
      ],
      dentist: [
        { key: '/appointments', icon: <CalendarOutlined />, label: 'Lịch khám' },
        { key: '/certificates', icon: <FileTextOutlined />, label: 'Chứng chỉ' },
        { key: '/patients', icon: <HeartOutlined />, label: 'Bệnh nhân' },
      ],
      nurse: [
        { key: '/assistance', icon: <MedicineBoxOutlined />, label: 'Hỗ trợ khám' },
        { key: '/schedule', icon: <ClockCircleOutlined />, label: 'Lịch làm việc' },
      ],
      receptionist: [
        { key: '/bookings', icon: <CalendarOutlined />, label: 'Đặt lịch hẹn' },
        { key: '/customers', icon: <UserSwitchOutlined />, label: 'Khách hàng' },
      ],
      patient: [
        { key: '/my-appointments', icon: <CalendarOutlined />, label: 'Lịch hẹn của tôi' },
        { key: '/dentists', icon: <TeamOutlined />, label: 'Nha sĩ' },
      ],
    };

    return [...baseItems, ...(roleBasedItems[user?.role] || [])];
  };

  const menuItems = getNavigationItems();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ cá nhân',
      onClick: () => navigate('/profile'),
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
      danger: true,
    },
  ];

  return (
    <Layout className="min-h-screen">
      {/* Desktop Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="hidden lg:block"
        width={280}
        collapsedWidth={80}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl primary-gradient flex items-center justify-center shadow-lg">
              <img 
                src={smileDentalLogo} 
                alt="Smile Dental" 
                className="w-6 h-6 object-contain"
              />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-gray-800">Smile Dental</span>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar 
              size={40} 
              icon={<UserOutlined />}
              className="primary-gradient"
            />
            {!collapsed && (
              <div>
                <Text className="text-sm font-medium text-gray-900 block">
                  {user?.fullName}
                </Text>
                <Text className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="border-0 bg-transparent"
          style={{ background: 'transparent' }}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg primary-gradient flex items-center justify-center">
              <img 
                src={smileDentalLogo} 
                alt="Smile Dental" 
                className="w-5 h-5 object-contain"
              />
            </div>
            <span className="text-lg font-bold text-gray-800">Smile Dental</span>
          </div>
        }
        placement="left"
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        width={280}
        className="lg:hidden"
      >
        {/* User Info */}
        <div className="p-4 border-b border-gray-200 mb-4">
          <div className="flex items-center space-x-3">
            <Avatar 
              size={40} 
              icon={<UserOutlined />}
              className="primary-gradient"
            />
            <div>
              <Text className="text-sm font-medium text-gray-900 block">
                {user?.fullName}
              </Text>
              <Text className="text-xs text-gray-500 capitalize">
                {user?.role}
              </Text>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="border-0"
          onClick={({ key }) => {
            navigate(key);
            setMobileMenuVisible(false);
          }}
        />
      </Drawer>

      <Layout>
        {/* Header */}
        <Header className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuVisible(true)}
              className="lg:hidden"
            />
            
            {/* Desktop collapse button */}
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:block"
            />

            {/* Search bar */}
            <Input
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined />}
              className="w-80 hidden md:block"
            />
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Tooltip title="Thông báo">
              <Badge count={5} size="small">
                <Button 
                  type="text" 
                  icon={<BellOutlined />} 
                />
              </Badge>
            </Tooltip>

            {/* User Menu */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <Avatar 
                  size={32} 
                  icon={<UserOutlined />}
                  className="primary-gradient"
                />
                <div className="hidden md:block">
                  <Text className="text-sm font-medium text-gray-900 block">
                    {user?.fullName}
                  </Text>
                  <Text className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </Text>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Main Content */}
        <Content>
          <div className="fade-in">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
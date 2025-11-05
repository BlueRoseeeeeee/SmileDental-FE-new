import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Typography, Space, Drawer } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  CalendarOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
  HistoryOutlined,
  FileTextOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import ChatBox from '../ChatBox';
import './PatientLayout.css';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

const PatientLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Debug logging
  console.log('🏥 PatientLayout rendered', {
    pathname: location.pathname,
    user: user ? { id: user._id, role: user.role, name: user.fullName } : null
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    {
      key: '/patient',
      icon: <HomeOutlined />,
      label: 'Trang chủ',
      onClick: () => navigate('/patient')
    },
    {
      key: '/patient/booking/select-service',
      icon: <CalendarOutlined />,
      label: 'Đặt lịch khám',
      onClick: () => navigate('/patient/booking/select-service')
    },
    {
      key: '/patient/appointments',
      icon: <HistoryOutlined />,
      label: 'Lịch khám của tôi',
      onClick: () => navigate('/patient/appointments')
    },
    {
      key: '/patient/records',
      icon: <FileTextOutlined />,
      label: 'Hồ sơ của tôi',
      onClick: () => navigate('/patient/records')
    },
    {
      key: '/patient/invoices',
      icon: <DollarOutlined />,
      label: 'Hóa đơn của tôi',
      onClick: () => navigate('/patient/invoices')
    },
    {
      key: '/patient/profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => navigate('/patient/profile')
    }
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => navigate('/patient/profile')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
      danger: true
    }
  ];

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/patient/booking')) {
      return '/patient/booking/select-service';
    }
    if (path === '/patient/profile') {
      return '/patient/profile';
    }
    if (path === '/patient/appointments') {
      return '/patient/appointments';
    }
    if (path === '/patient/records') {
      return '/patient/records';
    }
    if (path === '/patient/invoices') {
      return '/patient/invoices';
    }
    return '/patient';
  };

  return (
    <Layout className="patient-layout">
      <Header className="patient-header">
        <div className="patient-header-content">
          <div className="logo-section">
            <Button
              className="mobile-menu-btn"
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerVisible(true)}
            />
            <div className="logo" onClick={() => navigate('/patient')}>
              <Space>
                <img 
                  src="/smile-icon.png" 
                  alt="SmileCare" 
                  style={{ height: 32 }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <Text strong style={{ color: '#2c5f4f', fontSize: 18 }}>
                  SmileCare Dental
                </Text>
              </Space>
            </div>
          </div>

          <Menu
            mode="horizontal"
            selectedKeys={[getSelectedKey()]}
            items={menuItems}
            className="desktop-menu"
            style={{ flex: 1, minWidth: 0, border: 0 }}
          />

          <div className="user-section">
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Space className="user-info" style={{ cursor: 'pointer' }}>
                <Avatar 
                  icon={<UserOutlined />}
                  src={user?.avatar}
                  style={{ backgroundColor: '#2c5f4f' }}
                />
                <Text className="user-name">
                  {user?.fullName || 'Bệnh nhân'}
                </Text>
              </Space>
            </Dropdown>
          </div>
        </div>
      </Header>

      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        className="mobile-drawer"
      >
        <Menu
          mode="vertical"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          style={{ border: 0 }}
        />
        <div style={{ padding: '16px 0', borderTop: '1px solid #f0f0f0', marginTop: 16 }}>
          <Menu
            mode="vertical"
            items={userMenuItems}
            style={{ border: 0 }}
          />
        </div>
      </Drawer>

      <Content className="patient-content">
        <div className="patient-content-wrapper">
          <Outlet />
        </div>
      </Content>

      <Footer className="patient-footer">
        <div className="footer-content">
          <Text>© 2025 Smile Care Dental Clinic. All rights reserved.</Text>
          <Space>
            <Text type="secondary">Hotline: 1900-xxxx</Text>
            <Text type="secondary">Email: contact@smilecare.vn</Text>
          </Space>
        </div>
      </Footer>

      {/* AI Chatbot - Floating icon in bottom right */}
      <ChatBox />
    </Layout>
  );
};

export default PatientLayout;

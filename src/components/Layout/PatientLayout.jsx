import React, { useState, useEffect } from 'react';
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
  DollarOutlined,
  LockOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import ChatBox from '../ChatBox';
import './PatientLayout.css';
import Footer from './Footer';
import logo from '../../assets/image/smile-dental-logo.png';
import { COLOR_BRAND_NAME } from '../../utils/common-colors';
import { servicesService } from '../../services/servicesService';

const { Header, Content} = Layout;
const { Text } = Typography;

const PatientLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [services, setServices] = useState([]);

  // Debug logging
  console.log('🏥 PatientLayout rendered', {
    pathname: location.pathname,
    user: user ? { id: user._id, role: user.role, name: user.fullName } : null
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await servicesService.getServices(1, 100);
      setServices(response.services || []);
    } catch {
      setServices([]);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getServicesMenuItems = () => {
    const activeServices = services.filter(service => service.isActive);
    const menuItems = activeServices.map(service => ({
      key: `/patient/services/pl/${encodeURIComponent(service.name)}/addons`,
      label: service.name,
      onClick: () => navigate(`/patient/services/pl/${encodeURIComponent(service.name)}/addons`)
    }));
    return menuItems;
  };

  const serviceMenuItems = getServicesMenuItems();
  
  const menuItems = [
    {
      key: '/patient',
      label: 'Trang chủ',
      onClick: () => navigate('/patient')
    },
    {
      key: '/patient/dentists',
      label: 'Đội ngũ nha sĩ',
      onClick: () => navigate('/patient/dentists')
    },
    // Thêm menu Dịch vụ với dropdown
    {
      key: '/patient/services',
      label: 'Dịch vụ',
      children: serviceMenuItems.length > 0 ? serviceMenuItems : undefined,
      onClick: serviceMenuItems.length === 0 ? () => navigate('/patient/services') : undefined
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
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => navigate('/patient/profile')
    },
    {
      key: 'change-password',
      icon: <LockOutlined />,
      label: 'Đổi mật khẩu',
      onClick: () => navigate('/patient/change-password')
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
    if (path === '/patient/dentists') {
      return '/patient/dentists';
    }
    // Xử lý cho services menu
    if (path.startsWith('/patient/services/pl/')) {
      // Trích xuất service name từ path để highlight đúng service trong dropdown
      const match = path.match(/\/patient\/services\/pl\/([^/]+)/);
      if (match) {
        const serviceName = match[1];
        return `/patient/services/pl/${serviceName}/addons`;
      }
      return '/patient/services';
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
            {/* Logo and Brand */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer' 
              }}
              onClick={() => navigate('/patient')}
            >
              <img 
                src={logo} 
                alt="SmileDental Logo"
                style={{
                  width: '50px',
                  height: '50px',
                  marginRight: '12px'
                }}
              />
              <div style={{display:'flex', flexDirection:'column', marginRight: '50px', marginTop:'15px',maxWidth:'150px'}}>
                <h3 style={{color: COLOR_BRAND_NAME , fontSize: '22px', fontWeight: 'bold', marginBottom: '0'}}>
                  SmileCare
                </h3>
                <h3 style={{color: COLOR_BRAND_NAME, fontSize: '20px', fontWeight: 'bold', textAlign:'right'}}> Dental</h3>
              </div>
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

      <Footer/>

      {/* AI Chatbot - Floating icon in bottom right */}
      <ChatBox />
    </Layout>
  );
};

export default PatientLayout;

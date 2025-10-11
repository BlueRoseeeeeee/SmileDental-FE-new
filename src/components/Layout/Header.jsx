/*
* @author: HoTram
*/
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography } from 'antd';
import { 
  MenuOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { servicesService } from '../../services/servicesService';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [services, setServices] = useState([]);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await servicesService.getServices(1, 100);
      setServices(response.services || []);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => navigate('/profile')
    },
    {
      key: 'change-password',
      icon: <SettingOutlined />,
      label: 'Đổi mật khẩu',
      onClick: () => navigate('/change-password')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout
    }
  ];

  const getServicesMenuItems = () => {
    return services
      .filter(service => service.isActive)
      .map(service => ({
        key: service._id,
        label: service.name,
        onClick: () => navigate('/login')
      }));
  };

  // Menu items based on authentication status
  const getMenuItems = () => {
    if (user) {
      // Menu for authenticated users
      return [
        {
          key: '/',
          label: 'Trang chủ'
        },
        {
          key: '/dashboard',
          label: 'Dashboard'
        }
      ];
    } else {
      // Menu for non-authenticated users
      return [
        {
          key: '/',
          label: 'Trang chủ'
        },
        {
          key: '/about',
          label: 'Giới thiệu'
        },
        {
          key: '/pricing',
          label: 'Bảng giá'
        },
        {
          key: '/services',
          label: 'Dịch vụ',
          children: getServicesMenuItems()
        },
        {
          key: '/knowledge',
          label: 'Kiến thức nha khoa'
        },
        {
          key: '/contact',
          label: 'Liên hệ'
        }
      ];
    }
  };

  const handleMenuClick = ({ key }) => {
    navigate(key);
    setMobileMenuVisible(false);
  };

  return (
    <>
      <style>{`
        .services-dropdown {
          z-index: 9999 !important;
        }
        .services-dropdown .ant-menu-submenu-popup {
          z-index: 9999 !important;
        }
        .services-dropdown .ant-menu-submenu-popup .ant-menu {
          background: #ffffff !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
          border-radius: 8px !important;
          border: 1px solid #e8e8e8 !important;
          min-width: 200px !important;
          padding: 4px !important;
        }
        /* Multi-column layout for services (2 columns when > 10 items) */
        .services-dropdown .ant-menu-submenu-popup .ant-menu:has(.ant-menu-item:nth-child(11)) {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: 8px !important;
          min-width: 400px !important;
        }
        /* Fallback for browsers without :has() support */
        @supports not (selector(:has(*))) {
          .services-dropdown.multi-column .ant-menu-submenu-popup .ant-menu {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            min-width: 400px !important;
          }
        }
        .services-dropdown .ant-menu-submenu-popup .ant-menu .ant-menu-item {
          color: #1f1f1f !important;
          font-weight: 500 !important;
          height: 40px !important;
          line-height: 40px !important;
          border-radius: 6px !important;
          margin: 2px 0 !important;
          padding: 0 16px !important;
          transition: all 0.2s ease !important;
        }
        .services-dropdown .ant-menu-submenu-popup .ant-menu .ant-menu-item:hover {
          background: #f0f8ff !important;
          color: #2596be !important;
        }
      `}</style>
      <AntHeader 
        style={{ 
          background: '#fff',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100px',
          minHeight: '100px'
        }}
      >
        {/* Logo and Brand */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer' 
          }}
          onClick={() => navigate('/')}
        >
          <img 
            src="/src/assets/image/smile-dental-logo.png" 
            alt="SmileDental Logo"
            style={{
              width: '50px',
              height: '50px',
              marginRight: '12px'
            }}
          />
          <div>
            <Text strong style={{ fontSize: '20px', color: '#2596be' }}>
              SMILE DENTAL
            </Text>
          </div>
        </div>

        {/* Desktop Menu */}
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={handleMenuClick}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            margin: '0 24px',
            display: window.innerWidth > 768 ? 'flex' : 'none',
            zIndex: 1000
          }}
          triggerSubMenuAction="hover"
          subMenuOpenDelay={0.1}
          subMenuCloseDelay={0.1}
          popupClassName={
            services.filter(service => service.isActive).length > 10 
              ? "services-dropdown multi-column" 
              : "services-dropdown"
          }
        />

        {/* User Actions */}
        <Space size="middle">
          {user ? (
            /* User Avatar and Info */
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar 
                  src={user?.avatar} 
                  icon={<UserOutlined />}
                  size="large"
                />
                <div style={{ display: window.innerWidth > 768 ? 'block' : 'none' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#262626' }}>
                    {user?.fullName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    {user?.role === 'admin' ? 'Quản trị viên' :
                     user?.role === 'manager' ? 'Quản lý' :
                     user?.role === 'dentist' ? 'Nha sĩ' :
                     user?.role === 'nurse' ? 'Y tá' :
                     user?.role === 'receptionist' ? 'Lễ tân' :
                     user?.role === 'patient' ? 'Bệnh nhân' : 'Người dùng'}
                  </div>
                </div>
              </Space>
            </Dropdown>
          ) : (
            /* Login/Register Buttons for non-authenticated users */
            <Space>
              <Button 
                onClick={() => navigate('/register')}
                style={{
                  background: '#52c41a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}
              >
                Đăng ký
              </Button>
              <Button 
                onClick={() => navigate('/login')}
                style={{
                  background: '#52c41a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}
              >
                Đăng nhập
              </Button>
              <Button 
                type="primary"
                icon={<CalendarOutlined />}
                onClick={() => navigate('/login')}
                style={{
                  background: '#2596be',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}
              >
                Đặt lịch khám
              </Button>
            </Space>
          )}

          {/* Mobile Menu Button */}
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuVisible(!mobileMenuVisible)}
            style={{ display: window.innerWidth <= 768 ? 'block' : 'none' }}
          />
        </Space>

        {/* Mobile Menu */}
        {mobileMenuVisible && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1001,
            display: window.innerWidth <= 768 ? 'block' : 'none'
          }}>
            <Menu
              mode="vertical"
              selectedKeys={[location.pathname]}
              items={getMenuItems()}
              onClick={handleMenuClick}
              style={{ border: 'none' }}
              triggerSubMenuAction="click"
            />
          </div>
        )}
      </AntHeader>
    </>
  );
};

export default Header;
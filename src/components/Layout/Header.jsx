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
import { COLOR_BRAND_NAME } from '../../utils/common-colors';

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
      setServices([]);
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
    const activeServices = services.filter(service => service.isActive);
    const menuItems = activeServices.map(service => ({
      key: `/services/pl/${encodeURIComponent(service.name)}/addons`,
      label: service.name
    }));
    return menuItems;
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
      const serviceItems = getServicesMenuItems();
      const servicesMenuItem = {
        key: '/services',
        label: 'Dịch vụ'
      };
      
      // Chỉ thêm children nếu có services active
      if (serviceItems.length > 0) {
        servicesMenuItem.children = serviceItems;
      }
      
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
        servicesMenuItem,
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
        /*alignment for all menu items */
        .ant-menu-horizontal {
          border-bottom: none !important;
        }

        .ant-menu-horizontal > .ant-menu-item,
        .ant-menu-horizontal > .ant-menu-submenu {
          height: 100px !important;
          line-height: 100px !important;
          margin: 0 !important;
          padding: 0 !important;
          top: 0 !important;
        }
        
        .ant-menu-horizontal > .ant-menu-item > span,
        .ant-menu-horizontal > .ant-menu-submenu > .ant-menu-submenu-title {
          height: 100px !important;
          line-height: 100px !important;
          display: inline-flex !important;
          align-items: center !important;
          vertical-align: middle !important;
          padding: 0 20px !important;
          margin: 0 !important;
        }

        .ant-menu-horizontal > .ant-menu-submenu > .ant-menu-submenu-title > span {
          display: inline-flex !important;
          align-items: center !important;
          vertical-align: middle !important;
        }

        /* Fix icon alignment in submenu */
        .ant-menu-horizontal > .ant-menu-submenu > .ant-menu-submenu-title .ant-menu-submenu-arrow {
          margin-top: 0 !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
        }

        .ant-menu-horizontal > .ant-menu-item::after,
        .ant-menu-horizontal > .ant-menu-submenu::after {
          display: none !important;
        }

        /* Replace selected background with underline */
        .ant-menu-horizontal > .ant-menu-item-selected,
        .ant-menu-horizontal > .ant-menu-submenu-selected {
          background: transparent !important;
        }

        .ant-menu-horizontal > .ant-menu-item-selected > span,
        .ant-menu-horizontal > .ant-menu-submenu-selected > .ant-menu-submenu-title,
        .ant-menu-horizontal > .ant-menu-item-selected,
        .ant-menu-horizontal > .ant-menu-submenu-selected > .ant-menu-submenu-title {
          background: transparent !important;
          position: relative !important;
        }

        .ant-menu-horizontal > .ant-menu-item-selected > span::after,
        .ant-menu-horizontal > .ant-menu-submenu-selected > .ant-menu-submenu-title::after {
          content: '' !important;
          position: absolute !important;
          bottom: 0 !important;
          left: 15px !important;
          right: 15px !important;
          height: 3px !important;
          background: rgb(49, 59, 121) !important;
          
        }

        .ant-menu-horizontal > .ant-menu-item:hover,
        .ant-menu-horizontal > .ant-menu-submenu:hover {
          background: transparent !important;
        }

        .ant-menu-horizontal > .ant-menu-item:hover > span,
        .ant-menu-horizontal > .ant-menu-submenu:hover > .ant-menu-submenu-title {
          background: transparent !important;
        }

        /* Ensure menu items have visible text */
        .ant-menu-horizontal > .ant-menu-item,
        .ant-menu-horizontal > .ant-menu-submenu > .ant-menu-submenu-title {
          color: #333 !important;
        }

        .ant-menu-horizontal > .ant-menu-item-selected,
        .ant-menu-horizontal > .ant-menu-submenu-selected > .ant-menu-submenu-title {
          color: rgb(49, 59, 121) !important;
        }

        .services-dropdown {
          z-index: 10001 !important;
        }
        .services-dropdown .ant-menu-submenu-popup {
          z-index: 10001 !important;
        }
        .services-dropdown .ant-menu-submenu-popup .ant-menu {
          background: #ffffff !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          border-radius: 6px !important;
          min-width: 200px !important;
          z-index: 10001 !important;
        }
        .services-dropdown .ant-menu-submenu-popup .ant-menu .ant-menu-item {
          color: #333 !important;
          height: 36px !important;
          line-height: 36px !important;
          padding: 0 12px !important;
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
          <div style={{display:'flex', flexDirection:'column', marginRight: '50px', marginTop:'15px',maxWidth:'150px'}}>
            <h3 style={{color: COLOR_BRAND_NAME , fontSize: '22px', fontWeight: 'bold', marginBottom: '0'}}>
              SmileCare
            </h3>
            <h3 style={{color: COLOR_BRAND_NAME, fontSize: '20px', fontWeight: 'bold', textAlign:'right'}}> Dental</h3>
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
          popupClassName="services-dropdown"
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
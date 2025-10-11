/*
* @author: HoTram
*/
import React, { useState } from 'react';
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

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => navigate('/dashboard/profile')
    },
    {
      key: 'change-password',
      icon: <SettingOutlined />,
      label: 'Đổi mật khẩu',
      onClick: () => navigate('/dashboard/change-password')
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
          label: 'Dịch vụ'
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
        justifyContent: 'space-between'
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
          display: window.innerWidth > 768 ? 'flex' : 'none'
        }}
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
          />
        </div>
      )}
    </AntHeader>
  );
};

export default Header;

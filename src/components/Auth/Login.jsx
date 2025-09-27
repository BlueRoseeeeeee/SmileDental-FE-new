/*
* @author: HoTram
*/
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Checkbox, Space, Divider, Row, Col } from 'antd';
import { toast } from '../../services/toastService';
import { 
  UserOutlined, 
  LockOutlined, 
  EyeInvisibleOutlined, 
  EyeTwoTone,
  HeartOutlined,
  StarOutlined,
  TeamOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext.jsx';
import registerImage from '../../assets/image/hinh-anh-dang-nhap-dang-ki.png';

const { Title, Text } = Typography;

const Login = () => {
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      clearError();
      await login(values);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  return (
    <>
      <style>
        {`
          /* Fix Ant Design Form styling */
          .ant-form-item {
            margin-bottom: 24px !important;
          }
          
          .ant-input {
            height: 48px !important;
            border-radius: 8px !important;
            border: 1px solid #d9d9d9 !important;
            font-size: 16px !important;
            padding: 12px 16px !important;
            line-height: 1.5 !important;
            display: flex !important;
            align-items: center !important;
          }
          
          .ant-input:focus {
            border-color: #2596be !important;
            box-shadow: 0 0 0 2px rgba(37, 150, 190, 0.2) !important;
          }
          
          .ant-input-affix-wrapper {
            height: 48px !important;
            border-radius: 8px !important;
            border: 1px solid #d9d9d9 !important;
            display: flex !important;
            align-items: center !important;
          }
          
          .ant-input-affix-wrapper:focus-within {
            border-color: #2596be !important;
            box-shadow: 0 0 0 2px rgba(37, 150, 190, 0.2) !important;
          }
          
          .ant-input-affix-wrapper .ant-input {
            height: auto !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          
          .ant-input-password {
            height: 48px !important;
          }
          
          .ant-input-password .ant-input {
            height: 48px !important;
            border: none !important;
            box-shadow: none !important;
          }
          
          .ant-input-password:focus-within {
            border-color: #2596be !important;
            box-shadow: 0 0 0 2px rgba(37, 150, 190, 0.2) !important;
          }
          
          .ant-form-item-label > label {
            font-weight: 600 !important;
            color: #333 !important;
          }
          
          .ant-btn-primary {
            background: #2596be !important;
            border-color: #2596be !important;
            height: 48px !important;
            border-radius: 8px !important;
            font-size: 16px !important;
            font-weight: 600 !important;
          }
          
          .ant-btn-primary:hover {
            background: #1e7ba8 !important;
            border-color: #1e7ba8 !important;
          }

          /* Responsive layout for container */
          @media (max-width: 768px) {
            .register-container {
              flex-direction: column !important;
              min-height: auto !important;
            }
            .register-image {
              flex: none !important;
              height: 400px !important;
              padding: 20px !important;
            }
            .register-form {
              flex: none !important;
              padding: 24px !important;
            }
          }
        `}
      </style>
      <div style={{ 
        minHeight: '100vh', 
        background: '#e8f5e8', // Màu xanh nhạt cho nha khoa
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px 0'
      }}>
        <div 
          className="register-container"
          style={{ 
            width: '100%', 
            maxWidth: '100%', // Full width 100%
            display: 'flex',
            background: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            minHeight: 'calc(100vh - 40px)'
          }}>

          {/* Hình ảnh bên trái - 50% */}
          <div 
            className="register-image"
            style={{ 
              flex: '0 0 50%', // Chiếm 50% width
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '40px 24px',
              background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
              position: 'relative'
            }}>
            {/* Nội dung bổ sung */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ 
                color: '#2596be', 
                fontSize: '2rem', 
                fontWeight: 'bold',
                marginBottom: '16px',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                Chào mừng trở lại
              </h2>
              <h1 style={{ 
                color: '#2596be', 
                fontSize: '2.5rem', 
                fontWeight: 'bold',
                marginBottom: '20px',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                SmileDental
              </h1>
              <p style={{ 
                color: '#666', 
                fontSize: '1.1rem', 
                lineHeight: '1.6',
                maxWidth: '300px',
                margin: '0 auto'
              }}>
                Đăng nhập để tiếp tục sử dụng hệ thống quản lý phòng khám nha khoa hiện đại.
              </p>
            </div>
            
            {/* Hình ảnh */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src={registerImage} 
                alt="Login" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                }} 
              />
            </div>
            
            {/* Thông tin bổ sung */}
            <div style={{ 
              textAlign: 'center', 
              marginTop: '20px',
              padding: '20px',
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ 
                color: '#2596be', 
                fontSize: '1rem', 
                fontWeight: 'bold',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <SafetyOutlined style={{ fontSize: '16px' }} />
                  Chuyên nghiệp
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <StarOutlined style={{ fontSize: '16px' }} />
                  Uy tín
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <HeartOutlined style={{ fontSize: '16px' }} />
                  Tận tâm
                </span>
              </div>
              <p style={{ 
                color: '#666', 
                fontSize: '0.9rem',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}>
                <TeamOutlined style={{ fontSize: '14px' }} />
                Đội ngũ bác sĩ giàu kinh nghiệm
              </p>
            </div>
          </div>

          {/* Form đăng nhập bên phải - 50% */}
          <div 
            className="register-form"
            style={{ 
              flex: '0 0 50%', // Chiếm 50% width
              padding: '48px', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center' 
            }}>
            <Title level={2} style={{ 
              textAlign: 'center', 
              marginBottom: '100px', 
              color: '#2596be', // Màu xanh chủ đạo
              fontSize: '3.5rem',
              fontWeight: 'bold'
            }}>
              ĐĂNG NHẬP
            </Title>

            {/* Error Alert */}
            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                style={{ marginBottom: '24px' }}
                closable
                onClose={clearError}
              />
            )}

            {/* Login Form */}
            <Form
              form={form}
              name="login"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="login"
                label="Email hoặc Mã nhân viên"
                rules={[
                  { required: true, message: 'Vui lòng nhập email hoặc mã nhân viên!' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Nhập email hoặc mã nhân viên"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu!' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Nhập mật khẩu"
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <Form.Item name="remember" valuePropName="checked" style={{ margin: 0 }}>
                  <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                </Form.Item>
                <Link to="/forgot-password">
                  Quên mật khẩu?
                </Link>
              </div>

              <Form.Item style={{ marginBottom: '24px' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  block
                  style={{
                    background: '#2596be',
                    border: 'none',
                    borderRadius: '8px',
                    height: '48px'
                  }}
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </Form.Item>
            </Form>

            <Divider>
              <Text type="secondary">hoặc</Text>
            </Divider>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
                Chưa có tài khoản?{' '}
                <Link to="/register" style={{ color: '#2596be', fontWeight: 'bold' }}>
                  Đăng ký ngay
                </Link>
              </Text>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
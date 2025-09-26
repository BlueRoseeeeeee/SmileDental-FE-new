/*
* @author: HoTram
*/
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Checkbox, Space, Divider, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext.jsx';

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
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '16px' 
    }}>
      <Row justify="center" style={{ width: '100%', maxWidth: '1200px' }}>
        <Col xs={24} lg={12} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Left side - Branding */}
          <div style={{ textAlign: 'center', color: 'white', padding: '32px' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ 
                width: '96px', 
                height: '96px', 
                margin: '0 auto 24px', 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <span style={{ fontSize: '48px' }}>🦷</span>
              </div>
              <Title level={1} style={{ color: 'white', marginBottom: '16px' }}>
                Smile Dental
              </Title>
              <Text style={{ color: 'white', fontSize: '18px', opacity: 0.9 }}>
                Hệ thống quản lý phòng khám nha khoa hiện đại
              </Text>
            </div>
            
            <div style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px', color: 'white', opacity: 0.8, marginRight: '12px' }}>🦷</span>
                <Text style={{ color: 'white', opacity: 0.9 }}>Quản lý lịch hẹn thông minh</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px', color: 'white', opacity: 0.8, marginRight: '12px' }}>🦷</span>
                <Text style={{ color: 'white', opacity: 0.9 }}>Theo dõi bệnh nhân chi tiết</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '24px', color: 'white', opacity: 0.8, marginRight: '12px' }}>🦷</span>
                <Text style={{ color: 'white', opacity: 0.9 }}>Báo cáo thống kê đầy đủ</Text>
              </div>
            </div>
          </div>
        </Col>
        
        <Col xs={24} lg={12} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Right side - Login Form */}
          <Card 
            style={{ 
              width: '100%', 
              maxWidth: '400px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Title level={2} style={{ marginBottom: '8px' }}>
                Chào mừng trở lại
              </Title>
              <Text type="secondary">
                Đăng nhập để tiếp tục sử dụng hệ thống
              </Text>
            </div>

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
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
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
                <Link to="/register">
                  Đăng ký ngay
                </Link>
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Login;
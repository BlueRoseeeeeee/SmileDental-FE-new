import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Checkbox, Space, Divider, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone, MedicineBoxOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext.jsx';
import smileDentalLogo from '../../assets/image/smile-dental-logo.png';

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
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Row justify="center" className="w-full max-w-6xl">
        <Col xs={24} lg={12} className="flex items-center justify-center">
          {/* Left side - Branding */}
          <div className="text-center text-white p-8">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <img 
                  src={smileDentalLogo} 
                  alt="Smile Dental" 
                  className="w-16 h-16 object-contain"
                />
              </div>
              <Title level={1} className="!text-white !mb-4">
                Smile Dental
              </Title>
              <Text className="text-white text-lg opacity-90">
                Hệ thống quản lý phòng khám nha khoa hiện đại
              </Text>
            </div>
            
            <div className="space-y-4 text-left max-w-md mx-auto">
              <div className="flex items-center space-x-3">
                <MedicineBoxOutlined className="text-2xl text-white opacity-80" />
                <Text className="text-white opacity-90">Quản lý lịch hẹn thông minh</Text>
              </div>
              <div className="flex items-center space-x-3">
                <MedicineBoxOutlined className="text-2xl text-white opacity-80" />
                <Text className="text-white opacity-90">Theo dõi bệnh nhân chi tiết</Text>
              </div>
              <div className="flex items-center space-x-3">
                <MedicineBoxOutlined className="text-2xl text-white opacity-80" />
                <Text className="text-white opacity-90">Báo cáo thống kê đầy đủ</Text>
              </div>
            </div>
          </div>
        </Col>
        
        <Col xs={24} lg={12} className="flex items-center justify-center">
          {/* Right side - Login Form */}
          <Card 
            className="w-full max-w-md glass-effect"
            style={{ borderRadius: 'var(--border-radius-xl)' }}
          >
            <div className="text-center mb-8">
              <Title level={2} className="!mb-2">
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
                className="mb-6"
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

              <div className="flex items-center justify-between mb-6">
                <Form.Item name="remember" valuePropName="checked" className="!mb-0">
                  <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                </Form.Item>
                <Link to="/forgot-password">
                  Quên mật khẩu?
                </Link>
              </div>

              <Form.Item className="!mb-6">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  block
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </Form.Item>
            </Form>

            <Divider>
              <Text type="secondary">hoặc</Text>
            </Divider>

            <div className="text-center">
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
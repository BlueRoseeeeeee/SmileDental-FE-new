import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Radio, Select, Steps, Space, Divider } from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  CalendarOutlined, 
  LockOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext.jsx';

const { Title, Text } = Typography;
const { Option } = Select;

const Register = () => {
  const [step, setStep] = useState(0); // 0: Send OTP, 1: Enter OTP & Complete Registration
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const { sendOtpRegister, register: registerUser, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Step 1: Send OTP
  const handleSendOTP = async (values) => {
    try {
      clearError();
      setEmail(values.email);
      await sendOtpRegister(values.email);
      setOtpSent(true);
      setStep(1);
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  // Step 2: Complete Registration
  const handleRegister = async (values) => {
    try {
      clearError();
      await registerUser(values);
      navigate('/login', {
        state: { message: 'Đăng ký thành công! Vui lòng đăng nhập.' },
      });
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  const steps = [
    {
      title: 'Xác thực Email',
      description: 'Nhập email để nhận mã OTP',
    },
    {
      title: 'Hoàn thành đăng ký',
      description: 'Nhập thông tin cá nhân',
    },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '16px' 
    }}>
      <div style={{ width: '100%', maxWidth: '800px' }}>
        <Card 
          style={{ 
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
              }}>
                <span style={{ fontSize: '32px' }}>🦷</span>
              </div>
            </div>
            <Title level={2} style={{ marginBottom: '8px' }}>
              Đăng ký tài khoản
            </Title>
            <Text type="secondary">
              Tạo tài khoản mới để sử dụng hệ thống Smile Dental
            </Text>
          </div>

          {/* Steps */}
          <div style={{ marginBottom: '32px' }}>
            <Steps
              current={step}
              items={steps}
            />
          </div>

          {/* Success Alert for OTP sent */}
          {otpSent && step === 1 && (
            <Alert
              message={`Mã OTP đã được gửi đến email ${email}`}
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              style={{ marginBottom: '24px' }}
            />
          )}

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

          {/* Register Form */}
          {step === 0 && (
            <Form
              form={form}
              name="sendOTP"
              onFinish={handleSendOTP}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Nhập email của bạn"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    height: '48px'
                  }}
                >
                  {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                </Button>
              </Form.Item>
            </Form>
          )}

          {step === 1 && (
            <Form
              form={form}
              name="register"
              onFinish={handleRegister}
              layout="vertical"
              size="large"
              initialValues={{ email: email }}
            >
              <Form.Item
                name="otp"
                label="Mã OTP"
                rules={[
                  { required: true, message: 'Vui lòng nhập mã OTP!' },
                  { pattern: /^[0-9]{6}$/, message: 'Mã OTP phải là 6 chữ số!' }
                ]}
              >
                <Input
                  placeholder="000000"
                  maxLength={6}
                  style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '4px' }}
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                hidden
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Nhập họ và tên"
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="Nhập số điện thoại"
                />
              </Form.Item>

              <Form.Item
                name="dateOfBirth"
                label="Ngày sinh"
                rules={[{ required: true, message: 'Vui lòng chọn ngày sinh!' }]}
              >
                <Input
                  prefix={<CalendarOutlined />}
                  type="date"
                />
              </Form.Item>

              <Form.Item
                name="gender"
                label="Giới tính"
                rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
              >
                <Radio.Group>
                  <Space direction="horizontal">
                    <Radio value="male">Nam</Radio>
                    <Radio value="female">Nữ</Radio>
                    <Radio value="other">Khác</Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="role"
                label="Vai trò"
                rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
              >
                <Select placeholder="Chọn vai trò">
                  <Option value="patient">Bệnh nhân</Option>
                  <Option value="dentist">Nha sĩ</Option>
                  <Option value="nurse">Y tá</Option>
                  <Option value="receptionist">Lễ tân</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu!' },
                  { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
                  { max: 16, message: 'Mật khẩu không được quá 16 ký tự!' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Nhập mật khẩu (8-16 ký tự)"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Xác nhận mật khẩu"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Nhập lại mật khẩu"
                />
              </Form.Item>

              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    height: '48px'
                  }}
                >
                  {loading ? 'Đang đăng ký...' : 'Hoàn thành đăng ký'}
                </Button>

                <Button
                  type="default"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => {
                    setStep(0);
                    setOtpSent(false);
                    clearError();
                  }}
                  block
                  style={{ borderRadius: '8px', height: '48px' }}
                >
                  Quay lại
                </Button>
              </Space>
            </Form>
          )}

          <Divider style={{ margin: '24px 0' }}>
            <Text type="secondary">hoặc</Text>
          </Divider>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Đã có tài khoản?{' '}
              <Link to="/login">
                Đăng nhập ngay
              </Link>
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
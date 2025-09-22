import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import smileDentalLogo from '../../assets/image/smile-dental-logo.png';

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
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card 
          className="glass-effect"
          style={{ borderRadius: 'var(--border-radius-xl)' }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full primary-gradient flex items-center justify-center shadow-lg">
                <img 
                  src={smileDentalLogo} 
                  alt="Smile Dental" 
                  className="w-12 h-12 object-contain"
                />
              </div>
            </div>
            <Title level={2} className="!mb-2">
              Đăng ký tài khoản
            </Title>
            <Text type="secondary">
              Tạo tài khoản mới để sử dụng hệ thống Smile Dental
            </Text>
          </div>

          {/* Steps */}
          <div className="mb-8">
            <Steps
              current={step}
              items={steps}
              className="custom-steps"
            />
          </div>

          {/* Success Alert for OTP sent */}
          {otpSent && step === 1 && (
            <Alert
              message={`Mã OTP đã được gửi đến email ${email}`}
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              className="mb-6"
            />
          )}

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
                  prefix={<MailOutlined className="text-gray-400" />}
                  placeholder="Nhập email của bạn"
                  className="h-12"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full h-12 text-base font-medium"
                  style={{
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(24, 144, 255, 0.3)'
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
                  className="h-12 text-center text-lg tracking-widest"
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
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="Nhập họ và tên"
                  className="h-12"
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
                  prefix={<PhoneOutlined className="text-gray-400" />}
                  placeholder="Nhập số điện thoại"
                  className="h-12"
                />
              </Form.Item>

              <Form.Item
                name="dateOfBirth"
                label="Ngày sinh"
                rules={[{ required: true, message: 'Vui lòng chọn ngày sinh!' }]}
              >
                <Input
                  prefix={<CalendarOutlined className="text-gray-400" />}
                  type="date"
                  className="h-12"
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
                <Select placeholder="Chọn vai trò" className="h-12">
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
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Nhập mật khẩu (8-16 ký tự)"
                  className="h-12"
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
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Nhập lại mật khẩu"
                  className="h-12"
                />
              </Form.Item>

              <Space direction="vertical" size="middle" className="w-full">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full h-12 text-base font-medium"
                  style={{
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(24, 144, 255, 0.3)'
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
                  className="w-full h-12"
                  style={{ borderRadius: '12px' }}
                >
                  Quay lại
                </Button>
              </Space>
            </Form>
          )}

          <Divider className="!my-6">
            <Text className="text-gray-500">hoặc</Text>
          </Divider>

          <div className="text-center">
            <Text className="text-gray-600">
              Đã có tài khoản?{' '}
              <Link 
                to="/login" 
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
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
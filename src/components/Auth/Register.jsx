/*
* @author: HoTram
*/
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
import registerImage from '../../assets/image/hinh-anh-dang-nhap-dang-ki.png';

const { Title, Text } = Typography;
const { Option } = Select;

const Register = () => {
  const [step, setStep] = useState(0); // 0: Send OTP, 1: Enter OTP, 2: Personal Info, 3: Create Password
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

  // Step 2: Verify OTP
  const handleVerifyOTP = async (values) => {
    try {
      clearError();
      // Lưu thông tin OTP và chuyển sang step 3
      setStep(2);
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  // Step 3: Personal Information
  const handlePersonalInfo = async (values) => {
    try {
      clearError();
      // Lưu thông tin cá nhân và chuyển sang step 4
      setStep(3);
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  // Step 4: Create Password & Complete Registration
  const handleRegister = async (values) => {
    try {
      clearError();
      // Tự động set role là 'patient' cho người dùng đăng ký
      const userData = {
        ...values,
        role: 'patient'
      };
      await registerUser(userData);
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
      title: 'Xác thực OTP',
      description: 'Nhập mã OTP để xác thực',
    },
    {
      title: 'Thông tin cá nhân',
      description: 'Nhập thông tin cơ bản',
    },
    {
      title: 'Tạo mật khẩu',
      description: 'Tạo mật khẩu bảo mật',
    },
  ];

  return (
    <>
      <style>
        {`
          .register-steps .ant-steps-item {
            margin-right: 48px !important;
            flex: 1 !important;
            min-width: 120px !important;
          }
          .register-steps .ant-steps-item:last-child {
            margin-right: 0 !important;
          }
          .register-steps .ant-steps-item-title {
            font-size: 13px !important;
            line-height: 1.3 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .register-steps .ant-steps-item-description {
            font-size: 11px !important;
            margin-top: 2px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .register-steps .ant-steps-item-icon {
            margin-right: 8px !important;
          }
          
          /* Responsive cho header/footer */
          @media (max-width: 1200px) {
            .register-container {
              max-width: 100% !important;
              margin: 0 !important;
            }
          }
          
          @media (max-width: 768px) {
            .register-steps .ant-steps-item {
              margin-right: 16px !important;
              min-width: 80px !important;
            }
            .register-steps .ant-steps-item-title {
              font-size: 11px !important;
            }
            .register-steps .ant-steps-item-description {
              font-size: 10px !important;
            }
            
            .register-container {
              flex-direction: column !important;
              min-height: auto !important;
            }
            
            .register-image {
              flex: none !important;
              height: 300px !important;
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
        background: '#bfedfc', // Màu xanh nhạt như yêu cầu
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px 0' // Thêm padding để có không gian cho header/footer
      }}>
      <div 
        className="register-container"
        style={{ 
          width: '100%', 
          maxWidth: '1400px', // Giới hạn chiều rộng tối đa
          display: 'flex',
          background: 'white',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          minHeight: 'calc(100vh - 40px)' // Trừ đi padding
        }}>

         {/* Hình ảnh bên trái */}
         <div 
           className="register-image"
           style={{ 
             flex: 1, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
             padding: '24px',
             background: '#bfedfc' // Thêm màu nền cho phần hình ảnh
    }}>
          <img 
            src={registerImage} 
            alt="Register" 
          style={{ 
              width: '100%', 
              height: 'auto',
              maxHeight: '500px',
              objectFit: 'contain'
            }} 
          />
        </div>

        {/* Form bên phải */}
        <div 
          className="register-form"
          style={{ 
            flex: 1, 
            padding: '48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
          {/* Header */}
          <div style={{ textAlign: 'left', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <Title level={2} style={{ marginBottom: '4px', color: '#2e7d32' }}>
                  ĐĂNG KÝ
            </Title>
            <Text type="secondary">
              Tạo tài khoản mới để sử dụng hệ thống Smile Dental
            </Text>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div style={{ 
            marginBottom: '32px',
            padding: '0 24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              width: '100%',
              gap: '16px'
            }}>
              {steps.map((stepItem, index) => (
                <div key={index} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  minWidth: '120px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px',
                    backgroundColor: index < step ? '#4caf50' : index === step ? '#2e7d32' : '#d9d9d9',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {index < step ? '✓' : index + 1}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: index <= step ? '#2e7d32' : '#8c8c8c',
                    marginBottom: '4px',
                    lineHeight: '1.2'
                  }}>
                    {stepItem.title}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#8c8c8c',
                    lineHeight: '1.2',
                    textAlign: 'center'
                  }}>
                    {stepItem.description}
                  </div>
                </div>
              ))}
            </div>
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

          {/* Success Alert for OTP verified */}
          {step === 2 && (
            <Alert
              message="Mã OTP đã được xác thực thành công!"
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              style={{ marginBottom: '24px' }}
            />
          )}

          {/* Success Alert for Personal Info completed */}
          {step === 3 && (
            <Alert
              message="Thông tin cá nhân đã được lưu thành công!"
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
                    background: '#2e7d32',
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
              name="verifyOTP"
              onFinish={handleVerifyOTP}
              layout="vertical"
              size="large"
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

              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    background: '#2e7d32',
                    border: 'none',
                    borderRadius: '8px',
                    height: '48px'
                  }}
                >
                  {loading ? 'Đang xác thực...' : 'Xác thực OTP'}
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

          {step === 2 && (
            <Form
              form={form}
              name="personalInfo"
              onFinish={handlePersonalInfo}
              layout="vertical"
              size="large"
              initialValues={{ email: email }}
            >
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

              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    background: '#2e7d32',
                    border: 'none',
                    borderRadius: '8px',
                    height: '48px'
                  }}
                >
                  {loading ? 'Đang lưu...' : 'Tiếp tục'}
                </Button>

                <Button
                  type="default"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => {
                    setStep(1);
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

          {step === 3 && (
            <Form
              form={form}
              name="createPassword"
              onFinish={handleRegister}
              layout="vertical"
              size="large"
            >
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
                    background: '#2e7d32',
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
                    setStep(2);
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

          <div style={{ textAlign: 'left' }}>
            <Text type="secondary">
              Bạn đã có tài khoản?{' '}
              <Link to="/login" style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                ĐĂNG NHẬP
              </Link>
            </Text>
          </div>
        </div>

      </div>
    </div>
    </>
  );
};

export default Register;
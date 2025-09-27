/*
* @author: HoTram
*/
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Steps, Space, Divider } from 'antd';
import { 
  MailOutlined, 
  LockOutlined, 
  CheckCircleOutlined, 
  ArrowLeftOutlined,
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

const ForgotPassword = () => {
  const [step, setStep] = useState(0); // 0: Send OTP, 1: Reset Password, 2: Success
  const [email, setEmail] = useState('');
  const { sendOtpResetPassword, resetPassword, loading, error, clearError } = useAuth();
  const [form] = Form.useForm();

  const handleSendOTP = async (values) => {
    try {
      clearError();
      setEmail(values.email);
      await sendOtpResetPassword(values.email);
      setStep(1);
    } catch (err) {
      // Error handled by context
    }
  };

  const handleResetPassword = async (values) => {
    try {
      clearError();
      await resetPassword({
        email,
        otp: values.otp,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      setStep(2); // Success step
    } catch (err) {
      // Error handled by context
    }
  };

  const steps = [
    {
      title: 'Nhập Email',
      description: 'Nhập email để nhận mã OTP',
    },
    {
      title: 'Đặt lại mật khẩu',
      description: 'Nhập mã OTP và mật khẩu mới',
    },
  ];

  if (step === 2) {
    return (
      <>
        <style>
          {`
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
          background: '#e8f5e8',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px 0'
        }}>
          <div 
            className="register-container"
            style={{ 
              width: '100%', 
              maxWidth: '100%',
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
                flex: '0 0 50%',
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '40px 24px',
                background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
                position: 'relative'
              }}>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ 
                  color: '#2596be', 
                  fontSize: '2rem', 
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  Thành công!
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
                  Mật khẩu của bạn đã được cập nhật thành công. Bạn có thể đăng nhập với mật khẩu mới.
                </p>
              </div>
              
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src={registerImage} 
                  alt="Success" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%', 
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                  }} 
                />
              </div>
            </div>

            {/* Form thành công bên phải - 50% */}
            <div 
              className="register-form"
              style={{ 
                flex: '0 0 50%',
                padding: '48px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                textAlign: 'center'
              }}>
              <div style={{ marginBottom: '40px' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  margin: '0 auto 24px', 
                  backgroundColor: '#f6ffed', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <CheckCircleOutlined style={{ fontSize: '40px', color: '#52c41a' }} />
                </div>
                <Title level={2} style={{ 
                  color: '#2596be',
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  marginBottom: '16px'
                }}>
                  Đặt lại mật khẩu thành công!
                </Title>
                <Text style={{ fontSize: '1.1rem', color: '#666' }}>
                  Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập với mật khẩu mới.
                </Text>
              </div>
              
              <Button
                type="primary"
                size="large"
                block
                href="/login"
                style={{
                  background: '#2596be',
                  border: 'none',
                  borderRadius: '8px',
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Đăng nhập ngay
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>
        {`
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
        `}
      </style>
      <div style={{ 
        minHeight: '100vh', 
        background: '#e8f5e8',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px 0'
      }}>
        <div 
          className="register-container"
          style={{ 
            width: '100%', 
            maxWidth: '100%',
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
              flex: '0 0 50%',
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '40px 24px',
              background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
              position: 'relative'
            }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ 
                color: '#2596be', 
                fontSize: '2rem', 
                fontWeight: 'bold',
                marginBottom: '16px',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {step === 0 ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'}
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
                {step === 0
                  ? 'Nhập email để nhận mã xác thực đặt lại mật khẩu'
                  : `Nhập mã OTP đã gửi đến ${email} và mật khẩu mới`
                }
              </p>
            </div>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src={registerImage} 
                alt="Forgot Password" 
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
              marginTop: '20px',
              textAlign: 'center',
              color: '#666',
              fontSize: '0.9rem'
            }}>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px', 
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <SafetyOutlined style={{ fontSize: '16px' }} />
                  Bảo mật
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

          {/* Form bên phải - 50% */}
          <div 
            className="register-form"
            style={{ 
              flex: '0 0 50%',
              padding: '48px', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center'
            }}>
            
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
              <Link
                to="/login"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  color: '#2596be', 
                  textDecoration: 'none', 
                  marginBottom: '24px',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                <ArrowLeftOutlined style={{ marginRight: '8px' }} />
                Quay lại đăng nhập
              </Link>
              
              <Title level={2} style={{ 
                color: '#2596be',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                {step === 0 ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'}
              </Title>
              <Text style={{ fontSize: '1.1rem', color: '#666' }}>
                {step === 0
                  ? 'Nhập email để nhận mã xác thực đặt lại mật khẩu'
                  : `Nhập mã OTP đã gửi đến ${email} và mật khẩu mới`
                }
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
            {step === 1 && (
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

            {/* Form */}
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
                      background: '#2596be',
                      border: 'none',
                      borderRadius: '8px',
                      height: '48px',
                      fontSize: '16px',
                      fontWeight: '600'
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
                name="resetPassword"
                onFinish={handleResetPassword}
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

                <Form.Item
                  name="newPassword"
                  label="Mật khẩu mới"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                    { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
                    { max: 16, message: 'Mật khẩu không được quá 16 ký tự!' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Nhập mật khẩu mới (8-16 ký tự)"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="Xác nhận mật khẩu"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Nhập lại mật khẩu mới"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>

                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    style={{
                      background: '#2596be',
                      border: 'none',
                      borderRadius: '8px',
                      height: '48px',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                  </Button>

                  <Button
                    type="default"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => {
                      setStep(0);
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
                <Link to="/login" style={{ color: '#2596be' }}>
                  Đăng nhập ngay
                </Link>
              </Text>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
/*
* @author: HoTram
*/
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Steps, Space, Divider } from 'antd';
import { toast } from '../../services/toastService';
import { 
  MailOutlined, 
  LockOutlined, 
  CheckCircleOutlined, 
  ArrowLeftOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext.jsx';
import registerImage from '../../assets/image/hinh-anh-dang-nhap-dang-ki.png';
import './ForgotPassword.css';
import { COLOR_BRAND_NAME } from '../../utils/common-colors.js';

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
      toast.success(`Mã OTP đã được gửi đến email ${values.email}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi OTP thất bại');
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
      toast.success('Đặt lại mật khẩu thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt lại mật khẩu thất bại');
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
      <div style={{ 
        minHeight: 'calc(100vh - 120px)',
        background: '#e8f5e8',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        margin: '-24px -24px 0 -24px',
        overflowX: 'hidden',
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box'
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
            minHeight: 'calc(100vh - 200px)',
            boxSizing: 'border-box'
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
                  SmileCare Dental
                </h1>
              </div>
              
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src={registerImage} 
                  alt="Success" 
                  style={{ 
                    maxWidth: '80%', 
                    maxHeight: '80%', 
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
                  fontSize: '2rem',
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
    );
  }

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 120px)', // Trừ đi chiều cao header và footer
      background: '#e8f5e8',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      margin: '-24px -24px 0 -24px', // Loại bỏ padding mặc định của Ant Design Content
      overflowX: 'hidden',
      width: '100%',
      maxWidth: '100vw',
      boxSizing: 'border-box'
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
          minHeight: 'calc(100vh - 200px)',
          boxSizing: 'border-box'
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
              <h1 style={{ 
                color: COLOR_BRAND_NAME, 
                fontSize: '2.5rem', 
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginTop: '20px'
              }}>
                SmileCare Dental
              </h1>
            </div>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src={registerImage} 
                alt="Forgot Password" 
                style={{ 
                  maxWidth: '85%', 
                  maxHeight: '85%', 
                  objectFit: 'cover',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                }} 
              />
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

            {/* Toast notifications đã được xử lý trong handleSendOTP và handleResetPassword */}

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
  );
};

export default ForgotPassword;
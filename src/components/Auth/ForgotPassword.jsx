import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Steps, Space, Divider } from 'antd';
import { 
  MailOutlined, 
  LockOutlined, 
  CheckCircleOutlined, 
  ArrowLeftOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext.jsx';

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
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '16px' 
      }}>
        <Card 
          style={{ 
            width: '100%', 
            maxWidth: '400px', 
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              margin: '0 auto 16px', 
              backgroundColor: '#f6ffed', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <CheckCircleOutlined style={{ fontSize: '40px', color: '#52c41a' }} />
            </div>
            <Title level={2} style={{ marginBottom: '8px' }}>
              Đặt lại mật khẩu thành công!
            </Title>
            <Text type="secondary">
              Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập với mật khẩu mới.
            </Text>
          </div>
          
          <Button
            type="primary"
            size="large"
            block
            href="/login"
            style={{
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              border: 'none',
              borderRadius: '8px',
              height: '48px'
            }}
          >
            Đăng nhập ngay
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '16px' 
    }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
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
            <Link
              to="/login"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                color: '#1890ff', 
                textDecoration: 'none', 
                marginBottom: '16px' 
              }}
            >
              <ArrowLeftOutlined style={{ marginRight: '4px' }} />
              Quay lại đăng nhập
            </Link>
            
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
              {step === 0 ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'}
            </Title>
            <Text type="secondary">
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
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    height: '48px'
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

export default ForgotPassword;
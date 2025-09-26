/*
* @author: HoTram
*/
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Typography, Alert, Radio, Steps, Space, Divider } from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  CalendarOutlined, 
  LockOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { useFormPersistence } from '../../hooks/useFormPersistence';
import { useAuth } from '../../contexts/AuthContext';
import registerImage from '../../assets/image/hinh-anh-dang-nhap-dang-ki.png';

const { Title } = Typography;

const RegisterRHF = () => {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  const { sendOtpRegister, register: registerUser, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Default values cho form
  const defaultValues = {
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    password: '',
    confirmPassword: '',
    email: '',
    otp: ''
  };

  // Sử dụng custom hook cho form persistence
  const { form, clearStoredData } = useFormPersistence('registerFormData', defaultValues);

  // Steps configuration
  const steps = [
    {
      title: 'Thông tin cá nhân',
      description: 'Nhập thông tin cơ bản',
    },
    {
      title: 'Tạo mật khẩu',
      description: 'Tạo mật khẩu bảo mật',
    },
    {
      title: 'Xác thực Email',
      description: 'Nhập email để nhận mã OTP',
    },
    {
      title: 'Xác thực OTP',
      description: 'Nhập mã OTP để xác thực',
    },
  ];

  // Step 1: Personal Information
  const handlePersonalInfo = async (data) => {
    try {
      clearError();
      setStep(1);
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  // Step 2: Create Password
  const handleCreatePassword = async (data) => {
    try {
      clearError();
      setStep(2);
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  // Step 3: Send OTP
  const handleSendOTP = async (data) => {
    try {
      clearError();
      setEmail(data.email);
      await sendOtpRegister(data.email);
      setOtpSent(true);
      setStep(3);
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  // Step 4: Verify OTP & Complete Registration
  const handleVerifyOTP = async (data) => {
    try {
      clearError();
      
      // Lấy tất cả dữ liệu từ form
      const allData = form.getValues();
      
      // Tự động set role là 'patient' cho người dùng đăng ký
      const userData = {
        fullName: allData.fullName,
        phone: allData.phone,
        dateOfBirth: allData.dateOfBirth,
        gender: allData.gender,
        password: allData.password,
        email: email,
        otp: data.otp,
        role: 'patient'
      };

      await registerUser(userData);
      
      // Xóa dữ liệu đã lưu sau khi đăng ký thành công
      clearStoredData();
      
      navigate('/login', {
        state: { message: 'Đăng ký thành công! Vui lòng đăng nhập.' },
      });
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  // Auto-capitalize full name
  const handleFullNameBlur = (e) => {
    const value = e.target.value;
    if (value) {
      const formattedName = value
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      form.setValue('fullName', formattedName);
    }
  };

  return (
    <>
      <style>
        {`
          .register-steps .ant-steps-item {
            margin-right: 48px !important;
            flex: 1 !important;
            min-width: 120px !important;
          }
          
          .register-container {
            display: flex;
            min-height: 600px;
            background: white;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          
          .register-image {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: #bfedfc;
          }
          
          .register-form {
            flex: 1;
            padding: 40px;
            background: #bfedfc;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          
          .form-group {
            margin-bottom: 24px;
          }
          
          .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #333;
          }
          
          .form-input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #d9d9d9;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
          }
          
          .form-input:focus {
            outline: none;
            border-color: #1890ff;
            box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
          }
          
          .form-error {
            color: #ff4d4f;
            font-size: 14px;
            margin-top: 4px;
          }
          
          .radio-group {
            display: flex;
            gap: 16px;
          }
          
          .radio-item {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .password-input {
            position: relative;
          }
          
          .password-toggle {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            color: #8c8c8c;
          }
          
          .password-toggle:hover {
            color: #1890ff;
          }
          
          @media (max-width: 768px) {
            .register-container {
              flex-direction: column;
              min-height: auto;
            }
            
            .register-image {
              flex: none;
              height: 300px;
            }
            
            .register-form {
              flex: none;
              padding: 24px;
            }
          }
        `}
      </style>

      <div style={{ 
        minHeight: '100vh', 
        background: '#bfedfc',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px 0'
      }}>
        <div 
          className="register-container"
          style={{ 
            width: '100%', 
            maxWidth: '1400px',
            display: 'flex',
            background: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            minHeight: 'calc(100vh - 40px)'
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
              background: '#bfedfc'
            }}>
            <img 
              src={registerImage} 
              alt="Đăng ký" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain' 
              }} 
            />
          </div>

          {/* Form bên phải */}
          <div className="register-form">
            <Title level={2} style={{ color: '#2e7d32', textAlign: 'center', marginBottom: '30px' }}>
              ĐĂNG KÝ
            </Title>

            {/* Steps */}
            <Steps
              current={step}
              items={steps}
              className="register-steps"
              style={{ marginBottom: '40px' }}
            />

            {/* Success Alerts */}
            {otpSent && step === 2 && (
              <Alert
                message={`Mã OTP đã được gửi đến email ${email}`}
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                style={{ marginBottom: '24px' }}
              />
            )}

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

            {/* Step 1: Personal Information Form */}
            {step === 0 && (
              <form onSubmit={form.handleSubmit(handlePersonalInfo)}>
                <div className="form-group">
                  <label className="form-label">
                    Họ và tên <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    {...form.register('fullName', {
                      required: 'Vui lòng nhập họ và tên!',
                      minLength: { value: 2, message: 'Họ và tên phải có ít nhất 2 ký tự!' },
                      maxLength: { value: 50, message: 'Họ và tên không được quá 50 ký tự!' }
                    })}
                    className="form-input"
                    placeholder="Nhập họ và tên đầy đủ (VD: Nguyễn Văn A)"
                    onBlur={handleFullNameBlur}
                  />
                  {form.formState.errors.fullName && (
                    <div className="form-error">{form.formState.errors.fullName.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Số điện thoại <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    {...form.register('phone', {
                      required: 'Vui lòng nhập số điện thoại!',
                      pattern: {
                        value: /^[0-9]{10,11}$/,
                        message: 'Số điện thoại phải có 10-11 chữ số (VD: 0123456789)'
                      }
                    })}
                    className="form-input"
                    placeholder="Nhập số điện thoại (VD: 0123456789)"
                  />
                  {form.formState.errors.phone && (
                    <div className="form-error">{form.formState.errors.phone.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Ngày sinh <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    {...form.register('dateOfBirth', {
                      required: 'Vui lòng chọn ngày sinh!',
                      validate: (value) => {
                        if (!value) return 'Vui lòng chọn ngày sinh!';
                        const today = new Date();
                        const birthDate = new Date(value);
                        const age = today.getFullYear() - birthDate.getFullYear();
                        if (age < 0) return 'Ngày sinh không hợp lệ!';
                        if (age < 1) return 'Tuổi tối thiểu là 1 tuổi!';
                        if (age > 100) return 'Tuổi tối đa là 100 tuổi!';
                        return true;
                      }
                    })}
                    type="date"
                    className="form-input"
                    placeholder="dd/mm/yyyy"
                  />
                  {form.formState.errors.dateOfBirth && (
                    <div className="form-error">{form.formState.errors.dateOfBirth.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Giới tính <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div className="radio-group">
                    <div className="radio-item">
                      <input
                        {...form.register('gender', { required: 'Vui lòng chọn giới tính!' })}
                        type="radio"
                        value="male"
                        id="male"
                      />
                      <label htmlFor="male">Nam</label>
                    </div>
                    <div className="radio-item">
                      <input
                        {...form.register('gender')}
                        type="radio"
                        value="female"
                        id="female"
                      />
                      <label htmlFor="female">Nữ</label>
                    </div>
                    <div className="radio-item">
                      <input
                        {...form.register('gender')}
                        type="radio"
                        value="other"
                        id="other"
                      />
                      <label htmlFor="other">Khác</label>
                    </div>
                  </div>
                  {form.formState.errors.gender && (
                    <div className="form-error">{form.formState.errors.gender.message}</div>
                  )}
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  style={{
                    width: '100%',
                    height: '56px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    backgroundColor: '#2e7d32',
                    borderColor: '#2e7d32',
                    borderRadius: '8px'
                  }}
                >
                  Tiếp theo
                </Button>
              </form>
            )}

            {/* Step 2: Create Password Form */}
            {step === 1 && (
              <form onSubmit={form.handleSubmit(handleCreatePassword)}>
                <div className="form-group">
                  <label className="form-label">
                    Mật khẩu <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div className="password-input">
                    <input
                      {...form.register('password', {
                        required: 'Vui lòng nhập mật khẩu!',
                        minLength: { value: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
                        maxLength: { value: 16, message: 'Mật khẩu không được quá 16 ký tự!' },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                          message: 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số!'
                        }
                      })}
                      type="password"
                      className="form-input"
                      placeholder="Nhập mật khẩu (8-16 ký tự, có chữ hoa, thường và số)"
                    />
                  </div>
                  {form.formState.errors.password && (
                    <div className="form-error">{form.formState.errors.password.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Xác nhận mật khẩu <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div className="password-input">
                    <input
                      {...form.register('confirmPassword', {
                        required: 'Vui lòng xác nhận mật khẩu!',
                        validate: (value) => {
                          const password = form.getValues('password');
                          return value === password || 'Mật khẩu xác nhận không khớp!';
                        }
                      })}
                      type="password"
                      className="form-input"
                      placeholder="Nhập lại mật khẩu để xác nhận"
                    />
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <div className="form-error">{form.formState.errors.confirmPassword.message}</div>
                  )}
                </div>

                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    style={{
                      width: '100%',
                      height: '56px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      backgroundColor: '#2e7d32',
                      borderColor: '#2e7d32',
                      borderRadius: '8px'
                    }}
                  >
                    Tiếp theo
                  </Button>

                  <Button
                    type="default"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => setStep(0)}
                    style={{ width: '100%', height: '48px' }}
                  >
                    Quay lại
                  </Button>
                </Space>
              </form>
            )}

            {/* Step 3: Send OTP Form */}
            {step === 2 && (
              <form onSubmit={form.handleSubmit(handleSendOTP)}>
                <div className="form-group">
                  <label className="form-label">
                    Email <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    {...form.register('email', {
                      required: 'Vui lòng nhập email!',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email không hợp lệ! (VD: example@gmail.com)'
                      }
                    })}
                    className="form-input"
                    placeholder="Nhập email của bạn (VD: example@gmail.com)"
                  />
                  {form.formState.errors.email && (
                    <div className="form-error">{form.formState.errors.email.message}</div>
                  )}
                </div>

                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    style={{
                      width: '100%',
                      height: '56px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      backgroundColor: '#2e7d32',
                      borderColor: '#2e7d32',
                      borderRadius: '8px'
                    }}
                  >
                    {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                  </Button>

                  <Button
                    type="default"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => setStep(1)}
                    style={{ width: '100%', height: '48px' }}
                  >
                    Quay lại
                  </Button>
                </Space>
              </form>
            )}

            {/* Step 4: Verify OTP Form */}
            {step === 3 && (
              <form onSubmit={form.handleSubmit(handleVerifyOTP)}>
                <div className="form-group">
                  <label className="form-label">
                    Mã OTP <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    {...form.register('otp', {
                      required: 'Vui lòng nhập mã OTP!',
                      pattern: {
                        value: /^[0-9]{6}$/,
                        message: 'Mã OTP phải là 6 chữ số! (VD: 123456)'
                      }
                    })}
                    className="form-input"
                    placeholder="Nhập 6 chữ số OTP (VD: 123456)"
                    maxLength={6}
                    style={{ 
                      textAlign: 'center', 
                      fontSize: '18px', 
                      letterSpacing: '4px'
                    }}
                  />
                  {form.formState.errors.otp && (
                    <div className="form-error">{form.formState.errors.otp.message}</div>
                  )}
                </div>

                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    style={{
                      width: '100%',
                      height: '56px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      backgroundColor: '#2e7d32',
                      borderColor: '#2e7d32',
                      borderRadius: '8px'
                    }}
                  >
                    {loading ? 'Đang xác thực...' : 'Xác thực OTP'}
                  </Button>

                  <Button
                    type="default"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => setStep(2)}
                    style={{ width: '100%', height: '48px' }}
                  >
                    Quay lại
                  </Button>
                </Space>
              </form>
            )}

            {/* Login Link */}
            <Divider />
            <div style={{ textAlign: 'center' }}>
              <span style={{ color: '#666' }}>Bạn đã có tài khoản? </span>
              <Link 
                to="/login" 
                style={{ 
                  color: '#2e7d32', 
                  fontWeight: 'bold',
                  textDecoration: 'none'
                }}
              >
                ĐĂNG NHẬP
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterRHF;

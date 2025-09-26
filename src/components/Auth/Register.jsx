/*
* @author: HoTram
*/
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Typography, Alert, Radio, Steps, Space, Divider } from 'antd';
import { 
  CheckCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import registerImage from '../../assets/image/hinh-anh-dang-nhap-dang-ki.png';

const { Title } = Typography;


// Form đăng ký dành cho BỆNH NHÂN - role luôn là 'patient'
const RegisterRHF = () => {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  
  const { sendOtpRegister, register: registerUser, verifyOtp, loading, error, clearError } = useAuth();
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

  // Sử dụng React Hook Form với persistence
  const form = useForm({
    defaultValues,
    mode: 'onBlur'
  });
  
  const { handleSubmit, formState: { errors }, setValue, getValues, watch, register, reset } = form;
  
  // Khôi phục dữ liệu từ localStorage khi component mount (trừ OTP)
  React.useEffect(() => {
    const savedData = localStorage.getItem('registerFormData');
    if (savedData) {
      const data = JSON.parse(savedData);
      // OTP không được khôi phục vì chỉ dùng 1 lần
      reset(data);
      setStep(data.step || 0);
      setEmail(data.email || '');
      setOtpSent(data.otpSent || false);
    }
  }, [reset]);
  
  // Lưu dữ liệu vào localStorage mỗi khi có thay đổi (trừ OTP)
  React.useEffect(() => {
    const subscription = watch((value) => {
      // Loại bỏ OTP khỏi dữ liệu lưu trữ
      const { otp, ...dataToSave } = value;
      localStorage.setItem('registerFormData', JSON.stringify({
        ...dataToSave,
        step,
        email,
        otpSent
      }));
    });
    return () => subscription.unsubscribe();
  }, [watch, step, email, otpSent]);

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
      // Kiểm tra validation cơ bản
      if (!data.fullName || !data.phone || !data.dateOfBirth || !data.gender) {
        return; // Không chuyển bước nếu thiếu thông tin
      }
      console.log('Personal info saved:', data); // Debug log
      // Lưu dữ liệu vào form state
      setValue('fullName', data.fullName);
      setValue('phone', data.phone);
      setValue('dateOfBirth', data.dateOfBirth);
      setValue('gender', data.gender);
      setStep(1);
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  // Step 2: Create Password
  const handleCreatePassword = async (data) => {
    try {
      clearError();
      // Kiểm tra validation cơ bản
      if (!data.password || !data.confirmPassword || data.password !== data.confirmPassword) {
        return; // Không chuyển bước nếu thiếu thông tin
      }
      console.log('Password info saved:', data); // Debug log
      // Lưu dữ liệu vào form state
      setValue('password', data.password);
      setValue('confirmPassword', data.confirmPassword);
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
      // Lưu email vào form state
      setValue('email', data.email);
      const response = await sendOtpRegister(data.email);
      setOtpMessage(response.message || 'OTP đăng ký đã được gửi đến email');
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
      
      // Bước 1: Verify OTP trước
      await verifyOtp(data.otp, email);
      
      // Bước 2: Lấy tất cả dữ liệu từ form
      const allData = form.getValues();
      console.log('All form data:', allData); // Debug log
      
      // Kiểm tra xem có đủ dữ liệu không
      if (!allData.fullName || !allData.phone || !allData.dateOfBirth || !allData.gender || !allData.password || !allData.email) {
        console.error('Missing required data:', allData);
        return; // Không gửi nếu thiếu dữ liệu
      }
      
      // Form đăng ký dành cho BỆNH NHÂN - role luôn là 'patient'
      const userData = {
        fullName: allData.fullName,
        phone: allData.phone,
        dateOfBirth: allData.dateOfBirth,
        gender: allData.gender,
        password: allData.password,
        confirmPassword: allData.confirmPassword, // Backend yêu cầu confirmPassword
        email: allData.email || email, // Ưu tiên email từ form state
        role: 'patient', // CỐ ĐỊNH: Form đăng ký này chỉ dành cho bệnh nhân
        type: 'fullTime' // Type mặc định cho bệnh nhân
      };
      
      console.log('User data to register:', userData); // Debug log

      await registerUser(userData);
      
      // Xóa dữ liệu đã lưu sau khi đăng ký thành công
      localStorage.removeItem('registerFormData');
      
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
                message={otpMessage}
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                style={{ marginBottom: '24px' }}
              />
            )}

            {step === 3 && (
              <Alert
                message="OTP đăng ký đã được gửi đến email!"
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
              <form onSubmit={handleSubmit(handlePersonalInfo)}>
                <div className="form-group">
                  <label className="form-label">
                    Họ và tên <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    {...register('fullName', { required: 'Vui lòng nhập họ và tên!' })}
                    className="form-input"
                    placeholder="Nhập họ và tên đầy đủ (VD: Nguyễn Văn A)"
                    onBlur={handleFullNameBlur}
                  />
                  {errors.fullName && (
                    <div className="form-error">{errors.fullName.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Số điện thoại <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    {...register('phone', { required: 'Vui lòng nhập số điện thoại!' })}
                    className="form-input"
                    placeholder="Nhập số điện thoại (VD: 0123456789)"
                  />
                  {errors.phone && (
                    <div className="form-error">{errors.phone.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Ngày sinh <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    {...register('dateOfBirth', { required: 'Vui lòng chọn ngày sinh!' })}
                    type="date"
                    className="form-input"
                    placeholder="dd/mm/yyyy"
                  />
                  {errors.dateOfBirth && (
                    <div className="form-error">{errors.dateOfBirth.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Giới tính <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div className="radio-group">
                    <div className="radio-item">
                      <input
                        {...register('gender', { required: 'Vui lòng chọn giới tính!' })}
                        type="radio"
                        value="male"
                        id="male"
                      />
                      <label htmlFor="male">Nam</label>
                    </div>
                    <div className="radio-item">
                      <input
                        {...register('gender')}
                        type="radio"
                        value="female"
                        id="female"
                      />
                      <label htmlFor="female">Nữ</label>
                    </div>
                    <div className="radio-item">
                      <input
                        {...register('gender')}
                        type="radio"
                        value="other"
                        id="other"
                      />
                      <label htmlFor="other">Khác</label>
                    </div>
                  </div>
                  {errors.gender && (
                    <div className="form-error">{errors.gender.message}</div>
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
              <form onSubmit={handleSubmit(handleCreatePassword)}>
                <div className="form-group">
                  <label className="form-label">
                    Mật khẩu <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div className="password-input">
                    <input
                      {...register('password', {
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
                  {errors.password && (
                    <div className="form-error">{errors.password.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Xác nhận mật khẩu <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div className="password-input">
                    <input
                      {...register('confirmPassword', {
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
                  {errors.confirmPassword && (
                    <div className="form-error">{errors.confirmPassword.message}</div>
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
              <form onSubmit={handleSubmit(handleSendOTP)}>
                <div className="form-group">
                  <label className="form-label">
                    Email <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    {...register('email', {
                      required: 'Vui lòng nhập email!',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email không hợp lệ! (VD: example@gmail.com)'
                      }
                    })}
                    className="form-input"
                    placeholder="Nhập email của bạn (VD: example@gmail.com)"
                  />
                  {errors.email && (
                    <div className="form-error">{errors.email.message}</div>
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
              <form onSubmit={handleSubmit(handleVerifyOTP)}>
                <div className="form-group">
                  <label className="form-label">
                    Mã OTP <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    {...register('otp', {
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
                  {errors.otp && (
                    <div className="form-error">{errors.otp.message}</div>
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

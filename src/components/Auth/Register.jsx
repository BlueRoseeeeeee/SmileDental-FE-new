/*
* @author: HoTram
*/
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Typography, Alert, Radio, Steps, Space, Divider, message } from 'antd';
import { 
  CheckCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { useFormPersistence } from '../../hooks/useFormPersistence';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

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
    mode: 'onBlur',
    rules: {
      gender: {
        required: 'Vui lòng chọn giới tính!'
      }
    }
  });
  
  const { handleSubmit, formState: { errors }, setValue, getValues, watch, register, reset } = form;
  
  // Watch email để kiểm tra validation
  const emailValue = watch('email');
  
  // Validation email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Khôi phục dữ liệu từ localStorage khi component mount (trừ OTP)
  React.useEffect(() => {
    const savedData = localStorage.getItem('registerFormData');
    if (savedData) {
      const data = JSON.parse(savedData);
      // OTP không được khôi phục vì chỉ dùng 1 lần
      const { otp, ...dataToRestore } = data;
      reset(dataToRestore);
      setStep(data.step || 0);
      setEmail(data.email || '');
      setOtpSent(data.otpSent || false);
      setOtpMessage(data.otpMessage || '');
      
      // Đảm bảo email được set vào form state
      if (data.email) {
        setValue('email', data.email);
      }
    }
  }, [reset, setValue]);
  
  // Lưu dữ liệu vào localStorage mỗi khi có thay đổi (trừ OTP)
  React.useEffect(() => {
    const subscription = watch((value) => {
      // Loại bỏ OTP khỏi dữ liệu lưu trữ, nhưng giữ lại email và thông tin cá nhân
      const { otp, ...dataToSave } = value;
      localStorage.setItem('registerFormData', JSON.stringify({
        ...dataToSave,
        step,
        email,
        otpSent,
        otpMessage
      }));
    });
    return () => subscription.unsubscribe();
  }, [watch, step, email, otpSent, otpMessage]);

  // Lưu state changes vào localStorage
  React.useEffect(() => {
    const currentData = localStorage.getItem('registerFormData');
    if (currentData) {
      const data = JSON.parse(currentData);
      localStorage.setItem('registerFormData', JSON.stringify({
        ...data,
        step,
        email,
        otpSent,
        otpMessage
      }));
    }
  }, [step, email, otpSent, otpMessage]);

  // Steps configuration
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

  // Step 1: Send OTP (Xác thực Email)
  const handleSendOTP = async (data) => {
    try {
      clearError();
      setEmail(data.email);
      // Lưu email vào form state
      setValue('email', data.email);
      // Xóa OTP cũ khi gửi OTP mới
      setValue('otp', '');
      const response = await sendOtpRegister(data.email);
      setOtpMessage(response.message || 'OTP đăng ký đã được gửi đến email');
      setOtpSent(true);
      setStep(1);
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (data) => {
    try {
      clearError();
      
      // Verify OTP
      await verifyOtp(data.otp, email);
      
      // Chuyển sang bước tiếp theo
      setStep(2);
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  // Step 3: Personal Information
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
      setStep(3);
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  // Step 4: Create Password & Complete Registration
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
      
      // Lấy tất cả dữ liệu từ form
      const allData = form.getValues();
      console.log('All form data:', allData); // Debug log
      
      // Kiểm tra xem có đủ dữ liệu không
      if (!allData.fullName || !allData.phone || !allData.dateOfBirth || !allData.gender || !allData.password || !allData.email) {
        console.error('Missing required data:', allData);
        return; // Không gửi nếu thiếu dữ liệu
      }
      
      
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
      
  

      const response = await registerUser(userData);
      
      // Hiển thị toast thành công (ưu tiên thông báo từ BE)
      const successMessage = response?.message || 'Đăng ký thành công! Vui lòng đăng nhập.';
      
      // Hiển thị toast thành công
      console.log('Success message:', successMessage); // Debug log
      
      const successAlert = document.createElement('div'); 
      successAlert.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: #52c41a;
          color: white;
          padding: 16px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 9999;
          font-size: 16px;
          font-weight: 500;
        ">
          ✅ ${successMessage}
        </div>
      `;
      document.body.appendChild(successAlert);
      
      // Tự động xóa sau 3 giây
      setTimeout(() => {
        if (successAlert.parentNode) {
          successAlert.parentNode.removeChild(successAlert);
        }
      }, 3000);
      
      // Xóa dữ liệu đã lưu sau khi đăng ký thành công
      localStorage.removeItem('registerFormData');
      
      // Chuyển trang sau khi hiển thị thông báo
      setTimeout(() => {
        navigate('/login', {
          state: { message: successMessage },
        });
      }, 2000); // Đợi 2 giây để user đọc thông báo
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
          /* Custom CSS for responsive steps */
          .register-steps {
            width: 100% !important;
            overflow: visible !important;
            display: flex !important;
            flex-wrap: nowrap !important;
          }
          .register-steps .ant-steps {
            width: 100% !important;
            overflow: visible !important;
          }
          .register-steps .ant-steps-item {
            margin-right: 80px !important;
            flex: 1 !important;
            min-width: 160px !important;
          }
          .register-steps .ant-steps-item-title {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .register-steps .ant-steps-item-description {
            white-space: normal;
            overflow: visible;
            text-overflow: unset;
            line-height: 1.4;
            max-width: none !important;
            width: auto !important;
          }

          /* Responsive layout for container */
          @media (max-width: 768px) {
            .register-container {
              min-height: auto !important;
            }
            .register-form {
              padding: 24px !important;
            }
            .register-steps .ant-steps-item {
              margin-right: 20px !important;
              min-width: 100px !important;
            }
            .register-steps .ant-steps-item-description {
              max-width: 100px !important;
              font-size: 12px !important;
            }
          }
          
          /* Đưa con mắt vào trong ô input */
          .ant-input-password .ant-input-suffix {
            right: 8px !important;
          }

          /* Custom form styling */
          .form-group {
            margin-bottom: 24px;
            position: relative;
          }

          .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
          }

          .form-input {
            width: 100%;
            height: 56px;
            padding: 12px 16px;
            font-size: 16px;
            border: 1px solid #d9d9d9;
            border-radius: 8px;
            transition: all 0.3s;
            position: relative;
            z-index: 1;
          }

          .form-input:focus {
            border-color: #40a9ff;
            box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
            outline: none;
            z-index: 2;
          }

          .form-error {
            color: red;
            font-size: 14px;
            margin-top: 8px;
          }

          /* Date input specific styling */
          input[type="date"] {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            background: #fff;
            padding-right: 12px; /* Space for the calendar icon */
          }

          /* Custom calendar icon for date input */
          input[type="date"]::-webkit-calendar-picker-indicator {
            background: transparent;
            bottom: 0;
            color: transparent;
            cursor: pointer;
            height: auto;
            left: 0;
            position: absolute;
            right: 0;
            top: 0;
            width: auto;
          }

          /* Ensure date format is dd/mm/yyyy in placeholder */
          input[type="date"]::before {
            content: attr(placeholder);
            width: 100%;
            color: #bfbfbf;
          }
          input[type="date"]:valid::before {
            content: '';
          }

          /* Force dd/mm/yyyy display for native date input */
          input[type="date"]::-webkit-datetime-edit-day-field,
          input[type="date"]::-webkit-datetime-edit-month-field,
          input[type="date"]::-webkit-datetime-edit-year-field {
            padding: 0;
          }

          input[type="date"]::-webkit-datetime-edit-day-field { order: 1; }
          input[type="date"]::-webkit-datetime-edit-month-field { order: 2; }
          input[type="date"]::-webkit-datetime-edit-year-field { order: 3; }
          input[type="date"]::-webkit-datetime-edit-text { order: 4; }
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


          {/* Form đăng ký */}
          <div 
            className="register-form"
            style={{ 
              width: '100%', 
              padding: '48px', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center' 
            }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '32px', color: '#2e7d32' }}>
              ĐĂNG KÝ
            </Title>

            <Steps 
              current={step} 
              items={steps} 
              className="register-steps"
              style={{ marginBottom: '40px' }}
            />

            {/* Success Alerts - Ưu tiên thông báo từ BE */}
            {otpSent && step === 1 && (
              <Alert
                message={otpMessage || "OTP đăng ký đã được gửi đến email!"}
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

            {/* Step 1: Email Verification Form */}
            {step === 0 && (
              <form onSubmit={handleSubmit(handleSendOTP)}>
                <div className="form-group">
                  <label className="form-label">
                    Email <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    {...register('email', { 
                      required: 'Vui lòng nhập email!',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Email không đúng định dạng! (VD: example@gmail.com)'
                      }
                    })}
                    type="email"
                    className="form-input"
                    placeholder="Nhập email của bạn (VD: example@gmail.com)"
                  />
                  {errors.email && (
                    <div className="form-error">{errors.email.message}</div>
                  )}
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={!emailValue || !isValidEmail(emailValue) || loading}
                  block
                  style={{
                    background: (!emailValue || !isValidEmail(emailValue)) ? '#bfbfbf' : '#2e7d32',
                    border: 'none',
                    borderRadius: '8px',
                    height: '48px',
                    cursor: (!emailValue || !isValidEmail(emailValue)) ? 'not-allowed' : 'pointer',
                    color: (!emailValue || !isValidEmail(emailValue)) ? '#8c8c8c' : 'white',
                    opacity: (!emailValue || !isValidEmail(emailValue)) ? 0.6 : 1
                  }}
                >
                  {loading ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
                </Button>
              </form>
            )}

            {/* Step 2: OTP Verification Form */}
            {step === 1 && (
              <form onSubmit={handleSubmit(handleVerifyOTP)}>
                <div className="form-group">
                  <label className="form-label">
                    Mã OTP <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    {...register('otp', { required: 'Vui lòng nhập mã OTP!' })}
                    maxLength={6}
                    className="form-input"
                    placeholder="Nhập 6 chữ số OTP (VD: 123456)"
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
                      clearError();
                      // Xóa OTP khi quay lại
                      setValue('otp', '');
                    }}
                    block
                    style={{
                      borderRadius: '8px',
                      height: '48px'
                    }}
                  >
                    Quay lại
                  </Button>
                </Space>
              </form>
            )}

            {/* Step 3: Personal Information Form */}
            {step === 2 && (
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
                    tabIndex={1}
                    autoComplete="name"
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
                    tabIndex={2}
                    autoComplete="tel"
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
                    tabIndex={3}
                    autoComplete="bday"
                  />
                  {errors.dateOfBirth && (
                    <div className="form-error">{errors.dateOfBirth.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Giới tính <span style={{ color: 'red' }}>*</span>
                  </label>
                  <Radio.Group
                    value={watch('gender')}
                    onChange={(e) => {
                      setValue('gender', e.target.value, { shouldValidate: true });
                      // Trigger validation
                      form.trigger('gender');
                    }}
                  >
                    <Space direction="horizontal" size="large">
                      <Radio value="male" style={{ fontSize: '16px' }}>Nam</Radio>
                      <Radio value="female" style={{ fontSize: '16px' }}>Nữ</Radio>
                      <Radio value="other" style={{ fontSize: '16px' }}>Khác</Radio>
                    </Space>
                  </Radio.Group>
                  {errors.gender && (
                    <div className="form-error">{errors.gender.message}</div>
                  )}
                </div>

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
                    Tiếp theo
                  </Button>

                  <Button
                    type="default"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => {
                      setStep(1);
                      clearError();
                    }}
                    block
                    style={{
                      borderRadius: '8px',
                      height: '48px'
                    }}
                  >
                    Quay lại
                  </Button>
                </Space>
              </form>
            )}

            {/* Step 4: Create Password Form */}
            {step === 3 && (
              <form onSubmit={handleSubmit(handleCreatePassword)}>
                <div className="form-group">
                  <label className="form-label">
                    Mật khẩu <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    {...register('password', { required: 'Vui lòng nhập mật khẩu!' })}
                    type="password"
                    className="form-input"
                    placeholder="Nhập mật khẩu (8-16 ký tự, có chữ hoa, thường và số)"
                  />
                  {errors.password && (
                    <div className="form-error">{errors.password.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Xác nhận mật khẩu <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    {...register('confirmPassword', {
                      required: 'Vui lòng xác nhận mật khẩu!',
                      validate: (value) =>
                        value === watch('password') || 'Mật khẩu xác nhận không khớp! Vui lòng nhập lại.'
                    })}
                    type="password"
                    className="form-input"
                    placeholder="Nhập lại mật khẩu để xác nhận"
                  />
                  {errors.confirmPassword && (
                    <div className="form-error">{errors.confirmPassword.message}</div>
                  )}
                </div>

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
                    style={{
                      borderRadius: '8px',
                      height: '48px'
                    }}
                  >
                    Quay lại
                  </Button>
                </Space>
              </form>
            )}

            <Divider style={{ margin: '40px 0 24px 0' }} />

            <Text style={{ textAlign: 'center', fontSize: '16px' }}>
              Bạn đã có tài khoản?{' '}
              <Link to="/login" style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                ĐĂNG NHẬP
              </Link>
            </Text>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterRHF;
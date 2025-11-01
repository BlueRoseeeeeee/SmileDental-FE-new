/*
* @author: HoTram
*/
import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Controller } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Typography, Alert, Radio, Steps, Space, Divider, DatePicker } from 'antd';
import { toast } from '../../services/toastService';
import { 
  CheckCircleOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useFormPersistence } from '../../hooks/useFormPersistence';
import { useAuth } from '../../contexts/AuthContext';
import { 
  validatePatientAge,
  isValidEmail,
  handleFullNameFormat,
  getReactHookFormRules
} from '../../utils/validationUtils';
import registerImage from '../../assets/image/hinh-anh-dang-nhap-dang-ki.png';
import './Register.css';
import { COLOR_BRAND_NAME } from '../../utils/common-colors.js';

const { Title, Text } = Typography;


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

  // Sử dụng useFormPersistence hook
  const { form, clearStoredData } = useFormPersistence('registerFormData', defaultValues);
  
  const { handleSubmit, formState: { errors }, setValue, getValues, watch, register, reset } = form;
  
  // Watch email để kiểm tra validation
  const emailValue = watch('email');
  
  // Sử dụng validation functions từ utils

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
      
      // Trigger validation cho tất cả fields trước khi submit
      const isValid = await form.trigger(['fullName', 'phone', 'dateOfBirth', 'gender']);
      
      if (!isValid) {
        // Nếu có lỗi validation, không chuyển bước và để React Hook Form hiển thị lỗi
        toast.error('Vui lòng kiểm tra lại thông tin đã nhập!');
        return;
      }
      
      // Kiểm tra validation cơ bản
      if (!data.fullName || !data.phone || !data.dateOfBirth || !data.gender) {
        toast.error('Vui lòng nhập đầy đủ thông tin!');
        return; // Không chuyển bước nếu thiếu thông tin
      }
      
      // Kiểm tra tuổi với thông báo cụ thể (backup validation)
      const ageValidation = validatePatientAge(data.dateOfBirth);
      
      if (!ageValidation.valid) {
        toast.error(ageValidation.message);
        return;
      }
      
      // Lưu dữ liệu vào form state
      setValue('fullName', data.fullName);
      setValue('phone', data.phone);
      setValue('dateOfBirth', data.dateOfBirth);
      setValue('gender', data.gender);
      setStep(3);
    } catch {
      // Error is handled by AuthContext
    }
  };

    // Step 4: Create Password & Complete Registration
  const handleCreatePassword = async (data) => {
    try {
      clearError();
      
      // Trigger validation cho password fields trước khi submit
      const isValid = await form.trigger(['password', 'confirmPassword']);
      
      if (!isValid) {
        toast.error('Vui lòng kiểm tra lại mật khẩu!');
        return;
      }
      
      // Kiểm tra validation cơ bản
      if (!data.password || !data.confirmPassword || data.password !== data.confirmPassword) {
        toast.error('Mật khẩu xác nhận không khớp!');
        return; // Không chuyển bước nếu thiếu thông tin
      }
      
      // Lưu dữ liệu vào form state
      setValue('password', data.password);
      setValue('confirmPassword', data.confirmPassword);
      
      // Lấy tất cả dữ liệu từ form
      const allData = form.getValues();
      
      // Kiểm tra xem có đủ dữ liệu không
      if (!allData.fullName || !allData.phone || !allData.dateOfBirth || !allData.gender || !allData.password || !allData.email) {
        return; // Không gửi nếu thiếu dữ liệu
      }
      
      const userData = {
        fullName: allData.fullName,
        phone: allData.phone,
        dateOfBirth: allData.dateOfBirth,
        gender: allData.gender,
        password: allData.password,
        confirmPassword: allData.confirmPassword, 
        email: allData.email || email, 
        role: 'patient', // CỐ ĐỊNH: Form đăng ký này chỉ dành cho bệnh nhân
        // type: 'fullTime' 
      };

      const response = await registerUser(userData);
      const successMessage = response?.message || 'Đăng ký thành công! Vui lòng đăng nhập.';
      // Hiển thị toast thành công
      toast.success(successMessage, 3000);
      // Xóa dữ liệu đã lưu sau khi đăng ký thành công
      clearStoredData();
      // Chuyển trang sau khi hiển thị thông báo
      setTimeout(() => {
      navigate('/login', {
          state: { message: successMessage },
      });
      }, 2000); // Đợi 2 giây để user đọc thông báo
    } catch {
      // Error is handled by AuthContext
    }
  };

  // Auto-capitalize full name
  const handleFullNameBlur = (e) => {
    handleFullNameFormat(e, form.setValue);
  };

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 120px)', // Trừ đi chiều cao header và footer
      background: '#e8f5e8',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      margin: '-24px -24px -24px -0px' // Loại bỏ padding mặc định của Ant Design Content
    }}>
      <div 
        className="register-container"
        style={{ 
          width: '100%', 
          maxWidth: '100%', // Full width 100%
          display: 'flex',
          background: 'white',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          minHeight: 'calc(100vh - 200px)',
        }}>

          {/* Hình ảnh bên trái - 40% */}
          <div 
            className="register-image"
            style={{ 
              flex: '0 0 40%', // Chiếm 40% width
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '40px 24px',
              background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
              position: 'relative'
            }}>
            {/* Nội dung bổ sung */}
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <h4 style={{ 
                color: '#2596be', 
                fontWeight: 'bold',
                marginBottom: '16px',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textAlign:'left'
              }}>
                Chào mừng đến với
              </h4>
              <h2 style={{ 
                color: COLOR_BRAND_NAME, 
                fontSize: '2.5rem', 
                fontWeight: 'bold',
                marginBottom: '20px',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textAlign:'left',
                marginLeft:'30px'
              }}>
                SmileCare Dental
              </h2>
              <p style={{ 
                color: '#666', 
                fontSize: '1.1rem', 
                lineHeight: '1.6',
               marginLeft:'40px'
              }}>
                Nụ cười rạng rỡ khởi nguồn từ sức khỏe răng miệng toàn diện
              </p>
              <p
              style={{ 
                color: '#666', 
                fontSize: '1.1rem', 
                lineHeight: '1.6',
                marginLeft:'60px'
              }}
              >Hãy để chúng tôi đồng hành cùng bạn trong hành trình ấy.</p>
            </div>
            
            {/* Hình ảnh */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <img 
                src={registerImage} 
                alt="Register" 
          style={{ 
                  maxWidth: '85%', 
                  maxHeight: '85%', 
                  objectFit: 'cover',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                }} 
              />
            </div>
            </div>

          {/* Form đăng ký bên phải - 60% */}
          <div 
            className="register-form"
            style={{ 
              flex: '0 0 60%', // Chiếm 60% width
              padding: '48px', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center' 
            }}>
            <Title level={2} style={{ 
              textAlign: 'center', 
              marginBottom: '35px', 
              color: '#2596be', 
              fontSize: '2.5rem',
              fontWeight: 'bold'
            }}>
              ĐĂNG KÝ
            </Title>

            <Steps
              current={step}
              items={steps}
              className="register-steps"
              style={{ marginBottom: '40px' }}
            />

            {/* Success Messages - Sử dụng toast thay vì Alert */}
          {otpSent && step === 1 && (
            <div style={{ 
              marginBottom: '24px',
              padding: '12px 16px',
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '6px',
              color: '#52c41a',
              fontSize: '14px'
            }}>
              <CheckCircleOutlined style={{ marginRight: '8px' }} />
              {otpMessage || "OTP đăng ký đã được gửi đến email!"}
            </div>
          )}

          {/* Error Messages - Sử dụng toast thay vì Alert */}
          {error && (
            <div style={{ 
              marginBottom: '24px',
              padding: '12px 16px',
              background: '#fff2f0',
              border: '1px solid #ffccc7',
              borderRadius: '6px',
              color: '#ff4d4f',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

            {/* Step 1: Email Verification Form */}
            {step === 0 && (
              <form onSubmit={handleSubmit(handleSendOTP)}>
                <div className="form-group">
                  <label className="form-label">
                    Email <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    {...register('email', getReactHookFormRules.email())}
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
                    background: (!emailValue || !isValidEmail(emailValue)) ? '#bfbfbf' : '#2596be',
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
                    {...register('otp', getReactHookFormRules.otp())}
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
                      background: '#2596be',
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
                    {...register('fullName', getReactHookFormRules.fullName())}
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
                    {...register('phone', getReactHookFormRules.phone())}
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
                  <Controller
                    name="dateOfBirth"
                    control={form.control}
                    rules={getReactHookFormRules.dateOfBirthPatient()}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <DatePicker
                        style={{ width: '100%' }}
                        placeholder="Chọn ngày sinh"
                        format="DD/MM/YYYY"
                        value={value ? dayjs(value, 'YYYY-MM-DD') : null}
                        onChange={(date) => {
                          const formatted = date ? date.format('YYYY-MM-DD') : '';
                          onChange(formatted);
                          setTimeout(() => {
                            form.trigger('dateOfBirth');
                          }, 0);
                        }}
                        onBlur={() => {
                          onBlur();
                          setTimeout(() => {
                            form.trigger('dateOfBirth');
                          }, 0);
                        }}
                        disabledDate={(current) => current && current > dayjs()}
                      />
                    )}
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
                  {!watch('gender') && (
                    <div className="form-error">Vui lòng chọn giới tính!</div>
                  )}
                </div>

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
                    {...register('password', getReactHookFormRules.password())}
                    type="password"
                    className="form-input"
                    placeholder="Nhập mật khẩu (8-16 ký tự)"
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
                    {...register('confirmPassword', getReactHookFormRules.confirmPassword('password'))}
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
                      background: '#2596be',
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
  );
};

export default RegisterRHF;
/*
* @author: HoTram
*/
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Checkbox, Space, Divider, Row, Col, Modal, Select } from 'antd';
import { toast } from '../../services/toastService';
import { 
  UserOutlined, 
  LockOutlined, 
  EyeInvisibleOutlined, 
  EyeTwoTone,
  HeartOutlined,
  StarOutlined,
  TeamOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext.jsx';
import registerImage from '../../assets/image/hinh-anh-dang-nhap-dang-ki.png';
import './Login.css';

const { Title, Text } = Typography;

const Login = () => {
  const { login, loading, error, clearError, completeLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  
  // 🆕 Nhiệm vụ 3.2: State cho first login và specialty selection
  const [showPasswordChangeModal, setShowPasswordChangeModal] = React.useState(false);
  const [showSpecialtyModal, setShowSpecialtyModal] = React.useState(false);
  const [tempLoginData, setTempLoginData] = React.useState(null);
  const [passwordChangeForm] = Form.useForm();
  const [specialtyForm] = Form.useForm();

  // Kiểm tra xem người dùng đã từng chọn "Ghi nhớ đăng nhập" chưa
  React.useEffect(() => {
    const rememberLogin = localStorage.getItem('rememberLogin');
    if (rememberLogin === 'true') {
      form.setFieldsValue({ remember: true });
    }
  }, [form]);

  // Restore saved login data
  React.useEffect(() => {
    const savedLoginData = localStorage.getItem('loginFormData');
    if (savedLoginData) {
      try {
        const data = JSON.parse(savedLoginData);
        form.setFieldsValue({
          login: data.login || '',
          remember: data.remember || false
        });
      } catch (error) {
        console.error('Error parsing saved login data:', error);
      }
    }
  }, [form]);

  // Lưu giá trị khi người dùng thay đổi input
  const handleInputChange = (changedValues, allValues) => {
    // LƯU LOGIN VÀ REMEMBER - KHÔNG LƯU PASSWORD
    const dataToSave = {
      login: allValues.login || '',
      remember: allValues.remember || false
    };
    
    // Lưu vào localStorage
    localStorage.setItem('loginFormData', JSON.stringify(dataToSave));
    
    // Cũng lưu remember flag riêng
    if (allValues.remember) {
      localStorage.setItem('rememberLogin', 'true');
    } else {
      localStorage.removeItem('rememberLogin');
    }
  };

  // Xóa password field khi logout (giữ lại login và remember)
  React.useEffect(() => {
    const handleLogout = () => {
      // Chỉ xóa password field, giữ nguyên login và remember
      form.setFieldsValue({ password: '' });
    };

    // Listen for logout event (có thể từ AuthContext)
    const checkLogout = () => {
      const isAuthenticated = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      if (!isAuthenticated) {
        handleLogout();
      }
    };

    // Check khi component mount
    checkLogout();

    // Listen for storage changes (khi logout từ tab khác)
    window.addEventListener('storage', checkLogout);
    
    return () => {
      window.removeEventListener('storage', checkLogout);
    };
  }, [form]);

  const onFinish = async (values) => {
    try {
      clearError();
      // Truyền giá trị remember vào login function
      const response = await login({
        login: values.login,
        password: values.password,
        remember: values.remember || false
      });
      
      // 🆕 Nhiệm vụ 3.2: Kiểm tra pendingData từ authService
      if (response.pendingData) {
        setTempLoginData(response.pendingData);
        
        // First-time login - must change password
        if (response.pendingData.requiresPasswordChange) {
          setShowPasswordChangeModal(true);
          toast.info('Đây là lần đăng nhập đầu tiên. Vui lòng đổi mật khẩu để tiếp tục.');
          return;
        }
        
        // Multiple specialties - must select one
        if (response.pendingData.requiresSpecialtySelection) {
          setShowSpecialtyModal(true);
          toast.info('Vui lòng chọn chuyên khoa bạn muốn làm việc.');
          return;
        }
      }
      
      // Lưu login data sau khi đăng nhập thành công
      const dataToSave = {
        login: values.login,
        remember: values.remember || false
      };
      localStorage.setItem('loginFormData', JSON.stringify(dataToSave));
      
      // Lưu remember flag riêng
      if (values.remember) {
        localStorage.setItem('rememberLogin', 'true');
      } else {
        localStorage.removeItem('rememberLogin');
      }
      
      // Redirect to previous page or dashboard
      const from = location.state?.from || '/dashboard';
      navigate(from);
    } catch {
      // Error is handled by AuthContext
    }
  };

  // 🆕 Nhiệm vụ 3.2: Handle password change
  const handlePasswordChange = async (values) => {
    try {
      const { authService } = await import('../../services/authService.js');
      
      // Call completeFirstLogin API with tempToken
      const result = await authService.completeFirstLogin(
        tempLoginData.tempToken,
        values.newPassword
      );
      
      toast.success('Đổi mật khẩu thành công!');
      
      // Update AuthContext with logged-in user
      completeLogin(result.user);
      
      setShowPasswordChangeModal(false);
      passwordChangeForm.resetFields();
      
      // Check if need specialty selection
      if (result.user.specialties && result.user.specialties.length > 1) {
        setTempLoginData({ ...tempLoginData, user: result.user });
        setShowSpecialtyModal(true);
      } else {
        // Navigate to dashboard
        setTempLoginData(null);
        const from = location.state?.from || '/dashboard';
        navigate(from);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
    }
  };

  // 🆕 Nhiệm vụ 3.2: Handle specialty selection
  const handleSpecialtySelection = async (values) => {
    try {
      const { authService } = await import('../../services/authService.js');
      
      // Call completeSpecialtySelection API
      const result = await authService.completeSpecialtySelection(
        tempLoginData.tempToken,
        values.specialty
      );
      
      // Update AuthContext with logged-in user
      completeLogin(result.user);
      
      toast.success(`Đã chọn chuyên khoa: ${values.specialty}`);
      setShowSpecialtyModal(false);
      specialtyForm.resetFields();
      setTempLoginData(null);
      
      // Navigate to dashboard
      const from = location.state?.from || '/dashboard';
      navigate(from);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 120px)', // Trừ đi chiều cao header và footer
      background: '#e8f5e8',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      margin: '-24px -24px -24px -24px' // Loại bỏ padding mặc định của Ant Design Content
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

          {/* Hình ảnh bên trái - 50% */}
          <div 
            className="register-image"
            style={{ 
              flex: '0 0 50%', // Chiếm 50% width
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '40px 24px',
              background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
              position: 'relative'
            }}>
            {/* Nội dung bổ sung */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ 
                color: '#2596be', 
                fontSize: '2rem', 
                fontWeight: 'bold',
                marginBottom: '16px',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                 Chào mừng trở lại- SmileDental 
              </h2>
              
            </div>
            <div style={{ 
              textAlign: 'center', 
              padding: '20px',
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ 
                color: '#2596be', 
                fontSize: '1rem', 
                fontWeight: 'bold',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <SafetyOutlined style={{ fontSize: '16px' }} />
                  Chuyên nghiệp
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
                color: '#666', 
                fontSize: '0.9rem',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}>
                <TeamOutlined style={{ fontSize: '14px' }} />
                Đội ngũ nha sĩ giàu kinh nghiệm
              </p>
            </div>
            
            {/* Hình ảnh */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src={registerImage} 
                alt="Login" 
                style={{ 
                  maxWidth: '80%', 
                  maxHeight: '80%', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                }} 
              />
            </div>
         
          </div>

          {/* Form đăng nhập bên phải - 50% */}
          <div 
            className="register-form"
            style={{ 
              flex: '0 0 50%', // Chiếm 50% width
              padding: '48px', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center' 
            }}>
            <Title level={2} style={{ 
              textAlign: 'center', 
              marginBottom: '30px', 
              color: '#2596be', // Màu xanh chủ đạo
              fontSize: '2.5rem',
              fontWeight: 'bold'
            }}>
              ĐĂNG NHẬP
            </Title>

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



            {/* Login Form */}
            <Form
              form={form}
              name="login"
              onFinish={onFinish}
              onValuesChange={handleInputChange}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="login"
                label="Email hoặc Mã nhân viên"
                rules={[
                  { required: true, message: 'Vui lòng nhập email hoặc mã nhân viên!' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Nhập email hoặc mã nhân viên"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu!' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Nhập mật khẩu"
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <Form.Item name="remember" valuePropName="checked" style={{ margin: 0 }}>
                  <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                </Form.Item>
                <Link to="/forgot-password">
                  Quên mật khẩu?
                </Link>
              </div>

              <Form.Item style={{ marginBottom: '24px' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  block
                  style={{
                    background: '#2596be',
                    border: 'none',
                    borderRadius: '8px',
                    height: '48px'
                  }}
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </Form.Item>
            </Form>

            <Divider>
              <Text type="secondary">hoặc</Text>
            </Divider>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
                Chưa có tài khoản?{' '}
                <Link to="/register" style={{ color: '#2596be', fontWeight: 'bold' }}>
                  Đăng ký ngay
                </Link>
              </Text>
            </div>
          </div>
      </div>

      {/* 🆕 Nhiệm vụ 3.2: Modal đổi mật khẩu (First Login) */}
      <Modal
        title="Đổi mật khẩu"
        open={showPasswordChangeModal}
        onCancel={() => {
          setShowPasswordChangeModal(false);
          setTempLoginData(null);
        }}
        footer={null}
        centered
      >
        <Alert
          message="Đây là lần đăng nhập đầu tiên"
          description="Vì lý do bảo mật, bạn cần đổi mật khẩu trước khi tiếp tục sử dụng hệ thống."
          type="warning"
          showIcon
          style={{ marginBottom: 20 }}
        />
        <Form
          form={passwordChangeForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
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
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Đổi mật khẩu
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 🆕 Nhiệm vụ 3.2: Modal chọn chuyên khoa */}
      <Modal
        title="Chọn chuyên khoa"
        open={showSpecialtyModal}
        onCancel={() => {
          setShowSpecialtyModal(false);
          setTempLoginData(null);
        }}
        footer={null}
        centered
      >
        <Alert
          message="Bạn có nhiều chuyên khoa"
          description="Vui lòng chọn chuyên khoa bạn muốn làm việc trong phiên đăng nhập này."
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />
        <Form
          form={specialtyForm}
          layout="vertical"
          onFinish={handleSpecialtySelection}
        >
          <Form.Item
            name="specialty"
            label="Chuyên khoa"
            rules={[{ required: true, message: 'Vui lòng chọn chuyên khoa!' }]}
          >
            <Select
              placeholder="Chọn chuyên khoa"
              size="large"
              options={tempLoginData?.user?.specialties?.map(s => ({
                label: s,
                value: s
              })) || []}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Tiếp tục
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Login;
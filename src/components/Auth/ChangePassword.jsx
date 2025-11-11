/*
* @author: HoTram
*/
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, Divider } from 'antd';
import { toast } from '../../services/toastService';
import { 
  LockOutlined, 
  EyeInvisibleOutlined,
  EyeTwoTone,
  CheckCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext.jsx';
import './ChangePassword.css';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const ChangePassword = () => {
  const [success, setSuccess] = useState(false);
  const { changePassword, loading, user } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Detect user role to determine navigation path
  const isPatient = user?.role === 'patient';
  const backPath = isPatient ? '/patient/profile' : '/dashboard';

  const handleChangePassword = async (values) => {
    try {
      await changePassword(values);
      setSuccess(true);
      toast.success('Đổi mật khẩu thành công!');
      setTimeout(() => {
        navigate(backPath);
      }, 1500);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Đổi mật khẩu thất bại!';
      toast.error(errorMessage);
    }
  };

  if (success) {
    return (
      <div style={{ 
        minHeight: '100vh', 
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
              Đổi mật khẩu thành công!
            </Title>
            <Text type="secondary">
              Mật khẩu của bạn đã được cập nhật thành công.
            </Text>
          </div>
          
          <Button
            type="primary"
            size="large"
            block
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              border: 'none',
              borderRadius: '8px',
              height: '48px'
            }}
          >
            Về trang chủ
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '16px', 
      background:'#E8F2F7'
    }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <Card 
          style={{ 
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            marginTop:20
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Title level={2} style={{ marginBottom: '8px' }}>
              Đổi mật khẩu
            </Title>
          </div>

          {/* Change Password Form */}
          <Form
            form={form}
            name="changePassword"
            onFinish={handleChangePassword}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="currentPassword"
              label="Mật khẩu hiện tại"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu hiện tại"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
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
              label="Xác nhận mật khẩu mới"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
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

            <Form.Item style={{ marginBottom: '24px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                block
                style={{
                  background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  height: '48px'
                }}
              >
                {loading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default ChangePassword;

import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Upload, Avatar, Typography, Row, Col, Radio, DatePicker, message, Space, Divider, Tag } from 'antd';
import { 
  CameraOutlined, 
  SaveOutlined, 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  CalendarOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext.jsx';
import { userService } from '../services/userService.js';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Load user data on mount
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
        gender: user.gender || '',
        description: user.description || '',
      });
    }
  }, [user, form]);

  const onFinish = async (values) => {
    setLoading(true);
    
    try {
      const data = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null,
      };
      const response = await userService.updateProfile(data);
      updateUser(response.user);
      message.success('Cập nhật thông tin thành công!');
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    setLoading(true);
    try {
      const response = await userService.uploadAvatar(user._id, file);
      updateUser({ avatar: response.user.avatar });
      message.success('Cập nhật avatar thành công!');
      return false; // Prevent default upload behavior
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi upload avatar');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: 'Quản trị viên',
      manager: 'Quản lý',
      dentist: 'Nha sĩ',
      nurse: 'Y tá',
      receptionist: 'Lễ tân',
      patient: 'Bệnh nhân',
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'red',
      manager: 'blue',
      dentist: 'green',
      nurse: 'orange',
      receptionist: 'purple',
      patient: 'cyan',
    };
    return colors[role] || 'default';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <Card style={{ borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Title level={1} style={{ marginBottom: '8px', color: '#262626' }}>
            Hồ sơ cá nhân
          </Title>
          <Text style={{ fontSize: '18px', color: '#8c8c8c' }}>
            Quản lý thông tin cá nhân và cài đặt tài khoản
          </Text>
        </div>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Avatar Section */}
        <Col xs={24} lg={8}>
          <Card 
            style={{ 
              borderRadius: '16px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              textAlign: 'center'
            }}
          >
            <div style={{ padding: '24px 0' }}>
              <div style={{ marginBottom: '24px' }}>
                <Avatar
                  size={120}
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  style={{ 
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    fontSize: '48px'
                  }}
                />
              </div>

              <Title level={3} style={{ marginBottom: '8px', color: '#262626' }}>
                {user?.fullName}
              </Title>
              
              <div style={{ marginBottom: '16px' }}>
                <Tag color={getRoleColor(user?.role)} style={{ fontSize: '14px', padding: '4px 12px' }}>
                  {getRoleDisplayName(user?.role)}
                </Tag>
              </div>

              {user?.employeeCode && (
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Mã NV: {user.employeeCode}
                </Text>
              )}

              <Divider />

              <Upload
                beforeUpload={handleAvatarUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button 
                  type="primary" 
                  icon={<CameraOutlined />}
                  loading={loading}
                  block
                  style={{ borderRadius: '8px' }}
                >
                  Thay đổi ảnh đại diện
                </Button>
              </Upload>
            </div>
          </Card>
        </Col>

        {/* Profile Form */}
        <Col xs={24} lg={16}>
          <Card 
            title="Thông tin cá nhân" 
            style={{ borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            extra={<EditOutlined style={{ color: '#8c8c8c' }} />}
          >
            <Form
              form={form}
              name="profile"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
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
                </Col>

                <Col xs={24} md={12}>
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
                      placeholder="Nhập email"
                      disabled
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
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
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="dateOfBirth"
                    label="Ngày sinh"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày sinh!' }]}
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      placeholder="Chọn ngày sinh"
                      format="DD/MM/YYYY"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24}>
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
                </Col>

                {user?.role === 'dentist' && (
                  <Col xs={24}>
                    <Form.Item
                      name="description"
                      label="Mô tả chuyên môn"
                    >
                      <Input.TextArea
                        rows={4}
                        placeholder="Mô tả về kinh nghiệm và chuyên môn của bạn..."
                        style={{ borderRadius: '8px' }}
                      />
                    </Form.Item>
                  </Col>
                )}
              </Row>

              <Divider />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                  style={{
                    paddingLeft: '32px',
                    paddingRight: '32px',
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 15px rgba(24, 144, 255, 0.3)'
                  }}
                >
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
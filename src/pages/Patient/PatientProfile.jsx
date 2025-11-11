import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Row, 
  Col, 
  DatePicker, 
  Select, 
  Avatar,
  Upload,
  message,
  Typography,
  Divider,
  Spin
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined,
  HomeOutlined,
  CameraOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import dayjs from 'dayjs';
import './PatientProfile.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PatientProfile = () => {
  const { user, updateUser } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
        gender: user.gender,
        address: user.address,
        emergencyContact: user.emergencyContact,
        medicalHistory: user.medicalHistory,
        allergies: user.allergies
      });
      setAvatarUrl(user.avatar);
    }
  }, [user, form]);

  const handleUpdateProfile = async (values) => {
    try {
      setLoading(true);
      
      // 🔥 Remove email from update data (patient cannot update email)
      const { email, ...updateData } = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null
      };

      console.log('📤 Sending update request:', updateData);

      // 🔥 Call API to update profile
      const response = await userService.updateProfile(updateData);
      
      console.log('📥 Update response:', response);

      if (response.success) {
        // Update local context with fresh data
        await updateUser(response.user);
        message.success('Cập nhật thông tin thành công!');
      } else {
        throw new Error(response.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('❌ Update profile error:', error);
      message.error(error.response?.data?.message || error.message || 'Cập nhật thông tin thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      // Get this url from response in real world
      const url = URL.createObjectURL(info.file.originFileObj);
      setAvatarUrl(url);
      setLoading(false);
      message.success('Tải ảnh đại diện thành công!');
    }
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Chỉ được tải lên file ảnh!');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Ảnh phải nhỏ hơn 5MB!');
      return false;
    }
    return true;
  };

  return (
    <div className="patient-profile-container">
      <Card className="profile-card">
        <Title level={2}>
          <UserOutlined /> Thông tin cá nhân
        </Title>
        <Divider />

        <Row gutter={[24, 24]}>
          {/* Avatar Section */}
          <Col xs={24} md={6} style={{ textAlign: 'center' }}>
            <div className="avatar-section">
              <Avatar
                size={150}
                icon={<UserOutlined />}
                src={avatarUrl}
                style={{ backgroundColor: '#2c5f4f', marginBottom: 16 }}
              />
              <Upload
                name="avatar"
                showUploadList={false}
                beforeUpload={beforeUpload}
                onChange={handleAvatarChange}
                customRequest={({ file, onSuccess }) => {
                  setTimeout(() => {
                    onSuccess("ok");
                  }, 0);
                }}
              >
                <Button icon={<CameraOutlined />} type="dashed" block>
                  Đổi ảnh đại diện
                </Button>
              </Upload>
            </div>
          </Col>

          {/* Form Section */}
          <Col xs={24} md={18}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
              autoComplete="off"
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Họ và tên"
                    name="fullName"
                    rules={[
                      { required: true, message: 'Vui lòng nhập họ tên!' },
                      { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự!' }
                    ]}
                  >
                    <Input 
                      prefix={<UserOutlined />} 
                      placeholder="Nguyễn Văn A"
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email!' },
                      { type: 'email', message: 'Email không hợp lệ!' }
                    ]}
                  >
                    <Input 
                      prefix={<MailOutlined />} 
                      placeholder="email@example.com"
                      size="large"
                      disabled
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Số điện thoại"
                    name="phone"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số điện thoại!' },
                      { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số!' }
                    ]}
                  >
                    <Input 
                      prefix={<PhoneOutlined />} 
                      placeholder="0123456789"
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Ngày sinh"
                    name="dateOfBirth"
                    rules={[
                      { required: true, message: 'Vui lòng chọn ngày sinh!' }
                    ]}
                  >
                    <DatePicker 
                      placeholder="Chọn ngày sinh"
                      format="DD/MM/YYYY"
                      style={{ width: '100%' }}
                      size="large"
                      disabledDate={(current) => {
                        return current && current > dayjs().endOf('day');
                      }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Giới tính"
                    name="gender"
                  >
                    <Select 
                      placeholder="Chọn giới tính"
                      size="large"
                    >
                      <Select.Option value="male">Nam</Select.Option>
                      <Select.Option value="female">Nữ</Select.Option>
                      <Select.Option value="other">Khác</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label="Địa chỉ"
                    name="address"
                  >
                    <Input 
                      prefix={<HomeOutlined />} 
                      placeholder="Nhập địa chỉ"
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large"
                  icon={<SaveOutlined />}
                  loading={loading}
                  block
                  style={{ backgroundColor: '#2c5f4f', borderColor: '#2c5f4f' }}
                >
                  Lưu thay đổi
                </Button>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default PatientProfile;

/*
* @author: HoTram
*/
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Avatar, 
  Upload, 
  // message, // Replaced with toast service 
  Space, 
  Divider,
  Select,
  DatePicker,
  Radio,
  Alert,
  Spin
} from 'antd';
import { toast } from '../../services/toastService';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  CalendarOutlined, 
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  UploadOutlined,
  CameraOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { userService } from '../../services/userService.js';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Profile = () => {
  const { user, updateUser, loading } = useAuth();
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const response = await userService.getProfile();
      setProfileData(response.user);
      form.setFieldsValue({
        ...response.user,
        dateOfBirth: response.user.dateOfBirth ? dayjs(response.user.dateOfBirth) : null
      });
    } catch (error) {
      toast.error('Không thể tải thông tin profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    form.resetFields();
    if (profileData) {
      form.setFieldsValue({
        ...profileData,
        dateOfBirth: profileData.dateOfBirth ? dayjs(profileData.dateOfBirth) : null
      });
    }
  };

  const handleSave = async (values) => {
    try {
      const updateData = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null
      };
      
      const response = await userService.updateProfile(updateData);
      setProfileData(response.user);
      updateUser(response.user);
      setEditing(false);
      toast.success('Cập nhật thông tin thành công');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      setUploading(true);
      const response = await userService.uploadAvatar(user._id, file);
      setProfileData(response.user);
      updateUser(response.user);
      toast.success('Cập nhật avatar thành công');
    } catch (error) {
      toast.error('Cập nhật avatar thất bại');
    } finally {
      setUploading(false);
    }
    return false; // Prevent default upload
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      admin: 'Quản trị viên',
      manager: 'Quản lý',
      dentist: 'Nha sĩ',
      nurse: 'Y tá',
      receptionist: 'Lễ tân',
      patient: 'Bệnh nhân'
    };
    return roleMap[role] || role;
  };

  const getTypeDisplayName = (type) => {
    const typeMap = {
      fullTime: 'Toàn thời gian',
      partTime: 'Bán thời gian'
    };
    return typeMap[type] || type;
  };

  if (loadingProfile) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Đang tải thông tin profile...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Thông tin cá nhân
      </Title>

      <Row gutter={[24, 24]}>
        {/* Avatar Section */}
        <Col xs={24} md={8}>
          <Card 
            style={{ 
              textAlign: 'center',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ marginBottom: '24px' }}>
              <Avatar
                size={120}
                src={profileData?.avatar}
                icon={<UserOutlined />}
                style={{ 
                  fontSize: '48px',
                  backgroundColor: '#1890ff'
                }}
              />
            </div>
            
            <Title level={4} style={{ marginBottom: '8px' }}>
              {profileData?.fullName}
            </Title>
            
            <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
              {getRoleDisplayName(profileData?.role)}
            </Text>
            
            {profileData?.employeeCode && (
              <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                Mã nhân viên: {profileData.employeeCode}
              </Text>
            )}

            <Upload
              beforeUpload={handleAvatarUpload}
              showUploadList={false}
              accept="image/*"
            >
              <Button 
                icon={<CameraOutlined />} 
                loading={uploading}
                style={{ borderRadius: '8px' }}
              >
                {uploading ? 'Đang tải lên...' : 'Đổi avatar'}
              </Button>
            </Upload>
          </Card>
        </Col>

        {/* Profile Information */}
        <Col xs={24} md={16}>
          <Card 
            title="Thông tin chi tiết"
            extra={
              !editing ? (
                <Button 
                  type="primary" 
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                  style={{ borderRadius: '8px' }}
                >
                  Chỉnh sửa
                </Button>
              ) : (
                <Space>
                  <Button 
                    icon={<CloseOutlined />}
                    onClick={handleCancel}
                    style={{ borderRadius: '8px' }}
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<SaveOutlined />}
                    onClick={() => form.submit()}
                    loading={loading}
                    style={{ borderRadius: '8px' }}
                  >
                    Lưu
                  </Button>
                </Space>
              )
            }
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              disabled={!editing}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="fullName"
                    label="Họ và tên"
                    rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                  >
                    <Input 
                      prefix={<UserOutlined />}
                      placeholder="Nhập họ và tên"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
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
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
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
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="dateOfBirth"
                    label="Ngày sinh"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày sinh!' }]}
                  >
                    <DatePicker 
                      style={{ width: '100%', borderRadius: '8px' }}
                      placeholder="Chọn ngày sinh"
                      format="DD/MM/YYYY"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
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

                {profileData?.role !== 'patient' && (
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="type"
                      label="Loại công việc"
                    >
                      <Select 
                        placeholder="Chọn loại công việc"
                        style={{ borderRadius: '8px' }}
                      >
                        <Option value="fullTime">Toàn thời gian</Option>
                        <Option value="partTime">Bán thời gian</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                )}

                <Col xs={24}>
                  <Form.Item
                    name="description"
                    label="Mô tả"
                  >
                    <TextArea 
                      rows={4}
                      placeholder="Nhập mô tả về bản thân"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* Additional Info Cards */}
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24} md={12}>
          <Card 
            title="Thông tin tài khoản"
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Vai trò:</Text>
                <br />
                <Text>{getRoleDisplayName(profileData?.role)}</Text>
              </div>
              
              {profileData?.employeeCode && (
                <div>
                  <Text strong>Mã nhân viên:</Text>
                  <br />
                  <Text code>{profileData.employeeCode}</Text>
                </div>
              )}
              
              {profileData?.type && (
                <div>
                  <Text strong>Loại công việc:</Text>
                  <br />
                  <Text>{getTypeDisplayName(profileData.type)}</Text>
                </div>
              )}
              
              <div>
                <Text strong>Trạng thái:</Text>
                <br />
                <Text style={{ color: profileData?.isActive ? '#52c41a' : '#ff4d4f' }}>
                  {profileData?.isActive ? 'Hoạt động' : 'Không hoạt động'}
                </Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card 
            title="Thống kê"
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Ngày tạo tài khoản:</Text>
                <br />
                <Text>{profileData?.createdAt ? dayjs(profileData.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A'}</Text>
              </div>
              
              <div>
                <Text strong>Cập nhật lần cuối:</Text>
                <br />
                <Text>{profileData?.updatedAt ? dayjs(profileData.updatedAt).format('DD/MM/YYYY HH:mm') : 'N/A'}</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;

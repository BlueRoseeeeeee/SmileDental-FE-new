/*
* @author: HoTram
*/
import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Upload, 
  Avatar, 
  Typography, 
  Row, 
  Col, 
  message, 
  Divider, 
  Tag,
  Form,
  Input,
  DatePicker,
  Select,
  Modal,
  Space
} from 'antd';
import { 
  CameraOutlined, 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  CalendarOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext.jsx';
import { userService } from '../services/userService.js';
import { toast } from '../services/toastService.js';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  // ✅ Check if current user can edit profile (only admin and manager)
  const selectedRole = localStorage.getItem('selectedRole');
  const canEditProfile = selectedRole === 'admin' || selectedRole === 'manager';

  // Handle start editing
  const handleStartEdit = () => {
    form.setFieldsValue({
      fullName: user?.fullName,
      email: user?.email,
      phone: user?.phone,
      dateOfBirth: user?.dateOfBirth ? dayjs(user.dateOfBirth) : null,
      gender: user?.gender,
    });
    setIsEditing(true);
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    form.resetFields();
    setIsEditing(false);
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // ✅ Send all editable fields (except employee code)
      // ✅ Convert phone → phoneNumber to match backend
      const updateData = {
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phone, // phone → phoneNumber
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null,
        gender: values.gender,
      };

      const response = await userService.updateProfile(updateData);
      
      // ✅ Update local user state with updated data
      const updatedUser = {
        ...user,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        phoneNumber: values.phone,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : user?.dateOfBirth,
        gender: values.gender,
      };
      updateUser(updatedUser);
      
      toast.success('Cập nhật thông tin thành công!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.errorFields) {
        toast.error('Vui lòng kiểm tra lại thông tin đã nhập');
      } else {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    setLoading(true);
    try {
      const response = await userService.uploadAvatar(user._id, file);
      
      // ✅ Update local user state with new avatar URL from response
      if (response.avatarUrl) {
        const updatedUser = {
          ...user,
          avatar: response.avatarUrl
        };
        updateUser(updatedUser);
      }
      
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
                  {...(user?.avatar ? { src: user.avatar } : {})}
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

        {/* Profile Information Display */}
        <Col xs={24} lg={16}>
          <Card 
            title="Thông tin cá nhân"
            extra={
              !isEditing ? (
                // ✅ Only show Edit button for admin and manager
                canEditProfile && (
                  <Button 
                    type="primary" 
                    icon={<EditOutlined />}
                    onClick={handleStartEdit}
                  >
                    Chỉnh sửa
                  </Button>
                )
              ) : (
                <Space>
                  <Button 
                    icon={<CloseOutlined />}
                    onClick={handleCancelEdit}
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveProfile}
                    loading={loading}
                  >
                    Lưu
                  </Button>
                </Space>
              )
            }
            style={{ borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div style={{ padding: '8px 0' }}>
              {!isEditing ? (
                // Display Mode
                <Row gutter={[24, 24]}>
                {/* Thông tin cơ bản */}
                <Col xs={24}>
                  <Title level={5} style={{ color: '#1890ff', marginBottom: '16px', textDecoration: 'underline' }}>
                    Thông tin cơ bản:
                  </Title>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <div style={{ marginBottom: '16px' }}>
                        <Text strong style={{ color: '#595959', fontSize: '14px' }}>
                          <UserOutlined style={{ marginRight: '8px' }} />
                          Họ và tên:
                        </Text>
                        <br />
                        <Text style={{ fontSize: '16px', color: '#262626' }}>
                          {user?.fullName || 'Chưa cập nhật'}
                        </Text>
                      </div>
                    </Col>

                    <Col xs={24} sm={12}>
                      <div style={{ marginBottom: '16px' }}>
                        <Text strong style={{ color: '#595959', fontSize: '14px' }}>
                          <MailOutlined style={{ marginRight: '8px' }} />
                          Email:
                        </Text>
                        <br />
                        <Text style={{ fontSize: '16px', color: '#262626' }}>
                          {user?.email || 'Chưa cập nhật'}
                        </Text>
                      </div>
                    </Col>

                    <Col xs={24} sm={12}>
                      <div style={{ marginBottom: '16px' }}>
                        <Text strong style={{ color: '#595959', fontSize: '14px' }}>
                          <PhoneOutlined style={{ marginRight: '8px' }} />
                          Số điện thoại:
                        </Text>
                        <br />
                        <Text style={{ fontSize: '16px', color: '#262626' }}>
                          {user?.phone || 'Chưa cập nhật'}
                        </Text>
                      </div>
                    </Col>

                    <Col xs={24} sm={12}>
                      <div style={{ marginBottom: '16px' }}>
                        <Text strong style={{ color: '#595959', fontSize: '14px' }}>
                          <CalendarOutlined style={{ marginRight: '8px' }} />
                          Ngày sinh:
                        </Text>
                        <br />
                        <Text style={{ fontSize: '16px', color: '#262626' }}>
                          {user?.dateOfBirth ? dayjs(user.dateOfBirth).format('DD/MM/YYYY') : 'Chưa cập nhật'}
                        </Text>
                      </div>
                    </Col>

                    <Col xs={24} sm={12}>
                      <div style={{ marginBottom: '16px' }}>
                        <Text strong style={{ color: '#595959', fontSize: '14px' }}>
                          Giới tính:
                        </Text>
                        <br />
                        <Text style={{ fontSize: '16px', color: '#262626' }}>
                          {user?.gender === 'male' ? 'Nam' : 
                           user?.gender === 'female' ? 'Nữ' : 
                           user?.gender === 'other' ? 'Khác' : 'Chưa cập nhật'}
                        </Text>
                      </div>
                    </Col>

                    <Col xs={24} sm={12}>
                      <div style={{ marginBottom: '16px' }}>
                        <Text strong style={{ color: '#595959', fontSize: '14px' }}>
                          Trạng thái:
                        </Text>
                        <br />
                        <Tag color={user?.isActive ? 'green' : 'red'} style={{ fontSize: '14px' }}>
                          {user?.isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </Tag>
                      </div>
                    </Col>
                  </Row>
                </Col>

                {/* Thông tin công việc */}
                {user?.role !== 'patient' && (
                  <Col xs={24}>
                    <Divider />
                    <Title level={5} style={{ color: '#1890ff', marginBottom: '16px', textDecoration: 'underline' }}>
                      Thông tin công việc:
                    </Title>
                    <Row gutter={[16, 16]}>
                      {user?.employeeCode && (
                        <Col xs={24} sm={12}>
                          <div style={{ marginBottom: '16px' }}>
                            <Text strong style={{ color: '#595959', fontSize: '14px' }}>
                              Mã nhân viên:
                            </Text>
                            <br />
                            <Text style={{ fontSize: '16px', color: '#262626' }}>
                              {user.employeeCode}
                            </Text>
                          </div>
                        </Col>
                      )}

                      <Col xs={24} sm={12}>
                        <div style={{ marginBottom: '16px' }}>
                          <Text strong style={{ color: '#595959', fontSize: '14px' }}>
                            Chức vụ:
                          </Text>
                          <br />
                          <Tag color={getRoleColor(user?.role)} style={{ fontSize: '14px' }}>
                            {getRoleDisplayName(user?.role)}
                          </Tag>
                        </div>
                      </Col>

                      {user?.department && (
                        <Col xs={24} sm={12}>
                          <div style={{ marginBottom: '16px' }}>
                            <Text strong style={{ color: '#595959', fontSize: '14px' }}>
                              Phòng ban:
                            </Text>
                            <br />
                            <Text style={{ fontSize: '16px', color: '#262626' }}>
                              {user.department}
                            </Text>
                          </div>
                        </Col>
                      )}

                      {user?.startDate && (
                        <Col xs={24} sm={12}>
                          <div style={{ marginBottom: '16px' }}>
                            <Text strong style={{ color: '#595959', fontSize: '14px' }}>
                              Ngày vào làm:
                            </Text>
                            <br />
                            <Text style={{ fontSize: '16px', color: '#262626' }}>
                              {dayjs(user.startDate).format('DD/MM/YYYY')}
                            </Text>
                          </div>
                        </Col>
                      )}
                    </Row>
                  </Col>
                )}

                {/* Mô tả chuyên môn cho nha sĩ */}
                {user?.role === 'dentist' && user?.description && (
                  <Col xs={24}>
                    <Divider />
                    <Title level={5} style={{ color: '#1890ff', marginBottom: '16px' }}>
                      Thông tin chuyên môn
                    </Title>
                    <div style={{ marginBottom: '16px' }}>
                      <Text strong style={{ color: '#595959', fontSize: '14px' }}>
                        Mô tả chuyên môn:
                      </Text>
                      <br />
                      <Text style={{ fontSize: '16px', color: '#262626', lineHeight: '1.6' }}>
                        {user.description}
                      </Text>
                    </div>
                  </Col>
                )}

                {/* Thông tin hệ thống */}
                <Col xs={24}>
                  <Divider />
                  <Title level={5} style={{ color: '#1890ff', marginBottom: '16px',textDecoration: 'underline'}}>
                    Thông tin hệ thống:
                  </Title>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <div style={{ marginBottom: '16px' }}>
                        <Text strong style={{ color: '#595959', fontSize: '14px' }}>
                          Ngày tạo tài khoản:
                        </Text>
                        <br />
                        <Text style={{ fontSize: '16px', color: '#262626' }}>
                          {user?.createdAt ? dayjs(user.createdAt).format('DD/MM/YYYY HH:mm') : 'Chưa xác định'}
                        </Text>
                      </div>
                    </Col>

                    <Col xs={24} sm={12}>
                      <div style={{ marginBottom: '16px' }}>
                        <Text strong style={{ color: '#595959', fontSize: '14px' }}>
                          Cập nhật lần cuối:
                        </Text>
                        <br />
                        <Text style={{ fontSize: '16px', color: '#262626' }}>
                          {user?.updatedAt ? dayjs(user.updatedAt).format('DD/MM/YYYY HH:mm') : 'Chưa cập nhật'}
                        </Text>
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
              ) : (
                // Edit Mode
                <Form
                  form={form}
                  layout="vertical"
                  requiredMark="optional"
                >
                  <Row gutter={[24, 24]}>
                    <Col xs={24}>
                      <Title level={5} style={{ color: '#1890ff', marginBottom: '16px' }}>
                        Chỉnh sửa thông tin cá nhân
                      </Title>
                    </Col>

                    {/* Họ tên - EDITABLE */}
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Họ và tên"
                        name="fullName"
                        rules={[
                          { required: true, message: 'Vui lòng nhập họ và tên!' },
                          { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự!' }
                        ]}
                      >
                        <Input 
                          prefix={<UserOutlined />}
                          placeholder="Nhập họ và tên"
                          size="large"
                        />
                      </Form.Item>
                    </Col>

                    {/* Email */}
                    <Col xs={24} sm={12}>
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
                          placeholder="Nhập email"
                          size="large"
                        />
                      </Form.Item>
                    </Col>

                    {/* Số điện thoại */}
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Số điện thoại"
                        name="phone"
                        rules={[
                          { required: true, message: 'Vui lòng nhập số điện thoại!' },
                          { 
                            pattern: /^0\d{9,10}$/,
                            message: 'Số điện thoại phải bắt đầu bằng 0 và có 10-11 số'
                          }
                        ]}
                      >
                        <Input 
                          prefix={<PhoneOutlined />}
                          placeholder="Nhập số điện thoại"
                          size="large"
                        />
                      </Form.Item>
                    </Col>

                    {/* Ngày sinh - EDITABLE */}
                    <Col xs={24} sm={12}>
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
                        />
                      </Form.Item>
                    </Col>

                    {/* Giới tính - EDITABLE */}
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Giới tính"
                        name="gender"
                        rules={[
                          { required: true, message: 'Vui lòng chọn giới tính!' }
                        ]}
                      >
                        <Select 
                          placeholder="Chọn giới tính"
                          size="large"
                        >
                          <Option value="male">Nam</Option>
                          <Option value="female">Nữ</Option>
                          <Option value="other">Khác</Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    {/* Mã nhân viên (readonly) */}
                    {user?.employeeCode && (
                      <Col xs={24} sm={12}>
                        <Form.Item label="Mã nhân viên">
                          <Input 
                            value={user.employeeCode}
                            disabled
                            size="large"
                            style={{ 
                              backgroundColor: '#f5f5f5',
                              color: '#8c8c8c',
                              cursor: 'not-allowed'
                            }}
                          />
                          <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                            Mã nhân viên không thể thay đổi
                          </Text>
                        </Form.Item>
                      </Col>
                    )}
                  </Row>
                </Form>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
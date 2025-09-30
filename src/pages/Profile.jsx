/*
* @author: HoTram
*/
import React, { useState } from 'react';
import { Card, Button, Upload, Avatar, Typography, Row, Col, message, Divider, Tag } from 'antd';
import { 
  CameraOutlined, 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  CalendarOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext.jsx';
import { userService } from '../services/userService.js';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

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

        {/* Profile Information Display */}
        <Col xs={24} lg={16}>
          <Card 
            title="Thông tin cá nhân" 
            style={{ borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div style={{ padding: '8px 0' }}>
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
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
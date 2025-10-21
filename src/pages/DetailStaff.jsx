/*
* @author: HoTram
*/
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Typography,
  Tag,
  Avatar,
  Row,
  Col,
  Space,
  Tabs,
  List,
  message,
  Modal
} from 'antd';
import {
  UserOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const DetailStaff = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState(null);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/user/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setCertificates(data.user.certificates || []);
      } else {
        message.error('Không thể tải thông tin nhân viên');
        navigate('/dashboard/users');
      }
    } catch (error) {
      message.error('Lỗi khi tải thông tin nhân viên');
      navigate('/dashboard/users');
    } finally {
      setLoading(false);
    }
  };


  const handlePreviewCertificate = (cert) => {
    setPreviewCertificate(cert);
    setPreviewModalVisible(true);
  };

  const handleClosePreview = () => {
    setPreviewModalVisible(false);
    setPreviewCertificate(null);
  };


  const getRoleTag = (role) => {
    const roleConfig = {
      admin: { color: 'red', text: 'Quản trị viên' },
      manager: { color: 'orange', text: 'Quản lý' },
      dentist: { color: 'blue', text: 'Nha sĩ' },
      nurse: { color: 'green', text: 'Y tá' },
      receptionist: { color: 'purple', text: 'Lễ tân' },
      patient: { color: 'default', text: 'Bệnh nhân' }
    };
    
    const config = roleConfig[role] || { color: 'default', text: role };
    return <Tag color={config.color} style={{ fontSize: '14px' }}>{config.text}</Tag>;
  };

  const getStatusTag = (isActive) => {
    return isActive ? (
      <Tag color="green" style={{ fontSize: '14px' }}>Hoạt động</Tag>
    ) : (
      <Tag color="red" style={{ fontSize: '14px' }}>Không hoạt động</Tag>
    );
  };

  // Helper function để tạo info item dạng list
  const createInfoItem = (label, value, copyable = false, icon = null) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '16px 20px',
      borderBottom: '1px solid #f0f0f0'
    }}>
      <div style={{
        minWidth: '160px',
        fontSize: '13px',
        color: '#666',
        fontWeight: '500'
      }}>
        {label}
      </div>
      <div style={{
        flex: 1,
        fontSize: '14px',
        color: '#333',
        fontWeight: '400'
      }}>
        {copyable ? (
          <Text copyable={{ text: value }} style={{ fontSize: '14px' }}>
            {value}
          </Text>
        ) : value}
      </div>
      {icon && (
        <div style={{ marginLeft: '12px', color: '#2596be' }}>
          {icon}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={3} style={{ color: '#ff4d4f' }}>
          Không tìm thấy nhân viên
        </Title>
        <Button onClick={() => navigate('/dashboard/users')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px',
      width: '100%',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Chi tiết nhân viên
            </Title>
            <Text type="secondary">
              Xem thông tin chi tiết và quản lý chứng chỉ
            </Text>
          </div>
          <Space>
            <Button 
              onClick={() => navigate(`/dashboard/users/edit/${id}`)}
              type="primary"
              style={{ borderRadius: '8px' }}
            >
              Chỉnh sửa
            </Button>
            <Button 
              onClick={() => navigate('/dashboard/users')}
              style={{ borderRadius: '8px' }}
            >
              Quay lại
            </Button>
          </Space>
        </div>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Main Content */}
        <Col xs={24}>
          <Card>
            <div style={{ 
              background: '#f8f9fa',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{ 
                padding: '32px 32px 24px 32px',
                textAlign: 'center',
                background: '#2596be',
                color: 'white'
              }}>
                <Avatar 
                  size={100} 
                  src={user.avatar} 
                  icon={<UserOutlined />}
                  style={{ 
                    border: '4px solid white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
                <div style={{ marginTop: '20px' }}>
                  <Title level={3} style={{ 
                    color: 'white', 
                    margin: 0
                  }}>
                    {user.fullName}
                  </Title>
                  <div style={{ marginTop: '8px' }}>
                    {getRoleTag(user.role)}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div style={{ 
                padding: '32px',
                background: 'white'
              }}>
                <Tabs 
                  defaultActiveKey="basic" 
                  items={[
                    {
                      key: 'basic',
                      label: 'Thông tin cơ bản',
                      children: (
                        <div style={{
                          background: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e8e8e8',
                          overflow: 'hidden'
                        }}>
                           {user.employeeCode && 
                             createInfoItem('Mã nhân viên', <Text code>{user.employeeCode}</Text>)
                           }
                           {createInfoItem('Email', user.email, true)}
                           {createInfoItem('Số điện thoại', user.phone, true)}
                           {createInfoItem('Ngày sinh', dayjs(user.dateOfBirth).format('DD/MM/YYYY'))}
                           {createInfoItem('Giới tính', user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : 'Khác')}
                        </div>
                      )
                    },
                    {
                      key: 'work',
                      label: 'Thông tin công việc',
                      children: (
                        <div style={{
                          background: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e8e8e8',
                          overflow: 'hidden'
                        }}>
                           {createInfoItem('Vai trò', getRoleTag(user.role))}
                           {createInfoItem('Trạng thái', getStatusTag(user.isActive))}
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            padding: '16px 20px',
                            borderBottom: 'none'
                          }}>
                            <div style={{
                              minWidth: '160px',
                              fontSize: '13px',
                              color: '#666',
                              fontWeight: '500'
                            }}>
                              Mô tả
                            </div>
                            <div style={{
                              flex: 1,
                              fontSize: '14px',
                              color: '#333',
                              fontWeight: '400',
                              lineHeight: '1.5'
                            }}>
                              {user.description || 'Không có mô tả'}
                            </div>
                          </div>
                        </div>
                      )
                    },
                    // Chỉ hiển thị tab chứng chỉ cho dentist
                    ...(user?.role === 'dentist' ? [{
                      key: 'certificates',
                      label: `Chứng chỉ & Bằng cấp ${certificates && certificates.length > 0 ? `(${certificates.length})` : ''}`,
                      children: (
                        <div style={{ padding: '20px' }}>
                          <div style={{
                            background: 'white',
                            borderRadius: '8px',
                            border: '1px solid #e8e8e8',
                            padding: '20px'
                          }}>
                            
                            {/* Danh sách chứng chỉ cho dentist */}
                            {certificates && certificates.length > 0 ? (
                              <List
                                dataSource={certificates}
                                renderItem={(cert, index) => (
                                  <List.Item
                                    actions={[
                                      <Button 
                                        type="link" 
                                        icon={<EyeOutlined />}
                                        onClick={() => handlePreviewCertificate(cert)}
                                      >
                                        Xem
                                      </Button>
                                    ]}
                                  >
                                    <List.Item.Meta
                                      title={cert.name || `Chứng chỉ ${index + 1}`}
                                      description={
                                        <div>
                                          <div style={{ marginBottom: '8px' }}>
                                            {cert.notes && <div>Ghi chú: {cert.notes}</div>}
                                            <div style={{ fontSize: '12px', color: '#999' }}>
                                              {cert.uploadedAt 
                                                ? `Upload: ${new Date(cert.uploadedAt).toLocaleDateString('vi-VN')}`
                                                : `Tạo: ${new Date(cert.createdAt).toLocaleDateString('vi-VN')}`
                                              }
                                            </div>
                                          </div>
                                          <Tag color={cert.isVerified ? 'green' : 'orange'}>
                                            {cert.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                                          </Tag>
                                        </div>
                                      }
                                    />
                                  </List.Item>
                                )}
                              />
                            ) : (
                              <div style={{ 
                                textAlign: 'center', 
                                color: '#999', 
                                padding: '40px 20px',
                                background: '#fafafa',
                                borderRadius: '8px',
                                border: '1px dashed #d9d9d9'
                              }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📜</div>
                                <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                                  Chưa có chứng chỉ nào
                                </div>
                                <div style={{ fontSize: '14px', color: '#ccc' }}>
                                  Chưa có chứng chỉ nào được upload
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    }] : [])
                  ]}
                  style={{ marginTop: '16px' }}
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Certificate Preview Modal */}
      <Modal
        title={previewCertificate ? `${previewCertificate.name || 'Chứng chỉ'}` : ''}
        open={previewModalVisible}
        onCancel={handleClosePreview}
        footer={null}
        width="auto"
        style={{ maxWidth: '90vw' }}
        centered
      >
        {previewCertificate && (
          <div>
            {/* Two Column Layout for Front and Back Images */}
            {(previewCertificate.frontImage || previewCertificate.backImage) && (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                alignItems: 'start'
              }}>
                {/* Front Image Column */}
                {previewCertificate.frontImage && (
                  <div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '500', 
                      marginBottom: '12px',
                      color: '#333',
                      textAlign: 'center'
                    }}>
                      Mặt trước
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src={previewCertificate.frontImage} 
                        alt="Mặt trước"
                        style={{ 
                          width: '100%', 
                          maxHeight: '80vh', 
                          height: '80vh',
                          objectFit: 'contain',
                          borderRadius: '8px',
                          border: '1px solid #d9d9d9'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Back Image Column */}
                {previewCertificate.backImage && (
                  <div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '500', 
                      marginBottom: '12px',
                      color: '#333',
                      textAlign: 'center'
                    }}>
                      Mặt sau
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src={previewCertificate.backImage} 
                        alt="Mặt sau"
                        style={{ 
                          width: '100%', 
                          height: '80vh',
                          maxHeight: '80vh', 
                          objectFit: 'contain',
                          borderRadius: '8px',
                          border: '1px solid #d9d9d9'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Old format single image */}
            {previewCertificate.imageUrl && !previewCertificate.frontImage && (
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={previewCertificate.imageUrl} 
                  alt="Chứng chỉ"
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '80vh', 
                    objectFit: 'contain',
                    borderRadius: '8px',
                    border: '1px solid #d9d9d9'
                  }}
                />
              </div>
            )}

            {/* No images message */}
            {!previewCertificate.frontImage && !previewCertificate.backImage && !previewCertificate.imageUrl && (
              <div style={{ 
                textAlign: 'center', 
                color: '#999', 
                padding: '40px 20px',
                fontSize: '16px'
              }}>
                Không có ảnh để hiển thị
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default DetailStaff;

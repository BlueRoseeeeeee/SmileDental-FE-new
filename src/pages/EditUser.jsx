/*
* @author: HoTram
*/
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  Radio,
  Upload,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Input as AntInput,
  Tabs,
  List,
  Tag,
  Modal
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  UploadOutlined,
  SaveOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { toast } from '../services/toastService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = AntInput;

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);
  const [newCertificate, setNewCertificate] = useState({ 
    notes: '', 
    files: [], 
    previewUrls: [] 
  });
  const [uploading, setUploading] = useState(false);

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
        
        // Set form values - loại bỏ certificates khỏi form
        const { certificates, ...userData } = data.user;
        form.setFieldsValue({
          ...userData,
          dateOfBirth: data.user.dateOfBirth ? dayjs(data.user.dateOfBirth) : null
        });
      } else {
        toast.error('Không thể tải thông tin người dùng');
        navigate('/users');
      }
    } catch (error) {
      toast.error('Lỗi khi tải thông tin người dùng');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      // Loại bỏ certificates và employeeCode khỏi dữ liệu update
      const { certificates, employeeCode, ...updateData } = values;
      updateData.dateOfBirth = values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null;

      const response = await fetch(`http://localhost:3001/api/user/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast.success('Cập nhật thông tin thành công');
        navigate('/users');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      toast.error('Lỗi khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      setAvatarLoading(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`http://localhost:3001/api/user/avatar/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setUser(prev => ({ ...prev, avatar: data.user.avatar }));
        toast.success('Cập nhật avatar thành công');
      } else {
        toast.error('Cập nhật avatar thất bại');
      }
    } catch (error) {
      toast.error('Lỗi khi cập nhật avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleAddCertificate = async () => {
    if (newCertificate.files.length === 0) {
      toast.error('Vui lòng chọn ít nhất một file ảnh cho chứng chỉ');
      return;
    }

    setUploading(true);

    try {
      // Upload tất cả file ảnh cho 1 chứng chỉ
      const formData = new FormData();
      
      // Thêm tất cả file ảnh
      newCertificate.files.forEach((file, index) => {
        formData.append(`certificate_${index}`, file);
      });
      
      formData.append('notes', newCertificate.notes);
      formData.append('fileCount', newCertificate.files.length.toString());

      const response = await fetch(`http://localhost:3001/api/user/${id}/certificates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setCertificates(data.user.certificates);
        setCertificateModalVisible(false);
        setNewCertificate({ notes: '', files: [], previewUrls: [] });
        toast.success('Thêm chứng chỉ thành công');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Thêm chứng chỉ thất bại');
      }
    } catch (error) {
      toast.error('Lỗi khi thêm chứng chỉ');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCertificate = async (certificateId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/user/${id}/certificates/${certificateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCertificates(data.user.certificates);
        toast.success('Xóa chứng chỉ thành công');
      } else {
        toast.error('Xóa chứng chỉ thất bại');
      }
    } catch (error) {
      toast.error('Lỗi khi xóa chứng chỉ');
    }
  };

  const handleFileSelect = (file) => {
    const previewUrl = URL.createObjectURL(file);
    setNewCertificate(prev => ({
      ...prev,
      files: [...prev.files, file],
      previewUrls: [...prev.previewUrls, previewUrl]
    }));
    return false; // Prevent default upload
  };

  const handleRemoveFile = (index) => {
    setNewCertificate(prev => {
      const newFiles = [...prev.files];
      const newPreviewUrls = [...prev.previewUrls];
      
      // Clean up URL
      URL.revokeObjectURL(newPreviewUrls[index]);
      
      newFiles.splice(index, 1);
      newPreviewUrls.splice(index, 1);
      
      return {
        ...prev,
        files: newFiles,
        previewUrls: newPreviewUrls
      };
    });
  };

  const handleUpdateNotes = (notes) => {
    setNewCertificate(prev => ({ ...prev, notes }));
  };

  const handleCertificateModalClose = () => {
    // Clean up object URLs
    newCertificate.previewUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    setCertificateModalVisible(false);
    setNewCertificate({ notes: '', files: [], previewUrls: [] });
  };

  if (loading && !user) {
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
            <Text type="secondary">
              Cập nhật thông tin cá nhân, avatar và chứng chỉ
            </Text>
          </div>
          <Button 
            onClick={() => navigate('/users')}
            style={{ borderRadius: '8px' }}
          >
            Quay lại
          </Button>
        </div>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Main Content - Tabs */}
        <Col xs={24}>
          <Card>
            <Tabs
              defaultActiveKey="info"
              items={[
                {
                  key: 'info',
                  label: 'Chỉnh sửa thông tin',
                  children: (
                    <Row gutter={[24, 24]}>
                      {/* Left Column - Avatar */}
                      <Col xs={24} lg={8}>
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                          <div style={{ 
                            width: '150px', 
                            height: '150px', 
                            borderRadius: '50%',
                            overflow: 'hidden',
                            margin: '0 auto 16px',
                            border: '3px solid #2596be',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#f0f0f0'
                          }}>
                            {user?.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt="Avatar" 
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover' 
                                }}
                              />
                            ) : (
                              <UserOutlined style={{ fontSize: '48px', color: '#999' }} />
                            )}
                          </div>
                          
                          <Upload
                            beforeUpload={(file) => {
                              handleAvatarUpload(file);
                              return false;
                            }}
                            showUploadList={false}
                            accept="image/*"
                          >
                            <Button 
                              type="primary" 
                              icon={<UploadOutlined />}
                              loading={avatarLoading}
                              style={{ borderRadius: '8px' }}
                            >
                              {avatarLoading ? 'Đang tải...' : 'Thay đổi avatar'}
                            </Button>
                          </Upload>
                        </div>
                      </Col>

                      {/* Right Column - Form */}
                      <Col xs={24} lg={16}>
                        <Form
                          form={form}
                          layout="vertical"
                          onFinish={handleSubmit}
                        >
                      <Title level={4}>Thông tin cá nhân</Title>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="employeeCode"
                            label="Mã nhân viên"
                          >
                            <Input 
                              prefix={<IdcardOutlined />}
                              placeholder="Mã nhân viên"
                              style={{ borderRadius: '8px' }}
                              disabled
                            />
                          </Form.Item>
                        </Col>
                        
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="fullName"
                            label="Họ và tên"
                            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
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
                              disabled
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="phone"
                            label="Số điện thoại"
                          >
                            <Input 
                              prefix={<PhoneOutlined />}
                              placeholder="Nhập số điện thoại"
                              style={{ borderRadius: '8px' }}
                              disabled
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="dateOfBirth"
                            label="Ngày sinh"
                            rules={[
                              { required: true, message: 'Vui lòng chọn ngày sinh!' },
                              {
                                validator: (_, value) => {
                                  if (!value) return Promise.resolve();
                                  
                                  const today = new Date();
                                  const birthDate = new Date(value);
                                  let age = today.getFullYear() - birthDate.getFullYear();
                                  const monthDiff = today.getMonth() - birthDate.getMonth();
                                  
                                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                    age--;
                                  }
                                  
                                  if (age < 18) {
                                    return Promise.reject(new Error('Nhân viên phải từ 18 tuổi trở lên!'));
                                  }
                                  
                                  if (birthDate > today) {
                                    return Promise.reject(new Error('Ngày sinh không được ở tương lai!'));
                                  }
                                  
                                  return Promise.resolve();
                                }
                              }
                            ]}
                          >
                            <DatePicker 
                              style={{ width: '100%', borderRadius: '8px' }}
                              placeholder="Chọn ngày sinh"
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
                              <Radio value="male">Nam</Radio>
                              <Radio value="female">Nữ</Radio>
                            </Radio.Group>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Divider />

                      <Title level={4}>Thông tin công việc</Title>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="role"
                            label="Vai trò"
                            rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                          >
                            <Select placeholder="Chọn vai trò" style={{ borderRadius: '8px' }} disabled>
                              <Option value="admin">Quản trị viên</Option>
                              <Option value="manager">Quản lý</Option>
                              <Option value="dentist">Nha sĩ</Option>
                              <Option value="nurse">Y tá</Option>
                              <Option value="receptionist">Lễ tân</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="isActive"
                            label="Trạng thái"
                            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
                          >
                            <Radio.Group>
                              <Radio value={true}>Hoạt động</Radio>
                              <Radio value={false}>Không hoạt động</Radio>
                            </Radio.Group>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Divider />

                      <Title level={4}>Thông tin bổ sung</Title>
                      <Row gutter={[16, 16]}>
                        <Col xs={24}>
                          <Form.Item
                            name="description"
                            label="Mô tả thêm"
                          >
                            <TextArea
                              rows={6}
                              placeholder="Nhập mô tả về kinh nghiệm, thành tích hoặc thông tin bổ sung..."
                              className="custom-textarea"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Divider />

                      <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button 
                          onClick={() => navigate('/users')}
                          style={{ borderRadius: '8px' }}
                        >
                          Hủy
                        </Button>
                        <Button 
                          type="primary" 
                          htmlType="submit"
                          loading={loading}
                          icon={<SaveOutlined />}
                          style={{ 
                            background: '#2596be',
                            border: 'none',
                            borderRadius: '8px'
                          }}
                        >
                          Lưu thay đổi
                        </Button>
                      </Space>
                    </Form>
                      </Col>
                    </Row>
                  )
                },
                {
                  key: 'certificates',
                  label: 'Chứng chỉ & Bằng cấp',
                  children: (
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '16px'
                      }}>
                        <Title level={4} style={{ margin: 0 }}>Chứng chỉ & Bằng cấp</Title>
                        <Button 
                          type="primary" 
                          icon={<PlusOutlined />}
                          onClick={() => setCertificateModalVisible(true)}
                          style={{ borderRadius: '8px' }}
                        >
                          Thêm chứng chỉ
                        </Button>
                      </div>

                      {certificates.length === 0 ? (
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
                            Nhấn "Thêm chứng chỉ" để upload ảnh
                          </div>
                        </div>
                      ) : (
                        <List
                          dataSource={certificates}
                          renderItem={(cert, index) => (
                            <List.Item
                              actions={[
                                <Button 
                                  type="link" 
                                  icon={<EyeOutlined />}
                                  onClick={() => window.open(cert.imageUrl, '_blank')}
                                >
                                  Xem
                                </Button>,
                                <Button 
                                  type="link" 
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleDeleteCertificate(cert._id)}
                                >
                                  Xóa
                                </Button>
                              ]}
                            >
                              <List.Item.Meta
                                title={`Chứng chỉ ${index + 1}`}
                                description={
                                  <div>
                                    <div style={{ marginBottom: '8px' }}>
                                      {cert.notes && <div>Ghi chú: {cert.notes}</div>}
                                      <div style={{ fontSize: '12px', color: '#999' }}>
                                        Upload: {new Date(cert.uploadedAt).toLocaleDateString('vi-VN')}
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
                      )}
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* Certificate Modal */}
      <Modal
        title="Thêm chứng chỉ mới"
        open={certificateModalVisible}
        onOk={handleAddCertificate}
        onCancel={handleCertificateModalClose}
        okText={uploading ? "Đang tải lên..." : "Thêm chứng chỉ"}
        cancelText="Hủy"
        width={800}
        okButtonProps={{ 
          disabled: newCertificate.files.length === 0 || uploading,
          loading: uploading 
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', fontSize: '14px' }}>
            Chọn ảnh cho chứng chỉ (có thể chọn nhiều ảnh cho 1 chứng chỉ):
          </label>
          <Upload
            beforeUpload={handleFileSelect}
            showUploadList={false}
            accept="image/*"
            multiple
          >
            <Button 
              icon={<UploadOutlined />} 
              style={{ 
                width: '100%', 
                height: '50px',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              📁 Chọn ảnh (có thể chọn nhiều ảnh)
            </Button>
          </Upload>
        </div>

        {/* File Preview List */}
        {newCertificate.files.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              marginBottom: '12px',
              color: '#333'
            }}>
              📋 Ảnh đã chọn cho chứng chỉ này ({newCertificate.files.length} ảnh):
            </div>
            
            <div style={{ 
              maxHeight: '400px', 
              overflowY: 'auto',
              border: '1px solid #e8e8e8',
              borderRadius: '8px',
              padding: '12px'
            }}>
              {newCertificate.files.map((file, index) => (
                <div key={index} style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  background: '#fafafa'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#333',
                        marginBottom: '4px'
                      }}>
                        📄 Ảnh {index + 1}: {file.name}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666' 
                      }}>
                        Kích thước: {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <Button 
                      type="text" 
                      danger 
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveFile(index)}
                      style={{ marginLeft: '8px' }}
                    >
                      Xóa
                    </Button>
                  </div>

                  {/* Image Preview */}
                  <div style={{ marginBottom: '12px' }}>
                    <img 
                      src={newCertificate.previewUrls[index]} 
                      alt={`Preview ${index + 1}`}
                      style={{ 
                        width: '100%', 
                        maxHeight: '200px', 
                        objectFit: 'contain',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        background: 'white'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes for the certificate */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '500',
            fontSize: '14px',
            color: '#333'
          }}>
            Ghi chú cho chứng chỉ:
          </label>
          <TextArea
            value={newCertificate.notes}
            onChange={(e) => handleUpdateNotes(e.target.value)}
            placeholder="Nhập ghi chú cho chứng chỉ này..."
            rows={3}
            style={{ fontSize: '13px' }}
          />
        </div>

        {/* Summary */}
        {newCertificate.files.length > 0 && (
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '13px', color: '#0369a1' }}>
              <strong>📊 Tóm tắt:</strong> Bạn đã chọn {newCertificate.files.length} ảnh cho 1 chứng chỉ. 
              Tất cả ảnh sẽ được gộp thành 1 chứng chỉ duy nhất.
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default EditUser;

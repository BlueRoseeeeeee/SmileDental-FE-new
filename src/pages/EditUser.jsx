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
  message,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  List,
  Tag,
  Modal,
  Input as AntInput
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  ManOutlined,
  WomanOutlined,
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  SaveOutlined
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
  const [newCertificate, setNewCertificate] = useState({ notes: '' });

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
        
        // Set form values
        form.setFieldsValue({
          ...data.user,
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
      const updateData = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null
      };

      const response = await fetch(`http://localhost:3001/api/user/update/${id}`, {
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
    try {
      const formData = new FormData();
      formData.append('certificate', newCertificate.file);
      formData.append('notes', newCertificate.notes);

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
        setNewCertificate({ notes: '' });
        toast.success('Thêm chứng chỉ thành công');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Thêm chứng chỉ thất bại');
      }
    } catch (error) {
      toast.error('Lỗi khi thêm chứng chỉ');
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
            <Title level={2} style={{ margin: 0, color: '#2596be' }}>
              Chỉnh sửa thông tin người dùng
            </Title>
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
        {/* Left Column - Avatar & Certificates */}
        <Col xs={24} lg={8}>
          {/* Avatar Section */}
          <Card title="Ảnh đại diện" style={{ marginBottom: '24px' }}>
            <div style={{ textAlign: 'center' }}>
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
                  return false; // Prevent default upload
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
          </Card>

          {/* Certificates Section */}
          <Card 
            title="Chứng chỉ & Bằng cấp"
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setCertificateModalVisible(true)}
                style={{ borderRadius: '8px' }}
              >
                Thêm chứng chỉ
              </Button>
            }
          >
            {certificates.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                Chưa có chứng chỉ nào
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
                        onClick={() => window.open(cert.url, '_blank')}
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
                          <div>{cert.notes}</div>
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
          </Card>
        </Col>

        {/* Right Column - Form */}
        <Col xs={24} lg={16}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Title level={4}>Thông tin cá nhân</Title>
              <Row gutter={[16, 16]}>
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
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số điện thoại!' },
                      { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại phải có 10-11 chữ số!' }
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
                      <Radio value="male">
                        Nam
                      </Radio>
                      <Radio value="female">
                         Nữ
                      </Radio>
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
                    <Select placeholder="Chọn vai trò" style={{ borderRadius: '8px' }}>
                      <Option value="admin">Quản trị viên</Option>
                      <Option value="manager">Quản lý</Option>
                      <Option value="dentist">Nha sĩ</Option>
                      <Option value="nurse">Y tá</Option>
                      <Option value="receptionist">Lễ tân</Option>
                      <Option value="patient">Bệnh nhân</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="type"
                    label="Loại công việc"
                    rules={[{ required: true, message: 'Vui lòng chọn loại công việc!' }]}
                  >
                    <Select placeholder="Chọn loại công việc" style={{ borderRadius: '8px' }}>
                      <Option value="fullTime">Toàn thời gian</Option>
                      <Option value="partTime">Bán thời gian</Option>
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
          </Card>
        </Col>
      </Row>

      {/* Certificate Modal */}
      <Modal
        title="Thêm chứng chỉ mới"
        open={certificateModalVisible}
        onOk={handleAddCertificate}
        onCancel={() => {
          setCertificateModalVisible(false);
          setNewCertificate({ notes: '' });
        }}
        okText="Thêm chứng chỉ"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Chọn file chứng chỉ:
          </label>
          <Upload
            beforeUpload={(file) => {
              setNewCertificate(prev => ({ ...prev, file }));
              return false;
            }}
            showUploadList={true}
            accept="image/*,.pdf"
          >
            <Button icon={<UploadOutlined />}>Chọn file</Button>
          </Upload>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Ghi chú:
          </label>
          <TextArea
            value={newCertificate.notes}
            onChange={(e) => setNewCertificate(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Nhập ghi chú về chứng chỉ..."
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
};

export default EditUser;

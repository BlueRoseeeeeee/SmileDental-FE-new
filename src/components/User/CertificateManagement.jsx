/*
* @author: HoTram
*/
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Upload, 
  Modal, 
  Form, 
  Input, 
  // message, // Replaced with toast service 
  Space, 
  Typography, 
  Row, 
  Col, 
  Image, 
  Tag, 
  Popconfirm,
  Divider,
  Spin,
  Alert
} from 'antd';
import { toast } from '../../services/toastService';
import { 
  PlusOutlined, 
  UploadOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  EditOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { userService } from '../../services/userService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

// Backend URL for certificate images
const BACKEND_URL = 'https://be.smilecare.io.vn';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CertificateManagement = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // ✅ Check selectedRole from localStorage
    const selectedRole = localStorage.getItem('selectedRole');
    if (selectedRole === 'dentist' && user?._id) {
      loadCertificates();
    }
  }, [user]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const response = await userService.getUserById(user._id);
      setCertificates(response.user.certificates || []);
    } catch (error) {
      toast.error('Không thể tải danh sách chứng chỉ');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (values) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('certificate', values.file.file);
      if (values.notes) {
        formData.append('notes', values.notes);
      }

      await userService.uploadCertificate(user._id, values.file.file, values.notes);
      toast.success('Upload chứng chỉ thành công');
      setUploadModalVisible(false);
      form.resetFields();
      loadCertificates();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload chứng chỉ thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (certificateId) => {
    try {
      await userService.deleteCertificate(user._id, certificateId);
      toast.success('Xóa chứng chỉ thành công');
      loadCertificates();
    } catch (error) {
      toast.error('Xóa chứng chỉ thất bại');
    }
  };

  const handleEditNotes = (certificate) => {
    setEditingCertificate(certificate);
    form.setFieldsValue({ notes: certificate.notes });
    setEditModalVisible(true);
  };

  const handleUpdateNotes = async (values) => {
    try {
      await userService.updateCertificateNotes(
        user._id, 
        editingCertificate._id, 
        values.notes
      );
      toast.success('Cập nhật ghi chú thành công');
      setEditModalVisible(false);
      form.resetFields();
      loadCertificates();
    } catch (error) {
      toast.error('Cập nhật ghi chú thất bại');
    }
  };

  const handlePreview = (certificate) => {
    setPreviewImage(certificate);
    setPreviewModalVisible(true);
  };

  // Helper to get full image URL with backend prefix
  const getFullImageUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
  };

  const getStatusTag = (certificate) => {
    if (certificate.isVerified) {
      return (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          Đã xác thực
        </Tag>
      );
    }
    return (
      <Tag color="orange" icon={<ClockCircleOutlined />}>
        Chờ xác thực
      </Tag>
    );
  };

  const getCertificateStats = () => {
    const total = certificates.length;
    const verified = certificates.filter(cert => cert.isVerified).length;
    const pending = total - verified;
    
    return { total, verified, pending };
  };

  const stats = getCertificateStats();

  // ✅ Check selectedRole from localStorage instead of user.role
  const selectedRole = localStorage.getItem('selectedRole');
  
  if (selectedRole !== 'dentist') {
    return (
      <Alert
        message="Chức năng này chỉ dành cho nha sĩ"
        description="Chỉ có nha sĩ mới có thể quản lý chứng chỉ."
        type="warning"
        showIcon
      />
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Đang tải danh sách chứng chỉ...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          Quản lý chứng chỉ
        </Title>
        <Text type="secondary">
          Upload và quản lý các chứng chỉ chuyên môn của bạn
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={8}>
          <Card style={{ textAlign: 'center', borderRadius: '8px' }}>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              {stats.total}
            </Title>
            <Text type="secondary">Tổng số chứng chỉ</Text>
          </Card>
        </Col>
        <Col xs={8}>
          <Card style={{ textAlign: 'center', borderRadius: '8px' }}>
            <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
              {stats.verified}
            </Title>
            <Text type="secondary">Đã xác thực</Text>
          </Card>
        </Col>
        <Col xs={8}>
          <Card style={{ textAlign: 'center', borderRadius: '8px' }}>
            <Title level={3} style={{ margin: 0, color: '#faad14' }}>
              {stats.pending}
            </Title>
            <Text type="secondary">Chờ xác thực</Text>
          </Card>
        </Col>
      </Row>

      {/* Upload Button */}
      <div style={{ marginBottom: '24px' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setUploadModalVisible(true)}
          size="large"
          style={{ borderRadius: '8px' }}
        >
          Upload chứng chỉ mới
        </Button>
      </div>

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <Title level={4} style={{ color: '#999' }}>
            Chưa có chứng chỉ nào
          </Title>
          <Text type="secondary">
            Hãy upload chứng chỉ đầu tiên để bắt đầu
          </Text>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {certificates.map((certificate, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={certificate._id}>
              <Card
                hoverable
                style={{ borderRadius: '8px' }}
                cover={
                  <div 
                    style={{ height: '200px', overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => handlePreview(certificate)}
                  >
                    <img
                      src={getFullImageUrl(certificate.frontImage)}
                      alt={`Chứng chỉ ${index + 1}`}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                      onError={(e) => {
                        console.error('❌ Image load failed:', certificate);
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="14"%3EKhông tải được ảnh%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                }
                actions={[
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview(certificate)}
                  >
                    Xem
                  </Button>,
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleEditNotes(certificate)}
                  >
                    Sửa
                  </Button>,
                  <Popconfirm
                    title="Xóa chứng chỉ"
                    description="Bạn có chắc chắn muốn xóa chứng chỉ này?"
                    onConfirm={() => handleDelete(certificate._id)}
                    okText="Xóa"
                    cancelText="Hủy"
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                    >
                      Xóa
                    </Button>
                  </Popconfirm>
                ]}
              >
                {/* Tên chứng chỉ */}
                {certificate.name && (
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong style={{ fontSize: '14px', color: '#333' }}>
                      {certificate.name}
                    </Text>
                  </div>
                )}
                
                <div style={{ marginBottom: '8px' }}>
                  {getStatusTag(certificate)}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {certificate.uploadedAt 
                      ? `Ngày tải lên: ${new Date(certificate.uploadedAt).toLocaleDateString('vi-VN')}`
                      : certificate.createdAt
                      ? `Ngày tạo: ${new Date(certificate.createdAt).toLocaleDateString('vi-VN')}`
                      : ''}
                  </Text>
                </div>
                {certificate.notes && (
                  <div>
                    <Text style={{ fontSize: '12px' }} ellipsis>
                      {certificate.notes}
                    </Text>
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Upload Modal */}
      <Modal
        title="Upload chứng chỉ mới"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpload}
        >
          <Form.Item
            name="file"
            label="Chọn file ảnh chứng chỉ"
            rules={[{ required: true, message: 'Vui lòng chọn file!' }]}
          >
            <Upload
              beforeUpload={() => false}
              accept="image/*"
              listType="picture-card"
              maxCount={1}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Chọn ảnh</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Ghi chú (tùy chọn)"
          >
            <TextArea
              rows={5}
              className='custom-textarea'
              placeholder="Nhập ghi chú về chứng chỉ..."
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                onClick={() => {
                  setUploadModalVisible(false);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={uploading}
                style={{ borderRadius: '8px' }}
              >
                {uploading ? 'Đang upload...' : 'Upload'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Notes Modal */}
      <Modal
        title="Chỉnh sửa ghi chú"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateNotes}
        >
          <Form.Item
            name="notes"
            label="Ghi chú"
          >
            <TextArea
              rows={5}
              placeholder="Nhập ghi chú về chứng chỉ..."
              className='custom-textarea'
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                onClick={() => {
                  setEditModalVisible(false);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{ borderRadius: '8px' }}
              >
                Cập nhật
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title={previewImage?.name || 'Xem trước chứng chỉ'}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={null}
        width="auto"
        style={{ maxWidth: '90vw' }}
        centered
      >
        {previewImage && (
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: previewImage.backImage ? '1fr 1fr' : '1fr',
            gap: '20px',
            alignItems: 'start'
          }}>
            {/* Front Image */}
            {previewImage.frontImage && (
              <div>
                {/* Chỉ hiển thị label nếu có cả 2 ảnh */}
                {previewImage.backImage && (
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '500', 
                    marginBottom: '12px',
                    color: '#333',
                    textAlign: 'center'
                  }}>
                    Mặt trước
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={getFullImageUrl(previewImage.frontImage)}
                    alt="Mặt trước"
                    style={{ 
                      width: '100%', 
                      maxHeight: '80vh', 
                      height: '80vh',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      border: '1px solid #d9d9d9'
                    }}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="16"%3EKhông tải được ảnh%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Back Image */}
            {previewImage.backImage && (
              <div>
                {/* Chỉ hiển thị label nếu có cả 2 ảnh */}
                {previewImage.frontImage && (
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '500', 
                    marginBottom: '12px',
                    color: '#333',
                    textAlign: 'center'
                  }}>
                    Mặt sau
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={getFullImageUrl(previewImage.backImage)}
                    alt="Mặt sau"
                    style={{ 
                      width: '100%', 
                      height: '80vh',
                      maxHeight: '80vh', 
                      objectFit: 'contain',
                      borderRadius: '8px',
                      border: '1px solid #d9d9d9'
                    }}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="16"%3EKhông tải được ảnh%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CertificateManagement;

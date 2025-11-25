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
      const file = values.file.file;

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP) hoặc PDF!');
        return;
      }

      // Validate file size (max 5MB)
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        toast.error('Kích thước file không được vượt quá 5MB!');
        return;
      }

      setUploading(true);
      const formData = new FormData();
      formData.append('certificate', file);
      if (values.notes) {
        formData.append('notes', values.notes);
      }

      await userService.uploadCertificate(user._id, file, values.notes);
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

  const handlePreview = (imageUrl) => {
    setPreviewImage(imageUrl);
    setPreviewModalVisible(true);
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
                  <div style={{ height: '200px', overflow: 'hidden' }}>
                    <Image
                      src={certificate.imageUrl}
                      alt={`Chứng chỉ ${index + 1}`}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                      preview={false}
                      onClick={() => handlePreview(certificate.imageUrl)}
                    />
                  </div>
                }
                actions={[
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview(certificate.imageUrl)}
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
                <div style={{ marginBottom: '8px' }}>
                  {getStatusTag(certificate)}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Upload: {new Date(certificate.uploadedAt).toLocaleDateString('vi-VN')}
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
            label="Chọn file ảnh chứng chỉ (tối đa 5MB)"
            rules={[{ required: true, message: 'Vui lòng chọn file!' }]}
          >
            <Upload
              beforeUpload={() => false}
              accept="image/*,application/pdf"
              listType="picture-card"
              maxCount={1}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Chọn ảnh/PDF</div>
                <div style={{ fontSize: '12px', color: '#999' }}>Max 5MB</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Ghi chú (tùy chọn)"
          >
            <TextArea
              rows={3}
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
              rows={4}
              placeholder="Nhập ghi chú về chứng chỉ..."
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
        title="Xem trước chứng chỉ"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={null}
        width="80%"
        style={{ maxWidth: '800px' }}
      >
        <Image
          src={previewImage}
          alt="Preview"
          style={{ width: '100%' }}
        />
      </Modal>
    </div>
  );
};

export default CertificateManagement;

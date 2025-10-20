/**
 * Trang chỉnh sửa dịch vụ nha khoa
 * @author: HoTram  
 */
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Space, 
  Spin, 
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  message,
  Tag,
  Table,
  Modal
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { servicesService, toast as toastService } from '../services';
import TinyMCE from '../components/TinyMCE/TinyMCE';

const { Title, Text } = Typography;

const EditService = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [serviceDescription, setServiceDescription] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Add-on confirmation states
  const [showToggleConfirmModal, setShowToggleConfirmModal] = useState(false);
  const [selectedAddOn, setSelectedAddOn] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);


  // Auto-save key for localStorage
  const AUTO_SAVE_KEY = `service_draft_${serviceId}`;

  useEffect(() => {
    if (serviceId) {
      fetchServiceDetails();
    }
  }, [serviceId]);

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges) {
      const autoSaveTimer = setTimeout(() => {
        saveDraft();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(autoSaveTimer);
    }
  }, [hasUnsavedChanges, serviceDescription, form.getFieldsValue()]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Bạn có thay đổi chưa được lưu. Bạn có chắc muốn rời khỏi trang?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchServiceDetails = async () => {
    setLoading(true);
    try {
      console.log('Fetching service details for ID:', serviceId);
      const response = await servicesService.getServiceById(serviceId);
      console.log('Service response:', response);
      setService(response);
      
      // Load draft if exists
      const draft = loadDraft();
      if (draft) {
        form.setFieldsValue(draft.formData);
        setServiceDescription(draft.description);
        setHasUnsavedChanges(true);
        message.info('Đã khôi phục bản nháp chưa lưu');
      } else {
        form.setFieldsValue({
          name: response.name,
          type: response.type,
          requireExamFirst: response.requireExamFirst
        });
        setServiceDescription(response.description || '');
      }
    } catch (error) {
      console.error('Error fetching service details:', error);
      toastService.error('Không thể tải chi tiết dịch vụ: ' + error.message);
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  // Save draft to localStorage
  const saveDraft = () => {
    try {
      const formData = form.getFieldsValue();
      const draft = {
        formData,
        description: serviceDescription,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(draft));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  // Load draft from localStorage
  const loadDraft = () => {
    try {
      const draft = localStorage.getItem(AUTO_SAVE_KEY);
      return draft ? JSON.parse(draft) : null;
    } catch (error) {
      console.error('Error loading draft:', error);
      return null;
    }
  };

  // Clear draft from localStorage
  const clearDraft = () => {
    localStorage.removeItem(AUTO_SAVE_KEY);
  };

  // Handle form field changes
  const handleFormChange = () => {
    setHasUnsavedChanges(true);
  };

  // Handle description change
  const handleDescriptionChange = (value) => {
    setServiceDescription(value);
    setHasUnsavedChanges(true);
  };

  // Handle save service
  const handleSaveService = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      const updateData = {
        name: values.name,
        type: values.type,
        description: serviceDescription,
        requireExamFirst: values.requireExamFirst
      };

      const updatedService = await servicesService.updateService(serviceId, updateData);
      setService(updatedService);
      setHasUnsavedChanges(false);
      clearDraft();
      setLastSaved(new Date());
      toastService.success('Cập nhật dịch vụ thành công!');
    } catch (error) {
      toastService.error('Lỗi khi cập nhật dịch vụ');
    } finally {
      setSaving(false);
    }
  };

  // Handle go back
  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('Bạn có thay đổi chưa được lưu. Bạn có chắc muốn rời khỏi trang?');
      if (!confirmed) return;
    }
    navigate('/services');
  };

  // Handle delete add-on
  const handleDeleteAddOn = async (addon) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa tùy chọn "${addon.name}"?`);
    if (!confirmed) return;

    try {
      await servicesService.deleteServiceAddOn(serviceId, addon._id);
      toastService.success('Xóa tùy chọn dịch vụ thành công!');
      // Reload service details
      await fetchServiceDetails();
    } catch (error) {
      toastService.error('Lỗi khi xóa tùy chọn dịch vụ');
    }
  };

  // Show toggle confirmation modal
  const handleToggleAddOn = (addOn) => {
    setSelectedAddOn(addOn);
    setShowToggleConfirmModal(true);
  };

  // Confirm toggle add-on
  const handleConfirmToggleAddOn = async () => {
    if (!selectedAddOn) return;
    
    try {
      setToggleLoading(true);
      await servicesService.toggleServiceAddOn(serviceId, selectedAddOn._id);
      toastService.success(`Đã ${selectedAddOn.isActive ? 'tắt' : 'bật'} tùy chọn dịch vụ!`);
      await fetchServiceDetails();
    } catch (error) {
      toastService.error('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setToggleLoading(false);
      setShowToggleConfirmModal(false);
      setSelectedAddOn(null);
    }
  };

  // Cancel toggle confirmation
  const handleCancelToggleAddOn = () => {
    setShowToggleConfirmModal(false);
    setSelectedAddOn(null);
  };


  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!service) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh'
      }}>
        <Text type="secondary">Không tìm thấy dịch vụ</Text>
        <br />
        <Button onClick={() => navigate('/services')} style={{ marginTop: 16 }}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleGoBack}
          style={{ marginBottom: 16 }}
        >
          Quay lại danh sách
        </Button>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16
        }}>
          <Title level={2} style={{ margin: 0 }}>
            Chỉnh sửa dịch vụ
          </Title>
          
          <Space>
            {lastSaved && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Lưu lần cuối: {lastSaved.toLocaleTimeString()}
              </Text>
            )}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveService}
              loading={saving}
              disabled={!hasUnsavedChanges}
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </Space>
        </div>
      </div>

      {/* Form */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleFormChange}
          initialValues={{
            name: service?.name,
            type: service?.type,
            requireExamFirst: service?.requireExamFirst
          }}
        >
          <Row gutter={[16, 16]}>
            {/* Row 1: Tên dịch vụ + Loại dịch vụ */}
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên dịch vụ"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên dịch vụ' },
                  { min: 2, message: 'Tên dịch vụ phải có ít nhất 2 ký tự' }
                ]}
              >
                <Input placeholder="Nhập tên dịch vụ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Loại dịch vụ"
                rules={[{ required: true, message: 'Vui lòng chọn loại dịch vụ' }]}
              >
                <Select placeholder="Chọn loại dịch vụ">
                  <Select.Option value="treatment">Điều trị</Select.Option>
                  <Select.Option value="exam">Khám</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Row 2: Yêu cầu khám trước - Full width */}
            <Col span={24}>
              <Form.Item
                name="requireExamFirst"
                label="Yêu cầu khám trước"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Có"
                  unCheckedChildren="Không"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Row 3: Mô tả - Full width */}
            <Col span={24}>
              <Form.Item
                label="Mô tả"
              >
                <TinyMCE
                  value={serviceDescription}
                  onChange={handleDescriptionChange}
                  placeholder="Nhập mô tả dịch vụ (tùy chọn)..."
                  containerStyle={{ 
                    width: '100%',
                    height: '600px'
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Service Add-Ons Section */}
      <Card 
        title="Các tùy chọn dịch vụ" 
        style={{ marginTop: 24 }}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(`/services/${serviceId}/addons/add`)}
            size="small"
          >
            Thêm tùy chọn
          </Button>
        }
      >
        {service?.serviceAddOns && service.serviceAddOns.length > 0 ? (
          <Table
            dataSource={service.serviceAddOns || []}
            rowKey="_id"
            pagination={false}
            size="small"
            columns={[
              {
                title: 'STT',
                key: 'index',
                width: 60,
                render: (_, __, index) => index + 1,
              },
              {
                title: 'Tên tùy chọn',
                dataIndex: 'name',
                key: 'name',
                render: (text, record) => (
                  <div>
                    <Text strong>{text}</Text>
                  </div>
                ),
              },
              {
                title: 'Giá',
                dataIndex: 'price',
                key: 'price',
                render: (price) => (
                  <Text strong style={{ color: '#52c41a' }}>
                    {new Intl.NumberFormat('vi-VN').format(price)}đ
                  </Text>
                ),
              },
              {
                title: 'Thời gian',
                dataIndex: 'durationMinutes',
                key: 'durationMinutes',
                render: (duration) => (
                  <Text>{duration} phút</Text>
                ),
              },
              {
                title: 'Đơn vị',
                dataIndex: 'unit',
                key: 'unit',
                render: (unit) => (
                  <Tag color="blue">{unit}</Tag>
                ),
              },
              {
                title: 'Trạng thái',
                key: 'status',
                render: (_, record) => (
                  <Tag color={record.isActive ? 'green' : 'red'}>
                    {record.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                  </Tag>
                ),
              },
              {
                title: 'Thao tác',
                key: 'actions',
                width: 180,
                render: (_, record) => (
                  <Space>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => navigate(`/services/${serviceId}/addons/${record._id}/edit`)}
                      size="small"
                    />
                    <Switch
                      size="small"
                      checked={record.isActive}
                      onChange={() => handleToggleAddOn(record)}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteAddOn(record)}
                      size="small"
                    />
                  </Space>
                ),
              },
            ]}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="secondary">Chưa có tùy chọn dịch vụ</Text>
            <br />
            <Button 
              type="dashed" 
              icon={<PlusOutlined />}
              onClick={() => navigate(`/services/${serviceId}/addons/add`)}
              style={{ marginTop: 8 }}
            >
              Thêm tùy chọn đầu tiên
            </Button>
          </div>
        )}
      </Card>

      {/* Toggle Add-On Confirmation Modal */}
      <Modal
        title="Xác nhận thay đổi trạng thái tùy chọn dịch vụ"
        open={showToggleConfirmModal}
        onOk={handleConfirmToggleAddOn}
        onCancel={handleCancelToggleAddOn}
        okText={selectedAddOn?.isActive ? 'Tắt tùy chọn' : 'Bật tùy chọn'}
        cancelText="Hủy"
        okType={selectedAddOn?.isActive ? 'danger' : 'primary'}
        confirmLoading={toggleLoading}
      >
        {selectedAddOn && (
          <div>
            <p>
              Bạn có chắc chắn muốn{' '}
              <strong style={{ color: selectedAddOn.isActive ? '#ff4d4f' : '#52c41a' }}>
        {selectedAddOn.isActive ? 'TẮT' : 'BẬT'}
          </strong>
              {' '}tùy chọn dịch vụ{' '}
         <strong>"{selectedAddOn.name}"</strong>?
            </p>
            {selectedAddOn.isActive && (
              <div>
                <p style={{ color: '#faad14', fontSize: 12 }}>
                   Tùy chọn dịch vụ sẽ không còn khả dụng cho bệnh nhân đặt lịch.
                </p>
                {selectedAddOn.hasBeenUsed && (
                  <p style={{ color: '#ff4d4f', fontSize: 12 }}>
                     Tùy chọn này đã được sử dụng trong quá khứ.
                  </p>
                )}
              </div>
            )}
            {!selectedAddOn.isActive && (
              <p style={{ color: '#52c41a', fontSize: 12 }}>
                 Tùy chọn dịch vụ sẽ được kích hoạt và sẵn sàng phục vụ bệnh nhân.
              </p>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default EditService;

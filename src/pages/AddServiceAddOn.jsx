/**
 * Trang thêm cấp độ dịch vụ
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
  InputNumber,
  message
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { servicesService, toast as toastService } from '../services';
import TinyMCE from '../components/TinyMCE/TinyMCE';

const { Title, Text } = Typography;

const AddServiceAddOn = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [addOnDescription, setAddOnDescription] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save key for localStorage
  const AUTO_SAVE_KEY = `addon_draft_${serviceId}`;

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
      }, 2000);

      return () => clearTimeout(autoSaveTimer);
    }
  }, [hasUnsavedChanges, addOnDescription, form.getFieldsValue()]);

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
      const response = await servicesService.getServiceById(serviceId);
      setService(response);
      
      // Load draft if exists
      const draft = loadDraft();
      if (draft) {
        form.setFieldsValue(draft.formData);
        setAddOnDescription(draft.description);
        setHasUnsavedChanges(true);
        message.info('Đã khôi phục bản nháp chưa lưu');
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
        description: addOnDescription,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(draft));
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
    setAddOnDescription(value);
    setHasUnsavedChanges(true);
  };

  // Handle save add-on
  const handleSaveAddOn = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      const addOnData = {
        name: values.name,
        price: values.price,
        description: addOnDescription
      };

      await servicesService.addServiceAddOn(serviceId, addOnData);
      setHasUnsavedChanges(false);
      clearDraft();
      toastService.success('Thêm tùy chọn dịch vụ thành công!');
      navigate(`/services/${serviceId}/edit`);
    } catch (error) {
      toastService.error('Lỗi khi thêm tùy chọn dịch vụ');
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
    navigate(`/services/${serviceId}/edit`);
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
          Quay lại chỉnh sửa dịch vụ
        </Button>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16
        }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Thêm tùy chọn dịch vụ
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Dịch vụ: {service.name}
            </Text>
          </div>
          
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveAddOn}
              loading={saving}
              disabled={!hasUnsavedChanges}
            >
              {saving ? 'Đang lưu...' : 'Lưu tùy chọn'}
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
            name: '',
            price: 0
          }}
        >
          <Row gutter={[16, 16]}>
            {/* Row 1: Tên cấp độ + Giá */}
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên tùy chọn"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên tùy chọn' },
                  { min: 3, message: 'Tên tùy chọn phải có ít nhất 3 ký tự' }
                ]}
              >
                <Input placeholder="Nhập tên tùy chọn dịch vụ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Giá (VNĐ)"
                rules={[
                  { required: true, message: 'Vui lòng nhập giá' },
                  { type: 'number', min: 0, message: 'Giá phải lớn hơn hoặc bằng 0' }
                ]}
              >
                <InputNumber
                  placeholder="Nhập giá dịch vụ"
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Row 2: Mô tả - Full width */}
            <Col span={24}>
              <Form.Item
                label="Mô tả"
              >
                <TinyMCE
                  value={addOnDescription}
                  onChange={handleDescriptionChange}
                  placeholder="Nhập mô tả tùy chọn dịch vụ (tùy chọn)..."
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
    </div>
  );
};

export default AddServiceAddOn;

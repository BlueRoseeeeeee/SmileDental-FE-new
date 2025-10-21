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
  Select,
  Switch,
  Upload,
  message
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { servicesService, toast as toastService } from '../services';
import TinyMCE from '../components/TinyMCE/TinyMCE';

const { Title, Text } = Typography;
const { Option } = Select;

const AddServiceAddOn = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [addOnDescription, setAddOnDescription] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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
        // Đảm bảo durationMinutes không có giá trị mặc định
        const formData = { ...draft.formData };
        if (formData.durationMinutes === 30) {
          formData.durationMinutes = null;
        }
        form.setFieldsValue(formData);
        setAddOnDescription(draft.description);
        setHasUnsavedChanges(true);
        message.info('Đã khôi phục bản nháp chưa lưu');
      }
    } catch (error) {
      console.error('Error fetching service details:', error);
      toastService.error('Không thể tải chi tiết dịch vụ: ' + error.message);
      navigate('/dashboard/services');
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
      
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('price', values.price);
      formData.append('durationMinutes', values.durationMinutes);
      formData.append('unit', values.unit);
      formData.append('description', addOnDescription);
      formData.append('isActive', values.isActive ? 'true' : 'false');
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await servicesService.addServiceAddOn(serviceId, formData);
      setHasUnsavedChanges(false);
      clearDraft();
      toastService.success('Thêm tùy chọn dịch vụ thành công!');
      navigate(`/dashboard/services/${serviceId}/edit`);
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
    navigate(`/dashboard/services/${serviceId}/edit`);
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
        <Button onClick={() => navigate('/dashboard/services')} style={{ marginTop: 16 }}>
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

      <Card>
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleFormChange}
          initialValues={{
            name: '',
            price: 0,
            durationMinutes: null,
            unit: 'Răng',
            isActive: true
          }}
        >
          <Row gutter={[16, 16]}>
            {/* Upload ảnh - Full width */}
            <Col span={24}>
              <Form.Item
                label="Hình ảnh"
              >
                <Upload
                  customRequest={({ file, onSuccess }) => {
                    setImageFile(file);
                    setHasUnsavedChanges(true);
                    
                    // Tạo preview URL
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      setImagePreview(e.target.result);
                    };
                    reader.readAsDataURL(file);
                    
                    onSuccess("ok");
                  }}
                  showUploadList={false}
                  maxCount={1}
                  accept="image/*"
                >
                  <div style={{
                    width: '100%',
                    height: '120px',
                    border: '2px dashed #d9d9d9',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#fafafa',
                    transition: 'border-color 0.3s',
                    ':hover': {
                      borderColor: '#1890ff'
                    }
                  }}>
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%', 
                          objectFit: 'cover',
                          borderRadius: '6px'
                        }} 
                      />
                    ) : (
                      <>
                        <div style={{ fontSize: '24px', color: '#8c8c8c', marginBottom: '8px' }}>
                          <UploadOutlined />
                        </div>
                        <div style={{ color: '#ff6b35', fontSize: '14px', fontWeight: '500' }}>
                          Thêm hình ảnh
                        </div>
                      </>
                    )}
                  </div>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Tên tùy chọn - Full width */}
            <Col span={24}>
              <Form.Item
                name="name"
                label="Tên tùy chọn *"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên tùy chọn' },
                  { min: 3, message: 'Tên tùy chọn phải có ít nhất 3 ký tự' }
                ]}
              >
                <Input 
                  placeholder="Nhập tên tùy chọn dịch vụ" 
                  size="large"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Cột trái */}
            <Col span={12}>
              <Form.Item
                name="durationMinutes"
                label="Thời gian (phút) *"
                rules={[
                  { required: true, message: 'Vui lòng nhập thời gian' },
                  { type: 'number', min: 1, message: 'Thời gian phải lớn hơn 0' }
                ]}
              >
                <InputNumber
                  placeholder="Nhập thời gian"
                  style={{ width: '100%', borderRadius: '8px' }}
                  min={1}
                  addonAfter="phút"
                  size="large"
                />
              </Form.Item>
            </Col>
            {/* Cột phải */}
            <Col span={12}>
              <Form.Item
                name="unit"
                label="Đơn vị *"
                rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}
              >
                <Select 
                  placeholder="Chọn đơn vị"
                  size="large"
                  style={{ borderRadius: '8px' }}
                >
                  <Option value="Răng">Răng</Option>
                  <Option value="Hàm">Hàm</Option>
                  <Option value="Trụ">Trụ</Option>
                  <Option value="Cái">Cái</Option>
                  <Option value="Lần">Lần</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Cột trái */}
            <Col span={12}>
              <Form.Item
                name="price"
                label="Giá (VNĐ) *"
                rules={[
                  { required: true, message: 'Vui lòng nhập giá' },
                  { type: 'number', min: 0, message: 'Giá phải lớn hơn hoặc bằng 0' }
                ]}
              >
                <InputNumber
                  placeholder="Nhập giá dịch vụ"
                  style={{ width: '100%', borderRadius: '8px' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  size="large"
                />
              </Form.Item>
            </Col>
            {/* Cột phải */}
            <Col span={12}>
              <Form.Item
                name="isActive"
                label="Trạng thái"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Hoạt động"
                  unCheckedChildren="Tạm ngưng"
                  size="default"
                />
              </Form.Item>
            </Col>
          </Row>


          <Row gutter={[16, 16]}>
            {/* Mô tả - Full width */}
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
                    height: '300px'
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

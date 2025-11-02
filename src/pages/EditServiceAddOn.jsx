/**
 * Trang chỉnh sửa cấp độ dịch vụ
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
import { preventNonNumericInput } from '../utils/validationUtils';

const { Title, Text } = Typography;
const { Option } = Select;

const EditServiceAddOn = () => {
  const navigate = useNavigate();
  const { serviceId, addonId } = useParams();
  
  console.log('EditServiceAddOn mounted, serviceId:', serviceId, 'addonId:', addonId);
  
  const [service, setService] = useState(null);
  const [addOn, setAddOn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [addOnDescription, setAddOnDescription] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  // Auto-save key for localStorage
  const AUTO_SAVE_KEY = `addon_edit_draft_${addonId}`;

  useEffect(() => {
    console.log('useEffect triggered, serviceId:', serviceId, 'addonId:', addonId);
    if (serviceId && addonId) {
      fetchData();
    }
  }, [serviceId, addonId]);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching data for serviceId:', serviceId, 'addonId:', addonId);
      
      // Fetch service details
      const serviceResponse = await servicesService.getServiceById(serviceId);
      console.log('Service response:', serviceResponse);
      setService(serviceResponse);

      // Fetch add-on details
      const addOnResponse = await servicesService.getServiceAddOnById(serviceId, addonId);
      console.log('AddOn response:', addOnResponse);
      const addOnData = addOnResponse.data?.addOn || addOnResponse.addOn;
      setAddOn(addOnData);
      
      // Load draft if exists
      const draft = loadDraft();
      if (draft) {
        form.setFieldsValue(draft.formData);
        setAddOnDescription(draft.description);
        setHasUnsavedChanges(true);
        message.info('Đã khôi phục bản nháp chưa lưu');
      } else {
        // Load actual data
        form.setFieldsValue({
          name: addOnData.name,
          price: addOnData.price,
          durationMinutes: addOnData.durationMinutes,
          unit: addOnData.unit
        });
        setAddOnDescription(addOnData.description || '');
        setCurrentImageUrl(addOnData.imageUrl || '');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toastService.error('Không thể tải dữ liệu: ' + error.message);
      navigate(`/dashboard/services/${serviceId}/edit`);
    } finally {
      console.log('Setting loading to false');
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
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await servicesService.updateServiceAddOn(serviceId, addonId, formData);
      setHasUnsavedChanges(false);
      clearDraft();
      toastService.success('Cập nhật tùy chọn dịch vụ thành công!');
      navigate(`/dashboard/services/${serviceId}/edit`);
    } catch (error) {
      toastService.error('Lỗi khi cập nhật tùy chọn dịch vụ');
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

  if (!service || !addOn) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh'
      }}>
        <Text type="secondary">Không tìm thấy dữ liệu</Text>
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
              Chỉnh sửa tùy chọn dịch vụ
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Dịch vụ: {service.name} | Tùy chọn: {addOn.name}
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
              {saving ? 'Đang lưu...' : 'Cập nhật tùy chọn'}
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
            name: addOn?.name || '',
            price: addOn?.price || 0,
            durationMinutes: addOn?.durationMinutes || 30,
            unit: addOn?.unit || 'Răng'
          }}
        >
          <Row gutter={[16, 16]}>
            {/* Row 1: Tên tùy chọn + Giá */}
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
                  onKeyPress={preventNonNumericInput}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Row 2: Thời gian + Đơn vị */}
            <Col span={12}>
              <Form.Item
                name="durationMinutes"
                label="Thời gian (phút)"
                rules={[
                  { required: true, message: 'Vui lòng nhập thời gian' },
                  { type: 'number', min: 1, message: 'Thời gian phải lớn hơn 0' }
                ]}
              >
                <InputNumber
                  placeholder="Nhập thời gian"
                  style={{ width: '100%' }}
                  min={1}
                  addonAfter="phút"
                  onKeyPress={preventNonNumericInput}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit"
                label="Đơn vị"
                rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}
              >
                <Select placeholder="Chọn đơn vị">
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
            {/* Row 3: Upload ảnh */}
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
                    ) : currentImageUrl ? (
                      <img 
                        src={currentImageUrl} 
                        alt="Current" 
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
                {currentImageUrl && !imageFile && (
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Ảnh hiện tại - Click để thay đổi
                    </Text>
                  </div>
                )}
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Row 4: Mô tả - Full width */}
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
                    height: '400px'
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

export default EditServiceAddOn;

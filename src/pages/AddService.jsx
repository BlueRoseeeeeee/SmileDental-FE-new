/**
 * AddService.jsx
 * Trang thêm dịch vụ nha khoa
 * @author: HoTram
 */
import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Button,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Switch,
  Upload,
  Image
} from 'antd';
import {
  MedicineBoxOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  UpOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { servicesService, scheduleConfigService, toast as toastService } from '../services';
import { TinyMCE } from '../components/TinyMCE';
import { preventNonNumericInput } from '../utils/validationUtils';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Helper function to get room type label
const getRoomTypeLabel = (roomType) => {
  const labels = {
    CONSULTATION: 'Phòng tư vấn/khám',
    GENERAL_TREATMENT: 'Phòng điều trị TQ',
    SURGERY: 'Phòng phẫu thuật',
    ORTHODONTIC: 'Phòng chỉnh nha',
    COSMETIC: 'Phòng thẩm mỹ',
    PEDIATRIC: 'Phòng nha nhi',
    X_RAY: 'Phòng X-quang',
    STERILIZATION: 'Phòng tiệt trùng',
    LAB: 'Phòng labo',
    RECOVERY: 'Phòng hồi sức',
    SUPPORT: 'Phòng phụ trợ'
  };
  return labels[roomType] || roomType;
};

const AddService = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [roomTypes, setRoomTypes] = useState({});
  const [showDescriptionEditor, setShowDescriptionEditor] = useState(false);
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceAddOns, setServiceAddOns] = useState([
    { 
      name: '', 
      price: 0, 
      durationMinutes: null, 
      unit: '', 
      description: '', 
      isActive: true,
      imageFile: null 
    }
  ]);
  const [requireExamFirst, setRequireExamFirst] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState(location.state?.scheduleConfig || null);
  const [configLoading, setConfigLoading] = useState(!location.state?.scheduleConfig);

  // Fetch room types and schedule config on mount
  React.useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const types = await servicesService.getRoomTypes();
        setRoomTypes(types);
      } catch (error) {
        console.error('Error fetching room types:', error);
        // Fallback data nếu API lỗi
        const fallbackTypes = {
          CONSULTATION: 'CONSULTATION',
          GENERAL_TREATMENT: 'GENERAL_TREATMENT', 
          SURGERY: 'SURGERY',
          ORTHODONTIC: 'ORTHODONTIC',
          COSMETIC: 'COSMETIC',
          PEDIATRIC: 'PEDIATRIC',
          X_RAY: 'X_RAY',
          STERILIZATION: 'STERILIZATION',
          LAB: 'LAB',
          RECOVERY: 'RECOVERY',
          SUPPORT: 'SUPPORT'
        };
        setRoomTypes(fallbackTypes);
      }
    };

    const fetchScheduleConfig = async () => {
      // Skip if already provided via location.state
      if (location.state?.scheduleConfig) {
        console.log('📋 Schedule config received from navigation state');
        return;
      }
      
      try {
        setConfigLoading(true);
        const response = await scheduleConfigService.getConfig();
        if (response.success && response.config) {
          setScheduleConfig(response.config);
          console.log('📋 Schedule config loaded:', response.config);
        } else if (response.config) {
          setScheduleConfig(response.config);
          console.log('📋 Schedule config loaded:', response.config);
        }
      } catch (error) {
        console.error('Error fetching schedule config:', error);
        setScheduleConfig(null);
      } finally {
        setConfigLoading(false);
      }
    };

    fetchRoomTypes();
    fetchScheduleConfig();
  }, []);

  // Handle form submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);

      // Filter valid add-ons (có đầy đủ fields bắt buộc)
      const validAddOns = serviceAddOns.filter(addon => 
        addon.name && 
        addon.name.trim() && 
        addon.price > 0 &&
        addon.durationMinutes > 0 && 
        addon.unit && 
        addon.unit.trim()
      );
      
      if (validAddOns.length === 0) {
        toastService.error('Vui lòng thêm ít nhất 1 tùy chọn dịch vụ hợp lệ (có đầy đủ tên, giá, thời gian và đơn vị)!');
        setSubmitLoading(false);
        return;
      }

      // ✅ NEW VALIDATION: Kiểm tra tất cả serviceAddOn phải có cùng thời gian ước tính
      // CHỈ áp dụng cho dịch vụ ĐIỀU TRỊ (treatment) và KHÔNG yêu cầu khám trước (requireExamFirst = false)
      if (validAddOns.length > 1 && values.type === 'treatment' && requireExamFirst === false) {
        const firstDuration = validAddOns[0].durationMinutes;
        const allSameDuration = validAddOns.every(addon => addon.durationMinutes === firstDuration);
        
        if (!allSameDuration) {
          const durations = validAddOns.map(addon => `"${addon.name}": ${addon.durationMinutes} phút`).join(', ');
          toastService.error(
            `Đối với dịch vụ điều trị không yêu cầu khám trước, tất cả các tùy chọn phải có cùng thời gian ước tính!\n\nHiện tại: ${durations}\n\nVui lòng đặt cùng một thời gian cho tất cả tùy chọn.`
          );
          setSubmitLoading(false);
          return;
        }
        
        console.log(`✅ All ${validAddOns.length} service add-ons have same duration: ${firstDuration} minutes (treatment service without exam requirement)`);
      }

      // ✅ Validation với schedule config (BẮT BUỘC)
      if (!scheduleConfig) {
        toastService.error('Không thể lấy cấu hình lịch hẹn. Vui lòng đảm bảo đã cấu hình hệ thống trước!');
        return;
      }

      const { unitDuration, depositAmount } = scheduleConfig;

      // ✅ Validate từng addon: x = ceil(Thời gian / unitDuration) * depositAmount, x <= Giá
      for (let i = 0; i < validAddOns.length; i++) {
        const addon = validAddOns[i];
        
        // Công thức: x = Thời gian ước tính (phút) chia cho unitDuration, làm tròn lên, sau đó nhân với depositAmount
        const x = Math.ceil(addon.durationMinutes / unitDuration) * depositAmount;
        
        // Kiểm tra: x phải <= Giá
        if (x > addon.price) {
          toastService.error(
            `Tùy chọn "${addon.name}": ` +
            `Tiền cọc tối thiểu (${x.toLocaleString('vi-VN')} VNĐ) vượt quá giá dịch vụ (${addon.price.toLocaleString('vi-VN')} VNĐ). ` +
            `\nCông thức: ${addon.durationMinutes} phút ÷ ${unitDuration} phút = ${Math.ceil(addon.durationMinutes / unitDuration)} slot × ${depositAmount.toLocaleString('vi-VN')} VNĐ/slot = ${x.toLocaleString('vi-VN')} VNĐ. ` +
            `\nVui lòng tăng giá dịch vụ hoặc giảm thời gian ước tính!`
          );
          return;
        }

        console.log(`✅ Addon "${addon.name}": ${addon.durationMinutes}min ÷ ${unitDuration}min = ${Math.ceil(addon.durationMinutes / unitDuration)} slots × ${depositAmount.toLocaleString('vi-VN')} VNĐ = ${x.toLocaleString('vi-VN')} VNĐ <= ${addon.price.toLocaleString('vi-VN')} VNĐ`);
      }

      // Prepare FormData for multipart/form-data (hỗ trợ upload ảnh)
      const formData = new FormData();
      
      // Add service basic data
      formData.append('name', values.name);
      formData.append('type', values.type);
      formData.append('description', serviceDescription || '');
      formData.append('requireExamFirst', requireExamFirst === true ? 'true' : 'false');
      
      // Add allowedRoomTypes as JSON string
      formData.append('allowedRoomTypes', JSON.stringify(values.allowedRoomTypes || []));
      
      // Prepare serviceAddOns data (without imageFile)
      const addOnsData = validAddOns.map(addon => ({
        name: addon.name.trim(),
        price: addon.price,
        durationMinutes: addon.durationMinutes,
        unit: addon.unit,
        description: addon.description || '',
        isActive: addon.isActive !== false
      }));
      
      formData.append('serviceAddOns', JSON.stringify(addOnsData));
      
      // Add image files (if any)
      validAddOns.forEach((addon) => {
        if (addon.imageFile && addon.imageFile.originFileObj) {
          formData.append('images', addon.imageFile.originFileObj);
        }
      });

      await servicesService.createService(formData);
      toastService.success('Thêm dịch vụ thành công!');
      
      // Quay về trang danh sách với flag reload
      navigate('/dashboard/services', { state: { reload: true } });
    } catch (error) {
      if (error.errorFields) {
        toastService.error('Vui lòng kiểm tra lại thông tin form!');
        return;
      }
      
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        toastService.error('Không thể kết nối đến server. Vui lòng thử lại sau!');
        return;
      }
      
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Lỗi từ server';
        toastService.error(`Lỗi: ${errorMessage}`);
        return;
      }
      
      // Generic error
      toastService.error('Lỗi khi thêm dịch vụ!');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Add new addon
  const addServiceAddOn = () => {
    setServiceAddOns([...serviceAddOns, { 
      name: '', 
      price: 0, 
      durationMinutes: null,
      unit: '',
      description: '',
      isActive: true,
      imageFile: null
    }]);
    // Scroll to the new addon after a short delay
    setTimeout(() => {
      const addonCards = document.querySelectorAll('[data-addon-card]');
      if (addonCards.length > 0) {
        addonCards[addonCards.length - 1].scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  // Remove addon
  const removeServiceAddOn = (index) => {
    if (serviceAddOns.length > 1) {
      setServiceAddOns(serviceAddOns.filter((_, i) => i !== index));
    }
  };

  // Update addon
  const updateServiceAddOn = (index, field, value) => {
    const newAddOns = [...serviceAddOns];
    newAddOns[index][field] = value;
    setServiceAddOns(newAddOns);
  };

  // Toggle editor for addon
  const toggleAddonEditor = (index) => {
    const newAddOns = [...serviceAddOns];
    newAddOns[index].showEditor = !newAddOns[index].showEditor;
    setServiceAddOns(newAddOns);
  };

  return (
    <div style={{ 
      padding: '32px', 
      backgroundColor: '#f8fafc', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
    }}>
      {/* Header */}
      <div style={{ 
        background: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0'
      }}>
        <Row align="middle" justify="space-between">
          <Col>
              <div>
                <Title level={2} style={{ margin: 0, color: '#1e293b', fontWeight: '700', fontSize: '20px' }}>
                  Thêm dịch vụ mới
                </Title>
              </div>
          </Col>
          <Col>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/dashboard/services')}
              size="large"
              style={{
                height: '48px',
                borderRadius: '8px',
                fontWeight: '600',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#475569'
              }}
            >
              Quay lại
            </Button>
          </Col>
        </Row>
      </div>

       <Row gutter={24}>
         {/* Form chính */}
         <Col xs={24}>
           <Form
             form={form}
             layout="vertical"
             requiredMark={false}
             scrollToFirstError
           >
             {/* Form Container */}
             <div 
               style={{ 
                 background: '#ffffff',
                 borderRadius: '16px',
                 border: '1px solid #e2e8f0',
                 boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                 overflow: 'hidden'
               }}
             >
               {/* Thông tin cơ bản */}
               <div style={{
                 padding: '32px',
                 borderBottom: '1px solid #e2e8f0',
                 background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
               }}>
                 <div style={{ marginBottom: '24px' }}>
                   <Title level={4} style={{ 
                     margin: 0, 
                     color: '#1e293b', 
                     fontWeight: '600',
                     fontSize: '18px'
                   }}>
                     Thông tin dịch vụ
                   </Title>
                 </div>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="name"
                    label="Tên dịch vụ"
                    rules={[
                      { required: true, message: 'Vui lòng nhập tên dịch vụ!' },
                      { min: 2, message: 'Tên dịch vụ phải có ít nhất 2 ký tự!' }
                    ]}
                  >
                    <Input 
                      size="large"
                      placeholder="VD: Trám răng Composite"
                      style={{
                        borderRadius: '8px'
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="type"
                    label="Loại dịch vụ"
                    rules={[
                      { required: true, message: 'Vui lòng chọn loại dịch vụ!' }
                    ]}
                  >
                    <Select 
                      size="large"
                      style={{ width: '100%' }}
                    >
                      <Option value="treatment">Điều trị</Option>
                      <Option value="exam">Khám</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="allowedRoomTypes"
                    label="Loại phòng cho phép"
                    rules={[
                      { required: true, message: 'Vui lòng chọn ít nhất 1 loại phòng!' }
                    ]}
                  >
                    <Select
                      mode="multiple"
                      size="large"
                      placeholder="Chọn các loại phòng có thể thực hiện dịch vụ này"
                      style={{ width: '100%' }}
                      maxTagCount="responsive"
                      showSearch
                      filterOption={(input, option) =>
                        option?.children?.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {Object.values(roomTypes).map((value) => (
                        <Option key={value} value={value}>
                          {getRoomTypeLabel(value)}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label="Yêu cầu khám trước"
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      padding: '12px 16px', 
                      background: '#f8f9fa', 
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <Switch 
                        checked={requireExamFirst}
                        onChange={(checked) => {
                          setRequireExamFirst(checked);
                          form.setFieldsValue({ requireExamFirst: checked });
                        }}
                      />
                      <Text style={{ fontSize: '14px', color: '#8c8c8c' }}>
                        Dịch vụ này có yêu cầu bệnh nhân phải khám trước khi thực hiện
                      </Text>
                    </div>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                        <Col xs={24}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            marginBottom: '12px',
                            padding: '16px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <div>
                              <Text strong style={{ color: '#1e293b', fontSize: '14px', fontWeight: '600' }}>
                                Mô tả dịch vụ (không bắt buộc)
                              </Text>
                            </div>
                             <Button
                               type="text"
                               size="small"
                               icon={showDescriptionEditor ? <DownOutlined /> : <UpOutlined />}
                               onClick={() => setShowDescriptionEditor(!showDescriptionEditor)}
                               style={{
                                 color: '#3b82f6',
                                 height: '32px',
                                 width: '32px',
                                 padding: '0',
                                 borderRadius: '6px',
                                 fontWeight: '500',
                                 background: showDescriptionEditor ? '#eff6ff' : 'transparent',
                                 border: showDescriptionEditor ? '1px solid #dbeafe' : '1px solid transparent',
                                 display: 'flex',
                                 alignItems: 'center',
                                 justifyContent: 'center'
                               }}
                             />
                          </div>
                          
                          {showDescriptionEditor && (
                            <div style={{
                              height: '400px'
                            }}>
                              <TinyMCE
                                value={serviceDescription}
                                onChange={setServiceDescription}
                                placeholder="Nhập mô tả chi tiết về dịch vụ..."
                                containerStyle={{ width: '100%'}}
                              />
                            </div>
                          )}
                        </Col>
                      </Row>
               </div>

               {/* Service Add-ons */}
               <div style={{
                 padding: '32px',
                 background: '#ffffff'
               }}>
                 <div style={{ 
                   display: 'flex', 
                   alignItems: 'center', 
                   justifyContent: 'space-between',
                   marginBottom: '24px'
                 }}>
                   <div>
                     <Title level={4} style={{ 
                       margin: 0, 
                       color: '#1e293b', 
                       fontWeight: '600',
                       fontSize: '18px'
                     }}>
                       Tùy chọn dịch vụ
                     </Title>
                   </div>
                   <Button 
                     type="primary"
                     icon={<PlusOutlined />}
                     onClick={addServiceAddOn}
                     style={{
                       borderRadius: '8px',
                       fontWeight: '600',
                       height: '40px',
                       background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                       border: 'none',
                       boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                     }}
                   >
                     Thêm tùy chọn
                   </Button>
                 </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {serviceAddOns.map((addon, index) => (
                  <Card 
                    key={index} 
                    style={{ 
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      position: 'relative',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.2s ease-in-out'
                    }}
                    bodyStyle={{ padding: '24px' }}
                  >
                    <div style={{ 
                      position: 'absolute', 
                      top: '12px', 
                      right: '12px',
                      display: 'flex',
                      gap: '8px'
                    }}>
                      {serviceAddOns.length > 1 && (
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={() => removeServiceAddOn(index)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        />
                      )}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          background: '#1890ff',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {index + 1}
                        </div>
                        {/* <Text strong style={{ fontSize: '16px' }}>
                          Tùy chọn {index + 1}
                        </Text> */}
                      </div>
                    </div>

                    <Row gutter={[16, 16]}>
                      <Col xs={24}>
                        <div style={{ marginBottom: '8px' }}>
                          <Text strong style={{ color: '#262626' }}>Hình ảnh (Tùy chọn)</Text>
                        </div>
                        <Upload
                          listType="picture-card"
                          fileList={addon.imageFile ? [addon.imageFile] : []}
                          onChange={(info) => {
                            const file = info.fileList[0];
                            updateServiceAddOn(index, 'imageFile', file);
                          }}
                          beforeUpload={() => false}
                          maxCount={1}
                          accept="image/*"
                        >
                          {!addon.imageFile && (
                            <div>
                              <UploadOutlined />
                              <div style={{ marginTop: 8 }}>Chọn ảnh</div>
                            </div>
                          )}
                        </Upload>
                      </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={9}>
                        <div style={{ marginBottom: '8px' }}>
                          <Text strong style={{ color: '#262626' }}>Tên tùy chọn *</Text>
                        </div>
                         <Input
                           placeholder="VD: Trám Composite - Cấp 1"
                           value={addon.name}
                           onChange={(e) => updateServiceAddOn(index, 'name', e.target.value)}
                           size="large"
                           style={{
                             borderRadius: '8px'
                           }}
                         />
                      </Col>
                      
                      <Col xs={24} sm={12} md={5}>
                        <div style={{ marginBottom: '8px' }}>
                          <Text strong style={{ color: '#262626' }}>Đơn vị *</Text>
                        </div>
                         <Select
                           value={addon.unit}
                           onChange={(value) => updateServiceAddOn(index, 'unit', value)}
                           size="large"
                           style={{
                             width: '100%',
                             borderRadius: '8px'
                           }}
                           placeholder="Chọn đơn vị"
                         >
                           <Option value="Răng">Răng</Option>
                           <Option value="Hàm">Hàm</Option>
                           <Option value="Trụ">Trụ</Option>
                           <Option value="Cái">Cái</Option>
                           <Option value="Lần">Lần</Option>
                         </Select>
                      </Col>

                      <Col xs={24} sm={12} md={5}>
                        <div style={{ marginBottom: '8px' }}>
                          <Text strong style={{ color: '#262626' }}>Thời gian ước tính (phút) *</Text>
                        </div>
                         <InputNumber
                           style={{ 
                             width: '100%',
                             borderRadius: '8px'
                           }}
                           placeholder="Nhập thời gian"
                           value={addon.durationMinutes}
                           onChange={(value) => updateServiceAddOn(index, 'durationMinutes', value)}
                           min={1}
                           size="large"
                           addonAfter="phút"
                           onKeyPress={preventNonNumericInput}
                         />
                      </Col>

                      <Col xs={24} sm={12} md={5}>
                        <div style={{ marginBottom: '8px' }}>
                          <Text strong style={{ color: '#262626' }}>Giá *</Text>
                        </div>
                         <InputNumber
                           style={{ 
                             width: '100%',
                             borderRadius: '8px'
                           }}
                           value={addon.price}
                           onChange={(value) => updateServiceAddOn(index, 'price', value)}
                           formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                           parser={value => value.replace(/\$\s?|(,*)/g, '')}
                           min={0}
                           size="large"
                           addonAfter="VNĐ"
                           onKeyPress={preventNonNumericInput}
                         />
                      </Col>
                    </Row>


                    <Row gutter={[16, 16]}>
                        <Col xs={24}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            marginBottom: '12px',
                            padding: '12px',
                            background: '#f8fafc',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            marginTop: '12px'
                          }}>
                            <div>
                              <Text strong style={{ color: '#1e293b', fontSize: '14px', fontWeight: '600' }}>
                                Mô tả dịch vụ (không bắt buộc)
                              </Text>
                            </div>
                            <Button
                              type="text"
                              size="small"
                              icon={addon.showEditor ? <DownOutlined /> : <UpOutlined />}
                              onClick={() => toggleAddonEditor(index)}
                              style={{
                                color: '#3b82f6',
                                height: '28px',
                                width: '28px',
                                padding: '0',
                                borderRadius: '6px',
                                fontWeight: '500',
                                background: addon.showEditor ? '#eff6ff' : 'transparent',
                                border: addon.showEditor ? '1px solid #dbeafe' : '1px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            />
                          </div>
                          
                          {addon.showEditor && (
                            <div style={{
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              background: '#ffffff', height: '400px'
                            }}>
                              <TinyMCE
                                value={addon.description || ''}
                                onChange={(content) => updateServiceAddOn(index, 'description', content)}
                                placeholder="Mô tả chi tiết về dịch vụ này..."
                                containerStyle={{ marginTop: 0 }}
                              />
                            </div>
                          )}
                        </Col>
                      </Row>

                  </Card>
                ))}

                {serviceAddOns.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    background: '#fafafa',
                    borderRadius: '8px',
                    border: '2px dashed #d9d9d9'
                  }}>
                    <PlusOutlined style={{ fontSize: '32px', color: '#8c8c8c', marginBottom: '16px' }} />
                    <div>
                      <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                        Chưa có tùy chọn dịch vụ nào
                      </Text>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        Nhấn "Thêm tùy chọn" để bắt đầu tạo các gói dịch vụ
                      </Text>
                    </div>
                  </div>
                )}
               </div>
               </div>

               {/* Action Buttons */}
               <div style={{
                 padding: '32px',
                 borderTop: '1px solid #e2e8f0',
                 background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
               }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '16px'
              }}>
                <Button 
                  onClick={() => navigate('/dashboard/services')}
                  size="large"
                  style={{
                    height: '48px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    minWidth: '120px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#475569'
                  }}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={submitLoading}
                  onClick={handleSubmit}
                  size="large"
                  style={{
                    height: '48px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    minWidth: '160px'
                  }}
                >
                  Lưu dịch vụ
                </Button>
              </div>
             </div>
           </div>
         </Form>
        </Col>

      </Row>
    </div>
  );
};

export default AddService;
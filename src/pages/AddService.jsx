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
  Switch
} from 'antd';
import {
  MedicineBoxOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { servicesService, toast as toastService } from '../services';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AddService = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [serviceAddOns, setServiceAddOns] = useState([
    { name: '', price: 0, description: '', isActive: true }
  ]);

  // Handle form submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);

      // Chuẩn bị data theo đúng format API
      const serviceData = {
        name: values.name,
        durationMinutes: values.durationMinutes,
        type: values.type,
        description: values.description,
        requireExamFirst: values.requireExamFirst || false,
        serviceAddOns: serviceAddOns.filter(addon => 
          addon.name && addon.price && addon.description
        ).map(addon => ({
          name: addon.name,
          price: addon.price,
          description: addon.description,
          isActive: addon.isActive !== false
        }))
      };

      await servicesService.createService(serviceData);
      toastService.success('Thêm dịch vụ thành công!');
      
      // Quay về trang danh sách
      navigate('/services');
    } catch (error) {
      if (error.errorFields) {
        // Validation errors
        return;
      }
      console.error('Error creating service:', error);
      toastService.error('Lỗi khi thêm dịch vụ!');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Add new addon
  const addServiceAddOn = () => {
    setServiceAddOns([...serviceAddOns, { name: '', price: 0, description: '' }]);
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

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space align="center">
              <MedicineBoxOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <Title level={3} style={{ margin: 0 }}>
                Thêm dịch vụ mới
              </Title>
            </Space>
          </Col>
          <Col>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/services')}
              size="large"
              style={{
                height: '48px',
                borderRadius: '8px',
                fontWeight: '500'
              }}
            >
              Quay lại
            </Button>
          </Col>
        </Row>
      </Card>

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
             <Card 
               style={{ 
                 borderRadius: '12px',
                 border: '1px solid #f0f0f0',
                 boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
               }}
               bodyStyle={{ padding: '0' }}
             >
               {/* Thông tin cơ bản */}
               <div style={{
                 padding: '24px',
                 borderBottom: '1px solid #f0f0f0',
                 background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
               }}>
              <Row gutter={16}>
                <Col span={12}>
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
                      style={{
                        borderRadius: '8px'
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="durationMinutes"
                    label="Thời gian (phút)"
                    rules={[
                      { required: true, message: 'Vui lòng nhập thời gian!' },
                      { type: 'number', min: 1, message: 'Thời gian phải lớn hơn 0!' }
                    ]}
                  >
                    <InputNumber
                      style={{ 
                        width: '100%',
                        borderRadius: '8px'
                      }}
                      size="large"
                      min={1}
                      max={480}
                      placeholder="45"
                      addonAfter="phút"
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
                    >
                      <Option value="treatment">Điều trị</Option>
                      <Option value="exam">Khám</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="requireExamFirst"
                    label="Yêu cầu khám trước"
                    valuePropName="checked"
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
                      <Switch defaultChecked={false} />
                      <Text style={{ fontSize: '14px', color: '#8c8c8c' }}>
                        Dịch vụ này có yêu cầu bệnh nhân phải khám trước khi thực hiện
                      </Text>
                    </div>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                        <Col xs={24}>
                          <Form.Item
                            name="description"
                            label="Mô tả thêm"
                          >
                            <TextArea
                              rows={6}
                              placeholder="Nhập mô tả về dịch vụ"
                              className="custom-textarea"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
               </div>

               {/* Service Add-ons */}
               <div style={{
                 padding: '24px',
                 background: '#ffffff'
               }}>
                 <div style={{ 
                   display: 'flex', 
                   alignItems: 'center', 
                   justifyContent: 'space-between',
                   marginBottom: '24px'
                 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <PlusOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
                     <Title level={4} style={{ margin: 0, color: '#262626' }}>
                       Tùy chọn dịch vụ
                     </Title>
                     <Text type="secondary" style={{ fontSize: '12px' }}>
                       ({serviceAddOns.length} tùy chọn)
                     </Text>
                   </div>
                   <Button 
                     type="primary"
                     icon={<PlusOutlined />}
                     onClick={addServiceAddOn}
                     style={{
                       borderRadius: '8px',
                       fontWeight: '600'
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
                      borderRadius: '8px',
                      border: '1px solid #e8e8e8',
                      background: '#fafafa',
                      position: 'relative'
                    }}
                    bodyStyle={{ padding: '20px' }}
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
                      <Col xs={24} md={12}>
                        <div style={{ marginBottom: '8px' }}>
                          <Text strong style={{ color: '#262626' }}>Tên tùy chọn *</Text>
                        </div>
                         <Input
                           placeholder="VD: Cấp độ 1 - Cơ bản"
                           value={addon.name}
                           onChange={(e) => updateServiceAddOn(index, 'name', e.target.value)}
                           size="large"
                           style={{
                             borderRadius: '8px'
                           }}
                         />
                      </Col>
                      
                      <Col xs={24} md={12}>
                        <div style={{ marginBottom: '8px' }}>
                          <Text strong style={{ color: '#262626' }}>Giá (VNĐ) *</Text>
                        </div>
                         <InputNumber
                           style={{ 
                             width: '100%',
                             borderRadius: '8px'
                           }}
                           placeholder="500,000"
                           value={addon.price}
                           onChange={(value) => updateServiceAddOn(index, 'price', value)}
                           formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                           parser={value => value.replace(/\$\s?|(,*)/g, '')}
                           min={0}
                           size="large"
                           addonAfter="VNĐ"
                         />
                      </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                        <Col xs={24}>
                          <div style={{ marginBottom: '8px' }}>
                            <Text strong style={{ color: '#262626' }}>Mô tả chi tiết</Text>
                          </div>
                          <TextArea
                            rows={6}
                            placeholder="Mô tả chi tiết về tùy chọn này..."
                            value={addon.description}
                            onChange={(e) => updateServiceAddOn(index, 'description', e.target.value)}
                            className="custom-textarea"
                          />
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
                 padding: '24px',
                 borderTop: '1px solid #f0f0f0',
                 background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
               }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '16px'
              }}>
                <Button 
                  onClick={() => navigate('/services')}
                  size="large"
                  style={{
                    height: '60px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    minWidth: '120px'
                  }}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={submitLoading}
                  onClick={handleSubmit}
                  size="small"
                  style={{
                    height: '48px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
                    minWidth: '160px'
                  }}
                >
                  Lưu dịch vụ
                </Button>
              </div>
             </div>
           </Card>
         </Form>
        </Col>

      </Row>
    </div>
  );
};

export default AddService;
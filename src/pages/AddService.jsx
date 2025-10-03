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
  Divider
} from 'antd';
import {
  MedicineBoxOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined
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
    { name: '', price: 0, description: '' }
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
        serviceAddOns: serviceAddOns.filter(addon => 
          addon.name && addon.price && addon.description
        )
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
            <Space>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/services')}
              >
                Quay lại
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={submitLoading}
                onClick={handleSubmit}
                size="large"
              >
                Lưu dịch vụ
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={24}>
        {/* Form chính */}
        <Col xs={24} lg={16}>
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            scrollToFirstError
          >
            {/* Thông tin cơ bản */}
            <Card title="Thông tin dịch vụ" style={{ marginBottom: 24 }}>
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
                      placeholder="VD: Cạo vôi răng, Trám răng..."
                      size="large"
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
                      style={{ width: '100%' }}
                      size="large"
                      placeholder="45"
                      min={1}
                      max={480}
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
                      placeholder="Chọn loại dịch vụ"
                      size="large"
                    >
                      <Option value="treatment">Điều trị</Option>
                      <Option value="exam">Khám bệnh</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row>
                <Col span={24}>
                  <Form.Item
                    name="description"
                    label="Mô tả dịch vụ"
                    rules={[
                      { required: true, message: 'Vui lòng nhập mô tả!' }
                    ]}
                  >
                    <TextArea 
                      rows={6}
                      placeholder="Mô tả chi tiết về dịch vụ..."
                      showCount
                      maxLength={500}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Service Add-ons */}
            <Card 
              title="Tùy chọn dịch vụ (Service Add-ons)" 
              extra={
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />}
                  onClick={addServiceAddOn}
                >
                  Thêm tùy chọn
                </Button>
              }
            >
              {serviceAddOns.map((addon, index) => (
                <Card 
                  key={index} 
                  size="small" 
                  style={{ marginBottom: 16 }}
                  title={`Tùy chọn ${index + 1}`}
                  extra={
                    serviceAddOns.length > 1 && (
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />}
                        onClick={() => removeServiceAddOn(index)}
                      />
                    )
                  }
                >
                  <Row gutter={16}>
                    <Col span={8}>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Tên tùy chọn</Text>
                      </div>
                      <Input
                        placeholder="VD: Cấp độ 1 - Cơ bản"
                        value={addon.name}
                        onChange={(e) => updateServiceAddOn(index, 'name', e.target.value)}
                        size="large"
                      />
                    </Col>
                    <Col span={6}>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Giá (VNĐ)</Text>
                      </div>
                      <InputNumber
                        style={{ width: '100%' }}
                        placeholder="500,000"
                        value={addon.price}
                        onChange={(value) => updateServiceAddOn(index, 'price', value)}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        min={0}
                        size="large"
                      />
                    </Col>
                    <Col span={10}>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Mô tả</Text>
                      </div>
                      <Input
                        placeholder="Mô tả chi tiết về tùy chọn này"
                        value={addon.description}
                        onChange={(e) => updateServiceAddOn(index, 'description', e.target.value)}
                        size="large"
                      />
                    </Col>
                  </Row>
                </Card>
              ))}
            </Card>
          </Form>
        </Col>

        {/* Sidebar xem trước */}
        <Col xs={24} lg={8}>
          <Card title="Xem trước">
            <div style={{ padding: 16, backgroundColor: '#fafafa', borderRadius: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Dịch vụ sẽ được hiển thị trong danh sách sau khi lưu thành công
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AddService;
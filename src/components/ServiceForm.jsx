import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Space,
  message
} from 'antd';
import {
  SaveOutlined,
  ArrowLeftOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { TinyMCE } from './TinyMCE';

const { Title, Text } = Typography;
const { Option } = Select;

const ServiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [serviceAddOns, setServiceAddOns] = useState([]);

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      loadServiceData();
    }
  }, [id]);

  const loadServiceData = async () => {
    setLoading(true);
    try {
      // Mock data for now
      const service = {
        name: 'Lấy tủy 2',
        type: 'treatment',
        durationMinutes: 45,
        requireExamFirst: true,
        isActive: true,
        description: 'Trám răng chuyên nghiệp',
        serviceAddOns: [
          {
            name: 'Cấp độ 1 - Cơ bản',
            price: 500000,
            description: 'Trám răng răng cơ bản'
          },
          {
            name: 'Tram - Trung bình',
            price: 800000,
            description: 'Cạo vôi răng + đánh bóng'
          },
          {
            name: 'Cấp độ 3 - Cao cấp',
            price: 1200000,
            description: 'Cạo vôi răng + đánh bóng + fluoride'
          }
        ]
      };
      
      form.setFieldsValue({
        name: service.name,
        type: service.type,
        durationMinutes: service.durationMinutes,
        requireExamFirst: service.requireExamFirst,
        isActive: service.isActive
      });
      
      setDescription(service.description || '');
      setServiceAddOns(service.serviceAddOns || []);
      
    } catch (error) {
      message.error('Không thể tải thông tin dịch vụ');
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const serviceData = {
        ...values,
        description: description,
        serviceAddOns: serviceAddOns
      };

      if (isEditMode) {
        console.log('Update service:', serviceData);
        message.success('Cập nhật dịch vụ thành công!');
      } else {
        console.log('Create service:', serviceData);
        message.success('Tạo dịch vụ thành công!');
      }
      
      navigate('/services');
    } catch (error) {
      message.error('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/services');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <div>Đang tải...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Space align="center" style={{ marginBottom: 16 }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
              type="text"
            >
              Quay lại
            </Button>
            <MedicineBoxOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0 }}>
              {isEditMode ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
            </Title>
          </Space>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: 'treatment',
            durationMinutes: 30,
            requireExamFirst: false,
            isActive: true
          }}
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title="Thông tin cơ bản" size="small">
                <Form.Item
                  name="name"
                  label="Tên dịch vụ"
                  rules={[
                    { required: true, message: 'Vui lòng nhập tên dịch vụ!' },
                    { min: 3, message: 'Tên dịch vụ phải có ít nhất 3 ký tự!' }
                  ]}
                >
                  <Input 
                    placeholder="Nhập tên dịch vụ..."
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="type"
                  label="Loại dịch vụ"
                  rules={[{ required: true, message: 'Vui lòng chọn loại dịch vụ!' }]}
                >
                  <Select size="large" placeholder="Chọn loại dịch vụ">
                    <Option value="treatment">Điều trị</Option>
                    <Option value="exam">Khám</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="durationMinutes"
                  label="Thời gian thực hiện (phút)"
                  rules={[
                    { required: true, message: 'Vui lòng nhập thời gian!' },
                    { type: 'number', min: 1, message: 'Thời gian phải lớn hơn 0!' }
                  ]}
                >
                  <InputNumber 
                    min={1}
                    max={480}
                    style={{ width: '100%' }}
                    size="large"
                    placeholder="Nhập thời gian (phút)"
                  />
                </Form.Item>

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

                <Form.Item
                  name="isActive"
                  label="Trạng thái hoạt động"
                  valuePropName="checked"
                >
                  <Switch 
                    checkedChildren="Hoạt động" 
                    unCheckedChildren="Tạm dừng"
                  />
                </Form.Item>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Mô tả dịch vụ" size="small">
                <TinyMCE
                  value={description}
                  onChange={setDescription}
                  placeholder="Nhập mô tả chi tiết về dịch vụ..."
                />
                
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    💡 Mẹo: Bạn có thể thêm hình ảnh, bảng, danh sách để mô tả rõ hơn về dịch vụ
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
            <Col xs={24}>
              <Card title="Cấp độ dịch vụ" size="small">
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary">
                    Thêm các cấp độ dịch vụ với giá khác nhau
                  </Text>
                </div>
                
                {serviceAddOns.map((addOn, index) => (
                  <Card 
                    key={index} 
                    size="small" 
                    style={{ marginBottom: 12, backgroundColor: '#fafafa' }}
                    title={`Cấp độ ${index + 1}`}
                    extra={
                      <Button 
                        type="text" 
                        danger 
                        size="small"
                        onClick={() => {
                          const newAddOns = serviceAddOns.filter((_, i) => i !== index);
                          setServiceAddOns(newAddOns);
                        }}
                      >
                        Xóa
                      </Button>
                    }
                  >
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={8}>
                        <Form.Item label="Tên cấp độ">
                          <Input
                            value={addOn.name}
                            onChange={(e) => {
                              const newAddOns = [...serviceAddOns];
                              newAddOns[index].name = e.target.value;
                              setServiceAddOns(newAddOns);
                            }}
                            placeholder="Tên cấp độ..."
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label="Giá (VNĐ)">
                          <InputNumber
                            value={addOn.price}
                            onChange={(value) => {
                              const newAddOns = [...serviceAddOns];
                              newAddOns[index].price = value;
                              setServiceAddOns(newAddOns);
                            }}
                            style={{ width: '100%' }}
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                            placeholder="Nhập giá..."
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label="Mô tả">
                          <Input
                            value={addOn.description}
                            onChange={(e) => {
                              const newAddOns = [...serviceAddOns];
                              newAddOns[index].description = e.target.value;
                              setServiceAddOns(newAddOns);
                            }}
                            placeholder="Mô tả cấp độ..."
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                
                <Button 
                  type="dashed" 
                  onClick={() => {
                    setServiceAddOns([...serviceAddOns, {
                      name: '',
                      price: 0,
                      description: ''
                    }]);
                  }}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  + Thêm cấp độ mới
                </Button>
              </Card>
            </Col>
          </Row>

          <Row style={{ marginTop: 24 }}>
            <Col span={24}>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saving}
                  size="large"
                >
                  {isEditMode ? 'Cập nhật dịch vụ' : 'Tạo dịch vụ'}
                </Button>
                <Button 
                  onClick={handleBack}
                  size="large"
                >
                  Hủy
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default ServiceForm;

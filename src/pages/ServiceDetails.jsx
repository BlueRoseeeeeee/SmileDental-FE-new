/**
 * ServiceDetails.jsx
 * Trang chi tiết dịch vụ nha khoa
 * @author: HoTram  
 */
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Tag, 
  Button, 
  Space, 
  Spin, 
  Divider,
  Statistic,
  Badge,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Table
} from 'antd';
import { 
  ArrowLeftOutlined, 
  MedicineBoxOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { servicesService, toast as toastService } from '../services';

const { Title, Text } = Typography;

const ServiceDetails = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Update modal states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (serviceId) {
      fetchServiceDetails();
    }
  }, [serviceId]);

  const fetchServiceDetails = async () => {
    setLoading(true);
    try {
      const response = await servicesService.getServiceById(serviceId);
      setService(response);
    } catch (error) {
      toastService.error('Không thể tải chi tiết dịch vụ');
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  // Dịch loại dịch vụ sang tiếng Việt
  const translateServiceType = (type) => {
    const typeMap = {
      'treatment': 'Điều trị',
      'exam': 'Khám', 
    };
    return typeMap[type] || type;
  };

  // Format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  // Handle update service
  const handleUpdateService = () => {
    setShowUpdateModal(true);
    form.setFieldsValue({
      name: service.name,
      type: service.type,
      duration: service.durationMinutes,
      description: service.description,
      requireExamFirst: service.requireExamFirst
    });
  };

  // Handle confirm update
  const handleConfirmUpdate = async () => {
    try {
      setUpdateLoading(true);
      const values = await form.validateFields();
      
      const updateData = {
        name: values.name,
        type: values.type,
        duration: values.duration,
        description: values.description,
        requireExamFirst: values.requireExamFirst
      };

      const updatedService = await servicesService.updateService(serviceId, updateData);
      setService(updatedService);
      toastService.success('Cập nhật dịch vụ thành công!');
      setShowUpdateModal(false);
    } catch (error) {
      toastService.error('Lỗi khi cập nhật dịch vụ');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle cancel update
  const handleCancelUpdate = () => {
    setShowUpdateModal(false);
    form.resetFields();
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
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
          onClick={() => navigate('/services')}
          style={{ marginBottom: 16 }}
        >
          Quay lại danh sách
        </Button>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MedicineBoxOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <Title level={2} style={{ margin: 0 }}>
              {service.name}
            </Title>
            <Tag color={service.isActive ? 'green' : 'red'} style={{ fontSize: 14 }}>
              {service.isActive ? 'Hoạt động' : 'Ngưng hoạt động'}
            </Tag>
          </div>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleUpdateService}
          >
            Chỉnh sửa
          </Button>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* Thông tin cơ bản */}
        <Col span={24}>
          <Card title="Thông tin cơ bản" size="small">
            <Row gutter={[24, 16]}>
              <Col span={12}>
                <div>
                  <Text type="secondary">Tên dịch vụ:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text strong style={{ fontSize: 16 }}>
                      {service.name}
                    </Text>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text type="secondary">Loại dịch vụ:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag color="blue" style={{ fontSize: 14 }}>
                      {translateServiceType(service.type)}
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text type="secondary">Thời gian thực hiện:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag color="green" style={{ fontSize: 14 }}>
                      <ClockCircleOutlined /> {service.durationMinutes} phút
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text type="secondary">Yêu cầu khám trước:</Text>
                  <div style={{ marginTop: 4 }}>
                    {service.requireExamFirst ? (
                      <Tag color="orange" style={{ fontSize: 14 }}>
                        <CheckCircleOutlined /> Cần khám trước
                      </Tag>
                    ) : (
                      <Tag color="green" style={{ fontSize: 14 }}>
                        <CloseCircleOutlined /> Không cần khám trước
                      </Tag>
                    )}
                  </div>
                </div>
              </Col>
              <Col span={24}>
                <div>
                  <Text type="secondary">Mô tả:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text>{service.description}</Text>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>


        {/* Các cấp độ dịch vụ */}
        <Col span={24}>
          <Card title="Các cấp độ dịch vụ" size="small">
            {service.serviceAddOns && service.serviceAddOns.length > 0 ? (
              <Table
                dataSource={service.serviceAddOns}
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
                    title: 'Tên cấp độ',
                    dataIndex: 'name',
                    key: 'name',
                    render: (text, record) => (
                      <div>
                        <Text strong>{text}</Text>
                        {!record.isActive && (
                          <Tag color="red" size="small" style={{ marginLeft: 8 }}>
                            Tạm ngưng
                          </Tag>
                        )}
                      </div>
                    ),
                  },
                  {
                    title: 'Mô tả',
                    dataIndex: 'description',
                    key: 'description',
                    render: (text) => <Text type="secondary">{text}</Text>,
                  },
                  {
                    title: 'Giá',
                    dataIndex: 'price',
                    key: 'price',
                    render: (price) => (
                      <Text strong style={{ color: '#52c41a' }}>
                        {formatPrice(price)}
                      </Text>
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
                    title: 'Sử dụng',
                    key: 'usage',
                    render: (_, record) => (
                      <Tag color={record.hasBeenUsed ? 'orange' : 'blue'}>
                        {record.hasBeenUsed ? 'Đã sử dụng' : 'Chưa sử dụng'}
                      </Tag>
                    ),
                  },
                ]}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">Chưa có cấp độ dịch vụ</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Thông tin bổ sung */}
        <Col span={24}>
          <Card title="Thông tin bổ sung" size="small">
            <Row gutter={[24, 16]}>
              <Col span={12}>
                <div>
                  <Text type="secondary">Ngày tạo:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text>{new Date(service.createdAt).toLocaleDateString('vi-VN')}</Text>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text type="secondary">Cập nhật lần cuối:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text>{new Date(service.updatedAt).toLocaleDateString('vi-VN')}</Text>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Update Service Modal */}
      <Modal
        title="Chỉnh sửa dịch vụ"
        open={showUpdateModal}
        onOk={handleConfirmUpdate}
        onCancel={handleCancelUpdate}
        okText="Cập nhật"
        cancelText="Hủy"
        confirmLoading={updateLoading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: service?.name,
            type: service?.type,
            duration: service?.durationMinutes,
            description: service?.description,
            requireExamFirst: service?.requireExamFirst
          }}
        >
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

          <Form.Item
            name="duration"
            label="Thời gian thực hiện (phút)"
            rules={[
              { required: true, message: 'Vui lòng nhập thời gian' },
              { type: 'number', min: 1, message: 'Thời gian phải lớn hơn 0' }
            ]}
          >
            <InputNumber
              placeholder="Nhập thời gian"
              style={{ width: '100%' }}
              min={1}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea
              placeholder="Nhập mô tả dịch vụ (tùy chọn)"
              rows={3}
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
        </Form>
      </Modal>
    </div>
  );
};

export default ServiceDetails;

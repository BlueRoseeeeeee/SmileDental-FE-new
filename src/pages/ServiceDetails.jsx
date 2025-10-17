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
  EditOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { servicesService, toast as toastService } from '../services';

const { Title, Text } = Typography;

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

const ServiceDetails = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomTypes, setRoomTypes] = useState({});
  
  // Update modal states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [form] = Form.useForm();

  // Add-on management states
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [showEditAddOnModal, setShowEditAddOnModal] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState(null);
  const [addOnForm] = Form.useForm();
  const [addOnLoading, setAddOnLoading] = useState(false);

  // Add-on confirmation states
  const [showToggleConfirmModal, setShowToggleConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedAddOn, setSelectedAddOn] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (serviceId) {
      fetchServiceDetails();
    }
  }, [serviceId]);

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const types = await servicesService.getRoomTypes();
        setRoomTypes(types);
      } catch (error) {
        console.error('Error fetching room types:', error);
      }
    };
    fetchRoomTypes();
  }, []);

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
      requireExamFirst: service.requireExamFirst,
      allowedRoomTypes: service.allowedRoomTypes || []
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
        requireExamFirst: values.requireExamFirst,
        allowedRoomTypes: values.allowedRoomTypes
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

  // === QL service ADD-ON  FUNCTIONS =====================================
  
  // Thêm add-on mới
  const handleAddAddOn = () => {
    setEditingAddOn(null);
    addOnForm.resetFields();
    setShowAddOnModal(true);
  };

  // Chỉnh sửa add-on
  const handleEditAddOn = (addOn) => {
    setEditingAddOn(addOn);
    addOnForm.setFieldsValue({
      name: addOn.name,
      price: addOn.price,
      description: addOn.description
    });
    setShowEditAddOnModal(true);
  };

  // Xác nhận thêm/sửa add-on
  const handleConfirmAddOn = async () => {
    try {
      setAddOnLoading(true);
      const values = await addOnForm.validateFields();
      
      if (editingAddOn) {
        // Cập nhật add-on
        await servicesService.updateServiceAddOn(serviceId, editingAddOn._id, values);
        toastService.success('Cập nhật cấp độ dịch vụ thành công!');
      } else {
        // Thêm add-on mới
        await servicesService.addServiceAddOn(serviceId, values);
        toastService.success('Thêm cấp độ dịch vụ thành công!');
      }
      
      // Reload service details
      await fetchServiceDetails();
      setShowAddOnModal(false);
      setShowEditAddOnModal(false);
      addOnForm.resetFields();
    } catch (error) {
      toastService.error('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setAddOnLoading(false);
    }
  };

  // Hủy thêm/sửa add-on
  const handleCancelAddOn = () => {
    setShowAddOnModal(false);
    setShowEditAddOnModal(false);
    setEditingAddOn(null);
    addOnForm.resetFields();
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
      toastService.success(`Đã ${selectedAddOn.isActive ? 'tắt' : 'bật'} cấp độ dịch vụ!`);
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

  // Show delete confirmation modal
  const handleDeleteAddOn = (addOn) => {
    setSelectedAddOn(addOn);
    setShowDeleteConfirmModal(true);
  };

  // Confirm delete add-on
  const handleConfirmDeleteAddOn = async () => {
    if (!selectedAddOn) return;
    
    try {
      setDeleteLoading(true);
      await servicesService.deleteServiceAddOn(serviceId, selectedAddOn._id);
      toastService.success('Xóa cấp độ dịch vụ thành công!');
      await fetchServiceDetails();
    } catch (error) {
      toastService.error('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirmModal(false);
      setSelectedAddOn(null);
    }
  };

  // Cancel delete confirmation
  const handleCancelDeleteAddOn = () => {
    setShowDeleteConfirmModal(false);
    setSelectedAddOn(null);
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
        
      </div>

      <Row gutter={[24, 24]}>
        {/* Thông tin cơ bản */}
        <Col span={24}>
          <Card 
            title="Thông tin dịch vụ" 
            size="small"
            extra={
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleUpdateService}
              >
                Chỉnh sửa
              </Button>
            }
          >
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
                  <Text type="secondary">Thời gian thực hiện ước tính:</Text>
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
              <Col span={12}>
                <div>
                  <Text type="secondary">Trạng thái:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag style={{ fontSize: 14 }}>
                    {service.isActive ? 'Hoạt động' : 'Ngưng hoạt động'}
                    </Tag>
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


        {/* Các cấp độ dịch vụ */}
        <Col span={24}>
          <Card 
            title="Các cấp độ dịch vụ" 
            size="small"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddAddOn}
                size="small"
              >
                Thêm cấp độ
              </Button>
            }
          >
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
                    title: 'Thao tác',
                    key: 'actions',
                    width: 180,
                    render: (_, record) => (
                      <Space>
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleEditAddOn(record)}
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
                <Text type="secondary">Chưa có cấp độ dịch vụ</Text>
                <br />
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />}
                  onClick={handleAddAddOn}
                  style={{ marginTop: 8 }}
                >
                  Thêm cấp độ đầu tiên
                </Button>
              </div>
            )}
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
            label="Thời gian thực hiện ước tính (phút)"
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

          <Form.Item
            name="allowedRoomTypes"
            label="Loại phòng cho phép"
            rules={[
              { required: true, message: 'Vui lòng chọn ít nhất 1 loại phòng!' }
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn các loại phòng có thể thực hiện dịch vụ này"
              style={{ width: '100%' }}
            >
              {Object.entries(roomTypes).map(([key, value]) => (
                <Select.Option key={value} value={value}>
                  {getRoomTypeLabel(value)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add/Edit Add-On Modal */}
      <Modal
        title={editingAddOn ? "Chỉnh sửa cấp độ dịch vụ" : "Thêm cấp độ dịch vụ"}
        open={showAddOnModal || showEditAddOnModal}
        onOk={handleConfirmAddOn}
        onCancel={handleCancelAddOn}
        okText={editingAddOn ? "Cập nhật" : "Thêm"}
        cancelText="Hủy"
        confirmLoading={addOnLoading}
        width={600}
      >
        <Form
          form={addOnForm}
          layout="vertical"
          initialValues={{
            name: '',
            price: 0,
            description: ''
          }}
        >
          <Form.Item
            name="name"
            label="Tên cấp độ"
            rules={[
              { required: true, message: 'Vui lòng nhập tên cấp độ' },
              { min: 3, message: 'Tên cấp độ phải có ít nhất 3 ký tự' }
            ]}
          >
            <Input placeholder="Nhập tên cấp độ dịch vụ" />
          </Form.Item>

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

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea
            placeholder="Nhập mô tả cấp độ dịch vụ (tùy chọn)"
            rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Toggle Add-On Confirmation Modal */}
      <Modal
        title="Xác nhận thay đổi trạng thái cấp độ dịch vụ"
        open={showToggleConfirmModal}
        onOk={handleConfirmToggleAddOn}
        onCancel={handleCancelToggleAddOn}
        okText={selectedAddOn?.isActive ? 'Tắt cấp độ' : 'Bật cấp độ'}
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
              {' '}cấp độ dịch vụ{' '}
         <strong>"{selectedAddOn.name}"</strong>?
            </p>
            {selectedAddOn.isActive && (
              <div>
                <p style={{ color: '#faad14', fontSize: 12 }}>
                   Cấp độ dịch vụ sẽ không còn khả dụng cho bệnh nhân đặt lịch.
                </p>
                {selectedAddOn.hasBeenUsed && (
                  <p style={{ color: '#ff4d4f', fontSize: 12 }}>
                     Cấp độ này đã được sử dụng trong quá khứ.
                  </p>
                )}
              </div>
            )}
            {!selectedAddOn.isActive && (
              <p style={{ color: '#52c41a', fontSize: 12 }}>
                 Cấp độ dịch vụ sẽ được kích hoạt và sẵn sàng phục vụ bệnh nhân.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Add-On Confirmation Modal */}
      <Modal
        title="Xác nhận xóa cấp độ dịch vụ"
        open={showDeleteConfirmModal}
        onOk={handleConfirmDeleteAddOn}
        onCancel={handleCancelDeleteAddOn}
        okText="Xóa cấp độ"
        cancelText="Hủy"
        okType="danger"
        confirmLoading={deleteLoading}
      >
        {selectedAddOn && (
          <div>
            <p>
        Bạn có chắc chắn muốn{' '}
              <strong style={{ color: '#ff4d4f' }}>XÓA</strong>
              {' '}cấp độ dịch vụ{' '}
              <strong>"{selectedAddOn.name}"</strong>?
            </p>
            
            <div style={{ backgroundColor: '#fff2f0', padding: 12, borderRadius: 6, border: '1px solid #ffccc7', marginTop: 16 }}>
              {selectedAddOn.hasBeenUsed && (
                <p style={{ color: '#ff4d4f', fontSize: 12, margin: '0 0 8px 0' }}>
                   <strong>Cấp độ đã được sử dụng:</strong> Việc xóa có thể ảnh hưởng đến dữ liệu lịch sử và báo cáo.
                </p>
              )}
              
              <p style={{ color: '#ff4d4f', fontSize: 12, margin: 0 }}>
                 <strong>Hành động này không thể hoàn tác!</strong>
              </p>
            </div>

            <p style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
              Nếu bạn chỉ muốn tạm thời ngưng sử dụng cấp độ, hãy <strong>TẮT</strong> thay vì xóa.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ServiceDetails;

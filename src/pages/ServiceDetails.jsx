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
  Table,
  Modal,
  Switch
} from 'antd';
import { 
  ArrowLeftOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { servicesService, toast as toastService } from '../services';

const { Title, Text } = Typography;

const ServiceDetails = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

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
      toastService.success('Xóa tùy chọn dịch vụ thành công!');
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
                onClick={() => navigate(`/services/${serviceId}/edit`)}
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
            title="Các tùy chọn dịch vụ" 
            size="small"
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
        </Col>
      </Row>

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

      {/* Delete Add-On Confirmation Modal */}
      <Modal
        title="Xác nhận xóa tùy chọn dịch vụ"
        open={showDeleteConfirmModal}
        onOk={handleConfirmDeleteAddOn}
        onCancel={handleCancelDeleteAddOn}
        okText="Xóa tùy chọn"
        cancelText="Hủy"
        okType="danger"
        confirmLoading={deleteLoading}
      >
        {selectedAddOn && (
          <div>
            <p>
        Bạn có chắc chắn muốn{' '}
              <strong style={{ color: '#ff4d4f' }}>XÓA</strong>
              {' '}tùy chọn dịch vụ{' '}
              <strong>"{selectedAddOn.name}"</strong>?
            </p>
            
            <div style={{ backgroundColor: '#fff2f0', padding: 12, borderRadius: 6, border: '1px solid #ffccc7', marginTop: 16 }}>
              {selectedAddOn.hasBeenUsed && (
                <p style={{ color: '#ff4d4f', fontSize: 12, margin: '0 0 8px 0' }}>
                   <strong>Tùy chọn đã được sử dụng:</strong> Việc xóa có thể ảnh hưởng đến dữ liệu lịch sử và báo cáo.
                </p>
              )}
              
              <p style={{ color: '#ff4d4f', fontSize: 12, margin: 0 }}>
                 <strong>Hành động này không thể hoàn tác!</strong>
              </p>
            </div>

            <p style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
              Nếu bạn chỉ muốn tạm thời ngưng sử dụng tùy chọn, hãy <strong>TẮT</strong> thay vì xóa.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ServiceDetails;
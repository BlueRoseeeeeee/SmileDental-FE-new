/**
 * ServiceManagement.jsx
 * Giao diện quản lý dịch vụ nha khoa
 * @author: HoTram  
 */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, 
  Card, 
  Input, 
  Tag,
  Typography,
  Row,
  Col,
  Tooltip,
  Button,
  Space,
  Statistic,
  Badge,
  Switch,
  Select,
  Modal
} from 'antd';
import {
  SearchOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { servicesService, toast as toastService } from '../services';
import { searchAndFilter, debounce } from '../utils/searchUtils';

const { Title, Text } = Typography;

const ServiceList = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} dịch vụ`,
  });

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Toggle confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);


  // Filtered data using searchUtils
  const filteredServices = useMemo(() => {
    const searchFields = ['name', 'description'];
    const filters = {};

    if (statusFilter !== '') {
      filters.isActive = statusFilter === 'true';
    }

    return searchAndFilter(services, searchTerm, searchFields, filters);
  }, [services, searchTerm, statusFilter]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((term) => {
      setSearchTerm(term);
      if (!term) {
        setPagination(prev => ({ ...prev, current: 1 }));
      }
    }, 300),
    []
  );

  // Load services data
  const loadServices = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const response = await servicesService.getServices(page, limit);
      setServices(response.services || []);
      setPagination(prev => ({
        ...prev,
        current: response.page || page,
        total: response.total || 0,
        pageSize: response.limit || limit
      }));
    } catch (error) {
      toastService.error('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Handle search 
  const handleSearch = (value) => {
    debouncedSearch(value);
  };

  // Handle show confirmation modal
  const handleToggleStatus = (record) => {
    setSelectedService(record);
    setShowConfirmModal(true);
  };

  // Handle confirm toggle service status
  const handleConfirmToggle = async () => {
    if (!selectedService) return;
    
    try {
      setLoading(true);
      await servicesService.toggleServiceStatus(selectedService._id);
      const newStatus = selectedService.isActive ? 'tắt' : 'bật';
      toastService.success(`Đã ${newStatus} dịch vụ "${selectedService.name}" thành công!`);
      
      // Reload data để cập nhật UI
      loadServices(pagination.current, pagination.pageSize);
    } catch (error) {
      toastService.error('Lỗi khi cập nhật trạng thái!');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      setSelectedService(null);
    }
  };

  // Handle cancel confirmation
  const handleCancelToggle = () => {
    setShowConfirmModal(false);
    setSelectedService(null);
  };

  // Handle view service details
  const handleViewDetails = (serviceId) => {
    navigate(`/services/${serviceId}`);
  };

  // Handle edit service
  const handleEditService = (serviceId) => {
    navigate(`/services/${serviceId}`);
  };

  // Dịch loại dịch vụ sang tiếng Việt
  const translateServiceType = (type) => {
    const typeMap = {
      'treatment': 'Điều trị',
      'exam': 'Khám', 
    };
    return typeMap[type] || type;
  };

  // Hiển thị giá addon
  const getAddOnPriceRange = (addOns) => {
    if (!addOns || addOns.length === 0) return null;
    const activeAddOns = addOns.filter(addon => addon.isActive);
    if (activeAddOns.length === 0) return null;
    
    const prices = activeAddOns.map(addon => addon.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return new Intl.NumberFormat('vi-VN').format(minPrice) + 'đ';
    }
    return new Intl.NumberFormat('vi-VN').format(minPrice) + 'đ - ' + 
           new Intl.NumberFormat('vi-VN').format(maxPrice) + 'đ';
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Tên dịch vụ',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text) => (
        <Text strong style={{ color: '#1890ff' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'durationMinutes',
      key: 'durationMinutes',
      width: 100,
      render: (minutes) => (
        <Tag color="blue">
          {minutes} phút
        </Tag>
      ),
    },
    {
      title: 'Giá dịch vụ',
      dataIndex: 'serviceAddOns',
      key: 'price',
      width: 150,
      render: (addOns) => {
        const priceRange = getAddOnPriceRange(addOns);
        return priceRange ? (
          <Text strong style={{ color: '#52c41a' }}>
            {priceRange}
          </Text>
        ) : (
          <Text type="secondary">Liên hệ</Text>
        );
      },
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => (
        <Tag color="green">
          {translateServiceType(type)}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Ngưng hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Tùy chọn',
      dataIndex: 'serviceAddOns',
      key: 'serviceAddOns',
      width: 120,
      render: (addOns, record) => {
        const activeAddOns = addOns?.filter(addon => addon.isActive) || [];
        return (
          <div>
            <Tag color="purple">
              {activeAddOns.length} cấp độ
            </Tag>
            {record.requireExamFirst && (
              <div style={{ marginTop: 4 }}>
                <Tag color="orange" style={{ fontSize: 10 }}>
                  Cần khám trước
                </Tag>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 220,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết dịch vụ" placement="top">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record._id)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa dịch vụ" placement="top">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditService(record._id)}
            />
          </Tooltip>
          <Tooltip 
            title={record.isActive ? 'Nhấn để tắt dịch vụ' : 'Nhấn để bật dịch vụ'}
            placement="top"
          >
            <Switch
              checked={record.isActive}
              onChange={() => handleToggleStatus(record)}
              checkedChildren="Bật"
              unCheckedChildren="Tắt"
              size="default"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];



  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Search & Filter */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div>
              <Text style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>Tìm kiếm</Text>
              <Input
                placeholder="Tìm kiếm theo tên dịch vụ..."
                prefix={<SearchOutlined />}
                allowClear
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div>
              <Text style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>Lọc theo trạng thái</Text>
              <Select
                placeholder="Chọn trạng thái"
                allowClear
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value || '');
                  if (!value) {
                    setPagination(prev => ({ ...prev, current: 1 }));
                  }
                }}
                style={{ width: '100%' }}
              >
                <Select.Option value="true">Hoạt động</Select.Option>
                <Select.Option value="false">Ngưng hoạt động</Select.Option>
              </Select>
            </div>
          </Col>
        </Row>
      </Card>


      {/* Services Table */}
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MedicineBoxOutlined style={{ fontSize: 18, color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0, fontSize: 16 }}>
              Danh sách dịch vụ nha khoa
            </Title>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/services/add')}
          >
            Thêm dịch vụ
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={filteredServices}
          rowKey="_id"
          loading={loading}
          pagination={
            (searchTerm || statusFilter) 
              ? false 
              : {
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} dịch vụ`,
                  onChange: (page, pageSize) => {
                    setPagination(prev => ({
                      ...prev,
                      current: page,
                      pageSize: pageSize || 10
                    }));
                  }
                }
          }
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>

      {/* Confirmation Modal */}
      <Modal
        title="Xác nhận thay đổi trạng thái"
        open={showConfirmModal}
        onOk={handleConfirmToggle}
        onCancel={handleCancelToggle}
        okText={selectedService?.isActive ? 'Tắt dịch vụ' : 'Bật dịch vụ'}
        cancelText="Hủy"
        okType={selectedService?.isActive ? 'danger' : 'primary'}
        confirmLoading={loading}
      >
        {selectedService && (
          <div>
            <p>
              Bạn có chắc chắn muốn{' '}
              <strong style={{ color: selectedService.isActive ? '#ff4d4f' : '#52c41a' }}>
                {selectedService.isActive ? 'TẮT' : 'BẬT'}
              </strong>
              {' '}dịch vụ{' '}
              <strong>"{selectedService.name}"</strong>?
            </p>
            {selectedService.isActive && (
              <p style={{ color: '#faad14', fontSize: 12 }}>
                 Dịch vụ sẽ không còn hiển thị cho bệnh nhân đặt lịch.
              </p>
            )}
            {!selectedService.isActive && (
              <p style={{ color: '#52c41a', fontSize: 12 }}>
                 Dịch vụ sẽ được kích hoạt và hiển thị cho bệnh nhân.
              </p>
            )}
          </div>
        )}
      </Modal>


    </div>
  );
};

export default ServiceList;
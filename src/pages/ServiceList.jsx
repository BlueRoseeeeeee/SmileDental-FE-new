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
  Switch,
  Select,
  Modal,
  Tabs
} from 'antd';
import {
  SearchOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
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
  const [activeTab, setActiveTab] = useState('active');
  const [typeFilter, setTypeFilter] = useState('');

  // Toggle confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedServiceForDelete, setSelectedServiceForDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);


  // Filtered data using searchUtils
  const filteredServices = useMemo(() => {
    const searchFields = ['name', 'description'];
    const filters = {};

    // Filter by tab status
    if (activeTab === 'active') {
      filters.isActive = true;
    } else if (activeTab === 'inactive') {
      filters.isActive = false;
    }

    // Filter by type
    if (typeFilter !== '') {
      filters.type = typeFilter;
    }

    return searchAndFilter(services, searchTerm, searchFields, filters);
  }, [services, searchTerm, activeTab, typeFilter]);

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

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Handle type filter change
  const handleTypeFilterChange = (value) => {
    setTypeFilter(value || '');
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Load services data
  const loadServices = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      // 🔥 When searching, fetch ALL services to enable search across all pages
      const shouldFetchAll = searchTerm.trim() !== '';
      
      const response = await servicesService.getServices(
        shouldFetchAll ? 1 : page, 
        shouldFetchAll ? 9999 : limit
      );
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
    loadServices(pagination.current, pagination.pageSize);
  }, [searchTerm]); // 🔥 Re-fetch when search term changes

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

  // Handle edit service
  const handleEditService = (serviceId) => {
    navigate(`/services/${serviceId}/edit`);
  };

  // Handle show delete confirmation modal
  const handleDeleteService = (service) => {
    setSelectedServiceForDelete(service);
    setShowDeleteModal(true);
  };

  // Handle confirm delete service
  const handleConfirmDelete = async () => {
    if (!selectedServiceForDelete) return;
    
    try {
      setDeleteLoading(true);
      const response = await servicesService.deleteService(selectedServiceForDelete._id);
      toastService.success(response.message || `Đã xóa dịch vụ "${selectedServiceForDelete.name}" thành công`);
      
      // Reload data để cập nhật UI
      loadServices(pagination.current, pagination.pageSize);
    } catch (error) {
      toastService.error('Lỗi khi xóa dịch vụ: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedServiceForDelete(null);
    }
  };

  // Handle cancel delete confirmation
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedServiceForDelete(null);
  };

  // Dịch loại dịch vụ sang tiếng Việt
  const translateServiceType = (type) => {
    const typeMap = {
      'treatment': 'Điều trị',
      'exam': 'Khám', 
    };
    return typeMap[type] || type;
  };

  // 🆕 Hiển thị giá addon với effective price
  const getAddOnPriceRange = (addOns) => {
    if (!addOns || addOns.length === 0) return null;
    const activeAddOns = addOns.filter(addon => addon.isActive);
    if (activeAddOns.length === 0) return null;
    
    // 🆕 Use effectivePrice if available, fallback to price
    const prices = activeAddOns.map(addon => addon.effectivePrice || addon.price);
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
      sorter: (a, b) => a.name.localeCompare(b.name, 'vi'),
      sortDirections: ['ascend', 'descend'],
      render: (text) => (
        <Text strong style={{ color: '#1890ff' }}>
          {text}
        </Text>
      ),
    },
    // {
    //   title: 'Thời gian',
    //   dataIndex: 'durationMinutes',
    //   key: 'durationMinutes',
    //   width: 100,
    //   render: (minutes) => (
    //     <Tag color="blue">
    //       {minutes} phút
    //     </Tag>
    //   ),
    // },
    {
      title: 'Giá dịch vụ',
      dataIndex: 'serviceAddOns',
      key: 'price',
      width: 180,
      render: (addOns, record) => {
        const priceRange = getAddOnPriceRange(addOns);
        
        // 🆕 Check if any addon has modified price
        const hasPromotion = addOns?.some(addon => addon.isPriceModified);
        const hasTemporaryPrice = record.hasActiveTemporaryPrice;
        
        return (
          <div>
            {priceRange ? (
              <>
                <Text strong style={{ color: hasPromotion ? '#ff4d4f' : '#52c41a' }}>
                  {priceRange}
                </Text>
                {(hasPromotion || hasTemporaryPrice) && (
                  <div style={{ marginTop: 4 }}>
                    <Tag color="red" style={{ fontSize: 10 }}>
                      🎉 Khuyến mãi
                    </Tag>
                  </div>
                )}
              </>
            ) : (
              <Text type="secondary">Liên hệ</Text>
            )}
          </div>
        );
      },
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      sorter: (a, b) => a.type.localeCompare(b.type),
      sortDirections: ['ascend', 'descend'],
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
      sorter: (a, b) => a.isActive - b.isActive,
      sortDirections: ['ascend', 'descend'],
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
      sorter: (a, b) => {
        const getActiveAddOnsCount = (addOns) => {
          return addOns?.filter(addon => addon.isActive).length || 0;
        };
        return getActiveAddOnsCount(a.serviceAddOns) - getActiveAddOnsCount(b.serviceAddOns);
      },
      sortDirections: ['ascend', 'descend'],
      render: (addOns, record) => {
        const activeAddOns = addOns?.filter(addon => addon.isActive) || [];
        return (
          <div>
            <Tag color="purple">
              {activeAddOns.length} tùy chọn
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
      width: 280,
      align: 'center',
      render: (_, record) => (
        <Space>
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
          <Tooltip title="Xóa dịch vụ" placement="top">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteService(record)}
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
              <Text style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>Lọc theo loại</Text>
              <Select
                placeholder="Chọn loại dịch vụ"
                allowClear
                value={typeFilter}
                onChange={handleTypeFilterChange}
                style={{ width: '100%' }}
              >
                <Select.Option value="treatment">Điều trị</Select.Option>
                <Select.Option value="exam">Khám</Select.Option>
              </Select>
            </div>
          </Col>
        </Row>
      </Card>


      {/* Services Table with Tabs */}
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
        
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={[
            {
              key: 'active',
              label: 'Hoạt động',
              children: (
                <Table
                  columns={columns}
                  dataSource={filteredServices}
                  rowKey="_id"
                  loading={loading}
                  pagination={
                    (searchTerm || typeFilter) 
                      ? false 
                      : {
                          current: pagination.current,
                          pageSize: pagination.pageSize,
                          total: filteredServices.length,
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
              )
            },
            {
              key: 'inactive',
              label: 'Đã ngưng hoạt động',
              children: (
                <Table
                  columns={columns}
                  dataSource={filteredServices}
                  rowKey="_id"
                  loading={loading}
                  pagination={
                    (searchTerm || typeFilter) 
                      ? false 
                      : {
                          current: pagination.current,
                          pageSize: pagination.pageSize,
                          total: filteredServices.length,
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
              )
            }
          ]}
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

      {/* Delete Confirmation Modal */}
      <Modal
        title="Xác nhận xóa dịch vụ"
        open={showDeleteModal}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Xóa dịch vụ"
        cancelText="Hủy"
        okType="danger"
        confirmLoading={deleteLoading}
      >
        {selectedServiceForDelete && (
          <div>
            <p>
              Bạn có chắc chắn muốn{' '}
              <strong style={{ color: '#ff4d4f' }}>XÓA</strong>
              {' '}dịch vụ{' '}
              <strong>"{selectedServiceForDelete.name}"</strong>?
            </p>
            
            <div style={{ backgroundColor: '#fff2f0', padding: 12, borderRadius: 6, border: '1px solid #ffccc7', marginTop: 16 }}>
              {selectedServiceForDelete.hasBeenUsed && (
                <p style={{ color: '#ff4d4f', fontSize: 12, margin: '0 0 8px 0' }}>
                   <strong>Dịch vụ đã được sử dụng:</strong> Việc xóa có thể ảnh hưởng đến dữ liệu lịch sử và báo cáo.
                </p>
              )}
              
              {selectedServiceForDelete.serviceAddOns && selectedServiceForDelete.serviceAddOns.length > 0 && (
                <p style={{ color: '#ff4d4f', fontSize: 12, margin: '0 0 8px 0' }}>
                   <strong>Dịch vụ có {selectedServiceForDelete.serviceAddOns.length} tùy chọn:</strong> Tất cả tùy chọn sẽ bị xóa cùng.
                </p>
              )}
              
              <p style={{ color: '#ff4d4f', fontSize: 12, margin: 0 }}>
                 <strong>Hành động này không thể hoàn tác!</strong>
              </p>
            </div>

            <p style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
              Nếu bạn chỉ muốn tạm thời ngưng sử dụng dịch vụ, hãy <strong>TẮT</strong> thay vì xóa.
            </p>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default ServiceList;
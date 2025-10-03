/**
 * ServiceManagement.jsx
 * Giao diện quản lý dịch vụ nha khoa
 * @author: HoTram  
 */
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Input, 
  Tag,
  Typography,
  Row,
  Col,
  Tooltip
} from 'antd';
import {
  SearchOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { servicesService, toast as toastService } from '../services';

const { Title, Text } = Typography;

const ServiceList = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} dịch vụ`,
  });

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
      console.error('Error loading services:', error);
      toastService.error('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Handle table pagination change
  const handleTableChange = (pagination) => {
    loadServices(pagination.current, pagination.pageSize);
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
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
      render: (text) => (
        <Text strong style={{ color: '#1890ff' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
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
      width: 100,
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
              <Text style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>Trạng thái</Text>
              <Input
                placeholder="Lọc theo trạng thái..."
                allowClear
                disabled
              />
            </div>
          </Col>
        </Row>
      </Card>


      {/* Services Table */}
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Title level={4} style={{ margin: 0, fontSize:16 }}>
            Danh sách dịch vụ nha khoa
          </Title>
        </div>
        <Table
          columns={columns}
          dataSource={services}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: handleTableChange,
            onShowSizeChange: handleTableChange,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} dịch vụ`,
          }}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>

      {/* Chờ API từ backend để thêm các chức năng thêm/sửa/xóa */}
    </div>
  );
};

export default ServiceList;
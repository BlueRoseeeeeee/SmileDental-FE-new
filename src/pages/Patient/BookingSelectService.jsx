import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Input, 
  Button, 
  Space,
  Spin,
  Alert,
  Tag,
  message,
  Select,
  Popover,
  Radio
} from 'antd';
import { 
  SearchOutlined, 
  ArrowRightOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  StarFilled
} from '@ant-design/icons';
import { servicesService, recordService } from '../../services';
import { mockServices } from '../../services/mockData.js';
import { useAuth } from '../../hooks/useAuth';
import './BookingSelectService.css';

const { Title, Text, Paragraph } = Typography;

// Toggle this to use mock data for testing
const USE_MOCK_DATA = false;

const BookingSelectService = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [unusedServices, setUnusedServices] = useState([]); // Services from doctor recommendations
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'Khám', 'Điều trị'
  const [serviceSource, setServiceSource] = useState('all'); // 'all' or 'recommended'

  useEffect(() => {
    fetchServices();
    if (user && user._id) {
      fetchUnusedServices();
    }
  }, [user]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      
      if (USE_MOCK_DATA) {
        // Use mock data for testing
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        setServices(mockServices);
        setFilteredServices(mockServices);
      } else {
        // Use real API
        const response = await servicesService.getAllServices();
        console.log('📋 Services API response:', response);
        
        // API returns: { services: [...], total, page, limit, totalPages }
        if (response.services && Array.isArray(response.services)) {
          const activeServices = response.services.filter(s => s.isActive);
          setServices(activeServices);
          applyFilters(searchValue, selectedType, serviceSource, activeServices, unusedServices);
          
          if (activeServices.length === 0) {
            message.warning('Hiện tại chưa có dịch vụ nào khả dụng');
          }
        } else {
          console.error('Invalid API response format:', response);
          message.error('Không thể tải danh sách dịch vụ');
        }
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      message.error('Lỗi kết nối: ' + (error.message || 'Không thể kết nối đến server'));
    } finally {
      setLoading(false);
    }
  };

  const fetchUnusedServices = async () => {
    try {
      const response = await recordService.getUnusedServices(user._id);
      console.log('🩺 Unused services from exam records:', response);
      
      if (response.success && response.data) {
        setUnusedServices(response.data);
      }
    } catch (error) {
      console.error('Error fetching unused services:', error);
      // Don't show error to user - just means no exam records with unused services
    }
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    applyFilters(value, selectedType, serviceSource, services, unusedServices);
  };

  const handleTypeChange = (value) => {
    setSelectedType(value);
    applyFilters(searchValue, value, serviceSource, services, unusedServices);
  };

  const handleSourceChange = (e) => {
    const value = e.target.value;
    setServiceSource(value);
    applyFilters(searchValue, selectedType, value, services, unusedServices);
  };

  const applyFilters = (search, type, source, allServices, recommendedServices) => {
    let filtered = allServices;

    // Filter by source (all or recommended only)
    if (source === 'recommended' && recommendedServices.length > 0) {
      const recommendedIds = new Set(recommendedServices.map(s => s.serviceId.toString()));
      filtered = filtered.filter(service => recommendedIds.has(service._id.toString()));
    }

    // Filter by type
    if (type !== 'all') {
      filtered = filtered.filter(service => service.type === type);
    }

    // Filter by search
    if (search.trim()) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(search.toLowerCase()) ||
        service.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  };

  const isRecommended = (serviceId) => {
    return unusedServices.some(s => s.serviceId.toString() === serviceId.toString());
  };

  const handleSelectService = (service) => {
    // Lưu service vào localStorage
    localStorage.setItem('booking_service', JSON.stringify(service));
    
    // Nếu service có addons -> navigate đến select-addon
    // Nếu không có addons -> skip sang select-dentist
    if (service.serviceAddOns && service.serviceAddOns.length > 0) {
      navigate('/patient/booking/select-addon');
    } else {
      // Clear addon data
      localStorage.removeItem('booking_serviceAddOn');
      navigate('/patient/booking/select-dentist');
    }
  };

  const handleBack = () => {
  navigate('/patient/booking/select-service');
  };

  return (
    <div className="booking-select-service-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-section">
        <div className="container">
          <Space split=">">
            <a href="/patient/booking/select-service">Trang chủ</a>
            <a href="/patient/booking">Đặt lịch khám</a>
            <Text>Chọn dịch vụ</Text>
          </Space>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
          <Card className="booking-card">
            <Title level={2} style={{ textAlign: 'center', color: '#2c5f4f', marginBottom: 16 }}>
              Vui lòng chọn dịch vụ
            </Title>

            {/* ✅ Service Source Filter */}
            {unusedServices.length > 0 && (
              <Row justify="center" style={{ marginBottom: 24 }}>
                <Radio.Group 
                  value={serviceSource} 
                  onChange={handleSourceChange}
                  buttonStyle="solid"
                  size="large"
                >
                  <Radio.Button value="all">
                    Tất cả dịch vụ
                  </Radio.Button>
                  <Radio.Button value="recommended">
                    <StarFilled style={{ color: '#faad14' }} /> Theo chỉ định bác sĩ ({unusedServices.length})
                  </Radio.Button>
                </Radio.Group>
              </Row>
            )}

            {/* Search and Filter */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} md={16}>
                <Input
                  size="large"
                  placeholder="Tìm dịch vụ theo tên"
                  prefix={<SearchOutlined />}
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  allowClear
                  style={{ borderRadius: 8 }}
                />
              </Col>
              <Col xs={24} md={8}>
                <Select
                  size="large"
                  value={selectedType}
                  onChange={handleTypeChange}
                  style={{ width: '100%', borderRadius: 8 }}
                  options={[
                    { value: 'all', label: 'Tất cả loại dịch vụ' },
                    { value: 'Khám', label: 'Khám' },
                    { value: 'Điều trị', label: 'Điều trị' }
                  ]}
                />
              </Col>
            </Row>

            {/* Warning Message */}
            {filteredServices.length > 0 && (
              <Alert
                type="warning"
                showIcon
                message="Lưu ý"
                description="Bất cứ dịch vụ bạn không thấy dịch vụ trong công cách đặt lịch trực tuyến hoặc bạn không biết chính xác dịch vụ này, bạn có thể liên hệ qua SĐT trên để tham khảo hoặc chọn dịch vụ 'Khám - Gặp bác sĩ tư vấn' và bác sĩ sẽ tư vấn chi tiết cho bạn nếu có nhu cầu thêm bất kì dịch vụ nào khác."
                style={{ marginBottom: 24, fontSize: 13 }}
              />
            )}

            {/* Services List */}
            <Spin spinning={loading}>
              {filteredServices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <MedicineBoxOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
                  <Paragraph type="secondary">
                    {searchValue ? 'Không tìm thấy dịch vụ phù hợp' : 'Chưa có dịch vụ nào'}
                  </Paragraph>
                </div>
              ) : (
                <Row gutter={[16, 16]}>
                  {filteredServices.map((service) => {
                    // Prepare addon content for Popover
                    const addonsContent = (
                      <div style={{ maxWidth: 400 }}>
                        <div style={{ marginBottom: 8, fontWeight: 600, color: '#2c5f4f' }}>
                          Các gói dịch vụ:
                        </div>
                        {service.serviceAddOns && service.serviceAddOns.length > 0 ? (
                          <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            {service.serviceAddOns.map((addon, idx) => (
                              <div key={idx} style={{ 
                                padding: '8px 12px', 
                                background: '#f5f5f5', 
                                borderRadius: 6,
                                borderLeft: '3px solid #2c5f4f'
                              }}>
                                <div style={{ fontWeight: 500, marginBottom: 4 }}>
                                  {addon.name}
                                </div>
                                <div style={{ fontSize: 13, color: '#666' }}>
                                  <DollarOutlined /> <strong>{addon.price?.toLocaleString('vi-VN')} VNĐ</strong> / {addon.unit}
                                </div>
                                <div style={{ fontSize: 12, color: '#999' }}>
                                  Thời gian: ~{addon.durationMinutes} phút
                                </div>
                              </div>
                            ))}
                          </Space>
                        ) : (
                          <Text type="secondary">Không có gói dịch vụ</Text>
                        )}
                      </div>
                    );

                    return (
                      <Col xs={24} key={service._id}>
                        <Popover 
                          content={addonsContent} 
                          title={null}
                          placement="rightTop"
                          trigger="hover"
                        >
                          <Card
                            hoverable
                            className="service-item-card"
                            onClick={() => handleSelectService(service)}
                          >
                            <Row align="middle" gutter={16}>
                              <Col flex="auto">
                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                  <Space>
                                    <Title level={4} style={{ margin: 0, color: '#d4860f' }}>
                                      <MedicineBoxOutlined /> {service.name}
                                    </Title>
                                    {service.type && (
                                      <Tag color={service.type === 'Khám' ? 'blue' : 'green'}>
                                        {service.type}
                                      </Tag>
                                    )}
                                    {/* ✅ Recommended Badge */}
                                    {isRecommended(service._id) && (
                                      <Tag color="gold" icon={<StarFilled />}>
                                        Chỉ định bác sĩ
                                      </Tag>
                                    )}
                                    <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
                                  </Space>
                                  {service.description && (
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                      {service.description}
                                    </Text>
                                  )}
                                  {service.serviceAddOns && service.serviceAddOns.length > 0 && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      {service.serviceAddOns.length} gói dịch vụ có sẵn
                                    </Text>
                                  )}
                                </Space>
                              </Col>
                              <Col>
                                <Button 
                                  type="primary" 
                                  icon={<ArrowRightOutlined />}
                                  style={{ 
                                    backgroundColor: '#2c5f4f',
                                    borderColor: '#2c5f4f',
                                    borderRadius: 6
                                  }}
                                >
                                  Chọn
                                </Button>
                              </Col>
                            </Row>
                          </Card>
                        </Popover>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </Spin>

            {/* Actions */}
            <div style={{ marginTop: 32, textAlign: 'center' }}>
              <Button size="large" onClick={handleBack} style={{ borderRadius: 6 }}>
                Quay lại bước trước
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingSelectService;

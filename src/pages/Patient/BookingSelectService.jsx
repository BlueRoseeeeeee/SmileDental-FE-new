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
  Tag
} from 'antd';
import { 
  SearchOutlined, 
  ArrowRightOutlined,
  MedicineBoxOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { servicesService } from '../../services';
import { mockServices } from '../../services/mockData.js';
import './BookingSelectService.css';

const { Title, Text, Paragraph } = Typography;

// Toggle this to use mock data for testing
const USE_MOCK_DATA = true;

const BookingSelectService = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

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
        if (response.success) {
          const activeServices = response.data.filter(s => s.isActive);
          setServices(activeServices);
          setFilteredServices(activeServices);
        }
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    if (!value.trim()) {
      setFilteredServices(services);
      return;
    }
    
    const filtered = services.filter(service => 
      service.name.toLowerCase().includes(value.toLowerCase()) ||
      service.description?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredServices(filtered);
  };

  const handleSelectService = (service) => {
    // Lưu service vào localStorage
    localStorage.setItem('booking_service', JSON.stringify(service));
    navigate('/patient/booking/select-dentist');
  };

  const handleBack = () => {
    navigate('/home');
  };

  return (
    <div className="booking-select-service-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-section">
        <div className="container">
          <Space split=">">
            <a href="/home">Trang chủ</a>
            <a href="/patient/booking">Đặt lịch khám</a>
            <Text>Chọn dịch vụ</Text>
          </Space>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
          <Card className="booking-card">
            <Title level={2} style={{ textAlign: 'center', color: '#2c5f4f', marginBottom: 32 }}>
              Vui lòng chọn dịch vụ
            </Title>

            {/* Search */}
            <div style={{ marginBottom: 24 }}>
              <Input
                size="large"
                placeholder="Tìm dịch vụ theo tên"
                prefix={<SearchOutlined />}
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
                style={{ borderRadius: 8 }}
              />
            </div>

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
                  {filteredServices.map((service) => (
                    <Col xs={24} key={service._id}>
                      <Card
                        hoverable
                        className="service-item-card"
                        onClick={() => handleSelectService(service)}
                      >
                        <Row align="middle" gutter={16}>
                          <Col flex="auto">
                            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                              <Title level={4} style={{ margin: 0, color: '#d4860f' }}>
                                <MedicineBoxOutlined /> {service.name}
                              </Title>
                              {service.description && (
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                  {service.description}
                                </Text>
                              )}
                              <div>
                                <Text strong style={{ color: '#2c5f4f', fontSize: 16 }}>
                                  <DollarOutlined /> Giá dịch vụ: {service.price?.toLocaleString('vi-VN')} VNĐ
                                </Text>
                              </div>
                              {service.duration && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Thời gian: ~{service.duration} phút
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
                    </Col>
                  ))}
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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Space,
  Alert,
  Tag,
  message,
  Radio,
  Empty
} from 'antd';
import { 
  ArrowRightOutlined,
  ArrowLeftOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import './BookingSelectAddOn.css';

const { Title, Text, Paragraph } = Typography;

const BookingSelectAddOn = () => {
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [selectedAddOn, setSelectedAddOn] = useState(null);

  useEffect(() => {
    // Load service từ localStorage
    const savedService = localStorage.getItem('booking_service');
    
    if (!savedService) {
      message.error('Vui lòng chọn dịch vụ trước');
      navigate('/patient/booking/select-service');
      return;
    }

    const serviceData = JSON.parse(savedService);
    setService(serviceData);

    // Nếu service không có addons, skip sang màn chọn bác sĩ
    if (!serviceData.serviceAddOns || serviceData.serviceAddOns.length === 0) {
      message.info('Dịch vụ này không có gói phụ, chuyển sang bước tiếp theo');
      // Clear serviceAddOn in localStorage
      localStorage.removeItem('booking_serviceAddOn');
      setTimeout(() => {
        navigate('/patient/booking/select-dentist');
      }, 1000);
    }
  }, [navigate]);

  const handleSelectAddOn = (addon) => {
    setSelectedAddOn(addon);
  };

  const handleNext = () => {
    if (!selectedAddOn) {
      message.warning('Vui lòng chọn gói dịch vụ');
      return;
    }

    // Lưu addon vào localStorage
    localStorage.setItem('booking_serviceAddOn', JSON.stringify(selectedAddOn));
    navigate('/patient/booking/select-dentist');
  };

  const handleBack = () => {
    navigate('/patient/booking/select-service');
  };

  if (!service) {
    return null;
  }

  return (
    <div className="booking-select-addon-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-section">
        <div className="container">
          <Space split=">">
            <a href="/patient/booking/select-service">Trang chủ</a>
            <a href="/patient/booking">Đặt lịch khám</a>
            <a href="/patient/booking/select-service">Chọn dịch vụ</a>
            <Text>Chọn gói dịch vụ</Text>
          </Space>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
          <Card className="booking-card">
            <Title level={2} style={{ textAlign: 'center', color: '#2c5f4f', marginBottom: 16 }}>
              Chọn gói dịch vụ
            </Title>

            {/* Service Info */}
            <Alert
              type="info"
              showIcon
              icon={<MedicineBoxOutlined />}
              message={
                <Space>
                  <Text strong>Dịch vụ đã chọn:</Text>
                  <Tag color="green">{service.name}</Tag>
                </Space>
              }
              style={{ marginBottom: 24 }}
            />

            {/* Service AddOns List */}
            {service.serviceAddOns && service.serviceAddOns.length > 0 ? (
              <div style={{ marginBottom: 32 }}>
                <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 24 }}>
                  Vui lòng chọn một gói dịch vụ phù hợp với nhu cầu của bạn
                </Paragraph>

                <Radio.Group 
                  style={{ width: '100%' }}
                  value={selectedAddOn?._id}
                  onChange={(e) => {
                    const addon = service.serviceAddOns.find(a => a._id === e.target.value);
                    handleSelectAddOn(addon);
                  }}
                >
                  <Row gutter={[16, 16]}>
                    {service.serviceAddOns.map((addon) => (
                      <Col xs={24} md={12} key={addon._id}>
                        <Card
                          hoverable
                          className={`addon-card ${selectedAddOn?._id === addon._id ? 'selected' : ''}`}
                          onClick={() => handleSelectAddOn(addon)}
                          style={{
                            borderColor: selectedAddOn?._id === addon._id ? '#2c5f4f' : '#d9d9d9',
                            borderWidth: selectedAddOn?._id === addon._id ? 2 : 1,
                            position: 'relative'
                          }}
                        >
                          {selectedAddOn?._id === addon._id && (
                            <div style={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              color: '#2c5f4f',
                              fontSize: 24
                            }}>
                              <CheckCircleOutlined />
                            </div>
                          )}

                          <Radio 
                            value={addon._id}
                            style={{ 
                              position: 'absolute',
                              top: 12,
                              left: 12
                            }}
                          />

                          <div style={{ paddingLeft: 32, paddingTop: 8 }}>
                            <Title level={4} style={{ marginBottom: 12, color: '#d4860f' }}>
                              {addon.name}
                            </Title>

                            {addon.description && (
                              <Paragraph 
                                type="secondary" 
                                style={{ fontSize: 13, marginBottom: 16 }}
                                ellipsis={{ rows: 2 }}
                              >
                                {addon.description}
                              </Paragraph>
                            )}

                            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                              <Space>
                                <DollarOutlined style={{ color: '#2c5f4f' }} />
                                <Text strong style={{ fontSize: 16, color: '#d4860f' }}>
                                  {addon.price?.toLocaleString('vi-VN')} VNĐ
                                </Text>
                                <Text type="secondary">/ {addon.unit}</Text>
                              </Space>

                              <Space>
                                <ClockCircleOutlined style={{ color: '#1890ff' }} />
                                <Text type="secondary">
                                  Thời gian: ~{addon.durationMinutes} phút
                                </Text>
                              </Space>
                            </Space>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Radio.Group>
              </div>
            ) : (
              <Empty 
                description="Dịch vụ này không có gói phụ"
                style={{ margin: '40px 0' }}
              />
            )}

            {/* Actions */}
            <div style={{ marginTop: 32, textAlign: 'center' }}>
              <Space size="large">
                <Button 
                  size="large" 
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBack}
                  style={{ borderRadius: 6 }}
                >
                  Quay lại
                </Button>
                <Button 
                  type="primary"
                  size="large" 
                  icon={<ArrowRightOutlined />}
                  onClick={handleNext}
                  disabled={!selectedAddOn}
                  style={{ 
                    backgroundColor: '#2c5f4f',
                    borderColor: '#2c5f4f',
                    borderRadius: 6
                  }}
                >
                  Tiếp tục
                </Button>
              </Space>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingSelectAddOn;

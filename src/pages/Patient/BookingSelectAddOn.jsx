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
  Empty,
  Radio,
  Spin
} from 'antd';
import { 
  ArrowRightOutlined,
  ArrowLeftOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  MedicineBoxOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import recordService from '../../services/recordService';
import './BookingSelectAddOn.css';

const { Title, Text, Paragraph } = Typography;

const BookingSelectAddOn = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [selectedAddOn, setSelectedAddOn] = useState(null);
  const [treatmentIndications, setTreatmentIndications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [canSelectAddOn, setCanSelectAddOn] = useState(false);

  useEffect(() => {
    loadServiceAndCheckIndications();
  }, [navigate, user]);

  const loadServiceAndCheckIndications = async () => {
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
      localStorage.removeItem('booking_serviceAddOn');
      setTimeout(() => {
        navigate('/patient/booking/select-dentist');
      }, 1000);
      return;
    }

    // Check if service requires exam first
    if (serviceData.requireExamFirst && user) {
      setLoading(true);
      try {
        console.log('🔍 Checking treatment indications for patient:', user._id, 'service:', serviceData._id);
        
        const response = await recordService.getTreatmentIndications(user._id, serviceData._id);
        const indications = response.data || [];
        
        console.log('✅ Treatment indications found:', indications);
        setTreatmentIndications(indications);
        
        // If has indications with serviceAddOnId, can select that specific addon
        if (indications.length > 0 && indications[0].serviceAddOnId) {
          setCanSelectAddOn(true);
          // Auto-select the indicated addon
          const indicatedAddon = serviceData.serviceAddOns.find(
            addon => addon._id === indications[0].serviceAddOnId
          );
          if (indicatedAddon) {
            setSelectedAddOn(indicatedAddon._id);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching treatment indications:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Service doesn't require exam or user not logged in → can select any addon
      setCanSelectAddOn(true);
    }
  };

  const handleSelectAddOn = (addonId) => {
    if (!canSelectAddOn) {
      message.warning('Bạn cần khám trước để được chỉ định gói điều trị phù hợp');
      return;
    }
    
    // Only allow selecting the indicated addon if there's an indication
    if (treatmentIndications.length > 0 && treatmentIndications[0].serviceAddOnId) {
      if (addonId !== treatmentIndications[0].serviceAddOnId) {
        message.warning('Bạn chỉ được chọn gói điều trị đã được chỉ định');
        return;
      }
    }
    
    setSelectedAddOn(addonId);
  };

  const handleNext = () => {
    // Save selected addon if available
    if (selectedAddOn && canSelectAddOn) {
      const addon = service.serviceAddOns.find(a => a._id === selectedAddOn);
      if (addon) {
        localStorage.setItem('booking_serviceAddOn', JSON.stringify(addon));
        message.success(`Đã chọn gói: ${addon.name}`);
      }
    } else {
      // Clear addon selection - will use longest duration for slot calculation
      localStorage.removeItem('booking_serviceAddOn');
    }
    navigate('/patient/booking/select-dentist');
  };

  const handleBack = () => {
    navigate('/patient/booking/select-service');
  };

  if (!service) {
    return null;
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Đang kiểm tra chỉ định điều trị...</p>
      </div>
    );
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
              Danh sách gói dịch vụ
            </Title>

            {/* Service Info */}
            <Alert
              type="info"
              showIcon
              icon={<MedicineBoxOutlined />}
              message={
                <Space direction="vertical" size={4}>
                  <Space>
                    <Text strong>Dịch vụ:</Text>
                    <Tag color="green">{service.name}</Tag>
                  </Space>
                  {service.requireExamFirst && (
                    <Text type="warning" style={{ fontSize: 12 }}>
                      ⚠️ Dịch vụ này yêu cầu khám trước khi điều trị
                    </Text>
                  )}
                  {treatmentIndications.length > 0 && treatmentIndications[0].serviceAddOnId && (
                    <Alert
                      type="success"
                      showIcon
                      icon={<FileTextOutlined />}
                      message={
                        <Text style={{ fontSize: 12 }}>
                          ✅ Bạn đã được chỉ định gói: <strong>{treatmentIndications[0].serviceAddOnName}</strong>
                        </Text>
                      }
                      style={{ marginTop: 8 }}
                    />
                  )}
                  {service.requireExamFirst && treatmentIndications.length === 0 && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Bạn cần khám trước để được nha sỹ chỉ định gói điều trị phù hợp.
                    </Text>
                  )}
                  {!service.requireExamFirst && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Bạn có thể chọn gói dịch vụ phù hợp với nhu cầu.
                    </Text>
                  )}
                </Space>
              }
              style={{ marginBottom: 24 }}
            />

            {/* Service AddOns List */}
            {service.serviceAddOns && service.serviceAddOns.length > 0 ? (
              <div style={{ marginBottom: 32 }}>
                {canSelectAddOn ? (
                  <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 24, fontWeight: 500 }}>
                    {treatmentIndications.length > 0 && treatmentIndications[0].serviceAddOnId
                      ? '✅ Vui lòng xác nhận gói điều trị đã được chỉ định'
                      : '📋 Chọn gói dịch vụ phù hợp với nhu cầu của bạn'
                    }
                  </Paragraph>
                ) : (
                  <Paragraph type="warning" style={{ textAlign: 'center', marginBottom: 24, fontWeight: 500 }}>
                    ⚠️ Các gói dịch vụ chỉ để tham khảo. Bạn cần khám trước để được chỉ định gói phù hợp.
                  </Paragraph>
                )}

                <Radio.Group 
                  value={selectedAddOn} 
                  onChange={(e) => handleSelectAddOn(e.target.value)}
                  style={{ width: '100%' }}
                  disabled={!canSelectAddOn}
                >
                  <Row gutter={[16, 16]}>
                    {service.serviceAddOns.filter(addon => addon.isActive).map((addon) => {
                      const isIndicated = treatmentIndications.some(ind => ind.serviceAddOnId === addon._id);
                      const isDisabled = !canSelectAddOn || 
                        (treatmentIndications.length > 0 && 
                         treatmentIndications[0].serviceAddOnId && 
                         treatmentIndications[0].serviceAddOnId !== addon._id);
                      
                      return (
                        <Col xs={24} md={12} key={addon._id}>
                          <Card
                            className={`addon-card ${selectedAddOn === addon._id ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                            style={{
                              borderColor: selectedAddOn === addon._id ? '#2c5f4f' : (isIndicated ? '#52c41a' : '#d9d9d9'),
                              borderWidth: selectedAddOn === addon._id ? 2 : 1,
                              backgroundColor: isDisabled ? '#f5f5f5' : (selectedAddOn === addon._id ? '#f6ffed' : '#fff'),
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              opacity: isDisabled ? 0.6 : 1
                            }}
                            onClick={() => !isDisabled && handleSelectAddOn(addon._id)}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                              {canSelectAddOn && (
                                <Radio value={addon._id} disabled={isDisabled} />
                              )}
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                  <Title level={4} style={{ marginBottom: 0, color: '#2c5f4f' }}>
                                    {addon.name}
                                  </Title>
                                  {isIndicated && (
                                    <Tag color="success" icon={<CheckCircleOutlined />}>
                                      Đã chỉ định
                                    </Tag>
                                  )}
                                </div>

                                {addon.description && (
                                  <Paragraph 
                                    type="secondary" 
                                    style={{ fontSize: 13, marginBottom: 16 }}
                                  >
                                    {addon.description}
                                  </Paragraph>
                                )}

                                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                  <Space>
                                    <DollarOutlined style={{ color: '#d4860f' }} />
                                    <Text strong style={{ fontSize: 16, color: '#d4860f' }}>
                                      {addon.effectivePrice 
                                        ? addon.effectivePrice.toLocaleString('vi-VN')
                                        : addon.price?.toLocaleString('vi-VN')} VNĐ
                                    </Text>
                                    <Text type="secondary">/ {addon.unit}</Text>
                                    {addon.isPriceModified && (
                                      <Tag color="red" style={{ fontSize: 10 }}>🎉 Khuyến mãi</Tag>
                                    )}
                                  </Space>

                                  <Space>
                                    <ClockCircleOutlined style={{ color: '#1890ff' }} />
                                    <Text type="secondary">
                                      Thời gian: ~{addon.durationMinutes} phút
                                    </Text>
                                  </Space>
                                </Space>
                              </div>
                            </div>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </Radio.Group>

                {!canSelectAddOn && (
                  <Alert
                    type="warning"
                    showIcon
                    message="Lưu ý"
                    description="Dịch vụ này yêu cầu khám trước. Vui lòng đặt lịch khám để được nha sỹ tư vấn và chỉ định gói điều trị phù hợp."
                    style={{ marginTop: 24 }}
                  />
                )}
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
                  style={{ 
                    backgroundColor: '#2c5f4f',
                    borderColor: '#2c5f4f',
                    borderRadius: 6
                  }}
                >
                  Tiếp tục đặt lịch
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

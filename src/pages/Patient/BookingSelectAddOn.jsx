import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Spin
} from 'antd';
import { 
  ArrowLeftOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import recordService from '../../services/recordService';
import './BookingSelectAddOn.css';
import { COLOR_BRAND_NAME } from '../../utils/common-colors';
import ToothIcon from "../../assets/icon/tooth-icon.png"

const { Title, Text, Paragraph } = Typography;

const BookingSelectAddOn = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(null);
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

    // XÓA addon cũ khi vào trang này (user có thể chọn lại hoặc không chọn)
    localStorage.removeItem('booking_serviceAddOn');

    // Nếu service không có addons, skip sang màn chọn bác sĩ
    if (!serviceData.serviceAddOns || serviceData.serviceAddOns.length === 0) {
      message.info('Dịch vụ này không có gói phụ, chuyển sang bước tiếp theo');
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

  const handleSelectAddOn = (addon) => {
    if (!canSelectAddOn) {
      message.warning('Bạn cần khám trước để được chỉ định gói điều trị phù hợp');
      return;
    }
    
    // Only allow selecting the indicated addon if there's an indication
    if (treatmentIndications.length > 0 && treatmentIndications[0].serviceAddOnId) {
      if (addon._id !== treatmentIndications[0].serviceAddOnId) {
        message.warning('Bạn chỉ được chọn gói điều trị đã được chỉ định');
        return;
      }
    }
    
    // Save selected addon and navigate immediately
    localStorage.setItem('booking_serviceAddOn', JSON.stringify(addon));
    message.success(`Đã chọn gói: ${addon.name}`);
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

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
        <div className="breadcrumb-container-booking-select-service-addon"> 
        <Space split=">">
            <a href="/patient/booking/select-service">Trang chủ</a>
            <a href="/patient/booking">Đặt lịch khám</a>
            <a href="/patient/booking/select-service">Chọn dịch vụ</a>
            <Text>Chọn gói dịch vụ</Text>
          </Space>
          </div>
          <div className="booking-card-custom">
          <div className='booking-card-header'>
            <h5>
              Danh sách gói dịch vụ: <span style={{fontSize:24}}>{service.name}</span>
            </h5>
          </div>
          <div style={{padding:'20px'}}>
            {/* Important Notifications */}
            {service.requireExamFirst && (
              <Alert
                type="warning"
                showIcon
                message="Dịch vụ này yêu cầu khám trước khi điều trị"
                style={{ marginBottom: 16 }}
              />
            )}
            
            {treatmentIndications.length > 0 && treatmentIndications[0].serviceAddOnId && (
              <Alert
                type="success"
                showIcon
                icon={<FileTextOutlined />}
                message={
                  <span>
                    Bạn đã được chỉ định gói: <strong>{treatmentIndications[0].serviceAddOnName}</strong>
                  </span>
                }
                style={{ marginBottom: 16 }}
              />
            )}
            
            {service.requireExamFirst && treatmentIndications.length === 0 && (
              <Alert
                type="info"
                showIcon
                message="Bạn cần khám trước để được nha sỹ chỉ định gói điều trị phù hợp."
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Service AddOns List */}
            {service.serviceAddOns && service.serviceAddOns.length > 0 ? (
              <div style={{ marginBottom: 32 }}>
                {canSelectAddOn ? (
                  <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 24, fontWeight: 500 }}>
                    {treatmentIndications.length > 0 && treatmentIndications[0].serviceAddOnId
                      ? 'Vui lòng xác nhận gói điều trị đã được chỉ định'
                      : 'Chọn gói dịch vụ phù hợp với nhu cầu của bạn'
                    }
                  </Paragraph>
                ) : (
                  <Paragraph type="warning" style={{ textAlign: 'center', marginBottom: 24, fontWeight: 500 }}>
                    Các gói dịch vụ chỉ để tham khảo. Bạn cần khám trước để được chỉ định gói phù hợp.
                  </Paragraph>
                )}

                <div style={{ 
                  maxHeight: '450px', 
                  overflowY: 'auto', 
                  paddingRight: '8px',
                  marginBottom: '16px'
                }}>
                  <Row gutter={[16, 16]}>
                    {service.serviceAddOns.filter(addon => addon.isActive).map((addon) => {
                      const isIndicated = treatmentIndications.some(ind => ind.serviceAddOnId === addon._id);
                      const isDisabled = !canSelectAddOn || 
                        (treatmentIndications.length > 0 && 
                         treatmentIndications[0].serviceAddOnId && 
                         treatmentIndications[0].serviceAddOnId !== addon._id);
                      
                      // Find active price schedule that is currently valid
                      const now = new Date();
                      const currentSchedule = addon.priceSchedules?.find(schedule => 
                        schedule.isActive && 
                        new Date(schedule.startDate) <= now && 
                        new Date(schedule.endDate) >= now
                      );
                      
                      return (
                        <Col xs={24} key={addon._id}>
                          <Card
                            className={`addon-card ${isDisabled ? 'disabled' : ''}`}
                            style={{
                              borderColor: isIndicated ? '#52c41a' : '#bfbfbf',
                              borderWidth: 2,
                              backgroundColor: isDisabled ? '#f5f5f5' : '#fff',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              opacity: isDisabled ? 0.6 : 1
                            }}
                            onClick={() => !isDisabled && handleSelectAddOn(addon)}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <img src={ToothIcon}/>
                                <h5 style={{ marginBottom: 0, color: '#BE8600', fontSize:16, fontWeight:600 }}>
                                  {addon.name}
                                </h5>
                                {isIndicated && (
                                  <Tag color="success" icon={<CheckCircleOutlined />}>
                                    Đã chỉ định
                                  </Tag>
                                )}
                              </div>

                              <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 12 }}>
                                {/* Price Display */}
                                {currentSchedule ? (
                                  <div>
                                    <Space align="center" wrap>
                                      <DollarOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
                                      <Text 
                                        delete 
                                        type="secondary" 
                                        style={{ fontSize: 14 }}
                                      >
                                        {addon.basePrice?.toLocaleString('vi-VN')} VNĐ
                                      </Text>
                                      <Text 
                                        strong 
                                        style={{ fontSize: 15, color: '#ff4d4f' }}
                                      >
                                        {currentSchedule.price.toLocaleString('vi-VN')} VNĐ
                                      </Text>
                                      <Text type="secondary">/ {addon.unit}</Text>
                                      <Tag color="red" style={{ fontSize: 12 }}>Khuyến mãi</Tag>
                                    </Space>
                                    <p
                                      style={{ 
                                        fontSize: 12, 
                                        display: 'block',
                                        marginTop: 4,
                                        marginLeft: 24,
                                        fontStyle:'italic'
                                      }}
                                    >
                                      Áp dụng từ {new Date(currentSchedule.startDate).toLocaleDateString('vi-VN')} đến {new Date(currentSchedule.endDate).toLocaleDateString('vi-VN')}
                                    </p>
                                  </div>
                                ) : (
                                  <Space>
                                    <DollarOutlined style={{ color: '#d4860f' }} />
                                    <Text strong style={{ fontSize: 15, color: '#d4860f' }}>
                                      {addon.effectivePrice 
                                        ? addon.effectivePrice.toLocaleString('vi-VN')
                                        : addon.price?.toLocaleString('vi-VN')} VNĐ
                                    </Text>
                                    <Text type="secondary">/ {addon.unit}</Text>
                                  </Space>
                                )}

                                <Space>
                                  <ClockCircleOutlined style={{ color: '#1890ff' }} />
                                  <Text type="secondary">
                                    Thời gian: ~{addon.durationMinutes} phút
                                  </Text>
                                </Space>
                              </Space>

                              <div style={{ textAlign: 'right', marginTop: 8 }}>
                                <Link
                                  to={`/patient/services/pl/${encodeURIComponent(service.name)}/addons/${encodeURIComponent(addon.name)}/detail`}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ 
                                    color: '#1890ff',
                                    textDecoration: 'none',
                                    fontSize: 14
                                  }}
                                >
                                  Xem chi tiết
                                </Link>
                              </div>
                            </div>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </div>

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
              <Button 
                size="large" 
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                style={{ borderRadius: 6 }}
              >
                Quay lại
              </Button>
              <Button
              size='large'
              icon={<ArrowRightOutlined />}
              onClick={()=>navigate('/patient/booking/select-dentist')}
              style={{marginLeft:10}}
              >
                Tiếp theo
              </Button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSelectAddOn;

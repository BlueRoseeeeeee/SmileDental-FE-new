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
  Spin,
  Tooltip
} from 'antd';
import { 
  ArrowLeftOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import recordService from '../../services/recordService';
import { getPriceScheduleInfo, formatDateRange, formatPrice } from '../../utils/priceScheduleUtils';
import './BookingSelectAddOn.css';
import { COLOR_BRAND_NAME } from '../../utils/common-colors';
import ToothIcon from "../../assets/icon/tooth-icon.png"

const { Title, Text, Paragraph } = Typography;

// Component to display price with schedule information
const PriceDisplay = ({ addon }) => {
  const priceInfo = getPriceScheduleInfo(addon.priceSchedules, addon.price);
  const { activeSchedule, upcomingSchedules, effectivePrice, hasActiveSchedule, hasUpcomingSchedules } = priceInfo;

  return (
    <div className="price-display-container">
      {/* Active schedule with discounted price */}
      {hasActiveSchedule && (
        <div className="price-active-schedule">
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Space align="center">
              <DollarOutlined style={{ color: '#ff4d4f' }} />
              <Text delete type="secondary" style={{ fontSize: 14 }}>
                {formatPrice(addon.price)}
              </Text>
            </Space>
            <Space align="center">
              <Text strong style={{ fontSize: 16, color: '#ff4d4f' }}>
                {formatPrice(activeSchedule.price)}
              </Text>
              <Tag color="red" style={{ margin: 0 }}>
                Đang giảm giá
              </Tag>
            </Space>
            <Space align="center" size={4}>
              <CalendarOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatDateRange(activeSchedule.startDate, activeSchedule.endDate)}
              </Text>
            </Space>
            {activeSchedule.reason && (
              <Text type="secondary" italic style={{ fontSize: 12 }}>
                {activeSchedule.reason}
              </Text>
            )}
          </Space>
        </div>
      )}

      {/* Normal price (no active schedule) */}
      {!hasActiveSchedule && (
        <Space align="center">
          <DollarOutlined style={{ color: '#d4860f' }} />
          <Text strong style={{ fontSize: 16, color: '#d4860f' }}>
            {formatPrice(addon.price)}
          </Text>
          <Text type="secondary">/ {addon.unit}</Text>
        </Space>
      )}

      {/* Upcoming schedules */}
      {hasUpcomingSchedules && (
        <div className="upcoming-schedules" style={{ marginTop: 8 }}>
          <div style={{ 
            background: '#e6f7ff', 
            border: '1px solid #91d5ff',
            borderRadius: 6,
            padding: '6px 10px',
            display: 'inline-block',
            maxWidth: '100%'
          }}>
            <Space size={4} wrap align="start" style={{ width: '100%' }}>
              <Space align="center" size={4} style={{ flexShrink: 0 }}>
                <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                <Text strong style={{ fontSize: 12, color: '#1890ff', whiteSpace: 'nowrap' }}>
                  Lịch giá sắp tới:
                </Text>
              </Space>
              
              {upcomingSchedules.slice(0, 2).map((schedule, idx) => (
                <React.Fragment key={schedule._id || idx}>
                  <Space size={4} style={{ flexShrink: 0 }}>
                    <Text style={{ fontSize: 12, color: '#1890ff', fontWeight: 600 }}>
                      {formatPrice(schedule.price)}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                      ({formatDateRange(schedule.startDate, schedule.endDate)})
                    </Text>
                  </Space>
                  {schedule.reason && (
                    <Text type="secondary" italic style={{ fontSize: 11, width: '100%' }}>
                      {schedule.reason}
                    </Text>
                  )}
                </React.Fragment>
              ))}
              
              {upcomingSchedules.length > 2 && (
                <Text type="secondary" style={{ fontSize: 11, fontStyle: 'italic' }}>
                  +{upcomingSchedules.length - 2} lịch giá khác...
                </Text>
              )}
            </Space>
          </div>
        </div>
      )}
    </div>
  );
};

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
    localStorage.removeItem('booking_recordId');

    // Nếu service không có addons, skip sang màn chọn bác sĩ
    if (!serviceData.serviceAddOns || serviceData.serviceAddOns.length === 0) {
      message.info('Dịch vụ này không có gói phụ, chuyển sang bước tiếp theo');
      setTimeout(() => {
        navigate('/patient/booking/select-dentist');
      }, 1000);
      return;
    }

    // 🆕 Kiểm tra xem có addon active nào không
    const activeAddons = serviceData.serviceAddOns.filter(addon => addon.isActive === true);
    if (activeAddons.length === 0) {
      message.info('Hiện tại không có gói dịch vụ phụ nào khả dụng, chuyển sang bước tiếp theo');
      setTimeout(() => {
        navigate('/patient/booking/select-dentist');
      }, 1000);
      return;
    }

    // 🆕 Logic mới: Phân biệt dịch vụ exam và treatment
    // - Dịch vụ EXAM (type = 'exam') → CHO PHÉP chọn addon tự do
    // - Dịch vụ TREATMENT (type = 'treatment') → PHẢI có chỉ định mới được chọn addon
    
    // Kiểm tra loại dịch vụ
    if (serviceData.type === 'treatment') {
      // ===== DỊCH VỤ TREATMENT =====
      // Bắt buộc phải có chỉ định từ bác sĩ mới được chọn addon
      if (user) {
        setLoading(true);
        try {
          console.log('🔍 [TREATMENT] Checking treatment indications for patient:', user._id, 'service:', serviceData._id);
          
          const response = await recordService.getTreatmentIndications(user._id, serviceData._id);
          const indications = response.data || [];
          
          console.log('✅ Treatment indications found:', indications);
          setTreatmentIndications(indications);
          
          // Chỉ cho phép chọn addon nếu có chỉ định cụ thể
          if (indications.length > 0 && indications[0].serviceAddOnId) {
            setCanSelectAddOn(true);
            console.log('✅ [TREATMENT] Can select addon (from indication):', indications[0].serviceAddOnName);
          } else {
            // Không có chỉ định → chỉ cho XEM, không cho chọn
            setCanSelectAddOn(false);
            console.log('⚠️ [TREATMENT] No indication found - can only view addons, cannot select');
          }
        } catch (error) {
          console.error('❌ Error fetching treatment indications:', error);
          setCanSelectAddOn(false);
        } finally {
          setLoading(false);
        }
      } else {
        // User chưa login nhưng là dịch vụ treatment
        setCanSelectAddOn(false);
        console.log('⚠️ [TREATMENT] User not logged in - can only view addons');
      }
    } else {
      // ===== DỊCH VỤ EXAM =====
      // Cho phép chọn addon tự do
      setCanSelectAddOn(true);
      console.log('✅ [EXAM] Service is exam type - can select any addon freely');
    }
  };

  const handleSelectAddOn = (addon) => {
    if (!canSelectAddOn) {
      // 🆕 Thông báo rõ ràng hơn dựa vào loại dịch vụ
      if (service.type === 'treatment') {
        message.warning('Dịch vụ điều trị yêu cầu phải có chỉ định từ bác sĩ. Vui lòng đặt lịch khám trước.');
      } else {
        message.warning('Vui lòng đăng nhập để đặt lịch khám');
      }
      return;
    }
    
    // 🆕 Chỉ kiểm tra chỉ định nếu là TREATMENT và có chỉ định
    if (service.type === 'treatment' && treatmentIndications.length > 0) {
      // Check if this addon is in the list of indicated addons
      const isIndicatedAddon = treatmentIndications.some(ind => ind.serviceAddOnId === addon._id);
      
      if (!isIndicatedAddon) {
        message.warning('Bạn chỉ được chọn các gói điều trị đã được chỉ định');
        return;
      }
    }
    
    // Save selected addon and navigate immediately
    localStorage.setItem('booking_serviceAddOn', JSON.stringify(addon));
    localStorage.setItem('booking_serviceAddOn_userSelected', 'true'); // 🆕 Flag: user explicitly selected this addon
    
    // 🆕 Save recordId if this addon is from a treatment indication
    const indication = treatmentIndications.find(ind => ind.serviceAddOnId === addon._id);
    if (indication) {
      localStorage.setItem('booking_recordId', indication.recordId);
      console.log('✅ Saved recordId from indication:', indication.recordId);
    } else {
      // Clear recordId if not from indication
      localStorage.removeItem('booking_recordId');
    }
    
    message.success(`Đã chọn gói: ${addon.name}`);
    navigate('/patient/booking/select-dentist');
  };

  const handleBack = () => {
    navigate('/patient/booking/select-service');
  };

  // 🆕 Handle skip addon selection
  const handleSkipAddon = () => {
    // Nếu có chỉ định addon cụ thể → BẮT BUỘC phải chọn, không được bỏ qua
    if (treatmentIndications.length > 0 && treatmentIndications.some(ind => ind.serviceAddOnId)) {
      message.error('Bạn phải chọn một trong các gói dịch vụ đã được chỉ định để tiếp tục');
      return;
    }
    
    // ✅ REMOVED: Không chặn treatment không có chỉ định
    // Cho phép user tiếp tục đặt lịch ngay cả khi chưa có chỉ định
    // User sẽ cần đặt lịch khám trước để được chỉ định sau
    
    // 🆕 If service has addons, save the longest one for slot grouping
    if (service.serviceAddOns && service.serviceAddOns.length > 0) {
      // 🔥 Filter only active addons
      const activeAddons = service.serviceAddOns.filter(addon => addon.isActive === true);
      
      if (activeAddons.length > 0) {
        const longestAddon = activeAddons.reduce((longest, addon) => {
          return (addon.durationMinutes > longest.durationMinutes) ? addon : longest;
        }, activeAddons[0]);
        
        localStorage.setItem('booking_serviceAddOn', JSON.stringify(longestAddon));
        localStorage.setItem('booking_serviceAddOn_userSelected', 'false'); // 🆕 Flag: auto-selected for slot grouping only
        console.log('⏭️ No addon selected → Using longest ACTIVE addon for slot grouping:', longestAddon.name, longestAddon.durationMinutes, 'min');
      } else {
        // No active addons, clear addon selection
        localStorage.removeItem('booking_serviceAddOn');
        localStorage.removeItem('booking_serviceAddOn_userSelected');
        console.log('⚠️ No active addons available');
      }
    } else {
      // Clear addon selection if no addons exist
      localStorage.removeItem('booking_serviceAddOn');
      localStorage.removeItem('booking_serviceAddOn_userSelected');
    }
    
    localStorage.removeItem('booking_recordId');
    
    navigate('/patient/booking/select-dentist');
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
            {service.type === 'treatment' && (
              <Alert
                type="warning"
                showIcon
                message="Dịch vụ điều trị yêu cầu phải có chỉ định từ bác sĩ"
                description="Vui lòng đặt lịch khám để được bác sĩ đánh giá và chỉ định gói điều trị phù hợp"
                style={{ marginBottom: 16 }}
              />
            )}
            
            {treatmentIndications.length > 0 && treatmentIndications.some(ind => ind.serviceAddOnId) && (
              <Alert
                type="success"
                showIcon
                icon={<FileTextOutlined />}
                message={
                  treatmentIndications.length === 1 ? (
                    <span>
                      Bạn đã được chỉ định gói: <strong>{treatmentIndications[0].serviceAddOnName}</strong>
                    </span>
                  ) : (
                    <span>
                      Bạn đã được chỉ định <strong>{treatmentIndications.length} gói</strong>: {treatmentIndications.map(ind => ind.serviceAddOnName).join(', ')}
                    </span>
                  )
                }
                style={{ marginBottom: 16 }}
              />
            )}
            
            {/* 🆕 Chỉ hiển thị cảnh báo nếu là TREATMENT và không có chỉ định */}
            {service.type === 'treatment' && treatmentIndications.length === 0 && (
              <Alert
                type="info"
                showIcon
                message="Chưa có chỉ định điều trị"
                description="Bạn cần đặt lịch khám để được bác sĩ đánh giá và chỉ định gói điều trị phù hợp."
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
                    {/* 🆕 Thông báo khác nhau cho exam và treatment */}
                    {service.type === 'treatment'
                      ? 'Các gói dịch vụ chỉ để tham khảo. Dịch vụ điều trị yêu cầu phải có chỉ định từ bác sĩ.'
                      : 'Chọn gói dịch vụ phù hợp với nhu cầu của bạn'
                    }
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
                      // 🆕 Logic mới:
                      // - Nếu service là TREATMENT VÀ có chỉ định → chỉ enable addon được chỉ định
                      // - Nếu service là EXAM → enable tất cả addon
                      const isDisabled = !canSelectAddOn || 
                        (service.type === 'treatment' && treatmentIndications.length > 0 && !isIndicated);
                      
                      
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
                                {/* Price display with schedule information */}
                                <PriceDisplay addon={addon} />

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
              
              {/* Chỉ hiển thị button "Bỏ qua/Tiếp theo" nếu KHÔNG có chỉ định addon cụ thể */}
              {!(treatmentIndications.length > 0 && treatmentIndications.some(ind => ind.serviceAddOnId)) && (
                <Button
                  size='large'
                  type={canSelectAddOn ? 'default' : 'primary'}
                  icon={<ArrowRightOutlined />}
                  onClick={handleSkipAddon}
                  style={{marginLeft:10, borderRadius: 6}}
                >
                  {canSelectAddOn ? 'Bỏ qua' : 'Tiếp theo'}
                </Button>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSelectAddOn;

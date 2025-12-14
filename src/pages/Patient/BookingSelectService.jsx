import React, { useState, useEffect, useMemo } from 'react';
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
  Tag,
  message,
  Select,
  Radio
} from 'antd';
import { 
  SearchOutlined, 
  InfoCircleOutlined,
  StarFilled
} from '@ant-design/icons';
import { servicesService, recordService } from '../../services';
import { useAuth } from '../../hooks/useAuth';
import './BookingSelectService.css';
import { COLOR_BRAND_NAME } from '../../utils/common-colors.js';

const { Title, Text, Paragraph } = Typography;
import toothIcon from '../../assets/icon/tooth-icon.png';

const BookingSelectService = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // Get current user and auth status
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [unusedServices, setUnusedServices] = useState([]); // Services from doctor recommendations (exam records)
  const [patientRecords, setPatientRecords] = useState([]); // All exam records with unused indications
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'Khám', 'Điều trị'
  const [serviceSource, setServiceSource] = useState('all'); // 'all' or 'recommended'

  // ✅ Lọc dịch vụ chỉ định thực sự còn active (loại bỏ những dịch vụ đã bị tắt isActive)
  const activeUnusedServices = useMemo(() => {
    if (!unusedServices.length || !services.length) return [];
    return unusedServices.filter(us => 
      services.some(s => s._id.toString() === us.serviceId.toString())
    );
  }, [unusedServices, services]);
  
  const activeUnusedServicesCount = activeUnusedServices.length;

  useEffect(() => {
    fetchServices();
    // Only fetch unused services if user is authenticated and has an ID
    if (isAuthenticated && user && user._id) {
      fetchUnusedServices();
    }
  }, [user, isAuthenticated]);

  // ✅ Re-apply filters khi services hoặc unusedServices thay đổi
  useEffect(() => {
    if (services.length > 0) {
      console.log('🔄 Re-applying filters due to data change:', {
        servicesCount: services.length,
        unusedServicesCount: unusedServices.length,
        activeUnusedCount: activeUnusedServices.length
      });
      applyFilters(searchValue, selectedType, serviceSource, services, unusedServices);
    }
  }, [services, unusedServices]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      
      const response = await servicesService.getAllServices();
      console.log('📋 Services API response:', response);
      
      // API returns: { services: [...], total, page, limit, totalPages }
      if (response.services && Array.isArray(response.services)) {
        // ✅ Keep all services (including inactive ones for recommended services)
        const allServices = response.services;
        setServices(allServices);
        applyFilters(searchValue, selectedType, serviceSource, allServices, unusedServices);
        
        if (allServices.length === 0) {
          message.warning('Hiện tại chưa có dịch vụ nào khả dụng');
        }
      } else {
        console.error('Invalid API response format:', response);
        message.error('Không thể tải danh sách dịch vụ');
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
        const unusedData = response.data;
        setUnusedServices(unusedData);
        
        // ⭐ Re-apply filters with new unused services data
        if (services.length > 0) {
          applyFilters(searchValue, selectedType, serviceSource, services, unusedData);
        }
        
        // Also fetch full records to get recordId for each service
        const recordsResponse = await recordService.getRecordsByPatient(user._id, 100);
        console.log('📋 Patient exam records:', recordsResponse);
        
        if (recordsResponse.success && recordsResponse.data) {
          // Filter only exam records with unused indications
          const examRecordsWithUnused = recordsResponse.data.filter(record => 
            record.type === 'exam' && 
            !record.hasBeenUsed &&
            record.treatmentIndications && 
            record.treatmentIndications.length > 0 &&
            record.treatmentIndications.some(ind => !ind.used)
          );
          setPatientRecords(examRecordsWithUnused);
          console.log('📋 Exam records with unused indications:', examRecordsWithUnused);
        }
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
    
    console.log('🔍 applyFilters called:', {
      source,
      allServicesCount: allServices.length,
      recommendedServicesCount: recommendedServices.length,
      recommendedServices: recommendedServices.map(s => ({ serviceId: s.serviceId, serviceName: s.serviceName })),
      allServiceIds: allServices.map(s => s._id)
    });

    // 🆕 Tạo set các ID dịch vụ chỉ định để bỏ qua filter addon cho chúng
    const recommendedIds = new Set(recommendedServices.map(s => s.serviceId.toString()));

    // ✅ Lọc bỏ dịch vụ không active, TRỪ dịch vụ chỉ định (giữ lại để hiển thị với trạng thái disabled)
    filtered = filtered.filter(service => {
      // Nếu là dịch vụ chỉ định -> giữ lại dù isActive = false
      if (recommendedIds.has(service._id.toString())) {
        return true;
      }
      // Dịch vụ thường -> chỉ giữ những dịch vụ active
      return service.isActive === true;
    });

    // 🆕 Lọc bỏ các service có serviceAddOns nhưng KHÔNG có addon nào active
    // ⚠️ NGOẠI TRỪ dịch vụ chỉ định - không filter addon cho chúng
    filtered = filtered.filter(service => {
      // ✅ Nếu là dịch vụ chỉ định -> KHÔNG filter theo addon, giữ lại
      if (recommendedIds.has(service._id.toString())) {
        return true;
      }
      
      // Nếu service không có addons -> OK, giữ lại
      if (!service.serviceAddOns || service.serviceAddOns.length === 0) {
        return true;
      }
      
      // Nếu có addons -> phải có ít nhất 1 addon isActive = true
      const hasActiveAddons = service.serviceAddOns.some(addon => addon.isActive === true);
      return hasActiveAddons;
    });
    
    console.log('🔍 After addon filter:', filtered.length);

    // 🆕 Filter by source (normal or recommended only)
    if (source === 'recommended' && recommendedServices.length > 0) {
      // Chỉ hiển thị dịch vụ được chỉ định
      console.log('🌟 recommendedIds:', [...recommendedIds]);
      filtered = filtered.filter(service => {
        const match = recommendedIds.has(service._id.toString());
        console.log(`  Service ${service.name} (${service._id}): match=${match}`);
        return match;
      });
      console.log(`🌟 Showing ONLY recommended services: ${filtered.length}`);
    } else if (source === 'all') {
      // 🆕 Dịch vụ thường: CHỈ hiển thị dịch vụ KHÔNG yêu cầu khám trước
      // KHÔNG bao gồm dịch vụ được chễ định
      filtered = filtered.filter(service => {
        // Loại bỏ dịch vụ chỉ định
        if (recommendedIds.has(service._id.toString())) {
          return false;
        }
        // Chỉ lấy dịch vụ không yêu cầu khám trước
        return !service.requireExamFirst;
      });
      console.log(`📊 Showing normal services (non-exam, excluding recommended): ${filtered.length}`);
    }

    // Filter by type
    if (type !== 'all') {
      // Map Vietnamese thành English để so sánh
      const typeMap = {
        'Khám': 'exam',
        'Điều trị': 'treatment'
      };
      const englishType = typeMap[type] || type;
      filtered = filtered.filter(service => service.type === englishType);
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

  // ⭐ Get recordId for a service (find the exam record that has unused indication for this service)
  const getRecordIdForService = (serviceId) => {
    for (const record of patientRecords) {
      const hasIndicationForService = record.treatmentIndications?.some(
        ind => ind.serviceId.toString() === serviceId.toString() && !ind.used
      );
      if (hasIndicationForService) {
        return record._id;
      }
    }
    return null;
  };

  const handleSelectService = (service) => {
    console.log('🎯 handleSelectService called:', {
      serviceName: service.name,
      serviceId: service._id,
      isRecommended: isRecommended(service._id),
      hasAddOns: service.serviceAddOns?.length > 0,
      addOnsCount: service.serviceAddOns?.length,
      addOns: service.serviceAddOns
    });
    
    const isRecommendedService = isRecommended(service._id);
    
    // 🆕 Kiểm tra nếu có serviceAddOns nhưng KHÔNG có addon nào isActive
    // ⚠️ BỎ QUA kiểm tra này cho dịch vụ chỉ định (giống logic filter)
    if (!isRecommendedService && service.serviceAddOns && service.serviceAddOns.length > 0) {
      const hasActiveAddons = service.serviceAddOns.some(addon => addon.isActive === true);
      console.log('🔍 Checking addons (not recommended service):', {
        totalAddons: service.serviceAddOns.length,
        hasActiveAddons: hasActiveAddons,
        addons: service.serviceAddOns.map(a => ({ name: a.name, isActive: a.isActive }))
      });
      
      if (!hasActiveAddons) {
        console.log('❌ No active addons - blocking navigation');
        message.warning('Dịch vụ này hiện không có gói phụ khả dụng. Vui lòng chọn dịch vụ khác.');
        return;
      }
    } else if (isRecommendedService) {
      console.log('✅ Recommended service - skipping addon check');
    }
    
    console.log('✅ Passed addon check, saving to localStorage...');
    
    // Lưu service vào localStorage
    localStorage.setItem('booking_service', JSON.stringify(service));
    
    //  XÓA addon cũ (user sẽ chọn lại ở trang tiếp theo nếu service có addon)
    localStorage.removeItem('booking_serviceAddOn');
    localStorage.removeItem('booking_serviceAddOn_userSelected'); // 🆕 Clear user selection flag
    
    // ⭐ If service requires exam first, save the recordId to update hasBeenUsed later
    if (service.requireExamFirst) {
      const recordId = getRecordIdForService(service._id);
      if (recordId) {
        localStorage.setItem('booking_examRecordId', recordId);
        console.log('💾 Saved exam record ID for later update:', recordId);
      } else {
        console.warn('⚠️ Service requires exam first but no record found!');
      }
    } else {
      // Clear any previous recordId
      localStorage.removeItem('booking_examRecordId');
    }
    
    // Nếu service có addons -> navigate đến select-addon
    // Nếu không có addons -> skip sang select-dentist
    if (service.serviceAddOns && service.serviceAddOns.length > 0) {
      console.log('🚀 Navigating to select-addon...');
      navigate('/patient/booking/select-addon');
    } else {
      console.log('🚀 Navigating to select-dentist...');
      navigate('/patient/booking/select-dentist');
    }
  };

  // Hàm dịch type sang tiếng Việt
  const translateServiceType = (type) => {
    const typeMap = {
      'exam': 'Khám',
      'treatment': 'Điều trị',
    };
    return typeMap[type] || type;
  };

  return (
    <div className="booking-select-service-page">
      {/* Main Content */}
      <div className="main-content">
        <div className="container">
        <div className="breadcrumb-container-booking-select-service">
        <Space split=">">
          <a href="/patient/booking/select-service">Trang chủ</a>
          <a href="/patient/booking">Đặt lịch khám</a>
          <Text>Chọn dịch vụ</Text>
        </Space>
      </div>
          <div className="booking-card">
          <div className="booking-card-header">
            <h5 >
              Vui lòng chọn dịch vụ
            </h5>
            </div>
            <div style={{padding:'20px'}}>
            {/* ✅ Service Source Filter */}
            {activeUnusedServicesCount > 0 && (
              <Row justify="center" style={{ marginBottom: 24 }}>
                <Radio.Group 
                  value={serviceSource} 
                  onChange={handleSourceChange}
                  buttonStyle="solid"
                  size="large"
                >
                  <Radio.Button value="all">
                    Dịch vụ thường
                  </Radio.Button>
                  <Radio.Button value="recommended">
                    <StarFilled style={{ color: '#faad14' }} /> Dịch vụ chỉ định ({activeUnusedServicesCount})
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
                />
              </Col>
              <Col xs={24} md={8}>
                <Select
                  size="large"
                  value={selectedType}
                  onChange={handleTypeChange}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'all', label: 'Tất cả loại dịch vụ' },
                    { value: 'Khám', label: 'Khám' },
                    { value: 'Điều trị', label: 'Điều trị' }
                  ]}
                />
              </Col>
            </Row>

            {/* Services List */}
            <Spin spinning={loading}>
              {filteredServices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Paragraph type="secondary">
                    {searchValue ? 'Không tìm thấy dịch vụ phù hợp' : 'Chưa có dịch vụ nào'}
                  </Paragraph>
                </div>
              ) : (
                <div style={{ 
                  maxHeight: '450px', 
                  overflowY: 'auto', 
                  paddingRight: '8px',
                  marginBottom: '16px'
                }}>
                  <Row gutter={[16, 16]}>
                    {filteredServices.map((service, index) => {
                      const isRecommendedService = isRecommended(service._id);
                      
                      // ✅ Dịch vụ chỉ định bị vô hiệu hóa nếu:
                      // 1. Service bị tắt (isActive: false)
                      // 2. HOẶC tất cả addon đều bị tắt (không có addon nào active)
                      const hasNoActiveAddons = service.serviceAddOns?.length > 0 && 
                                               !service.serviceAddOns.some(addon => addon.isActive);
                      const isInactiveRecommended = isRecommendedService && (!service.isActive || hasNoActiveAddons);
                      
                      // Debug log
                      if (isRecommendedService) {
                        console.log('🔍 Recommended Service Debug:', {
                          serviceName: service.name,
                          serviceId: service._id,
                          isActive: service.isActive,
                          hasAddons: service.serviceAddOns?.length > 0,
                          hasNoActiveAddons: hasNoActiveAddons,
                          isRecommended: isRecommendedService,
                          isInactiveRecommended: isInactiveRecommended,
                          unusedServices: unusedServices
                        });
                      }
                      
                      return (
                        <Col xs={24} key={service._id}>
                          <Card
                            hoverable={!isInactiveRecommended}
                            className="service-item-card"
                            onClick={() => {
                              console.log('🖱️ Clicked service:', {
                                serviceName: service.name,
                                isActive: service.isActive,
                                isRecommended: isRecommended(service._id),
                                isInactiveRecommended: isInactiveRecommended,
                                willNavigate: !isInactiveRecommended
                              });
                              if (!isInactiveRecommended) {
                                handleSelectService(service);
                              } else {
                                console.log('❌ Click blocked - service is inactive recommended');
                                message.warning('Dịch vụ này đang ngưng, vui lòng liên hệ phòng khám');
                              }
                            }}
                            style={{
                              opacity: isInactiveRecommended ? 0.5 : 1,
                              cursor: isInactiveRecommended ? 'not-allowed' : 'pointer',
                              backgroundColor: isInactiveRecommended ? '#f0f0f0' : 'white',
                              border: isInactiveRecommended ? '3px solid #ff4d4f' : undefined,
                              position: isInactiveRecommended ? 'relative' : undefined
                            }}
                          >
                            {/* Overlay mờ đỏ - CHỈ hiển thị khi inactive */}
                            {isInactiveRecommended && (
                              <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(255, 77, 79, 0.08)',
                                pointerEvents: 'none',
                                zIndex: 0
                              }} />
                            )}
                            <Space direction="vertical" size={8} style={{ width: '100%', position: 'relative' }}>
                              {/* ⚠️ THÔNG BÁO ĐỎ TO VÀ RÕ NGAY ĐẦU - CHỈ hiển thị khi inactive */}
                              {isInactiveRecommended && (
                                <div style={{ 
                                  padding: '14px 16px',
                                  backgroundColor: '#ff4d4f',
                                  borderRadius: '8px',
                                  marginBottom: '8px',
                                  boxShadow: '0 4px 12px rgba(255, 77, 79, 0.4)'
                                }}>
                                  <Text strong style={{ fontSize: 15, color: '#fff', display: 'flex', alignItems: 'center' }}>
                                    <InfoCircleOutlined style={{ marginRight: 8, fontSize: 18 }} />
                                    ⚠️ {!service.isActive 
                                      ? 'DỊCH VỤ ĐANG NGƯNG - VUI LÒNG LIÊN HỆ PHÒNG KHÁM ĐỂ ĐƯỢC HỖ TRỢ'
                                      : 'TẤT CẢ GÓI DỊCH VỤ ĐANG NGƯNG - VUI LÒNG LIÊN HỆ PHÒNG KHÁM'}
                                  </Text>
                                </div>
                              )}
                              <Space>
                                <img 
                                  src={toothIcon} 
                                  alt="Service Icon" 
                                  style={{ 
                                    width: 24, 
                                    height: 24,
                                    filter: isInactiveRecommended ? 'grayscale(100%) opacity(0.5)' : 'none'
                                  }} 
                                />
                                <h5 style={{ 
                                  margin: 0, 
                                  fontSize: 18, 
                                  fontWeight: 700,
                                  color: isInactiveRecommended ? '#999' : 'inherit',
                                  textDecoration: isInactiveRecommended ? 'line-through' : 'none'
                                }}>
                                  {service.name}
                                </h5>
                                {service.type && (
                                  <Tag 
                                    color={translateServiceType(service.type) === 'Khám' ? 'blue' : 'green'}
                                    style={{ opacity: isInactiveRecommended ? 0.5 : 1 }}
                                  >
                                    {translateServiceType(service.type)}
                                  </Tag>
                                )}
                                {/* ✅ Recommended Badge */}
                                {isRecommendedService && (
                                  <Tag color="gold" icon={<StarFilled />}>
                                    Chỉ định nha sĩ
                                  </Tag>
                                )}
                                {/* ⚠️ Inactive Warning Badge */}
                                {isInactiveRecommended && (
                                  <Tag 
                                    color="red" 
                                    icon={<InfoCircleOutlined />}
                                    style={{ 
                                      fontSize: 13,
                                      fontWeight: 'bold',
                                      padding: '4px 10px'
                                    }}
                                  >
                                    ĐANG NGƯNG
                                  </Tag>
                                )}
                                <InfoCircleOutlined style={{ cursor: 'pointer', opacity: isInactiveRecommended ? 0.5 : 1 }} />
                              </Space>
                              {service.description && (
                                <div 
                                  dangerouslySetInnerHTML={{ __html: service.description }}
                                  style={{ 
                                    opacity: isInactiveRecommended ? 0.4 : 1,
                                    color: isInactiveRecommended ? '#999' : 'inherit'
                                  }}
                                />
                              )}
                              {service.serviceAddOns && service.serviceAddOns.length > 0 && (
                                <Text type="secondary" style={{ fontSize: 12, opacity: isInactiveRecommended ? 0.5 : 1 }}>
                                  {service.serviceAddOns.length} gói dịch vụ có sẵn
                                </Text>
                              )}
                            </Space>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              )}
            </Spin>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSelectService;

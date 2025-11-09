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

  useEffect(() => {
    fetchServices();
    // Only fetch unused services if user is authenticated and has an ID
    if (isAuthenticated && user && user._id) {
      fetchUnusedServices();
    }
  }, [user, isAuthenticated]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      
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

    // Filter by source (all or recommended only)
    if (source === 'recommended' && recommendedServices.length > 0) {
      const recommendedIds = new Set(recommendedServices.map(s => s.serviceId.toString()));
      filtered = filtered.filter(service => recommendedIds.has(service._id.toString()));
    }

    // ⭐ Filter services based on requireExamFirst
    if (isAuthenticated && user?._id) {
      filtered = filtered.filter(service => {
        // If service doesn't require exam first, always show it
        if (!service.requireExamFirst) {
          return true;
        }
        
        // If service requires exam first, check if patient has unused indication for it
        const hasUnusedIndication = unusedServices.some(
          unused => unused.serviceId.toString() === service._id.toString()
        );
        
        return hasUnusedIndication;
      });
    } else {
      // If not authenticated, only show services that don't require exam first
      filtered = filtered.filter(service => !service.requireExamFirst);
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
    // Lưu service vào localStorage
    localStorage.setItem('booking_service', JSON.stringify(service));
    
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
      navigate('/patient/booking/select-addon');
    } else {
      // Clear addon data
      localStorage.removeItem('booking_serviceAddOn');
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
      <div className="breadcrumb-container-booking-select-service">
        <Space split=">">
          <a href="/patient/booking/select-service">Trang chủ</a>
          <a href="/patient/booking">Đặt lịch khám</a>
          <Text>Chọn dịch vụ</Text>
        </Space>
      </div>
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
                    {filteredServices.map((service) => (
                      <Col xs={24} key={service._id}>
                        <Card
                          hoverable
                          className="service-item-card"
                          onClick={() => handleSelectService(service)}
                        >
                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <Space>
                              <h5 style={{ margin: 0, color: COLOR_BRAND_NAME, fontSize: 16, fontWeight:600 }}>
                                {service.name}
                              </h5>
                              {service.type && (
                                <Tag style={{fontSize: 10}} color={translateServiceType(service.type) === 'Khám' ? 'blue' : 'green'}>
                                  {translateServiceType(service.type)}
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
                              <div 
                                style={{ 
                                  fontSize: 13, 
                                  color: 'rgba(0, 0, 0, 0.45)',
                                  lineHeight: '1.5'
                                }}
                                dangerouslySetInnerHTML={{ __html: service.description }}
                              />
                            )}
                            {service.serviceAddOns && service.serviceAddOns.length > 0 && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {service.serviceAddOns.length} gói dịch vụ có sẵn
                              </Text>
                            )}
                          </Space>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </Spin>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingSelectService;

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
  Avatar,
  Rate,
  message
} from 'antd';
import { 
  SearchOutlined, 
  ArrowRightOutlined,
  UserOutlined,
  StarFilled,
  ArrowLeftOutlined
} from '@ant-design/icons';
import slotService from '../../services/slotService.js';
import recordService from '../../services/recordService.js';
import { mockDentists, mockServices } from '../../services/mockData.js';
import './BookingSelectDentist.css';

const { Title, Text, Paragraph } = Typography;

// Toggle this to use mock data for testing
const USE_MOCK_DATA = false;

const BookingSelectDentist = () => {
  const navigate = useNavigate();
  const [dentists, setDentists] = useState([]);
  const [filteredDentists, setFilteredDentists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [examDentistId, setExamDentistId] = useState(null); // 🆕 Dentist đã thực hiện khám

  useEffect(() => {
    // Pre-populate localStorage with mock data if using mocks
    if (USE_MOCK_DATA && !localStorage.getItem('booking_service')) {
      const mockService = mockServices[0]; // Use first service as default
      localStorage.setItem('booking_service', JSON.stringify(mockService));
    }

    // Lấy service đã chọn từ bước trước
    const service = localStorage.getItem('booking_service');
    const serviceAddOn = localStorage.getItem('booking_serviceAddOn');
    const recordId = localStorage.getItem('booking_recordId'); // 🆕 RecordId nếu có chỉ định
    
    if (!service) {
      navigate('/patient/booking/select-service');
      return;
    }
    
    const serviceData = JSON.parse(service);
    const serviceAddOnData = serviceAddOn ? JSON.parse(serviceAddOn) : null;
    
    // 🆕 Load exam dentist info from record if recordId exists
    if (recordId) {
      loadExamDentistFromRecord(recordId);
    }
    
    // 🆕 Calculate service duration:
    // - If serviceAddOn is selected (user chose specific addon) → use its duration
    // - Otherwise → use max duration from all service addons (or service default)
    let serviceDuration = 15; // Default
    
    if (serviceAddOnData?.durationMinutes) {
      // User đã chọn addon cụ thể → dùng duration của addon đó
      serviceDuration = serviceAddOnData.durationMinutes;
      console.log('🎯 Using selected addon duration:', serviceDuration, 'minutes');
    } else if (serviceData.serviceAddOns && serviceData.serviceAddOns.length > 0) {
      // Không chọn addon → lấy duration dài nhất
      const maxDuration = Math.max(...serviceData.serviceAddOns.map(addon => addon.durationMinutes || 15));
      serviceDuration = maxDuration;
      console.log('🎯 Using max addon duration:', serviceDuration, 'minutes (from', serviceData.serviceAddOns.length, 'addons)');
    } else if (serviceData.durationMinutes) {
      // Fallback to service default duration
      serviceDuration = serviceData.durationMinutes;
      console.log('🎯 Using service default duration:', serviceDuration, 'minutes');
    }
    
    console.log('📦 Service:', serviceData.name, '| AddOn:', serviceAddOnData?.name || 'none');
    console.log('🏥 Service ID:', serviceData._id, '| Allowed RoomTypes:', serviceData.allowedRoomTypes);
    
    fetchDentists(serviceDuration, serviceData._id);
  }, [navigate]);

  // 🆕 Load dentist who performed the exam from record
  const loadExamDentistFromRecord = async (recordId) => {
    try {
      console.log('🔍 Loading exam dentist from record:', recordId);
      const response = await recordService.getRecordById(recordId);
      
      if (response.success && response.data && response.data.dentistId) {
        setExamDentistId(response.data.dentistId);
        console.log('✅ Exam dentist ID:', response.data.dentistId, '| Name:', response.data.dentistName);
      }
    } catch (error) {
      console.warn('⚠️ Could not load exam dentist from record:', error.message);
      // Not critical, just won't show the badge
    }
  };

  const fetchDentists = async (serviceDuration = 15, serviceId = null) => {
    try {
      setLoading(true);
      
      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setDentists(mockDentists);
        setFilteredDentists(mockDentists);
      } else {
        const response = await slotService.getDentistsWithNearestSlot(serviceDuration, serviceId);
        console.log('👨‍⚕️ Dentists API response:', response);
        
        if (response.success && response.data.dentists) {
          setDentists(response.data.dentists);
          setFilteredDentists(response.data.dentists);
          
          if (response.data.dentists.length === 0) {
            message.warning('Hiện tại chưa có nha sỹ nào có lịch khám phù hợp với dịch vụ này');
          }
        } else {
          console.error('Invalid API response format:', response);
          message.error('Không thể tải danh sách nha sỹ');
        }
      }
    } catch (error) {
      console.error('Error fetching dentists:', error);
      message.error('Lỗi kết nối: ' + (error.message || 'Không thể kết nối đến server'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    if (!value.trim()) {
      setFilteredDentists(dentists);
      return;
    }
    
    const filtered = dentists.filter(dentist => 
      dentist.fullName?.toLowerCase().includes(value.toLowerCase()) ||
      dentist.email?.toLowerCase().includes(value.toLowerCase()) ||
      dentist.specialization?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredDentists(filtered);
  };

  const handleSelectDentist = (dentist) => {
    // Lưu dentist vào localStorage
    localStorage.setItem('booking_dentist', JSON.stringify(dentist));
    navigate('/patient/booking/select-date');
  };

  const handleBack = () => {
    navigate('/patient/booking/select-addon');
  };

  return (
    <div className="booking-select-dentist-page">

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
        <div className="breadcrumb-container-booking-select-dentist">
          <Space split=">">
            <a href="/patient/booking/select-service">Trang chủ</a>
            <a href="/patient/booking">Đặt lịch khám</a>
            <a href="/patient/booking/select-service">Chọn dịch vụ</a>
            <a href="/patient/booking/select-addon">Chọn gói dịch vụ</a>
            <Text>Chọn nha sĩ</Text>
          </Space>
        </div>
          <div className="booking-card">
          <div className='booking-card-header'>
            <h5>
              Vui lòng chọn Nha sĩ
            </h5>
          </div>
            <div style={{padding:20}}>
            {/* Search */}
            <div style={{ marginBottom: 24 }}>
              <Input
                size="large"
                placeholder="Tìm bác sĩ theo tên"
                prefix={<SearchOutlined />}
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
                style={{ borderRadius: 8 }}
              />
            </div>

            {/* Dentists List */}
            <Spin spinning={loading}>
              {filteredDentists.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <UserOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
                  <Paragraph type="secondary">
                    {searchValue ? 'Không tìm thấy bác sĩ phù hợp' : 'Chưa có bác sĩ nào'}
                  </Paragraph>
                </div>
              ) : (
                <Row gutter={[16, 16]}>
                  {filteredDentists.map((dentist) => (
                    <Col xs={24} key={dentist._id}>
                      <Card
                        hoverable
                        className="dentist-item-card"
                        onClick={() => handleSelectDentist(dentist)}
                      >
                        <Row align="middle" gutter={16}>
                          <Col>
                            <Avatar 
                              size={80} 
                              src={dentist.avatar} 
                              icon={<UserOutlined />}
                              style={{ backgroundColor: '#2c5f4f' }}
                            />
                          </Col>
                          <Col flex="auto">
                            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                              <Space align="center">
                                <h4 style={{ margin: 0, color: '#BE8600', fontWeight: 'bold', fontSize: '18px' }}>
                                  {dentist.title || 'NS.'} {dentist.fullName}
                                </h4>
                                {/* 🆕 Badge for exam dentist */}
                                {examDentistId && dentist._id === examDentistId && (
                                  <Tag color="blue" style={{ marginLeft: 8 }}>
                                    ⭐ Nha sỹ đã khám
                                  </Tag>
                                )}
                              </Space>
                              <Space size={4}>
                                <Text type="secondary">Giới tính: {dentist.gender === 'male' ? 'Nam' : dentist.gender === 'female' ? 'Nữ' : 'Khác'}</Text>
                              </Space>
                              {dentist.specialization && (
                                <Text type="secondary">
                                  Chuyên môn: {dentist.specialization}
                                </Text>
                              )}
                              {dentist.experience && (
                                <Text type="secondary">
                                  Kinh nghiệm: {dentist.experience} năm
                                </Text>
                              )}
                              {dentist.nearestSlot && (
                                <div style={{ marginTop: 8 }}>
                                  <Tag color="green" style={{ fontSize: 13 }}>
                                    Slot gần nhất: {dentist.nearestSlot.date} {dentist.nearestSlot.startTime} - {dentist.nearestSlot.endTime}
                                  </Tag>
                                </div>
                              )}
                              <Space>
                                <Text>Lịch làm việc:</Text>
                                {dentist.workingDays && dentist.workingDays.length > 0 ? (
                                  <Text strong>
                                    {dentist.workingDays.map(day => {
                                      const dayMap = {
                                        'monday': 'T2',
                                        'tuesday': 'T3',
                                        'wednesday': 'T4',
                                        'thursday': 'T5',
                                        'friday': 'T6',
                                        'saturday': 'T7',
                                        'sunday': 'CN'
                                      };
                                      return dayMap[day] || day;
                                    }).join(', ')}
                                  </Text>
                                ) : (
                                  <Text type="secondary">Chưa cập nhật</Text>
                                )}
                              </Space>
                              <div style={{ marginTop: 12, textAlign: 'right' }}>
                                <a
                                  href={`/patient/dentist-detail/${dentist._id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                  style={{
                                    color: '#1890ff',
                                    fontSize: '14px',
                                    textDecoration: 'none',
                                    fontWeight: 500
                                  }}
                                >
                                  Xem chi tiết →
                                </a>
                              </div>
                            </Space>
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
              <Button size="large" onClick={handleBack} style={{ borderRadius: 6 }} icon={<ArrowLeftOutlined />}>
                Quay lại
              </Button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSelectDentist;

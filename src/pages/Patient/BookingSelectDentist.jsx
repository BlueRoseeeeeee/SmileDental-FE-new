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
  StarFilled
} from '@ant-design/icons';
import slotService from '../../services/slotService.js';
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
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    // Pre-populate localStorage with mock data if using mocks
    if (USE_MOCK_DATA && !localStorage.getItem('booking_service')) {
      const mockService = mockServices[0]; // Use first service as default
      localStorage.setItem('booking_service', JSON.stringify(mockService));
    }

    // Lấy service đã chọn từ bước trước
    const service = localStorage.getItem('booking_service');
    if (!service) {
      navigate('/patient/booking/select-service');
      return;
    }
    setSelectedService(JSON.parse(service));
    fetchDentists();
  }, []);

  const fetchDentists = async () => {
    try {
      setLoading(true);
      
      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setDentists(mockDentists);
        setFilteredDentists(mockDentists);
      } else {
        const response = await slotService.getDentistsWithNearestSlot();
        console.log('👨‍⚕️ Dentists API response:', response);
        
        if (response.success && response.data.dentists) {
          setDentists(response.data.dentists);
          setFilteredDentists(response.data.dentists);
          
          if (response.data.dentists.length === 0) {
            message.warning('Hiện tại chưa có nha sỹ nào có lịch khám');
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
    navigate('/patient/booking/select-service');
  };

  return (
    <div className="booking-select-dentist-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-section">
        <div className="container">
          <Space split=">">
            <a href="/patient/booking/select-service">Trang chủ</a>
            <a href="/patient/booking">Đặt lịch khám</a>
            <a onClick={() => navigate('/patient/booking/select-service')}>Chọn dịch vụ</a>
            <Text>Chọn bác sĩ</Text>
          </Space>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
          <Card className="booking-card">
            <Title level={2} style={{ textAlign: 'center', color: '#2c5f4f', marginBottom: 8 }}>
              Vui lòng chọn Bác sĩ
            </Title>
            
            {selectedService && (
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Text type="secondary">
                  Dịch vụ đã chọn: <Tag color="blue">{selectedService.name}</Tag>
                </Text>
              </div>
            )}

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
                              <Title level={4} style={{ margin: 0, color: '#d4860f' }}>
                                {dentist.title || 'BS'} {dentist.fullName}
                              </Title>
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

export default BookingSelectDentist;

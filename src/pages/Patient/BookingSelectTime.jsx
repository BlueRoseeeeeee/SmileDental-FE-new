import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Typography, 
  Button, 
  Space,
  Tag,
  Alert,
  Row,
  Col,
  Spin,
  Empty
} from 'antd';
import { 
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { slotService } from '../../services';
import { mockSlots, mockServices, mockDentists } from '../../services/mockData.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import './BookingSelectTime.css';

const { Title, Text } = Typography;

// Toggle this to use mock data for testing
const USE_MOCK_DATA = true;

const BookingSelectTime = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState({
    morning: [],
    afternoon: [],
    evening: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-populate localStorage with mock data if using mocks
    if (USE_MOCK_DATA) {
      if (!localStorage.getItem('booking_service')) {
        localStorage.setItem('booking_service', JSON.stringify(mockServices[0]));
      }
      if (!localStorage.getItem('booking_dentist')) {
        localStorage.setItem('booking_dentist', JSON.stringify(mockDentists[0]));
      }
      if (!localStorage.getItem('booking_date')) {
        localStorage.setItem('booking_date', '2025-10-20'); // Mock date matching slots
      }
    }

    // Kiểm tra xem đã chọn đủ thông tin chưa
    const service = localStorage.getItem('booking_service');
    const dentist = localStorage.getItem('booking_dentist');
    const date = localStorage.getItem('booking_date');
    
    if (!service || !dentist || !date) {
      navigate('/patient/booking/select-service');
      return;
    }
    
    setSelectedService(JSON.parse(service));
    setSelectedDentist(JSON.parse(dentist));
    setSelectedDate(dayjs(date));
    
    // Fetch available slots
    fetchAvailableSlots(JSON.parse(dentist)._id, date);
  }, []);

  const fetchAvailableSlots = async (dentistId, date) => {
    try {
      setLoading(true);
      
      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setAvailableSlots(mockSlots);
      } else {
        // Call API to get available slots for dentist on selected date
        const response = await slotService.getAvailableSlots({
          dentistId,
          date,
          status: 'available' // Chỉ lấy slot còn trống
        });
        
        if (response.success) {
          // Nhóm slots theo ca
          const groupedSlots = {
            morning: [],
            afternoon: [],
            evening: []
          };
          
          response.data.forEach(slot => {
            const slotTime = dayjs(slot.startTime);
            const hour = slotTime.hour();
            
            if (hour >= 8 && hour < 12) {
              groupedSlots.morning.push(slot);
            } else if (hour >= 12 && hour < 17) {
              groupedSlots.afternoon.push(slot);
            } else if (hour >= 17 && hour < 20) {
              groupedSlots.evening.push(slot);
            }
          });
          
          // Sort slots by time
          Object.keys(groupedSlots).forEach(shift => {
            groupedSlots[shift].sort((a, b) => 
              dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
            );
          });
          
          setAvailableSlots(groupedSlots);
        }
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
  };

  const handleContinue = () => {
    if (selectedSlot) {
      // Lưu slot đã chọn
      localStorage.setItem('booking_slot', JSON.stringify(selectedSlot));
      
      // Check if user is authenticated
      if (!isAuthenticated) {
        // Redirect to login with return path
        navigate('/login', { state: { from: '/patient/booking/create-appointment' } });
      } else {
        navigate('/patient/booking/create-appointment');
      }
    }
  };

  const handleBack = () => {
    navigate('/patient/booking/select-date');
  };

  const renderShiftSlots = (shift, shiftName, slots) => {
    if (slots.length === 0) {
      return null;
    }

    return (
      <div key={shift} style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 12 }}>
          <CheckCircleOutlined style={{ color: '#52c41a' }} /> {shiftName}
        </Title>
        <Row gutter={[12, 12]}>
          {slots.map((slot) => {
            const startTime = dayjs(slot.startTime).format('HH:mm');
            const endTime = dayjs(slot.endTime).format('HH:mm');
            const isSelected = selectedSlot?._id === slot._id;
            
            return (
              <Col xs={12} sm={8} md={6} key={slot._id}>
                <Button
                  className={`time-slot-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectSlot(slot)}
                  block
                >
                  <ClockCircleOutlined /> {startTime} - {endTime}
                </Button>
              </Col>
            );
          })}
        </Row>
      </div>
    );
  };

  const totalSlots = availableSlots.morning.length + 
                     availableSlots.afternoon.length + 
                     availableSlots.evening.length;

  return (
    <div className="booking-select-time-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-section">
        <div className="container">
          <Space split=">">
            <a href="/patient/booking/select-service">Trang chủ</a>
            <a href="/patient/booking">Đặt lịch khám</a>
            <a onClick={() => navigate('/patient/booking/select-service')}>Chọn dịch vụ</a>
            <a onClick={() => navigate('/patient/booking/select-dentist')}>Chọn bác sĩ</a>
            <a onClick={() => navigate('/patient/booking/select-date')}>Chọn ngày khám</a>
            <Text>Chọn giờ khám</Text>
          </Space>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
          <Row gutter={[24, 24]}>
            {/* Left: Summary Info */}
            <Col xs={24} md={8}>
              <Card className="summary-card" title={<><ClockCircleOutlined /> Thông tin chi tiết</>}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Dịch vụ:</Text>
                    <Tag color="blue" style={{ fontSize: 13 }}>
                      {selectedService?.name}
                    </Tag>
                  </div>
                  
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Bác sĩ:</Text>
                    <Text style={{ fontSize: 13 }}>
                      {selectedDentist?.title || 'BS'} {selectedDentist?.fullName}
                    </Text>
                  </div>
                  
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Giới tính:</Text>
                    <Text style={{ fontSize: 13 }}>
                      {selectedDentist?.gender === 'male' ? 'Nam' : selectedDentist?.gender === 'female' ? 'Nữ' : 'Khác'}
                    </Text>
                  </div>
                  
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Ngày khám:</Text>
                    <Tag color="green" style={{ fontSize: 13 }}>
                      {selectedDate?.format('DD/MM/YYYY')}
                    </Tag>
                  </div>
                  
                  {selectedSlot && (
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>Thời gian khám:</Text>
                      <Tag color="orange" style={{ fontSize: 13 }}>
                        {dayjs(selectedSlot.startTime).format('HH:mm')} - {dayjs(selectedSlot.endTime).format('HH:mm')}
                      </Tag>
                    </div>
                  )}
                </Space>
              </Card>
            </Col>

            {/* Right: Time Slots */}
            <Col xs={24} md={16}>
              <Card className="booking-card">
                <Title level={2} style={{ textAlign: 'center', color: '#2c5f4f', marginBottom: 24 }}>
                  Vui lòng chọn giờ khám
                </Title>

                <Spin spinning={loading}>
                  {totalSlots === 0 ? (
                    <Empty
                      description="Không có khung giờ trống trong ngày này"
                      style={{ padding: '40px 0' }}
                    />
                  ) : (
                    <>
                      <Alert
                        type="info"
                        showIcon
                        message={`Có ${totalSlots} khung giờ khả dụng trong ngày ${selectedDate?.format('DD/MM/YYYY')}`}
                        style={{ marginBottom: 24 }}
                      />

                      {renderShiftSlots('morning', 'Buổi sáng', availableSlots.morning)}
                      {renderShiftSlots('afternoon', 'Buổi chiều', availableSlots.afternoon)}
                      {renderShiftSlots('evening', 'Buổi tối', availableSlots.evening)}

                      {selectedSlot && (
                        <Alert
                          type="success"
                          showIcon
                          message={`Đã chọn: ${dayjs(selectedSlot.startTime).format('HH:mm')} - ${dayjs(selectedSlot.endTime).format('HH:mm')}`}
                          style={{ marginTop: 16 }}
                        />
                      )}
                    </>
                  )}
                </Spin>

                {/* Actions */}
                <div style={{ marginTop: 32, textAlign: 'center' }}>
                  <Space size="large">
                    <Button 
                      size="large" 
                      icon={<ArrowLeftOutlined />}
                      onClick={handleBack} 
                      style={{ borderRadius: 6 }}
                    >
                      Quay lại bước trước
                    </Button>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={handleContinue}
                      disabled={!selectedSlot}
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
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default BookingSelectTime;

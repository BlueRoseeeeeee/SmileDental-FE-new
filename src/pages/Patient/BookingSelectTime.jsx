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
  Empty,
  message
} from 'antd';
import { 
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import slotService from '../../services/slotService.js';
import { mockSlots, mockServices, mockDentists } from '../../services/mockData.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import './BookingSelectTime.css';

const { Title, Text } = Typography;

// Toggle this to use mock data for testing
const USE_MOCK_DATA = false;

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
        // Call API to get dentist's slots on selected date
        // Use getDentistSlotsFuture to get only future slots
        const response = await slotService.getDentistSlotsFuture(dentistId, {
          date: date,
          shiftName: '' // Get all shifts
        });
        
        console.log('⏰ Slots API response:', response);
        
        if (response.success && response.data) {
          let groupedSlots = {
            morning: [],
            afternoon: [],
            evening: []
          };
          
          // Check if API returns grouped shifts (new format)
          if (response.data.shifts) {
            console.log('📦 Using grouped shifts from API');
            groupedSlots = {
              morning: response.data.shifts['Ca Sáng'] || [],
              afternoon: response.data.shifts['Ca Chiều'] || [],
              evening: response.data.shifts['Ca Tối'] || []
            };
          } 
          // Fallback: Group manually from slots array (old format)
          else if (response.data.slots) {
            console.log('📋 Manually grouping slots by shiftName');
            response.data.slots.forEach(slot => {
              // Determine shift based on shiftName
              const shiftName = slot.shiftName;
              if (shiftName === 'Ca Sáng') {
                groupedSlots.morning.push(slot);
              } else if (shiftName === 'Ca Chiều') {
                groupedSlots.afternoon.push(slot);
              } else if (shiftName === 'Ca Tối') {
                groupedSlots.evening.push(slot);
              }
            });
          }
          
          setAvailableSlots(groupedSlots);
          
          const totalSlots = groupedSlots.morning.length + 
                            groupedSlots.afternoon.length + 
                            groupedSlots.evening.length;
          
          console.log('📊 Total slots found:', totalSlots, groupedSlots);
          
          if (totalSlots === 0) {
            message.warning('Không có slot khám nào trong ngày này');
          }
        } else {
          console.error('Invalid API response format:', response);
          message.error('Không thể tải danh sách giờ khám');
        }
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      message.error('Lỗi kết nối: ' + (error.message || 'Không thể kết nối đến server'));
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
    return (
      <div key={shift} style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 12, color: '#2c5f4f' }}>
          <ClockCircleOutlined /> {shiftName}
        </Title>
        {slots.length === 0 ? (
          <div style={{ 
            padding: '16px', 
            textAlign: 'center', 
            background: '#f5f5f5', 
            borderRadius: 8,
            color: '#999'
          }}>
            Không có slot khám trong ca này
          </div>
        ) : (
          <Row gutter={[12, 12]}>
            {slots.map((slot) => {
              // Handle both Date objects and time strings (HH:mm)
              let startTime, endTime;
              if (typeof slot.startTimeVN === 'string') {
                // Use VN time if available
                startTime = slot.startTimeVN;
                endTime = slot.endTimeVN;
              } else if (typeof slot.startTime === 'string' && slot.startTime.includes(':')) {
                // Already formatted as HH:mm
                startTime = slot.startTime;
                endTime = slot.endTime;
              } else {
                // Convert Date to HH:mm
                startTime = dayjs(slot.startTime).format('HH:mm');
                endTime = dayjs(slot.endTime).format('HH:mm');
              }
              
              const isSelected = selectedSlot?._id === slot._id;
              const isBooked = slot.isBooked === true;
              const availableCount = slot.availableAppointments || (slot.maxAppointments ? slot.maxAppointments - slot.appointmentCount : 1);
              
              return (
                <Col xs={12} sm={8} md={6} key={slot._id || slot.slotId}>
                  <Button
                    className={`time-slot-button ${isSelected ? 'selected' : ''}`}
                    onClick={() => !isBooked && handleSelectSlot(slot)}
                    block
                    disabled={isBooked}
                    style={{
                      height: 'auto',
                      padding: '12px 8px',
                      backgroundColor: isBooked ? '#f0f0f0' : (isSelected ? '#2c5f4f' : 'white'),
                      borderColor: isBooked ? '#d9d9d9' : (isSelected ? '#2c5f4f' : '#d9d9d9'),
                      color: isBooked ? '#999' : (isSelected ? 'white' : '#333'),
                      opacity: isBooked ? 0.6 : 1,
                      cursor: isBooked ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 500, fontSize: 14 }}>
                      {startTime} - {endTime}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>
                      {isBooked ? 'Đã được đặt' : `Còn ${availableCount} chỗ`}
                    </div>
                  </Button>
                </Col>
              );
            })}
          </Row>
        )}
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
                  <div style={{ marginBottom: 24 }}>
                    <Alert
                      type="info"
                      showIcon
                      message={totalSlots > 0 
                        ? `Có ${totalSlots} khung giờ khả dụng trong ngày ${selectedDate?.format('DD/MM/YYYY')}`
                        : `Ngày ${selectedDate?.format('DD/MM/YYYY')} - Chọn khung giờ phù hợp`
                      }
                    />
                  </div>

                  {/* Always show all 3 shifts */}
                  {renderShiftSlots('morning', 'Ca sáng', availableSlots.morning)}
                  {renderShiftSlots('afternoon', 'Ca chiều', availableSlots.afternoon)}
                  {renderShiftSlots('evening', 'Ca tối', availableSlots.evening)}

                  {selectedSlot && (
                    <Alert
                      type="success"
                      showIcon
                      message={`Đã chọn: ${selectedSlot.startTimeVN || selectedSlot.startTime} - ${selectedSlot.endTimeVN || selectedSlot.endTime}`}
                      style={{ marginTop: 16 }}
                    />
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

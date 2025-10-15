import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Typography, 
  Button, 
  Space,
  Tag,
  Calendar,
  Alert,
  Badge,
  Row,
  Col
} from 'antd';
import { 
  ArrowLeftOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { mockServices, mockDentists } from '../../services/mockData.js';
import './BookingSelectDate.css';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Title, Text } = Typography;

// Toggle this to use mock data for testing
const USE_MOCK_DATA = true;

const BookingSelectDate = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  useEffect(() => {
    // Pre-populate localStorage with mock data if using mocks
    if (USE_MOCK_DATA) {
      if (!localStorage.getItem('booking_service')) {
        localStorage.setItem('booking_service', JSON.stringify(mockServices[0]));
      }
      if (!localStorage.getItem('booking_dentist')) {
        localStorage.setItem('booking_dentist', JSON.stringify(mockDentists[0]));
      }
    }

    // Kiểm tra xem đã chọn service và dentist chưa
    const service = localStorage.getItem('booking_service');
    const dentist = localStorage.getItem('booking_dentist');
    
    if (!service || !dentist) {
      navigate('/patient/booking/select-service');
      return;
    }
    
    setSelectedService(JSON.parse(service));
    setSelectedDentist(JSON.parse(dentist));
  }, []);

  const disabledDate = (current) => {
    // Không cho chọn ngày trong quá khứ
    if (current && current < dayjs().startOf('day')) {
      return true;
    }
    
    // Nếu bác sĩ có workingDays, chỉ cho chọn ngày trong workingDays
    if (selectedDentist?.workingDays && selectedDentist.workingDays.length > 0) {
      // Lấy index ngày trong tuần (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      const dayIndex = current.day();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDayName = dayNames[dayIndex];
      
      return !selectedDentist.workingDays.includes(currentDayName);
    }
    
    return false;
  };

  const dateCellRender = (value) => {
    const isDisabled = disabledDate(value);
    const isSelected = selectedDate && value.isSame(selectedDate, 'day');
    
    if (isSelected) {
      return (
        <div className="selected-date-cell">
          <Badge status="success" />
        </div>
      );
    }
    
    return null;
  };

  const handleSelectDate = (date) => {
    if (!disabledDate(date)) {
      setSelectedDate(date);
    }
  };

  const handleContinue = () => {
    if (selectedDate) {
      // Lưu ngày đã chọn
      localStorage.setItem('booking_date', selectedDate.format('YYYY-MM-DD'));
      navigate('/patient/booking/select-time');
    }
  };

  const handleBack = () => {
    navigate('/patient/booking/select-dentist');
  };

  const onPanelChange = (value) => {
    setCurrentMonth(value);
  };

  return (
    <div className="booking-select-date-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-section">
        <div className="container">
          <Space split=">">
            <a href="/patient/booking/select-service">Trang chủ</a>
            <a href="/patient/booking">Đặt lịch khám</a>
            <a onClick={() => navigate('/patient/booking/select-service')}>Chọn dịch vụ</a>
            <a onClick={() => navigate('/patient/booking/select-dentist')}>Chọn bác sĩ</a>
            <Text>Chọn ngày khám</Text>
          </Space>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
          <Row gutter={[24, 24]}>
            {/* Left: Summary Info */}
            <Col xs={24} md={8}>
              <Card className="summary-card" title={<><CalendarOutlined /> Thông tin chi tiết</>}>
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
                  
                  {selectedDate && (
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>Ngày khám:</Text>
                      <Tag color="green" style={{ fontSize: 13 }}>
                        {selectedDate.format('DD/MM/YYYY')}
                      </Tag>
                    </div>
                  )}
                </Space>
              </Card>
            </Col>

            {/* Right: Calendar */}
            <Col xs={24} md={16}>
              <Card className="booking-card">
                <Title level={2} style={{ textAlign: 'center', color: '#2c5f4f', marginBottom: 24 }}>
                  Vui lòng chọn ngày khám
                </Title>

                <Alert
                  type="info"
                  showIcon
                  message="Lưu ý"
                  description={
                    selectedDentist?.workingDays && selectedDentist.workingDays.length > 0 
                      ? `Bác sĩ ${selectedDentist.fullName} chỉ làm việc vào: ${selectedDentist.workingDays.map(day => {
                          const dayMap = {
                            'monday': 'Thứ 2',
                            'tuesday': 'Thứ 3',
                            'wednesday': 'Thứ 4',
                            'thursday': 'Thứ 5',
                            'friday': 'Thứ 6',
                            'saturday': 'Thứ 7',
                            'sunday': 'Chủ nhật'
                          };
                          return dayMap[day] || day;
                        }).join(', ')}`
                      : 'Chỉ có thể chọn ngày từ hôm nay trở đi'
                  }
                  style={{ marginBottom: 24 }}
                />

                <Calendar
                  fullscreen={false}
                  disabledDate={disabledDate}
                  onSelect={handleSelectDate}
                  onPanelChange={onPanelChange}
                  cellRender={dateCellRender}
                  value={selectedDate || currentMonth}
                  className="booking-calendar"
                />

                {selectedDate && (
                  <Alert
                    type="success"
                    showIcon
                    message={`Đã chọn ngày: ${selectedDate.format('DD/MM/YYYY')}`}
                    style={{ marginTop: 16 }}
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
                      Quay lại bước trước
                    </Button>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={handleContinue}
                      disabled={!selectedDate}
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

export default BookingSelectDate;

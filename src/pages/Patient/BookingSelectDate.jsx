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
  Col,
  message
} from 'antd';
import { 
  ArrowLeftOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/vi';
import locale from 'antd/locale/vi_VN';
import { ConfigProvider } from 'antd';
import slotService from '../../services/slotService.js';
import { mockServices, mockDentists } from '../../services/mockData.js';
import './BookingSelectDate.css';
import { COLOR_BRAND_NAME } from '../../utils/common-colors.js';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale('vi');

const { Title, Text } = Typography;

// Toggle this to use mock data for testing
const USE_MOCK_DATA = false;

const BookingSelectDate = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServiceAddOn, setSelectedServiceAddOn] = useState(null);
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [workingDates, setWorkingDates] = useState([]);

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
    const serviceAddOn = localStorage.getItem('booking_serviceAddOn');
    const dentist = localStorage.getItem('booking_dentist');
    
    if (!service || !dentist) {
      navigate('/patient/booking/select-service');
      return;
    }
    
    const serviceData = JSON.parse(service);
    const serviceAddOnData = serviceAddOn ? JSON.parse(serviceAddOn) : null;
    const dentistData = JSON.parse(dentist);
    
    setSelectedService(serviceData);
    setSelectedServiceAddOn(serviceAddOnData);
    setSelectedDentist(dentistData);
    
    // Calculate service duration (prioritize addon)
    const serviceDuration = serviceAddOnData?.durationMinutes 
                         || serviceData?.durationMinutes 
                         || 15;
    
    console.log('🎯 Fetching working dates with duration:', serviceDuration, 'minutes');
    console.log('📦 Service:', serviceData.name, '| AddOn:', serviceAddOnData?.name || 'none');
    
    // Fetch working dates with service duration
    fetchWorkingDates(dentistData._id, serviceDuration);
  }, []);

  const fetchWorkingDates = async (dentistId, serviceDuration = 15) => {
    try {
      const response = await slotService.getDentistWorkingDates(dentistId, serviceDuration);
      
      if (response.success && response.data.workingDates) {
        setWorkingDates(response.data.workingDates);
        
        if (response.data.workingDates.length === 0) {
          message.warning('Nha sỹ này hiện chưa có lịch làm việc trong thời gian tới');
        }
      } else {
        console.error('Invalid API response format:', response);
        message.error('Không thể tải lịch làm việc');
      }
    } catch (error) {
      console.error('Error fetching working dates:', error);
      message.error('Lỗi kết nối: ' + (error.message || 'Không thể kết nối đến server'));
    }
  };

  const disabledDate = (current) => {
    // Không cho chọn ngày trong quá khứ
    if (current && current < dayjs().startOf('day')) {
      return true;
    }
    
    // Nếu có workingDates từ API, chỉ cho chọn ngày có trong danh sách
    if (workingDates && workingDates.length > 0) {
      const currentDateStr = current.format('YYYY-MM-DD');
      return !workingDates.some(d => d.date === currentDateStr);
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
    <ConfigProvider locale={locale}>
    <div className="booking-select-date-page">
      {/* Main Content */}
      <div className="main-content">
        <div className="container">
        <div  className='breadcrumb-container-booking-select-date'>
          <Space split=">">
            <a href="/patient/booking/select-service">Trang chủ</a>
            <a href="/patient/booking">Đặt lịch khám</a>
            <a href="/patient/booking/select-service">Chọn dịch vụ</a>
            <a href="/patient/booking/select-addon">Chọn gói dịch vụ</a>
            <a href="/patient/booking/select-dentist">Chọn nha sĩ</a>
            <Text>Chọn ngày khám</Text>
          </Space>
        </div>
          <Row gutter={[24, 24]}>
            {/* Left: Summary Info */}
            <Col xs={24} md={8}>
              <Card className="summary-card" title={<><CalendarOutlined /> Thông tin chi tiết</>}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                 <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Dịch vụ:</Text>
                    <Text style={{ fontSize: 13 }}>
                      {selectedService?.name}
                    </Text>
                  </div>
                  {selectedServiceAddOn && (
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>Gói dịch vụ đã chọn:</Text>
                      <Text style={{ fontSize: 13 }}>
                        {selectedServiceAddOn?.name}
                      </Text>
                    </div>
                  )}
                  
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Nha sĩ:</Text>
                    <Text style={{ fontSize: 13 }}>
                      {selectedDentist?.title || 'NS.'} {selectedDentist?.fullName}
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
              <div className='booking-card-header'>
                <h5>
                  Vui lòng chọn ngày khám
                </h5>
              </div>

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
                    {selectedDate && (
                      <button
                        onClick={handleContinue}
                        style={{ 
                          backgroundColor: '#3498db',
                          borderRadius: 6,
                          padding: '2px 20px',
                          color: 'white',
                          fontSize: '16px',
                          cursor: 'pointer',
                          border: 'none'
                        }}
                      >
                        Tiếp tục 
                      </button>
                    )}
                  </Space>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
    </ConfigProvider>
  );
};

export default BookingSelectDate;

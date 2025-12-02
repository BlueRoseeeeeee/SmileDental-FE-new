import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Typography, 
  Button, 
  Space,
  Alert,
  Descriptions,
  Input,
  Form,
  message,
  Tag
} from 'antd';
import { 
  ArrowLeftOutlined,
  CheckCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import appointmentService from '../../services/appointmentService.js';
import scheduleConfigService from '../../services/scheduleConfigService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { getPriceScheduleInfo } from '../../utils/priceScheduleUtils';
import './CreateAppointment.css';
import { toast } from 'react-toastify';

dayjs.extend(isBetween);
dayjs.extend(timezone);
dayjs.extend(utc);

const { Text } = Typography;
const { TextArea } = Input;

const CreateAppointment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServiceAddOn, setSelectedServiceAddOn] = useState(null);
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlotGroup, setSelectedSlotGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState({ depositAmount: 100000 });

  // Get price schedule info for displaying price with schedule details
  const getPriceScheduleForDate = (item, appointmentDate) => {
    if (!item || !appointmentDate) {
      return { basePrice: item?.price || 0, activeSchedule: null };
    }

    const priceSchedules = item.priceSchedules || [];
    if (priceSchedules.length === 0) {
      return { basePrice: item.price || 0, activeSchedule: null };
    }

    const appointmentDay = dayjs(appointmentDate).tz('Asia/Ho_Chi_Minh').startOf('day');

    const activeSchedule = priceSchedules.find(schedule => {
      if (!schedule.isActive) return false;

      const startDate = dayjs(schedule.startDate).tz('Asia/Ho_Chi_Minh').startOf('day');
      const endDate = dayjs(schedule.endDate).tz('Asia/Ho_Chi_Minh').endOf('day');

      return appointmentDay.isBetween(startDate, endDate, null, '[]');
    });

    return {
      basePrice: item.price || 0,
      activeSchedule: activeSchedule || null
    };
  };

  // Calculate effective price based on appointment date and price schedules
  // Works for both service and serviceAddOn
  const getEffectivePriceForDate = (item, appointmentDate) => {
    console.log('💰 getEffectivePriceForDate called with:', {
      itemName: item?.name,
      basePrice: item?.price,
      appointmentDate: appointmentDate?.format('YYYY-MM-DD'),
      hasPriceSchedules: item?.priceSchedules?.length > 0
    });

    if (!item || !appointmentDate) {
      console.log('⚠️ Missing item or date, returning:', item?.price || 0);
      return item?.price || 0;
    }

    const priceSchedules = item.priceSchedules || [];
    if (priceSchedules.length === 0) {
      console.log('📋 No price schedules, returning base price:', item.price || 0);
      return item.price || 0; // Return base price if no schedules
    }

    // Convert appointment date to start of day in Vietnam timezone
    const appointmentDay = dayjs(appointmentDate).tz('Asia/Ho_Chi_Minh').startOf('day');
    console.log('📅 Appointment day (VN):', appointmentDay.format('YYYY-MM-DD'));

    // Find active price schedule that covers the appointment date
    const activeSchedule = priceSchedules.find(schedule => {
      if (!schedule.isActive) {
        console.log('⏭️ Skipping inactive schedule:', schedule);
        return false;
      }

      const startDate = dayjs(schedule.startDate).tz('Asia/Ho_Chi_Minh').startOf('day');
      const endDate = dayjs(schedule.endDate).tz('Asia/Ho_Chi_Minh').endOf('day');
      
      console.log('🔍 Checking schedule:', {
        price: schedule.price,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        isInRange: appointmentDay.isBetween(startDate, endDate, null, '[]')
      });

      return appointmentDay.isBetween(startDate, endDate, null, '[]'); // inclusive
    });

    const finalPrice = activeSchedule ? activeSchedule.price : (item.price || 0);
    console.log('✅ Final price:', finalPrice, activeSchedule ? '(from schedule)' : '(base price)');
    return finalPrice;
  };

  // 🆕 Fetch schedule config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await scheduleConfigService.getConfig();
        if (config?.depositAmount) {
          setScheduleConfig(config);
        }
      } catch (error) {
        console.error('Failed to fetch schedule config:', error);
        // Keep default value of 50000
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    // Kiểm tra xem đã chọn đủ thông tin chưa
    const service = localStorage.getItem('booking_service');
    const serviceAddOn = localStorage.getItem('booking_serviceAddOn');
    const serviceAddOnUserSelected = localStorage.getItem('booking_serviceAddOn_userSelected');
    const dentist = localStorage.getItem('booking_dentist');
    const date = localStorage.getItem('booking_date');
    const slotGroup = localStorage.getItem('booking_slotGroup');
    
    if (!service || !dentist || !date || !slotGroup) {
      navigate('/patient/booking/select-service');
      return;
    }
    
    setSelectedService(JSON.parse(service));
    // Only set selectedServiceAddOn if user actually selected it (not auto-selected)
    if (serviceAddOn && serviceAddOnUserSelected === 'true') {
      setSelectedServiceAddOn(JSON.parse(serviceAddOn));
      console.log('📦 Loaded serviceAddOn:', JSON.parse(serviceAddOn));
    }
    setSelectedDentist(JSON.parse(dentist));
    setSelectedDate(dayjs(date));
    setSelectedSlotGroup(JSON.parse(slotGroup));

    // Pre-fill from logged in user
    if (user) {
      form.setFieldsValue({
        patientName: user.fullName || '',
        patientPhone: user.phone || '',
        patientDOB: user.dateOfBirth ? dayjs(user.dateOfBirth).format('DD/MM/YYYY') : ''
      });
    }
  }, [navigate, user, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Get selected addon from localStorage
      const serviceAddOnData = localStorage.getItem('booking_serviceAddOn');
      const serviceAddOn = serviceAddOnData ? JSON.parse(serviceAddOnData) : null;
      
      // ⭐ Get exam recordId if service requires exam first
      const examRecordId = localStorage.getItem('booking_examRecordId');
      
      // Call API to reserve appointment (create temporary reservation)
      const reservationData = {
        patientId: user._id,
        patientInfo: {
          fullName: user.fullName,
          phone: user.phone,
          email: user.email || null,
          dateOfBirth: user.dateOfBirth
        },
        serviceId: selectedService._id,
        serviceAddOnId: serviceAddOn?._id || null, // Use selected addon ID or null
        dentistId: selectedDentist._id,
        slotIds: selectedSlotGroup.slotIds, // 🆕 Use slotIds array from group
        date: selectedDate.format('YYYY-MM-DD'),
        notes: values.notes || '',
        examRecordId: examRecordId || null // ⭐ Include recordId if exists
      };
      
      console.log('📝 Creating reservation with data:', reservationData);
      console.log('📦 Slot group:', selectedSlotGroup);
      if (examRecordId) {
        console.log('🩺 Exam record ID for hasBeenUsed update:', examRecordId);
      }
      
      const response = await appointmentService.reserveAppointment(reservationData);
      
      console.log('✅ Reservation API response:', response);
      console.log('🔵 [Debug] Response structure:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        message.success('Đặt chỗ thành công! Vui lòng thanh toán trong 15 phút.');
        
        // Check if backend returns paymentUrl (redirect URL)
        if (response.data.paymentUrl) {
          console.log('🔄 Redirecting to payment URL:', response.data.paymentUrl);
          // Use window.location.href for external redirect
          window.location.href = response.data.paymentUrl;
        } else {
          // Fallback: Navigate to payment selection with reservation data
          console.log('📍 Navigating to payment selection page');
          navigate('/patient/payment/select', {
            state: { 
              reservation: response.data 
            }
          });
        }
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi đặt chỗ');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt chỗ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-appointment-page">

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
        <div className='breadcrumb-container-booking-appoiment'>
          <Space split=">">
            <a href="/patient/booking/select-service">Trang chủ</a>
            <a href="/patient/booking">Đặt lịch khám</a>
            <a href='/patient/booking/select-service'>Chọn dịch vụ</a>
            <a href='/patient/booking/select-dentist'>Chọn Nha sĩ</a>
            <a href='/patient/booking/select-date'>Chọn ngày khám</a>
            <a href='/patient/booking/select-time'>Chọn giờ khám</a>
            <Text>Tạo phiếu khám</Text>
          </Space>
        </div>
          <Card className="booking-card">
          <div>
            <h5 className='booking-card-header'>
              <FileTextOutlined /> Tạo phiếu khám
            </h5>
          </div>

            <Alert
              type="info"
              showIcon
              message="Vui lòng kiểm tra lại thông tin trước khi xác nhận"
              style={{ marginBottom: 24 }}
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              {/* Appointment Information */}
              <Card 
                type="inner" 
                title={<Text strong>Thông tin đặt khám</Text>}
                style={{ marginBottom: 24 }}
              >
                <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered>
                  <Descriptions.Item label="Dịch vụ">
                    {selectedService?.name}
                    {selectedServiceAddOn && (
                      <span style={{ color: '#1890ff', fontWeight: 500 }}>
                        {' '}({selectedServiceAddOn.name})
                      </span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Giá dịch vụ">
                    {(() => {
                      const item = selectedServiceAddOn || selectedService;
                      const priceInfo = getPriceScheduleForDate(item, selectedDate);
                      const { basePrice, activeSchedule } = priceInfo;

                      const finalPrice = activeSchedule ? activeSchedule.price : basePrice;
                      return (
                        <Text strong style={{ fontSize: 15 }}>
                          {finalPrice.toLocaleString('vi-VN')} VNĐ
                          {selectedServiceAddOn && <Text type="secondary"> / {selectedServiceAddOn.unit}</Text>}
                        </Text>
                      );
                    })()}
                  </Descriptions.Item>
                  {selectedServiceAddOn && (
                    <Descriptions.Item label="Thời gian dự kiến">
                      <Text>~{selectedServiceAddOn.durationMinutes} phút</Text>
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Nha sĩ">
                    {selectedDentist?.title || 'NS. '} {selectedDentist?.fullName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Giới tính">
                    {selectedDentist?.gender === 'male' ? 'Nam' : selectedDentist?.gender === 'female' ? 'Nữ' : 'Khác'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày khám">
                  {selectedDate?.format('DD/MM/YYYY')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian">
                      {selectedSlotGroup?.displayTime}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Patient Information - Auto fill from user profile */}
              <Card 
                type="inner" 
                title={<Text strong>Thông tin bệnh nhân</Text>}
                style={{ marginBottom: 24 }}
              >
                <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered>
                  <Descriptions.Item label="Họ và tên">
                    {user?.fullName || 'Chưa cập nhật'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    {user?.phone || 'Chưa cập nhật'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày sinh">
                    {user?.dateOfBirth ? dayjs(user.dateOfBirth).format('DD/MM/YYYY') : 'Chưa cập nhật'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Notes */}
              <Form.Item
                label={<Text strong>Ghi chú (Tùy chọn)</Text>}
                name="notes"
              >
                <TextArea
                className='custom-textarea '
                  rows={4}
                  placeholder="Nhập ghi chú nếu có (triệu chứng, yêu cầu đặc biệt...)"
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              {/* Total Amount - 🆕 Show deposit amount */}
              <Alert
                type="success"
                showIcon
                message={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>💰 Tiền cọc (phải thanh toán):</Text>
                    <h5 strong style={{ fontSize: 24, color: 'red', fontWeight:'bold' }}>
                      {(selectedSlotGroup?.slots.length * scheduleConfig.depositAmount).toLocaleString('vi-VN')} VNĐ
                    </h5>
                  </div>
                }
                description={
                  <div style={{ marginTop: 8 }}>
                    {/* <Text type="secondary">
                      = {scheduleConfig.depositAmount.toLocaleString('vi-VN')} VNĐ/slot × {selectedSlotGroup?.slots.length} slot
                    </Text> */}
                    {/* <br /> */}
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      (Giá dịch vụ: {selectedServiceAddOn 
                        ? getEffectivePriceForDate(selectedServiceAddOn, selectedDate)?.toLocaleString('vi-VN')
                        : getEffectivePriceForDate(selectedService, selectedDate)?.toLocaleString('vi-VN')} VNĐ - thanh toán sau khi khám)
                    </Text>
                  </div>
                }
                style={{ marginBottom: 24 }}
              />

              {/* Payment Notice */}
              <Alert
                type="info"
                showIcon
                message="Thanh toán trực tuyến"
                description="Sau khi xác nhận, bạn sẽ được chuyển đến trang chọn phương thức thanh toán (Visa/MasterCard). Vui lòng hoàn tất thanh toán trong 15 phút."
                style={{ marginBottom: 24 }}
              />

              {/* Actions */}
              <div style={{ textAlign: 'center' }}>
                <Space size="large">
                  {/* <Button 
                    size="large" 
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBack} 
                    style={{ borderRadius: 6 }}
                  >
                    Quay lại
                  </Button> */}
                  <Button 
                    type="primary" 
                    size="large"
                    htmlType="submit"
                    loading={loading}
                    icon={<CheckCircleOutlined />}
                    style={{ 
                      backgroundColor: '#2c5f4f',
                      borderColor: '#2c5f4f',
                      borderRadius: 6
                    }}
                  >
                    Xác nhận & Thanh toán
                  </Button>
                </Space>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateAppointment;

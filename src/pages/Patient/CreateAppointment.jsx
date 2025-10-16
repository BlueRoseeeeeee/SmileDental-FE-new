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
  Descriptions,
  Radio,
  Input,
  Form,
  message,
  Modal
} from 'antd';
import { 
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import appointmentService from '../../services/appointmentService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { mockPatient, mockServices, mockDentists, mockSlots } from '../../services/mockData.js';
import './CreateAppointment.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Toggle this to use mock data for testing
const USE_MOCK_DATA = false;

const CreateAppointment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServiceAddOn, setSelectedServiceAddOn] = useState(null);
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
        localStorage.setItem('booking_date', '2025-10-20');
      }
      if (!localStorage.getItem('booking_slot')) {
        localStorage.setItem('booking_slot', JSON.stringify(mockSlots.morning[0]));
      }
    }

    // Kiểm tra xem đã chọn đủ thông tin chưa
    const service = localStorage.getItem('booking_service');
    const serviceAddOn = localStorage.getItem('booking_serviceAddOn'); // Get selected addon
    const dentist = localStorage.getItem('booking_dentist');
    const date = localStorage.getItem('booking_date');
    const slot = localStorage.getItem('booking_slot');
    
    if (!service || !dentist || !date || !slot) {
      navigate('/patient/booking/select-service');
      return;
    }
    
    setSelectedService(JSON.parse(service));
    if (serviceAddOn) {
      setSelectedServiceAddOn(JSON.parse(serviceAddOn));
    }
    setSelectedDentist(JSON.parse(dentist));
    setSelectedDate(dayjs(date));
    setSelectedSlot(JSON.parse(slot));

    // Pre-fill patient info from mock data if using mocks
    if (USE_MOCK_DATA) {
      form.setFieldsValue({
        patientName: mockPatient.fullName,
        patientPhone: mockPatient.phone,
        patientDOB: dayjs(mockPatient.dateOfBirth).format('DD/MM/YYYY')
      });
    } else if (user) {
      // Pre-fill from logged in user
      form.setFieldsValue({
        patientName: user.fullName || '',
        patientPhone: user.phone || '',
        patientDOB: user.dateOfBirth ? dayjs(user.dateOfBirth).format('DD/MM/YYYY') : ''
      });
    }
  }, []);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Get selected addon from localStorage
      const serviceAddOnData = localStorage.getItem('booking_serviceAddOn');
      const serviceAddOn = serviceAddOnData ? JSON.parse(serviceAddOnData) : null;
      
      // Call API to reserve appointment (create temporary reservation)
      const reservationData = {
        patientId: user._id,
        patientInfo: {
          fullName: user.fullName,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth
        },
        serviceId: selectedService._id,
        serviceAddOnId: serviceAddOn?._id || null, // Use selected addon ID or null
        dentistId: selectedDentist._id,
        slotIds: Array.isArray(selectedSlot) ? selectedSlot.map(s => s._id) : [selectedSlot._id],
        date: selectedDate.format('YYYY-MM-DD'),
        notes: values.notes || ''
      };
      
      console.log('📝 Creating reservation with data:', reservationData);
      
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
        console.error('❌ Invalid API response format:', response);
        message.error(response.message || 'Có lỗi xảy ra khi đặt chỗ');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt chỗ');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/patient/booking/select-time');
  };

  const handlePayment = () => {
    // Always redirect to payment (online only)
    message.info('Đang chuyển đến trang thanh toán...');
    navigate('/patient/payment/select');
  };

  const handleViewAppointment = () => {
    navigate('/patient/appointments');
  };

  return (
    <div className="create-appointment-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-section">
        <div className="container">
          <Space split=">">
            <a href="/patient/booking/select-service">Trang chủ</a>
            <a href="/patient/booking">Đặt lịch khám</a>
            <a onClick={() => navigate('/patient/booking/select-service')}>Chọn dịch vụ</a>
            <a onClick={() => navigate('/patient/booking/select-dentist')}>Chọn bác sĩ</a>
            <a onClick={() => navigate('/patient/booking/select-date')}>Chọn ngày khám</a>
            <a onClick={() => navigate('/patient/booking/select-time')}>Chọn giờ khám</a>
            <Text>Tạo phiếu khám</Text>
          </Space>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
          <Card className="booking-card">
            <Title level={2} style={{ textAlign: 'center', color: '#2c5f4f', marginBottom: 32 }}>
              <FileTextOutlined /> Tạo phiếu khám
            </Title>

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
                    <Tag color="blue">{selectedService?.name}</Tag>
                  </Descriptions.Item>
                  {selectedServiceAddOn ? (
                    <>
                      <Descriptions.Item label="Gói dịch vụ">
                        <Tag color="green">{selectedServiceAddOn.name}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Giá gói">
                        <Text strong style={{ color: '#2c5f4f', fontSize: 16 }}>
                          {selectedServiceAddOn.price?.toLocaleString('vi-VN')} VNĐ / {selectedServiceAddOn.unit}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Thời gian dự kiến">
                        <Text>~{selectedServiceAddOn.durationMinutes} phút</Text>
                      </Descriptions.Item>
                    </>
                  ) : (
                    <Descriptions.Item label="Giá dịch vụ">
                      <Text strong style={{ color: '#2c5f4f', fontSize: 16 }}>
                        {selectedService?.price?.toLocaleString('vi-VN')} VNĐ
                      </Text>
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Bác sĩ">
                    {selectedDentist?.title || 'BS'} {selectedDentist?.fullName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Giới tính">
                    {selectedDentist?.gender === 'male' ? 'Nam' : selectedDentist?.gender === 'female' ? 'Nữ' : 'Khác'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày khám">
                    <Tag color="green">{selectedDate?.format('DD/MM/YYYY')}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian">
                    <Tag color="orange">
                      {dayjs(selectedSlot?.startTime).format('HH:mm')} - {dayjs(selectedSlot?.endTime).format('HH:mm')}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mã phiếu khám" span={2}>
                    <Text code>TT01</Text>
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
                  <Descriptions.Item label="Mã bệnh nhân">
                    <Text code>{user?.employeeCode || 'Chưa có'}</Text>
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
                  rows={4}
                  placeholder="Nhập ghi chú nếu có (triệu chứng, yêu cầu đặc biệt...)"
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              {/* Total Amount */}
              <Alert
                type="success"
                showIcon
                message={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>Tổng tiền:</Text>
                    <Text strong style={{ fontSize: 20, color: '#2c5f4f' }}>
                      {selectedServiceAddOn 
                        ? selectedServiceAddOn.price?.toLocaleString('vi-VN') 
                        : selectedService?.price?.toLocaleString('vi-VN')} VNĐ
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
                  <Button 
                    size="large" 
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBack} 
                    style={{ borderRadius: 6 }}
                  >
                    Quay lại
                  </Button>
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

      {/* Success Modal */}
      <Modal
        open={showSuccessModal}
        onCancel={() => setShowSuccessModal(false)}
        footer={null}
        width={700}
        centered
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 72, color: '#52c41a', marginBottom: 24 }} />
          <Title level={2} style={{ color: '#52c41a', marginBottom: 16 }}>
            Đặt khám thành công!
          </Title>
          <Paragraph style={{ fontSize: 16, marginBottom: 32 }}>
            Phiếu khám của bạn đã được tạo thành công
          </Paragraph>

          {createdAppointment && (
            <Card style={{ textAlign: 'left', marginBottom: 24 }}>
              <Title level={4}>Thông tin phiếu khám</Title>
              <Descriptions column={1} bordered>
                <Descriptions.Item label="Mã phiếu">
                  <Text code strong>{createdAppointment.appointmentCode}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Dịch vụ">
                  {createdAppointment.service?.name}
                </Descriptions.Item>
                <Descriptions.Item label="Bác sĩ">
                  {createdAppointment.dentist?.title || 'BS'} {createdAppointment.dentist?.fullName}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày khám">
                  {dayjs(createdAppointment.date).format('DD/MM/YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian">
                  {dayjs(createdAppointment.startTime).format('HH:mm')} - {dayjs(createdAppointment.endTime).format('HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Tổng tiền">
                  <Text strong style={{ color: '#2c5f4f', fontSize: 16 }}>
                    {createdAppointment.totalAmount?.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Thanh toán">
                  <Tag color="green">
                    Thanh toán trực tuyến
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Space size="large">
            <Button size="large" onClick={handleViewAppointment}>
              Xem lịch khám của tôi
            </Button>
            <Button 
              type="primary" 
              size="large"
              onClick={handlePayment}
              style={{ 
                backgroundColor: '#2c5f4f',
                borderColor: '#2c5f4f'
              }}
            >
              Thanh toán ngay
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default CreateAppointment;

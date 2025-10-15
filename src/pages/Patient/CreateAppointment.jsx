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
import { mockPatient, mockServices, mockDentists, mockSlots } from '../../services/mockData.js';
import './CreateAppointment.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Toggle this to use mock data for testing
const USE_MOCK_DATA = true;

const CreateAppointment = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
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
    const dentist = localStorage.getItem('booking_dentist');
    const date = localStorage.getItem('booking_date');
    const slot = localStorage.getItem('booking_slot');
    
    if (!service || !dentist || !date || !slot) {
      navigate('/patient/booking/select-service');
      return;
    }
    
    setSelectedService(JSON.parse(service));
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
    }
  }, []);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock response
        const mockResponse = {
          success: true,
          data: {
            _id: 'APP' + Date.now(),
            appointmentCode: 'BN' + String(Math.floor(Math.random() * 1000)).padStart(3, '0'),
            patientName: mockPatient.fullName,
            patientPhone: mockPatient.phone,
            dateOfBirth: dayjs(mockPatient.dateOfBirth).format('DD/MM/YYYY'),
            service: selectedService,
            dentist: selectedDentist,
            date: selectedDate.format('YYYY-MM-DD'),
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
            totalAmount: selectedService.price,
            paymentMethod: paymentMethod,
            status: 'pending',
            notes: values.notes || '',
            createdAt: new Date().toISOString()
          }
        };
        
        setCreatedAppointment(mockResponse.data);
        setShowSuccessModal(true);
        
        // Clear localStorage
        localStorage.removeItem('booking_service');
        localStorage.removeItem('booking_dentist');
        localStorage.removeItem('booking_date');
        localStorage.removeItem('booking_slot');
        
        message.success('Đặt lịch khám thành công!');
      } else {
        // Gọi API tạo appointment
        const appointmentData = {
          serviceId: selectedService._id,
          dentistId: selectedDentist._id,
          slotId: selectedSlot._id,
          date: selectedDate.format('YYYY-MM-DD'),
          notes: values.notes || '',
          paymentMethod: paymentMethod
        };
        
        // TODO: Call API create appointment
        // const response = await appointmentService.createAppointment(appointmentData);
        
        // Mock response for now
        const mockResponse = {
          success: true,
          data: {
            _id: 'APP' + Date.now(),
            appointmentCode: 'BN001',
            patientName: 'Nguyễn Linh', // Get from auth context
            patientPhone: '0123456789',
            dateOfBirth: '01/02/2003',
            service: selectedService,
            dentist: selectedDentist,
            date: selectedDate.format('YYYY-MM-DD'),
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
            totalAmount: selectedService.price,
            paymentMethod: paymentMethod,
            status: 'pending',
            createdAt: new Date().toISOString()
          }
        };
        
        if (mockResponse.success) {
          setCreatedAppointment(mockResponse.data);
          setShowSuccessModal(true);
        
          // Clear localStorage
          localStorage.removeItem('booking_service');
          localStorage.removeItem('booking_dentist');
          localStorage.removeItem('booking_date');
          localStorage.removeItem('booking_slot');
          
          message.success('Tạo phiếu khám thành công!');
        }
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      message.error('Có lỗi xảy ra khi tạo phiếu khám');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/patient/booking/select-time');
  };

  const handlePayment = () => {
    if (paymentMethod === 'online') {
      // Redirect to payment gateway
      message.info('Chuyển đến cổng thanh toán...');
      // window.location.href = paymentUrl;
    } else {
      message.success('Vui lòng thanh toán tại quầy khi đến khám');
      navigate('/patient/appointments');
    }
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
            <a href="/home">Trang chủ</a>
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
                  <Descriptions.Item label="Giá dịch vụ">
                    <Text strong style={{ color: '#2c5f4f', fontSize: 16 }}>
                      {selectedService?.price?.toLocaleString('vi-VN')} VNĐ
                    </Text>
                  </Descriptions.Item>
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
                    Nguyễn Linh
                  </Descriptions.Item>
                  <Descriptions.Item label="Mã bệnh nhân">
                    <Text code>BN001</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    0123456789
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày sinh">
                    01/02/2003
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

              {/* Payment Method */}
              <Card 
                type="inner" 
                title={<Text strong><DollarOutlined /> Phương thức thanh toán</Text>}
                style={{ marginBottom: 24 }}
              >
                <Radio.Group 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Radio value="cash">
                      <Space direction="vertical" size={0}>
                        <Text strong>Thanh toán tại quầy</Text>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          Thanh toán bằng tiền mặt hoặc chuyển khoản tại phòng khám
                        </Text>
                      </Space>
                    </Radio>
                    <Radio value="online">
                      <Space direction="vertical" size={0}>
                        <Text strong>Thanh toán trực tuyến</Text>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          Thanh toán qua VNPay, MoMo, ZaloPay
                        </Text>
                      </Space>
                    </Radio>
                  </Space>
                </Radio.Group>
              </Card>

              {/* Total Amount */}
              <Alert
                type="success"
                showIcon
                message={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>Tổng tiền:</Text>
                    <Text strong style={{ fontSize: 20, color: '#2c5f4f' }}>
                      {selectedService?.price?.toLocaleString('vi-VN')} VNĐ
                    </Text>
                  </div>
                }
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
                    style={{ 
                      backgroundColor: '#2c5f4f',
                      borderColor: '#2c5f4f',
                      borderRadius: 6
                    }}
                  >
                    Xác nhận đặt khám
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
                  <Tag color={paymentMethod === 'online' ? 'green' : 'blue'}>
                    {paymentMethod === 'online' ? 'Thanh toán trực tuyến' : 'Thanh toán tại quầy'}
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
              {paymentMethod === 'online' ? 'Thanh toán ngay' : 'Hoàn tất'}
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default CreateAppointment;

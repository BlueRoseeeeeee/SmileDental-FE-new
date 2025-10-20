/**
 * Walk-In Appointment Form Component
 * 
 * Allows Admin/Manager to create appointments for walk-in patients
 * Features:
 * - Quick patient selection or creation
 * - Service and addon selection
 * - Dentist selection
 * - Time slot selection
 * - Optional immediate cash payment
 * - Automatic status update to checked-in if paid
 */

import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  message,
  Spin,
  Checkbox,
  Divider,
  Steps
} from 'antd';
import {
  UserAddOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import CashPaymentModal from './CashPaymentModal';

const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

const WalkInAppointmentForm = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Mock data - Replace with real API calls
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [slots, setSlots] = useState([]);
  
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payNow, setPayNow] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  // Load mock data
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock patients
    setPatients([
      { _id: 'pat_001', name: 'Nguyễn Văn A', phone: '0901234567', email: 'nguyenvana@email.com' },
      { _id: 'pat_002', name: 'Trần Thị B', phone: '0909876543', email: 'tranthib@email.com' },
      { _id: 'pat_003', name: 'Lê Văn C', phone: '0912345678', email: 'levanc@email.com' }
    ]);

    // Mock services
    setServices([
      { 
        _id: 'ser_001', 
        name: 'Khám tổng quát', 
        price: 200000, 
        duration: 30,
        addOns: [
          { _id: 'addon_001', name: 'Chụp X-quang', price: 100000 },
          { _id: 'addon_002', name: 'Vệ sinh răng miệng', price: 150000 }
        ]
      },
      { 
        _id: 'ser_002', 
        name: 'Nhổ răng', 
        price: 500000, 
        duration: 45,
        addOns: []
      },
      { 
        _id: 'ser_003', 
        name: 'Hàn răng', 
        price: 300000, 
        duration: 60,
        addOns: [
          { _id: 'addon_003', name: 'Gây tê', price: 50000 }
        ]
      }
    ]);

    // Mock dentists
    setDentists([
      { _id: 'den_001', name: 'BS. Nguyễn Văn An', specialization: 'Tổng quát' },
      { _id: 'den_002', name: 'BS. Trần Thị Bình', specialization: 'Nha chu' },
      { _id: 'den_003', name: 'BS. Lê Văn Cường', specialization: 'Phẫu thuật' }
    ]);
  };

  // Load available slots when service, dentist, and date are selected
  useEffect(() => {
    if (selectedService && selectedDate && form.getFieldValue('dentistId')) {
      loadAvailableSlots();
    }
  }, [selectedService, selectedDate, form.getFieldValue('dentistId')]);

  const loadAvailableSlots = () => {
    // Mock slots - In production, fetch from API
    const mockSlots = [
      { _id: 'slot_001', startTime: '08:00', endTime: '08:30', status: 'available' },
      { _id: 'slot_002', startTime: '08:30', endTime: '09:00', status: 'available' },
      { _id: 'slot_003', startTime: '09:00', endTime: '09:30', status: 'booked' },
      { _id: 'slot_004', startTime: '10:00', endTime: '10:30', status: 'available' },
      { _id: 'slot_005', startTime: '10:30', endTime: '11:00', status: 'available' },
      { _id: 'slot_006', startTime: '14:00', endTime: '14:30', status: 'available' },
      { _id: 'slot_007', startTime: '14:30', endTime: '15:00', status: 'locked' },
      { _id: 'slot_008', startTime: '15:00', endTime: '15:30', status: 'available' }
    ];

    setSlots(mockSlots.filter(s => s.status === 'available'));
  };

  // Handle service change
  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s._id === serviceId);
    setSelectedService(service);
    form.setFieldsValue({ serviceAddOnId: undefined });
  };

  // Handle date change
  const handleDateChange = (date) => {
    setSelectedDate(date);
    form.setFieldsValue({ slotIds: undefined });
  };

  // Calculate total cost
  const calculateTotalCost = () => {
    const serviceId = form.getFieldValue('serviceId');
    const addOnId = form.getFieldValue('serviceAddOnId');
    
    let total = 0;
    
    const service = services.find(s => s._id === serviceId);
    if (service) {
      total += service.price;
    }
    
    if (addOnId && service) {
      const addOn = service.addOns.find(a => a._id === addOnId);
      if (addOn) {
        total += addOn.price;
      }
    }
    
    return total;
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const patient = patients.find(p => p._id === values.patientId);
      const service = services.find(s => s._id === values.serviceId);
      const dentist = dentists.find(d => d._id === values.dentistId);
      const selectedSlots = slots.filter(s => values.slotIds.includes(s._id));
      
      let addOn = null;
      if (values.serviceAddOnId && service) {
        addOn = service.addOns.find(a => a._id === values.serviceAddOnId);
      }

      // Create appointment mock data
      const appointmentData = {
        _id: `apt_${Date.now()}`,
        appointmentCode: `APT${Date.now()}`,
        patientId: patient._id,
        patientName: patient.name,
        patientPhone: patient.phone,
        patientEmail: patient.email,
        serviceId: service._id,
        serviceName: service.name,
        serviceAddOnId: addOn?._id,
        serviceAddOnName: addOn?.name,
        dentistId: dentist._id,
        dentistName: dentist.name,
        date: values.date.format('YYYY-MM-DD'),
        slotIds: values.slotIds,
        startTime: selectedSlots[0].startTime,
        endTime: selectedSlots[selectedSlots.length - 1].endTime,
        totalCost: calculateTotalCost(),
        status: payNow ? 'checked-in' : 'pending',
        paymentStatus: payNow ? 'paid' : 'unpaid',
        notes: values.notes || '',
        createdBy: currentUser._id || 'staff_unknown',
        createdAt: new Date()
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('✅ [Mock] Appointment created:', appointmentData);

      setCreatedAppointment(appointmentData);
      
      if (payNow) {
        // Show payment modal if "Pay now" is checked
        setShowPaymentModal(true);
      } else {
        message.success('Tạo lịch hẹn thành công!');
        handleReset();
        if (onSuccess) {
          onSuccess(appointmentData);
        }
      }
    } catch (error) {
      console.error('Create appointment error:', error);
      message.error('Có lỗi xảy ra khi tạo lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = (payment) => {
    message.success('Tạo lịch hẹn và thanh toán thành công!');
    setShowPaymentModal(false);
    handleReset();
    
    if (onSuccess) {
      onSuccess({ ...createdAppointment, payment });
    }
  };

  // Reset form
  const handleReset = () => {
    form.resetFields();
    setSelectedService(null);
    setSelectedDate(null);
    setCreatedAppointment(null);
    setPayNow(false);
    setCurrentStep(0);
  };

  // Step 1: Patient Selection
  const renderPatientStep = () => (
    <Card title={<Space><UserAddOutlined />Chọn bệnh nhân</Space>} style={{ marginBottom: 16 }}>
      <Form.Item
        name="patientId"
        label="Bệnh nhân"
        rules={[{ required: true, message: 'Vui lòng chọn bệnh nhân' }]}
      >
        <Select
          showSearch
          placeholder="Tìm và chọn bệnh nhân"
          optionFilterProp="children"
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          {patients.map(patient => (
            <Option key={patient._id} value={patient._id}>
              {patient.name} - {patient.phone}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Button type="dashed" block icon={<UserAddOutlined />}>
        Thêm bệnh nhân mới
      </Button>
    </Card>
  );

  // Step 2: Service Selection
  const renderServiceStep = () => (
    <Card title={<Space><MedicineBoxOutlined />Chọn dịch vụ</Space>} style={{ marginBottom: 16 }}>
      <Form.Item
        name="serviceId"
        label="Dịch vụ"
        rules={[{ required: true, message: 'Vui lòng chọn dịch vụ' }]}
      >
        <Select
          placeholder="Chọn dịch vụ khám"
          onChange={handleServiceChange}
        >
          {services.map(service => (
            <Option key={service._id} value={service._id}>
              <Space direction="vertical" size={0} style={{ width: '100%' }}>
                <Text strong>{service.name}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {service.price.toLocaleString('vi-VN')}đ - {service.duration} phút
                </Text>
              </Space>
            </Option>
          ))}
        </Select>
      </Form.Item>

      {selectedService && selectedService.addOns.length > 0 && (
        <Form.Item
          name="serviceAddOnId"
          label="Dịch vụ thêm (tùy chọn)"
        >
          <Select
            placeholder="Chọn dịch vụ thêm"
            allowClear
          >
            {selectedService.addOns.map(addOn => (
              <Option key={addOn._id} value={addOn._id}>
                {addOn.name} - {addOn.price.toLocaleString('vi-VN')}đ
              </Option>
            ))}
          </Select>
        </Form.Item>
      )}

      {form.getFieldValue('serviceId') && (
        <div style={{ 
          background: '#f0f5ff', 
          padding: '12px', 
          borderRadius: '4px',
          marginTop: '16px'
        }}>
          <Text type="secondary">Tổng tiền: </Text>
          <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
            {calculateTotalCost().toLocaleString('vi-VN')}đ
          </Text>
        </div>
      )}
    </Card>
  );

  // Step 3: Schedule Selection
  const renderScheduleStep = () => (
    <Card title={<Space><CalendarOutlined />Chọn lịch khám</Space>} style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="dentistId"
            label="Nha sĩ"
            rules={[{ required: true, message: 'Vui lòng chọn nha sĩ' }]}
          >
            <Select placeholder="Chọn nha sĩ">
              {dentists.map(dentist => (
                <Option key={dentist._id} value={dentist._id}>
                  <Space direction="vertical" size={0}>
                    <Text strong>{dentist.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dentist.specialization}
                    </Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="date"
            label="Ngày khám"
            rules={[{ required: true, message: 'Vui lòng chọn ngày khám' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Chọn ngày"
              format="DD/MM/YYYY"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
              onChange={handleDateChange}
            />
          </Form.Item>
        </Col>
      </Row>

      {selectedDate && form.getFieldValue('dentistId') && (
        <Form.Item
          name="slotIds"
          label="Giờ khám"
          rules={[{ required: true, message: 'Vui lòng chọn giờ khám' }]}
        >
          <Checkbox.Group style={{ width: '100%' }}>
            <Row gutter={[8, 8]}>
              {slots.map(slot => (
                <Col span={6} key={slot._id}>
                  <Checkbox value={slot._id} style={{ width: '100%' }}>
                    <div style={{
                      padding: '8px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}>
                      {slot.startTime}
                    </div>
                  </Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        </Form.Item>
      )}

      <Form.Item
        name="notes"
        label="Ghi chú"
      >
        <Input.TextArea
          rows={3}
          placeholder="Nhập ghi chú về lịch hẹn..."
          maxLength={500}
          showCount
        />
      </Form.Item>

      <Divider />

      <Form.Item name="payNow" valuePropName="checked">
        <Checkbox onChange={(e) => setPayNow(e.target.checked)}>
          <Space>
            <DollarOutlined style={{ color: '#52c41a' }} />
            <Text strong>Thanh toán tiền mặt ngay</Text>
          </Space>
        </Checkbox>
      </Form.Item>
    </Card>
  );

  return (
    <>
      <Card>
        <Title level={3}>
          <Space>
            <UserAddOutlined />
            Tạo lịch hẹn Walk-in
          </Space>
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {renderPatientStep()}
          {renderServiceStep()}
          {renderScheduleStep()}

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleReset}>
              Đặt lại
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<CheckCircleOutlined />}
              size="large"
            >
              {payNow ? 'Tạo lịch hẹn & Thanh toán' : 'Tạo lịch hẹn'}
            </Button>
          </Space>
        </Form>
      </Card>

      {/* Cash Payment Modal */}
      <CashPaymentModal
        visible={showPaymentModal}
        appointment={createdAppointment}
        onSuccess={handlePaymentSuccess}
        onCancel={() => {
          setShowPaymentModal(false);
          message.info('Lịch hẹn đã được tạo nhưng chưa thanh toán');
          handleReset();
        }}
      />
    </>
  );
};

export default WalkInAppointmentForm;

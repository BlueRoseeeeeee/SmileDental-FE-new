/**
 * Cash Payment Modal Component
 * 
 * Allows Admin/Manager to process cash payments for appointments
 * Features:
 * - Display appointment details
 * - Input paid amount
 * - Auto-calculate change
 * - Print receipt
 * - Update appointment payment status
 */

import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Button, 
  Space, 
  Divider,
  Row,
  Col,
  Typography,
  Tag,
  Statistic,
  message,
  Spin
} from 'antd';
import {
  DollarOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  CalendarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { createCashPayment, printReceipt } from '../../services/mockPaymentService';

const { Title, Text } = Typography;

const CashPaymentModal = ({ visible, appointment, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  // Calculate change when paid amount changes
  useEffect(() => {
    if (appointment && paidAmount >= 0) {
      const change = paidAmount - appointment.totalCost;
      setChangeAmount(change >= 0 ? change : 0);
    }
  }, [paidAmount, appointment]);

  // Reset form when modal opens
  useEffect(() => {
    if (visible && appointment) {
      form.setFieldsValue({
        paidAmount: appointment.totalCost,
        notes: ''
      });
      setPaidAmount(appointment.totalCost);
    }
  }, [visible, appointment, form]);

  // Handle paid amount change
  const handlePaidAmountChange = (value) => {
    setPaidAmount(value || 0);
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (paidAmount < appointment.totalCost) {
        message.error('Số tiền khách đưa phải lớn hơn hoặc bằng tổng tiền cần thanh toán');
        return;
      }

      setLoading(true);

      // Create cash payment
      const paymentData = {
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        patientInfo: {
          name: appointment.patientName,
          phone: appointment.patientPhone,
          email: appointment.patientEmail || ''
        },
        amount: appointment.totalCost,
        paidAmount: values.paidAmount,
        changeAmount: changeAmount,
        processedBy: currentUser._id || 'staff_unknown',
        processedByName: currentUser.name || 'Unknown Staff',
        description: `Thanh toán khám ${appointment.serviceName}`,
        notes: values.notes || ''
      };

      const response = await createCashPayment(paymentData);

      if (response.success) {
        message.success('Thanh toán thành công!');

        // Print receipt
        printReceipt(response.data);

        // Call success callback
        if (onSuccess) {
          onSuccess(response.data);
        }

        // Close modal
        handleCancel();
      }
    } catch (error) {
      console.error('Cash payment error:', error);
      message.error(error.message || 'Có lỗi xảy ra khi thanh toán');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    form.resetFields();
    setPaidAmount(0);
    setChangeAmount(0);
    if (onCancel) {
      onCancel();
    }
  };

  if (!appointment) return null;

  return (
    <Modal
      title={
        <Space>
          <DollarOutlined style={{ fontSize: 24, color: '#52c41a' }} />
          <Title level={4} style={{ margin: 0 }}>Thanh toán tiền mặt</Title>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={loading}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          icon={<CheckCircleOutlined />}
        >
          Xác nhận thanh toán
        </Button>
      ]}
    >
      <Spin spinning={loading}>
        {/* Appointment Information */}
        <div style={{ 
          background: '#f5f5f5', 
          padding: '16px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <Title level={5}>Thông tin lịch hẹn</Title>
          
          <Row gutter={[16, 12]}>
            <Col span={12}>
              <Space>
                <UserOutlined />
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Bệnh nhân</Text>
                  <br />
                  <Text strong>{appointment.patientName}</Text>
                </div>
              </Space>
            </Col>
            
            <Col span={12}>
              <Space>
                <PhoneOutlined />
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Số điện thoại</Text>
                  <br />
                  <Text strong>{appointment.patientPhone}</Text>
                </div>
              </Space>
            </Col>
            
            <Col span={12}>
              <Space>
                <CalendarOutlined />
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Ngày khám</Text>
                  <br />
                  <Text strong>
                    {new Date(appointment.date).toLocaleDateString('vi-VN')}
                  </Text>
                </div>
              </Space>
            </Col>
            
            <Col span={12}>
              <Space>
                <ClockCircleOutlined />
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Giờ khám</Text>
                  <br />
                  <Text strong>{appointment.startTime} - {appointment.endTime}</Text>
                </div>
              </Space>
            </Col>
          </Row>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <Row gutter={[16, 8]}>
            <Col span={24}>
              <Text type="secondary">Dịch vụ: </Text>
              <Text strong>{appointment.serviceName}</Text>
              {appointment.serviceAddOnName && (
                <>
                  <br />
                  <Text type="secondary">Dịch vụ thêm: </Text>
                  <Text strong>{appointment.serviceAddOnName}</Text>
                </>
              )}
            </Col>
            
            <Col span={24}>
              <Text type="secondary">Nha sĩ: </Text>
              <Text strong>{appointment.dentistName}</Text>
            </Col>
          </Row>
        </div>

        {/* Payment Form */}
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            paidAmount: appointment.totalCost,
            notes: ''
          }}
        >
          {/* Total Amount */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={8}>
              <Statistic
                title="Tổng tiền"
                value={appointment.totalCost}
                suffix="đ"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Tiền khách đưa"
                value={paidAmount}
                suffix="đ"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Tiền thừa"
                value={changeAmount}
                suffix="đ"
                valueStyle={{ 
                  color: changeAmount > 0 ? '#faad14' : '#999'
                }}
              />
            </Col>
          </Row>

          {/* Paid Amount Input */}
          <Form.Item
            name="paidAmount"
            label="Số tiền khách đưa"
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền khách đưa' },
              { 
                type: 'number', 
                min: 0, 
                message: 'Số tiền phải lớn hơn 0' 
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Nhập số tiền khách đưa"
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              addonAfter="đ"
              size="large"
              onChange={handlePaidAmountChange}
            />
          </Form.Item>

          {/* Quick Amount Buttons */}
          <Form.Item label="Chọn nhanh">
            <Space wrap>
              <Button
                onClick={() => {
                  form.setFieldsValue({ paidAmount: appointment.totalCost });
                  setPaidAmount(appointment.totalCost);
                }}
              >
                Vừa đủ ({appointment.totalCost.toLocaleString('vi-VN')}đ)
              </Button>
              <Button
                onClick={() => {
                  const rounded = Math.ceil(appointment.totalCost / 50000) * 50000;
                  form.setFieldsValue({ paidAmount: rounded });
                  setPaidAmount(rounded);
                }}
              >
                Làm tròn ({Math.ceil(appointment.totalCost / 50000) * 50000}đ)
              </Button>
              <Button
                onClick={() => {
                  form.setFieldsValue({ paidAmount: 500000 });
                  setPaidAmount(500000);
                }}
              >
                500,000đ
              </Button>
              <Button
                onClick={() => {
                  form.setFieldsValue({ paidAmount: 1000000 });
                  setPaidAmount(1000000);
                }}
              >
                1,000,000đ
              </Button>
            </Space>
          </Form.Item>

          {/* Notes */}
          <Form.Item
            name="notes"
            label="Ghi chú (tùy chọn)"
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập ghi chú về thanh toán..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          {/* Warning if insufficient */}
          {paidAmount < appointment.totalCost && paidAmount > 0 && (
            <div style={{ 
              background: '#fff7e6', 
              border: '1px solid #ffd591',
              padding: '12px',
              borderRadius: '4px',
              marginTop: '-10px'
            }}>
              <Space>
                <CloseCircleOutlined style={{ color: '#fa8c16' }} />
                <Text type="warning">
                  Số tiền khách đưa chưa đủ. Thiếu {(appointment.totalCost - paidAmount).toLocaleString('vi-VN')}đ
                </Text>
              </Space>
            </div>
          )}
        </Form>
      </Spin>
    </Modal>
  );
};

export default CashPaymentModal;

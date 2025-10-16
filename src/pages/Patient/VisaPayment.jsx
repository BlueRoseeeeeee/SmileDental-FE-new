import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form,
  Input,
  Button, 
  Typography, 
  Space,
  message,
  Spin,
  Row,
  Col,
  Divider,
  Alert
} from 'antd';
import { 
  CreditCardOutlined,
  LockOutlined,
  ArrowLeftOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { paymentService } from '../../services';
import './VisaPayment.css';

const { Title, Text } = Typography;

const VisaPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const reservation = location.state?.reservation;
  const amount = location.state?.amount;

  useEffect(() => {
    if (!reservation || !amount) {
      message.error('Thông tin thanh toán không hợp lệ');
      navigate('/patient/booking/select-service');
    }
  }, [reservation, amount, navigate]);

  if (!reservation || !amount) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amt);
  };

  const handlePayment = async (values) => {
    try {
      setProcessingPayment(true);
      
      // Call payment API
      const paymentData = {
        reservationId: reservation.reservationId,
        amount: amount,
        paymentMethod: 'visa',
        cardNumber: values.cardNumber.replace(/\s/g, ''),
        cardHolder: values.cardHolder,
        expiryMonth: values.expiry.split('/')[0],
        expiryYear: '20' + values.expiry.split('/')[1],
        cvv: values.cvv
      };

      const response = await paymentService.processVisaPayment(paymentData);
      
      if (response.success) {
        message.success('Thanh toán thành công!');
        
        // Navigate to success page
        navigate('/patient/payment/success', {
          state: {
            reservation: reservation,
            payment: response.data,
            appointmentId: response.data.appointmentId
          }
        });
      } else {
        message.error(response.message || 'Thanh toán thất bại');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi xử lý thanh toán');
      
      // Navigate to failed page
      navigate('/patient/payment/failed', {
        state: {
          reservation: reservation,
          error: error.response?.data?.message || 'Payment failed'
        }
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  return (
    <div className="visa-payment-container">
      <Card className="visa-payment-card">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <Title level={2}>
              <CreditCardOutlined /> Thanh toán Visa/MasterCard
            </Title>
            <Text type="secondary">
              Môi trường Sandbox - Test Payment
            </Text>
          </div>

          {/* Amount Display */}
          <Card 
            type="inner"
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textAlign: 'center'
            }}
          >
            <Text style={{ color: 'white', fontSize: 16 }}>Tổng thanh toán</Text>
            <br />
            <Title level={1} style={{ color: 'white', margin: '8px 0' }}>
              {formatCurrency(amount)}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }} code>
              {reservation.reservationId}
            </Text>
          </Card>

          {/* Sandbox Test Card Info */}
          <Alert
            message="Thông tin thẻ test (Sandbox)"
            description={
              <div>
                <Text><strong>Card Number:</strong> 4111 1111 1111 1111</Text><br />
                <Text><strong>Expiry:</strong> 12/25</Text><br />
                <Text><strong>CVV:</strong> 123</Text><br />
                <Text><strong>Cardholder:</strong> TEST USER</Text>
              </div>
            }
            type="info"
            showIcon
            icon={<SafetyOutlined />}
          />

          {/* Payment Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handlePayment}
            initialValues={{
              cardNumber: '4111 1111 1111 1111',
              cardHolder: 'TEST USER',
              expiry: '12/25',
              cvv: '123'
            }}
          >
            <Form.Item
              label="Số thẻ"
              name="cardNumber"
              rules={[
                { required: true, message: 'Vui lòng nhập số thẻ' },
                { 
                  pattern: /^[\d\s]{19}$/, 
                  message: 'Số thẻ không hợp lệ' 
                }
              ]}
            >
              <Input
                size="large"
                placeholder="4111 1111 1111 1111"
                prefix={<CreditCardOutlined />}
                maxLength={19}
                onChange={(e) => {
                  const formatted = formatCardNumber(e.target.value);
                  form.setFieldsValue({ cardNumber: formatted });
                }}
              />
            </Form.Item>

            <Form.Item
              label="Tên chủ thẻ"
              name="cardHolder"
              rules={[
                { required: true, message: 'Vui lòng nhập tên chủ thẻ' },
                { min: 3, message: 'Tên chủ thẻ quá ngắn' }
              ]}
            >
              <Input
                size="large"
                placeholder="NGUYEN VAN A"
                style={{ textTransform: 'uppercase' }}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Ngày hết hạn (MM/YY)"
                  name="expiry"
                  rules={[
                    { required: true, message: 'Vui lòng nhập ngày hết hạn' },
                    { 
                      pattern: /^(0[1-9]|1[0-2])\/\d{2}$/, 
                      message: 'Định dạng MM/YY' 
                    }
                  ]}
                >
                  <Input
                    size="large"
                    placeholder="MM/YY"
                    maxLength={5}
                    onChange={(e) => {
                      const formatted = formatExpiry(e.target.value);
                      form.setFieldsValue({ expiry: formatted });
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="CVV"
                  name="cvv"
                  rules={[
                    { required: true, message: 'Vui lòng nhập CVV' },
                    { pattern: /^\d{3,4}$/, message: 'CVV không hợp lệ' }
                  ]}
                >
                  <Input
                    size="large"
                    placeholder="123"
                    maxLength={4}
                    type="password"
                    prefix={<LockOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* Security Notice */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Space>
                <LockOutlined style={{ color: '#52c41a' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Thông tin của bạn được mã hóa và bảo mật
                </Text>
              </Space>
            </div>

            {/* Action Buttons */}
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button 
                icon={<ArrowLeftOutlined />}
                size="large"
                onClick={() => navigate(-1)}
                disabled={processingPayment}
              >
                Quay lại
              </Button>
              
              <Button 
                type="primary"
                htmlType="submit"
                size="large"
                icon={<CreditCardOutlined />}
                loading={processingPayment}
                style={{ 
                  backgroundColor: '#2c5f4f', 
                  borderColor: '#2c5f4f',
                  minWidth: 200
                }}
              >
                Thanh toán {formatCurrency(amount)}
              </Button>
            </Space>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default VisaPayment;

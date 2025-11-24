import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Radio, 
  Button, 
  Typography, 
  Descriptions, 
  Space,
  Spin,
  message,
  Result
} from 'antd';
import { 
  CreditCardOutlined,
  ArrowLeftOutlined,
  DollarOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import './PaymentSelection.css';

const { Title, Text } = Typography;

const PaymentSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('vnpay'); // Default to VNPay
  
  // Get reservation data from location state
  const reservationData = location.state?.reservation;

  useEffect(() => {
    if (!reservationData) {
      message.error('Không tìm thấy thông tin đặt khám. Vui lòng thử lại.');
      navigate('/patient/booking/select-service');
    }
  }, [reservationData, navigate]);

  if (!reservationData) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const handlePayment = async () => {
    console.log('🔵 [Payment Selection] handlePayment called');
    console.log('🔵 [Payment Selection] Payment method:', paymentMethod);
    console.log('🔵 [Payment Selection] Reservation data:', reservationData);
    console.log('🔵 [Payment Selection] orderId from data:', reservationData?.orderId);
    console.log('🔵 [Payment Selection] amount from data:', reservationData?.amount, reservationData?.servicePrice);
    
    // Get orderId and amount with fallbacks
    const orderId = reservationData?.orderId || reservationData?.reservationId;
    const amount = reservationData?.amount || reservationData?.servicePrice || 0;
    
    console.log('🔵 [Payment Selection] Final orderId:', orderId);
    console.log('🔵 [Payment Selection] Final amount:', amount);
    
    if (!orderId || !amount) {
      console.error('❌ [Payment Selection] Missing orderId or amount!');
      message.error('Thiếu thông tin thanh toán. Vui lòng thử lại.');
      return;
    }
    
    try {
      setLoading(true);
      
      if (paymentMethod === 'vnpay') {
        console.log('🔵 [Payment Selection] Creating VNPay payment URL...');
        
        const requestBody = {
          orderId: orderId,
          amount: amount,
          orderInfo: `Thanh toan dat lich kham nha khoa - ${orderId}`,
          locale: 'vn'
        };
        
        console.log('🔵 [Payment Selection] Request body:', requestBody);
        
        // Call payment service to create VNPay URL
        const PAYMENT_API = import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:3007/api';
        const response = await fetch(`${PAYMENT_API}/payments/vnpay/create-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        console.log('🔵 [Payment Selection] VNPay response:', data);

        if (data.success && data.data.paymentUrl) {
          console.log('✅ [Payment Selection] Redirecting to VNPay:', data.data.paymentUrl);
          message.success('Đang chuyển đến VNPay...');
          
          // Redirect to VNPay Sandbox after short delay
          setTimeout(() => {
            window.location.href = data.data.paymentUrl;
          }, 500);
        } else {
          throw new Error(data.message || 'Không thể tạo URL thanh toán VNPay');
        }
      } else if (paymentMethod === 'stripe') {
        console.log('🟣 [Payment Selection] Creating Stripe payment session...');
        
        const requestBody = {
          orderId: orderId,
          amount: amount,
          orderInfo: `Thanh toan dat lich kham nha khoa - ${orderId}`,
          customerEmail: reservationData.email || null,
          metadata: {
            patientName: reservationData.patientName,
            serviceName: reservationData.serviceName,
            appointmentDate: reservationData.appointmentDate
          }
        };
        
        console.log('🟣 [Payment Selection] Request body:', requestBody);
        
        // Call payment service to create Stripe checkout session
        const PAYMENT_API = import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:3007/api';
        const response = await fetch(`${PAYMENT_API}/payments/stripe/create-payment-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        console.log('🟣 [Payment Selection] Stripe response:', data);
        console.log('🔍 [Payment Selection] data.data:', data.data);
        console.log('🔍 [Payment Selection] data.data keys:', data.data ? Object.keys(data.data) : 'undefined');
        console.log('🔍 [Payment Selection] paymentUrl:', data.data?.paymentUrl);

        if (data.success && data.data && data.data.paymentUrl) {
          console.log('✅ [Payment Selection] Redirecting to Stripe:', data.data.paymentUrl);
          message.success('Đang chuyển đến Stripe...');
          
          // Redirect to Stripe Checkout after short delay
          setTimeout(() => {
            window.location.href = data.data.paymentUrl;
          }, 500);
        } else {
          throw new Error(data.message || 'Không thể tạo Stripe checkout session');
        }
      } else if (paymentMethod === 'visa') {
        // Navigate to Visa payment page
        navigate('/patient/payment/visa', {
          state: { 
            reservation: reservationData,
            amount: reservationData.servicePrice
          }
        });
      } else {
        message.info('Phương thức thanh toán này đang được phát triển');
      }
      
    } catch (error) {
      console.error('❌ [Payment Selection] Payment error:', error);
      message.error(error.message || 'Có lỗi xảy ra khi xử lý thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="payment-selection-container">
      <Card className="payment-card">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <Title level={2}>
              <DollarOutlined /> Chọn phương thức thanh toán
            </Title>
            <Text type="secondary">
              Vui lòng chọn phương thức thanh toán để hoàn tất đặt khám
            </Text>
          </div>

          {/* Reservation Summary */}
          <Card type="inner" title="Thông tin đặt khám">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Mã đặt khám">
                <Text code strong style={{ fontSize: 14 }}>
                  {reservationData.reservationId || reservationData.orderId || 'Đang cập nhật'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Dịch vụ">
                <Text>{reservationData.serviceName || 'Đang cập nhật'}</Text>
              </Descriptions.Item>
              {reservationData.serviceAddOnName && (
                <Descriptions.Item label="Gói dịch vụ">
                  <Text>{reservationData.serviceAddOnName}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Nha sĩ">
                {reservationData.dentistName || 'Đang cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày khám">
                {reservationData.appointmentDate 
                  ? dayjs(reservationData.appointmentDate).format('DD/MM/YYYY')
                  : 'Đang cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item label="Giờ khám">
                {reservationData.startTime && reservationData.endTime
                  ? `${reservationData.startTime} - ${reservationData.endTime}`
                  : 'Sẽ được thông báo'}
              </Descriptions.Item>
              <Descriptions.Item label="Phòng">
                {reservationData.roomName || 'Sẽ được thông báo'}
                {reservationData.subroomName && (
                  <Text type="secondary"> - {reservationData.subroomName}</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                <Text strong style={{ fontSize: 18, color: '#2c5f4f' }}>
                  {reservationData.servicePrice || reservationData.amount 
                    ? formatCurrency(reservationData.servicePrice || reservationData.amount)
                    : '0 ₫'}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Payment Method Selection */}
          <Card type="inner" title="Phương thức thanh toán">
            <Radio.Group 
              onChange={(e) => setPaymentMethod(e.target.value)}
              value={paymentMethod}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* VNPay Option */}
                <Radio value="vnpay" style={{ width: '100%' }}>
                  <Card 
                    hoverable
                    style={{ 
                      marginLeft: 24,
                      border: paymentMethod === 'vnpay' ? '2px solid #2c5f4f' : '1px solid #d9d9d9'
                    }}
                  >
                    <Space>
                      <CreditCardOutlined style={{ fontSize: 32, color: '#0066CC' }} />
                      <div>
                        <Text strong style={{ fontSize: 16 }}>
                          VNPay
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          ATM / Internet Banking / Ví điện tử / Thẻ quốc tế
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Radio>

                {/* Stripe Option */}
                <Radio value="stripe" style={{ width: '100%' }}>
                  <Card 
                    hoverable
                    style={{ 
                      marginLeft: 24,
                      border: paymentMethod === 'stripe' ? '2px solid #2c5f4f' : '1px solid #d9d9d9'
                    }}
                  >
                    <Space>
                      <CreditCardOutlined style={{ fontSize: 32, color: '#635bff' }} />
                      <div>
                        <Text strong style={{ fontSize: 16 }}>
                          Stripe
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Visa / MasterCard / American Express / Thẻ quốc tế
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Radio>
              </Space>
            </Radio.Group>
          </Card>

          {/* Payment Notice */}
          <Card 
            type="inner" 
            style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}
          >
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              <div>
                <Text strong>Lưu ý quan trọng:</Text>
                <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                  <li>Sau khi thanh toán thành công, lịch khám của bạn sẽ được xác nhận</li>
                  <li>Vui lòng hoàn tất thanh toán trong vòng <Text strong style={{ color: '#ff4d4f' }}>15 phút</Text></li>
                  <li>Sau 15 phút, đặt khám sẽ tự động hủy và bạn cần đặt lại</li>
                  <li>Thông tin thanh toán được mã hóa và bảo mật tuyệt đối</li>
                </ul>
              </div>
            </Space>
          </Card>

          {/* Action Buttons */}
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button 
              type="primary"
              size="large"
              icon={<CreditCardOutlined />}
              onClick={handlePayment}
              loading={loading}
              style={{ 
                backgroundColor: '#2c5f4f', 
                borderColor: '#2c5f4f',
                minWidth: 200
              }}
            >
              Tiến hành thanh toán
            </Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default PaymentSelection;

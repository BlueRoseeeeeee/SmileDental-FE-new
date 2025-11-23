import React from 'react';
import { Result, Button, Card, Descriptions, Typography, Space } from 'antd';
import { CheckCircleOutlined, HomeOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { reservation, payment, appointmentId } = location.state || {};

  if (!reservation || !payment) {
    return (
      <Result
        status="warning"
        title="Không tìm thấy thông tin thanh toán"
        extra={
          <Button type="primary" onClick={() => navigate('/patient')}>
            Về trang chủ
          </Button>
        }
      />
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <Result
        status="success"
        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        title={
          <Title level={2} style={{ color: '#52c41a' }}>
            Thanh toán thành công!
          </Title>
        }
        subTitle="Lịch khám của bạn đã được xác nhận. Chúng tôi sẽ gửi thông tin chi tiết qua email."
        extra={[
          <Button 
            type="primary" 
            key="appointments"
            icon={<CalendarOutlined />}
            onClick={() => navigate('/patient/appointments')}
            style={{ backgroundColor: '#2c5f4f', borderColor: '#2c5f4f' }}
          >
            Xem lịch khám của tôi
          </Button>,
          <Button 
            key="home"
            icon={<HomeOutlined />}
            onClick={() => navigate('/patient')}
          >
            Về trang chủ
          </Button>
        ]}
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="Thông tin đặt khám" bordered>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Mã đặt khám">
              <Text code strong>{reservation.reservationId}</Text>
            </Descriptions.Item>
            {appointmentId && (
              <Descriptions.Item label="Mã lịch khám">
                <Text code strong>{appointmentId}</Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Dịch vụ">
              <Text strong>{reservation.serviceName}</Text>
              {reservation.serviceAddOnName && (
                <Text type="secondary"> + {reservation.serviceAddOnName}</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Nha sĩ">
              {reservation.dentistName}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày khám">
              {dayjs(reservation.appointmentDate).format('DD/MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ khám">
              {reservation.startTime} - {reservation.endTime}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Thông tin thanh toán" bordered>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Mã giao dịch">
              <Text code>{payment.transactionId || payment.paymentId}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Phương thức">
              Thẻ Visa/MasterCard
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền">
              <Text strong style={{ fontSize: 16, color: '#2c5f4f' }}>
                {formatCurrency(payment.amount || reservation.servicePrice)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Text style={{ color: '#52c41a' }} strong>Thành công</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {dayjs().format('DD/MM/YYYY HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card type="inner" style={{ background: '#e6f7ff', border: '1px solid #91d5ff' }}>
          <Space direction="vertical">
            <Text strong>Lưu ý:</Text>
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>Vui lòng đến phòng khám trước giờ hẹn 10 phút</li>
              <li>Mang theo giấy tờ tùy thân và thông tin bảo hiểm (nếu có)</li>
              <li>Liên hệ hotline: 1900-xxxx nếu cần hỗ trợ</li>
            </ul>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default PaymentSuccess;

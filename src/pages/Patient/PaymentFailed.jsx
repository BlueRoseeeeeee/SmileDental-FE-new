import React from 'react';
import { Result, Button, Card, Alert, Typography, Space } from 'antd';
import { CloseCircleOutlined, HomeOutlined, RedoOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Text, Paragraph } = Typography;

const PaymentFailed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { reservation, error } = location.state || {};

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <Result
        status="error"
        icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
        title="Thanh toán thất bại"
        subTitle="Rất tiếc, giao dịch thanh toán của bạn không thành công. Vui lòng thử lại."
        extra={[
          <Button 
            type="primary" 
            key="retry"
            icon={<RedoOutlined />}
            onClick={() => navigate('/patient/booking/select-service')}
            danger
          >
            Đặt lại lịch khám
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
        {error && (
          <Alert
            message="Lỗi thanh toán"
            description={error}
            type="error"
            showIcon
          />
        )}

        {reservation && (
          <Card title="Thông tin đặt khám đã hủy" bordered>
            <Paragraph>
              <Text strong>Mã đặt khám:</Text> <Text code>{reservation.reservationId}</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>Dịch vụ:</Text> {reservation.serviceName}
            </Paragraph>
            <Paragraph>
              <Text strong>Nha sĩ:</Text> {reservation.dentistName}
            </Paragraph>
          </Card>
        )}

        <Card type="inner" style={{ background: '#fff7e6', border: '1px solid #ffd591' }}>
          <Space direction="vertical">
            <Text strong>Nguyên nhân có thể:</Text>
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>Thông tin thẻ không chính xác</li>
              <li>Không đủ số dư trong tài khoản</li>
              <li>Thẻ đã hết hạn hoặc bị khóa</li>
              <li>Vượt quá thời gian thanh toán (15 phút)</li>
            </ul>
            <Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
              <Text strong>Cần hỗ trợ?</Text> Liên hệ hotline: <Text strong>1900-xxxx</Text>
            </Paragraph>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default PaymentFailed;

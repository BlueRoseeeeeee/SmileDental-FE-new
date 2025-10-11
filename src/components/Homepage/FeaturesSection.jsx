/*
* @author: HoTram
*/
import React from 'react';
import { Row, Col, Typography, Space } from 'antd';
import { 
  PhoneOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const FeaturesSection = () => {
  const features = [
    'Đội ngũ bác sĩ chuyên nghiệp',
    'Trang thiết bị hiện đại',
    'Môi trường vô trùng tuyệt đối',
    'Dịch vụ chăm sóc tận tâm',
    'Bảo hành dài hạn',
    'Giá cả hợp lý'
  ];

  return (
    <div style={{ padding: '80px 24px', background: '#f5f5f5' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Row gutter={[48, 48]} align="middle">
          <Col xs={24} lg={12}>
            <Title level={2} style={{ color: '#262626', marginBottom: '24px' }}>
              Tại sao chọn SmileDental?
            </Title>
            <Text style={{ fontSize: '16px', color: '#8c8c8c', marginBottom: '32px', display: 'block' }}>
              Chúng tôi cam kết mang đến dịch vụ nha khoa tốt nhất với những ưu điểm vượt trội:
            </Text>
            <Row gutter={[16, 16]}>
              {features.map((feature, index) => (
                <Col xs={24} sm={12} key={index}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '12px' }} />
                    <Text style={{ fontSize: '16px' }}>{feature}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Col>
          <Col xs={24} lg={12}>
            <div style={{ 
              background: 'linear-gradient(135deg, #2596be 0%, #40a9ff 100%)',
              borderRadius: '12px',
              padding: '40px',
              color: 'white',
              textAlign: 'center'
            }}>
              <Title level={3} style={{ color: 'white', marginBottom: '24px' }}>
                Liên hệ ngay
              </Title>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhoneOutlined style={{ marginRight: '12px' }} />
                  <Text style={{ color: 'white', fontSize: '18px' }}>190000010</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <EnvironmentOutlined style={{ marginRight: '12px' }} />
                  <Text style={{ color: 'white', fontSize: '16px' }}>
                    Nguyễn Văn Bảo, Gò Vấp, TP.HCM
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ClockCircleOutlined style={{ marginRight: '12px' }} />
                  <Text style={{ color: 'white', fontSize: '16px' }}>
                    8:30 - 18:30 (Tất cả các ngày)
                  </Text>
                </div>
              </Space>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default FeaturesSection;

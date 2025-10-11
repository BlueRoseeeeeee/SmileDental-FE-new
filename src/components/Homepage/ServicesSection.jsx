/*
* @author: HoTram
*/
import React from 'react';
import { Row, Col, Card, Typography } from 'antd';
import { 
  HeartOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  StarOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ServicesSection = () => {
  const services = [
    {
      icon: <MedicineBoxOutlined style={{ fontSize: '32px', color: '#2596be' }} />,
      title: 'Nha khoa tổng quát',
      description: 'Khám và điều trị các vấn đề răng miệng cơ bản'
    },
    {
      icon: <HeartOutlined style={{ fontSize: '32px', color: '#2596be' }} />,
      title: 'Nha khoa thẩm mỹ',
      description: 'Làm đẹp nụ cười với các dịch vụ thẩm mỹ chuyên nghiệp'
    },
    {
      icon: <TeamOutlined style={{ fontSize: '32px', color: '#2596be' }} />,
      title: 'Chỉnh nha',
      description: 'Niềng răng và chỉnh hình răng miệng cho mọi lứa tuổi'
    },
    {
      icon: <StarOutlined style={{ fontSize: '32px', color: '#2596be' }} />,
      title: 'Cấy ghép implant',
      description: 'Phục hồi răng mất với công nghệ implant hiện đại'
    }
  ];

  return (
    <div style={{ padding: '80px 24px', background: 'white' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <Title level={2} style={{ color: '#262626', marginBottom: '16px' }}>
            Dịch vụ của chúng tôi
          </Title>
          <Text style={{ fontSize: '18px', color: '#8c8c8c', maxWidth: '600px', margin: '0 auto', display: 'block' }}>
            Cung cấp đầy đủ các dịch vụ nha khoa từ cơ bản đến chuyên sâu
          </Text>
        </div>
        
        <Row gutter={[32, 32]}>
          {services.map((service, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card
                hoverable
                style={{ 
                  textAlign: 'center',
                  height: '100%',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                bodyStyle={{ padding: '32px 24px' }}
              >
                <div style={{ marginBottom: '16px' }}>
                  {service.icon}
                </div>
                <Title level={4} style={{ marginBottom: '12px' }}>
                  {service.title}
                </Title>
                <Text style={{ color: '#8c8c8c' }}>
                  {service.description}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default ServicesSection;

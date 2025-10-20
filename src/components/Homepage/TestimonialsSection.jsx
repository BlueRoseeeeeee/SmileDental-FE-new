/*
* @author: HoTram
*/
import React from 'react';
import { Row, Col, Card, Typography } from 'antd';
import { StarOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Nguyễn Văn A',
      role: 'Khách hàng',
      content: 'Dịch vụ rất tốt, bác sĩ tận tâm và chuyên nghiệp. Tôi rất hài lòng với kết quả.',
      rating: 5
    },
    {
      name: 'Trần Thị B',
      role: 'Khách hàng',
      content: 'Phòng khám sạch sẽ, thiết bị hiện đại. Nhân viên phục vụ rất nhiệt tình.',
      rating: 5
    },
    {
      name: 'Lê Văn C',
      role: 'Khách hàng',
      content: 'Quy trình khám bệnh nhanh chóng, bác sĩ giải thích rõ ràng. Rất đáng tin cậy.',
      rating: 5
    }
  ];

  return (
    <div style={{ padding: '80px 24px', background: 'white' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <Title level={2} style={{ color: '#262626', marginBottom: '16px' }}>
            Khách hàng nói gì về chúng tôi
          </Title>
          <Text style={{ fontSize: '18px', color: '#8c8c8c', display: 'block' }}>
            Những phản hồi tích cực từ khách hàng đã tin tưởng sử dụng dịch vụ
          </Text>
        </div>
        
        <Row gutter={[32, 32]}>
          {testimonials.map((testimonial, index) => (
            <Col xs={24} md={8} key={index}>
              <Card
                style={{ 
                  height: '100%',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#2596be',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: 'bold'
                  }}>
                    {testimonial.name.charAt(0)}
                  </div>
                  <Title level={4} style={{ margin: '0 0 4px' }}>
                    {testimonial.name}
                  </Title>
                  <Text type="secondary">{testimonial.role}</Text>
                </div>
                <Paragraph style={{ textAlign: 'center', fontStyle: 'italic' }}>
                  "{testimonial.content}"
                </Paragraph>
                <div style={{ textAlign: 'center' }}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarOutlined key={i} style={{ color: '#faad14' }} />
                  ))}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default TestimonialsSection;

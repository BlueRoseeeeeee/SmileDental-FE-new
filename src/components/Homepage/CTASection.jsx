/*
* @author: HoTram
*/
import React from 'react';
import { Typography, Button } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #2596be 0%, #40a9ff 100%)',
      color: 'white',
      padding: '80px 24px',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Title level={2} style={{ color: 'white', marginBottom: '16px' }}>
          Sẵn sàng có nụ cười đẹp?
        </Title>
        <Paragraph style={{ 
          color: 'rgba(255,255,255,0.9)', 
          fontSize: '18px', 
          marginBottom: '32px' 
        }}>
          Đặt lịch hẹn ngay hôm nay để được tư vấn miễn phí và chăm sóc chuyên nghiệp
        </Paragraph>
        <Button 
          type="primary" 
          size="large"
          icon={<CalendarOutlined />}
          style={{ 
            background: 'white',
            color: '#2596be',
            border: 'none',
            height: '48px',
            padding: '0 32px',
            borderRadius: '24px',
            fontWeight: '600'
          }}
          onClick={() => navigate('/login')}
        >
          Đặt lịch ngay
        </Button>
      </div>
    </div>
  );
};

export default CTASection;

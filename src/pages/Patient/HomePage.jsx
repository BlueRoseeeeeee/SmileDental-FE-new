import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Row, Col, Typography, Space } from 'antd';
import { 
  CalendarOutlined, 
  TeamOutlined, 
  MedicineBoxOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  MailOutlined,
  LoginOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext.jsx';
import './HomePage.css';

const { Title, Text, Paragraph } = Typography;

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleBookAppointment = () => {
    if (!isAuthenticated) {
      // Chưa đăng nhập -> redirect đến login
      navigate('/login', { state: { from: '/patient/booking/select-service' } });
    } else {
      // Đã đăng nhập -> vào booking flow
      navigate('/patient/booking/select-service');
    }
  };

  const handleLoginClick = () => {
    if (isAuthenticated) {
      // Đã đăng nhập -> redirect theo role
      if (user?.role === 'patient') {
        navigate('/patient/appointments');
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="patient-home-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-overlay">
          <div className="hero-content">
            <Title level={1} style={{ color: 'white', marginBottom: 16 }}>
              Smile Care
            </Title>
            <Title level={2} style={{ color: 'white', marginBottom: 24 }}>
              Dental Clinic
            </Title>
            <Paragraph style={{ color: 'white', fontSize: 18, marginBottom: 32 }}>
              Chăm sóc nụ cười của bạn với đội ngũ nha khoa chuyên nghiệp
            </Paragraph>
            <Space size="large">
              <Button 
                type="primary" 
                size="large" 
                icon={<CalendarOutlined />}
                onClick={handleBookAppointment}
                style={{ 
                  height: 50, 
                  fontSize: 16,
                  borderRadius: 8,
                  backgroundColor: '#2c5f4f',
                  borderColor: '#2c5f4f'
                }}
              >
                Đặt lịch khám
              </Button>
              {(!isAuthenticated || user?.role === 'patient') && (
                <Button 
                  size="large"
                  icon={<LoginOutlined />}
                  onClick={handleLoginClick}
                  style={{ 
                    height: 50, 
                    fontSize: 16,
                    borderRadius: 8,
                    backgroundColor: 'white',
                    color: '#2c5f4f'
                  }}
                >
                  {isAuthenticated ? 'Lịch khám của tôi' : 'Đăng nhập'}
                </Button>
              )}
            </Space>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="services-section">
        <div className="container">
          <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>
            Dịch vụ của chúng tôi
          </Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={8}>
              <Card 
                hoverable
                className="service-card"
                cover={
                  <div className="service-icon">
                    <MedicineBoxOutlined style={{ fontSize: 48, color: '#2c5f4f' }} />
                  </div>
                }
              >
                <Title level={4}>Khám - Gặp bác sĩ tư vấn</Title>
                <Paragraph>
                  Tư vấn và khám tổng quát răng miệng với đội ngũ bác sĩ giàu kinh nghiệm
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card 
                hoverable
                className="service-card"
                cover={
                  <div className="service-icon">
                    <TeamOutlined style={{ fontSize: 48, color: '#2c5f4f' }} />
                  </div>
                }
              >
                <Title level={4}>Lấy cao răng</Title>
                <Paragraph>
                  Vệ sinh răng miệng chuyên sâu, làm sạch cao răng và mảng bám
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card 
                hoverable
                className="service-card"
                cover={
                  <div className="service-icon">
                    <MedicineBoxOutlined style={{ fontSize: 48, color: '#2c5f4f' }} />
                  </div>
                }
              >
                <Title level={4}>Nhổ răng</Title>
                <Paragraph>
                  Nhổ răng an toàn với công nghệ hiện đại, giảm thiểu đau đớn
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* Footer Section */}
      <div className="footer-section">
        <div className="container">
          <Row gutter={[48, 24]}>
            <Col xs={24} md={8}>
              <Title level={4} style={{ color: 'white' }}>
                NHA KHOA SMILE DENTAL
              </Title>
              <Space direction="vertical" size="small">
                <Text style={{ color: 'white' }}>
                  <EnvironmentOutlined /> Địa chỉ: Nguyễn Văn Bảo, Gò Vấp, thành phố Hồ Chí Minh
                </Text>
                <Text style={{ color: 'white' }}>
                  <MailOutlined /> Email: smiledental@gmail.com
                </Text>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Title level={4} style={{ color: 'white' }}>
                GIỚI THIỆU
              </Title>
              <Space direction="vertical" size="small">
                <a href="#" style={{ color: 'white', display: 'block' }}>Về Chúng Tôi</a>
                <a href="#" style={{ color: 'white', display: 'block' }}>Bảng Giá Dịch Vụ</a>
                <a href="#" style={{ color: 'white', display: 'block' }}>Tin Tức Sự Kiện</a>
                <a href="#" style={{ color: 'white', display: 'block' }}>Kiến Thức Nha Khoa</a>
                <a href="#" style={{ color: 'white', display: 'block' }}>Chính sách bảo mật</a>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Title level={4} style={{ color: 'white' }}>
                LIÊN HỆ
              </Title>
              <Space direction="vertical" size="small">
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                  <PhoneOutlined /> HOTLINE: 1900000010
                </Text>
              </Space>
            </Col>
          </Row>
          <div style={{ textAlign: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <Text style={{ color: 'white' }}>
              GIỜ LÀM VIỆC: Từ 8:30 tới 18:30 tất cả các ngày trong tuần
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

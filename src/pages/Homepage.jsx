/*
* @author: HoTram
*/
import React from 'react';
import { 
  Layout, 
  Row, 
  Col, 
  Card, 
  Typography, 
  Button, 
  Space, 
  Carousel
} from 'antd';
import { 
  HeartOutlined,
  TeamOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  StarOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const Homepage = () => {
  const navigate = useNavigate();

  const carouselContent = [
    {
      image: '/src/assets/image/banner-caroseul.png',
      title: 'Nha khoa thẩm mỹ chuyên nghiệp',
      description: 'Đội ngũ bác sĩ giàu kinh nghiệm với trang thiết bị hiện đại',
      buttonText: 'Đặt lịch ngay',
      buttonAction: () => navigate('/login')
    },
    {
      image: '/src/assets/image/banner-caroseul.png',
      title: 'Dịch vụ toàn diện',
      description: 'Từ nha khoa tổng quát đến thẩm mỹ, chúng tôi có đầy đủ dịch vụ',
      buttonText: 'Xem dịch vụ',
      buttonAction: () => navigate('/services')
    },
    {
      image: '/src/assets/image/banner-caroseul.png',
      title: 'Chăm sóc tận tâm',
      description: 'Luôn đặt sức khỏe và sự hài lòng của khách hàng lên hàng đầu',
      buttonText: 'Liên hệ ngay',
      buttonAction: () => navigate('/contact')
    }
  ];

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

  const features = [
    'Đội ngũ bác sĩ chuyên nghiệp',
    'Trang thiết bị hiện đại',
    'Môi trường vô trùng tuyệt đối',
    'Dịch vụ chăm sóc tận tâm',
    'Bảo hành dài hạn',
    'Giá cả hợp lý'
  ];

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
    <Content style={{ padding: 0, background: '#f5f5f5' }}>
      {/* Hero Carousel Section */}
      <div style={{ position: 'relative' }}>
        <Carousel autoplay effect="fade" style={{ height: '600px' }}>
          {carouselContent.map((item, index) => (
            <div key={index}>
              <div style={{
                backgroundImage: `url(${item.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: '600px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.4)'
                }} />
                
                {/* Content */}
                <div style={{
                  position: 'relative',
                  zIndex: 2,
                  textAlign: 'center',
                  color: 'white',
                  maxWidth: '800px',
                  padding: '0 24px'
                }}>
                  <Title level={1} style={{ 
                    color: 'white', 
                    fontSize: '48px', 
                    marginBottom: '16px',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    {item.title}
                  </Title>
                  <Paragraph style={{ 
                    color: 'rgba(255,255,255,0.9)', 
                    fontSize: '20px', 
                    marginBottom: '32px',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                  }}>
                    {item.description}
                  </Paragraph>
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<ArrowRightOutlined />}
                    onClick={item.buttonAction}
                    style={{ 
                      background: '#2596be',
                      border: 'none',
                      height: '48px',
                      padding: '0 32px',
                      borderRadius: '24px',
                      fontWeight: '600',
                      fontSize: '16px'
                    }}
                  >
                    {item.buttonText}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </div>

      {/* Services Section */}
      <div style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <Title level={2} style={{ color: '#262626', marginBottom: '16px' }}>
              Dịch vụ của chúng tôi
            </Title>
            <Paragraph style={{ fontSize: '18px', color: '#8c8c8c', maxWidth: '600px', margin: '0 auto' }}>
              Cung cấp đầy đủ các dịch vụ nha khoa từ cơ bản đến chuyên sâu
            </Paragraph>
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

      {/* Features Section */}
      <div style={{ padding: '80px 24px', background: '#f5f5f5' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={12}>
              <Title level={2} style={{ color: '#262626', marginBottom: '24px' }}>
                Tại sao chọn SmileDental?
              </Title>
              <Paragraph style={{ fontSize: '16px', color: '#8c8c8c', marginBottom: '32px' }}>
                Chúng tôi cam kết mang đến dịch vụ nha khoa tốt nhất với những ưu điểm vượt trội:
              </Paragraph>
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

      {/* Testimonials Section */}
      <div style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <Title level={2} style={{ color: '#262626', marginBottom: '16px' }}>
              Khách hàng nói gì về chúng tôi
            </Title>
            <Paragraph style={{ fontSize: '18px', color: '#8c8c8c' }}>
              Những phản hồi tích cực từ khách hàng đã tin tưởng sử dụng dịch vụ
            </Paragraph>
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

      {/* CTA Section */}
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
    </Content>
  );
};

export default Homepage;

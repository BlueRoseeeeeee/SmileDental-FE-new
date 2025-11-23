/**
 * Trang giới thiệu về SmileCare Dental
 * @author: HoTram
 */
import React from 'react';
import { Row, Col, Typography, Card, Space } from 'antd';
import { 
  HeartOutlined,
  TeamOutlined,
  TrophyOutlined,
  SafetyOutlined,
  MedicineBoxOutlined,
  StarOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const About = () => {
  const features = [
    {
      icon: <MedicineBoxOutlined />,
      title: 'Công nghệ hiện đại',
      description: 'SmileCare Dental đầu tư mạnh mẽ vào hệ thống trang thiết bị nha khoa tiên tiến nhất hiện nay. Chúng tôi sử dụng công nghệ kỹ thuật số hiện đại như máy chụp X-quang 3D, máy quét kỹ thuật số, hệ thống CAD/CAM để mang lại kết quả điều trị chính xác và hiệu quả. Tất cả thiết bị đều được nhập khẩu từ các thương hiệu uy tín trên thế giới.',
      color: '#1890ff',
      titleColor: 'rgb(49, 59, 121)'
    },
    {
      icon: <TeamOutlined />,
      title: 'Đội ngũ chuyên nghiệp',
      description: 'Đội ngũ Nha sĩ của SmileCare Dental là những chuyên gia giàu kinh nghiệm, được đào tạo bài bản tại các trường đại học y khoa hàng đầu. Các Nha sĩ thường xuyên tham gia các khóa đào tạo, hội thảo chuyên môn trong và ngoài nước để cập nhật những kỹ thuật mới nhất.',
      color: '#52c41a',
      titleColor: 'rgb(49, 59, 121)'
    },
    {
      icon: <SafetyOutlined />,
      title: 'An toàn tuyệt đối',
      description: 'An toàn là ưu tiên hàng đầu tại SmileCare Dental. Chúng tôi tuân thủ nghiêm ngặt quy trình vô trùng theo tiêu chuẩn quốc tế, sử dụng hệ thống khử trùng hiện đại cho tất cả dụng cụ y tế. Tất cả vật liệu và thuốc đều được kiểm định chất lượng, có nguồn gốc rõ ràng.',
      color: '#faad14',
      titleColor: 'rgb(49, 59, 121)'
    },
    {
      icon: <HeartOutlined />,
      title: 'Chăm sóc tận tâm',
      description: 'Tại SmileCare Dental, chúng tôi không chỉ điều trị mà còn đồng hành cùng bạn trong suốt hành trình chăm sóc sức khỏe răng miệng. Mỗi khách hàng đều được tư vấn chi tiết về tình trạng sức khỏe, phương pháp điều trị phù hợp và chế độ chăm sóc sau điều trị.',
      color: '#eb2f96',
      titleColor: 'rgb(49, 59, 121)'
    }
  ];

  const values = [
    {
      title: 'Tầm nhìn',
      content: 'Trở thành phòng khám nha khoa hàng đầu, được tin tưởng và lựa chọn bởi cộng đồng, mang đến nụ cười tự tin cho mọi người.',
      icon: <StarOutlined />,
      iconColor: '#667eea',
      iconBgColor: 'rgba(102, 126, 234, 0.1)'
    },
    {
      title: 'Sứ mệnh',
      content: 'Cung cấp dịch vụ nha khoa chất lượng cao với công nghệ hiện đại, đội ngũ chuyên nghiệp và sự chăm sóc tận tâm, góp phần nâng cao sức khỏe răng miệng cho cộng đồng.',
      icon: <TrophyOutlined />,
      iconColor: '#ffd700',
      iconBgColor: 'rgba(255, 215, 0, 0.15)'
    },
    {
      title: 'Giá trị cốt lõi',
      content: 'Chuyên nghiệp - Tận tâm - An toàn - Đổi mới. Chúng tôi cam kết mang đến trải nghiệm tốt nhất cho mọi khách hàng.',
      icon: <HeartOutlined />,
      iconColor: '#4facfe',
      iconBgColor: 'rgba(79, 172, 254, 0.1)'
    }
  ];

  return (
    <div>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '80px 24px'
      }}>
        {/* Châm ngôn Section */}
        <div style={{ 
          marginTop: '-80px',
          marginBottom: '100px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, rgb(49, 59, 121) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(102, 126, 234, 0.4)'
          }}>
            <HeartOutlined style={{ fontSize: '36px', color: 'white' }} />
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '60px 40px 40px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            marginTop: '40px'
          }}>
            <h3 
              style={{ 
                color: '#313b79',
                marginBottom: '16px',
                fontSize: '2rem',
                fontStyle: 'italic',
                fontWeight: '600',
                lineHeight: '1.5'
              }}
            >
              "Nụ cười rạng rỡ khởi nguồn từ sức khỏe răng miệng toàn diện. Hãy để chúng tôi đồng hành cùng bạn trong hành trình ấy."
            </h3>
            <Text style={{ 
              fontSize: '18px', 
              color: '#666',
              fontStyle: 'italic',
              letterSpacing: '0.5px',
              display: 'block',
              marginTop: '8px',
              textAlign: 'right'
            }}>
            Châm ngôn hoạt động của SmileCare Dental
            </Text>
          </div>
        </div>

        {/* Features Section với 2 cột */}
        <div style={{ marginBottom: '100px' }}>
          <h3 
            style={{ 
              textAlign: 'center',
              marginBottom: '20px',
              fontSize: '2.5rem',
              fontWeight: 'bold',
              letterSpacing: '1px',
              color: '#2c7a41'
            }}
          >
            Điểm nổi bật
          </h3>
          <Row gutter={[40, 20]}>
            {/* Cột 1 - 2 nội dung đầu tiên */}
            <Col xs={24} md={12}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {features.slice(0, 2).map((feature, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '32px',
                      flex: 1
                    }}
                  >
                    <h5 style={{ 
                      color: feature.titleColor,
                      marginBottom: '16px',
                      fontSize: '1.5rem',
                      fontWeight: '700'
                    }}>
                      {feature.title}
                    </h5>
                    <Paragraph style={{ 
                      color: '#555', 
                      margin: 0,
                      fontSize: '16px',
                      lineHeight: '1.8',
                      textAlign: 'justify'
                    }}>
                      {feature.description}
                    </Paragraph>
                  </div>
                ))}
              </div>
            </Col>
            
            {/* Cột 2 - 2 nội dung cuối */}
            <Col xs={24} md={12}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {features.slice(2, 4).map((feature, index) => (
                  <div
                    key={index + 2}
                    style={{
                      padding: '32px',
                      flex: 1
                    }}
                  >
                    <h5 style={{ 
                      color: feature.titleColor,
                      marginBottom: '16px',
                      fontSize: '1.5rem',
                      fontWeight: '700'
                    }}>
                      {feature.title}
                    </h5>
                    <Paragraph style={{ 
                      color: '#555', 
                      margin: 0,
                      fontSize: '16px',
                      lineHeight: '1.8',
                      textAlign: 'justify'
                    }}>
                      {feature.description}
                    </Paragraph>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </div>

        {/* Vision, Mission, Values Section với design đẹp hơn */}
        <div style={{ marginBottom: '100px' }}>
          <h3 
            level={2} 
            style={{ 
              textAlign: 'center',
              color: '#2c7a41',
              marginBottom: '60px',
              fontSize: '2.5rem',
              fontWeight: 'bold'
            }}
          >
            Tầm nhìn - Sứ mệnh - Giá trị
          </h3>
          <Row gutter={[32, 32]}>
            {values.map((value, index) => (
              <Col xs={24} md={8} key={index}>
                <Card
                  style={{
                    height: '100%',
                    borderRadius: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid #e8e8e8',
                    background: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}
                  bodyStyle={{ padding: '40px' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                    e.currentTarget.style.borderColor = value.iconColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = '#e8e8e8';
                  }}
                >
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: value.iconBgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px'
                  }}>
                    <div style={{ fontSize: '32px', color: value.iconColor }}>
                      {value.icon}
                    </div>
                  </div>
                  <Title 
                    level={3} 
                    style={{ 
                      color: '#313b79',
                      marginBottom: '20px',
                      fontSize: '1.8rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {value.title}
                  </Title>
                  <Paragraph 
                    style={{ 
                      color: '#666',
                      fontSize: '16px',
                      lineHeight: '1.8',
                      margin: 0
                    }}
                  >
                    {value.content}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

      </div>
    </div>
  );
};

export default About;

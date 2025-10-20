/*
* @author: HoTram
*/
import React, { useEffect, useRef } from 'react';
import { Row, Col, Typography, Space } from 'antd';

const { Text } = Typography;

const FeaturesSection = () => {
  const titleRef = useRef(null);
  const featureRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (titleRef.current) observer.observe(titleRef.current);
    featureRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const featuresWithDetails = [
    {
      title: 'Đội ngũ nha sĩ chuyên nghiệp',
      description: 'Đội ngũ nha sĩ giàu kinh nghiêm, được đào tạo chuyên sâu có tay nghề cao, chuyên sâu về niềng răng, cấy ghép implant, dán sứ veneer,... luôn tận tâm trong điều trị.'
    },
    {
      title: 'Uy tín được xây dựng từ chất lượng và sự tận tâm',
      description: 'SmileCare Dental luôn đặt lợi ích khách hàng lên hàng đầu, với đội ngũ bác sĩ giàu kinh nghiệm và quy trình điều trị chuyên nghiệp, mang đến dịch vụ nha khoa an toàn và hiệu quả.'
    },
    {
      title: 'Công nghệ hiện đại',
      description: 'Trang thiết bị hiện đại giúp chẩn đoán chính xác, điều trị không đau và nhanh chóng, đảm bảo an toàn và hiệu quả lâu dài.'
    },
    {
      title: 'Cam kết minh bạch',
      description: 'Tất cả dịch vụ đều có bảng giá công khai, tư vấn rõ ràng, hợp đồng minh bạch, không phát sinh chi phí ngoài báo giá ban đầu.'
    },
    {
      title: 'Dịch vụ cá nhân hóa',
      description: 'Mỗi khách hàng được thiết kế phác đồ điều trị riêng, phù hợp với tình trạng răng miệng và nhu cầu thẩm mỹ cá nhân.'
    },
    {
      title: 'Dịch vụ hậu điều trị chu đáo',
      description: 'Sau khi điều trị, khách hàng được theo dõi định kỳ, nhắc lịch tái khám và được hướng dẫn chăm sóc răng miệng đúng cách để duy trì kết quả lâu dài.'
    }
  ];

  return (
    <div style={{ padding: '80px 24px', background: '#ffffff' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div 
          ref={titleRef}
          style={{ 
            textAlign: 'center', 
            marginBottom: '60px',
            opacity: '0',
            transform: 'translateY(30px)',
            transition: 'all 0.8s ease-out'
          }}
        >
          <h3 style={{ 
            color: '#313b79', 
            marginBottom: '16px', 
            fontSize: '32px', 
            fontWeight: '700',
            margin: 0
          }}>
            Tại sao chọn SmileDental?
          </h3>
        </div>
        
        <Row gutter={[32, 32]} align="middle">
          {/* Cột 1: Features 01-02 */}
          <Col xs={24} md={8}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {featuresWithDetails.slice(0, 2).map((feature, index) => (
                <div 
                  key={index} 
                  ref={(el) => featureRefs.current[index] = el}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    marginBottom: '32px',
                    opacity: '0',
                    transform: 'translateY(30px)',
                    transition: `all 0.6s ease-out ${index * 0.2}s`
                  }}
                >
                  <div style={{
                    background: '#2596be',
                    color: 'white',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginRight: '20px',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.boxShadow = '0 4px 15px rgba(37, 150, 190, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div style={{ flex: 1 }}>
                     <h4 style={{ 
                       color: '#313b79', 
                       marginBottom: '8px',
                       fontSize: '18px',
                       fontWeight: '600'
                     }}>
                      {feature.title}
                    </h4>
                    <Text style={{ 
                      color: '#666', 
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}>
                      {feature.description}
                    </Text>
                  </div>
                </div>
              ))}
            </Space>
          </Col>

          {/* Cột 2: Features 03-04 */}
          <Col xs={24} md={8}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {featuresWithDetails.slice(2, 4).map((feature, index) => (
                <div 
                  key={index + 2} 
                  ref={(el) => featureRefs.current[index + 2] = el}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    marginBottom: '32px',
                    opacity: '0',
                    transform: 'translateY(30px)',
                    transition: `all 0.6s ease-out ${(index + 2) * 0.2}s`
                  }}
                >
                  <div style={{
                    background: '#2596be',
                    color: 'white',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginRight: '20px',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.boxShadow = '0 4px 15px rgba(37, 150, 190, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                  >
                    {String(index + 3).padStart(2, '0')}
                  </div>
                  <div style={{ flex: 1 }}>
                     <h4 style={{ 
                       color: '#313b79', 
                       marginBottom: '8px',
                       fontSize: '18px',
                       fontWeight: '600',
                       margin: 0
                     }}>
                      {feature.title}
                    </h4>
                    <Text style={{ 
                      color: '#666', 
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}>
                      {feature.description}
                    </Text>
                  </div>
                </div>
              ))}
            </Space>
          </Col>

          {/* Cột 3: Features 05-06 */}
          <Col xs={24} md={8}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {featuresWithDetails.slice(4, 6).map((feature, index) => (
                <div 
                  key={index + 4} 
                  ref={(el) => featureRefs.current[index + 4] = el}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    marginBottom: '32px',
                    opacity: '0',
                    transform: 'translateY(30px)',
                    transition: `all 0.6s ease-out ${(index + 4) * 0.2}s`
                  }}
                >
                  <div style={{
                    background: '#2596be',
                    color: 'white',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginRight: '20px',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.boxShadow = '0 4px 15px rgba(37, 150, 190, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                  >
                    {String(index + 5).padStart(2, '0')}
                  </div>
                  <div style={{ flex: 1 }}>
                     <h4 style={{ 
                       color: '#313b79', 
                       marginBottom: '8px',
                       fontSize: '18px',
                       fontWeight: '600',
                       margin: 0
                     }}>
                      {feature.title}
                    </h4>
                    <Text style={{ 
                      color: '#666', 
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}>
                      {feature.description}
                    </Text>
                  </div>
                </div>
              ))}
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default FeaturesSection;

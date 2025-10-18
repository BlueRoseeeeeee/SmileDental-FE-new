/*
* @author: HoTram
*/
import React from 'react';
import { Layout, Row, Col, Typography, Space } from 'antd';
import { 
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import './Footer.css';

const { Footer: AntFooter } = Layout;
const { Text, Title } = Typography;

// Styles
const footerStyles = {
  container: {
    padding: '48px 24px 24px',
    marginTop: 'auto',
    backgroundColor: '#185477',
    color: 'white'
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  title: {
    color: 'white',
    marginBottom: '16px'
  },
  text: {
    color: '#ffffff',
    fontSize: '14px'
  },
  link: {
    color: '#ffffff',
    fontSize: '14px',
    display: 'block',
    cursor: 'pointer'
  },
  hotline: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600'
  },
  icon: {
    color: '#2596be',
    marginRight: '8px'
  },
  iconTop: {
    color: '#2596be',
    marginRight: '8px',
    marginTop: '2px'
  }
};

// Data
const companyInfo = {
  name: 'NHA KHOA SMILE DENTAL',
  address: 'Địa chỉ: Nguyễn Văn Bảo, Gò Vấp, thành phố Hồ Chí Minh',
  email: 'Email: smiledental@gmail.com',
  workingHours: 'Từ 8:30 tới 18:30 tất cả các ngày trong tuần'
};

const links = [
  'Về Chúng Tôi',
  'Bảng Giá Dịch Vụ',
  'Tin Tức Sự Kiện',
  'Kiến Thức Nha Khoa',
  'Chính sách bảo mật'
];

const Footer = () => {
  return (
    <AntFooter style={footerStyles.container} className="custom-footer">
      <div style={footerStyles.content}>
        <Row gutter={[32, 32]}>
          {/* Company Info */}
          <Col xs={24} sm={12} md={6}>
            <Title level={4} style={footerStyles.title}>
              {companyInfo.name}
            </Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <EnvironmentOutlined style={footerStyles.iconTop} />
                <Text style={footerStyles.text}>
                  {companyInfo.address}
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <MailOutlined style={footerStyles.icon} />
                <Text style={footerStyles.text}>
                  {companyInfo.email}
                </Text>
              </div>
              <div style={{ marginTop: '16px' }}>
                <Text style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
                  GIỜ LÀM VIỆC
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ClockCircleOutlined style={footerStyles.icon} />
                <Text style={footerStyles.text}>
                  {companyInfo.workingHours}
                </Text>
              </div>
            </Space>
          </Col>

          {/* Links */}
          <Col xs={24} sm={12} md={6}>
            <Title level={4} style={footerStyles.title}>
              GIỚI THIỆU
            </Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {links.map((link, index) => (
                <Text key={index} style={footerStyles.link}>
                  {link}
                </Text>
              ))}
            </Space>
          </Col>

          {/* Contact */}
          <Col xs={24} sm={12} md={6}>
            <Title level={4} style={footerStyles.title}>
              LIÊN HỆ
            </Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <PhoneOutlined style={footerStyles.icon} />
                <Text style={footerStyles.hotline}>
                  HOTLINE: 190000010
                </Text>
              </div>
            </Space>
          </Col>

          {/* Google Maps */}
          <Col xs={24} sm={24} md={6}>
            <Title level={4} style={footerStyles.title}>
              VỊ TRÍ
            </Title>
            <div style={{
              width: '100%',
              height: '200px',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.231!2d106.692!3d10.776!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f38b8c8c8c8%3A0x8c8c8c8c8c8c8c8c!2sNguy%E1%BB%85n%20V%C4%83n%20B%E1%BA%A3o%2C%20G%C3%B2%20V%E1%BA%A5p%2C%20Th%C3%A0nh%20ph%E1%BB%91%20H%E1%BB%93%20Ch%C3%AD%20Minh!5e0!3m2!1svi!2s!4v1234567890!5m2!1svi!2s"
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="SmileDental Location"
              />
            </div>
          </Col>
        </Row>
      </div>
    </AntFooter>
  );
};

export default Footer;

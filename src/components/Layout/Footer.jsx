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
          <Col xs={24} sm={12} md={8}>
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
          <Col xs={24} sm={12} md={8}>
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
          <Col xs={24} sm={12} md={8}>
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
        </Row>
      </div>
    </AntFooter>
  );
};

export default Footer;

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

const { Footer: AntFooter } = Layout;
const { Text, Title } = Typography;

const Footer = () => {
  return (
    <AntFooter 
      style={{ 
        background: '#001529',
        color: 'white',
        padding: '48px 24px 24px',
        marginTop: 'auto'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Row gutter={[32, 32]}>
          {/* Company Info */}
          <Col xs={24} sm={12} md={8}>
            <Title level={4} style={{ color: 'white', marginBottom: '16px' }}>
              NHA KHOA SMILE DENTAL
            </Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <EnvironmentOutlined style={{ color: '#2596be', marginRight: '8px', marginTop: '2px' }} />
                <Text style={{ color: '#bfbfbf', fontSize: '14px' }}>
                  Địa chỉ: Nguyễn Văn Bảo, Gò Vấp, thành phố Hồ Chí Minh
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <MailOutlined style={{ color: '#2596be', marginRight: '8px' }} />
                <Text style={{ color: '#bfbfbf', fontSize: '14px' }}>
                  Email: smiledental@gmail.com
                </Text>
              </div>
              <div style={{ marginTop: '16px' }}>
                <Text style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
                  GIỜ LÀM VIỆC
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ClockCircleOutlined style={{ color: '#2596be', marginRight: '8px' }} />
                <Text style={{ color: '#bfbfbf', fontSize: '14px' }}>
                  Từ 8:30 tới 18:30 tất cả các ngày trong tuần
                </Text>
              </div>
            </Space>
          </Col>

          {/* Links */}
          <Col xs={24} sm={12} md={8}>
            <Title level={4} style={{ color: 'white', marginBottom: '16px' }}>
              GIỚI THIỆU
            </Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text style={{ color: '#bfbfbf', fontSize: '14px', display: 'block', cursor: 'pointer' }}>
                Về Chúng Tôi
              </Text>
              <Text style={{ color: '#bfbfbf', fontSize: '14px', display: 'block', cursor: 'pointer' }}>
                Bảng Giá Dịch Vụ
              </Text>
              <Text style={{ color: '#bfbfbf', fontSize: '14px', display: 'block', cursor: 'pointer' }}>
                Tin Tức Sự Kiện
              </Text>
              <Text style={{ color: '#bfbfbf', fontSize: '14px', display: 'block', cursor: 'pointer' }}>
                Kiến Thức Nha Khoa
              </Text>
              <Text style={{ color: '#bfbfbf', fontSize: '14px', display: 'block', cursor: 'pointer' }}>
                Chính sách bảo mật
              </Text>
            </Space>
          </Col>

          {/* Contact */}
          <Col xs={24} sm={12} md={8}>
            <Title level={4} style={{ color: 'white', marginBottom: '16px' }}>
              LIÊN HỆ
            </Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <PhoneOutlined style={{ color: '#2596be', marginRight: '8px' }} />
                <Text style={{ color: '#bfbfbf', fontSize: '16px', fontWeight: '600' }}>
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

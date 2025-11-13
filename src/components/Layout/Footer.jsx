/*
* @author: HoTram
*/
import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Typography, Space } from 'antd';
import { 
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import './Footer.css';
import scheduleConfigService from '../../services/scheduleConfigService';

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
  name: 'SmileCare Dental',
  address: 'Địa chỉ: Nguyễn Văn Bảo, Gò Vấp, thành phố Hồ Chí Minh',
  email: 'Email: smilecare.dental@gmail.com',
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
  const [workingHours, setWorkingHours] = useState([]);
  const [workingDaysText, setWorkingDaysText] = useState('');

  useEffect(() => {
    const fetchWorkingHours = async () => {
      try {
        const response = await scheduleConfigService.getConfig();
        if (response.success && response.data) {
          const config = response.data;
          const activeShifts = [];

          // Kiểm tra từng ca và thêm vào mảng nếu isActive = true
          if (config.morningShift?.isActive) {
            activeShifts.push({
              name: config.morningShift.name,
              time: `${config.morningShift.startTime} - ${config.morningShift.endTime}`
            });
          }
          if (config.afternoonShift?.isActive) {
            activeShifts.push({
              name: config.afternoonShift.name,
              time: `${config.afternoonShift.startTime} - ${config.afternoonShift.endTime}`
            });
          }
          if (config.eveningShift?.isActive) {
            activeShifts.push({
              name: config.eveningShift.name,
              time: `${config.eveningShift.startTime} - ${config.eveningShift.endTime}`
            });
          }

          setWorkingHours(activeShifts);
        }
      } catch (error) {
        setWorkingHours([]);
      }
    };

    const fetchWorkingDays = async () => {
      try {
        const response = await scheduleConfigService.getHolidays();
        if (response.success && response.data) {
          const holidays = response.data.holidays || [];
          
          // Lấy các ngày làm việc cố định: isRecurring = true VÀ isActive = false
          // isActive = false có nghĩa là ngày đó KHÔNG nghỉ, tức là ĐANG HOẠT ĐỘNG
          const workingDays = holidays
            .filter(h => h.isRecurring === true && h.isActive === false)
            .map(h => h.dayOfWeek)
            .sort((a, b) => a - b);

          // Map dayOfWeek (1-7) sang tên thứ
          const dayNames = {
            1: 'Chủ Nhật',
            2: 'Thứ Hai', 
            3: 'Thứ Ba',
            4: 'Thứ Tư',
            5: 'Thứ Năm',
            6: 'Thứ Sáu',
            7: 'Thứ Bảy'
          };

          if (workingDays.length === 0) {
            setWorkingDaysText('Phòng khám đang trong trạng thái đóng cửa...');
          } else if (workingDays.length === 7) {
            setWorkingDaysText('Làm việc tất cả các ngày trong tuần');
          } else {
            // Hiển thị danh sách ngày làm việc
            const workingDayNames = workingDays.map(d => dayNames[d]);
            setWorkingDaysText(`Làm việc vào các ngày: ${workingDayNames.join(', ')}`);
          }
        }
      } catch (error) {
        console.error('Error fetching working days:', error);
        setWorkingDaysText('');
      }
    };

    fetchWorkingHours();
    fetchWorkingDays();
  }, []);

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
                  LỊCH LÀM VIỆC
                </Text>
              </div>
              

              {/* Giờ làm việc */}
              {workingHours.length > 0 ? (
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0, 
                  margin: 0 
                }}>
                  {workingHours.map((shift, index) => (
                    <li key={index} style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      marginBottom: '5px'
                    }}>
                      <ClockCircleOutlined style={footerStyles.icon} />
                      <Text style={footerStyles.text}>
                        {shift.name}: {shift.time}
                      </Text>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ClockCircleOutlined style={footerStyles.icon} />
                  <Text style={footerStyles.text}>
                    Phòng khám đang trong trạng thái đóng cửa...
                  </Text>
                </div>
              )}

             {/* Ngày làm việc */}
              {workingDaysText && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                  lineHeight:'1.5'
                }}>
                  <ClockCircleOutlined style={footerStyles.iconTop} />
                  <Text style={footerStyles.text}>
                    {workingDaysText}
                  </Text>
                </div>
              )}
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
              width: '350px',
              height: '200px',
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

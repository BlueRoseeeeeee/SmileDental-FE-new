/**
 * Schedule Management Component
 * @author: HoTram
 * @updated: SmileCare Design System Polish
 * Simplified: Removed quarter-based schedule generation
 */
import React from 'react';
import { 
  Card, Row, Col, Typography, Button, Space, Alert
} from 'antd';
import { 
  CalendarOutlined, PlusOutlined, ClockCircleOutlined,
  CheckCircleOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import smileCareTheme from '../../theme/smileCareTheme';
import './ScheduleManagement.css';

const { Title, Text } = Typography;

const ScheduleManagement = () => {
  const navigate = useNavigate();


  return (
    <div style={{ 
      minHeight: 'calc(100vh - 64px)',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '48px 24px'
    }}>
      {/* Hero Section */}
      <Row justify="center" style={{ marginBottom: 48 }}>
        <Col xs={24} sm={22} md={20} lg={18} xl={16}>
          <Card 
            style={{ 
              borderRadius: 20,
              boxShadow: smileCareTheme.shadows.xl,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              overflow: 'hidden'
            }}
            bodyStyle={{ padding: '48px 40px' }}
          >
            <Space direction="vertical" size={24} style={{ width: '100%', textAlign: 'center' }}>
              {/* Icon Container */}
              <div style={{
                width: 120,
                height: 120,
                margin: '0 auto',
                borderRadius: 30,
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                animation: 'pulse 3s ease-in-out infinite'
              }}>
                <CalendarOutlined style={{ fontSize: 64, color: '#fff' }} />
              </div>
              
              {/* Title */}
              <div>
                <Title level={1} style={{ 
                  margin: 0, 
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 42,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  Quản lý lịch làm việc
                </Title>
                <Text style={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: 18,
                  display: 'block',
                  marginTop: 12
                }}>
                  Hệ thống quản lý lịch làm việc cho phòng khám nha khoa
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row justify="center">
        <Col xs={24} sm={22} md={20} lg={18} xl={16}>
          <Row gutter={[24, 24]}>
            {/* Info Card */}
            <Col xs={24} lg={24}>
              <Card
                style={{ 
                  borderRadius: 16,
                  boxShadow: smileCareTheme.shadows.lg,
                  border: '2px solid #dbeafe',
                  background: '#ffffff'
                }}
                bodyStyle={{ padding: '32px 36px' }}
              >
                <Space direction="vertical" size={24} style={{ width: '100%' }}>
                  {/* Alert Box */}
                  <Alert
                    message={
                      <Text strong style={{ fontSize: 16, color: smileCareTheme.colors.primary[700] }}>
                        📋 Tạo lịch theo phòng khám
                      </Text>
                    }
                    description={
                      <div style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 14, lineHeight: 1.8, color: smileCareTheme.colors.text.secondary }}>
                          Hệ thống hỗ trợ tạo lịch làm việc linh hoạt cho từng phòng khám. 
                          Bạn có thể chọn phòng, xác định khoảng thời gian và các ca làm việc cần thiết.
                        </Text>
                      </div>
                    }
                    type="info"
                    showIcon
                    icon={<InfoCircleOutlined style={{ fontSize: 20 }} />}
                    style={{ 
                      borderRadius: 12,
                      background: '#eff6ff',
                      border: '2px solid #bfdbfe',
                      padding: '16px 20px'
                    }}
                  />

                  {/* Features Grid */}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <div style={{
                        padding: '20px',
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        border: '1px solid #bfdbfe',
                        textAlign: 'center',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = smileCareTheme.shadows.md;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      >
                        <div style={{
                          width: 48,
                          height: 48,
                          margin: '0 auto 12px',
                          borderRadius: 12,
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CalendarOutlined style={{ fontSize: 24, color: '#fff' }} />
                        </div>
                        <Text strong style={{ display: 'block', marginBottom: 4, fontSize: 15 }}>
                          Chọn phòng khám
                        </Text>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          Chọn từ danh sách phòng
                        </Text>
                      </div>
                    </Col>

                    <Col xs={24} md={8}>
                      <div style={{
                        padding: '20px',
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        border: '1px solid #bbf7d0',
                        textAlign: 'center',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = smileCareTheme.shadows.md;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      >
                        <div style={{
                          width: 48,
                          height: 48,
                          margin: '0 auto 12px',
                          borderRadius: 12,
                          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <ClockCircleOutlined style={{ fontSize: 24, color: '#fff' }} />
                        </div>
                        <Text strong style={{ display: 'block', marginBottom: 4, fontSize: 15 }}>
                          Chọn khoảng thời gian
                        </Text>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          Từ tháng - đến tháng
                        </Text>
                      </div>
                    </Col>

                    <Col xs={24} md={8}>
                      <div style={{
                        padding: '20px',
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        border: '1px solid #fcd34d',
                        textAlign: 'center',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = smileCareTheme.shadows.md;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      >
                        <div style={{
                          width: 48,
                          height: 48,
                          margin: '0 auto 12px',
                          borderRadius: 12,
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CheckCircleOutlined style={{ fontSize: 24, color: '#fff' }} />
                        </div>
                        <Text strong style={{ display: 'block', marginBottom: 4, fontSize: 15 }}>
                          Chọn ca làm việc
                        </Text>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          Sáng, chiều, tối
                        </Text>
                      </div>
                    </Col>
                  </Row>

                  {/* CTA Button */}
                  <div style={{ textAlign: 'center', paddingTop: 16 }}>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      size="large"
                      onClick={() => navigate('/schedules/create-for-room')}
                      style={{
                        height: 56,
                        fontSize: 17,
                        fontWeight: 600,
                        borderRadius: 14,
                        padding: '0 48px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        border: 'none',
                        boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                      }}
                    >
                      🚀 Tạo lịch cho phòng khám
                    </Button>
                    
                    <div style={{ marginTop: 16 }}>
                      <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
                        Chọn phòng khám cụ thể, xác định khoảng thời gian và ca làm việc để bắt đầu
                      </Text>
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default ScheduleManagement;




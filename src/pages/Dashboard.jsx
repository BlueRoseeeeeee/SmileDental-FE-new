/*
* @author: HoTram
*/
import React from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Card, Row, Col, Statistic, Typography, Button, List, Avatar, Badge, Progress, Space, Divider } from 'antd';
import { 
  CalendarOutlined, 
  TeamOutlined, 
  BarChartOutlined, 
  RiseOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  UserAddOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  HistoryOutlined,
  SettingOutlined,
  BellOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const Dashboard = () => {
  const { user } = useAuth();

  // Mock data - in real app, this would come from API
  const stats = {
    admin: [
      { title: 'Tổng nhân viên', value: 45, suffix: 'người', change: 3, icon: <TeamOutlined />, color: '#1890ff' },
      { title: 'Lịch hẹn hôm nay', value: 23, suffix: 'cuộc', change: 5, icon: <CalendarOutlined />, color: '#52c41a' },
      { title: 'Doanh thu tháng', value: 125, suffix: 'M VNĐ', change: 12, icon: <RiseOutlined />, color: '#722ed1' },
      { title: 'Hoạt động hệ thống', value: 98, suffix: '%', change: 2, icon: <BarChartOutlined />, color: '#fa8c16' },
    ],
    dentist: [
      { title: 'Lịch hẹn hôm nay', value: 8, suffix: 'cuộc', change: 2, icon: <CalendarOutlined />, color: '#1890ff' },
      { title: 'Bệnh nhân đã khám', value: 156, suffix: 'người', change: 12, icon: <TeamOutlined />, color: '#52c41a' },
      { title: 'Giờ làm việc tuần', value: 42, suffix: 'giờ', change: 5, icon: <ClockCircleOutlined />, color: '#722ed1' },
      { title: 'Đánh giá trung bình', value: 4.8, suffix: '/5', change: 0.2, icon: <CheckCircleOutlined />, color: '#fa8c16' },
    ],
    patient: [
      { title: 'Lịch hẹn sắp tới', value: 2, suffix: 'cuộc', change: 0, icon: <CalendarOutlined />, color: '#1890ff' },
      { title: 'Lần khám gần nhất', value: 5, suffix: 'ngày trước', change: 0, icon: <ClockCircleOutlined />, color: '#52c41a' },
      { title: 'Điều trị hoàn thành', value: 3, suffix: 'lần', change: 1, icon: <CheckCircleOutlined />, color: '#722ed1' },
      { title: 'Nha sĩ đang theo dõi', value: 1, suffix: 'người', change: 0, icon: <TeamOutlined />, color: '#fa8c16' },
    ],
  };

  const userStats = stats[user?.role] || stats.patient;

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.fullName || 'Bạn';
    
    if (hour < 12) return `Chào buổi sáng, ${name}!`;
    if (hour < 18) return `Chào buổi chiều, ${name}!`;
    return `Chào buổi tối, ${name}!`;
  };

  const getRoleTitle = () => {
    const roleTitles = {
      admin: 'Quản trị viên hệ thống',
      manager: 'Quản lý phòng khám',
      dentist: 'Bác sĩ nha khoa',
      nurse: 'Y tá',
      receptionist: 'Nhân viên lễ tân',
      patient: 'Bệnh nhân',
    };
    return roleTitles[user?.role] || 'Người dùng';
  };

  const recentActivities = [
    { 
      title: 'Đăng nhập vào hệ thống', 
      description: 'Đăng nhập thành công từ thiết bị mới',
      time: '5 phút trước', 
      avatar: <BellOutlined style={{ color: '#52c41a' }} />,
      status: 'success' 
    },
    { 
      title: 'Cập nhật thông tin hồ sơ', 
      description: 'Cập nhật số điện thoại và địa chỉ',
      time: '2 giờ trước', 
      avatar: <SettingOutlined style={{ color: '#1890ff' }} />,
      status: 'info' 
    },
    { 
      title: 'Hoàn thành lịch hẹn', 
      description: 'Hoàn thành lịch hẹn với BS. Minh',
      time: '1 ngày trước', 
      avatar: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      status: 'success' 
    },
  ];

  const quickActions = {
    admin: [
      { title: 'Thêm nhân viên mới', icon: <UserAddOutlined />, type: 'primary' },
      { title: 'Xem báo cáo tổng quan', icon: <FileTextOutlined />, type: 'default' },
    ],
    dentist: [
      { title: 'Xem lịch hẹn hôm nay', icon: <CalendarOutlined />, type: 'primary' },
      { title: 'Upload chứng chỉ mới', icon: <FileTextOutlined />, type: 'default' },
    ],
    patient: [
      { title: 'Đặt lịch hẹn mới', icon: <CalendarOutlined />, type: 'primary' },
      { title: 'Xem lịch sử khám bệnh', icon: <HistoryOutlined />, type: 'default' },
    ],
  };

  const userQuickActions = quickActions[user?.role] || quickActions.patient;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Section */}
      <Card 
        style={{ 
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          border: 'none',
          color: 'white'
        }}
      >
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <Title level={1} style={{ marginBottom: '8px', color: 'white' }}>
            {getGreeting()}
          </Title>
          <Text style={{ fontSize: '18px', color: 'white', opacity: 0.9 }}>
            {getRoleTitle()} • {new Date().toLocaleDateString('vi-VN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </div>
      </Card>

      {/* Stats Grid */}
      <Row gutter={[24, 24]}>
        {userStats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                suffix={stat.suffix}
                prefix={
                  <div 
                    style={{ 
                      padding: '12px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${stat.color}20, ${stat.color}10)`,
                      color: stat.color 
                    }}
                  >
                    {stat.icon}
                  </div>
                }
                valueStyle={{ 
                  color: stat.color,
                  fontSize: '28px',
                  fontWeight: 'bold'
                }}
              />
              {stat.change > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="success" style={{ fontSize: '14px' }}>
                    <RiseOutlined /> +{stat.change} so với tháng trước
                  </Text>
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main Content Grid */}
      <Row gutter={[24, 24]}>
        {/* Recent Activities */}
        <Col xs={24} lg={12}>
          <Card 
            title="Hoạt động gần đây" 
            extra={<Badge count={3} />}
          >
            <List
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={item.avatar} />}
                    title={item.title}
                    description={
                      <div>
                        <div>{item.description}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{item.time}</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col xs={24} lg={12}>
          <Card 
            title="Thao tác nhanh"
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {userQuickActions.map((action, index) => (
                <Button
                  key={index}
                  type={action.type}
                  icon={action.icon}
                  size="large"
                  block
                  style={{ 
                    height: '48px', 
                    textAlign: 'left', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'flex-start' 
                  }}
                >
                  {action.title}
                </Button>
              ))}
              <Button
                type="default"
                icon={<SettingOutlined />}
                size="large"
                block
                style={{ 
                  height: '48px', 
                  textAlign: 'left', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'flex-start' 
                }}
              >
                Cập nhật hồ sơ cá nhân
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Role-specific content */}
      {user?.role === 'admin' && (
        <Card 
          title="Thông báo quản trị"
        >
          <div style={{ 
            background: 'linear-gradient(to right, #fffbe6, #fff7e6)', 
            border: '1px solid #ffe58f', 
            borderRadius: '12px', 
            padding: '24px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#fff1b8', 
                borderRadius: '50%' 
              }}>
                <BellOutlined style={{ color: '#d48806', fontSize: '20px' }} />
              </div>
              <div>
                <Title level={4} style={{ marginBottom: '8px', color: '#d48806' }}>
                  Cập nhật hệ thống
                </Title>
                <Text style={{ color: '#d48806' }}>
                  Hệ thống sẽ được bảo trì vào 2:00 AM ngày mai. Thời gian dự kiến: 2 tiếng.
                </Text>
                <div style={{ marginTop: '16px' }}>
                  <Progress 
                    percent={75} 
                    strokeColor="#faad14" 
                    trailColor="#fff7e6"
                    showInfo={false}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>Tiến độ chuẩn bị: 75%</Text>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* System Status */}
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card 
            title="Trạng thái hệ thống"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Hiệu suất server</Text>
                <Progress percent={85} strokeColor="#52c41a" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Băng thông</Text>
                <Progress percent={60} strokeColor="#1890ff" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Dung lượng lưu trữ</Text>
                <Progress percent={45} strokeColor="#faad14" />
              </div>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card 
            title="Thống kê nhanh"
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '16px', 
                  backgroundColor: '#e6f7ff', 
                  borderRadius: '12px' 
                }}>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff', display: 'block' }}>98%</Text>
                  <Text type="secondary" style={{ fontSize: '14px' }}>Uptime</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '16px', 
                  backgroundColor: '#f6ffed', 
                  borderRadius: '12px' 
                }}>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a', display: 'block' }}>2.3s</Text>
                  <Text type="secondary" style={{ fontSize: '14px' }}>Response Time</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '16px', 
                  backgroundColor: '#f9f0ff', 
                  borderRadius: '12px' 
                }}>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1', display: 'block' }}>1,234</Text>
                  <Text type="secondary" style={{ fontSize: '14px' }}>Active Users</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '16px', 
                  backgroundColor: '#fff7e6', 
                  borderRadius: '12px' 
                }}>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16', display: 'block' }}>45</Text>
                  <Text type="secondary" style={{ fontSize: '14px' }}>New Today</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
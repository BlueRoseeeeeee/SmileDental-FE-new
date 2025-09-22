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
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="primary-gradient text-white border-0">
        <div className="text-center py-8">
          <Title level={1} className="!mb-2 !text-white">
            {getGreeting()}
          </Title>
          <Text className="text-lg text-white opacity-90">
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
            <Card className="fade-in">
              <Statistic
                title={stat.title}
                value={stat.value}
                suffix={stat.suffix}
                prefix={
                  <div 
                    className="p-3 rounded-xl flex items-center justify-center"
                    style={{ 
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
                <div className="mt-2">
                  <Text type="success" className="text-sm">
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
            className="fade-in"
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
                        <Text type="secondary" className="text-xs">{item.time}</Text>
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
            className="fade-in"
          >
            <Space direction="vertical" size="middle" className="w-full">
              {userQuickActions.map((action, index) => (
                <Button
                  key={index}
                  type={action.type}
                  icon={action.icon}
                  size="large"
                  block
                  className="h-12 text-left flex items-center justify-start"
                >
                  {action.title}
                </Button>
              ))}
              <Button
                type="default"
                icon={<SettingOutlined />}
                size="large"
                block
                className="h-12 text-left flex items-center justify-start"
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
          className="fade-in"
        >
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <BellOutlined className="text-yellow-600 text-xl" />
              </div>
              <div>
                <Title level={4} className="!mb-2 !text-yellow-800">
                  Cập nhật hệ thống
                </Title>
                <Text className="text-yellow-700">
                  Hệ thống sẽ được bảo trì vào 2:00 AM ngày mai. Thời gian dự kiến: 2 tiếng.
                </Text>
                <div className="mt-4">
                  <Progress 
                    percent={75} 
                    strokeColor="#faad14" 
                    trailColor="#fff7e6"
                    showInfo={false}
                  />
                  <Text type="secondary" className="text-xs">Tiến độ chuẩn bị: 75%</Text>
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
            className="fade-in"
          >
            <Space direction="vertical" size="large" className="w-full">
              <div className="flex justify-between items-center">
                <Text>Hiệu suất server</Text>
                <Progress percent={85} strokeColor="#52c41a" />
              </div>
              <div className="flex justify-between items-center">
                <Text>Băng thông</Text>
                <Progress percent={60} strokeColor="#1890ff" />
              </div>
              <div className="flex justify-between items-center">
                <Text>Dung lượng lưu trữ</Text>
                <Progress percent={45} strokeColor="#faad14" />
              </div>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card 
            title="Thống kê nhanh" 
            className="fade-in"
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <Text className="text-2xl font-bold text-blue-600 block">98%</Text>
                  <Text type="secondary" className="text-sm">Uptime</Text>
                </div>
              </Col>
              <Col span={12}>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <Text className="text-2xl font-bold text-green-600 block">2.3s</Text>
                  <Text type="secondary" className="text-sm">Response Time</Text>
                </div>
              </Col>
              <Col span={12}>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <Text className="text-2xl font-bold text-purple-600 block">1,234</Text>
                  <Text type="secondary" className="text-sm">Active Users</Text>
                </div>
              </Col>
              <Col span={12}>
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <Text className="text-2xl font-bold text-orange-600 block">45</Text>
                  <Text type="secondary" className="text-sm">New Today</Text>
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
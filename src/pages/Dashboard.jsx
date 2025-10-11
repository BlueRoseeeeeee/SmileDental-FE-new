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
      dentist: 'nha sĩ nha khoa',
      nurse: 'Y tá',
      receptionist: 'Nhân viên lễ tân',
      patient: 'Bệnh nhân',
    };
    return roleTitles[user?.role] || 'Người dùng';
  };


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
    </div>
  );
};

export default Dashboard;
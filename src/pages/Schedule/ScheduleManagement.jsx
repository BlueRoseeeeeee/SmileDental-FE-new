/**
 * Schedule Management Component
 * @author: HoTram
 * Simplified: Removed quarter-based schedule generation
 */
import React from 'react';
import { 
  Card, Row, Col, Typography, Button, Space, Alert
} from 'antd';
import { 
  CalendarOutlined, PlusOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './ScheduleManagement.css';

const { Title, Text } = Typography;

const ScheduleManagement = () => {
  const navigate = useNavigate();


  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
      <Row justify="center" style={{ marginTop: '48px' }}>
        <Col span={16}>
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
              <CalendarOutlined style={{ fontSize: 64, color: '#1890ff' }} />
              
              <Title level={2}>Quản lý lịch làm việc</Title>
              
              <Alert
                message="Tạo lịch theo phòng"
                description="Hệ thống chỉ hỗ trợ tạo lịch thủ công cho từng phòng cụ thể. Bạn có thể chọn phòng, khoảng thời gian và ca làm việc để tạo lịch."
                type="info"
                showIcon
                style={{ textAlign: 'left' }}
              />
              
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                size="large"
                onClick={() => navigate('/schedules/create-for-room')}
                style={{ marginTop: 16 }}
              >
                Tạo lịch cho phòng
              </Button>
              
              <Text type="secondary">
                Chọn phòng cụ thể, khoảng thời gian từ tháng - đến tháng, và các ca làm việc cần tạo
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ScheduleManagement;




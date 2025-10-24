import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Tag, 
  Empty,
  Spin,
  Badge,
  Space,
  Statistic,
  message
} from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { io } from 'socket.io-client';
import queueService from '../../services/queueService';
import dayjs from 'dayjs';
import './QueueManagement.css';

const { Title, Text } = Typography;

const QueueManagement = () => {
  const [queueData, setQueueData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  // Load queue data
  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const response = await queueService.getQueue();
      
      if (response.success) {
        setQueueData(response.data || []);
      }
    } catch (error) {
      console.error('Load queue error:', error);
      message.error('Không thể tải dữ liệu hàng đợi');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const response = await queueService.getQueueStats();
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_APPOINTMENT_SERVICE_URL || 'http://localhost:3006', {
      transports: ['websocket'],
      reconnection: true
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected for queue updates');
    });

    newSocket.on('queue_updated', (data) => {
      console.log('🔄 Queue updated for room:', data.roomId);
      // Reload queue data when update received
      loadQueue();
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [loadQueue]);

  // Initial load
  useEffect(() => {
    loadQueue();
    loadStats();

    // Refresh every 30 seconds as backup
    const interval = setInterval(() => {
      loadQueue();
      loadStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadQueue, loadStats]);

  const getStatusTag = (status) => {
    const statusConfig = {
      'in-progress': { color: 'processing', text: 'Đang khám' },
      'checked-in': { color: 'success', text: 'Đã check-in' },
      'confirmed': { color: 'default', text: 'Đã xác nhận' }
    };
    
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const renderPatientCard = (appointment, isActive = false) => {
    return (
      <Card
        key={appointment._id}
        className={`patient-card ${isActive ? 'active-patient' : 'waiting-patient'}`}
        size="small"
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text strong>{appointment.patientInfo.name}</Text>
            {getStatusTag(appointment.status)}
          </Space>
          
          <Space size="middle" wrap>
            <Space>
              <ClockCircleOutlined />
              <Text type="secondary">{appointment.startTime}</Text>
            </Space>
            
            <Space>
              <MedicineBoxOutlined />
              <Text type="secondary">
                {appointment.serviceName}
                {appointment.serviceAddOnName && ` - ${appointment.serviceAddOnName}`}
              </Text>
            </Space>
          </Space>
          
          <Space>
            <UserOutlined />
            <Text type="secondary">{appointment.dentistName}</Text>
          </Space>
          
          {appointment.checkedInAt && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Check-in: {dayjs(appointment.checkedInAt).format('HH:mm')}
            </Text>
          )}
        </Space>
      </Card>
    );
  };

  const renderRoomQueue = (room) => {
    return (
      <Col xs={24} md={12} lg={8} key={room.roomId}>
        <Card
          title={
            <Space>
              <TeamOutlined />
              <span>{room.roomName}</span>
              <Badge 
                count={room.totalWaiting} 
                style={{ backgroundColor: '#52c41a' }}
                overflowCount={99}
              />
            </Space>
          }
          className="room-queue-card"
        >
          {room.currentPatient ? (
            <div className="current-patient-section">
              <Title level={5} style={{ color: '#1890ff', marginBottom: 12 }}>
                🏥 Đang khám
              </Title>
              {renderPatientCard(room.currentPatient, true)}
            </div>
          ) : (
            <Empty 
              description="Phòng trống" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ margin: '20px 0' }}
            />
          )}

          {room.waitingList.length > 0 && (
            <div className="waiting-list-section" style={{ marginTop: 20 }}>
              <Title level={5} style={{ color: '#faad14', marginBottom: 12 }}>
                ⏳ Đang chờ ({room.totalWaiting})
              </Title>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {room.waitingList.map(apt => renderPatientCard(apt))}
              </Space>
            </div>
          )}
        </Card>
      </Col>
    );
  };

  return (
    <div className="queue-management-container">
      <div className="queue-header">
        <Title level={2}>📋 Hàng đợi khám bệnh</Title>
        <Text type="secondary">Cập nhật realtime - {dayjs().format('HH:mm:ss DD/MM/YYYY')}</Text>
      </div>

      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Statistic 
                title="Tổng số" 
                value={stats.total} 
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Statistic 
                title="Đang khám" 
                value={stats.inProgress} 
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Statistic 
                title="Đã check-in" 
                value={stats.checkedIn} 
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Statistic 
                title="Đã xác nhận" 
                value={stats.confirmed} 
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Statistic 
                title="Hoàn tất" 
                value={stats.completed} 
                valueStyle={{ color: '#8c8c8c' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Statistic 
                title="Đã hủy" 
                value={stats.cancelled} 
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Spin spinning={loading}>
        {queueData.length > 0 ? (
          <Row gutter={[16, 16]}>
            {queueData.map(room => renderRoomQueue(room))}
          </Row>
        ) : (
          <Empty description="Chưa có bệnh nhân trong hàng đợi" />
        )}
      </Spin>
    </div>
  );
};

export default QueueManagement;

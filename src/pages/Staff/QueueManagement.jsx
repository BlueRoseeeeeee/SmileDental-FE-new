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
  Divider,
  message,
  Avatar
} from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  FieldTimeOutlined
} from '@ant-design/icons';
import { io } from 'socket.io-client';
import queueService from '../../services/queueService';
import dayjs from 'dayjs';
import 'dayjs/locale/vi'; // Vietnamese locale
import './QueueManagement.css';

dayjs.locale('vi'); // Set locale globally

const { Title, Text } = Typography;

const QueueManagement = () => {
  const [queueData, setQueueData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [currentTime, setCurrentTime] = useState(dayjs());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load queue data
  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      
      // ✅ Use real API
      const response = await queueService.getQueue();
      
      if (response.success) {
        const data = response.data || [];
        
        // 🔍 Debug log
        console.log('📊 Queue data received:', data);
        
        setQueueData(data);
        
        // 🔥 Show warning if empty
        if (data.length === 0) {
          console.warn('⚠️ No queue data - Make sure appointments are checked-in today');
        }
      }
    } catch (error) {
      console.error('❌ Load queue error:', error);
      message.error('Không thể tải dữ liệu hàng đợi: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_APPOINTMENT_SERVICE_URL || 'http://localhost:3006';
    const newSocket = io(socketUrl, {
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

    // Refresh every 30 seconds as backup
    const interval = setInterval(() => {
      loadQueue();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadQueue]);

  const getStatusTag = (status) => {
    const statusConfig = {
      'in-progress': { color: 'gold', text: 'Đang khám', icon: <CheckCircleOutlined /> },
      'checked-in': { color: 'default', text: 'Chờ khám', icon: <FieldTimeOutlined /> },
      'completed': { color: 'success', text: 'Hoàn thành', icon: <CheckCircleOutlined /> },
      'confirmed': { color: 'blue', text: 'Đã xác nhận', icon: <ClockCircleOutlined /> }
    };
    
    const config = statusConfig[status] || { color: 'default', text: status, icon: null };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // Render compact patient info
  const renderPatientInfo = (appointment) => {
    if (!appointment) return null;

    return (
      <div className="patient-info-compact">
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text strong ellipsis style={{ maxWidth: '60%' }}>
              {appointment.patientInfo.name}
            </Text>
            {getStatusTag(appointment.status)}
          </Space>
          
          <Space size="small">
            <ClockCircleOutlined style={{ color: '#1890ff' }} />
            <Text type="secondary" style={{ fontSize: '13px' }}>
              {appointment.startTime} - {appointment.endTime}
            </Text>
          </Space>
          
          <Space size="small">
            <MedicineBoxOutlined style={{ color: '#52c41a' }} />
            <Text type="secondary" ellipsis style={{ fontSize: '12px', maxWidth: '200px' }}>
              {appointment.serviceName}
            </Text>
          </Space>
          
          <Space size="small">
            <UserOutlined style={{ color: '#722ed1' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              BS. {appointment.dentistName}
            </Text>
          </Space>
        </Space>
      </div>
    );
  };

  // Render room card - NEW DESIGN
  const renderRoomCard = (room) => {
    const hasActivePatient = room.currentPatient !== null;
    const nextPatient = room.waitingList[0];
    const upcomingCount = room.waitingList.length;

    return (
      <Col xs={24} sm={12} lg={8} xl={6} key={room.roomId}>
        <Card 
          className={`room-card ${hasActivePatient ? 'room-busy' : 'room-empty'}`}
          hoverable
        >
          {/* Room Header */}
          <div className="room-header">
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <Avatar 
                  size={40} 
                  icon={<TeamOutlined />} 
                  style={{ 
                    backgroundColor: hasActivePatient ? '#1890ff' : '#d9d9d9' 
                  }}
                />
                <div>
                  <Title level={5} style={{ margin: 0, fontSize: '16px' }}>
                    {room.roomName}
                  </Title>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {hasActivePatient ? 'Đang khám' : 'Phòng trống'}
                  </Text>
                </div>
              </Space>
              
              {upcomingCount > 0 && (
                <Badge 
                  count={upcomingCount} 
                  style={{ backgroundColor: '#faad14' }}
                  title={`${upcomingCount} người đang chờ`}
                />
              )}
            </Space>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          {/* Current Patient Section */}
          <div className="current-section">
            <div className="section-title">
              <CheckCircleOutlined style={{ color: '#1890ff', marginRight: 6 }} />
              <Text strong style={{ fontSize: '13px' }}>Đang khám</Text>
            </div>
            {hasActivePatient ? (
              <div className="current-patient-box">
                {renderPatientInfo(room.currentPatient)}
              </div>
            ) : (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chưa có bệnh nhân"
                style={{ padding: '16px 0', margin: 0 }}
              />
            )}
          </div>

          {/* Next Patient Section */}
          {nextPatient && (
            <>
              <Divider style={{ margin: '12px 0' }} dashed />
              <div className="next-section">
                <div className="section-title">
                  <FieldTimeOutlined style={{ color: '#faad14', marginRight: 6 }} />
                  <Text strong style={{ fontSize: '13px' }}>Tiếp theo</Text>
                </div>
                <div className="next-patient-box">
                  {renderPatientInfo(nextPatient)}
                </div>
              </div>
            </>
          )}

          {/* Upcoming Count */}
          {upcomingCount > 1 && (
            <div className="upcoming-info">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                + {upcomingCount - 1} bệnh nhân đang chờ
              </Text>
            </div>
          )}
        </Card>
      </Col>
    );
  };

  return (
    <div className="queue-management-container">
      {/* Header with Clock */}
      <div className="queue-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            📋 Hàng đợi khám bệnh
          </Title>
          <Text type="secondary">Cập nhật realtime</Text>
        </div>
        <div className="current-time-display">
          <ClockCircleOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <div style={{ marginLeft: 12 }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', lineHeight: 1 }}>
              {currentTime.format('HH:mm:ss')}
            </div>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              {currentTime.format('dddd, DD/MM/YYYY')}
            </Text>
          </div>
        </div>
      </div>

      {/* Room Grid */}
      <Spin spinning={loading}>
        {queueData.length > 0 ? (
          <Row gutter={[16, 16]}>
            {queueData.map(room => renderRoomCard(room))}
          </Row>
        ) : (
          <Card>
            <Empty 
              description={
                <Space direction="vertical" size="small">
                  <Text strong>Chưa có bệnh nhân trong hàng đợi hôm nay</Text>
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    💡 Để thấy hàng đợi, hãy tạo appointment và check-in cho bệnh nhân
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Hoặc vào <Text code>/walk-in-appointments</Text> để tạo lịch khám trực tiếp
                  </Text>
                </Space>
              }
              image={Empty.PRESENTED_IMAGE_DEFAULT}
            />
          </Card>
        )}
      </Spin>
    </div>
  );
};

export default QueueManagement;

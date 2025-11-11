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
  Avatar,
  Modal,
  Descriptions
} from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  FieldTimeOutlined,
  PhoneOutlined,
  CalendarOutlined,
  HomeOutlined
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
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // Waiting list modal
  const [waitingListModalVisible, setWaitingListModalVisible] = useState(false);
  const [selectedWaitingList, setSelectedWaitingList] = useState([]);
  const [selectedRoomInfo, setSelectedRoomInfo] = useState(null);

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
        if (data.length > 0) {
          console.log('🏠 First room structure:', {
            roomId: data[0].roomId,
            roomName: data[0].roomName,
            subroomId: data[0].subroomId,
            subroomName: data[0].subroomName,
            displayName: data[0].displayName
          });
        }
        
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
      'in-progress': { color: 'blue', text: 'Đang khám', icon: <CheckCircleOutlined /> },
      'checked-in': { color: 'gold', text: 'Chờ khám', icon: <FieldTimeOutlined /> },
      'completed': { color: 'success', text: 'Hoàn thành', icon: <CheckCircleOutlined /> },
      'confirmed': { color: 'default', text: 'Đã đặt lịch', icon: <ClockCircleOutlined /> }
    };
    
    const config = statusConfig[status] || { color: 'default', text: status, icon: null };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // Handle click to view details
  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setDetailModalVisible(true);
  };

  // Render detail modal
  const renderDetailModal = () => {
    if (!selectedAppointment) return null;

    return (
      <Modal
        title={
          <Space>
            <UserOutlined />
            <span>Chi tiết bệnh nhân</span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Mã lịch hẹn" span={2}>
            <Text strong>{selectedAppointment.appointmentCode}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Trạng thái" span={2}>
            {getStatusTag(selectedAppointment.status)}
          </Descriptions.Item>

          <Descriptions.Item label={<><UserOutlined /> Bệnh nhân</>} span={2}>
            <Text strong style={{ fontSize: '15px' }}>
              {selectedAppointment.patientInfo.name}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label={<><PhoneOutlined /> Số điện thoại</>}>
            {selectedAppointment.patientInfo.phone}
          </Descriptions.Item>

          <Descriptions.Item label="Năm sinh">
            {selectedAppointment.patientInfo.birthYear}
          </Descriptions.Item>

          <Descriptions.Item label={<><CalendarOutlined /> Ngày khám</>}>
            {dayjs(selectedAppointment.appointmentDate).format('DD/MM/YYYY')}
          </Descriptions.Item>

          <Descriptions.Item label={<><ClockCircleOutlined /> Giờ khám</>}>
            {selectedAppointment.startTime} - {selectedAppointment.endTime}
          </Descriptions.Item>

          <Descriptions.Item label={<><MedicineBoxOutlined /> Dịch vụ</>} span={2}>
            <Space direction="vertical" size={0}>
              <Text strong>{selectedAppointment.serviceName}</Text>
              {selectedAppointment.serviceAddOnName && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {selectedAppointment.serviceAddOnName}
                </Text>
              )}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label={<><TeamOutlined /> Bác sĩ</>} span={2}>
            <Text strong>BS. {selectedAppointment.dentistName}</Text>
          </Descriptions.Item>

          {selectedAppointment.notes && (
            <Descriptions.Item label="Ghi chú" span={2}>
              <Text>{selectedAppointment.notes}</Text>
            </Descriptions.Item>
          )}

          {selectedAppointment.checkedInAt && (
            <Descriptions.Item label="Thời gian check-in" span={2}>
              <Text type="secondary">
                {dayjs(selectedAppointment.checkedInAt).format('HH:mm:ss - DD/MM/YYYY')}
              </Text>
            </Descriptions.Item>
          )}

          {selectedAppointment.startedAt && (
            <Descriptions.Item label="Thời gian bắt đầu" span={2}>
              <Text type="secondary">
                {dayjs(selectedAppointment.startedAt).format('HH:mm:ss - DD/MM/YYYY')}
              </Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Modal>
    );
  };

  // Handle open waiting list modal
  const handleOpenWaitingListModal = (room) => {
    setSelectedWaitingList(room.waitingList || []);
    setSelectedRoomInfo({
      roomName: room.roomName,
      subroomName: room.subroomName
    });
    setWaitingListModalVisible(true);
  };

  // Render compact patient info - MINIMIZED
  const renderPatientInfo = (appointment, isWaiting = false) => {
    if (!appointment) return null;

    return (
      <div 
        className="patient-info-compact" 
        onClick={() => handleViewDetails(appointment)}
        style={{ cursor: 'pointer' }}
      >
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text strong ellipsis style={{ maxWidth: isWaiting ? '100%' : '60%', fontSize: '11px', lineHeight: 1.2 }}>
              {appointment.patientInfo.name}
            </Text>
            {!isWaiting && getStatusTag(appointment.status)}
          </Space>
          
          {!isWaiting && (
            <Text type="secondary" style={{ fontSize: '9px', lineHeight: 1.3 }}>
              🕐 {appointment.startTime} - {appointment.endTime}
            </Text>
          )}
        </Space>
      </div>
    );
  };

  // Render room card - COMPACT DESIGN
  const renderRoomCard = (room) => {
    const hasActivePatient = !!room.currentPatient;
    const nextPatient = room.nextPatient || null;
    const waitingList = room.waitingList || [];
    const upcomingCount = (nextPatient ? 1 : 0) + waitingList.length;

    return (
      <Col xs={24} sm={12} md={8} lg={6} xl={4} key={room.subroomId ? `${room.roomId}-${room.subroomId}` : room.roomId}>
        <Card 
          className={`room-card-compact ${hasActivePatient ? 'room-busy' : 'room-empty'}`}
          bodyStyle={{ padding: '12px' }}
        >
          {/* Room Header - Compact */}
          <div className="room-header-compact">
            <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 2 }}>
              <Space size={3}>
                <Avatar 
                  size={22} 
                  icon={<HomeOutlined />} 
                  style={{ 
                    backgroundColor: hasActivePatient ? '#1890ff' : '#d9d9d9',
                    fontSize: '11px'
                  }}
                />
                <div style={{ lineHeight: 1 }}>
                  <Title level={5} style={{ margin: 0, fontSize: '13px', lineHeight: 1.2, marginBottom: 2, fontWeight: 600 }}>
                    {room.roomName || 'Phòng khám'}
                  </Title>
                  {room.subroomName && (
                    <Text type="secondary" style={{ fontSize: '10px', display: 'block', lineHeight: 1.2, marginBottom: 2 }}>
                      {room.subroomName}
                    </Text>
                  )}
                  <Tag 
                    color={hasActivePatient ? 'blue' : 'default'} 
                    style={{ fontSize: '9px', padding: '0 4px', lineHeight: '16px', margin: 0 }}
                  >
                    {hasActivePatient ? '🟢 Đang khám' : '⚪ Trống'}
                  </Tag>
                </div>
              </Space>
              
              {upcomingCount > 0 && (
                <Badge 
                  count={upcomingCount} 
                  style={{ backgroundColor: '#faad14' }}
                  overflowCount={9}
                />
              )}
            </Space>
          </div>

          <Divider style={{ margin: '2px 0' }} />

          {/* Current Patient - Minimal */}
          {hasActivePatient ? (
            <div className="current-patient-compact">
              <Text type="secondary" style={{ fontSize: '9px', display: 'block', marginBottom: 1 }}>
                🔵 ĐANG KHÁM
              </Text>
              {renderPatientInfo(room.currentPatient)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '6px 0' }}>
              <Text type="secondary" style={{ fontSize: '10px' }}>
                Không có bệnh nhân
              </Text>
            </div>
          )}

          {/* Next Patient - Minimal */}
          {nextPatient && (
            <>
              <Divider style={{ margin: '2px 0' }} dashed />
              <div className="next-patient-compact">
                <Text type="secondary" style={{ fontSize: '9px', display: 'block', marginBottom: 1 }}>
                  🟡 TIẾP THEO
                </Text>
                {renderPatientInfo(nextPatient)}
              </div>
            </>
          )}

          {/* Waiting Count - Minimized */}
          {waitingList.length > 0 && (
            <>
              <Divider style={{ margin: '2px 0' }} />
              <div 
                className="waiting-count-compact"
                onClick={() => {
                  Modal.info({
                    title: `Danh sách chờ - ${room.roomName}`,
                    width: 600,
                    content: (
                      <Space direction="vertical" style={{ width: '100%' }} size={12}>
                        {waitingList.map((item, idx) => (
                          <Card 
                            key={item._id} 
                            size="small" 
                            hoverable
                            onClick={() => handleViewDetails(item)}
                          >
                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                              <Space>
                                <Avatar size="small">{idx + 1}</Avatar>
                                <div>
                                  <Text strong>{item.patientInfo.name}</Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    {item.startTime} | {item.serviceAddOnName || item.serviceName}
                                  </Text>
                                </div>
                              </Space>
                              {getStatusTag(item.status)}
                            </Space>
                          </Card>
                        ))}
                      </Space>
                    )
                  });
                }}
                style={{ cursor: 'pointer' }}
              >
                <Text 
                  type="secondary" 
                  style={{ fontSize: '10px', textAlign: 'center', display: 'block' }}
                >
                  ⏳ {waitingList.length} BN đang chờ
                </Text>
              </div>
              
              {/* Clickable badge - NEW */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenWaitingListModal(room);
                }}
                style={{ 
                  cursor: 'pointer',
                  marginTop: '4px',
                  padding: '4px',
                  backgroundColor: '#e6f7ff',
                  borderRadius: '4px',
                  textAlign: 'center'
                }}
                title="Click để xem danh sách chi tiết"
              >
                <Text 
                  style={{ fontSize: '11px', color: '#1890ff', fontWeight: 500 }}
                >
                  👁️ Xem danh sách
                </Text>
              </div>
            </>
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
             Hàng đợi khám bệnh
          </Title>
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
          <Row gutter={[12, 12]}>
            {queueData.map(room => renderRoomCard(room))}
          </Row>
        ) : (
          <Card>
            <Empty 
              description={
                <Space direction="vertical" size="small">
                  <Text strong>Chưa có bệnh nhân trong hàng đợi hôm nay</Text>
                </Space>
              }
              image={Empty.PRESENTED_IMAGE_DEFAULT}
            />
          </Card>
        )}
      </Spin>

      {/* Detail Modal */}
      {renderDetailModal()}

      {/* Waiting List Modal */}
      <Modal
        title={
          <Space>
            <TeamOutlined style={{ color: '#1890ff' }} />
            <span>
              Danh sách bệnh nhân đang chờ
              {selectedRoomInfo && (
                <Text type="secondary" style={{ fontSize: '14px', marginLeft: '8px' }}>
                  ({selectedRoomInfo.roomName}{selectedRoomInfo.subroomName ? ` - ${selectedRoomInfo.subroomName}` : ''})
                </Text>
              )}
            </span>
          </Space>
        }
        open={waitingListModalVisible}
        onCancel={() => setWaitingListModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedWaitingList.length > 0 ? (
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {selectedWaitingList
                .sort((a, b) => {
                  // Sort by startTime
                  const timeA = a.startTime || '';
                  const timeB = b.startTime || '';
                  return timeA.localeCompare(timeB);
                })
                .map((appointment, index) => (
                  <Card 
                    key={appointment._id || index}
                    size="small"
                    hoverable
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setDetailModalVisible(true);
                      setWaitingListModalVisible(false);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <Row gutter={[16, 8]} align="middle">
                      <Col span={2}>
                        <Avatar 
                          size="large" 
                          style={{ backgroundColor: '#1890ff' }}
                        >
                          {index + 1}
                        </Avatar>
                      </Col>
                      <Col span={6}>
                        <Space direction="vertical" size={0}>
                          <Text strong style={{ fontSize: '15px' }}>
                            {appointment.patientInfo?.name || 'N/A'}
                          </Text>
                          <Text type="secondary" style={{ fontSize: '13px' }}>
                            <PhoneOutlined /> {appointment.patientInfo?.phone || 'N/A'}
                          </Text>
                        </Space>
                      </Col>
                      <Col span={5}>
                        <Space direction="vertical" size={0}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            <ClockCircleOutlined /> Thời gian
                          </Text>
                          <Text strong style={{ fontSize: '14px' }}>
                            {appointment.startTime} - {appointment.endTime}
                          </Text>
                        </Space>
                      </Col>
                      <Col span={6}>
                        <Space direction="vertical" size={0}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            <MedicineBoxOutlined /> Dịch vụ
                          </Text>
                          <Text ellipsis style={{ fontSize: '13px' }}>
                            {appointment.serviceAddOnName || appointment.serviceName || 'N/A'}
                          </Text>
                        </Space>
                      </Col>
                      <Col span={5}>
                        {getStatusTag(appointment.status)}
                      </Col>
                    </Row>
                    
                    {/* Show gap to next appointment */}
                    {index < selectedWaitingList.length - 1 && (
                      (() => {
                        const currentEnd = appointment.endTime;
                        const nextStart = selectedWaitingList[index + 1].startTime;
                        if (currentEnd && nextStart && currentEnd < nextStart) {
                          return (
                            <Divider style={{ margin: '8px 0' }}>
                              <Text type="secondary" style={{ fontSize: '11px' }}>
                                <FieldTimeOutlined /> Trống: {currentEnd} - {nextStart}
                              </Text>
                            </Divider>
                          );
                        }
                        return null;
                      })()
                    )}
                  </Card>
                ))}
            </Space>
          </div>
        ) : (
          <Empty description="Không có bệnh nhân nào trong danh sách chờ" />
        )}
      </Modal>
    </div>
  );
};

export default QueueManagement;

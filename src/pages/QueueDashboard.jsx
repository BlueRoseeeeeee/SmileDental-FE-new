import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
  Modal,
  Form
} from 'react-bootstrap';
import { FaPhone, FaCheckCircle, FaTimesCircle, FaUsers, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import PaymentModal from '../components/Payment/PaymentModal';
import roomService from '../services/roomService';
import queueService from '../services/queueService';

const QueueDashboard = () => {
  console.log('🚀 QueueDashboard component rendered');
  
  const [loading, setLoading] = useState(true);
  const [queueStatus, setQueueStatus] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [rooms, setRooms] = useState([]);
  
  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelRecordId, setCancelRecordId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  
  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [completedRecordId, setCompletedRecordId] = useState(null);
  
  // Waiting list modal
  const [showWaitingListModal, setShowWaitingListModal] = useState(false);
  const [waitingListStatus, setWaitingListStatus] = useState('pending'); // 'pending' | 'in-progress' | 'completed' | 'cancelled'
  
  // Debug: Log state changes
  useEffect(() => {
    console.log('📊 showWaitingListModal changed:', showWaitingListModal);
  }, [showWaitingListModal]);
  
  useEffect(() => {
    console.log('📊 waitingListStatus changed:', waitingListStatus);
  }, [waitingListStatus]);
  
  // Open waiting list modal
  const openWaitingListModal = (status) => {
    console.log('🎯 Opening waiting list modal with status:', status);
    console.log('🎯 Current queueStatus:', queueStatus);
    setWaitingListStatus(status);
    setShowWaitingListModal(true);
  };

  // Close waiting list modal
  const closeWaitingListModal = () => {
    console.log('🎯 Closing waiting list modal');
    setShowWaitingListModal(false);
  };
  
  // Socket.IO
  const socketRef = useRef(null); // Record socket
  const appointmentSocketRef = useRef(null); // Appointment socket
  const [isConnected, setIsConnected] = useState(false);

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  // Setup Socket.IO connection
  useEffect(() => {
    // ✅ Connect to BOTH services for complete real-time updates
    // 1. APPOINTMENT SERVICE (port 3006) - for appointment updates (check-in, cancel)
    // 2. RECORD SERVICE (port 3010) - for record updates (in-progress, completed)
    
    const APPOINTMENT_SERVICE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3006';
    const RECORD_SERVICE_URL = import.meta.env.VITE_RECORD_SERVICE_URL || 'http://localhost:3010';
    
    // Socket 1: Appointment Service
    const appointmentSocket = io(APPOINTMENT_SERVICE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Socket 2: Record Service
    const recordSocket = io(RECORD_SERVICE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = recordSocket; // Keep main reference to record socket
    appointmentSocketRef.current = appointmentSocket; // Save appointment socket

    // ===== APPOINTMENT SOCKET EVENTS =====
    appointmentSocket.on('connect', () => {
      console.log('✅ Appointment Socket connected:', appointmentSocket.id);
      toast.success('Kết nối appointment service thành công', { autoClose: 1000 });
    });

    appointmentSocket.on('disconnect', () => {
      console.log('❌ Appointment Socket disconnected');
    });

    appointmentSocket.on('appointment:status-changed', (data) => {
      console.log('📅 [Appointment Socket] Status changed:', data);
      if (data.roomId === selectedRoomId) {
        fetchQueueStatus(true);
        toast.info(`${data.patientName || 'Bệnh nhân'}: ${data.message}`, { autoClose: 2000 });
      }
    });

    appointmentSocket.on('queue_updated', (data) => {
      console.log('='.repeat(80));
      console.log('� [QueueDashboard - Appointment Socket] Received queue_updated event!');
      console.log('📋 Event data:', data);
      console.log('🏥 Current room:', selectedRoomId);
      console.log('🏥 Event room:', data.roomId);
      console.log('✅ Match:', data.roomId === selectedRoomId);
      console.log('='.repeat(80));
      
      if (data.roomId === selectedRoomId) {
        console.log('🔄 [QueueDashboard] Calling fetchQueueStatus(true) to refresh...');
        fetchQueueStatus(true);
      } else {
        console.log('⏭️ [QueueDashboard] Skipping refresh - different room');
      }
    });

    // ===== RECORD SOCKET EVENTS =====
    recordSocket.on('connect', () => {
      console.log('✅ Record Socket connected:', recordSocket.id);
      setIsConnected(true);
      toast.success('Kết nối record service thành công', { autoClose: 1000 });
    });

    recordSocket.on('disconnect', () => {
      console.log('❌ Record Socket disconnected');
      setIsConnected(false);
      toast.warning('Mất kết nối record service', { autoClose: 2000 });
    });

    recordSocket.on('connect_error', (error) => {
      console.error('Record Socket connection error:', error);
      setIsConnected(false);
    });

    // Listen for record updates
    recordSocket.on('record:updated', (data) => {
      console.log('📨 [Record Socket] Record updated:', data);
      if (data.roomId === selectedRoomId) {
        fetchQueueStatus(true);
        toast.info(`Cập nhật: ${data.message || 'Hàng đợi đã thay đổi'}`, { autoClose: 2000 });
      }
    });

    recordSocket.on('record:status-changed', (data) => {
      console.log('📊 [Record Socket] Status changed:', data);
      if (data.roomId === selectedRoomId) {
        fetchQueueStatus(true);
        const statusText = {
          pending: 'Chờ khám',
          'in-progress': 'Đang khám',
          completed: 'Hoàn thành',
          cancelled: 'Đã hủy'
        }[data.status] || data.status;
        toast.info(`${data.patientName || 'Bệnh nhân'}: ${statusText}`, { autoClose: 2000 });
      }
    });

    recordSocket.on('queue_updated', (data) => {
      console.log('='.repeat(80));
      console.log('� [QueueDashboard - Record Socket] Received queue_updated event!');
      console.log('📋 Event data:', data);
      console.log('🏥 Current room:', selectedRoomId);
      console.log('🏥 Event room:', data.roomId);
      console.log('✅ Match:', data.roomId === selectedRoomId);
      console.log('='.repeat(80));
      
      if (data.roomId === selectedRoomId) {
        console.log('🔄 [QueueDashboard] Calling fetchQueueStatus(true) to refresh...');
        fetchQueueStatus(true);
      } else {
        console.log('⏭️ [QueueDashboard] Skipping refresh - different room');
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting sockets...');
      appointmentSocket.off('connect');
      appointmentSocket.off('disconnect');
      appointmentSocket.off('appointment:status-changed');
      appointmentSocket.off('queue_updated');
      appointmentSocket.disconnect();

      recordSocket.off('connect');
      recordSocket.off('disconnect');
      recordSocket.off('connect_error');
      recordSocket.off('record:updated');
      recordSocket.off('record:status-changed');
      recordSocket.off('queue_updated');
      recordSocket.disconnect();
    };
  }, [selectedRoomId, selectedDate]);

  // Join room when selected
  useEffect(() => {
    // Join BOTH sockets to the room
    if (selectedRoomId) {
      const roomData = {
        roomId: selectedRoomId,
        date: selectedDate
      };

      // Join appointment socket
      if (appointmentSocketRef.current && appointmentSocketRef.current.connected) {
        console.log('🚪 [Appointment Socket] Joining room:', selectedRoomId);
        appointmentSocketRef.current.emit('join:room', roomData);
      }

      // Join record socket
      if (socketRef.current && socketRef.current.connected) {
        console.log('🚪 [Record Socket] Joining room:', selectedRoomId);
        socketRef.current.emit('join:room', roomData);
      }
    }
  }, [selectedRoomId, selectedDate]);

  // Fetch queue status when date or room changes
  useEffect(() => {
    if (selectedRoomId) {
      fetchQueueStatus();
    }
  }, [selectedDate, selectedRoomId]);

  const fetchRooms = async () => {
    try {
      const response = await roomService.getActiveRooms();

      if (response.success) {
        const activeRooms = response.data || [];
        setRooms(activeRooms);
        
        // Auto-select first room
        if (activeRooms.length > 0 && !selectedRoomId) {
          setSelectedRoomId(activeRooms[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Không thể tải danh sách phòng khám');
      setRooms([]);
    }
  };

  const fetchQueueStatus = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      console.log('🔄 [fetchQueueStatus] Fetching queue data...', {
        date: selectedDate,
        roomId: selectedRoomId,
        silent
      });
      
      const response = await queueService.getQueueStatus(selectedDate, selectedRoomId);

      if (response.success) {
        console.log('✅ [fetchQueueStatus] Queue data loaded:', {
          appointmentsCount: response.data?.appointments?.length || 0,
          room: response.data?.room?.name
        });
        setQueueStatus(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('❌ [fetchQueueStatus] Error:', error);
      toast.error('Không thể tải trạng thái hàng đợi');
      setQueueStatus(null);
      setLoading(false);
    }
  };

  const handleCallRecord = async (recordId) => {
    try {
      const response = await queueService.callRecord(recordId);

      if (response.success) {
        toast.success('Đã gọi bệnh nhân thành công');
        fetchQueueStatus();
      }
    } catch (error) {
      console.error('Error calling record:', error);
      toast.error('Không thể gọi bệnh nhân');
    }
  };

  const handleCompleteRecord = async (recordId) => {
    try {
      const response = await queueService.completeRecord(recordId);

      if (response.success) {
        toast.success('Đã hoàn thành khám bệnh');
        
        // Show payment modal with recordId (modal will auto-load payment)
        setCompletedRecordId(recordId);
        setShowPaymentModal(true);
        
        fetchQueueStatus();
      }
    } catch (error) {
      console.error('Error completing record:', error);
      toast.error('Không thể hoàn thành hồ sơ');
    }
  };

  const handleCancelRecord = async () => {
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy');
      return;
    }

    try {
      const response = await queueService.cancelRecord(cancelRecordId, cancelReason);

      if (response.success) {
        toast.success('Đã hủy hồ sơ thành công');
        setShowCancelModal(false);
        setCancelRecordId(null);
        setCancelReason('');
        fetchQueueStatus();
      }
    } catch (error) {
      console.error('Error cancelling record:', error);
      toast.error('Không thể hủy hồ sơ');
      setShowCancelModal(false);
    }
  };

  const openCancelModal = (recordId) => {
    setCancelRecordId(recordId);
    setShowCancelModal(true);
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'Chờ', variant: 'secondary' },
      'in-progress': { text: 'Đang khám', variant: 'primary' },
      completed: { text: 'Hoàn thành', variant: 'success' },
      cancelled: { text: 'Đã hủy', variant: 'danger' }
    };
    const config = statusMap[status] || { text: status, variant: 'secondary' };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  if (loading && !queueStatus) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Đang tải...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2>
            <FaUsers className="me-2" />
            Quản Lý Hàng Đợi
            {isConnected && (
              <Badge bg="success" className="ms-2" style={{ fontSize: '0.5em' }}>
                ● Live
              </Badge>
            )}
            {!isConnected && (
              <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.5em' }}>
                ○ Offline
              </Badge>
            )}
          </h2>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Ngày</Form.Label>
            <Form.Control
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Phòng khám</Form.Label>
            <Form.Select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
            >
              <option value="">Chọn phòng</option>
              {rooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4} className="d-flex align-items-end">
          <div className="me-3">
            {isConnected ? (
              <Badge bg="success">
                <span className="me-1">●</span>
                Real-time Active
              </Badge>
            ) : (
              <Badge bg="warning" text="dark">
                <span className="me-1">○</span>
                Connecting...
              </Badge>
            )}
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => fetchQueueStatus()}
          >
            Làm mới
          </Button>
        </Col>
      </Row>

      {!queueStatus ? (
        <Alert variant="info">
          Vui lòng chọn ngày và phòng khám để xem hàng đợi
        </Alert>
      ) : (
        <>
          {/* Current Record */}
          <Row className="mb-3">
            <Col>
              <Card className="border-primary">
                <Card.Header className="bg-primary text-white py-1">
                  <h6 className="mb-0" style={{ fontSize: '12px' }}>
                    <FaClock className="me-1" style={{ fontSize: '11px' }} />
                    Đang Khám
                  </h6>
                </Card.Header>
                <Card.Body style={{ padding: '8px' }}>
                  {queueStatus.current ? (
                    <div>
                      <Row>
                        <Col md={6}>
                          <div className="text-primary mb-1" style={{ fontSize: '13px', fontWeight: 'bold' }}>
                            STT: {queueStatus.current.queueNumber}
                          </div>
                          <p className="mb-1" style={{ fontSize: '11px' }}>
                            <strong>Bệnh nhân:</strong>{' '}
                            {queueStatus.current.patientInfo?.name}
                          </p>
                          <p className="mb-1" style={{ fontSize: '11px' }}>
                            <strong>Điện thoại:</strong>{' '}
                            {queueStatus.current.patientInfo?.phone}
                          </p>
                          <p className="mb-0" style={{ fontSize: '11px' }}>
                            <strong>Bắt đầu:</strong>{' '}
                            {formatTime(queueStatus.current.startedAt)}
                          </p>
                        </Col>
                        <Col md={6} className="text-end">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleCompleteRecord(queueStatus.current._id)}
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                          >
                            <FaCheckCircle className="me-1" style={{ fontSize: '10px' }} />
                            Hoàn Thành
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="ms-2"
                            onClick={() => openCancelModal(queueStatus.current._id)}
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                          >
                            <FaTimesCircle className="me-1" style={{ fontSize: '10px' }} />
                            Hủy
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  ) : (
                    <Alert variant="secondary" className="mb-0" style={{ fontSize: '11px', padding: '6px' }}>
                      Không có bệnh nhân đang khám
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Next Record */}
          <Row className="mb-3">
            <Col>
              <Card className="border-warning">
                <Card.Header className="bg-warning py-1">
                  <h6 className="mb-0" style={{ fontSize: '12px' }}>Bệnh Nhân Tiếp Theo</h6>
                </Card.Header>
                <Card.Body style={{ padding: '8px' }}>
                  {queueStatus.next ? (
                    <div>
                      <Row>
                        <Col md={6}>
                          <div className="text-warning mb-1" style={{ fontSize: '13px', fontWeight: 'bold' }}>
                            STT: {queueStatus.next.queueNumber || 'Chưa gán'}
                          </div>
                          <p className="mb-1" style={{ fontSize: '11px' }}>
                            <strong>Bệnh nhân:</strong>{' '}
                            {queueStatus.next.patientInfo?.name}
                          </p>
                          <p className="mb-1" style={{ fontSize: '11px' }}>
                            <strong>Điện thoại:</strong>{' '}
                            {queueStatus.next.patientInfo?.phone}
                          </p>
                          <p className="mb-0" style={{ fontSize: '11px' }}>
                            <strong>Trạng thái:</strong>{' '}
                            {getStatusBadge(queueStatus.next.status)}
                          </p>
                        </Col>
                        <Col md={6} className="text-end">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleCallRecord(queueStatus.next._id)}
                            disabled={queueStatus.current !== null}
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                          >
                            <FaPhone className="me-1" style={{ fontSize: '10px' }} />
                            Gọi Bệnh Nhân
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="ms-2"
                            onClick={() => openCancelModal(queueStatus.next._id)}
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                          >
                            Hủy
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  ) : (
                    <Alert variant="secondary" className="mb-0" style={{ fontSize: '11px', padding: '6px' }}>
                      Không có bệnh nhân trong hàng đợi
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* All Appointments Timeline with Scroll */}
          <Row>
            <Col>
              <Card>
                <Card.Header style={{ padding: '8px 12px' }}>
                  <h6 className="mb-0" style={{ fontSize: '12px' }}>
                    Lịch Khám Trong Ngày 
                    {queueStatus.summary && (
                      <Badge bg="secondary" className="ms-2" style={{ fontSize: '10px' }}>
                        {queueStatus.summary.total} lịch
                      </Badge>
                    )}
                  </h6>
                  {queueStatus.summary && (
                    <div className="mt-1">
                      <Badge 
                        bg="warning" 
                        text="dark" 
                        className="me-1"
                        style={{ cursor: 'pointer', fontSize: '10px', padding: '3px 6px' }}
                        onClick={() => openWaitingListModal('pending')}
                        title="Click để xem danh sách"
                      >
                        <FaUsers className="me-1" style={{ fontSize: '9px' }} />
                        Chờ: {queueStatus.summary.pending}
                      </Badge>
                      <Badge 
                        bg="primary" 
                        className="me-1"
                        style={{ cursor: 'pointer', fontSize: '10px', padding: '3px 6px' }}
                        onClick={() => openWaitingListModal('in-progress')}
                        title="Click để xem danh sách"
                      >
                        <FaClock className="me-1" style={{ fontSize: '9px' }} />
                        Đang khám: {queueStatus.summary.inProgress}
                      </Badge>
                      <Badge 
                        bg="success" 
                        className="me-1"
                        style={{ cursor: 'pointer', fontSize: '10px', padding: '3px 6px' }}
                        onClick={() => openWaitingListModal('completed')}
                        title="Click để xem danh sách"
                      >
                        <FaCheckCircle className="me-1" style={{ fontSize: '9px' }} />
                        Hoàn thành: {queueStatus.summary.completed}
                      </Badge>
                      <Badge 
                        bg="danger"
                        style={{ cursor: 'pointer', fontSize: '10px', padding: '3px 6px' }}
                        onClick={() => openWaitingListModal('cancelled')}
                        title="Click để xem danh sách"
                      >
                        <FaTimesCircle className="me-1" style={{ fontSize: '9px' }} />
                        Đã hủy: {queueStatus.summary.cancelled}
                      </Badge>
                    </div>
                  )}
                </Card.Header>
                <Card.Body style={{ padding: '8px' }}>
                  {queueStatus.timeSlots && queueStatus.timeSlots.length > 0 ? (
                    <div 
                      style={{ 
                        maxHeight: '350px', 
                        overflowY: 'auto',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        padding: '6px'
                      }}
                    >
                      {queueStatus.timeSlots.map((slot, index) => (
                        <div key={index} className="mb-1">
                          {slot.type === 'appointment' ? (
                            <Card 
                              className={`
                                ${slot.status === 'in-progress' ? 'border-primary bg-light' : ''}
                                ${slot.status === 'completed' ? 'border-success' : ''}
                                ${slot.status === 'cancelled' ? 'border-danger text-muted' : ''}
                                ${slot.status === 'pending' ? 'border-warning' : ''}
                              `}
                              style={{ marginBottom: '3px' }}
                            >
                              <Card.Body style={{ padding: '5px 8px' }}>
                                <Row className="align-items-center">
                                  <Col md={2}>
                                    <div className="text-center">
                                      <div style={{ fontSize: '11px', marginBottom: 0 }}>
                                        {slot.queueNumber ? (
                                          <Badge bg="primary" style={{ fontSize: '10px', padding: '2px 6px' }}>{slot.queueNumber}</Badge>
                                        ) : (
                                          <Badge bg="secondary" style={{ fontSize: '10px', padding: '2px 6px' }}>-</Badge>
                                        )}
                                      </div>
                                    </div>
                                  </Col>
                                  <Col md={3}>
                                    <div style={{ fontSize: '10px' }}>
                                      <FaClock className="me-1 text-muted" style={{ fontSize: '9px' }} />
                                      <strong>{formatTime(slot.startTime)}</strong>
                                      {' - '}
                                      <strong>{formatTime(slot.endTime)}</strong>
                                    </div>
                                  </Col>
                                  <Col md={3}>
                                    <div>
                                      <strong style={{ fontSize: '11px' }}>{slot.patientName}</strong>
                                      {slot.patientPhone && (
                                        <div className="text-muted" style={{ fontSize: '9px' }}>
                                          {slot.patientPhone}
                                        </div>
                                      )}
                                    </div>
                                  </Col>
                                  <Col md={2}>
                                    <div style={{ fontSize: '9px' }}>
                                      {getStatusBadge(slot.status)}
                                    </div>
                                  </Col>
                                  <Col md={2} className="text-end">
                                    {slot.status === 'pending' && (
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => openCancelModal(slot.recordId)}
                                        style={{ fontSize: '10px', padding: '2px 6px' }}
                                      >
                                        Hủy
                                      </Button>
                                    )}
                                  </Col>
                                </Row>
                              </Card.Body>
                            </Card>
                          ) : (
                            // Gap slot
                            <div 
                              className="text-center" 
                              style={{ 
                                backgroundColor: '#f8f9fa',
                                border: '1px dashed #dee2e6',
                                borderRadius: '3px',
                                padding: '2px 4px'
                              }}
                            >
                              <small className="text-muted" style={{ fontSize: '9px' }}>
                                <FaClock className="me-1" style={{ fontSize: '8px' }} />
                                Trống lịch: {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                {' '}
                                <Badge bg="light" text="dark" style={{ fontSize: '8px', padding: '1px 4px' }}>
                                  {slot.durationMinutes} phút
                                </Badge>
                              </small>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert variant="secondary" className="mb-0">
                      Không có lịch khám trong ngày này
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Waiting List Modal */}
      <Modal 
        show={showWaitingListModal} 
        onHide={() => setShowWaitingListModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {waitingListStatus === 'pending' && (
              <>
                <Badge bg="warning" text="dark" className="me-2">
                  <FaUsers />
                </Badge>
                Danh Sách Bệnh Nhân Đang Chờ
              </>
            )}
            {waitingListStatus === 'in-progress' && (
              <>
                <Badge bg="primary" className="me-2">
                  <FaClock />
                </Badge>
                Danh Sách Bệnh Nhân Đang Khám
              </>
            )}
            {waitingListStatus === 'completed' && (
              <>
                <Badge bg="success" className="me-2">
                  <FaCheckCircle />
                </Badge>
                Danh Sách Bệnh Nhân Đã Hoàn Thành
              </>
            )}
            {waitingListStatus === 'cancelled' && (
              <>
                <Badge bg="danger" className="me-2">
                  <FaTimesCircle />
                </Badge>
                Danh Sách Bệnh Nhân Đã Hủy
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {queueStatus && queueStatus.timeSlots ? (
            <>
              {(() => {
                console.log('🔍 All timeSlots:', queueStatus.timeSlots);
                console.log('🔍 Waiting list status:', waitingListStatus);
                console.log('🔍 Appointment slots:', queueStatus.timeSlots.filter(slot => slot.type === 'appointment'));
                console.log('🔍 Status values:', queueStatus.timeSlots.filter(slot => slot.type === 'appointment').map(s => s.status));
                
                const filteredSlots = queueStatus.timeSlots
                  .filter(slot => slot.type === 'appointment' && slot.status === waitingListStatus)
                  .sort((a, b) => {
                    const timeA = a.startTime || '';
                    const timeB = b.startTime || '';
                    return timeA.localeCompare(timeB);
                  });
                
                console.log('🔍 Filtered slots:', filteredSlots);
                
                if (filteredSlots.length === 0) {
                  return (
                    <div className="text-center py-5">
                      <FaUsers size={50} className="text-muted mb-3" />
                      <p className="text-muted">Không có bệnh nhân nào</p>
                    </div>
                  );
                }
                
                return filteredSlots.map((slot, index) => (
                  <Card 
                    key={slot.recordId || `${slot.appointmentCode}-${index}`} 
                    className={`mb-3 ${
                      slot.status === 'in-progress' ? 'border-primary' : 
                      slot.status === 'completed' ? 'border-success' : 
                      slot.status === 'cancelled' ? 'border-danger' : 
                      'border-warning'
                    }`}
                  >
                    <Card.Body>
                      <Row className="align-items-center">
                        <Col md={1}>
                          <h4 className="mb-0 text-center">
                            {slot.queueNumber ? (
                              <Badge bg="primary">{slot.queueNumber}</Badge>
                            ) : (
                              <Badge bg="secondary">-</Badge>
                            )}
                          </h4>
                        </Col>
                        <Col md={3}>
                          <div className="text-primary">
                            <FaClock className="me-2" />
                            <strong>{formatTime(slot.startTime)}</strong>
                            {' - '}
                            <strong>{formatTime(slot.endTime)}</strong>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div>
                            <strong className="d-block">{slot.patientName}</strong>
                            {slot.patientPhone && (
                              <small className="text-muted">
                                <FaPhone className="me-1" />
                                {slot.patientPhone}
                              </small>
                            )}
                          </div>
                        </Col>
                        <Col md={2}>
                          <div className="text-muted small">
                            {slot.serviceName || 'Không rõ dịch vụ'}
                          </div>
                        </Col>
                        <Col md={2} className="text-end">
                          {slot.status === 'pending' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                className="mb-1 w-100"
                                onClick={() => {
                                  setShowWaitingListModal(false);
                                  handleCallRecord(slot.recordId);
                                }}
                              >
                                <FaPhone className="me-1" />
                                Gọi
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="w-100"
                                onClick={() => {
                                  setShowWaitingListModal(false);
                                  openCancelModal(slot.recordId);
                                }}
                              >
                                Hủy
                              </Button>
                            </>
                          )}
                          {slot.status === 'in-progress' && (
                            <Button
                              variant="success"
                              size="sm"
                              className="w-100"
                              onClick={() => {
                                setShowWaitingListModal(false);
                                handleCompleteRecord(slot.recordId);
                              }}
                            >
                              <FaCheckCircle className="me-1" />
                              Hoàn thành
                            </Button>
                          )}
                        </Col>
                      </Row>
                      
                      {/* Show subroom info if available */}
                      {slot.subroomName && (
                        <Row className="mt-2">
                          <Col>
                            <Badge bg="info" text="dark">
                              {slot.subroomName}
                            </Badge>
                          </Col>
                        </Row>
                      )}
                      
                      {/* Show gap slots between appointments */}
                      {index < queueStatus.timeSlots.filter(s => s.type === 'appointment' && s.status === waitingListStatus).length - 1 && (
                        (() => {
                          const currentSlot = slot;
                          const nextSlot = queueStatus.timeSlots
                            .filter(s => s.type === 'appointment' && s.status === waitingListStatus)
                            [index + 1];
                          
                          if (nextSlot) {
                            const currentEnd = currentSlot.endTime;
                            const nextStart = nextSlot.startTime;
                            
                            if (currentEnd < nextStart) {
                              return (
                                <div className="mt-2 text-center">
                                  <small className="text-muted">
                                    <FaClock className="me-1" />
                                    Trống: {currentEnd} - {nextStart}
                                  </small>
                                </div>
                              );
                            }
                          }
                          return null;
                        })()
                      )}
                    </Card.Body>
                  </Card>
                ));
              })()}
            </>
          ) : (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Đang tải danh sách...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowWaitingListModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Cancel Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Hủy Hồ Sơ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Lý do hủy *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Đóng
          </Button>
          <Button variant="danger" onClick={handleCancelRecord}>
            Xác Nhận Hủy
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Payment Confirm Modal */}
      {showPaymentModal && completedRecordId && (
        <PaymentModal
          visible={showPaymentModal}
          recordId={completedRecordId}
          onCancel={() => {
            setShowPaymentModal(false);
            setCompletedRecordId(null);
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setCompletedRecordId(null);
            fetchQueueStatus();
            toast.success('Thanh toán thành công!');
          }}
        />
      )}
    </Container>
  );
};

export default QueueDashboard;

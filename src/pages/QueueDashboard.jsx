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
import axios from 'axios';
import { io } from 'socket.io-client';
import PaymentConfirmModal from '../components/PaymentConfirmModal';

const QueueDashboard = () => {
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
  const [completedRecord, setCompletedRecord] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  
  // Socket.IO
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  // Setup Socket.IO connection
  useEffect(() => {
    // Initialize socket connection
    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', socket.id);
      setIsConnected(true);
      toast.success('Kết nối real-time thành công', { autoClose: 2000 });
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
      setIsConnected(false);
      toast.warning('Mất kết nối real-time', { autoClose: 2000 });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Listen for record updates
    socket.on('record:updated', (data) => {
      console.log('📨 Record updated:', data);
      // Refresh queue status if it's the current room
      if (data.roomId === selectedRoomId) {
        fetchQueueStatus(true); // Silent refresh
        toast.info(`Cập nhật: ${data.message || 'Hàng đợi đã thay đổi'}`, { autoClose: 2000 });
      }
    });

    // Listen for record status changes
    socket.on('record:status-changed', (data) => {
      console.log('📊 Record status changed:', data);
      if (data.roomId === selectedRoomId) {
        fetchQueueStatus(true);
        const statusText = {
          pending: 'Chờ khám',
          in_progress: 'Đang khám',
          completed: 'Hoàn thành',
          cancelled: 'Đã hủy'
        }[data.status] || data.status;
        toast.info(`${data.patientName || 'Bệnh nhân'}: ${statusText}`, { autoClose: 2000 });
      }
    });

    // Listen for queue updates
    socket.on('queue:updated', (data) => {
      console.log('🔄 Queue updated:', data);
      if (data.roomId === selectedRoomId && data.date === selectedDate) {
        fetchQueueStatus(true);
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting socket...');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('record:updated');
      socket.off('record:status-changed');
      socket.off('queue:updated');
      socket.disconnect();
    };
  }, [selectedRoomId, selectedDate]);

  // Join room when selected
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected && selectedRoomId) {
      console.log('🚪 Joining room:', selectedRoomId);
      socketRef.current.emit('join:room', {
        roomId: selectedRoomId,
        date: selectedDate
      });
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
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/room/active`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 3000 // 3 second timeout
      });

      if (response.data.success) {
        const activeRooms = response.data.data || [];
        setRooms(activeRooms);
        
        // Auto-select first room
        if (activeRooms.length > 0 && !selectedRoomId) {
          setSelectedRoomId(activeRooms[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      // Mock data for demo
      const mockRooms = [
        { _id: 'room1', name: 'Phòng khám 1' },
        { _id: 'room2', name: 'Phòng khám 2' },
        { _id: 'room3', name: 'Phòng khám 3' }
      ];
      setRooms(mockRooms);
      if (!selectedRoomId) {
        setSelectedRoomId(mockRooms[0]._id);
      }
    }
  };

  const fetchQueueStatus = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/record/queue/status`,
        {
          params: {
            date: selectedDate,
            roomId: selectedRoomId
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 3000 // 3 second timeout
        }
      );

      if (response.data.success) {
        setQueueStatus(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching queue status:', error);
      // Mock data for demo
      const mockQueueStatus = {
        current: {
          _id: 'record1',
          queueNumber: '001',
          patientInfo: {
            name: 'Nguyễn Văn A',
            phone: '0901234567'
          },
          status: 'in_progress',
          startedAt: new Date().toISOString()
        },
        next: {
          _id: 'record2',
          queueNumber: '002',
          patientInfo: {
            name: 'Trần Thị B',
            phone: '0912345678'
          },
          status: 'pending'
        },
        upcoming: [
          {
            _id: 'record3',
            queueNumber: '003',
            patientInfo: {
              name: 'Lê Văn C',
              phone: '0923456789'
            },
            status: 'pending'
          },
          {
            _id: 'record4',
            queueNumber: '004',
            patientInfo: {
              name: 'Phạm Thị D',
              phone: '0934567890'
            },
            status: 'pending'
          },
          {
            _id: 'record5',
            queueNumber: '005',
            patientInfo: {
              name: 'Hoàng Văn E',
              phone: '0945678901'
            },
            status: 'pending'
          }
        ]
      };
      setQueueStatus(mockQueueStatus);
      setLoading(false);
    }
  };

  const handleCallRecord = async (recordId) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/record/${recordId}/call`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Đã gọi bệnh nhân thành công');
        fetchQueueStatus();
      }
    } catch (error) {
      console.error('Error calling record:', error);
      toast.info('Demo mode: Tính năng này cần kết nối backend');
    }
  };

  const handleCompleteRecord = async (recordId) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/record/${recordId}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        const { record, paymentData } = response.data.data;
        
        toast.success('Đã hoàn thành khám bệnh');
        
        // Show payment modal
        setCompletedRecord(record);
        setPaymentData(paymentData);
        setShowPaymentModal(true);
        
        fetchQueueStatus();
      }
    } catch (error) {
      console.error('Error completing record:', error);
      toast.info('Demo mode: Tính năng này cần kết nối backend');
    }
  };

  const handleCancelRecord = async () => {
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy');
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/record/${cancelRecordId}/cancel`,
        { reason: cancelReason },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Đã hủy hồ sơ thành công');
        setShowCancelModal(false);
        setCancelRecordId(null);
        setCancelReason('');
        fetchQueueStatus();
      }
    } catch (error) {
      console.error('Error cancelling record:', error);
      toast.info('Demo mode: Tính năng này cần kết nối backend');
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
      in_progress: { text: 'Đang khám', variant: 'primary' },
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
          <Row className="mb-4">
            <Col>
              <Card className="border-primary">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">
                    <FaClock className="me-2" />
                    Đang Khám
                  </h5>
                </Card.Header>
                <Card.Body>
                  {queueStatus.current ? (
                    <div>
                      <Row>
                        <Col md={6}>
                          <h3 className="text-primary">
                            STT: {queueStatus.current.queueNumber}
                          </h3>
                          <p className="mb-1">
                            <strong>Bệnh nhân:</strong>{' '}
                            {queueStatus.current.patientInfo?.name}
                          </p>
                          <p className="mb-1">
                            <strong>Điện thoại:</strong>{' '}
                            {queueStatus.current.patientInfo?.phone}
                          </p>
                          <p className="mb-1">
                            <strong>Bắt đầu:</strong>{' '}
                            {formatTime(queueStatus.current.startedAt)}
                          </p>
                        </Col>
                        <Col md={6} className="text-end">
                          <Button
                            variant="success"
                            size="lg"
                            onClick={() => handleCompleteRecord(queueStatus.current._id)}
                          >
                            <FaCheckCircle className="me-2" />
                            Hoàn Thành
                          </Button>
                          <Button
                            variant="danger"
                            size="lg"
                            className="ms-2"
                            onClick={() => openCancelModal(queueStatus.current._id)}
                          >
                            <FaTimesCircle className="me-2" />
                            Hủy
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  ) : (
                    <Alert variant="secondary" className="mb-0">
                      Không có bệnh nhân đang khám
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Next Record */}
          <Row className="mb-4">
            <Col>
              <Card className="border-warning">
                <Card.Header className="bg-warning">
                  <h5 className="mb-0">Bệnh Nhân Tiếp Theo</h5>
                </Card.Header>
                <Card.Body>
                  {queueStatus.next ? (
                    <div>
                      <Row>
                        <Col md={6}>
                          <h4 className="text-warning">
                            STT: {queueStatus.next.queueNumber || 'Chưa gán'}
                          </h4>
                          <p className="mb-1">
                            <strong>Bệnh nhân:</strong>{' '}
                            {queueStatus.next.patientInfo?.name}
                          </p>
                          <p className="mb-1">
                            <strong>Điện thoại:</strong>{' '}
                            {queueStatus.next.patientInfo?.phone}
                          </p>
                          <p className="mb-1">
                            <strong>Trạng thái:</strong>{' '}
                            {getStatusBadge(queueStatus.next.status)}
                          </p>
                        </Col>
                        <Col md={6} className="text-end">
                          <Button
                            variant="primary"
                            size="lg"
                            onClick={() => handleCallRecord(queueStatus.next._id)}
                            disabled={queueStatus.current !== null}
                          >
                            <FaPhone className="me-2" />
                            Gọi Bệnh Nhân
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="lg"
                            className="ms-2"
                            onClick={() => openCancelModal(queueStatus.next._id)}
                          >
                            Hủy
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  ) : (
                    <Alert variant="secondary" className="mb-0">
                      Không có bệnh nhân trong hàng đợi
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Upcoming Records */}
          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Hàng Đợi ({queueStatus.upcoming?.length || 0})</h5>
                </Card.Header>
                <Card.Body>
                  {queueStatus.upcoming && queueStatus.upcoming.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>STT</th>
                            <th>Bệnh Nhân</th>
                            <th>Điện Thoại</th>
                            <th>Trạng Thái</th>
                            <th>Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {queueStatus.upcoming.map((record, index) => (
                            <tr key={record._id}>
                              <td>
                                <strong>
                                  {record.queueNumber || `#${index + 1}`}
                                </strong>
                              </td>
                              <td>{record.patientInfo?.name}</td>
                              <td>{record.patientInfo?.phone}</td>
                              <td>{getStatusBadge(record.status)}</td>
                              <td>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => openCancelModal(record._id)}
                                >
                                  Hủy
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Alert variant="secondary" className="mb-0">
                      Không có bệnh nhân trong hàng đợi
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

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
      {showPaymentModal && (
        <PaymentConfirmModal
          show={showPaymentModal}
          onHide={() => {
            setShowPaymentModal(false);
            setCompletedRecord(null);
            setPaymentData(null);
          }}
          record={completedRecord}
          paymentData={paymentData}
          onPaymentConfirmed={() => {
            setShowPaymentModal(false);
            fetchQueueStatus();
          }}
        />
      )}
    </Container>
  );
};

export default QueueDashboard;

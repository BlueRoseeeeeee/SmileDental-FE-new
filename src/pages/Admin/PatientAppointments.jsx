import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Typography,
  Input,
  Space,
  Tag,
  Button,
  Row,
  Col,
  Select,
  DatePicker,
  Drawer,
  Descriptions,
  message,
  Badge,
  Spin,
  Empty,
  Modal,
  Form
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  MedicineBoxOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { io } from 'socket.io-client';
import appointmentService from '../../services/appointmentService';
import userService from '../../services/userService';
import './PatientAppointments.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;
const { confirm } = Modal;

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [bookingChannelFilter, setBookingChannelFilter] = useState('all'); // 'all', 'online', 'offline'
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [rooms, setRooms] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [socket, setSocket] = useState(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    fetchAllAppointments();
    
    // Setup WebSocket connection
    const RECORD_SERVICE_URL = import.meta.env.VITE_RECORD_SERVICE_URL || 'http://localhost:3010';
    const newSocket = io(RECORD_SERVICE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('✅ [PatientAppointments] WebSocket connected');
    });

    newSocket.on('appointment_updated', (data) => {
      console.log('🔄 [PatientAppointments] Appointment updated event:', data);
      // Reload appointments when update received
      fetchAllAppointments();
    });

    newSocket.on('record_updated', (data) => {
      console.log('🔄 [PatientAppointments] Record updated event:', data);
      // Reload appointments when record changes
      fetchAllAppointments();
    });

    newSocket.on('disconnect', () => {
      console.log('❌ [PatientAppointments] WebSocket disconnected');
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [statusFilter, dateRange, bookingChannelFilter, serviceTypeFilter, roomFilter, searchText, appointments]);

  const fetchAllAppointments = async () => {
    try {
      console.log('🔄 [Admin] Fetching all appointments...');
      setLoading(true);
      const response = await appointmentService.getAllAppointments();
      
      console.log('📥 [Admin] Appointments response:', response);
      
      if (response.success) {
        // Backend trả về { appointments: [], total, page, limit, totalPages }
        const appointmentData = response.data?.appointments || [];
        console.log('✅ [Admin] Appointments loaded:', appointmentData.length, 'items');
        console.log('📊 [Admin] Pagination info:', {
          total: response.data?.total,
          page: response.data?.page,
          totalPages: response.data?.totalPages
        });
        setAppointments(appointmentData);
        setFilteredAppointments(appointmentData);
        const uniqueRooms = [...new Set(appointmentData.map(apt => apt.roomName).filter(Boolean))];
        setRooms(uniqueRooms.map(name => ({ name })));
      } else {
        console.warn('⚠️ [Admin] Response not successful:', response);
        setAppointments([]);
        setFilteredAppointments([]);
      }
    } catch (error) {
      console.error('❌ [Admin] Error fetching appointments:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      message.error('Không thể tải danh sách lịch hẹn');
      setAppointments([]);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    
    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(apt => {
        const aptDate = dayjs(apt.appointmentDate);
        return aptDate.isSameOrAfter(dateRange[0], 'day') && aptDate.isSameOrBefore(dateRange[1], 'day');
      });
    }
    
    // Filter by booking channel (online/offline)
    if (bookingChannelFilter !== 'all') {
      if (bookingChannelFilter === 'online') {
        // Online: bookedByRole === 'patient'
        filtered = filtered.filter(apt => apt.bookedByRole === 'patient');
      } else if (bookingChannelFilter === 'offline') {
        // Offline: bookedByRole !== 'patient' (admin, manager, receptionist, dentist, etc.)
        filtered = filtered.filter(apt => apt.bookedByRole && apt.bookedByRole !== 'patient');
      }
    }
    if (serviceTypeFilter !== 'all') {
      filtered = filtered.filter(apt => apt.serviceType === serviceTypeFilter);
    }
    if (roomFilter !== 'all') {
      filtered = filtered.filter(apt => apt.roomName === roomFilter);
    }
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.patientInfo?.name?.toLowerCase().includes(search) ||
        apt.patientInfo?.phone?.includes(search) ||
        apt.appointmentCode?.toLowerCase().includes(search) ||
        apt.dentistName?.toLowerCase().includes(search) ||
        apt.serviceName?.toLowerCase().includes(search)
      );
    }
    filtered.sort((a, b) => dayjs(b.appointmentDate).diff(dayjs(a.appointmentDate)));
    setFilteredAppointments(filtered);
  };

  const handleResetFilters = () => {
    setStatusFilter('all');
    setStatusFilter('all');
    setDateRange(null);
    setBookingChannelFilter('all');
    setServiceTypeFilter('all');
    setRoomFilter('all');
    setSearchText('');
  };

  const showAppointmentDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setDrawerVisible(true);
  };

  const handleCheckIn = async (appointmentId) => {
    try {
      await appointmentService.checkInAppointment(appointmentId);
      message.success('Check-in thành công');
      fetchAllAppointments(); // Reload data
    } catch (error) {
      console.error('Error checking in appointment:', error);
      message.error(error.response?.data?.message || 'Không thể check-in');
    }
  };

  const handleComplete = async (appointmentId) => {
    try {
      await appointmentService.completeAppointment(appointmentId);
      message.success('Hoàn thành lịch hẹn thành công');
      fetchAllAppointments(); // Reload data
    } catch (error) {
      console.error('Error completing appointment:', error);
      message.error(error.response?.data?.message || 'Không thể hoàn thành lịch hẹn');
    }
  };

  const handleCancelAppointment = (appointment) => {
    setAppointmentToCancel(appointment);
    setCancelReason('');
    setCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    try {
      setCancelling(true);
      
      // Use patient's reason from notes/cancellationRequestReason
      const finalReason = appointmentToCancel.notes || appointmentToCancel.cancellationRequestReason || 'Không có lý do';
      
      console.log('🔍 [Cancel] Appointment ID:', appointmentToCancel._id);
      console.log('🔍 [Cancel] Reason:', finalReason);
      console.log('🔍 [Cancel] Token:', localStorage.getItem('accessToken') ? 'Exists' : 'Missing');
      
      await appointmentService.adminCancelAppointment(appointmentToCancel._id, finalReason);
      message.success('Đã hủy lịch hẹn thành công');
      setCancelModalVisible(false);
      setAppointmentToCancel(null);
      setCancelReason('');
      fetchAllAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      console.error('Error response:', error.response);
      message.error(error.response?.data?.message || 'Không thể hủy lịch hẹn');
    } finally {
      setCancelling(false);
    }
  };

  const handleRejectCancellation = async () => {
    try {
      setRejecting(true);
      
      console.log('🔍 [Reject] Appointment ID:', appointmentToCancel._id);
      console.log('🔍 [Reject] Token:', localStorage.getItem('accessToken') ? 'Exists' : 'Missing');
      
      await appointmentService.rejectCancellation(appointmentToCancel._id);
      message.success('Đã từ chối yêu cầu hủy lịch, lịch hẹn về lại trạng thái "Đã xác nhận"');
      setCancelModalVisible(false);
      setAppointmentToCancel(null);
      setCancelReason('');
      fetchAllAppointments();
    } catch (error) {
      console.error('Error rejecting cancellation:', error);
      console.error('Error response:', error.response);
      message.error(error.response?.data?.message || 'Không thể từ chối yêu cầu hủy lịch');
    } finally {
      setRejecting(false);
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      'confirmed': { color: 'blue', text: 'Đã xác nhận', icon: <CheckCircleOutlined /> },
      'pending-cancellation': { color: 'orange', text: 'Đang yêu cầu hủy', icon: <ExclamationCircleOutlined /> },
      'checked-in': { color: 'cyan', text: 'Đã check-in', icon: <CheckCircleOutlined /> },
      'in-progress': { color: 'processing', text: 'Đang khám', icon: <ClockCircleOutlined /> },
      'completed': { color: 'success', text: 'Hoàn thành', icon: <CheckCircleOutlined /> },
      'cancelled': { color: 'error', text: 'Đã hủy', icon: <CloseCircleOutlined /> },
      'no-show': { color: 'default', text: 'Không đến', icon: <CloseCircleOutlined /> }
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const getServiceTypeTag = (type) => {
    return type === 'exam' ? <Tag color="green">Khám</Tag> : <Tag color="orange">Điều trị</Tag>;
  };

  const columns = [
    {
      title: 'Mã lịch hẹn',
      dataIndex: 'appointmentCode',
      key: 'appointmentCode',
      width: 130,
      render: (code) => <Text strong style={{ fontSize: 12 }}>{code}</Text>
    },
    {
      title: 'Bệnh nhân',
      key: 'patient',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 12 }}>{record.patientInfo?.name}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.patientInfo?.phone}
          </Text>
        </Space>
      )
    },
    {
      title: 'Ngày & Giờ',
      key: 'datetime',
      width: 130,
      sorter: (a, b) => dayjs(a.appointmentDate).unix() - dayjs(b.appointmentDate).unix(),
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>{dayjs(record.appointmentDate).format('DD/MM/YYYY')}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.startTime} - {record.endTime}
          </Text>
        </Space>
      )
    },
    {
      title: 'Nha sĩ',
      dataIndex: 'dentistName',
      key: 'dentistName',
      width: 120,
      render: (name) => <Text style={{ fontSize: 12 }}>{name}</Text>
    },
    {
      title: 'Dịch vụ',
      key: 'service',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>{record.serviceName}</Text>
          {record.serviceAddOnName && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              + {record.serviceAddOnName}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => showAppointmentDetails(record)}
            size="small"
            block
            style={{ padding: '0 4px', height: 24 }}
          >
            Chi tiết
          </Button>
          {record.status === 'confirmed' && (
            <Button 
              type="primary" 
              icon={<CheckCircleOutlined />} 
              onClick={() => handleCheckIn(record._id)}
              size="small"
              block
              style={{ height: 24, fontSize: 11 }}
            >
              Check-in
            </Button>
          )}
          {/* {record.status === 'in-progress' && (
            <Button 
              type="primary" 
              icon={<CheckCircleOutlined />} 
              onClick={() => handleComplete(record._id)}
              size="small"
              block
              style={{ height: 24, fontSize: 11, backgroundColor: '#52c41a' }}
            >
              Hoàn thành
            </Button>
          )} */}
          {record.status !== 'completed' && record.status !== 'cancelled' && (
            <Button 
              danger
              icon={<StopOutlined />} 
              onClick={() => handleCancelAppointment(record)}
              size="small"
              block
              style={{ height: 24, fontSize: 11 }}
            >
              Hủy lịch
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="patient-appointments-container" style={{ padding: '24px' }}>
      <Card>
        <Title level={3}>
          <CalendarOutlined /> Quản Lý Lịch Khám Bệnh Nhân
        </Title>
        
        <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Input
                placeholder="Tìm kiếm (tên, SĐT, mã lịch hẹn, nha sĩ, dịch vụ...)"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={4}>
              <Select style={{ width: '100%' }} value={statusFilter} onChange={setStatusFilter}>
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="confirmed">Đã xác nhận</Option>
                <Option value="pending-cancellation">Đang yêu cầu hủy</Option>
                <Option value="checked-in">Đã check-in</Option>
                <Option value="in-progress">Đang khám</Option>
                <Option value="completed">Hoàn thành</Option>
                <Option value="cancelled">Đã hủy</Option>
                <Option value="no-show">Không đến</Option>
              </Select>
            </Col>
            <Col span={8}>
              <RangePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                value={dateRange}
                onChange={setDateRange}
                placeholder={['Từ ngày', 'Đến ngày']}
                allowClear
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Select style={{ width: '100%' }} value={bookingChannelFilter} onChange={setBookingChannelFilter}>
                <Option value="all">Tất cả kênh đặt</Option>
                <Option value="online">Đặt Online</Option>
                <Option value="offline">Đặt Offline</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select style={{ width: '100%' }} value={serviceTypeFilter} onChange={setServiceTypeFilter}>
                <Option value="all">Tất cả loại</Option>
                <Option value="exam">Khám</Option>
                <Option value="treatment">Điều trị</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select style={{ width: '100%' }} value={roomFilter} onChange={setRoomFilter}>
                <Option value="all">Tất cả phòng</Option>
                {rooms.map((room, index) => (
                  <Option key={index} value={room.name}>{room.name}</Option>
                ))}
              </Select>
            </Col>
            <Col span={10} style={{ textAlign: 'right' }}>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={fetchAllAppointments}>Làm mới</Button>
                <Button icon={<FilterOutlined />} onClick={handleResetFilters}>Xóa bộ lọc</Button>
              </Space>
            </Col>
          </Row>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredAppointments}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1000, y: 600 }}
          pagination={{
            total: filteredAppointments.length,
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} lịch hẹn`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          locale={{
            emptyText: <Empty description="Không có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          }}
        />
      </Card>

      <Drawer
        title="Chi Tiết Lịch Hẹn"
        placement="right"
        width={600}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedAppointment && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Mã lịch hẹn">
              <Text strong>{selectedAppointment.appointmentCode}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {getStatusTag(selectedAppointment.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Bệnh nhân">
              <Space direction="vertical" size={0}>
                <Text strong>{selectedAppointment.patientInfo?.name}</Text>
                <Text><PhoneOutlined /> {selectedAppointment.patientInfo?.phone}</Text>
                {selectedAppointment.patientInfo?.email && (
                  <Text><MailOutlined /> {selectedAppointment.patientInfo?.email}</Text>
                )}
                <Text>Năm sinh: {selectedAppointment.patientInfo?.birthYear}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày khám">
              {dayjs(selectedAppointment.appointmentDate).format('DD/MM/YYYY (dddd)')}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ khám">
              {selectedAppointment.startTime} - {selectedAppointment.endTime}
            </Descriptions.Item>
            <Descriptions.Item label="Nha sĩ">
              {selectedAppointment.dentistName}
            </Descriptions.Item>
            <Descriptions.Item label="Phòng khám">
              {selectedAppointment.roomName}
            </Descriptions.Item>
            <Descriptions.Item label="Dịch vụ">
              <Space direction="vertical">
                <Space>
                  {getServiceTypeTag(selectedAppointment.serviceType)}
                  <Text strong>{selectedAppointment.serviceName}</Text>
                </Space>
                {selectedAppointment.serviceAddOnName && (
                  <Text>Dịch vụ bổ sung: {selectedAppointment.serviceAddOnName}</Text>
                )}
                <Text type="secondary">Thời gian: {selectedAppointment.serviceDuration} phút</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedAppointment.totalAmount)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Đặt lịch lúc">
              {dayjs(selectedAppointment.bookedAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            {selectedAppointment.checkedInAt && (
              <Descriptions.Item label="Check-in lúc">
                {dayjs(selectedAppointment.checkedInAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
            )}
            {selectedAppointment.completedAt && (
              <Descriptions.Item label="Hoàn thành lúc">
                {dayjs(selectedAppointment.completedAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
            )}
            {selectedAppointment.cancelledAt && (
              <Descriptions.Item label="Hủy lúc">
                <Space direction="vertical" size={0}>
                  <Text>{dayjs(selectedAppointment.cancelledAt).format('DD/MM/YYYY HH:mm')}</Text>
                  {selectedAppointment.cancellationReason && (
                    <Text type="secondary">Lý do: {selectedAppointment.cancellationReason}</Text>
                  )}
                </Space>
              </Descriptions.Item>
            )}
            {selectedAppointment.notes && (
              <Descriptions.Item label="Ghi chú">
                {selectedAppointment.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Drawer>

      {/* Cancel Appointment Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>{appointmentToCancel?.status === 'pending-cancellation' ? 'Xử lý yêu cầu hủy lịch' : 'Xác nhận hủy lịch hẹn'}</span>
          </Space>
        }
        open={cancelModalVisible}
        onCancel={() => {
          if (!cancelling && !rejecting) {
            setCancelModalVisible(false);
            setAppointmentToCancel(null);
            setCancelReason('');
          }
        }}
        footer={
          appointmentToCancel?.status === 'pending-cancellation' ? [
            <Button 
              key="close"
              onClick={() => {
                setCancelModalVisible(false);
                setAppointmentToCancel(null);
                setCancelReason('');
              }}
              disabled={cancelling || rejecting}
            >
              Đóng
            </Button>,
            <Button 
              key="reject"
              type="primary"
              onClick={handleRejectCancellation}
              loading={rejecting}
              disabled={cancelling}
            >
              Từ chối hủy
            </Button>,
            <Button 
              key="approve"
              danger
              type="primary"
              onClick={handleConfirmCancel}
              loading={cancelling}
              disabled={rejecting}
            >
              Chấp nhận hủy
            </Button>
          ] : [
            <Button 
              key="close"
              onClick={() => {
                setCancelModalVisible(false);
                setAppointmentToCancel(null);
                setCancelReason('');
              }}
              disabled={cancelling}
            >
              Đóng
            </Button>,
            <Button 
              key="confirm"
              danger
              type="primary"
              onClick={handleConfirmCancel}
              loading={cancelling}
            >
              Xác nhận hủy
            </Button>
          ]
        }
        width={600}
        closable={!cancelling && !rejecting}
        maskClosable={false}
      >
        {appointmentToCancel && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Appointment Info */}
            <div>
              <p style={{ marginBottom: 8 }}>Bạn có chắc chắn muốn hủy lịch hẹn:</p>
              <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                <p style={{ margin: '4px 0' }}><strong>Mã lịch hẹn:</strong> {appointmentToCancel.appointmentCode}</p>
                <p style={{ margin: '4px 0' }}><strong>Bệnh nhân:</strong> {appointmentToCancel.patientInfo?.name}</p>
                <p style={{ margin: '4px 0' }}><strong>Email:</strong> {appointmentToCancel.patientInfo?.email || appointmentToCancel.patientId?.email || 'Không có'}</p>
                <p style={{ margin: '4px 0' }}><strong>Số điện thoại:</strong> {appointmentToCancel.patientInfo?.phone || appointmentToCancel.patientId?.phoneNumber || 'Không có'}</p>
                <p style={{ margin: '4px 0' }}><strong>Ngày khám:</strong> {dayjs(appointmentToCancel.appointmentDate).format('DD/MM/YYYY')}</p>
                <p style={{ margin: '4px 0' }}><strong>Giờ:</strong> {appointmentToCancel.startTime} - {appointmentToCancel.endTime}</p>
                <p style={{ margin: '4px 0' }}><strong>Dịch vụ:</strong> {appointmentToCancel.serviceName}</p>
                <p style={{ margin: '4px 0' }}><strong>Nha sĩ:</strong> {appointmentToCancel.dentistName}</p>
              </div>
            </div>

            {/* Patient's Cancellation Reason (Read-only) */}
            {appointmentToCancel.status === 'pending-cancellation' && (appointmentToCancel.notes || appointmentToCancel.cancellationRequestReason) && (
              <div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Lý do hủy của bệnh nhân:</strong>
                </div>
                <div style={{ 
                  padding: '12px', 
                  background: '#f0f5ff', 
                  border: '1px solid #adc6ff',
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {appointmentToCancel.notes || appointmentToCancel.cancellationRequestReason}
                </div>
              </div>
            )}

            {/* Warning */}
            <div style={{ 
              padding: '12px', 
              background: appointmentToCancel.status === 'pending-cancellation' ? '#e6f7ff' : '#fff7e6', 
              border: appointmentToCancel.status === 'pending-cancellation' ? '1px solid #91d5ff' : '1px solid #ffd591',
              borderRadius: '4px',
              color: appointmentToCancel.status === 'pending-cancellation' ? '#0050b3' : '#d46b08'
            }}>
              <ExclamationCircleOutlined /> <strong>Lưu ý:</strong> {
                appointmentToCancel.status === 'pending-cancellation' 
                  ? 'Bạn có thể "Chấp nhận hủy" để hủy lịch hẹn này, hoặc "Từ chối hủy" để giữ lại lịch hẹn với trạng thái "Đã xác nhận".'
                  : 'Hành động này sẽ hủy lịch hẹn và gửi email thông báo đến bệnh nhân.'
              }
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default PatientAppointments;
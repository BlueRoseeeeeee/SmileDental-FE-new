/**
 * Staff Schedule Page
 * Hiển thị lịch khám của Dentist/Nurse theo ngày
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Typography,
  Space,
  Tag,
  Button,
  Row,
  Col,
  DatePicker,
  Select,
  Empty,
  Spin,
  message
} from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { io } from 'socket.io-client';
import appointmentService from '../../services/appointmentService';
import userService from '../../services/userService';

const { Title, Text } = Typography;
const { Option } = Select;

const StaffSchedule = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    
    // If user is dentist or nurse, auto-select themselves
    const userRoles = user.roles || [user.role]; // Support both roles array and legacy role
    if (userRoles.includes('dentist') || userRoles.includes('nurse')) {
      setSelectedStaff(user._id);
    }
    
    fetchStaffList();
    setupWebSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      fetchSchedule();
    }
  }, [selectedStaff, selectedDate]);

  const setupWebSocket = () => {
    const RECORD_SERVICE_URL = import.meta.env.VITE_RECORD_SERVICE_URL || 'http://localhost:3010';
    const newSocket = io(RECORD_SERVICE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true
    });

    newSocket.on('connect', () => {
      console.log('✅ [StaffSchedule] WebSocket connected');
    });

    newSocket.on('appointment_updated', () => {
      console.log('🔄 [StaffSchedule] Appointment updated, reloading...');
      if (selectedStaff) {
        fetchSchedule();
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ [StaffSchedule] WebSocket disconnected');
    });

    setSocket(newSocket);
  };

  const fetchStaffList = async () => {
    try {
      const response = await userService.getAllStaff(1, 1000);
      if (response.success && response.data) {
        const staff = (response.data.users || response.data)?.filter(u => {
          const roles = u.roles || [u.role]; // Support both roles array and legacy role
          return roles.includes('dentist') || roles.includes('nurse');
        }) || [];
        setStaffList(staff);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      message.error('Không thể tải danh sách nhân viên');
    }
  };

  const fetchSchedule = async () => {
    if (!selectedStaff) return;

    try {
      setLoading(true);
      const dateStr = selectedDate.format('YYYY-MM-DD');
      console.log(`📅 [StaffSchedule] Fetching schedule for staff ${selectedStaff} on ${dateStr}`);
      
      const response = await appointmentService.getAppointmentsByStaff(selectedStaff, dateStr);
      
      console.log('📥 [StaffSchedule] Schedule response:', response);
      
      if (response.success) {
        const appointmentData = response.data?.appointments || response.data || [];
        console.log('✅ [StaffSchedule] Loaded:', appointmentData.length, 'appointments');
        setAppointments(appointmentData);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      message.error('Không thể tải lịch khám');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      'confirmed': { color: 'blue', text: 'Đã xác nhận' },
      'checked-in': { color: 'cyan', text: 'Đã check-in' },
      'in-progress': { color: 'processing', text: 'Đang khám' },
      'completed': { color: 'success', text: 'Hoàn thành' },
      'cancelled': { color: 'error', text: 'Đã hủy' },
      'no-show': { color: 'default', text: 'Không đến' }
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'Giờ khám',
      key: 'time',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13 }}>
            <ClockCircleOutlined /> {record.startTime}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            đến {record.endTime}
          </Text>
        </Space>
      )
    },
    {
      title: 'Bệnh nhân',
      key: 'patient',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13 }}>
            <UserOutlined /> {record.patientInfo?.name}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.patientInfo?.phone}
          </Text>
        </Space>
      )
    },
    {
      title: 'Dịch vụ',
      key: 'service',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            {record.serviceType === 'exam' ? (
              <Tag color="green">Khám</Tag>
            ) : (
              <Tag color="orange">Điều trị</Tag>
            )}
            <Text style={{ fontSize: 12 }}>{record.serviceName}</Text>
          </Space>
          {record.serviceAddOnName && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              + {record.serviceAddOnName}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Phòng',
      dataIndex: 'roomName',
      key: 'room',
      width: 100,
      render: (roomName) => (
        <Text style={{ fontSize: 12 }}>
          <HomeOutlined /> {roomName || 'Chưa xác định'}
        </Text>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      render: (notes) => (
        <Text type="secondary" style={{ fontSize: 11 }} ellipsis>
          {notes || '-'}
        </Text>
      )
    }
  ];

  const selectedStaffInfo = staffList.find(s => s._id === selectedStaff);

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={3}>
          <CalendarOutlined /> Lịch Khám Của Nhân Viên
        </Title>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Text strong>Chọn nhân viên:</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              placeholder="Chọn nha sĩ hoặc y tá"
              value={selectedStaff}
              onChange={setSelectedStaff}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {staffList.map(staff => (
                <Option key={staff._id} value={staff._id}>
                  {staff.role === 'dentist' ? '🦷' : '🩺'} {staff.fullName} ({staff.role === 'dentist' ? 'Nha sĩ' : 'Y tá'})
                </Option>
              ))}
            </Select>
          </Col>

          <Col span={6}>
            <Text strong>Chọn ngày:</Text>
            <DatePicker
              style={{ width: '100%', marginTop: 8 }}
              value={selectedDate}
              onChange={(date) => setSelectedDate(date || dayjs())}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
            />
          </Col>

          <Col span={6}>
            <Text strong>&nbsp;</Text>
            <br />
            <Space>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={fetchSchedule}
                disabled={!selectedStaff}
              >
                Tải lại
              </Button>
              <Button onClick={() => setSelectedDate(dayjs())}>
                Hôm nay
              </Button>
            </Space>
          </Col>
        </Row>

        {selectedStaffInfo && (
          <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f5ff' }}>
            <Space>
              <Text strong style={{ fontSize: 16 }}>
                {selectedStaffInfo.role === 'dentist' ? '🦷 Nha sĩ:' : '🩺 Y tá:'}
              </Text>
              <Text style={{ fontSize: 16 }}>{selectedStaffInfo.fullName}</Text>
              <Text type="secondary">|</Text>
              <Text type="secondary">Ngày: {selectedDate.format('DD/MM/YYYY (dddd)')}</Text>
              <Text type="secondary">|</Text>
              <Text strong style={{ color: '#1890ff' }}>
                {appointments.length} lịch hẹn
              </Text>
            </Space>
          </Card>
        )}

        <Spin spinning={loading}>
          <Table
            dataSource={appointments}
            columns={columns}
            rowKey="_id"
            loading={loading}
            scroll={{ x: 800 }}
            pagination={{
              pageSize: 20,
              showTotal: (total) => `Tổng ${total} lịch hẹn`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50']
            }}
            locale={{
              emptyText: selectedStaff ? (
                <Empty 
                  description="Không có lịch khám trong ngày này" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Empty 
                  description="Vui lòng chọn nhân viên để xem lịch khám" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )
            }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default StaffSchedule;

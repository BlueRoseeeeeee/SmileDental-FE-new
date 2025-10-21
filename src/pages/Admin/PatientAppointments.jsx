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
  Avatar,
  Badge,
  Spin,
  Empty
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import appointmentService from '../../services/appointmentService';
import authService from '../../services/authService';
import './PatientAppointments.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const PatientAppointments = () => {
  // States for patients list
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [searchPatient, setSearchPatient] = useState('');

  // States for selected patient's appointments
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [searchAppointment, setSearchAppointment] = useState('');

  // Drawer states
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchPatient, patients]);

  useEffect(() => {
    filterAppointments();
  }, [statusFilter, dateRange, searchAppointment, appointments]);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const response = await authService.getAllUsers();
      
      if (response.success) {
        // Filter only patients
        const patientList = response.data.users.filter(u => u.role === 'patient');
        setPatients(patientList);
        setFilteredPatients(patientList);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      message.error('Không thể tải danh sách bệnh nhân');
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchAppointments = async (patientId) => {
    try {
      setLoadingAppointments(true);
      const response = await appointmentService.getPatientAppointments(patientId);
      
      if (response.success) {
        setAppointments(response.data.appointments || []);
        setFilteredAppointments(response.data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      message.error('Không thể tải lịch khám của bệnh nhân');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const filterPatients = () => {
    if (!searchPatient.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const searchLower = searchPatient.toLowerCase();
    const filtered = patients.filter(patient => 
      patient.fullName?.toLowerCase().includes(searchLower) ||
      patient.email?.toLowerCase().includes(searchLower) ||
      patient.phone?.includes(searchPatient)
    );
    setFilteredPatients(filtered);
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      filtered = filtered.filter(apt => {
        const aptDate = dayjs(apt.appointmentDate);
        return aptDate.isAfter(startDate) && aptDate.isBefore(endDate);
      });
    }

    // Filter by search
    if (searchAppointment.trim()) {
      const searchLower = searchAppointment.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.appointmentCode?.toLowerCase().includes(searchLower) ||
        apt.serviceName?.toLowerCase().includes(searchLower) ||
        apt.dentistName?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredAppointments(filtered);
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setAppointments([]);
    setFilteredAppointments([]);
    setStatusFilter('all');
    setDateRange(null);
    setSearchAppointment('');
    fetchAppointments(patient._id);
  };

  const handleViewDetail = (appointment) => {
    setSelectedAppointment(appointment);
    setDrawerVisible(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'gold',
      confirmed: 'blue',
      in_progress: 'cyan',
      completed: 'green',
      cancelled: 'red',
      no_show: 'gray'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      in_progress: 'Đang khám',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      no_show: 'Không đến'
    };
    return texts[status] || status;
  };

  const patientColumns = [
    {
      title: 'Bệnh nhân',
      key: 'patient',
      render: (_, record) => (
        <Space>
          <Avatar 
            icon={<UserOutlined />} 
            {...(record.profilePicture ? { src: record.profilePicture } : {})}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{record.fullName}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.email}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => (
        <Space>
          <PhoneOutlined />
          <Text>{phone || 'Chưa có'}</Text>
        </Space>
      )
    },
    {
      title: 'Ngày sinh',
      dataIndex: 'dateOfBirth',
      key: 'dateOfBirth',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'Chưa có'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Badge 
          status={isActive ? 'success' : 'error'} 
          text={isActive ? 'Hoạt động' : 'Tạm khóa'}
        />
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<EyeOutlined />}
          onClick={() => handleSelectPatient(record)}
        >
          Xem lịch khám
        </Button>
      )
    }
  ];

  const appointmentColumns = [
    {
      title: 'Mã lịch hẹn',
      dataIndex: 'appointmentCode',
      key: 'appointmentCode',
      render: (code) => <Text strong>{code}</Text>
    },
    {
      title: 'Ngày khám',
      dataIndex: 'appointmentDate',
      key: 'appointmentDate',
      render: (date) => (
        <Space>
          <CalendarOutlined />
          <Text>{dayjs(date).format('DD/MM/YYYY')}</Text>
        </Space>
      )
    },
    {
      title: 'Giờ khám',
      key: 'time',
      render: (_, record) => (
        <Space>
          <ClockCircleOutlined />
          <Text>{record.startTime} - {record.endTime}</Text>
        </Space>
      )
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'serviceName',
      key: 'serviceName',
      render: (name, record) => (
        <div>
          <div>{name}</div>
          {record.serviceAddOnName && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.serviceAddOnName}
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'Nha sỹ',
      dataIndex: 'dentistName',
      key: 'dentistName'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          Chi tiết
        </Button>
      )
    }
  ];

  return (
    <div className="patient-appointments-container">
      <Title level={2}>
        <CalendarOutlined /> Quản lý lịch khám bệnh nhân
      </Title>

      <Row gutter={[16, 16]}>
        {/* Left: Patients List */}
        <Col xs={24} lg={10}>
          <Card 
            title="Danh sách bệnh nhân"
            extra={
              <Input
                placeholder="Tìm kiếm bệnh nhân..."
                prefix={<SearchOutlined />}
                value={searchPatient}
                onChange={(e) => setSearchPatient(e.target.value)}
                style={{ width: 250 }}
              />
            }
          >
            <Table
              dataSource={filteredPatients}
              columns={patientColumns}
              rowKey="_id"
              loading={loadingPatients}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Tổng ${total} bệnh nhân`
              }}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>

        {/* Right: Selected Patient's Appointments */}
        <Col xs={24} lg={14}>
          <Card
            title={
              selectedPatient ? (
                <Space>
                  <Avatar 
                    icon={<UserOutlined />} 
                    {...(selectedPatient.profilePicture ? { src: selectedPatient.profilePicture } : {})}
                  />
                  <div>
                    <div>Lịch khám của {selectedPatient.fullName}</div>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>
                      {selectedPatient.email}
                    </Text>
                  </div>
                </Space>
              ) : (
                'Lịch khám'
              )
            }
            extra={
              selectedPatient && (
                <Space>
                  <RangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    format="DD/MM/YYYY"
                    placeholder={['Từ ngày', 'Đến ngày']}
                  />
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: 150 }}
                  >
                    <Option value="all">Tất cả trạng thái</Option>
                    <Option value="pending">Chờ xác nhận</Option>
                    <Option value="confirmed">Đã xác nhận</Option>
                    <Option value="in_progress">Đang khám</Option>
                    <Option value="completed">Hoàn thành</Option>
                    <Option value="cancelled">Đã hủy</Option>
                    <Option value="no_show">Không đến</Option>
                  </Select>
                  <Input
                    placeholder="Tìm kiếm lịch khám..."
                    prefix={<SearchOutlined />}
                    value={searchAppointment}
                    onChange={(e) => setSearchAppointment(e.target.value)}
                    style={{ width: 200 }}
                  />
                </Space>
              )
            }
          >
            {!selectedPatient ? (
              <Empty
                description="Vui lòng chọn một bệnh nhân để xem lịch khám"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : loadingAppointments ? (
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <Spin size="large" />
              </div>
            ) : (
              <Table
                dataSource={filteredAppointments}
                columns={appointmentColumns}
                rowKey="_id"
                pagination={{
                  pageSize: 10,
                  showTotal: (total) => `Tổng ${total} lịch khám`
                }}
                scroll={{ x: 1000 }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Appointment Detail Drawer */}
      <Drawer
        title="Chi tiết lịch khám"
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
              <Tag color={getStatusColor(selectedAppointment.status)}>
                {getStatusText(selectedAppointment.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Thông tin bệnh nhân">
              <div>
                <div><UserOutlined /> {selectedAppointment.patientInfo?.name}</div>
                <div><PhoneOutlined /> {selectedAppointment.patientInfo?.phone}</div>
                {selectedAppointment.patientInfo?.email && (
                  <div><MailOutlined /> {selectedAppointment.patientInfo.email}</div>
                )}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày khám">
              <CalendarOutlined /> {dayjs(selectedAppointment.appointmentDate).format('DD/MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ khám">
              <ClockCircleOutlined /> {selectedAppointment.startTime} - {selectedAppointment.endTime}
            </Descriptions.Item>
            <Descriptions.Item label="Dịch vụ">
              <div>
                <div>{selectedAppointment.serviceName}</div>
                {selectedAppointment.serviceAddOnName && (
                  <Tag color="blue">{selectedAppointment.serviceAddOnName}</Tag>
                )}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Nha sỹ">
              {selectedAppointment.dentistName}
            </Descriptions.Item>
            <Descriptions.Item label="Phòng khám">
              {selectedAppointment.roomName || 'Chưa xác định'}
            </Descriptions.Item>
            <Descriptions.Item label="Giá dịch vụ">
              <Text strong style={{ color: '#1890ff' }}>
                {selectedAppointment.servicePrice?.toLocaleString('vi-VN')} VNĐ
              </Text>
            </Descriptions.Item>
            {selectedAppointment.depositAmount > 0 && (
              <Descriptions.Item label="Tiền cọc">
                <Text type="warning">
                  {selectedAppointment.depositAmount?.toLocaleString('vi-VN')} VNĐ
                </Text>
              </Descriptions.Item>
            )}
            {selectedAppointment.notes && (
              <Descriptions.Item label="Ghi chú">
                {selectedAppointment.notes}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Kênh đặt lịch">
              <Tag color={selectedAppointment.bookingChannel === 'online' ? 'green' : 'orange'}>
                {selectedAppointment.bookingChannel === 'online' ? 'Trực tuyến' : 'Tại phòng khám'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {dayjs(selectedAppointment.createdAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
};

export default PatientAppointments;

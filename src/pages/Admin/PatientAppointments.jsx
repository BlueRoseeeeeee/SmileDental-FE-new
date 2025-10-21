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
  Statistic,
  Divider
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
  CloseCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import appointmentService from '../../services/appointmentService';
import userService from '../../services/userService';
import './PatientAppointments.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [dentistFilter, setDentistFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [dentists, setDentists] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    confirmed: 0,
    checkedIn: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0
  });
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    fetchDentists();
    fetchAllAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
    calculateStatistics();
  }, [statusFilter, dateFilter, dateRange, dentistFilter, serviceTypeFilter, roomFilter, searchText, appointments]);

  const fetchDentists = async () => {
    try {
      const response = await userService.getAllStaff(1, 1000);
      if (response.success) {
        const dentistList = response.data.users?.filter(u => u.role === 'dentist') || [];
        setDentists(dentistList);
      }
    } catch (error) {
      console.error('Error fetching dentists:', error);
    }
  };

  const fetchAllAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAllAppointments();
      
      if (response.success) {
        const appointmentData = response.data || [];
        setAppointments(appointmentData);
        setFilteredAppointments(appointmentData);
        const uniqueRooms = [...new Set(appointmentData.map(apt => apt.roomName).filter(Boolean))];
        setRooms(uniqueRooms.map(name => ({ name })));
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      message.error('Không thể tải danh sách lịch hẹn');
      setAppointments([]);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeFromFilter = (filter) => {
    const now = dayjs();
    switch (filter) {
      case 'today':
        return [now.startOf('day'), now.endOf('day')];
      case 'week':
        return [now.startOf('week'), now.endOf('week')];
      case 'month':
        return [now.startOf('month'), now.endOf('month')];
      case 'custom':
        return dateRange;
      default:
        return null;
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    const range = getDateRangeFromFilter(dateFilter);
    if (range && range[0] && range[1]) {
      filtered = filtered.filter(apt => {
        const aptDate = dayjs(apt.appointmentDate);
        return aptDate.isSameOrAfter(range[0], 'day') && aptDate.isSameOrBefore(range[1], 'day');
      });
    }
    if (dentistFilter !== 'all') {
      filtered = filtered.filter(apt => apt.dentistId === dentistFilter);
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

  const calculateStatistics = () => {
    const stats = {
      total: filteredAppointments.length,
      confirmed: filteredAppointments.filter(a => a.status === 'confirmed').length,
      checkedIn: filteredAppointments.filter(a => a.status === 'checked-in').length,
      inProgress: filteredAppointments.filter(a => a.status === 'in-progress').length,
      completed: filteredAppointments.filter(a => a.status === 'completed').length,
      cancelled: filteredAppointments.filter(a => a.status === 'cancelled').length,
      noShow: filteredAppointments.filter(a => a.status === 'no-show').length
    };
    setStatistics(stats);
  };

  const handleResetFilters = () => {
    setStatusFilter('all');
    setDateFilter('all');
    setDateRange(null);
    setDentistFilter('all');
    setServiceTypeFilter('all');
    setRoomFilter('all');
    setSearchText('');
  };

  const showAppointmentDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setDrawerVisible(true);
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      'confirmed': { color: 'blue', text: 'Đã xác nhận', icon: <CheckCircleOutlined /> },
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
      width: 150,
      fixed: 'left',
      render: (code) => <Text strong>{code}</Text>
    },
    {
      title: 'Bệnh nhân',
      key: 'patient',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.patientInfo?.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <PhoneOutlined /> {record.patientInfo?.phone}
          </Text>
        </Space>
      )
    },
    {
      title: 'Ngày khám',
      dataIndex: 'appointmentDate',
      key: 'appointmentDate',
      width: 120,
      sorter: (a, b) => dayjs(a.appointmentDate).unix() - dayjs(b.appointmentDate).unix(),
      render: (date) => (
        <Space direction="vertical" size={0}>
          <Text>{dayjs(date).format('DD/MM/YYYY')}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(date).format('dddd')}
          </Text>
        </Space>
      )
    },
    {
      title: 'Giờ khám',
      key: 'time',
      width: 100,
      render: (_, record) => (
        <Text>
          <ClockCircleOutlined /> {record.startTime} - {record.endTime}
        </Text>
      )
    },
    {
      title: 'Nha sĩ',
      dataIndex: 'dentistName',
      key: 'dentistName',
      width: 150,
      render: (name) => <Text><UserOutlined /> {name}</Text>
    },
    {
      title: 'Phòng',
      dataIndex: 'roomName',
      key: 'roomName',
      width: 120,
      render: (name) => <Tag icon={<HomeOutlined />} color="purple">{name}</Tag>
    },
    {
      title: 'Dịch vụ',
      key: 'service',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            {getServiceTypeTag(record.serviceType)}
            <Text>{record.serviceName}</Text>
          </Space>
          {record.serviceAddOnName && (
            <Text type="secondary" style={{ fontSize: 12 }}>
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
      width: 130,
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Số tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (amount) => (
        <Text strong style={{ color: '#52c41a' }}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}
        </Text>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => showAppointmentDetails(record)}>
          Chi tiết
        </Button>
      )
    }
  ];

  return (
    <div className="patient-appointments-container" style={{ padding: '24px' }}>
      <Card>
        <Title level={3}>
          <CalendarOutlined /> Quản Lý Lịch Khám Bệnh Nhân
        </Title>
        
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={4}>
            <Card><Statistic title="Tổng số" value={statistics.total} prefix={<CalendarOutlined />} /></Card>
          </Col>
          <Col span={3}>
            <Card><Statistic title="Đã xác nhận" value={statistics.confirmed} valueStyle={{ color: '#1890ff' }} /></Card>
          </Col>
          <Col span={3}>
            <Card><Statistic title="Check-in" value={statistics.checkedIn} valueStyle={{ color: '#13c2c2' }} /></Card>
          </Col>
          <Col span={3}>
            <Card><Statistic title="Đang khám" value={statistics.inProgress} valueStyle={{ color: '#722ed1' }} /></Card>
          </Col>
          <Col span={3}>
            <Card><Statistic title="Hoàn thành" value={statistics.completed} valueStyle={{ color: '#52c41a' }} /></Card>
          </Col>
          <Col span={4}>
            <Card><Statistic title="Đã hủy" value={statistics.cancelled} valueStyle={{ color: '#f5222d' }} /></Card>
          </Col>
          <Col span={4}>
            <Card><Statistic title="Không đến" value={statistics.noShow} valueStyle={{ color: '#8c8c8c' }} /></Card>
          </Col>
        </Row>

        <Divider />

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
                <Option value="checked-in">Đã check-in</Option>
                <Option value="in-progress">Đang khám</Option>
                <Option value="completed">Hoàn thành</Option>
                <Option value="cancelled">Đã hủy</Option>
                <Option value="no-show">Không đến</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                style={{ width: '100%' }}
                value={dateFilter}
                onChange={(value) => { setDateFilter(value); if (value !== 'custom') setDateRange(null); }}
              >
                <Option value="all">Tất cả</Option>
                <Option value="today">Hôm nay</Option>
                <Option value="week">Tuần này</Option>
                <Option value="month">Tháng này</Option>
                <Option value="custom">Tùy chỉnh</Option>
              </Select>
            </Col>
            {dateFilter === 'custom' && (
              <Col span={8}>
                <RangePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder={['Từ ngày', 'Đến ngày']}
                />
              </Col>
            )}
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Select style={{ width: '100%' }} value={dentistFilter} onChange={setDentistFilter} showSearch optionFilterProp="children">
                <Option value="all">Tất cả nha sĩ</Option>
                {dentists.map(dentist => (
                  <Option key={dentist._id} value={dentist._id}>{dentist.fullName}</Option>
                ))}
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
          scroll={{ x: 1500, y: 600 }}
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
    </div>
  );
};

export default PatientAppointments;

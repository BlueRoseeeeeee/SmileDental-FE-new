/**
 * @author: TrungNghia, HoTram
 * Appointment Management - Quản lý lịch hẹn tổng hợp
 * Features: View all appointments, Check-in, Complete, Cancel, Filters
 */
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
  Tabs,
  message,
  Badge,
  Spin,
  Empty,
  Tooltip,
  Drawer,
  Descriptions,
  Modal,
  Form,
  Radio
} from 'antd';
import {
  SearchOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoginOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import appointmentService from '../../services/appointmentService';
import userService from '../../services/userService';
import './AppointmentManagement.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const AppointmentManagement = () => {
  // Data states
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dentists, setDentists] = useState([]);

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Filter states
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [dentistFilter, setDentistFilter] = useState('all');

  // Modal states
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState(''); // 'check-in', 'complete', 'cancel'
  const [actionForm] = Form.useForm();

  // Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchDentists();
    fetchAppointments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [appointments, activeTab, statusFilter, dateRange, searchText, dentistFilter]);

  // Fetch dentists for filter dropdown
  const fetchDentists = async () => {
    try {
      const response = await userService.getAllStaff(1, 1000);
      if (response.success) {
        const dentistList = response.data.users?.filter(u => u.role === 'dentist' && u.isActive) || [];
        setDentists(dentistList);
      }
    } catch (error) {
      console.error('Error fetching dentists:', error);
      setDentists([]);
    }
  };

  // Fetch all appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAllAppointments({
        page: pagination.current,
        limit: pagination.pageSize
      });
      
      if (response.success) {
        setAppointments(response.data.appointments || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0
        }));
      } else {
        setAppointments([]);
        message.warning('Không có dữ liệu lịch hẹn');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      message.error('Không thể tải danh sách lịch hẹn. Vui lòng kiểm tra kết nối.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters based on tab and filter states
  const applyFilters = () => {
    let filtered = [...appointments];

    // Tab filters
    const today = dayjs().startOf('day');
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    const nextWeek = dayjs().add(7, 'days').endOf('day');

    switch (activeTab) {
      case 'today':
        filtered = filtered.filter(apt => {
          const aptDate = dayjs(apt.appointmentDate).startOf('day');
          return aptDate.isSame(today, 'day');
        });
        break;
      case 'upcoming':
        filtered = filtered.filter(apt => {
          const aptDate = dayjs(apt.appointmentDate);
          return aptDate.isAfter(tomorrow) && aptDate.isBefore(nextWeek);
        });
        break;
      case 'completed':
        filtered = filtered.filter(apt => apt.status === 'completed');
        break;
      case 'all':
      default:
        // No additional filter for 'all'
        break;
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      filtered = filtered.filter(apt => {
        const aptDate = dayjs(apt.appointmentDate);
        return aptDate.isAfter(startDate) && aptDate.isBefore(endDate);
      });
    }

    // Dentist filter
    if (dentistFilter !== 'all') {
      filtered = filtered.filter(apt => apt.dentistId === dentistFilter);
    }

    // Search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.appointmentCode?.toLowerCase().includes(searchLower) ||
        apt.patientInfo?.name?.toLowerCase().includes(searchLower) ||
        apt.patientInfo?.phone?.includes(searchText) ||
        apt.serviceName?.toLowerCase().includes(searchLower) ||
        apt.dentistName?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredAppointments(filtered);
  };

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // Handle view detail
  const handleViewDetail = (appointment) => {
    setSelectedAppointment(appointment);
    setDetailDrawerVisible(true);
  };

  // Handle actions (check-in, complete, cancel)
  const handleAction = (appointment, type) => {
    setSelectedAppointment(appointment);
    setActionType(type);
    setActionModalVisible(true);
    actionForm.resetFields();
  };

  // Submit action
  const handleActionSubmit = async () => {
    try {
      const values = await actionForm.validateFields();
      
      let response;
      switch (actionType) {
        case 'check-in':
          response = await appointmentService.checkInAppointment(
            selectedAppointment._id,
            values.notes
          );
          message.success('Check-in thành công! Hồ sơ bệnh án đã được tạo tự động.');
          break;
          
        case 'complete':
          response = await appointmentService.completeAppointment(
            selectedAppointment._id,
            values.notes
          );
          message.success('Hoàn thành lịch hẹn thành công!');
          break;
          
        case 'cancel':
          response = await appointmentService.cancelAppointment(
            selectedAppointment._id,
            values.cancelReason
          );
          message.success('Hủy lịch hẹn thành công!');
          break;
      }

      setActionModalVisible(false);
      fetchAppointments(); // Reload data
    } catch (error) {
      console.error(`Error performing ${actionType}:`, error);
      message.error(`Không thể thực hiện thao tác ${getActionText(actionType)}`);
    }
  };

  // Get action text
  const getActionText = (type) => {
    const texts = {
      'check-in': 'Check-in',
      'complete': 'Hoàn thành',
      'cancel': 'Hủy lịch hẹn'
    };
    return texts[type] || type;
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'gold',
      confirmed: 'blue',
      'checked-in': 'cyan',
      'in-progress': 'purple',
      completed: 'green',
      cancelled: 'red',
      'no-show': 'gray'
    };
    return colors[status] || 'default';
  };

  // Get status text
  const getStatusText = (status) => {
    const texts = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      'checked-in': 'Đã check-in',
      'in-progress': 'Đang khám',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      'no-show': 'Không đến'
    };
    return texts[status] || status;
  };

  // Check if action is allowed
  const canCheckIn = (appointment) => {
    return ['confirmed', 'pending'].includes(appointment.status) &&
           dayjs(appointment.appointmentDate).isSame(dayjs(), 'day');
  };

  const canComplete = (appointment) => {
    return ['checked-in', 'in-progress'].includes(appointment.status);
  };

  const canCancel = (appointment) => {
    return !['completed', 'cancelled', 'no-show'].includes(appointment.status);
  };

  // Table columns
  const columns = [
    {
      title: 'Mã lịch hẹn',
      dataIndex: 'appointmentCode',
      key: 'appointmentCode',
      width: 120,
      fixed: 'left',
      render: (code) => <Text strong style={{ color: '#1890ff' }}>{code}</Text>
    },
    {
      title: 'Bệnh nhân',
      key: 'patient',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            <UserOutlined /> {record.patientInfo?.name}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <PhoneOutlined /> {record.patientInfo?.phone}
          </Text>
        </div>
      )
    },
    {
      title: 'Ngày khám',
      dataIndex: 'appointmentDate',
      key: 'appointmentDate',
      width: 120,
      sorter: (a, b) => dayjs(a.appointmentDate).unix() - dayjs(b.appointmentDate).unix(),
      render: (date) => (
        <div>
          <CalendarOutlined /> {dayjs(date).format('DD/MM/YYYY')}
        </div>
      )
    },
    {
      title: 'Giờ khám',
      key: 'time',
      width: 120,
      render: (_, record) => (
        <div>
          <ClockCircleOutlined /> {record.startTime} - {record.endTime}
        </div>
      )
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'serviceName',
      key: 'serviceName',
      width: 180,
      ellipsis: true,
      render: (name, record) => (
        <Tooltip title={name}>
          <div>
            <div>{name}</div>
            {record.serviceAddOnName && (
              <Tag color="blue" style={{ fontSize: 11 }}>
                {record.serviceAddOnName}
              </Tag>
            )}
          </div>
        </Tooltip>
      )
    },
    {
      title: 'Nha sỹ',
      dataIndex: 'dentistName',
      key: 'dentistName',
      width: 150,
      ellipsis: true
    },
    {
      title: 'Phòng',
      dataIndex: 'roomName',
      key: 'roomName',
      width: 100,
      render: (name) => name || <Text type="secondary">Chưa có</Text>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          
          {canCheckIn(record) && (
            <Tooltip title="Check-in">
              <Button
                type="primary"
                size="small"
                icon={<LoginOutlined />}
                onClick={() => handleAction(record, 'check-in')}
              >
                Check-in
              </Button>
            </Tooltip>
          )}
          
          {canComplete(record) && (
            <Tooltip title="Hoàn thành">
              <Button
                type="default"
                size="small"
                style={{ color: '#52c41a', borderColor: '#52c41a' }}
                icon={<CheckCircleOutlined />}
                onClick={() => handleAction(record, 'complete')}
              >
                Hoàn thành
              </Button>
            </Tooltip>
          )}
          
          {canCancel(record) && (
            <Tooltip title="Hủy lịch hẹn">
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleAction(record, 'cancel')}
              >
                Hủy
              </Button>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  // Tab items
  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          <CalendarOutlined /> Tất cả
          <Badge 
            count={appointments.length} 
            style={{ backgroundColor: '#1890ff', marginLeft: 8 }}
          />
        </span>
      )
    },
    {
      key: 'today',
      label: (
        <span>
          <ClockCircleOutlined /> Hôm nay
          <Badge 
            count={appointments.filter(a => 
              dayjs(a.appointmentDate).isSame(dayjs(), 'day')
            ).length} 
            style={{ backgroundColor: '#52c41a', marginLeft: 8 }}
          />
        </span>
      )
    },
    {
      key: 'upcoming',
      label: (
        <span>
          <CalendarOutlined /> Sắp tới
          <Badge 
            count={appointments.filter(a => 
              dayjs(a.appointmentDate).isAfter(dayjs().add(1, 'day'))
            ).length} 
            style={{ backgroundColor: '#faad14', marginLeft: 8 }}
          />
        </span>
      )
    },
    {
      key: 'completed',
      label: (
        <span>
          <CheckCircleOutlined /> Đã hoàn thành
          <Badge 
            count={appointments.filter(a => a.status === 'completed').length} 
            style={{ backgroundColor: '#52c41a', marginLeft: 8 }}
          />
        </span>
      )
    }
  ];

  return (
    <div className="appointment-management-container">
      <div className="appointment-header">
        <Title level={2}>
          <CalendarOutlined /> Quản lý lịch hẹn
        </Title>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={fetchAppointments}
          loading={loading}
        >
          Làm mới
        </Button>
      </div>

      {/* Role-based info message */}
      {(() => {
        const userRoles = currentUser.roles || [currentUser.role];
        const isDentist = userRoles.includes('dentist');
        const isNurse = userRoles.includes('nurse');
        const isAdmin = userRoles.includes('admin') || userRoles.includes('manager');
        
        if ((isDentist || isNurse) && !isAdmin) {
          return (
            <Card style={{ marginBottom: 16, backgroundColor: '#e6f7ff', borderColor: '#91d5ff' }}>
              <Space>
                <UserOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                <Text>
                  {isDentist && (
                    <>Bạn đang xem lịch hẹn được gán cho <Text strong>nha sĩ {currentUser.fullName || 'bạn'}</Text></>
                  )}
                  {isNurse && !isDentist && (
                    <>Bạn đang xem lịch hẹn được gán cho <Text strong>y tá {currentUser.fullName || 'bạn'}</Text></>
                  )}
                </Text>
              </Space>
            </Card>
          );
        }
        return null;
      })()}

      <Card>
        {/* Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Tìm kiếm lịch hẹn..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="pending">Chờ xác nhận</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="checked-in">Đã check-in</Option>
              <Option value="in-progress">Đang khám</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
              <Option value="no-show">Không đến</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Nha sỹ"
              value={dentistFilter}
              onChange={setDentistFilter}
              showSearch
              optionFilterProp="children"
            >
              <Option value="all">Tất cả nha sỹ</Option>
              {dentists.map(d => (
                <Option key={d._id} value={d._id}>
                  {d.fullName}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
              value={dateRange}
              onChange={setDateRange}
            />
          </Col>
        </Row>

        {/* Tabs and Table */}
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
        />

        <Table
          dataSource={filteredAppointments}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} lịch hẹn`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize
              }));
            }
          }}
          scroll={{ x: 1500 }}
          locale={{
            emptyText: <Empty description="Không có lịch hẹn nào" />
          }}
        />
      </Card>

      {/* Detail Drawer */}
      <Drawer
        title="Chi tiết lịch hẹn"
        placement="right"
        width={600}
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
      >
        {selectedAppointment && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Mã lịch hẹn">
              <Text strong style={{ color: '#1890ff' }}>
                {selectedAppointment.appointmentCode}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={getStatusColor(selectedAppointment.status)}>
                {getStatusText(selectedAppointment.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Bệnh nhân">
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
              <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                {selectedAppointment.servicePrice?.toLocaleString('vi-VN')} VNĐ
              </Text>
            </Descriptions.Item>
            {selectedAppointment.depositAmount > 0 && (
              <Descriptions.Item label="Tiền cọc">
                <Text type="warning" strong>
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
            {selectedAppointment.checkedInAt && (
              <Descriptions.Item label="Thời gian check-in">
                {dayjs(selectedAppointment.checkedInAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
            )}
            {selectedAppointment.completedAt && (
              <Descriptions.Item label="Thời gian hoàn thành">
                {dayjs(selectedAppointment.completedAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Drawer>

      {/* Action Modal */}
      <Modal
        title={getActionText(actionType)}
        open={actionModalVisible}
        onOk={handleActionSubmit}
        onCancel={() => setActionModalVisible(false)}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <Form
          form={actionForm}
          layout="vertical"
        >
          {actionType === 'check-in' && (
            <>
              <p>
                Xác nhận check-in cho bệnh nhân{' '}
                <Text strong>{selectedAppointment?.patientInfo?.name}</Text>?
              </p>
              <p style={{ color: '#52c41a', fontWeight: 500 }}>
                <CheckCircleOutlined /> Hồ sơ bệnh án sẽ được tạo tự động sau khi check-in.
              </p>
              <Form.Item
                name="notes"
                label="Ghi chú (tùy chọn)"
              >
                <TextArea rows={3} placeholder="Nhập ghi chú..." />
              </Form.Item>
            </>
          )}

          {actionType === 'complete' && (
            <>
              <p>
                Xác nhận hoàn thành lịch hẹn cho bệnh nhân{' '}
                <Text strong>{selectedAppointment?.patientInfo?.name}</Text>?
              </p>
              <Form.Item
                name="notes"
                label="Ghi chú (tùy chọn)"
              >
                <TextArea rows={3} placeholder="Nhập ghi chú..." />
              </Form.Item>
            </>
          )}

          {actionType === 'cancel' && (
            <>
              <p>
                Bạn có chắc chắn muốn hủy lịch hẹn cho bệnh nhân{' '}
                <Text strong>{selectedAppointment?.patientInfo?.name}</Text>?
              </p>
              <Form.Item
                name="cancelReason"
                label="Lý do hủy"
                rules={[{ required: true, message: 'Vui lòng nhập lý do hủy!' }]}
              >
                <TextArea rows={4} placeholder="Nhập lý do hủy lịch hẹn..." />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default AppointmentManagement;

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
  Avatar,
  Badge,
  Tooltip,
  Drawer,
  Descriptions,
  Divider,
  message,
  Empty,
  Spin,
  Modal,
  Form,
  DatePicker,
  Select,
  Switch,
  Popconfirm,
  Tabs
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  EyeOutlined,
  ReloadOutlined,
  ManOutlined,
  WomanOutlined,
  TeamOutlined,
  EditOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import userService from '../../services/userService';

const { Title, Text } = Typography;

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [editForm] = Form.useForm();
  const [toggleModalVisible, setToggleModalVisible] = useState(false);
  const [patientToToggle, setPatientToToggle] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, patients, activeTab]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllPatients(1, 1000);
      
      console.log('📊 API Response:', response); // Debug log
      
      if (response.success) {
        // API trả về users ở root level, không phải trong data
        const patientData = response.users || [];
        console.log('👥 Patients loaded:', patientData.length);
        setPatients(patientData);
        setFilteredPatients(patientData);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      message.error('Không thể tải danh sách bệnh nhân');
      setPatients([]);
      setFilteredPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    // Filter by active tab
    if (activeTab === 'active') {
      filtered = filtered.filter(p => p.isActive === true);
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(p => p.isActive === false);
    }

    // Filter by search text
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(patient =>
        patient.fullName?.toLowerCase().includes(search) ||
        patient.email?.toLowerCase().includes(search) ||
        patient.phone?.includes(search) ||
        patient.address?.toLowerCase().includes(search)
      );
    }

    setFilteredPatients(filtered);
  };

  const showPatientDetails = (patient) => {
    setSelectedPatient(patient);
    setDrawerVisible(true);
  };

  const showEditModal = (patient) => {
    setEditingPatient(patient);
    editForm.setFieldsValue({
      fullName: patient.fullName,
      email: patient.email,
      phone: patient.phone,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth ? dayjs(patient.dateOfBirth) : null,
      address: patient.address
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      setLoading(true);

      const updateData = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null
      };

      const response = await userService.updateUser(editingPatient._id, updateData);
      
      if (response.success) {
        message.success('Cập nhật thông tin bệnh nhân thành công');
        setEditModalVisible(false);
        editForm.resetFields();
        fetchPatients(); // Refresh list
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      message.error(error.message || 'Không thể cập nhật thông tin bệnh nhân');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    editForm.resetFields();
    setEditingPatient(null);
  };

  const showToggleModal = (patient) => {
    setPatientToToggle(patient);
    setToggleModalVisible(true);
  };

  const handleToggleStatus = async () => {
    if (!patientToToggle) return;
    
    try {
      const action = patientToToggle.isActive ? 'khóa' : 'mở khóa';
      setLoading(true);
      
      const response = await userService.toggleUserStatus(patientToToggle._id);
      
      if (response.success) {
        message.success(`${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản thành công`);
        setToggleModalVisible(false);
        setPatientToToggle(null);
        // Refresh patient list
        fetchPatients();
      }
    } catch (error) {
      console.error('Error toggling patient status:', error);
      message.error(error.message || 'Không thể thay đổi trạng thái tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelToggle = () => {
    setToggleModalVisible(false);
    setPatientToToggle(null);
  };

  const getGenderTag = (gender, large = false) => {
    const style = large ? { fontSize: '12px', padding: '8px 16px', lineHeight: '1.5' } : {};
    
    if (gender === 'male') {
      return <Tag icon={<ManOutlined />} color="blue" style={style}>Nam</Tag>;
    } else if (gender === 'female') {
      return <Tag icon={<WomanOutlined />} color="pink" style={style}>Nữ</Tag>;
    }
    return <Tag style={style}>Chưa xác định</Tag>;
  };

  const getColumns = () => [
    {
      title: 'STT',
      key: 'stt',
      width: 50,
      fixed: 'left',
      align: 'center',
      render: (_, __, index) => {
        return (pagination.current - 1) * pagination.pageSize + index + 1;
      }
    },
    {
      title: 'Bệnh nhân',
      key: 'patient',
      width: 250,
      fixed: 'left',
      sorter: (a, b) => {
        const getLastName = (fullName) => {
          const parts = fullName.trim().split(' ');
          return parts[parts.length - 1];
        };
        return getLastName(a.fullName).localeCompare(getLastName(b.fullName), 'vi');
      },
      render: (_, record) => (
        <Space>
          <Avatar 
            size={40} 
            icon={<UserOutlined />} 
            src={record.avatar}
            style={{ backgroundColor: record.isActive ? '#1890ff' : '#d9d9d9' }}
          />
          <div>
            <div>
              <Text strong>{record.fullName}</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <MailOutlined /> {record.email}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      sorter: (a, b) => (a.phone || '').localeCompare(b.phone || ''),
      render: (phone) => (
        <Text>
          <PhoneOutlined /> {phone || 'Chưa có'}
        </Text>
      )
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      width: 100,
      render: (gender) => getGenderTag(gender)
    },
    {
      title: 'Ngày sinh',
      dataIndex: 'dateOfBirth',
      key: 'dateOfBirth',
      width: 100,
      sorter: (a, b) => {
        if (!a.dateOfBirth) return 1;
        if (!b.dateOfBirth) return -1;
        return dayjs(a.dateOfBirth).unix() - dayjs(b.dateOfBirth).unix();
      },
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'Chưa có'
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (date) => (
        <Space direction="vertical" size={0}>
          <Text>{dayjs(date).format('DD/MM/YYYY')}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(date).format('HH:mm')}
          </Text>
        </Space>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title={record.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}>
            <Switch
              checked={record.isActive}
              size="small"
              onChange={() => showToggleModal(record)}
            />
          </Tooltip>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
          >
            Sửa
          </Button>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showPatientDetails(record)}
          >
            Chi tiết
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={3}>
          <TeamOutlined /> Quản Lý Bệnh Nhân
        </Title>

        {/* Search & Actions */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={18}>
            <Input
              placeholder="Tìm kiếm bệnh nhân (tên, email, số điện thoại, địa chỉ...)"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
            />
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchPatients}
              size="large"
            >
              Làm mới
            </Button>
          </Col>
        </Row>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setPagination({ current: 1, pageSize: 10 }); // Reset pagination
          }}
          items={[
            {
              key: 'active',
              label: (
                <span>
                  Đang hoạt động
                </span>
              ),
              children: (
                <Table
                  columns={getColumns()}
                  dataSource={filteredPatients}
                  rowKey="_id"
                  loading={loading}
                  scroll={{ x: 800, y: 600 }}
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: filteredPatients.length,
                    showTotal: (total) => `Tổng ${total} bệnh nhân`,
                    onChange: (page, pageSize) => {
                      setPagination({ current: page, pageSize });
                    }
                  }}
                  locale={{
                    emptyText: (
                      <Empty
                        description="Không có bệnh nhân đang hoạt động"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )
                  }}
                />
              )
            },
            {
              key: 'inactive',
              label: (
                <span>
                  Đã khóa tài khoản
                </span>
              ),
              children: (
                <Table
                  columns={getColumns()}
                  dataSource={filteredPatients}
                  rowKey="_id"
                  loading={loading}
                  scroll={{ x: 800, y: 600 }}
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: filteredPatients.length,
                    showTotal: (total) => `Tổng ${total} bệnh nhân`,
                    onChange: (page, pageSize) => {
                      setPagination({ current: page, pageSize });
                    }
                  }}
                  locale={{
                    emptyText: (
                      <Empty
                        description="Không có bệnh nhân bị khóa tài khoản"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )
                  }}
                />
              )
            }
          ]}
        />
      </Card>

      {/* Detail Drawer */}
      <Drawer
        title="Thông Tin Bệnh Nhân"
        placement="right"
        width={600}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedPatient && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar 
                size={100} 
                icon={<UserOutlined />} 
                src={selectedPatient.avatar}
                style={{ backgroundColor: selectedPatient.isActive ? '#1890ff' : '#d9d9d9' }}
              />
              <Title level={4} style={{ marginTop: 16, marginBottom: 0 }}>
                {selectedPatient.fullName}
              </Title>
              <Text type="secondary">{selectedPatient.email}</Text>
              <div style={{ marginTop: 8 }}>
                <Badge 
                  status={selectedPatient.isActive ? 'success' : 'error'} 
                  text={selectedPatient.isActive ? 'Hoạt động' : 'Đã khóa'}
                />
              </div>
            </div>

            <Divider />

            <Descriptions bordered column={1}>
              <Descriptions.Item label="Họ và tên">
                {selectedPatient.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                <MailOutlined /> {selectedPatient.email}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                <PhoneOutlined /> {selectedPatient.phone || 'Chưa có'}
              </Descriptions.Item>
              <Descriptions.Item label="Giới tính">
                {getGenderTag(selectedPatient.gender, true)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">
                {selectedPatient.dateOfBirth ? (
                  <>
                    <CalendarOutlined /> {dayjs(selectedPatient.dateOfBirth).format('DD/MM/YYYY')}
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      ({dayjs().diff(dayjs(selectedPatient.dateOfBirth), 'year')} tuổi)
                    </Text>
                  </>
                ) : 'Chưa có'}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {selectedPatient.address || 'Chưa có'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đăng ký">
                {dayjs(selectedPatient.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lần cuối">
                {dayjs(selectedPatient.updatedAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              {selectedPatient.notes && (
                <Descriptions.Item label="Ghi chú">
                  {selectedPatient.notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </>
        )}
      </Drawer>

      {/* Toggle Status Modal */}
      <Modal
        title={
          <Space>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span>{patientToToggle?.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}</span>
          </Space>
        }
        open={toggleModalVisible}
        onOk={handleToggleStatus}
        onCancel={handleCancelToggle}
        okText="Xác nhận"
        cancelText="Hủy"
        confirmLoading={loading}
        okButtonProps={{ 
          danger: patientToToggle?.isActive,
          style: patientToToggle?.isActive ? {} : { background: '#52c41a', borderColor: '#52c41a' }
        }}
      >
        {patientToToggle && (
          <div style={{ padding: '16px 0' }}>
            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ fontSize: '15px' }}>
                Bạn có chắc chắn muốn {patientToToggle.isActive ? 'khóa' : 'mở khóa'} tài khoản của:
              </Text>
              <div style={{ 
                marginTop: '12px',
                padding: '12px',
                background: '#f5f5f5',
                borderRadius: '8px',
                border: '1px solid #d9d9d9'
              }}>
                <Space direction="vertical" size={4}>
                  <Text strong style={{ fontSize: '16px' }}>{patientToToggle.fullName}</Text>
                  <Text type="secondary">{patientToToggle.email}</Text>
                  <Text type="secondary">{patientToToggle.phone}</Text>
                </Space>
              </div>
            </div>

            {patientToToggle.isActive ? (
              // Cảnh báo khi KHÓA tài khoản
              <div style={{
                padding: '16px',
                background: '#fff2e8',
                border: '1px solid #ffbb96',
                borderRadius: '8px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong style={{ color: '#d4380d', fontSize: '15px' }}>
                    Khi khóa tài khoản, bệnh nhân này sẽ:
                  </Text>
                </div>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: '#d4380d', marginRight: '8px', fontSize: '20px', lineHeight: '1' }}>•</span>
                    <Text>Không thể đăng nhập vào hệ thống</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: '#d4380d', marginRight: '8px', fontSize: '20px', lineHeight: '1' }}>•</span>
                    <Text>Mất quyền truy cập tất cả chức năng</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: '#d4380d', marginRight: '8px', fontSize: '20px', lineHeight: '1' }}>•</span>
                    <Text>Không thể đặt lịch hẹn mới</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: '#d4380d', marginRight: '8px', fontSize: '20px', lineHeight: '1' }}>•</span>
                    <Text>Không thể xem hồ sơ bệnh án</Text>
                  </div>
                </Space>
              </div>
            ) : (
              // Thông báo khi MỞ KHÓA tài khoản
              <div style={{
                padding: '16px',
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '8px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong style={{ color: '#389e0d', fontSize: '15px' }}>
                    Khi mở khóa tài khoản, bệnh nhân này sẽ:
                  </Text>
                </div>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: '#389e0d', marginRight: '8px', fontSize: '20px', lineHeight: '1' }}>•</span>
                    <Text>Có thể đăng nhập vào hệ thống</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: '#389e0d', marginRight: '8px', fontSize: '20px', lineHeight: '1' }}>•</span>
                    <Text>Khôi phục quyền truy cập tất cả chức năng</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: '#389e0d', marginRight: '8px', fontSize: '20px', lineHeight: '1' }}>•</span>
                    <Text>Có thể đặt lịch hẹn mới</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: '#389e0d', marginRight: '8px', fontSize: '20px', lineHeight: '1' }}>•</span>
                    <Text>Có thể xem hồ sơ bệnh án</Text>
                  </div>
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Patient Modal */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            <span>Chỉnh sửa thông tin bệnh nhân</span>
          </Space>
        }
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={handleCancelEdit}
        width={700}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        confirmLoading={loading}
      >
        <Form
          form={editForm}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' }
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số' }
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="Giới tính"
                rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
              >
                <Select placeholder="Chọn giới tính">
                  <Select.Option value="male">Nam</Select.Option>
                  <Select.Option value="female">Nữ</Select.Option>
                  <Select.Option value="other">Khác</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="dateOfBirth"
                label="Ngày sinh"
              >
                <DatePicker 
                  placeholder="Chọn ngày sinh" 
                  format="DD/MM/YYYY"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Địa chỉ"
          >
            <Input.TextArea 
              placeholder="Nhập địa chỉ" 
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PatientManagement;

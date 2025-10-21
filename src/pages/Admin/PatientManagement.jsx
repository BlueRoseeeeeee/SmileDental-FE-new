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
  Statistic,
  message,
  Empty,
  Spin
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
  TeamOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

const { Title, Text } = Typography;

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Statistics
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    male: 0,
    female: 0
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
    calculateStatistics();
  }, [searchText, patients]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3001/api'}/user/all-patient`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: 1, limit: 1000 }
        }
      );
      
      if (response.data.success) {
        const patientData = response.data.data.users || [];
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
    if (!searchText.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const search = searchText.toLowerCase();
    const filtered = patients.filter(patient =>
      patient.fullName?.toLowerCase().includes(search) ||
      patient.email?.toLowerCase().includes(search) ||
      patient.phone?.includes(search) ||
      patient.address?.toLowerCase().includes(search)
    );
    setFilteredPatients(filtered);
  };

  const calculateStatistics = () => {
    const stats = {
      total: filteredPatients.length,
      active: filteredPatients.filter(p => p.isActive).length,
      inactive: filteredPatients.filter(p => !p.isActive).length,
      male: filteredPatients.filter(p => p.gender === 'male').length,
      female: filteredPatients.filter(p => p.gender === 'female').length
    };
    setStatistics(stats);
  };

  const showPatientDetails = (patient) => {
    setSelectedPatient(patient);
    setDrawerVisible(true);
  };

  const getGenderTag = (gender) => {
    if (gender === 'male') {
      return <Tag icon={<ManOutlined />} color="blue">Nam</Tag>;
    } else if (gender === 'female') {
      return <Tag icon={<WomanOutlined />} color="pink">Nữ</Tag>;
    }
    return <Tag>Chưa xác định</Tag>;
  };

  const columns = [
    {
      title: 'Bệnh nhân',
      key: 'patient',
      width: 250,
      fixed: 'left',
      render: (_, record) => (
        <Space>
          <Avatar 
            size={40} 
            icon={<UserOutlined />} 
            src={record.profilePicture}
            style={{ backgroundColor: record.isActive ? '#1890ff' : '#d9d9d9' }}
          />
          <div>
            <div>
              <Text strong>{record.fullName}</Text>
              {!record.isActive && (
                <Tag color="red" style={{ marginLeft: 8 }}>Đã khóa</Tag>
              )}
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
      width: 150,
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
      width: 120,
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'Chưa có'
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      width: 250,
      ellipsis: true,
      render: (address) => (
        <Tooltip title={address}>
          <Text>{address || 'Chưa có'}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
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
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Đã khóa', value: false }
      ],
      onFilter: (value, record) => record.isActive === value,
      render: (isActive) => (
        <Badge 
          status={isActive ? 'success' : 'error'} 
          text={isActive ? 'Hoạt động' : 'Đã khóa'}
        />
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => showPatientDetails(record)}
        >
          Chi tiết
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={3}>
          <TeamOutlined /> Quản Lý Bệnh Nhân
        </Title>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={5}>
            <Card>
              <Statistic
                title="Tổng số bệnh nhân"
                value={statistics.total}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card>
              <Statistic
                title="Đang hoạt động"
                value={statistics.active}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card>
              <Statistic
                title="Đã khóa"
                value={statistics.inactive}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card>
              <Statistic
                title="Nam"
                value={statistics.male}
                prefix={<ManOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Nữ"
                value={statistics.female}
                prefix={<WomanOutlined />}
                valueStyle={{ color: '#eb2f96' }}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

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

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredPatients}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1300, y: 600 }}
          pagination={{
            total: filteredPatients.length,
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bệnh nhân`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          locale={{
            emptyText: (
              <Empty
                description="Không có dữ liệu"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
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
                src={selectedPatient.profilePicture}
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
                {getGenderTag(selectedPatient.gender)}
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
    </div>
  );
};

export default PatientManagement;

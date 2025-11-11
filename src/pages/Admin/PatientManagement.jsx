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

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, patients]);

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

  const showPatientDetails = (patient) => {
    setSelectedPatient(patient);
    setDrawerVisible(true);
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
      width: 120,
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
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'Chưa có'
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      width: 200,
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
    </div>
  );
};

export default PatientManagement;

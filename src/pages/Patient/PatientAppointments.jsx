import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space,
  Typography,
  Divider,
  Empty,
  Modal,
  Descriptions,
  message
} from 'antd';
import { 
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  EyeOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import './PatientAppointments.css';

const { Title, Text } = Typography;
const { confirm } = Modal;

const PatientAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      // TODO: Call API to get patient appointments
      // const response = await appointmentService.getMyAppointments();
      
      // Mock data for now
      const mockAppointments = [
        {
          _id: '1',
          date: '2025-10-20',
          time: '09:00',
          dentist: { fullName: 'BS. Nguyễn Văn A' },
          service: { name: 'Khám tổng quát' },
          status: 'confirmed',
          room: 'Phòng 101',
          notes: 'Khám định kỳ'
        },
        {
          _id: '2',
          date: '2025-10-15',
          time: '14:00',
          dentist: { fullName: 'BS. Trần Thị B' },
          service: { name: 'Nhổ răng khôn' },
          status: 'completed',
          room: 'Phòng 102',
          notes: 'Đã hoàn thành'
        }
      ];
      
      setAppointments(mockAppointments);
    } catch (error) {
      console.error('Load appointments error:', error);
      message.error('Không thể tải danh sách lịch khám');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      pending: { color: 'gold', text: 'Chờ xác nhận' },
      confirmed: { color: 'blue', text: 'Đã xác nhận' },
      completed: { color: 'green', text: 'Hoàn thành' },
      cancelled: { color: 'red', text: 'Đã hủy' }
    };
    
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleViewDetail = (record) => {
    setSelectedAppointment(record);
    setDetailModalVisible(true);
  };

  const handleCancelAppointment = (record) => {
    confirm({
      title: 'Xác nhận hủy lịch khám',
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn hủy lịch khám ngày ${dayjs(record.date).format('DD/MM/YYYY')} lúc ${record.time}?`,
      okText: 'Xác nhận',
      cancelText: 'Đóng',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          // TODO: Call API to cancel appointment
          // await appointmentService.cancelAppointment(record._id);
          
          message.success('Hủy lịch khám thành công');
          loadAppointments();
        } catch (error) {
          console.error('Cancel appointment error:', error);
          message.error('Hủy lịch khám thất bại');
        }
      }
    });
  };

  const columns = [
    {
      title: 'Ngày khám',
      dataIndex: 'date',
      key: 'date',
      render: (date) => (
        <Space>
          <CalendarOutlined style={{ color: '#2c5f4f' }} />
          <Text>{dayjs(date).format('DD/MM/YYYY')}</Text>
        </Space>
      ),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Giờ khám',
      dataIndex: 'time',
      key: 'time',
      render: (time) => (
        <Space>
          <ClockCircleOutlined />
          <Text>{time}</Text>
        </Space>
      )
    },
    {
      title: 'Bác sĩ',
      dataIndex: ['dentist', 'fullName'],
      key: 'dentist',
      render: (name) => (
        <Space>
          <UserOutlined />
          <Text>{name}</Text>
        </Space>
      )
    },
    {
      title: 'Dịch vụ',
      dataIndex: ['service', 'name'],
      key: 'service',
      render: (name) => (
        <Space>
          <MedicineBoxOutlined />
          <Text>{name}</Text>
        </Space>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Chờ xác nhận', value: 'pending' },
        { text: 'Đã xác nhận', value: 'confirmed' },
        { text: 'Hoàn thành', value: 'completed' },
        { text: 'Đã hủy', value: 'cancelled' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            Chi tiết
          </Button>
          {(record.status === 'pending' || record.status === 'confirmed') && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleCancelAppointment(record)}
            >
              Hủy
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="patient-appointments-container">
      <Card className="appointments-card">
        <Title level={2}>
          <CalendarOutlined /> Lịch khám của tôi
        </Title>
        <Divider />

        <Table
          columns={columns}
          dataSource={appointments}
          rowKey="_id"
          loading={loading}
          locale={{
            emptyText: (
              <Empty
                description="Chưa có lịch khám nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" href="/patient/booking/select-service">
                  Đặt lịch khám ngay
                </Button>
              </Empty>
            )
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} lịch khám`
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={<><EyeOutlined /> Chi tiết lịch khám</>}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        {selectedAppointment && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Ngày khám" span={1}>
              {dayjs(selectedAppointment.date).format('DD/MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ khám" span={1}>
              {selectedAppointment.time}
            </Descriptions.Item>
            <Descriptions.Item label="Bác sĩ" span={1}>
              {selectedAppointment.dentist?.fullName}
            </Descriptions.Item>
            <Descriptions.Item label="Phòng khám" span={1}>
              {selectedAppointment.room}
            </Descriptions.Item>
            <Descriptions.Item label="Dịch vụ" span={2}>
              {selectedAppointment.service?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái" span={2}>
              {getStatusTag(selectedAppointment.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú" span={2}>
              {selectedAppointment.notes || 'Không có'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default PatientAppointments;

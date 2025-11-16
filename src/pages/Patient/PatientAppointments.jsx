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
import appointmentService from '../../services/appointmentService';
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
      
      // ⭐ Call real API to get patient appointments
      const response = await appointmentService.getMyAppointments();
      
      if (response.success && response.data) {
        // Map API response to component format
        const mappedData = response.data.map(apt => ({
          ...apt,
          date: apt.appointmentDate,
          time: `${apt.startTime} - ${apt.endTime}`,
          dentist: {
            fullName: apt.dentistName
          },
          service: {
            name: apt.serviceName
          },
          room: apt.roomName || 'Chưa xác định'
        }));
        setAppointments(mappedData);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Load appointments error:', error);
      message.error('Không thể tải danh sách lịch khám');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      pending: { color: 'gold', text: 'Chờ xác nhận' },
      confirmed: { color: 'blue', text: 'Đã xác nhận' },
      'checked-in': { color: 'cyan', text: 'Đã check-in' },
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
        { text: 'Đã check-in', value: 'checked-in' },
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
              {selectedAppointment.subroomName 
                ? `${selectedAppointment.room} - ${selectedAppointment.subroomName}`
                : selectedAppointment.room}
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

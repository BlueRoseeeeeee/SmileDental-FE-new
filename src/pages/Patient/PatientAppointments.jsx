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
  message,
  Form,
  Input,
  Alert
} from 'antd';
import { 
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  EyeOutlined,
  StopOutlined,
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
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancelForm] = Form.useForm();

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
      cancelled: { color: 'red', text: 'Đã hủy' },
      'pending-cancellation': { color: 'orange', text: 'Đang yêu cầu hủy' },
      'no-show': { color: 'default', text: 'Không đến' }
    };
    
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleViewDetail = (record) => {
    setSelectedAppointment(record);
    setDetailModalVisible(true);
  };

  // ✅ Kiểm tra xem có thể yêu cầu hủy không (>=24 giờ)
  const canRequestCancellation = (appointment) => {
    if (appointment.status !== 'confirmed') {
      return false;
    }

    const now = new Date();
    const appointmentDateTime = new Date(appointment.appointmentDate || appointment.date);
    
    // Parse startTime (format: "HH:MM")
    const startTime = appointment.startTime || appointment.time?.split(' - ')[0];
    if (startTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      appointmentDateTime.setHours(hours, minutes, 0, 0);
    }
    
    const timeDiff = appointmentDateTime - now;
    const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours
    
    return timeDiff >= oneDayInMs;
  };

  const handleRequestCancellation = (record) => {
    setAppointmentToCancel(record);
    setCancelModalVisible(true);
    cancelForm.resetFields();
  };

  const handleCancelSubmit = async () => {
    try {
      // Manual validation since we're not using Form.Item
      const reason = cancelForm.getFieldValue('reason');
      
      if (!reason || reason.trim().length === 0) {
        message.error('Vui lòng nhập lý do hủy lịch khám');
        return;
      }
      
      if (reason.trim().length < 10) {
        message.error('Lý do phải có ít nhất 10 ký tự');
        return;
      }
      
      const response = await appointmentService.requestCancellation(
        appointmentToCancel._id,
        reason
      );
      
      if (response.success) {
        message.success('Đã gửi yêu cầu hủy lịch khám. Vui lòng chờ xác nhận từ phòng khám.');
        setCancelModalVisible(false);
        setAppointmentToCancel(null);
        cancelForm.resetFields();
        loadAppointments();
      } else {
        message.error(response.message || 'Không thể gửi yêu cầu hủy');
      }
    } catch (error) {
      console.error('Request cancellation error:', error);
      message.error(error.response?.data?.message || 'Gửi yêu cầu hủy thất bại');
    }
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
        { text: 'Đã hủy', value: 'cancelled' },
        { text: 'Đang yêu cầu hủy', value: 'pending-cancellation' },
        { text: 'Không đến', value: 'no-show' }
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
          {canRequestCancellation(record) && (
            <Button
              type="link"
              danger
              icon={<StopOutlined />}
              onClick={() => handleRequestCancellation(record)}
            >
              Gửi yêu cầu hủy
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

      {/* Cancel Request Modal */}
      <Modal
        title={<><StopOutlined /> Yêu cầu hủy lịch khám</>}
        open={cancelModalVisible}
        onCancel={() => {
          setCancelModalVisible(false);
          setAppointmentToCancel(null);
          cancelForm.resetFields();
        }}
        onOk={handleCancelSubmit}
        okText="Gửi yêu cầu"
        cancelText="Đóng"
        okButtonProps={{ danger: true }}
      >
        {appointmentToCancel && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Appointment Info */}
            <div>
              <Text>Bạn đang yêu cầu hủy lịch khám:</Text>
              <div style={{ marginTop: 8, lineHeight: '1.8' }}>
                <div><strong>Ngày:</strong> {dayjs(appointmentToCancel.date).format('DD/MM/YYYY')}</div>
                <div><strong>Giờ:</strong> {appointmentToCancel.time}</div>
                <div><strong>Bác sĩ:</strong> {appointmentToCancel.dentist?.fullName}</div>
              </div>
            </div>

            {/* Reason Input */}
            <div>
              <Text strong style={{ fontSize: 16 }}>
                * Lý do hủy:
              </Text>
              <Input.TextArea
                value={cancelForm.getFieldValue('reason')}
                onChange={(e) => cancelForm.setFieldsValue({ reason: e.target.value })}
                rows={4}
                placeholder="Vui lòng cho chúng tôi biết lý do bạn muốn hủy lịch khám..."
                maxLength={500}
                showCount
                style={{ marginTop: 8 }}
                className='custom-textarea'
              />
            </div>

            {/* Warning Message */}
            <Alert
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
              message="Lưu ý"
              description="Yêu cầu hủy lịch sẽ được gửi đến phòng khám để xem xét. Bạn sẽ nhận được thông báo khi yêu cầu được xử lý."
            />
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default PatientAppointments;

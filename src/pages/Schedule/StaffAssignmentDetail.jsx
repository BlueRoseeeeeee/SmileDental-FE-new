/**
 * @author: TrungNghia & HoTram
 * Component: Staff Assignment Detail - Calendar view cho ca làm việc
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Calendar,
  Badge,
  Modal,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Select,
  Spin,
  Alert,
  Tooltip,
  Progress
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  ReloadOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '../../services/toastService';
import scheduleService from '../../services/scheduleService';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

const { Title, Text } = Typography;
const { Option } = Select;

dayjs.locale('vi');

const StaffAssignmentDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { room, shift, month, year } = location.state || {};

  // States
  const [loading, setLoading] = useState(false);
  const [calendarData, setCalendarData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSlotsModal, setShowSlotsModal] = useState(false);
  const [daySlots, setDaySlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!room || !shift || !month || !year) {
      toast.error('Thiếu thông tin phòng và ca');
      navigate('/schedules/staff-assignment');
      return;
    }
    fetchCalendarData();
  }, [room, shift, month, year]);

  // Fetch calendar data
  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const response = await scheduleService.getShiftCalendarForAssignment({
        roomId: room.roomId,
        subRoomId: room.subRoomId,
        shiftName: shift.shiftName,
        month,
        year
      });

      if (response.success) {
        setCalendarData(response.data);
      } else {
        toast.error(response.message || 'Lỗi khi tải lịch');
      }
    } catch (error) {
      toast.error('Lỗi khi tải lịch: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle date cell click
  const handleDateClick = async (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    const dayData = calendarData?.days?.find(d => d.dateStr === dateStr);

    if (!dayData || dayData.totalSlots === 0) {
      toast.info('Ngày này không có slot');
      return;
    }

    // Check if date is in the past
    const today = dayjs().startOf('day');
    if (date.isBefore(today)) {
      toast.warning('Không thể chỉnh sửa slot trong quá khứ');
      return;
    }

    setSelectedDate(date);
    setLoadingSlots(true);
    setShowSlotsModal(true);

    try {
      const response = await scheduleService.getSlotsByDayAndShift({
        roomId: room.roomId,
        subRoomId: room.subRoomId,
        shiftName: shift.shiftName,
        date: dateStr
      });

      if (response.success) {
        setDaySlots(response.data);
      } else {
        toast.error(response.message || 'Lỗi khi tải slots');
      }
    } catch (error) {
      toast.error('Lỗi khi tải slots: ' + error.message);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Render calendar cell
  const dateCellRender = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    const dayData = calendarData?.days?.find(d => d.dateStr === dateStr);

    if (!dayData || dayData.totalSlots === 0) {
      return null;
    }

    const percentage = dayData.totalSlots > 0 
      ? Math.round((dayData.assignedSlots / dayData.totalSlots) * 100)
      : 0;

    const isFullyAssigned = dayData.assignedSlots === dayData.totalSlots;
    const hasPartialAssignment = dayData.assignedSlots > 0 && dayData.assignedSlots < dayData.totalSlots;
    const today = dayjs().startOf('day');
    const isPast = date.isBefore(today);

    return (
      <div style={{ padding: '4px', cursor: isPast ? 'not-allowed' : 'pointer' }}>
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Badge
            status={isFullyAssigned ? 'success' : hasPartialAssignment ? 'processing' : 'default'}
            text={
              <Text style={{ fontSize: 11 }}>
                {dayData.assignedSlots}/{dayData.totalSlots}
              </Text>
            }
          />
          <Progress 
            percent={percentage} 
            size="small" 
            showInfo={false}
            strokeColor={isFullyAssigned ? '#52c41a' : hasPartialAssignment ? '#1890ff' : '#d9d9d9'}
          />
        </Space>
      </div>
    );
  };

  // Handle assign staff to slot
  const handleAssignSlot = (slotId) => {
    navigate('/dashboard/schedules/staff-assignment/assign', {
      state: {
        slotId,
        room,
        shift,
        date: selectedDate,
        returnPath: location.pathname
      }
    });
  };

  // Slots table columns
  const slotsColumns = [
    {
      title: 'Thời gian',
      key: 'time',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{dayjs(record.startTime).format('HH:mm')}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            → {dayjs(record.endTime).format('HH:mm')}
          </Text>
        </Space>
      )
    },
    {
      title: 'Nha sĩ',
      dataIndex: 'dentist',
      key: 'dentist',
      render: (dentist) => dentist ? (
        <Space>
          <UserOutlined style={{ color: '#52c41a' }} />
          <Text>{dentist.name}</Text>
        </Space>
      ) : (
        <Text type="secondary">Chưa phân công</Text>
      )
    },
    {
      title: 'Y tá',
      dataIndex: 'nurse',
      key: 'nurse',
      render: (nurse) => nurse ? (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          <Text>{nurse.name}</Text>
        </Space>
      ) : (
        <Text type="secondary">Chưa phân công</Text>
      )
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <Tag color={record.isAssigned ? 'success' : 'default'}>
          {record.isAssigned ? 'Đã phân' : 'Chưa phân'}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleAssignSlot(record._id)}
        >
          {record.isAssigned ? 'Sửa' : 'Phân công'}
        </Button>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Đang tải lịch phân công...</Text>
        </div>
      </div>
    );
  }

  if (!calendarData) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          type="error"
          message="Không thể tải dữ liệu lịch"
          description="Vui lòng thử lại sau"
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/schedules/staff-assignment')}
            >
              Quay lại
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              Phân công nhân viên - {room.roomName}
            </Title>
          </Space>
        </Col>
        <Col>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchCalendarData}
            loading={loading}
          >
            Làm mới
          </Button>
        </Col>
      </Row>

      {/* Info Card */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card>
            <Row gutter={16}>
              <Col span={6}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary">Phòng</Text>
                  <Text strong>{room.roomName}</Text>
                  {room.subRoomName && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {room.subRoomName}
                    </Text>
                  )}
                </Space>
              </Col>
              <Col span={6}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary">Ca làm việc</Text>
                  <Tag color={shift.shiftKey === 'morning' ? 'gold' : shift.shiftKey === 'afternoon' ? 'blue' : 'purple'}>
                    {shift.shiftName}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {shift.startTime} - {shift.endTime}
                  </Text>
                </Space>
              </Col>
              <Col span={6}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary">Tháng</Text>
                  <Text strong>Tháng {month}/{year}</Text>
                </Space>
              </Col>
              <Col span={6}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary">Tiến độ phân công</Text>
                  <Progress 
                    percent={calendarData.summary.percentage} 
                    status={calendarData.summary.percentage === 100 ? 'success' : 'active'}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {calendarData.summary.assignedSlots}/{calendarData.summary.totalSlots} slots
                  </Text>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Calendar */}
      <Card title="Lịch phân công theo ngày">
        <Alert
          type="info"
          showIcon
          message="Hướng dẫn"
          description="Click vào ngày để xem chi tiết và phân công nhân viên. Chỉ có thể phân công cho các ngày từ hôm nay trở đi."
          style={{ marginBottom: 16 }}
        />
        <Calendar
          dateCellRender={dateCellRender}
          onSelect={handleDateClick}
          validRange={[
            dayjs().year(year).month(month - 1).startOf('month'),
            dayjs().year(year).month(month - 1).endOf('month')
          ]}
        />
      </Card>

      {/* Slots Modal */}
      <Modal
        title={
          <Space>
            <span>Danh sách slot - {selectedDate?.format('DD/MM/YYYY')}</span>
            <Tag>{shift.shiftName}</Tag>
          </Space>
        }
        open={showSlotsModal}
        onCancel={() => setShowSlotsModal(false)}
        footer={null}
        width={900}
      >
        {loadingSlots ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : (
          <Table
            columns={slotsColumns}
            dataSource={daySlots}
            rowKey="_id"
            pagination={false}
            size="small"
          />
        )}
      </Modal>
    </div>
  );
};

export default StaffAssignmentDetail;

/**
 * @author: Your Name
 * BulkRoomScheduleModal - Modal hiển thị lịch của nhiều phòng (chỉ xem, không edit)
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Modal,
  Table,
  Tag,
  Select,
  DatePicker,
  Space,
  Typography,
  Empty,
  Row,
  Col,
  Divider,
  Radio
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const SHIFT_COLORS = {
  morning: 'gold',
  afternoon: 'blue',
  evening: 'purple'
};

const SHIFT_NAMES = {
  morning: 'Ca Sáng',
  afternoon: 'Ca Chiều',
  evening: 'Ca Tối'
};

const BulkRoomScheduleModal = ({
  visible,
  onCancel,
  selectedRooms, // Array of room objects
  schedulesData, // Data từ API getRoomSchedulesWithShifts cho từng phòng
  isViewingAll = false // 🆕 Flag rõ ràng: true = xem tất cả, false = xem các phòng đã chọn
}) => {
  const [filterRoom, setFilterRoom] = useState(null); // null = all rooms
  const [filterMonthRange, setFilterMonthRange] = useState(null); // [startMonth, endMonth] hoặc null
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'complete' | 'incomplete'

  // 🆕 Reset month range khi đổi filter phòng
  useEffect(() => {
    // Khi đổi phòng, clear month range vì available months đã thay đổi
    setFilterMonthRange(null);
  }, [filterRoom]);

  // Flatten all schedules từ tất cả các phòng
  const allSchedules = useMemo(() => {
    if (!schedulesData || Object.keys(schedulesData).length === 0) {
      return [];
    }

    const schedules = [];

    Object.entries(schedulesData).forEach(([roomId, data]) => {
      const room = selectedRooms.find(r => r._id === roomId);
      if (!room) return;

      if (data.schedules && Array.isArray(data.schedules)) {
        data.schedules.forEach(schedule => {
          schedules.push({
            ...schedule,
            roomId: room._id,
            roomName: room.name,
            roomNumber: room.roomNumber
          });
        });
      }
    });

    return schedules;
  }, [schedulesData, selectedRooms]);

  // 🆕 Pre-filter schedules (by room + month range, KHÔNG bao gồm status)
  // Dùng để tính số lượng cho Radio buttons
  const preFilteredSchedules = useMemo(() => {
    let filtered = [...allSchedules];

    // Filter by room
    if (filterRoom) {
      filtered = filtered.filter(s => s.roomId === filterRoom);
    }

    // Filter by month range
    if (filterMonthRange && filterMonthRange[0] && filterMonthRange[1]) {
      const startMonth = filterMonthRange[0];
      const endMonth = filterMonthRange[1];
      
      filtered = filtered.filter(s => {
        const scheduleDate = dayjs().year(s.year).month(s.month - 1);
        return scheduleDate.isSameOrAfter(startMonth, 'month') && 
               scheduleDate.isSameOrBefore(endMonth, 'month');
      });
    }

    return filtered;
  }, [allSchedules, filterRoom, filterMonthRange]);

  // Filter schedules (bao gồm cả status filter)
  const filteredSchedules = useMemo(() => {
    let filtered = [...preFilteredSchedules];

    // 🆕 Filter by status
    if (filterStatus === 'complete') {
      filtered = filtered.filter(s => s.isComplete === true && !s.isExpired);
    } else if (filterStatus === 'incomplete') {
      filtered = filtered.filter(s => s.isComplete === false && !s.isExpired);
    }
    // 'all' → không filter

    // Sort by room name, then by year/month
    filtered.sort((a, b) => {
      if (a.roomName !== b.roomName) {
        return a.roomName.localeCompare(b.roomName, 'vi');
      }
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return a.month - b.month;
    });

    return filtered;
  }, [preFilteredSchedules, filterStatus]);

  // 🆕 Get available months based on selected room filter
  const availableMonths = useMemo(() => {
    // Nếu đã chọn phòng → Chỉ lấy tháng của phòng đó
    // Nếu chưa chọn phòng → Lấy tất cả tháng có lịch (từ bất kỳ phòng nào)
    const schedulesToCheck = filterRoom 
      ? allSchedules.filter(s => s.roomId === filterRoom)
      : allSchedules;

    const monthSet = new Set();
    schedulesToCheck.forEach(schedule => {
      monthSet.add(`${schedule.year}-${String(schedule.month).padStart(2, '0')}`);
    });
    
    return Array.from(monthSet).sort();
  }, [allSchedules, filterRoom]);

  // 🆕 Get min and max available months
  const { minAvailableMonth, maxAvailableMonth } = useMemo(() => {
    if (availableMonths.length === 0) {
      return { minAvailableMonth: null, maxAvailableMonth: null };
    }
    
    const min = availableMonths[0]; // Already sorted
    const max = availableMonths[availableMonths.length - 1];
    
    return {
      minAvailableMonth: dayjs(min, 'YYYY-MM'),
      maxAvailableMonth: dayjs(max, 'YYYY-MM')
    };
  }, [availableMonths]);

  // 🆕 Disable months for START picker
  const disabledStartMonth = useCallback((current) => {
    if (!current) return false;
    
    // Chỉ cho chọn tháng có lịch
    const monthStr = current.format('YYYY-MM');
    return !availableMonths.includes(monthStr);
  }, [availableMonths]);

  // 🆕 Disable months for END picker
  const disabledEndMonth = useCallback((current) => {
    if (!current) return false;
    
    const monthStr = current.format('YYYY-MM');
    
    // Phải có lịch
    if (!availableMonths.includes(monthStr)) {
      return true;
    }
    
    // Phải >= tháng bắt đầu (nếu đã chọn)
    if (filterMonthRange && filterMonthRange[0]) {
      if (current.isBefore(filterMonthRange[0], 'month')) {
        return true;
      }
    }
    
    // Phải <= tháng cuối cùng có lịch
    if (maxAvailableMonth && current.isAfter(maxAvailableMonth, 'month')) {
      return true;
    }
    
    return false;
  }, [availableMonths, filterMonthRange, maxAvailableMonth]);

  // Columns definition
  const columns = [
    {
      title: 'Phòng',
      dataIndex: 'roomName',
      key: 'roomName',
      width: 200,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.subRoom && (
            <Space size={4} align="center">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.subRoom.name}
              </Text>
              <Tag 
                color={record.subRoom.isActiveSubRoom !== false ? 'green' : 'red'} 
                style={{ fontSize: '10px', padding: '0 4px', margin: 0, lineHeight: '16px' }}
              >
                {record.subRoom.isActiveSubRoom !== false ? 'Bật' : 'Tắt'}
              </Tag>
            </Space>
          )}
          {record.roomNumber && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Số phòng: {record.roomNumber}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Tháng/Năm',
      dataIndex: 'month',
      key: 'monthYear',
      width: 120,
      render: (month, record) => (
        <Tag color="cyan" icon={<CalendarOutlined />}>
          {month}/{record.year}
        </Tag>
      )
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 130,
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 130,
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Ca đã tạo',
      dataIndex: 'generatedShifts',
      key: 'generatedShifts',
      width: 200,
      render: (shifts) => {
        if (!shifts || shifts.length === 0) {
          return <Text type="secondary">Chưa có ca nào</Text>;
        }
        return (
          <Space wrap>
            {shifts.map(shift => (
              <Tag 
                key={shift.key} 
                color={SHIFT_COLORS[shift.key]}
                icon={<CheckCircleOutlined />}
              >
                {shift.name}
              </Tag>
            ))}
          </Space>
        );
      }
    },
    {
      title: 'Ca thiếu',
      dataIndex: 'missingShifts',
      key: 'missingShifts',
      width: 200,
      render: (shifts, record) => {
        if (!shifts || shifts.length === 0) {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Đầy đủ
            </Tag>
          );
        }

        // Check if expired
        if (record.isExpired) {
          return (
            <Tag color="default" icon={<CloseCircleOutlined />}>
              Đã hết hạn
            </Tag>
          );
        }

        return (
          <Space wrap>
            {shifts.map(shift => (
              <Tag 
                key={shift.key} 
                color="orange"
                icon={<CloseCircleOutlined />}
              >
                {shift.name}
              </Tag>
            ))}
          </Space>
        );
      }
    },
    {
      title: 'Ca tắt',
      dataIndex: 'disabledShifts',
      key: 'disabledShifts',
      width: 180,
      render: (shifts, record) => {
        if (!shifts || shifts.length === 0) {
          return <Text type="secondary">Không có</Text>;
        }
        return (
          <Space wrap>
            {shifts.map(shift => (
              <Tag 
                key={shift.key} 
                color="default"
                icon={<CloseCircleOutlined />}
              >
                {shift.name}
              </Tag>
            ))}
          </Space>
        );
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isComplete',
      key: 'status',
      width: 120,
      render: (isComplete, record) => {
        if (record.isExpired) {
          return <Tag color="default">Đã hết hạn</Tag>;
        }
        if (isComplete) {
          return <Tag color="success">Hoàn thành</Tag>;
        }
        return <Tag color="warning">Chưa đầy đủ</Tag>;
      }
    },
    {
      title: 'Hoạt động',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => {
        if (isActive === false) {
          return <Tag color="error" icon={<CloseCircleOutlined />}>Đã tắt</Tag>;
        }
        return <Tag color="success" icon={<CheckCircleOutlined />}>Bật</Tag>;
      }
    }
  ];

  // Summary statistics
  const statistics = useMemo(() => {
    const total = filteredSchedules.length;
    const complete = filteredSchedules.filter(s => s.isComplete).length;
    const incomplete = filteredSchedules.filter(s => !s.isComplete && !s.isExpired).length;
    const expired = filteredSchedules.filter(s => s.isExpired).length;

    return { total, complete, incomplete, expired };
  }, [filteredSchedules]);

  return (
    <Modal
      title={
        <Space>
          <CalendarOutlined />
          <span>
            {isViewingAll 
              ? `Danh sách lịch tất cả các phòng (${selectedRooms.length} phòng)`
              : `Danh sách lịch các phòng đã chọn (${selectedRooms.length} phòng)`
            }
          </span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={'97%'}
      footer={null}
      destroyOnClose
      bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
    >
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <div style={{ 
            padding: '12px', 
            background: '#f0f5ff', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
              {statistics.total}
            </div>
            <div style={{ color: '#666' }}>Tổng lịch</div>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ 
            padding: '12px', 
            background: '#f6ffed', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
              {statistics.complete}
            </div>
            <div style={{ color: '#666' }}>Hoàn thành</div>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ 
            padding: '12px', 
            background: '#fffbe6', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
              {statistics.incomplete}
            </div>
            <div style={{ color: '#666' }}>Chưa đầy đủ</div>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ 
            padding: '12px', 
            background: '#f5f5f5', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#999' }}>
              {statistics.expired}
            </div>
            <div style={{ color: '#666' }}>Đã hết hạn</div>
          </div>
        </Col>
      </Row>

      <Divider />

      {/* Filters */}
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }} size="middle">
        {/* Row 1: Room filter + Status filter */}
        <Row gutter={16}>
          <Col span={12}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Lọc theo phòng:</Text>
            <Select
              style={{ width: '100%' }}
              placeholder="Chọn phòng..."
              allowClear
              value={filterRoom}
              onChange={setFilterRoom}
              showSearch
              filterOption={(input, option) => {
                const searchText = input.toLowerCase();
                const room = selectedRooms.find(r => r._id === option.value);
                if (!room) return false;
                const roomName = (room.name || '').toLowerCase();
                const roomNumber = (room.roomNumber || '').toLowerCase();
                return roomName.includes(searchText) || roomNumber.includes(searchText);
              }}
            >
              {selectedRooms.map(room => (
                <Option key={room._id} value={room._id}>
                  {room.name} {room.roomNumber ? `(${room.roomNumber})` : ''}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={12}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Lọc theo trạng thái:</Text>
            <Radio.Group 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              buttonStyle="solid"
              style={{ width: '100%' }}
            >
              <Radio.Button value="all" style={{ width: '33.33%', textAlign: 'center' }}>
                Tất cả ({preFilteredSchedules.length})
              </Radio.Button>
              <Radio.Button value="complete" style={{ width: '33.33%', textAlign: 'center' }}>
                Hoàn thành ({preFilteredSchedules.filter(s => s.isComplete && !s.isExpired).length})
              </Radio.Button>
              <Radio.Button value="incomplete" style={{ width: '33.33%', textAlign: 'center' }}>
                Chưa đầy đủ ({preFilteredSchedules.filter(s => !s.isComplete && !s.isExpired).length})
              </Radio.Button>
            </Radio.Group>
          </Col>
        </Row>

        {/* Row 2: Month range filter */}
        <Row gutter={16}>
          <Col span={12}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Từ tháng/năm:
              {availableMonths.length > 0 && minAvailableMonth && (
                <Text type="secondary" style={{ fontSize: '12px', marginLeft: 8 }}>
                  (Có lịch từ {minAvailableMonth.format('MM/YYYY')})
                </Text>
              )}
            </Text>
            <DatePicker
              picker="month"
              format="MM/YYYY"
              style={{ width: '100%' }}
              placeholder="Chọn tháng bắt đầu"
              allowClear
              value={filterMonthRange ? filterMonthRange[0] : null}
              disabledDate={disabledStartMonth}
              onChange={(date) => {
                if (!date) {
                  setFilterMonthRange(null);
                } else if (filterMonthRange && filterMonthRange[1]) {
                  // Nếu đã có end date, kiểm tra valid
                  if (date.isAfter(filterMonthRange[1], 'month')) {
                    // Start > End → Reset end
                    setFilterMonthRange([date, null]);
                  } else {
                    setFilterMonthRange([date, filterMonthRange[1]]);
                  }
                } else {
                  setFilterMonthRange([date, null]);
                }
              }}
            />
          </Col>
          <Col span={12}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Đến tháng/năm:
              {availableMonths.length > 0 && maxAvailableMonth && (
                <Text type="secondary" style={{ fontSize: '12px', marginLeft: 8 }}>
                  (Có lịch đến {maxAvailableMonth.format('MM/YYYY')})
                </Text>
              )}
            </Text>
            <DatePicker
              picker="month"
              format="MM/YYYY"
              style={{ width: '100%' }}
              placeholder="Chọn tháng kết thúc"
              allowClear
              value={filterMonthRange && filterMonthRange[1] ? filterMonthRange[1] : null}
              disabledDate={disabledEndMonth}
              disabled={!filterMonthRange || !filterMonthRange[0]} // Phải chọn start trước
              onChange={(date) => {
                if (!date && filterMonthRange) {
                  setFilterMonthRange([filterMonthRange[0], null]);
                } else if (filterMonthRange && filterMonthRange[0]) {
                  setFilterMonthRange([filterMonthRange[0], date]);
                }
              }}
            />
          </Col>
        </Row>
      </Space>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredSchedules}
        rowKey={(record) => `${record.roomId}-${record.scheduleId || record.month}-${record.year}`}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} lịch`
        }}
        locale={{
          emptyText: (
            <Empty
              description="Không có lịch nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )
        }}
        scroll={{ 
          x: 1200,
          y: 'calc(100vh - 550px)'
        }}
      />
    </Modal>
  );
};

export default BulkRoomScheduleModal;

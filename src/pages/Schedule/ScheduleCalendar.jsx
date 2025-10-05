/**
 * @author: HoTram
 *  
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Card, Row, Col, Typography, Button, Space, Select, DatePicker, 
  Table, Tag, Spin, Empty, Divider, Badge, List, Avatar, Tooltip,
  Switch, Tabs
} from 'antd';
import { 
  CalendarOutlined, UserOutlined, HomeOutlined, ClockCircleOutlined,
  LeftOutlined, RightOutlined, ReloadOutlined, EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { scheduleService } from '../../services';
import { roomService } from '../../services';
import { userService } from '../../services';
import scheduleConfigService from '../../services/scheduleConfigService.js';
import { toast } from '../../services/toastService.js';
import './ScheduleCalendar.css';

const { Title, Text } = Typography;
const { Option } = Select;

const ScheduleCalendar = () => {
  // View mode state
  const [viewMode, setViewMode] = useState('room'); // 'room' or 'dentist'
  
  // Room/Dentist selection
  const [rooms, setRooms] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedSubRoom, setSelectedSubRoom] = useState(null);
  const [selectedDentist, setSelectedDentist] = useState(null);
  
  // Calendar state
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('week'));
  const [schedules, setSchedules] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Work shifts from config API
  const [workShifts, setWorkShifts] = useState([]);
  
  // Selected slot details
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotDetailsVisible, setSlotDetailsVisible] = useState(false);

  // Load initial data
  useEffect(() => {
    loadRooms();
    loadDentists();
    loadWorkShifts();
  }, []);

  const loadRooms = async () => {
    try {
      const res = await roomService.getRooms(1, 100);
      if (res?.success) {
        setRooms(res.data?.rooms || []);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      toast.error('Không thể tải danh sách phòng');
    }
  };

  const loadDentists = async () => {
    try {
      const res = await userService.getAllStaff(1, 100);
      if (res?.success) {
        const dentistList = res.data?.users?.filter(user => 
          user.role === 'dentist' || user.role === 'doctor'
        ) || [];
        setDentists(dentistList);
      }
    } catch (error) {
      console.error('Error loading dentists:', error);
      toast.error('Không thể tải danh sách nha sĩ');
    }
  };

  const loadScheduleData = useCallback(async () => {
    if (viewMode === 'room' && !selectedRoom) return;
    if (viewMode === 'dentist' && !selectedDentist) return;

    setLoading(true);
    try {
      const startDate = currentWeek.format('YYYY-MM-DD');
      const endDate = currentWeek.add(6, 'day').format('YYYY-MM-DD');

      if (viewMode === 'room') {
        // Load schedules for room
        const scheduleRes = await scheduleService.getSchedulesByRoomWithParams(
          selectedRoom.id, startDate, endDate
        );
        if (scheduleRes?.success) {
          setSchedules(scheduleRes.data || []);
        }

        // Load slots for room/subroom
        const slotsRes = await scheduleService.getSlotsByRoom(
          selectedRoom.id, selectedSubRoom?.id, startDate, endDate
        );
        if (slotsRes?.success) {
          setSlots(slotsRes.data || []);
        }
      } else if (viewMode === 'dentist') {
        // Load slots for dentist
        const slotsRes = await scheduleService.getSlotsByDentist(
          selectedDentist.id, startDate, endDate
        );
        if (slotsRes?.success) {
          setSlots(slotsRes.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading schedule data:', error);
      toast.error('Không thể tải dữ liệu lịch');
    } finally {
      setLoading(false);
    }
  }, [viewMode, selectedRoom, selectedSubRoom, selectedDentist, currentWeek]);

  // Reload when selection or week changes
  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  // Generate week days
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(currentWeek.add(i, 'day'));
    }
    return days;
  }, [currentWeek]);

  // Lấy work shifts từ config API
  const loadWorkShifts = async () => {
    try {
      const response = await scheduleConfigService.getConfig();
      const configData = response.data || response;
      const shifts = [
        configData.morningShift && { 
          name: 'Ca Sáng', 
          startTime: configData.morningShift.startTime, 
          endTime: configData.morningShift.endTime 
        },
        configData.afternoonShift && { 
          name: 'Ca Chiều', 
          startTime: configData.afternoonShift.startTime, 
          endTime: configData.afternoonShift.endTime 
        },
        configData.eveningShift && { 
          name: 'Ca Tối', 
          startTime: configData.eveningShift.startTime, 
          endTime: configData.eveningShift.endTime 
        }
      ].filter(Boolean); // Remove null/undefined shifts
      
      setWorkShifts(shifts);
    } catch (error) {
      console.error('Error loading work shifts:', error);
    }
  };

  // Get schedule for specific date
  const getScheduleForDate = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    return schedules.find(s => s.dateVNStr === dateStr);
  };

  // Get slots for specific date and shift
  const getSlotsForDateShift = (date, shift) => {
    const dateStr = date.format('YYYY-MM-DD');
    return slots.filter(slot => 
      slot.date === dateStr && 
      slot.shiftName === shift.name
    );
  };

  // Handle slot click
  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    setSlotDetailsVisible(true);
  };

  // Navigation handlers
  const goToPreviousWeek = () => {
    setCurrentWeek(prev => prev.subtract(1, 'week'));
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => prev.add(1, 'week'));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(dayjs().startOf('week'));
  };

  // Render room/subroom selector
  const RoomSelector = () => (
    <Space wrap>
      <Select
        style={{ width: 200 }}
        placeholder="Chọn phòng"
        value={selectedRoom?.id}
        onChange={(roomId) => {
          const room = rooms.find(r => r._id === roomId);
          setSelectedRoom({ id: roomId, ...room });
          setSelectedSubRoom(null); // Reset subroom
        }}
      >
        {rooms.map(room => (
          <Option key={room._id} value={room._id}>
            <HomeOutlined style={{ marginRight: 8 }} />
            {room.name}
          </Option>
        ))}
      </Select>

      {selectedRoom && selectedRoom.hasSubRooms && selectedRoom.subRooms?.length > 0 && (
        <Select
          style={{ width: 200 }}
          placeholder="Chọn phòng con"
          value={selectedSubRoom?.id}
          onChange={(subRoomId) => {
            const subRoom = selectedRoom.subRooms.find(sr => sr._id === subRoomId);
            setSelectedSubRoom({ id: subRoomId, ...subRoom });
          }}
        >
          {selectedRoom.subRooms.map(subRoom => (
            <Option key={subRoom._id} value={subRoom._id}>
              {subRoom.name}
            </Option>
          ))}
        </Select>
      )}
    </Space>
  );

  // Render dentist selector
  const DentistSelector = () => (
    <Select
      style={{ width: 200 }}
      placeholder="Chọn nha sĩ"
      value={selectedDentist?.id}
      onChange={(dentistId) => {
        const dentist = dentists.find(d => d._id === dentistId);
        setSelectedDentist({ id: dentistId, ...dentist });
      }}
    >
      {dentists.map(dentist => (
        <Option key={dentist._id} value={dentist._id}>
          <UserOutlined style={{ marginRight: 8 }} />
          {dentist.firstName} {dentist.lastName}
        </Option>
      ))}
    </Select>
  );

  // Render slot details sidebar
  const SlotDetailsSidebar = () => (
    <Card 
      title="Chi tiết slot"
      size="small"
      style={{ height: '100%' }}
      extra={
        <Button 
          size="small" 
          onClick={() => setSlotDetailsVisible(false)}
        >
          Đóng
        </Button>
      }
    >
      {selectedSlot ? (
        <List
          size="small"
          dataSource={[
            { label: 'Ngày', value: selectedSlot.date },
            { label: 'Ca làm việc', value: selectedSlot.shiftName },
            { label: 'Thời gian', value: `${selectedSlot.startTime} - ${selectedSlot.endTime}` },
            { label: 'Phòng', value: selectedSlot.roomName },
            { label: 'Nha sĩ', value: selectedSlot.dentistName || 'Chưa phân công' },
            { label: 'Y tá', value: selectedSlot.nurseName || 'Chưa phân công' },
            { label: 'Bệnh nhân', value: selectedSlot.patientName || 'Trống' },
            { label: 'Trạng thái', value: selectedSlot.status || 'Available' }
          ]}
          renderItem={(item) => (
            <List.Item>
              <Text strong>{item.label}:</Text>
              <Text style={{ marginLeft: 8 }}>{item.value}</Text>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="Chọn một slot để xem chi tiết" />
      )}
    </Card>
  );

  // Render calendar cell
  const CalendarCell = ({ date, shift }) => {
    const schedule = getScheduleForDate(date);
    const daySlots = getSlotsForDateShift(date, shift);
    const hasSchedule = schedule && schedule.workShifts.some(ws => 
      ws.name === shift.name && ws.isActive
    );

    if (!hasSchedule) {
      return (
        <div className="calendar-cell empty">
          <Text type="secondary">Không có lịch</Text>
        </div>
      );
    }

    return (
      <div className="calendar-cell">
        <div className="cell-header">
          <Text strong>{shift.name}</Text>
          <Badge count={daySlots.length} />
        </div>
        <div className="cell-content">
          {daySlots.length > 0 ? (
            daySlots.slice(0, 3).map((slot, index) => (
              <div
                key={index}
                className="slot-item"
                onClick={() => handleSlotClick(slot)}
              >
                <div className="slot-time">
                  {slot.startTime} - {slot.endTime}
                </div>
                <div className="slot-info">
                  {slot.dentistName && (
                    <Tag color="blue" size="small">
                      {slot.dentistName}
                    </Tag>
                  )}
                  {slot.patientName && (
                    <Tag color="green" size="small">
                      {slot.patientName}
                    </Tag>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="slot-empty">
              <Text type="secondary">Chưa có slot</Text>
            </div>
          )}
          {daySlots.length > 3 && (
            <div className="slot-more">
              <Text type="secondary">+{daySlots.length - 3} slot khác</Text>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="schedule-calendar">
      {/* Header */}
      <div className="calendar-header">
        <Title level={3}>
          <CalendarOutlined style={{ marginRight: 8 }} />
          Lịch Làm Việc
        </Title>

        {/* View Mode Selector */}
        <div className="view-mode-selector">
          <Switch
            checkedChildren="Theo nha sĩ"
            unCheckedChildren="Theo phòng"
            checked={viewMode === 'dentist'}
            onChange={(checked) => setViewMode(checked ? 'dentist' : 'room')}
          />
        </div>
      </div>

      <Row gutter={16}>
        {/* Main Calendar */}
        <Col span={slotDetailsVisible ? 18 : 24}>
          <Card>
            {/* Controls */}
            <div className="calendar-controls">
              <Space>
                {viewMode === 'room' ? <RoomSelector /> : <DentistSelector />}
                <Divider type="vertical" />
                <Button icon={<LeftOutlined />} onClick={goToPreviousWeek} />
                <Button onClick={goToCurrentWeek}>Tuần hiện tại</Button>
                <Button icon={<RightOutlined />} onClick={goToNextWeek} />
                <Divider type="vertical" />
                <Text strong>
                  {currentWeek.format('DD/MM')} - {currentWeek.add(6, 'day').format('DD/MM/YYYY')}
                </Text>
                <Button icon={<ReloadOutlined />} onClick={loadScheduleData} loading={loading} />
              </Space>
            </div>

            {/* Calendar Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>Đang tải lịch...</div>
              </div>
            ) : (
              <div className="calendar-grid">
                {/* Header Row */}
                <div className="calendar-header-row">
                  <div className="time-column">Ca làm việc</div>
                  {weekDays.map(day => (
                    <div key={day.format('YYYY-MM-DD')} className="day-column">
                      <div className="day-header">
                        <div className="day-name">{day.format('ddd')}</div>
                        <div className="day-date">{day.format('DD/MM')}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shift Rows */}
                {workShifts.length > 0 ? workShifts.map(shift => (
                  <div key={shift.name} className="calendar-row">
                    <div className="time-column">
                      <div className="shift-info">
                        <Text strong>{shift.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {shift.startTime} - {shift.endTime}
                        </Text>
                      </div>
                    </div>
                    {weekDays.map(day => (
                      <div key={day.format('YYYY-MM-DD')} className="day-column">
                        <CalendarCell date={day} shift={shift} />
                      </div>
                    ))}
                  </div>
                )) : (
                  <div className="calendar-row">
                    <div style={{ padding: 20, textAlign: 'center', gridColumn: '1 / -1' }}>
                      <Text type="secondary">Đang tải ca làm việc...</Text>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </Col>

        {/* Slot Details Sidebar */}
        {slotDetailsVisible && (
          <Col span={6}>
            <SlotDetailsSidebar />
          </Col>
        )}
      </Row>
    </div>
  );
};

export default ScheduleCalendar;
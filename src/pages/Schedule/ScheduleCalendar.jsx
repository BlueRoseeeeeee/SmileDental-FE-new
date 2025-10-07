/**
 * @author: HoTram
 *  
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Card, Row, Col, Typography, Button, Space, Select, Tag, Spin, Empty, Divider, Badge,
  Tabs,
} from 'antd';
import { 
  CalendarOutlined, UserOutlined, HomeOutlined,
  LeftOutlined, RightOutlined, MedicineBoxOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);
import { roomService, scheduleConfigService } from '../../services';
import { userService } from '../../services';
import slotService from '../../services/slotService.js';
import { toast } from '../../services/toastService.js';
import './ScheduleCalendar.css';

const { Title, Text } = Typography;
const { Option } = Select;

const ScheduleCalendar = () => {
  // View mode state
  const [viewMode, setViewMode] = useState('room'); // 'room', 'dentist', or 'nurse'
  
  // Room/Dentist/Nurse selection
  const [rooms, setRooms] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedSubRoom, setSelectedSubRoom] = useState(null);
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [selectedNurse, setSelectedNurse] = useState(null);
  
  // Schedule config for shift times
  const [scheduleConfig, setScheduleConfig] = useState(null);
  
  // Calendar state - Tuần bắt đầu từ Thứ 2 (ISO Week)
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('isoWeek'));
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);

  // Load initial data
  useEffect(() => {
    loadRooms();
    loadStaff();
    loadScheduleConfig();
  }, []);

  const loadScheduleConfig = async () => {
    try {
      const res = await scheduleConfigService.getConfig();
      if (res?.success && res?.data) {
        setScheduleConfig(res.data);
      }
    } catch (error) {
      console.error('Error loading schedule config:', error);
    }
  };

  const loadRooms = async () => {
    try {
      const res = await roomService.getRooms(1, 100);
      
      // Room API không có field success, chỉ cần check có data giống StaffAssignment
      if (res?.rooms && Array.isArray(res.rooms)) {
        setRooms(res.rooms);
      } else {
        toast.error('Dữ liệu phòng không hợp lệ');
      }
    } catch (error) {
      toast.error(`Lỗi tải phòng: ${error.response?.status || error.message}`);
    }
  };

  const loadStaff = async () => {
    try {
      const res = await userService.getAllStaff(1, 100);
      
      if (res?.success) {
        const allStaff = res.users || [];
        const dentistList = allStaff.filter(user => 
          (user.role === 'dentist' || user.role === 'doctor') && user.isActive === true
        );
        const nurseList = allStaff.filter(user => 
          user.role === 'nurse' && user.isActive === true
        );
        setDentists(dentistList);
        setNurses(nurseList);
      } else {
        toast.error('API nhân viên trả về không thành công');
      }
    } catch (error) {
      toast.error(`Lỗi tải nhân viên: ${error.response?.status || error.message}`);
    }
  };

  const loadScheduleData = useCallback(async () => {
    if (viewMode === 'room' && !selectedRoom) {
      return;
    }
    if (viewMode === 'dentist' && !selectedDentist) {
      return;
    }
    if (viewMode === 'nurse' && !selectedNurse) {
      return;
    }

    setLoading(true);
    try {
      if (viewMode === 'room') {
        const params = {
          viewType: 'week',
          page: currentPage,
          startDate: currentWeek.format('YYYY-MM-DD')
        };
        
        // Add subroom if selected
        if (selectedSubRoom) {
          params.subRoomId = selectedSubRoom.id;
        }

        const response = await slotService.getRoomCalendar(selectedRoom.id, params);
        
        if (response?.success) {
          setCalendarData(response.data);
        } else {
          console.error('API returned error:', response);
          toast.error('API trả về lỗi');
          setCalendarData(null);
        }
      } else if (viewMode === 'dentist') {
        const params = {
          viewType: 'week',
          page: currentPage,
          startDate: currentWeek.format('YYYY-MM-DD'),
          limit: 1
        };
        
        const response = await slotService.getDentistCalendar(selectedDentist.id, params);
        
        console.log('🔍 Dentist Calendar Response:', response);
        console.log('🔍 Response.data:', response?.data);
        console.log('🔍 Response.data.periods:', response?.data?.periods);
        
        if (response?.success) {
          setCalendarData(response.data);
        } else {
          toast.error('Không thể tải lịch nha sĩ');
          setCalendarData(null);
        }
      } else if (viewMode === 'nurse') {
        const params = {
          viewType: 'week',
          page: currentPage,
          startDate: currentWeek.format('YYYY-MM-DD'),
          limit: 1
        };
        
        const response = await slotService.getNurseCalendar(selectedNurse.id, params);
        
        console.log('🔍 Nurse Calendar Response:', response);
        console.log('🔍 Response.data:', response?.data);
        console.log('🔍 Response.data.periods:', response?.data?.periods);
        
        if (response?.success) {
          setCalendarData(response.data);
        } else {
          toast.error('Không thể tải lịch y tá');
          setCalendarData(null);
        }
      }
    } catch (error) {
      console.error('Error loading schedule data:', error);
      toast.error(`Không thể tải dữ liệu lịch: ${error.message}`);
      setCalendarData(null);
    } finally {
      setLoading(false);
    }
  }, [viewMode, selectedRoom, selectedSubRoom, selectedDentist, selectedNurse, currentWeek, currentPage]);

  // Reload when selection or week changes
  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  // Tạo lịch hiển thị cố định từ T2->CN (ISO Week)
  const weekDays = useMemo(() => {
    const days = [];
    let startOfWeek;
    

    if (calendarData?.periods?.[0]?.startDate) {
      startOfWeek = dayjs(calendarData.periods[0].startDate).startOf('isoWeek');
    } else {
      // Fallback về current week
      startOfWeek = currentWeek.startOf('isoWeek');
    }
    
    // Luôn tạo đủ 7 ngày từ T2->CN
    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.add(i, 'day'));
    }
    return days;
  }, [currentWeek, calendarData]);

  // Extract shift overview from calendar data
  // Room calendar has shiftOverview field, dentist/nurse calendar needs to extract from days
  const shiftOverview = useMemo(() => {
    if (calendarData?.shiftOverview) {
      return calendarData.shiftOverview;
    }
    
    // For dentist/nurse calendar, extract shift names from data and use scheduleConfig for times
    if (calendarData?.periods?.[0]?.days?.[0]?.shifts && scheduleConfig) {
      const firstDayShifts = calendarData.periods[0].days[0].shifts;
      const overview = {};
      
      // Map shift names to scheduleConfig
      const shiftMapping = {
        'Ca Sáng': {
          startTime: scheduleConfig.morningShift?.startTime || '--:--',
          endTime: scheduleConfig.morningShift?.endTime || '--:--',
          isActive: scheduleConfig.morningShift?.isActive !== false
        },
        'Ca Chiều': {
          startTime: scheduleConfig.afternoonShift?.startTime || '--:--',
          endTime: scheduleConfig.afternoonShift?.endTime || '--:--',
          isActive: scheduleConfig.afternoonShift?.isActive !== false
        },
        'Ca Tối': {
          startTime: scheduleConfig.eveningShift?.startTime || '--:--',
          endTime: scheduleConfig.eveningShift?.endTime || '--:--',
          isActive: scheduleConfig.eveningShift?.isActive !== false
        }
      };
      
      // Create shift overview using config data
      Object.keys(firstDayShifts).forEach(shiftName => {
        overview[shiftName] = {
          name: shiftName,
          startTime: shiftMapping[shiftName]?.startTime || '--:--',
          endTime: shiftMapping[shiftName]?.endTime || '--:--',
          isActive: shiftMapping[shiftName]?.isActive !== false
        };
      });
      
      return overview;
    }
    
    return null;
  }, [calendarData, scheduleConfig]);

  const getDayData = (date) => {
    if (!calendarData?.periods?.[0]?.days) return null;
    const dateStr = date.format('YYYY-MM-DD');
    return calendarData.periods[0].days.find(day => day.date === dateStr);
  };

  // Get shift data for specific date and shift
  const getShiftData = (date, shift) => {
    const dayData = getDayData(date);
    return dayData?.shifts?.[shift.name] || null;
  };

  // Navigation handlers - ISO Week (Thứ 2 đến Chủ Nhật)
  const goToPreviousWeek = () => {
    setCurrentPage(prev => prev - 1); // Trang giảm = về quá khứ (có thể âm)
  };

  const goToNextWeek = () => {
    setCurrentPage(prev => prev + 1); // Trang tăng = về tương lai
  };

  const goToCurrentWeek = () => {
    setCurrentPage(1);
    setCurrentWeek(dayjs().startOf('isoWeek'));
  };


  
  // cho  phép hiển thị tuần trước
  const canGoPrevious = true;
  
  // Check if we can go to next week (tương lai)- case này thì lịch phải được tạo
  const canGoNext = calendarData?.pagination?.hasNext !== false;

  // Render room/subroom selector
  const RoomSelector = () => (
    <Space wrap>
      <Select
        style={{ width: 300 }}
        placeholder={rooms.length > 0 ? "Chọn phòng" : "Đang tải phòng..."}
        value={selectedRoom?.id}
        loading={rooms.length === 0}
        disabled={rooms.length === 0}
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
          style={{ width: 250 }}
          placeholder="Chọn phòng con (tuỳ chọn)"
          value={selectedSubRoom?.id}
          allowClear
          onChange={(subRoomId) => {
            if (subRoomId) {
              const subRoom = selectedRoom.subRooms.find(sr => sr._id === subRoomId);
              setSelectedSubRoom({ id: subRoomId, ...subRoom });
            } else {
              setSelectedSubRoom(null);
            }
          }}
        >
          {selectedRoom.subRooms.map(subRoom => (
            <Option key={subRoom._id} value={subRoom._id}>
              {subRoom.name}
            </Option>
          ))}
        </Select>
      )}
      
      {selectedRoom && !selectedRoom.hasSubRooms && (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Phòng đơn - không có phòng con
        </Text>
      )}
    </Space>
  );

  // Render dentist selector
  const DentistSelector = () => (
    <Select
      style={{ width: 300 }}
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
          {dentist.fullName}
        </Option>
      ))}
    </Select>
  );

  // Render nurse selector
  const NurseSelector = () => (
    <Select
      style={{ width: 300 }}
      placeholder="Chọn y tá"
      value={selectedNurse?.id}
      onChange={(nurseId) => {
        const nurse = nurses.find(n => n._id === nurseId);
        setSelectedNurse({ id: nurseId, ...nurse });
      }}
    >
      {nurses.map(nurse => (
        <Option key={nurse._id} value={nurse._id}>
          <MedicineBoxOutlined style={{ marginRight: 8 }} />
          {nurse.fullName}
        </Option>
      ))}
    </Select>
  );

  // Render calendar cell
  const CalendarCell = ({ date, shift }) => {
    const shiftData = getShiftData(date, shift);
    const isShiftActive = shift.isActive;

    if (!isShiftActive) {
      return (
        <div className="calendar-cell empty">
          <Text type="secondary">Ngừng hoạt động</Text>
        </div>
      );
    }

    if (!shiftData) {
      return (
        <div className="calendar-cell empty">
          <Text type="secondary"></Text>
        </div>
      );
    }

    // Room calendar shows staff info
    const hasDentist = shiftData.staffStats?.mostFrequentDentist;
    const hasNurse = shiftData.staffStats?.mostFrequentNurse;
    
    // Dentist/Nurse calendar shows room info
    const mostFrequentRoom = shiftData.mostFrequentRoom;

    return (
      <div className="calendar-cell">
        <div className="cell-content">
          <div className="cell-stats">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Cuộc hẹn: {shiftData.appointmentCount}/{shiftData.totalSlots}
            </Text>
          </div>
          
          {/* For Room view: Show Staff Assignment Status */}
          {viewMode === 'room' && (
            <>
              <div className="cell-staff">
                {hasDentist ? (
                  <div style={{ marginBottom: 4 }}>
                    <Tag color="blue" size="small">
                      NS:
                    </Tag>
                    <div style={{ fontSize: '10px', color: '#666', marginTop: 2 }}>
                      {shiftData.staffStats.mostFrequentDentist.employeeCode} - {shiftData.staffStats.mostFrequentDentist.fullName}
                    </div>
                  </div>
                ) : (
                  <Tag color="orange" size="small">
                    NS: Chưa phân công
                  </Tag>
                )}
              </div>
              
              <div className="cell-staff">
                {hasNurse ? (
                  <div style={{ marginBottom: 4 }}>
                    <Tag color="green" size="small">
                      YT: 
                    </Tag>
                    <div style={{ fontSize: '10px', color: '#666', marginTop: 2 }}>
                      {shiftData.staffStats.mostFrequentNurse.employeeCode} - {shiftData.staffStats.mostFrequentNurse.fullName}
                    </div>
                  </div>
                ) : (
                  <Tag color="orange" size="small">
                    YT: Chưa phân công
                  </Tag>
                )}
              </div>
            </>
          )}

          {/* For Dentist/Nurse view: Show Most Frequent Room */}
          {(viewMode === 'dentist' || viewMode === 'nurse') && (
            <div className="cell-staff">
              {mostFrequentRoom ? (
                <div style={{ marginBottom: 4 }}>
                  <Tag color="cyan" size="small">
                    <HomeOutlined style={{ fontSize: '10px' }} />
                  </Tag>
                  <div style={{ fontSize: '11px', color: '#333', marginTop: 2 }}>
                    {mostFrequentRoom.name}
                  </div>
                  {mostFrequentRoom.subRoom && (
                    <div style={{ fontSize: '10px', color: '#999', marginTop: 1 }}>
                      {mostFrequentRoom.subRoom.name}
                    </div>
                  )}
                </div>
              ) : (
                <Tag color="default" size="small">
                  Chưa phân công
                </Tag>
              )}
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
      </div>

      <Row gutter={16}>
        {/* Main Calendar */}
        <Col span={24}>
          <Card>
            {/* View Mode Tabs */}
            <Tabs
              activeKey={viewMode}
              onChange={(key) => {
                setViewMode(key);
                setCalendarData(null);
              }}
              items={[
                {
                  key: 'room',
                  label: (
                    <span>
                      <HomeOutlined />
                      Theo Phòng
                    </span>
                  ),
                },
                {
                  key: 'dentist',
                  label: (
                    <span>
                      <UserOutlined />
                      Theo Nha Sĩ
                    </span>
                  ),
                },
                {
                  key: 'nurse',
                  label: (
                    <span>
                      <MedicineBoxOutlined />
                      Theo Y Tá
                    </span>
                  ),
                },
              ]}
            />
            
            {/* Info Display - Room/Dentist/Nurse */}
            {viewMode === 'room' && calendarData?.roomInfo && (
              <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                <Space>
                  <HomeOutlined />
                  <Text strong>{calendarData.roomInfo.name}</Text>
                  {calendarData.roomInfo.subRoom && (
                    <>
                      <Text type="secondary">&gt;</Text>
                      <Text>{calendarData.roomInfo.subRoom.name}</Text>
                    </>
                  )}
                  {calendarData.roomInfo.hasSubRooms && !calendarData.roomInfo.subRoom && (
                    <Tag color="blue">Có phòng con</Tag>
                  )}
                </Space>
              </div>
            )}

            {viewMode === 'dentist' && selectedDentist && (
              <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 8 }}>
                <Space>
                  <UserOutlined style={{ color: '#1890ff' }} />
                  <Text strong>Nha sĩ: {selectedDentist.name || selectedDentist.fullName}</Text>
                  {selectedDentist.email && (
                    <>
                      <Text type="secondary">•</Text>
                      <Text type="secondary">{selectedDentist.email}</Text>
                    </>
                  )}
                </Space>
              </div>
            )}

            {viewMode === 'nurse' && selectedNurse && (
              <div style={{ marginBottom: 16, padding: 12, background: '#f6ffed', borderRadius: 8 }}>
                <Space>
                  <MedicineBoxOutlined style={{ color: '#52c41a' }} />
                  <Text strong>Y tá: {selectedNurse.name || selectedNurse.fullName}</Text>
                  {selectedNurse.email && (
                    <>
                      <Text type="secondary">•</Text>
                      <Text type="secondary">{selectedNurse.email}</Text>
                    </>
                  )}
                </Space>
              </div>
            )}

            {/* Controls */}
            <div className="calendar-controls">
              <Space wrap>
                {viewMode === 'room' && <RoomSelector />}
                {viewMode === 'dentist' && <DentistSelector />}
                {viewMode === 'nurse' && <NurseSelector />}
                
                {/* Show navigation only when selection is made */}
                {((viewMode === 'room' && selectedRoom) || (viewMode === 'dentist' && selectedDentist) || (viewMode === 'nurse' && selectedNurse)) ? (
                  <>
                    <Divider type="vertical" />
                    <Button 
                      icon={<LeftOutlined />} 
                      onClick={goToPreviousWeek}
                      disabled={!canGoPrevious}
                    >
                      Tuần trước
                    </Button>
                    <Button onClick={goToCurrentWeek}>Tuần hiện tại</Button>
                    <Button 
                      icon={<RightOutlined />} 
                      onClick={goToNextWeek}
                      disabled={!canGoNext}
                    >
                      Tuần sau
                    </Button>
                    <Divider type="vertical" />
                    <Text strong>
                      {calendarData?.periods?.[0] 
                        ? `${dayjs(calendarData.periods[0].startDate).format('DD/MM')} - ${dayjs(calendarData.periods[0].endDate).format('DD/MM/YYYY')}`
                        : 'Đang tải...'
                      }
                    </Text>
                  </>
                ) : (
                  <Text type="secondary" style={{ marginLeft: 16 }}>
                    Vui lòng chọn {viewMode === 'room' ? 'phòng' : viewMode === 'dentist' ? 'nha sĩ' : 'y tá'} để xem lịch
                  </Text>
                )}

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
                {/* Header Row - Always 7 days T2->CN */}
                <div className="calendar-header-row">
                  <div className="time-column">Ca làm việc</div>
                  {weekDays.map((day, index) => (
                    <div key={`${day.format('YYYY-MM-DD')}-${index}`} className="day-column">
                      <div className="day-header">
                        <div className="day-name">{day.format('ddd')}</div>
                        <div className="day-date">{day.format('DD/MM')}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shift Rows - cột hiển thị tên ca-thời gian */}
                {shiftOverview ? Object.values(shiftOverview).map(shift => (
                  <div key={shift.name} className="calendar-row">
                    <div className="time-column">
                      <div className="shift-info">
                        <Text strong>{shift.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {shift.startTime} - {shift.endTime}
                        </Text>
                        <br />
                        <Text type={shift.isActive ? 'success' : 'secondary'} style={{ fontSize: 10 }}>
                          {shift.isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </Text>
                      </div>
                    </div>
                    {weekDays.map((day, index) => (
                      <div key={`${day.format('YYYY-MM-DD')}-${shift.name}-${index}`} className="day-column">
                        <CalendarCell date={day} shift={shift} />
                      </div>
                    ))}
                  </div>
                )) : (
                  <div className="calendar-row">
                    <div style={{ padding: 20, textAlign: 'center', gridColumn: '1 / -1' }}>
                      {loading ? (
                        <Text type="secondary">Đang tải ca làm việc...</Text>
                      ) : (selectedRoom || selectedDentist || selectedNurse) ? (
                        <div>
                          <Text type="warning">Không thể tải dữ liệu lịch</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Kiểm tra kết nối backend hoặc thử lại
                          </Text>
                          <br />
                          <Button 
                            size="small" 
                            onClick={loadScheduleData}
                            style={{ marginTop: 8 }}
                          >
                            Thử lại
                          </Button>
                        </div>
                      ) : (
                        <Text type="secondary">
                          Chọn {viewMode === 'room' ? 'phòng' : viewMode === 'dentist' ? 'nha sĩ' : 'y tá'} để xem lịch
                        </Text>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </Col>

      </Row>
    </div>
  );
};

export default ScheduleCalendar;
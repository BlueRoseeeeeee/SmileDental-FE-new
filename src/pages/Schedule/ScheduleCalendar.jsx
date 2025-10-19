/**
 * @author: HoTram
 *  
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Card, Row, Col, Typography, Button, Space, Select, Tag, Spin, Empty, Divider, Badge,
  Segmented, DatePicker, Tooltip, Modal, Checkbox, Radio,
} from 'antd';
import { 
  CalendarOutlined, UserOutlined,
  LeftOutlined, RightOutlined, MedicineBoxOutlined
} from '@ant-design/icons';
import smileCareTheme from '../../theme/smileCareTheme';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);
import { roomService, scheduleConfigService } from '../../services';
import { userService } from '../../services';
import slotService from '../../services/slotService.js';
import { toast } from '../../services/toastService.js';
import { useAuth } from '../../hooks/useAuth';
import './ScheduleCalendar.css';

const { Title, Text } = Typography;
const { Option } = Select;

const ScheduleCalendar = () => {
  // Get current user
  const { user } = useAuth();
  
  // View mode state - mặc định dựa trên role
  const getDefaultViewMode = () => {
    if (user?.role === 'dentist') return 'dentist';
    if (user?.role === 'nurse') return 'nurse';
    return 'room'; // admin/manager mặc định xem theo phòng
  };
  
  const [viewMode, setViewMode] = useState(getDefaultViewMode());
  
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
  
  // Cache for slot details (to avoid repeated API calls on hover)
  const [slotDetailsCache, setSlotDetailsCache] = useState({});
  
  // Slot Selection Modal States
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedCellDate, setSelectedCellDate] = useState(null);
  const [selectedCellShift, setSelectedCellShift] = useState(null);
  const [modalSlots, setModalSlots] = useState([]);
  const [loadingModalSlots, setLoadingModalSlots] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]); // Array of selected slot IDs
  const [slotFilter, setSlotFilter] = useState('all'); // 'all', 'assigned', 'unassigned'
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0); // page=0 là tuần hiện tại

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
        const dentistList = allStaff.filter(u => 
          (u.role === 'dentist' || u.role === 'doctor') && u.isActive === true
        );
        const nurseList = allStaff.filter(u => 
          u.role === 'nurse' && u.isActive === true
        );
        setDentists(dentistList);
        setNurses(nurseList);
        
        // Tự động chọn dentist/nurse hiện tại nếu đang là dentist/nurse
        if (user?.role === 'dentist') {
          const currentDentist = dentistList.find(d => d._id === user._id);
          if (currentDentist) {
            setSelectedDentist({ id: currentDentist._id, ...currentDentist });
          }
        } else if (user?.role === 'nurse') {
          const currentNurse = nurseList.find(n => n._id === user._id);
          if (currentNurse) {
            setSelectedNurse({ id: currentNurse._id, ...currentNurse });
          }
        }
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
        // 🔧 FIX: startDate luôn là ngày hiện tại, backend sẽ dùng page để offset
        const params = {
          viewType: 'week',
          page: currentPage,
          startDate: dayjs().format('YYYY-MM-DD') // Luôn gửi ngày hiện tại
        };
        
        // Add subroom if selected
        if (selectedSubRoom) {
          params.subRoomId = selectedSubRoom.id;
        }

        const response = await slotService.getRoomCalendar(selectedRoom.id, params);
        
        if (response?.success) {
          setCalendarData(response.data);
          
          // 🔧 FIX: Cập nhật currentWeek từ dữ liệu backend
          if (response.data?.periods?.[0]?.startDate) {
            const weekStart = dayjs(response.data.periods[0].startDate).startOf('isoWeek');
            if (!currentWeek.isSame(weekStart, 'day')) {
              setCurrentWeek(weekStart);
            }
          }
        } else {
          console.error('API returned error:', response);
          toast.error('API trả về lỗi');
          setCalendarData(null);
        }
      } else if (viewMode === 'dentist') {
        // 🔧 FIX: startDate luôn là ngày hiện tại
        const params = {
          viewType: 'week',
          page: currentPage,
          startDate: dayjs().format('YYYY-MM-DD'),
          limit: 1
        };
        
        const response = await slotService.getDentistCalendar(selectedDentist.id, params);
        
        console.log('🔍 Dentist Calendar Response:', response);
        console.log('🔍 Response.data:', response?.data);
        console.log('🔍 Response.data.periods:', response?.data?.periods);
        
        if (response?.success) {
          setCalendarData(response.data);
          
          // 🔧 FIX: Cập nhật currentWeek từ dữ liệu backend
          if (response.data?.periods?.[0]?.startDate) {
            const weekStart = dayjs(response.data.periods[0].startDate).startOf('isoWeek');
            if (!currentWeek.isSame(weekStart, 'day')) {
              setCurrentWeek(weekStart);
            }
          }
        } else {
          toast.error('Không thể tải lịch nha sĩ');
          setCalendarData(null);
        }
      } else if (viewMode === 'nurse') {
        // 🔧 FIX: startDate luôn là ngày hiện tại
        const params = {
          viewType: 'week',
          page: currentPage,
          startDate: dayjs().format('YYYY-MM-DD'),
          limit: 1
        };
        
        const response = await slotService.getNurseCalendar(selectedNurse.id, params);
        
        console.log('🔍 Nurse Calendar Response:', response);
        console.log('🔍 Response.data:', response?.data);
        console.log('🔍 Response.data.periods:', response?.data?.periods);
        
        if (response?.success) {
          setCalendarData(response.data);
          
          // 🔧 FIX: Cập nhật currentWeek từ dữ liệu backend
          if (response.data?.periods?.[0]?.startDate) {
            const weekStart = dayjs(response.data.periods[0].startDate).startOf('isoWeek');
            if (!currentWeek.isSame(weekStart, 'day')) {
              setCurrentWeek(weekStart);
            }
          }
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
  }, [viewMode, selectedRoom, selectedSubRoom, selectedDentist, selectedNurse, currentPage]); // 🔧 FIX: Loại bỏ currentWeek để tránh infinite loop

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
    
    // For dentist/nurse calendar, extract shift names from data OR use scheduleConfig as fallback
    if (scheduleConfig) {
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
      
      // If data exists, extract shift names from data
      if (calendarData?.periods?.[0]?.days?.[0]?.shifts) {
        const firstDayShifts = calendarData.periods[0].days[0].shifts;
        Object.keys(firstDayShifts).forEach(shiftName => {
          overview[shiftName] = {
            name: shiftName,
            startTime: shiftMapping[shiftName]?.startTime || '--:--',
            endTime: shiftMapping[shiftName]?.endTime || '--:--',
            isActive: shiftMapping[shiftName]?.isActive !== false
          };
        });
      } else {
        // No data - use all shifts from config (fallback for empty calendar)
        Object.entries(shiftMapping).forEach(([shiftName, config]) => {
          overview[shiftName] = {
            name: shiftName,
            ...config
          };
        });
      }
      
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
    setCurrentPage(0); // page=0 là tuần hiện tại
    setCurrentWeek(dayjs().startOf('isoWeek'));
  };

  // Jump to specific date's week
  const goToDateWeek = (date) => {
    if (!date) return;
    const weekStart = dayjs(date).startOf('isoWeek');
    const todayWeek = dayjs().startOf('isoWeek');
    
    // 🔧 FIX: Tính page offset từ tuần hiện tại đến tuần được chọn
    const weekDiff = weekStart.diff(todayWeek, 'week');
    
    setCurrentWeek(weekStart);
    setCurrentPage(weekDiff); // Set page = số tuần cách tuần hiện tại
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
        showSearch
        optionFilterProp="roomsearch"
        filterOption={(input, option) => option?.props?.roomsearch?.includes(input.toLowerCase())}
        onChange={(roomId) => {
          const room = rooms.find(r => r._id === roomId);
          setSelectedRoom({ id: roomId, ...room });
          setSelectedSubRoom(null); // Reset subroom
          setCurrentPage(0); // Reset về tuần hiện tại
          setSlotDetailsCache({}); // Clear cache when changing room
        }}
      >
        {rooms.map(room => {
          const searchValue = [
            room?.name,
            room?.roomNumber,
            room?.roomCode,
            room?.description
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return (
            <Option key={room._id} value={room._id} roomsearch={searchValue}>
              <Space size={6}>
                <span>{room.name}</span>
                {room.roomNumber && (
                  <Tag color="blue" bordered={false}>{room.roomNumber}</Tag>
                )}
              </Space>
            </Option>
          );
        })}
      </Select>

      {selectedRoom && selectedRoom.hasSubRooms && selectedRoom.subRooms?.length > 0 && (
        <Select
          style={{ width: 250 }}
          placeholder="Chọn phòng con (tuỳ chọn)"
          value={selectedSubRoom?.id}
          allowClear
          showSearch
          optionFilterProp="subroomsearch"
          filterOption={(input, option) => option?.props?.subroomsearch?.includes(input.toLowerCase())}
          onChange={(subRoomId) => {
            if (subRoomId) {
              const subRoom = selectedRoom.subRooms.find(sr => sr._id === subRoomId);
              setSelectedSubRoom({ id: subRoomId, ...subRoom });
            } else {
              setSelectedSubRoom(null);
            }
            setCurrentPage(0); // Reset về tuần hiện tại
            setSlotDetailsCache({}); // Clear cache when changing subroom
          }}
        >
          {selectedRoom.subRooms.map(subRoom => {
            const searchValue = [subRoom?.name, subRoom?.code]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();

            return (
              <Option key={subRoom._id} value={subRoom._id} subroomsearch={searchValue}>
                {subRoom.name}
                {subRoom.code && <Tag style={{ marginLeft: 8 }} color="purple" bordered={false}>{subRoom.code}</Tag>}
              </Option>
            );
          })}
        </Select>
      )}
      
      {selectedRoom && !selectedRoom.hasSubRooms && (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Phòng không buồng   
        </Text>
      )}
    </Space>
  );

  // Fetch slot details for a specific date and shift (for tooltip)
  const fetchSlotDetails = async (date, shiftName, shiftData) => {
    // Build cache key with entity ID to avoid cross-entity cache collision
    let entityId = '';
    if (viewMode === 'room') {
      entityId = selectedRoom?.id || 'none';
      if (selectedSubRoom?.id) entityId += `_${selectedSubRoom.id}`;
    } else if (viewMode === 'dentist') {
      entityId = selectedDentist?.id || 'none';
    } else if (viewMode === 'nurse') {
      entityId = selectedNurse?.id || 'none';
    }
    
    const cacheKey = `${viewMode}_${entityId}_${date.format('YYYY-MM-DD')}_${shiftName}`;
    
    // Return cached data if available
    if (slotDetailsCache[cacheKey]) {
      return slotDetailsCache[cacheKey];
    }
    
    // If slots already in shiftData, cache and return
    if (shiftData?.slots && Array.isArray(shiftData.slots) && shiftData.slots.length > 0) {
      setSlotDetailsCache(prev => ({ ...prev, [cacheKey]: shiftData.slots }));
      return shiftData.slots;
    }
    
    // Otherwise fetch from API
    try {
      const params = {
        date: date.format('YYYY-MM-DD'),
        shiftName: shiftName
      };
      
      // Determine which room ID to use based on viewMode
      let roomId = null;
      if (viewMode === 'room' && selectedRoom?.id) {
        roomId = selectedRoom.id;
        if (selectedSubRoom?.id) {
          params.subRoomId = selectedSubRoom.id;
        }
      } else if (viewMode === 'dentist' && selectedDentist?.id) {
        // For dentist view, we need roomId if available from shiftData
        if (shiftData?.mostFrequentRoom?._id) {
          roomId = shiftData.mostFrequentRoom._id;
        }
      } else if (viewMode === 'nurse' && selectedNurse?.id) {
        // For nurse view, we need roomId if available from shiftData
        if (shiftData?.mostFrequentRoom?._id) {
          roomId = shiftData.mostFrequentRoom._id;
        }
      }
      
      if (!roomId) {
        console.log('No roomId available for fetching slot details');
        return [];
      }
      
      const response = await slotService.getSlotsByDate(roomId, params);
      
      if (response?.success && response?.data?.slots) {
        // Debug: Log slot structure to see what we're getting
        if (response.data.slots.length > 0) {
          console.log('📊 Sample slot data:', response.data.slots[0]);
        }
        
        // Cache the slots
        setSlotDetailsCache(prev => ({ ...prev, [cacheKey]: response.data.slots }));
        return response.data.slots;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching slot details:', error);
      return [];
    }
  };

  // Helper function to render employee info in tooltip
  const renderEmployeeInfo = (person, label, color) => {
    // Handle empty array or null/undefined
    if (!person || (Array.isArray(person) && person.length === 0)) {
      return (
        <div style={{ color: '#ff4d4f', fontSize: '13px' }}>
          {label}: Chưa phân công
        </div>
      );
    }

    // If person is array, get first element
    let actualPerson = person;
    if (Array.isArray(person)) {
      actualPerson = person[0];
    }

    // If person is string (only ID), API didn't populate
    if (typeof actualPerson === 'string') {
      return (
        <div style={{ color: '#faad14', fontSize: '13px' }}>
          {label}: Đã phân công (chi tiết không khả dụng)
        </div>
      );
    }

    // If person is object, extract name and code
    const name = actualPerson.fullName || actualPerson.name;
    const code = actualPerson.employeeCode || actualPerson.code;
    
    if (!name) {
      return (
        <div style={{ color: '#faad14', fontSize: '13px' }}>
          {label}: Đã phân công (chi tiết không khả dụng)
        </div>
      );
    }

    // Use background color for badge based on role
    const bgColor = label === 'NS' ? '#1890ff' : '#52c41a';

    return (
      <div style={{ fontSize: '13px', marginBottom: '2px' }}>
        <span style={{ 
          backgroundColor: bgColor,
          color: '#fff',
          padding: '2px 8px',
          borderRadius: '3px',
          fontWeight: '600',
          marginRight: '8px',
          fontSize: '12px'
        }}>
          {label}
        </span>
        <span style={{ color: color, fontWeight: '500' }}>
          {name} ({code})
        </span>
      </div>
    );
  };

  // Helper function to render employee info for dentist/nurse view (no staff names)
  const renderSlotTimeOnly = (slot) => {
    const startTime = slot.startTimeVN || dayjs(slot.startTime).format('HH:mm');
    const endTime = slot.endTimeVN || dayjs(slot.endTime).format('HH:mm');
    
    return (
      <div style={{ fontSize: '13px', marginBottom: '4px' }}>
        {startTime} - {endTime}
      </div>
    );
  };

  // Format slot tooltip content
  const formatSlotTooltip = (date, shiftName, shiftData) => {
    // Build cache key with entity ID to match fetchSlotDetails
    let entityId = '';
    if (viewMode === 'room') {
      entityId = selectedRoom?.id || 'none';
      if (selectedSubRoom?.id) entityId += `_${selectedSubRoom.id}`;
    } else if (viewMode === 'dentist') {
      entityId = selectedDentist?.id || 'none';
    } else if (viewMode === 'nurse') {
      entityId = selectedNurse?.id || 'none';
    }
    
    const cacheKey = `${viewMode}_${entityId}_${date?.format('YYYY-MM-DD')}_${shiftName}`;
    const cachedSlots = slotDetailsCache[cacheKey];
    const totalSlots = shiftData?.totalSlots || shiftData?.slots?.length || 0;
    
    // Check if viewing dentist/nurse calendar (only show time, no staff info)
    const isStaffView = viewMode === 'dentist' || viewMode === 'nurse';
    
    // If we have cached slots, display them
    if (cachedSlots && Array.isArray(cachedSlots) && cachedSlots.length > 0) {
      const grouped = {};
      cachedSlots.forEach(slot => {
        const key = slot.subRoom?.name || 'Chính';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(slot);
      });
      
      return (
        <div style={{ maxHeight: '400px', overflow: 'auto', padding: '4px 0' }}>
          {Object.entries(grouped).map(([subRoomName, subRoomSlots]) => (
            <div key={subRoomName} style={{ marginBottom: 8 }}>
              {Object.keys(grouped).length > 1 && (
                <div style={{ fontWeight: 'bold', marginBottom: 6, color: '#1890ff', fontSize: '13px' }}>{subRoomName}:</div>
              )}
              {subRoomSlots.map((slot, idx) => {
                const startTime = slot.startTimeVN || dayjs(slot.startTime).format('HH:mm');
                const endTime = slot.endTimeVN || dayjs(slot.endTime).format('HH:mm');
                
                if (isStaffView) {
                  // Dentist/Nurse view: only show time
                  return (
                    <div key={idx} style={{ fontSize: '13px', lineHeight: '1.8', marginBottom: 6 }}>
                      <div style={{ fontWeight: '500' }}>{startTime} - {endTime}</div>
                    </div>
                  );
                }
                
                // Room view: show time + staff info
                return (
                  <div key={idx} style={{ lineHeight: '1.8', marginBottom: 8 }}>
                    <div style={{ fontWeight: '500', marginBottom: 4, fontSize: '13px' }}>{startTime} - {endTime}</div>
                    {renderEmployeeInfo(slot.dentist, 'NS', '#1890ff')}
                    {renderEmployeeInfo(slot.nurse, 'YT', '#52c41a')}
                  </div>
                );
              })}
              <div style={{ marginTop: 8, fontSize: '11px', color: '#999', borderTop: '1px solid #f0f0f0', paddingTop: 4 }}>
                Tổng: {subRoomSlots.length} slot
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // If shiftData already has slots, use them
    if (shiftData?.slots && Array.isArray(shiftData.slots) && shiftData.slots.length > 0) {
      const grouped = {};
      shiftData.slots.forEach(slot => {
        const key = slot.subRoom?.name || 'Chính';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(slot);
      });
      
      return (
        <div style={{ maxHeight: '400px', overflow: 'auto', padding: '4px 0' }}>
          {Object.entries(grouped).map(([subRoomName, subRoomSlots]) => (
            <div key={subRoomName} style={{ marginBottom: 8 }}>
              {Object.keys(grouped).length > 1 && (
                <div style={{ fontWeight: 'bold', marginBottom: 6, color: '#1890ff', fontSize: '13px' }}>{subRoomName}:</div>
              )}
              {subRoomSlots.map((slot, idx) => {
                const startTime = slot.startTimeVN || dayjs(slot.startTime).format('HH:mm');
                const endTime = slot.endTimeVN || dayjs(slot.endTime).format('HH:mm');
                
                if (isStaffView) {
                  // Dentist/Nurse view: only show time
                  return (
                    <div key={idx} style={{ fontSize: '13px', lineHeight: '1.8', marginBottom: 6 }}>
                      <div style={{ fontWeight: '500' }}>{startTime} - {endTime}</div>
                    </div>
                  );
                }
                
                // Room view: show time + staff info
                return (
                  <div key={idx} style={{ lineHeight: '1.8', marginBottom: 8 }}>
                    <div style={{ fontWeight: '500', marginBottom: 4, fontSize: '13px' }}>{startTime} - {endTime}</div>
                    {renderEmployeeInfo(slot.dentist, 'NS', '#1890ff')}
                    {renderEmployeeInfo(slot.nurse, 'YT', '#52c41a')}
                  </div>
                );
              })}
              <div style={{ marginTop: 8, fontSize: '11px', color: '#999', borderTop: '1px solid #f0f0f0', paddingTop: 4 }}>
                Tổng: {subRoomSlots.length} slot
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // Show loading or placeholder
    if (totalSlots > 0) {
      return <div style={{ fontSize: '12px', color: '#999' }}>Đang tải chi tiết...</div>;
    }
    
    return <div style={{ fontSize: '12px', color: '#999' }}>Không có slot</div>;
  };

  // Handle click on calendar cell to open slot selection modal
  const handleCellClick = async (date, shift, shiftData) => {
    if (!shiftData || shiftData.totalSlots === 0) return;
    
    setSelectedCellDate(date);
    setSelectedCellShift(shift);
    setShowSlotModal(true);
    setLoadingModalSlots(true);
    setSelectedSlots([]); // Reset selection
    
    // Fetch detailed slots
    const slots = await fetchSlotDetails(date, shift.name, shiftData);
    setModalSlots(slots);
    setLoadingModalSlots(false);
  };

  // Handle slot selection
  const handleSlotToggle = (slotId) => {
    setSelectedSlots(prev => {
      if (prev.includes(slotId)) {
        return prev.filter(id => id !== slotId);
      } else {
        return [...prev, slotId];
      }
    });
  };

  // Handle select all slots
  const handleSelectAllSlots = (checked) => {
    if (checked) {
      const filteredSlotIds = getFilteredSlots().map(slot => slot._id);
      setSelectedSlots(filteredSlotIds);
    } else {
      setSelectedSlots([]);
    }
  };

  // Get filtered slots based on filter
  const getFilteredSlots = () => {
    if (slotFilter === 'assigned') {
      return modalSlots.filter(slot => slot.dentist || slot.nurse);
    } else if (slotFilter === 'unassigned') {
      return modalSlots.filter(slot => !slot.dentist && !slot.nurse);
    }
    return modalSlots;
  };

  // Calculate stats for modal
  const getModalStats = () => {
    const totalSlots = modalSlots.length;
    const assignedSlots = modalSlots.filter(slot => slot.dentist || slot.nurse).length;
    const selectedCount = selectedSlots.length;

    return { totalSlots, assignedSlots, selectedCount };
  };

  // Render dentist selector
  const DentistSelector = () => (
    <Select
      style={{ width: 300 }}
      placeholder="Chọn nha sĩ"
      value={selectedDentist?.id}
      showSearch
      optionFilterProp="staffsearch"
      filterOption={(input, option) => option?.props?.staffsearch?.includes(input.toLowerCase())}
      onChange={(dentistId) => {
        const dentist = dentists.find(d => d._id === dentistId);
        setSelectedDentist({ id: dentistId, ...dentist });
        setCurrentPage(0); // Reset về tuần hiện tại
        setSlotDetailsCache({}); // Clear cache when changing dentist
      }}
    >
      {dentists.map(dentist => {
        const fullName = dentist.fullName || `${dentist.firstName || ''} ${dentist.lastName || ''}`.trim();
        const employeeCode = dentist.employeeCode || dentist.code || '';
        const searchValue = `${employeeCode} ${fullName}`.trim().toLowerCase();

        return (
          <Option key={dentist._id} value={dentist._id} staffsearch={searchValue}>
            <Space size={6}>
              <UserOutlined />
              {employeeCode && <Tag color="blue" bordered={false}>{employeeCode}</Tag>}
              <span>{fullName || 'Không rõ tên'}</span>
            </Space>
          </Option>
        );
      })}
    </Select>
  );

  // Render nurse selector
  const NurseSelector = () => (
    <Select
      style={{ width: 300 }}
      placeholder="Chọn y tá"
      value={selectedNurse?.id}
      showSearch
      optionFilterProp="staffsearch"
      filterOption={(input, option) => option?.props?.staffsearch?.includes(input.toLowerCase())}
      onChange={(nurseId) => {
        const nurse = nurses.find(n => n._id === nurseId);
        setSelectedNurse({ id: nurseId, ...nurse });
        setCurrentPage(0); // Reset về tuần hiện tại
        setSlotDetailsCache({}); // Clear cache when changing nurse
      }}
    >
      {nurses.map(nurse => {
        const fullName = nurse.fullName || `${nurse.firstName || ''} ${nurse.lastName || ''}`.trim();
        const employeeCode = nurse.employeeCode || nurse.code || '';
        const searchValue = `${employeeCode} ${fullName}`.trim().toLowerCase();

        return (
          <Option key={nurse._id} value={nurse._id} staffsearch={searchValue}>
            <Space size={6}>
              <MedicineBoxOutlined />
              {employeeCode && <Tag color="green" bordered={false}>{employeeCode}</Tag>}
              <span>{fullName || 'Không rõ tên'}</span>
            </Space>
          </Option>
        );
      })}
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

    // Calculate assigned slots (có ít nhất dentist hoặc nurse)
    // Try to get from shiftData first, or fetch from cache
    const cacheKey = `${date.format('YYYY-MM-DD')}_${shift.name}`;
    const cachedSlots = slotDetailsCache[cacheKey] || shiftData.slots || [];
    const assignedSlotsCount = cachedSlots.filter(slot => slot.dentist || slot.nurse).length;
    const totalSlots = shiftData.totalSlots || 0;

    return (
      <div 
        className="calendar-cell"
      >
        <div className="cell-content">
          <div className="cell-stats">
            <Tooltip 
              title={formatSlotTooltip(date, shift.name, shiftData)}
              placement="right"
              styles={{ root: { maxWidth: '400px' } }}
              onOpenChange={async (open) => {
                // Load slot details when tooltip opens
                if (open && shiftData?.totalSlots > 0) {
                  await fetchSlotDetails(date, shift.name, shiftData);
                }
              }}
            >
              <div style={{ cursor: 'help' }}>
                <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                  {totalSlots} slot
                </Text>
                {cachedSlots.length > 0 ? (
                  <Text 
                    style={{ 
                      fontSize: '11px', 
                      color: assignedSlotsCount === totalSlots ? '#52c41a' : assignedSlotsCount > 0 ? '#faad14' : '#ff4d4f' 
                    }}
                  >
                    PC: {assignedSlotsCount}/{totalSlots}
                  </Text>
                ) : (
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    Click để xem
                  </Text>
                )}
              </div>
            </Tooltip>
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
                  <div style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>
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
    <div className="schedule-calendar" style={{
      minHeight: 'calc(100vh - 64px)',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '32px 24px'
    }}>
      {/* Header Card */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 16,
          border: '2px solid #dbeafe',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          boxShadow: smileCareTheme.shadows.lg
        }}
        bodyStyle={{ padding: '20px 28px' }}
      >
        <Space size={16} align="center">
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}>
            <CalendarOutlined style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <div>
            <Title level={3} style={{ margin: 0, color: '#fff', fontWeight: 700 }}>
              Lịch Làm Việc
            </Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 }}>
              Xem lịch làm việc theo phòng, nha sĩ hoặc y tá
            </Text>
          </div>
        </Space>
      </Card>

      <Row gutter={16}>
        {/* Main Calendar */}
        <Col span={24}>
          <Card
            style={{
              borderRadius: 16,
              border: '2px solid #dbeafe',
              boxShadow: smileCareTheme.shadows.lg
            }}
            bodyStyle={{ padding: '24px 28px' }}
          >
            {/* View Mode Segmented - chỉ hiển thị cho admin/manager */}
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <Segmented
                value={viewMode}
                onChange={(value) => {
                  setViewMode(value);
                  setCalendarData(null);
                  setSlotDetailsCache({}); // Clear cache when changing view mode
                  
                  // Reset all selections to force fresh form
                  setSelectedRoom(null);
                  setSelectedSubRoom(null);
                  setSelectedDentist(null);
                  setSelectedNurse(null);
                  
                  // Reset pagination to page 0 (current week)
                  setCurrentPage(0);
                  setCurrentWeek(dayjs().startOf('isoWeek'));
                }}
                options={[
                  {
                    value: 'room',
                    label: 'Theo Phòng',
                  },
                  {
                    value: 'dentist',
                    label: (
                      <span>
                        <UserOutlined />
                        {' '}Theo Nha Sĩ
                      </span>
                    ),
                  },
                  {
                    value: 'nurse',
                    label: (
                      <span>
                        <MedicineBoxOutlined />
                        {' '}Theo Y Tá
                      </span>
                    ),
                  },
                ]}
                style={{ marginBottom: 16 }}
              />
            )}
            
            {/* Info Display - Room/Dentist/Nurse */}
            {viewMode === 'room' && calendarData?.roomInfo && (
              <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                <Space>
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
                {/* Chỉ hiển thị selector cho admin/manager */}
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <>
                    {viewMode === 'room' && <RoomSelector />}
                    {viewMode === 'dentist' && <DentistSelector />}
                    {viewMode === 'nurse' && <NurseSelector />}
                  </>
                )}
                
                {/* Show navigation only when selection is made */}
                {((viewMode === 'room' && selectedRoom) || (viewMode === 'dentist' && selectedDentist) || (viewMode === 'nurse' && selectedNurse)) ? (
                  <>
                    <Divider type="vertical" />
                    
                    {/* Date Picker for quick navigation */}
                    <DatePicker
                      placeholder="Chọn ngày để xem tuần"
                      format="DD/MM/YYYY"
                      value={currentWeek} // 🔧 ADD: Hiển thị ngày bắt đầu tuần hiện tại
                      onChange={goToDateWeek}
                      style={{ width: 180 }}
                      allowClear={false} // 🔧 FIX: Không cho phép xóa
                    />
                    
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

      {/* Slot Selection Modal */}
      <Modal
        title={
          <Space direction="vertical" size={0}>
            <Text strong>
              Chi tiết slot - {selectedCellShift?.name} ({selectedCellDate?.format('DD/MM/YYYY')})
            </Text>
            {(() => {
              const stats = getModalStats();
              if (selectedSlots.length > 0) {
                return (
                  <Text type="success" style={{ fontSize: '12px' }}>
                    Đã chọn: {stats.selectedCount} / {stats.totalSlots} slot
                  </Text>
                );
              } else {
                return (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Đã phân công: {stats.assignedSlots} / {stats.totalSlots} slot
                  </Text>
                );
              }
            })()}
          </Space>
        }
        open={showSlotModal}
        onCancel={() => {
          setShowSlotModal(false);
          setSelectedSlots([]);
          setSlotFilter('all');
        }}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => {
            setShowSlotModal(false);
            setSelectedSlots([]);
            setSlotFilter('all');
          }}>
            Đóng
          </Button>,
          <Button 
            key="assign" 
            type="primary" 
            disabled={selectedSlots.length === 0}
            onClick={() => {
              // TODO: Implement assignment logic
              toast.success(`Đã chọn ${selectedSlots.length} slot để phân công`);
              setShowSlotModal(false);
              setSelectedSlots([]);
            }}
          >
            Phân công ({selectedSlots.length} slot)
          </Button>
        ]}
      >
        {loadingModalSlots ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Đang tải danh sách slot...</div>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Filter and Select All Controls */}
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Radio.Group 
                value={slotFilter} 
                onChange={(e) => setSlotFilter(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="all">
                  Tất cả ({modalSlots.length})
                </Radio.Button>
                <Radio.Button value="assigned">
                  Đã phân công ({modalSlots.filter(s => s.dentist || s.nurse).length})
                </Radio.Button>
                <Radio.Button value="unassigned">
                  Chưa phân công ({modalSlots.filter(s => !s.dentist && !s.nurse).length})
                </Radio.Button>
              </Radio.Group>
              
              <Checkbox
                checked={getFilteredSlots().length > 0 && selectedSlots.length === getFilteredSlots().length}
                indeterminate={selectedSlots.length > 0 && selectedSlots.length < getFilteredSlots().length}
                onChange={(e) => handleSelectAllSlots(e.target.checked)}
              >
                Chọn tất cả
              </Checkbox>
            </Space>

            <Divider style={{ margin: '8px 0' }} />

            {/* Slot List */}
            <div style={{ maxHeight: '500px', overflow: 'auto' }}>
              {getFilteredSlots().length === 0 ? (
                <Empty description="Không có slot" />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {getFilteredSlots().map((slot) => {
                    const startTime = slot.startTimeVN || dayjs(slot.startTime).format('HH:mm');
                    const endTime = slot.endTimeVN || dayjs(slot.endTime).format('HH:mm');
                    
                    // Handle dentist name - check multiple possible structures
                    let dentistName = null;
                    if (slot.dentist) {
                      if (typeof slot.dentist === 'string') {
                        dentistName = slot.dentist; // Just ID or code
                      } else if (slot.dentist.fullName) {
                        dentistName = slot.dentist.fullName;
                      } else if (slot.dentist.name) {
                        dentistName = slot.dentist.name;
                      }
                    }
                    
                    // Handle nurse name - check multiple possible structures
                    let nurseName = null;
                    if (slot.nurse) {
                      if (typeof slot.nurse === 'string') {
                        nurseName = slot.nurse; // Just ID or code
                      } else if (slot.nurse.fullName) {
                        nurseName = slot.nurse.fullName;
                      } else if (slot.nurse.name) {
                        nurseName = slot.nurse.name;
                      }
                    }
                    
                    const isSelected = selectedSlots.includes(slot._id);

                    return (
                      <Card
                        key={slot._id}
                        size="small"
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#e6f7ff' : 'white',
                          borderColor: isSelected ? '#1890ff' : '#d9d9d9'
                        }}
                        onClick={() => handleSlotToggle(slot._id)}
                      >
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Space>
                            <Checkbox 
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => handleSlotToggle(slot._id)}
                            />
                            <div>
                              <Text strong style={{ fontSize: '14px' }}>
                                {startTime} - {endTime}
                              </Text>
                              {slot.subRoom?.name && (
                                <Tag color="blue" size="small" style={{ marginLeft: 8 }}>
                                  {slot.subRoom.name}
                                </Tag>
                              )}
                            </div>
                          </Space>
                          
                          <Space direction="vertical" size={0} align="end">
                            {dentistName ? (
                              <Tag color="blue" size="small">
                                NS: {dentistName}
                              </Tag>
                            ) : (
                              <Tag color="orange" size="small">
                                NS: Chưa phân công
                              </Tag>
                            )}
                            {nurseName ? (
                              <Tag color="green" size="small">
                                YT: {nurseName}
                              </Tag>
                            ) : (
                              <Tag color="orange" size="small">
                                YT: Chưa phân công
                              </Tag>
                            )}
                          </Space>
                        </Space>
                      </Card>
                    );
                  })}
                </Space>
              )}
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default ScheduleCalendar;
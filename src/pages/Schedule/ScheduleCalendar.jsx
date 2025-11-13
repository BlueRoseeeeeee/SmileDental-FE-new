/**
 * @author: HoTram
 *  
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Card, Row, Col, Typography, Button, Space, Select, Tag, Spin, Empty, Divider, Badge,
  Segmented, DatePicker, Tooltip, Modal, Checkbox, Radio, Input, Alert
} from 'antd';
import { 
  CalendarOutlined, UserOutlined,
  LeftOutlined, RightOutlined, MedicineBoxOutlined,
  CloseCircleOutlined, ExclamationCircleOutlined
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
  
  // ✅ Helper function - check ONLY selectedRole
  const hasRole = (roleToCheck) => {
    const selectedRole = localStorage.getItem('selectedRole');
    return selectedRole === roleToCheck;
  };
  
  // View mode state - mặc định dựa trên role
  const getDefaultViewMode = () => {
    if (hasRole('dentist')) return 'dentist';
    if (hasRole('nurse')) return 'nurse';
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
  const [modalMode, setModalMode] = useState('assign'); // 🆕 'assign' | 'toggle' | 'dentist_view' | 'nurse_view'
  
  // 🆕 Toggle Slots States - persist across weeks
  const [selectedSlotsForToggle, setSelectedSlotsForToggle] = useState({}); // {slotId: {slotData, date, shift}}
  const [togglingSlots, setTogglingSlots] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableReason, setDisableReason] = useState('');
  
  // 🆕 Emergency Day Closure States
  const [showEmergencyClosureModal, setShowEmergencyClosureModal] = useState(false);
  const [emergencyClosureDate, setEmergencyClosureDate] = useState(null);
  const [emergencyClosureReason, setEmergencyClosureReason] = useState('');
  const [emergencyClosing, setEmergencyClosing] = useState(false);
  
  // 🆕 Emergency Day Enable States
  const [showEmergencyEnableModal, setShowEmergencyEnableModal] = useState(false);
  const [emergencyEnableDate, setEmergencyEnableDate] = useState(null);
  const [emergencyEnableReason, setEmergencyEnableReason] = useState('');
  const [emergencyEnabling, setEmergencyEnabling] = useState(false);
  
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
        const dentistList = allStaff.filter(u => {
          const roles = u.roles || [u.role];
          return (roles.includes('dentist') || roles.includes('doctor')) && u.isActive === true;
        });
        const nurseList = allStaff.filter(u => {
          const roles = u.roles || [u.role];
          return roles.includes('nurse') && u.isActive === true;
        });
        setDentists(dentistList);
        setNurses(nurseList);
        
        // Tự động chọn dentist/nurse hiện tại nếu đang là dentist/nurse
        if (hasRole('dentist')) {
          const currentDentist = dentistList.find(d => d._id === user._id);
          if (currentDentist) {
            setSelectedDentist({ id: currentDentist._id, ...currentDentist });
          }
        } else if (hasRole('nurse')) {
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

  const shiftActivitySummary = useMemo(() => {
    const summary = {};

    if (!calendarData?.periods?.[0]?.days) {
      return summary;
    }

    calendarData.periods[0].days.forEach(day => {
      const shifts = day.shifts || {};

      Object.entries(shifts).forEach(([shiftName, shiftData]) => {
        if (!summary[shiftName]) {
          summary[shiftName] = { total: 0, inactive: 0 };
        }

        const slotsArray = Array.isArray(shiftData.slots) ? shiftData.slots : [];
        let totalSlots = shiftData.totalSlots || 0;
        let inactiveSlots = 0;

        if (slotsArray.length > 0) {
          totalSlots = slotsArray.length;
          inactiveSlots = slotsArray.filter(slot => slot.isActive === false).length;
        }

        if (!inactiveSlots && shiftData.inactiveSlotsCount != null) {
          inactiveSlots = shiftData.inactiveSlotsCount;
        }

        if (!inactiveSlots && totalSlots && shiftData.activeSlotsCount != null) {
          inactiveSlots = Math.max(totalSlots - shiftData.activeSlotsCount, 0);
        }

        summary[shiftName].total += totalSlots;
        summary[shiftName].inactive += inactiveSlots;
      });
    });

    return summary;
  }, [calendarData]);

  // Extract shift overview from calendar data
  // Room calendar has shiftOverview field, dentist/nurse calendar needs to extract from days
  const shiftOverview = useMemo(() => {
    // 🆕 Check if room/subroom is properly selected before showing shifts
    if (viewMode === 'room') {
      // If room has subrooms, must select a subroom first
      if (selectedRoom?.hasSubRooms && !selectedSubRoom) {
        return null; // Don't show shifts until subroom is selected
      }
      // If room doesn't have subrooms, just need room selection
      if (!selectedRoom) {
        return null; // Don't show shifts until room is selected
      }
    }
    
    // 🆕 Use shiftOverview from API response (priority)
    if (calendarData?.shiftOverview && Object.keys(calendarData.shiftOverview).length > 0) {
      return calendarData.shiftOverview;
    }
    
    // Fallback: Use scheduleConfig to create all 3 shifts
    if (scheduleConfig) {
      const overview = {};
      
      const shifts = [
        { key: 'Ca Sáng', config: scheduleConfig.morningShift },
        { key: 'Ca Chiều', config: scheduleConfig.afternoonShift },
        { key: 'Ca Tối', config: scheduleConfig.eveningShift }
      ];
      
      shifts.forEach(({ key, config }) => {
        overview[key] = {
          name: key,
          startTime: config?.startTime || '--:--',
          endTime: config?.endTime || '--:--',
          isActive: true
        };
      });
      
      return overview;
    }
    
    return null;
  }, [calendarData, scheduleConfig, viewMode, selectedRoom, selectedSubRoom]);

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

  // 🔧 Helper: Get slot ID from various possible fields
  const getSlotId = (slot) => slot._id || slot.id || slot.slotId;

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
    
    // Check if viewing dentist/nurse calendar
    const isStaffView = viewMode === 'dentist' || viewMode === 'nurse';
    
    // 🆕 Check if can toggle (admin/manager in room view)
    const canToggle = (hasRole('admin') || hasRole('manager')) && viewMode === 'room';
    
    // If we have cached slots, display them
    if (cachedSlots && Array.isArray(cachedSlots) && cachedSlots.length > 0) {
      // 🆕 For dentist/nurse: Group by appointment
      if (isStaffView) {
        const groupedData = groupSlotsByAppointment(cachedSlots);
        const appointmentGroups = Object.values(groupedData.withAppointment);
        const slotsWithoutAppointment = groupedData.withoutAppointment;
        
        return (
          <div style={{ maxHeight: '400px', overflow: 'auto', padding: '4px 0' }}>
            {appointmentGroups.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: '13px', color: '#1890ff' }}>
                  📋 Phiếu khám ({appointmentGroups.length})
                </Text>
                {appointmentGroups.map((group, idx) => {
                  const sortedSlots = group.slots.sort((a, b) => {
                    const timeA = a.startTimeVN || dayjs(a.startTime).format('HH:mm');
                    const timeB = b.startTimeVN || dayjs(b.startTime).format('HH:mm');
                    return timeA.localeCompare(timeB);
                  });
                  const firstSlot = sortedSlots[0];
                  const lastSlot = sortedSlots[sortedSlots.length - 1];
                  const startTime = firstSlot.startTimeVN || dayjs(firstSlot.startTime).format('HH:mm');
                  const endTime = lastSlot.endTimeVN || dayjs(lastSlot.endTime).format('HH:mm');
                  
                  return (
                    <div 
                      key={group.appointmentId}
                      style={{ 
                        marginTop: 8,
                        padding: 8,
                        backgroundColor: '#f6ffed',
                        borderRadius: '4px',
                        border: '1px solid #b7eb8f'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', color: '#52c41a', marginBottom: 4 }}>
                        🧑 {group.patientInfo?.name || 'Chưa có thông tin'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {startTime} - {endTime} ({group.slots.length} slot)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {slotsWithoutAppointment.length > 0 && (
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  📭 Slots trống: {slotsWithoutAppointment.length}
                </Text>
              </div>
            )}
          </div>
        );
      }
      
      // For room view: Original grouping by subroom
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
                const isSelected = !!selectedSlotsForToggle[getSlotId(slot)];
                
                if (isStaffView) {
                  // Dentist/Nurse view: only show time
                  return (
                    <div key={idx} style={{ fontSize: '13px', lineHeight: '1.8', marginBottom: 6 }}>
                      <div style={{ fontWeight: '500' }}>{startTime} - {endTime}</div>
                    </div>
                  );
                }
                
                // Room view: show time + staff info (NO checkbox in tooltip - not interactive)
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      lineHeight: '1.8', 
                      marginBottom: 8,
                      backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                  >
                    <div style={{ fontWeight: '500', marginBottom: 4, fontSize: '13px' }}>
                      {isSelected && '✓ '}{startTime} - {endTime}
                    </div>
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
                const isSelected = !!selectedSlotsForToggle[getSlotId(slot)];
                
                if (isStaffView) {
                  // Dentist/Nurse view: only show time
                  return (
                    <div key={idx} style={{ fontSize: '13px', lineHeight: '1.8', marginBottom: 6 }}>
                      <div style={{ fontWeight: '500' }}>{startTime} - {endTime}</div>
                    </div>
                  );
                }
                
                // Room view: show time + staff info (NO checkbox in tooltip - not interactive)
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      lineHeight: '1.8', 
                      marginBottom: 8,
                      backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                  >
                    <div style={{ fontWeight: '500', marginBottom: 4, fontSize: '13px' }}>
                      {isSelected && '✓ '}{startTime} - {endTime}
                    </div>
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
    
    console.log('🔍 handleCellClick - shiftData:', shiftData);
    console.log('🔍 handleCellClick - shiftData.slots:', shiftData.slots);
    
    setSelectedCellDate(date);
    setSelectedCellShift(shift);
    setShowSlotModal(true);
    setLoadingModalSlots(true);
    setSelectedSlots([]); // Reset selection
    
    // ✅ Use shiftData.slots directly if available (from calendar API - has full dentist/nurse info)
    if (shiftData.slots && Array.isArray(shiftData.slots) && shiftData.slots.length > 0) {
      console.log('✅ Using shiftData.slots directly (has dentist/nurse info)');
      console.log('🔍 First slot:', shiftData.slots[0]);
      setModalSlots(shiftData.slots);
      setLoadingModalSlots(false);
    } else {
      // Fallback: Fetch detailed slots via API
      console.log('⚠️ shiftData.slots empty, fetching via API');
      const slots = await fetchSlotDetails(date, shift.name, shiftData);
      console.log('🔍 handleCellClick - Fetched slots:', slots);
      setModalSlots(slots);
      setLoadingModalSlots(false);
    }
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
      const filteredSlotIds = getFilteredSlots().map(slot => getSlotId(slot));
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
  
  // 🆕 Helper: Group slots by appointmentId for dentist/nurse view
  const groupSlotsByAppointment = (slots) => {
    const grouped = {
      withAppointment: {}, // { appointmentId: { slots: [...], patientInfo: {...} } }
      withoutAppointment: [] // Slots without appointmentId
    };
    
    slots.forEach(slot => {
      if (slot.appointmentId) {
        if (!grouped.withAppointment[slot.appointmentId]) {
          grouped.withAppointment[slot.appointmentId] = {
            appointmentId: slot.appointmentId,
            slots: [],
            patientInfo: slot.patientInfo || null
          };
        }
        grouped.withAppointment[slot.appointmentId].slots.push(slot);
      } else {
        grouped.withoutAppointment.push(slot);
      }
    });
    
    return grouped;
  };

  // 🆕 Toggle Slots Handlers
  const handleToggleSlotSelection = React.useCallback((slot, date, shift) => {
    console.log('[ToggleSelect] Full slot object:', slot);
    const slotId = slot._id || slot.id || slot.slotId;
    
    if (!slotId) {
      console.error('[ToggleSelect] ERROR: Slot has no _id, id, or slotId!', slot);
      toast.error('Không thể chọn slot này (thiếu ID)');
      return;
    }
    
    console.log('[ToggleSelect] slotId:', slotId, 'date:', date?.format ? date.format('YYYY-MM-DD') : date, 'shift:', typeof shift === 'string' ? shift : shift?.name);
    
    setSelectedSlotsForToggle(prev => {
      const newSelected = { ...prev };
      if (newSelected[slotId]) {
        // Already selected, remove it
        console.log('[ToggleSelect] Deselecting slot:', slotId);
        delete newSelected[slotId];
      } else {
        // Not selected, add it
        console.log('[ToggleSelect] Selecting slot:', slotId);
        // Ensure date is string format
        const dateStr = typeof date === 'string' ? date : date?.format ? date.format('YYYY-MM-DD') : date;
        const shiftName = typeof shift === 'string' ? shift : shift?.name || '';
        
        newSelected[slotId] = {
          slotData: slot,
          date: dateStr,
          shift: shiftName,
          roomId: slot.roomId,
          subRoomId: slot.subRoomId,
          isActive: slot.isActive
        };
      }
      console.log('[ToggleSelect] New selection state:', Object.keys(newSelected));
      return newSelected;
    });
  }, []);  // Empty deps - chỉ tạo 1 lần

  const handleSelectAllSlotsInWeek = (shiftName) => {
    // 🆕 Select all slots of the given shift in current week (from tomorrow onwards only)
    if (!calendarData?.periods?.[0]?.days) return;

    const newSelected = { ...selectedSlotsForToggle };
    const slotsInShift = [];
    
    calendarData.periods[0].days.forEach(dayData => {
      const dayDate = dayjs(dayData.date);
      
      // 🆕 Only select slots from tomorrow or later
      if (!isTomorrowOrLater(dayDate)) {
        return; // Skip past/today dates
      }
      
      // 🔧 FIX: shifts is an object, not array - access by key
      const shiftData = dayData.shifts?.[shiftName];
      
      if (shiftData?.slots && Array.isArray(shiftData.slots)) {
        shiftData.slots.forEach(slot => {
          slotsInShift.push({ slot, dayDate });
        });
      }
    });

    if (slotsInShift.length === 0) {
      toast.info(`Không có slot nào thuộc ${shiftName} (từ ngày mai) trong tuần này`);
      return;
    }

    const allSelected = slotsInShift.every(({ slot }) => newSelected[getSlotId(slot)]);

    if (allSelected) {
      slotsInShift.forEach(({ slot }) => {
        delete newSelected[getSlotId(slot)];
      });
      setSelectedSlotsForToggle(newSelected);
      toast.info(`Đã bỏ chọn toàn bộ slot ${shiftName} (từ ngày mai)`);
    } else {
      slotsInShift.forEach(({ slot, dayDate }) => {
        newSelected[getSlotId(slot)] = {
          slotData: slot,
          date: dayDate.format('YYYY-MM-DD'),
          shift: shiftName,
          roomId: slot.roomId,
          subRoomId: slot.subRoomId,
          isActive: slot.isActive
        };
      });
      setSelectedSlotsForToggle(newSelected);
      toast.success(`Đã chọn ${slotsInShift.length} slot ${shiftName} (từ ngày mai)`);
    }
  };

  const handleClearAllSelections = () => {
    setSelectedSlotsForToggle({});
    toast.info('Đã xóa tất cả lựa chọn');
  };

  const handleToggleSlotsDirectly = async (mode) => {
    const selectedCount = Object.keys(selectedSlotsForToggle).length;
    if (selectedCount === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 slot');
      return;
    }

    // Nếu disable thì mở modal nhập lý do (bắt buộc)
    if (mode === 'disable') {
      setShowDisableModal(true);
      return;
    }

    // Enable - gọi trực tiếp
    try {
      setTogglingSlots(true);
      
      const slotIds = Object.keys(selectedSlotsForToggle);
      console.log('[Toggle Enable] selected slot IDs:', slotIds);
      console.log('[Toggle Enable] selectedSlotsForToggle:', selectedSlotsForToggle);
      
      // Validate slot IDs
      const invalidIds = slotIds.filter(id => !id || typeof id !== 'string' || id.length !== 24);
      if (invalidIds.length > 0) {
        console.error('[Toggle Enable] Invalid slot IDs:', invalidIds);
        toast.error(`Có ${invalidIds.length} slot ID không hợp lệ`);
        return;
      }
      
      const result = await slotService.toggleSlotsIsActive(slotIds, true, '');
      
      if (result.success) {
        const changedCount = result.changedCount || result.modifiedCount || 0;
        const unchangedCount = result.unchangedCount || 0;
        const emailsSent = result.emailsSent || 0;
        
        if (changedCount > 0) {
          toast.success(`Bật thành công ${changedCount} slot${unchangedCount > 0 ? ` (${unchangedCount} slot đã bật trước đó)` : ''}. Đã gửi ${emailsSent} email thông báo.`);
        } else {
          toast.info(`Tất cả ${selectedCount} slot đã được bật trước đó`);
        }
        setSelectedSlotsForToggle({});
        await loadScheduleData();
      } else {
        toast.error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error enabling slots:', error);
      toast.error(error.response?.data?.message || error.message || 'Không thể bật slots');
    } finally {
      setTogglingSlots(false);
    }
  };

  const handleConfirmDisable = async () => {
    if (!disableReason.trim()) {
      toast.warning('Vui lòng nhập lý do tắt lịch');
      return;
    }

    try {
      setTogglingSlots(true);
      
      const slotIds = Object.keys(selectedSlotsForToggle);
      console.log('[Toggle Disable] selected slot IDs:', slotIds);
      console.log('[Toggle Disable] selectedSlotsForToggle:', selectedSlotsForToggle);
      
      // Validate slot IDs
      const invalidIds = slotIds.filter(id => !id || typeof id !== 'string' || id.length !== 24);
      if (invalidIds.length > 0) {
        console.error('[Toggle Disable] Invalid slot IDs:', invalidIds);
        toast.error(`Có ${invalidIds.length} slot ID không hợp lệ`);
        return;
      }
      
      const result = await slotService.toggleSlotsIsActive(slotIds, false, disableReason);
      
      if (result.success) {
        const changedCount = result.changedCount || result.modifiedCount || 0;
        const unchangedCount = result.unchangedCount || 0;
        const emailsSent = result.emailsSent || 0;
        
        if (changedCount > 0) {
          toast.success(`Tắt thành công ${changedCount} slot${unchangedCount > 0 ? ` (${unchangedCount} slot đã tắt trước đó)` : ''}. Đã gửi ${emailsSent} email thông báo.`);
        } else {
          toast.info(`Tất cả ${slotIds.length} slot đã được tắt trước đó`);
        }
        setSelectedSlotsForToggle({});
        setShowDisableModal(false);
        setDisableReason('');
        await loadScheduleData();
      } else {
        toast.error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error disabling slots:', error);
      toast.error(error.response?.data?.message || error.message || 'Không thể tắt slots');
    } finally {
      setTogglingSlots(false);
    }
  };

  // 🆕 Handle Emergency Day Closure
  const handleEmergencyDayClosure = (date) => {
    if (!user || user.role !== 'admin') {
      toast.error('Chỉ admin mới có quyền tắt toàn bộ lịch trong ngày');
      return;
    }

    setEmergencyClosureDate(date);
    setEmergencyClosureReason('');
    setShowEmergencyClosureModal(true);
  };

  const handleConfirmEmergencyClosure = async () => {
    if (!emergencyClosureDate) {
      toast.warning('Vui lòng chọn ngày cần tắt lịch');
      return;
    }

    if (!emergencyClosureReason.trim() || emergencyClosureReason.length < 10) {
      toast.warning('Vui lòng nhập lý do tắt lịch (ít nhất 10 ký tự)');
      return;
    }

    try {
      setEmergencyClosing(true);
      
      const result = await slotService.disableAllDaySlots(
        emergencyClosureDate.format('YYYY-MM-DD'),
        emergencyClosureReason
      );
      
      if (result.success) {
        toast.success(result.message || `Đã tắt ${result.disabledCount} slots của ${result.affectedRooms} phòng và gửi ${result.emailsQueued} email thông báo`);
        setShowEmergencyClosureModal(false);
        setEmergencyClosureDate(null);
        setEmergencyClosureReason('');
        await loadScheduleData();
      } else {
        toast.error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error emergency closure:', error);
      toast.error(error.response?.data?.message || error.message || 'Không thể tắt toàn bộ lịch');
    } finally {
      setEmergencyClosing(false);
    }
  };

  // 🆕 Handle Emergency Day Enable (Reactivate)
  const handleEmergencyDayEnable = (date) => {
    if (!user || user.role !== 'admin') {
      toast.error('Chỉ admin mới có quyền bật lại toàn bộ lịch trong ngày');
      return;
    }

    setEmergencyEnableDate(date);
    setEmergencyEnableReason('');
    setShowEmergencyEnableModal(true);
  };

  const handleConfirmEmergencyEnable = async () => {
    if (!emergencyEnableDate) {
      toast.warning('Vui lòng chọn ngày cần bật lại lịch');
      return;
    }

    try {
      setEmergencyEnabling(true);
      
      const result = await slotService.enableAllDaySlots(
        emergencyEnableDate.format('YYYY-MM-DD'),
        emergencyEnableReason.trim() || 'Kích hoạt lại lịch khám'
      );
      
      if (result.success) {
        toast.success(result.message || `Đã bật ${result.enabledCount} slots của ${result.affectedRooms} phòng và gửi ${result.emailsQueued} email thông báo`);
        setShowEmergencyEnableModal(false);
        setEmergencyEnableDate(null);
        setEmergencyEnableReason('');
        await loadScheduleData();
      } else {
        toast.error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error emergency enable:', error);
      toast.error(error.response?.data?.message || error.message || 'Không thể bật lại toàn bộ lịch');
    } finally {
      setEmergencyEnabling(false);
    }
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

  // 🆕 Helper: Check if date is tomorrow or later
  const isTomorrowOrLater = (date) => {
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    return date.isSameOrAfter(tomorrow, 'day');
  };

  // Render calendar cell
  const CalendarCell = ({ date, shift }) => {
    const shiftData = getShiftData(date, shift);
    const isShiftActive = shift.isActive;
    
    // 🆕 Check if can toggle this cell (admin/manager, room view, tomorrow or later)
    const canToggleCell = (hasRole('admin') || hasRole('manager')) 
      && viewMode === 'room' 
      && isTomorrowOrLater(date);

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

    // 🆕 Count selected slots in this cell
    const selectedInThisCell = cachedSlots.filter(slot => 
      selectedSlotsForToggle[getSlotId(slot)]
    ).length;

    // 🆕 Check if all slots in this cell are selected
    const allSlotsInCellSelected = cachedSlots.length > 0 && selectedInThisCell === cachedSlots.length;

    // 🆕 Handler to select/deselect all slots in this cell
    const handleToggleAllSlotsInCell = async (e) => {
      e.stopPropagation(); // Prevent opening modal
      
      // 🆕 Check if can toggle (tomorrow or later)
      if (!canToggleCell) {
        toast.warning('Chỉ có thể bật/tắt lịch từ ngày mai trở đi');
        return;
      }
      
      // Fetch slots if not cached yet
      let slotsToToggle = cachedSlots;
      if (slotsToToggle.length === 0) {
        slotsToToggle = await fetchSlotDetails(date, shift.name, shiftData);
      }
      
      console.log('[ToggleCell] Slots to toggle:', slotsToToggle);
      
      // Validate slots have IDs
      const validSlots = slotsToToggle.filter(slot => slot._id || slot.id || slot.slotId);
      if (validSlots.length === 0) {
        console.error('[ToggleCell] No valid slots with IDs found!');
        toast.error('Không thể chọn slots (thiếu ID)');
        return;
      }
      
      const newSelected = { ...selectedSlotsForToggle };
      
      if (allSlotsInCellSelected) {
        // Deselect all
        validSlots.forEach(slot => {
          const slotId = slot._id || slot.id || slot.slotId;
          delete newSelected[slotId];
        });
        console.log('[ToggleCell] Deselected', validSlots.length, 'slots');
      } else {
        // Select all
        validSlots.forEach(slot => {
          const slotId = slot._id || slot.id || slot.slotId;
          newSelected[slotId] = {
            slotData: slot,
            date: date.format('YYYY-MM-DD'),
            shift: shift.name,
            roomId: slot.roomId,
            subRoomId: slot.subRoomId,
            isActive: slot.isActive
          };
        });
        console.log('[ToggleCell] Selected', validSlots.length, 'slots');
      }
      
      setSelectedSlotsForToggle(newSelected);
    };

    return (
      <div 
        className="calendar-cell"
        onClick={async () => {
          // Click to open slot details modal
          if (totalSlots > 0) {
            setSelectedCellDate(date);
            setSelectedCellShift(shift);
            setShowSlotModal(true);
            setLoadingModalSlots(true);
            
            // 🆕 Determine modal mode based on role and view mode
            if (hasRole('dentist')) {
              setModalMode('dentist_view');
            } else if (hasRole('nurse')) {
              setModalMode('nurse_view');
            } else if (canToggleCell) {
              // Admin/Manager in room view AND tomorrow or later
              setModalMode('toggle');
            } else {
              setModalMode('assign');
            }
            
            // ✅ Use shiftData.slots directly if available (from calendar API - has full dentist/nurse info)
            if (shiftData?.slots && Array.isArray(shiftData.slots) && shiftData.slots.length > 0) {
              console.log('✅ CalendarCell: Using shiftData.slots directly (has dentist/nurse info)');
              setModalSlots(shiftData.slots);
              setLoadingModalSlots(false);
            } else {
              // Fallback: Fetch detailed slots via API
              console.log('⚠️ CalendarCell: shiftData.slots empty, fetching via API');
              const slots = await fetchSlotDetails(date, shift.name, shiftData);
              setModalSlots(slots);
              setLoadingModalSlots(false);
            }
          }
        }}
        style={{ 
          cursor: totalSlots > 0 ? 'pointer' : 'default',
          position: 'relative',
          opacity: canToggleCell ? 1 : 0.7 // Dim past/today dates
        }}
      >
        <div className="cell-content">
          {/* 🆕 Quick select checkbox - only show if can toggle */}
          {canToggleCell && totalSlots > 0 && (
            <div style={{ position: 'absolute', top: 4, left: 4, zIndex: 10 }}>
              <Checkbox
                checked={allSlotsInCellSelected}
                indeterminate={selectedInThisCell > 0 && !allSlotsInCellSelected}
                onChange={handleToggleAllSlotsInCell}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
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
                {/* 🆕 Dentist/Nurse view: Show appointment count */}
                {(viewMode === 'dentist' || viewMode === 'nurse') && cachedSlots.length > 0 ? (
                  (() => {
                    const groupedData = groupSlotsByAppointment(cachedSlots);
                    const appointmentCount = Object.keys(groupedData.withAppointment).length;
                    const emptySlots = groupedData.withoutAppointment.length;
                    
                    return (
                      <>
                        <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                          {totalSlots} slot
                        </Text>
                        {appointmentCount > 0 && (
                          <Text strong style={{ fontSize: '12px', color: '#52c41a', display: 'block' }}>
                            📋 {appointmentCount} phiếu
                          </Text>
                        )}
                        {emptySlots > 0 && (
                          <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>
                            {emptySlots} trống
                          </Text>
                        )}
                      </>
                    );
                  })()
                ) : (
                  <>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      {totalSlots} slot
                    </Text>
                    {viewMode === 'room' && cachedSlots.length > 0 ? (
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
                  </>
                )}
                {/* 🆕 Show selected count */}
                {selectedInThisCell > 0 && (
                  <Tag color="purple" style={{ fontSize: '10px', marginTop: 2, padding: '0 4px' }}>
                    Đã chọn: {selectedInThisCell}
                  </Tag>
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

          {/* 🆕 Show slot activity status */}
          {cachedSlots.length > 0 && (
            <div style={{ marginTop: 4 }}>
              {(() => {
                const inactiveCount = cachedSlots.filter(slot => slot.isActive === false).length;
                
                if (inactiveCount === 0) {
                  return (
                    <Tag color="green" size="small" style={{ fontSize: '10px' }}>
                      Hoạt động
                    </Tag>
                  );
                } else {
                  return (
                    <Tag color="orange" size="small" style={{ fontSize: '10px' }}>
                      {inactiveCount} slot tắt
                    </Tag>
                  );
                }
              })()}
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
            {(hasRole('admin') || hasRole('manager')) && (
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
                {(hasRole('admin') || hasRole('manager')) && (
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

            {/* 🆕 Emergency Day Closure Button - Admin & Manager */}
            {(hasRole('admin') || hasRole('manager')) && (
              <Card size="small" style={{ marginTop: 16, background: '#fff2e8', borderColor: '#ffbb96' }}>
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#ff7a45', fontSize: 18 }} />
                  <Text strong style={{ color: '#d4380d' }}>Quản lý lịch khẩn cấp (toàn bộ phòng)</Text>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => {
                      setEmergencyClosureDate(null);
                      setEmergencyClosureReason('');
                      setShowEmergencyClosureModal(true);
                    }}
                  >
                    Tắt Lịch Cả Ngày
                  </Button>
                  <Button
                    type="primary"
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                    onClick={() => {
                      setEmergencyEnableDate(null);
                      setEmergencyEnableReason('');
                      setShowEmergencyEnableModal(true);
                    }}
                  >
                    Bật Lại Lịch Cả Ngày
                  </Button>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    (Tắt/Bật tất cả slots của mọi phòng trong 1 ngày)
                  </Text>
                </Space>
              </Card>
            )}

            {/* 🆕 Toggle Slots Controls - Only for admin/manager in room view */}
            {(hasRole('admin') || hasRole('manager')) && viewMode === 'room' && selectedRoom && (
              <Card size="small" style={{ marginTop: 16, background: '#f0f5ff' }}>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text strong style={{ color: '#1890ff' }}>
                      Bật/Tắt Slots: {Object.keys(selectedSlotsForToggle).length} slot đã chọn
                    </Text>
                    {Object.keys(selectedSlotsForToggle).length > 0 && (
                      <Button size="small" onClick={handleClearAllSelections}>
                        Xóa tất cả
                      </Button>
                    )}
                  </Space>
                  
                  {/* 🆕 Warning about past/today dates */}
                  <Alert
                    type="info"
                    message="💡 Chỉ có thể bật/tắt lịch từ ngày mai trở đi"
                    showIcon
                    style={{ fontSize: '12px' }}
                  />
                  
                  <Space wrap>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Chọn nhanh theo ca:
                    </Text>
                    {shiftOverview && Object.values(shiftOverview).map(shift => (
                          shift.isActive && (
                        <Button
                          key={shift.name}
                          size="small"
                          onClick={() => handleSelectAllSlotsInWeek(shift.name)}
                        >
                          {shift.name}
                          {(() => {
                            const summary = shiftActivitySummary[shift.name];
                            if (!summary || summary.total === 0) return null;
                            
                            if (summary.inactive === 0) {
                              return (
                                <Tag color="green" style={{ marginLeft: 8 }}>
                                  Hoạt động
                                </Tag>
                              );
                            } else {
                              return (
                                <Tag color="orange" style={{ marginLeft: 8 }}>
                                  {summary.inactive} slot tắt
                                </Tag>
                              );
                            }
                          })()}
                        </Button>
                      )
                    ))}
                  </Space>

                  <Space wrap>
                    <Button
                      type="primary"
                      disabled={Object.keys(selectedSlotsForToggle).length === 0}
                      onClick={() => handleToggleSlotsDirectly('enable')}
                      style={{ background: '#52c41a', borderColor: '#52c41a' }}
                      loading={togglingSlots}
                    >
                      Bật ({Object.keys(selectedSlotsForToggle).length} slot{Object.keys(selectedSlotsForToggle).length > 1 ? 's' : ''})
                    </Button>
                    <Button
                      danger
                      disabled={Object.keys(selectedSlotsForToggle).length === 0}
                      onClick={() => handleToggleSlotsDirectly('disable')}
                      loading={togglingSlots}
                    >
                      Tắt ({Object.keys(selectedSlotsForToggle).length} slot{Object.keys(selectedSlotsForToggle).length > 1 ? 's' : ''})
                    </Button>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      💡 Click vào ô lịch để chọn slots cụ thể
                    </Text>
                  </Space>
                </Space>
              </Card>
            )}


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
                {shiftOverview ? Object.values(shiftOverview).map(shift => {
                  // Check if there are time variations across different months
                  const hasTimeVariants = shift.timeVariants && shift.timeVariants.length > 1;
                  
                  return (
                  <div key={shift.name} className="calendar-row">
                    <div className="time-column">
                      <div className="shift-info">
                        <Text strong>{shift.name}</Text>
                        <br />
                        {hasTimeVariants ? (
                          // Show all time variants with their months
                          <div style={{ fontSize: 11 }}>
                            {shift.timeVariants.map((variant, idx) => (
                              <Text key={idx} type="secondary" style={{ display: 'block', marginBottom: 2 }}>
                                {variant.startTime} - {variant.endTime} ({variant.months.join(', ')})
                              </Text>
                            ))}
                          </div>
                        ) : (
                          // Single time range
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {shift.startTime} - {shift.endTime}
                          </Text>
                        )}
                        <br />
                        {(() => {
                          const summary = shiftActivitySummary[shift.name];
                          const total = summary?.total || 0;
                          const inactive = summary?.inactive || 0;
                          
                          if (!total) {
                            return (
                              <Text type="secondary" style={{ fontSize: 10 }}>
                                Chưa có slot
                              </Text>
                            );
                          }

                          if (inactive === 0) {
                            return (
                              <Tag color="green" size="small" style={{ marginTop: 4 }}>
                                Hoạt động
                              </Tag>
                            );
                          }

                          return (
                            <Tag color="orange" size="small" style={{ marginTop: 4 }}>
                              {inactive} slot tắt
                            </Tag>
                          );
                        })()}
                      </div>
                    </div>
                    {weekDays.map((day, index) => (
                      <div key={`${day.format('YYYY-MM-DD')}-${shift.name}-${index}`} className="day-column">
                        <CalendarCell date={day} shift={shift} />
                      </div>
                    ))}
                  </div>
                  );
                }) : (
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
              {modalMode === 'toggle' ? 'Chọn slot để bật/tắt' : 
               modalMode === 'dentist_view' || modalMode === 'nurse_view' ? 'Lịch làm việc chi tiết' :
               'Chi tiết slot'} - {selectedCellShift?.name} ({selectedCellDate?.format('DD/MM/YYYY')})
            </Text>
            {(() => {
              if (modalMode === 'dentist_view' || modalMode === 'nurse_view') {
                const stats = getModalStats();
                const groupedData = groupSlotsByAppointment(modalSlots);
                const appointmentCount = Object.keys(groupedData.withAppointment).length;
                const slotsWithoutAppointment = groupedData.withoutAppointment.length;
                
                return (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {appointmentCount > 0 && `${appointmentCount} phiếu khám • `}
                    {stats.totalSlots} slot tổng cộng
                    {slotsWithoutAppointment > 0 && ` (${slotsWithoutAppointment} slot trống)`}
                  </Text>
                );
              }
              if (modalMode === 'toggle') {
                const selectedCount = Object.keys(selectedSlotsForToggle).length;
                const canToggle = isTomorrowOrLater(selectedCellDate);
                
                if (!canToggle) {
                  return (
                    <Text type="warning" style={{ fontSize: '12px' }}>
                      ⚠️ Chỉ có thể bật/tắt lịch từ ngày mai trở đi
                    </Text>
                  );
                }
                
                return (
                  <Text type={selectedCount > 0 ? 'success' : 'secondary'} style={{ fontSize: '12px' }}>
                    {selectedCount > 0 ? `Đã chọn: ${selectedCount} slot` : 'Chọn slot để bật/tắt'}
                  </Text>
                );
              } else {
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
        footer={
          modalMode === 'dentist_view' || modalMode === 'nurse_view' ? [
            // Dentist/Nurse: Only close button
            <Button key="close" type="primary" onClick={() => {
              setShowSlotModal(false);
              setSlotFilter('all');
            }}>
              Đóng
            </Button>
          ] : modalMode === 'toggle' ? [
            <Button key="cancel" onClick={() => {
              setShowSlotModal(false);
              setSlotFilter('all');
            }}>
              Đóng
            </Button>
          ] : [
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
          ]
        }
      >
        {loadingModalSlots ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Đang tải danh sách slot...</div>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Filter and Select All Controls - Only show in assign mode (not for dentist/nurse view) */}
            {modalMode === 'assign' && (
              <>
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
              </>
            )}

            {/* Slot List */}
            <div style={{ maxHeight: '500px', overflow: 'auto' }}>
              {(() => {
                // 🆕 Dentist/Nurse View - Group by appointment
                if (modalMode === 'dentist_view' || modalMode === 'nurse_view') {
                  if (modalSlots.length === 0) {
                    return <Empty description="Không có slot" />;
                  }
                  
                  const groupedData = groupSlotsByAppointment(modalSlots);
                  const appointmentGroups = Object.values(groupedData.withAppointment);
                  const slotsWithoutAppointment = groupedData.withoutAppointment;
                  
                  return (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      {/* Slots WITH appointments */}
                      {appointmentGroups.length > 0 && (
                        <>
                          <div>
                            <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
                              📋 Phiếu khám ({appointmentGroups.length})
                            </Text>
                          </div>
                          {appointmentGroups.map((group, groupIndex) => {
                            const sortedSlots = group.slots.sort((a, b) => {
                              const timeA = a.startTimeVN || dayjs(a.startTime).format('HH:mm');
                              const timeB = b.startTimeVN || dayjs(b.startTime).format('HH:mm');
                              return timeA.localeCompare(timeB);
                            });
                            
                            const firstSlot = sortedSlots[0];
                            const lastSlot = sortedSlots[sortedSlots.length - 1];
                            const startTime = firstSlot.startTimeVN || dayjs(firstSlot.startTime).format('HH:mm');
                            const endTime = lastSlot.endTimeVN || dayjs(lastSlot.endTime).format('HH:mm');
                            
                            return (
                              <Card 
                                key={group.appointmentId}
                                size="small"
                                style={{ 
                                  backgroundColor: '#f6ffed',
                                  borderColor: '#b7eb8f'
                                }}
                              >
                                <Space direction="vertical" style={{ width: '100%' }} size="small">
                                  {/* Patient Info Header */}
                                  <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid #d9f7be',
                                    paddingBottom: 8
                                  }}>
                                    <Space>
                                      <Tag color="green">Phiếu #{groupIndex + 1}</Tag>
                                      {group.patientInfo?.name ? (
                                        <Text strong style={{ fontSize: '15px' }}>
                                          🧑 {group.patientInfo.name}
                                        </Text>
                                      ) : (
                                        <Text type="secondary">🧑 Chưa có thông tin bệnh nhân</Text>
                                      )}
                                    </Space>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                      {startTime} - {endTime}
                                    </Text>
                                  </div>
                                  
                                  {/* Slot Details */}
                                  <div>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                      Chi tiết slots ({group.slots.length}):
                                    </Text>
                                    <div style={{ marginTop: 8 }}>
                                      {sortedSlots.map((slot, idx) => {
                                        const slotStart = slot.startTimeVN || dayjs(slot.startTime).format('HH:mm');
                                        const slotEnd = slot.endTimeVN || dayjs(slot.endTime).format('HH:mm');
                                        
                                        return (
                                          <div 
                                            key={getSlotId(slot)}
                                            style={{ 
                                              padding: '6px 12px',
                                              backgroundColor: 'white',
                                              borderRadius: '4px',
                                              marginBottom: 6,
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center'
                                            }}
                                          >
                                            <Space>
                                              <Text strong style={{ minWidth: 90 }}>
                                                {slotStart} - {slotEnd}
                                              </Text>
                                              {slot.subRoom?.name && (
                                                <Tag color="blue" size="small">
                                                  {slot.subRoom.name}
                                                </Tag>
                                              )}
                                              <Tag 
                                                color={slot.isActive ? 'green' : 'red'} 
                                                size="small"
                                              >
                                                {slot.isActive ? 'Hoạt động' : 'Tạm ngừng'}
                                              </Tag>
                                            </Space>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  
                                  {/* Additional Info */}
                                  {group.patientInfo && (
                                    <div style={{ 
                                      fontSize: '12px',
                                      color: '#666',
                                      borderTop: '1px solid #d9f7be',
                                      paddingTop: 8
                                    }}>
                                      {group.patientInfo.phone && (
                                        <div>📱 {group.patientInfo.phone}</div>
                                      )}
                                      {group.patientInfo.email && (
                                        <div>✉️ {group.patientInfo.email}</div>
                                      )}
                                    </div>
                                  )}
                                </Space>
                              </Card>
                            );
                          })}
                        </>
                      )}
                      
                      {/* Slots WITHOUT appointments */}
                      {slotsWithoutAppointment.length > 0 && (
                        <>
                          <Divider style={{ margin: '8px 0' }} />
                          <div>
                            <Text strong style={{ fontSize: '14px', color: '#8c8c8c' }}>
                              📭 Slots trống ({slotsWithoutAppointment.length})
                            </Text>
                          </div>
                          {slotsWithoutAppointment
                            .sort((a, b) => {
                              const timeA = a.startTimeVN || dayjs(a.startTime).format('HH:mm');
                              const timeB = b.startTimeVN || dayjs(b.startTime).format('HH:mm');
                              return timeA.localeCompare(timeB);
                            })
                            .map((slot) => {
                              const startTime = slot.startTimeVN || dayjs(slot.startTime).format('HH:mm');
                              const endTime = slot.endTimeVN || dayjs(slot.endTime).format('HH:mm');
                              
                              return (
                                <Card
                                  key={getSlotId(slot)}
                                  size="small"
                                  style={{ 
                                    backgroundColor: '#fafafa',
                                    borderColor: '#d9d9d9'
                                  }}
                                >
                                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                    <Space>
                                      <Text strong style={{ minWidth: 90 }}>
                                        {startTime} - {endTime}
                                      </Text>
                                      {slot.subRoom?.name && (
                                        <Tag color="blue" size="small">
                                          {slot.subRoom.name}
                                        </Tag>
                                      )}
                                      <Tag 
                                        color={slot.isActive ? 'green' : 'red'} 
                                        size="small"
                                      >
                                        {slot.isActive ? 'Hoạt động' : 'Tạm ngừng'}
                                      </Tag>
                                    </Space>
                                    <Tag color="default" size="small">Chưa có phiếu khám</Tag>
                                  </Space>
                                </Card>
                              );
                            })}
                        </>
                      )}
                    </Space>
                  );
                }
                
                // Admin/Manager View - Original code
                const slotsToDisplay = modalMode === 'toggle' ? modalSlots : getFilteredSlots();
                if (slotsToDisplay.length === 0) {
                  return <Empty description="Không có slot" />;
                }
                
                return (
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {slotsToDisplay.map((slot) => {
                    const startTime = slot.startTimeVN || dayjs(slot.startTime).format('HH:mm');
                    const endTime = slot.endTimeVN || dayjs(slot.endTime).format('HH:mm');
                    
                    // Handle dentist name - check multiple possible structures
                    let dentistName = null;
                    if (slot.dentist) {
                      if (Array.isArray(slot.dentist) && slot.dentist.length > 0) {
                        // Array case (from getRoomCalendar API)
                        const firstDentist = slot.dentist[0];
                        dentistName = firstDentist.fullName || firstDentist.name;
                      } else if (typeof slot.dentist === 'string') {
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
                      if (Array.isArray(slot.nurse) && slot.nurse.length > 0) {
                        // Array case (from getRoomCalendar API)
                        const firstNurse = slot.nurse[0];
                        nurseName = firstNurse.fullName || firstNurse.name;
                      } else if (typeof slot.nurse === 'string') {
                        nurseName = slot.nurse; // Just ID or code
                      } else if (slot.nurse.fullName) {
                        nurseName = slot.nurse.fullName;
                      } else if (slot.nurse.name) {
                        nurseName = slot.nurse.name;
                      }
                    }
                    
                    // 🆕 Check selection based on mode
                    const isSelected = modalMode === 'toggle' 
                      ? !!selectedSlotsForToggle[getSlotId(slot)]
                      : selectedSlots.includes(getSlotId(slot));
                    
                    // 🆕 Check if can toggle this slot (tomorrow or later)
                    const canToggleThisSlot = modalMode === 'toggle' && isTomorrowOrLater(selectedCellDate);

                    return (
                      <Card
                        key={getSlotId(slot)}
                        size="small"
                        style={{ 
                          cursor: modalMode === 'assign' ? 'default' : (canToggleThisSlot ? 'pointer' : 'not-allowed'),
                          backgroundColor: isSelected ? '#e6f7ff' : 'white',
                          borderColor: isSelected ? '#1890ff' : '#d9d9d9',
                          opacity: modalMode === 'assign' ? 1 : (canToggleThisSlot ? 1 : 0.6)
                        }}
                      >
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Space>
                            {/* ✅ Only show checkbox in toggle mode */}
                            {modalMode === 'toggle' && (
                              <Checkbox 
                                checked={isSelected}
                                disabled={!canToggleThisSlot}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (canToggleThisSlot) {
                                    handleToggleSlotSelection(slot, selectedCellDate, selectedCellShift);
                                  }
                                }}
                              />
                            )}
                            <div>
                              <Text strong style={{ fontSize: '14px' }}>
                                {startTime} - {endTime}
                              </Text>
                              {slot.subRoom?.name && (
                                <Tag color="blue" size="small" style={{ marginLeft: 8 }}>
                                  {slot.subRoom.name}
                                </Tag>
                              )}
                              {/* ✅ Always show isActive status for both modes */}
                              <Tag 
                                color={slot.isActive ? 'green' : 'red'} 
                                size="small" 
                                style={{ marginLeft: 8 }}
                              >
                                {slot.isActive ? 'Đang bật' : 'Đã tắt'}
                              </Tag>
                              {/* 🆕 Show info tag for assign mode (past/today dates) */}
                              {modalMode === 'assign' && (
                                <Tag color="default" size="small" style={{ marginLeft: 8 }}>
                                  Chỉ xem
                                </Tag>
                              )}
                              {/* 🆕 Show warning for toggle mode on past/today dates */}
                              {modalMode === 'toggle' && !canToggleThisSlot && (
                                <Tag color="warning" size="small" style={{ marginLeft: 8 }}>
                                  Chỉ toggle từ ngày mai
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
                            {/* 🆕 Display patient name if appointment exists */}
                            {slot.patientInfo?.name ? (
                              <Tag color="purple" size="small">
                                BN: {slot.patientInfo.name}
                              </Tag>
                            ) : slot.appointmentId ? (
                              <Tag color="default" size="small">
                                BN: Đang tải...
                              </Tag>
                            ) : null}
                          </Space>
                        </Space>
                      </Card>
                    );
                  })}
                </Space>
                );
              })()}
            </div>
          </Space>
        )}
      </Modal>

      {/* 🆕 Disable Slots Modal - Only for disabling (reason required) */}
      <Modal
        title={
          <Space>
            <Tag color="red">TẮT LỊCH</Tag>
            <Text strong>Nhập lý do tắt slots</Text>
          </Space>
        }
        open={showDisableModal}
        onCancel={() => {
          setShowDisableModal(false);
          setDisableReason('');
        }}
        onOk={handleConfirmDisable}
        confirmLoading={togglingSlots}
        okText="Tắt"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Alert
            type="warning"
            showIcon
            message={`Bạn đang tắt ${Object.keys(selectedSlotsForToggle).length} slots`}
            description="Các slots này sẽ bị ẩn và không thể đặt lịch"
          />

          <div>
            <Text strong style={{ color: 'red' }}>* Lý do tắt lịch (bắt buộc):</Text>
            <Input.TextArea
              value={disableReason}
              onChange={(e) => setDisableReason(e.target.value)}
              placeholder="Ví dụ: Bác sĩ nghỉ phép, Bảo trì phòng khám..."
              rows={3}
              maxLength={500}
              showCount
              style={{ marginTop: 8 }}
            />
          </div>

          {/* Show selected slots summary */}
          <div>
            <Text strong>Danh sách slots sẽ tắt:</Text>
            <div style={{ 
              maxHeight: '200px', 
              overflow: 'auto', 
              marginTop: 8,
              padding: '8px',
              background: '#f5f5f5',
              borderRadius: '4px'
            }}>
              {Object.values(selectedSlotsForToggle).map((item, index) => {
                const slot = item.slotData;
                const startTime = slot.startTimeVN || dayjs(slot.startTime).format('HH:mm');
                const endTime = slot.endTimeVN || dayjs(slot.endTime).format('HH:mm');
                
                return (
                  <div key={getSlotId(slot)} style={{ marginBottom: 4 }}>
                    <Text style={{ fontSize: '12px' }}>
                      {index + 1}. {item.date} - {item.shift} ({startTime}-{endTime})
                      {slot.subRoom?.name && ` - ${slot.subRoom.name}`}
                    </Text>
                  </div>
                );
              })}
            </div>
          </div>
        </Space>
      </Modal>

      {/* 🆕 Emergency Day Closure Modal */}
      <Modal
        open={showEmergencyClosureModal}
        onCancel={() => {
          if (!emergencyClosing) {
            setShowEmergencyClosureModal(false);
            setEmergencyClosureDate(null);
            setEmergencyClosureReason('');
          }
        }}
        onOk={handleConfirmEmergencyClosure}
        confirmLoading={emergencyClosing}
        okText="Xác Nhận Tắt Lịch"
        okButtonProps={{ danger: true, size: 'large' }}
        cancelText="Hủy"
        cancelButtonProps={{ disabled: emergencyClosing }}
        width={700}
        closable={!emergencyClosing}
        maskClosable={false}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Warning Header */}
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
            <Title level={4} style={{ color: '#ff4d4f', marginTop: 16, marginBottom: 8 }}>
              ⚠️ CẢNH BÁO: Tắt Toàn Bộ Lịch Của TẤT CẢ Phòng
            </Title>
          </div>

          {/* Date Picker */}
          <div>
            <Text strong style={{ fontSize: 16 }}>
              * Chọn ngày cần tắt lịch:
            </Text>
            <DatePicker
              value={emergencyClosureDate}
              onChange={(date) => setEmergencyClosureDate(date)}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
              style={{ width: '100%', marginTop: 8 }}
              disabled={emergencyClosing}
              disabledDate={(current) => {
                // Không cho chọn ngày quá khứ
                return current && current < dayjs().startOf('day');
              }}
            />
          </div>

          {/* Warning Messages */}
          <Alert
            type="error"
            showIcon
            message="Hành động này sẽ:"
            description={
              <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                <li><strong>Tắt TẤT CẢ slots của TẤT CẢ phòng khám</strong> trong ngày đã chọn</li>
                <li>Tự động gửi email hủy lịch cho bệnh nhân đã đặt</li>
                <li>Gửi thông báo cho nha sĩ và y tá được phân công</li>
                <li>Thao tác này KHÔNG THỂ hoàn tác tự động</li>
              </ul>
            }
          />

          <Alert
            type="warning"
            showIcon
            message="Chỉ sử dụng trong trường hợp khẩn cấp"
            description="Ví dụ: Sự cố kỹ thuật, thiên tai, hoặc toàn bộ phòng khám buộc phải đóng cửa đột xuất"
          />

          {/* Reason Input */}
          <div>
            <Text strong style={{ color: 'red', fontSize: 16 }}>
              * Lý do tắt toàn bộ lịch (bắt buộc, tối thiểu 10 ký tự):
            </Text>
            <Input.TextArea
              className='custom-textarea'
              value={emergencyClosureReason}
              onChange={(e) => setEmergencyClosureReason(e.target.value)}
              placeholder="Ví dụ: Sự cố mất điện toàn bộ phòng khám, cần tạm ngừng hoạt động cả ngày để khắc phục..."
              rows={4}
              maxLength={500}
              showCount
              style={{ marginTop: 8 }}
              disabled={emergencyClosing}
            />
            {emergencyClosureReason.length > 0 && emergencyClosureReason.length < 10 && (
              <Text type="danger" style={{ fontSize: 12 }}>
                Lý do phải có ít nhất 10 ký tự
              </Text>
            )}
          </div>

          {/* Confirmation Checkbox */}
          <Alert
            type="info"
            message="Lưu ý"
            description="Hệ thống sẽ tự động gửi email thông báo hủy lịch cho tất cả bệnh nhân, nha sĩ và y tá liên quan."
          />
        </Space>
      </Modal>

      {/* 🆕 Emergency Enable Modal (Reactivate All Day Slots) */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />
            <span style={{ fontSize: 18, fontWeight: 'bold' }}>BẬT LẠI TOÀN BỘ LỊCH CẢ NGÀY</span>
          </Space>
        }
        open={showEmergencyEnableModal}
        onCancel={() => {
          if (!emergencyEnabling) {
            setShowEmergencyEnableModal(false);
            setEmergencyEnableDate(null);
            setEmergencyEnableReason('');
          }
        }}
        onOk={handleConfirmEmergencyEnable}
        confirmLoading={emergencyEnabling}
        okText="Xác Nhận Bật Lại Lịch"
        okButtonProps={{ 
          type: 'primary',
          size: 'large',
          style: { background: '#52c41a', borderColor: '#52c41a' }
        }}
        cancelText="Hủy"
        cancelButtonProps={{ disabled: emergencyEnabling }}
        width={700}
        closable={!emergencyEnabling}
        maskClosable={false}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Success Header */}
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <ExclamationCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
            <Title level={4} style={{ color: '#52c41a', marginTop: 16, marginBottom: 8 }}>
              ✅ BẬT LẠI Toàn Bộ Lịch Đã Tắt Của TẤT CẢ Phòng
            </Title>
          </div>

          {/* Date Picker */}
          <div>
            <Text strong style={{ fontSize: 16 }}>
              * Chọn ngày cần bật lại lịch:
            </Text>
            <DatePicker
              value={emergencyEnableDate}
              onChange={(date) => setEmergencyEnableDate(date)}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
              style={{ width: '100%', marginTop: 8 }}
              disabled={emergencyEnabling}
            />
          </div>

          {/* Success Messages */}
          <Alert
            type="success"
            showIcon
            message="Hành động này sẽ:"
            description={
              <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                <li><strong>Bật lại TẤT CẢ slots đã bị tắt</strong> của TẤT CẢ phòng khám trong ngày đã chọn</li>
                <li>Tự động gửi email thông báo kích hoạt lại cho bệnh nhân đã đặt</li>
                <li>Gửi thông báo cho nha sĩ và y tá được phân công</li>
                <li>Lịch có thể sử dụng ngay lập tức sau khi bật</li>
              </ul>
            }
          />

          {/* Reason Input (Optional) */}
          <div>
            <Text strong style={{ fontSize: 16 }}>
              Lý do bật lại lịch (tùy chọn):
            </Text>
            <Input.TextArea
              value={emergencyEnableReason}
              onChange={(e) => setEmergencyEnableReason(e.target.value)}
              placeholder="Ví dụ: Sự cố đã được khắc phục, phòng khám hoạt động trở lại bình thường..."
              maxLength={500}
              showCount
              style={{ marginTop: 8 }}
              disabled={emergencyEnabling}
              className='custom-textarea'
              rows={5}
            />
          </div>

          {/* Confirmation Info */}
          <Alert
            type="warning"
            message="Thông báo email"
            description="Hệ thống sẽ tự động gửi email thông báo kích hoạt lại lịch cho tất cả bệnh nhân, nha sĩ và y tá liên quan."
          />
        </Space>
      </Modal>
    </div>
  );
};

export default ScheduleCalendar;

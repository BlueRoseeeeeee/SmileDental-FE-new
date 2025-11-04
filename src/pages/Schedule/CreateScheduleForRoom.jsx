
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Typography,
  Modal,
  DatePicker,
  Select,
  Checkbox,
  Divider,
  Alert,
  Spin,
  Tooltip,
  Radio,
  List,
  Input,
  message
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  WarningOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../services/toastService';
import roomService from '../../services/roomService';
import scheduleService from '../../services/scheduleService';
import scheduleConfigService from '../../services/scheduleConfigService';
import dayjs from 'dayjs';
import { debounce } from '../../utils/searchUtils';
import EditScheduleModal from '../../components/Schedule/EditScheduleModal';
import BulkRoomScheduleModal from '../../components/Schedule/BulkRoomScheduleModal';
import BulkCreateScheduleModal from '../../components/Schedule/BulkCreateScheduleModal';
import OverrideHolidayModal from '../../components/Schedule/OverrideHolidayModal';
import EnableShiftsSubRoomsModal from '../../components/Schedule/EnableShiftsSubRoomsModal';
import './CreateScheduleForRoom.css'; // Import CSS file

const { Title, Text } = Typography;
const { Option } = Select;

const SHIFT_KEYS = ['morning', 'afternoon', 'evening'];

const SHIFT_COLORS = {
  morning: 'gold',
  afternoon: 'blue',
  evening: 'purple'
};

const SHIFT_CONFIG_MAP = {
  morning: 'morningShift',
  afternoon: 'afternoonShift',
  evening: 'eveningShift'
};

const DEFAULT_SLOT_DURATION = 30;

// ⚠️ Build shift meta ONLY from backend config - No fallback
const buildShiftMetaFromConfig = (config) => {
  if (!config) {
    throw new Error('Config is required');
  }

  const meta = {};

  SHIFT_KEYS.forEach((key) => {
    const configKey = SHIFT_CONFIG_MAP[key];
    const configShift = config[configKey];

    if (!configShift) {
      throw new Error(`Missing shift config for ${key}`);
    }

    meta[key] = {
      key,
      name: configShift.name,
      startTime: configShift.startTime,
      endTime: configShift.endTime,
      isActive: configShift.isActive !== false
    };
  });

  const unitDuration = Number.isFinite(config.unitDuration) && config.unitDuration > 0
    ? config.unitDuration
    : DEFAULT_SLOT_DURATION;

  return { meta, unitDuration };
};

// Build from schedule's saved config (for editing)
const buildShiftMetaFromScheduleConfig = (shiftConfig = null, fallbackDuration = DEFAULT_SLOT_DURATION) => {
  if (!shiftConfig) {
    return { meta: {}, unitDuration: fallbackDuration };
  }

  const meta = {};

  SHIFT_KEYS.forEach((key) => {
    const scheduleShift = shiftConfig[key] || null;

    if (scheduleShift) {
      meta[key] = {
        key,
        name: scheduleShift.name,
        startTime: scheduleShift.startTime,
        endTime: scheduleShift.endTime,
        isActive: scheduleShift.isActive !== false
      };
    }
  });

  const slotDurations = SHIFT_KEYS
    .map((key) => shiftConfig?.[key]?.slotDuration)
    .filter((value) => Number.isFinite(value) && value > 0);

  const unitDuration = slotDurations.length > 0 ? slotDurations[0] : fallbackDuration;

  return { meta, unitDuration };
};

const getActiveShiftKeys = (meta) => {
  if (!meta) return SHIFT_KEYS;
  return SHIFT_KEYS.filter((key) => meta[key]?.isActive);
};

const CreateScheduleForRoom = () => {
  const navigate = useNavigate();
  
  // States
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  // Chỉ hiển thị phòng hoạt động (isActive = true), không cần filter nữa
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState('all'); // 'all' | 'has-schedule' | 'no-schedule'
  const [roomSearchValue, setRoomSearchValue] = useState('');
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleListModal, setShowScheduleListModal] = useState(false);
  const [scheduleListData, setScheduleListData] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedSubRoom, setSelectedSubRoom] = useState(null);
  const [selectedSubRooms, setSelectedSubRooms] = useState([]); // Array of subRooms for bulk operations
  const [selectedSubRoomIds, setSelectedSubRoomIds] = useState([]); // 🆕 Array of subRoomIds được chọn để tạo lịch
  const [fromMonth, setFromMonth] = useState(dayjs().month() + 1); // 1-12
  const [toMonth, setToMonth] = useState(dayjs().month() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(dayjs().year()); // Năm bắt đầu
  const [toYear, setToYear] = useState(dayjs().year()); // Năm kết thúc
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [partialStartDate, setPartialStartDate] = useState(null); // 🆕 Ngày bắt đầu tạo lịch (cho tạo thiếu)
  const [isEditingExistingSchedule, setIsEditingExistingSchedule] = useState(false);
  const [existingScheduleId, setExistingScheduleId] = useState(null);
  const [shiftMeta, setShiftMeta] = useState({}); // ⚠️ Sẽ được load từ backend
  const [slotDuration, setSlotDuration] = useState(DEFAULT_SLOT_DURATION);
  const [configLoading, setConfigLoading] = useState(false);
  const [selectedShifts, setSelectedShifts] = useState([]); // ⚠️ Sẽ được set sau khi load config
  const [initialMissingShifts, setInitialMissingShifts] = useState([]); // Track original missing shifts for editing
  const [subRoomShiftStatus, setSubRoomShiftStatus] = useState([]); // 🆕 Chi tiết trạng thái ca của từng buồng
  const [creatingSchedule, setCreatingSchedule] = useState(false);
  const [holidayPreview, setHolidayPreview] = useState(null); // 🆕 Holiday preview data
  const [loadingHolidayPreview, setLoadingHolidayPreview] = useState(false); // 🆕
  const [showOverrideModal, setShowOverrideModal] = useState(false); // 🆕 Override holiday modal

  // 🆕 Enable Shifts/SubRooms Modal
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [enableModalData, setEnableModalData] = useState({ scheduleId: null, roomName: '', month: null, year: null });

  // Schedule list modal filters
  const [scheduleListFilterType, setScheduleListFilterType] = useState('all'); // 'all' | 'missing' | 'complete'
  const [scheduleListSearchMonth, setScheduleListSearchMonth] = useState(null); // For month/year search - Format: "YYYY-MM"
  const [scheduleListActiveFilter, setScheduleListActiveFilter] = useState('all'); // 🆕 'all' | 'active' | 'inactive'

  // 🆕 Edit Schedule Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // 🆕 Bulk operations - Tạo lịch cho nhiều phòng
  const [selectedRoomIds, setSelectedRoomIds] = useState([]); // Array of room IDs for bulk operations
  const [selectedRooms, setSelectedRooms] = useState([]); // 🆕 Array of full room objects (for modal display)
  const [selectedRoomsMap, setSelectedRoomsMap] = useState({}); // 🆕 Map { roomId: roomObject } để giữ thông tin phòng khi chuyển trang
  const [showBulkScheduleModal, setShowBulkScheduleModal] = useState(false);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
  const [bulkSchedulesData, setBulkSchedulesData] = useState({}); // { roomId: scheduleData }
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false); // 🆕 Bật/tắt chế độ chọn nhiều
  const [isViewingAllRooms, setIsViewingAllRooms] = useState(false); // 🆕 Flag để phân biệt xem tất cả vs xem các phòng đã chọn

  const loadScheduleConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const response = await scheduleConfigService.getConfig();
      
      // ⚠️ Bắt buộc phải có config từ backend
      if (!response?.success || !response?.data) {
        toast.error('Chưa có cấu hình hệ thống. Vui lòng vào Cài đặt → Cấu hình ca làm việc để khởi tạo trước khi tạo lịch.');
        setConfigLoading(false);
        setShowCreateModal(false); // Đóng modal
        return null;
      }

      // Config hợp lệ → Build shift meta
      const built = buildShiftMetaFromConfig(response.data);
      setShiftMeta(built.meta);
      setSlotDuration(built.unitDuration);
      
      // ✅ Set selectedShifts với các ca đang active
      const activeShifts = getActiveShiftKeys(built.meta);
      setSelectedShifts(activeShifts);
      
      return built;
    } catch (error) {
      console.error('Error loading schedule config:', error);
      toast.error('Không thể lấy cấu hình ca làm việc. Vui lòng kiểm tra kết nối hoặc khởi tạo cấu hình hệ thống.');
      setConfigLoading(false);
      setShowCreateModal(false); // Đóng modal
      return null;
    } finally {
      setConfigLoading(false);
    }
  }, []);

  // 🆕 Recalculate available shifts based on selected subrooms
  const recalculateAvailableShifts = useCallback((selectedIds, subRoomStatusData = null) => {
    // 🔧 Ưu tiên dùng subRoomStatusData được truyền vào, nếu không thì dùng từ scheduleListData
    const statusData = subRoomStatusData || scheduleListData?.subRoomShiftStatus;
    
    if (!statusData || selectedIds.length === 0) {
      return;
    }

    // Lọc chỉ các buồng được chọn
    const selectedSubRoomStatuses = statusData.filter(sr =>
      selectedIds.includes(sr.subRoomId.toString())
    );

    // ✅ Tính ca thiếu: Ca đang BẬT (isActive) VÀ có ít nhất 1 buồng chưa tạo
    const missingShifts = [];
    
    // Check morning: Ca đang bật VÀ chưa generate
    if (selectedSubRoomStatuses.some(sr => sr.shifts.morning === true && sr.generatedShifts.morning === false)) {
      missingShifts.push('morning');
    }
    
    // Check afternoon: Ca đang bật VÀ chưa generate
    if (selectedSubRoomStatuses.some(sr => sr.shifts.afternoon === true && sr.generatedShifts.afternoon === false)) {
      missingShifts.push('afternoon');
    }
    
    // Check evening: Ca đang bật VÀ chưa generate
    if (selectedSubRoomStatuses.some(sr => sr.shifts.evening === true && sr.generatedShifts.evening === false)) {
      missingShifts.push('evening');
    }

    console.log(`🔄 Recalculated missing shifts for ${selectedIds.length} subrooms:`, missingShifts);
    setInitialMissingShifts(missingShifts);
    
    // ❌ KHÔNG tự động chọn ca - Để người dùng tự chọn
    // setSelectedShifts(missingShifts);
  }, [scheduleListData]);

  useEffect(() => {
    fetchRooms();
  }, [pagination.current, pagination.pageSize, scheduleStatusFilter, roomSearchTerm]); // 🔥 Add roomSearchTerm to trigger search

  const debouncedRoomSearch = useMemo(() => debounce((value) => {
    setRoomSearchTerm(value.trim().toLowerCase());
    setPagination(prev => ({ ...prev, current: 1 }));
  }, 300), [setPagination]);

  const filteredRooms = useMemo(() => {
    if (!roomSearchTerm) {
      return rooms;
    }

    return rooms.filter(room => {
      const candidateStrings = [
        room?.name,
        room?.roomNumber,
        room?.description,
        room?.location,
        Array.isArray(room?.subRooms) ? room.subRooms.map(sr => sr?.name).join(' ') : null
      ];

      return candidateStrings.some(text =>
        typeof text === 'string' && text.toLowerCase().includes(roomSearchTerm)
      );
    });
  }, [rooms, roomSearchTerm]);

  // Fetch rooms with schedule info
  const fetchRooms = async () => {
    setLoading(true);
    try {
      // � DEBUG: Check token
      const token = localStorage.getItem('accessToken');
      console.log('🔐 Token exists:', !!token, token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      
      // �🔥 When searching, fetch ALL rooms to enable search across all pages
      const shouldFetchAll = roomSearchTerm.trim() !== '';
      
      // Build params - chỉ lấy phòng hoạt động (isActive = true)
      const params = {
        page: shouldFetchAll ? 1 : pagination.current,
        limit: shouldFetchAll ? 9999 : pagination.pageSize,
        isActive: true // Chỉ lấy phòng hoạt động
      };
      
      console.log('📡 Calling API with params:', params);
      const response = await roomService.getRoomsForSchedule(params);

      console.log('🔍 Room API Response:', {
        success: response.success,
        roomsCount: response.data?.rooms?.length || 0,
        total: response.data?.total,
        firstRoom: response.data?.rooms?.[0],
        scheduleStatusFilter,
        params
      });

      if (response.success) {
        let filteredRooms = response.data.rooms;
        
        console.log('📊 Before filter - Rooms count:', filteredRooms?.length);
        
        // Apply schedule status filter based on hasBeenUsed
        if (scheduleStatusFilter === 'has-schedule') {
          filteredRooms = filteredRooms.filter(room => room.hasBeenUsed);
        } else if (scheduleStatusFilter === 'no-schedule') {
          filteredRooms = filteredRooms.filter(room => !room.hasBeenUsed);
        }
        
        console.log('📊 After filter - Rooms count:', filteredRooms?.length);
        
        setRooms(filteredRooms);
        setPagination(prev => ({
          ...prev,
          total: response.data.total
        }));
      } else {
        console.error('❌ API Error:', response.message);
        message.error(response.message || 'Không thể lấy danh sách phòng');
      }
    } catch (error) {
      console.error('❌ Error fetching rooms:', error);
      message.error('Lỗi khi lấy danh sách phòng: ' + error.message);
    }
    setLoading(false);
  };

  // Handle create schedule button click - Show schedule list first
  const handleCreateSchedule = async (room, subRoom = null) => {
    try {
      setLoading(true);
      setSelectedRoom(room);
      
      // ✅ GỌI 1 API DUY NHẤT - không truyền subRoomId để lấy tất cả
      const response = await scheduleService.getRoomSchedulesWithShifts(
        room._id,
        subRoom?._id // null nếu không chọn subroom cụ thể
      );
      
      if (response.success && response.data) {
        // 🐛 DEBUG: Log backend response
        console.log('🔍 Backend Response - Room:', room.name, 'hasSubRooms:', room.hasSubRooms);
        console.log('🔍 Schedules từ backend:', response.data.schedules?.map(s => ({
          month: s.month,
          year: s.year,
          subRoom: s.subRoom?.name || 'NO_SUBROOM',
          startDate: s.startDate,
          endDate: s.endDate
        })));
        
        setScheduleListData(response.data);
        setSelectedSubRoom(subRoom);
        
        // Show schedule list modal
        setShowScheduleListModal(true);
      } else {
        // No schedules, go straight to create
        setSelectedSubRoom(subRoom);
        await handleOpenCreateModal(room, subRoom, null);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
      // If error, still allow creating new schedule
      await handleOpenCreateModal(room, subRoom, null);
    } finally {
      setLoading(false);
    }
  };
  
  // Open create modal (new schedule or add missing shifts)
  const handleOpenCreateModal = async (room, subRoom, existingSchedule = null) => {
    setSelectedRoom(room);
    setSelectedSubRoom(subRoom);

    let builtConfig = null;
    let latestMeta = shiftMeta;
    let effectiveMeta = shiftMeta;
    let effectiveSlotDuration = slotDuration;
    let defaultShiftKeys = [];

    // 🆕 CHỈ gọi API config khi TẠO LỊCH MỚI (không phải thêm ca thiếu)
    if (!existingSchedule) {
      builtConfig = await loadScheduleConfig();
      latestMeta = builtConfig?.meta || shiftMeta;
      effectiveMeta = latestMeta;
      effectiveSlotDuration = builtConfig?.unitDuration ?? slotDuration;
      defaultShiftKeys = getActiveShiftKeys(latestMeta);
    }
    
    if (existingSchedule) {
      // Adding missing shifts to existing schedule
      setIsEditingExistingSchedule(true);
      setExistingScheduleId(existingSchedule.scheduleId);

      if (existingSchedule.shiftConfig) {
        const scheduleMeta = buildShiftMetaFromScheduleConfig(
          existingSchedule.shiftConfig,
          slotDuration || DEFAULT_SLOT_DURATION
        );
        effectiveMeta = scheduleMeta.meta;
        effectiveSlotDuration = scheduleMeta.unitDuration;
        setShiftMeta(scheduleMeta.meta);
        setSlotDuration(scheduleMeta.unitDuration);
      }
      
      // 🆕 Khi thêm ca thiếu, KHÔNG lấy từ existingSchedule vì nó chỉ chứa 1 buồng
      // Thay vào đó, lấy TẤT CẢ buồng từ selectedRoom để user có thể chọn
      if (selectedRoom?.hasSubRooms && selectedRoom.subRooms?.length > 0) {
        setSelectedSubRooms(selectedRoom.subRooms);
        console.log(`📦 Set selectedSubRooms to ALL ${selectedRoom.subRooms.length} subrooms from room`);
      } else {
        setSelectedSubRooms([]);
        console.log(`📦 Room has NO subrooms`);
      }
      
      const scheduleStart = dayjs(existingSchedule.startDate);
      const scheduleEnd = dayjs(existingSchedule.endDate);
      
      console.log('🔍 [handleOpenCreateModal] existingSchedule:', {
        month: existingSchedule.month,
        year: existingSchedule.year,
        startDate: existingSchedule.startDate,
        endDate: existingSchedule.endDate,
        scheduleStart: scheduleStart.format('DD/MM/YYYY'),
        scheduleEnd: scheduleEnd.format('DD/MM/YYYY'),
        hasSubRoom: !!existingSchedule.subRoom,
        subRoomName: existingSchedule.subRoom?.name
      });
      
      // ✅ KIỂM TRA: Nếu là tháng hiện tại và startDate <= hôm nay → Lấy ngày mai
      const today = dayjs().startOf('day');
      const tomorrow = today.add(1, 'day');
      const currentMonth = today.month() + 1; // 1-12 (để so với backend trả về month: 1-12)
      const currentYear = today.year();
      const isCurrentMonth = existingSchedule.month === currentMonth && existingSchedule.year === currentYear;
      
      console.log('🔍 [Month comparison]:', {
        'existingSchedule.month': existingSchedule.month,
        'currentMonth (today.month() + 1)': currentMonth,
        'isCurrentMonth': isCurrentMonth,
        'scheduleStart': scheduleStart.format('DD/MM/YYYY'),
        'today': today.format('DD/MM/YYYY')
      });
      
      let effectiveStartDate = scheduleStart;
      
      // ✅ FIX: Dùng .isSameOrBefore() thay vì <=
      if (isCurrentMonth && scheduleStart.isSameOrBefore(today, 'day')) {
        // Tháng hiện tại và ngày bắt đầu <= hôm nay → Bắt buộc chọn ngày mai
        effectiveStartDate = tomorrow;
        console.log(`⚠️ Tháng hiện tại, startDate (${scheduleStart.format('DD/MM/YYYY')}) <= hôm nay → Đổi sang ngày mai (${tomorrow.format('DD/MM/YYYY')})`);
      } else {
        console.log(`✅ Giữ nguyên startDate: ${scheduleStart.format('DD/MM/YYYY')}`);
      }
      
      setFromMonth(existingSchedule.month);
      setToMonth(existingSchedule.month);
      setSelectedYear(existingSchedule.year);
      setToYear(existingSchedule.year); // 🔧 FIX: Phải set toYear khi thêm ca thiếu
      setStartDate(effectiveStartDate); // ✅ Sử dụng effectiveStartDate đã kiểm tra
      setEndDate(scheduleEnd);
      
      // ⚠️ Lưu danh sách ca thiếu NHƯNG KHÔNG tự động chọn
      const missingShiftKeys = existingSchedule.missingShifts
        .filter(s => {
          // Check nếu ca này isActive trong shiftConfig của lịch
          const shiftKey = s.key; // 'morning', 'afternoon', 'evening'
          const shiftConfigForKey = existingSchedule.shiftConfig?.[shiftKey];
          
          // Nếu shiftConfig tồn tại và isActive === false → Không chọn
          if (shiftConfigForKey && shiftConfigForKey.isActive === false) {
            return false;
          }
          
          return SHIFT_KEYS.includes(shiftKey);
        })
        .map(s => s.key);
      
      // ❌ KHÔNG tự động chọn ca - Để người dùng tự chọn
      setSelectedShifts([]);
      setInitialMissingShifts(missingShiftKeys); // Save original missing shifts
      
      // 🔧 FIX: ƯU TIÊN lấy từ existingSchedule (đã filter theo tháng)
      let subRoomStatus = [];

      if (existingSchedule?.subRoomShiftStatus && existingSchedule.subRoomShiftStatus.length > 0) {
        // ✅ ĐÚNG: Thêm ca thiếu cho tháng cụ thể → chỉ lấy subrooms của tháng đó
        subRoomStatus = existingSchedule.subRoomShiftStatus;
        console.log(`✅ Lấy subRoomShiftStatus từ existingSchedule (tháng ${existingSchedule.month}/${existingSchedule.year}): ${subRoomStatus.length} buồng`);
      } else if (scheduleListData?.subRoomShiftStatus) {
        // ⚠️ Fallback: Tạo lịch mới hoặc không có data → lấy tất cả
        subRoomStatus = scheduleListData.subRoomShiftStatus;
        console.warn(`⚠️ Fallback sang scheduleListData.subRoomShiftStatus: ${subRoomStatus.length} buồng`);
      }

      const missingSubRooms = scheduleListData?.missingSubRooms || [];

      setSubRoomShiftStatus(subRoomStatus);

      console.log('📊 SubRoom Shift Status (FINAL):', subRoomStatus.map(s => ({
        id: s.subRoomId,
        name: s.subRoomName,
        shifts: s.shifts
      })));
      
      // 🆕 Log để debug
      console.log('📊 SubRoom Shift Status (from existingSchedule):', subRoomStatus);
      console.log('🏥 Missing SubRooms:', missingSubRooms);
      
      // 🆕 Init selectedSubRoomIds - chọn các buồng có isActiveSubRoom = true
      if (subRoomStatus && subRoomStatus.length > 0) {
        const activeSubRoomIds = subRoomStatus
          .filter(sr => sr.isActiveSubRoom !== false)
          .map(sr => sr.subRoomId.toString()); // ✅ Convert to string
        setSelectedSubRoomIds(activeSubRoomIds);
        console.log(`🏥 Thêm ca thiếu - Mặc định chọn ${activeSubRoomIds.length}/${subRoomStatus.length} buồng có isActiveSubRoom=true`);
        
        // 🔧 Gọi recalculate NGAY SAU KHI set selectedSubRoomIds
        // Truyền subRoomStatus để dùng data của tháng cụ thể, không phải tổng hợp
        setTimeout(() => {
          recalculateAvailableShifts(activeSubRoomIds, subRoomStatus);
          console.log(`🔄 Đã gọi recalculateAvailableShifts với ${activeSubRoomIds.length} buồng`);
        }, 0);
      } else {
        setSelectedSubRoomIds([]);
      }
      
      toast.info(
        `Thêm ca thiếu: ${existingSchedule.missingShifts.map(s => s.name).join(', ')}`
      );
    } else {
      // Creating new schedule
      setIsEditingExistingSchedule(false);
      setExistingScheduleId(null);
      
      // ✅ FIX: Load danh sách subroom từ room được chọn
      if (room?.hasSubRooms && room.subRooms?.length > 0) {
        setSelectedSubRooms(room.subRooms);
        console.log(`📦 Tạo lịch mới - Set selectedSubRooms to ${room.subRooms.length} subrooms from room:`, room.name);
      } else {
        setSelectedSubRooms([]);
        console.log(`📦 Tạo lịch mới - Room has NO subrooms`);
      }
      
      setInitialMissingShifts([]); // Clear for new schedule

      setShiftMeta(effectiveMeta);
      setSlotDuration(effectiveSlotDuration || DEFAULT_SLOT_DURATION);
      
      // 🆕 Init selectedSubRoomIds - mặc định chọn all active subrooms
      if (room.hasSubRooms && room.subRooms && room.subRooms.length > 0) {
        const activeSubRoomIds = room.subRooms
          .filter(sr => sr.isActive === true)
          .map(sr => sr._id);
        setSelectedSubRoomIds(activeSubRoomIds);
        console.log(`🏥 Mặc định chọn ${activeSubRoomIds.length}/${room.subRooms.length} buồng active`);
      } else {
        setSelectedSubRoomIds([]);
      }
      
      // 🆕 Reset partial start date
      setPartialStartDate(null);
      
      // Use suggested start date from API
      const suggestedStart = scheduleListData?.summary?.suggestedStartDate;
      const startDateToUse = suggestedStart ? dayjs(suggestedStart) : dayjs().add(1, 'day');
      
      // 🆕 Tìm tháng CHƯA CÓ LỊCH GẦN NHẤT với tháng hiện tại (có thể là quá khứ hoặc tương lai)
      const currentYear = dayjs().year();
      const currentMonth = dayjs().month() + 1;
      const availableMonths = [];
      
      // Quét từ 2 năm trước đến 2 năm sau để tìm tháng chưa có lịch
      for (let year = currentYear - 2; year <= currentYear + 2; year++) {
        for (let m = 1; m <= 12; m++) {
          const hasSchedule = isMonthScheduled(m, year);
          
          if (!hasSchedule) {
            // Tính khoảng cách từ tháng hiện tại
            const monthDiff = Math.abs((year - currentYear) * 12 + (m - currentMonth));
            availableMonths.push({ month: m, year, distance: monthDiff });
          }
        }
      }
      
      // Sắp xếp theo khoảng cách gần nhất
      availableMonths.sort((a, b) => a.distance - b.distance);
      
      const firstAvailable = availableMonths[0];
      let firstAvailableMonth = firstAvailable?.month || null;
      let firstAvailableYear = firstAvailable?.year || startDateToUse.year();
      
      if (firstAvailableMonth) {
        setFromMonth(firstAvailableMonth);
        setSelectedYear(firstAvailableYear);
        
        // 🆕 AUTO-FILL START DATE khi mở modal
        const today = dayjs().startOf('day');
        const currentMonth = today.month() + 1; // 1-12
        const currentYear = today.year();
        const isFirstMonthCurrent = firstAvailableMonth === currentMonth && firstAvailableYear === currentYear;
        
        let autoStartDate;
        if (isFirstMonthCurrent) {
          // Tháng hiện tại → Chọn ngày mai
          autoStartDate = today.add(1, 'day');
          console.log(`🎯 Modal mở (tháng hiện tại): Tự động chọn ngày ${autoStartDate.format('DD/MM/YYYY')}`);
        } else {
          // Tháng tương lai → Chọn ngày 1
          autoStartDate = dayjs().year(firstAvailableYear).month(firstAvailableMonth - 1).date(1);
          console.log(`🎯 Modal mở (tháng tương lai): Tự động chọn ngày ${autoStartDate.format('DD/MM/YYYY')}`);
        }
        
        setStartDate(autoStartDate);
      } else {
        // ⚠️ Fallback: Không tìm thấy tháng available
        const today = dayjs().startOf('day');
        const isCurrentMonth = startDateToUse.month() + 1 === today.month() + 1 && startDateToUse.year() === today.year();
        
        setFromMonth(startDateToUse.month() + 1);
        setSelectedYear(startDateToUse.year());
        
        // ✅ Đảm bảo startDate luôn >= ngày mai nếu là tháng hiện tại
        // ✅ FIX: Dùng .isSameOrBefore() thay vì <=
        if (isCurrentMonth && startDateToUse.isSameOrBefore(today, 'day')) {
          setStartDate(today.add(1, 'day'));
          console.log(`🎯 Fallback (tháng hiện tại): Tự động chọn ngày mai ${today.add(1, 'day').format('DD/MM/YYYY')}`);
        } else {
          setStartDate(startDateToUse);
          console.log(`🎯 Fallback: Sử dụng suggested start date ${startDateToUse.format('DD/MM/YYYY')}`);
        }
      }
      
      // Reset toMonth và toYear - chỉ cho chọn sau khi chọn fromMonth
      setToMonth(null);
      setToYear(null);
      setEndDate(null);
      setSelectedShifts(defaultShiftKeys);

      if (defaultShiftKeys.length === 0) {
        toast.warning('Cấu hình hiện tại không bật ca làm việc nào. Vui lòng bật ít nhất một ca trước khi tạo lịch.');
      }
      
      // Show gap warning if applicable
      if (scheduleListData?.summary?.hasGap) {
        toast.warning(
          'Có khoảng trống trong lịch. Vui lòng tạo lịch liên tục từ ngày ' + 
          dayjs(suggestedStart).format('DD/MM/YYYY')
        );
      }
    }
    
    // 🔧 FIX: Đóng modal danh sách trước, đợi một chút để tránh overlay chồng lên nhau
    setShowScheduleListModal(false);
    
    // ✅ Đợi modal cũ đóng xong + state sync xong mới mở modal mới
    // Tăng delay lên 200ms để đảm bảo React re-render startDate đúng
    setTimeout(() => {
      setShowCreateModal(true);
    }, 200);
  };

  // 🆕 Load holiday preview khi thay đổi tháng hoặc ngày bắt đầu
  const loadHolidayPreview = useCallback(async () => {
    if (!fromMonth || !toMonth || !selectedYear || !toYear || !startDate) {
      setHolidayPreview(null);
      return;
    }

    // Tính ngày kết thúc dựa trên toMonth và toYear
    const calculatedEndDate = dayjs(new Date(toYear, toMonth, 0)); // Last day of toMonth in toYear
    
    setLoadingHolidayPreview(true);
    try {
      const response = await scheduleService.getHolidayPreview(
        startDate.format('YYYY-MM-DD'),
        calculatedEndDate.format('YYYY-MM-DD')
      );
      
      if (response.success) {
        setHolidayPreview(response.data);
      }
    } catch (error) {
      console.error('Error loading holiday preview:', error);
      setHolidayPreview(null);
    } finally {
      setLoadingHolidayPreview(false);
    }
  }, [fromMonth, toMonth, selectedYear, toYear, startDate]);

  // Trigger load holiday preview khi các dependencies thay đổi
  useEffect(() => {
    if (showCreateModal && !isEditingExistingSchedule) {
      loadHolidayPreview();
    }
  }, [showCreateModal, isEditingExistingSchedule, loadHolidayPreview]);

  // Handle submit create schedule - Tạo cho TẤT CẢ buồng nếu phòng có buồng
  const handleSubmitCreateSchedule = async () => {
    if (!fromMonth || !toMonth || !selectedYear || !toYear || !startDate || selectedShifts.length === 0) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    // 🆕 Validate: Nếu room có subrooms và đang tạo mới, phải chọn ít nhất 1
    if (!isEditingExistingSchedule && selectedRoom?.hasSubRooms && selectedRoom?.subRooms?.length > 0) {
      if (selectedSubRoomIds.length === 0) {
        toast.error('Phải chọn ít nhất 1 buồng để tạo lịch');
        return;
      }
    }

    // Validate: toYear >= selectedYear, và nếu cùng năm thì toMonth >= fromMonth
    if (toYear < selectedYear || (toYear === selectedYear && toMonth < fromMonth)) {
      toast.error('Thời gian kết thúc phải sau hoặc bằng thời gian bắt đầu');
      return;
    }
    
    // 🆕 Validate: Không được chọn tháng đã có lịch - CHỈ KHI TẠO MỚI
    // Khi thêm ca thiếu (isEditingExistingSchedule), không cần check vì đang thêm vào lịch có sẵn
    if (!isEditingExistingSchedule) {
      if (isMonthScheduled(fromMonth, selectedYear)) {
        toast.error(`Tháng ${fromMonth}/${selectedYear} đã có lịch. Vui lòng chọn tháng khác.`);
        return;
      }
      
      if (isMonthScheduled(toMonth, toYear)) {
        toast.error(`Tháng ${toMonth}/${toYear} đã có lịch. Vui lòng chọn tháng khác.`);
        return;
      }
      
      // 🆕 Validate: Kiểm tra không có tháng đã có lịch trong khoảng thời gian chọn
      let currentCheckMonth = dayjs().year(selectedYear).month(fromMonth - 1);
      const endCheckMonth = dayjs().year(toYear).month(toMonth - 1);
      
      while (currentCheckMonth.isBefore(endCheckMonth) || currentCheckMonth.isSame(endCheckMonth, 'month')) {
        const checkMonth = currentCheckMonth.month() + 1;
        const checkYear = currentCheckMonth.year();
        
        if (isMonthScheduled(checkMonth, checkYear)) {
          toast.error(`Tháng ${checkMonth}/${checkYear} trong khoảng thời gian đã có lịch. Vui lòng chọn lại.`);
          return;
        }
        
        currentCheckMonth = currentCheckMonth.add(1, 'month');
      }
    }

    // Validate: Không được chọn năm/tháng trong quá khứ
    const currentYear = dayjs().year();
    const currentMonth = dayjs().month() + 1;
    const currentDate = dayjs().startOf('day');
    const today = dayjs().startOf('day');
    const tomorrow = today.add(1, 'day');
    
    if (selectedYear < currentYear) {
      toast.error('Không thể tạo lịch cho năm đã qua');
      return;
    }
    
    if (toYear < currentYear || (toYear === currentYear && toMonth < currentMonth)) {
      toast.error('Không thể tạo lịch kết thúc ở tháng đã qua');
      return;
    }
    
    // 🆕 Validate: Ngày bắt đầu - Logic mới
    const selectedMonth = startDate.month() + 1;
    const startDateYear = startDate.year(); // 🔧 Đổi tên để tránh conflict với state selectedYear
    const isCurrentMonth = selectedMonth === currentMonth && startDateYear === currentYear;
    
    // Nếu chọn tháng HIỆN TẠI → Ngày bắt đầu phải >= TOMORROW
    if (isCurrentMonth) {
      if (startDate.isBefore(tomorrow)) {
        toast.error('Ngày bắt đầu phải sau ngày hiện tại ít nhất 1 ngày (vì lịch tạo sau 1 ngày)');
        return;
      }
    } else {
      // Nếu chọn tháng TƯƠNG LAI → Ngày bắt đầu chỉ cần >= TODAY
      if (startDate.isBefore(today)) {
        toast.error('Ngày bắt đầu không được trong quá khứ');
        return;
      }
    }
    
    // ❌ REMOVED: Không bắt buộc tạo lịch liên tục - Cho phép tạo lịch bất kỳ tháng nào chưa có lịch
    // if (scheduleListData?.summary?.suggestedStartDate && !isEditingExistingSchedule) {
    //   const suggestedStart = dayjs(scheduleListData.summary.suggestedStartDate).startOf('day');
    //   if (startDate.isBefore(suggestedStart)) {
    //     toast.error(
    //       `Phải tạo lịch liên tục từ ngày ${suggestedStart.format('DD/MM/YYYY')}. Không được để trống khoảng thời gian.`
    //     );
    //     return;
    //   }
    // }

    setCreatingSchedule(true);
    try {
      // 🆕 Trường hợp THÊM CA THIẾU - Dùng API mới addMissingShifts
      if (isEditingExistingSchedule) {
        console.log('🔧 Adding missing shifts to existing schedule...');
        console.log('   Selected shifts:', selectedShifts);
        console.log('   Selected subRoom IDs (from checkboxes):', selectedSubRoomIds);
        
        // 🆕 Dùng selectedSubRoomIds (danh sách buồng được CHỌN) thay vì selectedSubRooms (toàn bộ)
        let subRoomIdsToSend = [];
        if (selectedRoom?.hasSubRooms) {
          // Nếu có chọn buồng cụ thể → Gửi danh sách đó
          // Nếu KHÔNG chọn gì (selectedSubRoomIds = []) → Gửi [] để backend tạo cho TẤT CẢ
          subRoomIdsToSend = selectedSubRoomIds;
          console.log('   SubRoom IDs to send:', subRoomIdsToSend.length > 0 ? subRoomIdsToSend : 'ALL (empty array)');
        }
        
        try {
          // 🐛 DEBUG: Log giá trị trước khi gửi request
          console.log('🔍 Preparing addMissingShifts request:');
          console.log('   fromMonth:', fromMonth);
          console.log('   selectedYear:', selectedYear);
          console.log('   toMonth:', toMonth);
          console.log('   toYear:', toYear);
          console.log('   roomId:', selectedRoom._id);
          
          const response = await scheduleService.addMissingShifts({
            roomId: selectedRoom._id,
            month: fromMonth,
            year: selectedYear,
            subRoomIds: subRoomIdsToSend,
            selectedShifts: selectedShifts,
            partialStartDate: null // Luôn tạo từ ngày bắt đầu của lịch
          });

          console.log('✅ Add missing shifts response:', response);

          if (response.success) {
            const { totalAddedSlots, results } = response.data;
            
            const successResults = results.filter(r => r.status === 'success');
            const addedShifts = selectedShifts.map(s => {
              const shiftNames = { morning: 'Ca Sáng', afternoon: 'Ca Chiều', evening: 'Ca Tối' };
              return shiftNames[s] || s;
            }).join(', ');
            
            // Show success message
            message.success({
              content: `✅ Đã thêm ca thiếu thành công! ${addedShifts} - ${successResults.length} buồng - Tổng: ${totalAddedSlots} slots`,
              duration: 5
            });
            
            // 🔧 FIX: Refresh room list để cập nhật hasBeenUsed
            fetchRooms();
            
            // Refresh schedule list
            if (selectedRoom && selectedSubRoom) {
              await fetchScheduleList(selectedRoom, selectedSubRoom);
            }
            
            // Close modal and reset
            handleCancelModal();
          } else {
            message.error(response.message || 'Không thể thêm ca thiếu');
          }
        } catch (error) {
          console.error('❌ Error adding missing shifts:', error);
          message.error(error.response?.data?.message || error.message || 'Lỗi khi thêm ca thiếu');
        }
        
        setCreatingSchedule(false);
        return;
      }
      
      // TẠO LỊCH MỚI - Dùng API generateRoomSchedule như cũ
      console.log('🔧 Creating new schedule...');
      
      // 🆕 Nếu phòng có buồng VÀ đang tạo mới, chỉ tạo cho buồng được chọn
      if (selectedRoom.hasSubRooms && selectedRoom.subRooms && selectedRoom.subRooms.length > 0 && !isEditingExistingSchedule) {
        // 🆕 Chỉ tạo cho các subrooms được chọn (selectedSubRoomIds)
        const subRoomsToCreate = selectedRoom.subRooms.filter(sr => 
          selectedSubRoomIds.includes(sr._id)
        );
        
        console.log(`🏥 Tạo lịch mới cho ${subRoomsToCreate.length} buồng được chọn:`, subRoomsToCreate.map(sr => sr.name));
        
        // 🆕 Call API once with all selected subroom IDs
        try {
          const response = await scheduleService.generateRoomSchedule({
            roomId: selectedRoom._id,
            selectedSubRoomIds, // 🆕 Pass array of subroom IDs
            fromMonth,
            toMonth,
            fromYear: selectedYear,
            toYear: toYear,
            startDate: startDate.format('YYYY-MM-DD'),
            partialStartDate: partialStartDate ? partialStartDate.format('YYYY-MM-DD') : null,
            shifts: selectedShifts
          });

          if (response.success) {
            // Group results by subroom
            const resultsBySubRoom = {};
            let totalSlots = 0;
            
            response.data?.results?.forEach(result => {
              const subRoomId = result.subRoomId;
              if (!resultsBySubRoom[subRoomId]) {
                resultsBySubRoom[subRoomId] = {
                  slots: 0,
                  status: result.status
                };
              }
              if (result.status === 'success') {
                resultsBySubRoom[subRoomId].slots += (result.slots || 0);
                totalSlots += (result.slots || 0);
              }
            });
            
            const successSubRooms = subRoomsToCreate
              .filter(sr => resultsBySubRoom[sr._id]?.status === 'success')
              .map(sr => sr.name)
              .join(', ');
            
            // Show success message
            message.success({
              content: `✅ Tạo lịch thành công cho ${Object.keys(resultsBySubRoom).length}/${subRoomsToCreate.length} buồng. Tổng: ${totalSlots} slots`,
              duration: 5
            });
            
            // Close modal and refresh room list
            setShowCreateModal(false);
            fetchRooms(); // ✅ Reload danh sách phòng để cập nhật trạng thái
          } else {
            message.error(response.message || 'Không thể tạo lịch');
          }
        } catch (error) {
          console.error('Error creating schedules:', error);
          message.error(error.message || 'Lỗi khi tạo lịch');
        }
        
        setCreatingSchedule(false);
        return;
      }
      
      // OLD LOOP CODE - Disabled
      if (false) {
        const results = [];
        let successCount = 0;
        
        // 🆕 Chỉ tạo cho các subrooms được chọn (selectedSubRoomIds)
        const subRoomsToCreate = selectedRoom.subRooms.filter(sr => 
          selectedSubRoomIds.includes(sr._id)
        );
        
        console.log(`🏥 Tạo lịch cho ${subRoomsToCreate.length} buồng được chọn:`, subRoomsToCreate.map(sr => sr.name));
        
        for (const subRoom of subRoomsToCreate) {
          try {
            const response = await scheduleService.generateRoomSchedule({
              roomId: selectedRoom._id,
              subRoomId: subRoom._id,
              fromMonth,
              toMonth,
              fromYear: selectedYear,
              toYear: toYear,
              startDate: startDate.format('YYYY-MM-DD'),
              partialStartDate: partialStartDate ? partialStartDate.format('YYYY-MM-DD') : null, // 🆕
              shifts: selectedShifts
            });

            if (response.success) {
              results.push({ subRoom: subRoom.name, status: 'success' });
              successCount++;
            } else {
              results.push({ subRoom: subRoom.name, status: 'failed', message: response.message });
            }
          } catch (error) {
            results.push({ subRoom: subRoom.name, status: 'error', message: error.message });
          }
        }
        
        // 🆕 Cập nhật message hiển thị
        const notSelectedCount = selectedRoom.subRooms.length - subRoomsToCreate.length;
        
        toast.success(
          `Tạo lịch thành công cho ${successCount}/${subRoomsToCreate.length} buồng được chọn` +
          (notSelectedCount > 0 ? ` (${notSelectedCount} buồng không được chọn)` : '')
        );
      } else {
        // Phòng không có buồng HOẶC đang edit existing
        const response = await scheduleService.generateRoomSchedule({
          roomId: selectedRoom._id,
          subRoomId: selectedSubRoom?._id,
          fromMonth,
          toMonth,
          fromYear: selectedYear,
          toYear: toYear,
          startDate: startDate.format('YYYY-MM-DD'),
          partialStartDate: partialStartDate ? partialStartDate.format('YYYY-MM-DD') : null, // 🆕
          shifts: selectedShifts
        });

        if (response.success) {
          // Kiểm tra xem có tháng nào bị skip không
          const skippedMonths = response.data?.results?.filter(r => r.status === 'skipped') || [];
          const successMonths = response.data?.results?.filter(r => r.status === 'success') || [];
          const updatedMonths = response.data?.results?.filter(r => r.status === 'updated') || [];
          
          if (updatedMonths.length > 0) {
            // Có tháng được cập nhật (thêm ca mới)
            const totalAddedSlots = updatedMonths.reduce((sum, m) => sum + (m.addedSlots || 0), 0);
            const addedShifts = selectedShifts.map(s => {
              const shiftNames = { morning: 'Ca Sáng', afternoon: 'Ca Chiều', evening: 'Ca Tối' };
              return shiftNames[s] || s;
            }).join(', ');
            
            Modal.success({
              title: '✅ Đã thêm ca thiếu thành công!',
              content: (
                <div>
                  <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                    Đã thêm {addedShifts}
                  </Text>
                  <br />
                  <br />
                  {updatedMonths.map((m, idx) => (
                    <div key={idx} style={{ marginBottom: 12 }}>
                      <Text strong>📅 Tháng {m.month}/{selectedYear}:</Text>
                      <br />
                      <Text type="secondary">{m.message}</Text>
                      <br />
                      <Text strong style={{ color: '#1890ff' }}>
                        Đã tạo thêm {m.addedSlots} slots
                      </Text>
                    </div>
                  ))}
                  <Divider style={{ margin: '12px 0' }} />
                  <Text type="secondary">
                    Tổng cộng: <Text strong>{totalAddedSlots}</Text> slots mới
                  </Text>
                </div>
              )
            });
          } else if (skippedMonths.length > 0 && successMonths.length === 0) {
            // Tất cả tháng đều đã có lịch đầy đủ
            Modal.info({
              title: 'Lịch đã tồn tại đầy đủ',
              content: (
                <div>
                  {skippedMonths.map((m, idx) => (
                    <div key={idx} style={{ marginBottom: 8 }}>
                      <Text strong>Tháng {m.month}:</Text>
                      <br />
                      <Text>{m.existingScheduleInfo?.message || 'Đã có lịch'}</Text>
                    </div>
                  ))}
                </div>
              )
            });
          } else if (skippedMonths.length > 0 && successMonths.length > 0) {
            // Một số tháng đã có, một số tạo mới
            const totalNewSlots = successMonths.reduce((sum, m) => sum + (m.slots || 0), 0);
            Modal.success({
              title: '✅ Tạo lịch thành công!',
              content: (
                <div>
                  <Text>Đã tạo lịch cho <Text strong>{successMonths.length}</Text> tháng</Text>
                  <br />
                  <Text type="secondary">{skippedMonths.length} tháng đã có lịch trước đó</Text>
                  <Divider style={{ margin: '12px 0' }} />
                  <Text strong style={{ color: '#1890ff' }}>
                    Tổng slots mới: {totalNewSlots}
                  </Text>
                </div>
              )
            });
          } else if (successMonths.length > 0) {
            // Chỉ có tháng tạo mới thành công
            const totalNewSlots = successMonths.reduce((sum, m) => sum + (m.slots || 0), 0);
            const createdShifts = selectedShifts.map(s => {
              const shiftNames = { morning: 'Ca Sáng', afternoon: 'Ca Chiều', evening: 'Ca Tối' };
              return shiftNames[s] || s;
            }).join(', ');
            
            Modal.success({
              title: '✅ Tạo lịch thành công!',
              content: (
                <div>
                  <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                    Đã tạo {createdShifts}
                  </Text>
                  <br />
                  <br />
                  <Text>Tạo lịch cho <Text strong>{successMonths.length}</Text> tháng</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {successMonths.map(m => `Tháng ${m.month}`).join(', ')}
                  </Text>
                  <Divider style={{ margin: '12px 0' }} />
                  <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                    Tổng slots: {totalNewSlots}
                  </Text>
                </div>
              )
            });
          } else {
            toast.success(response.message || 'Tạo lịch thành công!');
          }
        } else {
          toast.error(response.message || 'Lỗi khi tạo lịch');
        }
      }
      
      setShowCreateModal(false);
      fetchRooms(); // Refresh list
    } catch (error) {
      toast.error('Lỗi khi tạo lịch: ' + error.message);
    } finally {
      setCreatingSchedule(false);
    }
  };

  // Handle cancel modal
  const handleCancelModal = () => {
    setShowCreateModal(false);
    setShowScheduleListModal(false);
    setShowEditModal(false); // 🆕 Close edit modal
    setEditingSchedule(null); // 🆕 Reset editing schedule
    setSelectedRoom(null);
    setSelectedSubRoom(null);
    setSelectedSubRooms([]);
    setScheduleListData(null);
    setIsEditingExistingSchedule(false);
    setExistingScheduleId(null);
    setStartDate(null);
    setEndDate(null);
    setFromMonth(dayjs().month() + 1);
    setToMonth(dayjs().month() + 1);
    setSelectedYear(dayjs().year());
    setToYear(dayjs().year());
    setSelectedShifts(['morning', 'afternoon', 'evening']);
    // Reset schedule list filters
    setScheduleListFilterType('all');
    setScheduleListSearchMonth(null);
    setScheduleListActiveFilter('all'); // 🆕 Reset active filter
  };

  // 🆕 Open Edit Schedule Modal
  const handleOpenEditModal = (roomId, month, year, scheduleListData) => {
    console.log('📝 Opening edit modal for room:', roomId, 'month:', month, 'year:', year);
    console.log('📊 Schedule list data:', scheduleListData);
    
    // ✅ Filter schedules theo tháng/năm được chọn
    const filteredSchedules = scheduleListData?.schedules?.filter(
      s => s.month === month && s.year === year
    ) || [];
    
    console.log(`🔍 Filtered ${filteredSchedules.length} schedules for ${month}/${year}`);
    
    if (filteredSchedules.length === 0) {
      message.warning(`Không tìm thấy lịch tháng ${month}/${year}`);
      return;
    }
    
    setEditingSchedule({
      roomId,
      month,
      year,
      scheduleListData: {
        ...scheduleListData,
        schedules: filteredSchedules // ✅ Chỉ pass schedules của tháng này
      }
    });
    setShowEditModal(true);
  };

  // 🆕 Handle Edit Schedule Success
    const handleEditSuccess = async (result) => {
  console.log('✅ Edit schedule success:', result);
  toast.success('Cập nhật lịch thành công');
  
  // 🔧 Đóng modal edit
  setShowEditModal(false);
  setEditingSchedule(null);
  
  // 🔧 Reload schedule list (giữ modal danh sách lịch mở)
  if (selectedRoom) {
    setLoading(true); // 🔧 Hiển thị loading khi đang refresh
    try {
      const response = await scheduleService.getRoomSchedulesWithShifts(
        selectedRoom._id,
        selectedSubRoom?._id
      );
      
      if (response.success && response.data) {
        console.log('🔄 Refreshing schedule list data...', response.data);
        
        // 🔧 Force update bằng cách set null trước rồi mới set data mới
        setScheduleListData(null);
        setTimeout(() => {
          setScheduleListData(response.data);
          console.log('✅ Schedule list data updated');
        }, 100);
      }
    } catch (error) {
      console.error('Error reloading schedules:', error);
      toast.error('Không thể tải lại danh sách lịch');
    } finally {
      setLoading(false); // 🔧 Tắt loading
    }
  }
};
    // 🆕 Handle Cancel Edit Modal (chỉ đóng modal edit, giữ modal danh sách lịch)
  const handleCancelEditModal = () => {
    console.log('❌ Cancel edit modal');
    setShowEditModal(false);
    setEditingSchedule(null);
    // Không đóng showScheduleListModal - giữ modal danh sách lịch mở
  };

  // 🆕 Handle Open Enable Modal
  const handleOpenEnableModal = (groupData) => {
    setEnableModalData(groupData); // Truyền toàn bộ group data
    setShowEnableModal(true);
  };

  // 🆕 Handle Enable Success
  const handleEnableSuccess = async () => {
    toast.success('Đã kích hoạt ca/buồng thành công');
    setShowEnableModal(false);
    
    // Reload schedule list
    if (selectedRoom) {
      setLoading(true);
      try {
        const response = await scheduleService.getRoomSchedulesWithShifts(
          selectedRoom._id,
          selectedSubRoom?._id
        );
        
        if (response.success && response.data) {
          setScheduleListData(null);
          setTimeout(() => {
            setScheduleListData(response.data);
          }, 100);
        }
      } catch (error) {
        console.error('Error reloading schedules:', error);
        toast.error('Không thể tải lại danh sách lịch');
      } finally {
        setLoading(false);
      }
    }
  };

  // 🆕 Helper: Lấy danh sách các tháng/năm đã có lịch
  const getScheduledMonths = useCallback(() => {
    if (!scheduleListData?.schedules || scheduleListData.schedules.length === 0) {
      return new Set();
    }

    const scheduledMonths = new Set();
    scheduleListData.schedules.forEach(schedule => {
      const start = dayjs(schedule.startDate);
      const end = dayjs(schedule.endDate);
      
      // Lặp qua tất cả tháng từ startDate đến endDate
      let current = start.startOf('month');
      while (current.isBefore(end) || current.isSame(end, 'month')) {
        const monthYear = `${current.year()}-${current.month() + 1}`;
        scheduledMonths.add(monthYear);
        current = current.add(1, 'month');
      }
    });

    return scheduledMonths;
  }, [scheduleListData]);

  // 🆕 Helper: Kiểm tra tháng/năm đã có lịch chưa
  const isMonthScheduled = useCallback((month, year) => {
    const scheduledMonths = getScheduledMonths();
    return scheduledMonths.has(`${year}-${month}`);
  }, [getScheduledMonths]);

  // Calculate date range for selected months
  const getDateRange = (fromMonth, toMonth, fromYear, toYear) => {
    const start = dayjs().year(fromYear).month(fromMonth - 1).date(1);
    const end = dayjs().year(toYear).month(toMonth - 1).endOf('month');
    
    return { start, end };
  };

  // Disable dates before fromMonth start or after toMonth end
  // If current month is selected, start date must be >= tomorrow
  // For new schedules: Must be continuous from last schedule's end date
  const disabledDate = (current) => {
    if (!current) return false;
    
    const today = dayjs().startOf('day');
    const tomorrow = today.add(1, 'day');
    const currentMonth = today.month() + 1; // 1-12
    const currentYear = today.year();
    
    // If editing existing schedule (adding missing shifts), dates are fixed
    if (isEditingExistingSchedule) {
      return true; // Disable all dates - can't change
    }
    
    // 🆕 CRITICAL: Chỉ cho chọn ngày trong THÁNG/NĂM BẮT ĐẦU đã chọn
    if (!fromMonth || !selectedYear) {
      // Chưa chọn tháng/năm → Cho phép chọn tất cả (sẽ tự động update fromMonth sau)
      return false;
    }
    
    // 🆕 Giới hạn: Chỉ cho chọn ngày trong tháng/năm bắt đầu
    const selectedDateMonth = current.month() + 1; // 1-12
    const selectedDateYear = current.year();
    
    // Nếu ngày được chọn KHÔNG PHẢI tháng/năm bắt đầu → Disable
    if (selectedDateMonth !== fromMonth || selectedDateYear !== selectedYear) {
      return true; // Disable dates outside fromMonth/selectedYear
    }
    
    // 🆕 Nếu tháng/năm bắt đầu = tháng/năm HIỆN TẠI
    const isStartMonthCurrent = fromMonth === currentMonth && selectedYear === currentYear;
    
    if (isStartMonthCurrent) {
      // ✅ Tháng hiện tại: Bắt buộc chọn từ ngày mai
      if (current < tomorrow) {
        return true; // Disable hôm nay và quá khứ
      }
    } else {
      // ✅ Tháng/năm bắt đầu là TƯƠNG LAI → Cho chọn từ ngày 1
      // Nhưng vẫn không cho chọn quá khứ (nếu có)
      if (current < today) {
        return true; // Disable past dates
      }
    }
    
    // 🆕 VALIDATION BỔ SUNG: Đảm bảo tính liên tục (không có khoảng trống)
    // Chỉ áp dụng khi có lịch cũ và đang tạo lịch mới (không phải thêm ca thiếu)
    if (scheduleListData?.summary?.suggestedStartDate) {
      const suggestedStart = dayjs(scheduleListData.summary.suggestedStartDate).startOf('day');
      
      // Nếu có khoảng trống, phải bắt đầu từ ngày được đề xuất (lấp khoảng trống)
      if (scheduleListData.summary.hasGap) {
        // Must start from suggested date to fill the gap
        if (current < suggestedStart) {
          return true;
        }
        
        // If filling a gap, must be in the same month as suggested start
        const suggestedMonth = suggestedStart.month() + 1;
        const suggestedYear = suggestedStart.year();
        
        if (fromMonth !== suggestedMonth || selectedYear !== suggestedYear) {
          return current > suggestedStart.endOf('month');
        }
      }
    }
    
    // Tất cả checks đã pass → Cho phép chọn
    return false;
  };

  // 🆕 Handle view bulk schedules
  const handleViewBulkSchedules = async () => {
    if (selectedRoomIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 phòng');
      return;
    }

    setLoading(true);
    try {
      const schedulesData = {};
      
      // Fetch schedules cho từng phòng
      for (const roomId of selectedRoomIds) {
        const response = await scheduleService.getRoomSchedulesWithShifts(roomId);
        if (response.success) {
          schedulesData[roomId] = response.data;
        }
      }

      // 🔥 Lấy thông tin đầy đủ của các phòng đã chọn từ selectedRoomsMap
      const roomsToShow = selectedRoomIds
        .map(id => selectedRoomsMap[id])
        .filter(room => room !== undefined); // Filter out any missing rooms

      setSelectedRooms(roomsToShow);
      setBulkSchedulesData(schedulesData);
      setIsViewingAllRooms(false); // 🆕 Đang xem các phòng đã chọn
      setShowBulkScheduleModal(true);
    } catch (error) {
      console.error('Error fetching bulk schedules:', error);
      toast.error('Lỗi khi lấy thông tin lịch');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Handle view ALL rooms schedules (lấy TẤT CẢ phòng từ BE, không phụ thuộc filter UI)
  const handleViewAllRoomsSchedules = async () => {
    setLoading(true);
    try {
      // 🔥 Gọi API để lấy TẤT CẢ phòng từ BE (không giới hạn bởi filter UI)
      const allRoomsResponse = await roomService.getRooms(1, 1000); // Lấy max 1000 phòng
      
      // 🔧 FIX: getRooms() trả về trực tiếp { total, page, rooms }, không có wrapper success
      if (!allRoomsResponse?.rooms || !Array.isArray(allRoomsResponse.rooms)) {
        toast.error('Không thể lấy danh sách phòng');
        return;
      }

      const allRooms = allRoomsResponse.rooms;
      console.log(`📋 Fetched ${allRooms.length} rooms from BE for viewing all schedules`);
      
      const schedulesData = {};
      
      // Fetch schedules cho TẤT CẢ các phòng từ BE
      for (const room of allRooms) {
        const response = await scheduleService.getRoomSchedulesWithShifts(room._id);
        if (response.success) {
          schedulesData[room._id] = response.data;
        }
      }

      // 🔥 Set selectedRooms để modal biết danh sách phòng
      setSelectedRooms(allRooms);
      setBulkSchedulesData(schedulesData);
      setIsViewingAllRooms(true); // 🆕 Đang xem tất cả phòng
      setShowBulkScheduleModal(true);
    } catch (error) {
      console.error('Error fetching all rooms schedules:', error);
      toast.error('Lỗi khi lấy thông tin lịch');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Handle bulk create success
  const handleBulkCreateSuccess = () => {
    fetchRooms(); // Refresh rooms list
    setSelectedRoomIds([]); // Clear selection
    setSelectedRoomsMap({}); // 🔥 Clear map
  };

  // Table columns
  const columns = [
    // 🆕 Checkbox column - chỉ hiển thị khi bật bulk selection mode
    ...(bulkSelectionMode ? [{
      title: (
        <Checkbox
          checked={
            filteredRooms.length > 0 && 
            filteredRooms.every(room => selectedRoomIds.includes(room._id))
          }
          indeterminate={
            filteredRooms.some(room => selectedRoomIds.includes(room._id)) &&
            !filteredRooms.every(room => selectedRoomIds.includes(room._id))
          }
          onChange={(e) => {
            if (e.target.checked) {
              // Thêm tất cả phòng của page hiện tại vào selection (không xóa phòng đã chọn từ page khác)
              const currentPageRoomIds = filteredRooms.map(r => r._id);
              const newSelection = [...new Set([...selectedRoomIds, ...currentPageRoomIds])];
              setSelectedRoomIds(newSelection);
              
              // 🔥 Cập nhật selectedRoomsMap để giữ thông tin phòng
              const newMap = { ...selectedRoomsMap };
              filteredRooms.forEach(room => {
                newMap[room._id] = room;
              });
              setSelectedRoomsMap(newMap);
            } else {
              // Bỏ chọn tất cả phòng của page hiện tại (giữ lại phòng đã chọn từ page khác)
              const currentPageRoomIds = filteredRooms.map(r => r._id);
              setSelectedRoomIds(selectedRoomIds.filter(id => !currentPageRoomIds.includes(id)));
              
              // 🔥 Xóa khỏi map
              const newMap = { ...selectedRoomsMap };
              currentPageRoomIds.forEach(id => {
                delete newMap[id];
              });
              setSelectedRoomsMap(newMap);
            }
          }}
        />
      ),
      key: 'checkbox',
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={selectedRoomIds.includes(record._id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRoomIds([...selectedRoomIds, record._id]);
              // 🔥 Lưu room object vào map
              setSelectedRoomsMap({ ...selectedRoomsMap, [record._id]: record });
            } else {
              setSelectedRoomIds(selectedRoomIds.filter(id => id !== record._id));
              // 🔥 Xóa khỏi map
              const newMap = { ...selectedRoomsMap };
              delete newMap[record._id];
              setSelectedRoomsMap(newMap);
            }
          }}
        />
      )
    }] : []),
    {
      title: 'Tên phòng',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.roomNumber}
          </Text>
        </div>
      )
    },
    {
      title: 'Loại phòng',
      dataIndex: 'hasSubRooms',
      key: 'hasSubRooms',
      width: 120,
      render: (hasSubRooms) => (
        <Tag color={hasSubRooms ? 'blue' : 'green'}>
          {hasSubRooms ? 'Có buồng' : 'Không buồng'}
        </Tag>
      )
    },
    {
      title: 'Trạng thái hoạt động',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 150,
      render: (isActive) => (
        <Tag 
          color={isActive ? 'success' : 'error'}
          icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {isActive ? 'Đang hoạt động' : 'Không hoạt động'}
        </Tag>
      )
    },
    {
      title: 'Trạng thái lịch',
      dataIndex: 'hasBeenUsed',
      key: 'hasBeenUsed',
      width: 150,
      render: (hasBeenUsed) => (
        <Tag 
          color={hasBeenUsed ? 'success' : 'default'}
          icon={hasBeenUsed ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {hasBeenUsed ? 'Đã tạo lịch' : 'Chưa tạo lịch'}
        </Tag>
      )
    },
    {
      title: 'Lần tạo cuối',
      dataIndex: 'lastScheduleGenerated',
      key: 'lastScheduleGenerated',
      width: 150,
      render: (date) => {
        return date ? (
          <div>
            <Text type="secondary">{dayjs(date).format('DD/MM/YYYY')}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {dayjs(date).format('HH:mm')}
            </Text>
          </div>
        ) : (
          <Text type="secondary">Chưa có</Text>
        );
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 250,
      fixed: 'right', // 🔥 Fix để button luôn hiển thị ở bên phải
      render: (_, record) => {
        // Chỉ disable khi đang ở bulk mode (vì chỉ hiển thị phòng hoạt động nên không cần check isActive)
        const isDisabled = bulkSelectionMode;
        
        // 🔥 Thông báo rõ ràng khi đang ở bulk mode
        const tooltipTitle = bulkSelectionMode 
          ? "Đang ở chế độ chọn nhiều phòng. Vui lòng tắt chế độ này để tạo lịch cho từng phòng riêng lẻ."
          : "";
        
        if (!record.hasSubRooms) {
          // Phòng không có buồng
          return (
            <Tooltip title={tooltipTitle}>
              <Button
                type="primary"
                icon={<CalendarOutlined />}
                onClick={(e) => {
                  e.stopPropagation(); // 🔥 Prevent event bubbling
                  if (!bulkSelectionMode) {
                    handleCreateSchedule(record);
                  }
                }}
                disabled={isDisabled}
                block
                style={{ 
                  pointerEvents: isDisabled ? 'none' : 'auto',
                  opacity: bulkSelectionMode ? 0.5 : 1 // 🔥 Visual feedback
                }}
              >
                {record.hasBeenUsed ? 'Xem & tạo lịch' : 'Tạo lịch mới'}
              </Button>
            </Tooltip>
          );
        } else {
          // Phòng có buồng - click để xem tất cả buồng
          return (
            <Tooltip title={tooltipTitle}>
              <Button
                type="primary"
                icon={<CalendarOutlined />}
                onClick={(e) => {
                  e.stopPropagation(); // 🔥 Prevent event bubbling
                  if (!bulkSelectionMode) {
                    handleCreateSchedule(record);
                  }
                }}
                disabled={isDisabled}
                block
                style={{ 
                  pointerEvents: isDisabled ? 'none' : 'auto',
                  opacity: bulkSelectionMode ? 0.5 : 1 // 🔥 Visual feedback
                }}
              >
                {record.hasBeenUsed ? 'Xem & tạo lịch' : 'Tạo lịch'} ({record.subRooms?.length || 0} buồng)
              </Button>
            </Tooltip>
          );
        }
      }
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
    }}>
      {/* Header with enhanced styling */}
      <Card 
        style={{ 
          marginBottom: 24,
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          border: '2px solid rgba(59, 130, 246, 0.2)'
        }}
        bodyStyle={{ padding: '24px 32px' }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space align="center" size="large">
              <Button
                type="text"
                icon={<ArrowLeftOutlined style={{ fontSize: 20, color: '#fff' }} />}
                onClick={() => navigate('/dashboard/schedule')}
                style={{ 
                  padding: '4px 8px',
                  color: '#fff',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              />
              <div>
                <Title level={3} style={{ margin: 0, color: '#fff', fontWeight: 600 }}>
                  <CalendarOutlined style={{ marginRight: 12 }} />
                  Tạo lịch làm việc cho phòng khám
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                  Quản lý và tạo lịch làm việc cho các phòng khám
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Button
              icon={<WarningOutlined />}
              onClick={() => setShowOverrideModal(true)}
              size="large"
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fff',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                fontWeight: 500,
                height: 44,
                borderRadius: 10,
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(245, 158, 11, 0.3)';
                e.currentTarget.style.borderColor = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              Tạo lịch làm việc ngày nghỉ
            </Button>
          </Col>
        </Row>
      </Card>


      {/* 🆕 Bulk Operations - Multi-select rooms - Enhanced */}
      <Card 
        style={{ 
          marginBottom: 16,
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          borderRadius: 16,
          border: '2px solid #bfdbfe',
          boxShadow: '0 4px 16px rgba(59, 130, 246, 0.15)'
        }}
        bodyStyle={{ padding: '28px 32px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <Space align="center" size="middle">
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
              }}>
                <CalendarOutlined style={{ fontSize: 24, color: '#fff' }} />
              </div>
              <div>
                <Text strong style={{ fontSize: 18, color: '#1976d2', display: 'block' }}>
                  Tạo lịch hàng loạt cho nhiều phòng
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Chọn và tạo lịch cho nhiều phòng cùng lúc
                </Text>
              </div>
            </Space>
            <Space wrap>
              <Button
                icon={<EyeOutlined />}
                onClick={handleViewAllRoomsSchedules}
                loading={loading}
                size="large"
                style={{ 
                  borderRadius: 8,
                  fontWeight: 500,
                  height: 40
                }}
              >
                Xem tất cả lịch
              </Button>
              <Button
                type={bulkSelectionMode ? 'primary' : 'default'}
                icon={bulkSelectionMode ? <CheckCircleOutlined /> : <PlusOutlined />}
                onClick={() => {
                  setBulkSelectionMode(!bulkSelectionMode);
                  if (bulkSelectionMode) {
                    // Tắt mode → Clear selections
                    setSelectedRoomIds([]);
                    setSelectedRoomsMap({}); // 🔥 Clear map
                  }
                }}
                size="large"
                style={{ 
                  borderRadius: 8,
                  fontWeight: 500,
                  height: 40,
                  background: bulkSelectionMode ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
                  border: bulkSelectionMode ? 'none' : undefined
                }}
              >
                {bulkSelectionMode ? '✓ Đang chọn nhiều phòng' : 'Bật chọn nhiều phòng'}
              </Button>
            </Space>
          </div>
          
          {bulkSelectionMode && (
            <>
              <Alert
                type="info"
                showIcon
                message={<Text strong>📌 Chế độ chọn nhiều phòng đã bật</Text>}
                description={
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    <div><Text strong>Cách 1:</Text> Tick vào checkbox bên trái mỗi phòng trong bảng</div>
                    <div><Text strong>Cách 2:</Text> Chọn trong ô tìm kiếm bên dưới</div>
                  </div>
                }
                closable
                style={{ 
                  borderRadius: 8,
                  border: '1px solid #91d5ff'
                }}
              />
              
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="🔍 Tìm và chọn các phòng cần tạo lịch..."
                size="large"
                filterOption={(input, option) => {
                  // 🔥 Tìm trong cả filteredRooms VÀ selectedRoomsMap
                  let room = filteredRooms.find(r => r._id === option.value);
                  if (!room) {
                    room = selectedRoomsMap[option.value];
                  }
                  if (!room) return false;
                  
                  const searchText = input.toLowerCase();
                  return (
                    room.name?.toLowerCase().includes(searchText) ||
                    room.roomNumber?.toLowerCase().includes(searchText) ||
                    room.description?.toLowerCase().includes(searchText)
                  );
                }}
                value={selectedRoomIds}
                onChange={(newIds) => {
                  setSelectedRoomIds(newIds);
                  // 🔥 Khi bỏ chọn từ Select, cũng xóa khỏi map
                  const removedIds = selectedRoomIds.filter(id => !newIds.includes(id));
                  if (removedIds.length > 0) {
                    const newMap = { ...selectedRoomsMap };
                    removedIds.forEach(id => {
                      delete newMap[id];
                    });
                    setSelectedRoomsMap(newMap);
                  }
                }}
                maxTagCount="responsive"
              >
                {/* 🔥 Hiển thị cả phòng của page hiện tại VÀ các phòng đã chọn từ page khác */}
                {Array.from(new Set([
                  ...filteredRooms.map(r => r._id),
                  ...Object.keys(selectedRoomsMap)
                ])).map(roomId => {
                  const room = filteredRooms.find(r => r._id === roomId) || selectedRoomsMap[roomId];
                  if (!room) return null;
                  
                  return (
                    <Option key={room._id} value={room._id}>
                      <Space>
                        <Text strong>{room.name}</Text>
                        {room.roomNumber && (
                          <Text type="secondary">({room.roomNumber})</Text>
                        )}
                        {room.hasSubRooms && (
                          <Tag color="blue" style={{ fontSize: 11 }}>
                            {room.subRooms?.length || 0} buồng
                          </Tag>
                        )}
                      </Space>
                    </Option>
                  );
                })}
              </Select>

              {/* 🆕 Quick Actions - Always visible when bulk mode is on */}
              <Space wrap>
                <Button
                  icon={<CheckCircleOutlined />}
                  onClick={async () => {
                    try {
                      setLoading(true);
                      // 🔥 Fetch ALL rooms (không phụ thuộc pagination)
                      const params = {
                        page: 1,
                        limit: 9999
                      };
                      
                      // Chỉ lấy phòng hoạt động (isActive = true)
                      params.isActive = true;
                      
                      const response = await roomService.getRoomsForSchedule(params);

                      if (response.success) {
                        let allRooms = response.data.rooms;
                        
                        // Apply schedule status filter
                        if (scheduleStatusFilter === 'has-schedule') {
                          allRooms = allRooms.filter(room => room.hasBeenUsed);
                        } else if (scheduleStatusFilter === 'no-schedule') {
                          allRooms = allRooms.filter(room => !room.hasBeenUsed);
                        }
                        
                        // Select all
                        const allRoomIds = allRooms.map(r => r._id);
                        setSelectedRoomIds(allRoomIds);
                        
                        // Build map
                        const newMap = {};
                        allRooms.forEach(room => {
                          newMap[room._id] = room;
                        });
                        setSelectedRoomsMap(newMap);
                        
                        message.success(`Đã chọn tất cả ${allRooms.length} phòng`);
                      } else {
                        message.error('Không thể lấy danh sách phòng');
                      }
                    } catch (error) {
                      console.error('Error fetching all rooms:', error);
                      message.error('Lỗi khi lấy danh sách phòng');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  loading={loading}
                  size="large"
                  style={{ 
                    borderRadius: 8,
                    fontWeight: 500
                  }}
                >
                  Chọn tất cả phòng
                </Button>
                
                <Button
                  icon={<CloseCircleOutlined />}
                  onClick={() => {
                    setSelectedRoomIds([]);
                    setSelectedRoomsMap({});
                    message.info('Đã bỏ chọn tất cả');
                  }}
                  disabled={selectedRoomIds.length === 0}
                  size="large"
                  style={{ 
                    borderRadius: 8,
                    fontWeight: 500
                  }}
                >
                  Bỏ chọn tất cả
                </Button>
              </Space>

              {/* Selection Info & Actions - Only show when has selection */}
              {selectedRoomIds.length > 0 && (
                <Card
                  style={{ 
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                    borderRadius: 10,
                    border: '2px dashed #1890ff',
                    boxShadow: '0 2px 8px rgba(24, 144, 255, 0.15)'
                  }}
                  bodyStyle={{ padding: '16px 20px' }}
                >
                  <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                    {/* Left side - Info & View */}
                    <Space wrap>
                      <Tag 
                        color="blue" 
                        icon={<CheckCircleOutlined />} 
                        style={{ 
                          fontSize: 15, 
                          padding: '6px 16px',
                          borderRadius: 8,
                          fontWeight: 600
                        }}
                      >
                        {selectedRoomIds.length} phòng đã chọn
                      </Tag>
                      <Button
                        icon={<EyeOutlined />}
                        onClick={handleViewBulkSchedules}
                        loading={loading}
                        size="large"
                        style={{ 
                          borderRadius: 8,
                          fontWeight: 500
                        }}
                      >
                        Xem lịch các phòng
                      </Button>
                    </Space>
                    
                    {/* Right side - Create button */}
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        console.log('🚀 Opening Bulk Create Modal');
                        console.log('📊 selectedRoomIds:', selectedRoomIds);
                        console.log('📋 selectedRoomsMap keys:', Object.keys(selectedRoomsMap));
                        console.log('🔍 selectedRooms to pass:', selectedRoomIds.map(id => selectedRoomsMap[id]).filter(Boolean));
                        setShowBulkCreateModal(true);
                      }}
                      size="large"
                      style={{ 
                        borderRadius: 8,
                        fontWeight: 600,
                        height: 42,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                      }}
                    >
                      🚀 Tạo lịch cho tất cả
                    </Button>
                  </Space>
                </Card>
              )}
            </>
          )}
        </Space>
      </Card>

      {/* Rooms Table - Enhanced */}
      <Card
        style={{ 
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}
        bodyStyle={{ padding: 0 }}
      >
      {/* Filters Section - Enhanced */}
        <Row gutter={[16, 16]} align="middle" style={{ padding: '0px 0px 20px 0px' }}>
          <Col xs={24} sm={24} md={8} lg={6}>
            <Input
              allowClear
              placeholder="Tìm kiếm phòng..."
              prefix={<SearchOutlined />}
              value={roomSearchValue}
              onChange={(e) => {
                const { value } = e.target;
                setRoomSearchValue(value);
                debouncedRoomSearch(value);
              }}
              size="large"
              style={{ 
                borderRadius: 8,
                border: '2px solid #e8e8e8'
              }}
            />
          </Col>
          <Col xs={24} sm={24} md={16} lg={18}>
            <Space wrap style={{ float: 'right' }}>
              {/* Schedule Status Filter - Radio */}
              <Radio.Group 
                value={scheduleStatusFilter} 
                onChange={(e) => setScheduleStatusFilter(e.target.value)}
                buttonStyle="solid"
                size="large"
              >
                <Radio.Button value="all">
                  <span style={{ fontWeight: 500 }}>Tất cả</span>
                </Radio.Button>
                <Radio.Button value="no-schedule">
                  <span style={{ fontWeight: 500 }}>Chưa có lịch</span>
                </Radio.Button>
                <Radio.Button value="has-schedule">
                  <span style={{ fontWeight: 500 }}>Đã có lịch</span>
                </Radio.Button>
              </Radio.Group>
              
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchRooms}
                loading={loading}
                size="large"
                style={{ 
                  borderRadius: 8,
                  fontWeight: 500
                }}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
        <div style={{ 
          padding: '16px 24px',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderBottom: '2px solid #dee2e6'
        }}>
          <Space align="center" style={{marginLeft: '-10px'}}>
           <EnvironmentOutlined style={{fontSize:16, color:'#1890ff'}} />
            <Text strong style={{ fontSize: 16 }}>
              Danh sách phòng khám
            </Text>
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {pagination.total} phòng
            </Tag>
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={filteredRooms}
          loading={loading}
          rowKey="_id"
          scroll={{ 
            x: bulkSelectionMode ? 1400 : 1200
            // Remove y scroll to show all 10 rows without scrolling
          }}
          pagination={roomSearchTerm ? false : {
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} phòng`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            },
            style: { padding: '16px 24px' }
          }}
          rowClassName={(record, index) => {
            return index % 2 === 0 ? 'table-row-light' : 'table-row-dark';
          }}
        />
      </Card>

      {/* Schedule List Modal - Show existing schedules */}
      <Modal
        title={
          <Space>
            <CalendarOutlined style={{ color: '#1890ff' }} />
            <span>Danh sách lịch đã tạo - {selectedRoom?.name}</span>
          </Space>
        }
        open={showScheduleListModal}
        onCancel={handleCancelModal}
        footer={[
          <Button key="close" onClick={handleCancelModal}>
            Đóng
          </Button>,
          <Button 
            key="create" 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={async () => await handleOpenCreateModal(selectedRoom, selectedSubRoom, null)}
          >
            Tạo lịch mới
          </Button>
        ]}
        width={800}
        bodyStyle={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}
            >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Đang tải dữ liệu...</Text>
            </div>
          </div>
        ) : scheduleListData && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Summary Info */}
            <Card size="small" style={{ backgroundColor: '#f0f5ff' }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div>
                  <Text strong>Tổng số lịch: </Text>
                  <Tag color="blue">{scheduleListData.summary.totalSchedules}</Tag>
                </div>
                {scheduleListData.summary.lastCreatedDate && (
                  <div>
                    <Text strong>Lần cập nhật cuối: </Text>
                    <Text type="secondary">
                      {dayjs(scheduleListData.summary.lastCreatedDate).format('DD/MM/YYYY HH:mm')}
                    </Text>
                  </div>
                )}
                {scheduleListData.summary.hasGap && (
                  <Alert
                    type="warning"
                    showIcon
                    message="Có khoảng trống trong lịch"
                    description={
                      <div>
                        <Text>Vui lòng tạo lịch liên tục từ ngày: </Text>
                        <Text strong>
                          {dayjs(scheduleListData.summary.suggestedStartDate).format('DD/MM/YYYY')}
                        </Text>
                      </div>
                    }
                  />
                )}
              </Space>
            </Card>

            {/* Filter and Search Section */}
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong style={{ marginRight: 12 }}>Lọc theo ca:</Text>
                  <Radio.Group 
                    value={scheduleListFilterType} 
                    onChange={(e) => setScheduleListFilterType(e.target.value)}
                  >
                    <Radio.Button value="all">Tất cả</Radio.Button>
                    <Radio.Button value="missing">Lịch còn thiếu ca</Radio.Button>
                    <Radio.Button value="complete">Lịch đầy đủ</Radio.Button>
                  </Radio.Group>
                </div>
                <div>
                  <Text strong style={{ marginRight: 12 }}>Lọc theo trạng thái:</Text>
                  <Radio.Group 
                    value={scheduleListActiveFilter} 
                    onChange={(e) => setScheduleListActiveFilter(e.target.value)}
                  >
                    <Radio.Button value="all">Tất cả</Radio.Button>
                    <Radio.Button value="active">Đang hoạt động</Radio.Button>
                    <Radio.Button value="inactive">Đã tắt</Radio.Button>
                  </Radio.Group>
                </div>
                <div>
                  <Text strong style={{ marginRight: 12 }}>Tìm theo tháng/năm:</Text>
                  <Select
                    value={scheduleListSearchMonth}
                    onChange={(value) => setScheduleListSearchMonth(value)}
                    placeholder="Chọn tháng/năm để tìm lịch"
                    style={{ width: 200 }}
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={
                      scheduleListData?.schedules
                        ? Array.from(
                            new Set(
                              scheduleListData.schedules.map(
                                (s) => `${s.year}-${String(s.month).padStart(2, '0')}`
                              )
                            )
                          )
                            .sort((a, b) => b.localeCompare(a)) // Sort desc (newest first)
                            .map((monthYear) => {
                              const [year, month] = monthYear.split('-');
                              return {
                                value: monthYear,
                                label: `Tháng ${parseInt(month)}/${year}`
                              };
                            })
                        : []
                    }
                  />
                  {scheduleListSearchMonth && (
                    <Text type="secondary" style={{ marginLeft: 12 }}>
                      (Tìm lịch của tháng này)
                    </Text>
                  )}
                </div>
              </Space>
            </Card>

            {/* Schedule List */}
            <div>
              <Text strong>
                {scheduleListFilterType === 'missing' && 'Các lịch còn thiếu ca'}
                {scheduleListFilterType === 'complete' && 'Các lịch đầy đủ'}
                {scheduleListFilterType === 'all' && 'Lịch'}
                {scheduleListSearchMonth && (() => {
                  const [year, month] = scheduleListSearchMonth.split('-');
                  return ` (Tháng ${parseInt(month)}/${year})`;
                })()}
                {!scheduleListSearchMonth && ':'}
              </Text>
              {(() => {
                try {
                  // Safety check
                  if (!scheduleListData?.schedules || !Array.isArray(scheduleListData.schedules)) {
                    return (
                      <Alert
                        type="warning"
                        showIcon
                        message="Không có dữ liệu lịch"
                        style={{ marginTop: 12 }}
                      />
                    );
                  }

                  // 🆕 NHÓM schedules theo month/year
                  const scheduleGroups = scheduleListData.schedules.reduce((groups, schedule) => {
                    const key = `${schedule.month}-${schedule.year}`;
                    if (!groups[key]) {
                      groups[key] = {
                        month: schedule.month,
                        year: schedule.year,
                        startDate: null, // 🔧 FIX: Sẽ được set sau khi collect tất cả schedules
                        endDate: null,   // 🔧 FIX: Sẽ được set sau khi collect tất cả schedules
                        schedules: [],
                        subRooms: []
                      };
                    }
                    groups[key].schedules.push(schedule);
                    
                    // 🔧 FIX: Update startDate/endDate từ schedule có cùng month/year
                    // Vì tất cả schedules trong group đều cùng month/year, nên startDate/endDate giống nhau
                    if (!groups[key].startDate) {
                      groups[key].startDate = schedule.startDate;
                      groups[key].endDate = schedule.endDate;
                    }
                    
                    // Thu thập subroom info
                    if (schedule.subRoom) {
                      groups[key].subRooms.push({
                        _id: schedule.subRoom._id,
                        name: schedule.subRoom.name,
                        scheduleId: schedule.scheduleId,
                        hasMissingShifts: schedule.hasMissingShifts,
                        isExpired: schedule.isExpired,
                        generatedShifts: schedule.generatedShifts,
                        missingShifts: schedule.missingShifts
                      });
                    }
                    return groups;
                  }, {});

                  // Convert to array và sort theo month/year
                  let groupedSchedules = Object.values(scheduleGroups).sort((a, b) => {
                    if (a.year !== b.year) return a.year - b.year;
                    return a.month - b.month;
                  });

                  // 🆕 Thêm thông tin từ subRoomShiftStatus và missingSubRooms
                  groupedSchedules = groupedSchedules.map(group => {
                    const allSubRooms = [];
                    
                    // 🔧 FIX: Build subRoomShiftStatus RIÊNG cho group này từ schedules
                    const groupSubRoomShiftStatus = [];
                    
                    group.schedules.forEach(schedule => {
                      if (schedule.subRoom) {
                        // 🔧 Build shifts object từ generatedShifts và missingShifts
                        const shifts = { morning: false, afternoon: false, evening: false };
                        const generatedShifts = { morning: false, afternoon: false, evening: false };
                        
                        // Set shifts = true nếu ca đã tạo hoặc còn thiếu (tức là ca active)
                        if (schedule.generatedShifts) {
                          schedule.generatedShifts.forEach(shift => {
                            if (shift.key) {
                              shifts[shift.key] = true;
                              generatedShifts[shift.key] = true;
                            }
                          });
                        }
                        
                        if (schedule.missingShifts) {
                          schedule.missingShifts.forEach(shift => {
                            if (shift.key) {
                              shifts[shift.key] = true; // Ca thiếu cũng là ca active
                            }
                          });
                        }
                        
                        groupSubRoomShiftStatus.push({
                          subRoomId: schedule.subRoom._id,
                          subRoomName: schedule.subRoom.name,
                          isActive: schedule.subRoom.isActive, // isActive hiện tại của subroom (từ room-service)
                          isActiveSubRoom: schedule.subRoom.isActiveSubRoom, // ✅ FIX: Lấy từ subRoom object
                          shifts: shifts,
                          generatedShifts: generatedShifts,
                          month: schedule.month,
                          year: schedule.year
                        });
                      }
                    });
                    
                    // 🔧 FIX: CHỈ lấy các buồng ĐÃ CÓ LỊCH trong tháng này (từ groupSubRoomShiftStatus)
                    // KHÔNG lấy từ selectedRoom.subRooms vì sẽ bao gồm cả buồng chưa có lịch
                    groupSubRoomShiftStatus.forEach(statusData => {
                      const scheduleForThisSubRoom = group.schedules.find(
                        s => s.subRoom?._id.toString() === statusData.subRoomId.toString()
                      );

                      allSubRooms.push({
                        _id: statusData.subRoomId,
                        name: statusData.subRoomName,
                        isActive: statusData.isActive, // isActive của subroom (từ room-service)
                        hasSchedule: true, // ✅ Tất cả buồng ở đây đều có lịch
                        scheduleId: scheduleForThisSubRoom?.scheduleId,
                        hasMissingShifts: scheduleForThisSubRoom?.hasMissingShifts,
                        generatedShifts: scheduleForThisSubRoom?.generatedShifts || [],
                        missingShifts: scheduleForThisSubRoom?.missingShifts || [],
                        disabledShifts: scheduleForThisSubRoom?.disabledShifts || [],
                        isExpired: scheduleForThisSubRoom?.isExpired,
                        shifts: statusData.shifts,
                        isActiveSubRoom: statusData.isActiveSubRoom // ✅ Lấy từ schedule.isActiveSubRoom của tháng này
                      });
                    });

                    // ⭐ Tính toán trạng thái nhóm - LOGIC MỚI (ÁP DỤNG CHO CẢ PHÒNG CÓ VÀ KHÔNG CÓ BUỒNG)
                    let allComplete = false;
                    
                    if (allSubRooms.length > 0) {
                      // PHÒNG CÓ BUỒNG: Kiểm tra xem TẤT CẢ các buồng ACTIVE có đầy đủ hay không
                      const activeSubRooms = allSubRooms.filter(sr => sr.isActiveSubRoom === true);
                      
                      if (activeSubRooms.length > 0) {
                        // Có buồng active → check từng buồng
                        allComplete = activeSubRooms.every(subRoom => {
                          const activeShifts = ['morning', 'afternoon', 'evening'].filter(
                            shift => subRoom.shifts && subRoom.shifts[shift] === true
                          );
                          const generatedShiftKeys = (subRoom.generatedShifts || []).map(s => s.key);
                          
                          // Buồng đầy đủ = tất cả ca active đều đã tạo
                          return activeShifts.length > 0 && 
                                 activeShifts.every(shift => generatedShiftKeys.includes(shift));
                        });
                      }
                    } else {
                      // PHÒNG KHÔNG CÓ BUỒNG: Kiểm tra ca của schedule đầu tiên
                      const schedule = group.schedules[0];
                      if (schedule) {
                        // Build shifts object từ generatedShifts và missingShifts
                        const activeShifts = [];
                        const generatedShiftKeys = (schedule.generatedShifts || []).map(s => s.key);
                        
                        // Thu thập tất cả ca active (đã tạo + còn thiếu)
                        if (schedule.generatedShifts) {
                          schedule.generatedShifts.forEach(shift => {
                            if (shift.key && !activeShifts.includes(shift.key)) {
                              activeShifts.push(shift.key);
                            }
                          });
                        }
                        if (schedule.missingShifts) {
                          schedule.missingShifts.forEach(shift => {
                            if (shift.key && !activeShifts.includes(shift.key)) {
                              activeShifts.push(shift.key);
                            }
                          });
                        }
                        
                        // Phòng đầy đủ = tất cả ca active đều đã tạo
                        allComplete = activeShifts.length > 0 && 
                                     activeShifts.every(shift => generatedShiftKeys.includes(shift));
                      }
                    }
                    
                    // Nếu TẤT CẢ đều đầy đủ → group đầy đủ
                    // Ngược lại → group còn thiếu
                    const hasAnyMissingShifts = !allComplete;
                    
                    const isExpired = group.schedules.every(s => s.isExpired);
                    
                    // 🔥 KHÔNG cho phép "Thêm ca thiếu" nếu TẤT CẢ schedules đều isActive=false
                    const allInactive = group.schedules.every(s => s.isActive === false);
                    const canCreate = group.schedules.some(s => s.canCreate) && !allInactive;

                    return {
                      ...group,
                      allSubRooms,
                      groupSubRoomShiftStatus, // 🔧 ADD: Thêm subRoomShiftStatus riêng của group
                      hasMissingShifts: hasAnyMissingShifts,
                      isExpired,
                      canCreate,
                      allInactive // 🆕 Thêm flag này để hiển thị tooltip
                    };
                  });

                  // Apply filters
                  if (scheduleListFilterType === 'missing') {
                    groupedSchedules = groupedSchedules.filter(g => g.hasMissingShifts);
                  } else if (scheduleListFilterType === 'complete') {
                    groupedSchedules = groupedSchedules.filter(g => !g.hasMissingShifts);
                  }
                  
                  // 🆕 Apply active/inactive filter
                  if (scheduleListActiveFilter === 'active') {
                    groupedSchedules = groupedSchedules.filter(g => {
                      // Lọc lịch đang hoạt động (có ít nhất 1 schedule isActive=true)
                      return g.schedules.some(s => s.isActive !== false);
                    });
                  } else if (scheduleListActiveFilter === 'inactive') {
                    groupedSchedules = groupedSchedules.filter(g => {
                      // Lọc lịch đã tắt (TẤT CẢ schedules đều isActive=false)
                      return g.schedules.every(s => s.isActive === false);
                    });
                  }

                  // Apply date search filter
                  if (scheduleListSearchMonth) {
                    groupedSchedules = groupedSchedules.filter(g => {
                      try {
                        const [searchYear, searchMonth] = scheduleListSearchMonth.split('-');
                        return g.year === parseInt(searchYear) && g.month === parseInt(searchMonth);
                      } catch (err) {
                        console.error('Error parsing month/year:', err);
                        return false;
                      }
                    });
                  }

                  if (groupedSchedules.length === 0) {
                    return (
                      <Alert
                        type="info"
                        showIcon
                        message="Không tìm thấy lịch"
                        description={
                          scheduleListSearchMonth 
                            ? (() => {
                                const [year, month] = scheduleListSearchMonth.split('-');
                                return `Không có lịch nào ${scheduleListFilterType === 'missing' ? 'còn thiếu ca ' : scheduleListFilterType === 'complete' ? 'đầy đủ ' : ''}tháng ${parseInt(month)}/${year}`;
                              })()
                            : `Không có lịch nào ${scheduleListFilterType === 'missing' ? 'còn thiếu ca' : 'đầy đủ'}`
                        }
                        style={{ marginTop: 12 }}
                      />
                    );
                  }

                  return (
                    <List
                      bordered
                      dataSource={groupedSchedules}
                      renderItem={(group, index) => (
                        <List.Item
                          actions={
                            group.hasMissingShifts 
                              ? [
                                  <Tooltip 
                                    title={
                                      group.isExpired 
                                        ? `Lịch đã kết thúc vào ${dayjs(group.endDate).format('DD/MM/YYYY')}`
                                        : group.allInactive
                                        ? 'Lịch đã tắt, không thể thêm ca thiếu'
                                        : !group.canCreate
                                        ? 'Có ca thiếu hoặc buồng đang tắt hoạt động'
                                        : 'Thêm các ca chưa tạo vào lịch này'
                                    }
                                  >
                                    <Button
                                      type="link"
                                      icon={<PlusOutlined />}
                                      onClick={async () => {
                                        // 🔧 FIX: Tạo object đại diện cho group với month/year chính xác
                                        // 🐛 DEBUG: Log để kiểm tra
                                        console.log('🔍 [Group clicked]:', {
                                          month: group.month,
                                          year: group.year,
                                          startDate: group.startDate,
                                          endDate: group.endDate,
                                          schedulesCount: group.schedules.length,
                                          firstSchedule: group.schedules[0] ? {
                                            month: group.schedules[0].month,
                                            year: group.schedules[0].year,
                                            startDate: group.schedules[0].startDate,
                                            endDate: group.schedules[0].endDate,
                                            subRoom: group.schedules[0].subRoom?.name
                                          } : null,
                                          allSchedules: group.schedules.map(s => ({
                                            month: s.month,
                                            year: s.year,
                                            startDate: s.startDate,
                                            endDate: s.endDate,
                                            subRoom: s.subRoom?.name
                                          }))
                                        });
                                        
                                        const groupRepresent = {
                                          scheduleId: group.schedules[0]?.scheduleId, // 🔧 Thêm scheduleId
                                          month: group.month,
                                          year: group.year,
                                          startDate: group.startDate,
                                          endDate: group.endDate,
                                          missingShifts: group.schedules[0]?.missingShifts || [],
                                          shiftConfig: group.schedules[0]?.shiftConfig, // 🔧 Thêm shiftConfig
                                          subRoom: group.schedules[0]?.subRoom, // 🔧 Thêm subRoom info
                                          subRoomShiftStatus: group.groupSubRoomShiftStatus || [] // 🔧 ADD: Thêm subRoomShiftStatus của tháng này
                                        };
                                        
                                        console.log('✅ [groupRepresent]:', groupRepresent);
                                        
                                        await handleOpenCreateModal(selectedRoom, null, groupRepresent);
                                      }}
                                      disabled={group.isExpired || !group.canCreate}
                                      style={group.isExpired || !group.canCreate ? { color: '#d9d9d9' } : { color: '#faad14' }}
                                    >
                                      {group.isExpired ? 'Đã quá hạn' : 
                                       !group.canCreate ? 'Không thể tạo' : 
                                       'Thêm ca thiếu'}
                                    </Button>
                                  </Tooltip>,
                                  <Tooltip title={group.isExpired ? 'Lịch đã quá hạn, không thể tạo lịch ngày nghỉ' : 'Tạo lịch làm việc trong ngày nghỉ'}>
                                    <Button
                                      type="link"
                                      onClick={() => {
                                        // Open edit modal với toàn bộ schedules của tháng này
                                        handleOpenEditModal(
                                          selectedRoom._id,
                                          group.month,
                                          group.year,
                                          scheduleListData
                                        );
                                      }}
                                      disabled={group.isExpired}
                                      style={group.isExpired ? { color: '#d9d9d9' } : { color: '#1890ff' }}
                                    >
                                      Tạo lịch ngày nghỉ
                                    </Button>
                                  </Tooltip>,
                                  <Tooltip title="Kích hoạt lại các ca/buồng bị tắt">
                                    <Button
                                      type="link"
                                      onClick={() => {
                                        // Truyền toàn bộ group data
                                        handleOpenEnableModal({
                                          ...group,
                                          roomName: selectedRoom.name
                                        });
                                      }}
                                      style={{ color: '#52c41a' }}
                                    >
                                      Bật ca/buồng tắt
                                    </Button>
                                  </Tooltip>
                                ]
                            : [
                                <Tag icon={<CheckCircleOutlined />} color="success">
                                  Đầy đủ
                                </Tag>,
                                <Tooltip title={group.isExpired ? 'Lịch đã quá hạn, không thể tạo lịch ngày nghỉ' : 'Tạo lịch làm việc trong ngày nghỉ'}>
                                  <Button
                                    type="link"
                                    onClick={() => {
                                      handleOpenEditModal(
                                        selectedRoom._id,
                                        group.month,
                                        group.year,
                                        scheduleListData
                                      );
                                    }}
                                    disabled={group.isExpired}
                                    style={group.isExpired ? { color: '#d9d9d9' } : { color: '#1890ff' }}
                                  >
                                    Tạo lịch ngày nghỉ
                                  </Button>
                                </Tooltip>,
                                <Tooltip title="Kích hoạt lại các ca/buồng bị tắt">
                                  <Button
                                    type="link"
                                    onClick={() => {
                                      // Truyền toàn bộ group data
                                      handleOpenEnableModal({
                                        ...group,
                                        roomName: selectedRoom.name
                                      });
                                    }}
                                    style={{ color: '#52c41a' }}
                                  >
                                    Bật ca/buồng tắt
                                  </Button>
                                </Tooltip>
                              ]
                        }
                      >
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          {/* Header */}
                          <div>
                            <Tag color="blue">Lịch #{index + 1}</Tag>
                            <Text strong style={{ marginLeft: 8 }}>
                              Tháng {group.month}/{group.year}
                            </Text>
                            
                            {/* 🆕 Active Status Badge */}
                            {(() => {
                              const allActive = group.schedules.every(s => s.isActive !== false);
                              const allInactive = group.schedules.every(s => s.isActive === false);
                              
                              if (allInactive) {
                                return (
                                  <Tag color="red" style={{ marginLeft: 8 }}>
                                    Đã tắt
                                  </Tag>
                                );
                              } else if (allActive) {
                                return (
                                  <Tag color="green" style={{ marginLeft: 8 }}>
                                    Đang hoạt động
                                  </Tag>
                                );
                              } else {
                                return (
                                  <Tag color="orange" style={{ marginLeft: 8 }}>
                                    Hoạt động một phần
                                  </Tag>
                                );
                              }
                            })()}
                            
                            {/* Expired Badge */}
                            {group.isExpired && (
                              <Tag color="red" icon={<CloseCircleOutlined />} style={{ marginLeft: 8 }}>
                                Đã hết hạn
                              </Tag>
                            )}
                            
                            {/* Complete Badge */}
                            {!group.hasMissingShifts && !group.isExpired && (
                              <Tag color="success" icon={<CheckCircleOutlined />} style={{ marginLeft: 8 }}>
                                Đầy đủ
                              </Tag>
                            )}
                          </div>

                          {/* Date Range */}
                          <div>
                            <Text type="secondary">
                              {dayjs(group.startDate).format('DD/MM/YYYY')} - {dayjs(group.endDate).format('DD/MM/YYYY')}
                            </Text>
                          </div>
                          
                          {/* Expired Warning */}
                          {group.isExpired && (
                            <Alert
                              type="error"
                              showIcon
                              message="Lịch đã quá ngày có thể tạo"
                              description={`Lịch này đã kết thúc vào ${dayjs(group.endDate).format('DD/MM/YYYY')}. Không thể thêm ca thiếu.`}
                              style={{ fontSize: 12, marginTop: 4 }}
                            />
                          )}
                          
                          {/* Cannot Create Warning */}
                          {/* {!group.isExpired && group.hasMissingShifts && group.canCreate === false && (
                            // <Alert
                            //   type="warning"
                            //   showIcon
                            //   message="Không thể tạo ca thiếu"
                            //   description="Tất cả các ca còn thiếu đều đang tắt hoạt động. Vui lòng bật lại ca trong cấu hình trước khi tạo."
                            //   style={{ fontSize: 12, marginTop: 4 }}
                            // />
                          )} */}
                          
                          {/* 🆕 Hiển thị thông tin ca */}
                          <div style={{ marginTop: 8 }}>
                            {group.allSubRooms && group.allSubRooms.length > 0 ? (
                              <>
                                <Text strong>Buồng:</Text>
                                <div style={{ marginTop: 4 }}>
                                  {group.allSubRooms.map((subRoom, idx) => {
                                    // ⭐ Tính toán trạng thái "Đầy đủ"
                                    // Nếu isActiveSubroom = true → check tất cả ca đã có lịch
                                    let isComplete = false;
                                    if (subRoom.isActiveSubRoom === true) {
                                      // Buồng đang BẬT → check ca active có đủ chưa
                                      const activeShifts = ['morning', 'afternoon', 'evening'].filter(
                                        shift => subRoom.shifts && subRoom.shifts[shift] === true
                                      );
                                      const generatedShiftKeys = (subRoom.generatedShifts || []).map(s => s.key);
                                      
                                      // Đầy đủ = tất cả ca active đều đã tạo
                                      isComplete = activeShifts.length > 0 && 
                                                   activeShifts.every(shift => generatedShiftKeys.includes(shift));
                                    } else {
                                      // Buồng đang TẮT → không check đầy đủ
                                      isComplete = false;
                                    }
                                    
                                    return (
                                    <Card 
                                      key={idx} 
                                      size="small" 
                                      style={{ 
                                        marginBottom: 8,
                                        backgroundColor: '#f6ffed'
                                      }}
                                    >
                                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                        <div>
                                          <Tag color="cyan">{subRoom.name}</Tag>
                                          {subRoom.isActiveSubRoom === false && <Tag color="red">Đang tắt</Tag>}
                                          {isComplete && (
                                            <Tag color="success" icon={<CheckCircleOutlined />}>Đầy đủ</Tag>
                                          )}
                                        </div>
                                        
                                        <>
                                          <div>
                                            <Text type="secondary" style={{ fontSize: 12 }}>Ca đã tạo: </Text>
                                            {subRoom.generatedShifts && subRoom.generatedShifts.length > 0 ? (
                                              subRoom.generatedShifts.map(shift => (
                                                <Tag key={shift.key} color={shift.color} style={{ fontSize: 11 }}>
                                                  {shift.name}
                                                  </Tag>
                                                ))
                                              ) : (
                                                <Text type="secondary" italic style={{ fontSize: 11 }}>Chưa có ca</Text>
                                              )}
                                            </div>
                                            
                                            {subRoom.hasMissingShifts && (
                                              <div>
                                                <Text type="warning" style={{ fontSize: 12 }}>Ca còn thiếu: </Text>
                                                {subRoom.missingShifts.map(shift => (
                                                  <Tag 
                                                    key={shift.key} 
                                                    color={shift.color}
                                                    style={{ fontSize: 11 }}
                                                  >
                                                    {shift.name}
                                                  </Tag>
                                                ))}
                                              </div>
                                            )}
                                            
                                            {/* 🆕 Ca đã tắt */}
                                            {subRoom.disabledShifts && subRoom.disabledShifts.length > 0 && (
                                              <div>
                                                <Text type="secondary" style={{ fontSize: 12 }}>Ca đang tắt: </Text>
                                                {subRoom.disabledShifts.map(shift => (
                                                  <Tag 
                                                    key={shift.key} 
                                                    color="default"
                                                    style={{ fontSize: 11, opacity: 0.6 }}
                                                  >
                                                    {shift.name}
                                                  </Tag>
                                                ))}
                                              </div>
                                            )}
                                          </>
                                      </Space>
                                    </Card>
                                    );
                                  })}
                                </div>
                              </>
                            ) : (
                              // 🔧 Phòng KHÔNG CÓ BUỒNG - Hiển thị thông tin ca
                              <>
                                <Text strong>Ca làm việc:</Text>
                                {group.schedules && group.schedules.length > 0 && (
                                  <Card 
                                    size="small" 
                                    style={{ 
                                      marginTop: 4,
                                      backgroundColor: '#f6ffed'
                                    }}
                                  >
                                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                      {(() => {
                                        const schedule = group.schedules[0]; // Lấy schedule đầu tiên
                                        return (
                                          <>
                                            <div>
                                              <Text type="secondary" style={{ fontSize: 12 }}>Ca đã tạo: </Text>
                                              {schedule.generatedShifts && schedule.generatedShifts.length > 0 ? (
                                                schedule.generatedShifts.map(shift => (
                                                  <Tag key={shift.key} color={shift.color} style={{ fontSize: 11 }}>
                                                    {shift.name}
                                                  </Tag>
                                                ))
                                              ) : (
                                                <Text type="secondary" italic style={{ fontSize: 11 }}>Chưa có ca</Text>
                                              )}
                                            </div>
                                            
                                            {schedule.hasMissingShifts && schedule.missingShifts && schedule.missingShifts.length > 0 && (
                                              <div>
                                                <Text type="warning" style={{ fontSize: 12 }}>Ca còn thiếu: </Text>
                                                {schedule.missingShifts.map(shift => (
                                                  <Tag 
                                                    key={shift.key} 
                                                    color={shift.color}
                                                    style={{ fontSize: 11 }}
                                                  >
                                                    {shift.name}
                                                  </Tag>
                                                ))}
                                              </div>
                                            )}
                                            
                                            {schedule.disabledShifts && schedule.disabledShifts.length > 0 && (
                                              <div>
                                                <Text type="secondary" style={{ fontSize: 12 }}>Ca đang tắt: </Text>
                                                {schedule.disabledShifts.map(shift => (
                                                  <Tag 
                                                    key={shift.key} 
                                                    color="default"
                                                    style={{ fontSize: 11, opacity: 0.6 }}
                                                  >
                                                    {shift.name}
                                                  </Tag>
                                                ))}
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </Space>
                                  </Card>
                                )}
                              </>
                            )}
                          </div>
                        </Space>
                      </List.Item>
                    )}
                    style={{ maxHeight: 400, overflow: 'auto', marginTop: 12 }}
                  />
                );
                } catch (error) {
                  console.error('Error rendering schedule list:', error);
                  return (
                    <Alert
                      type="error"
                      showIcon
                      message="Lỗi hiển thị danh sách"
                      description="Đã xảy ra lỗi khi hiển thị danh sách lịch. Vui lòng thử lại."
                      style={{ marginTop: 12 }}
                    />
                  );
                }
              })()}
            </div>

            {/* Instructions */}
            {/* <Alert
              type="info"
              showIcon
              message="Hướng dẫn"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Click "Thêm ca thiếu" để thêm ca còn thiếu vào lịch đã tạo</li>
                  <li>Click "Tạo lịch mới" để tạo lịch cho khoảng thời gian mới</li>
                  <li>Lịch mới phải được tạo liên tục, không được bỏ trống tháng ở giữa</li>
                </ul>
              }
            /> */}
          </Space>
        )}
      </Modal>

      {/* Create Schedule Modal */}
      <Modal
        title={
          <Space>
            <CalendarOutlined style={{ color: '#1890ff' }} />
            <span>
              {isEditingExistingSchedule ? (
                selectedSubRooms.length > 1 ? (
                  `Thêm ca thiếu cho ${selectedSubRooms.length} buồng (${selectedSubRooms.map(sr => sr.name).join(', ')})`
                ) : (
                  `Thêm ca thiếu cho lịch ${selectedSubRoom ? selectedSubRoom.name : selectedRoom?.name}`
                )
              ) : (
                `Tạo lịch mới cho ${selectedSubRoom ? selectedSubRoom.name : selectedRoom?.name}`
              )}
            </span>
          </Space>
        }
        open={showCreateModal}
        onOk={handleSubmitCreateSchedule}
        onCancel={handleCancelModal}
        okText={isEditingExistingSchedule ? "Thêm ca" : "Tạo lịch"}
        cancelText="Hủy"
        width={900}
        confirmLoading={creatingSchedule}
        bodyStyle={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {isEditingExistingSchedule && (
            <Alert
              type="info"
              showIcon
              message="Đang thêm ca thiếu"
              description="Ngày bắt đầu và kết thúc không thể thay đổi. Chỉ có thể chọn các ca còn thiếu."
            />
          )}
          
          {scheduleListData?.summary?.hasGap && !isEditingExistingSchedule && (
            <Alert
              type="warning"
              showIcon
              message="Có khoảng trống trong lịch"
              description={
                <div>
                  <Text>Vui lòng tạo lịch liên tục từ ngày: </Text>
                  <Text strong>
                    {dayjs(scheduleListData.summary.suggestedStartDate).format('DD/MM/YYYY')}
                  </Text>
                </div>
              }
            />
          )}
          
          {/* Room Info */}
          <Card size="small" style={{ backgroundColor: '#f5f5f5' }}>
            <Text strong>Phòng: </Text>
            <Text>{selectedRoom?.name}</Text>
            {selectedRoom?.hasSubRooms && (
              <>
                <br />
                <Text strong>Loại: </Text>
                <Text>Phòng có {selectedRoom.subRooms?.length || 0} buồng con</Text>
              </>
            )}
          </Card>

          {/* 🆕 Subroom & Shift Selection - Cho TẠO MỚI */}
          {!isEditingExistingSchedule && selectedRoom?.hasSubRooms && selectedRoom?.subRooms?.length > 0 ? (
            <Row gutter={16} style={{ marginTop: 16 }}>
              {/* Left: Subroom Selection */}
              <Col span={12}>
                <div>
                  <Text strong>
                    Chọn buồng tạo lịch <Text type="danger">*</Text>
                  </Text>
                  {/* <Alert
                    type="info"
                    showIcon
                    message="Chọn buồng cần tạo lịch"
                    description="Buồng đã tắt hoạt động không thể chọn (màu xám). Phải chọn ít nhất 1 buồng."
                    style={{ marginTop: 8, marginBottom: 8, fontSize: 12 }}
                  /> */}
                  <Space direction="vertical" style={{ marginTop: 8, width: '100%' }}>
                    {selectedRoom.subRooms.map(subRoom => (
                      <Checkbox
                        key={subRoom._id}
                        value={subRoom._id}
                        checked={selectedSubRoomIds.includes(subRoom._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubRoomIds([...selectedSubRoomIds, subRoom._id]);
                            console.log(`✅ Chọn buồng: ${subRoom.name}`);
                          } else {
                            setSelectedSubRoomIds(selectedSubRoomIds.filter(id => id !== subRoom._id));
                            console.log(`❌ Bỏ chọn buồng: ${subRoom.name}`);
                          }
                        }}
                        disabled={!subRoom.isActive}
                      >
                        <Space>
                          <Tag color={subRoom.isActive ? 'green' : 'gray'}>{subRoom.name}</Tag>
                          {!subRoom.isActive && <Tag color="gray">Đang tắt</Tag>}
                        </Space>
                      </Checkbox>
                    ))}
                  </Space>
                  
                  {selectedSubRoomIds.length === 0 && (
                    <Alert
                      type="warning"
                      message="⚠️ Phải chọn ít nhất 1 buồng"
                      showIcon
                      style={{ marginTop: 8, fontSize: 11 }}
                    />
                  )}
                  
                  {selectedSubRoomIds.length > 0 && (
                    <Alert
                      type="success"
                      showIcon
                      message={`Đã chọn ${selectedSubRoomIds.length}/${selectedRoom.subRooms.filter(sr => sr.isActive).length} buồng`}
                      style={{ marginTop: 8, fontSize: 11 }}
                    />
                  )}
                </div>
              </Col>

              {/* Right: Shift Selection */}
              <Col span={12}>
                <div>
                  <Text strong>Chọn ca làm việc <Text type="danger">*</Text></Text>
                  {/* <Alert
                    type="info"
                    showIcon
                    message="Lưu ý"
                    description="Hệ thống sẽ lưu cấu hình CẢ 3 CA. Ca không chọn có thể tạo sau với cấu hình cũ nếu trùng khoảng thời gian."
                    style={{ marginTop: 8, marginBottom: 8, fontSize: 12 }}
                  /> */}
                  <Spin spinning={configLoading}>
                    <Space direction="vertical" style={{ marginTop: 8 }}>
                      <Checkbox 
                        value="morning"
                        checked={selectedShifts.includes('morning')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedShifts([...selectedShifts, 'morning']);
                          } else {
                            setSelectedShifts(selectedShifts.filter(s => s !== 'morning'));
                          }
                        }}
                        disabled={!shiftMeta.morning?.isActive}
                      >
                        <Space>
                          <Tag color={SHIFT_COLORS.morning}>{shiftMeta.morning?.name}</Tag>
                          <Text type="secondary">({shiftMeta.morning?.startTime ?? '--:--'} - {shiftMeta.morning?.endTime ?? '--:--'})</Text>
                          {!shiftMeta.morning?.isActive && <Tag color="gray">Đang tắt</Tag>}
                        </Space>
                      </Checkbox>
                      <Checkbox 
                        value="afternoon"
                        checked={selectedShifts.includes('afternoon')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedShifts([...selectedShifts, 'afternoon']);
                          } else {
                            setSelectedShifts(selectedShifts.filter(s => s !== 'afternoon'));
                          }
                        }}
                        disabled={!shiftMeta.afternoon?.isActive}
                      >
                        <Space>
                          <Tag color={SHIFT_COLORS.afternoon}>{shiftMeta.afternoon?.name}</Tag>
                          <Text type="secondary">({shiftMeta.afternoon?.startTime ?? '--:--'} - {shiftMeta.afternoon?.endTime ?? '--:--'})</Text>
                          {!shiftMeta.afternoon?.isActive && <Tag color="gray">Đang tắt</Tag>}
                        </Space>
                      </Checkbox>
                      <Checkbox 
                        value="evening"
                        checked={selectedShifts.includes('evening')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedShifts([...selectedShifts, 'evening']);
                          } else {
                            setSelectedShifts(selectedShifts.filter(s => s !== 'evening'));
                          }
                        }}
                        disabled={!shiftMeta.evening?.isActive}
                      >
                        <Space>
                          <Tag color={SHIFT_COLORS.evening}>{shiftMeta.evening?.name}</Tag>
                          <Text type="secondary">({shiftMeta.evening?.startTime ?? '--:--'} - {shiftMeta.evening?.endTime ?? '--:--'})</Text>
                          {!shiftMeta.evening?.isActive && <Tag color="gray">Đang tắt</Tag>}
                        </Space>
                      </Checkbox>
                    </Space>
                  </Spin>
                  
                  {selectedShifts.length === 0 && (
                    <Alert
                      type="warning"
                      message="⚠️ Phải chọn ít nhất 1 ca"
                      showIcon
                      style={{ marginTop: 8, fontSize: 11 }}
                    />
                  )}
                  
                  {/* {selectedShifts.length === 3 && (
                    <Alert
                      type="success"
                      showIcon
                      message="Tốm tắt"
                      description="Sẽ tạo lịch cho tất cả 3 ca làm việc"
                      style={{ marginTop: 8, fontSize: 11 }}
                    />
                  )} */}
                </div>
              </Col>
            </Row>
          ) : null}

          {/* 🆕 Subroom & Shift Selection - Cho THÊM CA THIẾU (editing existing schedule) */}
          {isEditingExistingSchedule && selectedRoom?.hasSubRooms && selectedRoom?.subRooms?.length > 0 ? (
            <Row gutter={16} style={{ marginTop: 16 }}>
              {/* Left: Subroom Selection (chỉ hiển thị buồng thiếu nếu có) */}
              <Col span={12}>
                <div>
                  <Text strong>
                    Chọn buồng thêm ca <Text type="secondary">(Tùy chọn)</Text>
                  </Text>
                  {/* <Alert
                    type="info"
                    showIcon
                    message="Thêm ca cho buồng"
                    description="Nếu không chọn buồng nào, sẽ thêm ca cho tất cả buồng đã tạo trong lịch này."
                    style={{ marginTop: 8, marginBottom: 8, fontSize: 11 }}
                  /> */}
                  <Space direction="vertical" style={{ marginTop: 8, width: '100%' }}>
                    {(() => {
                      // ✅ CHỈ hiển thị subroom ĐÃ CÓ LỊCH (từ scheduleListData.subRoomShiftStatus)
                      // KHÔNG lấy từ selectedRoom.subRooms (room-service)
                      if (!subRoomShiftStatus || subRoomShiftStatus.length === 0) {
                        return (
                          <Alert
                            type="warning"
                            showIcon
                            message="Không tìm thấy buồng đã có lịch"
                            description="Modal này chỉ dùng để thêm ca thiếu vào lịch đã tạo. Vui lòng dùng modal 'Tạo lịch mới' để tạo lịch cho buồng mới."
                          />
                        );
                      }

                      return subRoomShiftStatus.map(subRoom => {
                        // 🆕 Tính toán: Buồng đã đủ ca nếu TẤT CẢ ca active đều đã tạo
                        const allActiveShifts = ['morning', 'afternoon', 'evening'].filter(shift => 
                          subRoom.shifts[shift] === true
                        );
                        const allGeneratedShifts = ['morning', 'afternoon', 'evening'].filter(shift =>
                          subRoom.generatedShifts[shift] === true
                        );
                        
                        // Buồng đã đủ = số ca đã tạo === số ca active (không tính ca đã tắt)
                        const isComplete = allActiveShifts.length > 0 && allActiveShifts.length === allGeneratedShifts.length;
                        
                        // Build generatedShifts và missingShifts để hiển thị
                        const generatedShiftsList = [];
                        const missingShiftsList = [];
                        const disabledShiftsList = [];
                        
                        ['morning', 'afternoon', 'evening'].forEach(shiftKey => {
                          const shiftNames = { morning: 'Ca Sáng', afternoon: 'Ca Chiều', evening: 'Ca Tối' };
                          const shiftColors = { morning: 'gold', afternoon: 'blue', evening: 'purple' };
                          
                          if (subRoom.generatedShifts[shiftKey]) {
                            generatedShiftsList.push({ key: shiftKey, name: shiftNames[shiftKey], color: shiftColors[shiftKey] });
                          } else if (subRoom.shifts[shiftKey]) {
                            missingShiftsList.push({ key: shiftKey, name: shiftNames[shiftKey], color: shiftColors[shiftKey] });
                          } else {
                            disabledShiftsList.push({ key: shiftKey, name: shiftNames[shiftKey], color: shiftColors[shiftKey] });
                          }
                        });
                        
                        return (
                          <Checkbox
                            key={subRoom.subRoomId}
                            value={subRoom.subRoomId}
                            checked={selectedSubRoomIds.includes(subRoom.subRoomId.toString())}
                            onChange={(e) => {
                              const subRoomIdStr = subRoom.subRoomId.toString();
                              const newSelectedIds = e.target.checked
                                ? [...selectedSubRoomIds, subRoomIdStr]
                                : selectedSubRoomIds.filter(id => id !== subRoomIdStr);
                              
                              setSelectedSubRoomIds(newSelectedIds);
                              console.log(e.target.checked ? `✅ Chọn buồng: ${subRoom.subRoomName}` : `❌ Bỏ chọn buồng: ${subRoom.subRoomName}`);
                              
                              // 🆕 Recalculate available shifts khi chọn/bỏ chọn buồng
                              // Truyền subRoomShiftStatus để dùng data của tháng cụ thể
                              recalculateAvailableShifts(newSelectedIds, subRoomShiftStatus);
                            }}
                            disabled={(subRoom.isActiveSubRoom === false) || isComplete}
                          >
                            <Card size="small" style={{ width: '100%', marginBottom: 8 }}>
                              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <Tag color={subRoom.isActiveSubRoom !== false ? 'green' : 'gray'}>
                                    {subRoom.subRoomName}
                                  </Tag>
                                  {subRoom.isActiveSubRoom === false && <Tag color="red">Đang tắt</Tag>}
                                  {isComplete && (
                                    <Tag color="success" icon={<CheckCircleOutlined />}>Đầy đủ</Tag>
                                  )}
                                </div>
                                
                                <>
                                  <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Ca đã tạo: </Text>
                                    {generatedShiftsList.length > 0 ? (
                                      generatedShiftsList.map(shift => (
                                        <Tag key={shift.key} color={shift.color} style={{ fontSize: 11 }}>
                                          {shift.name}
                                        </Tag>
                                      ))
                                    ) : (
                                      <Text type="secondary" italic style={{ fontSize: 11 }}>Chưa có ca</Text>
                                    )}
                                  </div>
                                  
                                  {missingShiftsList.length > 0 && (
                                    <div>
                                      <Text type="warning" style={{ fontSize: 12 }}>Ca còn thiếu: </Text>
                                      {missingShiftsList.map(shift => (
                                        <Tag 
                                          key={shift.key} 
                                          color={shift.color}
                                          style={{ fontSize: 11 }}
                                        >
                                          {shift.name}
                                        </Tag>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {disabledShiftsList.length > 0 && (
                                    <div>
                                      <Text type="secondary" style={{ fontSize: 12 }}>Ca đang tắt: </Text>
                                      {disabledShiftsList.map(shift => (
                                        <Tag 
                                          key={shift.key} 
                                          color="default"
                                          style={{ fontSize: 11, opacity: 0.6 }}
                                        >
                                          {shift.name}
                                        </Tag>
                                      ))}
                                    </div>
                                  )}
                                </>
                              </Space>
                            </Card>
                          </Checkbox>
                        );
                      });
                    })()}
                  </Space>
                  
                  {/* {selectedSubRoomIds.length === 0 && (
                    <Alert
                      type="info"
                      message="Sẽ thêm cho tất cả buồng đã tạo"
                      showIcon
                      style={{ marginTop: 8, fontSize: 11 }}
                    />
                  )} */}
                  
                  {selectedSubRoomIds.length > 0 && (
                    <Alert
                      type="success"
                      showIcon
                      message={`Đã chọn ${selectedSubRoomIds.length} buồng`}
                      style={{ marginTop: 8, fontSize: 11 }}
                    />
                  )}
                </div>
              </Col>

              {/* Right: Shift Selection (ca thiếu) */}
              <Col span={12}>
                <div>
                  <Text strong>Chọn ca làm việc <Text type="danger">*</Text></Text>
                  {/* <Alert
                    type="info"
                    showIcon
                    message="Lưu ý chọn ca thông minh"
                    description="Ca hiển thị nếu CÓ ÍT NHẤT 1 buồng chưa tạo ca đó. Hệ thống sẽ tự động bỏ qua buồng đã có lịch ca đó."
                    style={{ marginTop: 8, marginBottom: 8, fontSize: 11 }}
                  /> */}
                  
                  <Spin spinning={configLoading}>
                    <Space direction="vertical" style={{ marginTop: 8 }}>
                      {(() => {
                        // 🆕 Kiểm tra shiftConfig.isActive từ existingSchedule
                        let morningActive = true;
                        let afternoonActive = true;
                        let eveningActive = true;
                        
                        // Nếu đang thêm ca thiếu, kiểm tra isActive trong shiftConfig của lịch
                        if (isEditingExistingSchedule && scheduleListData?.schedules?.length > 0) {
                          // 🔧 Lấy schedule của tháng/năm đang chọn
                          const targetSchedule = scheduleListData.schedules.find(
                            s => s.month === fromMonth && s.year === selectedYear
                          );
                          
                          if (targetSchedule?.shiftConfig) {
                            const scheduleShiftConfig = targetSchedule.shiftConfig;
                            morningActive = scheduleShiftConfig.morning?.isActive !== false;
                            afternoonActive = scheduleShiftConfig.afternoon?.isActive !== false;
                            eveningActive = scheduleShiftConfig.evening?.isActive !== false;
                            console.log(`📅 Lấy shiftConfig của tháng ${fromMonth}/${selectedYear}:`, scheduleShiftConfig);
                            console.log("Giá trị 3 ca:", morningActive, afternoonActive, eveningActive);
                          }
                        }
                        
                        // 🆕 Logic thông minh: Ca có thể chọn dựa vào CÁC BUỒNG ĐÃ CHỌN
                        // 1. isActive === true trong shiftConfig (ca đang bật)
                        // 2. CÓ ÍT NHẤT 1 buồng (trong danh sách đã chọn) có ca active NHƯNG chưa generate
                        
                        let selectedSubRoomStatuses = subRoomShiftStatus;
                        if (selectedSubRoomIds.length > 0) {
                          // Chỉ check các buồng được chọn
                          selectedSubRoomStatuses = subRoomShiftStatus.filter(sr =>
                            selectedSubRoomIds.includes(sr.subRoomId.toString())
                          );
                        }
                        
                        // ✅ Ca có thể chọn = ca đang bật (isActive) VÀ có ít nhất 1 buồng chưa tạo ca đó
                        const canSelectMorning = morningActive && (
                          selectedSubRoomStatuses.length === 0 
                            ? initialMissingShifts.includes('morning')
                            : selectedSubRoomStatuses.some(sr => 
                                sr.shifts.morning === true && sr.generatedShifts.morning === false
                              )
                        );
                        
                        const canSelectAfternoon = afternoonActive && (
                          selectedSubRoomStatuses.length === 0
                            ? initialMissingShifts.includes('afternoon')
                            : selectedSubRoomStatuses.some(sr => 
                                sr.shifts.afternoon === true && sr.generatedShifts.afternoon === false
                              )
                        );
                        
                        const canSelectEvening = eveningActive && (
                          selectedSubRoomStatuses.length === 0
                            ? initialMissingShifts.includes('evening')
                            : selectedSubRoomStatuses.some(sr => 
                                sr.shifts.evening === true && sr.generatedShifts.evening === false
                              )
                        );
                        
                        return (
                          <>
                            <Checkbox 
                              value="morning"
                              checked={selectedShifts.includes('morning')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedShifts([...selectedShifts, 'morning']);
                                } else {
                                  setSelectedShifts(selectedShifts.filter(s => s !== 'morning'));
                                }
                              }}
                              disabled={!morningActive || !initialMissingShifts.includes('morning')}
                            >
                              <Space>
                                <Tag color={SHIFT_COLORS.morning}>{shiftMeta.morning?.name}</Tag>
                                <Text type="secondary">({shiftMeta.morning?.startTime ?? '--:--'} - {shiftMeta.morning?.endTime ?? '--:--'})</Text>
                                {!morningActive ? (
                                  <Tag color="gray">Đang tắt</Tag>
                                ) : !initialMissingShifts.includes('morning') ? (
                                  <Tag color="success">Các buồng đã tạo</Tag>
                                ) : null}
                              </Space>
                            </Checkbox>
                            <Checkbox 
                              value="afternoon"
                              checked={selectedShifts.includes('afternoon')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedShifts([...selectedShifts, 'afternoon']);
                                } else {
                                  setSelectedShifts(selectedShifts.filter(s => s !== 'afternoon'));
                                }
                              }}
                              disabled={!afternoonActive || !initialMissingShifts.includes('afternoon')}
                            >
                              <Space>
                                <Tag color={SHIFT_COLORS.afternoon}>{shiftMeta.afternoon?.name}</Tag>
                                <Text type="secondary">({shiftMeta.afternoon?.startTime ?? '--:--'} - {shiftMeta.afternoon?.endTime ?? '--:--'})</Text>
                                {!afternoonActive ? (
                                  <Tag color="gray">Đang tắt</Tag>
                                ) : !initialMissingShifts.includes('afternoon') ? (
                                  <Tag color="success">Các buồng đã tạo</Tag>
                                ) : null}
                              </Space>
                            </Checkbox>
                            <Checkbox 
                              value="evening"
                              checked={selectedShifts.includes('evening')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedShifts([...selectedShifts, 'evening']);
                                } else {
                                  setSelectedShifts(selectedShifts.filter(s => s !== 'evening'));
                                }
                              }}
                              disabled={!eveningActive || !initialMissingShifts.includes('evening')}
                            >
                              <Space>
                                <Tag color={SHIFT_COLORS.evening}>{shiftMeta.evening?.name}</Tag>
                                <Text type="secondary">({shiftMeta.evening?.startTime ?? '--:--'} - {shiftMeta.evening?.endTime ?? '--:--'})</Text>
                                {!eveningActive ? (
                                  <Tag color="gray">Đang tắt</Tag>
                                ) : !initialMissingShifts.includes('evening') ? (
                                  <Tag color="success">Các buồng đã tạo</Tag>
                                ) : null}
                              </Space>
                            </Checkbox>
                          </>
                        );
                      })()}
                    </Space>
                  </Spin>
                  
                  {selectedShifts.length === 0 && (
                    <Alert
                      type="warning"
                      message="⚠️ Phải chọn ít nhất 1 ca"
                      showIcon
                      style={{ marginTop: 8, fontSize: 11 }}
                    />
                  )}
                </div>
              </Col>
            </Row>
          ) : null}

          {/* Month Range & Year Selection */}
          <Row gutter={16}>
            <Col span={6}>
              <Text strong>Từ tháng <Text type="danger">*</Text></Text>
              <Select
                placeholder="Chọn tháng bắt đầu"
                value={fromMonth}
                onChange={(val) => {
                  setFromMonth(val);
                  // Reset toMonth và toYear khi thay đổi fromMonth
                  setToMonth(null);
                  setToYear(null);
                  
                  // 🆕 Update start date - Tự động chọn ngày đầu tiên có thể chọn
                  const today = dayjs().startOf('day');
                  const currentMonth = today.month() + 1; // 1-12
                  const currentYear = today.year();
                  const isSelectingCurrentMonth = val === currentMonth && selectedYear === currentYear;
                  
                  let autoStartDate;
                  if (isSelectingCurrentMonth) {
                    // Tháng hiện tại → Chọn ngày mai
                    autoStartDate = today.add(1, 'day');
                    console.log(`📅 Tháng hiện tại: Tự động chọn ngày ${autoStartDate.format('DD/MM/YYYY')}`);
                  } else {
                    // Tháng tương lai → Chọn ngày 1
                    autoStartDate = dayjs().year(selectedYear).month(val - 1).date(1);
                    console.log(`📅 Tháng tương lai: Tự động chọn ngày ${autoStartDate.format('DD/MM/YYYY')}`);
                  }
                  
                  setStartDate(autoStartDate);
                }}
                style={{ width: '100%', marginTop: 8 }}
                disabled={isEditingExistingSchedule}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
                  const currentYear = dayjs().year();
                  const currentMonth = dayjs().month() + 1;
                  
                  // 🆕 Giới hạn: Chỉ cho chọn tháng trong khoảng 7 tháng từ hiện tại
                  const maxDate = dayjs().add(7, 'months');
                  const maxYear = maxDate.year();
                  const maxMonth = maxDate.month() + 1;
                  
                  const monthDate = dayjs().year(selectedYear).month(m - 1);
                  const isAfterMaxDate = selectedYear > maxYear || (selectedYear === maxYear && m > maxMonth);
                  
                  // Disable nếu là tháng trong quá khứ
                  const isPastMonth = selectedYear === currentYear && m < currentMonth;
                  
                  // Disable nếu tháng đã có lịch
                  const hasSchedule = isMonthScheduled(m, selectedYear);
                  
                  const isDisabled = isPastMonth || hasSchedule || isAfterMaxDate;
                  
                  return (
                    <Option key={m} value={m} disabled={isDisabled}>
                      Tháng {m} {isPastMonth && '(Đã qua)'} {hasSchedule && '(Đã có lịch)'} {isAfterMaxDate && '(Vượt quá 6 tháng)'}
                    </Option>
                  );
                })}
              </Select>
            </Col>
            <Col span={6}>
              <Text strong>Năm bắt đầu <Text type="danger">*</Text></Text>
              <Select
                placeholder="Chọn năm"
                value={selectedYear}
                onChange={(year) => {
                  const currentMonth = dayjs().month() + 1;
                  const currentYear = dayjs().year();
                  
                  setSelectedYear(year);
                  
                  // Reset fromMonth, toMonth, toYear khi đổi năm
                  setToMonth(null);
                  setToYear(null);
                  
                  // Tìm tháng đầu tiên chưa có lịch và chưa qua
                  let firstAvailableMonth = null;
                  for (let m = 1; m <= 12; m++) {
                    const isPastMonth = year === currentYear && m < currentMonth;
                    const hasSchedule = isMonthScheduled(m, year);
                    
                    if (!isPastMonth && !hasSchedule) {
                      firstAvailableMonth = m;
                      break;
                    }
                  }
                  
                  if (firstAvailableMonth) {
                    setFromMonth(firstAvailableMonth);
                    
                    // 🆕 Tự động chọn ngày đầu tiên có thể chọn
                    const today = dayjs().startOf('day');
                    const isSelectingCurrentMonth = firstAvailableMonth === currentMonth && year === currentYear;
                    
                    let autoStartDate;
                    if (isSelectingCurrentMonth) {
                      // Tháng hiện tại → Chọn ngày mai
                      autoStartDate = today.add(1, 'day');
                      console.log(`📅 Năm ${year}, tháng hiện tại ${firstAvailableMonth}: Tự động chọn ngày ${autoStartDate.format('DD/MM/YYYY')}`);
                    } else {
                      // Tháng tương lai → Chọn ngày 1
                      autoStartDate = dayjs().year(year).month(firstAvailableMonth - 1).date(1);
                      console.log(`📅 Năm ${year}, tháng ${firstAvailableMonth}: Tự động chọn ngày ${autoStartDate.format('DD/MM/YYYY')}`);
                    }
                    
                    setStartDate(autoStartDate);
                  } else {
                    setFromMonth(null);
                    setStartDate(null);
                  }
                }}
                style={{ width: '100%', marginTop: 8 }}
                disabled={isEditingExistingSchedule}
              >
                {(() => {
                  const currentYear = dayjs().year();
                  const currentMonth = dayjs().month() + 1;
                  
                  // 🆕 Giới hạn: Chỉ cho chọn năm trong khoảng 7 tháng từ hiện tại
                  const maxDate = dayjs().add(7, 'months');
                  const maxYear = maxDate.year();
                  
                  const years = [];
                  
                  // Chỉ tạo danh sách năm từ năm hiện tại đến năm của maxDate
                  for (let year = currentYear; year <= maxYear; year++) {
                    years.push(
                      <Option key={year} value={year}>
                        {year}
                      </Option>
                    );
                  }
                  
                  return years;
                })()}
              </Select>
            </Col>
            <Col span={6}>
              <Text strong>Đến tháng <Text type="danger">*</Text></Text>
              <Select
                placeholder={fromMonth && selectedYear ? "Chọn tháng kết thúc" : "Chọn tháng bắt đầu trước"}
                value={toMonth}
                onChange={(val) => {
                  setToMonth(val);
                  // 🆕 Tự động set toYear = selectedYear nếu chưa chọn năm kết thúc
                  if (!toYear && selectedYear) {
                    setToYear(selectedYear);
                    console.log(`📅 Tự động set năm kết thúc = ${selectedYear}`);
                  }
                }}
                style={{ width: '100%', marginTop: 8 }}
                disabled={isEditingExistingSchedule || !fromMonth || !selectedYear}
              >
                {(() => {
                  if (!fromMonth || !selectedYear) return [];
                  
                  const options = [];
                  const currentYear = dayjs().year();
                  const currentMonth = dayjs().month() + 1;
                  
                  // 🆕 Giới hạn: Chỉ cho chọn tháng trong khoảng 7 tháng từ hiện tại
                  const maxDate = dayjs().add(7, 'months');
                  const maxYear = maxDate.year();
                  const maxMonth = maxDate.month() + 1;
                  
                  // 🆕 Nếu chưa chọn năm kết thúc, mặc định dùng năm bắt đầu
                  const effectiveToYear = toYear || selectedYear;
                  
                  // Tạo danh sách tháng có thể chọn
                  // Bắt đầu từ fromMonth nếu cùng năm, hoặc từ tháng 1 nếu năm sau
                  const startMonth = effectiveToYear === selectedYear ? fromMonth : 1;
                  
                  for (let m = startMonth; m <= 12; m++) {
                    const yearToCheck = effectiveToYear;
                    
                    // Kiểm tra vượt quá 6 tháng
                    const isAfterMaxDate = yearToCheck > maxYear || (yearToCheck === maxYear && m > maxMonth);
                    
                    // Disable nếu tháng đã có lịch
                    const hasSchedule = isMonthScheduled(m, yearToCheck);
                    
                    // Disable nếu cùng năm và tháng < fromMonth
                    const isBeforeStart = yearToCheck === selectedYear && m < fromMonth;
                    
                    const isDisabled = hasSchedule || isBeforeStart || isAfterMaxDate;
                    
                    options.push(
                      <Option 
                        key={m} 
                        value={m}
                        disabled={isDisabled}
                      >
                        Tháng {m} {hasSchedule && '(Đã có lịch)'} {isAfterMaxDate && '(Vượt quá 6 tháng)'}
                      </Option>
                    );
                    
                    // Nếu gặp tháng có lịch hoặc vượt quá 6 tháng, dừng lại
                    if (hasSchedule || isAfterMaxDate) {
                      break;
                    }
                  }
                  
                  return options;
                })()}
              </Select>
            </Col>
            <Col span={6}>
              <Text strong>Năm kết thúc <Text type="danger">*</Text></Text>
              <Select
                placeholder={fromMonth && selectedYear ? "Chọn năm kết thúc" : "Chọn tháng bắt đầu trước"}
                value={toYear}
                onChange={(year) => {
                  setToYear(year);
                  setToMonth(null); // Reset toMonth khi đổi năm
                }}
                style={{ width: '100%', marginTop: 8 }}
                disabled={isEditingExistingSchedule || !fromMonth || !selectedYear}
              >
                {(() => {
                  if (!fromMonth || !selectedYear) return [];
                  
                  // 🆕 Giới hạn: Chỉ cho chọn năm trong khoảng 7 tháng từ hiện tại
                  const maxDate = dayjs().add(7, 'months');
                  const maxYear = maxDate.year();
                  
                  const years = [];
                  
                  // Cho phép chọn từ năm bắt đầu đến maxYear
                  for (let year = selectedYear; year <= maxYear; year++) {
                    // Kiểm tra xem năm này còn tháng nào chưa có lịch không
                    let hasAvailableMonth = false;
                    const startMonth = year === selectedYear ? fromMonth : 1;
                    
                    for (let m = startMonth; m <= 12; m++) {
                      if (!isMonthScheduled(m, year)) {
                        hasAvailableMonth = true;
                        break;
                      }
                    }
                    
                    const isDisabled = !hasAvailableMonth;
                    
                    years.push(
                      <Option key={year} value={year} disabled={isDisabled}>
                        {year} {isDisabled && '(Không có tháng khả dụng)'}
                      </Option>
                    );
                  }
                  
                  return years;
                })()}
              </Select>
            </Col>
          </Row>

          {/* Info về khoảng thời gian */}
          {fromMonth && toMonth && selectedYear && toYear && startDate && (
            <Alert
              type="info"
              showIcon
              message={`Tạo lịch liên tục: Tháng ${String(fromMonth).padStart(2, '0')}/${selectedYear} → Tháng ${String(toMonth).padStart(2, '0')}/${toYear}`}
              description={`Từ ${startDate.format('DD/MM/YYYY')} 
                đến ${getDateRange(fromMonth, toMonth, selectedYear, toYear).end.format('DD/MM/YYYY')}`}
              style={{ fontSize: 12 }}
            />
          )}

          {/* 🆕 Holiday Preview - Hiển thị ngày nghỉ */}
          {!isEditingExistingSchedule && loadingHolidayPreview && (
            <Alert
              type="info"
              showIcon
              message="Đang tải thông tin ngày nghỉ..."
            />
          )}

          {!isEditingExistingSchedule && holidayPreview && (holidayPreview.hasRecurringHolidays || holidayPreview.hasNonRecurringHolidays) && (
            <Alert
              type="warning"
              showIcon
              message="Lưu ý: Có ngày nghỉ trong khoảng thời gian tạo lịch"
              description={
                <div>
                  {holidayPreview.hasRecurringHolidays && (
                    <div style={{ marginBottom: 8 }}>
                      <Text strong style={{ color: '#d46b08' }}>
                        ⚠️ Ngày nghỉ cố định (hàng tuần):
                      </Text>
                      <div style={{ marginTop: 4, marginLeft: 16 }}>
                        {holidayPreview.recurringHolidays.map((h, idx) => (
                          <div key={idx}>
                            <Tag color="orange">{h.dayOfWeekName}</Tag>
                            <Text>{h.name}</Text>
                            {h.note && <Text type="secondary"> - {h.note}</Text>}
                          </div>
                        ))}
                      </div>
                      <Text type="secondary" style={{ display: 'block', marginTop: 4, fontStyle: 'italic' }}>
                        → Hệ thống sẽ không tạo lịch cho những ngày này mỗi tuần
                      </Text>
                    </div>
                  )}
                  
                  {holidayPreview.hasNonRecurringHolidays && (
                    <div>
                      <Text strong style={{ color: '#d46b08' }}>
                        ⚠️ Ngày nghỉ trong khoảng thời gian:
                      </Text>
                      <div style={{ marginTop: 4, marginLeft: 16 }}>
                        {holidayPreview.nonRecurringHolidays.map((h, idx) => (
                          <div key={idx}>
                            <Tag color="red">
                              {dayjs(h.startDate).format('DD/MM/YYYY')} - {dayjs(h.endDate).format('DD/MM/YYYY')}
                            </Tag>
                            <Text>{h.name}</Text>
                            {h.note && <Text type="secondary"> - {h.note}</Text>}
                          </div>
                        ))}
                      </div>
                      <Text type="secondary" style={{ display: 'block', marginTop: 4, fontStyle: 'italic' }}>
                        → Hệ thống sẽ không tạo lịch cho những ngày trong khoảng thời gian này
                      </Text>
                    </div>
                  )}
                </div>
              }
            />
          )}

          {/* 🆕 Holiday info cho existing schedule */}
          {isEditingExistingSchedule && scheduleListData?.schedules?.[0]?.holidaySnapshot && 
           (scheduleListData.schedules[0].holidaySnapshot.recurringHolidays?.length > 0 || 
            scheduleListData.schedules[0].holidaySnapshot.nonRecurringHolidays?.length > 0) && (
            <Alert
              type="info"
              showIcon
              message="Ngày nghỉ đã được áp dụng khi tạo lịch ban đầu"
              description={
                <div style={{ fontSize: 12 }}>
                  {scheduleListData.schedules[0].holidaySnapshot.recurringHolidays?.length > 0 && (
                    <div>
                      <Text strong>Ngày nghỉ cố định: </Text>
                      {scheduleListData.schedules[0].holidaySnapshot.recurringHolidays.map((h, idx) => {
                        const dayNames = {1: 'CN', 2: 'T2', 3: 'T3', 4: 'T4', 5: 'T5', 6: 'T6', 7: 'T7'};
                        return (
                          <Tag key={idx} color="orange" style={{ marginTop: 4 }}>
                            {dayNames[h.dayOfWeek]} - {h.name}
                          </Tag>
                        );
                      })}
                    </div>
                  )}
                  {scheduleListData.schedules[0].holidaySnapshot.nonRecurringHolidays?.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <Text strong>Ngày nghỉ khoảng thời gian: </Text>
                      {scheduleListData.schedules[0].holidaySnapshot.nonRecurringHolidays.map((h, idx) => (
                        <Tag key={idx} color="red" style={{ marginTop: 4 }}>
                          {dayjs(h.startDate).format('DD/MM')} - {dayjs(h.endDate).format('DD/MM')}: {h.name}
                        </Tag>
                      ))}
                    </div>
                  )}
                  <Text type="secondary" style={{ display: 'block', marginTop: 8, fontStyle: 'italic' }}>
                    Thêm ca thiếu sẽ sử dụng đúng cấu hình ngày nghỉ ban đầu này
                  </Text>
                </div>
              }
            />
          )}

          {/* Start Date */}
          <div>
            <Text strong>Ngày bắt đầu <Text type="danger">*</Text></Text>
            <DatePicker
              placeholder={(() => {
                const today = dayjs();
                const currentMonth = today.month() + 1;
                const currentYear = today.year();
                const isCurrentMonth = fromMonth === currentMonth && selectedYear === currentYear;
                
                if (isCurrentMonth) {
                  return `Từ ${today.add(1, 'day').format('DD/MM/YYYY')} trở đi`;
                } else {
                  return 'Chọn ngày bắt đầu';
                }
              })()}
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
                // Tự động cập nhật tháng và năm khi chọn ngày
                if (date) {
                  const month = date.month() + 1; // 1-12
                  const year = date.year();
                  setFromMonth(month);
                  setSelectedYear(year);
                  
                  // Nếu toMonth < fromMonth, cập nhật toMonth = fromMonth
                  if (toMonth < month) {
                    setToMonth(month);
                  }
                }
              }}
              format="DD/MM/YYYY"
              disabledDate={disabledDate}
              disabled={true}
              style={{ width: '100%', marginTop: 8 }}
              defaultPickerValue={(() => {
                // 🆕 Tự động mở tháng và hiển thị ngày đầu tiên có thể chọn
                if (!fromMonth || !selectedYear) return dayjs();
                
                const today = dayjs().startOf('day');
                const currentMonth = today.month() + 1;
                const currentYear = today.year();
                const isStartMonthCurrent = fromMonth === currentMonth && selectedYear === currentYear;
                
                if (isStartMonthCurrent) {
                  // Tháng hiện tại → Hiển thị ngày mai
                  return today.add(1, 'day');
                } else {
                  // Tháng tương lai → Hiển thị ngày 1 của tháng đó
                  return dayjs().year(selectedYear).month(fromMonth - 1).date(1);
                }
              })()}
            />
            {isEditingExistingSchedule && endDate && (
              <>
                <Text strong style={{ marginTop: 12, display: 'block' }}>Ngày kết thúc</Text>
                <DatePicker
                  value={endDate}
                  format="DD/MM/YYYY"
                  disabled={true}
                  style={{ width: '100%', marginTop: 8 }}
                />
              </>
            )}
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
              {isEditingExistingSchedule 
                ? 'Không thể thay đổi ngày bắt đầu và kết thúc khi thêm ca thiếu'
                : fromMonth === dayjs().month() + 1 && selectedYear === dayjs().year()
                  ? 'Nếu chọn tháng hiện tại, ngày bắt đầu phải từ ngày hôm sau trở đi'
                  : 'Ngày bắt đầu phải nằm trong khoảng tháng đã chọn và không được nhỏ hơn ngày hiện tại'}
            </Text>
          </div>

          {/* 🆕 Shift Selection - Phòng KHÔNG có subroom (layout giống có subroom) */}
          {!selectedRoom?.hasSubRooms && (
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <div>
                  <Text strong>Chọn ca làm việc <Text type="danger">*</Text></Text>
                  {/* <Alert
                    type="info"
                    showIcon
                    message="Lưu ý"
                    description={isEditingExistingSchedule 
                      ? "Chỉ có thể chọn các ca còn thiếu. Ca đã tạo không thể sửa đổi."
                      : "Hệ thống sẽ lưu cấu hình CẢ 3 CA. Ca không chọn có thể tạo sau với cấu hình cũ nếu trùng khoảng thời gian."}
                    style={{ marginTop: 8, marginBottom: 8, fontSize: 11 }}
                  /> */}
                  <Spin spinning={configLoading}>
                    <Space direction="vertical" style={{ marginTop: 8, width: '100%' }}>
                      {(() => {
                        // 🔧 Lấy shiftConfig từ lịch đã tạo (cho phòng không có buồng)
                        let morningActive = true;
                        let afternoonActive = true;
                        let eveningActive = true;
                        
                        if (isEditingExistingSchedule && scheduleListData?.schedules?.length > 0) {
                          // 🔧 Lấy schedule của tháng/năm đang chọn
                          const targetSchedule = scheduleListData.schedules.find(
                            s => s.month === fromMonth && s.year === selectedYear
                          );
                          
                          if (targetSchedule?.shiftConfig) {
                            const scheduleShiftConfig = targetSchedule.shiftConfig;
                            morningActive = scheduleShiftConfig.morning?.isActive !== false;
                            afternoonActive = scheduleShiftConfig.afternoon?.isActive !== false;
                            eveningActive = scheduleShiftConfig.evening?.isActive !== false;
                          }
                        } else if (!isEditingExistingSchedule) {
                          // Tạo mới - dùng config toàn cục
                          morningActive = shiftMeta.morning?.isActive !== false;
                          afternoonActive = shiftMeta.afternoon?.isActive !== false;
                          eveningActive = shiftMeta.evening?.isActive !== false;
                        }
                        
                        return (
                          <>
                            <Checkbox 
                              value="morning"
                              checked={selectedShifts.includes('morning')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedShifts([...selectedShifts, 'morning']);
                                } else {
                                  setSelectedShifts(selectedShifts.filter(s => s !== 'morning'));
                                }
                              }}
                              disabled={
                                (isEditingExistingSchedule && (!morningActive || !initialMissingShifts.includes('morning'))) ||
                                (!isEditingExistingSchedule && !morningActive)
                              }
                            >
                              <Space>
                                <Tag color={SHIFT_COLORS.morning}>{shiftMeta.morning?.name}</Tag>
                                <Text type="secondary">({shiftMeta.morning?.startTime ?? '--:--'} - {shiftMeta.morning?.endTime ?? '--:--'})</Text>
                                {!morningActive && <Tag color="gray">Đang tắt</Tag>}
                                {isEditingExistingSchedule && morningActive && !initialMissingShifts.includes('morning') && (
                                  <Tag color="success">Đã tạo</Tag>
                                )}
                              </Space>
                            </Checkbox>
                            <Checkbox 
                              value="afternoon"
                              checked={selectedShifts.includes('afternoon')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedShifts([...selectedShifts, 'afternoon']);
                                } else {
                                  setSelectedShifts(selectedShifts.filter(s => s !== 'afternoon'));
                                }
                              }}
                              disabled={
                                (isEditingExistingSchedule && (!afternoonActive || !initialMissingShifts.includes('afternoon'))) ||
                                (!isEditingExistingSchedule && !afternoonActive)
                              }
                            >
                              <Space>
                                <Tag color={SHIFT_COLORS.afternoon}>{shiftMeta.afternoon?.name}</Tag>
                                <Text type="secondary">({shiftMeta.afternoon?.startTime ?? '--:--'} - {shiftMeta.afternoon?.endTime ?? '--:--'})</Text>
                                {!afternoonActive && <Tag color="gray">Đang tắt</Tag>}
                                {isEditingExistingSchedule && afternoonActive && !initialMissingShifts.includes('afternoon') && (
                                  <Tag color="success">Đã tạo</Tag>
                                )}
                              </Space>
                            </Checkbox>
                            <Checkbox 
                              value="evening"
                              checked={selectedShifts.includes('evening')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedShifts([...selectedShifts, 'evening']);
                                } else {
                                  setSelectedShifts(selectedShifts.filter(s => s !== 'evening'));
                                }
                              }}
                              disabled={
                                (isEditingExistingSchedule && (!eveningActive || !initialMissingShifts.includes('evening'))) ||
                                (!isEditingExistingSchedule && !eveningActive)
                              }
                            >
                              <Space>
                                <Tag color={SHIFT_COLORS.evening}>{shiftMeta.evening?.name}</Tag>
                                <Text type="secondary">({shiftMeta.evening?.startTime ?? '--:--'} - {shiftMeta.evening?.endTime ?? '--:--'})</Text>
                                {!eveningActive && <Tag color="gray">Đang tắt</Tag>}
                                {isEditingExistingSchedule && eveningActive && !initialMissingShifts.includes('evening') && (
                                  <Tag color="success">Đã tạo</Tag>
                                )}
                              </Space>
                            </Checkbox>
                          </>
                        );
                      })()}
                    </Space>
                  </Spin>
                  
                  {selectedShifts.length === 0 && (
                    <Alert
                      type="warning"
                      message="⚠️ Phải chọn ít nhất 1 ca"
                      showIcon
                      style={{ marginTop: 8, fontSize: 11 }}
                    />
                  )}
                  
                  {/* {selectedShifts.length === 3 && !isEditingExistingSchedule && (
                    <Alert
                      type="success"
                      showIcon
                      message="Tóm tắt"
                      description="Sẽ tạo lịch cho tất cả 3 ca làm việc"
                      style={{ marginTop: 8, fontSize: 11 }}
                    />
                  )} */}
                </div>
              </Col>
            </Row>
          )}

          {/* Summary */}
          {selectedShifts.length > 0 && (
            <Alert
              message="Tóm tắt"
              description={
                <div>
                  <Text>Sẽ tạo lịch cho <Text strong>{selectedShifts.length} ca</Text> làm việc</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Hệ thống sẽ tự động tạo slots {slotDuration} phút cho mỗi ca
                  </Text>
                </div>
              }
              type="success"
              showIcon
            />
          )}
        </Space>
      </Modal>

      {/* 🆕 Edit Schedule Modal */}
      <EditScheduleModal
        visible={showEditModal}
        onCancel={handleCancelEditModal}
        onSuccess={handleEditSuccess}
        roomId={editingSchedule?.roomId}
        month={editingSchedule?.month}
        year={editingSchedule?.year}
        scheduleListData={editingSchedule?.scheduleListData}
      />

      {/* 🆕 Bulk Room Schedule Modal - View schedules for multiple rooms */}
      <BulkRoomScheduleModal
        visible={showBulkScheduleModal}
        onCancel={() => setShowBulkScheduleModal(false)}
        selectedRooms={selectedRooms} // 🔥 Dùng state selectedRooms thay vì tính toán
        schedulesData={bulkSchedulesData}
        isViewingAll={isViewingAllRooms} // 🆕 Pass flag để phân biệt
      />

      {/* 🆕 Bulk Create Schedule Modal - Create schedules for multiple rooms */}
      <BulkCreateScheduleModal
        visible={showBulkCreateModal}
        onCancel={() => setShowBulkCreateModal(false)}
        selectedRooms={selectedRoomIds.map(id => selectedRoomsMap[id]).filter(Boolean)}
        onSuccess={handleBulkCreateSuccess}
      />

      {/* 🆕 Override Holiday Modal - Create schedule in holiday */}
      <OverrideHolidayModal
        visible={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        onSuccess={() => {
          loadRooms(); // Refresh danh sách phòng
          toast.success('Đã tạo lịch override thành công!');
        }}
        rooms={rooms}
      />

      {/* 🆕 Enable Shifts SubRooms Modal - Enable disabled shifts/subrooms */}
      <EnableShiftsSubRoomsModal
        visible={showEnableModal}
        onClose={() => setShowEnableModal(false)}
        onSuccess={handleEnableSuccess}
        groupData={enableModalData}
      />
    </div>
  );
};

export default CreateScheduleForRoom;

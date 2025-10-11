/**
 * @author: TrungNghia & HoTram
 * Component: Tạo lịch thủ công cho phòng khám
 */
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
  Input
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../services/toastService';
import roomService from '../../services/roomService';
import scheduleService from '../../services/scheduleService';
import scheduleConfigService from '../../services/scheduleConfigService';
import dayjs from 'dayjs';
import { debounce } from '../../utils/searchUtils';

const { Title, Text } = Typography;
const { Option } = Select;

const SHIFT_KEYS = ['morning', 'afternoon', 'evening'];

const SHIFT_DEFAULTS = {
  morning: { name: 'Ca Sáng', startTime: '07:00', endTime: '12:00', isActive: true },
  afternoon: { name: 'Ca Chiều', startTime: '13:00', endTime: '17:00', isActive: true },
  evening: { name: 'Ca Tối', startTime: '17:30', endTime: '21:00', isActive: true }
};

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

const buildShiftMetaFromConfig = (config = null) => {
  const meta = {};

  SHIFT_KEYS.forEach((key) => {
    const configKey = SHIFT_CONFIG_MAP[key];
    const configShift = config?.[configKey] || null;
    const defaults = SHIFT_DEFAULTS[key];

    meta[key] = {
      key,
      name: configShift?.name || defaults.name,
      startTime: configShift?.startTime || defaults.startTime,
      endTime: configShift?.endTime || defaults.endTime,
      isActive: configShift ? configShift.isActive !== false : defaults.isActive
    };
  });

  const unitDuration = Number.isFinite(config?.unitDuration) && config.unitDuration > 0
    ? config.unitDuration
    : DEFAULT_SLOT_DURATION;

  return { meta, unitDuration };
};

const buildShiftMetaFromScheduleConfig = (shiftConfig = null, fallbackDuration = DEFAULT_SLOT_DURATION) => {
  const meta = {};

  SHIFT_KEYS.forEach((key) => {
    const scheduleShift = shiftConfig?.[key] || null;
    const defaults = SHIFT_DEFAULTS[key];

    meta[key] = {
      key,
      name: scheduleShift?.name || defaults.name,
      startTime: scheduleShift?.startTime || defaults.startTime,
      endTime: scheduleShift?.endTime || defaults.endTime,
      isActive: scheduleShift ? scheduleShift.isActive !== false : defaults.isActive
    };
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

const { meta: INITIAL_SHIFT_META, unitDuration: INITIAL_UNIT_DURATION } = buildShiftMetaFromConfig();

const CreateScheduleForRoom = () => {
  const navigate = useNavigate();
  
  // States
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roomActiveFilter, setRoomActiveFilter] = useState(true); // Combobox filter
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
  const [fromMonth, setFromMonth] = useState(dayjs().month() + 1); // 1-12
  const [toMonth, setToMonth] = useState(dayjs().month() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isEditingExistingSchedule, setIsEditingExistingSchedule] = useState(false);
  const [existingScheduleId, setExistingScheduleId] = useState(null);
  const [shiftMeta, setShiftMeta] = useState(INITIAL_SHIFT_META);
  const [slotDuration, setSlotDuration] = useState(INITIAL_UNIT_DURATION);
  const [configLoading, setConfigLoading] = useState(false);
  const [selectedShifts, setSelectedShifts] = useState(getActiveShiftKeys(INITIAL_SHIFT_META));
  const [initialMissingShifts, setInitialMissingShifts] = useState([]); // Track original missing shifts for editing
  const [creatingSchedule, setCreatingSchedule] = useState(false);
  const [holidayPreview, setHolidayPreview] = useState(null); // 🆕 Holiday preview data
  const [loadingHolidayPreview, setLoadingHolidayPreview] = useState(false); // 🆕

  // Schedule list modal filters
  const [scheduleListFilterType, setScheduleListFilterType] = useState('all'); // 'all' | 'missing' | 'complete'
  const [scheduleListSearchDate, setScheduleListSearchDate] = useState(null); // For date search

  const loadScheduleConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const response = await scheduleConfigService.getConfig();
      if (response?.success && response?.data) {
        const built = buildShiftMetaFromConfig(response.data);
        setShiftMeta(built.meta);
        setSlotDuration(built.unitDuration);
        return built;
      }

      const fallback = buildShiftMetaFromConfig();
      setShiftMeta(fallback.meta);
      setSlotDuration(fallback.unitDuration);
      toast.warning('Không lấy được cấu hình ca làm việc mới nhất. Đang sử dụng giá trị mặc định.');
      return fallback;
    } catch (error) {
      console.error('Error loading schedule config:', error);
      toast.error('Không thể lấy cấu hình ca làm việc. Đang sử dụng giá trị mặc định.');
      const fallback = buildShiftMetaFromConfig();
      setShiftMeta(fallback.meta);
      setSlotDuration(fallback.unitDuration);
      return fallback;
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [pagination.current, pagination.pageSize, roomActiveFilter, scheduleStatusFilter]); // Add roomActiveFilter

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
      const response = await roomService.getRoomsForSchedule({
        page: pagination.current,
        limit: pagination.pageSize,
        isActive: roomActiveFilter !== 'all' ? roomActiveFilter : undefined
      });

      if (response.success) {
        let filteredRooms = response.data.rooms;
        
        // Apply schedule status filter
        if (scheduleStatusFilter === 'has-schedule') {
          filteredRooms = filteredRooms.filter(room => room.hasSchedule);
        } else if (scheduleStatusFilter === 'no-schedule') {
          filteredRooms = filteredRooms.filter(room => !room.hasSchedule);
        }
        
        // Fetch missing shifts info for rooms with schedules
        const roomsWithShiftInfo = await Promise.all(
          filteredRooms.map(async (room) => {
            if (room.hasSchedule) {
              try {
                // Nếu phòng có buồng con, check từng buồng
                if (room.hasSubRooms && room.subRooms && room.subRooms.length > 0) {
                  const subRoomsWithShiftInfo = await Promise.all(
                    room.subRooms.map(async (subRoom) => {
                      try {
                        const shiftResponse = await scheduleService.getRoomSchedulesWithShifts(
                          room._id,
                          subRoom._id
                        );
                        
                        const hasMissingShifts = shiftResponse.success && 
                          shiftResponse.data?.schedules && 
                          shiftResponse.data.schedules.some(s => s.hasMissingShifts);
                        
                        return {
                          ...subRoom,
                          hasMissingShifts,
                          lastCreatedDate: shiftResponse.data?.summary?.lastCreatedDate,
                          scheduleCount: shiftResponse.data?.summary?.totalSchedules || 0
                        };
                      } catch (error) {
                        console.error(`Error fetching shift info for subroom ${subRoom._id}:`, error);
                        return subRoom;
                      }
                    })
                  );
                  
                  // Aggregate data from all subrooms
                  const allLastCreatedDates = subRoomsWithShiftInfo
                    .map(sr => sr.lastCreatedDate)
                    .filter(Boolean);
                  const latestCreatedDate = allLastCreatedDates.length > 0
                    ? allLastCreatedDates.sort((a, b) => new Date(b) - new Date(a))[0]
                    : null;
                  const totalScheduleCount = subRoomsWithShiftInfo
                    .reduce((sum, sr) => sum + (sr.scheduleCount || 0), 0);
                  
                  return {
                    ...room,
                    subRooms: subRoomsWithShiftInfo,
                    hasMissingShifts: subRoomsWithShiftInfo.some(sr => sr.hasMissingShifts),
                    lastCreatedDate: latestCreatedDate,
                    scheduleCount: totalScheduleCount
                  };
                } else {
                  // Phòng không có buồng con
                  const shiftResponse = await scheduleService.getRoomSchedulesWithShifts(room._id);
                  
                  const hasMissingShifts = shiftResponse.success && 
                    shiftResponse.data?.schedules && 
                    shiftResponse.data.schedules.some(s => s.hasMissingShifts);
                  
                  return {
                    ...room,
                    hasMissingShifts,
                    lastCreatedDate: shiftResponse.data?.summary?.lastCreatedDate,
                    scheduleCount: shiftResponse.data?.summary?.totalSchedules || 0
                  };
                }
              } catch (error) {
                console.error(`Error fetching shift info for room ${room._id}:`, error);
                return room;
              }
            }
            return room;
          })
        );
        
        setRooms(roomsWithShiftInfo);
        setPagination({
          ...pagination,
          total: response.data.total
        });
      } else {
        toast.error(response.message || 'Lỗi khi tải danh sách phòng');
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách phòng: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle create schedule button click - Show schedule list first
  const handleCreateSchedule = async (room, subRoom = null) => {
    try {
      setLoading(true);
      setSelectedRoom(room);
      
      // Nếu phòng có subroom và không truyền subRoom cụ thể
      if (room.hasSubRooms && room.subRooms && room.subRooms.length > 0 && !subRoom) {
        // Fetch schedules cho TẤT CẢ subrooms và gộp lại
        const subRoomSchedules = await Promise.all(
          room.subRooms.map(async (sr) => {
            try {
              const response = await scheduleService.getRoomSchedulesWithShifts(
                room._id,
                sr._id
              );
              
              return {
                subRoom: sr,
                schedules: response.success && response.data ? response.data : null
              };
            } catch (error) {
              console.error(`Error loading schedules for subroom ${sr._id}:`, error);
              return {
                subRoom: sr,
                schedules: null,
                error: error.message
              };
            }
          })
        );
        
        // Gộp tất cả schedules lại và thêm thông tin subRoom vào mỗi schedule
        const allSchedules = [];
        subRoomSchedules.forEach(item => {
          if (item.schedules?.schedules) {
            item.schedules.schedules.forEach(schedule => {
              allSchedules.push({
                ...schedule,
                subRoom: item.subRoom // Thêm thông tin subRoom
              });
            });
          }
        });
        
        // Gộp các schedule có cùng startDate-endDate
        const groupedSchedules = {};
        allSchedules.forEach(schedule => {
          const key = `${schedule.startDate}_${schedule.endDate}`;
          
          if (!groupedSchedules[key]) {
            groupedSchedules[key] = {
              ...schedule,
              subRooms: [schedule.subRoom], // Array các subrooms có schedule này
              scheduleIds: [schedule.scheduleId] // Array các scheduleId
            };
          } else {
            // Gộp subroom vào
            groupedSchedules[key].subRooms.push(schedule.subRoom);
            groupedSchedules[key].scheduleIds.push(schedule.scheduleId);
            
            // Merge missingShifts - lấy ca thiếu chung của tất cả subrooms
            const existingMissingKeys = groupedSchedules[key].missingShifts.map(s => s.key);
            schedule.missingShifts.forEach(shift => {
              if (!existingMissingKeys.includes(shift.key)) {
                groupedSchedules[key].missingShifts.push(shift);
              }
            });
            
            // Update hasMissingShifts
            groupedSchedules[key].hasMissingShifts = groupedSchedules[key].missingShifts.length > 0;
          }
        });
        
        // Convert object to array
        const mergedSchedules = Object.values(groupedSchedules);
        
        // Sort by startDate
        mergedSchedules.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        
        // Tính toán summary chung
        const allLastCreatedDates = subRoomSchedules
          .map(item => item.schedules?.summary?.lastCreatedDate)
          .filter(Boolean);
        const latestCreatedDate = allLastCreatedDates.length > 0
          ? allLastCreatedDates.sort((a, b) => new Date(b) - new Date(a))[0]
          : null;
        
        const totalSchedules = mergedSchedules.length;
        const hasGap = subRoomSchedules.some(item => item.schedules?.summary?.hasGap);
        
        // Lấy suggested start date sớm nhất
        const allSuggestedDates = subRoomSchedules
          .map(item => item.schedules?.summary?.suggestedStartDate)
          .filter(Boolean);
        const earliestSuggestedDate = allSuggestedDates.length > 0
          ? allSuggestedDates.sort((a, b) => new Date(a) - new Date(b))[0]
          : null;
        
        const combinedData = {
          schedules: mergedSchedules,
          summary: {
            totalSchedules,
            lastCreatedDate: latestCreatedDate,
            hasGap,
            suggestedStartDate: earliestSuggestedDate
          }
        };
        
        setScheduleListData(combinedData);
        setShowScheduleListModal(true);
      } else {
        // Phòng không có subroom HOẶC đã chọn subroom cụ thể
        const response = await scheduleService.getRoomSchedulesWithShifts(
          room._id,
          subRoom?._id
        );
        
        if (response.success && response.data) {
          setScheduleListData(response.data);
          setSelectedSubRoom(subRoom);
          
          // Show schedule list modal
          setShowScheduleListModal(true);
        } else {
          // No schedules, go straight to create
          setSelectedSubRoom(subRoom);
          await handleOpenCreateModal(room, subRoom, null);
        }
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

    const builtConfig = await loadScheduleConfig();
    const latestMeta = builtConfig?.meta || shiftMeta;
    let effectiveMeta = latestMeta;
    let effectiveSlotDuration = builtConfig?.unitDuration ?? slotDuration;
    const defaultShiftKeys = getActiveShiftKeys(latestMeta);
    
    if (existingSchedule) {
      // Adding missing shifts to existing schedule
      setIsEditingExistingSchedule(true);
      setExistingScheduleId(existingSchedule.scheduleId);

      if (existingSchedule.shiftConfig) {
        const scheduleMeta = buildShiftMetaFromScheduleConfig(
          existingSchedule.shiftConfig,
          effectiveSlotDuration || DEFAULT_SLOT_DURATION
        );
        effectiveMeta = scheduleMeta.meta;
        effectiveSlotDuration = scheduleMeta.unitDuration;
        setShiftMeta(scheduleMeta.meta);
        setSlotDuration(scheduleMeta.unitDuration);
      }
      
      // Nếu existingSchedule có subRooms array, lưu lại để thêm ca cho tất cả
      if (existingSchedule.subRooms && existingSchedule.subRooms.length > 0) {
        setSelectedSubRooms(existingSchedule.subRooms);
      } else if (existingSchedule.subRoom) {
        setSelectedSubRooms([existingSchedule.subRoom]);
      } else {
        setSelectedSubRooms([]);
      }
      
      const scheduleStart = dayjs(existingSchedule.startDate);
      const scheduleEnd = dayjs(existingSchedule.endDate);
      
      setFromMonth(existingSchedule.month);
      setToMonth(existingSchedule.month);
      setSelectedYear(existingSchedule.year);
      setStartDate(scheduleStart);
      setEndDate(scheduleEnd);
      
      // Pre-select only missing shifts
      const missingShiftKeys = existingSchedule.missingShifts
        .map(s => s.key)
        .filter((key) => SHIFT_KEYS.includes(key));
      setSelectedShifts(missingShiftKeys);
      setInitialMissingShifts(missingShiftKeys); // Save original missing shifts
      
      toast.info(
        `Thêm ca thiếu: ${existingSchedule.missingShifts.map(s => s.name).join(', ')}`
      );
    } else {
      // Creating new schedule
      setIsEditingExistingSchedule(false);
      setExistingScheduleId(null);
      setSelectedSubRooms([]);
      setInitialMissingShifts([]); // Clear for new schedule

      setShiftMeta(effectiveMeta);
      setSlotDuration(effectiveSlotDuration || DEFAULT_SLOT_DURATION);
      
      // Use suggested start date from API
      const suggestedStart = scheduleListData?.summary?.suggestedStartDate;
      const startDateToUse = suggestedStart ? dayjs(suggestedStart) : dayjs().add(1, 'day');
      
      setFromMonth(startDateToUse.month() + 1);
      setToMonth(startDateToUse.month() + 1);
      setSelectedYear(startDateToUse.year());
      setStartDate(startDateToUse);
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
    
    setShowScheduleListModal(false);
    setShowCreateModal(true);
  };

  // 🆕 Load holiday preview khi thay đổi tháng hoặc ngày bắt đầu
  const loadHolidayPreview = useCallback(async () => {
    if (!fromMonth || !toMonth || !selectedYear || !startDate) {
      setHolidayPreview(null);
      return;
    }

    // Tính ngày kết thúc dựa trên toMonth
    const calculatedEndDate = dayjs(new Date(selectedYear, toMonth, 0)); // Last day of toMonth
    
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
  }, [fromMonth, toMonth, selectedYear, startDate]);

  // Trigger load holiday preview khi các dependencies thay đổi
  useEffect(() => {
    if (showCreateModal && !isEditingExistingSchedule) {
      loadHolidayPreview();
    }
  }, [showCreateModal, isEditingExistingSchedule, loadHolidayPreview]);

  // Handle submit create schedule - Tạo cho TẤT CẢ buồng nếu phòng có buồng
  const handleSubmitCreateSchedule = async () => {
    if (!fromMonth || !toMonth || !selectedYear || !startDate || selectedShifts.length === 0) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    // Validate: toMonth >= fromMonth
    if (toMonth < fromMonth) {
      toast.error('Tháng kết thúc phải >= Tháng bắt đầu');
      return;
    }

    // Validate: Không được chọn năm/tháng trong quá khứ
    const currentYear = dayjs().year();
    const currentMonth = dayjs().month() + 1;
    const currentDate = dayjs().startOf('day');
    
    if (selectedYear < currentYear) {
      toast.error('Không thể tạo lịch cho năm đã qua');
      return;
    }
    
    if (selectedYear === currentYear && toMonth < currentMonth) {
      toast.error('Không thể tạo lịch cho tháng đã qua');
      return;
    }
    
    // Validate: Ngày bắt đầu không được trong quá khứ
    if (startDate.isBefore(currentDate)) {
      toast.error('Ngày bắt đầu phải từ hôm nay trở đi');
      return;
    }
    
    // Validate: Nếu có suggested start date, phải tuân theo
    if (scheduleListData?.summary?.suggestedStartDate && !isEditingExistingSchedule) {
      const suggestedStart = dayjs(scheduleListData.summary.suggestedStartDate).startOf('day');
      if (startDate.isBefore(suggestedStart)) {
        toast.error(
          `Phải tạo lịch liên tục từ ngày ${suggestedStart.format('DD/MM/YYYY')}. Không được để trống khoảng thời gian.`
        );
        return;
      }
    }

    setCreatingSchedule(true);
    try {
      // Trường hợp THÊM CA THIẾU cho nhiều buồng (từ grouped schedule)
      if (isEditingExistingSchedule && selectedSubRooms.length > 0) {
        const results = [];
        let successCount = 0;
        
        for (const subRoom of selectedSubRooms) {
          try {
            const response = await scheduleService.generateRoomSchedule({
              roomId: selectedRoom._id,
              subRoomId: subRoom._id,
              fromMonth,
              toMonth,
              year: selectedYear,
              startDate: startDate.format('YYYY-MM-DD'),
              shifts: selectedShifts
            });

            if (response.success) {
              const updatedMonths = response.data?.results?.filter(r => r.status === 'updated') || [];
              const totalAddedSlots = updatedMonths.reduce((sum, m) => sum + (m.addedSlots || 0), 0);
              
              results.push({ 
                subRoom: subRoom.name, 
                status: 'success',
                addedSlots: totalAddedSlots
              });
              successCount++;
            } else {
              results.push({ subRoom: subRoom.name, status: 'failed', message: response.message });
            }
          } catch (error) {
            results.push({ subRoom: subRoom.name, status: 'error', message: error.message });
          }
        }
        
        // Hiển thị kết quả
        const totalAddedSlots = results.reduce((sum, r) => sum + (r.addedSlots || 0), 0);
        const successSubRooms = results.filter(r => r.status === 'success').map(r => r.subRoom).join(', ');
        const failedResults = results.filter(r => r.status === 'failed' || r.status === 'error');
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
              <Text>Đã thêm thành công cho <Text strong>{successCount}/{selectedSubRooms.length}</Text> buồng</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Các buồng: {successSubRooms}
              </Text>
              <Divider style={{ margin: '12px 0' }} />
              <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                Tổng số slots thêm vào: {totalAddedSlots}
              </Text>
              {failedResults.length > 0 && (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <Alert
                    type="warning"
                    message={`${failedResults.length} buồng thất bại`}
                    description={failedResults.map(r => `${r.subRoom}: ${r.message}`).join(', ')}
                    showIcon
                  />
                </>
              )}
            </div>
          )
        });
      }
      // Nếu phòng có buồng, tạo lịch cho TẤT CẢ buồng
      else if (selectedRoom.hasSubRooms && selectedRoom.subRooms && selectedRoom.subRooms.length > 0) {
        const results = [];
        let successCount = 0;
        let skipCount = 0;
        
        for (const subRoom of selectedRoom.subRooms) {
          try {
            const response = await scheduleService.generateRoomSchedule({
              roomId: selectedRoom._id,
              subRoomId: subRoom._id,
              fromMonth,
              toMonth,
              year: selectedYear,
              startDate: startDate.format('YYYY-MM-DD'),
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
        
        // Đếm số buồng bị skip (inactive)
        skipCount = selectedRoom.subRooms.filter(sr => !sr.isActive).length;
        
        toast.success(
          `Tạo lịch thành công cho ${successCount}/${selectedRoom.subRooms.length} buồng` +
          (skipCount > 0 ? ` (${skipCount} buồng không hoạt động bị bỏ qua)` : '')
        );
      } else {
        // Phòng không có buồng
        const response = await scheduleService.generateRoomSchedule({
          roomId: selectedRoom._id,
          subRoomId: selectedSubRoom?._id,
          fromMonth,
          toMonth,
          year: selectedYear,
          startDate: startDate.format('YYYY-MM-DD'),
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
    setSelectedRoom(null);
    setSelectedSubRoom(null);
    setSelectedSubRooms([]);
    setScheduleListData(null);
    setIsEditingExistingSchedule(false);
    setExistingScheduleId(null);
    setStartDate(null);
    setEndDate(null);
    setSelectedShifts(['morning', 'afternoon', 'evening']);
    // Reset schedule list filters
    setScheduleListFilterType('all');
    setScheduleListSearchDate(null);
  };

  // Calculate date range for selected months
  const getDateRange = (fromMonth, toMonth, year) => {
    const start = dayjs().year(year).month(fromMonth - 1).date(1);
    const end = dayjs().year(year).month(toMonth - 1).endOf('month');
    
    return { start, end };
  };

  // Disable dates before fromMonth start or after toMonth end
  // If current month is selected, start date must be >= tomorrow
  // For new schedules: Must be continuous from last schedule's end date
  const disabledDate = (current) => {
    if (!fromMonth || !toMonth || !selectedYear) return false;
    
    const { start, end } = getDateRange(fromMonth, toMonth, selectedYear);
    const today = dayjs().startOf('day');
    const currentMonth = dayjs().month() + 1; // 1-12
    const currentYear = dayjs().year();
    
    // If editing existing schedule (adding missing shifts), dates are fixed
    if (isEditingExistingSchedule) {
      return true; // Disable all dates - can't change
    }
    
    // For new schedules with existing data, validate continuity
    if (scheduleListData?.summary?.suggestedStartDate) {
      const suggestedStart = dayjs(scheduleListData.summary.suggestedStartDate).startOf('day');
      
      // Must start from suggested date (no gaps allowed)
      if (current && current < suggestedStart) {
        return true;
      }
      
      // If there's a gap, only allow filling that gap (same month as suggested start)
      if (scheduleListData.summary.hasGap) {
        const suggestedMonth = suggestedStart.month() + 1;
        const suggestedYear = suggestedStart.year();
        
        // Must select the gap month
        if (fromMonth !== suggestedMonth || selectedYear !== suggestedYear) {
          return current && current > suggestedStart.endOf('month');
        }
      }
    }
    
    // Nếu chọn tháng hiện tại và năm hiện tại, phải chọn sau ngày hiện tại 1 ngày (ngày mai trở đi)
    const isCurrentMonth = fromMonth === currentMonth && selectedYear === currentYear;
    const minDate = isCurrentMonth ? today.add(1, 'day') : today;
    
    return current && (
      current < start.startOf('day') || 
      current > end.endOf('day') ||
      current < minDate  // Không cho chọn ngày trong quá khứ, hoặc hôm nay nếu là tháng hiện tại
    );
  };

  // Table columns
  const columns = [
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
      dataIndex: 'hasSchedule',
      key: 'hasSchedule',
      width: 150,
      render: (hasSchedule) => (
        <Tag 
          color={hasSchedule ? 'success' : 'default'}
          icon={hasSchedule ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {hasSchedule ? 'Đã có lịch' : 'Chưa có lịch'}
        </Tag>
      )
    },
    {
      title: 'Lần tạo cuối',
      dataIndex: 'lastCreatedDate',
      key: 'lastCreatedDate',
      width: 150,
      render: (date, record) => {
        // Use lastCreatedDate from API if available, fallback to lastScheduleGenerated
        const dateToShow = date || record.lastScheduleGenerated;
        return dateToShow ? (
          <div>
            <Text type="secondary">{dayjs(dateToShow).format('DD/MM/YYYY')}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {dayjs(dateToShow).format('HH:mm')}
            </Text>
            {record.scheduleCount > 0 && (
              <>
                <br />
                <Tag color="blue" style={{ fontSize: 10 }}>{record.scheduleCount} lịch</Tag>
              </>
            )}
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
      render: (_, record) => {
        const isDisabled = !record.isActive;
        
        if (!record.hasSubRooms) {
          // Phòng không có buồng
          return (
            <Tooltip title={isDisabled ? "Phòng không hoạt động, không thể tạo lịch" : ""}>
              <Button
                type="primary"
                icon={<CalendarOutlined />}
                onClick={() => handleCreateSchedule(record)}
                disabled={isDisabled}
                block
              >
                {record.hasSchedule ? 'Xem & tạo lịch' : 'Tạo lịch mới'}
              </Button>
            </Tooltip>
          );
        } else {
          // Phòng có buồng - click để xem tất cả buồng
          return (
            <Tooltip title={isDisabled ? "Phòng không hoạt động, không thể tạo lịch" : ""}>
              <Button
                type="primary"
                icon={<CalendarOutlined />}
                onClick={() => handleCreateSchedule(record)}
                disabled={isDisabled}
                block
              >
                {record.hasSchedule ? 'Xem & tạo lịch' : 'Tạo lịch'} ({record.subRooms?.length || 0} buồng)
              </Button>
            </Tooltip>
          );
        }
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row align="middle" style={{ marginBottom: 8 }}>
        <Col>
          <Space align="center">
            <Button
              type="text"
              icon={<ArrowLeftOutlined style={{ fontSize: 20 }} />}
              onClick={() => navigate('/schedule')}
              style={{ padding: '4px 8px' }}
            />
            <Title level={3} style={{ margin: 0 }}>
              Tạo lịch làm việc cho phòng khám
            </Title>
          </Space>
        </Col>
      </Row>

      {/* Filters Section */}
      <Row gutter={16} style={{ marginTop: 24, marginBottom: 16 }}>
        <Col flex="320px">
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
          />
        </Col>
        <Col flex="auto">
          <Space style={{ float: 'right' }}>
            {/* Active Filter */}
            <Select
              value={roomActiveFilter}
              onChange={setRoomActiveFilter}
              style={{ width: 180 }}
            >
              <Option value={true}>Phòng hoạt động</Option>
              <Option value={false}>Phòng không hoạt động</Option>
              <Option value="all">Tất cả phòng</Option>
            </Select>
            
            {/* Schedule Status Filter - Radio */}
            <Radio.Group 
              value={scheduleStatusFilter} 
              onChange={(e) => setScheduleStatusFilter(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="all">Tất cả</Radio.Button>
              <Radio.Button value="no-schedule">Chưa có lịch</Radio.Button>
              <Radio.Button value="has-schedule">Đã có lịch</Radio.Button>
            </Radio.Group>
            
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchRooms}
              loading={loading}
            >
              Làm mới
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Rooms Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredRooms}
          loading={loading}
          rowKey="_id"
          pagination={roomSearchTerm ? false : {
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} phòng`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            }
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
      >
        {scheduleListData && (
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
                  <Text strong style={{ marginRight: 12 }}>Lọc lịch:</Text>
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
                  <Text strong style={{ marginRight: 12 }}>Tìm theo ngày:</Text>
                  <DatePicker
                    value={scheduleListSearchDate}
                    onChange={(date) => setScheduleListSearchDate(date)}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày để tìm lịch"
                    style={{ width: 200 }}
                    allowClear
                  />
                  {scheduleListSearchDate && (
                    <Text type="secondary" style={{ marginLeft: 12 }}>
                      (Tìm lịch có phạm vi chứa ngày này)
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
                {scheduleListSearchDate && ` (chứa ngày ${scheduleListSearchDate.format('DD/MM/YYYY')})`}
                {!scheduleListSearchDate && ':'}
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

                  // Filter schedules based on selected filter type and search date
                  let filteredSchedules = [...scheduleListData.schedules];

                  // Apply type filter
                  if (scheduleListFilterType === 'missing') {
                    filteredSchedules = filteredSchedules.filter(s => s.hasMissingShifts);
                  } else if (scheduleListFilterType === 'complete') {
                    filteredSchedules = filteredSchedules.filter(s => !s.hasMissingShifts);
                  }

                  // Apply date search filter
                  if (scheduleListSearchDate) {
                    filteredSchedules = filteredSchedules.filter(s => {
                      if (!s.startDate || !s.endDate) return false;
                      try {
                        const searchDate = scheduleListSearchDate.format('YYYY-MM-DD');
                        const start = dayjs(s.startDate).format('YYYY-MM-DD');
                        const end = dayjs(s.endDate).format('YYYY-MM-DD');
                        
                        // Debug log
                        console.log('Search:', searchDate, 'Range:', start, '-', end, 'Result:', searchDate >= start && searchDate <= end);
                        
                        return searchDate >= start && searchDate <= end;
                      } catch (err) {
                        console.error('Error parsing schedule dates:', err, s);
                        return false;
                      }
                    });
                  }

                  if (filteredSchedules.length === 0) {
                    return (
                      <Alert
                        type="info"
                        showIcon
                        message="Không tìm thấy lịch"
                        description={
                          scheduleListSearchDate 
                            ? `Không có lịch nào ${scheduleListFilterType === 'missing' ? 'còn thiếu ca ' : scheduleListFilterType === 'complete' ? 'đầy đủ ' : ''}chứa ngày ${scheduleListSearchDate.format('DD/MM/YYYY')}`
                            : `Không có lịch nào ${scheduleListFilterType === 'missing' ? 'còn thiếu ca' : 'đầy đủ'}`
                        }
                        style={{ marginTop: 12 }}
                      />
                    );
                  }

                  return (
                    <List
                      bordered
                      dataSource={filteredSchedules}
                      renderItem={(schedule, index) => (
                        <List.Item
                          actions={
                            schedule.hasMissingShifts 
                              ? [
                                  <Button
                                    type="link"
                                    icon={<PlusOutlined />}
                                    onClick={async () => {
                                      await handleOpenCreateModal(selectedRoom, null, schedule);
                                    }}
                                    style={{ color: '#faad14' }}
                                  >
                                    Thêm ca thiếu
                                  </Button>
                                ]
                            : [
                                <Tag icon={<CheckCircleOutlined />} color="success">
                                  Đầy đủ
                                </Tag>
                              ]
                        }
                      >
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <div>
                            <Tag color="blue">Lịch #{scheduleListData.schedules.indexOf(schedule) + 1}</Tag>
                            {schedule.subRooms && schedule.subRooms.length > 0 && (
                              <>
                                {schedule.subRooms.map((sr, idx) => (
                                  <Tag key={idx} color="cyan">{sr.name}</Tag>
                                ))}
                              </>
                            )}
                            {schedule.subRoom && !schedule.subRooms && (
                              <Tag color="cyan">{schedule.subRoom.name}</Tag>
                            )}
                            <Text strong style={{ marginLeft: 8 }}>
                              Tháng {schedule.month}/{schedule.year}
                            </Text>
                          </div>
                          <div>
                            <Text type="secondary">
                              {dayjs(schedule.startDate).format('DD/MM/YYYY')} - {dayjs(schedule.endDate).format('DD/MM/YYYY')}
                            </Text>
                          </div>
                          <div>
                            <Text>Ca đã tạo: </Text>
                            {schedule.generatedShifts && schedule.generatedShifts.length > 0 ? (
                              schedule.generatedShifts.map(shift => (
                                <Tag key={shift.key} color={shift.color} style={{ marginRight: 4 }}>
                                  {shift.name}
                                </Tag>
                              ))
                            ) : (
                              <Text type="secondary" italic>Chưa có ca nào</Text>
                            )}
                          </div>
                          {schedule.hasMissingShifts && (
                            <div>
                              <Text type="warning">Ca còn thiếu: </Text>
                              {schedule.missingShifts.map(shift => (
                                <Tag key={shift.key} color="default" style={{ marginRight: 4 }}>
                                  {shift.name}
                                </Tag>
                              ))}
                            </div>
                          )}
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
        width={600}
        confirmLoading={creatingSchedule}
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

          {/* SubRooms List - Hiển thị nếu phòng có buồng */}
          {selectedRoom?.hasSubRooms && selectedRoom.subRooms && selectedRoom.subRooms.length > 0 && (
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Danh sách buồng sẽ được tạo lịch:
              </Text>
              <List
                size="small"
                bordered
                dataSource={selectedRoom.subRooms}
                renderItem={(subRoom) => (
                  <List.Item>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <Text>{subRoom.name}</Text>
                        <Tag 
                          color={subRoom.isActive ? 'green' : 'default'}
                          icon={subRoom.isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                        >
                          {subRoom.isActive ? 'Hoạt động' : 'Không hoạt động'}
                        </Tag>
                      </Space>
                      {!subRoom.isActive && (
                        <Tag color="warning">Sẽ không tạo lịch</Tag>
                      )}
                      {subRoom.isActive && (
                        <Tag color="success">Sẽ tạo lịch</Tag>
                      )}
                    </Space>
                  </List.Item>
                )}
                style={{ maxHeight: 200, overflow: 'auto' }}
              />
              <Alert
                type="info"
                message="Lưu ý"
                description="Chỉ các buồng đang hoạt động mới được tạo lịch. Buồng không hoạt động sẽ tự động bỏ qua."
                showIcon
                style={{ marginTop: 8 }}
              />
            </div>
          )}

          {/* Month Range & Year Selection */}
          <Row gutter={16}>
            <Col span={8}>
              <Text strong>Từ tháng <Text type="danger">*</Text></Text>
              <Select
                placeholder="Chọn tháng bắt đầu"
                value={fromMonth}
                onChange={(val) => {
                  setFromMonth(val);
                  // Tự động update toMonth nếu < fromMonth
                  if (toMonth < val) {
                    setToMonth(val);
                  }
                  // Chỉ update start date nếu chưa có hoặc không hợp lệ cho tháng mới
                  if (!startDate || startDate.month() + 1 !== val || startDate.year() !== selectedYear) {
                    const monthStartDate = dayjs().year(selectedYear).month(val - 1).date(1);
                    setStartDate(monthStartDate);
                  }
                }}
                style={{ width: '100%', marginTop: 8 }}
                disabled={isEditingExistingSchedule}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
                  const currentYear = dayjs().year();
                  const currentMonth = dayjs().month() + 1;
                  const isDisabled = selectedYear === currentYear && m < currentMonth;
                  
                  return (
                    <Option key={m} value={m} disabled={isDisabled}>
                      Tháng {m} {isDisabled && '(Đã qua)'}
                    </Option>
                  );
                })}
              </Select>
            </Col>
            <Col span={8}>
              <Text strong>Đến tháng <Text type="danger">*</Text></Text>
              <Select
                placeholder="Chọn tháng kết thúc"
                value={toMonth}
                onChange={setToMonth}
                style={{ width: '100%', marginTop: 8 }}
                disabled={isEditingExistingSchedule}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                  <Option 
                    key={m} 
                    value={m}
                    disabled={m < fromMonth}
                  >
                    Tháng {m}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={8}>
              <Text strong>Năm <Text type="danger">*</Text></Text>
              <Select
                placeholder="Chọn năm"
                value={selectedYear}
                onChange={(year) => {
                  setSelectedYear(year);
                  // Reset start date khi đổi năm
                  if (!startDate || startDate.year() !== year) {
                    const currentMonth = dayjs().month() + 1;
                    const currentYear = dayjs().year();
                    
                    // Nếu chọn năm hiện tại và tháng đã chọn < tháng hiện tại, đặt về tháng hiện tại
                    if (year === currentYear && fromMonth < currentMonth) {
                      setFromMonth(currentMonth);
                      setToMonth(currentMonth);
                      const monthStartDate = dayjs().year(year).month(currentMonth - 1).add(1, 'day').startOf('day');
                      setStartDate(monthStartDate);
                    } else {
                      const monthStartDate = dayjs().year(year).month(fromMonth - 1).date(1);
                      setStartDate(monthStartDate);
                    }
                  }
                }}
                style={{ width: '100%', marginTop: 8 }}
                disabled={isEditingExistingSchedule}
              >
                {(() => {
                  const currentYear = dayjs().year();
                  const currentMonth = dayjs().month() + 1;
                  const suggestedStart = scheduleListData?.summary?.suggestedStartDate;
                  
                  // Xác định năm tối thiểu có thể chọn
                  let minYear = currentYear;
                  
                  // Nếu có lịch đề xuất, lấy năm từ ngày đề xuất
                  if (suggestedStart && !isEditingExistingSchedule) {
                    minYear = dayjs(suggestedStart).year();
                  }
                  
                  // Nếu đang ở tháng cuối năm và đã tạo hết lịch năm nay
                  // thì cho phép chọn năm sau
                  const lastSchedule = scheduleListData?.schedules?.[scheduleListData.schedules.length - 1];
                  if (lastSchedule) {
                    const lastScheduleEnd = dayjs(lastSchedule.endDate);
                    const lastScheduleYear = lastScheduleEnd.year();
                    const lastScheduleMonth = lastScheduleEnd.month() + 1;
                    
                    // Nếu lịch cuối cùng là tháng 12 của năm hiện tại, cho phép chọn năm sau
                    if (lastScheduleYear === currentYear && lastScheduleMonth === 12) {
                      minYear = currentYear + 1;
                    }
                  }
                  
                  const years = [];
                  // Tạo danh sách năm từ minYear đến minYear + 2
                  for (let i = 0; i <= 2; i++) {
                    const year = minYear + i;
                    const isDisabled = year < currentYear || 
                      (year === currentYear && currentMonth === 12 && fromMonth <= currentMonth);
                    
                    years.push(
                      <Option key={year} value={year} disabled={isDisabled}>
                        {year} {isDisabled && '(Đã qua)'}
                      </Option>
                    );
                  }
                  
                  return years;
                })()}
              </Select>
            </Col>
          </Row>

          {/* Info về khoảng thời gian */}
          {fromMonth && toMonth && selectedYear && startDate && (
            <Alert
              type="info"
              showIcon
              message={`Tạo lịch liên tục: Tháng ${String(fromMonth).padStart(2, '0')} → Tháng ${String(toMonth).padStart(2, '0')}/${selectedYear}`}
              description={`Từ ${startDate.format('DD/MM/YYYY')} 
                đến ${getDateRange(fromMonth, toMonth, selectedYear).end.format('DD/MM/YYYY')}`}
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
              placeholder="Chọn ngày bắt đầu"
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
              disabled={isEditingExistingSchedule}
              style={{ width: '100%', marginTop: 8 }}
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

          <Divider style={{ margin: '12px 0' }} />

          {/* Shift Selection */}
          <div>
            <Text strong>Chọn ca làm việc <Text type="danger">*</Text></Text>
            <Alert
              type="info"
              showIcon
              message="Lưu ý"
              description={isEditingExistingSchedule 
                ? "Chỉ có thể chọn các ca còn thiếu. Ca đã tạo không thể sửa đổi."
                : "Hệ thống sẽ lưu cấu hình CẢ 3 CA. Ca không chọn có thể tạo sau với cấu hình cũ nếu trùng khoảng thời gian."}
              style={{ marginTop: 8, marginBottom: 8, fontSize: 12 }}
            />
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
                  disabled={
                    (isEditingExistingSchedule && !initialMissingShifts.includes('morning')) ||
                    (!isEditingExistingSchedule && !shiftMeta.morning?.isActive)
                  }
                >
                  <Space>
                    <Tag color={SHIFT_COLORS.morning}>{shiftMeta.morning?.name}</Tag>
                    <Text type="secondary">({shiftMeta.morning?.startTime ?? '--:--'} - {shiftMeta.morning?.endTime ?? '--:--'})</Text>
                    {!isEditingExistingSchedule && !shiftMeta.morning?.isActive && (
                      <Tag color="gray">Đang tắt</Tag>
                    )}
                    {isEditingExistingSchedule && !selectedShifts.includes('morning') && (
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
                    (isEditingExistingSchedule && !initialMissingShifts.includes('afternoon')) ||
                    (!isEditingExistingSchedule && !shiftMeta.afternoon?.isActive)
                  }
                >
                  <Space>
                    <Tag color={SHIFT_COLORS.afternoon}>{shiftMeta.afternoon?.name}</Tag>
                    <Text type="secondary">({shiftMeta.afternoon?.startTime ?? '--:--'} - {shiftMeta.afternoon?.endTime ?? '--:--'})</Text>
                    {!isEditingExistingSchedule && !shiftMeta.afternoon?.isActive && (
                      <Tag color="gray">Đang tắt</Tag>
                    )}
                    {isEditingExistingSchedule && !selectedShifts.includes('afternoon') && (
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
                    (isEditingExistingSchedule && !initialMissingShifts.includes('evening')) ||
                    (!isEditingExistingSchedule && !shiftMeta.evening?.isActive)
                  }
                >
                  <Space>
                    <Tag color={SHIFT_COLORS.evening}>{shiftMeta.evening?.name}</Tag>
                    <Text type="secondary">({shiftMeta.evening?.startTime ?? '--:--'} - {shiftMeta.evening?.endTime ?? '--:--'})</Text>
                    {!isEditingExistingSchedule && !shiftMeta.evening?.isActive && (
                      <Tag color="gray">Đang tắt</Tag>
                    )}
                    {isEditingExistingSchedule && !selectedShifts.includes('evening') && (
                      <Tag color="success">Đã tạo</Tag>
                    )}
                  </Space>
                </Checkbox>
              </Space>
            </Spin>
          </div>

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
    </div>
  );
};

export default CreateScheduleForRoom;

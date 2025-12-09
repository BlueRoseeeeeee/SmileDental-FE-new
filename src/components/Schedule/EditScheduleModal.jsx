import React, { useState, useEffect } from 'react';
import { Modal, Switch, Checkbox, Space, Tag, Alert, Spin, Button, DatePicker, Input, App } from 'antd';
import { WarningOutlined, CalendarOutlined, StopOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { updateSchedule, bulkToggleScheduleDates } from '../../services/scheduleService';
import scheduleService from '../../services/scheduleService';
import scheduleConfigService from '../../services/scheduleConfigService';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const SHIFT_COLORS = {
  morning: 'gold',
  afternoon: 'blue',
  evening: 'purple'
};

/**
 * EditScheduleModal - Modal cho phép admin chỉnh sửa lịch
 * - Toggle schedule.isActive (ẩn lịch khỏi bệnh nhân)
 * - Reactivate shifts đã tắt (false → true only)
 * - Reactivate subrooms có isActiveSubRoom=false (false → true only)
 */
const EditScheduleModal = ({ 
  visible, 
  onCancel, 
  onSuccess,
  roomId, // ✅ Room ID để lấy tất cả schedules
  month, // ✅ Month để filter
  year, // ✅ Year để filter
  scheduleListData // ✅ Data từ getRoomSchedulesWithShifts
}) => {
  // 🆕 Use modal and message hooks from App context
  const { modal, message: messageApi } = App.useApp();
  
  const [loading, setLoading] = useState(false);
  const [reactivateShifts, setReactivateShifts] = useState([]);
  const [deactivateShifts, setDeactivateShifts] = useState([]); // 🆕 [{shiftKey, isActive}, ...]
  const [reactivateSubRooms, setReactivateSubRooms] = useState([]); // Array of {scheduleId, subRoomId}
  const [toggleSubRooms, setToggleSubRooms] = useState([]); // 🆕 [{scheduleId, subRoomId, isActive}, ...]
  
  // 🆕 Override Holiday states
  const [showOverrideSection, setShowOverrideSection] = useState(false);
  const [overrideDate, setOverrideDate] = useState(null);
  const [overrideShifts, setOverrideShifts] = useState([]);
  const [overrideNote, setOverrideNote] = useState('');
  const [holidayInfo, setHolidayInfo] = useState(null);
  const [validHolidayDates, setValidHolidayDates] = useState([]); // 🆕 Danh sách ngày nghỉ hợp lệ (date strings)
  const [checkingHoliday, setCheckingHoliday] = useState(false);
  const [creatingOverride, setCreatingOverride] = useState(false);
  const [selectedSubRoomsForOverride, setSelectedSubRoomsForOverride] = useState([]); // 🆕 Array of subRoomIds/scheduleIds to create override
  const [availableShiftsInfo, setAvailableShiftsInfo] = useState(null); // 🆕 {availableShifts, overriddenShifts}
  const [checkingShifts, setCheckingShifts] = useState(false); // 🆕 Loading state khi check shifts
  
  // 🆕 Toggle Schedule states - Form mới: Bật/Tắt lịch làm việc
  const [showToggleSection, setShowToggleSection] = useState(false);
  const [filterDates, setFilterDates] = useState([]); // Array of dayjs dates để filter khi toggle

  // REMOVED: Bulk Toggle Room states (xóa section này)
  // const [bulkToggleDateRange, setBulkToggleDateRange] = useState([]);
  // const [bulkToggleReason, setBulkToggleReason] = useState('');
  // const [bulkTogglingRoom, setBulkTogglingRoom] = useState(false);

  // Initialize state when modal opens
  useEffect(() => {
    if (visible && scheduleListData) {
      console.log('🔄 EditScheduleModal opened, resetting states');
      setReactivateShifts([]);
      setDeactivateShifts([]); // 🆕 Reset deactivate shifts
      setReactivateSubRooms([]);
      setToggleSubRooms([]); // 🆕 Reset toggle subrooms
      
      // Reset override holiday states - AUTO SHOW OVERRIDE SECTION
      setShowOverrideSection(true); // ✅ Auto-show override form
      setOverrideDate(null);
      setOverrideShifts([]);
      setOverrideNote('');
      setHolidayInfo(null);
      setSelectedSubRoomsForOverride([]);
      setCheckingHoliday(false); // ✅ Reset checking state
      setAvailableShiftsInfo(null); // ✅ Reset shifts info
      setCheckingShifts(false); // ✅ Reset checking shifts state
      
      // Reset toggle schedule states
      setShowToggleSection(false);
      setFilterDates([]);

      // 🔧 MOVED TO separate useEffect that watches selectedSubRoomsForOverride
      // Load valid holiday dates logic now in useEffect below
    }
  }, [visible, scheduleListData]);

  // 🆕 Update valid holiday dates when selected subrooms change
  useEffect(() => {
    const updateValidHolidayDates = async () => {
      try {
        const allSchedules = scheduleListData?.schedules || [];
        
        if (allSchedules.length === 0) {
          setValidHolidayDates([]);
          return;
        }
        
        const firstSchedule = allSchedules[0];
        
        if (!firstSchedule || !firstSchedule.holidaySnapshot) {
          setValidHolidayDates([]);
          return;
        }
        
        const allSubRooms = scheduleListData?.subRooms || [];
        const hasSubRooms = allSubRooms.length > 0;
        
        // 🔥 Nếu có subroom nhưng chưa chọn → Không hiển thị ngày nào
        if (hasSubRooms && selectedSubRoomsForOverride.length === 0) {
          console.log('⚠️ Room có subrooms nhưng chưa chọn → Không hiển thị ngày nghỉ');
          setValidHolidayDates([]);
          return;
        }
        
        // 🔥 Lọc schedules dựa vào subrooms đã chọn
        let schedulesToCheck = allSchedules;
        
        if (hasSubRooms) {
          // Chỉ check schedules của subrooms đã chọn
          schedulesToCheck = allSchedules.filter(schedule => {
            const scheduleId = schedule._id || schedule.scheduleId;
            return selectedSubRoomsForOverride.includes(scheduleId);
          });
          
          console.log(`🔍 Filtering schedules: Selected ${selectedSubRoomsForOverride.length} subrooms → ${schedulesToCheck.length} schedules to check`);
        }
        
        if (schedulesToCheck.length === 0) {
          setValidHolidayDates([]);
          return;
        }
        
        // 🆕 LOGIC: Chỉ hiển thị ngày nếu CÒN ÍT NHẤT 1 CA chưa override trong CÁC SCHEDULES ĐÃ CHỌN
        const dateShiftsStatus = new Map();
        
        schedulesToCheck.forEach(schedule => {
          const schedDaysOff = schedule.holidaySnapshot?.computedDaysOff || [];
          
          schedDaysOff.forEach(dayOff => {
            const dateStr = dayOff.date;
            
            if (!dateShiftsStatus.has(dateStr)) {
              dateShiftsStatus.set(dateStr, {
                morning: new Set(),
                afternoon: new Set(),
                evening: new Set()
              });
            }
            
            const shifts = dateShiftsStatus.get(dateStr);
            
            // Check từng ca: Nếu chưa override trong schedule này → Thêm scheduleId vào Set
            if (dayOff.shifts?.morning && !dayOff.shifts.morning.isOverridden) {
              shifts.morning.add(schedule._id || schedule.scheduleId);
            }
            if (dayOff.shifts?.afternoon && !dayOff.shifts.afternoon.isOverridden) {
              shifts.afternoon.add(schedule._id || schedule.scheduleId);
            }
            if (dayOff.shifts?.evening && !dayOff.shifts.evening.isOverridden) {
              shifts.evening.add(schedule._id || schedule.scheduleId);
            }
          });
        });
        
        // Lọc ngày: Chỉ giữ ngày nếu CÒN ÍT NHẤT 1 CA chưa override ở ÍT NHẤT 1 schedule đã chọn
        // 🔥 VÀ ngày phải là TƯƠNG LAI (không phải hôm nay hoặc quá khứ)
        const today = dayjs().startOf('day');
        const validDates = Array.from(dateShiftsStatus.entries())
          .filter(([dateStr, shifts]) => {
            const hasAvailableShift = 
              shifts.morning.size > 0 || 
              shifts.afternoon.size > 0 || 
              shifts.evening.size > 0;
            // 🔥 Thêm filter: ngày phải > hôm nay
            const isFutureDate = dayjs(dateStr).isAfter(today);
            return hasAvailableShift && isFutureDate;
          })
          .map(([dateStr]) => dateStr)
          .sort();
        
        console.log(`📅 Valid holiday dates (còn ít nhất 1 ca chưa override trong ${schedulesToCheck.length} schedules đã chọn):`, validDates);
        
        setValidHolidayDates(validDates);
        
        // 🔥 Nếu ngày đang chọn không còn valid → Clear selection
        if (overrideDate && !validDates.includes(overrideDate.format('YYYY-MM-DD'))) {
          console.log('⚠️ Ngày đang chọn không còn available → Clear selection');
          setOverrideDate(null);
          setAvailableShiftsInfo(null);
        }
        
      } catch (error) {
        console.error('Error updating valid holiday dates:', error);
        setValidHolidayDates([]);
      }
    };

    // Chỉ update nếu modal đang mở
    if (visible && scheduleListData) {
      updateValidHolidayDates();
    }
  }, [visible, scheduleListData, selectedSubRoomsForOverride, overrideDate]);


  // 🆕 Update valid holiday dates when selected subrooms change
  useEffect(() => {
    const updateValidHolidayDates = async () => {
      try {
        const allSchedules = scheduleListData?.schedules || [];
        
        if (allSchedules.length === 0) {
          setValidHolidayDates([]);
          return;
        }
        
        const firstSchedule = allSchedules[0];
        
        if (!firstSchedule || !firstSchedule.holidaySnapshot) {
          setValidHolidayDates([]);
          return;
        }
        
        const allSubRooms = scheduleListData?.subRooms || [];
        const hasSubRooms = allSubRooms.length > 0;
        
        // 🔥 Nếu có subroom nhưng chưa chọn → Không hiển thị ngày nào
        if (hasSubRooms && selectedSubRoomsForOverride.length === 0) {
          console.log('⚠️ Room có subrooms nhưng chưa chọn → Không hiển thị ngày nghỉ');
          setValidHolidayDates([]);
          return;
        }
        
        // 🔥 Lọc schedules dựa vào subrooms đã chọn
        let schedulesToCheck = allSchedules;
        
        if (hasSubRooms) {
          // Chỉ check schedules của subrooms đã chọn
          schedulesToCheck = allSchedules.filter(schedule => {
            const scheduleId = schedule._id || schedule.scheduleId;
            return selectedSubRoomsForOverride.includes(scheduleId);
          });
          
          console.log(`🔍 Filtering schedules: Selected ${selectedSubRoomsForOverride.length} subrooms → ${schedulesToCheck.length} schedules to check`);
        }
        
        if (schedulesToCheck.length === 0) {
          setValidHolidayDates([]);
          return;
        }
        
        // 🆕 LOGIC: Chỉ hiển thị ngày nếu CÒN ÍT NHẤT 1 CA chưa override trong CÁC SCHEDULES ĐÃ CHỌN
        const dateShiftsStatus = new Map(); // Map<dateStr, {morning: Set, afternoon: Set, evening: Set}>
        
        schedulesToCheck.forEach(schedule => {
          const schedDaysOff = schedule.holidaySnapshot?.computedDaysOff || [];
          
          schedDaysOff.forEach(dayOff => {
            const dateStr = dayOff.date;
            
            if (!dateShiftsStatus.has(dateStr)) {
              dateShiftsStatus.set(dateStr, {
                morning: new Set(),
                afternoon: new Set(),
                evening: new Set()
              });
            }
            
            const shifts = dateShiftsStatus.get(dateStr);
            
            // Check từng ca: Nếu chưa override trong schedule này → Thêm scheduleId vào Set
            if (dayOff.shifts?.morning && !dayOff.shifts.morning.isOverridden) {
              shifts.morning.add(schedule._id || schedule.scheduleId);
            }
            if (dayOff.shifts?.afternoon && !dayOff.shifts.afternoon.isOverridden) {
              shifts.afternoon.add(schedule._id || schedule.scheduleId);
            }
            if (dayOff.shifts?.evening && !dayOff.shifts.evening.isOverridden) {
              shifts.evening.add(schedule._id || schedule.scheduleId);
            }
          });
        });
        
        // Lọc ngày: Chỉ giữ ngày nếu CÒN ÍT NHẤT 1 CA chưa override ở ÍT NHẤT 1 schedule đã chọn
        // 🔥 VÀ ngày phải là TƯƠNG LAI (không phải hôm nay hoặc quá khứ)
        const today = dayjs().startOf('day');
        const validDates = Array.from(dateShiftsStatus.entries())
          .filter(([dateStr, shifts]) => {
            const hasAvailableShift = 
              shifts.morning.size > 0 || 
              shifts.afternoon.size > 0 || 
              shifts.evening.size > 0;
            // 🔥 Thêm filter: ngày phải > hôm nay
            const isFutureDate = dayjs(dateStr).isAfter(today);
            return hasAvailableShift && isFutureDate;
          })
          .map(([dateStr]) => dateStr)
          .sort();
        
        console.log(`📅 Valid holiday dates (còn ít nhất 1 ca chưa override trong ${schedulesToCheck.length} schedules đã chọn):`, validDates);
        console.log('🔍 Date-shift status:', Array.from(dateShiftsStatus.entries()).map(([date, shifts]) => ({
          date,
          availableShifts: {
            morning: shifts.morning.size,
            afternoon: shifts.afternoon.size,
            evening: shifts.evening.size
          }
        })));
        
        setValidHolidayDates(validDates);
        
        // 🔥 Nếu ngày đang chọn không còn valid → Clear selection
        if (overrideDate && !validDates.includes(overrideDate.format('YYYY-MM-DD'))) {
          console.log('⚠️ Ngày đang chọn không còn available → Clear selection');
          setOverrideDate(null);
          setAvailableShiftsInfo(null);
        }
        
      } catch (error) {
        console.error('Error updating valid holiday dates:', error);
        setValidHolidayDates([]);
      }
    };

    // Chỉ update nếu modal đang mở
    if (visible && scheduleListData) {
      updateValidHolidayDates();
    }
  }, [visible, scheduleListData, selectedSubRoomsForOverride]);

  // 🆕 Check available shifts when date and subrooms are selected
  useEffect(() => {
    const checkAvailableShifts = async () => {
      console.log('🔍 checkAvailableShifts triggered:', {
        overrideDate: overrideDate?.format('YYYY-MM-DD'),
        roomId,
        month,
        year,
        selectedSubRoomsForOverride,
        selectedCount: selectedSubRoomsForOverride.length
      });
      
      // Only check if we have date and at least one schedule selected
      if (!overrideDate || !roomId || !month || !year) {
        console.log('⏭️ Skipping API call: Missing required fields');
        setAvailableShiftsInfo(null);
        return;
      }

      // Determine which schedules to check
      let scheduleIdsToCheck = [];
      
      // ✅ Determine if room has subrooms by checking the schedules themselves
      const schedulesForMonth = scheduleListData?.schedules?.filter(s => 
        s.month === month && s.year === year
      ) || [];
      
      const hasSubRooms = schedulesForMonth.some(s => s.subRoom || s.subRoomId);
      
      console.log('🔍 checkAvailableShifts - Room structure:', {
        schedulesForMonth: schedulesForMonth.length,
        hasSubRooms,
        selectedSubRoomsCount: selectedSubRoomsForOverride.length
      });
      
      if (hasSubRooms) {
        // Room has subrooms - use selected subrooms
        if (selectedSubRoomsForOverride.length === 0) {
          // No subrooms selected yet
          console.log('⏭️ Skipping API call: No subrooms selected');
          setAvailableShiftsInfo(null);
          return;
        }
        scheduleIdsToCheck = selectedSubRoomsForOverride;
      } else {
        // Room without subrooms - use main schedule
        const mainSchedule = schedulesForMonth.find(s => !s.subRoom && !s.subRoomId);
        if (!mainSchedule) {
          console.log('⏭️ Skipping API call: Main schedule not found');
          setAvailableShiftsInfo(null);
          return;
        }
        scheduleIdsToCheck = [mainSchedule.scheduleId];
      }

      // Call API to check shifts status
      try {
        setCheckingShifts(true);
        console.log('🔍 Checking available shifts for:', {
          roomId,
          month,
          year,
          date: overrideDate.format('YYYY-MM-DD'),
          scheduleIds: scheduleIdsToCheck
        });

        const result = await scheduleService.getAvailableOverrideShifts({
          roomId,
          month,
          year,
          date: overrideDate.format('YYYY-MM-DD'),
          scheduleIds: scheduleIdsToCheck
        });

        console.log('✅ Available shifts result:', result);
        console.log('📊 Detailed breakdown:', {
          date: overrideDate.format('YYYY-MM-DD'),
          selectedScheduleIds: scheduleIdsToCheck,
          availableShifts: result.availableShifts?.map(s => ({
            shift: s.name,
            availableFor: s.availableFor?.map(x => `${x.subRoomName} (${x.scheduleId})`)
          })),
          overriddenShifts: result.overriddenShifts?.map(s => ({
            shift: s.name,
            overriddenFor: s.overriddenFor?.map(x => `${x.subRoomName} (${x.scheduleId}) [${x.source}]`)
          }))
        });
        
        if (result.success !== false) {
          setAvailableShiftsInfo(result);
          
          // Auto-select only available shifts
          if (result.availableShifts && result.availableShifts.length > 0) {
            // Don't auto-select, let user choose
            // But clear any previously selected overridden shifts
            const availableKeys = result.availableShifts.map(s => s.shiftKey);
            setOverrideShifts(prev => prev.filter(key => availableKeys.includes(key)));
          }
        } else {
          setAvailableShiftsInfo(null);
          messageApi.warning(result.message || 'Không thể kiểm tra trạng thái ca');
        }
      } catch (error) {
        console.error('❌ Error checking available shifts:', error);
        messageApi.error('Lỗi khi kiểm tra trạng thái ca');
        setAvailableShiftsInfo(null);
      } finally {
        setCheckingShifts(false);
      }
    };

    checkAvailableShifts();
  }, [overrideDate, selectedSubRoomsForOverride, roomId, month, year, scheduleListData]);

  const handleSubmit = async () => {
    if (!scheduleListData || !scheduleListData.schedules || scheduleListData.schedules.length === 0) {
      messageApi.error('Không tìm thấy thông tin lịch');
      return;
    }
    
    // 🆕 Validation: Bắt buộc chọn ngày nếu có toggle shifts hoặc subrooms
    if ((deactivateShifts.length > 0 || toggleSubRooms.length > 0) && filterDates.length === 0) {
      messageApi.error('Vui lòng chọn khoảng ngày trước khi tắt/bật ca hoặc buồng');
      return;
    }

    console.log('📊 Debug before submit:', {
      toggleSubRooms,
      deactivateShifts,
      filterDates: filterDates.length,
      schedulesCount: scheduleListData.schedules.length
    });

    try {
      setLoading(true);

      // ✅ Update all schedules with reactivate data
      const updatePromises = scheduleListData.schedules.map(schedule => {
        const updateData = {};
        
        // 🆕 Nếu có filterDates, gửi date range để chỉ update những ngày cụ thể
        if (filterDates.length > 0) {
          updateData.dateRange = {
            startDate: filterDates[0].format('YYYY-MM-DD'),
            endDate: filterDates[1] ? filterDates[1].format('YYYY-MM-DD') : filterDates[0].format('YYYY-MM-DD')
          };
          console.log('📅 Applying date filter:', updateData.dateRange);
        }
        
        // Reactivate shifts if any
        if (reactivateShifts.length > 0) {
          updateData.reactivateShifts = reactivateShifts;
        }
        
        // 🆕 Deactivate shifts (toggle on/off)
        if (deactivateShifts.length > 0) {
          updateData.deactivateShifts = deactivateShifts;
        }
        
        // ✅ Reactivate subrooms (gửi array trong 1 request)
        if (reactivateSubRooms.length > 0) {
          const subRoomIdsToReactivate = reactivateSubRooms.map(item => item.subRoomId);
          updateData.reactivateSubRooms = subRoomIdsToReactivate;
        }
        
        // 🆕 Toggle subrooms (bật/tắt isActiveSubRoom)
        // Chỉ toggle nếu subroom này thuộc schedule hiện tại
        const subRoomToggle = toggleSubRooms.find(item => item.scheduleId === schedule.scheduleId);
        if (subRoomToggle) {
          updateData.toggleSubRoom = {
            subRoomId: subRoomToggle.subRoomId,
            isActive: subRoomToggle.isActive
          };
          console.log(`🔄 Schedule ${schedule.scheduleId} - Found toggle for subRoom ${subRoomToggle.subRoomId}:`, subRoomToggle);
        } else {
          console.log(`ℹ️ Schedule ${schedule.scheduleId} - No toggle found`);
        }

        console.log(`📤 Updating schedule ${schedule.scheduleId}:`, updateData);
        
        return updateSchedule(schedule.scheduleId, updateData);
      });

      await Promise.all(updatePromises);

      messageApi.success('Cập nhật lịch thành công');
      
      // Callback to parent
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onCancel();

    } catch (error) {
      console.error('❌ Error updating schedule:', error);
      messageApi.error(error.response?.data?.message || error.message || 'Không thể cập nhật lịch');
    } finally {
      setLoading(false);
    }
  };

  const handleShiftCheckboxChange = (shiftKey, checked) => {
    if (checked) {
      setReactivateShifts([...reactivateShifts, shiftKey]);
    } else {
      setReactivateShifts(reactivateShifts.filter(s => s !== shiftKey));
    }
  };
  
  // 🆕 Handle override holiday validation
  const handleOverrideValidation = () => {
    if (!overrideDate) {
      messageApi.error('Vui lòng chọn ngày nghỉ');
      return false;
    }
    
    if (!holidayInfo) {
      messageApi.error('Ngày được chọn không phải ngày nghỉ hợp lệ. Vui lòng chọn ngày khác từ danh sách.');
      return false;
    }
    
    if (overrideShifts.length === 0) {
      messageApi.error('Vui lòng chọn ít nhất một ca');
      return false;
    }
    
    if (!roomId) {
      messageApi.error('Không tìm thấy thông tin phòng');
      return false;
    }
    
    // 🆕 Kiểm tra allSubRooms để phân biệt phòng có/không có subroom
    const allSubRooms = [];
    if (scheduleListData?.schedules) {
      scheduleListData.schedules.forEach(schedule => {
        if (schedule.month === month && schedule.year === year && schedule.subRoom) {
          allSubRooms.push(schedule);
        }
      });
    }
    
    // Chỉ validate selectedSubRoomsForOverride nếu phòng CÓ subroom
    if (allSubRooms.length > 0 && selectedSubRoomsForOverride.length === 0) {
      messageApi.error('Vui lòng chọn ít nhất một phòng/buồng');
      return false;
    }
    
    return true;
  };
  
  // 🆕 Handle toggle shift (cho ca đã generate)
  const handleShiftToggle = (shiftKey, currentIsActive) => {
    // Remove existing entry if any
    const filtered = deactivateShifts.filter(item => item.shiftKey !== shiftKey);
    
    // Add new entry with toggled state
    setDeactivateShifts([...filtered, { shiftKey, isActive: !currentIsActive }]);
  };

  const handleSubRoomCheckboxChange = (scheduleId, subRoomId, subRoomName, checked) => {
    if (checked) {
      setReactivateSubRooms([...reactivateSubRooms, { scheduleId, subRoomId, subRoomName }]);
    } else {
      setReactivateSubRooms(reactivateSubRooms.filter(item => 
        !(item.scheduleId === scheduleId && item.subRoomId === subRoomId)
      ));
    }
  };
  
  // 🆕 Handle toggle subroom (bật/tắt buồng)
  const handleSubRoomToggle = (scheduleId, subRoomId, currentIsActive) => {
    // Remove existing entry if any
    const filtered = toggleSubRooms.filter(item => 
      !(item.scheduleId === scheduleId && item.subRoomId === subRoomId)
    );
    
    // Add new entry with toggled state
    setToggleSubRooms([...filtered, { 
      scheduleId, 
      subRoomId, 
      isActive: !currentIsActive 
    }]);
  };
  
  // 🆕 Check if selected date is a holiday FROM SCHEDULE holidaySnapshot
  const checkIfHoliday = async (date) => {
    if (!date || !roomId || !month || !year) {
      console.warn('⚠️ checkIfHoliday called with missing params:', { date: !!date, roomId: !!roomId, month, year });
      return;
    }
    
    setCheckingHoliday(true);
    try {
      const dateStr = dayjs(date).format('YYYY-MM-DD');
      const firstSchedule = scheduleListData?.schedules?.[0];
      const subRoomId = firstSchedule?.subRoom?._id;
      
      console.log('🔍 Checking holiday for date:', dateStr, { roomId, subRoomId, month, year });
      
      // Call new API to validate from schedule's holidaySnapshot
      const result = await scheduleConfigService.validateHolidayFromSchedule({
        roomId,
        subRoomId: subRoomId || null,
        month,
        year,
        date: dateStr
      });
      
      console.log('✅ Holiday check result:', result);
      
      if (result.success && result.isHoliday) {
        setHolidayInfo(result.holidayInfo);
        setValidHolidayDates(result.validDates || []); // Store all valid dates
      } else {
        setHolidayInfo(null);
        // ✅ Chỉ reset validHolidayDates, KHÔNG hiển thị warning
        // Vì user có thể đang explore các ngày khác nhau
        console.log('ℹ️ Selected date is not a holiday');
      }
    } catch (error) {
      console.error('❌ Error checking holiday:', error);
      setHolidayInfo(null);
      setValidHolidayDates([]);
      messageApi.error('Lỗi kiểm tra ngày nghỉ: ' + (error.response?.data?.message || error.message));
    } finally {
      setCheckingHoliday(false);
    }
  };
  
  // 🆕 Handle override holiday submit
  const handleOverrideHoliday = async () => {
    // ✅ Use centralized validation
    if (!handleOverrideValidation()) {
      return;
    }
    
    try {
      setCreatingOverride(true);
      
      // 🆕 Kiểm tra xem phòng có subroom không
      const allSubRooms = [];
      if (scheduleListData?.schedules) {
        scheduleListData.schedules.forEach(schedule => {
          if (schedule.month === month && schedule.year === year && schedule.subRoom) {
            allSubRooms.push(schedule);
          }
        });
      }
      
      // 🆕 Nếu KHÔNG có subroom, tự động lấy schedule chính
      let scheduleIdsToProcess = [];
      if (allSubRooms.length === 0) {
        // Phòng không có subroom → Lấy schedule chính (schedule không có subRoomId)
        const mainSchedule = scheduleListData.schedules.find(s => 
          s.month === month && s.year === year && !s.subRoom
        );
        if (mainSchedule) {
          scheduleIdsToProcess = [mainSchedule.scheduleId]; // ✅ Dùng scheduleId thay vì _id
          console.log('✅ Auto-selected main schedule:', mainSchedule.scheduleId);
        }
      } else {
        // Phòng có subroom → Dùng danh sách đã chọn
        scheduleIdsToProcess = selectedSubRoomsForOverride;
      }
      
      if (scheduleIdsToProcess.length === 0) {
        messageApi.error('Không tìm thấy schedule để tạo override');
        return;
      }
      
      // 🆕 Use batch API with auto-skip logic
      const payload = {
        scheduleIds: scheduleIdsToProcess,
        date: overrideDate.format('YYYY-MM-DD'),
        shifts: overrideShifts,
        note: overrideNote || `Lịch override ngày nghỉ tháng ${month}/${year}`
      };
      
      console.log(`📤 Creating batch override holiday:`, payload);
      
      const result = await scheduleConfigService.createBatchScheduleOverrideHoliday(payload);
      
      if (result.success) {
        // Show detailed results
        const totalSchedules = scheduleIdsToProcess.length;
        const successCount = result.results?.filter(r => r.slotsCreated > 0).length || 0;
        const skippedCount = result.results?.filter(r => r.shiftsSkipped?.length > 0).length || 0;
        
        let message = `Đã tạo lịch override: ${result.totalSlotsCreated} slots`;
        if (successCount > 0) {
          message += ` cho ${successCount}/${totalSchedules} ${allSubRooms.length > 0 ? 'phòng/buồng' : 'phòng'}`;
        }
        if (skippedCount > 0) {
          message += ` (${skippedCount} đã có lịch - tự động bỏ qua)`;
        }
        
        messageApi.success(message);
        
        // Callback to refresh data
        if (onSuccess) {
          onSuccess();
        }
        
        // Reset override section and close modal
        setShowOverrideSection(false);
        setOverrideDate(null);
        setOverrideShifts([]);
        setOverrideNote('');
        setHolidayInfo(null);
        setSelectedSubRoomsForOverride([]);
        setAvailableShiftsInfo(null); // Clear cached shift status
        
        // Close modal to force data refresh
        onCancel();
        
      } else {
        messageApi.warning(result.message || 'Không có schedule nào được tạo thành công');
      }
    } catch (error) {
      console.error('Override holiday error:', error);
      messageApi.error(error.response?.data?.message || 'Tạo lịch override thất bại');
    } finally {
      setCreatingOverride(false);
    }
  };

  /**
   * 🆕 Handler: Bulk toggle toàn bộ phòng (room + all subrooms)
   */
  const handleBulkToggleRoom = async (isActive) => {
    // REMOVED: Xóa handler này vì đã xóa section Bulk Toggle Room
  };

  // ✅ Validation: Ensure modal and message API are available
  if (!modal || !messageApi) {
    console.error('❌ App context not available');
    return null;
  }

  if (!scheduleListData || !scheduleListData.schedules || scheduleListData.schedules.length === 0) {
    return null;
  }

  // 🆕 Get ALL SHIFTS (gộp tất cả ca lại: inactive + generated + missing)
  const allShiftsMap = new Map(); // key: shiftKey, value: shift info with status
  
  scheduleListData.schedules.forEach(schedule => {
    if (schedule.shiftConfig) {
      ['morning', 'afternoon', 'evening'].forEach(shiftKey => {
        const shift = schedule.shiftConfig[shiftKey];
        
        if (shift && !allShiftsMap.has(shiftKey)) {
          allShiftsMap.set(shiftKey, {
            key: shiftKey,
            name: shift.name,
            color: SHIFT_COLORS[shiftKey],
            startTime: shift.startTime,
            endTime: shift.endTime,
            isActive: shift.isActive !== false, // Current active status
            isGenerated: shift.isGenerated === true // Has slots or not
          });
        }
      });
    }
  });
  
  const allShifts = Array.from(allShiftsMap.values())
    .sort((a, b) => {
      // Sắp xếp theo thứ tự: morning -> afternoon -> evening
      const order = { morning: 1, afternoon: 2, evening: 3 };
      return order[a.key] - order[b.key];
    });

  // 🆕 Get ALL SUBROOMS (gộp tất cả buồng: active + inactive)
  const allSubRooms = [];
  
  if (scheduleListData?.schedules) {
    scheduleListData.schedules.forEach(schedule => {
      // Filter theo tháng/năm VÀ có subRoom
      if (schedule.month === month && schedule.year === year && schedule.subRoom) {
        console.log(`🔍 Schedule ${schedule.scheduleId}:`, {
          subRoomName: schedule.subRoom.name,
          'schedule.isActiveSubRoom': schedule.isActiveSubRoom,
          'schedule.subRoom.isActiveSubRoom': schedule.subRoom.isActiveSubRoom,
          'schedule.subRoom.isActive': schedule.subRoom.isActive
        });
        
        allSubRooms.push({
          scheduleId: schedule.scheduleId,
          subRoomId: schedule.subRoom._id,
          subRoomName: schedule.subRoom.name,
          isActiveSubRoom: schedule.isActiveSubRoom !== false // ✅ Trạng thái buồng trong lịch
        });
      }
    });
  }
  
  console.log(`📊 Modal "Chỉnh sửa lịch" - Tháng ${month}/${year}:`, {
    totalSchedules: scheduleListData?.schedules?.length,
    allShifts: allShifts.length,
    allSubRooms: allSubRooms.length,
    allSubRoomsDetails: allSubRooms // 🆕 Debug: Xem chi tiết subrooms
  });
  
  // 🆕 Lấy startDate và endDate từ schedule đầu tiên (tất cả schedule cùng tháng có cùng range)
  // ⚠️ Convert từ UTC sang VN timezone (UTC+7)
  const firstSchedule = scheduleListData?.schedules?.[0];
  const scheduleStartDate = firstSchedule?.startDate 
    ? dayjs(firstSchedule.startDate).add(7, 'hour').startOf('day') 
    : null;
  const scheduleEndDate = firstSchedule?.endDate 
    ? dayjs(firstSchedule.endDate).add(7, 'hour').endOf('day') 
    : null;

  return (
    <Modal
      title="Tạo lịch làm việc trong ngày nghỉ"
      open={visible}
      onCancel={onCancel}
      onOk={showOverrideSection ? null : handleSubmit}
      okText="Cập nhật"
      cancelText={showOverrideSection ? "Đóng" : "Hủy"}
      confirmLoading={loading}
      width={1000}
      bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
      footer={showOverrideSection ? [
        <Button key="close" onClick={onCancel}>
          Đóng
        </Button>
      ] : null}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Schedule Info */}
        <Alert
          type="info"
          showIcon
          message={`Lịch tháng ${month}/${year}`}
          description={`${scheduleListData?.schedules?.filter(s => s.month === month && s.year === year).length || 0} lịch trong tháng này`}
        />
        
        {/* 🆕 Danh sách ngày nghỉ (từ holidaySnapshot.computedDaysOff) */}
        {(() => {
          // Lấy computedDaysOff từ schedule đầu tiên
          const firstSchedule = scheduleListData?.schedules?.[0];
          const computedDaysOff = firstSchedule?.holidaySnapshot?.computedDaysOff || [];
          
          if (computedDaysOff.length === 0) return null;
          
          // Sắp xếp theo ngày
          const sortedDates = [...computedDaysOff].sort((a, b) => 
            new Date(a.date) - new Date(b.date)
          );
          
          return (
            <div style={{ 
              border: '2px solid #ff4d4f',
              borderRadius: 8,
              padding: 12,
              background: '#fff2f0'
            }}>
              <div style={{ 
                marginBottom: 8, 
                fontWeight: 600, 
                color: '#cf1322',
                fontSize: 14
              }}>
                <StopOutlined /> Ngày nghỉ trong tháng ({computedDaysOff.length} ngày)
              </div>
              
              <div style={{ 
                maxHeight: 200, 
                overflowY: 'auto',
                fontSize: 12
              }}>
                {sortedDates.map((dayOff, idx) => {
                  const date = dayjs(dayOff.date);
                  
                  return (
                    <div 
                      key={idx}
                      style={{
                        marginBottom: 8,
                        padding: 8,
                        background: 'white',
                        borderRadius: 4,
                        border: '1px solid #ffccc7'
                      }}
                    >
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>
                        📅 {date.format('DD/MM/YYYY')} ({date.format('dddd')})
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        🏖️ {dayOff.reason || 'Ngày nghỉ'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
        
        {/* 🆕 Lịch sử Override Holiday */}
        {(() => {
          const firstSchedule = scheduleListData?.schedules?.[0];
          const overriddenHolidays = firstSchedule?.overriddenHolidays || [];
          
          if (overriddenHolidays.length === 0) return null;
          
          // Sắp xếp theo ngày
          const sortedOverrides = [...overriddenHolidays].sort((a, b) => 
            new Date(a.date) - new Date(b.date)
          );
          
          return (
            <div style={{ 
              border: '2px solid #52c41a',
              borderRadius: 8,
              padding: 12,
              background: '#f6ffed'
            }}>
              <div style={{ 
                marginBottom: 8, 
                fontWeight: 600, 
                color: '#52c41a',
                fontSize: 14
              }}>
                <CalendarOutlined /> Lịch nghỉ đã override ({overriddenHolidays.length} ngày)
              </div>
              
              <div style={{ 
                maxHeight: 200, 
                overflowY: 'auto',
                fontSize: 12
              }}>
                {sortedOverrides.map((override, idx) => {
                  const date = dayjs(override.date);
                  
                  return (
                    <div 
                      key={idx}
                      style={{
                        marginBottom: 8,
                        padding: 8,
                        background: 'white',
                        borderRadius: 4,
                        border: '1px solid #b7eb8f'
                      }}
                    >
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>
                        📅 {date.format('DD/MM/YYYY')} ({date.format('dddd')})
                      </div>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                        Ngày nghỉ gốc: {override.originalHolidayName}
                      </div>
                      <Space wrap>
                        {override.shifts.map((shift, sIdx) => {
                          const shiftNames = {
                            morning: 'Ca Sáng',
                            afternoon: 'Ca Chiều', 
                            evening: 'Ca Tối'
                          };
                          return (
                            <Tag 
                              key={sIdx} 
                              color="green"
                            >
                              {shiftNames[shift.shiftType]}
                            </Tag>
                          );
                        })}
                      </Space>
                      {override.note && (
                        <div style={{ fontSize: 11, color: '#999', marginTop: 4, fontStyle: 'italic' }}>
                          "{override.note}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* 🆕 FORM 1: Tạo lịch override trong ngày nghỉ */}
        <div>
          {/* Auto-show form by default - no toggle button needed */}
          {showOverrideSection && (
            <div style={{ 
              marginTop: 16, 
              padding: 16, 
              border: '2px dashed #faad14', 
              borderRadius: 8,
              background: '#fffbf0'
            }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Alert
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                  message="Quyền đặc biệt: Admin/Manager"
                  description="Tạo lịch làm việc trong ngày nghỉ (override). Chỉ có thể chọn ngày nghỉ chưa được tạo lịch."
                  style={{ fontSize: 12 }}
                />
                
                {/* 🆕 BƯỚC 1: Chọn phòng/buồng (nếu có subroom) - PHẢI CHỌN TRƯỚC */}
                {allSubRooms.length > 0 && (
                  <div style={{ 
                    padding: 12, 
                    backgroundColor: '#f0f5ff', 
                    border: '2px solid #1890ff',
                    borderRadius: 6
                  }}>
                    <div style={{ marginBottom: 8, fontWeight: 600, color: '#1890ff' }}>
                      Bước 1: Chọn phòng/buồng để tạo lịch
                    </div>
                    <Checkbox.Group
                      value={selectedSubRoomsForOverride}
                      onChange={setSelectedSubRoomsForOverride}
                      style={{ width: '100%' }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {allSubRooms.map(subRoom => {
                          const isInactive = subRoom.isActiveSubRoom === false;
                          
                          return (
                            <Checkbox 
                              key={`${subRoom.scheduleId}-${subRoom.subRoomId}`} 
                              value={subRoom.scheduleId}
                              disabled={isInactive}
                            >
                              <span style={{ opacity: isInactive ? 0.5 : 1 }}>
                                {subRoom.subRoomName}
                              </span>
                              {isInactive && (
                                <Tag color="red" style={{ marginLeft: 4, fontSize: 10 }}>
                                  Đang tắt
                                </Tag>
                              )}
                            </Checkbox>
                          );
                        })}
                      </Space>
                    </Checkbox.Group>
                    
                    {selectedSubRoomsForOverride.length > 0 && (
                      <Alert
                        type="success"
                        message={`✓ Đã chọn ${selectedSubRoomsForOverride.length} phòng/buồng`}
                        showIcon
                        style={{ marginTop: 8, fontSize: 11 }}
                      />
                    )}
                    
                    {selectedSubRoomsForOverride.length === 0 && (
                      <Alert
                        type="warning"
                        message="Chưa chọn phòng/buồng"
                        description="Vui lòng chọn ít nhất 1 phòng/buồng để xem ngày nghỉ có thể tạo lịch"
                        showIcon
                        style={{ marginTop: 8, fontSize: 11 }}
                      />
                    )}
                  </div>
                )}
                
                {/* 🆕 Cảnh báo khi tất cả buồng đều bị tắt */}
                {allSubRooms.length > 0 && allSubRooms.every(sr => sr.isActiveSubRoom === false) && (
                  <Alert
                    type="error"
                    message="Không có buồng nào đang hoạt động"
                    description="Tất cả buồng trong lịch này đều đã bị tắt. Vui lòng bật lại buồng trước khi tạo lịch ngày nghỉ."
                    showIcon
                    style={{ fontSize: 12 }}
                  />
                )}
                
                {/* BƯỚC 2: Chọn ngày nghỉ */}
                <div>
                  <div style={{ marginBottom: 4, fontWeight: 600, color: allSubRooms.length > 0 ? '#1890ff' : undefined }}>
                    {allSubRooms.length > 0 ? 'Bước 2: ' : ''}Chọn ngày nghỉ từ danh sách:
                    {validHolidayDates.length > 0 && (
                      <span style={{ fontSize: 11, color: '#1890ff', marginLeft: 4 }}>
                        ({validHolidayDates.length} ngày nghỉ chưa tạo lịch)
                      </span>
                    )}
                    {validHolidayDates.length === 0 && (
                      <span style={{ fontSize: 11, color: '#ff4d4f', marginLeft: 4 }}>
                        (Không còn ngày nghỉ chưa tạo lịch)
                      </span>
                    )}
                  </div>
                  <DatePicker
                    value={overrideDate}
                    onChange={(date) => {
                      console.log('📅 DatePicker onChange:', date ? date.format('YYYY-MM-DD') : 'null');
                      setOverrideDate(date);
                      // ✅ Không cần gọi API validate vì DatePicker đã filter chỉ cho phép chọn ngày hợp lệ
                      // Nhưng vẫn cần set holidayInfo để hiển thị thông tin
                      if (date) {
                        // Tạm thời set holidayInfo = true để enable nút submit
                        // Thông tin chi tiết sẽ hiển thị từ validHolidayDates list bên dưới
                        setHolidayInfo({ isValid: true });
                      } else {
                        setHolidayInfo(null);
                      }
                    }}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày nghỉ chưa tạo lịch"
                    style={{ width: '100%' }}
                    disabled={validHolidayDates.length === 0}
                    disabledDate={(current) => {
                      if (!current) return false;
                      
                      try {
                        // Disable past dates
                        if (current < dayjs().startOf('day')) return true;
                        
                        // ✅ Chỉ cho phép chọn ngày có trong validHolidayDates
                        if (validHolidayDates.length > 0) {
                          const dateStr = current.format('YYYY-MM-DD');
                          return !validHolidayDates.includes(dateStr);
                        }
                        
                        return false;
                      } catch (error) {
                        console.error('❌ Error in disabledDate:', error);
                        return false;
                      }
                    }}
                  />
                </div>
                
                {/* Hiển thị ngày đã chọn */}
                {overrideDate && (
                  <Alert
                    type="success"
                    showIcon
                    message={`Đã chọn: ${overrideDate.format('DD/MM/YYYY')}`}
                    description="Ngày này nằm trong danh sách ngày nghỉ hợp lệ. Vui lòng chọn ca và phòng/buồng bên dưới."
                    style={{ fontSize: 12 }}
                  />
                )}
                
                {/* Show valid dates list */}
                {validHolidayDates.length > 0 && !overrideDate && (
                  <Alert
                    type="info"
                    message="Ngày nghỉ chưa tạo lịch (có thể chọn)"
                    description={
                      <div style={{ maxHeight: 100, overflowY: 'auto' }}>
                        {validHolidayDates.map((dateStr, idx) => (
                          <Tag key={idx} color="blue" style={{ marginBottom: 4 }}>
                            {dayjs(dateStr).format('DD/MM/YYYY')}
                          </Tag>
                        ))}
                      </div>
                    }
                    style={{ fontSize: 11 }}
                  />
                )}
                
                {/* Alert khi không còn ngày nghỉ nào */}
                {validHolidayDates.length === 0 && showOverrideSection && (
                  <Alert
                    type="warning"
                    message="Không còn ngày nghỉ chưa tạo lịch"
                    description="Tất cả ngày nghỉ trong tháng này đã được tạo lịch override hoặc chưa có ngày nghỉ nào được cấu hình."
                    showIcon
                    style={{ fontSize: 11 }}
                  />
                )}
                
                {/* Chọn ca làm việc */}
                {holidayInfo && (
                  <>
                    <div>
                      <div style={{ marginBottom: 4, fontWeight: 600, color: allSubRooms.length > 0 ? '#1890ff' : undefined }}>
                        {allSubRooms.length > 0 ? 'Bước 3: ' : ''}Chọn ca làm việc:
                        {checkingShifts && <Spin size="small" style={{ marginLeft: 8 }} />}
                      </div>
                      
                      {/* Show loading state */}
                      {checkingShifts && (
                        <Alert
                          type="info"
                          message="Đang kiểm tra ca nào đã tạo..."
                          showIcon
                          style={{ fontSize: 11, marginBottom: 8 }}
                        />
                      )}
                      
                      {/* Show shifts status */}
                      {!checkingShifts && availableShiftsInfo && (
                        <div style={{ marginBottom: 12 }}>
                          {availableShiftsInfo.overriddenShifts && availableShiftsInfo.overriddenShifts.length > 0 && (
                            <Alert
                              type="warning"
                              message="Một số ca đã được tạo"
                              description={
                                <div>
                                  {availableShiftsInfo.overriddenShifts.map(shift => (
                                    <div key={shift.shiftKey} style={{ marginBottom: 4 }}>
                                      <Tag color="orange">{shift.name}</Tag>
                                      <span style={{ fontSize: 11 }}>
                                        Đã tạo cho {shift.overriddenFor.length} phòng/buồng
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              }
                              showIcon
                              style={{ fontSize: 11, marginBottom: 8 }}
                            />
                          )}
                          {availableShiftsInfo.availableShifts && availableShiftsInfo.availableShifts.length > 0 && (
                            <Alert
                              type="success"
                              message={`Có ${availableShiftsInfo.availableShifts.length} ca có thể tạo`}
                              showIcon
                              style={{ fontSize: 11, marginBottom: 8 }}
                            />
                          )}
                        </div>
                      )}
                      
                      <Checkbox.Group
                        value={overrideShifts}
                        onChange={setOverrideShifts}
                        style={{ width: '100%' }}
                      >
                        <Space direction="vertical">
                          {allShifts.map(shift => {
                            // Check if this shift is overridden in ANY of the selected schedules
                            const overriddenInfo = availableShiftsInfo?.overriddenShifts?.find(
                              os => os.shiftKey === shift.key
                            );
                            
                            // If partially overridden (some schedules have it, some don't)
                            const isPartiallyOverridden = overriddenInfo && overriddenInfo.overriddenFor?.length > 0;
                            
                            // Check if ALL selected schedules have this shift overridden
                            // 🔧 FIX: For room with subrooms, use actual selected count (don't fallback to 1)
                            const hasSubRooms = allSubRooms.length > 0;
                            const selectedCount = hasSubRooms 
                              ? selectedSubRoomsForOverride.length 
                              : 1; // Room without subrooms always count as 1
                            
                            const overriddenCount = overriddenInfo?.overriddenFor?.length || 0;
                            
                            // Only calculate isFullyOverridden if we have valid data
                            const isFullyOverridden = selectedCount > 0 && overriddenCount === selectedCount;
                            
                            // Check if this shift is available in at least one schedule
                            const isAvailable = availableShiftsInfo?.availableShifts?.some(
                              as => as.shiftKey === shift.key
                            );
                            
                            // Ca bị tắt (isActive = false)
                            const isDisabled = !shift.isActive;
                            
                            // Disable if fully overridden (all schedules) or if disabled in config
                            const shouldDisable = isFullyOverridden || isDisabled;
                            
                            console.log(`🔍 Shift ${shift.name} (${shift.key}):`, {
                              hasSubRooms,
                              selectedSubRoomsCount: selectedSubRoomsForOverride.length,
                              isPartiallyOverridden,
                              isFullyOverridden,
                              isAvailable,
                              isDisabled,
                              shouldDisable,
                              overriddenCount,
                              selectedCount,
                              overriddenInfo,
                              availableShiftsInfo
                            });
                            
                            return (
                              <Checkbox 
                                key={shift.key} 
                                value={shift.key}
                                disabled={shouldDisable}
                              >
                                <Tag color={shouldDisable ? 'default' : shift.color}>
                                  {shift.name}
                                </Tag>
                                <span style={{ fontSize: 12 }}>{shift.startTime} - {shift.endTime}</span>
                                {isFullyOverridden && (
                                  <Tag color="orange" style={{ marginLeft: 4, fontSize: 10 }}>
                                    Đã tạo (tất cả)
                                  </Tag>
                                )}
                                {isPartiallyOverridden && !isFullyOverridden && (
                                  <Tag color="blue" style={{ marginLeft: 4, fontSize: 10 }}>
                                    Đã tạo ({overriddenCount}/{selectedCount})
                                  </Tag>
                                )}
                                {isDisabled && (
                                  <Tag color="red" style={{ marginLeft: 4, fontSize: 10 }}>
                                    Đang tắt
                                  </Tag>
                                )}
                              </Checkbox>
                            );
                          })}
                        </Space>
                      </Checkbox.Group>
                    </div>
                    
                    {/* 🆕 Thông báo phòng không có buồng */}
                    {allSubRooms.length === 0 && (
                      <Alert
                        type="info"
                        message="Phòng chính (không có buồng phụ)"
                        description="Lịch sẽ được tạo cho phòng chính. Không cần chọn buồng."
                        showIcon
                        style={{ fontSize: 12 }}
                      />
                    )}
                    
                    {/* Ghi chú */}
                    {/* <div>
                      <div style={{ marginBottom: 4, fontWeight: 500 }}>Ghi chú:</div>
                      <Input.TextArea
                        value={overrideNote}
                        onChange={(e) => setOverrideNote(e.target.value)}
                        placeholder="Lý do tạo lịch override (VD: Khám khẩn cấp, Yêu cầu đặc biệt...)"
                        rows={2}
                      />
                    </div> */}
                    
                    {/* Nút tạo override */}
                    <Button
                      type="primary"
                      danger
                      loading={creatingOverride}
                      onClick={handleOverrideHoliday}
                      disabled={
                        !overrideDate || 
                        !holidayInfo || 
                        overrideShifts.length === 0 || 
                        (allSubRooms.length > 0 && (
                          // Có subroom: phải chọn ít nhất 1 buồng VÀ có ít nhất 1 buồng active
                          selectedSubRoomsForOverride.length === 0 || 
                          allSubRooms.every(sr => sr.isActiveSubRoom === false)
                        ))
                      }
                      block
                    >
                      {creatingOverride 
                        ? 'Đang tạo...' 
                        : allSubRooms.length > 0
                          ? `Tạo lịch Override (${selectedSubRoomsForOverride.length} phòng/buồng)`
                          : 'Tạo lịch Override (Phòng chính)'}
                    </Button>
                  </>
                )}
              </Space>
            </div>
          )}
        </div>
      </Space>
    </Modal>
  );
};

export default EditScheduleModal;

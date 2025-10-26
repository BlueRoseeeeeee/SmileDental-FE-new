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
      
      // Reset override holiday states
      setShowOverrideSection(false);
      setOverrideDate(null);
      setOverrideShifts([]);
      setOverrideNote('');
      setHolidayInfo(null);
      setValidHolidayDates([]);
      setSelectedSubRoomsForOverride([]);
      setCheckingHoliday(false); // ✅ Reset checking state
      setAvailableShiftsInfo(null); // ✅ Reset shifts info
      setCheckingShifts(false); // ✅ Reset checking shifts state
      
      // Reset toggle schedule states
      setShowToggleSection(false);
      setFilterDates([]);
    }
  }, [visible, scheduleListData]);

  // 🆕 Check available shifts when date and subrooms are selected
  useEffect(() => {
    const checkAvailableShifts = async () => {
      // Only check if we have date and at least one schedule selected
      if (!overrideDate || !roomId || !month || !year) {
        setAvailableShiftsInfo(null);
        return;
      }

      // Determine which schedules to check
      let scheduleIdsToCheck = [];
      
      const allSubRooms = scheduleListData?.subRooms || [];
      
      if (allSubRooms.length > 0) {
        // Room has subrooms - use selected subrooms
        if (selectedSubRoomsForOverride.length === 0) {
          // No subrooms selected yet
          setAvailableShiftsInfo(null);
          return;
        }
        scheduleIdsToCheck = selectedSubRoomsForOverride;
      } else {
        // Room without subrooms - use main schedule
        const mainSchedule = scheduleListData?.schedules?.find(s => 
          s.month === month && s.year === year && !s.subRoom
        );
        if (!mainSchedule) {
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
      
      // 🆕 Loop through selected schedules
      let successCount = 0;
      let totalSlotsCreated = 0;
      const totalSchedules = scheduleIdsToProcess.length;
      
      for (const scheduleId of scheduleIdsToProcess) {
        // Find the schedule from scheduleListData
        const schedule = scheduleListData.schedules.find(s => s.scheduleId === scheduleId); // ✅ Dùng scheduleId
        if (!schedule) {
          console.warn(`⚠️ Schedule not found: ${scheduleId}`);
          continue;
        }
        
        const subRoomId = schedule?.subRoom?._id;
        
        const payload = {
          roomId: roomId,
          subRoomId: subRoomId || null,
          month: month,
          year: year,
          date: overrideDate.format('YYYY-MM-DD'),
          shifts: overrideShifts,
          note: overrideNote || `Lịch override ngày nghỉ tháng ${month}/${year}`
        };
        
        console.log(`📤 Creating override holiday for schedule ${scheduleId}:`, payload);
        
        try {
          const result = await scheduleConfigService.createScheduleOverrideHoliday(payload);
          
          if (result.success) {
            successCount++;
            totalSlotsCreated += result.slotsCreated || 0;
          }
        } catch (error) {
          console.error(`❌ Error creating override for schedule ${scheduleId}:`, error);
        }
      }
      
      if (successCount > 0) {
        messageApi.success(
          `Đã tạo lịch override cho ${successCount}/${totalSchedules} ${allSubRooms.length > 0 ? 'phòng/buồng' : 'phòng'}. Tổng ${totalSlotsCreated} slots`
        );
        
        // Reset override section
        setShowOverrideSection(false);
        setOverrideDate(null);
        setOverrideShifts([]);
        setOverrideNote('');
        setHolidayInfo(null);
        setSelectedSubRoomsForOverride([]);
        
        // Callback to refresh data
        if (onSuccess) {
          onSuccess();
        }
      } else {
        messageApi.warning('Không có schedule nào được tạo thành công');
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
      title="Chỉnh sửa lịch làm việc"
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
        
        {/* 🆕 Kích hoạt lại ca/buồng bị tắt */}
        {(() => {
          // Lấy danh sách ca bị tắt (isActive = false)
          const inactiveShifts = allShifts.filter(shift => shift.isActive === false);
          
          // Lấy danh sách buồng bị tắt (isActiveSubRoom = false)
          const inactiveSubRooms = allSubRooms ? allSubRooms.filter(sr => 
            sr.isActiveSubRoom === false
          ) : [];
          
          // Nếu không có ca hoặc buồng nào bị tắt, không hiển thị section này
          if (inactiveShifts.length === 0 && inactiveSubRooms.length === 0) {
            return null;
          }
          
          return (
            <div style={{ 
              border: '2px dashed #faad14',
              borderRadius: 8,
              padding: 12,
              background: '#fffbf0'
            }}>
              <div style={{ 
                marginBottom: 8, 
                fontWeight: 600, 
                color: '#fa8c16',
                fontSize: 14
              }}>
                <WarningOutlined /> Kích hoạt lại ca/buồng bị tắt
              </div>
              
              <Alert
                type="warning"
                showIcon
                message="Ca/buồng bị tắt trong cấu hình"
                description="Những ca/buồng sau đây đã bị tắt trong cấu hình lịch. Bạn có thể kích hoạt lại để cho phép tạo slots."
                style={{ marginBottom: 12, fontSize: 11 }}
              />
              
              {/* Danh sách ca bị tắt */}
              {inactiveShifts.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 12 }}>
                    Ca làm việc bị tắt:
                  </div>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {inactiveShifts.map(shift => {
                      const isChecked = reactivateShifts.includes(shift.key);
                      
                      return (
                        <div 
                          key={shift.key}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            padding: 8,
                            border: '1px solid #ffd591',
                            borderRadius: 4,
                            background: 'white'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Tag color={shift.color}>{shift.name}</Tag>
                            <span style={{ fontSize: 11, color: '#666' }}>
                              {shift.startTime} - {shift.endTime}
                            </span>
                            <Tag color="red" icon={<StopOutlined />}>Đã tắt</Tag>
                          </div>
                          <Checkbox
                            checked={isChecked}
                            onChange={(e) => handleShiftCheckboxChange(shift.key, e.target.checked)}
                          >
                            Kích hoạt lại
                          </Checkbox>
                        </div>
                      );
                    })}
                  </Space>
                </div>
              )}
              
              {/* Danh sách buồng bị tắt */}
              {inactiveSubRooms.length > 0 && (
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 12 }}>
                    Buồng bị tắt:
                  </div>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {inactiveSubRooms.map(subRoom => {
                      const isChecked = reactivateSubRooms.some(item => 
                        item.scheduleId === subRoom.scheduleId && item.subRoomId === subRoom.subRoomId
                      );
                      
                      return (
                        <div 
                          key={`${subRoom.scheduleId}-${subRoom.subRoomId}`}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            padding: 8,
                            border: '1px solid #ffd591',
                            borderRadius: 4,
                            background: 'white'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 500 }}>{subRoom.subRoomName}</span>
                            <Tag color="red" icon={<StopOutlined />}>Đã tắt</Tag>
                          </div>
                          <Checkbox
                            checked={isChecked}
                            onChange={(e) => handleSubRoomCheckboxChange(
                              subRoom.scheduleId, 
                              subRoom.subRoomId, 
                              subRoom.subRoomName, 
                              e.target.checked
                            )}
                          >
                            Kích hoạt lại
                          </Checkbox>
                        </div>
                      );
                    })}
                  </Space>
                </div>
              )}
              
              {(reactivateShifts.length > 0 || reactivateSubRooms.length > 0) && (
                <Alert
                  type="success"
                  showIcon
                  message={`Sẽ kích hoạt lại: ${reactivateShifts.length} ca, ${reactivateSubRooms.length} buồng`}
                  style={{ marginTop: 12, fontSize: 11 }}
                />
              )}
            </div>
          );
        })()}

        {/* 🆕 FORM 2: Bật/Tắt lịch làm việc (theo ca, theo buồng, theo ngày) */}
        <div>
          <Button
            type="default"
            onClick={() => {
              setShowToggleSection(!showToggleSection);
              if (!showToggleSection) {
                // Reset states khi mở form
                setFilterDates([]);
                setDeactivateShifts([]);
                setToggleSubRooms([]);
              }
            }}
            block
            style={{
              borderColor: '#1890ff',
              color: '#1890ff'
            }}
          >
            {showToggleSection ? 'Ẩn' : 'Bật/Tắt lịch làm việc'}
          </Button>
          
          {showToggleSection && (
            <div style={{ 
              marginTop: 16, 
              padding: 16, 
              border: '2px dashed #1890ff', 
              borderRadius: 8,
              background: '#f0f5ff'
            }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Alert
                  type="info"
                  showIcon
                  message="Bật/Tắt lịch làm việc"
                  description="Chọn khoảng ngày, chọn ca và buồng cần bật/tắt. Thay đổi sẽ được áp dụng khi nhấn nút 'Lưu thay đổi' ở cuối."
                  style={{ fontSize: 12 }}
                />

        {/* 🆕 Bật/Tắt ca làm việc - Gộp TẤT CẢ CA (inactive + generated + missing) */}
        {allShifts.length > 0 && (
          <div>
            <div style={{ marginBottom: 8 }}>
              <strong>Bật/Tắt ca làm việc:</strong>
            </div>
            
            {/* 🆕 Date filter - BẮT BUỘC chọn ngày */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#ff4d4f', fontWeight: 500 }}>
                * Bắt buộc chọn khoảng ngày cần áp dụng:
                {scheduleStartDate && scheduleEndDate && (
                  <span style={{ color: '#666', fontWeight: 400, marginLeft: 8 }}>
                    (Từ {scheduleStartDate.format('DD/MM/YYYY')} đến {scheduleEndDate.format('DD/MM/YYYY')})
                  </span>
                )}
              </div>
              <DatePicker.RangePicker
                value={filterDates.length > 0 ? [filterDates[0], filterDates[filterDates.length - 1]] : null}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    // Generate all dates between start and end
                    const allDates = [];
                    let current = dayjs(dates[0]);
                    const end = dayjs(dates[1]);
                    
                    while (current.isBefore(end, 'day') || current.isSame(end, 'day')) {
                      allDates.push(current);
                      current = current.add(1, 'day');
                    }
                    
                    setFilterDates(allDates);
                    // Reset deactivate shifts khi thay đổi date range
                    setDeactivateShifts([]);
                  } else {
                    setFilterDates([]);
                    setDeactivateShifts([]);
                  }
                }}
                disabledDate={(current) => {
                  if (!current) return false;
                  
                  // Disable nếu ngoài phạm vi startDate - endDate của schedule
                  if (scheduleStartDate && current.isBefore(scheduleStartDate, 'day')) {
                    return true;
                  }
                  if (scheduleEndDate && current.isAfter(scheduleEndDate, 'day')) {
                    return true;
                  }
                  
                  return false;
                }}
                format="DD/MM/YYYY"
                placeholder={['Từ ngày', 'Đến ngày']}
                style={{ width: '100%' }}
              />
              {filterDates.length > 0 ? (
                <div style={{ marginTop: 4, fontSize: 11, color: '#52c41a' }}>
                  ✓ Áp dụng cho {filterDates.length} ngày (từ {filterDates[0].format('DD/MM')} đến {filterDates[filterDates.length - 1].format('DD/MM')})
                </div>
              ) : (
                <Alert
                  type="warning"
                  showIcon
                  message="Vui lòng chọn khoảng ngày trước khi tắt/bật ca"
                  style={{ marginTop: 4, fontSize: 11 }}
                />
              )}
            </div>
            
            <Alert
              type="info"
              showIcon
              message="Lưu ý"
              description="Tắt ca sẽ ẩn tất cả slots của ca đó khỏi hệ thống đặt lịch (hoặc không cho phép tạo nếu chưa có slots). Bật lại ca sẽ hiển thị lại các slots."
              style={{ marginBottom: 8, fontSize: 12 }}
            />
            <Space direction="vertical" style={{ width: '100%' }}>
              {/* 🔥 Hiển thị TẤT CẢ CA (inactive + generated + missing) */}
              {allShifts.map(shift => {
                // Check if this shift has been toggled
                const toggledShift = deactivateShifts.find(item => item.shiftKey === shift.key);
                // Ưu tiên dùng toggled state, nếu không thì dùng shift.isActive
                const currentIsActive = toggledShift ? toggledShift.isActive : shift.isActive;
                
                return (
                  <div 
                    key={shift.key} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      width: '100%', 
                      padding: '12px', 
                      border: '1px solid #d9d9d9', 
                      borderRadius: '4px',
                      backgroundColor: shift.isGenerated ? '#fff' : '#fffbf0',
                      opacity: filterDates.length === 0 ? 0.5 : 1
                    }}
                  >
                    <Space size="middle">
                      <Tag color={shift.color} style={{ fontSize: '13px', padding: '2px 8px' }}>
                        {shift.name}
                      </Tag>
                      <span style={{ color: '#595959', fontSize: '13px' }}>
                        {shift.startTime} - {shift.endTime}
                      </span>
                      <Tag color={shift.isGenerated ? 'blue' : 'orange'}>
                        {shift.isGenerated ? 'Đã tạo slots' : 'Chưa tạo slots'}
                      </Tag>
                      <Tag color={currentIsActive ? 'green' : 'red'}>
                        {currentIsActive ? 'Đang bật' : 'Đang tắt'}
                      </Tag>
                    </Space>
                    <Switch
                      checked={currentIsActive}
                      onChange={() => {
                        if (filterDates.length === 0) {
                          messageApi.warning('Vui lòng chọn khoảng ngày trước');
                          return;
                        }
                        handleShiftToggle(shift.key, currentIsActive);
                      }}
                      disabled={filterDates.length === 0}
                      checkedChildren="Bật"
                      unCheckedChildren="Tắt"
                    />
                  </div>
                );
              })}
            </Space>
            {deactivateShifts.length > 0 && (
              <Alert
                type="warning"
                showIcon
                message={`Sẽ cập nhật ${deactivateShifts.length} ca`}
                description={deactivateShifts.map(item => {
                  // Tìm shift từ allShifts
                  const shift = allShifts.find(s => s.key === item.shiftKey);
                  return `${shift?.name}: ${item.isActive ? 'Bật' : 'Tắt'}`;
                }).join(', ')}
                style={{ marginTop: 8, fontSize: 11 }}
              />
            )}
          </div>
        )}
        
        {/* 🆕 Bật/Tắt buồng - Gộp TẤT CẢ BUỒNG (active + inactive) */}
        {allSubRooms.length > 0 && (
          <div>
            <div style={{ marginBottom: 8 }}>
              <strong>Bật/Tắt buồng:</strong>
            </div>
            
            {/* Alert yêu cầu chọn ngày */}
            {filterDates.length === 0 && (
              <Alert
                type="warning"
                showIcon
                message="Vui lòng chọn khoảng ngày ở phần 'Bật/Tắt ca làm việc' trước"
                style={{ marginBottom: 8, fontSize: 11 }}
              />
            )}
            
            <Alert
              type="info"
              showIcon
              message="Lưu ý"
              description="Tắt buồng sẽ ẩn tất cả slots của buồng đó khỏi hệ thống đặt lịch. Bật lại buồng sẽ hiển thị lại các slots."
              style={{ marginBottom: 8, fontSize: 12 }}
            />
            <Space direction="vertical" style={{ width: '100%' }}>
              {/* 🔥 Hiển thị TẤT CẢ BUỒNG (active + inactive) */}
              {allSubRooms.map(subRoom => {
                // Check if this subroom has been toggled
                const toggledSubRoom = toggleSubRooms.find(item => 
                  item.scheduleId === subRoom.scheduleId && item.subRoomId === subRoom.subRoomId
                );
                // Ưu tiên dùng toggled state, nếu không thì dùng subRoom.isActiveSubRoom
                const currentIsActive = toggledSubRoom ? toggledSubRoom.isActive : subRoom.isActiveSubRoom;
                
                return (
                  <div 
                    key={`${subRoom.scheduleId}-${subRoom.subRoomId}`} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      width: '100%', 
                      padding: '12px', 
                      border: '1px solid #d9d9d9', 
                      borderRadius: '4px',
                      opacity: filterDates.length === 0 ? 0.5 : 1
                    }}
                  >
                    <Space size="middle">
                      <Tag color="cyan" style={{ fontSize: '13px', padding: '2px 8px' }}>
                        {subRoom.subRoomName}
                      </Tag>
                      <Tag color={currentIsActive ? 'green' : 'red'}>
                        {currentIsActive ? 'Đang bật' : 'Đang tắt'}
                      </Tag>
                    </Space>
                    <Switch
                      checked={currentIsActive}
                      onChange={() => {
                        if (filterDates.length === 0) {
                          messageApi.warning('Vui lòng chọn khoảng ngày ở phần "Bật/Tắt ca làm việc" trước');
                          return;
                        }
                        handleSubRoomToggle(subRoom.scheduleId, subRoom.subRoomId, currentIsActive);
                      }}
                      disabled={filterDates.length === 0}
                      checkedChildren="Bật"
                      unCheckedChildren="Tắt"
                    />
                  </div>
                );
              })}
            </Space>
            {toggleSubRooms.length > 0 && (
              <Alert
                type="warning"
                showIcon
                message={`Sẽ cập nhật ${toggleSubRooms.length} buồng`}
                description={toggleSubRooms.map(item => {
                  // Tìm subRoom từ allSubRooms
                  const subRoom = allSubRooms.find(sr => 
                    sr.scheduleId === item.scheduleId && sr.subRoomId === item.subRoomId
                  );
                  return `${subRoom?.subRoomName}: ${item.isActive ? 'Bật' : 'Tắt'}`;
                }).join(', ')}
                style={{ marginTop: 8, fontSize: 11 }}
              />
            )}
          </div>
        )}
              </Space>
            </div>
          )}
        </div>
        
        {/* 🆕 FORM 1: Tạo lịch override trong ngày nghỉ */}
        <div>
          <Button
            type="dashed"
            icon={<CalendarOutlined />}
            onClick={async () => {
              const willShow = !showOverrideSection;
              setShowOverrideSection(willShow);
              
              // Load valid holiday dates when opening section
              if (willShow) {
                try {
                  const firstSchedule = scheduleListData?.schedules?.[0];
                  
                  if (!firstSchedule || !firstSchedule.holidaySnapshot) {
                    setValidHolidayDates([]);
                    return;
                  }
                  
                  // ✅ Sử dụng computedDaysOff (đã tính sẵn từ BE)
                  const { computedDaysOff = [] } = firstSchedule.holidaySnapshot;
                  const overriddenHolidays = firstSchedule.overriddenHolidays || [];
                  
                  // Lấy danh sách ngày đã được override (đã tạo lịch)
                  const overriddenDates = overriddenHolidays.map(oh => 
                    dayjs(oh.date).format('YYYY-MM-DD')
                  );
                  
                  // Lọc ngày nghỉ chưa được override
                  const validDates = computedDaysOff
                    .map(dayOff => dayOff.date) // Extract date string
                    .filter(dateStr => !overriddenDates.includes(dateStr)) // Loại bỏ ngày đã override
                    .sort(); // Sắp xếp theo thứ tự tăng dần
                  
                  console.log('📅 Valid holiday dates (chưa override):', validDates);
                  console.log('� Overridden dates (đã tạo lịch):', overriddenDates);
                  setValidHolidayDates(validDates);
                  
                } catch (error) {
                  console.error('Error loading valid holiday dates:', error);
                  setValidHolidayDates([]);
                }
              }
            }}
            block
            style={{
              borderColor: '#faad14',
              color: '#fa8c16'
            }}
          >
            {showOverrideSection ? 'Ẩn' : 'Tạo lịch làm việc trong ngày nghỉ (Override)'}
          </Button>
          
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
                
                {/* Chọn ngày nghỉ */}
                <div>
                  <div style={{ marginBottom: 4, fontWeight: 500 }}>
                    Chọn ngày nghỉ từ danh sách:
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
                      <div style={{ marginBottom: 4, fontWeight: 500 }}>
                        Chọn ca làm việc:
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
                          {allShifts.filter(s => s.isActive).map(shift => {
                            // Check if this shift is overridden
                            const isOverridden = availableShiftsInfo?.overriddenShifts?.some(
                              os => os.shiftKey === shift.key
                            );
                            
                            // Check if this shift is available
                            const isAvailable = availableShiftsInfo?.availableShifts?.some(
                              as => as.shiftKey === shift.key
                            );
                            
                            return (
                              <Checkbox 
                                key={shift.key} 
                                value={shift.key}
                                disabled={isOverridden || (!isAvailable && availableShiftsInfo !== null)}
                              >
                                <Tag color={isOverridden ? 'default' : shift.color}>
                                  {shift.name}
                                </Tag>
                                <span style={{ fontSize: 12 }}>{shift.startTime} - {shift.endTime}</span>
                                {isOverridden && (
                                  <Tag color="orange" style={{ marginLeft: 4, fontSize: 10 }}>
                                    Đã tạo
                                  </Tag>
                                )}
                              </Checkbox>
                            );
                          })}
                        </Space>
                      </Checkbox.Group>
                    </div>
                    
                    {/* 🆕 Chọn subrooms để tạo override - CHỈ hiển thị nếu có subroom */}
                    {allSubRooms.length > 0 && (
                      <div style={{ 
                        padding: 12, 
                        backgroundColor: '#f0f5ff', 
                        border: '1px solid #adc6ff',
                        borderRadius: 6
                      }}>
                        <div style={{ marginBottom: 8, fontWeight: 500 }}>
                          Chọn phòng/buồng để tạo lịch:
                        </div>
                        <Checkbox.Group
                          value={selectedSubRoomsForOverride}
                          onChange={setSelectedSubRoomsForOverride}
                          style={{ width: '100%' }}
                        >
                          <Space direction="vertical" style={{ width: '100%' }}>
                            {/* Chỉ hiển thị subrooms - dùng allSubRooms như phần Bật/Tắt buồng */}
                            {allSubRooms.map(subRoom => (
                              <Checkbox 
                                key={`${subRoom.scheduleId}-${subRoom.subRoomId}`} 
                                value={subRoom.scheduleId}
                              >
                                {subRoom.subRoomName}
                              </Checkbox>
                            ))}
                          </Space>
                        </Checkbox.Group>
                        
                        {selectedSubRoomsForOverride.length > 0 && (
                          <Alert
                            type="info"
                            message={`Đã chọn ${selectedSubRoomsForOverride.length} phòng/buồng`}
                            showIcon
                            style={{ marginTop: 8, fontSize: 11 }}
                          />
                        )}
                      </div>
                    )}
                    
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
                    <div>
                      <div style={{ marginBottom: 4, fontWeight: 500 }}>Ghi chú:</div>
                      <Input.TextArea
                        value={overrideNote}
                        onChange={(e) => setOverrideNote(e.target.value)}
                        placeholder="Lý do tạo lịch override (VD: Khám khẩn cấp, Yêu cầu đặc biệt...)"
                        rows={2}
                      />
                    </div>
                    
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
                        (allSubRooms.length > 0 && selectedSubRoomsForOverride.length === 0) // Chỉ check nếu có subroom
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

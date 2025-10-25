import React, { useState, useEffect } from 'react';
import { Modal, Switch, Checkbox, Space, Tag, Alert, message, Spin, Button, DatePicker, Input, App } from 'antd';
import { WarningOutlined, CalendarOutlined, StopOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { updateSchedule } from '../../services/scheduleService';
import scheduleConfigService from '../../services/scheduleConfigService';
import dayjs from 'dayjs';

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
  // 🆕 Use modal hooks from App context
  const { modal } = App.useApp();
  
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
  const [validHolidayDates, setValidHolidayDates] = useState([]); // 🆕 Danh sách ngày nghỉ hợp lệ
  const [checkingHoliday, setCheckingHoliday] = useState(false);
  const [creatingOverride, setCreatingOverride] = useState(false);
  
  // 🆕 Bulk Disable states - REMOVED (không cần section riêng)
  // Thay vào đó, thêm date filter vào các section hiện có
  const [filterDates, setFilterDates] = useState([]); // Array of dayjs dates để filter khi toggle

  // Initialize state when modal opens
  useEffect(() => {
    if (visible && scheduleListData) {
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
      
      // Reset filter dates
      setFilterDates([]);
    }
  }, [visible, scheduleListData]);

  const handleSubmit = async () => {
    if (!scheduleListData || !scheduleListData.schedules || scheduleListData.schedules.length === 0) {
      message.error('Không tìm thấy thông tin lịch');
      return;
    }
    
    // 🆕 Validation: Bắt buộc chọn ngày nếu có toggle shifts hoặc subrooms
    if ((deactivateShifts.length > 0 || toggleSubRooms.length > 0) && filterDates.length === 0) {
      message.error('Vui lòng chọn khoảng ngày trước khi tắt/bật ca hoặc buồng');
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

      message.success('Cập nhật lịch thành công');
      
      // Callback to parent
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onCancel();

    } catch (error) {
      console.error('❌ Error updating schedule:', error);
      message.error(error.response?.data?.message || error.message || 'Không thể cập nhật lịch');
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
    if (!date || !roomId || !month || !year) return;
    
    setCheckingHoliday(true);
    try {
      const dateStr = dayjs(date).format('YYYY-MM-DD');
      const firstSchedule = scheduleListData?.schedules?.[0];
      const subRoomId = firstSchedule?.subRoom?._id;
      
      // Call new API to validate from schedule's holidaySnapshot
      const result = await scheduleConfigService.validateHolidayFromSchedule({
        roomId,
        subRoomId: subRoomId || null,
        month,
        year,
        date: dateStr
      });
      
      if (result.success && result.isHoliday) {
        setHolidayInfo(result.holidayInfo);
        setValidHolidayDates(result.validDates || []); // Store all valid dates
      } else {
        setHolidayInfo(null);
        setValidHolidayDates([]);
        message.warning('Ngày này không có trong danh sách ngày nghỉ của lịch phòng');
      }
    } catch (error) {
      console.error('Error checking holiday:', error);
      setHolidayInfo(null);
      setValidHolidayDates([]);
      message.error('Lỗi kiểm tra ngày nghỉ: ' + (error.response?.data?.message || error.message));
    } finally {
      setCheckingHoliday(false);
    }
  };
  
  // 🆕 Handle override holiday submit
  const handleOverrideHoliday = async () => {
    if (!overrideDate) {
      message.error('Vui lòng chọn ngày nghỉ');
      return;
    }
    
    if (!holidayInfo) {
      message.error('Ngày được chọn không phải ngày nghỉ');
      return;
    }
    
    if (overrideShifts.length === 0) {
      message.error('Vui lòng chọn ít nhất một ca');
      return;
    }
    
    if (!roomId) {
      message.error('Không tìm thấy thông tin phòng');
      return;
    }
    
    try {
      setCreatingOverride(true);
      
      // Get room info from first schedule
      const firstSchedule = scheduleListData?.schedules?.[0];
      const subRoomId = firstSchedule?.subRoom?._id;
      
      const payload = {
        roomId: roomId,
        subRoomId: subRoomId || null,
        month: month,
        year: year,
        date: overrideDate.format('YYYY-MM-DD'),
        shifts: overrideShifts, // ['morning', 'afternoon', 'evening']
        note: overrideNote || `Lịch override ngày nghỉ tháng ${month}/${year}`
      };
      
      console.log('📤 Creating override holiday:', payload);
      
      const result = await scheduleConfigService.createScheduleOverrideHoliday(payload);
      
      if (result.success) {
        message.success(`Đã tạo lịch override thành công: ${result.slotsCreated} slots`);
        
        // Reset override section
        setShowOverrideSection(false);
        setOverrideDate(null);
        setOverrideShifts([]);
        setOverrideNote('');
        setHolidayInfo(null);
        
        // Callback to refresh data
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Override holiday error:', error);
      message.error(error.response?.data?.message || 'Tạo lịch override thất bại');
    } finally {
      setCreatingOverride(false);
    }
  };

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
          isActive: schedule.isActiveSubRoom !== false // ✅ FIX: Lấy từ schedule.isActiveSubRoom, KHÔNG phải schedule.subRoom.isActiveSubRoom
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
  const firstSchedule = scheduleListData?.schedules?.[0];
  const scheduleStartDate = firstSchedule?.startDate ? dayjs(firstSchedule.startDate) : null;
  const scheduleEndDate = firstSchedule?.endDate ? dayjs(firstSchedule.endDate) : null;

  return (
    <Modal
      title="Chỉnh sửa lịch làm việc"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="Cập nhật"
      cancelText="Hủy"
      confirmLoading={loading}
      width={1000}
      bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Schedule Info */}
        <Alert
          type="info"
          showIcon
          message={`Lịch tháng ${month}/${year}`}
          description={`${scheduleListData?.schedules?.filter(s => s.month === month && s.year === year).length || 0} lịch trong tháng này`}
        />
        
        {/* 🆕 Danh sách ngày đã tắt */}
        {(() => {
          // Lấy disabledDates từ schedule đầu tiên
          const firstSchedule = scheduleListData?.schedules?.[0];
          const disabledDates = firstSchedule?.disabledDates || [];
          
          if (disabledDates.length === 0) return null;
          
          // Sắp xếp theo ngày
          const sortedDates = [...disabledDates].sort((a, b) => 
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
                <StopOutlined /> Lịch sử tắt lịch ({disabledDates.length} ngày)
              </div>
              
              <div style={{ 
                maxHeight: 200, 
                overflowY: 'auto',
                fontSize: 12
              }}>
                {sortedDates.map((dateEntry, idx) => {
                  const date = dayjs(dateEntry.date);
                  const disabledShifts = dateEntry.shifts.filter(s => !s.isActive);
                  
                  if (disabledShifts.length === 0) return null;
                  
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
                      <Space wrap>
                        {disabledShifts.map(shift => {
                          const shiftNames = {
                            morning: 'Ca Sáng',
                            afternoon: 'Ca Chiều', 
                            evening: 'Ca Tối'
                          };
                          return (
                            <Tag 
                              key={shift.shiftType} 
                              color="red"
                              icon={<StopOutlined />}
                            >
                              {shiftNames[shift.shiftType]}
                            </Tag>
                          );
                        })}
                      </Space>
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
                          message.warning('Vui lòng chọn khoảng ngày trước');
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
                // Ưu tiên dùng toggled state, nếu không thì dùng subRoom.isActive
                const currentIsActive = toggledSubRoom ? toggledSubRoom.isActive : subRoom.isActive;
                
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
                          message.warning('Vui lòng chọn khoảng ngày ở phần "Bật/Tắt ca làm việc" trước');
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
        
        {/* 🆕 Tạo lịch override trong ngày nghỉ */}
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
                  
                  const { recurringHolidays, nonRecurringHolidays } = firstSchedule.holidaySnapshot;
                  const scheduleStart = dayjs(firstSchedule.startDate);
                  const scheduleEnd = dayjs(firstSchedule.endDate);
                  
                  const validDates = [];
                  
                  // 1. Tính ngày nghỉ định kỳ (recurring) trong khoảng startDate - endDate
                  if (recurringHolidays && recurringHolidays.length > 0) {
                    let currentDate = dayjs(scheduleStart);
                    while (currentDate.isBefore(scheduleEnd, 'day') || currentDate.isSame(scheduleEnd, 'day')) {
                      const dayOfWeek = currentDate.day() === 0 ? 7 : currentDate.day(); // Chuyển 0 (CN) thành 7
                      
                      // Kiểm tra xem ngày này có trong recurringHolidays không
                      const isRecurringHoliday = recurringHolidays.some(h => h.dayOfWeek === dayOfWeek);
                      
                      if (isRecurringHoliday) {
                        validDates.push(currentDate.format('YYYY-MM-DD'));
                      }
                      
                      currentDate = currentDate.add(1, 'day');
                    }
                  }
                  
                  // 2. Thêm ngày nghỉ không định kỳ (non-recurring)
                  if (nonRecurringHolidays && nonRecurringHolidays.length > 0) {
                    nonRecurringHolidays.forEach(holiday => {
                      const holidayStart = dayjs(holiday.startDate);
                      const holidayEnd = dayjs(holiday.endDate);
                      
                      let currentDate = dayjs(holidayStart);
                      while (currentDate.isBefore(holidayEnd, 'day') || currentDate.isSame(holidayEnd, 'day')) {
                        // Chỉ thêm nếu nằm trong schedule range
                        if ((currentDate.isAfter(scheduleStart, 'day') || currentDate.isSame(scheduleStart, 'day')) &&
                            (currentDate.isBefore(scheduleEnd, 'day') || currentDate.isSame(scheduleEnd, 'day'))) {
                          const dateStr = currentDate.format('YYYY-MM-DD');
                          if (!validDates.includes(dateStr)) {
                            validDates.push(dateStr);
                          }
                        }
                        currentDate = currentDate.add(1, 'day');
                      }
                    });
                  }
                  
                  // Sắp xếp theo thứ tự tăng dần
                  validDates.sort();
                  
                  console.log('📅 Valid holiday dates from holidaySnapshot:', validDates);
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
                  description="Tạo lịch cho ngày nghỉ đã được đánh dấu. Lịch này sẽ có flag 'isHolidayOverride'."
                  style={{ fontSize: 12 }}
                />
                
                {/* Chọn ngày nghỉ */}
                <div>
                  <div style={{ marginBottom: 4, fontWeight: 500 }}>
                    Chọn ngày nghỉ từ danh sách:
                    {validHolidayDates.length > 0 && (
                      <span style={{ fontSize: 11, color: '#999', marginLeft: 4 }}>
                        ({validHolidayDates.length} ngày nghỉ trong tháng này)
                      </span>
                    )}
                  </div>
                  <DatePicker
                    value={overrideDate}
                    onChange={(date) => {
                      setOverrideDate(date);
                      if (date) {
                        checkIfHoliday(date);
                      } else {
                        setHolidayInfo(null);
                      }
                    }}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày nghỉ"
                    style={{ width: '100%' }}
                    disabledDate={(current) => {
                      if (!current) return false;
                      // Disable past dates
                      if (current < dayjs().startOf('day')) return true;
                      // If we have validHolidayDates, only allow those dates
                      if (validHolidayDates.length > 0) {
                        const dateStr = current.format('YYYY-MM-DD');
                        return !validHolidayDates.includes(dateStr);
                      }
                      return false;
                    }}
                  />
                </div>
                
                {/* Loading khi check holiday */}
                {checkingHoliday && (
                  <Alert message="Đang kiểm tra ngày nghỉ từ lịch phòng..." type="info" showIcon />
                )}
                
                {/* Hiển thị thông tin holiday */}
                {holidayInfo && !checkingHoliday && (
                  <Alert
                    type="success"
                    showIcon
                    message="Ngày nghỉ hợp lệ (từ holidaySnapshot)"
                    description={
                      <div>
                        {holidayInfo.type === 'recurring' && (
                          <div>
                            <Tag color="orange">Nghỉ định kỳ</Tag>
                            <span>{holidayInfo.name}</span>
                            {holidayInfo.note && <div style={{ fontSize: 11, color: '#999' }}>{holidayInfo.note}</div>}
                          </div>
                        )}
                        {holidayInfo.type === 'non-recurring' && (
                          <div>
                            <Tag color="red">
                              {dayjs(holidayInfo.startDate).format('DD/MM')} - {dayjs(holidayInfo.endDate).format('DD/MM')}
                            </Tag>
                            <span>{holidayInfo.name}</span>
                            {holidayInfo.note && <div style={{ fontSize: 11, color: '#999' }}>{holidayInfo.note}</div>}
                          </div>
                        )}
                      </div>
                    }
                    style={{ fontSize: 12 }}
                  />
                )}
                
                {/* Show valid dates list */}
                {validHolidayDates.length > 0 && !overrideDate && (
                  <Alert
                    type="info"
                    message="Ngày nghỉ có thể chọn"
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
                
                {/* Chọn ca làm việc */}
                {holidayInfo && (
                  <>
                    <div>
                      <div style={{ marginBottom: 4, fontWeight: 500 }}>Chọn ca làm việc:</div>
                      <Checkbox.Group
                        value={overrideShifts}
                        onChange={setOverrideShifts}
                        style={{ width: '100%' }}
                      >
                        <Space direction="vertical">
                          {allShifts.filter(s => s.isActive).map(shift => (
                            <Checkbox key={shift.key} value={shift.key}>
                              <Tag color={shift.color}>{shift.name}</Tag>
                              <span style={{ fontSize: 12 }}>{shift.startTime} - {shift.endTime}</span>
                            </Checkbox>
                          ))}
                        </Space>
                      </Checkbox.Group>
                    </div>
                    
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
                      disabled={!overrideDate || !holidayInfo || overrideShifts.length === 0}
                      block
                    >
                      {creatingOverride ? 'Đang tạo...' : 'Tạo lịch Override'}
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

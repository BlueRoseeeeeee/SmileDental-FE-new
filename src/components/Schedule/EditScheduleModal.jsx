import React, { useState, useEffect } from 'react';
import { Modal, Switch, Checkbox, Space, Tag, Alert, message, Spin } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { updateSchedule } from '../../services/scheduleService';

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
  const [loading, setLoading] = useState(false);
  const [scheduleActive, setScheduleActive] = useState(true);
  const [reactivateShifts, setReactivateShifts] = useState([]);
  const [deactivateShifts, setDeactivateShifts] = useState([]); // 🆕 [{shiftKey, isActive}, ...]
  const [reactivateSubRooms, setReactivateSubRooms] = useState([]); // Array of {scheduleId, subRoomId}
  const [toggleSubRooms, setToggleSubRooms] = useState([]); // 🆕 [{scheduleId, subRoomId, isActive}, ...]

  // Initialize state when modal opens
  useEffect(() => {
    if (visible && scheduleListData) {
      // Get first schedule to check isActive status
      const firstSchedule = scheduleListData.schedules?.[0];
      setScheduleActive(firstSchedule?.isActive !== false);
      setReactivateShifts([]);
      setDeactivateShifts([]); // 🆕 Reset deactivate shifts
      setReactivateSubRooms([]);
      setToggleSubRooms([]); // 🆕 Reset toggle subrooms
    }
  }, [visible, scheduleListData]);

  const handleSubmit = async () => {
    if (!scheduleListData || !scheduleListData.schedules || scheduleListData.schedules.length === 0) {
      message.error('Không tìm thấy thông tin lịch');
      return;
    }

    console.log('📊 Debug before submit:', {
      toggleSubRooms,
      deactivateShifts,
      scheduleActive,
      schedulesCount: scheduleListData.schedules.length
    });

    try {
      setLoading(true);

      // ✅ Update all schedules with reactivate data
      const updatePromises = scheduleListData.schedules.map(schedule => {
        const updateData = {
          isActive: scheduleActive
        };
        
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

  return (
    <Modal
      title="Chỉnh sửa lịch làm việc"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="Cập nhật"
      cancelText="Hủy"
      confirmLoading={loading}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Schedule Info */}
        <Alert
          type="info"
          showIcon
          message={`Lịch tháng ${month}/${year}`}
          description={`${scheduleListData?.schedules?.filter(s => s.month === month && s.year === year).length || 0} lịch trong tháng này`}
        />

        {/* Toggle Schedule Active */}
        <div>
          <div style={{ marginBottom: 8 }}>
            <strong>Trạng thái lịch:</strong>
          </div>
          <Space>
            <Switch
              checked={scheduleActive}
              onChange={setScheduleActive}
              checkedChildren="Đang bật"
              unCheckedChildren="Đã tắt"
            />
            <span>{scheduleActive ? 'Lịch hiển thị cho bệnh nhân' : 'Lịch bị ẩn khỏi bệnh nhân'}</span>
          </Space>
          {!scheduleActive && (
            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              message="Cảnh báo"
              description="Tắt lịch sẽ ẩn tất cả slots khỏi hệ thống đặt lịch của bệnh nhân. Nhân sự đã được phân công vẫn giữ nguyên."
              style={{ marginTop: 8, fontSize: 12 }}
            />
          )}
        </div>

        {/* 🆕 Bật/Tắt ca làm việc - Gộp TẤT CẢ CA (inactive + generated + missing) */}
        {allShifts.length > 0 && (
          <div>
            <div style={{ marginBottom: 8 }}>
              <strong>Bật/Tắt ca làm việc:</strong>
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
                      backgroundColor: shift.isGenerated ? '#fff' : '#fffbf0'
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
                      onChange={() => handleShiftToggle(shift.key, currentIsActive)}
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
                      borderRadius: '4px'
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
                      onChange={() => handleSubRoomToggle(subRoom.scheduleId, subRoom.subRoomId, currentIsActive)}
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
    </Modal>
  );
};

export default EditScheduleModal;

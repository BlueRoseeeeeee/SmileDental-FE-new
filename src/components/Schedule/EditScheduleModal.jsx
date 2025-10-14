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
  const [reactivateSubRooms, setReactivateSubRooms] = useState([]); // Array of {scheduleId, subRoomId}

  // Initialize state when modal opens
  useEffect(() => {
    if (visible && scheduleListData) {
      // Get first schedule to check isActive status
      const firstSchedule = scheduleListData.schedules?.[0];
      setScheduleActive(firstSchedule?.isActive !== false);
      setReactivateShifts([]);
      setReactivateSubRooms([]);
    }
  }, [visible, scheduleListData]);

  const handleSubmit = async () => {
    if (!scheduleListData || !scheduleListData.schedules || scheduleListData.schedules.length === 0) {
      message.error('Không tìm thấy thông tin lịch');
      return;
    }

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
        
        // ✅ Reactivate subrooms (gửi array trong 1 request)
        if (reactivateSubRooms.length > 0) {
          const subRoomIdsToReactivate = reactivateSubRooms.map(item => item.subRoomId);
          updateData.reactivateSubRooms = subRoomIdsToReactivate;
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

  const handleSubRoomCheckboxChange = (scheduleId, subRoomId, subRoomName, checked) => {
    if (checked) {
      setReactivateSubRooms([...reactivateSubRooms, { scheduleId, subRoomId, subRoomName }]);
    } else {
      setReactivateSubRooms(reactivateSubRooms.filter(item => 
        !(item.scheduleId === scheduleId && item.subRoomId === subRoomId)
      ));
    }
  };

  if (!scheduleListData || !scheduleListData.schedules || scheduleListData.schedules.length === 0) {
    return null;
  }

  // ✅ Get inactive shifts từ TẤT CẢ schedules (tránh duplicate)
  const inactiveShiftsMap = new Map(); // key: shiftKey, value: shift info
  
  scheduleListData.schedules.forEach(schedule => {
    if (schedule.shiftConfig) {
      ['morning', 'afternoon', 'evening'].forEach(shiftKey => {
        const shift = schedule.shiftConfig[shiftKey];
        // Chỉ lấy ca: isActive=false VÀ isGenerated=false (chưa được tạo)
        if (shift && shift.isActive === false && shift.isGenerated === false) {
          if (!inactiveShiftsMap.has(shiftKey)) {
            inactiveShiftsMap.set(shiftKey, {
              key: shiftKey,
              name: shift.name,
              color: SHIFT_COLORS[shiftKey],
              startTime: shift.startTime,
              endTime: shift.endTime
            });
          }
        }
      });
    }
  });
  
  const inactiveShifts = Array.from(inactiveShiftsMap.values());

  // ✅ Get inactive subrooms (isActiveSubRoom=false) - CHỈ LẤY CỦA THÁNG NÀY
  const inactiveSubRooms = [];
  
  if (scheduleListData?.schedules) {
    // 🔧 FIX: Lấy trực tiếp từ schedules.subRoom.isActiveSubRoom thay vì subRoomShiftStatus
    scheduleListData.schedules.forEach(schedule => {
      // Filter theo tháng/năm
      if (schedule.month === month && schedule.year === year && schedule.subRoom) {
        if (schedule.subRoom.isActiveSubRoom === false) {
          inactiveSubRooms.push({
            scheduleId: schedule.scheduleId,
            subRoomId: schedule.subRoom._id,
            subRoomName: schedule.subRoom.name,
            shifts: {
              morning: schedule.shiftConfig?.morning?.isActive ?? false,
              afternoon: schedule.shiftConfig?.afternoon?.isActive ?? false,
              evening: schedule.shiftConfig?.evening?.isActive ?? false
            }
          });
        }
      }
    });
  }
  
  console.log(`📊 Modal "Chỉnh sửa lịch" - Tháng ${month}/${year}:`, {
    totalSchedules: scheduleListData?.schedules?.length,
    inactiveSubRooms: inactiveSubRooms.map(sr => sr.subRoomName)
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

        {/* Reactivate Shifts */}
        {inactiveShifts.length > 0 && (
          <div>
            <div style={{ marginBottom: 8 }}>
              <strong>Kích hoạt lại ca làm việc:</strong>
              <Tag color="orange" style={{ marginLeft: 8 }}>Đã tắt, chưa tạo</Tag>
            </div>
            {/* <Alert
              type="info"
              showIcon
              message="Lưu ý"
              description="Chỉ có thể kích hoạt lại ca đã tắt và chưa tạo slots. Sau khi kích hoạt, có thể tạo ca thiếu cho lịch này."
              style={{ marginBottom: 8, fontSize: 12 }}
            /> */}
            <Space direction="vertical">
              {inactiveShifts.map(shift => (
                <Checkbox
                  key={shift.key}
                  checked={reactivateShifts.includes(shift.key)}
                  onChange={(e) => handleShiftCheckboxChange(shift.key, e.target.checked)}
                >
                  <Space>
                    <Tag color={shift.color}>{shift.name}</Tag>
                    <span style={{ color: '#8c8c8c' }}>
                      ({shift.startTime} - {shift.endTime})
                    </span>
                    <Tag color="orange">Đang tắt</Tag>
                  </Space>
                </Checkbox>
              ))}
            </Space>
            {reactivateShifts.length > 0 && (
              <Alert
                type="success"
                showIcon
                message={`Sẽ kích hoạt lại ${reactivateShifts.length} ca`}
                style={{ marginTop: 8, fontSize: 11 }}
              />
            )}
          </div>
        )}

        {/* ✅ Reactivate SubRooms (isActiveSubRoom: false → true) */}
        {inactiveSubRooms.length > 0 && (
          <div>
            <div style={{ marginBottom: 8 }}>
              <strong>Kích hoạt lại buồng:</strong>
              <Tag color="orange" style={{ marginLeft: 8 }}>Đã tắt, chưa tạo</Tag>
            </div>
            {/* <Alert
              type="info"
              showIcon
              message="Lưu ý"
              description="Chỉ có thể kích hoạt lại buồng có isActiveSubRoom=false (đã bị tắt trong lịch). Sau khi kích hoạt, buồng này sẽ hiển thị lại."
              style={{ marginBottom: 8, fontSize: 12 }}
            /> */}
            <Space direction="vertical">
              {inactiveSubRooms.map(subRoom => (
                <Checkbox
                  key={`${subRoom.scheduleId}-${subRoom.subRoomId}`}
                  checked={reactivateSubRooms.some(item => 
                    item.scheduleId === subRoom.scheduleId && item.subRoomId === subRoom.subRoomId
                  )}
                  onChange={(e) => handleSubRoomCheckboxChange(
                    subRoom.scheduleId, 
                    subRoom.subRoomId, 
                    subRoom.subRoomName, 
                    e.target.checked
                  )}
                >
                  <Space direction="vertical" size={0}>
                    <Space>
                      <Tag color="cyan">{subRoom.subRoomName}</Tag>
                      <Tag color="orange">Đang tắt</Tag>
                    </Space>
                    {/* <div style={{ marginLeft: 24, fontSize: 11, color: '#8c8c8c' }}>
                      {subRoom.shifts.morning && '✅ Sáng '}
                      {subRoom.shifts.afternoon && '✅ Chiều '}
                      {subRoom.shifts.evening && '✅ Tối'}
                    </div> */}
                  </Space>
                </Checkbox>
              ))}
            </Space>
            {reactivateSubRooms.length > 0 && (
              <Alert
                type="success"
                showIcon
                message={`Sẽ kích hoạt lại ${reactivateSubRooms.length} buồng`}
                style={{ marginTop: 8, fontSize: 11 }}
              />
            )}
          </div>
        )}

        {/* No inactive items */}
        {inactiveShifts.length === 0 && inactiveSubRooms.length === 0 && (
          <Alert
            type="success"
            showIcon
            message="Tất cả ca và buồng đang hoạt động"
            description="Không có ca hoặc buồng nào cần kích hoạt lại."
          />
        )}
      </Space>
    </Modal>
  );
};

export default EditScheduleModal;

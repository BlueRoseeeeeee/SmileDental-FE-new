import React, { useState, useEffect } from 'react';
import { Modal, Checkbox, Button, Space, Alert, Typography, Card, Tag, Empty } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { scheduleService } from '../../services';
import { toast } from '../../services/toastService';

const { Text, Title } = Typography;

/**
 * EnableShiftsSubRoomsModal
 * Cho phép kích hoạt lại các ca/buồng bị tắt trong schedule
 */
const EnableShiftsSubRoomsModal = ({ 
  visible, 
  onClose, 
  onSuccess,
  groupData // Nhận toàn bộ group data từ "Danh sách lịch đã tạo"
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [selectedSubRooms, setSelectedSubRooms] = useState([]);
  
  // Danh sách các ca bị tắt - lấy từ groupData
  const [disabledShifts, setDisabledShifts] = useState([]);
  // Danh sách các buồng bị tắt - lấy từ groupData
  const [disabledSubRooms, setDisabledSubRooms] = useState([]);

  useEffect(() => {
    if (visible && groupData) {
      processGroupData();
    }
  }, [visible, groupData]);

  const processGroupData = () => {
    if (!groupData || !groupData.schedules || groupData.schedules.length === 0) {
      setDisabledShifts([]);
      setDisabledSubRooms([]);
      return;
    }

    console.log('🔍 processGroupData:', {
      hasGroupData: !!groupData,
      schedulesCount: groupData.schedules?.length,
      firstSchedule: groupData.schedules?.[0],
      month: groupData.month,
      year: groupData.year
    });

    // 1. Lấy danh sách CA BỊ TẮT - merge từ tất cả schedules
    const shiftsMap = new Map(); // Dùng Map để tránh trùng lặp
    
    groupData.schedules.forEach(schedule => {
      if (schedule.disabledShifts && schedule.disabledShifts.length > 0) {
        schedule.disabledShifts.forEach(shift => {
          if (!shiftsMap.has(shift.key)) {
            shiftsMap.set(shift.key, {
              key: shift.key,
              name: shift.name,
              color: shift.color || 'default',
              scheduleId: schedule.scheduleId || schedule._id
            });
          }
        });
      }
    });
    
    const shifts = Array.from(shiftsMap.values());
    setDisabledShifts(shifts);
    
    // 2. Lấy danh sách BUỒNG BỊ TẮT - lấy từ schedule.isActiveSubRoom === false
    const subRoomsMap = new Map(); // Dùng Map để tránh trùng lặp
    
    groupData.schedules.forEach(schedule => {
      // Kiểm tra schedule.isActiveSubRoom (trạng thái buồng trong lịch)
      if (schedule.subRoom && schedule.isActiveSubRoom === false) {
        const subRoomId = schedule.subRoom._id.toString();
        if (!subRoomsMap.has(subRoomId)) {
          subRoomsMap.set(subRoomId, {
            id: schedule.subRoom._id,
            name: schedule.subRoom.name || 'Buồng không tên',
            scheduleId: schedule.scheduleId || schedule._id
          });
        }
      }
    });
    
    const subRooms = Array.from(subRoomsMap.values());
    setDisabledSubRooms(subRooms);
    
    // Mặc định chọn tất cả
    setSelectedShifts(shifts.map(s => s.key));
    setSelectedSubRooms(subRooms.map(sr => sr.id));
  };

  const handleShiftToggle = (shiftKey) => {
    setSelectedShifts(prev => {
      if (prev.includes(shiftKey)) {
        return prev.filter(k => k !== shiftKey);
      } else {
        return [...prev, shiftKey];
      }
    });
  };

  const handleSubRoomToggle = (subRoomId) => {
    setSelectedSubRooms(prev => {
      if (prev.includes(subRoomId)) {
        return prev.filter(id => id !== subRoomId);
      } else {
        return [...prev, subRoomId];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedShifts.length === 0 && selectedSubRooms.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một ca hoặc buồng để kích hoạt');
      return;
    }

    if (!groupData || !groupData.schedules || groupData.schedules.length === 0) {
      toast.error('Không tìm thấy thông tin lịch');
      return;
    }

    try {
      setLoading(true);
      
      // Lấy scheduleId từ schedule đầu tiên trong group
      const firstSchedule = groupData.schedules[0];
      const scheduleId = firstSchedule.scheduleId || firstSchedule._id;
      
      if (!scheduleId) {
        toast.error('Không tìm thấy ID lịch');
        return;
      }
      
      console.log('🔄 Enable shifts/subrooms:', {
        scheduleId,
        shifts: selectedShifts,
        subRoomIds: selectedSubRooms
      });
      
      // Chuẩn bị payload
      const payload = {
        scheduleId,
        shifts: selectedShifts, // ['morning', 'afternoon', 'evening']
        subRoomIds: selectedSubRooms // [subRoomId1, subRoomId2]
      };
      
      const response = await scheduleService.enableShiftsAndSubRooms(payload);
      
      if (response.success) {
        toast.success(`Đã bật ${selectedShifts.length} ca và ${selectedSubRooms.length} buồng`);
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Không thể kích hoạt ca/buồng');
      }
    } catch (error) {
      console.error('Error enabling shifts/subrooms:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi kích hoạt ca/buồng');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedShifts([]);
    setSelectedSubRooms([]);
    setDisabledShifts([]);
    setDisabledSubRooms([]);
    onClose();
  };

  const hasDisabledItems = disabledShifts.length > 0 || disabledSubRooms.length > 0;

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <span>Bật ca/buồng tắt</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          disabled={!hasDisabledItems || (selectedShifts.length === 0 && selectedSubRooms.length === 0)}
        >
          Kích hoạt
        </Button>
      ]}
      width={700}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Thông tin lịch */}
        <Card size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>
              <InfoCircleOutlined /> Lịch: {groupData?.roomName || ''} - Tháng {groupData?.month || ''}/{groupData?.year || ''}
            </Text>
          </Space>
        </Card>

        {!hasDisabledItems ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical">
                <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                <Title level={5}>Ca/Buồng đầy đủ</Title>
                <Text type="secondary">
                  Không có ca hoặc buồng nào đang bị tắt trong lịch này
                </Text>
              </Space>
            }
          />
        ) : (
          <>
            <Alert
              message="Thông tin"
              description="Các ca/buồng sau đây đang bị tắt trong lịch. Chọn các ca/buồng cần kích hoạt lại."
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
            />

            {/* Danh sách ca bị tắt */}
            {disabledShifts.length > 0 && (
              <Card 
                  title={
                    <Space>
                      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      <span>Ca làm việc bị tắt ({disabledShifts.length})</span>
                    </Space>
                  }
                  size="small"
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {disabledShifts.map(shift => (
                      <Checkbox
                        key={shift.key}
                        checked={selectedShifts.includes(shift.key)}
                        onChange={() => handleShiftToggle(shift.key)}
                      >
                        <Space>
                          <Tag color="red">{shift.name}</Tag>
                          {shift.config && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {shift.config.start} - {shift.config.end}
                            </Text>
                          )}
                        </Space>
                      </Checkbox>
                    ))}
                  </Space>
                </Card>
              )}

              {/* Danh sách buồng bị tắt */}
              {disabledSubRooms.length > 0 && (
                <Card 
                  title={
                    <Space>
                      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      <span>Buồng khám bị tắt ({disabledSubRooms.length})</span>
                    </Space>
                  }
                  size="small"
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {disabledSubRooms.map(subRoom => (
                      <Checkbox
                        key={subRoom.id}
                        checked={selectedSubRooms.includes(subRoom.id)}
                        onChange={() => handleSubRoomToggle(subRoom.id)}
                      >
                        <Space>
                          <Tag color="orange">{subRoom.name}</Tag>
                          {subRoom.code && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Mã: {subRoom.code}
                            </Text>
                          )}
                        </Space>
                      </Checkbox>
                    ))}
                  </Space>
                </Card>
              )}

              {/* Tổng kết lựa chọn */}
              <Card size="small" style={{ backgroundColor: '#f0f5ff', borderColor: '#adc6ff' }}>
                <Text>
                  Đã chọn: <Text strong>{selectedShifts.length}</Text> ca và{' '}
                  <Text strong>{selectedSubRooms.length}</Text> buồng
                </Text>
              </Card>
            </>
          )}
        </Space>
    </Modal>
  );
};

export default EnableShiftsSubRoomsModal;

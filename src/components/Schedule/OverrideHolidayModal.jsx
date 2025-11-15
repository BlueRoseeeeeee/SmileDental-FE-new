/*
 * @author: AI Assistant
 * Task 2.3 - Override Holiday: Tạo lịch trong ngày nghỉ
 * Admin/Manager có thể tạo lịch override trong ngày đã đánh dấu holiday
 */
import React, { useState, useEffect } from 'react';
import { Modal, Form, DatePicker, Select, Checkbox, Button, Space, Alert, Typography, Card, Tag } from 'antd';
import { CalendarOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { scheduleConfigService } from '../../services';
import { toast } from '../../services/toastService';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
import { Input } from 'antd';

/**
 * OverrideHolidayModal
 * Cho phép admin/manager tạo lịch override trong ngày nghỉ
 */
const OverrideHolidayModal = ({ 
  visible, 
  onClose, 
  onSuccess, 
  rooms = [],
  initialDate = null
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [subRooms, setSubRooms] = useState([]);
  const [holidayInfo, setHolidayInfo] = useState(null);
  const [checkingHoliday, setCheckingHoliday] = useState(false);

  useEffect(() => {
    if (initialDate) {
      form.setFieldsValue({ date: dayjs(initialDate) });
      checkIfHoliday(initialDate);
    }
  }, [initialDate]);

  // Check if selected date is a holiday
  const checkIfHoliday = async (date) => {
    if (!date) return;
    
    setCheckingHoliday(true);
    try {
      const dateStr = dayjs(date).format('YYYY-MM-DD');
      const result = await scheduleConfigService.getHolidayPreview(dateStr, dateStr);
      
      if (result.data && (result.data.hasRecurringHolidays || result.data.hasNonRecurringHolidays)) {
        setHolidayInfo(result.data);
      } else {
        setHolidayInfo(null);
        toast.warning('Ngày này không phải ngày nghỉ. Override chỉ áp dụng cho ngày nghỉ.');
      }
    } catch (error) {
      console.error('Error checking holiday:', error);
      setHolidayInfo(null);
    } finally {
      setCheckingHoliday(false);
    }
  };

  // Handle room selection change
  const handleRoomChange = (roomId) => {
    const room = rooms.find(r => r._id === roomId);
    setSelectedRoom(room);
    
    if (room && room.subRooms && room.subRooms.length > 0) {
      setSubRooms(room.subRooms.filter(sr => sr.isActive));
    } else {
      setSubRooms([]);
    }
    
    // Reset subroom selection
    form.setFieldsValue({ subRoomId: undefined });
  };

  const handleDateChange = (date) => {
    if (date) {
      checkIfHoliday(date);
    } else {
      setHolidayInfo(null);
    }
  };

  const handleSubmit = async (values) => {
    if (!holidayInfo) {
      toast.error('Vui lòng chọn ngày nghỉ hợp lệ');
      return;
    }

    try {
      setLoading(true);
      
      // Convert shift keys to shift names
      const shiftNameMap = {
        'morning': 'Ca Sáng',
        'afternoon': 'Ca Chiều',
        'evening': 'Ca Tối'
      };
      
      const payload = {
        roomId: values.roomId,
        subRoomId: values.subRoomId,
        date: values.date.format('YYYY-MM-DD'),
        shifts: (values.shifts || []).map(s => shiftNameMap[s]),
        note: values.note || `Lịch override ngày nghỉ`
      };

      const result = await scheduleConfigService.createScheduleOverrideHoliday(payload);

      if (result.success) {
        toast.success(`Đã tạo lịch override thành công: ${result.totalSlotsCreated} slots`);
        form.resetFields();
        setHolidayInfo(null);
        setSelectedRoom(null);
        setSubRooms([]);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Override holiday error:', error);
      toast.error(error.response?.data?.message || 'Tạo lịch override thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <CalendarOutlined style={{ color: '#faad14' }} />
          <span>Thiết lập lịch làm việc vào ngày nghỉ</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      {/* <Alert
        message="Quyền đặc biệt: Admin/Manager"
        description="Bạn có thể tạo lịch cho ngày nghỉ đã được đánh dấu. Lịch này sẽ được gắn flag 'isHolidayOverride' để phân biệt với lịch bình thường."
        type="warning"
        icon={<WarningOutlined />}
        showIcon
        style={{ marginBottom: 24 }}
      /> */}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="date"
          label="Ngày nghỉ"
          rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày nghỉ"
            onChange={handleDateChange}
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        {checkingHoliday && (
          <Alert
            message="Đang kiểm tra ngày nghỉ..."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {holidayInfo && (
          <Card 
            size="small" 
            style={{ marginBottom: 16, background: '#fffbe6', borderColor: '#ffe58f' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong style={{ color: '#d46b08' }}>
                <InfoCircleOutlined /> Thông tin ngày nghỉ:
              </Text>
              
              {holidayInfo.recurringHolidays?.map((h, idx) => (
                <div key={`rec-${idx}`}>
                  <Tag color="orange">{h.dayOfWeekName}</Tag>
                  <Text>{h.name}</Text>
                  {h.note && <Text type="secondary"> - {h.note}</Text>}
                </div>
              ))}
              
              {holidayInfo.nonRecurringHolidays?.map((h, idx) => (
                <div key={`non-${idx}`}>
                  <Tag color="red">
                    {dayjs(h.startDate).format('DD/MM/YYYY')} - {dayjs(h.endDate).format('DD/MM/YYYY')}
                  </Tag>
                  <Text>{h.name}</Text>
                  {h.note && <Text type="secondary"> - {h.note}</Text>}
                </div>
              ))}
            </Space>
          </Card>
        )}

        <Form.Item
          name="roomId"
          label="Phòng khám"
          rules={[{ required: true, message: 'Vui lòng chọn phòng!' }]}
        >
          <Select
            placeholder="Chọn phòng"
            onChange={handleRoomChange}
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {rooms.filter(r => r.isActive).map(room => (
              <Option key={room._id} value={room._id}>
                {room.name || room.roomName || room._id}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {subRooms.length > 0 && (
          <Form.Item
            name="subRoomId"
            label="Buồng khám"
            rules={[{ required: true, message: 'Vui lòng chọn buồng!' }]}
          >
            <Select placeholder="Chọn buồng">
              {subRooms.map(subRoom => (
                <Option key={subRoom._id} value={subRoom._id}>
                  {subRoom.name || subRoom.subRoomName || subRoom._id}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item
          name="shifts"
          label="Ca làm việc"
          rules={[{ required: true, message: 'Vui lòng chọn ít nhất một ca!' }]}
        >
          <Checkbox.Group
            style={{ width: '100%' }}
          >
            <Space direction="vertical">
              <Checkbox value="morning">Ca Sáng</Checkbox>
              <Checkbox value="afternoon">Ca Chiều</Checkbox>
              <Checkbox value="evening">Ca Tối</Checkbox>
            </Space>
          </Checkbox.Group>
        </Form.Item>

        <Form.Item
          name="note"
          label="Ghi chú"
        >
          <TextArea 
            rows={3}
            placeholder="Lý do tạo lịch override (VD: Khám khẩn cấp, Yêu cầu đặc biệt...)"
          />
        </Form.Item>

        {/* <Alert
          message="Lưu ý"
          description="Lịch override sẽ tạo slots với flag 'isHolidayOverride = true' để phân biệt với lịch bình thường. Không ảnh hưởng đến ngày nghỉ gốc."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        /> */}

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>
              Hủy
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              disabled={!holidayInfo}
            >
              Tạo lịch Override
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default OverrideHolidayModal;

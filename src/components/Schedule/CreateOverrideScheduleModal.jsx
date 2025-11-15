/*
 * @author: AI Assistant
 * Task 3.3 - Create Schedule Override on Holiday
 */
import React, { useState } from 'react';
import { Modal, Form, DatePicker, Select, Button, Alert, Space, Typography } from 'antd';
import { CalendarOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { scheduleConfigService } from '../../services';
import { toast } from '../../services/toastService';

const { Text } = Typography;
const { Option } = Select;

/**
 * CreateOverrideScheduleModal
 * Cho phép admin/manager tạo lịch đặc biệt trong ngày nghỉ
 */
const CreateOverrideScheduleModal = ({ visible, onClose, onSuccess, rooms = [], holidays = [] }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // Check if date is a holiday
  const isHoliday = (date) => {
    if (!date) return false;
    const checkDate = dayjs(date).format('YYYY-MM-DD');
    
    return holidays.some(holiday => {
      if (holiday.isFixedHoliday) {
        // Convention: 1=Sunday, 2=Monday, 3=Tuesday, ..., 7=Saturday
        // dayjs.day(): 0=Sunday, 1=Monday, ..., 6=Saturday
        const dayOfWeek = dayjs(date).day() + 1; // Convert: 0->1, 1->2, ..., 6->7
        return dayOfWeek === holiday.dayOfWeek;
      } else {
        // Check date range
        return dayjs(date).isBetween(
          dayjs(holiday.startDate),
          dayjs(holiday.endDate),
          'day',
          '[]'
        );
      }
    });
  };

  // Disable non-holiday dates
  const disabledDate = (current) => {
    if (!current) return true;
    
    // Must be future date
    if (current.isBefore(dayjs(), 'day')) {
      return true;
    }

    // Must be a holiday
    return !isHoliday(current);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const payload = {
        date: values.date.format('YYYY-MM-DD'),
        roomId: values.roomId,
        shifts: values.shifts,
        isOverride: true, // Flag đánh dấu đây là lịch override
        reason: `Lịch đặc biệt trong ngày nghỉ`
      };

      await scheduleConfigService.createScheduleOverrideHoliday(payload);
      
      toast.success('Tạo lịch đặc biệt thành công!');
      form.resetFields();
      setSelectedDate(null);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Tạo lịch thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <CalendarOutlined style={{ color: '#ff4d4f' }} />
          <span>Tạo lịch trong ngày nghỉ</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Alert
        message="Lưu ý quan trọng"
        description="Đây là lịch đặc biệt được tạo trong ngày nghỉ. Lịch này sẽ được đánh dấu 'override' và hiển thị riêng biệt trên lịch."
        type="warning"
        icon={<WarningOutlined />}
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="date"
          label="Chọn ngày nghỉ"
          rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="Chỉ hiển thị ngày nghỉ"
            disabledDate={disabledDate}
            onChange={setSelectedDate}
          />
        </Form.Item>

        {selectedDate && (
          <Alert
            message={`Ngày đã chọn: ${selectedDate.format('DD/MM/YYYY')}`}
            description="Đây là ngày nghỉ. Bạn có thể tạo lịch đặc biệt cho ngày này."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item
          name="roomId"
          label="Phòng khám"
          rules={[{ required: true, message: 'Vui lòng chọn phòng!' }]}
        >
          <Select placeholder="Chọn phòng khám">
            {rooms.map(room => (
              <Option key={room._id} value={room._id}>
                {room.roomName}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="shifts"
          label="Ca làm việc"
          rules={[{ required: true, message: 'Vui lòng chọn ca!' }]}
        >
          <Select
            mode="multiple"
            placeholder="Chọn ca làm việc"
            options={[
              { label: 'Ca sáng (08:00 - 12:00)', value: 'morning' },
              { label: 'Ca chiều (13:00 - 17:00)', value: 'afternoon' },
              { label: 'Ca tối (17:00 - 21:00)', value: 'evening' }
            ]}
          />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Tạo lịch đặc biệt
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateOverrideScheduleModal;

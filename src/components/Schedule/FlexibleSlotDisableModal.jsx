/*
 * @author: AI Assistant  
 * Task 3.3 - Flexible Slot Disable/Enable UI
 */
import React, { useState } from 'react';
import { Modal, Form, DatePicker, Select, Button, Space, Alert, Typography, Checkbox, Card } from 'antd';
import { ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { scheduleConfigService } from '../../services';
import { toast } from '../../services/toastService';
import DisableSlotResultModal from './DisableSlotResultModal';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * FlexibleSlotDisableModal
 * Cho phép disable/enable slots linh hoạt theo ngày, ca, phòng, nha sĩ
 */
const FlexibleSlotDisableModal = ({ 
  visible, 
  onClose, 
  onSuccess, 
  rooms = [], 
  dentists = [],
  mode = 'disable' // 'disable' or 'enable'
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [affectedCount, setAffectedCount] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [affectedPatients, setAffectedPatients] = useState(null);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Build payload theo API backend
      const payload = {};
      
      // 1. Date/Date range
      if (values.dateRange) {
        if (values.dateRange.length === 2) {
          payload.startDate = values.dateRange[0].format('YYYY-MM-DD');
          payload.endDate = values.dateRange[1].format('YYYY-MM-DD');
        }
      }
      
      // 2. Shift names (convert từ key sang tên ca)
      if (values.shifts && values.shifts.length > 0) {
        const shiftNameMap = {
          'morning': 'Ca Sáng',
          'afternoon': 'Ca Chiều',
          'evening': 'Ca Tối'
        };
        // Backend chỉ nhận 1 shiftName, nếu chọn nhiều ca thì phải gọi nhiều lần
        // Hoặc backend hỗ trợ array - cần check
        payload.shiftName = shiftNameMap[values.shifts[0]]; // Tạm thời chỉ lấy ca đầu tiên
      }
      
      // 3. Room and SubRoom
      if (values.roomIds && values.roomIds.length > 0) {
        payload.roomId = values.roomIds[0]; // Backend nhận 1 roomId
      }
      
      if (values.subRoomId) {
        payload.subRoomId = values.subRoomId;
      }
      
      // 4. Dentist
      if (values.dentistIds && values.dentistIds.length > 0) {
        payload.dentistId = values.dentistIds[0]; // Backend nhận 1 dentistId
      }

      let result;
      if (mode === 'disable') {
        result = await scheduleConfigService.disableSlotsFlexible(payload);
      } else {
        result = await scheduleConfigService.enableSlotsFlexible(payload);
      }

      if (result.success) {
        const message = mode === 'disable' 
          ? `Đã tắt ${result.disabledCount || 0} slot thành công`
          : `Đã bật ${result.enabledCount || 0} slot thành công`;
        
        toast.success(message);

        // Show result modal if mode is disable and has affected patients
        if (mode === 'disable' && (result.emailsSent?.length > 0 || result.needsManualContact?.length > 0)) {
          setAffectedPatients({
            emailsSent: result.emailsSent || [],
            needsManualContact: result.needsManualContact || []
          });
          setShowResultModal(true);
        }

        form.resetFields();
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Toggle slots error:', error);
      toast.error(error.response?.data?.message || `${mode === 'disable' ? 'Tắt' : 'Bật'} slot thất bại`);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      const values = await form.validateFields();
      
      const payload = {
        dateRange: values.dateRange 
          ? [
              values.dateRange[0].format('YYYY-MM-DD'),
              values.dateRange[1].format('YYYY-MM-DD')
            ]
          : null,
        shifts: values.shifts || [],
        roomIds: values.roomIds || [],
        dentistIds: values.dentistIds || []
      };

      const result = await scheduleConfigService.previewAffectedSlots(payload);
      setAffectedCount(result.count);
      toast.info(`Sẽ ảnh hưởng đến ${result.count} slot`);
    } catch (error) {
      console.error('Preview error:', error);
    }
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <ClockCircleOutlined style={{ color: mode === 'disable' ? '#ff4d4f' : '#52c41a' }} />
            <span>{mode === 'disable' ? 'Tắt' : 'Bật'} slot linh hoạt</span>
          </Space>
        }
        open={visible}
        onCancel={onClose}
        footer={null}
        width={700}
      >
        <Alert
          message="Tính năng linh hoạt"
          description={`Bạn có thể ${mode === 'disable' ? 'tắt' : 'bật'} slot theo nhiều tiêu chí: ngày, ca, phòng, nha sĩ. Hệ thống sẽ tự động thông báo cho bệnh nhân bị ảnh hưởng.`}
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handlePreview}
        >
          <Form.Item
            name="dateRange"
            label="Khoảng thời gian"
            rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian!' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item
            name="shifts"
            label="Ca làm việc (tùy chọn - chỉ chọn 1 ca)"
            tooltip="Hiện tại chỉ hỗ trợ chọn 1 ca tại một thời điểm"
          >
            <Select
              placeholder="Chọn ca (để trống = tất cả ca)"
              allowClear
              options={[
                { label: 'Ca Sáng', value: 'morning' },
                { label: 'Ca Chiều', value: 'afternoon' },
                { label: 'Ca Tối', value: 'evening' }
              ]}
            />
          </Form.Item>

          <Form.Item
            name="roomIds"
            label="Phòng khám (tùy chọn - chỉ chọn 1 phòng)"
            tooltip="Hiện tại chỉ hỗ trợ chọn 1 phòng tại một thời điểm"
          >
            <Select
              placeholder="Chọn phòng (để trống = tất cả phòng)"
              allowClear
            >
              {rooms.map(room => (
                <Option key={room._id} value={room._id}>
                  {room.roomName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dentistIds"
            label="Nha sĩ (tùy chọn - chỉ chọn 1 nha sĩ)"
            tooltip="Hiện tại chỉ hỗ trợ chọn 1 nha sĩ tại một thời điểm"
          >
            <Select
              placeholder="Chọn nha sĩ (để trống = tất cả nha sĩ)"
              allowClear
            >
              {dentists.map(dentist => (
                <Option key={dentist._id} value={dentist._id}>
                  {dentist.fullName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {mode === 'disable' && (
            <Alert
              message="Thông báo tự động"
              description="Hệ thống sẽ tự động gửi email cho bệnh nhân có email. Bệnh nhân không có email sẽ được liệt kê để nhân viên liên hệ qua số điện thoại."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {affectedCount !== null && (
            <Card size="small" style={{ marginBottom: 16, background: '#f0f5ff' }}>
              <Text strong>Số slot sẽ bị ảnh hưởng: </Text>
              <Text type="danger" style={{ fontSize: 18 }}>
                {affectedCount}
              </Text>
            </Card>
          )}

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={onClose}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading} danger={mode === 'disable'}>
                Xác nhận {mode === 'disable' ? 'Tắt' : 'Bật'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <DisableSlotResultModal
        visible={showResultModal}
        onClose={() => setShowResultModal(false)}
        affectedPatients={affectedPatients}
      />
    </>
  );
};

export default FlexibleSlotDisableModal;

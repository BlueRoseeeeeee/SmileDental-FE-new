/**
 * @author: HoTram
 * Schedule Config Form - Form cấu hình ca làm việc
 */
import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  TimePicker, 
  InputNumber, 
  Button, 
  Card, 
  Row, 
  Col, 
  Switch,
  Divider,
  Space,
  Typography,
  Alert,
  Popconfirm
} from 'antd';
import { 
  ClockCircleOutlined, 
  SaveOutlined, 
  ReloadOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ScheduleConfigForm = ({ config, onUpdate, loading }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [switchStates, setSwitchStates] = useState({
    morningActive: true,
    afternoonActive: true,
    eveningActive: true
  });

  useEffect(() => {
    if (config) {
      const formData = {
        ...config,
        morningStartTime: config.morningShift?.startTime ? dayjs(config.morningShift.startTime, 'HH:mm') : null,
        morningEndTime: config.morningShift?.endTime ? dayjs(config.morningShift.endTime, 'HH:mm') : null,
        morningActive: config.morningShift?.isActive || false,
        afternoonStartTime: config.afternoonShift?.startTime ? dayjs(config.afternoonShift.startTime, 'HH:mm') : null,
        afternoonEndTime: config.afternoonShift?.endTime ? dayjs(config.afternoonShift.endTime, 'HH:mm') : null,
        afternoonActive: config.afternoonShift?.isActive || false,
        eveningStartTime: config.eveningShift?.startTime ? dayjs(config.eveningShift.startTime, 'HH:mm') : null,
        eveningEndTime: config.eveningShift?.endTime ? dayjs(config.eveningShift.endTime, 'HH:mm') : null,
        eveningActive: config.eveningShift?.isActive || false,
      };
      form.setFieldsValue(formData);
      
      // Sync switch states
      setSwitchStates({
        morningActive: config.morningShift?.isActive || false,
        afternoonActive: config.afternoonShift?.isActive || false,
        eveningActive: config.eveningShift?.isActive || false,
      });
    }
  }, [config, form]);

  const handleSubmit = async (values) => {
    try {
      setSaving(true);
      
      // Chuyển đổi thời gian từ dayjs object sang string
      const configData = {
        morningShift: {
          name: "Ca Sáng",
          startTime: values.morningStartTime?.format('HH:mm') || '07:00',
          endTime: values.morningEndTime?.format('HH:mm') || '12:00',
          isActive: values.morningActive === true
        },
        afternoonShift: {
          name: "Ca Chiều", 
          startTime: values.afternoonStartTime?.format('HH:mm') || '13:00',
          endTime: values.afternoonEndTime?.format('HH:mm') || '17:00',
          isActive: values.afternoonActive === true
        },
        eveningShift: {
          name: "Ca Tối",
          startTime: values.eveningStartTime?.format('HH:mm') || '18:00', 
          endTime: values.eveningEndTime?.format('HH:mm') || '22:00',
          isActive: values.eveningActive === true
        },
        unitDuration: values.unitDuration || 15,
        maxBookingDays: values.maxBookingDays || 30
      };

      await onUpdate(configData);
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (config) {
      const formData = {
        ...config,
        morningStartTime: config.morningShift?.startTime ? dayjs(config.morningShift.startTime, 'HH:mm') : null,
        morningEndTime: config.morningShift?.endTime ? dayjs(config.morningShift.endTime, 'HH:mm') : null,
        morningActive: config.morningShift?.isActive || false,
        afternoonStartTime: config.afternoonShift?.startTime ? dayjs(config.afternoonShift.startTime, 'HH:mm') : null,
        afternoonEndTime: config.afternoonShift?.endTime ? dayjs(config.afternoonShift.endTime, 'HH:mm') : null,
        afternoonActive: config.afternoonShift?.isActive || false,
        eveningStartTime: config.eveningShift?.startTime ? dayjs(config.eveningShift.startTime, 'HH:mm') : null,
        eveningEndTime: config.eveningShift?.endTime ? dayjs(config.eveningShift.endTime, 'HH:mm') : null,
        eveningActive: config.eveningShift?.isActive || false,
      };
      form.setFieldsValue(formData);
      
      // Reset switch states
      setSwitchStates({
        morningActive: config.morningShift?.isActive || false,
        afternoonActive: config.afternoonShift?.isActive || false,
        eveningActive: config.eveningShift?.isActive || false,
      });
    }
  };

  const handleSwitchChange = (shiftName, checked) => {
    const newStates = { ...switchStates };
    newStates[shiftName] = checked;
    setSwitchStates(newStates);
    
    // Update form value
    form.setFieldValue(shiftName, checked);
  };

  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          morningActive: true,
          afternoonActive: true,
          eveningActive: true,
          unitDuration: 15,
          maxBookingDays: 30
        }}
      >
        <Title level={4}>
          <ClockCircleOutlined style={{ marginRight: '8px' }} />
          Cấu hình Ca làm việc
        </Title>
        
        <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
          Thiết lập thời gian và cấu hình cho các ca làm việc trong hệ thống
        </Text>

        {/* Ca Sáng */}
        <Card size="small" style={{ marginBottom: '16px' }}>
          <Row gutter={16} align="middle">
            <Col span={4}>
              <Text strong>Ca Sáng</Text>
            </Col>
            <Col span={7}>
              <Form.Item 
                name="morningStartTime" 
                label="Giờ bắt đầu"
                rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu' }]}
              >
                <TimePicker 
                  format="HH:mm" 
                  style={{ width: '100%' }}
                  placeholder="Chọn giờ"
                />
              </Form.Item>
            </Col>
            <Col span={7}>
              <Form.Item 
                name="morningEndTime" 
                label="Giờ kết thúc"
                rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc' }]}
              >
                <TimePicker 
                  format="HH:mm" 
                  style={{ width: '100%' }}
                  placeholder="Chọn giờ"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item 
                name="morningActive" 
                label="Trạng thái"
                valuePropName="checked"
              >
                <Popconfirm
                  title={switchStates.morningActive ? "Tắt ca sáng" : "Bật ca sáng"}
                  description={switchStates.morningActive 
                    ? "Bạn có chắc chắn muốn tắt ca sáng? Điều này sẽ ảnh hưởng đến lịch làm việc."
                    : "Bạn có chắc chắn muốn bật ca sáng?"
                  }
                  onConfirm={() => handleSwitchChange('morningActive', !switchStates.morningActive)}
                  okText="Xác nhận"
                  cancelText="Hủy"
                >
                  <Switch 
                    checked={switchStates.morningActive}
                    checkedChildren="Bật" 
                    unCheckedChildren="Tắt" 
                  />
                </Popconfirm>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Ca Chiều */}
        <Card size="small" style={{ marginBottom: '16px' }}>
          <Row gutter={16} align="middle">
            <Col span={4}>
              <Text strong>Ca Chiều</Text>
            </Col>
            <Col span={7}>
              <Form.Item 
                name="afternoonStartTime" 
                label="Giờ bắt đầu"
                rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu' }]}
              >
                <TimePicker 
                  format="HH:mm" 
                  style={{ width: '100%' }}
                  placeholder="Chọn giờ"
                />
              </Form.Item>
            </Col>
            <Col span={7}>
              <Form.Item 
                name="afternoonEndTime" 
                label="Giờ kết thúc"
                rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc' }]}
              >
                <TimePicker 
                  format="HH:mm" 
                  style={{ width: '100%' }}
                  placeholder="Chọn giờ"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item 
                name="afternoonActive" 
                label="Trạng thái"
                valuePropName="checked"
              >
                <Popconfirm
                  title={switchStates.afternoonActive ? "Tắt ca chiều" : "Bật ca chiều"}
                  description={switchStates.afternoonActive 
                    ? "Bạn có chắc chắn muốn tắt ca chiều? Điều này sẽ ảnh hưởng đến lịch làm việc."
                    : "Bạn có chắc chắn muốn bật ca chiều?"
                  }
                  onConfirm={() => handleSwitchChange('afternoonActive', !switchStates.afternoonActive)}
                  okText="Xác nhận"
                  cancelText="Hủy"
                >
                  <Switch 
                    checked={switchStates.afternoonActive}
                    checkedChildren="Bật" 
                    unCheckedChildren="Tắt" 
                  />
                </Popconfirm>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Ca Tối */}
        <Card size="small" style={{ marginBottom: '24px' }}>
          <Row gutter={16} align="middle">
            <Col span={4}>
              <Text strong>Ca Tối</Text>
            </Col>
            <Col span={7}>
              <Form.Item 
                name="eveningStartTime" 
                label="Giờ bắt đầu"
                rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu' }]}
              >
                <TimePicker 
                  format="HH:mm" 
                  style={{ width: '100%' }}
                  placeholder="Chọn giờ"
                />
              </Form.Item>
            </Col>
            <Col span={7}>
              <Form.Item 
                name="eveningEndTime" 
                label="Giờ kết thúc"
                rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc' }]}
              >
                <TimePicker 
                  format="HH:mm" 
                  style={{ width: '100%' }}
                  placeholder="Chọn giờ"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item 
                name="eveningActive" 
                label="Trạng thái"
                valuePropName="checked"
              >
                <Popconfirm
                  title={switchStates.eveningActive ? "Tắt ca tối" : "Bật ca tối"}
                  description={switchStates.eveningActive 
                    ? "Bạn có chắc chắn muốn tắt ca tối? Điều này sẽ ảnh hưởng đến lịch làm việc."
                    : "Bạn có chắc chắn muốn bật ca tối?"
                  }
                  onConfirm={() => handleSwitchChange('eveningActive', !switchStates.eveningActive)}
                  okText="Xác nhận"
                  cancelText="Hủy"
                >
                  <Switch 
                    checked={switchStates.eveningActive}
                    checkedChildren="Bật" 
                    unCheckedChildren="Tắt" 
                  />
                </Popconfirm>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* Cấu hình khác */}
        <Title level={5}>Cấu hình khác</Title>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="unitDuration" 
              label="Thời gian mỗi slot (phút)"
              rules={[
                { required: true, message: 'Vui lòng nhập thời gian slot' },
                { type: 'number', min: 5, max: 180, message: 'Thời gian phải từ 5-180 phút' }
              ]}
            >
              <InputNumber 
                min={5} 
                max={180} 
                style={{ width: '100%' }}
                placeholder="Nhập số phút"
                addonAfter="phút"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              name="maxBookingDays" 
              label="Số ngày tối đa để hiển thị lịch cho khách hàng đặt"
              rules={[
                { required: true, message: 'Vui lòng nhập số ngày' },
                { type: 'number', min: 1, max: 365, message: 'Số ngày phải từ 1-365' }
              ]}
            >
              <InputNumber 
                min={1} 
                max={365} 
                style={{ width: '100%' }}
                placeholder="Nhập số ngày"
                addonAfter="ngày"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Space>
          <Button 
            type="primary" 
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={saving}
            size="large"
          >
            Lưu cấu hình
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleReset}
            size="large"
          >
            Hủy bỏ
          </Button>
        </Space>
      </Form>
    </Card>
  );
};

export default ScheduleConfigForm;

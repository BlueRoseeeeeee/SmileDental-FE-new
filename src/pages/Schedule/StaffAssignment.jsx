/**
 * @author: HoTram
 * Staff Assignment Component - Phân công nhân sự vào slots
 */
import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Select, Button, Space, Typography, Row, Col, 
  Divider, Alert, Spin, notification, Checkbox, InputNumber
} from 'antd';
import { 
  TeamOutlined, UserOutlined, CalendarOutlined, HomeOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { roomService } from '../../services';
import { userService } from '../../services';
import slotService from '../../services/slotService.js';
import { toast } from '../../services/toastService.js';
import './StaffAssignment.css';

const { Title, Text } = Typography;
const { Option } = Select;

const StaffAssignment = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [rooms, setRooms] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [nurses, setNurses] = useState([]);

  // Form states
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [availableSubRooms, setAvailableSubRooms] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [roomsRes, staffRes] = await Promise.all([
        roomService.getRooms(1, 100),
        userService.getAllStaff(1, 100)
      ]);

      if (roomsRes?.success) {
        setRooms(roomsRes.data?.rooms || []);
      }

      if (staffRes?.success) {
        const allStaff = staffRes.data?.users || [];
        setDentists(allStaff.filter(user => user.role === 'dentist' || user.role === 'doctor'));
        setNurses(allStaff.filter(user => user.role === 'nurse'));
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Không thể tải dữ liệu ban đầu');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomChange = (roomId) => {
    const room = rooms.find(r => r._id === roomId);
    setSelectedRoom(room);
    
    if (room?.hasSubRooms && room?.subRooms?.length > 0) {
      setAvailableSubRooms(room.subRooms);
    } else {
      setAvailableSubRooms([]);
      form.setFieldsValue({ subRoomId: undefined });
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const requestData = {
        roomId: values.roomId,
        quarter: values.quarter,
        year: values.year,
        shifts: values.shifts,
        dentistIds: values.dentistIds,
        nurseIds: values.nurseIds
      };

      // Thêm subRoomId nếu room has subrooms
      if (selectedRoom?.hasSubRooms && values.subRoomId) {
        requestData.subRoomId = values.subRoomId;
      }

      const response = await slotService.assignStaffToSlots(requestData);

      if (response.success) {
        notification.success({
          message: 'Phân công nhân sự thành công!',
          description: response.data.message,
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        });
        
        // Reset form
        form.resetFields();
        setSelectedRoom(null);
        setAvailableSubRooms([]);
      }
    } catch (error) {
      console.error('Error assigning staff:', error);
      notification.error({
        message: 'Lỗi phân công nhân sự',
        description: error.response?.data?.message || 'Có lỗi xảy ra khi phân công nhân sự',
        icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="staff-assignment">
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={3}>
            <TeamOutlined style={{ marginRight: 8 }} />
            Phân Công Nhân Sự
          </Title>
          <Text type="secondary">
            Phân công bác sĩ và y tá vào các slot làm việc theo quý
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Row gutter={24}>
            {/* Room Selection */}
            <Col span={12}>
              <Form.Item
                label="Chọn phòng"
                name="roomId"
                rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}
              >
                <Select
                  placeholder="Chọn phòng"
                  onChange={handleRoomChange}
                  showSearch
                  optionFilterProp="children"
                >
                  {rooms.map(room => (
                    <Option key={room._id} value={room._id}>
                      <HomeOutlined style={{ marginRight: 8 }} />
                      {room.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* SubRoom Selection (if applicable) */}
            {selectedRoom?.hasSubRooms && availableSubRooms.length > 0 && (
              <Col span={12}>
                <Form.Item
                  label="Chọn phòng con"
                  name="subRoomId"
                  rules={[{ required: true, message: 'Vui lòng chọn phòng con' }]}
                >
                  <Select placeholder="Chọn phòng con">
                    {availableSubRooms.map(subRoom => (
                      <Option key={subRoom._id} value={subRoom._id}>
                        {subRoom.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>

          <Row gutter={24}>
            {/* Quarter Selection */}
            <Col span={8}>
              <Form.Item
                label="Quý"
                name="quarter"
                rules={[{ required: true, message: 'Vui lòng chọn quý' }]}
              >
                <Select placeholder="Chọn quý">
                  <Option value={1}>Quý 1</Option>
                  <Option value={2}>Quý 2</Option>
                  <Option value={3}>Quý 3</Option>
                  <Option value={4}>Quý 4</Option>
                </Select>
              </Form.Item>
            </Col>

            {/* Year Selection */}
            <Col span={8}>
              <Form.Item
                label="Năm"
                name="year"
                rules={[{ required: true, message: 'Vui lòng chọn năm' }]}
              >
                <InputNumber
                  placeholder="Năm"
                  min={2024}
                  max={2030}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            {/* Shifts Selection */}
            <Col span={8}>
              <Form.Item
                label="Ca làm việc"
                name="shifts"
                rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 ca' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Chọn ca làm việc"
                  allowClear
                >
                  <Option value="Ca Sáng">Ca Sáng</Option>
                  <Option value="Ca Chiều">Ca Chiều</Option>
                  <Option value="Ca Tối">Ca Tối</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Row gutter={24}>
            {/* Dentist Selection */}
            <Col span={12}>
              <Form.Item
                label="Bác sĩ"
                name="dentistIds"
                rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 bác sĩ' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Chọn bác sĩ"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {dentists.map(dentist => (
                    <Option key={dentist._id} value={dentist._id}>
                      <UserOutlined style={{ marginRight: 8 }} />
                      {dentist.firstName} {dentist.lastName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Nurse Selection */}
            <Col span={12}>
              <Form.Item
                label="Y tá"
                name="nurseIds"
                rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 y tá' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Chọn y tá"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {nurses.map(nurse => (
                    <Option key={nurse._id} value={nurse._id}>
                      <UserOutlined style={{ marginRight: 8 }} />
                      {nurse.firstName} {nurse.lastName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Info Alert */}
          <Alert
            message="Lưu ý"
            description="Hệ thống sẽ tự động phân công nhân sự vào các slot còn trống. Các slot đã được phân công sẽ không bị ghi đè."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          {/* Submit Button */}
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
                icon={<TeamOutlined />}
              >
                Phân Công Nhân Sự
              </Button>
              <Button
                onClick={() => {
                  form.resetFields();
                  setSelectedRoom(null);
                  setAvailableSubRooms([]);
                }}
                size="large"
              >
                Đặt lại
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default StaffAssignment;
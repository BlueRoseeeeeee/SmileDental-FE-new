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
  const [availableQuarters, setAvailableQuarters] = useState([]);

  // Form states
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [availableSubRooms, setAvailableSubRooms] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRooms = async () => {
    try {
      const roomsRes = await roomService.getRooms(1, 100);
      
      // Room API không có field success, chỉ cần check có data
      if (roomsRes?.rooms && Array.isArray(roomsRes.rooms)) {
        // Lọc chỉ những phòng có isActive = true
        const activeRooms = roomsRes.rooms.filter(room => room.isActive === true);
        setRooms(activeRooms);
      } else {
        toast.error('Dữ liệu phòng không hợp lệ');
      }
    } catch (error) {
      toast.error(`Lỗi tải phòng: ${error.response?.status || error.message}`);
    }
  };

  const loadStaff = async () => {
    try {
      const staffRes = await userService.getAllStaff(1, 1000);
      
      if (staffRes?.success) {
        const allStaff = staffRes.users || [];
        
        const dentistList = allStaff.filter(user => {
          return (user.role === 'dentist') && user.isActive === true;
        });
        
        const nurseList = allStaff.filter(user => {
          return user.role === 'nurse' && user.isActive === true;
        });
        
        setDentists(dentistList);
        setNurses(nurseList);
      } else {
        toast.error('API nhân viên trả về không thành công');
      }
    } catch (error) {
      toast.error(`Lỗi tải nhân viên: ${error.response?.status || error.message}`);
    }
  };

  const loadAvailableQuarters = async () => {
    try {
      const quartersRes = await slotService.getAvailableQuartersYears();
      
      if (quartersRes?.success && quartersRes?.data?.availableOptions) {
        setAvailableQuarters(quartersRes.data.availableOptions);
        
        // Set default values to current quarter
        if (quartersRes.data.currentQuarter) {
          const current = quartersRes.data.currentQuarter;
          form.setFieldsValue({
            quarter: current.quarter,
            year: current.year,
            quarterYear: `${current.quarter}-${current.year}`
          });
        }
      } else {
        toast.error('Dữ liệu quý không hợp lệ');
      }
    } catch (error) {
      toast.error(`Lỗi tải danh sách quý: ${error.response?.status || error.message}`);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRooms(),
        loadStaff(),
        loadAvailableQuarters()
      ]);
    } catch (error) {
      // Error handling is done in individual functions
    } finally {
      setLoading(false);
    }
  };

  const handleRoomChange = (roomId) => {
    const room = rooms.find(r => r._id === roomId);
    setSelectedRoom(room);
    
    // Clear staff selections when changing room type to avoid single/multiple mode conflicts
    form.setFieldsValue({ 
      subRoomId: undefined,
      dentistIds: undefined,
      nurseIds: undefined
    });
    
    if (room?.hasSubRooms && room?.subRooms?.length > 0) {
      // Lọc chỉ những subroom có isActive = true
      const activeSubRooms = room.subRooms.filter(subRoom => subRoom.isActive === true);
      setAvailableSubRooms(activeSubRooms);
    } else {
      setAvailableSubRooms([]);
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
        // Đảm bảo dentistIds và nurseIds luôn là array
        dentistIds: Array.isArray(values.dentistIds) ? values.dentistIds : [values.dentistIds].filter(Boolean),
        nurseIds: Array.isArray(values.nurseIds) ? values.nurseIds : [values.nurseIds].filter(Boolean)
      };

      // Thêm subRoomId nếu room has subrooms
      if (selectedRoom?.hasSubRooms && values.subRoomId) {
        requestData.subRoomId = values.subRoomId;
      }

      const response = await slotService.assignStaffToSlots(requestData);

      if (response.success) {
        // Force notification hiển thị  
        notification.destroy(); // Clear existing notifications
        notification.success({
          message: 'Phân công nhân sự thành công!',
          description: response.data?.message || 'Phân công nhân sự đã được thực hiện thành công',
          duration: 5,
          placement: 'topRight',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        });

        // Backup toast service
        toast.success(response.data?.message || 'Phân công nhân sự thành công!');
        
        // Reset form
        form.resetFields();
        setSelectedRoom(null);
        setAvailableSubRooms([]);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      
      // Force notification hiển thị
      notification.destroy(); // Clear existing notifications first
      notification.error({
        message: 'Lỗi phân công nhân sự',
        description: errorMessage || 'Có lỗi xảy ra khi phân công nhân sự',
        duration: 6,
        placement: 'topRight',
        icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
      });

      // Backup toast service nếu notification không hoạt động
      toast.error(errorMessage || 'Có lỗi xảy ra khi phân công nhân sự');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="staff-assignment">
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Đang tải dữ liệu...</div>
          </div>
        </Card>
      </div>
    );
  }

  // Show error state with retry button if no data loaded
  if (!loading && rooms.length === 0 && dentists.length === 0 && nurses.length === 0) {
    return (
      <div className="staff-assignment">
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Alert
              message="Không thể tải dữ liệu"
              description="Không thể kết nối đến server. Kiểm tra console để xem chi tiết lỗi."
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
            />
            <Button 
              type="primary" 
              onClick={loadInitialData}
              icon={<TeamOutlined />}
            >
              Thử lại
            </Button>
          </div>
        </Card>
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
            {/* Quarter and Year Selection - Combined */}
            <Col span={16}>
              <Form.Item
                label="Quý và Năm"
                name="quarterYear"
                rules={[{ required: true, message: 'Vui lòng chọn quý và năm' }]}
              >
                <Select 
                  placeholder="Chọn quý và năm"
                  onChange={(value) => {
                    const [quarter, year] = value.split('-');
                    form.setFieldsValue({
                      quarter: parseInt(quarter),
                      year: parseInt(year)
                    });
                  }}
                  showSearch
                  optionFilterProp="children"
                >
                  {availableQuarters.map(option => (
                    <Option 
                      key={`${option.quarter}-${option.year}`} 
                      value={`${option.quarter}-${option.year}`}
                    >
                      <CalendarOutlined style={{ marginRight: 8 }} />
                      {option.label} 
                      {option.isCurrent}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Hidden fields for quarter and year values */}
            <Form.Item name="quarter" hidden>
              <InputNumber />
            </Form.Item>
            
            <Form.Item name="year" hidden>
              <InputNumber />
            </Form.Item>

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
                  <Option value="Ca Sáng"> Ca Sáng</Option>
                  <Option value="Ca Chiều"> Ca Chiều</Option>
                  <Option value="Ca Tối">Ca Tối</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          <Row >
          <Col span={24}>
          <Alert
            message="Lưu ý phân công nhân sự"
            description={
              selectedRoom?.hasSubRooms 
                ? "Phòng có buồng: Mỗi buồng chỉ được phân công 1 bác sĩ và 1 y tá. Hệ thống sẽ tự động phân bổ vào các slot còn trống."
                : "Phòng đơn: Có thể phân công nhiều bác sĩ và y tá cùng lúc theo cấu hình tối đa của phòng. Các slot đã được phân công sẽ không bị ghi đè."
            }
            type="info"
            showIcon
          />
          </Col>
          </Row>
          <Row gutter={24}>
            {/* Dentist Selection */}
            <Col span={12}>
              <Form.Item
                label={`Nha sĩ`}
                name="dentistIds"
                rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 bác sĩ' }]}
              >
                <Select
                  mode={selectedRoom?.hasSubRooms ? undefined : "multiple"}
                  placeholder="Chọn nha sĩ"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {dentists.map(dentist => (
                    <Option key={dentist._id} value={dentist._id}>
                      <UserOutlined style={{ marginRight: 8 }} />
                      {dentist.employeeCode || 'N/A'} | {dentist.fullName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Nurse Selection */}
            <Col span={12}>
              <Form.Item
                label={`Y tá`}
                name="nurseIds"
                rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 y tá' }]}
              >
                <Select
                  mode={selectedRoom?.hasSubRooms ? undefined : "multiple"}
                  placeholder="Chọn y tá"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {nurses.map(nurse => (
                    <Option key={nurse._id} value={nurse._id}>
                      <UserOutlined style={{ marginRight: 8 }} />
                      {nurse.employeeCode || 'N/A'} | {nurse.fullName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

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
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default StaffAssignment;
/**
 * @author: HoTram
 * Staff Assignment Component - Phân công nhân sự vào slots
 * Hỗ trợ 3 chế độ: Assign (phân công mới), Reassign (phân công lại), Update (cập nhật slot cụ thể)
 */
import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Select, Button, Space, Typography, Row, Col, 
  Divider, Alert, Spin, notification, Input, Tag, DatePicker, Checkbox
} from 'antd';
import { 
  TeamOutlined, UserOutlined, CalendarOutlined, HomeOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, EditOutlined,
  ReloadOutlined, SaveOutlined, InfoCircleOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { roomService } from '../../services';
import { userService } from '../../services';
import slotService from '../../services/slotService.js';
import scheduleConfigService from '../../services/scheduleConfigService.js';
import { toast } from '../../services/toastService.js';
import './StaffAssignment.css';

const { Title, Text } = Typography;
const { Option } = Select;

// Các chế độ phân công
const ASSIGNMENT_MODES = {
  ASSIGN: 'assign',
  REASSIGN: 'reassign',
  UPDATE: 'update'
};

const StaffAssignment = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [rooms, setRooms] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [availableQuarters, setAvailableQuarters] = useState([]);
  const [availableShifts, setAvailableShifts] = useState([]);

  // Form states
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [availableSubRooms, setAvailableSubRooms] = useState([]);
  const [assignmentMode, setAssignmentMode] = useState(ASSIGNMENT_MODES.ASSIGN);
  
  // States cho việc kiểm soát số lượng nhân viên
  const [selectedDentists, setSelectedDentists] = useState([]);
  const [selectedNurses, setSelectedNurses] = useState([]);
  const [maxDentists, setMaxDentists] = useState(1);
  const [maxNurses, setMaxNurses] = useState(1);
  
  // States cho UPDATE mode - slot selection
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);

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

  const loadAvailableShifts = async () => {
    try {
      const configRes = await scheduleConfigService.getConfig();
      
      if (configRes?.success && configRes?.data) {
        const shifts = [];
        const config = configRes.data;
        
        // Lấy các ca từ config và chỉ lấy những ca có isActive = true
        if (config.morningShift?.isActive) {
          shifts.push({
            name: config.morningShift.name,
            value: config.morningShift.name,
            startTime: config.morningShift.startTime,
            endTime: config.morningShift.endTime
          });
        }
        
        if (config.afternoonShift?.isActive) {
          shifts.push({
            name: config.afternoonShift.name,
            value: config.afternoonShift.name,
            startTime: config.afternoonShift.startTime,
            endTime: config.afternoonShift.endTime
          });
        }
        
        if (config.eveningShift?.isActive) {
          shifts.push({
            name: config.eveningShift.name,
            value: config.eveningShift.name,
            startTime: config.eveningShift.startTime,
            endTime: config.eveningShift.endTime
          });
        }
        
        setAvailableShifts(shifts);
      } else {
        toast.error('Dữ liệu cấu hình ca làm việc không hợp lệ');
      }
    } catch (error) {
      toast.error(`Lỗi tải cấu hình ca làm việc: ${error.response?.status || error.message}`);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRooms(),
        loadStaff(),
        loadAvailableQuarters(),
        loadAvailableShifts()
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
    
    console.log('DEBUG Room selected:', room);
    
    // Reset selections
    form.setFieldsValue({ 
      subRoomId: undefined,
      dentistIds: undefined,
      nurseIds: undefined,
      slotIds: undefined
    });
    setSelectedDentists([]);
    setSelectedNurses([]);
    setAvailableSlots([]);
    setSelectedSlots([]);
    
    if (room?.hasSubRooms && room?.subRooms?.length > 0) {
      // Phòng có buồng: chỉ cho chọn 1 nha sĩ và 1 y tá
      const activeSubRooms = room.subRooms.filter(subRoom => subRoom.isActive === true);
      console.log('DEBUG Active SubRooms:', activeSubRooms);
      setAvailableSubRooms(activeSubRooms);
      setMaxDentists(1);
      setMaxNurses(1);
    } else {
      // Phòng đơn: lấy max từ cấu hình phòng
      setAvailableSubRooms([]);
      setMaxDentists(room?.maxDoctors || 1);
      setMaxNurses(room?.maxNurses || 1);
    }
  };

  const handleAssignmentModeChange = (mode) => {
    setAssignmentMode(mode);
    // Reset form khi đổi chế độ
    form.resetFields();
    setSelectedRoom(null);
    setAvailableSubRooms([]);
    setSelectedDentists([]);
    setSelectedNurses([]);
    setAvailableSlots([]);
    setSelectedSlots([]);
  };

  const handleDentistChange = (values) => {
    const valueArray = Array.isArray(values) ? values : (values ? [values] : []);
    
    // Kiểm tra giới hạn
    if (valueArray.length > maxDentists) {
      toast.warning(`Chỉ được chọn tối đa ${maxDentists} nha sĩ cho phòng này`);
      return;
    }
    
    setSelectedDentists(valueArray);
    form.setFieldsValue({ dentistIds: valueArray });
  };

  const handleNurseChange = (values) => {
    const valueArray = Array.isArray(values) ? values : (values ? [values] : []);
    
    // Kiểm tra giới hạn
    if (valueArray.length > maxNurses) {
      toast.warning(`Chỉ được chọn tối đa ${maxNurses} y tá cho phòng này`);
      return;
    }
    
    setSelectedNurses(valueArray);
    form.setFieldsValue({ nurseIds: valueArray });
  };

  // Handler cho UPDATE mode - load slots theo room, date, shift
  const handleLoadSlots = async () => {
    const roomId = form.getFieldValue('roomId');
    const subRoomId = form.getFieldValue('subRoomId');
    const date = form.getFieldValue('date');
    const shiftName = form.getFieldValue('shiftName');

    console.log('DEBUG Form values:', { roomId, subRoomId, date, shiftName });
    console.log('DEBUG subRoomId type:', typeof subRoomId, 'value:', subRoomId);

    setLoadingSlots(true);
    try {
      const requestParams = {
        roomId,
        date: dayjs(date).format('YYYY-MM-DD'),
        shiftName
      };
      
      // Luôn thêm subRoomId vào params (backend sẽ xử lý nếu null/undefined)
      if (subRoomId !== undefined && subRoomId !== null && subRoomId !== '') {
        requestParams.subRoomId = subRoomId;
      }
      
      console.log('DEBUG Request params:', requestParams);
      
      const response = await slotService.getSlotsByShiftAndDate(requestParams);
      
      console.log('DEBUG API Response:', response);

      if (response?.success && response?.data) {
        const slots = response.data.slots || [];
        console.log('DEBUG Slots found:', slots.length);
        setAvailableSlots(slots);
        
        if (slots.length === 0) {
          toast.warning('Không tìm thấy slot nào cho lựa chọn này');
        } else {
          toast.success(`Tìm thấy ${slots.length} slot(s)`);
        }
      } else {
        toast.error('Không thể tải danh sách slot');
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('DEBUG Error loading slots:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Lỗi không xác định';
      toast.error(`Lỗi tải slots: ${errorMsg}`);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSlotSelectionChange = (slotIds) => {
    setSelectedSlots(slotIds);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      let response;
      
      // Chế độ UPDATE: gọi API updateSlotStaff
      if (assignmentMode === ASSIGNMENT_MODES.UPDATE) {
        // Validate có chọn slot không
        if (!selectedSlots || selectedSlots.length === 0) {
          toast.error('Vui lòng chọn ít nhất 1 slot để cập nhật');
          setSubmitting(false);
          return;
        }

        const requestData = {
          slotIds: selectedSlots,
          dentistId: selectedDentists[0] || null,
          nurseId: selectedNurses[0] || null
        };

        // Ít nhất phải có 1 trong 2
        if (!requestData.dentistId && !requestData.nurseId) {
          toast.error('Phải chọn ít nhất 1 nha sĩ hoặc y tá để cập nhật');
          setSubmitting(false);
          return;
        }

        response = await slotService.updateSlotStaff(requestData);
      } 
      // Chế độ ASSIGN hoặc REASSIGN
      else {
        const requestData = {
          roomId: values.roomId,
          quarter: values.quarter,
          year: values.year,
          shifts: values.shifts,
          dentistIds: selectedDentists,
          nurseIds: selectedNurses
        };

        // Thêm subRoomId nếu room has subrooms
        if (selectedRoom?.hasSubRooms && values.subRoomId) {
          requestData.subRoomId = values.subRoomId;
        }

        if (assignmentMode === ASSIGNMENT_MODES.ASSIGN) {
          response = await slotService.assignStaffToSlots(requestData);
        } else {
          response = await slotService.reassignStaffToSlots(requestData);
        }
      }

      if (response.success) {
        notification.destroy();
        notification.success({
          message: 'Thành công!',
          description: response.data?.message || response.message || 'Đã thực hiện thành công',
          duration: 5,
          placement: 'topRight',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        });

        toast.success(response.data?.message || response.message || 'Thành công!');
        
        // Reset form
        form.resetFields();
        setSelectedRoom(null);
        setAvailableSubRooms([]);
        setSelectedDentists([]);
        setSelectedNurses([]);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      
      notification.destroy();
      notification.error({
        message: 'Lỗi thao tác',
        description: errorMessage || 'Có lỗi xảy ra',
        duration: 6,
        placement: 'topRight',
        icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
      });

      toast.error(errorMessage || 'Có lỗi xảy ra');
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
            Quản Lý Phân Công Nhân Sự
          </Title>
          <Text type="secondary">
            Phân công, phân công lại hoặc cập nhật bác sĩ và y tá vào các slot làm việc
          </Text>
        </div>

        {/* Chọn chế độ phân công */}
        <Card 
          size="small" 
          style={{ marginBottom: 24, background: '#f8f9fa', borderLeft: '4px solid #1890ff' }}
        >
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Text strong style={{ fontSize: '15px' }}>
                <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                Chế độ thao tác:
              </Text>
            </Col>
            <Col span={18}>
              <Select
                value={assignmentMode}
                onChange={handleAssignmentModeChange}
                style={{ width: '100%' }}
                size="large"
              >
                <Option value={ASSIGNMENT_MODES.ASSIGN}>
                  <SaveOutlined style={{ marginRight: 8 }} />
                  Phân công mới (Assign) - Phân công nhân sự vào slot trống theo quý
                </Option>
                <Option value={ASSIGNMENT_MODES.REASSIGN}>
                  <ReloadOutlined style={{ marginRight: 8 }} />
                  Phân công lại (Reassign) - Thay đổi nhân sự cho slot đã có người theo quý
                </Option>
                <Option value={ASSIGNMENT_MODES.UPDATE}>
                  <EditOutlined style={{ marginRight: 8 }} />
                  Cập nhật slot (Update) - Cập nhật nhân sự cho slot cụ thể (cần Slot ID)
                </Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Mô tả chế độ được chọn */}
        <Alert
          message={
            assignmentMode === ASSIGNMENT_MODES.ASSIGN 
              ? "Chế độ: Phân công mới (Assign Staff)" 
              : assignmentMode === ASSIGNMENT_MODES.REASSIGN
              ? "Chế độ: Phân công lại (Reassign Staff)"
              : "Chế độ: Cập nhật slot (Update Staff)"
          }
          description={
            assignmentMode === ASSIGNMENT_MODES.ASSIGN 
              ? "Phân công nhân sự vào các slot TRỐNG trong quý được chọn. Slot đã có người sẽ được giữ nguyên."
              : assignmentMode === ASSIGNMENT_MODES.REASSIGN
              ? "Thay đổi nhân sự cho các slot ĐÃ CÓ NGƯỜI trong quý được chọn. Chỉ áp dụng cho slot đã được phân công."
              : "Cập nhật nhân sự cho một hoặc nhiều slot CỤ THỂ. Cần nhập Slot ID. Thích hợp cho chỉnh sửa từng slot riêng lẻ."
          }
          type={
            assignmentMode === ASSIGNMENT_MODES.ASSIGN 
              ? "info" 
              : assignmentMode === ASSIGNMENT_MODES.REASSIGN 
              ? "warning"
              : "success"
          }
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          {/* Form cho UPDATE MODE: chọn slot qua UI */}
          {assignmentMode === ASSIGNMENT_MODES.UPDATE && (
            <>
              <Row gutter={24}>
                {/* Room Selection */}
                <Col span={12}>
                  <Form.Item
                    label={
                      <span>
                        <HomeOutlined style={{ marginRight: 8 }} />
                        Chọn phòng
                      </span>
                    }
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
                          {room.name}
                          {room.hasSubRooms && (
                            <Tag color="blue" style={{ marginLeft: 8 }}>
                              {room.subRooms?.length || 0} buồng
                            </Tag>
                          )}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                {/* SubRoom Selection (if applicable) */}
                {selectedRoom?.hasSubRooms && availableSubRooms.length > 0 && (
                  <Col span={12}>
                    <Form.Item
                      label={
                        <span>
                          <HomeOutlined style={{ marginRight: 8 }} />
                          Chọn buồng con
                        </span>
                      }
                      name="subRoomId"
                    >
                      <Select
                        placeholder="Chọn buồng con (tùy chọn)"
                        allowClear
                      >
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
                {/* Date Selection */}
                <Col span={12}>
                  <Form.Item
                    label={
                      <span>
                        <CalendarOutlined style={{ marginRight: 8 }} />
                        Chọn ngày
                      </span>
                    }
                    name="date"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                      placeholder="Chọn ngày"
                      disabledDate={(current) => {
                        // Không cho chọn ngày quá khứ (trước hôm nay)
                        return current && current < dayjs().startOf('day');
                      }}
                    />
                  </Form.Item>
                </Col>

                {/* Shift Selection */}
                <Col span={12}>
                  <Form.Item
                    label={
                      <span>
                        <ClockCircleOutlined style={{ marginRight: 8 }} />
                        Chọn ca làm việc
                      </span>
                    }
                    name="shiftName"
                    rules={[{ required: true, message: 'Vui lòng chọn ca' }]}
                  >
                    <Select placeholder="Chọn ca làm việc">
                      {availableShifts.map(shift => (
                        <Option key={shift.value} value={shift.value}>
                          {shift.name} ({shift.startTime} - {shift.endTime})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={24}>
                  <Button
                    type="primary"
                    icon={<CalendarOutlined />}
                    onClick={handleLoadSlots}
                    loading={loadingSlots}
                    block
                    style={{ marginBottom: 16 }}
                  >
                    Tải danh sách Slot
                  </Button>
                </Col>
              </Row>

              {/* Slot Selection */}
              {availableSlots.length > 0 && (
                <>
                  <Alert
                    message={`Tìm thấy ${availableSlots.length} slot(s)`}
                    description="Chọn các slot bạn muốn cập nhật nhân sự"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  
                  <Form.Item
                    label={
                      <Space>
                        <CheckCircleOutlined />
                        <span>Chọn Slot(s) - Đã chọn: {selectedSlots.length}/{availableSlots.length}</span>
                        <Button 
                          type="link" 
                          size="small"
                          onClick={() => {
                            const allSlotIds = availableSlots.map(slot => slot.slotId);
                            setSelectedSlots(allSlotIds);
                          }}
                        >
                          Chọn tất cả
                        </Button>
                        <Button 
                          type="link" 
                          size="small"
                          onClick={() => setSelectedSlots([])}
                          danger
                        >
                          Bỏ chọn tất cả
                        </Button>
                      </Space>
                    }
                  >
                    <Checkbox.Group
                      style={{ width: '100%' }}
                      value={selectedSlots}
                      onChange={handleSlotSelectionChange}
                    >
                      <Row gutter={[8, 8]}>
                        {availableSlots.map(slot => (
                          <Col span={24} key={slot.slotId}>
                            <Checkbox value={slot.slotId} disabled={!slot.canUpdate}>
                              <Space direction="vertical" size={0}>
                                <Text strong>
                                  {slot.startTimeVN} - {slot.endTimeVN}
                                  {slot.isBooked && (
                                    <Tag color="red" style={{ marginLeft: 8 }}>Đã đặt</Tag>
                                  )}
                                  {slot.status === 'assigned' && !slot.isBooked && (
                                    <Tag color="green" style={{ marginLeft: 8 }}>Đã phân công</Tag>
                                  )}
                                  {slot.status === 'not_assigned' && (
                                    <Tag color="orange" style={{ marginLeft: 8 }}>Chưa phân công</Tag>
                                  )}
                                  {!slot.canUpdate && (
                                    <Tag color="default" style={{ marginLeft: 8 }}>Không thể cập nhật</Tag>
                                  )}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Bác sĩ: {slot.dentist?.name || 'Chưa có'}
                                  {' | '}
                                  Y tá: {slot.nurse?.name || 'Chưa có'}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  Slot ID: {slot.slotId}
                                </Text>
                              </Space>
                            </Checkbox>
                          </Col>
                        ))}
                      </Row>
                    </Checkbox.Group>
                  </Form.Item>
                </>
              )}

              <Divider />

              <Alert
                message="Chọn nhân sự mới"
                description="Chọn 1 nha sĩ HOẶC 1 y tá HOẶC cả hai để cập nhật cho slot(s) đã chọn"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span>
                        <UserOutlined style={{ marginRight: 8 }} />
                        Nha sĩ mới (tùy chọn)
                      </span>
                    }
                    name="dentistIds"
                  >
                    <Select
                      placeholder="Chọn nha sĩ"
                      showSearch
                      optionFilterProp="children"
                      allowClear
                      onChange={(value) => handleDentistChange(value ? [value] : [])}
                    >
                      {dentists.map(dentist => (
                        <Option key={dentist._id} value={dentist._id}>
                          {dentist.employeeCode || 'N/A'} | {dentist.fullName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label={
                      <span>
                        <UserOutlined style={{ marginRight: 8 }} />
                        Y tá mới (tùy chọn)
                      </span>
                    }
                    name="nurseIds"
                  >
                    <Select
                      placeholder="Chọn y tá"
                      showSearch
                      optionFilterProp="children"
                      allowClear
                      onChange={(value) => handleNurseChange(value ? [value] : [])}
                    >
                      {nurses.map(nurse => (
                        <Option key={nurse._id} value={nurse._id}>
                          {nurse.employeeCode || 'N/A'} | {nurse.fullName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Form cho ASSIGN và REASSIGN MODE */}
          {(assignmentMode === ASSIGNMENT_MODES.ASSIGN || assignmentMode === ASSIGNMENT_MODES.REASSIGN) && (
            <>
              <Row gutter={24}>
                {/* Room Selection */}
                <Col span={12}>
                  <Form.Item
                    label={
                      <span>
                        <HomeOutlined style={{ marginRight: 8 }} />
                        Chọn phòng
                      </span>
                    }
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
                          {room.name}
                          {room.hasSubRooms && (
                            <Tag color="blue" style={{ marginLeft: 8 }}>
                              {room.subRooms?.length || 0} buồng
                            </Tag>
                          )}
                          {!room.hasSubRooms && (
                            <Tag color="green" style={{ marginLeft: 8 }}>
                              Max: {room.maxDoctors}BS, {room.maxNurses}YT
                            </Tag>
                          )}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                {/* SubRoom Selection (if applicable) */}
                {selectedRoom?.hasSubRooms && availableSubRooms.length > 0 && (
                  <Col span={12}>
                    <Form.Item
                      label={
                        <span>
                          <HomeOutlined style={{ marginRight: 8 }} />
                          Chọn phòng con
                        </span>
                      }
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

              {/* Hiển thị thông tin giới hạn phòng */}
              {selectedRoom && (
                <Alert
                  message="Giới hạn phân công"
                  description={
                    selectedRoom.hasSubRooms 
                      ? `Phòng có buồng: Mỗi buồng chỉ được chọn 1 nha sĩ và 1 y tá. Hệ thống sẽ tự động phân bổ.`
                      : `Phòng đơn: Tối đa ${maxDentists} nha sĩ và ${maxNurses} y tá. Đã chọn: ${selectedDentists.length}/${maxDentists} nha sĩ, ${selectedNurses.length}/${maxNurses} y tá.`
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Row gutter={24}>
                {/* Quarter and Year Selection */}
                <Col span={12}>
                  <Form.Item
                    label={
                      <span>
                        <CalendarOutlined style={{ marginRight: 8 }} />
                        Quý và Năm
                      </span>
                    }
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
                          {option.label} {option.isCurrent && <Tag color="green">Hiện tại</Tag>}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Form.Item name="quarter" hidden>
                  <Input />
                </Form.Item>
                
                <Form.Item name="year" hidden>
                  <Input />
                </Form.Item>

                {/* Shifts Selection */}
                <Col span={12}>
                  <Form.Item
                    label={
                      <span>
                        <CalendarOutlined style={{ marginRight: 8 }} />
                        Ca làm việc
                      </span>
                    }
                    name="shifts"
                    rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 ca' }]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="Chọn ca làm việc"
                      allowClear
                    >
                      {availableShifts.map(shift => (
                        <Option key={shift.value} value={shift.value}>
                          {shift.name} ({shift.startTime} - {shift.endTime})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              {/* Chọn nhân sự */}
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span>
                        <UserOutlined style={{ marginRight: 8 }} />
                        Nha sĩ {selectedRoom && `(Tối đa: ${maxDentists}, Đã chọn: ${selectedDentists.length})`}
                      </span>
                    }
                    name="dentistIds"
                    rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 nha sĩ' }]}
                  >
                    <Select
                      mode={selectedRoom?.hasSubRooms ? undefined : "multiple"}
                      placeholder="Chọn nha sĩ"
                      showSearch
                      optionFilterProp="children"
                      allowClear
                      value={selectedDentists}
                      onChange={handleDentistChange}
                      maxTagCount="responsive"
                    >
                      {dentists.map(dentist => (
                        <Option 
                          key={dentist._id} 
                          value={dentist._id}
                          disabled={
                            !selectedRoom?.hasSubRooms && 
                            selectedDentists.length >= maxDentists && 
                            !selectedDentists.includes(dentist._id)
                          }
                        >
                          {dentist.employeeCode || 'N/A'} | {dentist.fullName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label={
                      <span>
                        <UserOutlined style={{ marginRight: 8 }} />
                        Y tá {selectedRoom && `(Tối đa: ${maxNurses}, Đã chọn: ${selectedNurses.length})`}
                      </span>
                    }
                    name="nurseIds"
                    rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 y tá' }]}
                  >
                    <Select
                      mode={selectedRoom?.hasSubRooms ? undefined : "multiple"}
                      placeholder="Chọn y tá"
                      showSearch
                      optionFilterProp="children"
                      allowClear
                      value={selectedNurses}
                      onChange={handleNurseChange}
                      maxTagCount="responsive"
                    >
                      {nurses.map(nurse => (
                        <Option 
                          key={nurse._id} 
                          value={nurse._id}
                          disabled={
                            !selectedRoom?.hasSubRooms && 
                            selectedNurses.length >= maxNurses && 
                            !selectedNurses.includes(nurse._id)
                          }
                        >
                          {nurse.employeeCode || 'N/A'} | {nurse.fullName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Submit buttons */}
          <Divider />
          <Form.Item>
            <Space size="large">
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
                icon={
                  assignmentMode === ASSIGNMENT_MODES.ASSIGN 
                    ? <SaveOutlined /> 
                    : assignmentMode === ASSIGNMENT_MODES.REASSIGN 
                    ? <ReloadOutlined />
                    : <EditOutlined />
                }
                style={{ minWidth: 180 }}
              >
                {assignmentMode === ASSIGNMENT_MODES.ASSIGN 
                  ? 'Phân Công Mới' 
                  : assignmentMode === ASSIGNMENT_MODES.REASSIGN 
                  ? 'Phân Công Lại'
                  : 'Cập Nhật Slot'}
              </Button>
              <Button
                onClick={() => {
                  form.resetFields();
                  setSelectedRoom(null);
                  setAvailableSubRooms([]);
                  setSelectedDentists([]);
                  setSelectedNurses([]);
                }}
                size="large"
                style={{ minWidth: 120 }}
              >
                Reset Form
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default StaffAssignment;

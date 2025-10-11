import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Select, Button, Space, Typography, Row, Col, 
  Divider, Alert, Spin, notification, Tag, Tabs
} from 'antd';
import { 
  TeamOutlined, UserOutlined, CalendarOutlined, HomeOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined,
  ReloadOutlined, SaveOutlined, InfoCircleOutlined,
  SwapOutlined, MedicineBoxOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { roomService, userService } from '../../services';
import slotService from '../../services/slotService.js';
import scheduleConfigService from '../../services/scheduleConfigService.js';
import { toast } from '../../services/toastService.js';
import './StaffAssignment.css';

const { Title, Text } = Typography;
const { Option, OptGroup } = Select;

const WORKFLOW_MODES = {
  ROOM_BASED: 'room_based',
  STAFF_BASED: 'staff_based'
};

const ASSIGNMENT_MODES = {
  ASSIGN: 'assign',
  REASSIGN: 'reassign'
};

const StaffAssignment = () => {
  const [form] = Form.useForm();
  const [staffForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [workflowMode, setWorkflowMode] = useState(WORKFLOW_MODES.ROOM_BASED);
  const [rooms, setRooms] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [availableShifts, setAvailableShifts] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [availableSubRooms, setAvailableSubRooms] = useState([]);
  const [assignmentMode, setAssignmentMode] = useState(ASSIGNMENT_MODES.ASSIGN);
  const [staffSchedule, setStaffSchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [selectedDentists, setSelectedDentists] = useState([]);
  const [selectedNurses, setSelectedNurses] = useState([]);
  const [maxDentists, setMaxDentists] = useState(1);
  const [maxNurses, setMaxNurses] = useState(1);

  const normalizeSearch = (value = '') => value.toString().toLowerCase().trim();

  const buildRoomSearchValue = (room = {}) => normalizeSearch([
    room.roomCode,
    room.code,
    room.name,
    room.description
  ].filter(Boolean).join(' '));

  const buildStaffSearchValue = (staff = {}) => normalizeSearch([
    staff.employeeCode,
    staff.code,
    staff.fullName,
    staff.firstName,
    staff.lastName,
    staff.email,
    staff.phoneNumber
  ].filter(Boolean).join(' '));

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadRooms(), loadStaff(), loadAvailableShifts()]);
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const res = await roomService.getRooms(1, 100);
      if (res?.rooms && Array.isArray(res.rooms)) {
        setRooms(res.rooms.filter(room => room.isActive === true));
      }
    } catch (error) {
      console.error('Loi tai phong:', error);
      toast.error('Loi tai phong');
    }
  };

  const loadStaff = async () => {
    try {
      const res = await userService.getAllStaff(1, 1000);
      if (res?.success) {
        const allStaff = res.users || [];
        setDentists(allStaff.filter(u => u.role === 'dentist' && u.isActive));
        setNurses(allStaff.filter(u => u.role === 'nurse' && u.isActive));
      }
    } catch (error) {
      console.error('Loi tai nhan vien:', error);
      toast.error('Loi tai nhan vien');
    }
  };

  const loadAvailableShifts = async () => {
    try {
      const res = await scheduleConfigService.getConfig();
      if (res?.success && res?.data) {
        const shifts = [];
        const config = res.data;
        if (config.morningShift?.isActive) shifts.push({ name: config.morningShift.name, value: config.morningShift.name });
        if (config.afternoonShift?.isActive) shifts.push({ name: config.afternoonShift.name, value: config.afternoonShift.name });
        if (config.eveningShift?.isActive) shifts.push({ name: config.eveningShift.name, value: config.eveningShift.name });
        setAvailableShifts(shifts);
      }
    } catch (error) {
      console.error('Loi tai ca lam viec:', error);
      toast.error('Loi tai ca lam viec');
    }
  };

  const loadStaffSchedule = async (staffId, role) => {
    if (!staffId) return;
    setLoadingSchedule(true);
    try {
      const params = { viewType: 'month', page: 0, limit: 1, startDate: dayjs().format('YYYY-MM-DD') };
      let response;
      if (role === 'dentist') response = await slotService.getDentistCalendar(staffId, params);
      else if (role === 'nurse') response = await slotService.getNurseCalendar(staffId, params);
      if (response?.success && response?.data) {
        setStaffSchedule(response.data);
        toast.success('Da tai lich lam viec');
      } else {
        toast.error('Khong the tai lich lam viec');
        setStaffSchedule(null);
      }
    } catch (error) {
      console.error('Loi tai lich lam viec:', error);
      toast.error('Loi tai lich');
      setStaffSchedule(null);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleRoomChange = (roomId) => {
    const room = rooms.find(r => r._id === roomId);
    setSelectedRoom(room);
    form.setFieldsValue({ subRoomId: undefined, dentistIds: undefined, nurseIds: undefined });
    setSelectedDentists([]);
    setSelectedNurses([]);
    if (room?.hasSubRooms && room?.subRooms?.length > 0) {
      setAvailableSubRooms(room.subRooms.filter(sr => sr.isActive === true));
      setMaxDentists(1);
      setMaxNurses(1);
    } else {
      setAvailableSubRooms([]);
      setMaxDentists(room?.maxDoctors || 1);
      setMaxNurses(room?.maxNurses || 1);
    }
  };

  const handleAssignmentModeChange = (mode) => {
    setAssignmentMode(mode);
    form.resetFields();
    setSelectedRoom(null);
    setAvailableSubRooms([]);
    setSelectedDentists([]);
    setSelectedNurses([]);
  };

  const handleStaffChange = (staffId) => {
    const staff = [...dentists, ...nurses].find(s => s._id === staffId);
    if (staff) loadStaffSchedule(staffId, staff.role);
    else setStaffSchedule(null);
  };

  const handleDentistChange = (values) => {
    const valueArray = Array.isArray(values) ? values : (values ? [values] : []);
    if (valueArray.length > maxDentists) {
      toast.warning('Chi duoc chon toi da nha sy');
      return;
    }
    setSelectedDentists(valueArray);
    form.setFieldsValue({ dentistIds: valueArray });
  };

  const handleNurseChange = (values) => {
    const valueArray = Array.isArray(values) ? values : (values ? [values] : []);
    if (valueArray.length > maxNurses) {
      toast.warning('Chi duoc chon toi da y ta');
      return;
    }
    setSelectedNurses(valueArray);
    form.setFieldsValue({ nurseIds: valueArray });
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const requestData = {
        roomId: values.roomId,
        quarter: values.quarter,
        year: values.year,
        shifts: values.shifts,
        dentistIds: selectedDentists,
        nurseIds: selectedNurses
      };
      if (selectedRoom?.hasSubRooms && values.subRoomId) requestData.subRoomId = values.subRoomId;
      let response;
      if (assignmentMode === ASSIGNMENT_MODES.ASSIGN) response = await slotService.assignStaffToSlots(requestData);
      else response = await slotService.reassignStaffToSlots(requestData);
      if (response.success) {
        notification.success({
          message: 'Thanh cong!',
          description: response.data?.message || 'Da thuc hien thanh cong',
          duration: 5,
          placement: 'topRight'
        });
        form.resetFields();
        setSelectedRoom(null);
        setAvailableSubRooms([]);
        setSelectedDentists([]);
        setSelectedNurses([]);
      } else {
        notification.error({
          message: 'That bai',
          description: response.message || 'Khong the thuc hien',
          duration: 6,
          placement: 'topRight'
        });
      }
    } catch (error) {
      console.error('Loi thao tac:', error);
      notification.error({
        message: 'Loi thao tac',
        description: error.response?.data?.message || 'Co loi xay ra',
        duration: 6,
        placement: 'topRight'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="staff-assignment">
        <Card><div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" /><div style={{ marginTop: 16 }}>Dang tai du lieu...</div>
        </div></Card>
      </div>
    );
  }

  return (
    <div className="staff-assignment">
      <Card><div style={{ marginBottom: 24 }}>
        <Title level={3}><TeamOutlined style={{ marginRight: 8 }} />Quan Ly Phan Cong Nhan Su</Title>
        <Text type="secondary">Phan cong nhan su vao slots lam viec</Text>
      </div></Card>
      <Tabs
        activeKey={workflowMode}
        onChange={(key) => {
          setWorkflowMode(key);
          form.resetFields();
          staffForm.resetFields();
          setSelectedRoom(null);
          setStaffSchedule(null);
        }}
        size="large"
      >
        <Tabs.TabPane tab={<span><HomeOutlined /> Phan cong theo Phong</span>} key={WORKFLOW_MODES.ROOM_BASED}>
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={24} align="middle">
              <Col span={6}><Text strong style={{ fontSize: 16 }}>Che do phan cong:</Text></Col>
              <Col span={18}>
                <Select value={assignmentMode} onChange={handleAssignmentModeChange} style={{ width: '100%' }} size="large">
                  <Option value={ASSIGNMENT_MODES.ASSIGN}>Phan cong moi</Option>
                  <Option value={ASSIGNMENT_MODES.REASSIGN}>Phan cong lai</Option>
                </Select>
              </Col>
            </Row>
          </Card>
          <Card>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="Chon phong" name="roomId" rules={[{ required: true }]}>
                    <Select 
                      placeholder="Chon phong" 
                      onChange={handleRoomChange} 
                      showSearch 
                      optionFilterProp="roomsearch"
                      filterOption={(input, option) => {
                        const searchValue = option?.props?.roomsearch || '';
                        return searchValue.includes(normalizeSearch(input));
                      }}
                    >
                      {rooms.map(room => {
                        const roomCode = room.roomCode || room.code;
                        const searchValue = buildRoomSearchValue(room);
                        return (
                          <Option key={room._id} value={room._id} roomsearch={searchValue}>
                            <Space size={6}>
                              <HomeOutlined />
                              {roomCode && <Tag color="blue" bordered={false}>{roomCode}</Tag>}
                              <span>{room.name}</span>
                            </Space>
                          </Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                </Col>
                {selectedRoom?.hasSubRooms && availableSubRooms.length > 0 && (
                  <Col span={12}>
                    <Form.Item label="Chon phong con" name="subRoomId" rules={[{ required: true }]}>
                      <Select 
                        placeholder="Chon phong con"
                        showSearch
                        optionFilterProp="roomsearch"
                        filterOption={(input, option) => {
                          const searchValue = option?.props?.roomsearch || '';
                          return searchValue.includes(normalizeSearch(input));
                        }}
                      >
                        {availableSubRooms.map(sr => {
                          const subRoomCode = sr.roomCode || sr.code;
                          const searchValue = buildRoomSearchValue(sr);
                          return (
                            <Option key={sr._id} value={sr._id} roomsearch={searchValue}>
                              <Space size={6}>
                                <HomeOutlined />
                                {subRoomCode && <Tag color="purple" bordered={false}>{subRoomCode}</Tag>}
                                <span>{sr.name}</span>
                              </Space>
                            </Option>
                          );
                        })}
                      </Select>
                    </Form.Item>
                  </Col>
                )}
                <Col span={12}>
                  <Form.Item label="Chon quy" name="quarter" rules={[{ required: true }]}>
                    <Select placeholder="Chon quy">{[1,2,3,4].map(q => (<Option key={q} value={q}>Quy {q}</Option>))}</Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Chon nam" name="year" rules={[{ required: true }]}>
                    <Select placeholder="Chon nam">{[2024,2025,2026].map(y => (<Option key={y} value={y}>{y}</Option>))}</Select>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="Chon ca lam viec" name="shifts" rules={[{ required: true }]}>
                    <Select mode="multiple" placeholder="Chon cac ca lam viec">
                      {availableShifts.map(s => (<Option key={s.value} value={s.value}>{s.name}</Option>))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Divider>Chon nhan su</Divider>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="Nha sy" name="dentistIds" rules={[{ required: true }]}>
                    <Select 
                      mode={selectedRoom?.hasSubRooms ? undefined : "multiple"} 
                      placeholder="Chon nha sy" 
                      onChange={handleDentistChange} 
                      value={selectedDentists}
                      showSearch
                      optionFilterProp="staffsearch"
                      filterOption={(input, option) => {
                        const searchValue = option?.props?.staffsearch || '';
                        return searchValue.includes(normalizeSearch(input));
                      }}
                    >
                      {dentists.map(d => {
                        const fullName = d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim();
                        const employeeCode = d.employeeCode || d.code;
                        const searchValue = buildStaffSearchValue(d);
                        return (
                          <Option key={d._id} value={d._id} staffsearch={searchValue}>
                            <Space size={6}>
                              <UserOutlined />
                              {employeeCode && <Tag color="blue" bordered={false}>{employeeCode}</Tag>}
                              <span>{fullName || 'Khong ro ten'}</span>
                            </Space>
                          </Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Y ta" name="nurseIds" rules={[{ required: true }]}>
                    <Select 
                      mode={selectedRoom?.hasSubRooms ? undefined : "multiple"} 
                      placeholder="Chon y ta" 
                      onChange={handleNurseChange} 
                      value={selectedNurses}
                      showSearch
                      optionFilterProp="staffsearch"
                      filterOption={(input, option) => {
                        const searchValue = option?.props?.staffsearch || '';
                        return searchValue.includes(normalizeSearch(input));
                      }}
                    >
                      {nurses.map(n => {
                        const fullName = n.fullName || `${n.firstName || ''} ${n.lastName || ''}`.trim();
                        const employeeCode = n.employeeCode || n.code;
                        const searchValue = buildStaffSearchValue(n);
                        return (
                          <Option key={n._id} value={n._id} staffsearch={searchValue}>
                            <Space size={6}>
                              <MedicineBoxOutlined />
                              {employeeCode && <Tag color="green" bordered={false}>{employeeCode}</Tag>}
                              <span>{fullName || 'Khong ro ten'}</span>
                            </Space>
                          </Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} size="large">{assignmentMode === ASSIGNMENT_MODES.ASSIGN ? 'Phan cong' : 'Phan cong lai'}</Button>
              </Form.Item>
            </Form>
          </Card>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<span><SwapOutlined /> Thay the theo Nhan su</span>} key={WORKFLOW_MODES.STAFF_BASED}>
          <Alert message="Tinh nang dang phat trien" type="info" showIcon style={{ marginBottom: 24 }} />
          <Card>
            <Form form={staffForm} layout="vertical">
              <Form.Item label="Chon nhan su" name="staffId">
                <Select 
                  placeholder="Chon nhan su" 
                  onChange={handleStaffChange} 
                  size="large" 
                  allowClear
                  showSearch
                  optionFilterProp="staffsearch"
                  filterOption={(input, option) => {
                    const searchValue = option?.props?.staffsearch || '';
                    return searchValue.includes(normalizeSearch(input));
                  }}
                >
                  <OptGroup label="Nha sy">
                    {dentists.map(d => {
                      const fullName = d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim();
                      const employeeCode = d.employeeCode || d.code;
                      const searchValue = buildStaffSearchValue(d);
                      return (
                        <Option key={d._id} value={d._id} staffsearch={searchValue}>
                          <Space size={6}>
                            <UserOutlined />
                            {employeeCode && <Tag color="blue" bordered={false}>{employeeCode}</Tag>}
                            <span>{fullName || 'Khong ro ten'}</span>
                          </Space>
                        </Option>
                      );
                    })}
                  </OptGroup>
                  <OptGroup label="Y ta">
                    {nurses.map(n => {
                      const fullName = n.fullName || `${n.firstName || ''} ${n.lastName || ''}`.trim();
                      const employeeCode = n.employeeCode || n.code;
                      const searchValue = buildStaffSearchValue(n);
                      return (
                        <Option key={n._id} value={n._id} staffsearch={searchValue}>
                          <Space size={6}>
                            <MedicineBoxOutlined />
                            {employeeCode && <Tag color="green" bordered={false}>{employeeCode}</Tag>}
                            <span>{fullName || 'Khong ro ten'}</span>
                          </Space>
                        </Option>
                      );
                    })}
                  </OptGroup>
                </Select>
              </Form.Item>
            </Form>
            {loadingSchedule && (<div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>)}
            {staffSchedule && !loadingSchedule && (<Alert message="Da tai lich thanh cong" type="success" showIcon />)}
          </Card>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default StaffAssignment;

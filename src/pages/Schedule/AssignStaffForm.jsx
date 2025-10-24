/**
 * @author: TrungNghia & HoTram
 * Component: Assign Staff Form - Phân công/chỉnh sửa nhân sự cho slot
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Alert,
  Tag
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  UserOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '../../services/toastService';
import scheduleService from '../../services/scheduleService';
import userService from '../../services/userService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const normalizeSearch = (value = '') => value.toString().toLowerCase().trim();

const buildStaffSearchValue = (staff = {}) => normalizeSearch([
  staff.employeeCode,
  staff.code,
  staff.fullName,
  staff.firstName,
  staff.lastName,
  staff.email,
  staff.phoneNumber
].filter(Boolean).join(' '));

const AssignStaffForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slotId, room, shift, date, returnPath } = location.state || {};
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dentists, setDentists] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [slotInfo, setSlotInfo] = useState(null);

  useEffect(() => {
    if (!slotId) {
      toast.error('Thiếu thông tin slot');
      navigate(returnPath || '/dashboard/schedules/staff-assignment');
      return;
    }
    fetchStaffAndSlot();
  }, [slotId]);

  // Fetch staff list and slot info
  const fetchStaffAndSlot = async () => {
    setLoading(true);
    try {
      // Fetch staff
      const staffResponse = await userService.getAllStaff(1, 1000);
      if (staffResponse.success) {
        const activeDentists = staffResponse.users.filter(
          u => u.role === 'dentist' && u.isActive
        );
        const activeNurses = staffResponse.users.filter(
          u => u.role === 'nurse' && u.isActive
        );
        setDentists(activeDentists);
        setNurses(activeNurses);
      }

      // Fetch slot info (from day query)
      const slotResponse = await scheduleService.getSlotsByDayAndShift({
        roomId: room.roomId,
        subRoomId: room.subRoomId,
        shiftName: shift.shiftName,
        date: date.format('YYYY-MM-DD')
      });

      if (slotResponse.success) {
        const currentSlot = slotResponse.data.find(s => s._id === slotId);
        if (currentSlot) {
          setSlotInfo(currentSlot);
          // Set initial values
          form.setFieldsValue({
            dentist: currentSlot.dentist?._id,
            nurse: currentSlot.nurse?._id
          });
        }
      }
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle submit
  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const response = await scheduleService.assignStaffToSlot({
        slotId,
        dentistId: values.dentist || null,
        nurseId: values.nurse || null
      });

      if (response.success) {
        toast.success('Phân công nhân sự thành công!');
        navigate(returnPath || '/dashboard/schedules/staff-assignment');
      } else {
        toast.error(response.message || 'Lỗi khi phân công');
      }
    } catch (error) {
      toast.error('Lỗi khi phân công: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(returnPath || '/dashboard/schedules/staff-assignment')}
            >
              Quay lại
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              Phân công nhân sự
            </Title>
          </Space>
        </Col>
      </Row>

      {/* Info Card */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Space direction="vertical" size={0}>
              <Text type="secondary">Phòng</Text>
              <Text strong>{room?.roomName}</Text>
              {room?.subRoomName && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {room.subRoomName}
                </Text>
              )}
            </Space>
          </Col>
          <Col span={6}>
            <Space direction="vertical" size={0}>
              <Text type="secondary">Ca</Text>
              <Text strong>{shift?.shiftName}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {shift?.startTime} - {shift?.endTime}
              </Text>
            </Space>
          </Col>
          <Col span={6}>
            <Space direction="vertical" size={0}>
              <Text type="secondary">Ngày</Text>
              <Text strong>{date?.format('DD/MM/YYYY')}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {date?.format('dddd')}
              </Text>
            </Space>
          </Col>
          <Col span={6}>
            <Space direction="vertical" size={0}>
              <Text type="secondary">Giờ</Text>
              <Text strong>
                {slotInfo ? dayjs(slotInfo.startTime).format('HH:mm') : '-'}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                → {slotInfo ? dayjs(slotInfo.endTime).format('HH:mm') : '-'}
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Assignment Form */}
      <Card title="Chọn nhân sự" loading={loading}>
        <Alert
          type="info"
          showIcon
          message="Lưu ý"
          description="Có thể để trống nếu chưa muốn phân công. Click Lưu để cập nhật."
          style={{ marginBottom: 16 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dentist"
                label={
                  <Space>
                    <UserOutlined />
                    <span>Nha sĩ</span>
                  </Space>
                }
              >
                <Select
                  placeholder="Chọn nha sĩ"
                  allowClear
                  showSearch
                  optionFilterProp="staffsearch"
                  filterOption={(input, option) => {
                    const searchValue = option?.props?.staffsearch || '';
                    return searchValue.includes(normalizeSearch(input));
                  }}
                >
                  {dentists.map(dentist => {
                    const fullName = dentist.fullName || `${dentist.firstName || ''} ${dentist.lastName || ''}`.trim();
                    const employeeCode = dentist.employeeCode || dentist.code;
                    const searchValue = buildStaffSearchValue(dentist);

                    return (
                      <Option key={dentist._id} value={dentist._id} staffsearch={searchValue}>
                        <Space size={6}>
                          <UserOutlined />
                          {employeeCode && <Tag color="blue" bordered={false}>{employeeCode}</Tag>}
                          <span>{fullName || 'Không rõ tên'}</span>
                        </Space>
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="nurse"
                label={
                  <Space>
                    <UserOutlined />
                    <span>Y tá</span>
                  </Space>
                }
              >
                <Select
                  placeholder="Chọn y tá"
                  allowClear
                  showSearch
                  optionFilterProp="staffsearch"
                  filterOption={(input, option) => {
                    const searchValue = option?.props?.staffsearch || '';
                    return searchValue.includes(normalizeSearch(input));
                  }}
                >
                  {nurses.map(nurse => {
                    const fullName = nurse.fullName || `${nurse.firstName || ''} ${nurse.lastName || ''}`.trim();
                    const employeeCode = nurse.employeeCode || nurse.code;
                    const searchValue = buildStaffSearchValue(nurse);

                    return (
                      <Option key={nurse._id} value={nurse._id} staffsearch={searchValue}>
                        <Space size={6}>
                          <MedicineBoxOutlined />
                          {employeeCode && <Tag color="green" bordered={false}>{employeeCode}</Tag>}
                          <span>{fullName || 'Không rõ tên'}</span>
                        </Space>
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
              >
                Lưu phân công
              </Button>
              <Button onClick={() => navigate(returnPath || '/dashboard/schedules/staff-assignment')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AssignStaffForm;

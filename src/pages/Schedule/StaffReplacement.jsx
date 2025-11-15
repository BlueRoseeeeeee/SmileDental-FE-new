/**
 * @author: TrungNghia & HoTram
 * Component: Thay thế nhân sự - Xem lịch làm việc và thay thế
 * Flow: Chọn nhân sự → Xem lịch → Chọn slot cần thay → Chọn nhân sự thay thế
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Typography,
  Modal,
  Select,
  DatePicker,
  Alert,
  List,
  Checkbox,
  Badge,
  Tooltip,
  Collapse,
  Empty,
  Spin,
  Statistic,
  Divider
} from 'antd';
import {
  SwapOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../services/toastService';
import scheduleService from '../../services/scheduleService';
import userService from '../../services/userService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;

const StaffReplacement = () => {
  const navigate = useNavigate();
  
  // States
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'dentist' | 'nurse'
  
  // Detail Modal States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffSchedule, setStaffSchedule] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs(), dayjs().add(30, 'day')]);
  
  // Replacement Modal States
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [replaceFromDate, setReplaceFromDate] = useState(null);
  const [replaceAllFromDate, setReplaceAllFromDate] = useState(false);
  const [replacementStaffList, setReplacementStaffList] = useState([]);
  const [loadingReplacementStaff, setLoadingReplacementStaff] = useState(false);

  useEffect(() => {
    fetchStaffList();
  }, [roleFilter]);

  // Fetch all staff
  const fetchStaffList = async () => {
    setLoading(true);
    try {
      const response = await userService.getAllStaff({
        role: roleFilter !== 'all' ? roleFilter : undefined
      });

      if (response.success) {
        setStaffList(response.data || []);
      } else {
        toast.error('Không thể tải danh sách nhân sự');
      }
    } catch (error) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // View staff detail
  const handleViewStaffDetail = async (staff) => {
    setSelectedStaff(staff);
    setShowDetailModal(true);
    await fetchStaffSchedule(staff._id);
  };

  // Fetch staff schedule
  const fetchStaffSchedule = async (staffId) => {
    setLoadingSchedule(true);
    try {
      const response = await scheduleService.getStaffSchedule({
        staffId,
        fromDate: dateRange[0].format('YYYY-MM-DD'),
        toDate: dateRange[1].format('YYYY-MM-DD')
      });

      if (response.success) {
        setStaffSchedule(response.data.schedule || []);
      }
    } catch (error) {
      toast.error('Không thể tải lịch làm việc');
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Open replacement modal
  const handleOpenReplacementModal = () => {
    if (selectedSlots.length === 0 && !replaceAllFromDate) {
      toast.warning('Vui lòng chọn ít nhất 1 slot hoặc chọn "Thay thế tất cả"');
      return;
    }
    
    setShowReplacementModal(true);
    fetchReplacementStaff();
  };

  // Fetch replacement staff with conflict checking
  const fetchReplacementStaff = async () => {
    setLoadingReplacementStaff(true);
    try {
      const response = await scheduleService.getAvailableReplacementStaff({
        originalStaffId: selectedStaff._id,
        role: selectedStaff.role,
        slots: replaceAllFromDate ? [] : selectedSlots,
        fromDate: replaceAllFromDate ? replaceFromDate : null
      });

      if (response.success) {
        setReplacementStaffList(response.data.staff || []);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách nhân sự thay thế');
    } finally {
      setLoadingReplacementStaff(false);
    }
  };

  // Execute replacement
  const handleReplace = async (replacementStaff) => {
    try {
      const response = await scheduleService.replaceStaff({
        originalStaffId: selectedStaff._id,
        replacementStaffId: replacementStaff._id,
        slots: replaceAllFromDate ? [] : selectedSlots,
        fromDate: replaceAllFromDate ? replaceFromDate : null,
        replaceAll: replaceAllFromDate
      });

      if (response.success) {
        toast.success(response.message || 'Thay thế nhân sự thành công');
        setShowReplacementModal(false);
        setShowDetailModal(false);
        setSelectedSlots([]);
        setReplaceAllFromDate(false);
      } else {
        toast.error(response.message || 'Lỗi khi thay thế nhân sự');
      }
    } catch (error) {
      toast.error('Lỗi: ' + error.message);
    }
  };

  // Render conflict badge for replacement staff
  const renderReplacementConflictBadge = (staff) => {
    if (!staff.conflicts || staff.conflicts.length === 0) {
      return <Tag color="success" icon={<CheckCircleOutlined />}>Không trùng lịch</Tag>;
    }
    
    return (
      <Tooltip title={`Trùng ${staff.conflicts.length} slot`}>
        <Tag color="warning" icon={<WarningOutlined />}>
          Trùng {staff.conflicts.length} lịch
        </Tag>
      </Tooltip>
    );
  };

  // Columns for staff list
  const staffColumns = [
    {
      title: 'Nhân sự',
      key: 'staff',
      render: (_, record) => (
        <Space>
          <UserOutlined style={{ fontSize: 20 }} />
          <div>
            <Text strong>{record.firstName} {record.lastName}</Text>
            <br />
            <Text type="secondary">{record.email}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Chức vụ',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'dentist' ? 'blue' : 'green'}>
          {role === 'dentist' ? 'Nha sĩ' : 'Y tá'}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<CalendarOutlined />}
            onClick={() => handleViewStaffDetail(record)}
          >
            Xem lịch làm việc
          </Button>
        </Space>
      )
    }
  ];

  // Columns for schedule
  const scheduleColumns = [
    {
      title: (
        <Checkbox
          checked={selectedSlots.length === staffSchedule.length}
          indeterminate={selectedSlots.length > 0 && selectedSlots.length < staffSchedule.length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedSlots(staffSchedule.map(s => s._id));
            } else {
              setSelectedSlots([]);
            }
          }}
        />
      ),
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={selectedSlots.includes(record._id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedSlots([...selectedSlots, record._id]);
            } else {
              setSelectedSlots(selectedSlots.filter(id => id !== record._id));
            }
          }}
          disabled={replaceAllFromDate}
        />
      )
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Ca',
      dataIndex: 'shiftName',
      key: 'shiftName',
      render: (shiftName) => <Tag color="blue">{shiftName}</Tag>
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_, record) => `${record.startTime} - ${record.endTime}`
    },
    {
      title: 'Phòng',
      dataIndex: 'roomName',
      key: 'roomName'
    },
    {
      title: 'Vai trò',
      dataIndex: 'assignedAs',
      key: 'assignedAs',
      render: (role) => (
        <Tag color={role === 'dentist' ? 'blue' : 'green'}>
          {role === 'dentist' ? 'Nha sĩ' : 'Y tá'}
        </Tag>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/dashboard/schedule')}
            >
              Quay lại
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              <SwapOutlined /> Thay thế nhân sự
            </Title>
          </Space>
        </Col>
        <Col>
          <Space>
            {/* Role Filter */}
            <Select
              value={roleFilter}
              onChange={setRoleFilter}
              style={{ width: 180 }}
            >
              <Option value="all">Tất cả</Option>
              <Option value="dentist">Nha sĩ</Option>
              <Option value="nurse">Y tá</Option>
            </Select>
            
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchStaffList}
              loading={loading}
            >
              Làm mới
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Info Alert */}
      <Alert
        message="Hướng dẫn thay thế nhân sự"
        description={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Chọn nhân sự cần thay thế và xem lịch làm việc</li>
            <li>Chọn các slot cần thay thế hoặc chọn "Thay thế tất cả từ ngày X"</li>
            <li>Chọn nhân sự thay thế (hệ thống sẽ hiển thị trùng lịch nếu có)</li>
            <li>Xác nhận thay thế</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Staff List */}
      <Card>
        <Table
          columns={staffColumns}
          dataSource={staffList}
          loading={loading}
          rowKey="_id"
          pagination={{ 
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} nhân sự`
          }}
        />
      </Card>

      {/* Staff Detail Modal */}
      <Modal
        title={
          <Space>
            <UserOutlined style={{ color: '#1890ff' }} />
            <span>
              Lịch làm việc: {selectedStaff?.firstName} {selectedStaff?.lastName}
            </span>
          </Space>
        }
        open={showDetailModal}
        onCancel={() => {
          setShowDetailModal(false);
          setSelectedSlots([]);
          setReplaceAllFromDate(false);
        }}
        width={1000}
        footer={[
          <Button key="cancel" onClick={() => setShowDetailModal(false)}>
            Đóng
          </Button>,
          <Button
            key="replace"
            type="primary"
            icon={<SwapOutlined />}
            onClick={handleOpenReplacementModal}
          >
            Thay thế
          </Button>
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Staff Info */}
          <Card size="small" style={{ backgroundColor: '#f5f5f5' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic 
                  title="Tổng số lịch" 
                  value={staffSchedule.length} 
                  prefix={<CalendarOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Đã chọn" 
                  value={selectedSlots.length}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                  {selectedStaff?.role === 'dentist' ? 'Nha sĩ' : 'Y tá'}
                </Tag>
              </Col>
            </Row>
          </Card>

          {/* Date Range Picker */}
          <Row gutter={16}>
            <Col span={16}>
              <Text strong>Khoảng thời gian:</Text>
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  setDateRange(dates);
                  if (dates && selectedStaff) {
                    fetchStaffSchedule(selectedStaff._id);
                  }
                }}
                format="DD/MM/YYYY"
                style={{ width: '100%', marginTop: 8 }}
              />
            </Col>
            <Col span={8}>
              <Text strong>Tùy chọn thay thế:</Text>
              <div style={{ marginTop: 8 }}>
                <Checkbox
                  checked={replaceAllFromDate}
                  onChange={(e) => {
                    setReplaceAllFromDate(e.target.checked);
                    if (e.target.checked) {
                      setSelectedSlots([]);
                    }
                  }}
                >
                  Thay thế tất cả
                </Checkbox>
                {replaceAllFromDate && (
                  <DatePicker
                    value={replaceFromDate}
                    onChange={setReplaceFromDate}
                    format="DD/MM/YYYY"
                    placeholder="Từ ngày"
                    style={{ width: '100%', marginTop: 8 }}
                  />
                )}
              </div>
            </Col>
          </Row>

          <Divider />

          {/* Schedule Table */}
          {loadingSchedule ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <Spin />
            </div>
          ) : staffSchedule.length === 0 ? (
            <Empty description="Không có lịch làm việc trong khoảng thời gian này" />
          ) : (
            <Table
              columns={scheduleColumns}
              dataSource={staffSchedule}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          )}
        </Space>
      </Modal>

      {/* Replacement Staff Modal */}
      <Modal
        title={
          <Space>
            <SwapOutlined style={{ color: '#1890ff' }} />
            <span>Chọn nhân sự thay thế</span>
          </Space>
        }
        open={showReplacementModal}
        onCancel={() => setShowReplacementModal(false)}
        footer={null}
        width={800}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message={
              replaceAllFromDate 
                ? `Thay thế TẤT CẢ lịch từ ${replaceFromDate?.format('DD/MM/YYYY')}`
                : `Thay thế ${selectedSlots.length} slot đã chọn`
            }
            type="info"
            showIcon
          />

          {loadingReplacementStaff ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <Spin />
            </div>
          ) : (
            <List
              dataSource={replacementStaffList}
              renderItem={(staff) => (
                <List.Item
                  actions={[
                    <Button
                      type="primary"
                      onClick={() => handleReplace(staff)}
                    >
                      Chọn thay thế
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<UserOutlined style={{ fontSize: 24 }} />}
                    title={
                      <Space>
                        <Text strong>{staff.firstName} {staff.lastName}</Text>
                        <Tag color={staff.role === 'dentist' ? 'blue' : 'green'}>
                          {staff.role === 'dentist' ? 'Nha sĩ' : 'Y tá'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4}>
                        <Text type="secondary">{staff.email}</Text>
                        {renderReplacementConflictBadge(staff)}
                        {staff.conflicts && staff.conflicts.length > 0 && (
                          <Collapse size="small" ghost>
                            <Panel header="Xem chi tiết trùng lịch" key="1">
                              <List
                                size="small"
                                dataSource={staff.conflicts}
                                renderItem={(conflict) => (
                                  <List.Item>
                                    <Space direction="vertical" size={0}>
                                      <Text strong>
                                        {conflict.date} - {conflict.shiftName}
                                      </Text>
                                      <Text type="secondary">
                                        {conflict.startTime} - {conflict.endTime}
                                      </Text>
                                    </Space>
                                  </List.Item>
                                )}
                              />
                            </Panel>
                          </Collapse>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default StaffReplacement;

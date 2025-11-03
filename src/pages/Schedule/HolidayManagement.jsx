/**
 * @author: HoTram
 * Holiday Management - Trang quản lý ngày nghỉ 
 */
import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Modal, 
  Form, 
  DatePicker, 
  Input, 
  Table,
  Tag,
  Popconfirm,
  Tooltip,
  Empty,
  Alert,
  Row,
  Col,
  Select,
  Switch,
  Tabs
} from 'antd';
import { 
  PlusOutlined, 
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import smileCareTheme from '../../theme/smileCareTheme';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { scheduleConfigService } from '../../services/index.js';
import { toast } from '../../services/toastService.js';

// Enable dayjs plugins
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const HolidayManagement = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [form] = Form.useForm();
  
  const [blockedMonths, setBlockedMonths] = useState([]);
  const [existingHolidays, setExistingHolidays] = useState([]);
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('recurring');
  const [filterActive, setFilterActive] = useState('all');
  const [filterUsed, setFilterUsed] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState(null);

  const getNonRecurringHolidays = () => {
    return holidays.filter(h => !h.isRecurring && h._id !== editingHoliday?._id);
  };

  const getFirstValidDate = () => {
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    let checkDate = tomorrow;
    const maxCheck = 365;
    
    for (let i = 0; i < maxCheck; i++) {
      if (!disabledStartDate(checkDate)) {
        return checkDate;
      }
      checkDate = checkDate.add(1, 'day');
    }
    
    return tomorrow;
  };

  const loadBlockedRanges = async () => {
    try {
      const response = await scheduleConfigService.getBlockedDateRanges();
      
      if (response && response.success && response.data) {
        setBlockedMonths(response.data.blockedMonths || []);
        setExistingHolidays(response.data.existingHolidays || []);
      } else {
        setBlockedMonths([]);
        setExistingHolidays([]);
      }
    } catch (error) {
      setBlockedMonths([]);
      setExistingHolidays([]);
    }
  };

  const disabledStartDate = (current) => {
    if (!current) return false;
    
    try {
      const currentDate = current.startOf('day');
      const today = dayjs().startOf('day');
      
      if (currentDate.isSameOrBefore(today)) {
        return true;
      }
      
      if (blockedMonths && blockedMonths.length > 0) {
        const isInBlockedMonth = blockedMonths.some(blocked => {
          if (!blocked || !blocked.startDate || !blocked.endDate) return false;
          const blockStart = dayjs(blocked.startDate).startOf('day');
          const blockEnd = dayjs(blocked.endDate).startOf('day');
          return currentDate.isSameOrAfter(blockStart) && currentDate.isSameOrBefore(blockEnd);
        });
        
        if (isInBlockedMonth) {
          return true;
        }
      }
      
      if (existingHolidays && existingHolidays.length > 0) {
        const filteredHolidays = existingHolidays.filter(h => 
          !editingHoliday || h.id !== editingHoliday._id
        );
        
        const isInExistingHoliday = filteredHolidays.some(holiday => {
          if (!holiday || !holiday.startDate || !holiday.endDate) return false;
          const start = dayjs(holiday.startDate).startOf('day');
          const end = dayjs(holiday.endDate).startOf('day');
          return currentDate.isSameOrAfter(start) && currentDate.isSameOrBefore(end);
        });
        
        if (isInExistingHoliday) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };

  const disabledEndDate = (current) => {
    if (!current) return false;
    
    try {
      const currentDate = current.startOf('day');
      const today = dayjs().startOf('day');
      
      if (!selectedStartDate) {
        return true;
      }
      
      const startDate = dayjs(selectedStartDate).startOf('day');
      
      if (currentDate.isBefore(startDate)) {
        return true;
      }
      
      if (currentDate.isSameOrBefore(today)) {
        return true;
      }
      
      if (existingHolidays && existingHolidays.length > 0) {
        const filteredHolidays = existingHolidays.filter(h => 
          h && h.startDate && (!editingHoliday || h.id !== editingHoliday._id)
        );
        
        const nextHoliday = filteredHolidays
          .filter(h => dayjs(h.startDate).isAfter(startDate))
          .sort((a, b) => dayjs(a.startDate) - dayjs(b.startDate))[0];
        
        if (nextHoliday && nextHoliday.startDate) {
          const nextStart = dayjs(nextHoliday.startDate).startOf('day');
          if (currentDate.isSameOrAfter(nextStart)) {
            return true;
          }
        }
      }
      
      if (blockedMonths && blockedMonths.length > 0) {
        const isInBlockedMonth = blockedMonths.some(blocked => {
          if (!blocked || !blocked.startDate || !blocked.endDate) return false;
          const blockStart = dayjs(blocked.startDate).startOf('day');
          const blockEnd = dayjs(blocked.endDate).startOf('day');
          return currentDate.isSameOrAfter(blockStart) && currentDate.isSameOrBefore(blockEnd);
        });
        
        if (isInBlockedMonth) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const response = await scheduleConfigService.getHolidays();
      setHolidays(response.data?.holidays || []);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tải danh sách ngày nghỉ';
      toast.error(errorMessage);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredHolidays = () => {
    let filtered = holidays;
    
    if (activeTab === 'recurring') {
      filtered = filtered.filter(h => h.isRecurring === true);
    } else if (activeTab === 'range') {
      filtered = filtered.filter(h => !h.isRecurring);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(holiday => {
        const name = holiday.name?.toLowerCase() || '';
        const note = holiday.note?.toLowerCase() || '';
        const term = searchTerm.toLowerCase();
        return name.includes(term) || note.includes(term);
      });
    }
    
    if (filterDateRange && activeTab === 'range' && filterDateRange.length === 2) {
      filtered = filtered.filter(holiday => {
        if (holiday.isRecurring) return true;
        
        const holidayStart = dayjs(holiday.startDate).startOf('day');
        const holidayEnd = dayjs(holiday.endDate).startOf('day');
        const filterStart = filterDateRange[0].startOf('day');
        const filterEnd = filterDateRange[1].startOf('day');
        
        return holidayStart.isSameOrBefore(filterEnd) && holidayEnd.isSameOrAfter(filterStart);
      });
    }
    
    if (filterActive && filterActive !== 'all' && activeTab === 'recurring') {
      filtered = filtered.filter(holiday => {
        if (!holiday.isRecurring) return true;
        if (filterActive === 'active') {
          return holiday.isActive === true;
        } else if (filterActive === 'inactive') {
          return holiday.isActive !== true;
        }
        return true;
      });
    }
    
    if (filterUsed && filterUsed !== 'all' && activeTab === 'range') {
      filtered = filtered.filter(holiday => {
        if (holiday.isRecurring) return true;
        if (filterUsed === 'used') {
          return holiday.hasBeenUsed === true;
        } else if (filterUsed === 'unused') {
          return holiday.hasBeenUsed !== true;
        }
        return true;
      });
    }
    
    if (activeTab === 'range') {
      filtered = filtered.sort((a, b) => {
        if (!a.startDate || !b.startDate) return 0;
        return dayjs(b.startDate) - dayjs(a.startDate);
      });
    }
    
    return filtered;
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setSearchInput(value);
  };

  const handleAddHoliday = async () => {
    setEditingHoliday(null);
    setIsRecurring(false);
    setSelectedStartDate(null);
    form.resetFields();
    form.setFieldsValue({ isRecurring: false });
    await loadBlockedRanges();
    setModalVisible(true);
  };

  const handleEditHoliday = async (holiday) => {
    setEditingHoliday(holiday);
    setIsRecurring(holiday.isRecurring || false);
    
    const formData = {
      name: holiday.name,
      note: holiday.note,
      isRecurring: holiday.isRecurring || false
    };
    
    if (holiday.isRecurring) {
      formData.dayOfWeek = holiday.dayOfWeek;
      setSelectedStartDate(null);
    } else {
      const startDate = dayjs(holiday.startDate);
      const endDate = dayjs(holiday.endDate);
      formData.startDate = startDate;
      formData.endDate = endDate;
      setSelectedStartDate(startDate);
    }
    
    form.setFieldsValue(formData);
    await loadBlockedRanges();
    setModalVisible(true);
  };

  const handleDeleteHoliday = async (holidayId) => {
    try {
      await scheduleConfigService.removeHoliday(holidayId);
      setHolidays(holidays.filter(h => h._id !== holidayId));
      toast.success('Xóa ngày nghỉ thành công!');
    } catch (error) {
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Không thể xóa ngày nghỉ';
      toast.error(errorMessage);
    }
  };

  const handleToggleActive = async (holidayId, checked) => {
    try {
      await scheduleConfigService.updateHoliday(holidayId, { isActive: checked });
      setHolidays(holidays.map(h => 
        h._id === holidayId ? { ...h, isActive: checked } : h
      ));
      toast.success(`${checked ? 'Bật' : 'Tắt'} ngày nghỉ thành công!`);
    } catch (error) {
      toast.error('Không thể thay đổi trạng thái ngày nghỉ');
    }
  };

  const handleSaveHoliday = async (values) => {
    try {
      const holidayData = {
        name: values.name,
        note: values.note || '',
        isRecurring: values.isRecurring || false
      };
      
      if (values.isRecurring) {
        holidayData.dayOfWeek = values.dayOfWeek;
        holidayData.isActive = true;
      } else {
        holidayData.startDate = values.startDate.format('YYYY-MM-DD');
        holidayData.endDate = values.endDate.format('YYYY-MM-DD');
      }

      if (editingHoliday) {
        await scheduleConfigService.updateHoliday(editingHoliday._id, holidayData);
        await loadHolidays();
        toast.success('Cập nhật ngày nghỉ thành công!');
      } else {
        await scheduleConfigService.addHoliday(holidayData);
        await loadHolidays();
        toast.success('Thêm ngày nghỉ thành công!');
      }

      setModalVisible(false);
      form.resetFields();
      setIsRecurring(false);
      setEditingHoliday(null);
    } catch (error) {
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Không thể lưu ngày nghỉ';
      toast.error(errorMessage);
    }
  };

  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      render: (_, __, index) => index + 1,
      width: 60
    },
    {
      title: 'Tên ngày nghỉ',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <Space>
            <Text strong>{text}</Text>
          </Space>
          {!record.isRecurring && record.note && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.note}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date, record) => {
        if (record.isRecurring) {
          return <Text type="secondary">-</Text>;
        }
        return (
          <Space>
            <CalendarOutlined />
            <Text>{dayjs(date).format('DD/MM/YYYY')}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date, record) => {
        if (record.isRecurring) {
          return <Text type="secondary">-</Text>;
        }
        return (
          <Space>
            <CalendarOutlined />
            <Text>{dayjs(date).format('DD/MM/YYYY')}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Số ngày nghỉ',
      key: 'duration',
      render: (_, record) => {
        if (record.isRecurring) {
          const dayNames = ['', 'Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
          return (
            <Space>
              <ClockCircleOutlined />
              <Text>{dayNames[record.dayOfWeek] || 'N/A'}</Text>
            </Space>
          );
        }
        const start = dayjs(record.startDate);
        const end = dayjs(record.endDate);
        const duration = end.diff(start, 'day') + 1;
        return (
          <Space>
            <ClockCircleOutlined />
            <Text>{duration} ngày</Text>
          </Space>
        );
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => {
        if (!record.isRecurring) {
          return record.hasBeenUsed ? (
            <Tag color="success">Đã sử dụng</Tag>
          ) : (
            <Tag color="default">Chưa sử dụng</Tag>
          );
        }
        return record.isActive ? (
          <Tag color="green">Đang bật</Tag>
        ) : (
          <Tag color="red">Đã tắt</Tag>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => {
        const canDelete = !record.isRecurring && record.hasBeenUsed !== true;
        const canEdit = !record.isRecurring && record.hasBeenUsed !== true;
        const deleteTooltip = record.isRecurring 
          ? 'Không thể xóa ngày nghỉ cố định'
          : record.hasBeenUsed === true
            ? 'Không thể xóa ngày nghỉ đã được sử dụng'
            : 'Xóa ngày nghỉ';
        const editTooltip = record.hasBeenUsed === true
          ? 'Không thể sửa ngày nghỉ đã được sử dụng'
          : 'Sửa ngày nghỉ';
        
        return (
          <Space>
            {record.isRecurring ? (
              <Tooltip title={record.isActive ? 'Tắt ngày nghỉ này' : 'Bật ngày nghỉ này'}>
                <Switch
                  checked={record.isActive}
                  onChange={(checked) => handleToggleActive(record._id, checked)}
                  checkedChildren="Bật"
                  unCheckedChildren="Tắt"
                />
              </Tooltip>
            ) : (
              canEdit ? (
                <Tooltip title={editTooltip}>
                  <Button 
                    type="primary" 
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEditHoliday(record)}
                  />
                </Tooltip>
              ) : (
                <Tooltip title={editTooltip}>
                  <Button 
                    type="primary" 
                    size="small"
                    icon={<EditOutlined />}
                    disabled
                  />
                </Tooltip>
              )
            )}
            
            {canDelete ? (
              <Popconfirm
                title="Xóa ngày nghỉ"
                description="Bạn có chắc chắn muốn xóa ngày nghỉ này?"
                onConfirm={() => handleDeleteHoliday(record._id)}
                okText="Xóa"
                cancelText="Hủy"
                okType="danger"
              >
                <Tooltip title={deleteTooltip}>
                  <Button 
                    danger 
                    size="small"
                    icon={<DeleteOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            ) : (
              <Tooltip title={deleteTooltip}>
                <Button 
                  danger 
                  size="small"
                  icon={<DeleteOutlined />}
                  disabled
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  React.useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        loadHolidays(),
        loadBlockedRanges()
      ]);
    };
    
    initializeData();
  }, []);

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 64px)',
    }}>

      <Card
        style={{
          borderRadius: 16,
          border: '2px solid #dbeafe',
          boxShadow: smileCareTheme.shadows.lg
        }}
        bodyStyle={{ padding: '28px 32px' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setSearchInput('');
            setSearchTerm('');
            if (key === 'range') {
              setFilterActive('all');
            } else if (key === 'recurring') {
              setFilterUsed('all');
              setFilterDateRange(null);
            }
          }}
          items={[
            {
              key: 'recurring',
              label: 'Ngày nghỉ cố định',
              children: (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <Row gutter={[16, 16]} align="middle" style={{ marginBottom: '16px' }}>
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <div>
                          <Text strong style={{ display: 'block', marginBottom: '4px' }}>Tìm kiếm</Text>
                          <Input
                            prefix={<SearchOutlined />}
                            value={searchInput}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSearchInput(value);
                              if (value === '') {
                                setSearchTerm('');
                              }
                            }}
                            onPressEnter={(e) => handleSearch(e.target.value)}
                            allowClear
                            onClear={() => {
                              setSearchInput('');
                              setSearchTerm('');
                            }}
                          />
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <div>
                          <Text strong style={{ display: 'block', marginBottom: '4px' }}>Trạng thái bật/tắt:</Text>
                          <Select
                            style={{ width: '100%' }}
                            value={filterActive}
                            onChange={setFilterActive}
                            placeholder="Chọn trạng thái"
                          >
                            <Select.Option value="all">Tất cả</Select.Option>
                            <Select.Option value="active">Đang bật</Select.Option>
                            <Select.Option value="inactive">Đã tắt</Select.Option>
                          </Select>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {getFilteredHolidays().length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <div>
                          <Title level={4} type="secondary">Chưa có ngày nghỉ cố định</Title>
                          <Text type="secondary">
                            Chưa có ngày nghỉ cố định trong hệ thống
                          </Text>
                        </div>
                      }
                    />
                  ) : (
                    <Table
                      columns={columns}
                      dataSource={getFilteredHolidays()}
                      rowKey="_id"
                      loading={loading}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                          `${range[0]}-${range[1]} của ${total} ngày nghỉ`,
                      }}
                      scroll={{ x: 800 }}
                      size="middle"
                    />
                  )}
                </div>
              )
            },
            {
              key: 'range',
              label: 'Ngày nghỉ lễ',
              children: (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <Row gutter={[16, 16]} align="middle" style={{ marginBottom: '16px' }}>
                      <Col xs={24} sm={12} md={6} lg={5}>
                        <div>
                          <Text strong style={{ display: 'block', marginBottom: '4px' }}>Tìm kiếm</Text>
                          <Input
                            prefix={<SearchOutlined />}
                            value={searchInput}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSearchInput(value);
                              if (value === '') {
                                setSearchTerm('');
                              }
                            }}
                            onPressEnter={(e) => handleSearch(e.target.value)}
                            allowClear
                            onClear={() => {
                              setSearchInput('');
                              setSearchTerm('');
                            }}
                          />
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={6} lg={4}>
                        <div>
                          <Text strong style={{ display: 'block', marginBottom: '4px' }}>Trạng thái sử dụng:</Text>
                          <Select
                            style={{ width: '100%' }}
                            value={filterUsed}
                            onChange={setFilterUsed}
                            placeholder="Chọn trạng thái"
                          >
                            <Select.Option value="all">Tất cả</Select.Option>
                            <Select.Option value="used">Đã sử dụng</Select.Option>
                            <Select.Option value="unused">Chưa sử dụng</Select.Option>
                          </Select>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={8} lg={8}>
                        <div>
                          <Text strong style={{ display: 'block', marginBottom: '4px' }}>Lọc theo ngày:</Text>
                          <RangePicker
                            style={{ width: '100%' }}
                            value={filterDateRange}
                            onChange={setFilterDateRange}
                            placeholder={['Từ ngày', 'Đến ngày']}
                            format="DD/MM/YYYY"
                            allowClear
                          />
                        </div>
                      </Col>
                      <Col flex="auto" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                        <Button 
                          type="primary" 
                          icon={<PlusOutlined />}
                          onClick={handleAddHoliday}
                          size="large"
                          style={{
                            height: 48,
                            fontSize: 16,
                            fontWeight: 600,
                            borderRadius: 12,
                            padding: '0 32px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            border: 'none',
                            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)',
                            transition: 'all 0.3s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.4)';
                          }}
                        >
                          Thêm ngày nghỉ lễ
                        </Button>
                      </Col>
                    </Row>
                  </div>

                  {getFilteredHolidays().length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <div>
                          <Title level={4} type="secondary">Chưa có ngày nghỉ lễ</Title>
                          <Text type="secondary">
                            Hãy thêm ngày nghỉ lễ để hệ thống không tạo lịch vào những ngày này
                          </Text>
                        </div>
                      }
                    />
                  ) : (
                    <Table
                      columns={columns}
                      dataSource={getFilteredHolidays()}
                      rowKey="_id"
                      loading={loading}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                          `${range[0]}-${range[1]} của ${total} ngày nghỉ`,
                      }}
                      scroll={{ x: 800 }}
                      size="middle"
                    />
                  )}
                </div>
              )
            }
          ]}
        />
      </Card>

      <Modal
        title={editingHoliday ? 'Sửa ngày nghỉ lễ' : 'Thêm ngày nghỉ lễ'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setIsRecurring(false);
          setSelectedStartDate(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveHoliday}
          initialValues={{ isRecurring: false }}
        >
          <Form.Item
            name="name"
            label="Tên ngày nghỉ lễ"
            rules={[
              { required: true, message: 'Vui lòng nhập tên ngày nghỉ' },
              { max: 100, message: 'Tên không được quá 100 ký tự' }
            ]}
          >
            <Input placeholder="VD: Tết Nguyên Đán, Nghỉ lễ 30/4..." />
          </Form.Item>

          <Form.Item name="isRecurring" hidden>
            <Input type="hidden" />
          </Form.Item>

          <>
            {getNonRecurringHolidays().length > 0 && (
              <Alert
                message="Các ngày đã được đánh dấu không thể chọn"
                description={
                  <div>
                    <Text>Các khoảng thời gian đã có ngày nghỉ:</Text>
                    <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                      {getNonRecurringHolidays().map(h => (
                        <li key={h._id}>
                          <Text strong>{h.name}:</Text> {dayjs(h.startDate).format('DD/MM/YYYY')} - {dayjs(h.endDate).format('DD/MM/YYYY')}
                        </li>
                      ))}
                    </ul>
                  </div>
                }
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
              
              <Form.Item
                name="startDate"
                label="Ngày bắt đầu"
                rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày bắt đầu"
                  disabledDate={disabledStartDate}
                  defaultPickerValue={getFirstValidDate()} 
                  onChange={(date) => {
                    setSelectedStartDate(date);
                    form.setFieldValue('endDate', null);
                  }}
                />
              </Form.Item>

              <Form.Item
                name="endDate"
                label="Ngày kết thúc"
                rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder={selectedStartDate ? "Chọn ngày kết thúc" : "Chọn ngày bắt đầu trước"}
                  disabledDate={disabledEndDate}
                  disabled={!selectedStartDate}
                  defaultPickerValue={selectedStartDate || getFirstValidDate()}
                />
              </Form.Item>
          </>

          <Form.Item
            name="note"
            label="Ghi chú"
          >
            <TextArea 
              rows={6}
              placeholder="Ghi chú thêm về ngày nghỉ..."
              maxLength={200}
              className="custom-textarea"
            />
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
                setIsRecurring(false);
              }}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingHoliday ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default HolidayManagement;

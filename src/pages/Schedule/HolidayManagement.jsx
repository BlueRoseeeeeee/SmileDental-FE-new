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
import {  debounce } from '../../utils/searchUtils.js';

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
  const [form] = Form.useForm(); // Move form here
  
  // 🆕 Blocked ranges from backend
  const [blockedMonths, setBlockedMonths] = useState([]);
  const [existingHolidays, setExistingHolidays] = useState([]);
  const [selectedStartDate, setSelectedStartDate] = useState(null); // 🆕 Track selected start date
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('recurring'); // Mặc định là "Ngày cố định"
  const [filterActive, setFilterActive] = useState('all');
  const [filterUsed, setFilterUsed] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState(null); // [startDate, endDate] hoặc null

  // Helper function to get non-recurring holidays (for alert display)
  const getNonRecurringHolidays = () => {
    return holidays.filter(h => !h.isRecurring && h._id !== editingHoliday?._id);
  };

  // 🆕 Calculate first valid date (ngày hợp lệ đầu tiên có thể chọn)
  const getFirstValidDate = () => {
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    let checkDate = tomorrow;
    const maxCheck = 365; // Check tối đa 1 năm
    
    // Tìm ngày hợp lệ đầu tiên (không bị disable)
    for (let i = 0; i < maxCheck; i++) {
      if (!disabledStartDate(checkDate)) {
        return checkDate;
      }
      checkDate = checkDate.add(1, 'day');
    }
    
    // Fallback: nếu không tìm thấy trong 1 năm, return ngày mai
    return tomorrow;
  };

  // 🆕 Load blocked date ranges
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

  // 🆕 Disable dates for START DATE picker
  const disabledStartDate = (current) => {
    if (!current) return false;
    
    try {
      const currentDate = current.startOf('day');
      const today = dayjs().startOf('day');
      
      // 1. Disable hôm nay và quá khứ
      if (currentDate.isSameOrBefore(today)) {
        return true;
      }
      
      // 2. Disable tháng đã có lịch (blocked months)
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
      
      // 3. Disable ngày trong khoảng ngày nghỉ lễ hiện có (trừ ngày đang edit)
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

  // 🆕 Disable dates for END DATE picker
  const disabledEndDate = (current) => {
    if (!current) return false;
    
    try {
      const currentDate = current.startOf('day');
      const today = dayjs().startOf('day');
      
      // 1. Không có start date thì disable tất cả
      if (!selectedStartDate) {
        return true;
      }
      
      const startDate = dayjs(selectedStartDate).startOf('day');
      
      // 2. Disable ngày trước start date
      if (currentDate.isBefore(startDate)) {
        return true;
      }
      
      // 3. Disable hôm nay và quá khứ
      if (currentDate.isSameOrBefore(today)) {
        return true;
      }
      
      // 4. Tìm ngày nghỉ lễ GẦN NHẤT SAU start date
      if (existingHolidays && existingHolidays.length > 0) {
        const filteredHolidays = existingHolidays.filter(h => 
          h && h.startDate && (!editingHoliday || h.id !== editingHoliday._id)
        );
        
        const nextHoliday = filteredHolidays
          .filter(h => dayjs(h.startDate).isAfter(startDate))
          .sort((a, b) => dayjs(a.startDate) - dayjs(b.startDate))[0];
        
        // 5. Nếu có ngày nghỉ lễ tiếp theo, disable từ ngày đó trở đi
        if (nextHoliday && nextHoliday.startDate) {
          const nextStart = dayjs(nextHoliday.startDate).startOf('day');
          if (currentDate.isSameOrAfter(nextStart)) {
            return true;
          }
        }
      }
      
      // 6. Disable tháng đã có lịch
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

  // Load holidays từ API
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

  // Filter và search data
  const getFilteredHolidays = () => {
    let filtered = holidays;
    
    // ⭐ Filter theo tab (cố định / không cố định)
    if (activeTab === 'recurring') {
      filtered = filtered.filter(h => h.isRecurring === true);
    } else if (activeTab === 'range') {
      filtered = filtered.filter(h => !h.isRecurring);
    }
    
    // Search trong tên và ghi chú
    if (searchTerm) {
      filtered = filtered.filter(holiday => {
        const name = holiday.name?.toLowerCase() || '';
        const note = holiday.note?.toLowerCase() || '';
        const term = searchTerm.toLowerCase();
        return name.includes(term) || note.includes(term);
      });
    }
    
    // 🆕 Filter theo khoảng ngày (RangePicker) - CHỈ áp dụng cho ngày nghỉ lễ
    if (filterDateRange && activeTab === 'range' && filterDateRange.length === 2) {
      filtered = filtered.filter(holiday => {
        if (holiday.isRecurring) return true; // Keep all recurring holidays
        
        const holidayStart = dayjs(holiday.startDate).startOf('day');
        const holidayEnd = dayjs(holiday.endDate).startOf('day');
        const filterStart = filterDateRange[0].startOf('day');
        const filterEnd = filterDateRange[1].startOf('day');
        
        // Kiểm tra overlap: holiday phải overlap với khoảng filter
        // Holiday overlap nếu: holidayStart <= filterEnd && holidayEnd >= filterStart
        return holidayStart.isSameOrBefore(filterEnd) && holidayEnd.isSameOrAfter(filterStart);
      });
    }
    
    // ⭐ Filter theo isActive - CHỈ áp dụng cho ngày cố định
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
    
    // 🆕 Filter theo hasBeenUsed - CHỈ áp dụng cho ngày nghỉ lễ (không cố định)
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
    
    // Sort sau khi đã filter xong
    if (activeTab === 'range') {
      // Sort ngày nghỉ lễ theo ngày bắt đầu (mới nhất trước - descending)
      filtered = filtered.sort((a, b) => {
        if (!a.startDate || !b.startDate) return 0;
        return dayjs(b.startDate) - dayjs(a.startDate);
      });
    }
    
    return filtered;
  };

  // Debounced search function
  const debouncedSearch = debounce((value) => {
    setSearchTerm(value);
  }, 300);

  // Thêm ngày nghỉ lễ
  const handleAddHoliday = async () => {
    setEditingHoliday(null);
    setIsRecurring(false);
    setSelectedStartDate(null); // 🆕 Reset selected start date
    form.resetFields();
    form.setFieldsValue({ isRecurring: false });
    
    // 🆕 Reload blocked ranges để có data mới nhất
    await loadBlockedRanges();
    
    setModalVisible(true);
  };

  // Sửa ngày nghỉ lễ
  const handleEditHoliday = async (holiday) => {
    setEditingHoliday(holiday);
    setIsRecurring(holiday.isRecurring || false);
    
    const formData = {
      name: holiday.name,
      note: holiday.note,
      isRecurring: holiday.isRecurring || false
    };
    
    if (holiday.isRecurring) {
      // Ngày cố định - set dayOfWeek
      formData.dayOfWeek = holiday.dayOfWeek;
      setSelectedStartDate(null); // 🆕 Không cần cho recurring
    } else {
      // Ngày nghỉ lễ - set startDate và endDate
      const startDate = dayjs(holiday.startDate);
      const endDate = dayjs(holiday.endDate);
      
      formData.startDate = startDate;
      formData.endDate = endDate;
      setSelectedStartDate(startDate); // 🆕 Set selected start date
    }
    
    form.setFieldsValue(formData);
    
    // 🆕 Reload blocked ranges để có data mới nhất
    await loadBlockedRanges();
    
    setModalVisible(true);
  };

  // Xóa ngày nghỉ lễ
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

  // ⭐ Toggle isActive cho ngày nghỉ cố định
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

  // Lưu ngày nghỉ lễ
  const handleSaveHoliday = async (values) => {
    try {
      const holidayData = {
        name: values.name,
        note: values.note || '',
        isRecurring: values.isRecurring || false
      };
      
      if (values.isRecurring) {
        // ⭐ Ngày nghỉ cố định - chỉ cần dayOfWeek và set isActive = true mặc định
        holidayData.dayOfWeek = values.dayOfWeek;
        holidayData.isActive = true; // ⭐ Mặc định bật khi tạo mới
      } else {
        // ⭐ Ngày nghỉ lễ - cần startDate và endDate
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

  // Định nghĩa columns cho Table
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
          {/* ⭐ Chỉ hiển thị note cho ngày không cố định */}
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
        // ⭐ Không hiển thị cho ngày nghỉ cố định
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
        // ⭐ Không hiển thị cho ngày nghỉ cố định
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
        // ⭐ Hiển thị thứ trong tuần cho ngày cố định
        if (record.isRecurring) {
          const dayNames = ['', 'Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
          return (
            <Space>
              <ClockCircleOutlined />
              <Text>{dayNames[record.dayOfWeek] || 'N/A'}</Text>
            </Space>
          );
        }
        // Tính số ngày cho ngày nghỉ không cố định
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
        // 🆕 Cho ngày nghỉ lễ (không cố định): hiển thị hasBeenUsed
        if (!record.isRecurring) {
          return record.hasBeenUsed ? (
            <Tag color="success">Đã sử dụng</Tag>
          ) : (
            <Tag color="default">Chưa sử dụng</Tag>
          );
        }
        // Cho ngày cố định: hiển thị isActive
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
        // ⭐ Xóa logic: Ngày cố định KHÔNG được xóa, Ngày không cố định CÓ hasBeenUsed=true KHÔNG được xóa
        const canDelete = !record.isRecurring && record.hasBeenUsed !== true;
        // 🆕 Sửa logic: Ngày không cố định có hasBeenUsed=true KHÔNG được sửa
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
            {/* ⭐ Ngày cố định: Chỉ cho toggle isActive */}
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
              /* ⭐ Ngày không cố định: Cho phép edit nếu chưa được sử dụng */
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

  // Load holidays khi component mount
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
            // Reset conditional filters khi đổi tab
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
                  {/* Search và Filter cho tab Ngày cố định */}
                  <div style={{ marginBottom: '16px' }}>
                    <Row gutter={[16, 16]} align="middle" style={{ marginBottom: '16px' }}>
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <div>
                          <Text strong style={{ display: 'block', marginBottom: '4px' }}>Tìm kiếm:</Text>
                          <Input
                            placeholder="Tìm kiếm ngày nghỉ..."
                            prefix={<SearchOutlined />}
                            value={searchTerm}
                            onChange={(e) => debouncedSearch(e.target.value)}
                            allowClear
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
                  {/* Search và Filter cho tab Ngày nghỉ lễ */}
                  <div style={{ marginBottom: '16px' }}>
                    <Row gutter={[16, 16]} align="middle" style={{ marginBottom: '16px' }}>
                      <Col xs={24} sm={12} md={6} lg={5}>
                        <div>
                          <Text strong style={{ display: 'block', marginBottom: '4px' }}>Tìm kiếm:</Text>
                          <Input
                            placeholder="Tìm kiếm ngày nghỉ..."
                            prefix={<SearchOutlined />}
                            value={searchTerm}
                            onChange={(e) => debouncedSearch(e.target.value)}
                            allowClear
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
                      {/* Nút Thêm ngày nghỉ lễ - CHỈ hiển thị ở tab Ngày nghỉ lễ */}
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

      {/* Modal thêm/sửa ngày nghỉ lễ */}
      <Modal
        title={editingHoliday ? 'Sửa ngày nghỉ lễ' : 'Thêm ngày nghỉ lễ'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setIsRecurring(false);
          setSelectedStartDate(null); // 🆕 Reset selected start date
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

          {/* ⭐ Hidden field - Chỉ cho tạo ngày KHÔNG cố định */}
          <Form.Item name="isRecurring" hidden>
            <Input type="hidden" />
          </Form.Item>

          {/* ⭐ Hiển thị startDate/endDate cho ngày nghỉ lễ */}
          <>
            {/* ⭐ Hiển thị thông báo về các khoảng thời gian đã có ngày nghỉ */}
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
                    setSelectedStartDate(date); // 🆕 Track start date
                    // Reset end date khi start date thay đổi
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
                  disabled={!selectedStartDate} // 🆕 Disable cho đến khi chọn start date
                  defaultPickerValue={selectedStartDate || getFirstValidDate()} // 🆕 Jump to start date hoặc first valid
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

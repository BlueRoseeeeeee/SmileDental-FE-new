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
  Switch
} from 'antd';
import { 
  PlusOutlined, 
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
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

const HolidayManagement = () => {
  console.log('HolidayManagement rendered');
  
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
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterType, setFilterType] = useState('recurring'); // Mặc định là "Ngày cố định"
  const [filterActive, setFilterActive] = useState('all');
  const [filterUsed, setFilterUsed] = useState('all');
  const [filterDate, setFilterDate] = useState(null);

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
      console.log('Blocked ranges response:', response);
      
      if (response && response.success && response.data) {
        setBlockedMonths(response.data.blockedMonths || []);
        setExistingHolidays(response.data.existingHolidays || []);
      } else {
        // Fallback to empty arrays
        setBlockedMonths([]);
        setExistingHolidays([]);
      }
    } catch (error) {
      console.error('Error loading blocked ranges:', error);
      // Set empty arrays on error to prevent crashes
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
      console.error('Error in disabledStartDate:', error);
      return false; // Fallback: allow selection if error
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
      console.error('Error in disabledEndDate:', error);
      return false; // Fallback: allow selection if error
    }
  };

  // Load holidays từ API
  const loadHolidays = async () => {
    try {
      setLoading(true);
      console.log('Loading holidays...');
      
      const response = await scheduleConfigService.getHolidays();
      console.log('Holidays response:', response);
      
      // API trả về data.holidays array
      setHolidays(response.data?.holidays || []);
    } catch (error) {
      console.error('Error loading holidays:', error);
      
      // Ưu tiên hiển thị lỗi từ backend trước
      let errorMessage = 'Không thể tải danh sách ngày nghỉ';
      
      if (error.response && error.response.data) {
        const { message, type } = error.response.data;
        
        // Nếu có message từ backend, ưu tiên hiển thị
        if (message) {
          errorMessage = message;
        }
        
        console.log('Backend error:', { message, type });
      } else if (error.message) {
        // Nếu không có response từ backend, sử dụng error.message
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter và search data
  const getFilteredHolidays = () => {
    let filtered = holidays;
    
    // ⭐ Filter theo loại (cố định / không cố định)
    if (filterType && filterType !== 'all') {
      if (filterType === 'recurring') {
        filtered = filtered.filter(h => h.isRecurring === true);
      } else if (filterType === 'range') {
        filtered = filtered.filter(h => !h.isRecurring);
      }
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
    
    // 🆕 Filter theo ngày (DatePicker) - CHỈ áp dụng cho ngày nghỉ lễ
    if (filterDate && filterType === 'range') {
      filtered = filtered.filter(holiday => {
        if (holiday.isRecurring) return true; // Keep all recurring holidays
        const selectedDate = filterDate.startOf('day');
        const start = dayjs(holiday.startDate).startOf('day');
        const end = dayjs(holiday.endDate).startOf('day');
        // Check if selected date falls within holiday range
        return selectedDate.isSameOrAfter(start) && selectedDate.isSameOrBefore(end);
      });
    }
    
    // Filter theo năm - CHỈ áp dụng cho ngày nghỉ không cố định (DEPRECATED - sẽ bỏ)
    if (filterYear && filterYear !== 'all' && filterType !== 'recurring' && filterType !== 'range') {
      filtered = filtered.filter(holiday => {
        if (holiday.isRecurring) return true;
        const year = dayjs(holiday.startDate).year();
        return year === parseInt(filterYear);
      });
    }
    
    // Filter theo tháng - CHỈ áp dụng cho ngày nghỉ không cố định (DEPRECATED - sẽ bỏ)
    if (filterMonth && filterMonth !== 'all' && filterType !== 'recurring' && filterType !== 'range') {
      filtered = filtered.filter(holiday => {
        if (holiday.isRecurring) return true;
        const month = dayjs(holiday.startDate).month() + 1;
        return month === parseInt(filterMonth);
      });
    }
    
    // ⭐ Filter theo isActive - CHỈ áp dụng cho ngày cố định
    if (filterActive && filterActive !== 'all' && filterType === 'recurring') {
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
    if (filterUsed && filterUsed !== 'all' && filterType === 'range') {
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
    
    
    return filtered;
  };

  // Debounced search function
  const debouncedSearch = debounce((value) => {
    setSearchTerm(value);
  }, 300);


  // Get years from holidays data
  const getAvailableYears = () => {
    // Hiển thị năm từ năm hiện tại +1 đến năm hiện tại -5
    const currentYear = dayjs().year();
    const years = [];
    for (let i = currentYear + 1; i >= currentYear - 5; i--) {
      years.push(i);
    }
    return years;
  };

  // Get months from holidays data
  const getAvailableMonths = () => {
    // Hiển thị tất cả tháng từ 1-12
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

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
      console.log('Deleting holiday:', holidayId);
      await scheduleConfigService.removeHoliday(holidayId);
      
      // Cập nhật local state
      setHolidays(holidays.filter(h => h._id !== holidayId));
      toast.success('Xóa ngày nghỉ thành công!');
    } catch (error) {
      console.error('Error deleting holiday:', error);
      
      // ⭐ Hiển thị lỗi chi tiết từ BE
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
      console.log('Toggling holiday active status:', holidayId, checked);
      
      // Gọi API update với chỉ isActive
      await scheduleConfigService.updateHoliday(holidayId, { isActive: checked });
      
      // Cập nhật local state
      setHolidays(holidays.map(h => 
        h._id === holidayId ? { ...h, isActive: checked } : h
      ));
      
      toast.success(`${checked ? 'Bật' : 'Tắt'} ngày nghỉ thành công!`);
    } catch (error) {
      console.error('Error toggling holiday:', error);
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

      console.log('Saving holiday:', holidayData);

      if (editingHoliday) {
        // Update existing holiday
        const response = await scheduleConfigService.updateHoliday(editingHoliday._id, holidayData);
        console.log('Update holiday response:', response);
        
        // Reload holidays để lấy data mới nhất
        await loadHolidays();
        toast.success('Cập nhật ngày nghỉ thành công!');
      } else {
        // Add new holiday
        const response = await scheduleConfigService.addHoliday(holidayData);
        console.log('Add holiday response:', response);
        
        // Reload holidays để lấy data mới nhất
        await loadHolidays();
        toast.success('Thêm ngày nghỉ thành công!');
      }

      setModalVisible(false);
      form.resetFields();
      setIsRecurring(false);
      setEditingHoliday(null);
    } catch (error) {
      console.error('Error saving holiday:', error);
      
      // ⭐ Hiển thị lỗi chi tiết từ BE validation
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
      try {
        console.log('🔄 Initializing HolidayManagement data...');
        await Promise.all([
          loadHolidays(),
          loadBlockedRanges()
        ]);
        console.log('✅ HolidayManagement data loaded successfully');
      } catch (error) {
        console.error('❌ Error initializing HolidayManagement:', error);
      }
    };
    
    initializeData();
  }, []);

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 64px)',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '32px 24px'
    }}>
      {/* Header Card */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 16,
          border: '2px solid #dbeafe',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          boxShadow: smileCareTheme.shadows.lg
        }}
        bodyStyle={{ padding: '24px 32px' }}
      >
        <Space size={16} align="center">
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}>
            <CalendarOutlined style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <div>
            <Title level={3} style={{ margin: 0, color: '#fff', fontWeight: 700 }}>
              Quản lý Ngày nghỉ lễ
            </Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 }}>
              Quản lý các ngày nghỉ cố định và ngày nghỉ lễ của phòng khám
            </Text>
          </div>
        </Space>
      </Card>

      <Card
        style={{
          borderRadius: 16,
          border: '2px solid #dbeafe',
          boxShadow: smileCareTheme.shadows.lg
        }}
        bodyStyle={{ padding: '28px 32px' }}
      >
        {/* Search và Filter */}
        <div style={{ marginBottom: '16px' }}>
          {/* Row 1: Bộ lọc */}
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
                <Text strong style={{ display: 'block', marginBottom: '4px' }}>Lọc theo loại:</Text>
                <Select
                  style={{ width: '100%' }}
                  value={filterType}
                  onChange={(value) => {
                    setFilterType(value);
                    // Reset conditional filters khi đổi loại
                    if (value === 'range') {
                      setFilterActive('all');
                      setFilterYear('all');
                      setFilterMonth('all');
                    } else if (value === 'recurring') {
                      setFilterUsed('all');
                      setFilterDate(null);
                      setFilterYear('all');
                      setFilterMonth('all');
                    }
                  }}
                  placeholder="Chọn loại"
                >
                  <Select.Option value="recurring">Ngày cố định</Select.Option>
                  <Select.Option value="range">Ngày nghỉ lễ</Select.Option>
                </Select>
              </div>
            </Col>
            {/* ⭐ Chỉ hiển thị filter trạng thái cho ngày cố định */}
            {filterType === 'recurring' && (
              <Col xs={24} sm={12} md={6} lg={4}>
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
            )}
            {/* 🆕 Chỉ hiển thị filter hasBeenUsed cho ngày nghỉ lễ */}
            {filterType === 'range' && (
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
            )}
            {/* 🆕 Chỉ hiển thị filter ngày cho ngày nghỉ lễ */}
            {filterType === 'range' && (
              <Col xs={24} sm={12} md={6} lg={5}>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '4px' }}>Lọc theo ngày:</Text>
                  <DatePicker
                    style={{ width: '100%' }}
                    value={filterDate}
                    onChange={setFilterDate}
                    placeholder="Chọn ngày"
                    format="DD/MM/YYYY"
                    allowClear
                  />
                </div>
              </Col>
            )}
            {/* Nút Thêm cố định bên phải */}
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
                <Title level={4} type="secondary">Chưa có ngày nghỉ </Title>
                <Text type="secondary">
                  Hãy thêm ngày nghỉ  để hệ thống không tạo lịch vào những ngày này
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
                  defaultPickerValue={getFirstValidDate()} // 🆕 Auto jump to first valid date
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

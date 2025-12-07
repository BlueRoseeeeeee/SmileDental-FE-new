/**
 * @author: HoTram 
 * BulkCreateScheduleModal - Modal tạo lịch cho nhiều phòng cùng lúc
 * Logic:
 * - Disabled tháng nếu TẤT CẢ phòng đã có lịch tháng đó
 * - Disabled ca nếu TẤT CẢ phòng đã có ca đó trong khoảng thời gian đã chọn
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  Form,
  DatePicker,
  Checkbox,
  Button,
  Space,
  Alert,
  Spin,
  Typography,
  Row,
  Col,
  Tag,
  Divider,
  Progress,
  List
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import viVN from 'antd/locale/vi_VN';
import { toast } from '../../services/toastService';
import scheduleService from '../../services/scheduleService';

// Set dayjs locale to Vietnamese
dayjs.locale('vi');

const { Title, Text } = Typography;

const SHIFT_COLORS = {
  morning: 'gold',
  afternoon: 'blue',
  evening: 'purple'
};

const SHIFT_NAMES = {
  morning: 'Ca Sáng',
  afternoon: 'Ca Chiều',
  evening: 'Ca Tối'
};

const BulkCreateScheduleModal = ({
  visible,
  onCancel,
  onSuccess,
  selectedRooms // Array of selected room objects
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [bulkInfo, setBulkInfo] = useState(null); // Data from getBulkRoomSchedulesInfo
  const [loadingBulkInfo, setLoadingBulkInfo] = useState(false);

  // Form values
  const [dateRange, setDateRange] = useState(null); // [startMonth, endMonth]
  const [fromMonth, setFromMonth] = useState(null); // 🆕 Tháng bắt đầu
  const [toMonth, setToMonth] = useState(null); // 🆕 Tháng kết thúc
  const [startDate, setStartDate] = useState(null);
  const [selectedShifts, setSelectedShifts] = useState([]);

  // Progress tracking
  const [progress, setProgress] = useState(null); // { current, total, results: [] }

  // 🆕 Modal chi tiết ca
  const [shiftDetailModalVisible, setShiftDetailModalVisible] = useState(false);
  const [selectedShiftForDetail, setSelectedShiftForDetail] = useState(null); // 'morning' | 'afternoon' | 'evening'
  const [selectedMonthForDetail, setSelectedMonthForDetail] = useState(null); // { month, year } cho modal chi tiết

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setDateRange(null);
      setFromMonth(null);
      setToMonth(null);
      setStartDate(null);
      setSelectedShifts([]);
      setBulkInfo(null);
      setProgress(null);
      
      // 🆕 Fetch bulk info ngay khi mở modal để biết tháng nào có thể tạo
      fetchInitialBulkInfo();
    }
  }, [visible, form]);

  // 🆕 Fetch initial bulk info (24 tháng tiếp theo) để biết tháng nào có thể tạo
  const fetchInitialBulkInfo = async () => {
    if (!selectedRooms || selectedRooms.length === 0) {
      console.warn('⚠️ selectedRooms is empty!', selectedRooms);
      return;
    }

    console.log('📊 Fetching bulk info for rooms:', selectedRooms.length, selectedRooms.map(r => r.name || r._id));

    setLoadingBulkInfo(true);
    try {
      const today = dayjs();
      const fromMonth = today.month() + 1;
      const fromYear = today.year();
      const futureDate = today.add(24, 'month');
      const toMonth = futureDate.month() + 1;
      const toYear = futureDate.year();

      const roomIds = selectedRooms.map(r => r._id);

      const response = await scheduleService.getBulkRoomSchedulesInfo({
        roomIds,
        fromMonth,
        toMonth,
        fromYear,
        toYear
      });

      if (response.success) {
        console.log('📊 Initial bulk info (24 months):', response.data);
        console.log('📋 Available months:', response.data.availableMonths?.map(m => `${m.month}/${m.year}`).join(', '));
        console.log('📋 Available shifts:', response.data.availableShifts);
        setBulkInfo(response.data);
        
        // 🎯 Tự động chọn tháng đầu tiên có thể tạo làm fromMonth
        if (response.data.availableMonths && response.data.availableMonths.length > 0) {
          const firstAvailable = response.data.availableMonths[0];
          const firstMonth = dayjs().year(firstAvailable.year).month(firstAvailable.month - 1);
          setFromMonth(firstMonth);
          form.setFieldsValue({ fromMonth: firstMonth });
          
          // ❌ REMOVED: Không tự động chọn toMonth - Để user tự chọn
          // const lastAvailable = response.data.availableMonths[response.data.availableMonths.length - 1];
          // const lastMonth = dayjs().year(lastAvailable.year).month(lastAvailable.month - 1);
          // setToMonth(lastMonth);
          // form.setFieldsValue({ toMonth: lastMonth });
          
          console.log(`🎯 Auto-selected fromMonth: ${firstAvailable.month}/${firstAvailable.year}`);
        } else {
          console.warn('⚠️ No available months found!');
        }
      } else {
        toast.error(response.message || 'Không thể lấy thông tin lịch');
      }
    } catch (error) {
      console.error('Error fetching initial bulk info:', error);
      toast.error('Lỗi khi lấy thông tin lịch');
    } finally {
      setLoadingBulkInfo(false);
    }
  };

  // Fetch bulk room info when date range changes
  useEffect(() => {
    if (!fromMonth || !toMonth) {
      // Nếu chưa chọn đủ → Dùng initial bulkInfo
      return;
    }

    console.log('🔄 useEffect triggered - fromMonth/toMonth changed');
    console.log('  fromMonth:', fromMonth?.format('MM/YYYY'));
    console.log('  toMonth:', toMonth?.format('MM/YYYY'));
    console.log('  selectedRooms:', selectedRooms?.length, selectedRooms);

    const fetchBulkInfo = async () => {
      setLoadingBulkInfo(true);
      try {
        const fMonth = fromMonth.month() + 1;
        const fYear = fromMonth.year();
        const tMonth = toMonth.month() + 1;
        const tYear = toMonth.year();

        const roomIds = selectedRooms?.map(r => r._id) || [];
        console.log('📤 Calling API with roomIds:', roomIds);
        
        if (roomIds.length === 0) {
          console.error('❌ ERROR: roomIds is empty! selectedRooms:', selectedRooms);
          toast.error('Không có phòng được chọn');
          setLoadingBulkInfo(false);
          return;
        }

        const response = await scheduleService.getBulkRoomSchedulesInfo({
          roomIds,
          fromMonth: fMonth,
          toMonth: tMonth,
          fromYear: fYear,
          toYear: tYear
        });

        if (response.success) {
          console.log('📊 Bulk info for selected range:', response.data);
          setBulkInfo(response.data);
        } else {
          toast.error(response.message || 'Không thể lấy thông tin lịch');
        }
      } catch (error) {
        console.error('Error fetching bulk info:', error);
        toast.error('Lỗi khi lấy thông tin lịch');
      } finally {
        setLoadingBulkInfo(false);
      }
    };

    fetchBulkInfo();
  }, [fromMonth, toMonth]); // 🔧 FIX: Remove selectedRooms (stable prop, không cần track)

  // 🆕 Auto-fill startDate when both fromMonth and toMonth are selected
  useEffect(() => {
    if (!fromMonth || !toMonth) {
      setStartDate(null);
      form.setFieldsValue({ startDate: null });
      return;
    }

    const today = dayjs();
    const currentMonth = today.month(); // 0-11
    const currentYear = today.year();
    const selectedMonth = fromMonth.month(); // 0-11
    const selectedYear = fromMonth.year();

    let suggestedDate;

    // Nếu chọn tháng hiện tại → Ngày mai
    if (selectedMonth === currentMonth && selectedYear === currentYear) {
      suggestedDate = today.add(1, 'day');
    } else {
      // Nếu chọn tháng khác → Ngày 1 của tháng đó
      suggestedDate = fromMonth.startOf('month');
    }

    setStartDate(suggestedDate);
    form.setFieldsValue({ startDate: suggestedDate });
  }, [fromMonth, toMonth, form]);

  // Disable dates logic
  const disabledDate = useCallback((current) => {
    if (!current) return false;

    // Không cho chọn quá khứ
    const today = dayjs().startOf('month');
    if (current.isBefore(today, 'month')) {
      return true;
    }

    // Không cho chọn quá xa (2 năm)
    const maxDate = dayjs().add(2, 'year');
    if (current.isAfter(maxDate, 'month')) {
      return true;
    }

    return false;
  }, []);

  // 🔥 Available months (đã filter 7 tháng) - PHẢI ĐỊNH NGHĨA TRƯỚC disabledFromMonth và disabledToMonth
  const availableMonths = useMemo(() => {
    if (!bulkInfo || !bulkInfo.availableMonths) return [];
    
    // 🆕 Giới hạn: Chỉ hiển thị các tháng trong khoảng 7 tháng từ hiện tại
    const maxDate = dayjs().add(7, 'months');
    
    return bulkInfo.availableMonths
      .filter(m => {
        const monthDate = dayjs().year(m.year).month(m.month - 1);
        return !monthDate.isAfter(maxDate, 'month');
      })
      .map(m => ({
        month: m.month,
        year: m.year,
        label: `${m.month}/${m.year}`
      }));
  }, [bulkInfo]);

  // 🆕 Disable months for FROM picker - Chỉ cho chọn tháng có trong availableMonths (ĐÃ FILTER 7 THÁNG)
  const disabledFromMonth = useCallback((current) => {
    if (!current || !bulkInfo) return false;

    // Check cơ bản
    if (disabledDate(current)) return true;

    const month = current.month() + 1;
    const year = current.year();

    // 🔥 FIX: Check theo availableMonths ĐÃ FILTER (7 tháng), KHÔNG phải bulkInfo.availableMonths gốc
    if (!availableMonths || availableMonths.length === 0) {
      return true; // Nếu không có tháng nào → disable tất cả
    }

    const isAvailable = availableMonths.some(
      m => m.month === month && m.year === year
    );

    return !isAvailable; // Disable nếu KHÔNG có trong availableMonths đã filter
  }, [bulkInfo, disabledDate, availableMonths]);

  // 🆕 Disable months for TO picker - Chỉ cho chọn >= fromMonth và có trong availableMonths (ĐÃ FILTER 7 THÁNG)
  const disabledToMonth = useCallback((current) => {
    if (!current || !bulkInfo) return false;

    // Check cơ bản
    if (disabledDate(current)) return true;

    // Phải >= fromMonth
    if (fromMonth && current.isBefore(fromMonth, 'month')) {
      return true;
    }

    const month = current.month() + 1;
    const year = current.year();

    // 🔥 FIX: Check theo availableMonths ĐÃ FILTER (7 tháng), KHÔNG phải bulkInfo.availableMonths gốc
    if (!availableMonths || availableMonths.length === 0) {
      return true;
    }

    const isAvailable = availableMonths.some(
      m => m.month === month && m.year === year
    );

    return !isAvailable; // Disable nếu KHÔNG có trong availableMonths đã filter
  }, [bulkInfo, fromMonth, disabledDate, availableMonths]);

  // 🆕 Check if shift is active in config
  // 🔧 FIX: Backend đã check schedule.shiftConfig[shift].isActive rồi
  // Không cần check config global nữa
  const availableShifts = useMemo(() => {
    if (!bulkInfo || !bulkInfo.availableShifts) {
      return { 
        morning: false, 
        afternoon: false, 
        evening: false 
      };
    }
    
    // Backend đã check tất cả schedules và filter theo isActive
    return bulkInfo.availableShifts;
  }, [bulkInfo]);

  // Handle form submit
  const handleSubmit = async () => {
    try {
      await form.validateFields();

      if (!fromMonth || !toMonth) {
        toast.error('Vui lòng chọn khoảng thời gian');
        return;
      }

      if (!startDate) {
        toast.error('Vui lòng chọn ngày bắt đầu');
        return;
      }

      if (selectedShifts.length === 0) {
        toast.error('Vui lòng chọn ít nhất 1 ca');
        return;
      }

      setCreating(true);
      setProgress({ current: 0, total: selectedRooms.length, results: [] });

      const fMonth = fromMonth.month() + 1;
      const fYear = fromMonth.year();
      const tMonth = toMonth.month() + 1;
      const tYear = toMonth.year();

      const roomIds = selectedRooms.map(r => r._id);

      const response = await scheduleService.generateBulkRoomSchedules({
        roomIds,
        fromMonth: fMonth,
        toMonth: tMonth,
        fromYear: fYear,
        toYear: tYear,
        startDate: startDate.toISOString(),
        shifts: selectedShifts
      });

      if (response.success) {
        toast.success(response.message || 'Tạo lịch thành công!');
        setProgress({
          current: response.successCount,
          total: response.totalRooms,
          results: response.results || []
        });

        // 🔧 Gọi onSuccess để refresh danh sách phòng, NHƯNG KHÔNG đóng modal
        if (onSuccess) onSuccess();
        
        // ❌ REMOVED: Auto-close modal - Để người dùng tự đóng để xem kết quả
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi tạo lịch');
        if (response.results) {
          setProgress({
            current: response.successCount || 0,
            total: response.totalRooms || selectedRooms.length,
            results: response.results
          });
        }
      }
    } catch (error) {
      console.error('Error creating bulk schedules:', error);
      toast.error('Lỗi khi tạo lịch cho nhiều phòng');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setDateRange(null);
    setFromMonth(null);
    setToMonth(null);
    setStartDate(null);
    setSelectedShifts([]);
    setBulkInfo(null);
    setProgress(null);
    onCancel();
  };

  // Validate start date
  const disabledStartDate = useCallback((current) => {
    if (!current || !fromMonth || !toMonth) return false;

    // Phải nằm trong khoảng tháng đã chọn
    const startMonth = fromMonth.startOf('month');
    const endMonth = toMonth.endOf('month');

    if (current.isBefore(startMonth, 'day') || current.isAfter(endMonth, 'day')) {
      return true;
    }

    // Không cho chọn quá khứ
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    if (current.isBefore(tomorrow, 'day')) {
      return true;
    }

    return false;
  }, [fromMonth, toMonth]);

  return (
    <Modal
      title={
        <Space>
          <CalendarOutlined />
          <span>Tạo lịch cho {selectedRooms.length} phòng</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={'55%'}
      centered
      footer={
        progress ? [
          // 🔧 Khi đã tạo xong, hiển thị button "Đóng" ở footer
          <Button key="close" type="primary" onClick={handleClose}>
            Đóng
          </Button>
        ] : [
          <Button key="cancel" onClick={handleClose}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={creating}
            onClick={handleSubmit}
            disabled={!fromMonth || !toMonth || !startDate || selectedShifts.length === 0}
          >
            Tạo lịch
          </Button>
        ]
      }
      destroyOnClose
      bodyStyle={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', overflowX: 'hidden' }}
    >
      {/* List selected rooms */}
      <Alert
        message={
          <Space direction="vertical" style={{ width: '100%', padding: '0px 20px' }}>
            <Text strong>Danh sách phòng đã chọn:</Text>
            <Space wrap>
              {selectedRooms.map(room => (
                <Tag key={room._id} color="blue" style={{ fontSize: '12px', padding: '4px 12px' }}>
                  {room.name} {room.roomNumber ? `(${room.roomNumber})` : ''}
                  {room.hasSubRooms && (
                    <Text type="secondary" style={{ fontSize: '12px', marginLeft: 4 }}>
                      ({room.subRooms?.length || 0} buồng)
                    </Text>
                  )}
                </Tag>
              ))}
            </Space>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {progress ? (
        // Show progress
        <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
          <Progress
            percent={Math.round((progress.current / progress.total) * 100)}
            status={progress.current === progress.total ? 'success' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068'
            }}
            style={{ width: '100%' }}
          />

          <Divider />

          <Title level={5}>Kết quả tạo lịch:</Title>
          <List
            size="small"
            dataSource={progress.results}
            renderItem={(result) => (
              <List.Item>
                <Space>
                  {result.success ? (
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
                  )}
                  <div style={{ width: '100%', maxWidth: '100%', wordBreak: 'break-word' }}>
                    <Text strong>{result.roomName}</Text>
                    {result.success ? (
                      <div>
                        <Text type="success">{result.message}</Text>
                        {result.details && (
                          <div style={{ marginTop: 8 }}>
                            {/* Tổng kết chung */}
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {result.details.schedulesCreated > 0 && (
                                <Tag color="green">Tạo mới: {result.details.schedulesCreated} lịch</Tag>
                              )}
                              {result.details.schedulesUpdated > 0 && (
                                <Tag color="blue">Cập nhật: {result.details.schedulesUpdated} lịch</Tag>
                              )}
                              <Tag color="purple">Tổng: {result.details.totalSlots} slots</Tag>
                            </div>
                            
                            {/* Chi tiết theo subroom và shift */}
                            {result.details.subRoomBreakdown && result.details.subRoomBreakdown.length > 0 && (
                              <div style={{ marginTop: 8, paddingLeft: 16, borderLeft: '2px solid #f0f0f0' }}>
                                {result.details.subRoomBreakdown.map((subRoom, idx) => (
                                  <div key={idx} style={{ fontSize: '12px', marginBottom: 4, width: '100%', maxWidth: '100%' }}>
                                    <Text strong style={{ fontSize: '12px' }}>
                                      {subRoom.subRoomName}:
                                    </Text>
                                    <Space size={4} style={{ marginLeft: 8 }} wrap>
                                      {subRoom.shifts.morning > 0 && (
                                        <Tag color="gold" style={{ fontSize: '11px', margin: 0 }}>
                                          Ca Sáng: {subRoom.shifts.morning} slots
                                        </Tag>
                                      )}
                                      {subRoom.shifts.afternoon > 0 && (
                                        <Tag color="orange" style={{ fontSize: '11px', margin: 0 }}>
                                          Ca Chiều: {subRoom.shifts.afternoon} slots
                                        </Tag>
                                      )}
                                      {subRoom.shifts.evening > 0 && (
                                        <Tag color="purple" style={{ fontSize: '11px', margin: 0 }}>
                                          Ca Tối: {subRoom.shifts.evening} slots
                                        </Tag>
                                      )}
                                    </Space>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Text type="danger">{result.error || 'Lỗi không xác định'}</Text>
                    )}
                  </div>
                </Space>
              </List.Item>
            )}
          />

          {/* ❌ REMOVED: Button "Đóng" trùng lặp - Đã có ở footer */}
        </div>
      ) : (
        // Show form
        <Form form={form} layout="vertical" style={{padding: '0 10px'}}>
          {/* 🆕 From Month Picker */}
          <Form.Item
            label={
              <Space>
                <Text strong>Chọn tháng/năm bắt đầu</Text>
                {loadingBulkInfo && <Spin size="small" />}
              </Space>
            }
            name="fromMonth"
            rules={[{ required: true, message: 'Vui lòng chọn tháng bắt đầu' }]}
          >
            <DatePicker
              picker="month"
              format="MM/YYYY"
              style={{ width: '100%' }}
              placeholder="Chọn tháng bắt đầu"
              disabledDate={disabledFromMonth}
              value={fromMonth}
              onChange={(date) => {
                setFromMonth(date);
                // Reset tháng kết thúc và ngày bắt đầu khi đổi tháng bắt đầu
                setToMonth(null);
                setStartDate(null);
                form.setFieldsValue({ toMonth: null, startDate: null });
              }}
              defaultPickerValue={dayjs()} // 🔥 Mặc định mở ở tháng hiện tại
              locale={viVN.DatePicker}
            />
          </Form.Item>

          {/* 🆕 To Month Picker - Chỉ hiển thị sau khi chọn fromMonth */}
          {fromMonth && (
            <Form.Item
              label={<Text strong>Chọn tháng/năm kết thúc</Text>}
              name="toMonth"
              rules={[{ required: true, message: 'Vui lòng chọn tháng kết thúc' }]}
            >
              <DatePicker
                picker="month"
                format="MM/YYYY"
                style={{ width: '100%' }}
                placeholder="Chọn tháng kết thúc"
                disabledDate={disabledToMonth}
                value={toMonth}
                onChange={(date) => {
                  setToMonth(date);
                  // Reset ngày bắt đầu khi đổi tháng kết thúc
                  setStartDate(null);
                  form.setFieldsValue({ startDate: null });
                }}
                defaultPickerValue={fromMonth || dayjs()} // 🔥 Mặc định mở ở tháng bắt đầu hoặc tháng hiện tại
                locale={viVN.DatePicker}
              />
            </Form.Item>
          )}

          {/* Available months info */}
          {bulkInfo && availableMonths.length > 0 && (
            <Alert
              message={
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />{' '}
                    Có {availableMonths.length} tháng có thể tạo lịch trong khoảng đã chọn:
                  </Text>
                  <Space wrap>
                    {availableMonths.map(m => (
                      <Tag key={`${m.year}-${m.month}`} color="green" style={{ fontSize: '12px', padding: '4px 12px', fontWeight:600}}>
                        {m.label}
                      </Tag>
                    ))}
                  </Space>
                </Space>
              }
              type="success"
              style={{ marginBottom: 16 }}
            />
          )}

          {bulkInfo && fromMonth && toMonth && availableMonths.length === 0 && (
            <Alert
              message="Tất cả các phòng đã có đầy đủ lịch cho khoảng thời gian này"
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Start Date Picker - Chỉ hiển thị sau khi chọn cả 2 tháng */}
          {fromMonth && toMonth && (
            <Form.Item
              label={
                <Space direction="vertical" size={0}>
                  <Text strong>Ngày bắt đầu tạo lịch {startDate && (
                    <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'grey' }}>
                      {fromMonth.isSame(dayjs(), 'month') 
                        ? '(Mặc định: Ngày mai (tháng hiện tại))'
                        : '(Mặc định: Ngày 1 của tháng)'
                      }
                    </span>
                  )}</Text>
                </Space>
              }
              name="startDate"
              rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày bắt đầu"
                disabledDate={disabledStartDate}
                onChange={(date) => setStartDate(date)}
                disabled
                locale={viVN.DatePicker}
              />
            </Form.Item>
          )}

          {/* Shift Selection */}
          <Form.Item
            label={<Text strong>Chọn ca làm việc</Text>}
            name="shifts"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 ca' }]}
          >
            <Checkbox.Group
              style={{ width: '100%' }}
              value={selectedShifts}
              onChange={setSelectedShifts}
              disabled={!fromMonth || !toMonth || loadingBulkInfo}
            >
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Space direction="vertical" style={{ width: '100%' }} size={4}>
                    <Checkbox
                      value="morning"
                      disabled={!fromMonth || !toMonth || loadingBulkInfo || !availableShifts.morning}
                    >
                      <Text style={{ fontSize: '14px', padding: '4px 8px' }}>
                        {SHIFT_NAMES.morning}
                      </Text>
                      {(!fromMonth || !toMonth) ? (
                        <Text type="secondary" style={{ fontSize: '12px', marginLeft: 4 }}>
                          (Chọn tháng trước)
                        </Text>
                      ) : !availableShifts.morning && (
                        <Text 
                          type={bulkInfo?.shiftUnavailableReasons?.morning === 'disabled' ? 'warning' : bulkInfo?.shiftUnavailableReasons?.morning === 'partial' ? 'danger' : 'secondary'} 
                          style={{ fontSize: '12px', marginLeft: 4 }}
                        >
                          {bulkInfo?.shiftUnavailableReasons?.morning === 'complete' 
                            ? '(Đầy đủ)' 
                            : bulkInfo?.shiftUnavailableReasons?.morning === 'partial'
                              ? '(Thiếu)'
                              : bulkInfo?.shiftUnavailableReasons?.morning === 'disabled' 
                                ? '(Đang tắt)' 
                                : '(Chưa có lịch)'}
                        </Text>
                      )}
                    </Checkbox>
                    {bulkInfo && fromMonth && toMonth && (
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ padding: 0, height: 'auto' }}
                        onClick={() => {
                          setSelectedShiftForDetail('morning');
                          setShiftDetailModalVisible(true);
                        }}
                      >
                        Chi tiết
                      </Button>
                    )}
                  </Space>
                </Col>
                <Col span={8}>
                  <Space direction="vertical" style={{ width: '100%' }} size={4}>
                    <Checkbox
                      value="afternoon"
                      disabled={!fromMonth || !toMonth || loadingBulkInfo || !availableShifts.afternoon}
                    >
                      <Text style={{ fontSize: '14px', padding: '4px 8px' }}>
                        {SHIFT_NAMES.afternoon}
                      </Text>
                      {(!fromMonth || !toMonth) ? (
                        <Text type="secondary" style={{ fontSize: '12px', marginLeft: 4 }}>
                          (Chọn tháng trước)
                        </Text>
                      ) : !availableShifts.afternoon && (
                        <Text 
                          type={bulkInfo?.shiftUnavailableReasons?.afternoon === 'disabled' ? 'warning' : bulkInfo?.shiftUnavailableReasons?.afternoon === 'partial' ? 'danger' : 'secondary'} 
                          style={{ fontSize: '12px', marginLeft: 4 }}
                        >
                          {bulkInfo?.shiftUnavailableReasons?.afternoon === 'complete' 
                            ? '(Đầy đủ)' 
                            : bulkInfo?.shiftUnavailableReasons?.afternoon === 'partial'
                              ? '(Thiếu)'
                              : bulkInfo?.shiftUnavailableReasons?.afternoon === 'disabled' 
                                ? '(Đang tắt)' 
                                : '(Chưa có lịch)'}
                        </Text>
                      )}
                    </Checkbox>
                    {bulkInfo && fromMonth && toMonth && (
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ padding: 0, height: 'auto' }}
                        onClick={() => {
                          setSelectedShiftForDetail('afternoon');
                          setShiftDetailModalVisible(true);
                        }}
                      >
                        Chi tiết
                      </Button>
                    )}
                  </Space>
                </Col>
                <Col span={8}>
                  <Space direction="vertical" style={{ width: '100%' }} size={4}>
                    <Checkbox
                      value="evening"
                      disabled={!fromMonth || !toMonth || loadingBulkInfo || !availableShifts.evening}
                    >
                      <Text style={{ fontSize: '14px', padding: '4px 8px' }}>
                        {SHIFT_NAMES.evening}
                      </Text>
                      {(!fromMonth || !toMonth) ? (
                        <Text type="secondary" style={{ fontSize: '12px', marginLeft: 4 }}>
                          (Chọn tháng trước)
                        </Text>
                      ) : !availableShifts.evening && (
                        <Text 
                          type={bulkInfo?.shiftUnavailableReasons?.evening === 'disabled' ? 'warning' : bulkInfo?.shiftUnavailableReasons?.evening === 'partial' ? 'danger' : 'secondary'} 
                          style={{ fontSize: '12px', marginLeft: 4 }}
                        >
                          {bulkInfo?.shiftUnavailableReasons?.evening === 'complete' 
                            ? '(Đầy đủ)' 
                            : bulkInfo?.shiftUnavailableReasons?.evening === 'partial'
                              ? '(Thiếu)'
                              : bulkInfo?.shiftUnavailableReasons?.evening === 'disabled' 
                                ? '(Đang tắt)' 
                                : '(Chưa có lịch)'}
                        </Text>
                      )}
                    </Checkbox>
                    {bulkInfo && fromMonth && toMonth && (
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ padding: 0, height: 'auto' }}
                        onClick={() => {
                          setSelectedShiftForDetail('evening');
                          setShiftDetailModalVisible(true);
                        }}
                      >
                        Chi tiết
                      </Button>
                    )}
                  </Space>
                </Col>
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      )}

      {/* 🆕 Modal Chi tiết Ca */}
      <Modal
        title={
          <Space>
            <CalendarOutlined />
            <span>Chi tiết {SHIFT_NAMES[selectedShiftForDetail]} - {fromMonth && toMonth ? `${fromMonth.format('MM/YYYY').replace(/\/(\d{4})/, '/$1')} → ${toMonth.format('MM/YYYY').replace(/\/(\d{4})/, '/$1')}` : ''}</span>
          </Space>
        }
        open={shiftDetailModalVisible}
        onCancel={() => setShiftDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setShiftDetailModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={900}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        {selectedShiftForDetail && bulkInfo && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Summary */}
            <Alert
              message={
                <Space direction="vertical" size={4}>
                  <div>
                    <Text strong>Trạng thái: </Text>
                    {bulkInfo.availableShifts[selectedShiftForDetail] ? (
                      <Tag color="success" icon={<CheckCircleOutlined />}>Có thể tạo</Tag>
                    ) : bulkInfo.shiftUnavailableReasons[selectedShiftForDetail] === 'complete' ? (
                      <Tag color="default">Đã đầy đủ</Tag>
                    ) : bulkInfo.shiftUnavailableReasons[selectedShiftForDetail] === 'partial' ? (
                      <Tag color="orange" icon={<WarningOutlined />}>Thiếu</Tag>
                    ) : (
                      <Tag color="warning" icon={<WarningOutlined />}>Đang tắt</Tag>
                    )}
                  </div>
                  {bulkInfo.shiftUnavailableReasons[selectedShiftForDetail] && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {bulkInfo.shiftUnavailableReasons[selectedShiftForDetail] === 'complete' 
                        ? 'Tất cả phòng đã có ca này trong khoảng thời gian đã chọn'
                        : bulkInfo.shiftUnavailableReasons[selectedShiftForDetail] === 'partial'
                          ? 'Một số phòng/buồng đã có ca, một số chưa có hoặc đang tắt'
                          : 'Ca này đang bị tắt trong cấu hình hệ thống hoặc lịch'}
                    </Text>
                  )}
                </Space>
              }
              type={bulkInfo.availableShifts[selectedShiftForDetail] ? 'success' : 'info'}
            />

            {/* List phòng/buồng */}
            <List
              size="small"
              bordered
              dataSource={bulkInfo.roomsAnalysis}
              renderItem={(room) => {
                // Analyze shift status across all months
                let hasScheduleWithShift = false;
                let hasScheduleWithoutShift = false;
                let hasShiftDisabled = false;
                let noSchedule = false;
                let monthDetails = [];

                room.monthsAnalysis.forEach(monthAnalysis => {
                  const shiftStatus = monthAnalysis.shiftStatus[selectedShiftForDetail];
                  
                  // 🆕 Lấy chi tiết từng buồng nếu có
                  const subRoomsInfo = monthAnalysis.subRoomsDetail || [];
                  
                  if (monthAnalysis.hasSchedule) {
                    if (shiftStatus.allHave) {
                      hasScheduleWithShift = true;
                      monthDetails.push({
                        month: monthAnalysis.month,
                        year: monthAnalysis.year,
                        status: 'complete',
                        label: 'Đã có',
                        subRoomsInfo // 🆕 Thêm thông tin buồng
                      });
                    } else if (shiftStatus.anyActive) {
                      hasScheduleWithoutShift = true;
                      monthDetails.push({
                        month: monthAnalysis.month,
                        year: monthAnalysis.year,
                        status: 'missing',
                        label: 'Chưa tạo',
                        subRoomsInfo // 🆕 Thêm thông tin buồng
                      });
                    } else {
                      hasShiftDisabled = true;
                      monthDetails.push({
                        month: monthAnalysis.month,
                        year: monthAnalysis.year,
                        status: 'disabled',
                        label: 'Đang tắt',
                        subRoomsInfo // 🆕 Thêm thông tin buồng
                      });
                    }
                  } else {
                    noSchedule = true;
                    // Check config
                    if (bulkInfo.currentConfigShifts[selectedShiftForDetail]) {
                      monthDetails.push({
                        month: monthAnalysis.month,
                        year: monthAnalysis.year,
                        status: 'no-schedule-active',
                        label: 'Chưa có lịch (Config bật)',
                        subRoomsInfo // 🆕 Thêm thông tin buồng
                      });
                    } else {
                      monthDetails.push({
                        month: monthAnalysis.month,
                        year: monthAnalysis.year,
                        status: 'no-schedule-disabled',
                        label: 'Chưa có lịch (Config tắt)',
                        subRoomsInfo // 🆕 Thêm thông tin buồng
                      });
                    }
                  }
                });

                return (
                  <List.Item>
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          <Text strong>{room.roomName}</Text>
                          {room.hasSubRooms && (
                            <Tag color="blue">{room.subRoomCount} buồng</Tag>
                          )}
                        </Space>
                        <Space size={4}>
                          {hasScheduleWithShift && <Tag color="success">✓ Đã có</Tag>}
                          {hasScheduleWithoutShift && <Tag color="warning">⚠ Chưa tạo</Tag>}
                          {hasShiftDisabled && <Tag color="error">✗ Đang tắt</Tag>}
                          {noSchedule && <Tag color="default">○ Chưa có lịch</Tag>}
                        </Space>
                      </div>

                      {/* Month-by-month details */}
                      <div style={{ paddingLeft: 16 }}>
                        <Row gutter={[8, 8]}>
                          {monthDetails.map((detail, idx) => (
                            <Col key={idx} span={24}>
                              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                <Space size={4} style={{ fontSize: 12 }}>
                                  <Text type="secondary">{detail.month}/{detail.year}:</Text>
                                  {detail.status === 'complete' && (
                                    <Tag color="success" style={{ margin: 0, fontSize: 11 }}>✓ {detail.label}</Tag>
                                  )}
                                  {detail.status === 'missing' && (
                                    <Tag color="warning" style={{ margin: 0, fontSize: 11 }}>⚠ {detail.label}</Tag>
                                  )}
                                  {detail.status === 'disabled' && (
                                    <Tag color="error" style={{ margin: 0, fontSize: 11 }}>✗ {detail.label}</Tag>
                                  )}
                                  {detail.status === 'no-schedule-active' && (
                                    <Tag color="cyan" style={{ margin: 0, fontSize: 11 }}>○ {detail.label}</Tag>
                                  )}
                                  {detail.status === 'no-schedule-disabled' && (
                                    <Tag color="default" style={{ margin: 0, fontSize: 11 }}>○ {detail.label}</Tag>
                                  )}
                                </Space>
                                
                                {/* 🔥 Hiển thị chi tiết TẤT CẢ buồng (kể cả buồng tắt) */}
                                {detail.subRoomsInfo && detail.subRoomsInfo.length > 0 && (
                                  <div style={{ paddingLeft: 16, fontSize: 11, marginTop: 4 }}>
                                    {detail.subRoomsInfo.map((subRoom, subIdx) => {
                                      const subRoomShiftStatus = subRoom.shiftStatus?.[selectedShiftForDetail];
                                      
                                      // 🔥 Xác định trạng thái buồng - CHỈ DÙNG isActiveInSchedule (isActiveSubRoom từ schedule)
                                      let statusTag;
                                      let statusText = '';
                                      let statusColor = 'default';
                                      
                                      // 1. Buồng chưa có schedule
                                      if (!subRoom.hasSchedule || subRoom.hasSchedule === false) {
                                        statusTag = '○ Chưa có lịch';
                                        statusText = `Buồng "${subRoom.subRoomName}" chưa có lịch cho tháng ${detail.month}/${detail.year}`;
                                        statusColor = 'cyan';
                                      } 
                                      // 2. Schedule bị tắt (Schedule.isActive=false)
                                      else if (subRoom.isScheduleActive === false) {
                                        statusTag = '🔒 Lịch tắt';
                                        statusText = `Schedule của buồng "${subRoom.subRoomName}" bị tắt (Schedule.isActive=false)`;
                                        statusColor = 'default';
                                      }
                                      // 3. Buồng bị tắt trong Schedule (isActiveSubRoom=false) - ƯU TIÊN TRẠNG THÁI NÀY
                                      else if (subRoom.isActiveInSchedule === false) {
                                        statusTag = '🔒 Buồng tắt ';
                                        statusText = `Buồng "${subRoom.subRoomName}" bị tắt trong lịch (isActiveSubRoom=false)`;
                                        statusColor = 'default';
                                      }
                                      // 4. Ca đã tạo slots và đang hoạt động
                                      else if (subRoomShiftStatus?.hasShift === true) {
                                        statusTag = '✓ Đã có';
                                        statusText = `Ca ${selectedShiftForDetail} đã được tạo slots và đang hoạt động cho buồng "${subRoom.subRoomName}"`;
                                        statusColor = 'success';
                                      } 
                                      // 5. Ca đã generate nhưng bị tắt
                                      else if (subRoomShiftStatus?.isGenerated === true && subRoomShiftStatus?.isActive === false) {
                                        statusTag = '✗ Ca tắt (Đã tạo)';
                                        statusText = `Ca ${selectedShiftForDetail} đã tạo slots nhưng đã bị tắt (isActive=false)`;
                                        statusColor = 'error';
                                      }
                                      // 6. Ca đang bật nhưng chưa tạo slots
                                      else if (subRoomShiftStatus?.isActive === true && subRoomShiftStatus?.isGenerated === false) {
                                        statusTag = '⚠ Chưa tạo';
                                        statusText = `Ca ${selectedShiftForDetail} đang bật nhưng chưa tạo slots cho buồng "${subRoom.subRoomName}"`;
                                        statusColor = 'warning';
                                      } 
                                      // 7. Ca bị tắt và chưa tạo
                                      else if (subRoomShiftStatus?.isActive === false) {
                                        statusTag = '✗ Ca tắt';
                                        statusText = `Ca ${selectedShiftForDetail} bị tắt trong lịch của buồng "${subRoom.subRoomName}"`;
                                        statusColor = 'error';
                                      }
                                      // 8. Trường hợp khác (fallback)
                                      else {
                                        statusTag = '? Không xác định';
                                        statusText = `Không xác định được trạng thái của buồng "${subRoom.subRoomName}"`;
                                        statusColor = 'default';
                                      }
                                      
                                      return (
                                        <div key={subIdx} style={{ marginBottom: 4 }} title={statusText}>
                                          <Space size={4}>
                                            <Text 
                                              type="secondary" 
                                              style={{ 
                                                fontSize: 11, 
                                                fontWeight: 500,
                                                minWidth: 100,
                                                display: 'inline-block'
                                              }}
                                            >
                                              └ {subRoom.subRoomName}:
                                            </Text>
                                            <Tag color={statusColor} style={{ margin: 0, fontSize: 10 }}>
                                              {statusTag}
                                            </Tag>
                                          </Space>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </Space>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    </Space>
                  </List.Item>
                );
              }}
            />

            {/* Legend */}
            {/* <Alert
              message="Chú thích"
              description={
                <Space direction="vertical" size={4}>
                  <Text strong>Trạng thái phòng/ca:</Text>
                  <div><Tag color="success">✓ Đã có</Tag> = Ca đã được tạo slots trong tháng này</div>
                  <div><Tag color="warning">⚠ Chưa tạo</Tag> = Có lịch nhưng chưa tạo ca này (ca đang bật)</div>
                  <div><Tag color="error">✗ Đang tắt</Tag> = Ca bị tắt trong schedule (isActive=false)</div>
                  <div><Tag color="cyan">○ Chưa có lịch (Config bật)</Tag> = Chưa có schedule, config global bật ca</div>
                  <div><Tag color="default">○ Chưa có lịch (Config tắt)</Tag> = Chưa có schedule, config global tắt ca</div>
                  
                  <Text strong style={{ marginTop: 12, display: 'block' }}>Trạng thái buồng con (theo thứ tự ưu tiên):</Text>
                  <div style={{ paddingLeft: 8 }}>
                    <div><Tag color="cyan">○ Chưa có lịch</Tag> = Buồng chưa có lịch cho tháng này</div>
                    <div><Tag color="default">🔒 Lịch tắt</Tag> = Schedule bị tắt (Schedule.isActive=false)</div>
                    <div><Tag color="default">🔒 Buồng tắt (Schedule)</Tag> = Buồng bị tắt trong lịch của tháng này (isActiveSubRoom=false)</div>
                    <div><Tag color="success">✓ Đã có</Tag> = Ca đã tạo slots và đang hoạt động</div>
                    <div><Tag color="error">✗ Ca tắt (Đã tạo)</Tag> = Ca đã tạo slots nhưng bị tắt</div>
                    <div><Tag color="warning">⚠ Chưa tạo</Tag> = Ca đang bật nhưng chưa tạo slots</div>
                    <div><Tag color="error">✗ Ca tắt</Tag> = Ca bị tắt và chưa tạo slots</div>
                  </div>
                  
                  <Text type="secondary" style={{ marginTop: 8, display: 'block', fontSize: 11, fontStyle: 'italic' }}>
                    💡 Trạng thái buồng chỉ dựa trên isActiveSubRoom trong schedule của tháng đó, không dùng config phòng
                  </Text>
                </Space>
              }
              type="info"
              showIcon
            /> */}
          </Space>
        )}
      </Modal>
    </Modal>
  );
};

export default BulkCreateScheduleModal;

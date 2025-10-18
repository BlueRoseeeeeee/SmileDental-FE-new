/**
 * @author: Your Name  
 * BulkCreateScheduleModal - Modal tạo lịch cho nhiều phòng cùng lúc
 * Logic phức tạp:
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
import { toast } from '../../services/toastService';
import scheduleService from '../../services/scheduleService';

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
    if (!selectedRooms || selectedRooms.length === 0) return;

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
        setBulkInfo(response.data);
        
        // 🎯 Tự động chọn tháng đầu tiên có thể tạo làm fromMonth
        if (response.data.availableMonths && response.data.availableMonths.length > 0) {
          const firstAvailable = response.data.availableMonths[0];
          const firstMonth = dayjs().year(firstAvailable.year).month(firstAvailable.month - 1);
          setFromMonth(firstMonth);
          form.setFieldsValue({ fromMonth: firstMonth });
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

    const fetchBulkInfo = async () => {
      setLoadingBulkInfo(true);
      try {
        const fMonth = fromMonth.month() + 1;
        const fYear = fromMonth.year();
        const tMonth = toMonth.month() + 1;
        const tYear = toMonth.year();

        const roomIds = selectedRooms.map(r => r._id);

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
  }, [fromMonth, toMonth, selectedRooms]);

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

  // 🆕 Disable months for FROM picker - Ẩn tháng đã có lịch đầy đủ
  const disabledFromMonth = useCallback((current) => {
    if (!current || !bulkInfo) return false;

    // Check cơ bản
    if (disabledDate(current)) return true;

    const month = current.month() + 1;
    const year = current.year();

    // Check if all rooms have complete schedule for this month
    const allRoomsHaveSchedule = bulkInfo.roomsAnalysis.every(room => {
      const monthAnalysis = room.monthsAnalysis.find(
        m => m.month === month && m.year === year
      );

      if (!monthAnalysis) return false;

      // Nếu phòng có subrooms: check allSubRoomsHaveSchedule
      // Nếu không có subrooms: check hasSchedule
      if (room.hasSubRooms) {
        return monthAnalysis.allSubRoomsHaveSchedule === true;
      } else {
        return monthAnalysis.hasSchedule === true;
      }
    });

    return allRoomsHaveSchedule;
  }, [bulkInfo, disabledDate]);

  // 🆕 Disable months for TO picker - Chỉ cho chọn >= fromMonth và chưa có lịch đầy đủ
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

    // Check if all rooms have complete schedule for this month
    const allRoomsHaveSchedule = bulkInfo.roomsAnalysis.every(room => {
      const monthAnalysis = room.monthsAnalysis.find(
        m => m.month === month && m.year === year
      );

      if (!monthAnalysis) return false;

      if (room.hasSubRooms) {
        return monthAnalysis.allSubRoomsHaveSchedule === true;
      } else {
        return monthAnalysis.hasSchedule === true;
      }
    });

    return allRoomsHaveSchedule;
  }, [bulkInfo, fromMonth, disabledDate]);

  // Available months (not disabled)
  const availableMonths = useMemo(() => {
    if (!bulkInfo || !bulkInfo.availableMonths) return [];
    return bulkInfo.availableMonths.map(m => ({
      month: m.month,
      year: m.year,
      label: `${m.month}/${m.year}`
    }));
  }, [bulkInfo]);

  // Available shifts (not disabled)
  const availableShifts = useMemo(() => {
    if (!bulkInfo || !bulkInfo.availableShifts) {
      return { morning: false, afternoon: false, evening: false };
    }
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

        // Auto close after 3 seconds if all success
        if (response.failCount === 0) {
          setTimeout(() => {
            handleClose();
            if (onSuccess) onSuccess();
          }, 3000);
        }
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
      width={800}
      footer={
        progress ? null : [
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
    >
      {/* List selected rooms */}
      <Alert
        message={
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>Danh sách phòng đã chọn:</Text>
            <Space wrap>
              {selectedRooms.map(room => (
                <Tag key={room._id} color="blue">
                  {room.name} {room.roomNumber ? `(${room.roomNumber})` : ''}
                  {room.hasSubRooms && (
                    <Text type="secondary" style={{ fontSize: '11px', marginLeft: 4 }}>
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
        <div>
          <Progress
            percent={Math.round((progress.current / progress.total) * 100)}
            status={progress.current === progress.total ? 'success' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068'
            }}
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
                  <div>
                    <Text strong>{result.roomName}</Text>
                    {result.success ? (
                      <div>
                        <Text type="success">{result.message}</Text>
                        {result.details && (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Đã tạo: {result.details.schedulesCreated || 0} lịch mới, 
                            cập nhật: {result.details.schedulesUpdated || 0} lịch, 
                            tổng: {result.details.totalSlots || 0} slots
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

          <Divider />

          <Button type="primary" block onClick={handleClose}>
            Đóng
          </Button>
        </div>
      ) : (
        // Show form
        <Form form={form} layout="vertical">
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
                      <Tag key={`${m.year}-${m.month}`} color="green">
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
                  <Text strong>Chọn ngày bắt đầu tạo lịch</Text>
                  {startDate && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {fromMonth.isSame(dayjs(), 'month') 
                        ? '💡 Mặc định: Ngày mai (tháng hiện tại)'
                        : '💡 Mặc định: Ngày 1 của tháng (Click để thay đổi)'
                      }
                    </Text>
                  )}
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
            >
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Checkbox
                    value="morning"
                    disabled={!availableShifts.morning}
                  >
                    <Tag color={SHIFT_COLORS.morning}>
                      {SHIFT_NAMES.morning}
                    </Tag>
                    {!availableShifts.morning && (
                      <Text type="secondary" style={{ fontSize: '11px', marginLeft: 4 }}>
                        (Đã đầy)
                      </Text>
                    )}
                  </Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox
                    value="afternoon"
                    disabled={!availableShifts.afternoon}
                  >
                    <Tag color={SHIFT_COLORS.afternoon}>
                      {SHIFT_NAMES.afternoon}
                    </Tag>
                    {!availableShifts.afternoon && (
                      <Text type="secondary" style={{ fontSize: '11px', marginLeft: 4 }}>
                        (Đã đầy)
                      </Text>
                    )}
                  </Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox
                    value="evening"
                    disabled={!availableShifts.evening}
                  >
                    <Tag color={SHIFT_COLORS.evening}>
                      {SHIFT_NAMES.evening}
                    </Tag>
                    {!availableShifts.evening && (
                      <Text type="secondary" style={{ fontSize: '11px', marginLeft: 4 }}>
                        (Đã đầy)
                      </Text>
                    )}
                  </Checkbox>
                </Col>
              </Row>
            </Checkbox.Group>
          </Form.Item>

          {/* Help text */}
          <Alert
            message={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Tháng bị vô hiệu hóa nếu <strong>TẤT CẢ</strong> các phòng đã có lịch tháng đó</li>
                <li>Ca bị vô hiệu hóa nếu <strong>TẤT CẢ</strong> các phòng đã có ca đó trong khoảng thời gian</li>
                <li>Chỉ cần <strong>1 phòng</strong> chưa có là vẫn có thể chọn tạo lịch</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </Form>
      )}
    </Modal>
  );
};

export default BulkCreateScheduleModal;

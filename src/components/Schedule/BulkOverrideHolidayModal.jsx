/**
 * BulkOverrideHolidayModal - Modal tạo lịch ngày nghỉ cho nhiều phòng
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  DatePicker,
  Checkbox,
  Space,
  Typography,
  Alert,
  Divider,
  Card,
  Tag,
  Row,
  Col,
  Spin,
  Button,
  List
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import scheduleService from '../../services/scheduleService';
import { toast } from '../../services/toastService';

const { Title, Text } = Typography;
const { Option } = Select;

const SHIFT_NAMES = {
  morning: 'Ca Sáng',
  afternoon: 'Ca Chiều',
  evening: 'Ca Tối'
};

const BulkOverrideHolidayModal = ({
  visible,
  onCancel,
  onSuccess,
  selectedRooms, // Array of room objects { _id, name, roomNumber }
  selectedRoomIds // Array of room IDs
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [availableHolidays, setAvailableHolidays] = useState([]); // Tất cả holidays từ các phòng
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShifts, setSelectedShifts] = useState([]);

  // 🆕 Modal chi tiết ca
  const [shiftDetailModalVisible, setShiftDetailModalVisible] = useState(false);
  const [selectedShiftForDetail, setSelectedShiftForDetail] = useState(null); // 'morning' | 'afternoon' | 'evening'

  // Reset form khi đóng/mở modal
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setSelectedMonth(null);
      setSelectedYear(null);
      setAvailableHolidays([]);
      setSelectedDate(null);
      setSelectedShifts([]);
    }
  }, [visible, form]);

  // Fetch holidays khi chọn month/year
  useEffect(() => {
    if (visible && selectedMonth && selectedYear && selectedRoomIds.length > 0) {
      fetchHolidaysForAllRooms();
    }
  }, [visible, selectedMonth, selectedYear, selectedRoomIds]);

  const fetchHolidaysForAllRooms = async () => {
    setLoadingHolidays(true);
    try {
      const holidayMap = {}; 
      // Structure: { 
      //   dateStr: { 
      //     date, holidayName, rooms: [], 
      //     shiftStatus: { morning: [], afternoon: [], evening: [] },
      //     shiftConfig: { morning: [], afternoon: [], evening: [] },
      //     roomsWithSchedule: [] // 🆕 Danh sách roomId có lịch trong tháng này
      //   } 
      // }
      // shiftStatus[shift] = array of roomIds đã tạo slots cho ca đó
      // shiftConfig[shift] = array of roomIds có ca đó ĐANG BẬT (isActive=true)
      // roomsWithSchedule = array of roomIds có lịch trong tháng (bất kể có ngày nghỉ hay không)

      // 🆕 Track rooms có lịch trong tháng
      const roomsWithScheduleInMonth = new Set();

      // Fetch schedule shifts cho từng phòng
      for (const roomId of selectedRoomIds) {
        try {
          const response = await scheduleService.getRoomSchedulesWithShifts(
            roomId,
            null, // subRoomId
            selectedMonth,
            selectedYear
          );

          if (response.success && response.data.schedules && response.data.schedules.length > 0) {
            const schedules = response.data.schedules;
            
            // 🆕 Room này có lịch trong tháng
            roomsWithScheduleInMonth.add(roomId);
            
            // Track shift status per room (để tránh trùng lặp từ nhiều subroom)
            const roomShiftStatus = {}; // { dateStr: { morning: bool, afternoon: bool, evening: bool } }
            const roomShiftConfigStatus = {}; // { dateStr: { morning: bool, afternoon: bool, evening: bool } }
            
            schedules.forEach(schedule => {
              const holidaySnapshot = schedule.holidaySnapshot || {};
              const computedDaysOff = holidaySnapshot.computedDaysOff || [];
              const shiftConfig = schedule.shiftConfig || {};

              computedDaysOff.forEach(dayOff => {
                const dateStr = dayOff.date;
                
                // Initialize holiday map entry
                if (!holidayMap[dateStr]) {
                  holidayMap[dateStr] = {
                    date: dateStr,
                    holidayName: dayOff.reason,
                    rooms: [],
                    shiftStatus: {
                      morning: [],
                      afternoon: [],
                      evening: []
                    },
                    shiftConfig: {
                      morning: [],
                      afternoon: [],
                      evening: []
                    },
                    roomsWithSchedule: [] // 🆕 Track rooms có lịch trong tháng
                  };
                }
                
                // Add roomId to rooms list (once per room)
                if (!holidayMap[dateStr].rooms.includes(roomId)) {
                  holidayMap[dateStr].rooms.push(roomId);
                }
                
                // Track shift status for this room
                if (!roomShiftStatus[dateStr]) {
                  roomShiftStatus[dateStr] = {
                    morning: false,
                    afternoon: false,
                    evening: false
                  };
                }
                
                // Track shift config status for this room
                if (!roomShiftConfigStatus[dateStr]) {
                  roomShiftConfigStatus[dateStr] = {
                    morning: false,
                    afternoon: false,
                    evening: false
                  };
                }
                
                // Check từng ca xem đã override chưa
                ['morning', 'afternoon', 'evening'].forEach(shift => {
                  if (dayOff.shifts?.[shift]?.isOverridden) {
                    roomShiftStatus[dateStr][shift] = true;
                  }
                  
                  // 🔧 FIX: Check xem ca này có đang bật không (isActive = true hoặc undefined)
                  // Nếu isActive === false (explicitly disabled) thì KHÔNG đếm
                  // Nếu isActive === true hoặc undefined → Đếm là active
                  const isShiftActive = shiftConfig[shift]?.isActive !== false;
                  if (isShiftActive) {
                    // Ít nhất 1 schedule của room này có ca đang bật
                    roomShiftConfigStatus[dateStr][shift] = true;
                  }
                });
              });
            });
            
            // Sau khi scan tất cả schedules của room, update shiftStatus và shiftConfig vào holidayMap
            Object.keys(roomShiftStatus).forEach(dateStr => {
              ['morning', 'afternoon', 'evening'].forEach(shift => {
                if (roomShiftStatus[dateStr][shift]) {
                  // Room này đã tạo shift này
                  if (!holidayMap[dateStr].shiftStatus[shift].includes(roomId)) {
                    holidayMap[dateStr].shiftStatus[shift].push(roomId);
                  }
                }
                
                // Track shift config status
                if (roomShiftConfigStatus[dateStr]?.[shift]) {
                  if (!holidayMap[dateStr].shiftConfig[shift].includes(roomId)) {
                    holidayMap[dateStr].shiftConfig[shift].push(roomId);
                  }
                }
              });
            });
            
            // 🔍 Debug log cho room này
            console.log(`📊 Room ${roomId} - Shift Config Status:`, {
              scheduleCount: schedules.length,
              dates: Object.keys(roomShiftConfigStatus),
              shiftConfig: Object.keys(roomShiftConfigStatus).map(dateStr => ({
                date: dateStr,
                morning: roomShiftConfigStatus[dateStr].morning,
                afternoon: roomShiftConfigStatus[dateStr].afternoon,
                evening: roomShiftConfigStatus[dateStr].evening
              }))
            });
          }
        } catch (error) {
          console.error(`Error fetching holidays for room ${roomId}:`, error);
        }
      }

      // 🆕 Gán roomsWithSchedule cho tất cả ngày trong holidayMap
      Object.keys(holidayMap).forEach(dateStr => {
        holidayMap[dateStr].roomsWithSchedule = Array.from(roomsWithScheduleInMonth);
      });

      console.log('📋 Rooms có lịch trong tháng:', Array.from(roomsWithScheduleInMonth));

      // Convert map to array và filter
      const today = dayjs().startOf('day');
      const totalRoomsSelected = selectedRoomIds.length;
      
      const holidays = Object.values(holidayMap)
        .map(h => ({
          ...h,
          roomCount: h.rooms.length,
          // Đếm xem có bao nhiêu ca còn available (chưa tạo hết)
          availableShiftsCount: ['morning', 'afternoon', 'evening'].filter(
            shift => h.shiftStatus[shift].length < totalRoomsSelected
          ).length
        }))
        .filter(h => {
          const holidayDate = dayjs(h.date);
          
          // Chỉ hiển thị ngày nghỉ > hôm nay
          if (!holidayDate.isAfter(today, 'day')) {
            return false;
          }
          
          // Chỉ hiển thị ngày trong tháng/năm đã chọn
          if (holidayDate.month() + 1 !== selectedMonth || holidayDate.year() !== selectedYear) {
            return false;
          }
          
          // 🆕 Hiển thị miễn là còn ít nhất 1 ca chưa tạo hết
          if (h.availableShiftsCount === 0) {
            console.log(`⏭️ Bỏ qua ngày ${h.date}: Tất cả ca đều đã tạo hết cho ${totalRoomsSelected} phòng`);
            return false;
          }
          
          return true;
        })
        .sort((a, b) => a.date.localeCompare(b.date));

      setAvailableHolidays(holidays);
      
      // 🔍 Debug: Log chi tiết shiftConfig cho mỗi ngày
      console.log('📋 Available Holidays với ShiftConfig:', holidays.map(h => ({
        date: h.date,
        holidayName: h.holidayName,
        roomCount: h.roomCount,
        shiftConfig: {
          morning: {
            activeRooms: h.shiftConfig.morning.length,
            totalRooms: selectedRoomIds.length,
            disabled: h.shiftConfig.morning.length === 0
          },
          afternoon: {
            activeRooms: h.shiftConfig.afternoon.length,
            totalRooms: selectedRoomIds.length,
            disabled: h.shiftConfig.afternoon.length === 0
          },
          evening: {
            activeRooms: h.shiftConfig.evening.length,
            totalRooms: selectedRoomIds.length,
            disabled: h.shiftConfig.evening.length === 0
          }
        }
      })));
      
      if (holidays.length === 0) {
        toast.info(`Không có ngày nghỉ khả dụng cho tháng ${selectedMonth}/${selectedYear}`);
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
      toast.error('Lỗi khi lấy danh sách ngày nghỉ');
    } finally {
      setLoadingHolidays(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      
      if (!selectedDate) {
        toast.error('Vui lòng chọn ngày nghỉ');
        return;
      }

      if (selectedShifts.length === 0) {
        toast.error('Vui lòng chọn ít nhất 1 ca');
        return;
      }

      setLoading(true);

      // Gọi API cho từng phòng
      const results = [];
      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      for (const roomId of selectedRoomIds) {
        try {
          // 🆕 Filter shifts: Chỉ gửi những ca đang BẬT (isActive=true) cho phòng này
          const roomActiveShifts = selectedShifts.filter(shift => {
            const roomsWithActiveShift = selectedHolidayInfo?.shiftConfig?.[shift] || [];
            return roomsWithActiveShift.includes(roomId);
          });
          
          if (roomActiveShifts.length === 0) {
            // Phòng này không có ca nào active → Bỏ qua
            skippedCount++;
            results.push({
              roomId,
              status: 'skipped',
              message: 'Tất cả ca đã chọn đang bị tắt cho phòng này'
            });
            console.log(`⏭️ Bỏ qua phòng ${roomId}: Không có ca nào active trong danh sách [${selectedShifts.join(', ')}]`);
            continue;
          }
          
          const response = await scheduleService.createOverrideHolidayForAllRooms(
            roomId,
            selectedMonth,
            selectedYear,
            selectedDate,
            roomActiveShifts, // 🔧 Chỉ gửi ca đang bật
            `Tạo hàng loạt cho ${selectedRooms.length} phòng`
          );

          if (response.success) {
            successCount++;
            results.push({
              roomId,
              status: 'success',
              shiftsCreated: roomActiveShifts
            });
          } else {
            errorCount++;
            results.push({
              roomId,
              status: 'error',
              message: response.message
            });
          }
        } catch (error) {
          errorCount++;
          results.push({
            roomId,
            status: 'error',
            message: error.response?.data?.message || error.message
          });
        }
      }

      // Show result
      if (successCount > 0) {
        toast.success(`✅ Đã tạo lịch ngày nghỉ cho ${successCount}/${selectedRoomIds.length} phòng`);
      }
      
      if (skippedCount > 0) {
        toast.info(`ℹ️ ${skippedCount} phòng bị bỏ qua (tất cả ca đã chọn đang bị tắt)`);
      }
      
      if (errorCount > 0) {
        toast.warning(`⚠️ ${errorCount} phòng thất bại (có thể đã tạo rồi hoặc lỗi khác)`);
      }
      
      console.log('📊 Kết quả tạo lịch hàng loạt:', {
        total: selectedRoomIds.length,
        success: successCount,
        skipped: skippedCount,
        error: errorCount,
        results
      });

      if (successCount > 0 && onSuccess) {
        onSuccess(results);
      }

      if (successCount === selectedRoomIds.length) {
        onCancel();
      }
    } catch (error) {
      console.error('Error submitting bulk override holiday:', error);
      toast.error('Lỗi khi tạo lịch ngày nghỉ');
    } finally {
      setLoading(false);
    }
  };

  // Generate month options (next 12 months from now)
  const monthOptions = useMemo(() => {
    const options = [];
    const now = dayjs();
    
    for (let i = 0; i < 12; i++) {
      const month = now.add(i, 'month');
      options.push({
        month: month.month() + 1,
        year: month.year(),
        label: `Tháng ${month.month() + 1}/${month.year()}` // Fix: Dùng template string thay vì format
      });
    }
    
    return options;
  }, []);

  const selectedHolidayInfo = useMemo(() => {
    if (!selectedDate) return null;
    return availableHolidays.find(h => h.date === selectedDate);
  }, [selectedDate, availableHolidays]);

  return (
    <>
    <Modal
      title={
        <Space>
          <CalendarOutlined style={{ color: '#ff7875', fontSize: 20 }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>
            Tạo lịch ngày nghỉ cho {selectedRooms.length} phòng
          </span>
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText="Tạo lịch"
      cancelText="Hủy"
      width={800}
      confirmLoading={loading}
      bodyStyle={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Alert
          type="info"
          showIcon
          message="Hướng dẫn"
          description={
            <div style={{ fontSize: 13 }}>
              <div>1. Chọn tháng/năm để xem các ngày nghỉ</div>
              <div>2. Chọn ngày nghỉ cần tạo lịch (chỉ hiển thị ngày còn phòng chưa tạo)</div>
              <div>3. Chọn 1 hoặc nhiều ca làm việc (ca đã tạo hết sẽ bị vô hiệu hóa)</div>
              <div>4. Hệ thống sẽ tạo lịch cho các phòng chưa có ca đó</div>
            </div>
          }
        />

        <Form form={form} layout="vertical">
          <Form.Item
            label={<Text strong>1. Chọn tháng/năm</Text>}
            name="monthYear"
            rules={[{ required: true, message: 'Vui lòng chọn tháng' }]}
          >
            <Select
              placeholder="Chọn tháng"
              size="large"
              onChange={(value) => {
                const [month, year] = value.split('-');
                setSelectedMonth(parseInt(month));
                setSelectedYear(parseInt(year));
                setSelectedDate(null); // Reset ngày đã chọn
                form.setFieldsValue({ date: undefined, shifts: [] });
                setSelectedShifts([]);
              }}
            >
              {monthOptions.map(opt => (
                <Option key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedMonth && selectedYear && (
            <>
              {loadingHolidays ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Spin tip="Đang tải danh sách ngày nghỉ..." />
                </div>
              ) : availableHolidays.length > 0 ? (
                <>
                  <Form.Item
                    label={<Text strong>2. Chọn ngày nghỉ</Text>}
                    name="date"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày nghỉ' }]}
                  >
                    <Select
                      placeholder="Chọn ngày nghỉ"
                      size="large"
                      onChange={(value) => {
                        setSelectedDate(value);
                        // Reset shifts khi đổi ngày
                        setSelectedShifts([]);
                        form.setFieldsValue({ shifts: [] });
                      }}
                    >
                      {availableHolidays.map(holiday => (
                        <Option key={holiday.date} value={holiday.date}>
                          <Space>
                            <Text strong>{dayjs(holiday.date).format('DD/MM/YYYY')}</Text>
                            <Text type="secondary">-</Text>
                            <Text>{holiday.holidayName}</Text>
                            <Tag color="blue">{holiday.roomCount} phòng</Tag>
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {selectedDate && selectedHolidayInfo && (
                    <>
                      <Alert
                        type="info"
                        showIcon
                        message={
                          <Text>
                            Ngày <Text strong>{dayjs(selectedDate).format('DD/MM/YYYY')}</Text> ({selectedHolidayInfo.holidayName}) 
                            có trong lịch của <Text strong>{selectedHolidayInfo.roomCount}/{selectedRooms.length}</Text> phòng
                          </Text>
                        }
                      />

                      <Form.Item
                        label={<Text strong>3. Chọn ca làm việc</Text>}
                        name="shifts"
                        rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 ca' }]}
                      >
                    <Checkbox.Group
                      style={{ width: '100%' }}
                      onChange={(values) => setSelectedShifts(values)}
                    >
                      <Row gutter={[16, 16]}>
                        {['morning', 'afternoon', 'evening'].map(shift => {
                          // Check xem ca này đã tạo cho TẤT CẢ phòng chưa
                          const roomsWithShift = selectedHolidayInfo?.shiftStatus?.[shift] || [];
                          const isFullyBooked = roomsWithShift.length === selectedRoomIds.length;
                          
                          // 🆕 Phân loại phòng
                          const roomsInHoliday = selectedHolidayInfo?.rooms || []; // Phòng có ngày nghỉ này
                          const roomsWithActiveShift = selectedHolidayInfo?.shiftConfig?.[shift] || []; // Phòng có ngày nghỉ VÀ ca bật
                          const roomsWithoutHoliday = selectedRoomIds.filter(id => !roomsInHoliday.includes(id)); // Phòng KHÔNG có ngày nghỉ (có lịch bình thường)
                          
                          // Phòng CÓ ngày nghỉ NHƯNG ca bị tắt
                          const roomsWithHolidayButShiftDisabled = roomsInHoliday.filter(id => !roomsWithActiveShift.includes(id));
                          
                          // Phòng cần tạo override = Phòng có ngày nghỉ VÀ ca bật VÀ chưa tạo
                          const roomsNeedOverride = roomsWithActiveShift.filter(id => !roomsWithShift.includes(id));
                          
                          // Disable nếu: đã tạo hết HOẶC (tất cả phòng có ngày nghỉ đều tắt ca này VÀ không có phòng nào cần tạo)
                          const allRoomsWithHolidayHaveShiftDisabled = roomsInHoliday.length > 0 && roomsWithActiveShift.length === 0;
                          const shouldDisable = isFullyBooked || (allRoomsWithHolidayHaveShiftDisabled && roomsWithoutHoliday.length === 0);
                          
                          const roomsNeedShift = roomsNeedOverride.length;
                          const roomsHaveNormalSchedule = roomsWithoutHoliday.length;
                          
                          // 🔍 Debug log
                          console.log(`🔍 Shift ${shift} for date ${selectedDate}:`, {
                            roomsInHoliday,
                            roomsWithActiveShift,
                            roomsWithoutHoliday,
                            roomsWithHolidayButShiftDisabled,
                            roomsNeedOverride,
                            roomsHaveNormalSchedule,
                            shouldDisable,
                            isFullyBooked
                          });
                          
                          return (
                            <Col span={8} key={shift}>
                              <Card
                                size="small"
                                style={{
                                  cursor: shouldDisable ? 'not-allowed' : 'pointer',
                                  borderColor: selectedShifts.includes(shift) ? '#1890ff' : '#d9d9d9',
                                  background: shouldDisable ? '#f5f5f5' : (selectedShifts.includes(shift) ? '#e6f7ff' : '#fff'),
                                  opacity: shouldDisable ? 0.6 : 1
                                }}
                                onClick={() => {
                                  if (shouldDisable) return;
                                  
                                  const newShifts = selectedShifts.includes(shift)
                                    ? selectedShifts.filter(s => s !== shift)
                                    : [...selectedShifts, shift];
                                  setSelectedShifts(newShifts);
                                  form.setFieldsValue({ shifts: newShifts });
                                }}
                              >
                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                  <Checkbox value={shift} disabled={shouldDisable}>
                                    <Text strong style={{ color: shouldDisable ? '#999' : 'inherit' }}>
                                      {SHIFT_NAMES[shift]}
                                    </Text>
                                  </Checkbox>
                                  {isFullyBooked ? (
                                    <Text type="success" style={{ fontSize: 12 }}>
                                      ✓ Đã tạo hết
                                    </Text>
                                  ) : (
                                    <>
                                      {roomsNeedShift > 0 && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                          {roomsNeedShift} phòng cần tạo
                                        </Text>
                                      )}
                                      {roomsHaveNormalSchedule > 0 && (
                                        <Text type="success" style={{ fontSize: 12, display: 'block' }}>
                                          ✓ {roomsHaveNormalSchedule} phòng có lịch
                                        </Text>
                                      )}
                                      {roomsWithHolidayButShiftDisabled.length > 0 && (
                                        <Text type="warning" style={{ fontSize: 12, display: 'block' }}>
                                          ⚠️ {roomsWithHolidayButShiftDisabled.length} phòng tắt ca
                                        </Text>
                                      )}
                                    </>
                                  )}
                                  <Button 
                                    type="link" 
                                    size="small" 
                                    style={{ padding: 0, height: 'auto', fontSize: 12 }}
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent card click
                                      setSelectedShiftForDetail(shift);
                                      setShiftDetailModalVisible(true);
                                    }}
                                  >
                                    Chi tiết
                                  </Button>
                                </Space>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                    </Checkbox.Group>
                  </Form.Item>

                  <Divider />

                  <Card size="small" style={{ background: '#f0f9ff', border: '1px solid #bae7ff' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>Thông tin tạo lịch:</Text>
                      <div>
                        <Text type="secondary">Số phòng: </Text>
                        <Text strong>{selectedRooms.length}</Text>
                      </div>
                      <div>
                        <Text type="secondary">Tháng: </Text>
                        <Text strong>{selectedMonth}/{selectedYear}</Text>
                      </div>
                      {selectedDate && (
                        <div>
                          <Text type="secondary">Ngày: </Text>
                          <Text strong>{dayjs(selectedDate).format('DD/MM/YYYY')}</Text>
                        </div>
                      )}
                      {selectedShifts.length > 0 && (
                        <div>
                          <Text type="secondary">Ca: </Text>
                          <Space size={4}>
                            {selectedShifts.map(shift => (
                              <Tag key={shift} color="blue">{SHIFT_NAMES[shift]}</Tag>
                            ))}
                          </Space>
                        </div>
                      )}
                    </Space>
                  </Card>
                    </>
                  )}
                </>
              ) : (
                <Alert
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                  message="Không có ngày nghỉ"
                  description={`Không tìm thấy ngày nghỉ nào trong tháng ${selectedMonth}/${selectedYear} cho các phòng đã chọn.`}
                />
              )}
            </>
          )}
        </Form>
      </Space>
    </Modal>

    {/* Modal chi tiết ca */}
    <Modal
      title={`Chi tiết ca ${SHIFT_NAMES[selectedShiftForDetail] || 'Không xác định'} - ${selectedHolidayInfo?.date ? dayjs(selectedHolidayInfo.date).format('DD/MM/YYYY') : ''}`}
      open={shiftDetailModalVisible}
      onCancel={() => setShiftDetailModalVisible(false)}
      footer={null}
      width={800}
    >
      {selectedHolidayInfo && selectedShiftForDetail && (() => {
        // selectedShiftForDetail đã là 'morning', 'afternoon', 'evening' rồi
        const shiftKey = selectedShiftForDetail;
        
        // Lấy danh sách roomId đã tạo override và có config active
        const roomsWithOverride = selectedHolidayInfo.shiftStatus[shiftKey] || [];
        const roomsWithActiveConfig = selectedHolidayInfo.shiftConfig[shiftKey] || [];
        const roomsWithSchedule = selectedHolidayInfo.roomsWithSchedule || []; // 🆕 Danh sách room CÓ LỊCH trong tháng này
        const roomsInHoliday = selectedHolidayInfo.rooms || []; // Danh sách room có NGÀY NGHỈ này trong lịch
        
        console.log('🔍 Modal Chi tiết ca:', {
          shiftKey,
          date: selectedHolidayInfo.date,
          roomsWithOverride,
          roomsWithActiveConfig,
          roomsWithSchedule,
          roomsInHoliday,
          selectedRoomIds
        });
        
        // Map selectedRooms với trạng thái
        const roomDetailData = selectedRooms.map(room => {
          const roomId = room._id;
          const hasOverride = roomsWithOverride.includes(roomId);
          const hasActiveConfig = roomsWithActiveConfig.includes(roomId);
          const hasScheduleInMonth = roomsWithSchedule.includes(roomId);
          const hasHoliday = roomsInHoliday.includes(roomId); // Phòng có ngày nghỉ này trong lịch
          
          // Xác định trạng thái
          let status = '';
          let statusColor = '';
          
          if (hasOverride) {
            // Đã tạo lịch ngày nghỉ (override)
            status = 'Đã tạo';
            statusColor = 'success';
          } else if (!hasScheduleInMonth) {
            // Chưa có lịch tháng này
            status = 'Chưa tạo lịch tháng';
            statusColor = 'default';
          } else if (!hasHoliday) {
            // Có lịch tháng này NHƯNG KHÔNG có ngày nghỉ này → Đã có lịch bình thường vào ngày này
            status = 'Có lịch';
            statusColor = 'success';
          } else if (!hasActiveConfig) {
            // Có ngày nghỉ này NHƯNG ca bị tắt (isActive=false)
            status = 'Ca bị tắt';
            statusColor = 'error';
          } else {
            // Có ngày nghỉ này, ca đang bật, cần tạo override
            status = 'Chưa tạo';
            statusColor = 'warning';
          }
          
          return {
            roomId,
            roomName: room.roomName || room.name,
            subRoomName: room.subRoomName || room.subRoom?.name,
            status,
            statusColor
          };
        });
        
        console.log('🔍 Room Detail Data:', roomDetailData);
        
        return (
          <List
            bordered
            dataSource={roomDetailData}
            renderItem={(item) => (
              <List.Item style={{ padding: '12px 16px' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '14px' }}>{item.roomName || 'Không có tên'}</strong>
                    {item.subRoomName && (
                      <span style={{ color: '#999', marginLeft: '8px' }}>
                        ({item.subRoomName})
                      </span>
                    )}
                  </div>
                  <Tag color={item.statusColor}>{item.status}</Tag>
                </div>
              </List.Item>
            )}
          />
        );
      })()}
    </Modal>
    </>
  );
};

export default BulkOverrideHolidayModal;

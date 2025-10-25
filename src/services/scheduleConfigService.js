/**
 * @author: HoTram
 * Schedule Config Service - Quản lý cấu hình hệ thống và ngày nghỉ lễ
 */
import { scheduleApi } from './apiFactory.js';

const scheduleConfigService = {
  // Kiểm tra cấu hình đã tồn tại chưa
  checkConfigExists: async () => {
    const response = await scheduleApi.get('/schedule/config/exists');
    return response.data;
  },

  // Khởi tạo cấu hình lần đầu (chỉ manager/admin)
  initializeConfig: async (configData) => {
    const response = await scheduleApi.post('/schedule/config/initialize', configData);
    return response.data;
  },

  // Lấy cấu hình hệ thống
  getConfig: async () => {
    const response = await scheduleApi.get('/schedule/config');
    return response.data;
  },

  // Cập nhật cấu hình hệ thống (chỉ manager/admin)
  updateConfig: async (configData) => {
    const response = await scheduleApi.patch('/schedule/config', configData);
    return response.data;
  },

  // Lấy danh sách ngày nghỉ lễ
  getHolidays: async () => {
    const response = await scheduleApi.get('/schedule/config/holidays');
    return response.data;
  },

  // Thêm ngày nghỉ lễ (chỉ manager/admin)
  addHoliday: async (holidayData) => {
    const response = await scheduleApi.post('/schedule/config/holidays', holidayData);
    return response.data;
  },

  // Cập nhật ngày nghỉ lễ (chỉ manager/admin)
  updateHoliday: async (holidayId, holidayData) => {
    const response = await scheduleApi.patch(`/schedule/config/holidays/${holidayId}`, holidayData);
    return response.data;
  },

  // Xóa ngày nghỉ lễ (chỉ manager/admin)
  removeHoliday: async (holidayId) => {
    const response = await scheduleApi.delete(`/schedule/config/holidays/${holidayId}`);
    return response.data;
  },

  // 🆕 Lấy khoảng thời gian bị chặn (tháng có lịch + ngày nghỉ lễ hiện có)
  getBlockedDateRanges: async () => {
    const response = await scheduleApi.get('/schedule/config/holidays/blocked-ranges');
    return response.data;
  },

  // 🆕 Nhiệm vụ 3.3: Tắt slot linh hoạt (theo ngày, ca, phòng, nha sĩ)
  disableSlotsFlexible: async (criteria) => {
    const response = await scheduleApi.post('/slot/disable', criteria);
    return response.data;
  },

  // 🆕 Nhiệm vụ 3.3: Bật lại slot đã tắt
  enableSlotsFlexible: async (criteria) => {
    const response = await scheduleApi.post('/slot/enable', criteria);
    return response.data;
  },

  // 🆕 Nhiệm vụ 3.3: Preview số lượng slot sẽ bị ảnh hưởng
  previewAffectedSlots: async (criteria) => {
    const response = await scheduleApi.post('/slot/preview-affected', criteria);
    return response.data;
  },

  // 🆕 Nhiệm vụ 2.3: Tạo lịch override trong ngày nghỉ (admin/manager only)
  createScheduleOverrideHoliday: async (data) => {
    const response = await scheduleApi.post('/schedule/override-holiday', data);
    return response.data;
  },

  // 🆕 Validate holiday từ holidaySnapshot của schedule cụ thể
  validateHolidayFromSchedule: async (params) => {
    const response = await scheduleApi.get('/schedule/validate-holiday-from-schedule', { params });
    return response.data;
  },

  // 🆕 Bulk disable schedule cho nhiều ngày/ca/buồng
  bulkDisableSchedule: async (data) => {
    const response = await scheduleApi.post('/schedule/bulk-disable', data);
    return response.data;
  }
};

export default scheduleConfigService;

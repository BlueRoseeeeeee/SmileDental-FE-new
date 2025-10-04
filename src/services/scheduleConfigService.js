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
  }
};

export default scheduleConfigService;

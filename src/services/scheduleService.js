/**
 * @author: HoTram
 * Schedule Service - Quản lý lịch làm việc theo quý
 */
import { scheduleApi } from './apiFactory.js';

const scheduleService = {
  // Tạo lịch quý cho tất cả phòng (chỉ manager/admin)
  generateQuarterSchedule: async (quarter, year) => {
    try {
      const response = await scheduleApi.post('/schedule/quarter', { quarter, year });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  // Lấy danh sách quý có thể tạo lịch
  getAvailableQuarters: async () => {
    const response = await scheduleApi.get('/schedule/quarters/available');
    return response.data;
  },

  // Kiểm tra trạng thái quý của một phòng
  checkQuartersStatus: async (roomId) => {
    const response = await scheduleApi.get(`/schedule/room/${roomId}/quarters/status`);
    return response.data;
  },

  // Lấy trạng thái quý
  getQuarterStatus: async ({ quarter, year }) => {
    const response = await scheduleApi.get('/schedule/quarter/status', {
      params: { quarter, year }
    });
    return response.data;
  },

  // Lấy lịch theo phòng
  getSchedulesByRoom: async (roomId) => {
    const response = await scheduleApi.get(`/schedule/room/${roomId}`);
    return response.data;
  },

  // Lấy lịch theo khoảng thời gian (tất cả phòng)
  getSchedulesByDateRange: async (startDate, endDate) => {
    const response = await scheduleApi.get('/schedule', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Bật/tắt lịch (chỉ manager/admin)
  toggleScheduleActive: async (scheduleId) => {
    const response = await scheduleApi.patch(`/schedule/${scheduleId}/active`);
    return response.data;
  }
};

export default scheduleService;
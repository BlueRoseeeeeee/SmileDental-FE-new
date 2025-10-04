/**
 * @author: HoTram
 * Auto Schedule Service - Quản lý tự động sinh lịch
 */
import { scheduleApi } from './apiFactory.js';

const autoScheduleService = {
  // Mô phỏng tự động sinh lịch với ngày tùy chỉnh (chỉ manager/admin)
  simulateAutoGeneration: async (simulateDate) => {
    const response = await scheduleApi.post('/auto-schedule/simulate', { simulateDate });
    return response.data;
  },

  // Test mô phỏng không cần xác thực (chỉ để phát triển)
  testSimulate: async (simulateDate) => {
    const response = await scheduleApi.post('/auto-schedule/test-simulate', { simulateDate });
    return response.data;
  },

  // Lấy cấu hình tự động sinh lịch (chỉ manager/admin)
  getConfig: async () => {
    const response = await scheduleApi.get('/auto-schedule/config');
    return response.data;
  },

  // Bật/tắt tự động sinh lịch (chỉ manager/admin)
  toggleAutoSchedule: async (enabled) => {
    const response = await scheduleApi.patch('/auto-schedule/toggle', { enabled });
    return response.data;
  }
};

export default autoScheduleService;

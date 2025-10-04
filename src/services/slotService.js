/**
 * @author: HoTram
 * Slot Service - Quản lý ca làm việc và phân công nhân sự
 */
import { scheduleApi } from './apiFactory.js';

const slotService = {
  // Phân công nhân sự vào slot theo lịch (chỉ manager/admin)
  assignStaffToSlots: async (assignmentData) => {
    const response = await scheduleApi.post('/slot/assign-staff', assignmentData);
    return response.data;
  },

  // Tái phân công nhân sự cho slot đã được phân công (chỉ manager/admin)
  reassignStaffToSlots: async (reassignmentData) => {
    const response = await scheduleApi.post('/slot/reassign-staff', reassignmentData);
    return response.data;
  },

  // Cập nhật nhân sự cho slot (chỉ manager/admin)
  updateSlotStaff: async (updateData) => {
    const response = await scheduleApi.patch('/slot/staff', updateData);
    return response.data;
  },

  // Lấy slot theo ca và ngày
  getSlotsByShiftAndDate: async (shift, date) => {
    const response = await scheduleApi.get('/slot/by-shift', {
      params: { shift, date }
    });
    return response.data;
  },

  // Lấy lịch phòng với số lượng cuộc hẹn (xem theo ngày/tuần/tháng)
  getRoomCalendar: async (roomId, view = 'daily', startDate, endDate) => {
    const response = await scheduleApi.get(`/slot/room/${roomId}/calendar`, {
      params: { view, startDate, endDate }
    });
    return response.data;
  },

  // Lấy lịch bác sĩ với số lượng cuộc hẹn (hỗ trợ lịch sử)
  getDentistCalendar: async (dentistId, view = 'daily', startDate, endDate) => {
    const response = await scheduleApi.get(`/slot/dentist/${dentistId}/calendar`, {
      params: { view, startDate, endDate }
    });
    return response.data;
  },

  // Lấy lịch y tá với số lượng cuộc hẹn (hỗ trợ lịch sử)
  getNurseCalendar: async (nurseId, view = 'daily', startDate, endDate) => {
    const response = await scheduleApi.get(`/slot/nurse/${nurseId}/calendar`, {
      params: { view, startDate, endDate }
    });
    return response.data;
  },

  // Lấy quý và năm có thể phân công nhân sự
  getAvailableQuartersYears: async () => {
    const response = await scheduleApi.get('/slot/available-quarters');
    return response.data;
  },

  // Lấy danh sách ca làm việc có sẵn
  getAvailableShifts: async () => {
    const response = await scheduleApi.get('/slot/available-shifts');
    return response.data;
  }
};

export default slotService;

/**
 * @author: HoTram
 * Schedule Service - Quản lý lịch làm việc
 */
import { scheduleApi } from './apiFactory.js';

const scheduleService = {
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
  },

  // 🆕 Tạo lịch thủ công cho phòng cụ thể với chọn ca (MONTHLY RANGE)
  generateRoomSchedule: async ({ roomId, subRoomId, selectedSubRoomIds, fromMonth, toMonth, fromYear, toYear, startDate, partialStartDate, shifts }) => {
    try {
      const response = await scheduleApi.post('/schedule/room/generate', {
        roomId,
        subRoomId,
        selectedSubRoomIds, // 🆕 Array of selected subroom IDs
        fromMonth,
        toMonth,
        fromYear,
        toYear,
        startDate,
        partialStartDate, // 🆕 For adding missing shifts
        shifts
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  // 🆕 Lấy thông tin lịch và ca đã tạo của phòng (cho UI tạo lịch)
  getRoomSchedulesWithShifts: async (roomId, subRoomId = null, month = null, year = null) => {
    const params = {};
    if (subRoomId) params.subRoomId = subRoomId;
    if (month) params.month = month;
    if (year) params.year = year;
    const response = await scheduleApi.get(`/schedule/room/${roomId}/shifts`, { params });
    return response.data;
  },

  // 🆕 Lấy preview ngày nghỉ cho khoảng thời gian tạo lịch
  getHolidayPreview: async (startDate, endDate) => {
    const response = await scheduleApi.get('/schedule/holiday-preview', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // 🆕 Lấy thông tin tổng hợp lịch theo phòng (cho staff assignment)
  getScheduleSummaryByRoom: async (roomId, quarter, year) => {
    const params = {};
    if (quarter) params.quarter = quarter;
    if (year) params.year = year;

    const response = await scheduleApi.get(`/schedule/room/${roomId}/summary`, { params });
    return response.data;
  },

  // 🆕 Lấy danh sách phòng kèm thông tin lịch (cho staff assignment list)
  getRoomsWithScheduleSummary: async ({ quarter, year, isActive }) => {
    const params = {};
    if (quarter) params.quarter = quarter;
    if (year) params.year = year;
    if (isActive !== undefined) params.isActive = isActive;

    const response = await scheduleApi.get('/schedule/rooms-summary', { params });
    return response.data;
  },

  // 🆕 Lấy slots theo ca cho calendar view (tháng)
  getSlotsByShiftCalendar: async ({ roomId, subRoomId, shiftName, month, year }) => {
    const response = await scheduleApi.get('/schedule/slots/shift-calendar', {
      params: { roomId, subRoomId, shiftName, month, year }
    });
    return response.data;
  },

  // 🆕 STAFF ASSIGNMENT APIs
  // Lấy danh sách phòng với thông tin ca (cho staff assignment)
  getRoomsForStaffAssignment: async ({ month, year, isActive }) => {
    const params = { month, year };
    if (isActive !== undefined) params.isActive = isActive;

    const response = await scheduleApi.get('/schedule/staff-assignment/rooms', { params });
    return response.data;
  },

  // Lấy calendar cho ca (click vào ca để phân công)
  getShiftCalendarForAssignment: async ({ roomId, subRoomId, shiftName, month, year }) => {
    const response = await scheduleApi.get('/schedule/staff-assignment/shift-calendar', {
      params: { roomId, subRoomId, shiftName, month, year }
    });
    return response.data;
  },

  // Lấy danh sách slots cho ngày cụ thể (click vào ngày)
  getSlotsByDayAndShift: async ({ roomId, subRoomId, shiftName, date }) => {
    const response = await scheduleApi.get('/schedule/staff-assignment/slots/day', {
      params: { roomId, subRoomId, shiftName, date }
    });
    return response.data;
  },

  // Phân công nhân sự cho 1 slot
  assignStaffToSlot: async ({ slotId, dentistId, nurseId }) => {
    try {
      const response = await scheduleApi.patch(`/schedule/staff-assignment/slots/${slotId}/assign`, {
        dentistId,
        nurseId
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  // Phân công nhân sự hàng loạt
  bulkAssignStaff: async ({ slotIds, dentistId, nurseId }) => {
    try {
      const response = await scheduleApi.post('/schedule/staff-assignment/slots/bulk-assign', {
        slotIds,
        dentistId,
        nurseId
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  // 🆕 Lấy danh sách ca đã có lịch của phòng
  getRoomScheduleShifts: async ({ roomId, subRoomId, month, year }) => {
    try {
      const response = await scheduleApi.get('/schedule/room-shifts', {
        params: { roomId, subRoomId, month, year }
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  // 🆕 Lấy danh sách nhân sự với conflict checking cho ca
  getStaffAvailabilityForShift: async ({ roomId, subRoomId, shiftName, month, year }) => {
    try {
      const response = await scheduleApi.get('/schedule/staff-availability', {
        params: { roomId, subRoomId, shiftName, month, year }
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  // 🆕 Lấy lịch làm việc của nhân sự
  getStaffSchedule: async ({ staffId, fromDate, toDate }) => {
    try {
      const response = await scheduleApi.get('/schedule/staff-schedule', {
        params: { staffId, fromDate, toDate }
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  // 🆕 Lấy danh sách nhân sự có thể thay thế (với conflict checking)
  getAvailableReplacementStaff: async ({ originalStaffId, role, slots, fromDate }) => {
    try {
      const response = await scheduleApi.post('/schedule/replacement-staff', {
        originalStaffId,
        role,
        slots,
        fromDate
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  // 🆕 Thay thế nhân sự
  replaceStaff: async ({ originalStaffId, replacementStaffId, slots, fromDate, replaceAll }) => {
    try {
      const response = await scheduleApi.post('/schedule/replace-staff', {
        originalStaffId,
        replacementStaffId,
        slots,
        fromDate,
        replaceAll
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  // 🆕 Cập nhật lịch (reactive scheduling - admin only)
  updateSchedule: async (scheduleId, { isActive, reactivateShifts, reactivateSubRooms }) => {
    try {
      const response = await scheduleApi.put(`/schedule/${scheduleId}`, {
        isActive,
        reactivateShifts,
        reactivateSubRooms
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  // 🆕 Thêm ca thiếu vào lịch đã tạo (admin only)
  addMissingShifts: async ({ roomId, month, year, subRoomIds, selectedShifts, partialStartDate }) => {
    try {
      const response = await scheduleApi.post(`/schedule/add-missing-shifts`, {
        roomId,
        month,
        year,
        subRoomIds,
        selectedShifts,
        partialStartDate
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }
};

export const updateSchedule = scheduleService.updateSchedule;
export default scheduleService;
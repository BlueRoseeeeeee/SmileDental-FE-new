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
  getSlotsByShiftAndDate: async (params) => {
    const response = await scheduleApi.get('/slot/by-shift', {
      params: params
    });
    return response.data;
  },

  // Lấy slot details theo ngày và ca cho phòng (ALL slots - for calendar)
  getSlotsByDate: async (roomId, params) => {
    const queryParams = new URLSearchParams();
    if (params.date) queryParams.append('date', params.date);
    if (params.shiftName) queryParams.append('shiftName', params.shiftName);
    if (params.subRoomId) queryParams.append('subRoomId', params.subRoomId);

    const url = `/slot/room/${roomId}/details${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await scheduleApi.get(url);
    return response.data;
  },

  // 🆕 Lấy FUTURE slot details theo ngày và ca cho phòng (for staff assignment)
  getSlotsByDateFuture: async (roomId, params) => {
    const queryParams = new URLSearchParams();
    if (params.date) queryParams.append('date', params.date);
    if (params.shiftName) queryParams.append('shiftName', params.shiftName);
    if (params.subRoomId) queryParams.append('subRoomId', params.subRoomId);

    const url = `/slot/room/${roomId}/details/future${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await scheduleApi.get(url);
    return response.data;
  },

  // Lấy lịch phòng với số lượng cuộc hẹn (xem theo ngày/tuần/tháng)
  getRoomCalendar: async (roomId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.subRoomId) queryParams.append('subRoomId', params.subRoomId);
    if (params.viewType) queryParams.append('viewType', params.viewType);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.futureOnly !== undefined) queryParams.append('futureOnly', params.futureOnly ? 'true' : 'false');

    const url = `/slot/room/${roomId}/calendar${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await scheduleApi.get(url);
    return response.data;
  },

  // Lấy lịch nha sĩ với số lượng cuộc hẹn (hỗ trợ lịch sử)
  getDentistCalendar: async (dentistId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.viewType) queryParams.append('viewType', params.viewType);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.futureOnly !== undefined) queryParams.append('futureOnly', params.futureOnly ? 'true' : 'false');

    const url = `/slot/dentist/${dentistId}/calendar${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await scheduleApi.get(url);
    return response.data;
  },

  // Lấy lịch y tá với số lượng cuộc hẹn (hỗ trợ lịch sử)
  getNurseCalendar: async (nurseId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.viewType) queryParams.append('viewType', params.viewType);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.futureOnly !== undefined) queryParams.append('futureOnly', params.futureOnly ? 'true' : 'false');

    const url = `/slot/nurse/${nurseId}/calendar${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await scheduleApi.get(url);
    return response.data;
  },

  // ❌ REMOVED: getAvailableQuartersYears - Frontend không dùng
  
  // Lấy danh sách ca làm việc có sẵn
  getAvailableShifts: async () => {
    const response = await scheduleApi.get('/slot/available-shifts');
    return response.data;
  },

  // Lấy chi tiết slots của nha sĩ theo ngày và ca (ALL slots - for calendar)
  getDentistSlots: async (dentistId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.date) queryParams.append('date', params.date);
    if (params.shiftName) queryParams.append('shiftName', params.shiftName);

    const url = `/slot/dentist/${dentistId}/details${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await scheduleApi.get(url);
    return response.data;
  },

  // 🆕 Lấy FUTURE chi tiết slots của nha sĩ (for staff replacement)
  getDentistSlotsFuture: async (dentistId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.date) queryParams.append('date', params.date);
    if (params.shiftName) queryParams.append('shiftName', params.shiftName);

    const url = `/slot/dentist/${dentistId}/details/future${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await scheduleApi.get(url);
    return response.data;
  },

  // Lấy chi tiết slots của y tá theo ngày và ca (ALL slots - for calendar)
  getNurseSlots: async (nurseId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.date) queryParams.append('date', params.date);
    if (params.shiftName) queryParams.append('shiftName', params.shiftName);

    const url = `/slot/nurse/${nurseId}/details${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await scheduleApi.get(url);
    return response.data;
  },

  // 🆕 Lấy FUTURE chi tiết slots của y tá (for staff replacement)
  getNurseSlotsFuture: async (nurseId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.date) queryParams.append('date', params.date);
    if (params.shiftName) queryParams.append('shiftName', params.shiftName);

    const url = `/slot/nurse/${nurseId}/details/future${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await scheduleApi.get(url);
    return response.data;
  },

  // 🆕 Kiểm tra nhân sự có lịch làm việc không
  checkStaffHasSchedule: async (staffIds, role) => {
    const response = await scheduleApi.post('/slot/check-has-schedule', {
      staffIds,
      role // 'dentist' or 'nurse'
    });
    return response.data;
  },

  // 🆕 PATIENT BOOKING APIs
  // Lấy danh sách nha sỹ và slot gần nhất
  getDentistsWithNearestSlot: async (serviceDuration = 15) => {
    const response = await scheduleApi.get('/slot/dentists-with-nearest-slot', {
      params: { serviceDuration }
    });
    return response.data;
  },

  // Lấy danh sách ngày làm việc của nha sỹ trong maxBookingDays
  getDentistWorkingDates: async (dentistId, serviceDuration = 15) => {
    const response = await scheduleApi.get(`/slot/dentist/${dentistId}/working-dates`, {
      params: { serviceDuration }
    });
    return response.data;
  }
};

export default slotService;

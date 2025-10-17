/**
 * @author: HoTram
 */
import { roomApi } from './apiFactory.js';

const roomService = {
  // Lấy danh sách phòng khám
  getRooms: async (page = 1, limit = 10) => {
    const response = await roomApi.get(`/room?page=${page}&limit=${limit}`);
    return response.data;
  },
    // Tạo phòng khám mới
  createRoom: async (roomData) => {
    const response = await roomApi.post('/room', roomData);
    return response.data;
  },
   // Lấy thông tin chi tiết phòng khám
  getRoomById: async (roomId) => {
    const response = await roomApi.get(`/room/${roomId}`);
    return response.data;
  },
    // Cập nhật thông tin phòng khám
  updateRoom: async (roomId, roomData) => {
    const response = await roomApi.put(`/room/${roomId}`, roomData);
    return response.data;
  },
    // Bật/tắt trạng thái subroom
  toggleSubRoomStatus: async (roomId, subRoomId) => {
    const response = await roomApi.patch(`/room/${roomId}/subrooms/${subRoomId}/toggle`);
    return response.data;
  },
    // Bật/tắt trạng thái phòng chính
  toggleRoomStatus: async (roomId) => {
    const response = await roomApi.patch(`/room/${roomId}/toggle`);
    return response.data;
  },
    // Xóa phòng khám chính
  deleteRoom: async (roomId) => {
    const response = await roomApi.delete(`/room/${roomId}`);
    return response.data;
  },
    // Xóa subroom (buồng)
  deleteSubRoom: async (roomId, subRoomId) => {
    const response = await roomApi.delete(`/room/${roomId}/subrooms/${subRoomId}`);
    return response.data;
  },
    // Thêm subrooms cho phòng có subrooms
  addSubRooms: async (roomId, count) => {
    const response = await roomApi.post(`/room/${roomId}/subrooms`, { count });
    return response.data;
  },

  // 🆕 Lấy danh sách phòng với thông tin lịch (cho UI tạo lịch)
  getRoomsForSchedule: async ({ page = 1, limit = 20, isActive }) => {
    const params = { page, limit };
    // Chỉ thêm isActive vào params nếu nó được định nghĩa
    if (isActive !== undefined) {
      params.isActive = isActive;
    }
    const response = await roomApi.get('/room/schedule-info', {
      params
    });
    return response.data;
  },

  // Get room types enum
  getRoomTypes: async () => {
    const response = await roomApi.get('/room/enums/room-types');
    return response.data?.data || {};
  }

};
export default roomService;


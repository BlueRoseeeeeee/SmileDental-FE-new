/**
 * @author: HoTram
 */
import axios from 'axios';

// Room service API base URL
const ROOM_API_BASE_URL = 'http://localhost:3002/api';

// Create axios instance for room service
const roomApi = axios.create({
  baseURL: ROOM_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add auth token if available
roomApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
};
export default roomService;


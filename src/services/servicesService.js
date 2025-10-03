/**
 * @author: HoTram
 */
import { serviceApi } from './apiFactory.js';

export const servicesService = {
  // Lấy danh sách services
  async getServices(page = 1, limit = 10) {
    const response = await serviceApi.get(`/service?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Tạo service mới
  async createService(serviceData) {
    const response = await serviceApi.post('/service', serviceData);
    return response.data;
  },

  // Bật/tắt trạng thái dịch vụ
  async toggleServiceStatus(serviceId) {
    const response = await serviceApi.patch(`/service/${serviceId}/toggle`);
    return response.data;
  }
};
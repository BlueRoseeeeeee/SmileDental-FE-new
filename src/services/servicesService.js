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

  // Lấy chi tiết service theo ID
  async getServiceById(serviceId) {
    const response = await serviceApi.get(`/service/${serviceId}`);
    return response.data;
  },

  // Tạo service mới
  async createService(serviceData) {
    const response = await serviceApi.post('/service', serviceData);
    return response.data;
  },

  // Cập nhật service
  async updateService(serviceId, serviceData) {
    const response = await serviceApi.put(`/service/${serviceId}`, serviceData);
    return response.data;
  },

  // Bật/tắt trạng thái dịch vụ
  async toggleServiceStatus(serviceId) {
    const response = await serviceApi.patch(`/service/${serviceId}/toggle`);
    return response.data;
  }
};
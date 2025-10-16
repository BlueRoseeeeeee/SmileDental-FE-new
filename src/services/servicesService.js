/**
 * @author: HoTram
 */
import { serviceApi } from './apiFactory.js';

export const servicesService = {
  // Lấy tất cả services (không phân trang)
  async getAllServices() {
    const response = await serviceApi.get('/service?page=1&limit=1000');
    return response.data;
  },

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
  },

  // Xóa dịch vụ
  async deleteService(serviceId) {
    const response = await serviceApi.delete(`/service/${serviceId}`);
    return response.data;
  },

  // === SERVICE ADD-ONS APIs ===
  
  // Thêm add-on cho dịch vụ
  async addServiceAddOn(serviceId, addOnData) {
    const response = await serviceApi.post(`/service/${serviceId}/addons`, addOnData);
    return response.data;
  },

  // Cập nhật add-on
  async updateServiceAddOn(serviceId, addOnId, addOnData) {
    const response = await serviceApi.put(`/service/${serviceId}/addons/${addOnId}`, addOnData);
    return response.data;
  },

  // Toggle trạng thái add-on
  async toggleServiceAddOn(serviceId, addOnId) {
    const response = await serviceApi.patch(`/service/${serviceId}/addons/${addOnId}/toggle`);
    return response.data;
  },

  // Xóa add-on
  async deleteServiceAddOn(serviceId, addOnId) {
    const response = await serviceApi.delete(`/service/${serviceId}/addons/${addOnId}`);
    return response.data;
  },

  // Lấy chi tiết add-on theo ID
  async getServiceAddOnById(serviceId, addOnId) {
    const response = await serviceApi.get(`/service/${serviceId}/addons/${addOnId}`);
    return response.data;
  }
};
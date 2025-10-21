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
    const response = await serviceApi.post('/service', serviceData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
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
  
  // Lấy chi tiết add-on theo ID
  async getServiceAddOnById(serviceId, addOnId) {
    const response = await serviceApi.get(`/service/${serviceId}/addons/${addOnId}`);
    return response.data;
  },

  // Thêm add-on cho dịch vụ
  async addServiceAddOn(serviceId, addOnData) {
    // Kiểm tra nếu addOnData là FormData (có ảnh)
    const isFormData = addOnData instanceof FormData;
    
    const config = isFormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : {};

    const response = await serviceApi.post(`/service/${serviceId}/addons`, addOnData, config);
    return response.data;
  },

  // Cập nhật add-on
  async updateServiceAddOn(serviceId, addOnId, addOnData) {
    // Kiểm tra nếu addOnData là FormData (có ảnh)
    const isFormData = addOnData instanceof FormData;
    
    const config = isFormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : {};

    const response = await serviceApi.put(`/service/${serviceId}/addons/${addOnId}`, addOnData, config);
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

  // Get room types enum
  async getRoomTypes() {
    const response = await serviceApi.get('/service/enums/room-types');
    return response.data?.data || {};
  },

  // === 🆕 PRICE SCHEDULE APIs ===
  
  // Thêm lịch giá mới cho ServiceAddOn
  async addPriceSchedule(serviceId, addOnId, scheduleData) {
    const response = await serviceApi.post(
      `/service/${serviceId}/addons/${addOnId}/price-schedules`, 
      scheduleData
    );
    return response.data;
  },

  // Cập nhật lịch giá
  async updatePriceSchedule(serviceId, addOnId, scheduleId, scheduleData) {
    const response = await serviceApi.put(
      `/service/${serviceId}/addons/${addOnId}/price-schedules/${scheduleId}`, 
      scheduleData
    );
    return response.data;
  },

  // Xóa lịch giá
  async deletePriceSchedule(serviceId, addOnId, scheduleId) {
    const response = await serviceApi.delete(
      `/service/${serviceId}/addons/${addOnId}/price-schedules/${scheduleId}`
    );
    return response.data;
  },

  // Toggle trạng thái active của lịch giá
  async togglePriceScheduleStatus(serviceId, addOnId, scheduleId) {
    const response = await serviceApi.patch(
      `/service/${serviceId}/addons/${addOnId}/price-schedules/${scheduleId}/toggle`
    );
    return response.data;
  },

  // === 🆕 TEMPORARY PRICE APIs (for Service) ===
  
  // Cập nhật giá tạm thời cho Service
  async updateTemporaryPrice(serviceId, temporaryPriceData) {
    const response = await serviceApi.put(
      `/service/${serviceId}/temporary-price`, 
      temporaryPriceData
    );
    return response.data;
  },

  // Xóa giá tạm thời
  async removeTemporaryPrice(serviceId) {
    const response = await serviceApi.delete(`/service/${serviceId}/temporary-price`);
    return response.data;
  }
};
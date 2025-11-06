/**
 * @author: HoTram
 */
import { serviceApi } from './apiFactory.js';

export const servicesService = {
  // Lấy tất cả services (không phân trang)
  async getAllServices() {
    const response = await serviceApi.get('/service?page=1&limit=1000');
    const data = response.data;
    
    // Fix lại theo Cấu trúc mới: { success: true, data: [...], pagination: {...} }
    return {
      services: data.data || [],
      total: data.pagination?.total || 0,
      page: data.pagination?.page || 1,
      limit: data.pagination?.limit || 1000,
      totalPages: data.pagination?.totalPages || 1
    };
  },

  // Lấy danh sách services
  async getServices(page = 1, limit = 10) {
    const response = await serviceApi.get(`/service?page=${page}&limit=${limit}`);
    const data = response.data;
    
    // Fix lại theo Cấu trúc mới từ BE: { success: true, data: [...], pagination: {...} }
    return {
      services: data.data || [],
      total: data.pagination?.total || 0,
      page: data.pagination?.page || page,
      limit: data.pagination?.limit || limit,
      totalPages: data.pagination?.totalPages || 1
    };
  },

  // Lấy chi tiết service theo ID
  async getServiceById(serviceId) {
    const response = await serviceApi.get(`/service/${serviceId}`);
    // Cấu trúc mới: { success: true, data: {...} }
    return response.data.data || response.data;
  },

  // Tạo service mới
  async createService(serviceData) {
    const response = await serviceApi.post('/service', serviceData);
    //Fix lại theo Cấu trúc mới từ BE: { success: true, data: {...} }
    return response.data.data || response.data;
  },

  // Cập nhật service
  async updateService(serviceId, serviceData) {
    const response = await serviceApi.put(`/service/${serviceId}`, serviceData);
    // Cấu trúc mới: { success: true, data: {...} }
    return response.data.data || response.data;
  },

  // Bật/tắt trạng thái dịch vụ
  async toggleServiceStatus(serviceId) {
    const response = await serviceApi.patch(`/service/${serviceId}/toggle`);
    // Cấu trúc mới: { success: true, data: {...} }
    return response.data.data || response.data;
  },

  // Xóa dịch vụ
  async deleteService(serviceId) {
    const response = await serviceApi.delete(`/service/${serviceId}`);
    // Cấu trúc mới: { success: true, data: {...} }
    return response.data.data || response.data;
  },

  // === SERVICE ADD-ONS APIs ===
  
  // Lấy chi tiết add-on theo ID
  async getServiceAddOnById(serviceId, addOnId) {
    const response = await serviceApi.get(`/service/${serviceId}/addons/${addOnId}`);
    // Cấu trúc mới: { success: true, data: {...} }
    return response.data.data || response.data;
  },

  // Thêm add-on cho dịch vụ
  async addServiceAddOn(serviceId, addOnData) {
    // ✅ Don't set Content-Type for FormData - browser will set it automatically
    // This prevents overriding the Authorization header
    const response = await serviceApi.post(`/service/${serviceId}/addons`, addOnData);
    // Cấu trúc mới: { success: true, data: {...} }
    return response.data.data || response.data;
  },

  // Cập nhật add-on
  async updateServiceAddOn(serviceId, addOnId, addOnData) {
    // ✅ Don't set Content-Type for FormData - browser will set it automatically
    // This prevents overriding the Authorization header
    console.log('🔵 [servicesService] updateServiceAddOn called');
    console.log('🔵 [servicesService] serviceId:', serviceId, 'addOnId:', addOnId);
    console.log('🔵 [servicesService] addOnData type:', addOnData.constructor.name);
    
    // Log FormData contents (for debugging)
    if (addOnData instanceof FormData) {
      console.log('🔵 [servicesService] FormData entries:');
      for (let [key, value] of addOnData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}:`, value.name, `(${value.type}, ${value.size} bytes)`);
        } else {
          console.log(`  ${key}:`, value);
        }
      }
    }
    
    const response = await serviceApi.put(`/service/${serviceId}/addons/${addOnId}`, addOnData);
    console.log('✅ [servicesService] Response:', response.data);
    // Cấu trúc mới: { success: true, data: {...} }
    return response.data.data || response.data;
  },

  // Toggle trạng thái add-on
  async toggleServiceAddOn(serviceId, addOnId) {
    const response = await serviceApi.patch(`/service/${serviceId}/addons/${addOnId}/toggle`);
    // Cấu trúc mới: { success: true, data: {...} }
    return response.data.data || response.data;
  },

  // Xóa add-on
  async deleteServiceAddOn(serviceId, addOnId) {
    const response = await serviceApi.delete(`/service/${serviceId}/addons/${addOnId}`);
    // Cấu trúc mới: { success: true, data: {...} }
    return response.data.data || response.data;
  },

  // Get room types enum
  async getRoomTypes() {
    const response = await serviceApi.get('/service/enums/room-types');
    // Cấu trúc mới: { success: true, data: {...} }
    const data = response.data.data || response.data;
    return data?.data || data || {};
  },

  // === 🆕 PRICE SCHEDULE APIs ===
  
  // Thêm lịch giá mới cho ServiceAddOn
  async addPriceSchedule(serviceId, addOnId, scheduleData) {
    const response = await serviceApi.post(
      `/service/${serviceId}/addons/${addOnId}/price-schedules`, 
      scheduleData
    );
    // Cấu trúc mới: { success: true, data: {...} }
    return response.data.data || response.data;
  },

  // Cập nhật lịch giá
  async updatePriceSchedule(serviceId, addOnId, scheduleId, scheduleData) {
    const response = await serviceApi.put(
      `/service/${serviceId}/addons/${addOnId}/price-schedules/${scheduleId}`, 
      scheduleData
    );
    // Cấu trúc mới: { success: true, data: {...} }
    return response.data.data || response.data;
  },

  // Xóa lịch giá
  async deletePriceSchedule(serviceId, addOnId, scheduleId) {
    const response = await serviceApi.delete(
      `/service/${serviceId}/addons/${addOnId}/price-schedules/${scheduleId}`
    );
    // Cấu trúc mới: { success: true, data: {...} }
    return response.data.data || response.data;
  },

  // Toggle trạng thái active của lịch giá
  async togglePriceScheduleStatus(serviceId, addOnId, scheduleId) {
    const response = await serviceApi.patch(
      `/service/${serviceId}/addons/${addOnId}/price-schedules/${scheduleId}/toggle`
    );
    // Cấu trúc mới: { success: true, data: {...} }
    return response.data.data || response.data;
  },

  // === 🆕 TEMPORARY PRICE APIs (for Service) ===
  
  // Cập nhật giá tạm thời cho Service
  async updateTemporaryPrice(serviceId, temporaryPriceData) {
    const response = await serviceApi.put(
      `/service/${serviceId}/temporary-price`, 
      temporaryPriceData
    );
    // Cấu trúc mới: { success: true, data: {...} }
    return response.data.data || response.data;
  },

  // Xóa giá tạm thời
  async removeTemporaryPrice(serviceId) {
    const response = await serviceApi.delete(`/service/${serviceId}/temporary-price`);
    // Cấu trúc mới: { success: true, data: {...} }
    return response.data.data || response.data;
  }
};
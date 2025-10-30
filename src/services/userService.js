/*
* @author: HoTram
*/
import { userApi } from './apiFactory.js';

// User Service - Only verified APIs that are actually used
export const userService = {
  // Profile management - Used in Profile.jsx
  getProfile: async () => {
    const response = await userApi.get('/user/profile', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      // ✅ Force refresh từ server
      params: { _t: new Date().getTime() }
    });
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await userApi.put('/user/profile', userData, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    return response.data;
  },

  // User management - Used in UserManagement.jsx  
  getAllStaff: async (page = 1, limit = 10) => {
    const response = await userApi.get(`/user/all-staff?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get all patients - Used in PatientManagement.jsx
  getAllPatients: async (page = 1, limit = 1000) => {
    const response = await userApi.get(`/user/all-patient?page=${page}&limit=${limit}`);
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await userApi.get(`/user/${userId}`);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await userApi.delete(`/user/${userId}`);
    return response.data;
  },

  // Thay đổi trạng thái của người dùng
  toggleUserStatus: async (userId) => {
    const response = await userApi.patch(`/user/${userId}/toggle-status`);
    return response.data;
  },

  // Avatar upload -  Used in Profile.jsx
  uploadAvatar: async (userId, file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    // ✅ Don't set Content-Type for FormData - browser will set it automatically
    // This prevents overriding the Authorization header
    const response = await userApi.put(`/user/avatar/${userId}`, formData, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
    });
    return response.data;
  },

  // Certificate management - Used in CertificateManagement.jsx
  uploadCertificate: async (userId, file, notes = '') => {
    const formData = new FormData();
    formData.append('certificate', file);
    if (notes) formData.append('notes', notes);

    // ✅ Don't set Content-Type for FormData - browser will set it automatically
    const response = await userApi.post(`/user/${userId}/certificates`, formData);
    return response.data;
  },

  deleteCertificate: async (userId, certificateId) => {
    const response = await userApi.delete(`/user/${userId}/certificates/${certificateId}`);
    return response.data;
  },

  updateCertificateNotes: async (userId, certificateId, notes) => {
    const response = await userApi.patch(`/user/${userId}/certificates/${certificateId}/notes`, {
      notes,
    });
    return response.data;
  },

  // Public dentists API - Used in DentistsSection
  getPublicDentists: async () => {
    const response = await userApi.get('/user/public/dentists');
    return response.data;
  },

  // 🆕 Nhiệm vụ 3.1: Create staff without OTP
  createStaff: async (staffData) => {
    console.log('🔵 [userService] Sending create-staff request:', staffData);
    const response = await userApi.post('/user/create-staff', staffData);
    console.log('✅ [userService] Create-staff response:', response.data);
    return response.data;
  },

  // 🆕 Reset user password to default (Admin/Manager only)
  resetUserPassword: async (userId) => {
    console.log('🔵 [userService] Resetting password for user:', userId);
    const response = await userApi.post(`/user/${userId}/reset-password`);
    console.log('✅ [userService] Reset password response:', response.data);
    return response.data;
  },
};

export default userService;

/*
* @author: HoTram
*/
import { userApi } from './apiFactory.js';

// User Service - Only verified APIs that are actually used
export const userService = {
  // Profile management - Used in Profile.jsx
  getProfile: async () => {
    const response = await userApi.get('/user/profile');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await userApi.put('/user/profile', userData);
    return response.data;
  },

  // User management - Used in UserManagement.jsx  
  getAllStaff: async (page = 1, limit = 10) => {
    const response = await userApi.get(`/user/all-staff?page=${page}&limit=${limit}`);
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

    const response = await userApi.put(`/user/avatar/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Certificate management - Used in CertificateManagement.jsx
  uploadCertificate: async (userId, file, notes = '') => {
    const formData = new FormData();
    formData.append('certificate', file);
    if (notes) formData.append('notes', notes);

    const response = await userApi.post(`/user/${userId}/certificates`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
};

export default userService;

/*
* @author: HoTram
*/
import api from './api.js';

// User Service
export const userService = {
  // Profile management
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/user/profile', userData);
    return response.data;
  },

  // User management (Admin/Manager only)
  getUsersByRole: async (role, page = 1, limit = 10) => {
    const response = await api.get(`/user/by-role?role=${role}&page=${page}&limit=${limit}`);
    return response.data;
  },

  getAllStaff: async (page = 1, limit = 10) => {
    const response = await api.get(`/user/all-staff?page=${page}&limit=${limit}`);
    return response.data;
  },

  searchStaff: async (criteria, page = 1, limit = 10) => {
    const params = new URLSearchParams({ page, limit, ...criteria });
    const response = await api.get(`/user/staff/search?${params}`);
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/user/${userId}`);
    return response.data;
  },

  updateUserByAdmin: async (userId, userData) => {
    const response = await api.put(`/user/update/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/user/${userId}`);
    return response.data;
  },

  // Avatar upload
  uploadAvatar: async (userId, file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.put(`/user/avatar/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Certificate management (Dentist only)
  uploadCertificate: async (userId, file, notes = '') => {
    const formData = new FormData();
    formData.append('certificate', file);
    if (notes) formData.append('notes', notes);

    const response = await api.post(`/user/${userId}/certificates`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteCertificate: async (userId, certificateId) => {
    const response = await api.delete(`/user/${userId}/certificates/${certificateId}`);
    return response.data;
  },

  verifyCertificate: async (userId, certificateId, isVerified = true) => {
    const response = await api.patch(`/user/${userId}/certificates/${certificateId}/verify`, {
      isVerified,
    });
    return response.data;
  },

  updateCertificateNotes: async (userId, certificateId, notes) => {
    const response = await api.patch(`/user/${userId}/certificates/${certificateId}/notes`, {
      notes,
    });
    return response.data;
  },

  // Public API
  getDentistsForPatients: async () => {
    const response = await api.get('/user/public/dentists');
    return response.data;
  },

  // Batch operations
  getStaffByIds: async (ids) => {
    const response = await api.post('/user/staff/batch', { ids });
    return response.data;
  },

  // Create new employee (Admin/Manager only)
  createEmployee: async (employeeData) => {
    const response = await api.post('/auth/register', employeeData);
    return response.data;
  },
};

export default userService;
/**
 * Mock Record Service - For testing Medical Record Management
 * 
 * This service simulates record-service API endpoints
 * to enable frontend development without backend dependency.
 */

import { message } from 'antd';

// Simulated database
let mockRecords = [
  {
    _id: 'rec_001',
    recordCode: 'EX20250117001',
    patientId: 'pat_001',
    patientInfo: {
      name: 'Nguyễn Văn A',
      phone: '0901234567',
      birthYear: 1990,
      gender: 'male',
      address: 'Hà Nội'
    },
    appointmentId: 'apt_001',
    date: new Date('2025-01-17'),
    serviceId: 'ser_001',
    serviceName: 'Khám tổng quát',
    dentistId: 'den_001',
    dentistName: 'BS. Nguyễn Văn An',
    roomId: 'room_001',
    roomName: 'Phòng khám 1',
    diagnosis: 'Sâu răng hàm số 6',
    indications: ['Hàn răng', 'Chụp X-quang'],
    notes: 'Bệnh nhân đau răng khi ăn đồ lạnh',
    type: 'exam',
    treatmentIndications: [
      {
        serviceId: 'ser_003',
        serviceName: 'Hàn răng',
        used: false,
        usedAt: null,
        notes: 'Cần hàn răng sớm'
      }
    ],
    prescription: {
      medicines: [
        {
          medicineId: 'med_001',
          medicineName: 'Amoxicillin 500mg',
          dosage: '1 viên x 3 lần/ngày',
          duration: '5 ngày',
          quantity: 15,
          note: 'Uống sau ăn'
        }
      ],
      notes: 'Uống đủ liều',
      prescribedBy: 'den_001',
      prescribedAt: new Date('2025-01-17')
    },
    status: 'completed',
    priority: 'normal',
    totalCost: 200000,
    paymentStatus: 'paid',
    hasBeenUsed: false,
    createdBy: 'den_001',
    lastModifiedBy: 'den_001',
    createdAt: new Date('2025-01-17T08:30:00'),
    updatedAt: new Date('2025-01-17T09:00:00')
  },
  {
    _id: 'rec_002',
    recordCode: 'TR20250117001',
    patientId: 'pat_002',
    patientInfo: {
      name: 'Trần Thị B',
      phone: '0909876543',
      birthYear: 1985,
      gender: 'female',
      address: 'TP.HCM'
    },
    appointmentId: 'apt_002',
    date: new Date('2025-01-17'),
    serviceId: 'ser_002',
    serviceName: 'Nhổ răng',
    dentistId: 'den_003',
    dentistName: 'BS. Lê Văn Cường',
    roomId: 'room_002',
    roomName: 'Phòng phẫu thuật',
    diagnosis: 'Răng khôn mọc lệch',
    indications: ['Nhổ răng khôn'],
    notes: 'Đã chụp X-quang',
    type: 'treatment',
    treatmentIndications: [],
    prescription: {
      medicines: [
        {
          medicineId: 'med_002',
          medicineName: 'Ibuprofen 400mg',
          dosage: '1 viên x 2 lần/ngày',
          duration: '3 ngày',
          quantity: 6,
          note: 'Giảm đau'
        },
        {
          medicineId: 'med_003',
          medicineName: 'Metronidazole 250mg',
          dosage: '1 viên x 3 lần/ngày',
          duration: '5 ngày',
          quantity: 15,
          note: 'Kháng viêm'
        }
      ],
      notes: 'Kiêng ăn cứng, không súc miệng mạnh',
      prescribedBy: 'den_003',
      prescribedAt: new Date('2025-01-17')
    },
    status: 'completed',
    priority: 'high',
    totalCost: 500000,
    paymentStatus: 'paid',
    hasBeenUsed: true,
    createdBy: 'den_003',
    lastModifiedBy: 'den_003',
    createdAt: new Date('2025-01-17T10:00:00'),
    updatedAt: new Date('2025-01-17T11:30:00')
  }
];

let recordCounter = 2; // Start from 002

/**
 * Generate record code
 */
const generateRecordCode = (type) => {
  const prefix = type === 'exam' ? 'EX' : 'TR';
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const sequence = String(++recordCounter).padStart(3, '0');
  
  return `${prefix}${year}${month}${day}${sequence}`;
};

/**
 * Get all records with filters
 */
export const getAllRecords = async (params = {}) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredRecords = [...mockRecords];
  
  // Filter by type
  if (params.type) {
    filteredRecords = filteredRecords.filter(r => r.type === params.type);
  }
  
  // Filter by status
  if (params.status) {
    filteredRecords = filteredRecords.filter(r => r.status === params.status);
  }
  
  // Filter by dentist
  if (params.dentistId) {
    filteredRecords = filteredRecords.filter(r => r.dentistId === params.dentistId);
  }
  
  // Filter by patient
  if (params.patientId) {
    filteredRecords = filteredRecords.filter(r => r.patientId === params.patientId);
  }
  
  // Filter by date range
  if (params.startDate) {
    const startDate = new Date(params.startDate);
    filteredRecords = filteredRecords.filter(r => new Date(r.date) >= startDate);
  }
  if (params.endDate) {
    const endDate = new Date(params.endDate);
    filteredRecords = filteredRecords.filter(r => new Date(r.date) <= endDate);
  }
  
  // Search by keyword
  if (params.q) {
    const keyword = params.q.toLowerCase();
    filteredRecords = filteredRecords.filter(r =>
      r.recordCode.toLowerCase().includes(keyword) ||
      r.patientInfo.name.toLowerCase().includes(keyword) ||
      r.diagnosis?.toLowerCase().includes(keyword)
    );
  }
  
  // Sort by date (newest first)
  filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Pagination
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);
  
  return {
    success: true,
    data: {
      records: paginatedRecords,
      pagination: {
        total: filteredRecords.length,
        page: page,
        limit: limit,
        pages: Math.ceil(filteredRecords.length / limit)
      }
    }
  };
};

/**
 * Get record by ID
 */
export const getRecordById = async (recordId) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const record = mockRecords.find(r => r._id === recordId);
  
  if (!record) {
    throw new Error('Record not found');
  }
  
  return {
    success: true,
    data: record
  };
};

/**
 * Get record by code
 */
export const getRecordByCode = async (code) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const record = mockRecords.find(r => r.recordCode === code);
  
  if (!record) {
    throw new Error('Record not found');
  }
  
  return {
    success: true,
    data: record
  };
};

/**
 * Get records by patient
 */
export const getRecordsByPatient = async (patientId) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const records = mockRecords
    .filter(r => r.patientId === patientId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return {
    success: true,
    data: records
  };
};

/**
 * Get records by dentist
 */
export const getRecordsByDentist = async (dentistId, params = {}) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  let records = mockRecords.filter(r => r.dentistId === dentistId);
  
  // Filter by date range
  if (params.startDate) {
    const startDate = new Date(params.startDate);
    records = records.filter(r => new Date(r.date) >= startDate);
  }
  if (params.endDate) {
    const endDate = new Date(params.endDate);
    records = records.filter(r => new Date(r.date) <= endDate);
  }
  
  records.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return {
    success: true,
    data: records
  };
};

/**
 * Get pending records
 */
export const getPendingRecords = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const records = mockRecords
    .filter(r => r.status === 'pending')
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Earliest first
  
  return {
    success: true,
    data: records
  };
};

/**
 * Create new record
 */
export const createRecord = async (recordData) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Validate required fields
  if (!recordData.patientId && !recordData.patientInfo) {
    throw new Error('Patient information is required');
  }
  if (!recordData.serviceId) {
    throw new Error('Service is required');
  }
  if (!recordData.dentistId) {
    throw new Error('Dentist is required');
  }
  if (!recordData.type) {
    throw new Error('Record type is required');
  }
  
  // Create new record
  const newRecord = {
    _id: `rec_${Date.now()}`,
    recordCode: generateRecordCode(recordData.type),
    patientId: recordData.patientId || null,
    patientInfo: recordData.patientInfo || {},
    appointmentId: recordData.appointmentId || null,
    date: recordData.date || new Date(),
    serviceId: recordData.serviceId,
    serviceName: recordData.serviceName || 'Unknown Service',
    dentistId: recordData.dentistId,
    dentistName: recordData.dentistName || 'Unknown Dentist',
    roomId: recordData.roomId || null,
    roomName: recordData.roomName || '',
    diagnosis: recordData.diagnosis || '',
    indications: recordData.indications || [],
    notes: recordData.notes || '',
    type: recordData.type,
    treatmentIndications: recordData.treatmentIndications || [],
    prescription: recordData.prescription || { medicines: [], notes: '' },
    status: recordData.status || 'pending',
    priority: recordData.priority || 'normal',
    totalCost: recordData.totalCost || 0,
    paymentStatus: recordData.paymentStatus || 'unpaid',
    hasBeenUsed: false,
    createdBy: recordData.createdBy || 'unknown',
    lastModifiedBy: recordData.createdBy || 'unknown',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  mockRecords.push(newRecord);
  
  console.log('✅ [Mock] Record created:', newRecord);
  
  return {
    success: true,
    message: 'Record created successfully',
    data: newRecord
  };
};

/**
 * Update record
 */
export const updateRecord = async (recordId, updateData) => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const index = mockRecords.findIndex(r => r._id === recordId);
  
  if (index === -1) {
    throw new Error('Record not found');
  }
  
  mockRecords[index] = {
    ...mockRecords[index],
    ...updateData,
    updatedAt: new Date()
  };
  
  console.log('✅ [Mock] Record updated:', mockRecords[index]);
  
  return {
    success: true,
    message: 'Record updated successfully',
    data: mockRecords[index]
  };
};

/**
 * Update record status
 */
export const updateRecordStatus = async (recordId, status) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const index = mockRecords.findIndex(r => r._id === recordId);
  
  if (index === -1) {
    throw new Error('Record not found');
  }
  
  mockRecords[index].status = status;
  mockRecords[index].updatedAt = new Date();
  
  console.log('✅ [Mock] Record status updated:', status);
  
  return {
    success: true,
    message: 'Status updated successfully',
    data: mockRecords[index]
  };
};

/**
 * Add prescription to record
 */
export const addPrescription = async (recordId, prescriptionData) => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const index = mockRecords.findIndex(r => r._id === recordId);
  
  if (index === -1) {
    throw new Error('Record not found');
  }
  
  mockRecords[index].prescription = {
    medicines: prescriptionData.medicines || [],
    notes: prescriptionData.notes || '',
    prescribedBy: prescriptionData.prescribedBy,
    prescribedAt: new Date()
  };
  mockRecords[index].updatedAt = new Date();
  
  console.log('✅ [Mock] Prescription added:', mockRecords[index].prescription);
  
  return {
    success: true,
    message: 'Prescription added successfully',
    data: mockRecords[index]
  };
};

/**
 * Update treatment indication
 */
export const updateTreatmentIndication = async (recordId, indicationId, updateData) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const recordIndex = mockRecords.findIndex(r => r._id === recordId);
  
  if (recordIndex === -1) {
    throw new Error('Record not found');
  }
  
  const indicationIndex = mockRecords[recordIndex].treatmentIndications.findIndex(
    i => i.serviceId === indicationId
  );
  
  if (indicationIndex === -1) {
    throw new Error('Treatment indication not found');
  }
  
  mockRecords[recordIndex].treatmentIndications[indicationIndex] = {
    ...mockRecords[recordIndex].treatmentIndications[indicationIndex],
    ...updateData
  };
  mockRecords[recordIndex].updatedAt = new Date();
  
  console.log('✅ [Mock] Treatment indication updated');
  
  return {
    success: true,
    message: 'Treatment indication updated successfully',
    data: mockRecords[recordIndex]
  };
};

/**
 * Complete record
 */
export const completeRecord = async (recordId) => {
  return updateRecordStatus(recordId, 'completed');
};

/**
 * Delete record
 */
export const deleteRecord = async (recordId) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const index = mockRecords.findIndex(r => r._id === recordId);
  
  if (index === -1) {
    throw new Error('Record not found');
  }
  
  const deletedRecord = mockRecords.splice(index, 1)[0];
  
  console.log('✅ [Mock] Record deleted:', deletedRecord.recordCode);
  
  return {
    success: true,
    message: 'Record deleted successfully',
    data: deletedRecord
  };
};

/**
 * Get record statistics
 */
export const getRecordStatistics = async (params = {}) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredRecords = [...mockRecords];
  
  // Filter by date range
  if (params.startDate) {
    const startDate = new Date(params.startDate);
    filteredRecords = filteredRecords.filter(r => new Date(r.date) >= startDate);
  }
  if (params.endDate) {
    const endDate = new Date(params.endDate);
    filteredRecords = filteredRecords.filter(r => new Date(r.date) <= endDate);
  }
  
  // Calculate statistics
  const totalRecords = filteredRecords.length;
  const examRecords = filteredRecords.filter(r => r.type === 'exam');
  const treatmentRecords = filteredRecords.filter(r => r.type === 'treatment');
  
  const completedRecords = filteredRecords.filter(r => r.status === 'completed');
  const pendingRecords = filteredRecords.filter(r => r.status === 'pending');
  const inProgressRecords = filteredRecords.filter(r => r.status === 'in_progress');
  
  const paidRecords = filteredRecords.filter(r => r.paymentStatus === 'paid');
  const unpaidRecords = filteredRecords.filter(r => r.paymentStatus === 'unpaid');
  
  const totalRevenue = filteredRecords
    .filter(r => r.paymentStatus === 'paid')
    .reduce((sum, r) => sum + r.totalCost, 0);
  
  return {
    success: true,
    data: {
      totalRecords,
      examRecords: {
        count: examRecords.length,
        percentage: totalRecords > 0 ? (examRecords.length / totalRecords * 100).toFixed(1) : 0
      },
      treatmentRecords: {
        count: treatmentRecords.length,
        percentage: totalRecords > 0 ? (treatmentRecords.length / totalRecords * 100).toFixed(1) : 0
      },
      statusBreakdown: {
        completed: completedRecords.length,
        pending: pendingRecords.length,
        inProgress: inProgressRecords.length
      },
      paymentBreakdown: {
        paid: paidRecords.length,
        unpaid: unpaidRecords.length
      },
      totalRevenue
    }
  };
};

export default {
  getAllRecords,
  getRecordById,
  getRecordByCode,
  getRecordsByPatient,
  getRecordsByDentist,
  getPendingRecords,
  createRecord,
  updateRecord,
  updateRecordStatus,
  addPrescription,
  updateTreatmentIndication,
  completeRecord,
  deleteRecord,
  getRecordStatistics
};

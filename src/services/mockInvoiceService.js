/**
 * Mock Invoice Service
 * Simulates invoice-service APIs for frontend development
 * 
 * Features:
 * - CRUD operations for invoices
 * - Invoice detail management
 * - Payment tracking
 * - Statistics and reporting
 * - Search and filtering
 */

import { message } from 'antd';

// Mock database
let mockInvoices = [
  {
    _id: 'inv_001',
    invoiceNumber: 'INV20250117001',
    type: 'appointment',
    status: 'paid',
    patientId: 'pat_001',
    appointmentId: 'app_001',
    recordId: 'rec_001',
    patientInfo: {
      name: 'Nguyễn Văn A',
      phone: '0901234567',
      email: 'nguyenvana@gmail.com',
      address: '123 Nguyễn Huệ, Q1, TP.HCM',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'male',
      identityNumber: '079090001234'
    },
    dentistInfo: {
      name: 'BS. Trần Văn B',
      specialization: 'Phục hồi răng',
      licenseNumber: 'BYT-123456'
    },
    issueDate: new Date('2025-01-15'),
    dueDate: new Date('2025-01-22'),
    paidDate: new Date('2025-01-15'),
    subtotal: 1500000,
    discountInfo: {
      type: 'percentage',
      value: 10,
      reason: 'Khách hàng thân thiết',
      approvedBy: 'user_001'
    },
    taxInfo: {
      taxRate: 10,
      taxAmount: 135000,
      taxIncluded: true
    },
    totalAmount: 1485000,
    paymentSummary: {
      totalPaid: 1485000,
      remainingAmount: 0,
      lastPaymentDate: new Date('2025-01-15'),
      paymentMethod: 'cash',
      paymentIds: ['pay_001']
    },
    details: [
      {
        _id: 'detail_001',
        serviceId: 'ser_001',
        serviceInfo: {
          name: 'Khám tổng quát',
          code: 'KTQ001',
          type: 'examination',
          category: 'preventive',
          description: 'Khám răng miệng tổng quát'
        },
        unitPrice: 200000,
        quantity: 1,
        subtotal: 200000,
        discountAmount: 0,
        totalPrice: 200000,
        status: 'completed',
        completedDate: new Date('2025-01-15')
      },
      {
        _id: 'detail_002',
        serviceId: 'ser_002',
        serviceInfo: {
          name: 'Hàn răng',
          code: 'HR001',
          type: 'filling',
          category: 'restorative',
          description: 'Hàn răng sâu composite'
        },
        toothInfo: {
          toothNumber: '16',
          surface: 'occlusal',
          position: 'upper_right'
        },
        unitPrice: 650000,
        quantity: 2,
        subtotal: 1300000,
        discountAmount: 0,
        totalPrice: 1300000,
        status: 'completed',
        completedDate: new Date('2025-01-15')
      }
    ],
    description: 'Khám và hàn răng',
    notes: 'Đã thanh toán đầy đủ bằng tiền mặt',
    createdBy: 'user_001',
    createdByRole: 'receptionist',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
    isActive: true
  },
  {
    _id: 'inv_002',
    invoiceNumber: 'INV20250117002',
    type: 'treatment',
    status: 'partial_paid',
    patientId: 'pat_002',
    appointmentId: 'app_002',
    patientInfo: {
      name: 'Trần Thị B',
      phone: '0912345678',
      email: 'tranthib@gmail.com',
      address: '456 Lê Lợi, Q3, TP.HCM',
      dateOfBirth: new Date('1985-08-20'),
      gender: 'female'
    },
    dentistInfo: {
      name: 'BS. Lê Văn C',
      specialization: 'Chỉnh nha',
      licenseNumber: 'BYT-789012'
    },
    issueDate: new Date('2025-01-16'),
    dueDate: new Date('2025-01-30'),
    subtotal: 15000000,
    discountInfo: {
      type: 'fixed_amount',
      value: 500000,
      reason: 'Chương trình khuyến mãi tháng 1',
      approvedBy: 'user_001'
    },
    taxInfo: {
      taxRate: 10,
      taxAmount: 1450000,
      taxIncluded: true
    },
    totalAmount: 14500000,
    paymentSummary: {
      totalPaid: 5000000,
      remainingAmount: 9500000,
      lastPaymentDate: new Date('2025-01-16'),
      paymentMethod: 'bank_transfer',
      paymentIds: ['pay_002']
    },
    details: [
      {
        _id: 'detail_003',
        serviceId: 'ser_003',
        serviceInfo: {
          name: 'Niềng răng mắc cài kim loại',
          code: 'NR001',
          type: 'orthodontic',
          category: 'orthodontic',
          description: 'Niềng răng toàn hàm bằng mắc cài kim loại'
        },
        unitPrice: 15000000,
        quantity: 1,
        subtotal: 15000000,
        discountAmount: 500000,
        totalPrice: 14500000,
        status: 'in_progress',
        description: 'Giai đoạn 1: Lắp mắc cài'
      }
    ],
    description: 'Niềng răng toàn hàm - Đợt 1',
    notes: 'Thanh toán trước 5 triệu, còn nợ 9.5 triệu',
    internalNotes: 'Khách hàng yêu cầu chia làm 3 đợt thanh toán',
    createdBy: 'user_001',
    createdByRole: 'dentist',
    createdAt: new Date('2025-01-16'),
    updatedAt: new Date('2025-01-16'),
    isActive: true
  },
  {
    _id: 'inv_003',
    invoiceNumber: 'INV20250117003',
    type: 'checkup',
    status: 'pending',
    patientId: 'pat_003',
    appointmentId: 'app_003',
    patientInfo: {
      name: 'Phạm Văn D',
      phone: '0923456789',
      email: 'phamvand@gmail.com',
      address: '789 Trần Hưng Đạo, Q5, TP.HCM',
      dateOfBirth: new Date('2000-03-10'),
      gender: 'male'
    },
    dentistInfo: {
      name: 'BS. Nguyễn Thị E',
      specialization: 'Nha khoa tổng quát',
      licenseNumber: 'BYT-345678'
    },
    issueDate: new Date('2025-01-17'),
    dueDate: new Date('2025-01-24'),
    subtotal: 500000,
    discountInfo: {
      type: 'none',
      value: 0
    },
    taxInfo: {
      taxRate: 10,
      taxAmount: 50000,
      taxIncluded: true
    },
    totalAmount: 500000,
    paymentSummary: {
      totalPaid: 0,
      remainingAmount: 500000,
      paymentIds: []
    },
    details: [
      {
        _id: 'detail_004',
        serviceId: 'ser_004',
        serviceInfo: {
          name: 'Vệ sinh răng miệng',
          code: 'VSR001',
          type: 'cleaning',
          category: 'preventive',
          description: 'Vệ sinh răng miệng và đánh bóng răng'
        },
        unitPrice: 300000,
        quantity: 1,
        subtotal: 300000,
        discountAmount: 0,
        totalPrice: 300000,
        status: 'completed',
        completedDate: new Date('2025-01-17')
      },
      {
        _id: 'detail_005',
        serviceId: 'ser_005',
        serviceInfo: {
          name: 'Chụp X-quang răng',
          code: 'XQ001',
          type: 'xray',
          category: 'diagnostic',
          description: 'Chụp X-quang toàn cảnh'
        },
        unitPrice: 200000,
        quantity: 1,
        subtotal: 200000,
        discountAmount: 0,
        totalPrice: 200000,
        status: 'completed',
        completedDate: new Date('2025-01-17')
      }
    ],
    description: 'Kiểm tra định kỳ và vệ sinh răng',
    createdBy: 'user_002',
    createdByRole: 'receptionist',
    createdAt: new Date('2025-01-17'),
    updatedAt: new Date('2025-01-17'),
    isActive: true
  }
];

let invoiceCounter = 4;
let detailCounter = 6;

// Helper: Generate invoice number
const generateInvoiceNumber = () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const sequence = String(invoiceCounter).padStart(3, '0');
  return `INV${dateStr}${sequence}`;
};

// Helper: Calculate amounts
const calculateAmounts = (details, discountInfo, taxInfo) => {
  const subtotal = details.reduce((sum, item) => sum + item.totalPrice, 0);
  
  let discountAmount = 0;
  if (discountInfo.type === 'percentage') {
    discountAmount = (subtotal * discountInfo.value) / 100;
  } else if (discountInfo.type === 'fixed_amount') {
    discountAmount = discountInfo.value;
  }
  
  const afterDiscount = subtotal - discountAmount;
  
  let taxAmount = 0;
  if (!taxInfo.taxIncluded) {
    taxAmount = (afterDiscount * taxInfo.taxRate) / 100;
  }
  
  const totalAmount = afterDiscount + taxAmount;
  
  return {
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount
  };
};

// Helper: Delay simulation
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get all invoices with filters and pagination
 */
export const getAllInvoices = async (params = {}) => {
  await delay();
  
  try {
    let filtered = [...mockInvoices];
    
    // Filter by status
    if (params.status) {
      filtered = filtered.filter(inv => inv.status === params.status);
    }
    
    // Filter by type
    if (params.type) {
      filtered = filtered.filter(inv => inv.type === params.type);
    }
    
    // Filter by patient
    if (params.patientId) {
      filtered = filtered.filter(inv => inv.patientId === params.patientId);
    }
    
    // Filter by date range
    if (params.startDate) {
      const start = new Date(params.startDate);
      filtered = filtered.filter(inv => new Date(inv.issueDate) >= start);
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      filtered = filtered.filter(inv => new Date(inv.issueDate) <= end);
    }
    
    // Search by keyword (invoice number, patient name, phone)
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      filtered = filtered.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(keyword) ||
        inv.patientInfo.name.toLowerCase().includes(keyword) ||
        inv.patientInfo.phone.includes(keyword)
      );
    }
    
    // Sort by issue date (newest first)
    filtered.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
    
    // Pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filtered.slice(startIndex, endIndex);
    
    return {
      success: true,
      data: {
        invoices: paginatedData,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(filtered.length / limit),
          totalItems: filtered.length,
          itemsPerPage: limit
        }
      }
    };
  } catch (error) {
    console.error('Error getting invoices:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get invoice by ID
 */
export const getInvoiceById = async (invoiceId) => {
  await delay();
  
  try {
    const invoice = mockInvoices.find(inv => inv._id === invoiceId);
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    return {
      success: true,
      data: invoice
    };
  } catch (error) {
    console.error('Error getting invoice:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create new invoice
 */
export const createInvoice = async (invoiceData) => {
  await delay();
  
  try {
    // Validation
    if (!invoiceData.patientInfo || !invoiceData.patientInfo.name) {
      throw new Error('Patient information is required');
    }
    if (!invoiceData.dentistInfo || !invoiceData.dentistInfo.name) {
      throw new Error('Dentist information is required');
    }
    if (!invoiceData.details || invoiceData.details.length === 0) {
      throw new Error('At least one service is required');
    }
    
    // Calculate amounts
    const amounts = calculateAmounts(
      invoiceData.details,
      invoiceData.discountInfo || { type: 'none', value: 0 },
      invoiceData.taxInfo || { taxRate: 10, taxIncluded: true }
    );
    
    const newInvoice = {
      _id: `inv_${String(invoiceCounter).padStart(3, '0')}`,
      invoiceNumber: generateInvoiceNumber(),
      type: invoiceData.type || 'appointment',
      status: invoiceData.status || 'draft',
      patientId: invoiceData.patientId,
      appointmentId: invoiceData.appointmentId || null,
      recordId: invoiceData.recordId || null,
      patientInfo: invoiceData.patientInfo,
      dentistInfo: invoiceData.dentistInfo,
      issueDate: invoiceData.issueDate || new Date(),
      dueDate: invoiceData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      subtotal: amounts.subtotal,
      discountInfo: invoiceData.discountInfo || { type: 'none', value: 0 },
      taxInfo: {
        taxRate: invoiceData.taxInfo?.taxRate || 10,
        taxAmount: amounts.taxAmount,
        taxIncluded: invoiceData.taxInfo?.taxIncluded !== false
      },
      totalAmount: amounts.totalAmount,
      paymentSummary: {
        totalPaid: 0,
        remainingAmount: amounts.totalAmount,
        paymentIds: []
      },
      details: invoiceData.details.map((detail, index) => ({
        _id: `detail_${String(detailCounter + index).padStart(3, '0')}`,
        ...detail,
        subtotal: detail.unitPrice * detail.quantity,
        totalPrice: detail.unitPrice * detail.quantity - (detail.discountAmount || 0)
      })),
      description: invoiceData.description || '',
      notes: invoiceData.notes || '',
      internalNotes: invoiceData.internalNotes || '',
      createdBy: invoiceData.createdBy || 'user_001',
      createdByRole: invoiceData.createdByRole || 'receptionist',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    
    mockInvoices.push(newInvoice);
    invoiceCounter++;
    detailCounter += invoiceData.details.length;
    
    message.success('Tạo hóa đơn thành công!');
    
    return {
      success: true,
      data: newInvoice
    };
  } catch (error) {
    console.error('Error creating invoice:', error);
    message.error(error.message || 'Tạo hóa đơn thất bại');
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update invoice
 */
export const updateInvoice = async (invoiceId, updateData) => {
  await delay();
  
  try {
    const index = mockInvoices.findIndex(inv => inv._id === invoiceId);
    
    if (index === -1) {
      throw new Error('Invoice not found');
    }
    
    const invoice = mockInvoices[index];
    
    // Cannot edit paid/cancelled invoices
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      throw new Error('Cannot edit paid or cancelled invoices');
    }
    
    // Recalculate if details changed
    if (updateData.details) {
      const amounts = calculateAmounts(
        updateData.details,
        updateData.discountInfo || invoice.discountInfo,
        updateData.taxInfo || invoice.taxInfo
      );
      
      updateData.subtotal = amounts.subtotal;
      updateData.totalAmount = amounts.totalAmount;
      updateData.taxInfo = {
        ...invoice.taxInfo,
        ...updateData.taxInfo,
        taxAmount: amounts.taxAmount
      };
      updateData.paymentSummary = {
        ...invoice.paymentSummary,
        remainingAmount: amounts.totalAmount - invoice.paymentSummary.totalPaid
      };
    }
    
    mockInvoices[index] = {
      ...invoice,
      ...updateData,
      updatedAt: new Date()
    };
    
    message.success('Cập nhật hóa đơn thành công!');
    
    return {
      success: true,
      data: mockInvoices[index]
    };
  } catch (error) {
    console.error('Error updating invoice:', error);
    message.error(error.message || 'Cập nhật hóa đơn thất bại');
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete invoice
 */
export const deleteInvoice = async (invoiceId) => {
  await delay();
  
  try {
    const index = mockInvoices.findIndex(inv => inv._id === invoiceId);
    
    if (index === -1) {
      throw new Error('Invoice not found');
    }
    
    const invoice = mockInvoices[index];
    
    // Cannot delete paid invoices
    if (invoice.status === 'paid' || invoice.paymentSummary.totalPaid > 0) {
      throw new Error('Cannot delete invoices with payments');
    }
    
    mockInvoices.splice(index, 1);
    
    message.success('Xóa hóa đơn thành công!');
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting invoice:', error);
    message.error(error.message || 'Xóa hóa đơn thất bại');
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Cancel invoice
 */
export const cancelInvoice = async (invoiceId, cancelData) => {
  await delay();
  
  try {
    const index = mockInvoices.findIndex(inv => inv._id === invoiceId);
    
    if (index === -1) {
      throw new Error('Invoice not found');
    }
    
    const invoice = mockInvoices[index];
    
    if (invoice.status === 'cancelled') {
      throw new Error('Invoice already cancelled');
    }
    
    if (invoice.status === 'paid') {
      throw new Error('Cannot cancel paid invoice. Please process refund first.');
    }
    
    mockInvoices[index] = {
      ...invoice,
      status: 'cancelled',
      cancelReason: cancelData.reason,
      cancelledBy: cancelData.cancelledBy,
      cancelledAt: new Date(),
      updatedAt: new Date()
    };
    
    message.success('Hủy hóa đơn thành công!');
    
    return {
      success: true,
      data: mockInvoices[index]
    };
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    message.error(error.message || 'Hủy hóa đơn thất bại');
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Record payment for invoice
 */
export const recordPayment = async (invoiceId, paymentData) => {
  await delay();
  
  try {
    const index = mockInvoices.findIndex(inv => inv._id === invoiceId);
    
    if (index === -1) {
      throw new Error('Invoice not found');
    }
    
    const invoice = mockInvoices[index];
    
    if (invoice.status === 'cancelled') {
      throw new Error('Cannot record payment for cancelled invoice');
    }
    
    if (invoice.status === 'paid') {
      throw new Error('Invoice already fully paid');
    }
    
    const newTotalPaid = invoice.paymentSummary.totalPaid + paymentData.amount;
    const remainingAmount = invoice.totalAmount - newTotalPaid;
    
    let newStatus = invoice.status;
    if (remainingAmount <= 0) {
      newStatus = 'paid';
    } else if (newTotalPaid > 0) {
      newStatus = 'partial_paid';
    }
    
    mockInvoices[index] = {
      ...invoice,
      status: newStatus,
      paidDate: remainingAmount <= 0 ? new Date() : invoice.paidDate,
      paymentSummary: {
        totalPaid: newTotalPaid,
        remainingAmount: Math.max(0, remainingAmount),
        lastPaymentDate: new Date(),
        paymentMethod: paymentData.method,
        paymentIds: [...invoice.paymentSummary.paymentIds, paymentData.paymentId]
      },
      updatedAt: new Date()
    };
    
    message.success('Ghi nhận thanh toán thành công!');
    
    return {
      success: true,
      data: mockInvoices[index]
    };
  } catch (error) {
    console.error('Error recording payment:', error);
    message.error(error.message || 'Ghi nhận thanh toán thất bại');
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get invoice statistics
 */
export const getInvoiceStatistics = async (params = {}) => {
  await delay();
  
  try {
    let filtered = [...mockInvoices];
    
    // Filter by date range
    if (params.startDate) {
      const start = new Date(params.startDate);
      filtered = filtered.filter(inv => new Date(inv.issueDate) >= start);
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      filtered = filtered.filter(inv => new Date(inv.issueDate) <= end);
    }
    
    const statistics = {
      totalInvoices: filtered.length,
      totalRevenue: filtered.reduce((sum, inv) => sum + inv.totalAmount, 0),
      totalPaid: filtered.reduce((sum, inv) => sum + inv.paymentSummary.totalPaid, 0),
      totalOutstanding: filtered.reduce((sum, inv) => sum + inv.paymentSummary.remainingAmount, 0),
      byStatus: {
        draft: filtered.filter(inv => inv.status === 'draft').length,
        pending: filtered.filter(inv => inv.status === 'pending').length,
        partial_paid: filtered.filter(inv => inv.status === 'partial_paid').length,
        paid: filtered.filter(inv => inv.status === 'paid').length,
        overdue: filtered.filter(inv => inv.status === 'overdue').length,
        cancelled: filtered.filter(inv => inv.status === 'cancelled').length
      },
      byType: {
        appointment: filtered.filter(inv => inv.type === 'appointment').length,
        treatment: filtered.filter(inv => inv.type === 'treatment').length,
        consultation: filtered.filter(inv => inv.type === 'consultation').length,
        emergency: filtered.filter(inv => inv.type === 'emergency').length,
        checkup: filtered.filter(inv => inv.type === 'checkup').length
      },
      avgInvoiceAmount: filtered.length > 0 
        ? filtered.reduce((sum, inv) => sum + inv.totalAmount, 0) / filtered.length 
        : 0,
      paymentRate: filtered.length > 0
        ? (filtered.filter(inv => inv.status === 'paid').length / filtered.length) * 100
        : 0
    };
    
    return {
      success: true,
      data: statistics
    };
  } catch (error) {
    console.error('Error getting statistics:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get overdue invoices
 */
export const getOverdueInvoices = async () => {
  await delay();
  
  try {
    const now = new Date();
    const overdueInvoices = mockInvoices.filter(inv => 
      inv.status !== 'paid' &&
      inv.status !== 'cancelled' &&
      new Date(inv.dueDate) < now
    );
    
    // Update status to overdue
    overdueInvoices.forEach(inv => {
      const index = mockInvoices.findIndex(i => i._id === inv._id);
      if (index !== -1 && mockInvoices[index].status !== 'overdue') {
        mockInvoices[index].status = 'overdue';
      }
    });
    
    return {
      success: true,
      data: overdueInvoices
    };
  } catch (error) {
    console.error('Error getting overdue invoices:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send invoice reminder
 */
export const sendInvoiceReminder = async (invoiceId) => {
  await delay();
  
  try {
    const invoice = mockInvoices.find(inv => inv._id === invoiceId);
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      throw new Error('Cannot send reminder for paid or cancelled invoice');
    }
    
    // Mock sending email/SMS
    console.log(`📧 Sending reminder for invoice ${invoice.invoiceNumber} to ${invoice.patientInfo.email || invoice.patientInfo.phone}`);
    
    message.success('Đã gửi nhắc nhở thanh toán!');
    
    return {
      success: true,
      data: {
        sentAt: new Date(),
        recipientEmail: invoice.patientInfo.email,
        recipientPhone: invoice.patientInfo.phone
      }
    };
  } catch (error) {
    console.error('Error sending reminder:', error);
    message.error(error.message || 'Gửi nhắc nhở thất bại');
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Export invoice to PDF (mock)
 */
export const exportInvoiceToPDF = async (invoiceId) => {
  await delay();
  
  try {
    const invoice = mockInvoices.find(inv => inv._id === invoiceId);
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    // Mock PDF generation
    console.log(`📄 Generating PDF for invoice ${invoice.invoiceNumber}`);
    
    message.success('Đã tạo file PDF!');
    
    return {
      success: true,
      data: {
        pdfUrl: `/downloads/invoice_${invoice.invoiceNumber}.pdf`,
        generatedAt: new Date()
      }
    };
  } catch (error) {
    console.error('Error exporting PDF:', error);
    message.error(error.message || 'Xuất PDF thất bại');
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  cancelInvoice,
  recordPayment,
  getInvoiceStatistics,
  getOverdueInvoices,
  sendInvoiceReminder,
  exportInvoiceToPDF
};

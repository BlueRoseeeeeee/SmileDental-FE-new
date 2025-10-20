/**
 * Mock Payment Service - For testing Cash Payment flow
 * 
 * This service simulates payment-service API endpoints
 * to enable frontend development without backend dependency.
 */

import { message } from 'antd';

// Simulated database
let mockPayments = [
  {
    _id: 'pay_mock_001',
    paymentCode: 'PAY20250117001',
    appointmentId: 'apt_001',
    patientId: 'pat_001',
    patientInfo: {
      name: 'Nguyễn Văn A',
      phone: '0901234567',
      email: 'nguyenvana@email.com'
    },
    type: 'payment',
    method: 'cash',
    status: 'completed',
    originalAmount: 500000,
    discountAmount: 0,
    finalAmount: 500000,
    paidAmount: 500000,
    changeAmount: 0,
    processedBy: 'staff_001',
    processedByName: 'Admin User',
    processedAt: new Date('2025-01-17T08:30:00'),
    description: 'Thanh toán khám tổng quát',
    notes: '',
    createdAt: new Date('2025-01-17T08:30:00'),
    updatedAt: new Date('2025-01-17T08:30:00')
  }
];

let paymentCounter = 2; // Start from 002

/**
 * Generate payment code
 */
const generatePaymentCode = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const sequence = String(paymentCounter++).padStart(3, '0');
  
  return `PAY${year}${month}${day}${sequence}`;
};

/**
 * Create cash payment
 * 
 * @param {Object} paymentData 
 * @param {String} paymentData.appointmentId - Appointment ID
 * @param {Object} paymentData.patientInfo - Patient information
 * @param {Number} paymentData.amount - Total amount to pay
 * @param {Number} paymentData.paidAmount - Amount paid by customer
 * @param {Number} paymentData.changeAmount - Change to return
 * @param {String} paymentData.processedBy - Staff ID who processed payment
 * @param {String} paymentData.processedByName - Staff name
 * @param {String} paymentData.description - Payment description
 * @param {String} paymentData.notes - Additional notes
 * @returns {Promise<Object>}
 */
export const createCashPayment = async (paymentData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Validate required fields
  if (!paymentData.appointmentId) {
    throw new Error('Appointment ID is required');
  }
  if (!paymentData.amount || paymentData.amount <= 0) {
    throw new Error('Invalid payment amount');
  }
  if (!paymentData.paidAmount || paymentData.paidAmount < paymentData.amount) {
    throw new Error('Paid amount must be greater than or equal to total amount');
  }
  
  // Calculate change
  const changeAmount = paymentData.paidAmount - paymentData.amount;
  
  // Create payment record
  const newPayment = {
    _id: `pay_mock_${Date.now()}`,
    paymentCode: generatePaymentCode(),
    appointmentId: paymentData.appointmentId,
    patientId: paymentData.patientId || 'unknown',
    patientInfo: paymentData.patientInfo || {},
    type: 'payment',
    method: 'cash',
    status: 'completed',
    originalAmount: paymentData.amount,
    discountAmount: paymentData.discountAmount || 0,
    finalAmount: paymentData.amount,
    paidAmount: paymentData.paidAmount,
    changeAmount: changeAmount,
    processedBy: paymentData.processedBy || 'staff_unknown',
    processedByName: paymentData.processedByName || 'Unknown Staff',
    processedAt: new Date(),
    description: paymentData.description || 'Thanh toán tiền mặt',
    notes: paymentData.notes || '',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Add to mock database
  mockPayments.push(newPayment);
  
  console.log('✅ [Mock] Cash payment created:', newPayment);
  
  return {
    success: true,
    message: 'Payment completed successfully',
    data: newPayment
  };
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (paymentId) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const payment = mockPayments.find(p => p._id === paymentId);
  
  if (!payment) {
    throw new Error('Payment not found');
  }
  
  return {
    success: true,
    data: payment
  };
};

/**
 * Get payment by appointment ID
 */
export const getPaymentByAppointment = async (appointmentId) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const payment = mockPayments.find(p => p.appointmentId === appointmentId);
  
  return {
    success: true,
    data: payment || null
  };
};

/**
 * Get all payments with filters
 */
export const getAllPayments = async (params = {}) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredPayments = [...mockPayments];
  
  // Filter by status
  if (params.status) {
    filteredPayments = filteredPayments.filter(p => p.status === params.status);
  }
  
  // Filter by method
  if (params.method) {
    filteredPayments = filteredPayments.filter(p => p.method === params.method);
  }
  
  // Filter by date range
  if (params.startDate) {
    const startDate = new Date(params.startDate);
    filteredPayments = filteredPayments.filter(p => new Date(p.createdAt) >= startDate);
  }
  if (params.endDate) {
    const endDate = new Date(params.endDate);
    filteredPayments = filteredPayments.filter(p => new Date(p.createdAt) <= endDate);
  }
  
  // Pagination
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);
  
  return {
    success: true,
    data: {
      payments: paginatedPayments,
      pagination: {
        total: filteredPayments.length,
        page: page,
        limit: limit,
        pages: Math.ceil(filteredPayments.length / limit)
      }
    }
  };
};

/**
 * Create deposit payment
 */
export const createDepositPayment = async (depositData) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const newPayment = {
    _id: `pay_mock_${Date.now()}`,
    paymentCode: generatePaymentCode(),
    appointmentId: depositData.appointmentId,
    patientId: depositData.patientId,
    patientInfo: depositData.patientInfo || {},
    type: 'deposit',
    method: depositData.method || 'cash',
    status: 'completed',
    originalAmount: depositData.amount,
    discountAmount: 0,
    finalAmount: depositData.amount,
    paidAmount: depositData.amount,
    changeAmount: 0,
    processedBy: depositData.processedBy || 'staff_unknown',
    processedByName: depositData.processedByName || 'Unknown Staff',
    processedAt: new Date(),
    description: depositData.description || 'Thanh toán đặt cọc',
    notes: depositData.notes || '',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  mockPayments.push(newPayment);
  
  console.log('✅ [Mock] Deposit payment created:', newPayment);
  
  return {
    success: true,
    message: 'Deposit payment completed successfully',
    data: newPayment
  };
};

/**
 * Print payment receipt
 */
export const printReceipt = (payment) => {
  console.log('🖨️  [Mock] Printing receipt for payment:', payment.paymentCode);
  
  const receiptContent = `
    ========================================
    PHÒNG KHÁM NHA KHOA SMILE DENTAL
    ========================================
    
    Mã thanh toán: ${payment.paymentCode}
    Ngày thanh toán: ${new Date(payment.processedAt).toLocaleString('vi-VN')}
    
    Khách hàng: ${payment.patientInfo?.name || 'N/A'}
    Số điện thoại: ${payment.patientInfo?.phone || 'N/A'}
    
    ----------------------------------------
    Chi tiết thanh toán
    ----------------------------------------
    Tổng tiền: ${payment.finalAmount.toLocaleString('vi-VN')} đ
    Tiền khách đưa: ${payment.paidAmount.toLocaleString('vi-VN')} đ
    Tiền thừa: ${payment.changeAmount.toLocaleString('vi-VN')} đ
    
    Phương thức: ${payment.method === 'cash' ? 'Tiền mặt' : payment.method.toUpperCase()}
    Trạng thái: ${payment.status === 'completed' ? 'Đã thanh toán' : payment.status}
    
    ----------------------------------------
    Người thu: ${payment.processedByName}
    Ghi chú: ${payment.notes || 'Không có'}
    
    ========================================
    Cảm ơn quý khách!
    ========================================
  `;
  
  // In production, this would trigger actual print
  message.success('Đã in phiếu thu thành công');
  
  return receiptContent;
};

/**
 * Get payment statistics
 */
export const getPaymentStatistics = async (params = {}) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredPayments = [...mockPayments];
  
  // Filter by date range
  if (params.startDate) {
    const startDate = new Date(params.startDate);
    filteredPayments = filteredPayments.filter(p => new Date(p.createdAt) >= startDate);
  }
  if (params.endDate) {
    const endDate = new Date(params.endDate);
    filteredPayments = filteredPayments.filter(p => new Date(p.createdAt) <= endDate);
  }
  
  // Calculate statistics
  const totalPayments = filteredPayments.length;
  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.finalAmount, 0);
  
  const cashPayments = filteredPayments.filter(p => p.method === 'cash');
  const onlinePayments = filteredPayments.filter(p => p.method !== 'cash');
  
  const completedPayments = filteredPayments.filter(p => p.status === 'completed');
  const pendingPayments = filteredPayments.filter(p => p.status === 'pending');
  
  return {
    success: true,
    data: {
      totalPayments,
      totalAmount,
      cashPayments: {
        count: cashPayments.length,
        amount: cashPayments.reduce((sum, p) => sum + p.finalAmount, 0)
      },
      onlinePayments: {
        count: onlinePayments.length,
        amount: onlinePayments.reduce((sum, p) => sum + p.finalAmount, 0)
      },
      completedPayments: {
        count: completedPayments.length,
        amount: completedPayments.reduce((sum, p) => sum + p.finalAmount, 0)
      },
      pendingPayments: {
        count: pendingPayments.length,
        amount: pendingPayments.reduce((sum, p) => sum + p.finalAmount, 0)
      }
    }
  };
};

export default {
  createCashPayment,
  getPaymentById,
  getPaymentByAppointment,
  getAllPayments,
  createDepositPayment,
  printReceipt,
  getPaymentStatistics
};

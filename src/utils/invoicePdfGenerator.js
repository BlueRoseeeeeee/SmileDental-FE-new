import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

// Function để bỏ dấu tiếng Việt
const removeVietnameseTones = (str) => {
  if (!str) return str;
  
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  str = str.replace(/đ/g, 'd').replace(/Đ/g, 'D');
  
  // Thay thế các ký tự đặc biệt
  str = str.replace(/₫/g, 'd');
  str = str.replace(/«/g, '');
  str = str.replace(/»/g, '');
  
  return str;
};

const formatCurrency = (amount) => {
  const formatted = new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
  
  return formatted + ' d';
};

const getStatusText = (status) => {
  const texts = {
    draft: 'Nhap',
    pending: 'Cho thanh toan',
    partial_paid: 'Thanh toan 1 phan',
    paid: 'Da thanh toan',
    overdue: 'Qua han',
    cancelled: 'Da huy',
    refunded: 'Da hoan tien'
  };
  return texts[status] || removeVietnameseTones(status);
};

const getTypeText = (type) => {
  const texts = {
    appointment: 'Cuoc hen',
    treatment: 'Dieu tri',
    consultation: 'Tu van',
    emergency: 'Cap cuu',
    checkup: 'Kiem tra'
  };
  return texts[type] || removeVietnameseTones(type);
};

const getPaymentMethodText = (method) => {
  const texts = {
    cash: 'Tien mat',
    vnpay: 'VNPay',
    stripe: 'Stripe',
    bank_transfer: 'Chuyen khoan'
  };
  return texts[method] || removeVietnameseTones(method);
};

export const generateInvoicePDF = (invoice) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Sử dụng font courier vì hỗ trợ Unicode tốt hơn helvetica
  doc.setFont('courier', 'normal');
  
  // Màu chủ đạo
  const primaryColor = [24, 144, 255];
  const darkColor = [0, 0, 0];
  const grayColor = [128, 128, 128];
  
  let yPos = 20;
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('SMILE DENTAL', 105, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.setFont('helvetica', 'normal');
  doc.text('Phong kham Nha khoa Smile Dental', 105, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text('Dia chi: 123 Duong ABC, Quan 1, TP.HCM', 105, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text('Dien thoai: (028) 1234 5678 | Email: info@smiledental.vn', 105, yPos, { align: 'center' });
  
  // Đường kẻ
  yPos += 8;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);
  
  // Tiêu đề
  yPos += 12;
  doc.setFontSize(18);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.text('HOA DON THANH TOAN', 105, yPos, { align: 'center' });
  
  // Thông tin hóa đơn
  yPos += 12;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('THONG TIN BENH NHAN:', 20, yPos);
  doc.text('THONG TIN HOA DON:', 120, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Ho ten: ${removeVietnameseTones(invoice.patientInfo?.name) || 'N/A'}`, 20, yPos);
  doc.text(`Ma HD: ${invoice.invoiceNumber}`, 120, yPos);
  
  yPos += 6;
  doc.text(`Dien thoai: ${invoice.patientInfo?.phone || 'N/A'}`, 20, yPos);
  doc.text(`Ngay tao: ${dayjs(invoice.issueDate).format('DD/MM/YYYY')}`, 120, yPos);
  
  yPos += 6;
  if (invoice.patientInfo?.address) {
    doc.text(`Dia chi: ${removeVietnameseTones(invoice.patientInfo.address)}`, 20, yPos);
  }
  doc.text(`Loai: ${getTypeText(invoice.type)}`, 120, yPos);
  
  yPos += 6;
  doc.text(`Trang thai: ${getStatusText(invoice.status)}`, 120, yPos);
  
  // Nha sĩ
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('NHA SI PHU TRACH:', 20, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Ho ten: ${removeVietnameseTones(invoice.dentistInfo?.name) || 'N/A'}`, 20, yPos);
  
  if (invoice.dentistInfo?.specialization) {
    yPos += 6;
    doc.text(`Chuyen khoa: ${removeVietnameseTones(invoice.dentistInfo.specialization)}`, 20, yPos);
  }
  
  // Bảng dịch vụ
  yPos += 12;
  
  const tableData = (invoice.details || []).map((detail, index) => [
    index + 1,
    removeVietnameseTones(detail.serviceInfo?.name) || 'N/A',
    removeVietnameseTones(detail.description || detail.serviceInfo?.description) || '',
    detail.quantity || 1,
    formatCurrency(detail.unitPrice || 0),
    formatCurrency(detail.discountAmount || 0),
    formatCurrency(detail.totalPrice || 0)
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['STT', 'Dich vu', 'Mo ta', 'SL', 'Don gia', 'Giam gia', 'Thanh tien']],
    body: tableData,
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 9
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      font: 'helvetica'
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 40 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' }
    }
  });
  
  // Tổng tiền
  yPos = doc.lastAutoTable.finalY + 10;
  const summaryX = 130;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Tong phu:', summaryX, yPos);
  doc.text(formatCurrency(invoice.subtotal || 0), 190, yPos, { align: 'right' });
  
  yPos += 6;
  if (invoice.discountInfo?.value > 0) {
    doc.text('Giam gia:', summaryX, yPos);
    doc.text(`-${formatCurrency(invoice.discountInfo.value)}`, 190, yPos, { align: 'right' });
    yPos += 6;
  }
  
  if (invoice.taxInfo?.taxAmount > 0) {
    doc.text(`Thue (${invoice.taxInfo.taxRate}%):`, summaryX, yPos);
    doc.text(formatCurrency(invoice.taxInfo.taxAmount), 190, yPos, { align: 'right' });
    yPos += 6;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TONG CONG:', summaryX, yPos);
  doc.text(formatCurrency(invoice.totalAmount || 0), 190, yPos, { align: 'right' });
  
  // Thông tin thanh toán
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('THONG TIN THANH TOAN:', 20, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Da thanh toan: ${formatCurrency(invoice.paymentSummary?.totalPaid || 0)}`, 20, yPos);
  
  yPos += 6;
  doc.text(`Con lai: ${formatCurrency(invoice.paymentSummary?.remainingAmount || 0)}`, 20, yPos);
  
  yPos += 6;
  if (invoice.paymentSummary?.lastPaymentDate) {
    doc.text(`Ngay TT: ${dayjs(invoice.paymentSummary.lastPaymentDate).format('DD/MM/YYYY HH:mm')}`, 20, yPos);
  }
  
  yPos += 6;
  if (invoice.paymentSummary?.paymentMethod) {
    doc.text(`Phuong thuc: ${getPaymentMethodText(invoice.paymentSummary.paymentMethod)}`, 20, yPos);
  }
  
  // Ghi chú
  if (invoice.notes) {
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('GHI CHU:', 20, yPos);
    
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    const notesText = removeVietnameseTones(invoice.notes);
    const notesLines = doc.splitTextToSize(notesText, 170);
    doc.text(notesLines, 20, yPos);
  }
  
  // Footer
  const footerY = 270;
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text('Cam on quy khach da su dung dich vu cua Smile Dental!', 105, footerY, { align: 'center' });
  doc.text(`In ngay: ${dayjs().format('DD/MM/YYYY HH:mm')}`, 105, footerY + 5, { align: 'center' });
  
  doc.setDrawColor(...grayColor);
  doc.setLineWidth(0.3);
  doc.line(20, footerY - 5, 190, footerY - 5);
  
  return doc;
};

export const downloadInvoicePDF = (invoice) => {
  const doc = generateInvoicePDF(invoice);
  doc.save(`HoaDon_${invoice.invoiceNumber}_${dayjs().format('YYYYMMDD')}.pdf`);
};

export const openInvoicePDFInNewTab = (invoice) => {
  const doc = generateInvoicePDF(invoice);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
  
  setTimeout(() => {
    URL.revokeObjectURL(pdfUrl);
  }, 60000);
};

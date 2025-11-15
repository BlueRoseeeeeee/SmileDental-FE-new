import React from 'react';
import { Typography } from 'antd';
import dayjs from 'dayjs';
import './InvoiceTemplate.css';

const { Title, Text } = Typography;

/**
 * InvoiceTemplate Component
 * Professional invoice template for printing/PDF export
 * 
 * Usage:
 * 1. Import component
 * 2. Render with invoice data
 * 3. Use window.print() or print library
 */

const InvoiceTemplate = ({ invoice }) => {
  if (!invoice) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const calculateDiscountAmount = () => {
    if (invoice.discountInfo.type === 'percentage') {
      return (invoice.subtotal * invoice.discountInfo.value) / 100;
    } else if (invoice.discountInfo.type === 'fixed_amount') {
      return invoice.discountInfo.value;
    }
    return 0;
  };

  const discountAmount = calculateDiscountAmount();
  const afterDiscount = invoice.subtotal - discountAmount;
  const finalTotal = afterDiscount + (invoice.taxInfo.taxIncluded ? 0 : invoice.taxInfo.taxAmount);

  return (
    <div className="invoice-template">
      {/* Header */}
      <div className="invoice-header">
        <div className="company-info">
          <div className="company-logo">
            <div className="logo-placeholder">🦷</div>
          </div>
          <div className="company-details">
            <Title level={2} className="company-name">Nha Khoa Smile Dental</Title>
            <div className="company-address">
              <p>123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
              <p>Điện thoại: (028) 3823 4567 | Email: info@smiledental.vn</p>
              <p>Website: www.smiledental.vn</p>
            </div>
          </div>
        </div>
        <div className="invoice-meta">
          <Title level={1} className="invoice-title">HÓA ĐƠN</Title>
          <div className="invoice-number">Số: {invoice.invoiceNumber}</div>
          <div className="invoice-date">Ngày: {dayjs(invoice.issueDate).format('DD/MM/YYYY')}</div>
        </div>
      </div>

      <div className="divider"></div>

      {/* Customer Information */}
      <div className="customer-section">
        <div className="section-row">
          <div className="section-col">
            <div className="info-label">Khách hàng:</div>
            <div className="info-value">{invoice.patientInfo.name}</div>
          </div>
          <div className="section-col">
            <div className="info-label">Số điện thoại:</div>
            <div className="info-value">{invoice.patientInfo.phone}</div>
          </div>
        </div>
        {invoice.patientInfo.email && (
          <div className="section-row">
            <div className="section-col">
              <div className="info-label">Email:</div>
              <div className="info-value">{invoice.patientInfo.email}</div>
            </div>
            {invoice.patientInfo.address && (
              <div className="section-col">
                <div className="info-label">Địa chỉ:</div>
                <div className="info-value">{invoice.patientInfo.address}</div>
              </div>
            )}
          </div>
        )}
        <div className="section-row">
          <div className="section-col">
            <div className="info-label">Bác sĩ điều trị:</div>
            <div className="info-value">{invoice.dentistInfo.name}</div>
          </div>
          <div className="section-col">
            <div className="info-label">Chuyên khoa:</div>
            <div className="info-value">{invoice.dentistInfo.specialization}</div>
          </div>
        </div>
      </div>

      <div className="divider"></div>

      {/* Service Items Table */}
      <div className="items-section">
        <table className="items-table">
          <thead>
            <tr>
              <th className="col-stt">STT</th>
              <th className="col-service">Dịch vụ</th>
              <th className="col-price">Đơn giá</th>
              <th className="col-qty">SL</th>
              <th className="col-discount">Giảm giá</th>
              <th className="col-total">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {invoice.details.map((item, index) => (
              <tr key={item._id}>
                <td className="col-stt">{index + 1}</td>
                <td className="col-service">
                  <div className="service-name">{item.serviceInfo.name}</div>
                  {item.serviceInfo.code && (
                    <div className="service-code">Mã: {item.serviceInfo.code}</div>
                  )}
                  {item.toothInfo && (
                    <div className="service-tooth">
                      Răng số {item.toothInfo.toothNumber}
                    </div>
                  )}
                  {item.description && (
                    <div className="service-desc">{item.description}</div>
                  )}
                </td>
                <td className="col-price text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="col-qty text-center">{item.quantity}</td>
                <td className="col-discount text-right">
                  {item.discountAmount > 0 ? formatCurrency(item.discountAmount) : '-'}
                </td>
                <td className="col-total text-right font-semibold">{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="summary-section">
        <div className="summary-row">
          <div className="summary-label">Tạm tính:</div>
          <div className="summary-value">{formatCurrency(invoice.subtotal)}</div>
        </div>

        {invoice.discountInfo.type !== 'none' && (
          <div className="summary-row">
            <div className="summary-label">
              Giảm giá {invoice.discountInfo.type === 'percentage' ? `(${invoice.discountInfo.value}%)` : ''}:
            </div>
            <div className="summary-value text-danger">-{formatCurrency(discountAmount)}</div>
          </div>
        )}

        {invoice.discountInfo.reason && (
          <div className="summary-row">
            <div className="summary-label-small">Lý do giảm giá:</div>
            <div className="summary-value-small">{invoice.discountInfo.reason}</div>
          </div>
        )}

        {!invoice.taxInfo.taxIncluded && invoice.taxInfo.taxAmount > 0 && (
          <div className="summary-row">
            <div className="summary-label">Thuế VAT ({invoice.taxInfo.taxRate}%):</div>
            <div className="summary-value">{formatCurrency(invoice.taxInfo.taxAmount)}</div>
          </div>
        )}

        {invoice.taxInfo.taxIncluded && (
          <div className="summary-row">
            <div className="summary-label-small">
              * Giá đã bao gồm thuế VAT {invoice.taxInfo.taxRate}%
            </div>
          </div>
        )}

        <div className="divider-thin"></div>

        <div className="summary-row summary-total">
          <div className="summary-label-total">TỔNG CỘNG:</div>
          <div className="summary-value-total">{formatCurrency(finalTotal)}</div>
        </div>

        {invoice.paymentSummary.totalPaid > 0 && (
          <>
            <div className="summary-row">
              <div className="summary-label">Đã thanh toán:</div>
              <div className="summary-value text-success">{formatCurrency(invoice.paymentSummary.totalPaid)}</div>
            </div>
            <div className="summary-row">
              <div className="summary-label">Còn nợ:</div>
              <div className="summary-value text-danger font-bold">
                {formatCurrency(invoice.paymentSummary.remainingAmount)}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment Information */}
      {invoice.paymentSummary.totalPaid > 0 && (
        <div className="payment-info">
          <div className="payment-row">
            <span>Phương thức thanh toán:</span>
            <span>
              {invoice.paymentSummary.paymentMethod === 'cash' ? 'Tiền mặt' :
               invoice.paymentSummary.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' :
               invoice.paymentSummary.paymentMethod === 'vnpay' ? 'VNPay' :
               invoice.paymentSummary.paymentMethod}
            </span>
          </div>
          {invoice.paymentSummary.lastPaymentDate && (
            <div className="payment-row">
              <span>Ngày thanh toán:</span>
              <span>{dayjs(invoice.paymentSummary.lastPaymentDate).format('DD/MM/YYYY HH:mm')}</span>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="notes-section">
          <div className="notes-label">Ghi chú:</div>
          <div className="notes-content">{invoice.notes}</div>
        </div>
      )}

      {/* Footer */}
      <div className="footer-section">
        <div className="footer-row">
          <div className="signature-box">
            <div className="signature-title">Người lập hóa đơn</div>
            <div className="signature-space"></div>
            <div className="signature-name">(Ký và ghi rõ họ tên)</div>
          </div>
          <div className="signature-box">
            <div className="signature-title">Khách hàng</div>
            <div className="signature-space"></div>
            <div className="signature-name">(Ký và ghi rõ họ tên)</div>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <div className="footer-text">
        <p>Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của Nha Khoa Smile Dental!</p>
        <p>Vui lòng liên hệ (028) 3823 4567 nếu có bất kỳ thắc mắc nào.</p>
      </div>

      {/* Print Info */}
      <div className="print-info">
        In lúc: {dayjs().format('DD/MM/YYYY HH:mm:ss')}
      </div>
    </div>
  );
};

export default InvoiceTemplate;

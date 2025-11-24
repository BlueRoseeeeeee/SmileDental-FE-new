import React, { useState } from 'react';
import { Modal, Button, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { FaMoneyBillWave, FaCreditCard, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import queueService from '../services/queueService';

const PaymentConfirmModal = ({ show, onHide, record, paymentData, onPaymentConfirmed }) => {
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  if (!paymentData) return null;

  const { payment, totalAmount, depositAmount, finalAmount } = paymentData;

  const handleCashPayment = async () => {
    if (!payment?._id) {
      toast.error('Không tìm thấy thông tin thanh toán');
      return;
    }

    setProcessing(true);

    try {
      const response = await queueService.confirmCashPayment(payment._id);

      if (response.success) {
        toast.success('✅ Xác nhận thanh toán tiền mặt thành công!');
        toast.info('📄 Hóa đơn đã được tạo tự động');
        
        // Callback to parent
        if (onPaymentConfirmed) {
          onPaymentConfirmed();
        }
        
        // Close modal
        onHide();
      }
    } catch (error) {
      console.error('Error confirming cash payment:', error);
      toast.error(error.response?.data?.message || 'Không thể xác nhận thanh toán');
    } finally {
      setProcessing(false);
    }
  };

  const handleVNPayPayment = async () => {
    toast.info('Đang chuyển hướng đến VNPay...');
    
    // Get payment URL from backend
    try {
      const response = await queueService.getVNPayPaymentUrl(payment._id);

      if (response.success && response.data.paymentUrl) {
        // Redirect to VNPay
        window.location.href = response.data.paymentUrl;
      }
    } catch (error) {
      console.error('Error getting VNPay URL:', error);
      toast.error('Không thể tạo liên kết thanh toán VNPay');
    }
  };

  const handleStripePayment = async () => {
    toast.info('Đang chuyển hướng đến Stripe...');
    
    // Get payment URL from backend
    try {
      const response = await queueService.getStripePaymentUrl(payment._id);

      if (response.success && response.data.paymentUrl) {
        // Redirect to Stripe
        window.location.href = response.data.paymentUrl;
      }
    } catch (error) {
      console.error('Error getting Stripe URL:', error);
      toast.error('Không thể tạo liên kết thanh toán Stripe');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FaCheckCircle className="me-2" />
          Xác Nhận Thanh Toán
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {/* Patient Info */}
        <Alert variant="info">
          <Row>
            <Col md={6}>
              <p className="mb-1">
                <strong>Bệnh nhân:</strong> {record?.patientInfo?.name}
              </p>
              <p className="mb-0">
                <strong>Điện thoại:</strong> {record?.patientInfo?.phone}
              </p>
            </Col>
            <Col md={6}>
              <p className="mb-1">
                <strong>Mã hồ sơ:</strong> {record?.recordCode}
              </p>
              <p className="mb-0">
                <strong>Ngày khám:</strong>{' '}
                {new Date(record?.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </Col>
          </Row>
        </Alert>

        {/* Payment Details */}
        <div className="p-3 bg-light rounded mb-3">
          <h5 className="mb-3">Chi Tiết Thanh Toán</h5>
          
          <Row className="mb-2">
            <Col xs={8}>
              <strong>Tổng tiền dịch vụ:</strong>
            </Col>
            <Col xs={4} className="text-end">
              {formatCurrency(totalAmount)}
            </Col>
          </Row>

          {depositAmount > 0 && (
            <>
              <Row className="mb-2 text-success">
                <Col xs={8}>
                  <strong>Đã đặt cọc (online):</strong>
                </Col>
                <Col xs={4} className="text-end">
                  - {formatCurrency(depositAmount)}
                </Col>
              </Row>
              <hr />
            </>
          )}

          <Row className="mb-0">
            <Col xs={8}>
              <h5 className="mb-0">
                <strong>Số tiền cần thanh toán:</strong>
              </h5>
            </Col>
            <Col xs={4} className="text-end">
              <h5 className="mb-0 text-primary">
                <strong>{formatCurrency(finalAmount)}</strong>
              </h5>
            </Col>
          </Row>

          {depositAmount > 0 && (
            <Alert variant="success" className="mt-3 mb-0">
              <small>
                ✓ Bệnh nhân đã đặt lịch online và thanh toán cọc{' '}
                {formatCurrency(depositAmount)}. Số tiền cần thu thêm là{' '}
                {formatCurrency(finalAmount)}.
              </small>
            </Alert>
          )}
        </div>

        {/* Payment Methods */}
        <h5 className="mb-3">Chọn Phương Thức Thanh Toán</h5>
        
        <Row>
          {/* Cash Payment */}
          <Col md={4} className="mb-3">
            <div
              className={`p-4 border rounded text-center h-100 ${
                selectedMethod === 'cash'
                  ? 'border-primary bg-primary bg-opacity-10'
                  : 'border-secondary'
              }`}
              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              onClick={() => setSelectedMethod('cash')}
            >
              <FaMoneyBillWave size={48} className="text-success mb-3" />
              <h5>Tiền Mặt</h5>
              <p className="text-muted mb-0">
                Thanh toán trực tiếp tại quầy
              </p>
              {selectedMethod === 'cash' && (
                <Badge bg="primary" className="mt-2">
                  Đã chọn
                </Badge>
              )}
            </div>
          </Col>

          {/* VNPay Payment */}
          <Col md={4} className="mb-3">
            <div
              className={`p-4 border rounded text-center h-100 ${
                selectedMethod === 'vnpay'
                  ? 'border-primary bg-primary bg-opacity-10'
                  : 'border-secondary'
              }`}
              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              onClick={() => setSelectedMethod('vnpay')}
            >
              <FaCreditCard size={48} className="text-primary mb-3" />
              <h5>VNPay</h5>
              <p className="text-muted mb-0">
                Thanh toán qua ví điện tử
              </p>
              {selectedMethod === 'vnpay' && (
                <Badge bg="primary" className="mt-2">
                  Đã chọn
                </Badge>
              )}
            </div>
          </Col>

          {/* Stripe Payment */}
          <Col md={4} className="mb-3">
            <div
              className={`p-4 border rounded text-center h-100 ${
                selectedMethod === 'stripe'
                  ? 'border-primary bg-primary bg-opacity-10'
                  : 'border-secondary'
              }`}
              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              onClick={() => setSelectedMethod('stripe')}
            >
              <FaCreditCard size={48} className="text-info mb-3" />
              <h5>Stripe</h5>
              <p className="text-muted mb-0">
                Thẻ quốc tế
              </p>
              {selectedMethod === 'stripe' && (
                <Badge bg="primary" className="mt-2">
                  Đã chọn
                </Badge>
              )}
            </div>
          </Col>
        </Row>

        {!selectedMethod && (
          <Alert variant="warning" className="mt-3">
            Vui lòng chọn phương thức thanh toán
          </Alert>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={processing}>
          Đóng
        </Button>
        
        {selectedMethod === 'cash' && (
          <Button
            variant="success"
            onClick={handleCashPayment}
            disabled={processing}
          >
            {processing ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  className="me-2"
                />
                Đang xử lý...
              </>
            ) : (
              <>
                <FaCheckCircle className="me-2" />
                Xác Nhận Thanh Toán Tiền Mặt
              </>
            )}
          </Button>
        )}
        
        {selectedMethod === 'vnpay' && (
          <Button
            variant="primary"
            onClick={handleVNPayPayment}
            disabled={processing}
          >
            <FaCreditCard className="me-2" />
            Chuyển Đến VNPay
          </Button>
        )}
        
        {selectedMethod === 'stripe' && (
          <Button
            variant="info"
            onClick={handleStripePayment}
            disabled={processing}
          >
            <FaCreditCard className="me-2" />
            Chuyển Đến Stripe
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default PaymentConfirmModal;

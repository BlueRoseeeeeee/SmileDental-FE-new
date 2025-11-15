/**
 * Payment Modal Component
 * Hiển thị chi tiết thanh toán và xử lý thanh toán tiền mặt/VNPay
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Button,
  InputNumber,
  Input,
  message,
  Spin,
  Tag,
  Card,
  Descriptions
} from 'antd';
import {
  DollarOutlined,
  CheckCircleOutlined,
  CreditCardOutlined,
  WalletOutlined
} from '@ant-design/icons';
import paymentService from '../../services/paymentService';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PaymentModal = ({ visible, onCancel, recordId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (visible && recordId) {
      loadPayment();
    }
  }, [visible, recordId]);

  const loadPayment = async () => {
    try {
      setLoading(true);
      console.log('📥 [PaymentModal] Loading payment for record:', recordId);
      
      const response = await paymentService.getPaymentByRecordId(recordId);
      
      console.log('✅ [PaymentModal] Payment loaded:', response);
      
      if (response.success && response.data) {
        setPayment(response.data);
        setPaidAmount(response.data.finalAmount || 0);
      } else {
        message.warning('Chưa có thông tin thanh toán');
      }
    } catch (error) {
      console.error('❌ [PaymentModal] Load payment error:', error);
      message.error('Không thể tải thông tin thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const handleCashPayment = async () => {
    if (!payment) {
      message.error('Không có thông tin thanh toán');
      return;
    }

    if (paidAmount < payment.finalAmount) {
      message.error('Số tiền thanh toán không đủ');
      return;
    }

    try {
      setProcessing(true);
      console.log('💵 [PaymentModal] Confirming cash payment:', {
        paymentId: payment._id,
        paidAmount,
        notes
      });

      const response = await paymentService.confirmCashPayment(
        payment._id,
        paidAmount,
        notes
      );

      console.log('✅ [PaymentModal] Cash payment confirmed:', response);

      if (response.success) {
        const changeAmount = response.data.changeAmount || 0;
        
        if (changeAmount > 0) {
          Modal.success({
            title: 'Thanh toán thành công!',
            content: (
              <div>
                <p>Số tiền khách trả: {formatCurrency(paidAmount)}</p>
                <p style={{ color: '#52c41a', fontSize: 16, fontWeight: 'bold' }}>
                  Tiền thừa: {formatCurrency(changeAmount)}
                </p>
              </div>
            ),
            onOk: () => {
              if (onSuccess) onSuccess(response.data);
              onCancel();
            }
          });
        } else {
          message.success('Thanh toán thành công!');
          if (onSuccess) onSuccess(response.data);
          onCancel();
        }
      }
    } catch (error) {
      console.error('❌ [PaymentModal] Cash payment error:', error);
      message.error(error.response?.data?.message || 'Không thể xác nhận thanh toán');
    } finally {
      setProcessing(false);
    }
  };

  const handleVNPayPayment = async () => {
    if (!payment) {
      message.error('Không có thông tin thanh toán');
      return;
    }

    try {
      setProcessing(true);
      console.log('💳 [PaymentModal] Creating VNPay URL for payment:', payment._id);

      const response = await paymentService.createVNPayUrlForPayment(payment._id);
      
      console.log('✅ [PaymentModal] VNPay URL created:', response);

      if (response.success && response.data?.paymentUrl) {
        message.success('Đang chuyển đến trang thanh toán VNPay...');
        
        // Redirect to VNPay payment page
        window.location.href = response.data.paymentUrl;
      } else {
        message.error('Không thể tạo link thanh toán VNPay');
      }
    } catch (error) {
      console.error('❌ [PaymentModal] VNPay payment error:', error);
      message.error(error.response?.data?.message || 'Không thể tạo link thanh toán VNPay');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const changeAmount = paidAmount - (payment?.finalAmount || 0);

  return (
    <Modal
      title={
        <Space>
          <DollarOutlined style={{ color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>Thanh Toán</Title>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={null}
    >
      <Spin spinning={loading}>
        {payment ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Payment Details */}
            <Card size="small" style={{ backgroundColor: '#f0f5ff' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Mã thanh toán">
                  <Text strong>{payment.paymentCode}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {payment.status === 'pending' ? (
                    <Tag color="orange">Chờ thanh toán</Tag>
                  ) : payment.status === 'completed' ? (
                    <Tag color="green">Đã thanh toán</Tag>
                  ) : (
                    <Tag>{payment.status}</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Amount Breakdown */}
            <div>
              <Row justify="space-between" style={{ marginBottom: 8 }}>
                <Col><Text>Tổng tiền dịch vụ:</Text></Col>
                <Col><Text strong>{formatCurrency(payment.originalAmount)}</Text></Col>
              </Row>

              {payment.discountAmount > 0 && (
                <Row justify="space-between" style={{ marginBottom: 8 }}>
                  <Col><Text type="secondary">Tiền cọc đã trừ:</Text></Col>
                  <Col><Text type="danger">- {formatCurrency(payment.discountAmount)}</Text></Col>
                </Row>
              )}

              <Divider style={{ margin: '12px 0' }} />

              <Row justify="space-between" style={{ marginBottom: 16 }}>
                <Col><Text strong style={{ fontSize: 16 }}>Số tiền còn lại:</Text></Col>
                <Col>
                  <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                    {formatCurrency(payment.finalAmount)}
                  </Text>
                </Col>
              </Row>
            </div>

            {payment.status === 'pending' && (
              <>
                {/* Cash Payment Section */}
                <Card title="Thanh toán tiền mặt" size="small">
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div>
                      <Text>Số tiền khách trả:</Text>
                      <InputNumber
                        style={{ width: '100%', marginTop: 8 }}
                        value={paidAmount}
                        onChange={setPaidAmount}
                        formatter={value => `₫ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/₫\s?|(,*)/g, '')}
                        min={payment.finalAmount}
                        step={10000}
                        size="large"
                      />
                    </div>

                    {changeAmount > 0 && (
                      <div style={{ backgroundColor: '#f6ffed', padding: '12px', borderRadius: '4px' }}>
                        <Row justify="space-between">
                          <Col><Text strong>Tiền thừa:</Text></Col>
                          <Col>
                            <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                              {formatCurrency(changeAmount)}
                            </Text>
                          </Col>
                        </Row>
                      </div>
                    )}

                    <div>
                      <Text>Ghi chú:</Text>
                      <TextArea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ghi chú về thanh toán (tùy chọn)"
                        style={{ marginTop: 8 }}
                      />
                    </div>

                    <Button
                      type="primary"
                      block
                      size="large"
                      icon={<CheckCircleOutlined />}
                      onClick={handleCashPayment}
                      loading={processing}
                    >
                      Xác nhận thanh toán tiền mặt
                    </Button>
                  </Space>
                </Card>

                {/* VNPay Payment Section */}
                <Card title="Thanh toán VNPay" size="small">
                  <Button
                    block
                    size="large"
                    icon={<CreditCardOutlined />}
                    onClick={handleVNPayPayment}
                    loading={processing}
                    style={{ backgroundColor: '#00b14f', color: 'white', borderColor: '#00b14f' }}
                  >
                    Thanh toán qua VNPay
                  </Button>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                    Bạn sẽ được chuyển đến trang VNPay để thanh toán
                  </Text>
                </Card>
              </>
            )}

            {payment.status === 'completed' && (
              <Card style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                  <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                  <Title level={4} style={{ color: '#52c41a', margin: 0 }}>
                    Đã thanh toán
                  </Title>
                  <Text type="secondary">
                    Phương thức: {payment.method === 'cash' ? 'Tiền mặt' : 'VNPay'}
                  </Text>
                  {payment.paidAmount && (
                    <Text>Đã thanh toán: {formatCurrency(payment.paidAmount)}</Text>
                  )}
                  {payment.changeAmount > 0 && (
                    <Text>Tiền thừa: {formatCurrency(payment.changeAmount)}</Text>
                  )}
                </Space>
              </Card>
            )}
          </Space>
        ) : (
          !loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary">Chưa có thông tin thanh toán</Text>
            </div>
          )
        )}
      </Spin>
    </Modal>
  );
};

export default PaymentModal;

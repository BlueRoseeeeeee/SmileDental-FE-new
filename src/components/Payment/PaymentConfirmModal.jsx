/**
 * Payment Confirmation Modal
 * Modal để xác nhận thông tin thanh toán với bệnh nhân TRƯỚC KHI hoàn thành hồ sơ
 * Hiển thị preview chi phí, không tạo payment thật
 */
import React, { useState } from 'react';
import {
  Modal,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Button,
  Tag,
  Card,
  Table,
  message,
  Alert
} from 'antd';
import {
  CheckCircleOutlined,
  DollarOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import recordService from '../../services/recordService';
import { completeRecord as completeRecordQueue } from '../../services/queueService';

const { Title, Text } = Typography;

const PaymentConfirmModal = ({ visible, onCancel, record, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  if (!record) return null;

  // Calculate service items for display
  const getServiceItems = () => {
    const items = [];
    
    // 1. Main service + serviceAddOn
    if (record.serviceName) {
      const mainQuantity = record.quantity || 1;
      const mainPrice = record.serviceAddOnPrice || 0; // Service addon price only
      const mainTotal = mainPrice * mainQuantity;
      
      items.push({
        key: 'main',
        name: record.serviceName,
        subName: record.serviceAddOnName || 'Chưa chọn dịch vụ con',
        unit: record.serviceAddOnUnit || '',
        quantity: mainQuantity,
        price: mainPrice,
        total: mainTotal,
        type: 'Dịch vụ chính'
      });
    }
    
    // 2. Additional services
    if (record.additionalServices && record.additionalServices.length > 0) {
      record.additionalServices.forEach((svc, index) => {
        items.push({
          key: `additional-${index}`,
          name: svc.serviceName,
          subName: svc.serviceAddOnName || '',
          unit: svc.serviceAddOnUnit || '',
          quantity: svc.quantity || 1,
          price: svc.price || 0,
          total: svc.totalPrice || (svc.price * (svc.quantity || 1)),
          type: 'Dịch vụ bổ sung'
        });
      });
    }
    
    return items;
  };

  const serviceItems = getServiceItems();
  
  // 🔍 Calculate actual total from service items displayed
  const calculatedTotal = serviceItems.reduce((sum, item) => sum + item.total, 0);
  
  // ✅ Use calculatedTotal for display to ensure consistency between detail and total
  // record.totalCost may be outdated if prices changed or services were modified
  const totalAmount = calculatedTotal;
  const appointmentDeposit = record.appointmentDeposit || 0;
  const remainingAmount = totalAmount - appointmentDeposit;
  const hasDeposit = appointmentDeposit > 0;
  const isOnlineBooking = record.appointmentBookingChannel === 'online';
  
  // Check if there's a mismatch between DB value and calculated value
  const hasPriceMismatch = record.totalCost && Math.abs(record.totalCost - calculatedTotal) > 1;

  console.log('💰 [PaymentConfirmModal] Price calculation:', {
    'record.totalCost (DB)': record.totalCost,
    'calculatedFromItems': calculatedTotal,
    'totalAmount (displayed)': totalAmount,
    'difference': (record.totalCost || 0) - calculatedTotal,
    'hasPriceMismatch': hasPriceMismatch,
    serviceItems: serviceItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.total
    }))
  });

  // 🔍 Debug: Log appointment info
  console.log('🔍 [PaymentConfirmModal] Record appointment data:', {
    appointmentId: record.appointmentId,
    appointmentDeposit: record.appointmentDeposit,
    appointmentBookingChannel: record.appointmentBookingChannel,
    appointmentPaymentStatus: record.appointmentPaymentStatus,
    hasDeposit,
    isOnlineBooking,
    totalAmount,
    remainingAmount
  });

  const columns = [
    {
      title: 'Dịch vụ',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.subName && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              ↳ {record.subName}
            </Text>
          )}
          <Tag color="blue" style={{ fontSize: 11, marginTop: 4 }}>
            {record.type}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (quantity, record) => (
        <Space size={4}>
          <Text>{quantity}</Text>
          {record.unit && <Tag color="blue" style={{ fontSize: 11 }}>{record.unit}</Tag>}
        </Space>
      )
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      align: 'right',
      render: (price) => (
        <Text>{price.toLocaleString('vi-VN')}đ</Text>
      )
    },
    {
      title: 'Thành tiền',
      dataIndex: 'total',
      key: 'total',
      width: 150,
      align: 'right',
      render: (total) => (
        <Text strong style={{ color: '#1890ff' }}>
          {total.toLocaleString('vi-VN')}đ
        </Text>
      )
    }
  ];

  const handleConfirmComplete = async () => {
    try {
      setLoading(true);
      console.log('='.repeat(80));
      console.log('🎯 [PaymentConfirmModal] User confirmed - completing record...');
      console.log('📋 Record details:', {
        _id: record._id,
        recordCode: record.recordCode,
        appointmentId: record.appointmentId,
        totalCost: record.totalCost,
        serviceItems: serviceItems.length
      });
      console.log('='.repeat(80));
      
      // ✅ Use queueService to complete record synchronously (waits for payment creation)
      const response = await completeRecordQueue(record._id);
      console.log('✅ [PaymentConfirmModal] API Response:', response);
      
      if (response.success) {
        // ✅ Check if payment was created
        const paymentCreated = response.data?.payment?._id;
        
        if (!paymentCreated) {
          console.warn('⚠️ [PaymentConfirmModal] Payment was not created, but record is completed');
          message.warning('Hồ sơ đã hoàn thành nhưng chưa tạo được thanh toán. Vui lòng tạo thủ công.');
        } else {
          console.log('✅ [PaymentConfirmModal] Payment created:', response.data.payment._id);
          message.success('Hồ sơ và thanh toán đã được tạo thành công');
        }
        
        // Close the payment confirm modal
        if (onCancel) {
          onCancel();
        }
        
        // Reload data immediately (payment is already created)
        if (onSuccess) {
          onSuccess(response.data);
        }
        
        // Then show success modal for user information
        Modal.success({
          title: 'Hoàn thành hồ sơ thành công!',
          content: (
            <div>
              <p>Hồ sơ <strong>{record.recordCode}</strong> đã hoàn thành.</p>
              {paymentCreated ? (
                <p>Thanh toán đã được tạo. Bệnh nhân có thể ra quầy lễ tân để thanh toán.</p>
              ) : (
                <p style={{ color: '#faad14' }}>⚠️ Vui lòng tạo thanh toán thủ công cho hồ sơ này.</p>
              )}
              <Divider />
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Tổng tiền:</Text>
                  <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                    {totalAmount.toLocaleString('vi-VN')}đ
                  </Text>
                </div>
                {hasDeposit && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary">Đã cọc:</Text>
                      <Text type="secondary">
                        - {appointmentDeposit.toLocaleString('vi-VN')}đ
                      </Text>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text strong>Còn phải thanh toán:</Text>
                      <Text strong style={{ fontSize: 18, color: '#ff4d4f' }}>
                        {remainingAmount.toLocaleString('vi-VN')}đ
                      </Text>
                    </div>
                  </>
                )}
              </Space>
            </div>
          ),
          okText: 'Đóng'
        });
      }
    } catch (error) {
      console.error('❌ [PaymentConfirmModal] Complete record error:', error);
      message.error(error.response?.data?.message || 'Không thể hoàn thành hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined style={{ color: '#1890ff' }} />
          <span>Xác nhận thông tin thanh toán</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          Hủy
        </Button>,
        <Button
          key="confirm"
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={handleConfirmComplete}
          loading={loading}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
          Xác nhận & Hoàn thành
        </Button>
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Record Info */}
        <Card size="small" style={{ background: '#f0f5ff' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Space direction="vertical" size={0}>
                <Text type="secondary">Mã hồ sơ</Text>
                <Text strong style={{ fontSize: 16 }}>{record.recordCode}</Text>
              </Space>
            </Col>
            <Col span={12}>
              <Space direction="vertical" size={0}>
                <Text type="secondary">Bệnh nhân</Text>
                <Text strong>{record.patientInfo?.name || 'N/A'}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {record.patientInfo?.phone}
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Price Mismatch Warning */}
        {hasPriceMismatch && (
          <Alert
            type="warning"
            showIcon
            message="Giá trong hồ sơ không khớp"
            description={
              <div>
                <Text>Giá lưu trong hệ thống: <strong>{(record.totalCost || 0).toLocaleString('vi-VN')}đ</strong></Text>
                <br />
                <Text>Giá tính từ dịch vụ: <strong>{calculatedTotal.toLocaleString('vi-VN')}đ</strong></Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Hệ thống đang hiển thị giá tính từ dịch vụ. Vui lòng cập nhật lại hồ sơ để đồng bộ giá.
                </Text>
              </div>
            }
            style={{ marginBottom: 0 }}
          />
        )}

        {/* Warning Message */}
        <Card size="small" style={{ background: '#fffbe6', borderColor: '#ffe58f' }}>
          <Space>
            <InfoCircleOutlined style={{ color: '#faad14' }} />
            <div>
              <Text strong>Vui lòng xác nhận lại chi phí với bệnh nhân</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Sau khi xác nhận, bệnh nhân có thể ra quầy lễ tân để thanh toán
              </Text>
            </div>
          </Space>
        </Card>

        {/* Service Items Table */}
        <div>
          <Title level={5}>
            <DollarOutlined /> Chi tiết dịch vụ
          </Title>
          <Table
            columns={columns}
            dataSource={serviceItems}
            pagination={false}
            size="small"
            bordered
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Text strong>Tổng cộng</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                      {totalAmount.toLocaleString('vi-VN')}đ
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
                {hasDeposit && (
                  <>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <Space>
                          <Text type="secondary">Đã cọc trước</Text>
                          {isOnlineBooking && (
                            <Tag color="green" style={{ fontSize: 11 }}>
                              Đặt lịch online
                            </Tag>
                          )}
                        </Space>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text type="secondary" style={{ fontSize: 14 }}>
                          - {appointmentDeposit.toLocaleString('vi-VN')}đ
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <Text strong style={{ fontSize: 16 }}>Còn phải thanh toán</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong style={{ fontSize: 18, color: '#ff4d4f' }}>
                          {remainingAmount.toLocaleString('vi-VN')}đ
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </>
                )}
              </Table.Summary>
            )}
          />
        </div>

        {/* Deposit Info Alert */}
        {hasDeposit && (
          <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
              <div>
                <Text strong style={{ color: '#52c41a' }}>
                  Bệnh nhân đã cọc trước {appointmentDeposit.toLocaleString('vi-VN')}đ
                </Text>
                {isOnlineBooking && (
                  <>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Đã thanh toán qua VNPay khi đặt lịch online
                    </Text>
                  </>
                )}
              </div>
            </Space>
          </Card>
        )}

        {/* No Deposit Alert */}
        {!hasDeposit && (
          <Card size="small" style={{ background: '#fafafa', borderColor: '#d9d9d9' }}>
            <Space>
              <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 18 }} />
              <div>
                <Text>Bệnh nhân chưa có tiền cọc trước</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Bệnh nhân cần thanh toán toàn bộ {totalAmount.toLocaleString('vi-VN')}đ tại quầy lễ tân
                </Text>
              </div>
            </Space>
          </Card>
        )}

        {/* Payment Notice */}
        <Card size="small" style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}>
          <Space>
            <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 18 }} />
            <div>
              <Text strong>Thanh toán tại quầy lễ tân</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Sau khi hoàn thành, bệnh nhân sẽ ra quầy lễ tân để thanh toán. 
                Lễ tân sẽ chọn phương thức thanh toán (Tiền mặt hoặc VNPay).
              </Text>
            </div>
          </Space>
        </Card>

        {/* Additional Info */}
        {record.diagnosis && (
          <div>
            <Text type="secondary">Chẩn đoán:</Text>
            <Card size="small" style={{ marginTop: 8 }}>
              <Text>{record.diagnosis}</Text>
            </Card>
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default PaymentConfirmModal;

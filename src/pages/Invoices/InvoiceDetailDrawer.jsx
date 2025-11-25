import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Space,
  Button,
  Card,
  Table,
  Typography,
  Divider,
  Timeline,
  Row,
  Col,
  Statistic,
  Spin,
  message
} from 'antd';
import {
  EditOutlined,
  PrinterOutlined,
  FilePdfOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import invoiceService from '../../services/invoiceService';

const { Title, Text } = Typography;

const InvoiceDetailDrawer = ({ visible, invoice, onClose, onEdit, onPrint, onExportPDF }) => {
  const [invoiceDetails, setInvoiceDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch invoice details when drawer opens
  useEffect(() => {
    if (visible && invoice && invoice._id) {
      loadInvoiceDetails();
    }
  }, [visible, invoice]);

  const loadInvoiceDetails = async () => {
    // If invoice already has details populated, use them
    if (invoice.details && invoice.details.length > 0) {
      setInvoiceDetails(invoice.details);
      return;
    }

    // Otherwise, fetch details from API
    setLoadingDetails(true);
    try {
      const result = await invoiceService.getInvoiceDetails(invoice._id);
      if (result.success) {
        setInvoiceDetails(result.data || []);
      }
    } catch (error) {
      console.error('Error loading invoice details:', error);
      message.error('Không thể tải chi tiết hóa đơn');
      setInvoiceDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (!invoice) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      pending: 'orange',
      partial_paid: 'blue',
      paid: 'green',
      overdue: 'red',
      cancelled: 'default',
      refunded: 'purple'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      draft: 'Nháp',
      pending: 'Chờ thanh toán',
      partial_paid: 'Thanh toán 1 phần',
      paid: 'Đã thanh toán',
      overdue: 'Quá hạn',
      cancelled: 'Đã hủy',
      refunded: 'Đã hoàn tiền'
    };
    return texts[status] || status;
  };

  const getTypeText = (type) => {
    const texts = {
      appointment: 'Cuộc hẹn',
      treatment: 'Điều trị',
      consultation: 'Tư vấn',
      emergency: 'Cấp cứu',
      checkup: 'Kiểm tra'
    };
    return texts[type] || type;
  };

  const serviceColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1
    },
    {
      title: 'Dịch vụ',
      dataIndex: ['serviceInfo', 'name'],
      key: 'service',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          {record.serviceInfo.code && (
            <div style={{ fontSize: '12px', color: '#888' }}>
              Mã: {record.serviceInfo.code}
            </div>
          )}
          {record.toothInfo && (
            <div style={{ fontSize: '12px', color: '#1890ff' }}>
              Răng số {record.toothInfo.toothNumber} - {record.toothInfo.position}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right',
      width: 120,
      render: (price) => formatCurrency(price)
    },
    {
      title: 'SL',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
      width: 60
    },
    {
      title: 'Giảm giá',
      dataIndex: 'discountAmount',
      key: 'discount',
      align: 'right',
      width: 100,
      render: (amount) => amount > 0 ? (
        <Text type="danger">-{formatCurrency(amount)}</Text>
      ) : '-'
    },
    {
      title: 'Thành tiền',
      dataIndex: 'totalPrice',
      key: 'total',
      align: 'right',
      width: 120,
      render: (price) => (
        <Text strong style={{ color: '#1890ff' }}>
          {formatCurrency(price)}
        </Text>
      )
    }
  ];

  const paymentRate = invoice.totalAmount > 0 
    ? (invoice.paymentSummary.totalPaid / invoice.totalAmount * 100).toFixed(1)
    : 0;

  return (
    <Drawer
      title="Chi tiết hóa đơn"
      placement="right"
      width={800}
      onClose={onClose}
      open={visible}
      extra={
        <Space>
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <Button icon={<EditOutlined />} onClick={() => onEdit(invoice)}>
              Chỉnh sửa
            </Button>
          )}
          <Button icon={<PrinterOutlined />} onClick={() => onPrint(invoice)}>
            In
          </Button>
          <Button icon={<FilePdfOutlined />} onClick={() => onExportPDF(invoice)}>
            Xuất PDF
          </Button>
        </Space>
      }
    >
      {/* Header - Invoice Number & Status */}
      <Card style={{ marginBottom: 16, background: '#fafafa' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              {invoice.invoiceNumber}
            </Title>
          </Col>
          <Col>
            <Space size="large">
              <Tag color={getTypeText(invoice.type) === 'Điều trị' ? 'blue' : 'default'} style={{ fontSize: '14px', padding: '4px 12px' }}>
                {getTypeText(invoice.type)}
              </Tag>
              <Tag color={getStatusColor(invoice.status)} style={{ fontSize: '14px', padding: '4px 12px' }}>
                {getStatusText(invoice.status)}
              </Tag>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Patient Information */}
      <Card title="Thông tin bệnh nhân" style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Họ tên">{invoice.patientInfo.name}</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">{invoice.patientInfo.phone}</Descriptions.Item>
          {invoice.patientInfo.email && (
            <Descriptions.Item label="Email">{invoice.patientInfo.email}</Descriptions.Item>
          )}
          {invoice.patientInfo.address && (
            <Descriptions.Item label="Địa chỉ" span={2}>{invoice.patientInfo.address}</Descriptions.Item>
          )}
          {invoice.patientInfo.dateOfBirth && (
            <Descriptions.Item label="Ngày sinh">
              {dayjs(invoice.patientInfo.dateOfBirth).format('DD/MM/YYYY')}
            </Descriptions.Item>
          )}
          {invoice.patientInfo.gender && (
            <Descriptions.Item label="Giới tính">
              {invoice.patientInfo.gender === 'male' ? 'Nam' : 'Nữ'}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Dentist Information */}
      <Card title="Thông tin Nha sĩ" style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Họ tên">{invoice.dentistInfo.name}</Descriptions.Item>
          {/* <Descriptions.Item label="Chuyên khoa">{invoice.dentistInfo.specialization}</Descriptions.Item> */}
          {invoice.dentistInfo.licenseNumber && (
            <Descriptions.Item label="Số chứng chỉ">{invoice.dentistInfo.licenseNumber}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Invoice Dates */}
      <Card title="Thông tin thời gian" style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Ngày tạo">
            {dayjs(invoice.issueDate).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Hạn thanh toán">
            <Text style={{ color: invoice.status === 'overdue' ? '#ff4d4f' : 'inherit' }}>
              {dayjs(invoice.dueDate).format('DD/MM/YYYY')}
            </Text>
          </Descriptions.Item>
          {invoice.paidDate && (
            <Descriptions.Item label="Ngày thanh toán">
              {dayjs(invoice.paidDate).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Service Items */}
      <Card title="Chi tiết dịch vụ" style={{ marginBottom: 16 }}>
        <Spin spinning={loadingDetails}>
          {invoiceDetails.length === 0 && !loadingDetails ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              Không có chi tiết dịch vụ
            </div>
          ) : (
            <Table
              dataSource={invoiceDetails}
              columns={serviceColumns}
              rowKey="_id"
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5} align="right">
                      <Text strong>Tạm tính:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text>{formatCurrency(invoice.subtotal)}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  
                  {invoice.discountInfo.type !== 'none' && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={5} align="right">
                        <Text type="danger">
                          Giảm giá {invoice.discountInfo.type === 'percentage' ? `(${invoice.discountInfo.value}%)` : ''}:
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text type="danger">
                          -{formatCurrency(
                            invoice.discountInfo.type === 'percentage'
                              ? (invoice.subtotal * invoice.discountInfo.value) / 100
                              : invoice.discountInfo.value
                          )}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  
                  {invoice.taxInfo.taxAmount > 0 && !invoice.taxInfo.taxIncluded && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={5} align="right">
                        <Text>Thuế VAT ({invoice.taxInfo.taxRate}%):</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text>{formatCurrency(invoice.taxInfo.taxAmount)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  
                  <Table.Summary.Row style={{ background: '#fafafa' }}>
                    <Table.Summary.Cell index={0} colSpan={5} align="right">
                      <Text strong style={{ fontSize: '16px' }}>Tổng cộng:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                        {formatCurrency(invoice.totalAmount)}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          )}
        </Spin>
        
        {invoice.discountInfo.reason && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: '#fff7e6', borderRadius: 4 }}>
            <Text type="warning">
              <strong>Lý do giảm giá:</strong> {invoice.discountInfo.reason}
            </Text>
          </div>
        )}
        
        {invoice.taxInfo.taxIncluded && (
          <div style={{ marginTop: 8, fontSize: '12px', color: '#888' }}>
            * Giá đã bao gồm thuế VAT {invoice.taxInfo.taxRate}%
          </div>
        )}
      </Card>

      {/* Payment Summary */}
      <Card title="Tình trạng thanh toán" style={{ marginBottom: 16 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic
              title="Tổng hóa đơn"
              value={invoice.totalAmount}
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => formatCurrency(value)}
              prefix={<DollarOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Đã thanh toán"
              value={invoice.paymentSummary.totalPaid}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => formatCurrency(value)}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Còn nợ"
              value={invoice.paymentSummary.remainingAmount}
              valueStyle={{ color: invoice.paymentSummary.remainingAmount > 0 ? '#ff4d4f' : '#52c41a' }}
              formatter={(value) => formatCurrency(value)}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Tỷ lệ thanh toán"
              value={paymentRate}
              suffix="%"
              valueStyle={{ color: paymentRate >= 100 ? '#52c41a' : '#ff4d4f' }}
            />
          </Col>
        </Row>
        
        {invoice.paymentSummary.lastPaymentDate && (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Lần thanh toán cuối">
              {dayjs(invoice.paymentSummary.lastPaymentDate).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Phương thức">
              {invoice.paymentSummary.paymentMethod === 'cash' ? 'Tiền mặt' :
               invoice.paymentSummary.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' :
               invoice.paymentSummary.paymentMethod === 'vnpay' ? 'VNPay' : 
               invoice.paymentSummary.paymentMethod}
            </Descriptions.Item>
            {invoice.paymentSummary.paymentIds.length > 0 && (
              <Descriptions.Item label="Số giao dịch" span={2}>
                {invoice.paymentSummary.paymentIds.length} lần thanh toán
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Card>

      {/* Notes */}
      {(invoice.description || invoice.notes || invoice.internalNotes) && (
        <Card title="Ghi chú" style={{ marginBottom: 16 }}>
          {invoice.description && (
            <div style={{ marginBottom: 12 }}>
              <Text strong>Mô tả:</Text>
              <div style={{ marginTop: 4, padding: '8px 12px', background: '#fafafa', borderRadius: 4 }}>
                {invoice.description}
              </div>
            </div>
          )}
          
          {invoice.notes && (
            <div style={{ marginBottom: 12 }}>
              <Text strong>Ghi chú:</Text>
              <div style={{ marginTop: 4, padding: '8px 12px', background: '#fafafa', borderRadius: 4 }}>
                {invoice.notes}
              </div>
            </div>
          )}
          
          {invoice.internalNotes && (
            <div>
              <Text strong type="warning">Ghi chú nội bộ:</Text>
              <div style={{ marginTop: 4, padding: '8px 12px', background: '#fff7e6', borderRadius: 4 }}>
                {invoice.internalNotes}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Cancel Information */}
      {invoice.status === 'cancelled' && (
        <Card title="Thông tin hủy" type="inner" style={{ marginBottom: 16, borderColor: '#ff4d4f' }}>
          <Descriptions column={1} size="small">
            {invoice.cancelReason && (
              <Descriptions.Item label="Lý do hủy">
                <Text type="danger">{invoice.cancelReason}</Text>
              </Descriptions.Item>
            )}
            {invoice.cancelledAt && (
              <Descriptions.Item label="Thời gian hủy">
                {dayjs(invoice.cancelledAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Timeline */}
      <Card title="Lịch sử hoạt động" style={{ marginBottom: 16 }}>
        <Timeline>
          <Timeline.Item color="green">
            <div style={{ fontWeight: 500 }}>Tạo hóa đơn</div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              {dayjs(invoice.createdAt).format('DD/MM/YYYY HH:mm')}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              Bởi: {invoice.createdByRole}
            </div>
          </Timeline.Item>
          
          {invoice.updatedAt && invoice.updatedAt !== invoice.createdAt && (
            <Timeline.Item color="blue">
              <div style={{ fontWeight: 500 }}>Cập nhật hóa đơn</div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                {dayjs(invoice.updatedAt).format('DD/MM/YYYY HH:mm')}
              </div>
            </Timeline.Item>
          )}
          
          {invoice.paymentSummary.lastPaymentDate && (
            <Timeline.Item color="cyan">
              <div style={{ fontWeight: 500 }}>Thanh toán</div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                {dayjs(invoice.paymentSummary.lastPaymentDate).format('DD/MM/YYYY HH:mm')}
              </div>
              <div style={{ fontSize: '12px', color: '#52c41a' }}>
                Số tiền: {formatCurrency(invoice.paymentSummary.totalPaid)}
              </div>
            </Timeline.Item>
          )}
          
          {invoice.status === 'paid' && invoice.paidDate && (
            <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
              <div style={{ fontWeight: 500, color: '#52c41a' }}>Hoàn thành thanh toán</div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                {dayjs(invoice.paidDate).format('DD/MM/YYYY HH:mm')}
              </div>
            </Timeline.Item>
          )}
          
          {invoice.status === 'cancelled' && invoice.cancelledAt && (
            <Timeline.Item color="red" dot={<CloseCircleOutlined />}>
              <div style={{ fontWeight: 500, color: '#ff4d4f' }}>Hủy hóa đơn</div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                {dayjs(invoice.cancelledAt).format('DD/MM/YYYY HH:mm')}
              </div>
              {invoice.cancelReason && (
                <div style={{ fontSize: '12px', color: '#ff4d4f' }}>
                  Lý do: {invoice.cancelReason}
                </div>
              )}
            </Timeline.Item>
          )}
        </Timeline>
      </Card>
    </Drawer>
  );
};

export default InvoiceDetailDrawer;

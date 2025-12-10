/**
 * Payment List Page
 * Displays list of all payments with filters and actions
 * Access: admin, manager, receptionist
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  message,
  Modal,
  Descriptions,
  Statistic,
  Tooltip,
  Spin,
  Alert,
  Divider,
  InputNumber
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  FilterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getPayments,
  searchPayments,
  getPaymentById,
  confirmCashPayment as confirmCashPaymentApi,
  updatePayment,
  createVNPayUrlForPayment,
  createStripeUrlForPayment,
  cancelPayment
} from '../../services/payment.api';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const PaymentList = () => {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    status: null,
    fromDate: null,
    toDate: null,
    keyword: ''
  });

  // Detail modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // 🆕 Payment method selection modal
  const [paymentMethodModalVisible, setPaymentMethodModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [processingPayment, setProcessingPayment] = useState(null);
  const [cashPaidAmount, setCashPaidAmount] = useState(0);
  const [cashNotes, setCashNotes] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [pagination.current, pagination.pageSize]);

  // Auto-search when filters change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.current !== 1) {
        setPagination(prev => ({ ...prev, current: 1 }));
      } else {
        fetchPayments();
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [filters.keyword, filters.status, filters.fromDate, filters.toDate]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };

      // Remove null/empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === '') {
          delete params[key];
        }
      });

      console.log('🔍 [Payment List] Fetching payments with params:', params);

      const response = await getPayments(params);
      
      if (response.success) {
        console.log('✅ [Payment List] Received payments:', response.data.payments?.length || 0);
        setPayments(response.data.payments || response.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || response.data.total || 0
        }));
        setTotal(response.data.pagination?.total || response.data.total || 0);
      }
    } catch (error) {
      message.error('Không thể tải danh sách thanh toán');
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination, filters, sorter) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = async () => {
    if (filters.keyword) {
      try {
        setLoading(true);
        const response = await searchPayments(filters.keyword);
        if (response.success) {
          setPayments(response.data.payments || response.data);
          setTotal(response.data.payments?.length || response.data.length || 0);
        }
      } catch (error) {
        message.error('Không tìm thấy kết quả');
      } finally {
        setLoading(false);
      }
    } else {
      fetchPayments();
    }
  };

  const handleReset = () => {
    setFilters({
      status: null,
      fromDate: null,
      toDate: null,
      keyword: ''
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleViewDetails = async (payment) => {
    try {
      setDetailLoading(true);
      setDetailModalVisible(true);
      const response = await getPaymentById(payment._id);
      if (response.success) {
        setSelectedPayment(response.data.payment || response.data);
      }
    } catch (error) {
      message.error('Không thể tải chi tiết thanh toán');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleConfirmPayment = (payment) => {
    setProcessingPayment(payment);
    setSelectedPaymentMethod(payment.method || 'cash');
    setCashPaidAmount(payment.finalAmount || payment.originalAmount || 0);
    setCashNotes('');
    setModalSubmitting(false);
    setPaymentMethodModalVisible(true);
  };
  
  // 🆕 Handle payment method confirmation
  const handleProcessPayment = async () => {
    if (!processingPayment) {
      return;
    }

    if (!selectedPaymentMethod) {
      message.warning('Vui lòng chọn phương thức thanh toán');
      return;
    }

    try {
      setModalSubmitting(true);

      if (!processingPayment.method || selectedPaymentMethod !== processingPayment.method) {
        console.log(`📝 Updating payment method from ${processingPayment.method || 'null'} to ${selectedPaymentMethod}`);
        const updateResponse = await updatePayment(processingPayment._id, {
          method: selectedPaymentMethod
        });

        if (!updateResponse.success) {
          throw new Error(updateResponse.message || 'Không thể cập nhật phương thức thanh toán');
        }

        setProcessingPayment(prev => (prev ? { ...prev, method: selectedPaymentMethod } : prev));
        setPayments(prev => prev.map(item => (
          item._id === processingPayment._id
            ? { ...item, method: selectedPaymentMethod }
            : item
        )));
        console.log('✅ Payment method updated successfully');
      }

      if (selectedPaymentMethod === 'vnpay') {
        console.log('💳 Creating VNPay URL for payment:', processingPayment.paymentCode);
        const vnpayResponse = await createVNPayUrlForPayment(processingPayment._id);

        if (vnpayResponse.success && vnpayResponse.data?.paymentUrl) {
          message.success('Đang chuyển đến trang thanh toán VNPay...');
          setPaymentMethodModalVisible(false);
          setProcessingPayment(null);
          setCashPaidAmount(0);
          setCashNotes('');
          window.location.href = vnpayResponse.data.paymentUrl;
          return;
        }

        throw new Error(vnpayResponse.message || 'Không thể tạo URL thanh toán VNPay');
      }

      if (selectedPaymentMethod === 'stripe') {
        console.log('💳 Creating Stripe URL for payment:', processingPayment.paymentCode);
        const stripeResponse = await createStripeUrlForPayment(processingPayment._id);

        if (stripeResponse.success && stripeResponse.data?.paymentUrl) {
          message.success('Đang chuyển đến trang thanh toán Stripe...');
          setPaymentMethodModalVisible(false);
          setProcessingPayment(null);
          setCashPaidAmount(0);
          setCashNotes('');
          window.location.href = stripeResponse.data.paymentUrl;
          return;
        }

        throw new Error(stripeResponse.message || 'Không thể tạo URL thanh toán Stripe');
      }

      if (selectedPaymentMethod === 'cash') {
        const requiredAmount = processingPayment.finalAmount || 0;

        if (!cashPaidAmount || cashPaidAmount < requiredAmount) {
          message.error('Số tiền thanh toán chưa đủ');
          return;
        }

        const confirmResponse = await confirmCashPaymentApi(
          processingPayment._id,
          cashPaidAmount,
          cashNotes
        );

        if (!confirmResponse.success) {
          throw new Error(confirmResponse.message || 'Không thể xác nhận thanh toán tiền mặt');
        }

        message.success('Xác nhận thanh toán tiền mặt thành công');
        setPaymentMethodModalVisible(false);
        setProcessingPayment(null);
        setCashPaidAmount(0);
        setCashNotes('');
        fetchPayments();
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      message.error(error.message || 'Có lỗi xảy ra khi xử lý thanh toán');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleCancelPayment = async (paymentId) => {
    Modal.confirm({
      title: 'Hủy thanh toán',
      content: (
        <div>
          <p>Bạn có chắc chắn muốn hủy thanh toán này?</p>
          <Input.TextArea
            placeholder="Nhập lý do hủy..."
            id="cancelReason"
            rows={3}
          />
        </div>
      ),
      onOk: async () => {
        const reason = document.getElementById('cancelReason')?.value || 'Không có lý do';
        try {
          const response = await cancelPayment(paymentId, reason);
          if (response.success) {
            message.success('Hủy thanh toán thành công');
            fetchPayments();
          }
        } catch (error) {
          message.error('Không thể hủy thanh toán');
        }
      }
    });
  };

  // Status tag colors
  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      processing: 'blue',
      completed: 'green',
      failed: 'red',
      cancelled: 'default',
      refunded: 'purple',
      partial_refund: 'purple'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      completed: 'Hoàn thành',
      failed: 'Thất bại',
      cancelled: 'Đã hủy',
      refunded: 'Đã hoàn tiền',
      partial_refund: 'Hoàn 1 phần'
    };
    return texts[status] || status;
  };

  // Method tag colors
  const getMethodColor = (method) => {
    const colors = {
      cash: 'green',
      vnpay: 'blue',
      stripe: 'purple',
      visa: 'gold'
    };
    return colors[method] || 'default';
  };

  const getMethodText = (method) => {
    const texts = {
      cash: 'Tiền mặt',
      vnpay: 'VNPay',
      stripe: 'Stripe',
      visa: 'VISA/Mastercard'
    };
    return texts[method] || method;
  };

  // Type tag colors
  const getTypeColor = (type) => {
    const colors = {
      payment: 'blue',
      refund: 'red',
      adjustment: 'orange',
      deposit: 'cyan',
      insurance_claim: 'purple'
    };
    return colors[type] || 'default';
  };

  const getTypeText = (type) => {
    const texts = {
      payment: 'Thanh toán',
      refund: 'Hoàn tiền',
      adjustment: 'Điều chỉnh',
      deposit: 'Đặt cọc',
      insurance_claim: 'Bảo hiểm'
    };
    return texts[type] || type;
  };

  const columns = [
    {
      title: 'Mã thanh toán',
      dataIndex: 'paymentCode',
      key: 'paymentCode',
      width: 180,
      render: (code) => <strong style={{ fontSize: '13px' }}>{code}</strong>
    },
    {
      title: 'Bệnh nhân',
      dataIndex: ['patientInfo', 'name'],
      key: 'patientName',
      width: 180,
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 2 }}>{name}</div>
          <small style={{ color: '#888', fontSize: '11px' }}>{record.patientInfo?.phone}</small>
        </div>
      )
    },
    
    {
      title: 'Phương thức',
      dataIndex: 'method',
      key: 'method',
      width: 120,
      align: 'center',
      render: (method) => {
        if (!method) {
          return <Tag color="default">Chưa chọn</Tag>;
        }
        return (
          <Tag color={getMethodColor(method)}>
            {getMethodText(method)}
          </Tag>
        );
      }
    },
    {
      title: 'Số tiền',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      width: 150,
      align: 'right',
      render: (amount, record) => (
        <div>
          <div style={{ fontWeight: 'bold', color: '#1890ff', fontSize: '13px' }}>
            {amount?.toLocaleString('vi-VN')} đ
          </div>
          {record.depositAmount > 0 && (
            <small style={{ color: '#52c41a', fontSize: '11px' }}>
              (Đã cọc: {record.depositAmount?.toLocaleString('vi-VN')} đ)
            </small>
          )}
          {record.depositAmount === 0 && record.originalAmount && (
            <small style={{ color: '#999', fontSize: '11px' }}>
              (Chưa cọc)
            </small>
          )}
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Ngày thanh toán',
      dataIndex: 'processedAt',
      key: 'processedAt',
      width: 160,
      align: 'center',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          {['pending', 'processing'].includes(record.status) && (
            <Tooltip title="Thanh toán">
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleConfirmPayment(record)}
              >
                Thanh toán
              </Button>
            </Tooltip>
          )}
          {/* {['pending', 'processing'].includes(record.status) && (
            <Tooltip title="Hủy">
              <Button
                type="text"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleCancelPayment(record._id)}
              />
            </Tooltip>
          )} */}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <DollarOutlined />
            <span>Danh sách thanh toán</span>
          </Space>
        }
        extra={
          <Space>
            <Statistic
              title="Tổng số"
              value={total}
              prefix={<DollarOutlined />}
              valueStyle={{ fontSize: 16 }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchPayments}
            >
              Tải lại
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <Card
          size="small"
          style={{ marginBottom: 16 }}
          title={<><FilterOutlined /> Bộ lọc</>}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Tìm theo mã hoặc tên BN..."
                prefix={<SearchOutlined />}
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Trạng thái"
                style={{ width: '100%' }}
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
                allowClear
              >
                <Option value="pending">Chờ xử lý</Option>
                <Option value="processing">Đang xử lý</Option>
                <Option value="completed">Hoàn thành</Option>
                <Option value="cancelled">Đã hủy</Option>
              </Select>
            </Col>
            <Col xs={24} sm={24} md={10}>
              <RangePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder={['Từ ngày', 'Đến ngày']}
                onChange={(dates) => {
                  if (dates) {
                    handleFilterChange('fromDate', dates[0]?.format('YYYY-MM-DD'));
                    handleFilterChange('toDate', dates[1]?.format('YYYY-MM-DD'));
                  } else {
                    handleFilterChange('fromDate', null);
                    handleFilterChange('toDate', null);
                  }
                }}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col>
              <Button onClick={handleReset}>
                Đặt lại
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={payments}
          rowKey="_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1100 }}
          size="small"
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết thanh toán"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>
        ]}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : selectedPayment && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Mã thanh toán" span={2}>
              <strong>{selectedPayment.paymentCode}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Loại">
              <Tag color={getTypeColor(selectedPayment.type)}>
                {getTypeText(selectedPayment.type)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={getStatusColor(selectedPayment.status)}>
                {getStatusText(selectedPayment.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Bệnh nhân" span={2}>
              <div>
                <div>{selectedPayment.patientInfo?.name}</div>
                <small style={{ color: '#888' }}>
                  SĐT: {selectedPayment.patientInfo?.phone}<br />
                  {selectedPayment.patientInfo?.email && `Email: ${selectedPayment.patientInfo.email}`}
                </small>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Phương thức">
              <Tag color={getMethodColor(selectedPayment.method)}>
                {getMethodText(selectedPayment.method)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền gốc">
              <strong>{selectedPayment.originalAmount?.toLocaleString('vi-VN')} đ</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Giảm giá">
              {selectedPayment.discountAmount?.toLocaleString('vi-VN')} đ
            </Descriptions.Item>
            <Descriptions.Item label="Thuế">
              {selectedPayment.taxAmount?.toLocaleString('vi-VN')} đ
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              <strong style={{ color: '#1890ff', fontSize: 16 }}>
                {selectedPayment.finalAmount?.toLocaleString('vi-VN')} đ
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="Đã thanh toán">
              <strong style={{ color: '#52c41a' }}>
                {selectedPayment.paidAmount?.toLocaleString('vi-VN')} đ
              </strong>
            </Descriptions.Item>
            {selectedPayment.changeAmount > 0 && (
              <Descriptions.Item label="Tiền thừa" span={2}>
                {selectedPayment.changeAmount?.toLocaleString('vi-VN')} đ
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Người xử lý">
              {selectedPayment.processedByName}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {dayjs(selectedPayment.processedAt).format('DD/MM/YYYY HH:mm:ss')}
            </Descriptions.Item>
            {selectedPayment.description && (
              <Descriptions.Item label="Mô tả" span={2}>
                {selectedPayment.description}
              </Descriptions.Item>
            )}
            {selectedPayment.notes && (
              <Descriptions.Item label="Ghi chú" span={2}>
                {selectedPayment.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* 🆕 Payment Method Selection Modal */}
      <Modal
        title={
          <Space>
            <span>Chọn phương thức thanh toán</span>
            {processingPayment && !processingPayment.method && (
              <Tag color="orange">Chưa chọn phương thức</Tag>
            )}
          </Space>
        }
        open={paymentMethodModalVisible}
        onCancel={() => {
          setPaymentMethodModalVisible(false);
          setProcessingPayment(null);
          setCashPaidAmount(0);
          setCashNotes('');
        }}
        onOk={handleProcessPayment}
        okText={
          selectedPaymentMethod === 'vnpay' 
            ? 'Thanh toán VNPay' 
            : selectedPaymentMethod === 'stripe'
            ? 'Thanh toán Stripe'
            : 'Xác nhận thanh toán'
        }
        cancelText="Hủy"
        width={600}
        confirmLoading={modalSubmitting}
        okButtonProps={{
          disabled: !selectedPaymentMethod || (
            selectedPaymentMethod === 'cash' && (
              !cashPaidAmount ||
              cashPaidAmount < (processingPayment?.finalAmount || 0)
            )
          )
        }}
      >
        {processingPayment && (
          <div>
            <Card size="small" style={{ marginBottom: 16, background: '#f0f5ff' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Mã thanh toán">
                  <strong>{processingPayment.paymentCode}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Bệnh nhân">
                  {processingPayment.patientInfo?.name}
                </Descriptions.Item>
                <Descriptions.Item label="Mô tả">
                  {processingPayment.description}
                </Descriptions.Item>
                <Descriptions.Item label="Tổng tiền dịch vụ">
                  <span style={{ fontSize: 14 }}>
                    {processingPayment.originalAmount?.toLocaleString('vi-VN')} đ
                  </span>
                </Descriptions.Item>
                {processingPayment.depositAmount > 0 && (
                  <Descriptions.Item label="Đã cọc trước">
                    <Tag color="green">
                      -{processingPayment.depositAmount?.toLocaleString('vi-VN')} đ
                    </Tag>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Số tiền cần thanh toán">
                  <strong style={{ fontSize: 16, color: '#1890ff' }}>
                    {processingPayment.finalAmount?.toLocaleString('vi-VN')} đ
                  </strong>
                </Descriptions.Item>
                {processingPayment.depositAmount === 0 && (
                  <Descriptions.Item label="Ghi chú">
                    <Tag color="default">Chưa có cọc trước</Tag>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Warning nếu chưa có method */}
            {!processingPayment.method && (
              <Alert
                message="Phương thức thanh toán chưa được chọn"
                description="Vui lòng chọn phương thức thanh toán phù hợp bên dưới trước khi xác nhận."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <Space>
                  <span style={{ fontWeight: 'bold' }}>Chọn phương thức thanh toán:</span>
                  {/* {processingPayment.method && (
                    <Tag color="blue">Hiện tại: {getMethodText(processingPayment.method)}</Tag>
                  )} */}
                </Space>
              </div>
              <Select
                value={selectedPaymentMethod}
                onChange={setSelectedPaymentMethod}
                style={{ width: '100%' }}
                size="large"
              >
                <Option value="cash">
                  <Space>
                    <DollarOutlined />
                    <span>Tiền mặt</span>
                  </Space>
                </Option>
                <Option value="vnpay">
                  <Space>
                    <span style={{ color: '#1890ff' }}>💳</span>
                    <span>VNPay (Chuyển khoản)</span>
                  </Space>
                </Option>
                <Option value="stripe">
                  <Space>
                    <span style={{ color: '#635bff' }}>💳</span>
                    <span>Stripe (Thẻ quốc tế)</span>
                  </Space>
                </Option>
              </Select>
            </div>

            {selectedPaymentMethod === 'cash' && (
              <Card size="small" style={{ background: '#fffbe6' }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Space>
                    <DollarOutlined style={{ color: '#faad14' }} />
                    <span>
                      Vui lòng xác nhận đã nhận đủ <strong>{processingPayment.finalAmount?.toLocaleString('vi-VN')} đ</strong> tiền mặt từ bệnh nhân
                    </span>
                  </Space>

                  <div>
                    <span style={{ fontWeight: 500 }}>Số tiền phải thanh toán:</span>
                    <InputNumber
                      style={{ width: '100%', marginTop: 8 }}
                      value={processingPayment.finalAmount}
                      disabled={true}
                      formatter={(value) => {
                        if (value === null || value === undefined || value === '') {
                          return '₫ ';
                        }
                        return `₫ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                      }}
                      parser={(value) => (value ? value.replace(/₫\s?|,/g, '') : '')}
                    />
                  </div>

                  <div>
                    <span style={{ fontWeight: 500 }}>Ghi chú (tùy chọn):</span>
                    <TextArea
                      value={cashNotes}
                      onChange={(e) => setCashNotes(e.target.value)}
                      placeholder="Ví dụ: bệnh nhân thanh toán đủ tiền mặt, đã khấu trừ tiền cọc, v.v."
                      rows={2}
                      style={{ marginTop: 8 }}
                    />
                  </div>

                  <Divider style={{ margin: '8px 0' }} />

                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <span>Tổng tiền cần thanh toán:</span>
                    <strong>{processingPayment.finalAmount?.toLocaleString('vi-VN')} đ</strong>
                  </Space>
                </Space>
              </Card>
            )}

            {selectedPaymentMethod === 'vnpay' && (
              <Card size="small" style={{ background: '#e6f7ff' }}>
                <Space>
                  <span>💳</span>
                  <span>
                    Bệnh nhân sẽ được chuyển đến trang thanh toán VNPay để quét mã QR hoặc nhập thông tin thẻ
                  </span>
                </Space>
              </Card>
            )}

            {selectedPaymentMethod === 'stripe' && (
              <Card size="small" style={{ background: '#f0e6ff' }}>
                <Space>
                  <span>💳</span>
                  <span>
                    Bệnh nhân sẽ được chuyển đến trang thanh toán Stripe để nhập thông tin thẻ quốc tế (Visa/Mastercard)
                  </span>
                </Space>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentList;

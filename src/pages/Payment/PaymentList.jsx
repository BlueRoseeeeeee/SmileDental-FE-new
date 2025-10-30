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
  Spin
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
  confirmPayment,
  cancelPayment
} from '../../services/payment.api';

const { RangePicker } = DatePicker;
const { Option } = Select;

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
    method: null,
    type: null,
    fromDate: null,
    toDate: null,
    keyword: ''
  });

  // Detail modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [pagination.current, pagination.pageSize, filters]);

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

      const response = await getPayments(params);
      
      if (response.success) {
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
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
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
      method: null,
      type: null,
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

  const handleConfirmPayment = async (paymentId) => {
    Modal.confirm({
      title: 'Xác nhận thanh toán',
      content: 'Bạn có chắc chắn muốn xác nhận thanh toán này?',
      onOk: async () => {
        try {
          const response = await confirmPayment(paymentId);
          if (response.success) {
            message.success('Xác nhận thanh toán thành công');
            fetchPayments();
          }
        } catch (error) {
          message.error('Không thể xác nhận thanh toán');
        }
      }
    });
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
      visa: 'gold'
    };
    return colors[method] || 'default';
  };

  const getMethodText = (method) => {
    const texts = {
      cash: 'Tiền mặt',
      vnpay: 'VNPay',
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
      width: 150,
      fixed: 'left',
      render: (code) => <strong>{code}</strong>
    },
    {
      title: 'Bệnh nhân',
      dataIndex: ['patientInfo', 'name'],
      key: 'patientName',
      width: 180,
      render: (name, record) => (
        <div>
          <div>{name}</div>
          <small style={{ color: '#888' }}>{record.patientInfo?.phone}</small>
        </div>
      )
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => (
        <Tag color={getTypeColor(type)}>
          {getTypeText(type)}
        </Tag>
      )
    },
    {
      title: 'Phương thức',
      dataIndex: 'method',
      key: 'method',
      width: 130,
      render: (method) => (
        <Tag color={getMethodColor(method)}>
          {getMethodText(method)}
        </Tag>
      )
    },
    {
      title: 'Số tiền',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      width: 150,
      align: 'right',
      render: (amount, record) => (
        <div>
          <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
            {amount?.toLocaleString('vi-VN')} đ
          </div>
          {record.discountAmount > 0 && (
            <small style={{ color: '#999', textDecoration: 'line-through' }}>
              {record.originalAmount?.toLocaleString('vi-VN')} đ
            </small>
          )}
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
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
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Người xử lý',
      dataIndex: 'processedByName',
      key: 'processedByName',
      width: 150
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="Xác nhận">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                onClick={() => handleConfirmPayment(record._id)}
                style={{ color: '#52c41a' }}
              />
            </Tooltip>
          )}
          {['pending', 'processing'].includes(record.status) && (
            <Tooltip title="Hủy">
              <Button
                type="text"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleCancelPayment(record._id)}
              />
            </Tooltip>
          )}
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
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Tìm theo mã hoặc tên BN..."
                prefix={<SearchOutlined />}
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
                onPressEnter={handleSearch}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
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
                <Option value="failed">Thất bại</Option>
                <Option value="cancelled">Đã hủy</Option>
                <Option value="refunded">Đã hoàn tiền</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Phương thức"
                style={{ width: '100%' }}
                value={filters.method}
                onChange={(value) => handleFilterChange('method', value)}
                allowClear
              >
                <Option value="cash">Tiền mặt</Option>
                <Option value="vnpay">VNPay</Option>
                <Option value="visa">VISA/Mastercard</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Loại"
                style={{ width: '100%' }}
                value={filters.type}
                onChange={(value) => handleFilterChange('type', value)}
                allowClear
              >
                <Option value="payment">Thanh toán</Option>
                <Option value="refund">Hoàn tiền</Option>
                <Option value="deposit">Đặt cọc</Option>
                <Option value="adjustment">Điều chỉnh</Option>
              </Select>
            </Col>
            <Col xs={24} sm={24} md={6}>
              <RangePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder={['Từ ngày', 'Đến ngày']}
                onChange={(dates) => {
                  if (dates) {
                    handleFilterChange('fromDate', dates[0]?.toISOString());
                    handleFilterChange('toDate', dates[1]?.toISOString());
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
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                Tìm kiếm
              </Button>
            </Col>
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
          scroll={{ x: 1400 }}
          size="small"
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
    </div>
  );
};

export default PaymentList;

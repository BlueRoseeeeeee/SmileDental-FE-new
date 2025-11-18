import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space,
  Typography,
  Modal,
  Descriptions,
  message,
  Empty,
  Select,
  DatePicker,
  Row,
  Col
} from 'antd';
import { 
  FileTextOutlined,
  EyeOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import invoiceService from '../../services/invoiceService';
import dayjs from 'dayjs';
import './PatientInvoices.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const PatientInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

  useEffect(() => {
    if (user?._id) {
      loadInvoices();
    }
  }, [user]);

  useEffect(() => {
    filterInvoices();
  }, [invoices, statusFilter, dateRange, paymentMethodFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      // Use the my-invoices endpoint for patients
      const response = await invoiceService.getMyInvoices({
        page: 1,
        limit: 1000,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      if (response.success && response.data) {
        const invoiceList = response.data.invoices || response.data || [];
        setInvoices(invoiceList);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('Load invoices error:', error);
      message.error('Không thể tải danh sách hóa đơn');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(inv => {
        const invDate = dayjs(inv.createdAt);
        return invDate.isSameOrAfter(dateRange[0], 'day') && 
               invDate.isSameOrBefore(dateRange[1], 'day');
      });
    }

    // Filter by payment method
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(inv => 
        inv.paymentMethod?.toLowerCase() === paymentMethodFilter.toLowerCase()
      );
    }

    setFilteredInvoices(filtered);
  };

  const getInvoiceStatusTag = (status) => {
    const statusConfig = {
      draft: { color: 'default', text: 'Nháp' },
      pending: { color: 'warning', text: 'Chờ thanh toán' },
      paid: { color: 'success', text: 'Đã thanh toán' },
      partial_paid: { color: 'processing', text: 'Thanh toán 1 phần' },
      overdue: { color: 'error', text: 'Quá hạn' },
      cancelled: { color: 'default', text: 'Đã hủy' },
      refunded: { color: 'purple', text: 'Đã hoàn tiền' }
    };
    
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getPaymentMethodTag = (method) => {
    if (!method) return <Tag>N/A</Tag>;
    
    const methodConfig = {
      cash: { color: 'green', text: 'Tiền mặt' },
      bank_transfer: { color: 'blue', text: 'Chuyển khoản' },
      credit_card: { color: 'purple', text: 'Thẻ tín dụng' },
      vnpay: { color: 'cyan', text: 'VNPay' },
      momo: { color: 'magenta', text: 'Momo' }
    };
    
    const config = methodConfig[method.toLowerCase()] || { color: 'default', text: method };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleViewDetail = async (invoice) => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoiceById(invoice._id);
      
      if (response.success && response.data) {
        setSelectedInvoice(response.data);
        setDetailModalVisible(true);
      }
    } catch (error) {
      console.error('Get invoice detail error:', error);
      message.error('Không thể tải chi tiết hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (invoiceId) => {
    try {
      setLoading(true);
      await invoiceService.downloadInvoicePDF(invoiceId);
      message.success('Đang tải xuống hóa đơn...');
    } catch (error) {
      console.error('Download invoice error:', error);
      message.error('Không thể tải xuống hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStatusFilter('all');
    setDateRange(null);
    setPaymentMethodFilter('all');
  };

  const columns = [
    {
      title: 'Mã hóa đơn',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 170,
      fixed: 'left',
      render: (code) => <Text strong>{code || 'N/A'}</Text>
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => {
        const typeMap = {
          appointment: 'Cuộc hẹn',
          treatment: 'Điều trị',
          consultation: 'Tư vấn',
          emergency: 'Cấp cứu',
          checkup: 'Kiểm tra'
        };
        return typeMap[type] || type;
      }
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right',
      render: (amount) => (
        <Text strong style={{ color: '#1890ff' }}>
          {(amount || 0).toLocaleString('vi-VN')}đ
        </Text>
      )
    },
    {
      title: 'Phương thức',
      key: 'paymentMethod',
      width: 130,
      render: (_, record) => getPaymentMethodTag(record.paymentSummary?.paymentMethod)
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => getInvoiceStatusTag(status)
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            Xem
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadPDF(record._id)}
          >
            PDF
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="patient-invoices-page">
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0 }}>Hóa đơn của tôi</Title>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadInvoices} loading={loading}>
              Làm mới
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="pending">Chờ thanh toán</Option>
              <Option value="paid">Đã thanh toán</Option>
              <Option value="partial_paid">Thanh toán 1 phần</Option>
              <Option value="overdue">Quá hạn</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Phương thức"
              value={paymentMethodFilter}
              onChange={setPaymentMethodFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">Tất cả phương thức</Option>
              <Option value="cash">Tiền mặt</Option>
              <Option value="bank_transfer">Chuyển khoản</Option>
              <Option value="credit_card">Thẻ tín dụng</Option>
              <Option value="vnpay">VNPay</Option>
              <Option value="momo">Momo</Option>
            </Select>
          </Col>

          <Col xs={24} sm={8} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              value={dateRange}
              onChange={setDateRange}
              placeholder={['Từ ngày', 'Đến ngày']}
            />
          </Col>

          <Col xs={24} sm={24} md={4}>
            <Button block onClick={handleReset}>
              Xóa lọc
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredInvoices}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} hóa đơn`,
            showSizeChanger: true
          }}
          locale={{
            emptyText: (
              <Empty
                description="Chưa có hóa đơn nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Invoice Detail Modal */}
      <Modal
        title={<Space><FileTextOutlined /> Chi tiết hóa đơn</Space>}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button 
            key="download" 
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadPDF(selectedInvoice?._id)}
          >
            Tải PDF
          </Button>,
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        {selectedInvoice && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Mã hóa đơn" span={2}>
                <Text strong>{selectedInvoice.invoiceNumber || 'N/A'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {dayjs(selectedInvoice.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn thanh toán">
                {selectedInvoice.dueDate 
                  ? dayjs(selectedInvoice.dueDate).format('DD/MM/YYYY')
                  : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Bệnh nhân" span={2}>
                {selectedInvoice.patientInfo?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Điện thoại">
                {selectedInvoice.patientInfo?.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedInvoice.patientInfo?.email || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Nha sĩ" span={2}>
                {selectedInvoice.dentistInfo?.name || 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            {/* Invoice Items */}
            {selectedInvoice.details && selectedInvoice.details.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>
                  Chi tiết dịch vụ
                </Title>
                <Table
                  size="small"
                  columns={[
                    {
                      title: 'Dịch vụ',
                      dataIndex: ['serviceInfo', 'name'],
                      key: 'service',
                      render: (name, record) => (
                        <div>
                          <div>{name || record.description || 'N/A'}</div>
                          {record.notes && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {record.notes}
                            </Text>
                          )}
                        </div>
                      )
                    },
                    {
                      title: 'SL',
                      dataIndex: 'quantity',
                      key: 'quantity',
                      width: 60,
                      align: 'center'
                    },
                    {
                      title: 'Đơn giá',
                      dataIndex: 'unitPrice',
                      key: 'unitPrice',
                      width: 120,
                      align: 'right',
                      render: (price) => `${(price || 0).toLocaleString('vi-VN')}đ`
                    },
                    {
                      title: 'Giảm giá',
                      dataIndex: 'discountAmount',
                      key: 'discountAmount',
                      width: 100,
                      align: 'right',
                      render: (amount) => amount > 0 ? `${amount.toLocaleString('vi-VN')}đ` : '-'
                    },
                    {
                      title: 'Thành tiền',
                      dataIndex: 'totalPrice',
                      key: 'totalPrice',
                      width: 130,
                      align: 'right',
                      render: (price) => (
                        <Text strong>{(price || 0).toLocaleString('vi-VN')}đ</Text>
                      )
                    }
                  ]}
                  dataSource={selectedInvoice.details}
                  rowKey={(item) => item._id}
                  pagination={false}
                />
              </>
            )}

            {/* Payment Summary */}
            <Descriptions bordered column={1} style={{ marginTop: 24 }}>
              <Descriptions.Item label="Tạm tính">
                {(selectedInvoice.subtotal || 0).toLocaleString('vi-VN')}đ
              </Descriptions.Item>
              {selectedInvoice.discountInfo && selectedInvoice.discountInfo.value > 0 && (
                <>
                  <Descriptions.Item label="Giảm giá">
                    -{selectedInvoice.discountInfo.type === 'percentage' 
                      ? `${selectedInvoice.discountInfo.value}%` 
                      : `${selectedInvoice.discountInfo.value.toLocaleString('vi-VN')}đ`}
                  </Descriptions.Item>
                  {selectedInvoice.discountInfo.reason && (
                    <Descriptions.Item label="Lý do giảm giá">
                      {selectedInvoice.discountInfo.reason}
                    </Descriptions.Item>
                  )}
                </>
              )}
              {selectedInvoice.taxInfo && selectedInvoice.taxInfo.taxAmount > 0 && (
                <Descriptions.Item label={`Thuế (${selectedInvoice.taxInfo.taxRate}%)`}>
                  {selectedInvoice.taxInfo.taxAmount.toLocaleString('vi-VN')}đ
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Tổng cộng">
                <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                  {(selectedInvoice.totalAmount || 0).toLocaleString('vi-VN')}đ
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Đã thanh toán">
                <Text style={{ color: '#52c41a' }}>
                  {(selectedInvoice.paymentSummary?.totalPaid || 0).toLocaleString('vi-VN')}đ
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Còn lại">
                <Text strong style={{ 
                  fontSize: 16, 
                  color: (selectedInvoice.paymentSummary?.remainingAmount || 0) > 0 ? '#ff4d4f' : '#52c41a' 
                }}>
                  {(selectedInvoice.paymentSummary?.remainingAmount || 0).toLocaleString('vi-VN')}đ
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Phương thức thanh toán">
                {getPaymentMethodTag(selectedInvoice.paymentSummary?.paymentMethod)}
              </Descriptions.Item>
              {selectedInvoice.paymentSummary?.lastPaymentDate && (
                <Descriptions.Item label="Ngày thanh toán cuối">
                  {dayjs(selectedInvoice.paymentSummary.lastPaymentDate).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Ngày xuất hóa đơn">
                {selectedInvoice.issueDate 
                  ? dayjs(selectedInvoice.issueDate).format('DD/MM/YYYY HH:mm')
                  : 'N/A'}
              </Descriptions.Item>
              {selectedInvoice.paidDate && (
                <Descriptions.Item label="Ngày thanh toán">
                  {dayjs(selectedInvoice.paidDate).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Loại hóa đơn">
                <Tag color="blue">
                  {selectedInvoice.type === 'appointment' ? 'Cuộc hẹn' : 
                   selectedInvoice.type === 'treatment' ? 'Điều trị' : 
                   selectedInvoice.type}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {getInvoiceStatusTag(selectedInvoice.status)}
              </Descriptions.Item>
            </Descriptions>

            {selectedInvoice.notes && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Ghi chú:</Text>
                <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                  {selectedInvoice.notes}
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default PatientInvoices;

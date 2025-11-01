/**
 * CancelledPatients.jsx
 * Page hiển thị danh sách lịch đóng cửa khẩn cấp và bệnh nhân bị hủy
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Typography,
  DatePicker,
  Input,
  Row,
  Col,
  Statistic,
  Descriptions,
  Collapse,
  Empty,
  Spin
} from 'antd';
import {
  CalendarOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  DollarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import dayClosureService from '../../services/dayClosureService';
import paymentService from '../../services/paymentService';
import invoiceService from '../../services/invoiceService';
import { toast } from 'react-toastify';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const CancelledPatients = () => {
  const [loading, setLoading] = useState(false);
  const [closures, setClosures] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    status: 'all'
  });

  const [detailModal, setDetailModal] = useState({
    visible: false,
    loading: false,
    data: null,
    patients: []
  });

  const [paymentModal, setPaymentModal] = useState({
    visible: false,
    loading: false,
    data: null
  });

  const [invoiceModal, setInvoiceModal] = useState({
    visible: false,
    loading: false,
    data: null
  });

  // Load closures
  const loadClosures = async (page = 1) => {
    try {
      setLoading(true);
      
      const queryFilters = {
        page,
        limit: pagination.pageSize,
        ...(filters.startDate && { startDate: filters.startDate.format('YYYY-MM-DD') }),
        ...(filters.endDate && { endDate: filters.endDate.format('YYYY-MM-DD') }),
        ...(filters.status !== 'all' && { status: filters.status })
      };

      const result = await dayClosureService.getDayClosures(queryFilters);
      
      if (result.success) {
        setClosures(result.data);
        setPagination({
          current: result.pagination.page,
          pageSize: result.pagination.limit,
          total: result.pagination.total
        });
      } else {
        toast.error(result.message || 'Không thể tải dữ liệu');
      }
    } catch (error) {
      console.error('Error loading closures:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  // Load closure details
  const loadClosureDetails = async (closureId) => {
    try {
      setDetailModal(prev => ({ ...prev, loading: true }));
      
      const [detailResult, patientsResult] = await Promise.all([
        dayClosureService.getDayClosureById(closureId),
        dayClosureService.getCancelledPatients(closureId)
      ]);

      if (detailResult.success && patientsResult.success) {
        setDetailModal({
          visible: true,
          loading: false,
          data: detailResult.data,
          patients: patientsResult.data.patients || []
        });
      } else {
        toast.error('Không thể tải chi tiết');
        setDetailModal({ visible: false, loading: false, data: null, patients: [] });
      }
    } catch (error) {
      console.error('Error loading details:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi tải chi tiết');
      setDetailModal({ visible: false, loading: false, data: null, patients: [] });
    }
  };

  // Load payment details
  const loadPaymentDetails = async (paymentId) => {
    try {
      setPaymentModal({ visible: true, loading: true, data: null });
      const result = await paymentService.getPaymentById(paymentId);
      if (result.success) {
        setPaymentModal({ visible: true, loading: false, data: result.data });
      } else {
        toast.error('Không thể tải thông tin thanh toán');
        setPaymentModal({ visible: false, loading: false, data: null });
      }
    } catch (error) {
      console.error('Error loading payment:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi tải thanh toán');
      setPaymentModal({ visible: false, loading: false, data: null });
    }
  };

  // Load invoice details
  const loadInvoiceDetails = async (invoiceId) => {
    try {
      setInvoiceModal({ visible: true, loading: true, data: null });
      const result = await invoiceService.getInvoiceById(invoiceId);
      if (result.success) {
        setInvoiceModal({ visible: true, loading: false, data: result.data });
      } else {
        toast.error('Không thể tải thông tin hóa đơn');
        setInvoiceModal({ visible: false, loading: false, data: null });
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi tải hóa đơn');
      setInvoiceModal({ visible: false, loading: false, data: null });
    }
  };

  useEffect(() => {
    loadClosures();
  }, []);

  // Columns for main table
  const columns = [
    {
      title: 'Ngày Đóng Cửa',
      dataIndex: 'formattedDate',
      key: 'date',
      width: 120,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(record.date).format('dddd')}
          </Text>
        </Space>
      )
    },
    {
      title: 'Lý Do',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      width: 250
    },
    {
      title: 'Thống Kê',
      key: 'stats',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Space size={8}>
            <HomeOutlined style={{ color: '#1890ff' }} />
            <Text style={{ fontSize: 12 }}>
              {record.stats?.affectedRoomsCount || 0} phòng
            </Text>
          </Space>
          <Space size={8}>
            <CalendarOutlined style={{ color: '#52c41a' }} />
            <Text style={{ fontSize: 12 }}>
              {record.stats?.totalSlotsDisabled || 0} slots
            </Text>
          </Space>
          <Space size={8}>
            <UserOutlined style={{ color: '#fa8c16' }} />
            <Text style={{ fontSize: 12 }}>
              {record.totalPatients || 0} bệnh nhân
            </Text>
          </Space>
          <Space size={8}>
            <MailOutlined style={{ color: '#722ed1' }} />
            <Text style={{ fontSize: 12 }}>
              {record.stats?.emailsSentCount || 0} emails
            </Text>
          </Space>
        </Space>
      )
    },
    {
      title: 'Người Thực Hiện',
      dataIndex: ['closedBy', 'userName'],
      key: 'closedBy',
      width: 150,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text || 'N/A'}</Text>
          <Tag color="blue">{record.closedBy?.userRole || 'admin'}</Tag>
        </Space>
      )
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const statusConfig = {
          active: { color: 'red', text: 'Đang đóng' },
          partially_restored: { color: 'orange', text: 'Phục hồi một phần' },
          fully_restored: { color: 'green', text: 'Đã mở lại' }
        };
        const config = statusConfig[status] || statusConfig.active;
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: 'Thời Gian Tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => loadClosureDetails(record._id)}
        >
          Chi tiết
        </Button>
      )
    }
  ];

  // Columns for patient detail table
  const patientColumns = [
    {
      title: 'Bệnh Nhân',
      key: 'patient',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.patientName}</Text>
          {record.patientPhone && (
            <Space size={4}>
              <PhoneOutlined style={{ fontSize: 12 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.patientPhone}
              </Text>
            </Space>
          )}
        </Space>
      )
    },
    {
      title: 'Thời Gian Hẹn',
      key: 'appointment',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space size={4}>
            <ClockCircleOutlined />
            <Text>{record.appointmentTime}</Text>
          </Space>
          <Tag color="blue">{record.shiftName}</Tag>
        </Space>
      )
    },
    {
      title: 'Nha Sĩ',
      dataIndex: 'dentists',
      key: 'dentists',
      width: 150,
      render: (dentists) => dentists || 'N/A'
    },
    {
      title: 'Y Tá',
      dataIndex: 'nurses',
      key: 'nurses',
      width: 150,
      render: (nurses) => nurses || 'N/A'
    },
    {
      title: 'Thanh Toán',
      key: 'payment',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const paymentId = record.paymentInfo?.paymentId;
        
        if (paymentId) {
          return (
            <Button
              type="link"
              size="small"
              icon={<DollarOutlined />}
              onClick={() => loadPaymentDetails(paymentId)}
            >
              Xem
            </Button>
          );
        } else {
          return <Text type="secondary">Chưa có</Text>;
        }
      }
    },
    {
      title: 'Hóa Đơn',
      key: 'invoice',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const invoiceId = record.invoiceInfo?.invoiceId;
        
        if (invoiceId) {
          return (
            <Button
              type="link"
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => loadInvoiceDetails(invoiceId)}
            >
              Xem
            </Button>
          );
        } else {
          return <Text type="secondary">Chưa có</Text>;
        }
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3}>
              <CloseCircleOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
              Lịch Sử Đóng Cửa Khẩn Cấp
            </Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadClosures(pagination.current)}
            >
              Làm mới
            </Button>
          </div>

          {/* Filters */}
          <Row gutter={16}>
            <Col span={12}>
              <Space>
                <Text strong>Khoảng thời gian:</Text>
                <RangePicker
                  value={[filters.startDate, filters.endDate]}
                  onChange={(dates) => {
                    setFilters({
                      ...filters,
                      startDate: dates?.[0] || null,
                      endDate: dates?.[1] || null
                    });
                  }}
                  format="DD/MM/YYYY"
                  placeholder={['Từ ngày', 'Đến ngày']}
                />
              </Space>
            </Col>
            <Col span={12}>
              <Space>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => loadClosures(1)}
                >
                  Tìm kiếm
                </Button>
                <Button
                  onClick={() => {
                    setFilters({ startDate: null, endDate: null, status: 'all' });
                    setTimeout(() => loadClosures(1), 0);
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </Space>
            </Col>
          </Row>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={closures}
            rowKey="_id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} bản ghi`
            }}
            onChange={(newPagination) => {
              loadClosures(newPagination.current);
            }}
            scroll={{ x: 1400 }}
          />
        </Space>
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            <span>Chi Tiết Lịch Đóng Cửa</span>
          </Space>
        }
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, loading: false, data: null, patients: [] })}
        footer={[
          <Button
            key="close"
            onClick={() => setDetailModal({ visible: false, loading: false, data: null, patients: [] })}
          >
            Đóng
          </Button>
        ]}
        width={1200}
        style={{ top: 20 }}
      >
        {detailModal.loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : detailModal.data ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Summary Info */}
            <Card size="small" style={{ background: '#f5f5f5' }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Ngày đóng cửa">
                  <Text strong>{detailModal.data.formattedDate}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {detailModal.data.status === 'active' && <Tag color="red">Đang đóng</Tag>}
                  {detailModal.data.status === 'partially_restored' && <Tag color="orange">Phục hồi một phần</Tag>}
                  {detailModal.data.status === 'fully_restored' && <Tag color="green">Đã mở lại</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label="Lý do" span={2}>
                  {detailModal.data.reason}
                </Descriptions.Item>
                <Descriptions.Item label="Người thực hiện">
                  {detailModal.data.closedBy?.userName || 'N/A'}
                  {' '}
                  <Tag color="blue">{detailModal.data.closedBy?.userRole || 'admin'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian tạo">
                  {dayjs(detailModal.data.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Statistics */}
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Tổng Slots Bị Tắt"
                  value={detailModal.data.stats?.totalSlotsDisabled || 0}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Bệnh Nhân Bị Hủy"
                  value={detailModal.data.stats?.appointmentsCancelledCount || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Email Đã Gửi"
                  value={detailModal.data.stats?.emailsSentCount || 0}
                  prefix={<MailOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>

            {/* Patient List */}
            <Card
              title={
                <Space>
                  <UserOutlined />
                  <span>Danh Sách Bệnh Nhân Bị Hủy ({detailModal.patients.length})</span>
                </Space>
              }
              size="small"
            >
              {detailModal.patients.length > 0 ? (
                <Table
                  columns={patientColumns}
                  dataSource={detailModal.patients}
                  rowKey="appointmentId"
                  pagination={{ pageSize: 10 }}
                  size="small"
                  scroll={{ x: 1200 }}
                />
              ) : (
                <Empty description="Không có bệnh nhân nào bị hủy" />
              )}
            </Card>
          </Space>
        ) : (
          <Empty description="Không có dữ liệu" />
        )}
      </Modal>

      {/* Payment Detail Modal */}
      <Modal
        title={
          <Space>
            <DollarOutlined />
            <span>Chi Tiết Thanh Toán</span>
          </Space>
        }
        open={paymentModal.visible}
        onCancel={() => setPaymentModal({ visible: false, loading: false, data: null })}
        footer={[
          <Button
            key="close"
            onClick={() => setPaymentModal({ visible: false, loading: false, data: null })}
          >
            Đóng
          </Button>
        ]}
        width={800}
      >
        {paymentModal.loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : paymentModal.data ? (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Mã thanh toán" span={2}>
              <Text strong copyable>{paymentModal.data.paymentCode}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={
                paymentModal.data.status === 'completed' ? 'green' :
                paymentModal.data.status === 'pending' ? 'orange' :
                paymentModal.data.status === 'failed' ? 'red' : 'default'
              }>
                {paymentModal.data.status === 'completed' ? 'Hoàn thành' :
                 paymentModal.data.status === 'pending' ? 'Đang xử lý' :
                 paymentModal.data.status === 'failed' ? 'Thất bại' :
                 paymentModal.data.status === 'cancelled' ? 'Đã hủy' :
                 paymentModal.data.status === 'refunded' ? 'Đã hoàn tiền' :
                 paymentModal.data.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Phương thức">
              <Tag color="blue">
                {paymentModal.data.method === 'cash' ? 'Tiền mặt' :
                 paymentModal.data.method === 'vnpay' ? 'VNPay' :
                 paymentModal.data.method === 'visa' ? 'VISA' :
                 paymentModal.data.method}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Bệnh nhân">
              {paymentModal.data.patientInfo?.name || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {paymentModal.data.patientInfo?.phone || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Email" span={2}>
              {paymentModal.data.patientInfo?.email || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền gốc">
              <Text strong style={{ color: '#1890ff' }}>
                {paymentModal.data.originalAmount?.toLocaleString('vi-VN')} VNĐ
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Giảm giá">
              <Text type="danger">
                -{paymentModal.data.discountAmount?.toLocaleString('vi-VN')} VNĐ
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Thuế">
              {paymentModal.data.taxAmount?.toLocaleString('vi-VN')} VNĐ
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                {paymentModal.data.finalAmount?.toLocaleString('vi-VN')} VNĐ
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Đã thanh toán">
              <Text style={{ color: '#52c41a' }}>
                {paymentModal.data.paidAmount?.toLocaleString('vi-VN')} VNĐ
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tiền thối">
              {paymentModal.data.changeAmount?.toLocaleString('vi-VN')} VNĐ
            </Descriptions.Item>
            <Descriptions.Item label="Người xử lý">
              {paymentModal.data.processedByName || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian xử lý">
              {dayjs(paymentModal.data.processedAt).format('DD/MM/YYYY HH:mm:ss')}
            </Descriptions.Item>
            {paymentModal.data.description && (
              <Descriptions.Item label="Mô tả" span={2}>
                {paymentModal.data.description}
              </Descriptions.Item>
            )}
            {paymentModal.data.notes && (
              <Descriptions.Item label="Ghi chú" span={2}>
                {paymentModal.data.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        ) : (
          <Empty description="Không có dữ liệu" />
        )}
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>Chi Tiết Hóa Đơn</span>
          </Space>
        }
        open={invoiceModal.visible}
        onCancel={() => setInvoiceModal({ visible: false, loading: false, data: null })}
        footer={[
          <Button
            key="close"
            onClick={() => setInvoiceModal({ visible: false, loading: false, data: null })}
          >
            Đóng
          </Button>
        ]}
        width={800}
      >
        {invoiceModal.loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : invoiceModal.data ? (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Số hóa đơn" span={2}>
              <Text strong copyable>{invoiceModal.data.invoiceNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={
                invoiceModal.data.status === 'paid' ? 'green' :
                invoiceModal.data.status === 'pending' ? 'orange' :
                invoiceModal.data.status === 'partial_paid' ? 'blue' :
                invoiceModal.data.status === 'cancelled' ? 'red' : 'default'
              }>
                {invoiceModal.data.status === 'paid' ? 'Đã thanh toán' :
                 invoiceModal.data.status === 'pending' ? 'Chờ thanh toán' :
                 invoiceModal.data.status === 'partial_paid' ? 'Thanh toán một phần' :
                 invoiceModal.data.status === 'draft' ? 'Nháp' :
                 invoiceModal.data.status === 'cancelled' ? 'Đã hủy' :
                 invoiceModal.data.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Loại hóa đơn">
              <Tag color="purple">
                {invoiceModal.data.type === 'appointment' ? 'Lịch hẹn' :
                 invoiceModal.data.type === 'treatment' ? 'Điều trị' :
                 invoiceModal.data.type === 'consultation' ? 'Tư vấn' :
                 invoiceModal.data.type}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Bệnh nhân">
              {invoiceModal.data.patientInfo?.name || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {invoiceModal.data.patientInfo?.phone || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Email" span={2}>
              {invoiceModal.data.patientInfo?.email || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Nha sĩ">
              {invoiceModal.data.dentistInfo?.name || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Chuyên khoa">
              {invoiceModal.data.dentistInfo?.specialization || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng phụ">
              <Text style={{ color: '#1890ff' }}>
                {invoiceModal.data.subtotal?.toLocaleString('vi-VN')} VNĐ
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Giảm giá">
              {invoiceModal.data.discountInfo?.type !== 'none' ? (
                <Text type="danger">
                  {invoiceModal.data.discountInfo?.type === 'percentage' 
                    ? `-${invoiceModal.data.discountInfo?.value}%`
                    : `-${invoiceModal.data.discountInfo?.value?.toLocaleString('vi-VN')} VNĐ`
                  }
                </Text>
              ) : (
                <Text type="secondary">Không có</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Thuế ({invoiceModal.data.taxInfo?.taxRate || 0}%)">
              {invoiceModal.data.taxInfo?.taxAmount?.toLocaleString('vi-VN')} VNĐ
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                {invoiceModal.data.totalAmount?.toLocaleString('vi-VN')} VNĐ
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Đã thanh toán">
              <Text style={{ color: '#52c41a' }}>
                {invoiceModal.data.paymentSummary?.totalPaid?.toLocaleString('vi-VN') || '0'} VNĐ
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Còn lại">
              <Text type={invoiceModal.data.paymentSummary?.remainingAmount > 0 ? 'danger' : 'secondary'}>
                {invoiceModal.data.paymentSummary?.remainingAmount?.toLocaleString('vi-VN') || '0'} VNĐ
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày phát hành">
              {dayjs(invoiceModal.data.issueDate).format('DD/MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày đến hạn">
              {dayjs(invoiceModal.data.dueDate).format('DD/MM/YYYY')}
            </Descriptions.Item>
            {invoiceModal.data.description && (
              <Descriptions.Item label="Mô tả" span={2}>
                {invoiceModal.data.description}
              </Descriptions.Item>
            )}
            {invoiceModal.data.notes && (
              <Descriptions.Item label="Ghi chú" span={2}>
                {invoiceModal.data.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        ) : (
          <Empty description="Không có dữ liệu" />
        )}
      </Modal>
    </div>
  );
};

export default CancelledPatients;

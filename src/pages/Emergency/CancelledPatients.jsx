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
  Spin,
  Divider,
  Select
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

/**
 * 🆕 Group patients by appointmentId and merge time ranges
 * Slots with same appointmentId will be grouped into 1 row
 * Time will show: startTime (earliest) - endTime (latest)
 */
const groupPatientsByAppointment = (patients) => {
  const appointmentMap = new Map();
  
  for (const patient of patients) {
    const appointmentId = patient.appointmentId?.toString();
    
    if (!appointmentId) {
      // No appointmentId - keep as separate entry
      appointmentMap.set(`no-appt-${Math.random()}`, { ...patient, slotsCount: 1 });
      continue;
    }
    
    if (appointmentMap.has(appointmentId)) {
      // Merge: update time range and increment slotsCount
      const existing = appointmentMap.get(appointmentId);
      existing.slotsCount = (existing.slotsCount || 1) + 1;
      
      // Parse time from "HH:mm - HH:mm" format to get start and end
      const currentTimeRange = patient.appointmentTime || '';
      const [currentStart, currentEnd] = currentTimeRange.split(' - ').map(t => t?.trim() || '');
      
      // Update earliest start time
      if (currentStart && (!existing._earliestStart || currentStart < existing._earliestStart)) {
        existing._earliestStart = currentStart;
      }
      // Update latest end time
      if (currentEnd && (!existing._latestEnd || currentEnd > existing._latestEnd)) {
        existing._latestEnd = currentEnd;
      }
    } else {
      // First entry for this appointment
      const timeRange = patient.appointmentTime || '';
      const [start, end] = timeRange.split(' - ').map(t => t?.trim() || '');
      
      appointmentMap.set(appointmentId, {
        ...patient,
        slotsCount: 1,
        _earliestStart: start,
        _latestEnd: end
      });
    }
  }
  
  // Convert Map to Array and format merged time
  return Array.from(appointmentMap.values()).map(patient => {
    // Format merged time: "earliest - latest"
    if (patient._earliestStart && patient._latestEnd) {
      patient.appointmentTime = `${patient._earliestStart} - ${patient._latestEnd}`;
    }
    delete patient._earliestStart;
    delete patient._latestEnd;
    return patient;
  });
};

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
    data: null,
    details: []
  });

  // Load closures
  const loadClosures = async (page = 1) => {
    try {
      setLoading(true);
      
      const queryFilters = {
        page,
        limit: pagination.pageSize
      };

      // Send dates in YYYY-MM-DD format (no timezone conversion needed)
      if (filters.startDate) {
        queryFilters.startDate = filters.startDate.format('YYYY-MM-DD');
      }

      if (filters.endDate) {
        queryFilters.endDate = filters.endDate.format('YYYY-MM-DD');
      }

      if (filters.status !== 'all') {
        queryFilters.status = filters.status;
      }

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
        // 🆕 Group patients by appointmentId for display
        const rawPatients = patientsResult.data.patients || [];
        const groupedPatients = groupPatientsByAppointment(rawPatients);
        
        setDetailModal({
          visible: true,
          loading: false,
          data: detailResult.data,
          patients: groupedPatients
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
      setInvoiceModal({ visible: true, loading: true, data: null, details: [] });
      const result = await invoiceService.getInvoiceById(invoiceId);
      
      if (result.success) {
        // Also fetch invoice details (line items)
        let details = [];
        try {
          const detailsResult = await invoiceService.getInvoiceDetails(invoiceId);
          if (detailsResult.success && detailsResult.data) {
            details = Array.isArray(detailsResult.data) ? detailsResult.data : [detailsResult.data];
          }
        } catch (detailsError) {
          console.error('Error loading invoice details:', detailsError);
        }
        
        setInvoiceModal({ visible: true, loading: false, data: result.data, details });
      } else {
        toast.error('Không thể tải thông tin hóa đơn');
        setInvoiceModal({ visible: false, loading: false, data: null, details: [] });
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi tải hóa đơn');
      setInvoiceModal({ visible: false, loading: false, data: null, details: [] });
    }
  };

  useEffect(() => {
    loadClosures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-search when filters change - always reload regardless of current data
  useEffect(() => {
    // Skip on initial mount (handled by first useEffect)
    const hasFilters = filters.startDate || filters.endDate || filters.status !== 'all';
    if (hasFilters || closures.length > 0) {
      loadClosures(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate, filters.status]);

  // Columns for main table
  const columns = [
    {
      title: 'Ngày Đóng Cửa',
      dataIndex: 'formattedDate',
      key: 'date',
      width: 160,
      fixed: 'left',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            {text}
            {record.formattedDateTo && record.formattedDateTo !== text && (
              <> - {record.formattedDateTo}</>
            )}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(record.date).format('dddd')}
            {record.dateTo && dayjs(record.dateTo).format('YYYY-MM-DD') !== dayjs(record.date).format('YYYY-MM-DD') && (
              <> - {dayjs(record.dateTo).format('dddd')}</>
            )}
          </Text>
        </Space>
      )
    },
    {
      title: 'Lý Do',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: { showTitle: true },
      width: 200
    },
    {
      title: 'Thống Kê',
      key: 'stats',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Space size={4} style={{ fontSize: 12 }}>
            <HomeOutlined style={{ color: '#1890ff' }} />
            <Text style={{ fontSize: 12 }}>
              {record.stats?.affectedRoomsCount || 0} phòng
            </Text>
          </Space>
          <Space size={4} style={{ fontSize: 12 }}>
            <CalendarOutlined style={{ color: '#52c41a' }} />
            <Text style={{ fontSize: 12 }}>
              {record.stats?.totalSlotsDisabled || 0} slots
            </Text>
          </Space>
          <Space size={4} style={{ fontSize: 12 }}>
            <UserOutlined style={{ color: '#fa8c16' }} />
            <Text style={{ fontSize: 12 }}>
              {record.totalPatients || 0} BN
            </Text>
          </Space>
          <Space size={4} style={{ fontSize: 12 }}>
            <MailOutlined style={{ color: '#722ed1' }} />
            <Text style={{ fontSize: 12 }}>
              {record.stats?.emailsSentCount || 0} emails
            </Text>
          </Space>
        </Space>
      )
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusConfig = {
          active: { color: 'red', text: 'Đang đóng' },
          partially_restored: { color: 'orange', text: 'Một phần' },
          fully_restored: { color: 'green', text: 'Đã mở' }
        };
        const config = statusConfig[status] || statusConfig.active;
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: 'Thời Gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>{dayjs(date).format('DD/MM/YYYY')}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(date).format('HH:mm')}</Text>
        </Space>
      )
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
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
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13 }}>{record.patientName}</Text>
          {record.patientPhone && (
            <Space size={4}>
              <PhoneOutlined style={{ fontSize: 11 }} />
              <Text type="secondary" style={{ fontSize: 11 }}>
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
      width: 130,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Space size={4}>
            <ClockCircleOutlined style={{ fontSize: 12 }} />
            <Text style={{ fontSize: 12 }}>{record.appointmentTime}</Text>
          </Space>
          <Space size={4}>
            <Tag color="blue" style={{ fontSize: 11 }}>{record.shiftName}</Tag>
            {record.slotsCount > 1 && (
              <Tag color="purple" style={{ fontSize: 10 }}>{record.slotsCount} slots</Tag>
            )}
          </Space>
        </Space>
      )
    },
    {
      title: 'Nha Sĩ',
      dataIndex: 'dentists',
      key: 'dentists',
      width: 140,
      ellipsis: { showTitle: true },
      render: (dentists) => <Text style={{ fontSize: 12 }}>{dentists || 'N/A'}</Text>
    },
    // {
    //   title: 'Y Tá',
    //   dataIndex: 'nurses',
    //   key: 'nurses',
    //   width: 150,
    //   render: (nurses) => nurses || 'N/A'
    // },
    {
      title: 'Thanh Toán',
      key: 'payment',
      width: 110,
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
              title="Xem chi tiết thanh toán"
              style={{ padding: 0 }}
            >
              Chi tiết
            </Button>
          );
        } else {
          return (
            <Tag color="default" icon={<ClockCircleOutlined />} style={{ fontSize: 11 }}>
              Chưa khám
            </Tag>
          );
        }
      }
    },
    {
      title: 'Hóa Đơn',
      key: 'invoice',
      width: 110,
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
              title="Xem chi tiết hóa đơn"
              style={{ padding: 0 }}
            >
              Chi tiết
            </Button>
          );
        } else {
          return (
            <Tag color="default" icon={<ClockCircleOutlined />} style={{ fontSize: 11 }}>
              Chưa khám
            </Tag>
          );
        }
      }
    }
  ];

  return (
    <div style={{ padding: '16px', maxWidth: '100%', overflow: 'hidden' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <Title level={3} style={{ margin: 0 }}>
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
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={10}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
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
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text strong>Trạng thái:</Text>
                <Select
                  value={filters.status}
                  onChange={(value) => setFilters({ ...filters, status: value })}
                  style={{ width: '100%' }}
                >
                  <Select.Option value="all">Tất cả</Select.Option>
                  <Select.Option value="active">Đang đóng</Select.Option>
                  {/* <Select.Option value="partially_restored">Phục hồi một phần</Select.Option> */}
                  <Select.Option value="fully_restored">Đã mở lại</Select.Option>
                </Select>
              </Space>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Space wrap style={{ marginTop: 24 }}>
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
          <div style={{ overflowX: 'auto' }}>
            <Table
              columns={columns}
              dataSource={closures}
              rowKey="_id"
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} bản ghi`,
                responsive: true
              }}
              onChange={(newPagination) => {
                loadClosures(newPagination.current);
              }}
              scroll={{ x: 1200 }}
              size="middle"
            />
          </div>
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
        width="90%"
        style={{ top: 20, maxWidth: 1400 }}
        bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
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
                  <Text strong>
                    {detailModal.data.formattedDate}
                    {detailModal.data.formattedDateTo && detailModal.data.formattedDateTo !== detailModal.data.formattedDate && (
                      <> - {detailModal.data.formattedDateTo}</>
                    )}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {detailModal.data.status === 'active' && <Tag color="red">Đang đóng</Tag>}
                  {/* {detailModal.data.status === 'partially_restored' && <Tag color="orange">Phục hồi một phần</Tag>} */}
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
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Tổng Slots Bị Tắt"
                  value={detailModal.data.stats?.totalSlotsDisabled || 0}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Bệnh Nhân Bị Hủy"
                  value={detailModal.data.stats?.appointmentsCancelledCount || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#fa8c16', fontSize: '20px' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Email Đã Gửi"
                  value={detailModal.data.stats?.emailsSentCount || 0}
                  prefix={<MailOutlined />}
                  valueStyle={{ color: '#722ed1', fontSize: '20px' }}
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
                <div style={{ overflowX: 'auto' }}>
                  <Table
                    columns={patientColumns}
                    dataSource={detailModal.patients}
                    rowKey="appointmentId"
                    pagination={{ pageSize: 10, responsive: true }}
                    size="small"
                    scroll={{ x: 800 }}
                  />
                </div>
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
        width="90%"
        style={{ maxWidth: 800 }}
      >
        {paymentModal.loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : paymentModal.data ? (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Mã thanh toán" span={2}>
              <Text strong copyable>{paymentModal.data._id || paymentModal.data.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền">
              <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                {paymentModal.data.finalAmount?.toLocaleString('vi-VN') || '0'} VNĐ
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={
                paymentModal.data.status === 'completed' ? 'green' :
                paymentModal.data.status === 'pending' ? 'orange' :
                paymentModal.data.status === 'failed' ? 'red' : 'default'
              }>
                {paymentModal.data.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Phương thức">
              <Tag color="blue">
                {paymentModal.data.method || 'N/A'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày thanh toán">
              {paymentModal.data.createdAt 
                ? dayjs(paymentModal.data.createdAt).format('HH:mm:ss DD/MM/YYYY')
                : 'N/A'}
            </Descriptions.Item>
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
        onCancel={() => setInvoiceModal({ visible: false, loading: false, data: null, details: [] })}
        footer={[
          <Button
            key="close"
            onClick={() => setInvoiceModal({ visible: false, loading: false, data: null, details: [] })}
          >
            Đóng
          </Button>
        ]}
        width="90%"
        style={{ maxWidth: 1200 }}
        bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
      >
        {invoiceModal.loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : invoiceModal.data ? (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Mã hóa đơn" span={2}>
                <Text strong copyable>{invoiceModal.data._id || invoiceModal.data.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                  {invoiceModal.data.totalAmount?.toLocaleString('vi-VN') || '0'} VNĐ
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={
                  invoiceModal.data.status === 'paid' ? 'green' :
                  invoiceModal.data.status === 'pending' ? 'orange' :
                  invoiceModal.data.status === 'partial_paid' ? 'blue' :
                  invoiceModal.data.status === 'cancelled' ? 'red' : 'default'
                }>
                  {invoiceModal.data.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo" span={2}>
                {invoiceModal.data.createdAt 
                  ? dayjs(invoiceModal.data.createdAt).format('HH:mm:ss DD/MM/YYYY')
                  : 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            {/* Invoice Details Section */}
            {invoiceModal.details && invoiceModal.details.length > 0 && (
              <div>
                <Divider orientation="left">
                  <Text strong style={{ fontSize: 16 }}>Chi tiết dịch vụ</Text>
                </Divider>
                <div style={{ overflowX: 'auto' }}>
                  <Table
                    dataSource={invoiceModal.details}
                    rowKey={(record) => record._id || record.id}
                    pagination={false}
                    size="small"
                    scroll={{ x: 900 }}
                    columns={[
                      {
                        title: 'Dịch vụ',
                        dataIndex: ['serviceInfo', 'name'],
                        key: 'serviceName',
                        width: 200,
                        render: (text, record) => (
                          <Space direction="vertical" size={0}>
                            <Text strong style={{ fontSize: 13 }}>{text || 'N/A'}</Text>
                            {record.serviceInfo?.description && (
                              <Text type="secondary" style={{ fontSize: 11 }} ellipsis>
                                {record.serviceInfo.description}
                              </Text>
                            )}
                          </Space>
                        )
                      },
                      {
                        title: 'Loại',
                        dataIndex: ['serviceInfo', 'type'],
                        key: 'type',
                        width: 120,
                        render: (type) => (
                          <Tag color="blue" style={{ fontSize: 11 }}>
                            {type === 'filling' ? 'Trám răng' :
                             type === 'cleaning' ? 'Vệ sinh' :
                             type === 'extraction' ? 'Nhổ răng' :
                             type === 'root_canal' ? 'Nội nha' :
                             type === 'orthodontics' ? 'Chỉnh nha' :
                             type}
                          </Tag>
                        )
                      },
                      {
                        title: 'SL',
                        dataIndex: 'quantity',
                        key: 'quantity',
                        width: 60,
                        align: 'center',
                        render: (qty) => <Text style={{ fontSize: 12 }}>{qty || 1}</Text>
                      },
                      {
                        title: 'Đơn giá',
                        dataIndex: 'unitPrice',
                        key: 'unitPrice',
                        width: 110,
                        align: 'right',
                        render: (price) => (
                          <Text style={{ fontSize: 12 }}>{price?.toLocaleString('vi-VN') || '0'} VNĐ</Text>
                        )
                      },
                      {
                        title: 'Thành tiền',
                        dataIndex: 'totalPrice',
                        key: 'totalPrice',
                        width: 120,
                        align: 'right',
                        render: (total) => (
                          <Text strong style={{ color: '#52c41a', fontSize: 13 }}>
                            {total?.toLocaleString('vi-VN') || '0'} VNĐ
                          </Text>
                        )
                      },
                      {
                        title: 'Trạng thái',
                        dataIndex: 'status',
                        key: 'status',
                        width: 100,
                        render: (status) => (
                          <Tag color={
                            status === 'completed' ? 'green' :
                            status === 'pending' ? 'orange' :
                            status === 'cancelled' ? 'red' : 'default'
                          } style={{ fontSize: 11 }}>
                            {status === 'completed' ? 'Hoàn thành' :
                             status === 'pending' ? 'Chờ xử lý' :
                             status === 'cancelled' ? 'Đã hủy' :
                             status}
                          </Tag>
                        )
                      }
                    ]}
                  />
                </div>
              </div>
            )}
          </Space>
        ) : (
          <Empty description="Không có dữ liệu" />
        )}
      </Modal>
    </div>
  );
};

export default CancelledPatients;

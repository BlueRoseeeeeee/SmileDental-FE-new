/**
 * CancelledPatientsList.jsx
 * Danh sách bệnh nhân bị hủy lịch với filter chi tiết
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Space,
  Tag,
  DatePicker,
  Input,
  Button,
  Select,
  Row,
  Col,
  Typography,
  Tooltip,
  Divider,
  Modal,
  Descriptions,
  Spin,
  Empty
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import dayClosureService from '../../services/dayClosureService';
import { toast } from 'react-toastify';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const CancelledPatientsList = () => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0
  });

  const [allPatients, setAllPatients] = useState([]); // Store all patients for filter extraction
  
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    roomId: null,
    dentistId: null,
    patientName: ''
  });

  // Modal states for payment and invoice details
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [paymentDetail, setPaymentDetail] = useState(null);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load patients on mount
  useEffect(() => {
    loadPatients();
  }, []);

  // Auto-search when filters change (except initial load)
  useEffect(() => {
    if (allPatients.length > 0) {
      loadPatients(1);
    }
  }, [filters.startDate, filters.endDate, filters.roomId, filters.dentistId, filters.patientName]);

  // Extract unique rooms from patients data
  const getUniqueRooms = () => {
    const roomMap = new Map();
    allPatients.forEach(patient => {
      if (patient.roomId && patient.roomName && patient.roomName !== 'Unknown Room') {
        roomMap.set(patient.roomId, patient.roomName);
      }
    });
    return Array.from(roomMap.entries()).map(([id, name]) => ({ _id: id, name }));
  };

  // Extract unique dentists from patients data
  const getUniqueDentists = () => {
    const dentistMap = new Map();
    allPatients.forEach(patient => {
      if (patient.dentistIds && patient.dentistIds.length > 0) {
        patient.dentistIds.forEach((dentistId, index) => {
          const dentistName = patient.dentists.split(', ')[index] || patient.dentists;
          if (dentistId && dentistName && dentistName !== 'N/A') {
            dentistMap.set(dentistId, dentistName);
          }
        });
      }
    });
    return Array.from(dentistMap.entries()).map(([id, name]) => ({ _id: id, fullName: name }));
  };

  const loadPatients = async (page = 1) => {
    try {
      setLoading(true);
      
      // Load all patients first (without filters for dropdown extraction)
      const allResult = await dayClosureService.getAllCancelledPatients({
        page: 1,
        limit: 1000 // Get all for filter options
      });
      
      if (allResult.success) {
        // ✅ Group by appointmentId to remove duplicates
        const uniquePatients = [];
        const seenIds = new Set();
        (allResult.data || []).forEach(patient => {
          if (!seenIds.has(patient.appointmentId)) {
            seenIds.add(patient.appointmentId);
            uniquePatients.push(patient);
          }
        });
        setAllPatients(uniquePatients);
      }
      
      // Then load filtered patients
      const queryFilters = {
        page,
        limit: pagination.pageSize,
        ...(filters.startDate && { startDate: filters.startDate.format('YYYY-MM-DD') }),
        ...(filters.endDate && { endDate: filters.endDate.format('YYYY-MM-DD') }),
        ...(filters.roomId && { roomId: filters.roomId }),
        ...(filters.dentistId && { dentistId: filters.dentistId }),
        ...(filters.patientName && { patientName: filters.patientName })
      };

      const result = await dayClosureService.getAllCancelledPatients(queryFilters);
      
      if (result.success) {
        // ✅ Group by appointmentId to remove duplicates
        const uniqueFiltered = [];
        const seenFilteredIds = new Set();
        (result.data || []).forEach(patient => {
          if (!seenFilteredIds.has(patient.appointmentId)) {
            seenFilteredIds.add(patient.appointmentId);
            uniqueFiltered.push(patient);
          }
        });
        
        setPatients(uniqueFiltered);
        setPagination({
          current: result.pagination.page,
          pageSize: result.pagination.limit,
          total: result.pagination.total // Use total from backend, not current page count
        });
      } else {
        toast.error(result.message || 'Không thể tải dữ liệu');
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách bệnh nhân');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadPatients(1);
  };

  const handleReset = () => {
    setFilters({
      startDate: null,
      endDate: null,
      roomId: null,
      dentistId: null,
      patientName: ''
    });
    setTimeout(() => loadPatients(1), 0);
  };

  // Handle view payment details
  const handleViewPayment = async (paymentId) => {
    try {
      setDetailLoading(true);
      setPaymentModalVisible(true);
      
      const paymentService = (await import('../../services/paymentService')).default;
      const result = await paymentService.getPaymentById(paymentId);
      if (result.success) {
        setPaymentDetail(result.data);
      } else {
        toast.error('Không thể tải thông tin thanh toán');
      }
    } catch (error) {
      console.error('Error loading payment:', error);
      toast.error('Lỗi khi tải thông tin thanh toán');
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle view invoice details
  const handleViewInvoice = async (invoiceId) => {
    try {
      setDetailLoading(true);
      setInvoiceModalVisible(true);
      
      const invoiceService = (await import('../../services/invoiceService')).default;
      const result = await invoiceService.getInvoiceById(invoiceId);
      
      if (result.success) {
        // Also fetch invoice details (line items)
        let invoiceWithDetails = result.data;
        try {
          const detailsResult = await invoiceService.getInvoiceDetails(invoiceId);
          if (detailsResult.success && detailsResult.data) {
            invoiceWithDetails.invoiceDetails = Array.isArray(detailsResult.data) 
              ? detailsResult.data 
              : [detailsResult.data];
          }
        } catch (detailsError) {
          console.error('Error loading invoice details:', detailsError);
        }
        
        setInvoiceDetail(invoiceWithDetails);
      } else {
        toast.error('Không thể tải thông tin hóa đơn');
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error('Lỗi khi tải thông tin hóa đơn');
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      title: 'Thời gian hủy',
      key: 'cancelledDateTime',
      width: 130,
      sorter: (a, b) => new Date(a.cancelledAt) - new Date(b.cancelledAt),
      render: (_, record) => {
        // ✅ Convert UTC to Vietnam timezone (UTC+7)
        const cancelledDate = record.cancelledAt ? dayjs(record.cancelledAt) : null;
        return (
          <Space direction="vertical" size={0}>
            <Text strong>
              <CalendarOutlined /> {cancelledDate ? cancelledDate.format('DD/MM/YYYY') : 'N/A'}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <ClockCircleOutlined /> {cancelledDate ? cancelledDate.format('HH:mm') : 'N/A'}
            </Text>
          </Space>
        );
      }
    },
    {
      title: 'Bệnh nhân',
      key: 'patient',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong><UserOutlined /> {record.patientName}</Text>
          {record.patientPhone && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              <PhoneOutlined /> {record.patientPhone}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Lịch hẹn gốc',
      key: 'appointment',
      width: 140,
      render: (_, record) => {
        const apptDate = record.appointmentDate ? dayjs(record.appointmentDate) : null;
        return (
          <Space direction="vertical" size={0}>
            <Text><CalendarOutlined /> {apptDate ? apptDate.format('DD/MM/YYYY') : 'N/A'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <ClockCircleOutlined /> {record.appointmentTime || 'N/A'}
            </Text>
            <Tag color="blue" style={{ marginTop: 4 }}>{record.shiftName || 'N/A'}</Tag>
          </Space>
        );
      }
    },
    {
      title: 'Nha sĩ',
      dataIndex: 'dentists',
      key: 'dentists',
      width: 140,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text><MedicineBoxOutlined /> {text}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Thanh toán',
      key: 'payment',
      width: 90,
      align: 'center',
      render: (_, record) => {
        if (record.paymentId) {
          return (
            <Button 
              type="link" 
              size="small" 
              icon={<DollarOutlined />}
              onClick={() => handleViewPayment(record.paymentId)}
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
      title: 'Hóa đơn',
      key: 'invoice',
      width: 90,
      align: 'center',
      render: (_, record) => {
        if (record.invoiceId) {
          return (
            <Button 
              type="link" 
              size="small" 
              icon={<FileTextOutlined />}
              onClick={() => handleViewInvoice(record.invoiceId)}
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
              <UserOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
              Bệnh Nhân Bị Hủy Lịch
            </Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadPatients(pagination.current)}
            >
              Làm mới
            </Button>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          {/* Filters */}
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Text strong>Ngày hẹn (lịch gốc):</Text>
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
                style={{ width: '100%', marginTop: 8 }}
              />
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                Lọc theo ngày hẹn ban đầu của bệnh nhân
              </Text>
            </Col>

            <Col span={8}>
              <Text strong>Phòng khám:</Text>
              <Select
                value={filters.roomId}
                onChange={(value) => setFilters({ ...filters, roomId: value })}
                placeholder="Tất cả phòng"
                allowClear
                style={{ width: '100%', marginTop: 8 }}
              >
                {getUniqueRooms().map(room => (
                  <Option key={room._id} value={room._id}>
                    {room.name}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col span={8}>
              <Text strong>Nha sĩ:</Text>
              <Select
                value={filters.dentistId}
                onChange={(value) => setFilters({ ...filters, dentistId: value })}
                placeholder="Tất cả nha sĩ"
                allowClear
                showSearch
                optionFilterProp="children"
                style={{ width: '100%', marginTop: 8 }}
              >
                {getUniqueDentists().map(dentist => (
                  <Option key={dentist._id} value={dentist._id}>
                    {dentist.fullName}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col span={16}>
              <Text strong>Tìm bệnh nhân:</Text>
              <Input
                value={filters.patientName}
                onChange={(e) => {
                  setFilters({ ...filters, patientName: e.target.value });
                }}
                placeholder="Tìm theo tên, email, hoặc số điện thoại bệnh nhân"
                prefix={<SearchOutlined />}
                allowClear
                style={{ marginTop: 8 }}
              />
            </Col>

            <Col span={8} style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button onClick={handleReset} style={{ marginTop: 8 }}>
                Xóa bộ lọc
              </Button>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }} />

          {/* Statistics */}
          <div style={{ background: '#f0f2f5', padding: '16px', borderRadius: '8px' }}>
            <Space size="large">
              <Text>
                <strong>Tổng số bệnh nhân bị hủy:</strong>{' '}
                <Tag color="red" style={{ fontSize: 16 }}>{pagination.total}</Tag>
              </Text>
              <Text type="secondary">
                Hiển thị {patients.length} bệnh nhân trong trang này
              </Text>
            </Space>
          </div>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={patients}
            rowKey={(record) => `${record.appointmentId}-${record.cancelledDate}`}
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} bệnh nhân`,
              pageSizeOptions: ['20', '50', '100', '200']
            }}
            onChange={(newPagination) => {
              loadPatients(newPagination.current);
            }}
            scroll={{ x: 900 }}
            size="small"
          />
        </Space>
      </Card>

      {/* Payment Detail Modal */}
      <Modal
        title="Chi Tiết Thanh Toán"
        open={paymentModalVisible}
        onCancel={() => {
          setPaymentModalVisible(false);
          setPaymentDetail(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setPaymentModalVisible(false);
            setPaymentDetail(null);
          }}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : paymentDetail ? (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Mã thanh toán" span={2}>
              <Text strong copyable>{paymentDetail._id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền">
              <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                {paymentDetail.finalAmount?.toLocaleString('vi-VN') || '0'} VNĐ
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={
                paymentDetail.status === 'completed' ? 'green' :
                paymentDetail.status === 'pending' ? 'orange' :
                paymentDetail.status === 'failed' ? 'red' : 'default'
              }>
                {paymentDetail.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Phương thức">
              <Tag color="blue">
                {paymentDetail.method || 'N/A'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày thanh toán">
              {paymentDetail.createdAt 
                ? dayjs(paymentDetail.createdAt).format('HH:mm:ss DD/MM/YYYY')
                : 'N/A'}
            </Descriptions.Item>
            {paymentDetail.notes && (
              <Descriptions.Item label="Ghi chú" span={2}>
                {paymentDetail.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            Không có dữ liệu
          </div>
        )}
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal
        title="Chi Tiết Hóa Đơn"
        open={invoiceModalVisible}
        onCancel={() => {
          setInvoiceModalVisible(false);
          setInvoiceDetail(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setInvoiceModalVisible(false);
            setInvoiceDetail(null);
          }}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : invoiceDetail ? (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Mã hóa đơn" span={2}>
                <Text strong copyable>{invoiceDetail._id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                  {invoiceDetail.totalAmount?.toLocaleString('vi-VN') || '0'} VNĐ
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={
                  invoiceDetail.status === 'paid' ? 'green' : 
                  invoiceDetail.status === 'pending' ? 'orange' : 
                  invoiceDetail.status === 'partial_paid' ? 'blue' :
                  invoiceDetail.status === 'cancelled' ? 'red' : 'default'
                }>
                  {invoiceDetail.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo" span={2}>
                {invoiceDetail.createdAt 
                  ? dayjs(invoiceDetail.createdAt).format('HH:mm:ss DD/MM/YYYY')
                  : 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            {/* Invoice Details Section */}
            {invoiceDetail.invoiceDetails && invoiceDetail.invoiceDetails.length > 0 && (
              <div>
                <Divider orientation="left">
                  <Text strong style={{ fontSize: 16 }}>Chi tiết dịch vụ</Text>
                </Divider>
                <Table
                  dataSource={invoiceDetail.invoiceDetails}
                  rowKey={(record) => record._id || record.id}
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: 'Dịch vụ',
                      dataIndex: ['serviceInfo', 'name'],
                      key: 'serviceName',
                      render: (text, record) => (
                        <Space direction="vertical" size={0}>
                          <Text strong>{text || 'N/A'}</Text>
                          {record.serviceInfo?.description && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
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
                        <Tag color="blue">
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
                      title: 'Số lượng',
                      dataIndex: 'quantity',
                      key: 'quantity',
                      width: 80,
                      align: 'center',
                      render: (qty) => <Text>{qty || 1}</Text>
                    },
                    {
                      title: 'Đơn giá',
                      dataIndex: 'unitPrice',
                      key: 'unitPrice',
                      width: 120,
                      align: 'right',
                      render: (price) => (
                        <Text>{price?.toLocaleString('vi-VN') || '0'} VNĐ</Text>
                      )
                    },
                    {
                      title: 'Thành tiền',
                      dataIndex: 'totalPrice',
                      key: 'totalPrice',
                      width: 120,
                      align: 'right',
                      render: (total) => (
                        <Text strong style={{ color: '#52c41a' }}>
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
                        }>
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
            )}
          </Space>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            Không có dữ liệu
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CancelledPatientsList;

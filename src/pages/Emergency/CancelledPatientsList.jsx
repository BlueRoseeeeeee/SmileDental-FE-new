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
  Spin
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
import roomService from '../../services/roomService';
import userService from '../../services/userService';
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

  const [rooms, setRooms] = useState([]);
  const [dentists, setDentists] = useState([]);
  
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

  // Load rooms and dentists for filters
  useEffect(() => {
    loadRooms();
    loadDentists();
    loadPatients();
  }, []);

  const loadRooms = async () => {
    try {
      const result = await roomService.getAllRooms();
      if (result.success) {
        setRooms(result.data || []);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadDentists = async () => {
    try {
      const result = await userService.getUsersByRoles(['dentist']);
      if (result.success) {
        setDentists(result.data || []);
      }
    } catch (error) {
      console.error('Error loading dentists:', error);
    }
  };

  const loadPatients = async (page = 1) => {
    try {
      setLoading(true);
      
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
        setPatients(result.data);
        setPagination({
          current: result.pagination.page,
          pageSize: result.pagination.limit,
          total: result.pagination.total
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
        setInvoiceDetail(result.data);
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
      width: 140,
      sorter: (a, b) => new Date(a.cancelledAt) - new Date(b.cancelledAt),
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong><CalendarOutlined /> {record.formattedCancelledDate}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined /> {record.formattedCancelledTime}
          </Text>
        </Space>
      )
    },
    {
      title: 'Bệnh nhân',
      key: 'patient',
      width: 200,
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
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text><CalendarOutlined /> {dayjs(record.appointmentDate).format('DD/MM/YYYY')}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined /> {record.appointmentTime}
          </Text>
          <Tag color="blue" style={{ marginTop: 4 }}>{record.shiftName}</Tag>
        </Space>
      )
    },
    {
      title: 'Nha sĩ',
      dataIndex: 'dentists',
      key: 'dentists',
      width: 150,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text><MedicineBoxOutlined /> {text}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Y tá',
      dataIndex: 'nurses',
      key: 'nurses',
      width: 150,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Thanh toán',
      key: 'payment',
      width: 100,
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
      width: 100,
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
    },
    {
      title: 'Lý do hủy',
      dataIndex: 'cancelledReason',
      key: 'reason',
      width: 200,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text type="secondary">{text}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Người hủy',
      dataIndex: 'cancelledBy',
      key: 'cancelledBy',
      width: 120
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
                style={{ width: '100%', marginTop: 8 }}
              />
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
                {rooms.map(room => (
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
                {dentists.map(dentist => (
                  <Option key={dentist._id} value={dentist._id}>
                    {dentist.fullName || dentist.name}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col span={16}>
              <Text strong>Tìm bệnh nhân:</Text>
              <Input
                value={filters.patientName}
                onChange={(e) => setFilters({ ...filters, patientName: e.target.value })}
                placeholder="Tìm theo tên, email, hoặc số điện thoại bệnh nhân"
                prefix={<SearchOutlined />}
                onPressEnter={handleSearch}
                style={{ marginTop: 8 }}
              />
            </Col>

            <Col span={8} style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Space style={{ marginTop: 8 }}>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                >
                  Tìm kiếm
                </Button>
                <Button onClick={handleReset}>
                  Xóa bộ lọc
                </Button>
              </Space>
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
            scroll={{ x: 1600 }}
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
              {paymentDetail._id}
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền">
              {paymentDetail.amount?.toLocaleString('vi-VN')} VNĐ
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={paymentDetail.status === 'success' ? 'green' : 'orange'}>
                {paymentDetail.status === 'success' ? 'Thành công' : 
                 paymentDetail.status === 'pending' ? 'Đang xử lý' : 
                 paymentDetail.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Phương thức">
              {paymentDetail.method === 'visa' ? 'Thẻ Visa' : 
               paymentDetail.method === 'cash' ? 'Tiền mặt' : 
               paymentDetail.method}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày thanh toán">
              {paymentDetail.paidAt ? new Date(paymentDetail.paidAt).toLocaleString('vi-VN') : 'Chưa thanh toán'}
            </Descriptions.Item>
            {paymentDetail.transactionId && (
              <Descriptions.Item label="Mã giao dịch" span={2}>
                {paymentDetail.transactionId}
              </Descriptions.Item>
            )}
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
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Mã hóa đơn" span={2}>
              {invoiceDetail.invoiceCode || invoiceDetail._id}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              {invoiceDetail.totalAmount?.toLocaleString('vi-VN')} VNĐ
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={
                invoiceDetail.status === 'completed' ? 'green' : 
                invoiceDetail.status === 'pending' ? 'orange' : 
                invoiceDetail.status === 'cancelled' ? 'red' : 'default'
              }>
                {invoiceDetail.status === 'completed' ? 'Hoàn tất' :
                 invoiceDetail.status === 'pending' ? 'Chờ xử lý' :
                 invoiceDetail.status === 'cancelled' ? 'Đã hủy' :
                 invoiceDetail.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {new Date(invoiceDetail.createdAt).toLocaleString('vi-VN')}
            </Descriptions.Item>
            <Descriptions.Item label="Người tạo">
              {invoiceDetail.createdBy?.name || 'N/A'}
            </Descriptions.Item>
            {invoiceDetail.services && invoiceDetail.services.length > 0 && (
              <Descriptions.Item label="Dịch vụ" span={2}>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {invoiceDetail.services.map((service, index) => (
                    <li key={index}>
                      {service.serviceName} - {service.price?.toLocaleString('vi-VN')} VNĐ
                    </li>
                  ))}
                </ul>
              </Descriptions.Item>
            )}
            {invoiceDetail.notes && (
              <Descriptions.Item label="Ghi chú" span={2}>
                {invoiceDetail.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
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

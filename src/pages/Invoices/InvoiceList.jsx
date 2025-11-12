import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  Modal,
  message,
  Tooltip,
  Dropdown,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PrinterOutlined,
  CloseCircleOutlined,
  BellOutlined,
  FilePdfOutlined,
  MoreOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import invoiceService from '../../services/invoiceService';
import InvoiceFormModal from './InvoiceFormModal';
import InvoiceDetailDrawer from './InvoiceDetailDrawer';

const { RangePicker } = DatePicker;
const { Search } = Input;
const { Option } = Select;

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    total: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    keyword: '',
    status: undefined,
    type: undefined,
    dateRange: undefined
  });

  // Modals
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Load data
  useEffect(() => {
    loadInvoices();
  }, [pagination.currentPage, pagination.pageSize, filters]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        limit: pagination.pageSize,
        keyword: filters.keyword,
        status: filters.status,
        type: filters.type,
        startDate: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: filters.dateRange?.[1]?.format('YYYY-MM-DD')
      };

      const result = await invoiceService.getAllInvoices(params);
      
      if (result.success) {
        setInvoices(result.data.invoices);
        setPagination({
          ...pagination,
          total: result.data.pagination.totalItems
        });
      }
    } catch (error) {
      message.error('Tải danh sách hóa đơn thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleSearch = (value) => {
    setFilters({ ...filters, keyword: value });
    setPagination({ ...pagination, currentPage: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, currentPage: 1 });
  };

  const handleResetFilters = () => {
    setFilters({
      keyword: '',
      status: undefined,
      type: undefined,
      dateRange: undefined
    });
    setPagination({ ...pagination, currentPage: 1 });
  };

  const handleCreate = () => {
    setModalMode('create');
    setSelectedInvoice(null);
    setFormModalVisible(true);
  };

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setDetailDrawerVisible(true);
  };

  const handleEdit = (invoice) => {
    setModalMode('edit');
    setSelectedInvoice(invoice);
    setFormModalVisible(true);
  };

  const handleDelete = (invoice) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn xóa hóa đơn ${invoice.invoiceNumber}?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        const result = await invoiceService.deleteInvoice(invoice._id);
        if (result.success) {
          loadInvoices();
        }
      }
    });
  };

  const handleCancel = (invoice) => {
    Modal.confirm({
      title: 'Hủy hóa đơn',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Bạn có chắc chắn muốn hủy hóa đơn {invoice.invoiceNumber}?</p>
          <Input.TextArea
            placeholder="Lý do hủy hóa đơn..."
            rows={3}
            id="cancel-reason"
          />
        </div>
      ),
      okText: 'Hủy hóa đơn',
      cancelText: 'Đóng',
      okButtonProps: { danger: true },
      onOk: async () => {
        const reason = document.getElementById('cancel-reason')?.value;
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const result = await invoiceService.cancelInvoice(invoice._id, {
          reason: reason || 'Không có lý do',
          cancelledBy: currentUser._id || currentUser.id
        });
        if (result.success) {
          loadInvoices();
        }
      }
    });
  };

  const handleSendReminder = async (invoice) => {
    const result = await invoiceService.sendInvoiceReminder(invoice._id);
    if (result.success) {
      message.success(`Đã gửi nhắc nhở đến ${invoice.patientInfo.phone}`);
    }
  };

  const handleExportPDF = async (invoice) => {
    const result = await invoiceService.exportInvoiceToPDF(invoice._id);
    if (result.success) {
      console.log('PDF URL:', result.data.pdfUrl);
    }
  };

  const handlePrint = (invoice) => {
    console.log('🖨️ Print invoice:', invoice.invoiceNumber);
    message.info('Chức năng in đang được phát triển');
  };

  const handleTableChange = (pagination) => {
    setPagination({
      ...pagination,
      currentPage: pagination.current,
      pageSize: pagination.pageSize
    });
  };

  const handleFormSuccess = () => {
    setFormModalVisible(false);
    loadInvoices();
  };

  // Status colors
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Table columns
  const columns = [
    {
      title: 'Mã HĐ',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 110,
      fixed: 'left',
      render: (text, record) => (
        <Button type="link" onClick={() => handleView(record)} style={{ padding: 0 }}>
          {text}
        </Button>
      )
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type) => (
        <Tag color={type === 'treatment' ? 'blue' : 'default'}>
          {getTypeText(type)}
        </Tag>
      )
    },
    {
      title: 'Bệnh nhân',
      key: 'patient',
      width: 160,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 2 }}>{record.patientInfo.name}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>
            {record.patientInfo.phone}
          </div>
        </div>
      )
    },
    {
      title: 'Bác sĩ',
      dataIndex: ['dentistInfo', 'name'],
      key: 'dentist',
      width: 130,
      ellipsis: true
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'issueDate',
      key: 'issueDate',
      width: 90,
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 110,
      align: 'right',
      render: (amount) => (
        <span style={{ fontWeight: 500, color: '#1890ff' }}>
          {formatCurrency(amount)}
        </span>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => {
        const items = [
          {
            key: 'view',
            label: 'Xem chi tiết',
            icon: <EyeOutlined />,
            onClick: () => handleView(record)
          },
          {
            key: 'edit',
            label: 'Chỉnh sửa',
            icon: <EditOutlined />,
            onClick: () => handleEdit(record),
            disabled: record.status === 'paid' || record.status === 'cancelled'
          },
          {
            key: 'print',
            label: 'In hóa đơn',
            icon: <PrinterOutlined />,
            onClick: () => handlePrint(record)
          },
          {
            key: 'pdf',
            label: 'Xuất PDF',
            icon: <FilePdfOutlined />,
            onClick: () => handleExportPDF(record)
          },
          {
            type: 'divider'
          },
          {
            key: 'remind',
            label: 'Gửi nhắc nhở',
            icon: <BellOutlined />,
            onClick: () => handleSendReminder(record),
            disabled: record.status === 'paid' || record.status === 'cancelled'
          },
          {
            key: 'cancel',
            label: 'Hủy hóa đơn',
            icon: <CloseCircleOutlined />,
            onClick: () => handleCancel(record),
            disabled: record.status === 'paid' || record.status === 'cancelled',
            danger: true
          },
          {
            key: 'delete',
            label: 'Xóa',
            icon: <DeleteOutlined />,
            onClick: () => handleDelete(record),
            disabled: record.status === 'paid' || record.paymentSummary.totalPaid > 0,
            danger: true
          }
        ];

        return (
          <Space size="small">
            <Tooltip title="Xem chi tiết">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => handleView(record)}
              />
            </Tooltip>
            <Dropdown menu={{ items }} trigger={['click']}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Search
              placeholder="Tìm theo mã HĐ, tên, SĐT..."
              allowClear
              onSearch={handleSearch}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
            >
              <Option value="draft">Nháp</Option>
              <Option value="pending">Chờ thanh toán</Option>
              <Option value="partial_paid">TT 1 phần</Option>
              <Option value="paid">Đã thanh toán</Option>
              <Option value="overdue">Quá hạn</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Loại hóa đơn"
              allowClear
              style={{ width: '100%' }}
              value={filters.type}
              onChange={(value) => handleFilterChange('type', value)}
            >
              <Option value="appointment">Cuộc hẹn</Option>
              <Option value="treatment">Điều trị</Option>
              <Option value="consultation">Tư vấn</Option>
              <Option value="emergency">Cấp cứu</Option>
              <Option value="checkup">Kiểm tra</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Từ ngày', 'Đến ngày']}
              format="DD/MM/YYYY"
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space>
              <Button onClick={handleResetFilters}>
                Đặt lại
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Tạo hóa đơn
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={invoices}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Tổng ${total} hóa đơn`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Modals */}
      <InvoiceFormModal
        visible={formModalVisible}
        mode={modalMode}
        invoice={selectedInvoice}
        onSuccess={handleFormSuccess}
        onCancel={() => setFormModalVisible(false)}
      />

      <InvoiceDetailDrawer
        visible={detailDrawerVisible}
        invoice={selectedInvoice}
        onClose={() => setDetailDrawerVisible(false)}
        onEdit={(invoice) => {
          setDetailDrawerVisible(false);
          handleEdit(invoice);
        }}
        onPrint={handlePrint}
        onExportPDF={handleExportPDF}
      />
    </div>
  );
};

export default InvoiceList;

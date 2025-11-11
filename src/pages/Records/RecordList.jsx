/**
 * Record List Component
 * 
 * Display list of medical records with filters and actions
 * Features:
 * - Table view with pagination
 * - Filters: Type, Status, Dentist, Date range
 * - Search by patient name, record code
 * - Actions: View, Edit, Delete, Print, Complete
 * - Statistics summary
 */

import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Tooltip,
  message,
  Modal,
  Typography,
  Drawer,
  Row,
  Col
} from 'antd';
import {
  FileTextOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  FilterOutlined,
  UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import recordService from '../../services/recordService';
import RecordFormModal from './RecordFormModal';
import RecordDetailDrawer from './RecordDetailDrawer';
import PaymentConfirmModal from '../../components/Payment/PaymentConfirmModal';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { confirm } = Modal;

const RecordList = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // Filters
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterDentist, setFilterDentist] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  
  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const selectedRole = localStorage.getItem('selectedRole');

  // Load records on mount and when filters change
  useEffect(() => {
    loadRecords();
  }, [
    pagination.current,
    pagination.pageSize,
    searchKeyword,
    filterType,
    filterStatus,
    filterDentist,
    dateRange
  ]);

  // ❌ Auto refresh disabled - use manual refresh button instead
  // useEffect(() => {
  //   const hasFilters = searchKeyword || filterType || filterStatus || filterDentist || dateRange;
  //   if (hasFilters) return; // Don't auto-refresh when filtering

  //   const intervalId = setInterval(() => {
  //     loadRecords();
  //   }, 30000); // 30 seconds

  //   return () => clearInterval(intervalId);
  // }, [searchKeyword, filterType, filterStatus, filterDentist, dateRange]);

  // Load records
  const loadRecords = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        q: searchKeyword || undefined,
        type: filterType || undefined,
        status: filterStatus || undefined,
        dentistId: filterDentist || undefined,
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: dateRange?.[1]?.format('YYYY-MM-DD')
      };

      // Auto-filter by dentist/nurse for their own records
      if (selectedRole === 'dentist' || selectedRole === 'nurse') {
        params.dentistId = currentUser.userId;
      }

      const response = await recordService.getAllRecords(params);

      if (response.success) {
        setRecords(response.data);
        setPagination({
          ...pagination,
          total: response.total
        });
      }
    } catch (error) {
      console.error('Load records error:', error);
      message.error('Không thể tải danh sách hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  // Handle table change (pagination, sort)
  const handleTableChange = (newPagination, filters, sorter) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize
    });
  };

  // Handle create button
  const handleCreate = () => {
    setFormMode('create');
    setSelectedRecord(null);
    setShowFormModal(true);
  };

  // Handle edit button
  const handleEdit = (record) => {
    setFormMode('edit');
    setSelectedRecord(record);
    setShowFormModal(true);
  };

  // Handle start treatment button
  const handleStart = async (record) => {
    try {
      const response = await recordService.updateRecordStatus(record._id, 'in-progress');
      if (response.success) {
        message.success('Đã bắt đầu khám');
        loadRecords(); // Reload to update button display
      }
    } catch (error) {
      console.error('Start record error:', error);
      message.error('Không thể bắt đầu khám');
    }
  };

  // Handle view button
  const handleView = (record) => {
    setSelectedRecord(record);
    setShowDetailDrawer(true);
  };

  // Handle complete button
  const handleComplete = async (record) => {
    console.log('='.repeat(80));
    console.log('🎯 [RecordList] handleComplete called');
    console.log('📋 Record details:', {
      _id: record._id,
      recordCode: record.recordCode,
      appointmentId: record.appointmentId,
      status: record.status,
      diagnosis: record.diagnosis,
      totalCost: record.totalCost,
      serviceAddOnId: record.serviceAddOnId,
      serviceAddOnName: record.serviceAddOnName,
      bookingChannel: record.bookingChannel
    });
    console.log('='.repeat(80));
    
    // ✅ Validation: Check required fields
    const errors = [];
    
    if (!record.diagnosis || record.diagnosis.trim() === '') {
      errors.push('Chưa nhập chẩn đoán');
    }
    
    if (!record.serviceAddOnId) {
      errors.push('Chưa chọn dịch vụ con cho dịch vụ chính');
    }
    
    if (errors.length > 0) {
      console.warn('❌ [RecordList] Validation failed:', errors);
      Modal.warning({
        title: 'Không thể hoàn thành hồ sơ',
        content: (
          <div>
            <p>Vui lòng hoàn thiện các thông tin sau:</p>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              {errors.map((error, index) => (
                <li key={index} style={{ color: '#ff4d4f' }}>{error}</li>
              ))}
            </ul>
          </div>
        ),
        okText: 'Đã hiểu'
      });
      return;
    }
    
    console.log('✅ [RecordList] All validations passed - fetching payment info...');
    
    try {
      // 🆕 Fetch payment info from backend (appointment + invoice data)
      setLoading(true);
      console.log(`📞 [RecordList] Calling API: GET /api/records/${record._id}/payment-info`);
      
      const response = await recordService.getPaymentInfo(record._id);
      
      if (response.success) {
        console.log('✅ [RecordList] Payment info received:', response.data);
        
        // Merge payment info with record data
        const recordWithPaymentInfo = {
          ...record,
          appointmentDeposit: response.data.depositAmount || 0,
          appointmentBookingChannel: response.data.bookingChannel || 'offline',
          hasDeposit: response.data.hasDeposit || false,
          invoiceNumber: response.data.invoiceNumber,
          finalAmount: response.data.finalAmount
        };
        
        console.log('🎯 [RecordList] Opening payment modal with enriched data:', {
          totalCost: recordWithPaymentInfo.totalCost,
          depositAmount: recordWithPaymentInfo.appointmentDeposit,
          finalAmount: recordWithPaymentInfo.finalAmount,
          hasDeposit: recordWithPaymentInfo.hasDeposit
        });
        
        // Show payment confirmation modal
        setSelectedRecord(recordWithPaymentInfo);
        setShowPaymentModal(true);
      } else {
        throw new Error(response.message || 'Không thể lấy thông tin thanh toán');
      }
    } catch (error) {
      console.error('❌ [RecordList] Error fetching payment info:', error);
      message.error(error.message || 'Không thể lấy thông tin thanh toán');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete button
  const handleDelete = (record) => {
    confirm({
      title: 'Xóa hồ sơ?',
      content: `Bạn có chắc muốn xóa hồ sơ ${record.recordCode}? Hành động này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await recordService.deleteRecord(record._id);
          
          if (response.success) {
            message.success('Hồ sơ đã được xóa');
            loadRecords();
          }
        } catch (error) {
          console.error('Delete record error:', error);
          message.error('Không thể xóa hồ sơ');
        }
      }
    });
  };

  // Handle print button
  const handlePrint = (record) => {
    message.info(`Đang in hồ sơ ${record.recordCode}...`);
    // TODO: Implement print functionality
  };

  // Handle form success
  const handleFormSuccess = (updatedRecord) => {
    // If updatedRecord is provided (from edit/delete operations), update selectedRecord
    if (updatedRecord) {
      console.log('✅ [RecordList] Updating selectedRecord with new data:', updatedRecord);
      setSelectedRecord(updatedRecord);
    } else {
      // For create operations, close modal and reload list
      setShowFormModal(false);
      setSelectedRecord(null);
    }
    
    // Always reload the records list
    loadRecords();
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchKeyword('');
    setFilterType(null);
    setFilterStatus(null);
    setFilterDentist(null);
    setDateRange(null);
    setPagination({ ...pagination, current: 1 });
  };

  // Table columns
  const columns = [
    {
      title: 'Mã hồ sơ',
      dataIndex: 'recordCode',
      key: 'recordCode',
      width: 140,
      fixed: 'left',
      render: (text, record) => (
        <a onClick={() => handleView(record)}>
          <strong>{text}</strong>
        </a>
      )
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => (
        <Tag color={type === 'exam' ? 'blue' : 'green'}>
          {type === 'exam' ? 'Khám' : 'Điều trị'}
        </Tag>
      )
    },
    {
      title: 'Bệnh nhân',
      dataIndex: ['patientInfo', 'name'],
      key: 'patientName',
      width: 180,
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.patientInfo.phone}
          </Text>
        </Space>
      )
    },
    {
      title: 'Ngày khám',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Giờ bắt đầu DK',
      dataIndex: 'appointmentStartTime',
      key: 'appointmentStartTime',
      width: 110,
      render: (time) => time || '-'
    },
    {
      title: 'Giờ kết thúc DK',
      dataIndex: 'appointmentEndTime',
      key: 'appointmentEndTime',
      width: 110,
      render: (time) => time || '-'
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'serviceName',
      key: 'serviceName',
      width: 220,
      render: (serviceName, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{serviceName}</Text>
          {record.serviceAddOnName ? (
            <Text type="secondary" style={{ fontSize: 11 }}>
              ↳ {record.serviceAddOnName}
            </Text>
          ) : (
            <Text type="warning" style={{ fontSize: 11 }}>
              ⚠️ Chưa chọn dịch vụ con
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Nha sĩ',
      dataIndex: 'dentistName',
      key: 'dentistName',
      width: 160,
      ellipsis: true
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, record) => {
        const statusConfig = {
          pending: { color: 'orange', text: 'Chờ khám' },
          'in-progress': { color: 'blue', text: 'Đang khám' },
          completed: { color: 'green', text: 'Hoàn thành' },
          cancelled: { color: 'red', text: 'Đã hủy' }
        };
        
        const config = statusConfig[status] || { color: 'default', text: status };
        
        return (
          <Space direction="vertical" size={0}>
            <Tag color={config.color}>{config.text}</Tag>
            {record.startedAt && status === 'in-progress' && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {dayjs(record.startedAt).format('HH:mm')}
              </Text>
            )}
            {record.completedAt && status === 'completed' && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {dayjs(record.completedAt).format('HH:mm')}
              </Text>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          
          <Tooltip title={record.status === 'in-progress' ? 'Sửa' : 'Chỉ có thể sửa khi đang khám'}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={record.status !== 'in-progress'}
            />
          </Tooltip>
          
          {record.status === 'pending' && (
            <Tooltip title="Bắt đầu khám">
              <Button
                type="primary"
                size="small"
                onClick={() => handleStart(record)}
                style={{ fontSize: 11 }}
              >
                Bắt đầu
              </Button>
            </Tooltip>
          )}
          
          {record.status === 'in-progress' && (
            <Tooltip
              title={
                (() => {
                  const missingFields = [];
                  if (!record.diagnosis || record.diagnosis.trim() === '') {
                    missingFields.push('chẩn đoán');
                  }
                  if (!record.serviceAddOnId) {
                    missingFields.push('dịch vụ con');
                  }
                  
                  if (missingFields.length > 0) {
                    return `Cần cập nhật: ${missingFields.join(', ')}`;
                  }
                  return 'Hoàn thành hồ sơ';
                })()
              }
            >
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click
                  handleComplete(record);
                }}
                style={{ 
                  backgroundColor: '#52c41a',
                  borderColor: '#52c41a'
                }}
                disabled={
                  !record.diagnosis || 
                  record.diagnosis.trim() === '' || 
                  !record.serviceAddOnId
                }
              >
                Hoàn thành
              </Button>
            </Tooltip>
          )}
          
          <Tooltip title="In">
            <Button
              type="text"
              size="small"
              icon={<PrinterOutlined />}
              onClick={() => handlePrint(record)}
            />
          </Tooltip>
          
          {selectedRole === 'admin' && (
            <Tooltip title="Xóa">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* Role-based info message */}
      {(() => {
        const isDentist = selectedRole === 'dentist';
        const isNurse = selectedRole === 'nurse';
        
        if (isDentist || isNurse) {
          return (
            <Card style={{ marginBottom: 16, backgroundColor: '#e6f7ff', borderColor: '#91d5ff' }}>
              <Space>
                <UserOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                <Text>
                  {isDentist && (
                    <>Bạn đang xem hồ sơ được tạo bởi <Text strong>nha sĩ {currentUser.fullName || 'bạn'}</Text></>
                  )}
                  {isNurse && (
                    <>Bạn đang xem hồ sơ từ các lịch hẹn được gán cho <Text strong>y tá {currentUser.fullName || 'bạn'}</Text></>
                  )}
                </Text>
              </Space>
            </Card>
          );
        }
        return null;
      })()}

      {/* Main Card */}
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ fontSize: 24 }} />
            <Title level={4} style={{ margin: 0 }}>Danh sách hồ sơ bệnh án</Title>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Tạo hồ sơ mới
          </Button>
        }
      >
        {/* Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Tìm theo mã HS, tên BN..."
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
            />
          </Col>
          
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Loại hồ sơ"
              value={filterType}
              onChange={setFilterType}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="exam">Khám bệnh</Option>
              <Option value="treatment">Điều trị</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Trạng thái"
              value={filterStatus}
              onChange={setFilterStatus}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="pending">Chờ khám</Option>
              <Option value="in-progress">Đang khám</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              placeholder={['Từ ngày', 'Đến ngày']}
              format="DD/MM/YYYY"
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
            />
          </Col>
          
          <Col xs={24} sm={24} md={4}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadRecords}
              >
                Tải lại
              </Button>
              <Button
                icon={<FilterOutlined />}
                onClick={handleResetFilters}
              >
                Đặt lại
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={records}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} hồ sơ`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
          scroll={{ x: 1500 }}
        />
      </Card>

      {/* Form Modal */}
      {showFormModal && (
        <RecordFormModal
          visible={showFormModal}
          mode={formMode}
          record={selectedRecord}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowFormModal(false);
            setSelectedRecord(null);
          }}
        />
      )}

      {/* Detail Drawer */}
      {showDetailDrawer && (
        <RecordDetailDrawer
          visible={showDetailDrawer}
          record={selectedRecord}
          onClose={() => {
            setShowDetailDrawer(false);
            setSelectedRecord(null);
          }}
          onEdit={handleEdit}
          onComplete={handleComplete}
          onPrint={handlePrint}
        />
      )}

      {/* Payment Confirmation Modal - Preview before completing record */}
      {showPaymentModal && selectedRecord && (
        <PaymentConfirmModal
          visible={showPaymentModal}
          record={selectedRecord}
          onCancel={() => {
            setShowPaymentModal(false);
            setSelectedRecord(null);
          }}
          onSuccess={(completedRecord) => {
            console.log('✅ Record completed:', completedRecord);
            setShowPaymentModal(false);
            setSelectedRecord(null);
            loadRecords(); // Reload to update status
          }}
        />
      )}
    </div>
  );
};

export default RecordList;

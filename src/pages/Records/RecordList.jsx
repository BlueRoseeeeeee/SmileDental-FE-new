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
  const [filteredRecords, setFilteredRecords] = useState([]);
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
    filterDentist
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
        dentistId: filterDentist || undefined
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
    
    if (!record.serviceAddOnPrice || record.serviceAddOnPrice <= 0) {
      errors.push('Dịch vụ con chính chưa có giá hợp lệ (vui lòng cập nhật lại dịch vụ)');
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

  const formatCurrency = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return '0đ';
    }
    return `${Number(value).toLocaleString('vi-VN')}đ`;
  };

  const generatePrintHTML = (record) => {
    const formatDate = (value, format = 'DD/MM/YYYY') =>
      value ? dayjs(value).format(format) : '-';

    const genderLabel =
      record.patientInfo?.gender === 'male'
        ? 'Nam'
        : record.patientInfo?.gender === 'female'
        ? 'Nữ'
        : 'Khác';

    const typeLabel = record.type === 'exam' ? 'Khám' : 'Điều trị';

    const statusConfig = {
      pending: 'Chờ khám',
      'in-progress': 'Đang khám',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };

    const paymentConfig = {
      unpaid: 'Chưa thanh toán',
      partial: 'Thanh toán 1 phần',
      paid: 'Đã thanh toán'
    };

    const priorityConfig = {
      urgent: 'Khẩn cấp',
      high: 'Cao',
      normal: 'Bình thường',
      low: 'Thấp'
    };

    const treatmentRows = record.treatmentIndications?.length
      ? record.treatmentIndications
          .map(
            (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.serviceName || ''}</td>
          <td>${item.serviceAddOnName || ''}</td>
          <td>${item.notes || ''}</td>
          <td>${item.used ? 'Đã thực hiện' : 'Chưa thực hiện'}</td>
        </tr>
      `
          )
          .join('')
      : `<tr><td colspan="5" class="empty-row">Chưa có chỉ định điều trị</td></tr>`;

    const additionalServiceRows = record.additionalServices?.length
      ? record.additionalServices
          .map(
            (service, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${service.serviceName || ''}</td>
          <td>${service.serviceAddOnName || '-'}</td>
          <td>${service.quantity || 1}</td>
          <td>${formatCurrency(service.price)}</td>
          <td>${formatCurrency((service.price || 0) * (service.quantity || 1))}</td>
        </tr>
      `
          )
          .join('')
      : `<tr><td colspan="6" class="empty-row">Chưa có dịch vụ bổ sung</td></tr>`;

    const indicationBadges = record.indications?.length
      ? record.indications
          .map((text) => `<span class="chip">${text}</span>`)
          .join('')
      : '<p class="text-muted">Chưa có chỉ định</p>';

    const prescriptionSection =
      record.prescription && record.prescription.medicines?.length
        ? record.prescription.medicines
            .map(
              (medicine, idx) => `
        <div class="prescription-card">
          <div class="prescription-header">
            <strong>${idx + 1}. ${medicine.medicineName || ''}</strong>
            <span>${medicine.unit || ''}</span>
          </div>
          <ul>
            <li><strong>Cách dùng:</strong> ${medicine.dosageInstruction || medicine.dosage || '-'}</li>
            <li><strong>Số lượng:</strong> ${medicine.quantity || 0} ${medicine.unit || ''}</li>
            <li><strong>Thời gian dùng:</strong> ${medicine.duration || '-'}</li>
            ${
              medicine.note
                ? `<li><strong>Ghi chú:</strong> ${medicine.note}</li>`
                : ''
            }
          </ul>
        </div>
      `
            )
            .join('')
        : '<p class="text-muted">Chưa có đơn thuốc</p>';

    const timelineItems = [
      { label: 'Tạo hồ sơ', time: formatDate(record.createdAt, 'DD/MM/YYYY HH:mm') },
      { label: 'Bắt đầu khám', time: formatDate(record.startedAt, 'DD/MM/YYYY HH:mm') },
      { label: 'Hoàn thành', time: formatDate(record.completedAt, 'DD/MM/YYYY HH:mm') }
    ]
      .filter((item) => item.time && item.time !== '-')
      .map(
        (item) => `
      <li>
        <span class="timeline-dot"></span>
        <div>
          <strong>${item.label}</strong>
          <div>${item.time}</div>
        </div>
      </li>
    `
      )
      .join('');

    return `
      <html lang="vi">
        <head>
          <title>Hồ sơ ${record.recordCode || ''}</title>
          <meta charset="utf-8" />
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              background: #fff;
              margin: 0;
              padding: 32px;
              color: #111;
            }
            .print-container {
              max-width: 900px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 24px;
            }
            .header h1 {
              margin: 0;
              font-size: 26px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .header p {
              margin: 4px 0 0;
              font-size: 15px;
              color: #555;
            }
            .tag-group {
              margin-top: 12px;
            }
            .tag {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 13px;
              margin-right: 6px;
              background: #f0f0f0;
            }
            .section {
              border: 1px solid #e5e5e5;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 18px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 12px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 8px 16px;
              font-size: 14px;
            }
            .info-grid span {
              font-weight: 600;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }
            th, td {
              border: 1px solid #e2e2e2;
              padding: 8px;
              font-size: 13px;
            }
            th {
              background: #f7f7f7;
            }
            .chip {
              display: inline-block;
              padding: 4px 8px;
              background: #f0f9ff;
              color: #1890ff;
              border-radius: 16px;
              font-size: 12px;
              margin: 4px 4px 0 0;
            }
            .text-muted {
              color: #888;
              font-style: italic;
            }
            .prescription-card {
              border: 1px solid #e2e2e2;
              border-radius: 6px;
              padding: 12px;
              margin-bottom: 12px;
            }
            .prescription-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .timeline {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .timeline li {
              display: flex;
              margin-bottom: 12px;
            }
            .timeline-dot {
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: #1890ff;
              margin-right: 12px;
              margin-top: 5px;
            }
            .signature {
              margin-top: 32px;
              display: flex;
              justify-content: space-between;
              text-align: center;
            }
            .signature div {
              width: 45%;
            }
            .empty-row {
              text-align: center;
              font-style: italic;
              color: #888;
            }
            @media print {
              body {
                padding: 0;
              }
              .print-container {
                padding: 0 16px;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header">
              <h1>HỒ SƠ BỆNH ÁN</h1>
              <p>Mã hồ sơ: <strong>${record.recordCode || ''}</strong></p>
              <div class="tag-group">
                <span class="tag">Loại: ${typeLabel}</span>
                <span class="tag">Trạng thái: ${statusConfig[record.status] || 'Không xác định'}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">1. Thông tin bệnh nhân</div>
              <div class="info-grid">
                <div><span>Họ và tên:</span> ${record.patientInfo?.name || '-'}</div>
                <div><span>Số điện thoại:</span> ${record.patientInfo?.phone || '-'}</div>
                <div><span>Năm sinh:</span> ${record.patientInfo?.birthYear || '-'}</div>
                <div><span>Giới tính:</span> ${genderLabel}</div>
                <div><span>Địa chỉ:</span> ${record.patientInfo?.address || '-'}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">2. Thông tin khám</div>
              <div class="info-grid">
                <div><span>Ngày khám:</span> ${formatDate(record.date)}</div>
                <div>
                  <span>Thời gian dự kiến:</span>
                      ${record.appointmentStartTime || '-'} - ${record.appointmentEndTime || '-'}
                </div>
                <div><span>Nha sĩ phụ trách:</span> ${record.dentistName || '-'}</div>
                <div><span>Phòng khám:</span> ${record.roomName || '-'}</div>
                <div><span>Buồng:</span> ${record.subroomName || '-'}</div>
                <div><span>Kênh đặt:</span> ${record.bookingChannel === 'online' ? 'Đặt online' : 'Đặt tại phòng khám'}</div>
                <div><span>Dịch vụ chính:</span> ${record.serviceName || '-'}</div>
                <div><span>Dịch vụ con:</span> ${record.serviceAddOnName || 'Chưa chọn'}</div>
                <div><span>Chi phí:</span> ${formatCurrency(record.totalCost)}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">3. Chẩn đoán & ghi chú</div>
              <p><strong>Chẩn đoán:</strong> ${record.diagnosis || 'Chưa có'}</p>
              <p><strong>Triệu chứng:</strong> ${
                record.indications && record.indications.length
                  ? indicationBadges
                  : '<span class="text-muted">Chưa có</span>'
              }</p>
              <p><strong>Ghi chú:</strong> ${record.notes || '<span class="text-muted">Không có</span>'}</p>
            </div>

            <div class="section">
              <div class="section-title">4. Chỉ định điều trị</div>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Dịch vụ</th>
                    <th>Dịch vụ bổ sung</th>
                    <th>Ghi chú</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  ${treatmentRows}
                </tbody>
              </table>
            </div>

            <div class="section">
              <div class="section-title">5. Dịch vụ bổ sung</div>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Dịch vụ</th>
                    <th>Dịch vụ con</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  ${additionalServiceRows}
                </tbody>
              </table>
            </div>

            <div class="section">
              <div class="section-title">6. Đơn thuốc</div>
              ${prescriptionSection}
            </div>

            <div class="signature">
              <div>
                <strong>Bệnh nhân</strong>
                <p>(Ký, ghi rõ họ tên)</p>
              </div>
              <div>
                <strong>Nha sĩ phụ trách</strong>
                <p>(Ký, ghi rõ họ tên)</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Handle print button
  const handlePrint = (record) => {
    if (!record) {
      message.error('Không tìm thấy dữ liệu hồ sơ để in');
      return;
    }

    const documentContent = generatePrintHTML(record);
    const blob = new Blob([documentContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank', 'width=900,height=1000');

    if (!printWindow) {
      message.error('Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép pop-up.');
      URL.revokeObjectURL(url);
      return;
    }

    const triggerPrint = () => {
      printWindow.focus();
      printWindow.print();
      // Giữ cửa sổ in để người dùng xem lại
      URL.revokeObjectURL(url);
    };

    // Đảm bảo nội dung render xong trước khi in
    printWindow.onload = () => triggerPrint();
  };

  // Handle form success
  const handleFormSuccess = (updatedRecord) => {
    console.log('✅ [RecordList] handleFormSuccess called with:', updatedRecord);
    
    // Close modal and clear selection
    setShowFormModal(false);
    setSelectedRecord(null);
    
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

  // Tìm kiếm tại FE luôn, không dựa vào API (mã HS, tên, SĐT, ngày)
  useEffect(() => {
    let filtered = [...records];

    if (searchKeyword) {
      const keyword = searchKeyword.trim().toLowerCase();
      filtered = filtered.filter((record) => {
        const recordCode = record.recordCode?.toLowerCase() || '';
        const patientName = record.patientInfo?.name?.toLowerCase() || '';
        const patientPhone = (record.patientInfo?.phone || '').toString().toLowerCase();

        return (
          recordCode.includes(keyword) ||
          patientName.includes(keyword) ||
          patientPhone.includes(keyword)
        );
      });
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((record) => {
        if (!record.date) return false;
        const recordDate = dayjs(record.date);
        return (
          recordDate.isSameOrAfter(dateRange[0], 'day') &&
          recordDate.isSameOrBefore(dateRange[1], 'day')
        );
      });
    }

    setFilteredRecords(filtered);
  }, [records, searchKeyword, dateRange]);

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
                  if (!record.serviceAddOnPrice || record.serviceAddOnPrice <= 0) {
                    missingFields.push('giá dịch vụ con');
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
                  !record.serviceAddOnId ||
                  !record.serviceAddOnPrice ||
                  record.serviceAddOnPrice <= 0
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
          dataSource={filteredRecords}
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

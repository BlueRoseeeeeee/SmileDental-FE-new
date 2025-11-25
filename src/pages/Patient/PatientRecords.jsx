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
  DatePicker,
  Select,
  Row,
  Col
} from 'antd';
import { 
  FileTextOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import recordService from '../../services/recordService';
import dayjs from 'dayjs';
import './PatientRecords.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const PatientRecords = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // 🆕 Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    if (user?._id) {
      loadRecords();
    }
  }, [user?._id]);

  // 🆕 Filter records when filters change
  useEffect(() => {
    filterRecords();
  }, [statusFilter, typeFilter, dateRange, records]);

  // Auto refresh every 30 seconds when component is visible
  useEffect(() => {
    if (!user?._id) return;

    const intervalId = setInterval(() => {
      loadRecords();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [user?._id]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      console.log('🔍 [DEBUG] Loading records for user._id:', user._id);
      const response = await recordService.getRecordsByPatient(user._id);
      console.log('🔍 [DEBUG] Records response:', response);
      
      if (response.success && response.data) {
        console.log('🔍 [DEBUG] Records count:', response.data.length);
        setRecords(response.data);
        setFilteredRecords(response.data);
      } else {
        console.log('⚠️ [DEBUG] No records or failed response');
        setRecords([]);
        setFilteredRecords([]);
      }
    } catch (error) {
      console.error('Load records error:', error);
      message.error('Không thể tải danh sách hồ sơ');
      setRecords([]);
      setFilteredRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Filter records
  const filterRecords = () => {
    let filtered = [...records];
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(rec => rec.status === statusFilter);
    }
    
    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(rec => rec.type === typeFilter);
    }
    
    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(rec => {
        const recDate = dayjs(rec.createdAt);
        return recDate.isSameOrAfter(dateRange[0], 'day') && recDate.isSameOrBefore(dateRange[1], 'day');
      });
    }
    
    setFilteredRecords(filtered);
  };

  const getRecordStatusTag = (status) => {
    const statusConfig = {
      pending: { color: 'processing', text: 'Chờ xử lý' },
      'in-progress': { color: 'warning', text: 'Đang điều trị' },
      completed: { color: 'success', text: 'Hoàn thành' },
      cancelled: { color: 'default', text: 'Đã hủy' }
    };
    
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getRecordTypeTag = (type) => {
    const typeConfig = {
      exam: { color: 'blue', text: 'Khám' },
      treatment: { color: 'green', text: 'Điều trị' },
      checkup: { color: 'cyan', text: 'Tái khám' },
      emergency: { color: 'red', text: 'Cấp cứu' }
    };
    
    const config = typeConfig[type] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleViewDetail = (record) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: 'Mã hồ sơ',
      dataIndex: 'recordCode',
      key: 'recordCode',
      width: 140,
      render: (code) => <Text strong>{code || 'N/A'}</Text>
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 105,
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 95,
      render: (type) => getRecordTypeTag(type)
    },
    {
      title: 'Nha sĩ',
      dataIndex: 'dentistName',
      key: 'dentist',
      width: 140,
      render: (dentistName) => dentistName || 'N/A'
    },
    {
      title: 'Phòng khám',
      dataIndex: 'roomName',
      key: 'roomName',
      width: 160,
      render: (roomName, record) => (
        <div>
          <div>{roomName || 'N/A'}</div>
          {record.subroomName && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.subroomName}
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'serviceName',
      key: 'serviceName',
      width: 170,
      ellipsis: true,
      render: (serviceName, record) => (
        <div>
          <div>{serviceName || 'N/A'}</div>
          {record.serviceAddOnName && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.serviceAddOnName}
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'Chẩn đoán',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      width: 150,
      ellipsis: true,
      render: (diagnosis) => diagnosis || 'Chưa có'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 115,
      render: (status) => getRecordStatusTag(status)
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 95,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          Chi tiết
        </Button>
      )
    }
  ];

  return (
    <div className="patient-records-page">
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0 }}>Hồ sơ của tôi</Title>
          </Space>
        }
        extra={
          <Button type="primary" onClick={loadRecords} loading={loading}>
            Làm mới
          </Button>
        }
      >
        {/* 🆕 Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Lọc theo trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              onClear={() => setStatusFilter('all')}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="pending">Chờ xử lý</Option>
              <Option value="in-progress">Đang điều trị</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Lọc theo loại"
              value={typeFilter}
              onChange={setTypeFilter}
              allowClear
              onClear={() => setTypeFilter('all')}
            >
              <Option value="all">Tất cả loại</Option>
              <Option value="exam">Khám</Option>
              <Option value="treatment">Điều trị</Option>
              <Option value="checkup">Tái khám</Option>
              <Option value="emergency">Cấp cứu</Option>
            </Select>
          </Col>
          <Col span={12}>
            <RangePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              value={dateRange}
              onChange={setDateRange}
              placeholder={['Từ ngày', 'Đến ngày']}
              allowClear
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} hồ sơ`,
            showSizeChanger: true
          }}
          locale={{
            emptyText: (
              <Empty
                description="Chưa có hồ sơ nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Record Detail Modal  */}
      <Modal
        title={<Space><FileTextOutlined /> Chi tiết hồ sơ</Space>}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={900}
      >
        {selectedRecord && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Mã hồ sơ" span={2}>
              <Text strong>{selectedRecord.recordCode || 'N/A'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {dayjs(selectedRecord.createdAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Loại">
              {getRecordTypeTag(selectedRecord.type)}
            </Descriptions.Item>
            <Descriptions.Item label="Nha sĩ" span={2}>
              {selectedRecord.dentistName || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Dịch vụ" span={2}>
              {selectedRecord.serviceName || 'N/A'}
              {selectedRecord.serviceAddOnName && ` - ${selectedRecord.serviceAddOnName}`}
            </Descriptions.Item>
            <Descriptions.Item label="Phòng khám">
              {selectedRecord.roomName || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Buồng">
              {selectedRecord.subroomName || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Giá dịch vụ">
              {selectedRecord.servicePrice?.toLocaleString('vi-VN')} đ
            </Descriptions.Item>
            <Descriptions.Item label="Giá dịch vụ bổ sung">
              {selectedRecord.serviceAddOnPrice?.toLocaleString('vi-VN')} đ
            </Descriptions.Item>
            <Descriptions.Item label="Số lượng">
              {selectedRecord.quantity || 1}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng chi phí">
              <Text strong style={{ color: '#1890ff' }}>
                {selectedRecord.totalCost?.toLocaleString('vi-VN')} đ
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Triệu chứng" span={2}>
              {selectedRecord.indications && selectedRecord.indications.length > 0
                ? selectedRecord.indications.join(', ')
                : 'Không có'}
            </Descriptions.Item>
            <Descriptions.Item label="Chẩn đoán" span={2}>
              {selectedRecord.diagnosis || 'Chưa có'}
            </Descriptions.Item>
            <Descriptions.Item label="Kế hoạch điều trị" span={2}>
              {selectedRecord.treatmentIndications && selectedRecord.treatmentIndications.length > 0 ? (
                <div>
                  {selectedRecord.treatmentIndications.map((indication, index) => (
                    <div key={index} style={{ marginBottom: 8 }}>
                      <Text strong>{indication.serviceName}</Text>
                      {indication.serviceAddOnName && ` - ${indication.serviceAddOnName}`}
                      {indication.notes && (
                        <div style={{ marginLeft: 16, color: '#666' }}>
                          Ghi chú: {indication.notes}
                        </div>
                      )}
                      <Tag color={indication.used ? 'success' : 'default'}>
                        {indication.used ? 'Đã sử dụng' : 'Chưa sử dụng'}
                      </Tag>
                    </div>
                  ))}
                </div>
              ) : (
                'Chưa có'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Dịch vụ bổ sung" span={2}>
              {selectedRecord.additionalServices && selectedRecord.additionalServices.length > 0 ? (
                <div>
                  {selectedRecord.additionalServices.map((service, index) => (
                    <div key={index} style={{ marginBottom: 8 }}>
                      <Text strong>{service.serviceName}</Text>
                      {service.serviceAddOnName && ` - ${service.serviceAddOnName}`}
                      {service.price && (
                        <span style={{ marginLeft: 8, color: '#1890ff' }}>
                          {service.price.toLocaleString('vi-VN')} đ
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                'Không có'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú" span={2}>
              {selectedRecord.notes || 'Không có'}
            </Descriptions.Item>
            <Descriptions.Item label="Kênh đặt">
              <Tag color={selectedRecord.bookingChannel === 'online' ? 'blue' : 'green'}>
                {selectedRecord.bookingChannel === 'online' ? 'Đặt online' : 'Đặt tại phòng khám'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Thanh toán">
              <Tag color={selectedRecord.paymentStatus === 'paid' ? 'success' : 'warning'}>
                {selectedRecord.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Độ ưu tiên">
              <Tag color={selectedRecord.priority === 'urgent' ? 'red' : selectedRecord.priority === 'high' ? 'orange' : 'default'}>
                {selectedRecord.priority === 'urgent' ? 'Khẩn cấp' : selectedRecord.priority === 'high' ? 'Cao' : 'Bình thường'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {getRecordStatusTag(selectedRecord.status)}
            </Descriptions.Item>
            {selectedRecord.startedAt && (
              <Descriptions.Item label="Bắt đầu">
                {dayjs(selectedRecord.startedAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
            )}
            {selectedRecord.completedAt && (
              <Descriptions.Item label="Hoàn thành">
                {dayjs(selectedRecord.completedAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default PatientRecords;

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
  Empty
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

const PatientRecords = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Load records when component mounts and user is available
  useEffect(() => {
    if (user?._id) {
      loadRecords();
    }
  }, [user?._id]);

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
      } else {
        console.log('⚠️ [DEBUG] No records or failed response');
        setRecords([]);
      }
    } catch (error) {
      console.error('Load records error:', error);
      message.error('Không thể tải danh sách hồ sơ');
      setRecords([]);
    } finally {
      setLoading(false);
    }
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
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code) => <Text strong>{code}</Text>
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
      width: 100,
      render: (type) => getRecordTypeTag(type)
    },
    {
      title: 'Nha sĩ',
      dataIndex: ['dentist', 'fullName'],
      key: 'dentist',
      width: 150,
      render: (_, record) => record.dentist?.fullName || 'N/A'
    },
    {
      title: 'Chẩn đoán',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      ellipsis: true,
      render: (diagnosis) => diagnosis || 'Chưa có'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getRecordStatusTag(status)
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
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
        <Table
          columns={columns}
          dataSource={records}
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
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Record Detail Modal */}
      <Modal
        title={<Space><FileTextOutlined /> Chi tiết hồ sơ</Space>}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        {selectedRecord && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Mã hồ sơ" span={2}>
              <Text strong>{selectedRecord.code}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {dayjs(selectedRecord.createdAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Loại">
              {getRecordTypeTag(selectedRecord.type)}
            </Descriptions.Item>
            <Descriptions.Item label="Nha sĩ" span={2}>
              {selectedRecord.dentist?.fullName || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Triệu chứng" span={2}>
              {selectedRecord.symptoms || 'Không có'}
            </Descriptions.Item>
            <Descriptions.Item label="Chẩn đoán" span={2}>
              {selectedRecord.diagnosis || 'Chưa có'}
            </Descriptions.Item>
            <Descriptions.Item label="Kế hoạch điều trị" span={2}>
              {selectedRecord.treatmentPlan || 'Chưa có'}
            </Descriptions.Item>
            {selectedRecord.prescription && selectedRecord.prescription.length > 0 && (
              <Descriptions.Item label="Đơn thuốc" span={2}>
                {selectedRecord.prescription.map((med, index) => (
                  <div key={index} style={{ marginBottom: 8 }}>
                    <Text strong>{med.name}</Text>: {med.dosage} - {med.frequency}
                    {med.duration && ` (${med.duration})`}
                  </div>
                ))}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Ghi chú" span={2}>
              {selectedRecord.notes || 'Không có'}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái" span={2}>
              {getRecordStatusTag(selectedRecord.status)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default PatientRecords;

/**
 * Record Detail Drawer Component
 * 
 * Drawer for viewing detailed medical record information
 * Features:
 * - Patient information
 * - Appointment details
 * - Diagnosis and indications
 * - Prescription details
 * - Treatment indications
 * - Timeline (created, updated, completed)
 * - Actions: Edit, Print, Complete
 */

import React, { useState } from 'react';
import {
  Drawer,
  Descriptions,
  Space,
  Button,
  Tag,
  Divider,
  Card,
  Typography,
  Timeline,
  Alert,
  Row,
  Col,
  Empty
} from 'antd';
import {
  EditOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  CalendarOutlined,
  DollarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import AdditionalServicesManager from './AdditionalServicesManager';

const { Title, Text } = Typography;

const RecordDetailDrawer = ({ 
  visible, 
  record: initialRecord, 
  onClose, 
  onEdit, 
  onComplete,
  onPrint 
}) => {
  const [record, setRecord] = useState(initialRecord);

  // Update record when initialRecord changes
  React.useEffect(() => {
    setRecord(initialRecord);
  }, [initialRecord]);

  const handleServiceUpdate = (updatedRecord) => {
    setRecord(updatedRecord);
  };

  if (!record) return null;

  // Status config
  const statusConfig = {
    pending: { color: 'orange', text: 'Chờ khám' },
    'in-progress': { color: 'blue', text: 'Đang khám' },
    completed: { color: 'green', text: 'Hoàn thành' },
    cancelled: { color: 'red', text: 'Đã hủy' }
  };

  const paymentConfig = {
    unpaid: { color: 'red', text: 'Chưa thanh toán' },
    partial: { color: 'orange', text: 'Thanh toán 1 phần' },
    paid: { color: 'green', text: 'Đã thanh toán' }
  };

  const priorityConfig = {
    low: { color: 'default', text: 'Thấp' },
    normal: { color: 'blue', text: 'Bình thường' },
    high: { color: 'orange', text: 'Cao' },
    urgent: { color: 'red', text: 'Khẩn cấp' }
  };

  const currentStatus = statusConfig[record.status] || { color: 'default', text: record.status };
  const currentPayment = paymentConfig[record.paymentStatus] || { color: 'default', text: record.paymentStatus };
  const currentPriority = priorityConfig[record.priority] || { color: 'default', text: record.priority };

  return (
    <Drawer
      title={
        <Space>
          <FileTextOutlined style={{ fontSize: 20 }} />
          <span>Chi tiết hồ sơ: {record.recordCode}</span>
        </Space>
      }
      placement="right"
      width={1000}
      onClose={onClose}
      open={visible}
      extra={
        <Space>
          {record.status === 'in-progress' && (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              >
                Sửa
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => onComplete(record)}
                style={{ 
                  backgroundColor: '#52c41a',
                  borderColor: '#52c41a'
                }}
                disabled={!(record.diagnosis && record.diagnosis.trim() && record.totalCost > 0)}
              >
                Hoàn thành
              </Button>
            </>
          )}
          <Button
            icon={<PrinterOutlined />}
            onClick={() => onPrint(record)}
          >
            In
          </Button>
        </Space>
      }
    >
      {/* Status Tags */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Tag color={record.type === 'exam' ? 'blue' : 'green'} style={{ fontSize: 13 }}>
            {record.type === 'exam' ? '📋 Khám bệnh' : '🏥 Điều trị'}
          </Tag>
          <Tag color={currentStatus.color} style={{ fontSize: 13 }}>
            {currentStatus.text}
          </Tag>
          {/* <Tag color={currentPayment.color} style={{ fontSize: 13 }}>
            {currentPayment.text}
          </Tag>
          <Tag color={currentPriority.color} style={{ fontSize: 13 }}>
            Ưu tiên: {currentPriority.text}
          </Tag> */}
        </Space>
      </div>

      {/* Patient Information */}
      <Card 
        title={
          <Space>
            <UserOutlined />
            <Text strong>Thông tin bệnh nhân</Text>
          </Space>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Họ tên">
            <Text strong>{record.patientInfo.name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            {record.patientInfo.phone}
          </Descriptions.Item>
          <Descriptions.Item label="Năm sinh">
            {record.patientInfo.birthYear}
          </Descriptions.Item>
          {/* <Descriptions.Item label="Giới tính">
            {record.patientInfo.gender === 'male' ? 'Nam' : record.patientInfo.gender === 'female' ? 'Nữ' : 'Khác'}
          </Descriptions.Item> */}
          {record.patientInfo.address && (
            <Descriptions.Item label="Địa chỉ">
              {record.patientInfo.address}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Appointment Details */}
      <Card 
        title={
          <Space>
            <CalendarOutlined />
            <Text strong>Thông tin khám</Text>
          </Space>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Ngày khám" span={2}>
            <Tag color="blue">{dayjs(record.date).format('DD/MM/YYYY')}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Dịch vụ" span={2}>
            <Text strong>{record.serviceName}</Text>
          </Descriptions.Item>
          {record.serviceAddOnName && (
            <Descriptions.Item label="Gói dịch vụ" span={2}>
              <Text strong>{record.serviceAddOnName}</Text>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Nha sĩ" span={2}>
            {record.dentistName}
          </Descriptions.Item>
          <Descriptions.Item label="Phòng khám" span={2}>
            {record.roomName}
          </Descriptions.Item>
          {record.startedAt && (
            <Descriptions.Item label="Thời gian bắt đầu" span={2}>
              <Tag color="blue" icon={<ClockCircleOutlined />}>
                {dayjs(record.startedAt).format('HH:mm:ss - DD/MM/YYYY')}
              </Tag>
            </Descriptions.Item>
          )}
          {record.completedAt && (
            <Descriptions.Item label="Thời gian hoàn thành" span={2}>
              <Tag color="green" icon={<CheckCircleOutlined />}>
                {dayjs(record.completedAt).format('HH:mm:ss - DD/MM/YYYY')}
              </Tag>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Diagnosis */}
      <Card 
        title={
          <Space>
            <FileTextOutlined />
            <Text strong>Chẩn đoán</Text>
          </Space>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        {record.diagnosis ? (
          <>
            <Text>{record.diagnosis}</Text>
            
            {record.indications && record.indications.length > 0 && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Chỉ định:</Text>
                <Space direction="vertical" size="small">
                  {record.indications.map((indication, index) => (
                    <Tag key={index} color="blue">
                      {indication}
                    </Tag>
                  ))}
                </Space>
              </>
            )}

            {record.notes && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Ghi chú:</Text>
                <Text type="secondary">{record.notes}</Text>
              </>
            )}
          </>
        ) : (
          <Empty description="Chưa có chẩn đoán" />
        )}
      </Card>

      {/* Prescription */}
      <Card 
        title={
          <Space>
            <MedicineBoxOutlined />
            <Text strong>Đơn thuốc</Text>
          </Space>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        {record.prescription && record.prescription.medicines && record.prescription.medicines.length > 0 ? (
          <>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {record.prescription.medicines.map((medicine, index) => (
                <Card
                  key={index}
                  size="small"
                  type="inner"
                  title={
                    <Space>
                      <Tag color="green">{index + 1}</Tag>
                      <Text strong>{medicine.medicineName}</Text>
                      {medicine.unit && <Text type="secondary">({medicine.unit})</Text>}
                      {medicine.category && <Tag color="blue">{medicine.category}</Tag>}
                    </Space>
                  }
                >
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Cách dùng">
                      {medicine.dosageInstruction || medicine.dosage}
                    </Descriptions.Item>
                    <Descriptions.Item label="Thời gian dùng">
                      {medicine.duration}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số lượng">
                      {medicine.quantity} {medicine.unit}
                    </Descriptions.Item>
                    {medicine.note && (
                      <Descriptions.Item label="Ghi chú">
                        <Text type="secondary">{medicine.note}</Text>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              ))}
            </Space>

            {record.prescription.notes && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <Alert
                  type="info"
                  message="Lưu ý khi dùng thuốc"
                  description={record.prescription.notes}
                  showIcon
                />
              </>
            )}

            {record.prescription.prescribedAt && (
              <div style={{ marginTop: 12, textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Kê đơn: {dayjs(record.prescription.prescribedAt).format('DD/MM/YYYY HH:mm')}
                </Text>
              </div>
            )}
          </>
        ) : (
          <Empty description="Chưa có đơn thuốc" />
        )}
      </Card>

      {/* Additional Services Manager */}
      <div style={{ marginBottom: 16 }}>
        <AdditionalServicesManager
          recordId={record._id}
          record={record}
          onUpdate={handleServiceUpdate}
        />
      </div>

      {/* Treatment Indications (only for exam records) */}
      {record.type === 'exam' && record.treatmentIndications && record.treatmentIndications.length > 0 && (
        <Card 
          title={
            <Space>
              <MedicineBoxOutlined />
              <Text strong>Chỉ định điều trị</Text>
            </Space>
          }
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {record.treatmentIndications.map((indication, index) => (
              <Card
                key={index}
                size="small"
                type="inner"
                style={{ background: indication.used ? '#f6ffed' : '#fff' }}
              >
                <Row align="middle">
                  <Col span={18}>
                    <Space>
                      <Tag color={indication.used ? 'green' : 'orange'}>
                        {indication.used ? '✅ Đã thực hiện' : '⏳ Chưa thực hiện'}
                      </Tag>
                      <Text strong>{indication.serviceName}</Text>
                    </Space>
                    {indication.notes && (
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {indication.notes}
                        </Text>
                      </div>
                    )}
                  </Col>
                  <Col span={6} style={{ textAlign: 'right' }}>
                    {indication.usedAt && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(indication.usedAt).format('DD/MM/YYYY')}
                      </Text>
                    )}
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        </Card>
      )}

      {/* Timeline */}
      <Card 
        title={
          <Space>
            <ClockCircleOutlined />
            <Text strong>Lịch sử</Text>
          </Space>
        }
        size="small"
      >
        <Timeline
          items={[
            {
              color: 'green',
              children: (
                <>
                  <Text strong>Tạo hồ sơ</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(record.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                  </Text>
                </>
              )
            },
            record.startedAt && {
              color: 'blue',
              children: (
                <>
                  <Text strong>Bắt đầu khám</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(record.startedAt).format('DD/MM/YYYY HH:mm:ss')}
                  </Text>
                </>
              )
            },
            record.updatedAt && record.updatedAt !== record.createdAt && !record.completedAt && {
              color: 'blue',
              children: (
                <>
                  <Text strong>Cập nhật</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(record.updatedAt).format('DD/MM/YYYY HH:mm:ss')}
                  </Text>
                </>
              )
            },
            record.completedAt && {
              color: 'green',
              children: (
                <>
                  <Text strong>Hoàn thành</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(record.completedAt).format('DD/MM/YYYY HH:mm:ss')}
                  </Text>
                </>
              )
            }
          ].filter(Boolean)}
        />
      </Card>
    </Drawer>
  );
};

export default RecordDetailDrawer;

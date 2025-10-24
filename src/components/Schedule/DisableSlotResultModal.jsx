/*
 * @author: AI Assistant
 * Task 3.4 - Display slot disable results
 */
import React from 'react';
import { Modal, Tabs, Table, Button, Space, Typography, Tag, Empty } from 'antd';
import { MailOutlined, PhoneOutlined, DownloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Text } = Typography;
const { TabPane } = Tabs;

const DisableSlotResultModal = ({ visible, onClose, affectedPatients = {} }) => {
  const { emailedPatients = [], manualContactPatients = [] } = affectedPatients;

  // Columns for emailed patients
  const emailedColumns = [
    {
      title: 'Tên bệnh nhân',
      dataIndex: ['patientInfo', 'name'],
      key: 'name',
      width: 200,
    },
    {
      title: 'Email',
      dataIndex: ['patientInfo', 'email'],
      key: 'email',
      width: 200,
      render: (email) => (
        <Space>
          <MailOutlined style={{ color: '#1890ff' }} />
          <Text>{email}</Text>
        </Space>
      ),
    },
    {
      title: 'Thời gian hẹn',
      key: 'appointment',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{new Date(record.appointmentDate).toLocaleDateString('vi-VN')}</div>
          <Text type="secondary">{record.startTime} - {record.endTime}</Text>
        </div>
      ),
    },
    {
      title: 'Slot',
      key: 'slot',
      width: 150,
      render: (_, record) => (
        <Tag color="blue">{record.slotIds?.length || 0} slot</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: () => (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Đã gửi email
        </Tag>
      ),
    },
  ];

  // Columns for manual contact patients
  const manualColumns = [
    {
      title: 'Tên bệnh nhân',
      dataIndex: ['patientInfo', 'name'],
      key: 'name',
      width: 200,
    },
    {
      title: 'Số điện thoại',
      dataIndex: ['patientInfo', 'phone'],
      key: 'phone',
      width: 150,
      render: (phone) => (
        <Space>
          <PhoneOutlined style={{ color: '#52c41a' }} />
          <Text strong copyable>{phone}</Text>
        </Space>
      ),
    },
    {
      title: 'Thời gian hẹn',
      key: 'appointment',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{new Date(record.appointmentDate).toLocaleDateString('vi-VN')}</div>
          <Text type="secondary">{record.startTime} - {record.endTime}</Text>
        </div>
      ),
    },
    {
      title: 'Slot',
      key: 'slot',
      width: 150,
      render: (_, record) => (
        <Tag color="orange">{record.slotIds?.length || 0} slot</Tag>
      ),
    },
    {
      title: 'Lý do',
      key: 'reason',
      width: 200,
      render: () => (
        <Text type="secondary">Email không khả dụng</Text>
      ),
    },
  ];

  // Export to Excel
  const handleExportExcel = () => {
    const worksheetData = manualContactPatients.map((patient, index) => ({
      'STT': index + 1,
      'Tên bệnh nhân': patient.patientInfo.name,
      'Số điện thoại': patient.patientInfo.phone,
      'Ngày hẹn': new Date(patient.appointmentDate).toLocaleDateString('vi-VN'),
      'Giờ hẹn': `${patient.startTime} - ${patient.endTime}`,
      'Số slot': patient.slotIds?.length || 0,
      'Ghi chú': 'Cần liên hệ thủ công'
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách liên hệ');

    // Auto-size columns
    const maxWidth = worksheetData.reduce((w, r) => Math.max(w, r['Tên bệnh nhân']?.length || 0), 10);
    worksheet['!cols'] = [
      { wch: 5 },
      { wch: maxWidth },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 10 },
      { wch: 20 }
    ];

    XLSX.writeFile(workbook, `Danh_sach_lien_he_${new Date().getTime()}.xlsx`);
  };

  return (
    <Modal
      title="Kết quả tắt slot"
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>
      ]}
    >
      <Tabs defaultActiveKey="emailed">
        <TabPane
          tab={
            <span>
              <MailOutlined />
              Đã gửi email ({emailedPatients.length})
            </span>
          }
          key="emailed"
        >
          {emailedPatients.length === 0 ? (
            <Empty description="Không có bệnh nhân nào được gửi email" />
          ) : (
            <Table
              columns={emailedColumns}
              dataSource={emailedPatients}
              rowKey={(record) => record._id || record.appointmentCode}
              pagination={{
                pageSize: 5,
                showTotal: (total) => `Tổng ${total} bệnh nhân`
              }}
              scroll={{ x: 800 }}
            />
          )}
        </TabPane>

        <TabPane
          tab={
            <span>
              <PhoneOutlined />
              Cần liên hệ thủ công ({manualContactPatients.length})
            </span>
          }
          key="manual"
        >
          {manualContactPatients.length === 0 ? (
            <Empty description="Không có bệnh nhân cần liên hệ thủ công" />
          ) : (
            <>
              <Space style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleExportExcel}
                >
                  Xuất Excel
                </Button>
                <Text type="secondary">
                  Tải danh sách bệnh nhân cần liên hệ để gọi điện thông báo
                </Text>
              </Space>
              <Table
                columns={manualColumns}
                dataSource={manualContactPatients}
                rowKey={(record) => record._id || record.appointmentCode}
                pagination={{
                  pageSize: 5,
                  showTotal: (total) => `Tổng ${total} bệnh nhân`
                }}
                scroll={{ x: 900 }}
              />
            </>
          )}
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default DisableSlotResultModal;

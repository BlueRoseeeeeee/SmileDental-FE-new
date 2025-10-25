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
  // Backend trả về: { emailsSent: [], needsManualContact: [] }
  const { emailsSent = [], needsManualContact = [] } = affectedPatients;

  // Columns for emailed patients
  // Backend: { appointmentId, slotId, patientName, patientEmail, startTime, endTime, shiftName }
  const emailedColumns = [
    {
      title: 'Tên bệnh nhân',
      dataIndex: 'patientName',
      key: 'name',
      width: 200,
    },
    {
      title: 'Email',
      dataIndex: 'patientEmail',
      key: 'email',
      width: 220,
      render: (email) => (
        <Space>
          <MailOutlined style={{ color: '#1890ff' }} />
          <Text>{email}</Text>
        </Space>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{new Date(record.startTime).toLocaleDateString('vi-VN')}</div>
          <Text type="secondary">
            {new Date(record.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})} 
            {' - '}
            {new Date(record.endTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
          </Text>
        </div>
      ),
    },
    {
      title: 'Ca',
      dataIndex: 'shiftName',
      key: 'shift',
      width: 100,
      render: (shift) => (
        <Tag color="blue">{shift}</Tag>
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
  // Backend: { appointmentId, slotId, patientName, patientPhone, startTime, endTime, shiftName, reason }
  const manualColumns = [
    {
      title: 'Tên bệnh nhân',
      dataIndex: 'patientName',
      key: 'name',
      width: 180,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'patientPhone',
      key: 'phone',
      width: 150,
      render: (phone) => (
        <Space>
          <PhoneOutlined style={{ color: '#52c41a' }} />
          <Text strong copyable>{phone || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{new Date(record.startTime).toLocaleDateString('vi-VN')}</div>
          <Text type="secondary">
            {new Date(record.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
            {' - '}
            {new Date(record.endTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
          </Text>
        </div>
      ),
    },
    {
      title: 'Ca',
      dataIndex: 'shiftName',
      key: 'shift',
      width: 100,
      render: (shift) => (
        <Tag color="orange">{shift}</Tag>
      ),
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      width: 200,
      render: (reason) => (
        <Text type="secondary">{reason || 'Email không khả dụng'}</Text>
      ),
    },
  ];

  // Export to Excel
  const handleExportExcel = () => {
    const worksheetData = needsManualContact.map((patient, index) => ({
      'STT': index + 1,
      'Tên bệnh nhân': patient.patientName || 'N/A',
      'Số điện thoại': patient.patientPhone || 'N/A',
      'Ngày hẹn': new Date(patient.startTime).toLocaleDateString('vi-VN'),
      'Giờ hẹn': `${new Date(patient.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})} - ${new Date(patient.endTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}`,
      'Ca làm việc': patient.shiftName || 'N/A',
      'Lý do': patient.reason || 'Cần liên hệ thủ công'
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
              Đã gửi email ({emailsSent.length})
            </span>
          }
          key="emailed"
        >
          {emailsSent.length === 0 ? (
            <Empty description="Không có bệnh nhân nào được gửi email" />
          ) : (
            <Table
              columns={emailedColumns}
              dataSource={emailsSent}
              rowKey={(record) => record.slotId || record.appointmentId}
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
              Cần liên hệ thủ công ({needsManualContact.length})
            </span>
          }
          key="manual"
        >
          {needsManualContact.length === 0 ? (
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
                dataSource={needsManualContact}
                rowKey={(record) => record.slotId || record.appointmentId}
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

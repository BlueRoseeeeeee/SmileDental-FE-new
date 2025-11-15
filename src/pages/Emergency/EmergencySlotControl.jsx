/**
 * @author: HoTram
 * Emergency Slot Control - Quản lý tắt/bật khẩn cấp toàn bộ lịch trong 1 ngày
 * Chỉ dành cho Admin
 */
import React, { useState } from 'react';
import {
  Card,
  DatePicker,
  Input,
  Button,
  Space,
  Typography,
  Alert,
  Modal,
  Spin,
  Row,
  Col,
  Statistic,
  Empty
} from 'antd';
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import slotService from '../../services/slotService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const EmergencySlotControl = () => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [reason, setReason] = useState('');
  const [lastResult, setLastResult] = useState(null);

  // Modal states
  const [disableModalVisible, setDisableModalVisible] = useState(false);
  const [enableModalVisible, setEnableModalVisible] = useState(false);

  const handleDisableAllDay = async () => {
    if (!selectedDate) {
      toast.error('Vui lòng chọn ngày');
      return;
    }

    if (!reason || reason.trim().length < 10) {
      toast.error('Lý do phải có ít nhất 10 ký tự');
      return;
    }

    setDisableModalVisible(false);
    setLoading(true);

    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      console.log('🚨 Disabling all slots for date:', dateStr);

      const result = await slotService.disableAllDaySlots(dateStr, reason.trim());

      console.log('✅ Disable result:', result);

      if (result.success) {
        setLastResult({
          type: 'disable',
          ...result
        });
        toast.success(result.message || 'Tắt toàn bộ lịch thành công');
        // Reset form
        setReason('');
      } else {
        toast.error(result.message || 'Tắt lịch thất bại');
      }
    } catch (error) {
      console.error('❌ Error disabling all day slots:', error);
      toast.error(error.response?.data?.message || error.message || 'Lỗi khi tắt lịch');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableAllDay = async () => {
    if (!selectedDate) {
      toast.error('Vui lòng chọn ngày');
      return;
    }

    setEnableModalVisible(false);
    setLoading(true);

    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      console.log('✅ Enabling all slots for date:', dateStr);

      const result = await slotService.enableAllDaySlots(
        dateStr,
        reason.trim() || 'Kích hoạt lại lịch khám'
      );

      console.log('✅ Enable result:', result);

      if (result.success) {
        setLastResult({
          type: 'enable',
          ...result
        });
        toast.success(result.message || 'Bật toàn bộ lịch thành công');
        // Reset form
        setReason('');
      } else {
        toast.error(result.message || 'Bật lịch thất bại');
      }
    } catch (error) {
      console.error('❌ Error enabling all day slots:', error);
      toast.error(error.response?.data?.message || error.message || 'Lỗi khi bật lịch');
    } finally {
      setLoading(false);
    }
  };

  const showDisableConfirm = () => {
    if (!selectedDate) {
      toast.error('Vui lòng chọn ngày');
      return;
    }

    if (!reason || reason.trim().length < 10) {
      toast.error('Lý do phải có ít nhất 10 ký tự');
      return;
    }

    setDisableModalVisible(true);
  };

  const showEnableConfirm = () => {
    if (!selectedDate) {
      toast.error('Vui lòng chọn ngày');
      return;
    }

    setEnableModalVisible(true);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: '12px' }} />
        Quản Lý Lịch Khẩn Cấp
      </Title>

      <Alert
        message="Chức năng dành cho Admin"
        description="Tắt/Bật toàn bộ lịch của MỌI PHÒNG KHÁM trong 1 ngày. Hệ thống sẽ tự động gửi email thông báo cho bệnh nhân và nhân viên."
        type="warning"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Row gutter={[24, 24]}>
        {/* Control Panel */}
        <Col xs={24} lg={12}>
          <Card title="Chọn ngày và lý do">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                  Chọn ngày: <span style={{ color: 'red' }}>*</span>
                </Text>
                <DatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày"
                  style={{ width: '100%' }}
                  disabled={loading}
                />
              </div>

              <div>
                <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                  Lý do: <span style={{ color: 'red' }}>*</span> (tối thiểu 10 ký tự cho tắt lịch)
                </Text>
                <TextArea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Phòng khám đóng cửa khẩn cấp do sự cố điện..."
                  rows={4}
                  disabled={loading}
                  showCount
                  maxLength={500}
                />
              </div>

              <Space style={{ width: '100%', justifyContent: 'center' }} size="large">
                <Button
                  type="primary"
                  danger
                  size="large"
                  icon={<CloseCircleOutlined />}
                  onClick={showDisableConfirm}
                  loading={loading}
                  disabled={!selectedDate || !reason || reason.trim().length < 10}
                >
                  TẮT TOÀN BỘ LỊCH
                </Button>

                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircleOutlined />}
                  onClick={showEnableConfirm}
                  loading={loading}
                  disabled={!selectedDate}
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                >
                  BẬT LẠI TOÀN BỘ LỊCH
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>

        {/* Result Panel */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ReloadOutlined />
                Kết quả thao tác gần nhất
              </Space>
            }
          >
            {!lastResult ? (
              <Empty description="Chưa có thao tác nào" />
            ) : (
              <Spin spinning={loading}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Alert
                    message={
                      lastResult.type === 'disable'
                        ? '🚨 Tắt lịch khẩn cấp'
                        : '✅ Bật lại lịch'
                    }
                    description={lastResult.message}
                    type={lastResult.type === 'disable' ? 'error' : 'success'}
                    showIcon
                  />

                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title={lastResult.type === 'disable' ? 'Slots đã tắt' : 'Slots đã bật'}
                        value={lastResult.disabledCount || lastResult.enabledCount || 0}
                        prefix={
                          lastResult.type === 'disable' ? (
                            <CloseCircleOutlined />
                          ) : (
                            <CheckCircleOutlined />
                          )
                        }
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Tổng số slots"
                        value={lastResult.totalSlots || 0}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Số phòng bị ảnh hưởng"
                        value={lastResult.affectedRooms || 0}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Email đã gửi"
                        value={lastResult.emailsQueued || 0}
                      />
                    </Col>
                  </Row>
                </Space>
              </Spin>
            )}
          </Card>
        </Col>
      </Row>

      {/* Disable Confirmation Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            XÁC NHẬN TẮT TOÀN BỘ LỊCH
          </Space>
        }
        open={disableModalVisible}
        onOk={handleDisableAllDay}
        onCancel={() => setDisableModalVisible(false)}
        okText="Xác nhận tắt lịch"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <Paragraph>
          Bạn có chắc chắn muốn <Text strong type="danger">TẮT TOÀN BỘ LỊCH</Text> của{' '}
          <Text strong>MỌI PHÒNG KHÁM</Text> vào ngày:{' '}
          <Text strong>{selectedDate?.format('DD/MM/YYYY')}</Text>?
        </Paragraph>
        <Paragraph>
          <Text type="danger">
            ⚠️ Hành động này sẽ:
          </Text>
        </Paragraph>
        <ul>
          <li>Tắt tất cả các slot trong ngày</li>
          <li>Gửi email thông báo cho bệnh nhân và nhân viên</li>
          <li>Không thể hoàn tác tự động</li>
        </ul>
        <Paragraph strong>
          Lý do: <Text type="danger">{reason}</Text>
        </Paragraph>
      </Modal>

      {/* Enable Confirmation Modal */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            XÁC NHẬN BẬT LẠI TOÀN BỘ LỊCH
          </Space>
        }
        open={enableModalVisible}
        onOk={handleEnableAllDay}
        onCancel={() => setEnableModalVisible(false)}
        okText="Xác nhận bật lại lịch"
        cancelText="Hủy"
        okButtonProps={{ style: { background: '#52c41a', borderColor: '#52c41a' } }}
      >
        <Paragraph>
          Bạn có chắc chắn muốn <Text strong type="success">BẬT LẠI TOÀN BỘ LỊCH</Text> đã bị tắt của{' '}
          <Text strong>MỌI PHÒNG KHÁM</Text> vào ngày:{' '}
          <Text strong>{selectedDate?.format('DD/MM/YYYY')}</Text>?
        </Paragraph>
        <Paragraph>
          <Text type="success">
            ℹ️ Hành động này sẽ:
          </Text>
        </Paragraph>
        <ul>
          <li>Bật lại tất cả các slot đã bị tắt trong ngày</li>
          <li>Gửi email thông báo cho bệnh nhân và nhân viên</li>
          <li>Lịch có thể sử dụng ngay lập tức</li>
        </ul>
        {reason && (
          <Paragraph strong>
            Lý do: <Text type="success">{reason}</Text>
          </Paragraph>
        )}
      </Modal>
    </div>
  );
};

export default EmergencySlotControl;

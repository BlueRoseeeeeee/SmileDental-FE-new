/**
 * @author: HoTram
 *  
 */
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Button, Space, Select, DatePicker, Table, Tag, Alert, Spin, Modal, Form, InputNumber, Divider, Badge, Tooltip, Empty, Tabs, Statistic } from 'antd';
import { CalendarOutlined, ThunderboltOutlined, ReloadOutlined, ExclamationCircleOutlined, BarChartOutlined, SettingOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { scheduleService } from '../../services';
import { toast } from '../../services/toastService.js';
import './ScheduleManagement.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ScheduleManagement = () => {
  // Main tab state
  const [activeTab, setActiveTab] = useState('overview');
  
  // Loading / error
  const [error, setError] = useState(null);
  const [quarterError, setQuarterError] = useState(null);

  // Available quarters
  const [availableQuarters, setAvailableQuarters] = useState([]);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [genQuarter, setGenQuarter] = useState();
  const [genYear, setGenYear] = useState(dayjs().year());
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);

  // Quarter status
  const [statusQuarter, setStatusQuarter] = useState();
  const [statusYear, setStatusYear] = useState(dayjs().year());
  const [quarterStatus, setQuarterStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);


  const loadAvailableQuarters = async () => {
    try {
      const res = await scheduleService.getAvailableQuarters();
      if (res?.success) {
        setAvailableQuarters(res.data || []);
      } else {
        throw new Error(res?.message || 'Không thể tải danh sách quý');
      }
    } catch (e) {
      console.error('Error loading available quarters:', e);
      toast.error('Không thể tải danh sách quý: ' + (e.message || 'Lỗi không xác định'));
      setAvailableQuarters([]); // Set empty array để tránh lỗi render
    }
  };



  const handleGenerateQuarter = async () => {
    try {
      if (!genQuarter || !genYear) {
        toast.error('Hãy chọn quý và năm');
        return;
      }
      setGenerating(true);
      const res = await scheduleService.generateQuarterSchedule(genQuarter, genYear);
      
      // Kiểm tra response từ server
      if (res?.success === true) {
        // Thành công
        setGenerateResult(res.data);
        toast.success(res.message || 'Tạo lịch quý thành công');
        await loadAvailableQuarters();
      } else if (res?.success === false) {
        // Lỗi từ server nhưng có message rõ ràng
        toast.error(res.message || 'Không thể tạo lịch quý');
      } else {
        // Trường hợp response không đúng định dạng
        toast.error('Phản hồi từ server không hợp lệ');
      }
    } catch (e) {
      console.error('Error generating quarter schedule:', e);
      // Lỗi network hoặc lỗi khác
      toast.error(e.message || 'Không thể kết nối đến server');
    } finally {
      setGenerating(false);
    }
  };

  const handleLoadQuarterStatus = async () => {
    try {
      if (!statusQuarter || !statusYear) {
        toast.error('Hãy chọn quý và năm trước khi xem trạng thái');
        return;
      }
      
      console.log('Loading quarter status for:', { quarter: statusQuarter, year: statusYear });
      setStatusLoading(true);
      setQuarterStatus(null); // Reset previous data
      setQuarterError(null); // Reset error state
      
      const res = await scheduleService.getQuarterStatus({ quarter: statusQuarter, year: statusYear });
      console.log('Quarter status response:', res);
      
      if (res?.success === true) {
        setQuarterStatus(res.data);
        setQuarterError(null);
      } else if (res?.success === false) {
        // Backend trả về lỗi với success: false
        const errorMessage = res.message || 'Không thể tải trạng thái quý';
        toast.error(errorMessage);
        setQuarterError(errorMessage);
        setQuarterStatus(null);
      } else {
        // Trường hợp response không đúng định dạng
        const errorMessage = 'Phản hồi từ server không hợp lệ';
        toast.error(errorMessage);
        setQuarterError(errorMessage);
        setQuarterStatus(null);
      }
    } catch (e) {
      console.error('Error loading quarter status:', e);
      const errorMessage = e.message || 'Không thể kết nối đến server';
      toast.error(errorMessage);
      setQuarterError(errorMessage);
      setQuarterStatus(null);
    } finally {
      setStatusLoading(false);
    }
  };


  useEffect(() => {
    loadAvailableQuarters();
  }, []);




  // Overview Dashboard Component
  const OverviewDashboard = () => (
    <Row gutter={[16, 16]}>

      {/* Available Quarters Summary */}
      <Col span={24}>
        <Card 
          title={
            <Space>
              <CalendarOutlined />
              <span>Tổng quan quý</span>
            </Space>
          }
          extra={<Button icon={<ReloadOutlined />} onClick={loadAvailableQuarters}>Tải lại</Button>}
        >
          <Row gutter={16}>
            {availableQuarters.slice(0, 4).map((q) => (
              <Col span={6} key={`${q.quarter}-${q.year}`}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ margin: '0 0 8px 0' }}>{q.label}</Title>
                    <Space direction="vertical" size={4}>
                      <Badge 
                        status={q.isCreated ? 'success' : 'default'} 
                        text={q.isCreated ? 'Đã tạo' : 'Chưa tạo'} 
                      />
                      <Badge 
                        status={q.hasSchedules ? 'processing' : 'default'} 
                        text={q.hasSchedules ? 'Có lịch' : 'Không có lịch'} 
                      />
                      {q.isCreatable && (
                        <Button 
                          type="primary" 
                          size="small"
                          onClick={() => {
                            setGenQuarter(q.quarter);
                            setGenYear(q.year);
                            setGenerateResult(null);
                            setGenerateModalOpen(true);
                          }}
                        >
                          Tạo ngay
                        </Button>
                      )}
                    </Space>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </Col>
    </Row>
  );

  // Quarter Status Component
  const QuarterStatusView = () => (
    <Card 
      title={
        <Space>
          <BarChartOutlined />
          <span>Trạng thái chi tiết quý</span>
        </Space>
      }
    >
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Select
            style={{ width: '100%' }}
            placeholder="Chọn quý"
            value={statusQuarter}
            onChange={setStatusQuarter}
          >
            <Option value={1}>Quý 1</Option>
            <Option value={2}>Quý 2</Option>
            <Option value={3}>Quý 3</Option>
            <Option value={4}>Quý 4</Option>
          </Select>
        </Col>
        <Col span={4}>
          <InputNumber 
            style={{ width: '100%' }} 
            placeholder="Năm"
            value={statusYear} 
            onChange={setStatusYear} 
            min={2020} 
            max={2035} 
          />
        </Col>
        <Col span={4}>
          <Button 
            type="primary"
            onClick={handleLoadQuarterStatus} 
            loading={statusLoading}
            disabled={!statusQuarter || !statusYear}
            block
          >
            Xem trạng thái
          </Button>
        </Col>
      </Row>

      {statusLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Đang tải trạng thái quý...</div>
        </div>
      ) : quarterError ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Alert
            type="error"
            showIcon
            message="Lỗi tải trạng thái quý"
            description={quarterError}
            action={
              <Button
                type="primary"
                onClick={handleLoadQuarterStatus}
                disabled={!statusQuarter || !statusYear}
              >
                Thử lại
              </Button>
            }
          />
        </div>
      ) : quarterStatus ? (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Alert
              type="info"
              showIcon
              message={`Quý ${quarterStatus.quarter}/${quarterStatus.year}`}
              description={`Thời gian: ${dayjs(quarterStatus.startDateVN).format('DD/MM/YYYY')} đến ${dayjs(quarterStatus.endDateVN).format('DD/MM/YYYY')}`}
            />
          </Col>
          
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng phòng"
                value={quarterStatus.totalRooms}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Phòng có lịch"
                value={quarterStatus.roomsWithSchedule}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng lịch"
                value={quarterStatus.totalSchedules}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tỷ lệ phòng có lịch"
                value={quarterStatus.totalRooms > 0 ? Math.round((quarterStatus.roomsWithSchedule / quarterStatus.totalRooms) * 100) : 0}
                suffix="%"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>

          <Col span={24}>
            <Card title="Chi tiết từng phòng">
              <Table
                rowKey={(r) => r.roomId}
                dataSource={quarterStatus.rooms || []}
                columns={[
                  { 
                    title: 'Tên phòng', 
                    dataIndex: 'roomName', 
                    key: 'roomName',
                    render: (text, record) => (
                      <Tooltip title={`ID: ${record.roomId}`}>
                        <Text strong>{text || record.roomId}</Text>
                      </Tooltip>
                    )
                  },
                  { 
                    title: 'Trạng thái lịch', 
                    dataIndex: 'hasSchedule', 
                    key: 'hasSchedule',
                    render: (hasSchedule) => (
                      <Badge 
                        status={hasSchedule ? 'success' : 'default'} 
                        text={hasSchedule ? 'Có lịch' : 'Chưa có lịch'} 
                      />
                    ),
                    filters: [
                      { text: 'Có lịch', value: true },
                      { text: 'Chưa có lịch', value: false }
                    ],
                    onFilter: (value, record) => record.hasSchedule === value
                  },
                  { 
                    title: 'Số lượng lịch', 
                    dataIndex: 'scheduleCount', 
                    key: 'scheduleCount',
                    sorter: (a, b) => a.scheduleCount - b.scheduleCount,
                    render: (count) => (
                      <Text type={count > 0 ? 'success' : 'secondary'}>{count}</Text>
                    )
                  }
                ]}
                pagination={{ pageSize: 8 }}
              />
            </Card>
          </Col>
        </Row>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Empty description="Chọn quý và năm để xem trạng thái chi tiết" />
        </div>
      )}
    </Card>
  );


  // Error boundary wrapper
  if (error) {
    return (
      <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Alert
            type="error"
            showIcon
            message="Lỗi hệ thống"
            description={error}
            action={
              <Button type="primary" onClick={() => window.location.reload()}>
                Tải lại trang
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        size="large"
        items={[
          {
            key: 'overview',
            label: (
              <span>
                <BarChartOutlined />
                Tổng quan
              </span>
            ),
            children: <OverviewDashboard />
          },
          {
            key: 'status',
            label: (
              <span>
                <EyeOutlined />
                Trạng thái quý
              </span>
            ),
            children: <QuarterStatusView />
          },
        ]}
      />

      {/* Generate Quarter Modal */}
      <Modal
        open={generateModalOpen}
        onCancel={() => {
          setGenerateModalOpen(false);
          setGenerateResult(null);
        }}
        title={
          <Space>
            <span>Tạo lịch làm việc theo quý</span>
          </Space>
        }
        okText="Tạo lịch"
        cancelText="Hủy bỏ"
        onOk={handleGenerateQuarter}
        confirmLoading={generating}
        width={800}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          message="Thông tin"
          description="Hệ thống sẽ tự động tạo lịch làm việc cho tất cả phòng trong quý được chọn. Vui lòng chờ trong giây lát."
          style={{ marginBottom: 16 }}
        />
        
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Chọn quý" required>
                <Select
                  size="large"
                  value={genQuarter}
                  onChange={setGenQuarter}
                  placeholder="Chọn quý cần tạo lịch"
                >
                  <Option value={1}>Quý 1 (Tháng 1-3)</Option>
                  <Option value={2}>Quý 2 (Tháng 4-6)</Option>
                  <Option value={3}>Quý 3 (Tháng 7-9)</Option>
                  <Option value={4}>Quý 4 (Tháng 10-12)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Chọn năm" required>
                <InputNumber 
                  size="large"
                  style={{ width: '100%' }} 
                  value={genYear} 
                  onChange={setGenYear} 
                  min={2020} 
                  max={2035}
                  placeholder="Nhập năm"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        {generateResult && (
          <div style={{ marginTop: 24 }}>
            <Divider orientation="left">Kết quả tạo lịch</Divider>
            <Alert
              type="success"
              showIcon
              message={`Tạo lịch Q${generateResult.quarter}/${generateResult.year} thành công`}
              description={
                <Space direction="vertical" size={4}>
                  <Text>
                      {`Thời gian: ${dayjs(generateResult.startDateVN).format('DD/MM/YYYY')} đến ${dayjs(generateResult.endDateVN).format('DD/MM/YYYY')}`}
                  </Text>
                  <Text>Tổng phòng: {generateResult.totalRooms} | Tạo thành công: {generateResult.successCount}</Text>
                </Space>
              }
              style={{ marginBottom: 16 }}
            />
            
            <Table
              rowKey={(r) => r.roomId}
              size="small"
              pagination={false}
              scroll={{ y: 200 }}
              columns={[
                { 
                  title: 'Tên phòng', 
                  dataIndex: 'roomName', 
                  key: 'roomName',
                  render: (text, record) => (
                    <Tooltip title={`Room ID: ${record.roomId}`}>
                      <Text>{text || record.roomId}</Text>
                    </Tooltip>
                  )
                },
                { 
                  title: 'Trạng thái', 
                  dataIndex: 'success', 
                  key: 'success',
                  render: (success) => (
                    <Tag color={success ? 'success' : 'error'}>
                      {success ? 'Thành công' : 'Thất bại'}
                    </Tag>
                  )
                },
                { 
                  title: 'Số lịch tạo', 
                  dataIndex: 'scheduleCount', 
                  key: 'scheduleCount',
                  render: (count) => <Text strong>{count}</Text>
                },
                { 
                  title: 'Ghi chú', 
                  dataIndex: 'message', 
                  key: 'message',
                  ellipsis: true
                }
              ]}
              dataSource={generateResult.results || []}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ScheduleManagement;



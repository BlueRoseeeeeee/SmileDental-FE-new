/**
 * Schedule Management Component
 * @author: HoTram
 */
import React, { useEffect, useState } from 'react';
import { 
  Card, Row, Col, Typography, Button, Space, Select, Table, Tag, 
  Alert, Spin, Modal, Form, InputNumber, Divider, Badge, Tooltip, 
  Empty, Tabs, Statistic 
} from 'antd';
import { 
  CalendarOutlined, ReloadOutlined, BarChartOutlined, EyeOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { scheduleService } from '../../services';
import { toast } from '../../services/toastService.js';
import './ScheduleManagement.css';

const { Title, Text } = Typography;
const { Option } = Select;

const ScheduleManagement = () => {
  // Main tab state
  const [activeTab, setActiveTab] = useState('overview');
  
  // Error states
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
    } catch (error) {
      console.error('Error loading available quarters:', error);
      toast.error(`Không thể tải danh sách quý: ${error.message || 'Lỗi không xác định'}`);
      setAvailableQuarters([]);
    }
  };



  const handleGenerateQuarter = async () => {
    if (!genQuarter || !genYear) {
      toast.error('Hãy chọn quý và năm');
      return;
    }

    try {
      setGenerating(true);
      const res = await scheduleService.generateQuarterSchedule(genQuarter, genYear);
      
      if (res?.success) {
        setGenerateResult(res.data);
        toast.success(res.message || 'Tạo lịch quý thành công');
        await loadAvailableQuarters();
      } else {
        toast.error(res.message || 'Không thể tạo lịch quý');
      }
    } catch (error) {
      console.error('Error generating quarter schedule:', error);
      toast.error(error.message || 'Không thể kết nối đến server');
    } finally {
      setGenerating(false);
    }
  };

  const handleLoadQuarterStatus = async () => {
    if (!statusQuarter || !statusYear) {
      toast.error('Hãy chọn quý và năm trước khi xem trạng thái');
      return;
    }
    
    try {
      setStatusLoading(true);
      setQuarterStatus(null);
      setQuarterError(null);
      
      const res = await scheduleService.getQuarterStatus({ 
        quarter: statusQuarter, 
        year: statusYear 
      });
      
      if (res?.success) {
        setQuarterStatus(res.data);
      } else {
        const errorMessage = res.message || 'Không thể tải trạng thái quý';
        toast.error(errorMessage);
        setQuarterError(errorMessage);
      }
    } catch (error) {
      console.error('Error loading quarter status:', error);
      const errorMessage = error.message || 'Không thể kết nối đến server';
      toast.error(errorMessage);
      setQuarterError(errorMessage);
    } finally {
      setStatusLoading(false);
    }
  };


  useEffect(() => {
    loadAvailableQuarters();
  }, []);

  // Render quarter card with sequential logic
  const renderQuarterCard = (quarter, index) => {
    // Check if can create (all previous quarters must have schedules)
    const canCreate = availableQuarters
      .slice(0, index)
      .every(q => q.hasSchedules);

    const getStatusBadge = () => {
      if (quarter.hasSchedules) {
        return <Badge status="success" text="Đã có lịch" />;
      }
      return canCreate 
        ? <Badge status="processing" text="Chưa có lịch" />
        : <Badge status="default" text="Đang chờ" />;
    };

    const getActionButton = () => {
      if (quarter.hasSchedules) {
        return <Badge status="success" text="Hoàn thành" />;
      }
      
      if (canCreate) {
        return (
          <Button 
            type="primary" 
            size="small"
            onClick={() => {
              setGenQuarter(quarter.quarter);
              setGenYear(quarter.year);
              setGenerateResult(null);
              setGenerateModalOpen(true);
            }}
          >
            Tạo ngay
          </Button>
        );
      }

      return (
        <Tooltip title="Cần hoàn thành các quý trước đó">
          <Button type="default" size="small" disabled>
            Chờ lượt
          </Button>
        </Tooltip>
      );
    };

    return (
      <Col span={6} key={`${quarter.quarter}-${quarter.year}`}>
        <Card size="small">
          <div style={{ textAlign: 'center' }}>
            <Title level={4} style={{ margin: '0 0 8px 0' }}>
              {quarter.label}
            </Title>
            <Space direction="vertical" size={4}>
              {getStatusBadge()}
              {getActionButton()}
            </Space>
          </div>
        </Card>
      </Col>
    );
  };

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
            {availableQuarters.slice(0, 4).map(renderQuarterCard)}
          </Row>
        </Card>
      </Col>
    </Row>
  );

  // Quarter options for select
  const quarterOptions = [
    { value: 1, label: 'Quý 1' },
    { value: 2, label: 'Quý 2' },
    { value: 3, label: 'Quý 3' },
    { value: 4, label: 'Quý 4' }
  ];

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
            options={quarterOptions}
          />
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
          
          {[
            {
              title: "Tổng phòng",
              value: quarterStatus.totalRooms,
              prefix: <CalendarOutlined />,
              color: undefined
            },
            {
              title: "Phòng có lịch",
              value: quarterStatus.roomsWithSchedule,
              color: '#52c41a'
            },
            {
              title: "Tổng lịch",
              value: quarterStatus.totalSchedules,
              color: '#1890ff'
            },
            {
              title: "Tỷ lệ phòng có lịch",
              value: quarterStatus.totalRooms > 0 
                ? Math.round((quarterStatus.roomsWithSchedule / quarterStatus.totalRooms) * 100) 
                : 0,
              suffix: "%",
              color: '#722ed1'
            }
          ].map((stat, index) => (
            <Col span={6} key={index}>
              <Card>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  valueStyle={stat.color ? { color: stat.color } : undefined}
                />
              </Card>
            </Col>
          ))}

          <Col span={24}>
            <Card title="Chi tiết từng phòng">
              <Table
                rowKey="roomId"
                dataSource={quarterStatus.rooms || []}
                columns={[
                  { 
                    title: 'Tên phòng', 
                    dataIndex: 'roomName', 
                    render: (text, record) => (
                      <Tooltip title={`ID: ${record.roomId}`}>
                        <Text strong>{text || record.roomId}</Text>
                      </Tooltip>
                    )
                  },
                  { 
                    title: 'Trạng thái lịch', 
                    dataIndex: 'hasSchedule',
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
        onCancel={generateResult ? null : () => {
          setGenerateModalOpen(false);
          setGenerateResult(null);
        }}
        title={generateResult ? "Kết quả tạo lịch" : "Xác nhận tạo lịch làm việc"}
        okText={generateResult ? "Hoàn tất" : "Xác nhận"}
        cancelButtonProps={generateResult ? { style: { display: 'none' } } : undefined}
        onOk={generateResult ? (() => {
          setGenerateModalOpen(false);
          setGenerateResult(null);
        }) : handleGenerateQuarter}
        confirmLoading={generating}
        width={800}
        destroyOnClose
        closable={!generateResult}
      >
        <Alert
          type="warning"
          showIcon
          message={`Xác nhận tạo lịch Quý ${genQuarter}/${genYear}`}
          description="Hệ thống sẽ tự động tạo lịch làm việc cho tất cả phòng trong quý này. Thao tác này không thể hoàn tác. Sau khi xác nhận vui lòng chờ trong giây lát"
          style={{ marginBottom: 16 }}
        />
        
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Quý: </Text>
              <Text>Quý {genQuarter} (Tháng {(genQuarter - 1) * 3 + 1}-{genQuarter * 3})</Text>
            </Col>
            <Col span={12}>
              <Text strong>Năm: </Text>
              <Text>{genYear}</Text>
            </Col>
          </Row>
        </div>

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
              rowKey="roomId"
              size="small"
              pagination={false}
              scroll={{ y: 200 }}
              columns={[
                { 
                  title: 'Tên phòng', 
                  dataIndex: 'roomName',
                  render: (text, record) => (
                    <Tooltip title={`Room ID: ${record.roomId}`}>
                      <Text>{text || record.roomId}</Text>
                    </Tooltip>
                  )
                },
                { 
                  title: 'Trạng thái', 
                  dataIndex: 'success',
                  render: (success) => (
                    <Tag color={success ? 'success' : 'error'}>
                      {success ? 'Thành công' : 'Thất bại'}
                    </Tag>
                  )
                },
                { 
                  title: 'Số lịch tạo', 
                  dataIndex: 'scheduleCount',
                  render: (count) => <Text strong>{count}</Text>
                },
                { 
                  title: 'Ghi chú', 
                  dataIndex: 'message',
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



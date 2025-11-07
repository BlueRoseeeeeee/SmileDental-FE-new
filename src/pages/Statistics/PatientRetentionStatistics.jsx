import { useState, useEffect } from 'react';
import { Card, Row, Col, Select, DatePicker, Statistic, Table, Spin, message, Tag, Tooltip as AntTooltip, Progress } from 'antd';
import { 
  UserAddOutlined, 
  UserOutlined,
  CalendarOutlined,
  HeartOutlined,
  DollarCircleOutlined,
  TrophyOutlined,
  FallOutlined,
  RiseOutlined,
  PercentageOutlined
} from '@ant-design/icons';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import dayjs from 'dayjs';
import { getPatientRetentionStatistics } from '../../services/statisticsAPI';

const { RangePicker } = DatePicker;

const COLORS = {
  new: '#1890ff',
  returning: '#52c41a',
  churn: '#ff4d4f',
  retention: '#52c41a'
};

const PatientRetentionStatistics = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [groupBy, setGroupBy] = useState('day');
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);

  useEffect(() => {
    fetchData();
  }, [groupBy, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        groupBy
      };
      
      const response = await getPatientRetentionStatistics(params);
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  // Columns for loyal patients table
  const patientColumns = [
    {
      title: 'Hạng',
      key: 'rank',
      width: 60,
      align: 'center',
      render: (_, __, index) => {
        if (index === 0) return <TrophyOutlined style={{ fontSize: '20px', color: '#ffd700' }} />;
        if (index === 1) return <TrophyOutlined style={{ fontSize: '18px', color: '#c0c0c0' }} />;
        if (index === 2) return <TrophyOutlined style={{ fontSize: '16px', color: '#cd7f32' }} />;
        return <span style={{ color: '#888' }}>{index + 1}</span>;
      }
    },
    {
      title: 'Bệnh nhân',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>{record.phone}</div>
        </div>
      )
    },
    {
      title: 'Lượt khám',
      dataIndex: 'totalVisits',
      key: 'totalVisits',
      align: 'right',
      render: (value) => (
        <Tag color="blue" style={{ fontSize: '13px' }}>
          {formatNumber(value)} lượt
        </Tag>
      ),
      sorter: (a, b) => a.totalVisits - b.totalVisits,
      defaultSortOrder: 'descend'
    },
    {
      title: 'Tần suất',
      dataIndex: 'frequency',
      key: 'frequency',
      align: 'right',
      render: (value) => (
        <span style={{ color: '#1890ff' }}>
          {value.toFixed(1)} lượt/tháng
        </span>
      ),
      sorter: (a, b) => a.frequency - b.frequency
    },
    {
      title: 'Tổng chi tiêu',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      align: 'right',
      render: (value) => (
        <span style={{ color: '#52c41a', fontWeight: 500 }}>
          {formatCurrency(value)}
        </span>
      ),
      sorter: (a, b) => a.totalSpent - b.totalSpent
    },
    {
      title: 'Khám đầu tiên',
      dataIndex: 'firstVisit',
      key: 'firstVisit',
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Khám gần nhất',
      dataIndex: 'lastVisit',
      key: 'lastVisit',
      render: (date) => {
        const daysAgo = dayjs().diff(dayjs(date), 'days');
        return (
          <AntTooltip title={`${daysAgo} ngày trước`}>
            <span>{dayjs(date).format('DD/MM/YYYY')}</span>
          </AntTooltip>
        );
      }
    }
  ];

  // Columns for cohort analysis
  const cohortColumns = [
    {
      title: 'Tháng',
      dataIndex: 'month',
      key: 'month',
      render: (text) => {
        const [year, month] = text.split('-');
        return `Tháng ${month}/${year}`;
      }
    },
    {
      title: 'BN mới',
      dataIndex: 'newPatients',
      key: 'newPatients',
      align: 'right',
      render: (value) => formatNumber(value)
    },
    {
      title: 'Quay lại lần 2',
      dataIndex: 'withSecondVisit',
      key: 'withSecondVisit',
      align: 'right',
      render: (value) => formatNumber(value)
    },
    {
      title: 'Tỷ lệ giữ chân',
      dataIndex: 'retentionRate',
      key: 'retentionRate',
      align: 'right',
      render: (value) => (
        <div style={{ width: 120 }}>
          <Progress 
            percent={value} 
            size="small"
            strokeColor={value >= 75 ? '#52c41a' : value >= 60 ? '#faad14' : '#ff4d4f'}
            format={(percent) => `${percent.toFixed(1)}%`}
          />
        </div>
      ),
      sorter: (a, b) => a.retentionRate - b.retentionRate
    }
  ];

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16 }}>
          <HeartOutlined style={{ marginRight: 8 }} />
          Thống kê Bệnh nhân Quay lại
        </h2>
        
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                allowClear={false}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                value={groupBy}
                onChange={setGroupBy}
                style={{ width: '100%' }}
              >
                <Select.Option value="day">Theo ngày</Select.Option>
                <Select.Option value="month">Theo tháng</Select.Option>
                <Select.Option value="quarter">Theo quý</Select.Option>
                <Select.Option value="year">Theo năm</Select.Option>
              </Select>
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng bệnh nhân"
                value={data.summary.total}
                formatter={(value) => formatNumber(value)}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={
                  <span>
                    Bệnh nhân mới
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {data.summary.newPatients.percentage}%
                    </Tag>
                  </span>
                }
                value={data.summary.newPatients.count}
                formatter={(value) => formatNumber(value)}
                prefix={<UserAddOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: 8, fontSize: '12px', color: '#888' }}>
                TB: {data.summary.newPatients.avgPerDay} BN/ngày
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={
                  <span>
                    BN quay lại
                    <Tag color="green" style={{ marginLeft: 8 }}>
                      {data.summary.returningPatients.percentage}%
                    </Tag>
                  </span>
                }
                value={data.summary.returningPatients.count}
                formatter={(value) => formatNumber(value)}
                prefix={<HeartOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: 8, fontSize: '12px', color: '#888' }}>
                TB: {data.summary.returningPatients.avgPerDay} BN/ngày
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="CLV trung bình"
                value={data.summary.avgCLV}
                formatter={(value) => formatCurrency(value)}
                prefix={<DollarCircleOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Retention Metrics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#888', marginBottom: 8 }}>
                    <RiseOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                    Tỷ lệ giữ chân (Retention Rate)
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a' }}>
                    {data.summary.retentionRate}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: 4 }}>
                    Tỷ lệ bệnh nhân quay lại
                  </div>
                </div>
                <div style={{ width: 120, height: 120 }}>
                  <Progress
                    type="circle"
                    percent={data.summary.retentionRate}
                    strokeColor={{
                      '0%': '#52c41a',
                      '100%': '#95de64'
                    }}
                    format={(percent) => `${percent}%`}
                  />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#888', marginBottom: 8 }}>
                    <FallOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
                    Tỷ lệ rời bỏ (Churn Rate)
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff4d4f' }}>
                    {data.summary.churnRate}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: 4 }}>
                    Tỷ lệ bệnh nhân không quay lại
                  </div>
                </div>
                <div style={{ width: 120, height: 120 }}>
                  <Progress
                    type="circle"
                    percent={parseFloat(data.summary.churnRate)}
                    strokeColor={{
                      '0%': '#ff4d4f',
                      '100%': '#ff7875'
                    }}
                    format={(percent) => `${percent}%`}
                  />
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Trend Chart */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Xu hướng Bệnh nhân Mới vs Quay lại">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.new} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.new} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorReturning" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.returning} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.returning} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={Math.floor(data.trend.length / 10)}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="new" 
                  stroke={COLORS.new}
                  fillOpacity={1}
                  fill="url(#colorNew)"
                  name="Bệnh nhân mới"
                />
                <Area 
                  type="monotone" 
                  dataKey="returning" 
                  stroke={COLORS.returning}
                  fillOpacity={1}
                  fill="url(#colorReturning)"
                  name="Bệnh nhân quay lại"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Loyal Patients Table */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card 
            title={
              <span>
                <TrophyOutlined style={{ marginRight: 8, color: '#ffd700' }} />
                Top bệnh nhân trung thành
              </span>
            }
          >
            <Table 
              columns={patientColumns}
              dataSource={data.loyalPatients}
              rowKey="patientId"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      {/* Cohort Analysis */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card 
            title={
              <span>
                <PercentageOutlined style={{ marginRight: 8 }} />
                Phân tích Cohort - Tỷ lệ giữ chân theo tháng
              </span>
            }
            extra={
              <AntTooltip title="Tỷ lệ bệnh nhân mới trong tháng có quay lại khám lần 2">
                <span style={{ fontSize: '12px', color: '#888' }}>
                  ℹ️ Tỷ lệ quay lại khám lần 2
                </span>
              </AntTooltip>
            }
          >
            <div style={{ marginBottom: 16 }}>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.cohortAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => {
                      const [year, month] = value.split('-');
                      return `${month}/${year}`;
                    }}
                  />
                  <YAxis 
                    yAxisId="left"
                    domain={[0, 'dataMax + 10']}
                    label={{ value: 'Số BN', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    label={{ value: 'Tỷ lệ %', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="newPatients" 
                    stroke="#1890ff" 
                    name="BN mới"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="retentionRate" 
                    stroke="#52c41a" 
                    name="Tỷ lệ giữ chân (%)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <Table 
              columns={cohortColumns}
              dataSource={data.cohortAnalysis}
              rowKey="month"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PatientRetentionStatistics;

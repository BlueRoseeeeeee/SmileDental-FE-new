import { useState, useEffect } from 'react';
import { Card, Row, Col, Select, DatePicker, Statistic, Table, Spin, message, Progress, Tag } from 'antd';
import { 
  MobileOutlined, 
  DesktopOutlined,
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  PercentageOutlined
} from '@ant-design/icons';
import { 
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import dayjs from 'dayjs';
import { getBookingChannelStatistics } from '../../services/statisticsAPI';

const { RangePicker } = DatePicker;

const COLORS = {
  online: '#52c41a',
  offline: '#1890ff',
  receptionist: '#ff7c7c',
  admin: '#ffc658',
  manager: '#8884d8'
};

const BookingChannelStatistics = () => {
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
      
      const response = await getBookingChannelStatistics(params);
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  // Columns for staff table
  const staffColumns = [
    {
      title: 'Nhân viên',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.role === 'receptionist' && '👋 Lễ tân'}
            {record.role === 'admin' && '👨‍💼 Quản trị viên'}
            {record.role === 'manager' && '👔 Quản lý'}
          </div>
        </div>
      )
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleMap = {
          receptionist: { text: 'Lễ tân', color: 'blue' },
          admin: { text: 'Quản trị viên', color: 'purple' },
          manager: { text: 'Quản lý', color: 'gold' }
        };
        const roleInfo = roleMap[role] || { text: role, color: 'default' };
        return <Tag color={roleInfo.color}>{roleInfo.text}</Tag>;
      }
    },
    {
      title: 'Số lượng đặt hẹn',
      dataIndex: 'count',
      key: 'count',
      align: 'right',
      render: (value) => <span style={{ fontWeight: 500, color: '#1890ff' }}>{formatNumber(value)}</span>,
      sorter: (a, b) => a.count - b.count,
      defaultSortOrder: 'descend'
    },
    {
      title: 'Tỷ lệ',
      key: 'percentage',
      align: 'right',
      render: (_, record) => {
        const total = data.summary.offline.count;
        const percentage = ((record.count / total) * 100).toFixed(1);
        return (
          <div style={{ width: 100 }}>
            <Progress 
              percent={parseFloat(percentage)} 
              size="small" 
              format={(percent) => `${percent}%`}
            />
          </div>
        );
      }
    }
  ];

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  // Prepare pie chart data
  const channelPieData = [
    { name: 'Online', value: data.summary.online.count, percentage: data.summary.online.percentage },
    { name: 'Offline', value: data.summary.offline.count, percentage: data.summary.offline.percentage }
  ];

  const rolePieData = data.offlineByRole.map(item => ({
    name: item.name,
    value: item.count,
    percentage: item.percentage
  }));

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16 }}>
          <CalendarOutlined style={{ marginRight: 8 }} />
          Thống kê Đặt hẹn Online/Offline
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
                title="Tổng đặt hẹn"
                value={data.summary.total}
                formatter={(value) => formatNumber(value)}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={
                  <span>
                    Online 
                    <Tag color="green" style={{ marginLeft: 8 }}>
                      {data.summary.online.percentage}%
                    </Tag>
                  </span>
                }
                value={data.summary.online.count}
                formatter={(value) => formatNumber(value)}
                prefix={<MobileOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: 8, fontSize: '12px', color: '#888' }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                Tỷ lệ hoàn thành: {data.summary.online.completionRate}%
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={
                  <span>
                    Offline 
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {data.summary.offline.percentage}%
                    </Tag>
                  </span>
                }
                value={data.summary.offline.count}
                formatter={(value) => formatNumber(value)}
                prefix={<DesktopOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: 8, fontSize: '12px', color: '#888' }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                Tỷ lệ hoàn thành: {data.summary.offline.completionRate}%
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="TB Online/ngày"
                value={data.summary.online.avgPerDay}
                precision={1}
                prefix={<PercentageOutlined />}
                valueStyle={{ color: '#fa8c16' }}
                suffix="lượt"
              />
              <div style={{ marginTop: 8, fontSize: '12px', color: '#888' }}>
                Offline: {data.summary.offline.avgPerDay} lượt/ngày
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Trend Chart */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Xu hướng đặt hẹn Online vs Offline">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data.trend}>
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
                <Line 
                  type="monotone" 
                  dataKey="online" 
                  stroke={COLORS.online} 
                  strokeWidth={2}
                  name="Online"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="offline" 
                  stroke={COLORS.offline} 
                  strokeWidth={2}
                  name="Offline"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Pie Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Tỷ lệ Online vs Offline">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={channelPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(entry) => `${entry.name}: ${entry.percentage}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill={COLORS.online} />
                  <Cell fill={COLORS.offline} />
                </Pie>
                <Tooltip formatter={(value) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>
                <MobileOutlined /> Online: {formatNumber(data.summary.online.count)} ({data.summary.online.percentage}%)
              </Tag>
              <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                <DesktopOutlined /> Offline: {formatNumber(data.summary.offline.count)} ({data.summary.offline.percentage}%)
              </Tag>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Phân bổ đặt hẹn Offline theo vai trò">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={rolePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(entry) => `${entry.name}: ${entry.percentage}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {rolePieData.map((entry, index) => {
                    const colorMap = {
                      'Lễ tân': COLORS.receptionist,
                      'Quản trị viên': COLORS.admin,
                      'Quản lý': COLORS.manager
                    };
                    return <Cell key={`cell-${index}`} fill={colorMap[entry.name] || COLORS.offline} />;
                  })}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Top Staff Table */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title={
            <span>
              <TeamOutlined style={{ marginRight: 8 }} />
              Top nhân viên đặt hẹn nhiều nhất
            </span>
          }>
            <Table 
              columns={staffColumns}
              dataSource={data.topStaff}
              rowKey="staffId"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      {/* Completion Rate Comparison */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="So sánh tỷ lệ hoàn thành">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={[
                  { 
                    channel: 'Online', 
                    completed: parseFloat(data.summary.online.completionRate),
                    total: 100
                  },
                  { 
                    channel: 'Offline', 
                    completed: parseFloat(data.summary.offline.completionRate),
                    total: 100
                  }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="completed" fill={COLORS.online} name="Tỷ lệ hoàn thành (%)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BookingChannelStatistics;

import { useState, useEffect } from 'react';
import { Card, Row, Col, Tabs, Select, DatePicker, Statistic, Table, Spin, message } from 'antd';
import { 
  DollarOutlined, 
  CalendarOutlined, 
  TeamOutlined, 
  AppstoreOutlined,
  RiseOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import dayjs from 'dayjs';
import { getRevenueStatistics, MOCK_DENTISTS, MOCK_SERVICES } from '../../services/statisticsAPI';

const { RangePicker } = DatePicker;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c'];

const RevenueStatistics = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [groupBy, setGroupBy] = useState('day');
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    fetchData();
  }, [groupBy, dateRange, selectedDentist, selectedService]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        groupBy,
        dentistId: selectedDentist,
        serviceId: selectedService
      };
      
      const response = await getRevenueStatistics(params);
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

  // Columns for dentist revenue table
  const dentistColumns = [
    {
      title: 'Nha sỹ',
      dataIndex: 'dentistName',
      key: 'dentistName',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>{record.specialization}</div>
        </div>
      )
    },
    {
      title: 'Số lượt khám',
      dataIndex: 'appointmentCount',
      key: 'appointmentCount',
      align: 'right',
      render: (value) => formatNumber(value),
      sorter: (a, b) => a.appointmentCount - b.appointmentCount
    },
    {
      title: 'Số dịch vụ',
      dataIndex: 'serviceCount',
      key: 'serviceCount',
      align: 'right',
      render: (value) => formatNumber(value),
      sorter: (a, b) => a.serviceCount - b.serviceCount
    },
    {
      title: 'Doanh thu',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      align: 'right',
      render: (value) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{formatCurrency(value)}</span>,
      sorter: (a, b) => a.totalRevenue - b.totalRevenue,
      defaultSortOrder: 'descend'
    },
    {
      title: 'TB/lượt',
      dataIndex: 'avgRevenuePerAppointment',
      key: 'avgRevenuePerAppointment',
      align: 'right',
      render: (value) => formatCurrency(value),
      sorter: (a, b) => a.avgRevenuePerAppointment - b.avgRevenuePerAppointment
    }
  ];

  // Columns for service revenue table
  const serviceColumns = [
    {
      title: 'Dịch vụ',
      dataIndex: 'serviceName',
      key: 'serviceName',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.serviceType === 'exam' ? '🔍 Khám' : '🛠️ Điều trị'}
          </div>
        </div>
      )
    },
    {
      title: 'Số lượng',
      dataIndex: 'totalCount',
      key: 'totalCount',
      align: 'right',
      render: (value) => formatNumber(value),
      sorter: (a, b) => a.totalCount - b.totalCount
    },
    {
      title: 'Doanh thu',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      align: 'right',
      render: (value) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{formatCurrency(value)}</span>,
      sorter: (a, b) => a.totalRevenue - b.totalRevenue,
      defaultSortOrder: 'descend'
    },
    {
      title: 'Giá TB',
      dataIndex: 'avgRevenuePerService',
      key: 'avgRevenuePerService',
      align: 'right',
      render: (value) => formatCurrency(value),
      sorter: (a, b) => a.avgRevenuePerService - b.avgRevenuePerService
    }
  ];

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'by-dentist',
      label: (
        <span>
          <TeamOutlined /> Theo Nha sỹ
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data.revenueByDentist.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="dentistName" 
                      angle={-45} 
                      textAnchor="end" 
                      height={120}
                      interval={0}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      labelStyle={{ color: '#333' }}
                    />
                    <Legend />
                    <Bar dataKey="totalRevenue" fill="#1890ff" name="Doanh thu" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
          
          <Card title="Chi tiết doanh thu theo nha sỹ">
            <Table 
              columns={dentistColumns}
              dataSource={data.revenueByDentist}
              rowKey="dentistId"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </div>
      )
    },
    {
      key: 'by-service',
      label: (
        <span>
          <AppstoreOutlined /> Theo Dịch vụ
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card title="Top 8 dịch vụ theo doanh thu">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={data.revenueByService.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.serviceName.substring(0, 15)}...`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="totalRevenue"
                    >
                      {data.revenueByService.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card title="Top 8 dịch vụ theo số lượng">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={[...data.revenueByService].sort((a, b) => b.totalCount - a.totalCount).slice(0, 8)}
                    layout="horizontal"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="serviceName" 
                      width={150}
                      style={{ fontSize: '11px' }}
                    />
                    <Tooltip />
                    <Bar dataKey="totalCount" fill="#52c41a" name="Số lượng" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
          
          <Card title="Chi tiết doanh thu theo dịch vụ">
            <Table 
              columns={serviceColumns}
              dataSource={data.revenueByService}
              rowKey="serviceId"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </div>
      )
    },
    {
      key: 'by-time',
      label: (
        <span>
          <CalendarOutlined /> Theo Thời gian
        </span>
      ),
      children: (
        <div>
          <Card title="Xu hướng doanh thu theo thời gian">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data.revenueByTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={Math.floor(data.revenueByTime.length / 10)}
                />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelStyle={{ color: '#333' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#1890ff" 
                  strokeWidth={2}
                  name="Doanh thu"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )
    },
    {
      key: 'comparison',
      label: (
        <span>
          <BarChartOutlined /> So sánh
        </span>
      ),
      children: (
        <div>
          <Card title="So sánh Số lượng vs Doanh thu theo Dịch vụ">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={data.comparison.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                  style={{ fontSize: '11px' }}
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  label={{ value: 'Số lượng', angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  label={{ value: 'Doanh thu', angle: 90, position: 'insideRight' }}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'Doanh thu') return formatCurrency(value);
                    return formatNumber(value);
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#52c41a" name="Số lượng" />
                <Bar yAxisId="right" dataKey="revenue" fill="#1890ff" name="Doanh thu" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16 }}>
          <DollarOutlined style={{ marginRight: 8 }} />
          Thống kê Doanh thu
        </h2>
        
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                allowClear={false}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
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
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Lọc theo nha sỹ"
                allowClear
                value={selectedDentist}
                onChange={setSelectedDentist}
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="children"
              >
                {MOCK_DENTISTS.map(d => (
                  <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Lọc theo dịch vụ"
                allowClear
                value={selectedService}
                onChange={setSelectedService}
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="children"
              >
                {MOCK_SERVICES.map(s => (
                  <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                ))}
              </Select>
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng doanh thu"
                value={data.summary.totalRevenue}
                formatter={(value) => formatCurrency(value)}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Số lượt khám"
                value={data.summary.totalAppointments}
                formatter={(value) => formatNumber(value)}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Số dịch vụ"
                value={data.summary.totalServices}
                formatter={(value) => formatNumber(value)}
                prefix={<AppstoreOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Trung bình/lượt"
                value={data.summary.avgRevenuePerAppointment}
                formatter={(value) => formatCurrency(value)}
                prefix={<RiseOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <Tabs items={tabItems} />
    </div>
  );
};

export default RevenueStatistics;

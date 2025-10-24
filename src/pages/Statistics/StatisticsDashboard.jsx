import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  DatePicker,
  Select,
  Space,
  Typography,
  Table,
  Tag,
  Statistic as AntStatistic
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DollarOutlined,
  UserOutlined,
  CalendarOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const StatisticsDashboard = () => {
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [periodType, setPeriodType] = useState('month'); // day, week, month, quarter, year

  // Mock data for UI testing
  const summaryStats = {
    totalRevenue: 125000000,
    totalAppointments: 248,
    totalPatients: 156,
    totalServices: 42
  };

  // Revenue trend data (mock)
  const revenueTrendData = [
    { date: '01/10', revenue: 4200000, appointments: 12 },
    { date: '02/10', revenue: 3800000, appointments: 10 },
    { date: '03/10', revenue: 5100000, appointments: 15 },
    { date: '04/10', revenue: 4500000, appointments: 13 },
    { date: '05/10', revenue: 6200000, appointments: 18 },
    { date: '06/10', revenue: 5800000, appointments: 16 },
    { date: '07/10', revenue: 7100000, appointments: 20 },
    { date: '08/10', revenue: 6500000, appointments: 19 },
    { date: '09/10', revenue: 5900000, appointments: 17 },
    { date: '10/10', revenue: 6800000, appointments: 19 },
    { date: '11/10', revenue: 7500000, appointments: 22 },
    { date: '12/10', revenue: 8200000, appointments: 24 },
    { date: '13/10', revenue: 7800000, appointments: 21 },
    { date: '14/10', revenue: 6900000, appointments: 20 },
    { date: '15/10', revenue: 7200000, appointments: 21 }
  ];

  // Appointment status distribution (mock)
  const appointmentStatusData = [
    { name: 'Hoàn thành', value: 180, percent: 72.6 },
    { name: 'Đã xác nhận', value: 35, percent: 14.1 },
    { name: 'Đã check-in', value: 15, percent: 6.0 },
    { name: 'Đang khám', value: 8, percent: 3.2 },
    { name: 'Đã hủy', value: 7, percent: 2.8 },
    { name: 'Không đến', value: 3, percent: 1.2 }
  ];

  // Service type distribution (mock)
  const serviceTypeData = [
    { name: 'Khám tổng quát', value: 65, revenue: 32500000 },
    { name: 'Nhổ răng', value: 42, revenue: 21000000 },
    { name: 'Trám răng', value: 38, revenue: 19000000 },
    { name: 'Tẩy trắng', value: 28, revenue: 28000000 },
    { name: 'Niềng răng', value: 15, revenue: 45000000 },
    { name: 'Cấy ghép implant', value: 8, revenue: 32000000 },
    { name: 'Chỉnh nha', value: 12, revenue: 24000000 }
  ];

  // Payment method distribution (mock)
  const paymentMethodData = [
    { name: 'Tiền mặt', value: 58, amount: 45000000 },
    { name: 'VNPay', value: 35, amount: 60000000 },
    { name: 'Visa/Mastercard', value: 7, amount: 20000000 }
  ];

  // Top dentists by appointments (mock)
  const topDentistsData = [
    { name: 'BS. Nguyễn Văn A', appointments: 45, revenue: 28500000, rating: 4.8 },
    { name: 'BS. Trần Thị B', appointments: 38, revenue: 24200000, rating: 4.7 },
    { name: 'BS. Lê Minh C', appointments: 32, revenue: 20800000, rating: 4.6 },
    { name: 'BS. Phạm Thu D', appointments: 28, revenue: 18900000, rating: 4.5 },
    { name: 'BS. Hoàng Văn E', appointments: 25, revenue: 16500000, rating: 4.4 }
  ];

  // Patient statistics (mock)
  const patientStatsData = [
    { date: '01/10', newPatients: 5, returningPatients: 7 },
    { date: '02/10', newPatients: 3, returningPatients: 7 },
    { date: '03/10', newPatients: 6, returningPatients: 9 },
    { date: '04/10', newPatients: 4, returningPatients: 9 },
    { date: '05/10', newPatients: 7, returningPatients: 11 },
    { date: '06/10', newPatients: 5, returningPatients: 11 },
    { date: '07/10', newPatients: 8, returningPatients: 12 },
    { date: '08/10', newPatients: 6, returningPatients: 13 },
    { date: '09/10', newPatients: 5, returningPatients: 12 },
    { date: '10/10', newPatients: 7, returningPatients: 12 },
    { date: '11/10', newPatients: 9, returningPatients: 13 },
    { date: '12/10', newPatients: 8, returningPatients: 16 },
    { date: '13/10', newPatients: 6, returningPatients: 15 },
    { date: '14/10', newPatients: 7, returningPatients: 13 },
    { date: '15/10', newPatients: 8, returningPatients: 13 }
  ];

  // Gender distribution (mock)
  const genderData = [
    { name: 'Nam', value: 68 },
    { name: 'Nữ', value: 88 }
  ];

  // Age distribution (mock)
  const ageDistributionData = [
    { range: '0-18', count: 25 },
    { range: '19-30', count: 45 },
    { range: '31-45', count: 52 },
    { range: '46-60', count: 28 },
    { range: '60+', count: 6 }
  ];

  // Record type distribution (mock)
  const recordTypeData = [
    { name: 'Khám bệnh', value: 152, percent: 61.3 },
    { name: 'Điều trị', value: 96, percent: 38.7 }
  ];

  // Invoice status data (mock)
  const invoiceStatusData = [
    { status: 'Đã thanh toán', count: 180, amount: 95000000 },
    { status: 'TT 1 phần', count: 35, amount: 18500000 },
    { status: 'Chờ thanh toán', count: 28, amount: 11500000 },
    { status: 'Quá hạn', count: 5, amount: 2800000 }
  ];

  // Room utilization (mock)
  const roomUtilizationData = [
    { room: 'Phòng 1', appointments: 45, utilization: 89 },
    { room: 'Phòng 2', appointments: 38, utilization: 76 },
    { room: 'Phòng 3', appointments: 32, utilization: 64 },
    { room: 'Phòng 4', appointments: 28, utilization: 56 },
    { room: 'Phòng 5', appointments: 25, utilization: 50 }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const handlePeriodChange = (value) => {
    setPeriodType(value);
    const now = dayjs();
    switch (value) {
      case 'day':
        setDateRange([now.startOf('day'), now.endOf('day')]);
        break;
      case 'week':
        setDateRange([now.startOf('week'), now.endOf('week')]);
        break;
      case 'month':
        setDateRange([now.startOf('month'), now.endOf('month')]);
        break;
      case 'quarter':
        setDateRange([now.startOf('quarter'), now.endOf('quarter')]);
        break;
      case 'year':
        setDateRange([now.startOf('year'), now.endOf('year')]);
        break;
      default:
        break;
    }
  };

  // Table columns
  const topDentistsColumns = [
    {
      title: 'Nha sĩ',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Số lịch hẹn',
      dataIndex: 'appointments',
      key: 'appointments',
      align: 'center',
      sorter: (a, b) => a.appointments - b.appointments
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      render: (value) => <Text type="success">{formatCurrency(value)}</Text>,
      sorter: (a, b) => a.revenue - b.revenue
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      align: 'center',
      render: (value) => <Tag color="gold">⭐ {value}</Tag>
    }
  ];

  const serviceColumns = [
    {
      title: 'Dịch vụ',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Số lượt',
      dataIndex: 'value',
      key: 'value',
      align: 'center',
      sorter: (a, b) => a.value - b.value
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      render: (value) => <Text type="success">{formatCurrency(value)}</Text>,
      sorter: (a, b) => a.revenue - b.revenue
    }
  ];

  const invoiceColumns = [
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (text) => {
        const colorMap = {
          'Đã thanh toán': 'green',
          'TT 1 phần': 'blue',
          'Chờ thanh toán': 'orange',
          'Quá hạn': 'red'
        };
        return <Tag color={colorMap[text]}>{text}</Tag>;
      }
    },
    {
      title: 'Số lượng',
      dataIndex: 'count',
      key: 'count',
      align: 'center'
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (value) => formatCurrency(value)
    }
  ];

  const roomColumns = [
    {
      title: 'Phòng',
      dataIndex: 'room',
      key: 'room',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Số lịch hẹn',
      dataIndex: 'appointments',
      key: 'appointments',
      align: 'center'
    },
    {
      title: 'Tỷ lệ sử dụng',
      dataIndex: 'utilization',
      key: 'utilization',
      align: 'center',
      render: (value) => <Tag color={value >= 70 ? 'green' : value >= 50 ? 'orange' : 'red'}>{value}%</Tag>
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <BarChartOutlined /> Thống kê & Báo cáo
      </Title>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="middle">
          <Text strong>Khoảng thời gian:</Text>
          <Select
            value={periodType}
            onChange={handlePeriodChange}
            style={{ width: 150 }}
          >
            <Option value="day">Theo ngày</Option>
            <Option value="week">Theo tuần</Option>
            <Option value="month">Theo tháng</Option>
            <Option value="quarter">Theo quý</Option>
            <Option value="year">Theo năm</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="DD/MM/YYYY"
            style={{ width: 300 }}
          />
        </Space>
      </Card>

      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <AntStatistic
              title="Tổng doanh thu"
              value={summaryStats.totalRevenue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
              formatter={(value) => formatCurrency(value)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <AntStatistic
              title="Tổng lịch hẹn"
              value={summaryStats.totalAppointments}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <AntStatistic
              title="Tổng bệnh nhân"
              value={summaryStats.totalPatients}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <AntStatistic
              title="Dịch vụ đã thực hiện"
              value={summaryStats.totalServices}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Revenue Trend Chart */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title={<><LineChartOutlined /> Xu hướng doanh thu & lịch hẹn</>}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueTrendData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value, name) => {
                  if (name === 'revenue') return [formatCurrency(value), 'Doanh thu'];
                  return [value, 'Lịch hẹn'];
                }} />
                <Legend formatter={(value) => value === 'revenue' ? 'Doanh thu' : 'Lịch hẹn'} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" />
                <Area yAxisId="right" type="monotone" dataKey="appointments" stroke="#82ca9d" fillOpacity={1} fill="url(#colorAppointments)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={<><PieChartOutlined /> Trạng thái lịch hẹn</>}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appointmentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.percent}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {appointmentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Service Type & Payment Method */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={<><BarChartOutlined /> Top dịch vụ theo doanh thu</>}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value, name) => {
                  if (name === 'revenue') return [formatCurrency(value), 'Doanh thu'];
                  return [value, 'Số lượt'];
                }} />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="Doanh thu" />
                <Bar dataKey="value" fill="#82ca9d" name="Số lượt" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<><PieChartOutlined /> Phương thức thanh toán</>}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [formatCurrency(props.payload.amount), name]} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Patient Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title={<><LineChartOutlined /> Thống kê bệnh nhân mới & tái khám</>}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={patientStatsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="newPatients" stroke="#8884d8" name="BN mới" strokeWidth={2} />
                <Line type="monotone" dataKey="returningPatients" stroke="#82ca9d" name="Tái khám" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Phân bố giới tính" style={{ marginBottom: 16 }}>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#0088FE' : '#eb2f96'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Phân bố độ tuổi">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={ageDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Data Tables */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Top nha sĩ theo số lịch hẹn">
            <Table
              dataSource={topDentistsData}
              columns={topDentistsColumns}
              pagination={false}
              size="small"
              rowKey="name"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Thống kê dịch vụ">
            <Table
              dataSource={serviceTypeData}
              columns={serviceColumns}
              pagination={false}
              size="small"
              rowKey="name"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Trạng thái hóa đơn">
            <Table
              dataSource={invoiceStatusData}
              columns={invoiceColumns}
              pagination={false}
              size="small"
              rowKey="status"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Tỷ lệ sử dụng phòng khám">
            <Table
              dataSource={roomUtilizationData}
              columns={roomColumns}
              pagination={false}
              size="small"
              rowKey="room"
            />
          </Card>
        </Col>
      </Row>

      {/* Record Type Distribution */}
      <Row gutter={16}>
        <Col xs={24}>
          <Card title={<><BarChartOutlined /> Phân bố loại hồ sơ</>}>
            <Row gutter={16}>
              <Col span={12}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={recordTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.percent}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {recordTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#1890ff' : '#52c41a'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Col>
              <Col span={12}>
                <Space direction="vertical" size="large" style={{ width: '100%', padding: '40px' }}>
                  {recordTypeData.map((item, index) => (
                    <div key={index}>
                      <Text strong>{item.name}: </Text>
                      <Text type="secondary">{item.value} hồ sơ ({item.percent}%)</Text>
                    </div>
                  ))}
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StatisticsDashboard;

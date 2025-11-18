import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Table,
  Statistic,
  Space,
  Tag,
  Typography,
  message,
  Spin,
  Empty
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  PercentageOutlined,
  ReloadOutlined,
  DownloadOutlined,
  PieChartOutlined,
  FilterOutlined,
  ClearOutlined,
  UserOutlined
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import dayjs from 'dayjs';
import { getAppointmentStatusStatistics } from '../../services/statisticsAPI';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 🎨 Colors for appointment statuses
const STATUS_COLORS = {
  completed: '#52c41a',    // Green
  cancelled: '#ff4d4f',    // Red
  noShow: '#faad14',       // Orange/Yellow
  pending: '#1890ff',      // Blue
  confirmed: '#13c2c2',    // Cyan
  other: '#d9d9d9'         // Gray
};

// Helper to format timeline dates
const formatTimelineDate = (dateStr, format = 'DD/MM') => {
  if (!dateStr) return '';
  
  // Handle year format
  if (dateStr.match(/^\d{4}$/)) {
    return dateStr;
  }
  
  // Handle month format or full date
  return dayjs(dateStr).format(format);
};

const AppointmentStatusStatistics = () => {
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState('day');
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);
  const [data, setData] = useState(null);

  const fetchStatistics = async () => {
    if (loading) return;
    setLoading(true);
    
    console.log('🔍 [FE] Fetching appointment status statistics:', {
      dateRange: [dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')],
      groupBy
    });
    
    try {
      const params = {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        groupBy
      };
      
      console.log('📤 [FE] API params:', params);
      
      const response = await getAppointmentStatusStatistics(params);
      
      if (response.success) {
        setData(response.data);
        message.success('Đã tải dữ liệu thống kê');
      } else {
        message.error(response.message || 'Không thể tải dữ liệu');
        setData(null);
      }
    } catch (error) {
      console.error('Fetch statistics error:', error);
      message.error('Lỗi khi tải thống kê: ' + (error.response?.data?.message || error.message));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    message.info('Tính năng xuất báo cáo đang được phát triển');
  };

  const handleClearFilters = () => {
    setDateRange([dayjs().subtract(30, 'days'), dayjs()]);
    setGroupBy('day');
  };

  const getDatePickerByGroupBy = () => {
    if (groupBy === 'month') {
      return (
        <RangePicker
          value={dateRange}
          onChange={setDateRange}
          picker="month"
          format="MM/YYYY"
          placeholder={['Từ tháng', 'Đến tháng']}
          style={{ width: '100%' }}
          allowClear={false}
        />
      );
    } else if (groupBy === 'year') {
      return (
        <RangePicker
          value={dateRange}
          onChange={setDateRange}
          picker="year"
          format="YYYY"
          placeholder={['Từ năm', 'Đến năm']}
          style={{ width: '100%' }}
          allowClear={false}
        />
      );
    }
    // Default: day
    return (
      <RangePicker
        value={dateRange}
        onChange={setDateRange}
        format="DD/MM/YYYY"
        placeholder={['Từ ngày', 'Đến ngày']}
        style={{ width: '100%' }}
        allowClear={false}
      />
    );
  };

  // Prepare pie chart data
  const pieChartData = useMemo(() => 
    data ? [
      { name: 'Hoàn thành', value: data.summary.completed, color: STATUS_COLORS.completed },
      { name: 'Đã hủy', value: data.summary.cancelled, color: STATUS_COLORS.cancelled },
      { name: 'Không đến', value: data.summary.noShow, color: STATUS_COLORS.noShow }
    ].filter(item => item.value > 0) : []
  , [data]);

  // Prepare timeline chart data
  const timelineChartData = useMemo(() => 
    data?.timeline?.map(item => ({
      date: formatTimelineDate(item.date, groupBy === 'year' ? 'YYYY' : (groupBy === 'month' ? 'MM/YYYY' : 'DD/MM')),
      'Hoàn thành': item.completed,
      'Đã hủy': item.cancelled,
      'Không đến': item.noShow,
      'Tỷ lệ hoàn thành (%)': item.completedRate
    })) || []
  , [data, groupBy]);

  // Table columns for dentist breakdown
  const dentistColumns = [
    {
      title: 'Nha sĩ',
      dataIndex: 'dentistName',
      key: 'dentistName',
      width: 200,
      render: (name) => (
        <Space>
          <UserOutlined />
          <Text strong>{name}</Text>
        </Space>
      )
    },
    {
      title: 'Tổng lịch',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.total - b.total
    },
    {
      title: 'Hoàn thành',
      dataIndex: 'completed',
      key: 'completed',
      width: 120,
      align: 'center',
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: STATUS_COLORS.completed }}>{value}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.completedRate.toFixed(1)}%
          </Text>
        </Space>
      ),
      sorter: (a, b) => a.completed - b.completed
    },
    {
      title: 'Đã hủy',
      dataIndex: 'cancelled',
      key: 'cancelled',
      width: 120,
      align: 'center',
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ color: STATUS_COLORS.cancelled }}>{value}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.cancelledRate.toFixed(1)}%
          </Text>
        </Space>
      ),
      sorter: (a, b) => a.cancelled - b.cancelled
    },
    {
      title: 'Không đến',
      dataIndex: 'noShow',
      key: 'noShow',
      width: 120,
      align: 'center',
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ color: STATUS_COLORS.noShow }}>{value}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.noShowRate.toFixed(1)}%
          </Text>
        </Space>
      ),
      sorter: (a, b) => a.noShow - b.noShow
    },
    {
      title: 'Tỷ lệ thành công',
      dataIndex: 'completedRate',
      key: 'completedRate',
      width: 150,
      align: 'center',
      render: (rate) => {
        let color = STATUS_COLORS.completed;
        if (rate < 50) color = STATUS_COLORS.cancelled;
        else if (rate < 70) color = STATUS_COLORS.noShow;
        
        return (
          <Tag color={color} style={{ fontSize: 14, fontWeight: 'bold' }}>
            {rate.toFixed(1)}%
          </Tag>
        );
      },
      sorter: (a, b) => a.completedRate - b.completedRate,
      defaultSortOrder: 'descend'
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Title level={2}>
        <PieChartOutlined /> Thống kê Trạng thái Lịch hẹn
      </Title>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>
              <FilterOutlined /> Bộ lọc thống kê
            </Text>
            <Button 
              icon={<ClearOutlined />} 
              onClick={handleClearFilters}
              size="small"
            >
              Xóa bộ lọc
            </Button>
          </div>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Text type="secondary" style={{ fontSize: '12px' }}>Chọn khoảng thời gian:</Text>
              {getDatePickerByGroupBy()}
            </Col>
            <Col xs={24} md={12}>
              <Text type="secondary" style={{ fontSize: '12px' }}>Nhóm dữ liệu theo:</Text>
              <Select
                value={groupBy}
                onChange={(value) => {
                  setGroupBy(value);
                  if (value === 'month') {
                    setDateRange([dayjs().subtract(6, 'months'), dayjs()]);
                  } else if (value === 'year') {
                    setDateRange([dayjs().subtract(3, 'years'), dayjs()]);
                  } else {
                    setDateRange([dayjs().subtract(30, 'days'), dayjs()]);
                  }
                }}
                style={{ width: '100%' }}
              >
                <Select.Option value="day">📅 Theo ngày</Select.Option>
                <Select.Option value="month">📆 Theo tháng</Select.Option>
                <Select.Option value="year">🗓️ Theo năm</Select.Option>
              </Select>
            </Col>
          </Row>
        
          <Button 
            type="primary" 
            size="large"
            icon={<CalendarOutlined />}
            onClick={fetchStatistics}
            loading={loading}
            block
            style={{ height: '48px', fontSize: '16px', fontWeight: 500, marginTop: '16px' }}
          >
            {loading ? 'Đang tải dữ liệu...' : 'Xem Thống kê'}
          </Button>
        </Space>
      </Card>

      {loading ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Đang tải dữ liệu...</div>
          </div>
        </Card>
      ) : !data ? (
        <Card>
          <Empty description="Chọn bộ lọc và nhấn Xem Thống kê để xem dữ liệu" />
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Tổng lịch hẹn"
                  value={data.summary.total}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Đã hoàn thành"
                  value={data.summary.completed}
                  prefix={<CheckCircleOutlined />}
                  suffix={
                    <span style={{ fontSize: 14, color: '#999' }}>
                      ({data.summary.completedRate.toFixed(1)}%)
                    </span>
                  }
                  valueStyle={{ color: STATUS_COLORS.completed }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Đã hủy"
                  value={data.summary.cancelled}
                  prefix={<CloseCircleOutlined />}
                  suffix={
                    <span style={{ fontSize: 14, color: '#999' }}>
                      ({data.summary.cancelledRate.toFixed(1)}%)
                    </span>
                  }
                  valueStyle={{ color: STATUS_COLORS.cancelled }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Không đến"
                  value={data.summary.noShow}
                  prefix={<StopOutlined />}
                  suffix={
                    <span style={{ fontSize: 14, color: '#999' }}>
                      ({data.summary.noShowRate.toFixed(1)}%)
                    </span>
                  }
                  valueStyle={{ color: STATUS_COLORS.noShow }}
                />
              </Card>
            </Col>
          </Row>

          {/* Main Charts */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            {/* Pie Chart - Status Distribution */}
            <Col xs={24} lg={10}>
              <Card title="📊 Phân bố theo trạng thái" style={{ height: '100%' }}>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Legend with counts */}
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Space direction="vertical" size={8}>
                    {pieChartData.map((item) => (
                      <div key={item.name}>
                        <Tag 
                          color={item.color} 
                          style={{ minWidth: 100, fontWeight: 'bold', fontSize: 14 }}
                        >
                          {item.name}: {item.value}
                        </Tag>
                      </div>
                    ))}
                  </Space>
                </div>
              </Card>
            </Col>

            {/* Bar Chart - Timeline */}
            <Col xs={24} lg={14}>
              <Card title="📈 Xu hướng theo thời gian" style={{ height: '100%' }}>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={timelineChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Hoàn thành" fill={STATUS_COLORS.completed} />
                    <Bar dataKey="Đã hủy" fill={STATUS_COLORS.cancelled} />
                    <Bar dataKey="Không đến" fill={STATUS_COLORS.noShow} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Completion Rate Timeline */}
          {data.timeline && data.timeline.length > 1 && (
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col xs={24}>
                <Card title="📉 Tỷ lệ hoàn thành theo thời gian">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={timelineChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="Tỷ lệ hoàn thành (%)" 
                        stroke={STATUS_COLORS.completed} 
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          )}

          {/* Dentist Breakdown Table */}
          {data.byDentist && data.byDentist.length > 0 && (
            <Card 
              title="👨‍⚕️ Thống kê theo Nha sĩ"
              extra={
                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={handleExport}
                >
                  Xuất Excel
                </Button>
              }
            >
              <Table
                columns={dentistColumns}
                dataSource={data.byDentist}
                rowKey="dentistId"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AppointmentStatusStatistics;

import { useState, useEffect } from 'react';
import { Card, Row, Col, Tabs, Select, DatePicker, Statistic, Table, Spin, message, Space, Typography, Button } from 'antd';
import { 
  DollarOutlined, 
  CalendarOutlined, 
  TeamOutlined, 
  AppstoreOutlined,
  RiseOutlined,
  BarChartOutlined,
  TableOutlined,
  FilterOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import dayjs from 'dayjs';
import { getRevenueStatistics, MOCK_DENTISTS, MOCK_SERVICES } from '../../services/statisticsAPI';

const { RangePicker, MonthPicker, YearPicker } = DatePicker;
const { Text } = Typography;

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

  const formatDate = (date) => {
    if (groupBy === 'day') {
      return dayjs(date).format('DD/MM/YYYY');
    } else if (groupBy === 'month') {
      return dayjs(date).format('MM/YYYY');
    } else if (groupBy === 'year') {
      return dayjs(date).format('YYYY');
    }
    return date;
  };

  const handleClearFilters = () => {
    setSelectedDentist(null);
    setSelectedService(null);
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

  // Columns for time-based revenue table
  const timeRevenueColumns = [
    {
      title: groupBy === 'day' ? 'Ngày' : groupBy === 'month' ? 'Tháng' : groupBy === 'year' ? 'Năm' : 'Kỳ',
      dataIndex: 'date',
      key: 'date',
      render: (value) => formatDate(value),
      width: 150
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      render: (value) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{formatCurrency(value)}</span>,
      sorter: (a, b) => a.revenue - b.revenue
    }
  ];

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
        <Spin size="large" />
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
          {data.revenueByDentist && data.revenueByDentist.length > 0 ? (
            <>
              <Card title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><BarChartOutlined /> Biểu đồ doanh thu theo nha sỹ</span>
                  {selectedDentist && (
                    <Text type="secondary" style={{ fontSize: '12px', fontWeight: 'normal' }}>
                      Lọc: {MOCK_DENTISTS.find(d => d.id === selectedDentist)?.name}
                    </Text>
                  )}
                </div>
              } style={{ marginBottom: 24 }}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data.revenueByDentist}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="dentistName" 
                      angle={-45} 
                      textAnchor="end" 
                      height={120}
                      interval={0}
                      style={{ fontSize: '11px' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                      label={{ value: 'Doanh thu (VNĐ)', angle: -90, position: 'insideLeft' }}
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
              
              <Card 
                title={
                  <span>
                    <TableOutlined /> Bảng chi tiết doanh thu theo nha sỹ
                  </span>
                }
              >
                <Table 
                  columns={dentistColumns}
                  dataSource={data.revenueByDentist}
                  rowKey="dentistId"
                  pagination={{ 
                    pageSize: 10,
                    showTotal: (total) => `Tổng ${total} nha sỹ`,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50']
                  }}
                  summary={(pageData) => {
                    const totalRevenue = pageData.reduce((sum, item) => sum + item.totalRevenue, 0);
                    const totalAppointments = pageData.reduce((sum, item) => sum + item.appointmentCount, 0);
                    const totalServices = pageData.reduce((sum, item) => sum + item.serviceCount, 0);
                    
                    return (
                      <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                        <Table.Summary.Cell>Tổng cộng ({pageData.length} nha sỹ)</Table.Summary.Cell>
                        <Table.Summary.Cell align="right">{formatNumber(totalAppointments)}</Table.Summary.Cell>
                        <Table.Summary.Cell align="right">{formatNumber(totalServices)}</Table.Summary.Cell>
                        <Table.Summary.Cell align="right">
                          <span style={{ color: '#52c41a' }}>{formatCurrency(totalRevenue)}</span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell align="right">
                          {formatCurrency(totalAppointments > 0 ? totalRevenue / totalAppointments : 0)}
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    );
                  }}
                />
              </Card>
            </>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <TeamOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                <div style={{ fontSize: '16px', color: '#999' }}>
                  Dữ liệu doanh thu theo nha sỹ chưa khả dụng
                </div>
                <div style={{ fontSize: '14px', color: '#bbb', marginTop: '8px' }}>
                  Tính năng này đang được phát triển
                </div>
              </div>
            </Card>
          )}
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
                      label={(entry) => {
                        const name = entry.serviceName.length > 15 
                          ? entry.serviceName.substring(0, 15) + '...' 
                          : entry.serviceName;
                        const percent = ((entry.totalRevenue / data.revenueByService.slice(0, 8).reduce((sum, s) => sum + s.totalRevenue, 0)) * 100).toFixed(1);
                        return `${name} (${percent}%)`;
                      }}
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
                      tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
                    />
                    <Tooltip />
                    <Bar dataKey="totalCount" fill="#52c41a" name="Số lượng" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
          
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><TableOutlined /> Bảng chi tiết doanh thu theo dịch vụ</span>
                {selectedService && (
                  <Text type="secondary" style={{ fontSize: '12px', fontWeight: 'normal' }}>
                    Lọc: {MOCK_SERVICES.find(s => s.id === selectedService)?.name}
                  </Text>
                )}
              </div>
            }
          >
            <Table 
              columns={serviceColumns}
              dataSource={data.revenueByService}
              rowKey="serviceId"
              pagination={{ 
                pageSize: 10,
                showTotal: (total) => `Tổng ${total} dịch vụ`,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50']
              }}
              summary={(pageData) => {
                const totalRevenue = pageData.reduce((sum, item) => sum + item.totalRevenue, 0);
                const totalCount = pageData.reduce((sum, item) => sum + item.totalCount, 0);
                
                return (
                  <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                    <Table.Summary.Cell>Tổng cộng ({pageData.length} dịch vụ)</Table.Summary.Cell>
                    <Table.Summary.Cell align="right">{formatNumber(totalCount)}</Table.Summary.Cell>
                    <Table.Summary.Cell align="right">
                      <span style={{ color: '#52c41a' }}>{formatCurrency(totalRevenue)}</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align="right">
                      {formatCurrency(totalCount > 0 ? totalRevenue / totalCount : 0)}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
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
          <Card 
            title={
              <span><BarChartOutlined /> Xu hướng doanh thu theo thời gian</span>
            }
            style={{ marginBottom: 24 }}
          >
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data.revenueByTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={Math.floor(data.revenueByTime.length / 15)}
                  tickFormatter={(value) => formatDate(value)}
                />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  label={{ value: 'Doanh thu (VNĐ)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => formatDate(label)}
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

          <Card 
            title={
              <span><TableOutlined /> Bảng chi tiết doanh thu theo thời gian</span>
            }
          >
            <Table 
              columns={timeRevenueColumns}
              dataSource={data.revenueByTime}
              rowKey="date"
              pagination={{ 
                pageSize: 15,
                showTotal: (total) => `Tổng ${total} ${groupBy === 'day' ? 'ngày' : groupBy === 'month' ? 'tháng' : 'năm'}`,
                showSizeChanger: true,
                pageSizeOptions: ['15', '30', '50', '100']
              }}
              summary={(pageData) => {
                const totalRevenue = pageData.reduce((sum, item) => sum + item.revenue, 0);
                const avgRevenue = pageData.length > 0 ? totalRevenue / pageData.length : 0;
                
                return (
                  <>
                    <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                      <Table.Summary.Cell>Tổng cộng</Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <span style={{ color: '#52c41a' }}>{formatCurrency(totalRevenue)}</span>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row style={{ background: '#f0f0f0' }}>
                      <Table.Summary.Cell>Trung bình</Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <span style={{ color: '#1890ff' }}>{formatCurrency(avgRevenue)}</span>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </>
                );
              }}
            />
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
          <Card 
            title={
              <span><BarChartOutlined /> So sánh Số lượng vs Doanh thu theo Dịch vụ</span>
            }
            style={{ marginBottom: 24 }}
          >
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
                  tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
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
                  label={{ value: 'Doanh thu (VNĐ)', angle: 90, position: 'insideRight' }}
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

          <Card 
            title={
              <span><TableOutlined /> Bảng so sánh chi tiết</span>
            }
          >
            <Table 
              columns={[
                {
                  title: 'Dịch vụ',
                  dataIndex: 'name',
                  key: 'name',
                  render: (text, record) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{text}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {record.type === 'exam' ? '🔍 Khám' : '🛠️ Điều trị'}
                      </div>
                    </div>
                  ),
                  width: 250
                },
                {
                  title: 'Số lượng',
                  dataIndex: 'count',
                  key: 'count',
                  align: 'right',
                  render: (value) => <span style={{ fontWeight: 500, color: '#52c41a' }}>{formatNumber(value)}</span>,
                  sorter: (a, b) => a.count - b.count
                },
                {
                  title: 'Doanh thu',
                  dataIndex: 'revenue',
                  key: 'revenue',
                  align: 'right',
                  render: (value) => <span style={{ fontWeight: 500, color: '#1890ff' }}>{formatCurrency(value)}</span>,
                  sorter: (a, b) => a.revenue - b.revenue,
                  defaultSortOrder: 'descend'
                },
                {
                  title: 'Giá TB/Dịch vụ',
                  dataIndex: 'avgRevenue',
                  key: 'avgRevenue',
                  align: 'right',
                  render: (value) => formatCurrency(value),
                  sorter: (a, b) => a.avgRevenue - b.avgRevenue
                }
              ]}
              dataSource={data.comparison}
              rowKey="name"
              pagination={{ 
                pageSize: 15,
                showTotal: (total) => `Tổng ${total} dịch vụ`,
                showSizeChanger: true,
                pageSizeOptions: ['15', '30', '50']
              }}
              summary={(pageData) => {
                const totalCount = pageData.reduce((sum, item) => sum + item.count, 0);
                const totalRevenue = pageData.reduce((sum, item) => sum + item.revenue, 0);
                
                return (
                  <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                    <Table.Summary.Cell>Tổng cộng ({pageData.length} dịch vụ)</Table.Summary.Cell>
                    <Table.Summary.Cell align="right">
                      <span style={{ color: '#52c41a' }}>{formatNumber(totalCount)}</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align="right">
                      <span style={{ color: '#1890ff' }}>{formatCurrency(totalRevenue)}</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align="right">
                      {formatCurrency(totalCount > 0 ? totalRevenue / totalCount : 0)}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
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
                    // Reset date range khi thay đổi groupBy
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

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Lọc theo nha sỹ (tùy chọn):</Text>
                <Select
                  placeholder="Tất cả nha sỹ"
                  allowClear
                  value={selectedDentist}
                  onChange={setSelectedDentist}
                  style={{ width: '100%' }}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {MOCK_DENTISTS.map(d => (
                    <Select.Option key={d.id} value={d.id}>
                      {d.name} - {d.specialization}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Lọc theo dịch vụ (tùy chọn):</Text>
                <Select
                  placeholder="Tất cả dịch vụ"
                  allowClear
                  value={selectedService}
                  onChange={setSelectedService}
                  style={{ width: '100%' }}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {MOCK_SERVICES.map(s => (
                    <Select.Option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </Select.Option>
                  ))}
                </Select>
              </Col>
            </Row>

            {(selectedDentist || selectedService) && (
              <div style={{ padding: '8px 12px', background: '#e6f7ff', borderRadius: '4px', border: '1px solid #91d5ff' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <FilterOutlined /> Đang lọc: 
                  {selectedDentist && <span style={{ marginLeft: 8, fontWeight: 500 }}>
                    Nha sỹ: {MOCK_DENTISTS.find(d => d.id === selectedDentist)?.name}
                  </span>}
                  {selectedDentist && selectedService && <span> + </span>}
                  {selectedService && <span style={{ marginLeft: 8, fontWeight: 500 }}>
                    Dịch vụ: {MOCK_SERVICES.find(s => s.id === selectedService)?.name}
                  </span>}
                </Text>
              </div>
            )}
          </Space>
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

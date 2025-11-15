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
  PercentageOutlined,
  ReloadOutlined,
  DownloadOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { getClinicUtilizationStatistics } from '../../services/statisticsAPI';

dayjs.extend(quarterOfYear);

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 🎨 Colors
const COLORS = {
  booked: '#52c41a',
  empty: '#d9d9d9',
  primary: '#1890ff'
};

// Helper to format timeline dates based on format
const formatTimelineDate = (dateStr, format = 'DD/MM') => {
  if (!dateStr) return '';
  
  // Handle quarter format: "2025-Q1"
  if (dateStr.includes('-Q')) {
    const [year, quarter] = dateStr.split('-Q');
    return `Q${quarter}/${year}`;
  }
  
  // Handle year format: "2025"
  if (dateStr.match(/^\d{4}$/)) {
    return dateStr;
  }
  
  // Handle month format: "2025-11" or full date "2025-11-13"
  return dayjs(dateStr).format(format);
};

const ClinicUtilizationStatistics = () => {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('month');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [data, setData] = useState(null);
  const [roomsList, setRoomsList] = useState([]);

  // Mock data cho rooms
  const mockRooms = [
    { _id: '1', name: 'Phòng 1', roomType: 'CONSULTATION', isActive: true },
    { _id: '2', name: 'Phòng 2', roomType: 'GENERAL_TREATMENT', isActive: true },
    { _id: '3', name: 'Phòng 3', roomType: 'SURGERY', isActive: true },
    { _id: '4', name: 'Phòng 4', roomType: 'ORTHODONTIC', isActive: true },
    { _id: '5', name: 'Phòng 5', roomType: 'COSMETIC', isActive: true },
    { _id: '6', name: 'Phòng 6', roomType: 'PEDIATRIC', isActive: true },
    { _id: '7', name: 'Phòng X-Quang', roomType: 'X_RAY', isActive: true },
    { _id: '8', name: 'Phòng Tiệt trùng', roomType: 'STERILIZATION', isActive: true }
  ];

  // Mock data cho statistics
  const mockStatistics = {
    summary: {
      totalSlots: 1200,
      bookedSlots: 850,
      emptySlots: 350,
      utilizationRate: 70.8
    },
    byRoom: [
      {
        roomId: '1',
        roomName: 'Phòng 1',
        roomType: 'CONSULTATION',
        totalSlots: 400,
        bookedSlots: 320,
        emptySlots: 80,
        utilizationRate: 80,
        avgSlotsPerDay: 13.3
      },
      {
        roomId: '2',
        roomName: 'Phòng 2',
        roomType: 'GENERAL_TREATMENT',
        totalSlots: 300,
        bookedSlots: 210,
        emptySlots: 90,
        utilizationRate: 70,
        avgSlotsPerDay: 10
      },
      {
        roomId: '3',
        roomName: 'Phòng 3',
        roomType: 'SURGERY',
        totalSlots: 250,
        bookedSlots: 200,
        emptySlots: 50,
        utilizationRate: 80,
        avgSlotsPerDay: 8.3
      },
      {
        roomId: '4',
        roomName: 'Phòng 4',
        roomType: 'ORTHODONTIC',
        totalSlots: 150,
        bookedSlots: 90,
        emptySlots: 60,
        utilizationRate: 60,
        avgSlotsPerDay: 5
      },
      {
        roomId: '5',
        roomName: 'Phòng 5',
        roomType: 'COSMETIC',
        totalSlots: 100,
        bookedSlots: 30,
        emptySlots: 70,
        utilizationRate: 30,
        avgSlotsPerDay: 3.3
      }
    ],
    byShift: {
      'Ca Sáng': { total: 600, booked: 450, rate: 75 },
      'Ca Chiều': { total: 400, booked: 300, rate: 75 },
      'Ca Tối': { total: 200, booked: 100, rate: 50 }
    },
    timeline: [
      { date: '2025-11-01', totalSlots: 40, bookedSlots: 32, utilizationRate: 80 },
      { date: '2025-11-02', totalSlots: 40, bookedSlots: 30, utilizationRate: 75 },
      { date: '2025-11-03', totalSlots: 40, bookedSlots: 28, utilizationRate: 70 },
      { date: '2025-11-04', totalSlots: 40, bookedSlots: 35, utilizationRate: 87.5 },
      { date: '2025-11-05', totalSlots: 40, bookedSlots: 33, utilizationRate: 82.5 },
      { date: '2025-11-06', totalSlots: 40, bookedSlots: 30, utilizationRate: 75 },
      { date: '2025-11-07', totalSlots: 40, bookedSlots: 28, utilizationRate: 70 }
    ]
  };

  // Load rooms khi component mount
  useEffect(() => {
    let timeoutId;
    const loadRoomsAsync = () => {
      // Mock API call - In production, fetch from room-service
      timeoutId = setTimeout(() => {
        setRoomsList(mockRooms);
      }, 300);
    };
    
    loadRoomsAsync();
    
    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Auto-select bookable rooms
  useEffect(() => {
    if (roomsList.length > 0 && selectedRooms.length === 0) {
      const bookableRooms = roomsList
        .filter(r => !['X_RAY', 'STERILIZATION', 'LAB', 'SUPPORT'].includes(r.roomType))
        .map(r => r._id);
      setSelectedRooms(bookableRooms);
      fetchStatistics(bookableRooms);
    }
  }, [roomsList]);

  const fetchStatistics = async (rooms = selectedRooms) => {
    if (loading) return; // Prevent concurrent requests
    setLoading(true);
    
    try {
      const params = {
        startDate: selectedDate.startOf(timeRange).format('YYYY-MM-DD'),
        endDate: selectedDate.endOf(timeRange).format('YYYY-MM-DD'),
        roomIds: rooms,
        timeRange,
        shiftName: selectedShift
      };
      
      const response = await getClinicUtilizationStatistics(params);
      
      if (response.success) {
        // Enrich byRoom data with room names and types from roomsList
        const enrichedData = {
          ...response.data,
          byRoom: (response.data.byRoom || []).map(room => {
            const roomInfo = roomsList.find(r => r._id === room.roomId);
            return {
              ...room,
              roomName: roomInfo?.name || `Phòng ${room.roomId}`,
              roomType: roomInfo?.roomType || 'UNKNOWN'
            };
          })
        };
        
        setData(enrichedData);
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

  const handleSearch = () => {
    if (selectedRooms.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 phòng');
      return;
    }
    fetchStatistics();
  };

  const handleExport = () => {
    message.info('Tính năng xuất báo cáo đang được phát triển');
  };

  const getRoomTypeName = (type) => {
    const types = {
      CONSULTATION: 'Tư vấn',
      GENERAL_TREATMENT: 'Điều trị',
      SURGERY: 'Phẫu thuật',
      ORTHODONTIC: 'Chỉnh nha',
      COSMETIC: 'Thẩm mỹ',
      PEDIATRIC: 'Nha nhi',
      X_RAY: 'X-Quang',
      STERILIZATION: 'Tiệt trùng',
      LAB: 'Lab',
      SUPPORT: 'Phụ trợ'
    };
    return types[type] || type;
  };

  const getRoomTypeColor = (type) => {
    const colors = {
      CONSULTATION: 'blue',
      GENERAL_TREATMENT: 'green',
      SURGERY: 'red',
      ORTHODONTIC: 'purple',
      COSMETIC: 'pink',
      PEDIATRIC: 'orange',
      X_RAY: 'default',
      STERILIZATION: 'default',
      LAB: 'default',
      SUPPORT: 'default'
    };
    return colors[type] || 'default';
  };

  // Table columns
  const columns = [
    {
      title: 'Phòng',
      dataIndex: 'roomName',
      key: 'roomName',
      width: 150,
      fixed: 'left'
    },
    {
      title: 'Loại',
      dataIndex: 'roomType',
      key: 'roomType',
      width: 120,
      render: (type) => (
        <Tag color={getRoomTypeColor(type)}>
          {getRoomTypeName(type)}
        </Tag>
      )
    },
    {
      title: 'Tổng slot',
      dataIndex: 'totalSlots',
      key: 'totalSlots',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.totalSlots - b.totalSlots
    },
    {
      title: 'Có lịch',
      dataIndex: 'bookedSlots',
      key: 'bookedSlots',
      width: 100,
      align: 'center',
      render: (value) => (
        <Text strong style={{ color: COLORS.booked }}>{value}</Text>
      ),
      sorter: (a, b) => a.bookedSlots - b.bookedSlots
    },
    {
      title: 'Trống',
      dataIndex: 'emptySlots',
      key: 'emptySlots',
      width: 100,
      align: 'center',
      render: (value) => (
        <Text type="secondary">{value}</Text>
      ),
      sorter: (a, b) => a.emptySlots - b.emptySlots
    },
    {
      title: 'Tỷ lệ sử dụng',
      dataIndex: 'utilizationRate',
      key: 'utilizationRate',
      width: 150,
      align: 'center',
      render: (rate) => {
        const rateValue = typeof rate === 'number' ? rate : 0;
        let color = COLORS.booked;
        if (rateValue < 50) color = '#ff4d4f';
        else if (rateValue < 70) color = '#faad14';
        
        return (
          <Tag color={color} style={{ fontSize: 14, fontWeight: 'bold' }}>
            {rateValue.toFixed(1)}%
          </Tag>
        );
      },
      sorter: (a, b) => a.utilizationRate - b.utilizationRate,
      defaultSortOrder: 'descend'
    },
    {
      title: 'TB/ngày',
      dataIndex: 'avgSlotsPerDay',
      key: 'avgSlotsPerDay',
      width: 100,
      align: 'center',
      render: (value) => {
        const avgValue = typeof value === 'number' ? value : 0;
        return `${avgValue.toFixed(1)} slots`;
      },
      sorter: (a, b) => a.avgSlotsPerDay - b.avgSlotsPerDay
    }
  ];

  // Prepare chart data - memoized to prevent unnecessary recalculations
  const barChartData = useMemo(() => 
    data?.byRoom?.map(room => ({
      name: room.roomName,
      'Có lịch': room.bookedSlots,
      'Trống': room.emptySlots
    })) || []
  , [data]);

  const pieChartData = useMemo(() => 
    data ? [
      { name: 'Có lịch hẹn', value: data.summary.bookedSlots, color: COLORS.booked },
      { name: 'Trống', value: data.summary.emptySlots, color: COLORS.empty }
    ] : []
  , [data]);

  const shiftChartData = useMemo(() => 
    data ? Object.entries(data.byShift).map(([shift, stats]) => ({
      shift,
      'Tổng': stats.total,
      'Có lịch': stats.booked,
      'Tỷ lệ': stats.rate
    })) : []
  , [data]);

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Title level={2}>
        <BarChartOutlined /> Thống kê Hiệu suất Sử dụng Phòng khám
      </Title>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Text strong>Khoảng thời gian</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={timeRange}
              onChange={setTimeRange}
            >
              <Option value="day">Theo ngày</Option>
              <Option value="month">Theo tháng</Option>
              <Option value="quarter">Theo quý</Option>
              <Option value="year">Theo năm</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Text strong>Chọn thời gian</Text>
            {timeRange === 'day' && (
              <DatePicker
                style={{ width: '100%', marginTop: 8 }}
                value={selectedDate}
                onChange={setSelectedDate}
                format="DD/MM/YYYY"
              />
            )}
            {timeRange === 'month' && (
              <DatePicker
                style={{ width: '100%', marginTop: 8 }}
                value={selectedDate}
                onChange={setSelectedDate}
                picker="month"
                format="MM/YYYY"
              />
            )}
            {timeRange === 'quarter' && (
              <DatePicker
                style={{ width: '100%', marginTop: 8 }}
                value={selectedDate}
                onChange={setSelectedDate}
                picker="quarter"
                format="[Q]Q YYYY"
              />
            )}
            {timeRange === 'year' && (
              <DatePicker
                style={{ width: '100%', marginTop: 8 }}
                value={selectedDate}
                onChange={setSelectedDate}
                picker="year"
                format="YYYY"
              />
            )}
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Text strong>Chọn phòng</Text>
            <Select
              mode="multiple"
              style={{ width: '100%', marginTop: 8 }}
              placeholder="Chọn phòng khám"
              value={selectedRooms}
              onChange={setSelectedRooms}
              maxTagCount="responsive"
            >
              {roomsList
                .filter(r => !['X_RAY', 'STERILIZATION', 'LAB', 'SUPPORT'].includes(r.roomType))
                .map(room => (
                  <Option key={room._id} value={room._id}>
                    <Tag color={getRoomTypeColor(room.roomType)} style={{ marginRight: 8 }}>
                      {getRoomTypeName(room.roomType)}
                    </Tag>
                    {room.name}
                  </Option>
                ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Text strong>Chọn ca làm việc</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              placeholder="Tất cả ca"
              value={selectedShift}
              onChange={setSelectedShift}
              allowClear
            >
              <Option value="Ca Sáng">Ca Sáng</Option>
              <Option value="Ca Chiều">Ca Chiều</Option>
              <Option value="Ca Tối">Ca Tối</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Text strong style={{ opacity: 0 }}>Actions</Text>
            <Space style={{ display: 'block', marginTop: 8 }}>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleSearch}
                loading={loading}
              >
                Tìm kiếm
              </Button>
            </Space>
          </Col>
        </Row>
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
          <Empty description="Chọn bộ lọc và nhấn Tìm kiếm để xem thống kê" />
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Tổng số slot"
                  value={data.summary.totalSlots}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: COLORS.primary }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Có lịch hẹn"
                  value={data.summary.bookedSlots}
                  prefix={<CheckCircleOutlined />}
                  suffix={`/ ${data.summary.totalSlots}`}
                  valueStyle={{ color: COLORS.booked }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Slot trống"
                  value={data.summary.emptySlots}
                  prefix={<CloseCircleOutlined />}
                  suffix={`/ ${data.summary.totalSlots}`}
                  valueStyle={{ color: '#999' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Tỷ lệ sử dụng"
                  value={data.summary.utilizationRate}
                  prefix={<PercentageOutlined />}
                  suffix="%"
                  precision={1}
                  valueStyle={{ 
                    color: data.summary.utilizationRate >= 70 ? COLORS.booked : '#faad14' 
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* Charts */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            {/* Bar Chart */}
            <Col xs={24} lg={16}>
              <Card title="📊 Thống kê theo phòng">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Có lịch" fill={COLORS.booked} />
                    <Bar dataKey="Trống" fill={COLORS.empty} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Pie Chart */}
            <Col xs={24} lg={8}>
              <Card title="📈 Tỷ lệ tổng quan">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
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
              </Card>
            </Col>
          </Row>

          {/* Shift Analysis */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24}>
              <Card title="⏰ Phân tích theo ca làm việc">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={shiftChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shift" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="Tổng" fill="#8884d8" />
                    <Bar yAxisId="left" dataKey="Có lịch" fill={COLORS.booked} />
                    <Line yAxisId="right" type="monotone" dataKey="Tỷ lệ" stroke="#ff7300" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Timeline */}
          {data.timeline && data.timeline.length > 1 && (
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col xs={24}>
                <Card title="📉 Xu hướng theo thời gian">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data.timeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => formatTimelineDate(date, 'DD/MM')}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(date) => formatTimelineDate(date, 'DD/MM/YYYY')}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="utilizationRate" 
                        stroke={COLORS.booked} 
                        strokeWidth={2}
                        name="Tỷ lệ sử dụng (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          )}

          {/* Detail Table */}
          <Card 
            title="📋 Chi tiết theo phòng"
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
              columns={columns}
              dataSource={data.byRoom}
              rowKey="roomId"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default ClinicUtilizationStatistics;

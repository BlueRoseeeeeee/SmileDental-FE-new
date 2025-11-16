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
  BarChartOutlined,
  FilterOutlined,
  ClearOutlined
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
import { getApiInstance } from '../../services/apiFactory';

const api = getApiInstance('room'); // For fetching room data
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
  const [groupBy, setGroupBy] = useState('day');
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [data, setData] = useState(null);
  const [roomsList, setRoomsList] = useState([]);

  // Load rooms khi component mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get('/room');
        if (response.data && response.data.rooms) {
          setRoomsList(response.data.rooms || []);
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
        message.error('Không thể tải danh sách phòng');
      }
    };
    
    fetchRooms();
  }, []);

  //(không auto-fetch)
  useEffect(() => {
    if (roomsList.length > 0 && selectedRooms.length === 0) {
      const bookableRooms = roomsList
        .filter(r => !['X_RAY', 'STERILIZATION', 'LAB', 'SUPPORT'].includes(r.roomType))
        .map(r => r._id);
      setSelectedRooms(bookableRooms);
    }
  }, [roomsList]);

  // ✅ Không auto-call khi thay đổi filters - chỉ call khi click button

  const fetchStatistics = async (rooms = selectedRooms) => {
    if (loading) return; // Prevent concurrent requests
    setLoading(true);
    
    console.log('🔍 [FE] Fetching statistics with:', {
      selectedRooms,
      rooms,
      dateRange: [dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')],
      groupBy,
      selectedShift
    });
    
    try {
      const params = {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        roomIds: rooms,
        timeRange: groupBy,
        shiftName: selectedShift
      };
      
      console.log('📤 [FE] API params:', params);
      
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

  const handleExport = () => {
    message.info('Tính năng xuất báo cáo đang được phát triển');
  };

  const handleClearFilters = () => {
    setDateRange([dayjs().subtract(30, 'days'), dayjs()]);
    setGroupBy('day');
    setSelectedRooms([]);
    setSelectedShift(null);
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
              <Text type="secondary" style={{ fontSize: '12px' }}>Chọn phòng (tùy chọn):</Text>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Tất cả phòng"
                value={selectedRooms}
                onChange={(value) => {
                  console.log('🏠 [FE] Rooms selection changed:', value);
                  setSelectedRooms(value);
                }}
                maxTagCount="responsive"
                allowClear
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

            <Col xs={24} md={12}>
              <Text type="secondary" style={{ fontSize: '12px' }}>Chọn ca làm việc (tùy chọn):</Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Tất cả ca"
                value={selectedShift}
                onChange={(value) => {
                  console.log('⏰ [FE] Shift selection changed:', value);
                  setSelectedShift(value);
                }}
                allowClear
              >
                <Option value="Ca Sáng">Ca Sáng</Option>
                <Option value="Ca Chiều">Ca Chiều</Option>
                <Option value="Ca Tối">Ca Tối</Option>
            </Select>
          </Col>
        </Row>
        
        {/* ✅ Button Thống kê */}
        <Button 
          type="primary" 
          size="large"
          icon={<CalendarOutlined />}
          onClick={() => fetchStatistics()}
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

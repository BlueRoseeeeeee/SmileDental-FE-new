/**
 * @author: HoTram
 * Holiday Management - Trang quản lý ngày nghỉ 
 */
import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Modal, 
  Form, 
  DatePicker, 
  Input, 
  Table,
  Tag,
  Popconfirm,
  Tooltip,
  Empty,
  Alert,
  Row,
  Col,
  Select
} from 'antd';
import { 
  PlusOutlined, 
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { scheduleConfigService } from '../../services/index.js';
import { toast } from '../../services/toastService.js';
import {  debounce } from '../../utils/searchUtils.js';

const { Title, Text } = Typography;
const { TextArea } = Input;

const HolidayManagement = () => {
  console.log('HolidayManagement rendered');
  
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [form] = Form.useForm();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');

  // Load holidays từ API
  const loadHolidays = async () => {
    try {
      setLoading(true);
      console.log('Loading holidays...');
      
      const response = await scheduleConfigService.getHolidays();
      console.log('Holidays response:', response);
      
      // API trả về data.holidays array
      setHolidays(response.data?.holidays || []);
    } catch (error) {
      console.error('Error loading holidays:', error);
      toast.error('Không thể tải danh sách ngày nghỉ');
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter và search data
  const getFilteredHolidays = () => {
    let filtered = holidays;
    
    // Search trong tên và ghi chú
    if (searchTerm) {
      filtered = filtered.filter(holiday => {
        const name = holiday.name?.toLowerCase() || '';
        const note = holiday.note?.toLowerCase() || '';
        const term = searchTerm.toLowerCase();
        return name.includes(term) || note.includes(term);
      });
    }
    
    // Filter theo năm
    if (filterYear && filterYear !== 'all') {
      filtered = filtered.filter(holiday => {
        const year = dayjs(holiday.startDate).year();
        return year === parseInt(filterYear);
      });
    }
    
    // Filter theo tháng
    if (filterMonth && filterMonth !== 'all') {
      filtered = filtered.filter(holiday => {
        const month = dayjs(holiday.startDate).month() + 1;
        return month === parseInt(filterMonth);
      });
    }
    
    
    return filtered;
  };

  // Debounced search function
  const debouncedSearch = debounce((value) => {
    setSearchTerm(value);
  }, 300);


  // Get years from holidays data
  const getAvailableYears = () => {
    // Hiển thị năm từ năm hiện tại +1 đến năm hiện tại -5
    const currentYear = dayjs().year();
    const years = [];
    for (let i = currentYear + 1; i >= currentYear - 5; i--) {
      years.push(i);
    }
    return years;
  };

  // Get months from holidays data
  const getAvailableMonths = () => {
    // Hiển thị tất cả tháng từ 1-12
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  // Thêm ngày nghỉ lễ
  const handleAddHoliday = () => {
    setEditingHoliday(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Sửa ngày nghỉ lễ
  const handleEditHoliday = (holiday) => {
    setEditingHoliday(holiday);
    form.setFieldsValue({
      name: holiday.name,
      startDate: dayjs(holiday.startDate),
      endDate: dayjs(holiday.endDate),
      note: holiday.note
    });
    setModalVisible(true);
  };

  // Xóa ngày nghỉ lễ
  const handleDeleteHoliday = async (holidayId) => {
    try {
      console.log('Deleting holiday:', holidayId);
      await scheduleConfigService.removeHoliday(holidayId);
      
      // Cập nhật local state
      setHolidays(holidays.filter(h => h._id !== holidayId));
      toast.success('Xóa ngày nghỉ thành công!');
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast.error('Không thể xóa ngày nghỉ');
    }
  };

  // Lưu ngày nghỉ lễ
  const handleSaveHoliday = async (values) => {
    try {
      const holidayData = {
        name: values.name,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        note: values.note || ''
      };

      console.log('Saving holiday:', holidayData);

      if (editingHoliday) {
        // Update existing holiday
        const response = await scheduleConfigService.updateHoliday(editingHoliday._id, holidayData);
        console.log('Update holiday response:', response);
        
        // Reload holidays để lấy data mới nhất
        await loadHolidays();
        toast.success('Cập nhật ngày nghỉ thành công!');
      } else {
        // Add new holiday
        const response = await scheduleConfigService.addHoliday(holidayData);
        console.log('Add holiday response:', response);
        
        // Reload holidays để lấy data mới nhất
        await loadHolidays();
        toast.success('Thêm ngày nghỉ thành công!');
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error saving holiday:', error);
      toast.error('Không thể lưu ngày nghỉ');
    }
  };

  // Định nghĩa columns cho Table
  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      render: (_, __, index) => index + 1,
      width: 60
    },
    {
      title: 'Tên ngày nghỉ',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.note && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.note}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => (
        <Space>
          <CalendarOutlined />
          <Text>{dayjs(date).format('DD/MM/YYYY')}</Text>
        </Space>
      ),
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date) => (
        <Space>
          <CalendarOutlined />
          <Text>{dayjs(date).format('DD/MM/YYYY')}</Text>
        </Space>
      ),
    },
    {
      title: 'Số ngày nghỉ',
      key: 'duration',
      render: (_, record) => {
        const start = dayjs(record.startDate);
        const end = dayjs(record.endDate);
        const duration = end.diff(start, 'day') + 1;
        return (
          <Space>
            <ClockCircleOutlined />
            <Text>{duration} ngày</Text>
          </Space>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Sửa ngày nghỉ">
            <Button 
              type="primary" 
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditHoliday(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa ngày nghỉ "
            description="Bạn có chắc chắn muốn xóa ngày nghỉ  này?"
            onConfirm={() => handleDeleteHoliday(record._id)}
            okText="Xóa"
            cancelText="Hủy"
            okType="danger"
          >
            <Tooltip title="Xóa ngày nghỉ ">
              <Button 
                danger 
                size="small"
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Load holidays khi component mount
  React.useEffect(() => {
    loadHolidays();
  }, []);

  return (
    <div>

      <div style={{ marginBottom: '24px' }}>
        <Title level={4}>
          <CalendarOutlined style={{ marginRight: '8px' }} />
          Quản lý Ngày nghỉ 
        </Title>
      </div>

      <Card>
        {/* Search và Filter */}
        <div style={{ marginBottom: '16px' }}>
          {/* Row 1: Bộ lọc */}
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: '16px' }}>
            <Col xs={24} sm={12} md={8}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: '4px' }}>Tìm kiếm:</Text>
                <Input
                  placeholder="Tìm kiếm theo tên hoặc ghi chú..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => debouncedSearch(e.target.value)}
                  allowClear
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: '4px' }}>Lọc theo năm:</Text>
                <Select
                  style={{ width: '100%' }}
                  value={filterYear}
                  onChange={setFilterYear}
                  placeholder="Chọn năm"
                  allowClear
                >
                  <Select.Option value="all">Tất cả năm</Select.Option>
                  {getAvailableYears().map(year => (
                    <Select.Option key={year} value={year}>{year}</Select.Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: '4px' }}>Lọc theo tháng:</Text>
                <Select
                  style={{ width: '100%' }}
                  value={filterMonth}
                  onChange={setFilterMonth}
                  placeholder="Chọn tháng"
                  allowClear
                >
                  <Select.Option value="all">Tất cả tháng</Select.Option>
                  {getAvailableMonths().map(month => (
                    <Select.Option key={month} value={month}>
                      Tháng {month}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </Col>
          </Row>

          <Row justify="end">
            <Col>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleAddHoliday}
                size="large"
              >
                Thêm ngày nghỉ 
              </Button>
            </Col>
          </Row>
        </div>

        {getFilteredHolidays().length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Title level={4} type="secondary">Chưa có ngày nghỉ </Title>
                <Text type="secondary">
                  Hãy thêm ngày nghỉ  để hệ thống không tạo lịch vào những ngày này
                </Text>
              </div>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={getFilteredHolidays()}
            rowKey="_id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} của ${total} ngày nghỉ`,
            }}
            scroll={{ x: 800 }}
            size="middle"
          />
        )}
      </Card>

      {/* Modal thêm/sửa ngày nghỉ lễ */}
      <Modal
        title={editingHoliday ? 'Sửa ngày nghỉ' : 'Thêm ngày nghỉ'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveHoliday}
        >
          <Form.Item
            name="name"
            label="Tên ngày nghỉ"
            rules={[
              { required: true, message: 'Vui lòng nhập tên ngày nghỉ' },
              { max: 100, message: 'Tên không được quá 100 ký tự' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="startDate"
            label="Ngày bắt đầu"
            rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
          >
            <DatePicker 
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày bắt đầu"
            />
          </Form.Item>

          <Form.Item
            name="endDate"
            label="Ngày kết thúc"
            rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
          >
            <DatePicker 
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày kết thúc"
            />
          </Form.Item>

          <Form.Item
            name="note"
            label="Ghi chú"
          >
            <TextArea 
              rows={6}
              placeholder="Ghi chú thêm về ngày nghỉ..."
              maxLength={200}
              className="custom-textarea"
            />
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingHoliday ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default HolidayManagement;

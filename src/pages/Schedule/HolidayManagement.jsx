/**
 * @author: HoTram
 * Holiday Management - Trang quản lý ngày nghỉ lễ
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
  Alert
} from 'antd';
import { 
  PlusOutlined, 
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const HolidayManagement = () => {
  console.log('HolidayManagement rendered');
  
  const [holidays, setHolidays] = useState([
    {
      _id: '1',
      name: 'Tết Nguyên Đán',
      startDate: '2024-02-10',
      endDate: '2024-02-16',
      note: 'Nghỉ Tết Nguyên Đán 2024',
      isActive: true
    },
    {
      _id: '2',
      name: 'Giỗ Tổ Hùng Vương',
      startDate: '2024-04-18',
      endDate: '2024-04-18',
      note: 'Ngày giỗ Tổ Hùng Vương',
      isActive: true
    },
    {
      _id: '3',
      name: 'Ngày Giải phóng miền Nam',
      startDate: '2024-04-30',
      endDate: '2024-04-30',
      note: 'Ngày 30/4 - Giải phóng miền Nam',
      isActive: true
    },
    {
      _id: '4',
      name: 'Ngày Quốc tế Lao động',
      startDate: '2024-05-01',
      endDate: '2024-05-01',
      note: 'Ngày 1/5 - Quốc tế Lao động',
      isActive: true
    },
    {
      _id: '5',
      name: 'Ngày Quốc khánh',
      startDate: '2024-09-02',
      endDate: '2024-09-02',
      note: 'Ngày 2/9 - Quốc khánh Việt Nam',
      isActive: true
    }
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [form] = Form.useForm();

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
  const handleDeleteHoliday = (holidayId) => {
    setHolidays(holidays.filter(h => h._id !== holidayId));
    alert('Xóa ngày nghỉ lễ thành công!');
  };

  // Lưu ngày nghỉ lễ
  const handleSaveHoliday = (values) => {
    const holidayData = {
      _id: editingHoliday ? editingHoliday._id : Date.now().toString(),
      name: values.name,
      startDate: values.startDate.format('YYYY-MM-DD'),
      endDate: values.endDate.format('YYYY-MM-DD'),
      note: values.note || '',
      isActive: true
    };

    if (editingHoliday) {
      setHolidays(holidays.map(h => h._id === editingHoliday._id ? holidayData : h));
      alert('Cập nhật ngày nghỉ lễ thành công!');
    } else {
      setHolidays([...holidays, holidayData]);
      alert('Thêm ngày nghỉ lễ thành công!');
    }

    setModalVisible(false);
    form.resetFields();
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
      title: 'Tên ngày nghỉ lễ',
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
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Sửa ngày nghỉ lễ">
            <Button 
              type="primary" 
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditHoliday(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa ngày nghỉ lễ"
            description="Bạn có chắc chắn muốn xóa ngày nghỉ lễ này?"
            onConfirm={() => handleDeleteHoliday(record._id)}
            okText="Xóa"
            cancelText="Hủy"
            okType="danger"
          >
            <Tooltip title="Xóa ngày nghỉ lễ">
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

  return (
    <div>

      <div style={{ marginBottom: '24px' }}>
        <Title level={4}>
          <CalendarOutlined style={{ marginRight: '8px' }} />
          Quản lý Ngày nghỉ lễ
        </Title>
      </div>

      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAddHoliday}
            size="large"
          >
            Thêm ngày nghỉ lễ
          </Button>
        </div>

        {holidays.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Title level={4} type="secondary">Chưa có ngày nghỉ lễ</Title>
                <Text type="secondary">
                  Hãy thêm ngày nghỉ lễ để hệ thống không tạo lịch vào những ngày này
                </Text>
              </div>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={holidays}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} của ${total} ngày nghỉ lễ`,
            }}
            scroll={{ x: 800 }}
            size="middle"
          />
        )}
      </Card>

      {/* Modal thêm/sửa ngày nghỉ lễ */}
      <Modal
        title={editingHoliday ? 'Sửa ngày nghỉ lễ' : 'Thêm ngày nghỉ lễ'}
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
            label="Tên ngày nghỉ lễ"
            rules={[
              { required: true, message: 'Vui lòng nhập tên ngày nghỉ lễ' },
              { max: 100, message: 'Tên không được quá 100 ký tự' }
            ]}
          >
            <Input placeholder="Ví dụ: Tết Nguyên Đán, Giỗ Tổ Hùng Vương" />
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
              rows={3}
              placeholder="Ghi chú thêm về ngày nghỉ lễ..."
              maxLength={200}
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

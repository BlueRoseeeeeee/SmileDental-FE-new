/*
* Medicine List Page - Medicine Catalog Management (for Prescription)
*/
import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, 
  Card, 
  Button, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Tag,
  Tooltip,
  Switch,
  Input,
  Select,
  Modal,
  Form,
  Divider
} from 'antd';
import { toast } from '../services/toastService';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  MedicineBoxOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import medicineService from '../services/medicineService';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

const MedicineList = () => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [form] = Form.useForm();

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Toggle loading map
  const [toggleLoadingMap, setToggleLoadingMap] = useState({});

  // Check permission: Manager or Admin can perform CRUD
  const isManagerOrAdmin = useMemo(() => {
    if (!user) return false;
    const userRoles = user.roles || (user.role ? [user.role] : []);
    return userRoles.includes('manager') || userRoles.includes('admin');
  }, [user]);

  // Medicine categories - matching backend enum
  const categories = [
    { value: 'thuốc giảm đau', label: 'Thuốc giảm đau' },
    { value: 'kháng sinh', label: 'Kháng sinh' },
    { value: 'thuốc bôi', label: 'Thuốc bôi' },
    { value: 'thuốc súc miệng', label: 'Thuốc súc miệng' },
    { value: 'vitamin', label: 'Vitamin' },
    { value: 'khác', label: 'Khác' }
  ];

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to page 1 on search
  };

  useEffect(() => {
    fetchMedicines();
  }, [pagination.current, pagination.pageSize, searchTerm, categoryFilter]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const response = await medicineService.getMedicines({
        page: pagination.current,
        limit: pagination.pageSize,
        category: categoryFilter || undefined,
        search: searchTerm.trim() || undefined
      });

      // Response structure: { success, data, total, page, limit, totalPages }
      setMedicines(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
        current: response.page || prev.current
      }));
    } catch (error) {
      toast.error('Lỗi khi tải danh sách thuốc: ' + (error.response?.data?.message || error.message));
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMedicine = () => {
    setEditingMedicine(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditMedicine = (medicine) => {
    setEditingMedicine(medicine);
    form.setFieldsValue({
      name: medicine.name,
      unit: medicine.unit,
      category: medicine.category
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingMedicine) {
        // Update
        await medicineService.updateMedicine(editingMedicine._id, values);
        toast.success('Cập nhật thuốc thành công');
      } else {
        // Create
        await medicineService.createMedicine(values);
        toast.success('Tạo thuốc mới thành công');
      }
      
      setIsModalVisible(false);
      form.resetFields();
      fetchMedicines();
    } catch (error) {
      if (error.errorFields) {
        toast.error('Vui lòng kiểm tra lại thông tin');
      } else {
        toast.error('Lỗi: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingMedicine(null);
  };

  const handleToggleStatus = async (medicine) => {
    try {
      setToggleLoadingMap(prev => ({ ...prev, [medicine._id]: true }));
      
      await medicineService.toggleMedicineStatus(medicine._id);
      toast.success(`Đã ${medicine.isActive ? 'vô hiệu hóa' : 'kích hoạt'} thuốc "${medicine.name}"`);
      
      fetchMedicines();
    } catch (error) {
      toast.error('Lỗi khi thay đổi trạng thái: ' + (error.response?.data?.message || error.message));
    } finally {
      setToggleLoadingMap(prev => ({ ...prev, [medicine._id]: false }));
    }
  };

  const handleDeleteMedicine = async (medicine) => {
    Modal.confirm({
      title: 'Xác nhận xóa thuốc',
      content: `Bạn có chắc chắn muốn xóa thuốc "${medicine.name}"? Hành động này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await medicineService.deleteMedicine(medicine._id);
          toast.success(`Đã xóa thuốc "${medicine.name}" thành công`);
          fetchMedicines();
        } catch (error) {
          toast.error('Lỗi khi xóa thuốc: ' + (error.response?.data?.message || error.message));
        }
      }
    });
  };

  const columns = [
    {
      title: 'Tên thuốc',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 300,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 100
    },
    {
      title: 'Phân loại',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category) => {
        const categoryColors = {
          'thuốc giảm đau': 'blue',
          'kháng sinh': 'red',
          'thuốc bôi': 'green',
          'thuốc súc miệng': 'cyan',
          'vitamin': 'orange',
          'khác': 'default'
        };
        return <Tag color={categoryColors[category] || 'default'}>{category}</Tag>;
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      align: 'center',
      render: (isActive, record) => 
        isManagerOrAdmin ? (
          <Switch
            checked={isActive}
            loading={toggleLoadingMap[record._id]}
            onChange={() => handleToggleStatus(record)}
            checkedChildren="Hoạt động"
            unCheckedChildren="Ngưng"
          />
        ) : (
          <Tag color={isActive ? 'green' : 'red'}>
            {isActive ? 'Hoạt động' : 'Ngưng'}
          </Tag>
        )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 150,
      align: 'center',
      render: (_, record) => 
        isManagerOrAdmin ? (
          <Space size="small">
            <Tooltip title="Chỉnh sửa">
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEditMedicine(record)}
              />
            </Tooltip>
            <Tooltip title="Xóa">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteMedicine(record)}
              />
            </Tooltip>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <MedicineBoxOutlined style={{ marginRight: 8 }} />
              Danh mục thuốc (Kê đơn)
            </Title>
            <Text type="secondary">
              Danh sách thuốc để kê đơn cho bệnh nhân
            </Text>
          </Col>
          {isManagerOrAdmin && (
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateMedicine}
                size="large"
              >
                Thêm thuốc mới
              </Button>
            </Col>
          )}
        </Row>

        <Divider />

        {/* Search & Filter */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm thuốc..."
              prefix={<SearchOutlined />}
              allowClear
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Lọc theo phân loại"
              allowClear
              style={{ width: '100%' }}
              value={categoryFilter || undefined}
              onChange={(value) => {
                setCategoryFilter(value || '');
                setPagination(prev => ({ ...prev, current: 1 })); // Reset to page 1
              }}
            >
              {categories.map(cat => (
                <Select.Option key={cat.value} value={cat.value}>
                  {cat.label}
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={medicines}
          loading={loading}
          rowKey="_id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} thuốc`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }));
            }
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingMedicine ? 'Chỉnh sửa thuốc' : 'Thêm thuốc mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        okText={editingMedicine ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        centered
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            category: 'khác',
            unit: 'viên'
          }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="name"
                label="Tên thuốc"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên thuốc' },
                  { max: 200, message: 'Tên thuốc không quá 200 ký tự' }
                ]}
              >
                <Input placeholder="Ví dụ: Amoxicillin 500mg" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="unit"
                label="Đơn vị"
                rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}
              >
                <Select placeholder="Chọn đơn vị">
                  <Select.Option value="viên">Viên</Select.Option>
                  <Select.Option value="vỉ">Vỉ</Select.Option>
                  <Select.Option value="hộp">Hộp</Select.Option>
                  <Select.Option value="ống">Ống</Select.Option>
                  <Select.Option value="lọ">Lọ</Select.Option>
                  <Select.Option value="gói">Gói</Select.Option>
                  <Select.Option value="tuýp">Tuýp</Select.Option>
                  <Select.Option value="chai">Chai</Select.Option>
                  <Select.Option value="kg">Kg</Select.Option>
                  <Select.Option value="g">G</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="category"
                label="Phân loại"
                rules={[{ required: true, message: 'Vui lòng chọn phân loại' }]}
              >
                <Select placeholder="Chọn phân loại">
                  {categories.map(cat => (
                    <Select.Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MedicineList;

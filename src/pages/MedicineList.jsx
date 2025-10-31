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
  Tabs,
  Divider,
  Badge
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
import { searchAndFilter, debounce } from '../utils/searchUtils';

const { Title, Text } = Typography;
const { TextArea } = Input;

const MedicineList = () => {
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
  const [activeTab, setActiveTab] = useState('active'); // 'active' hoặc 'inactive'
  const [categoryFilter, setCategoryFilter] = useState('');

  // Toggle loading map
  const [toggleLoadingMap, setToggleLoadingMap] = useState({});

  // Medicine categories - matching backend enum
  const categories = [
    { value: 'thuốc giảm đau', label: 'Thuốc giảm đau' },
    { value: 'kháng sinh', label: 'Kháng sinh' },
    { value: 'thuốc bôi', label: 'Thuốc bôi' },
    { value: 'thuốc súc miệng', label: 'Thuốc súc miệng' },
    { value: 'vitamin', label: 'Vitamin' },
    { value: 'khác', label: 'Khác' }
  ];

  // Filtered data
  const filteredMedicines = useMemo(() => {
    const searchFields = ['name', 'ingredient', 'dosage', 'description'];
    const filters = {};

    if (activeTab === 'active') {
      filters.isActive = true;
    } else if (activeTab === 'inactive') {
      filters.isActive = false;
    }

    if (categoryFilter !== '') {
      filters.category = categoryFilter;
    }

    return searchAndFilter(medicines, searchTerm, searchFields, filters);
  }, [medicines, searchTerm, activeTab, categoryFilter]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((term) => {
      setSearchTerm(term);
      if (!term) {
        setPagination(prev => ({ ...prev, current: 1 }));
      }
    }, 300),
    []
  );

  useEffect(() => {
    fetchMedicines();
  }, [pagination.current, pagination.pageSize, searchTerm, activeTab, categoryFilter]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const shouldFetchAll = searchTerm.trim() !== '' || activeTab !== 'active' || categoryFilter !== '';
      
      const response = await medicineService.getMedicines({
        page: shouldFetchAll ? 1 : pagination.current,
        limit: shouldFetchAll ? 9999 : pagination.pageSize,
        isActive: activeTab === 'active' ? true : activeTab === 'inactive' ? false : undefined,
        category: categoryFilter || undefined,
        search: searchTerm || undefined
      });

      setMedicines(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0
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
      ingredient: medicine.ingredient,
      dosage: medicine.dosage,
      category: medicine.category,
      description: medicine.description,
      instructions: medicine.instructions,
      contraindications: medicine.contraindications,
      sideEffects: medicine.sideEffects
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

  // Statistics
  const stats = useMemo(() => {
    const active = medicines.filter(m => m.isActive).length;
    const inactive = medicines.filter(m => !m.isActive).length;
    return { active, inactive, total: medicines.length };
  }, [medicines]);

  const columns = [
    {
      title: 'Tên thuốc',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 200,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.ingredient && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.ingredient}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Liều dùng',
      dataIndex: 'dosage',
      key: 'dosage',
      width: 150
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
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: {
        showTitle: false
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          {text || '-'}
        </Tooltip>
      )
    },
    {
      title: 'Hướng dẫn sử dụng',
      dataIndex: 'instructions',
      key: 'instructions',
      width: 200,
      ellipsis: {
        showTitle: false
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          {text || '-'}
        </Tooltip>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      align: 'center',
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          loading={toggleLoadingMap[record._id]}
          onChange={() => handleToggleStatus(record)}
          checkedChildren="Hoạt động"
          unCheckedChildren="Ngưng"
        />
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 150,
      align: 'center',
      render: (_, record) => (
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
              Quản lý danh mục thuốc (Kê đơn)
            </Title>
            <Text type="secondary">
              Quản lý danh mục thuốc để kê đơn cho bệnh nhân
            </Text>
          </Col>
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
        </Row>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card size="small">
              <Badge status="success" text={`Đang hoạt động: ${stats.active}`} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Badge status="error" text={`Ngưng sử dụng: ${stats.inactive}`} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Badge status="processing" text={`Tổng số: ${stats.total}`} />
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Search & Filter */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm thuốc..."
              prefix={<SearchOutlined />}
              allowClear
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Lọc theo phân loại"
              allowClear
              style={{ width: '100%' }}
              value={categoryFilter || undefined}
              onChange={setCategoryFilter}
            >
              {categories.map(cat => (
                <Select.Option key={cat.value} value={cat.value}>
                  {cat.label}
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* Tabs for Active/Inactive */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'active',
              label: (
                <span>
                  <Badge status="success" />
                  Đang hoạt động ({stats.active})
                </span>
              )
            },
            {
              key: 'inactive',
              label: (
                <span>
                  <Badge status="error" />
                  Ngưng sử dụng ({stats.inactive})
                </span>
              )
            },
            {
              key: 'all',
              label: (
                <span>
                  <Badge status="processing" />
                  Tất cả ({stats.total})
                </span>
              )
            }
          ]}
        />

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredMedicines}
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
        width={800}
        okText={editingMedicine ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            category: 'khác',
            isActive: true
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
                name="ingredient"
                label="Thành phần hoạt chất"
              >
                <Input placeholder="Ví dụ: Amoxicillin trihydrate" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="dosage"
                label="Liều dùng"
                rules={[{ required: true, message: 'Vui lòng nhập liều dùng' }]}
              >
                <Input placeholder="Ví dụ: 500mg" />
              </Form.Item>
            </Col>

            <Col span={24}>
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

            <Col span={24}>
              <Form.Item
                name="description"
                label="Mô tả"
              >
                <TextArea
                  rows={2}
                  placeholder="Mô tả ngắn gọn về thuốc"
                  maxLength={1000}
                  showCount
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="instructions"
                label="Hướng dẫn sử dụng"
              >
                <TextArea
                  rows={3}
                  placeholder="Hướng dẫn cách sử dụng thuốc"
                  maxLength={1000}
                  showCount
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="contraindications"
                label="Chống chỉ định"
              >
                <TextArea
                  rows={2}
                  placeholder="Các trường hợp không nên sử dụng thuốc này"
                  maxLength={1000}
                  showCount
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="sideEffects"
                label="Tác dụng phụ"
              >
                <TextArea
                  rows={2}
                  placeholder="Các tác dụng phụ có thể xảy ra"
                  maxLength={1000}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MedicineList;

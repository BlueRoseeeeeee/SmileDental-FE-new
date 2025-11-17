/**
 * Additional Services Manager Component
 * 
 * Component to manage additional services in a medical record
 * Features:
 * - Display list of additional services
 * - Add new service (with service/serviceAddOn selection)
 * - Update service quantity/notes
 * - Remove service
 * - Auto-calculate total cost
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Select,
  Input,
  InputNumber,
  message,
  Space,
  Popconfirm,
  Tag,
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined
} from '@ant-design/icons';
import recordService from '../../services/recordService';
import { servicesService } from '../../services/servicesService';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const AdditionalServicesManager = ({ recordId, record, onUpdate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  
  // Data
  const [services, setServices] = useState([]);
  const [serviceAddOns, setServiceAddOns] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [loadingAddOns, setLoadingAddOns] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  // 🆕 Debug: Watch serviceAddOns state changes
  useEffect(() => {
    console.log('🔔 [AdditionalServicesManager] serviceAddOns state changed:', serviceAddOns.length, 'items');
    console.log('📦 [AdditionalServicesManager] Current serviceAddOns:', serviceAddOns);
  }, [serviceAddOns]);

  // 🆕 Debug: Watch selectedServiceId changes
  useEffect(() => {
    console.log('🔔 [AdditionalServicesManager] selectedServiceId changed:', selectedServiceId);
  }, [selectedServiceId]);

  const loadServices = async () => {
    try {
      const response = await servicesService.getAllServices();
      console.log('🔵 [AdditionalServicesManager] getAllServices response:', response);
      if (response.services) {
        console.log('✅ [AdditionalServicesManager] Services loaded:', response.services.length, 'services');
        console.log('🔍 [AdditionalServicesManager] First service:', response.services[0]);
        setServices(response.services);
      }
    } catch (error) {
      console.error('[AdditionalServicesManager] Load services error:', error);
      message.error('Không thể tải danh sách dịch vụ');
    }
  };

  const loadServiceAddOns = async (serviceId) => {
    try {
      setLoadingAddOns(true);
      
      // 🆕 First, try to get serviceAddOns from already loaded services
      const selectedService = services.find(s => s._id === serviceId);
      console.log('🔍 [AdditionalServicesManager] Selected service:', selectedService);
      
      if (selectedService && selectedService.serviceAddOns) {
        console.log('🔍 [AdditionalServicesManager] All serviceAddOns from cache:', selectedService.serviceAddOns);
        const activeAddOns = selectedService.serviceAddOns.filter(addon => {
          console.log('  - [AdditionalServicesManager] AddOn:', addon.name, 'isActive:', addon.isActive);
          return addon.isActive !== false; // Include if isActive is true or undefined
        });
        console.log('✅ [AdditionalServicesManager] Using cached serviceAddOns:', activeAddOns.length, 'active addons');
        console.log('📝 [AdditionalServicesManager] Active addOns:', activeAddOns);
        setServiceAddOns(activeAddOns);
        setLoadingAddOns(false);
        return;
      }
      
      // If not available, fetch from API
      console.log('🔄 [AdditionalServicesManager] Fetching serviceAddOns from API for', serviceId);
      const response = await servicesService.getServiceById(serviceId);
      console.log('🔵 [AdditionalServicesManager] getServiceById response:', response);
      if (response.success && response.data && response.data.serviceAddOns) {
        console.log('🔍 [AdditionalServicesManager] All serviceAddOns from API:', response.data.serviceAddOns);
        const activeAddOns = response.data.serviceAddOns.filter(addon => {
          console.log('  - [AdditionalServicesManager] AddOn:', addon.name, 'isActive:', addon.isActive);
          return addon.isActive !== false;
        });
        console.log('✅ [AdditionalServicesManager] ServiceAddOns loaded from API:', activeAddOns.length, 'active addons');
        setServiceAddOns(activeAddOns);
      } else {
        console.log('⚠️ [AdditionalServicesManager] No serviceAddOns found or invalid response');
        setServiceAddOns([]);
      }
    } catch (error) {
      console.error('[AdditionalServicesManager] Load service addons error:', error);
      message.error('Không thể tải danh sách dịch vụ con');
      setServiceAddOns([]);
    } finally {
      setLoadingAddOns(false);
    }
  };

  const handleServiceChange = (serviceId) => {
    console.log('🎯 [AdditionalServicesManager] handleServiceChange called with serviceId:', serviceId);
    setSelectedServiceId(serviceId);
    form.setFieldValue('serviceAddOnId', null);
    if (serviceId) {
      loadServiceAddOns(serviceId);
    } else {
      setServiceAddOns([]);
    }
  };

  const handleAdd = () => {
    setEditingService(null);
    form.resetFields();
    setSelectedServiceId(null);
    setServiceAddOns([]);
    setShowModal(true);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    form.setFieldsValue({
      quantity: service.quantity,
      notes: service.notes
    });
    setShowModal(true);
  };

  const handleDelete = async (serviceItemId) => {
    try {
      setLoading(true);
      const response = await recordService.removeAdditionalService(recordId, serviceItemId);
      if (response.success) {
        message.success('Đã xóa dịch vụ');
        if (onUpdate) onUpdate(response.data);
      }
    } catch (error) {
      console.error('Remove service error:', error);
      message.error('Không thể xóa dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingService) {
        // Update existing service
        const response = await recordService.updateAdditionalService(
          recordId,
          editingService._id,
          {
            quantity: values.quantity,
            notes: values.notes
          }
        );
        if (response.success) {
          message.success('Đã cập nhật dịch vụ');
          if (onUpdate) onUpdate(response.data);
          setShowModal(false);
        }
      } else {
        // Add new service
        const selectedService = services.find(s => s._id === values.serviceId);
        const selectedAddOn = serviceAddOns.find(a => a._id === values.serviceAddOnId);
        
        let price = selectedService?.price || 0;
        let serviceName = selectedService?.name || '';
        let serviceAddOnName = null;
        
        if (selectedAddOn) {
          price = selectedAddOn.price;
          serviceAddOnName = selectedAddOn.name;
        }

        const serviceData = {
          serviceId: values.serviceId,
          serviceName: serviceName,
          serviceType: selectedService?.type || 'treatment',
          serviceAddOnId: values.serviceAddOnId || null,
          serviceAddOnName: serviceAddOnName,
          price: price,
          quantity: values.quantity || 1,
          notes: values.notes || ''
        };

        const response = await recordService.addAdditionalService(recordId, serviceData);
        if (response.success) {
          message.success('Đã thêm dịch vụ');
          if (onUpdate) onUpdate(response.data);
          setShowModal(false);
        }
      }
    } catch (error) {
      console.error('Submit service error:', error);
      if (error.errorFields) {
        message.error('Vui lòng điền đầy đủ thông tin');
      } else {
        message.error(error.message || 'Có lỗi xảy ra');
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Dịch vụ',
      dataIndex: 'serviceName',
      key: 'serviceName',
      render: (text, row) => (
        <div>
          <div><strong>{text}</strong></div>
          {row.serviceAddOnName && (
            <div style={{ fontSize: 12, color: '#666' }}>
              <Tag color="blue" size="small">{row.serviceAddOnName}</Tag>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Loại',
      dataIndex: 'serviceType',
      key: 'serviceType',
      width: 100,
      render: (type) => (
        <Tag color={type === 'exam' ? 'blue' : 'green'}>
          {type === 'exam' ? 'Khám' : 'Điều trị'}
        </Tag>
      )
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      align: 'right',
      render: (price) => `${price.toLocaleString('vi-VN')}đ`
    },
    {
      title: 'SL',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 60,
      align: 'center'
    },
    {
      title: 'Thành tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 130,
      align: 'right',
      render: (total) => (
        <Text strong style={{ color: '#faad14' }}>
          {total.toLocaleString('vi-VN')}đ
        </Text>
      )
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xóa dịch vụ này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const additionalServices = record?.additionalServices || [];
  const baseCost = (record?.servicePrice || 0) + (record?.serviceAddOnPrice || 0);
  const additionalCost = additionalServices.reduce((sum, svc) => sum + (svc.totalPrice || 0), 0);
  const totalCost = baseCost + additionalCost;

  return (
    <Card
      title={
        <Space>
          <DollarOutlined />
          <span>Dịch vụ bổ sung</span>
          <Tag color="blue">{additionalServices.length} dịch vụ</Tag>
        </Space>
      }
      extra={
        record?.status !== 'completed' && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="small"
          >
            Thêm dịch vụ
          </Button>
        )
      }
      size="small"
    >
      <Table
        columns={columns}
        dataSource={additionalServices}
        rowKey="_id"
        pagination={false}
        size="small"
        loading={loading}
        locale={{
          emptyText: 'Chưa có dịch vụ bổ sung'
        }}
      />

      {/* Summary */}
      <div style={{ 
        marginTop: 16, 
        padding: 12, 
        background: '#f5f5f5', 
        borderRadius: 4 
      }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>Dịch vụ ban đầu:</Text>
            <Text>{baseCost.toLocaleString('vi-VN')}đ</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>Dịch vụ bổ sung:</Text>
            <Text type="warning">+{additionalCost.toLocaleString('vi-VN')}đ</Text>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            paddingTop: 8, 
            borderTop: '1px solid #d9d9d9' 
          }}>
            <Text strong>Tổng chi phí:</Text>
            <Text strong style={{ fontSize: 16, color: '#faad14' }}>
              {totalCost.toLocaleString('vi-VN')}đ
            </Text>
          </div>
        </Space>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={editingService ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ bổ sung'}
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleSubmit}
        confirmLoading={loading}
        okText={editingService ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            quantity: 1
          }}
        >
          {!editingService && (
            <>
              <Form.Item
                name="serviceId"
                label="Dịch vụ"
                rules={[{ required: true, message: 'Vui lòng chọn dịch vụ' }]}
              >
                <Select
                  placeholder="Chọn dịch vụ"
                  showSearch
                  optionFilterProp="children"
                  onChange={handleServiceChange}
                >
                  {services.map(service => {
                    // Get min price from serviceAddOns
                    const minPrice = service.serviceAddOns && service.serviceAddOns.length > 0
                      ? Math.min(...service.serviceAddOns.map(a => a.price || 0))
                      : 0;
                    return (
                      <Option key={service._id} value={service._id}>
                        {service.name}{minPrice > 0 ? ` - Từ ${minPrice.toLocaleString('vi-VN')}đ` : ''}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>

              <Form.Item
                name="serviceAddOnId"
                label="Dịch vụ con (tùy chọn)"
              >
                <Select
                  placeholder={selectedServiceId ? "Chọn dịch vụ con (nếu có)" : "Chọn dịch vụ trước"}
                  disabled={!selectedServiceId || loadingAddOns}
                  loading={loadingAddOns}
                  allowClear
                  notFoundContent={loadingAddOns ? "Đang tải..." : "Không có dịch vụ con"}
                >
                  {(() => {
                    console.log('🎨 [AdditionalServicesManager] Rendering serviceAddOns dropdown');
                    console.log('🎨 [AdditionalServicesManager] selectedServiceId:', selectedServiceId);
                    console.log('🎨 [AdditionalServicesManager] serviceAddOns.length:', serviceAddOns.length);
                    console.log('🎨 [AdditionalServicesManager] serviceAddOns:', serviceAddOns);
                    return serviceAddOns.map(addOn => {
                      console.log('  🎯 [AdditionalServicesManager] Rendering option for:', addOn.name, addOn._id);
                      return (
                        <Option key={addOn._id} value={addOn._id}>
                          {addOn.name} - {addOn.price.toLocaleString('vi-VN')}đ
                        </Option>
                      );
                    });
                  })()}
                </Select>
              </Form.Item>
            </>
          )}

          {editingService && (
            <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
              <div><strong>Dịch vụ:</strong> {editingService.serviceName}</div>
              {editingService.serviceAddOnName && (
                <div><strong>Dịch vụ con:</strong> {editingService.serviceAddOnName}</div>
              )}
              <div><strong>Đơn giá:</strong> {editingService.price.toLocaleString('vi-VN')}đ</div>
            </Card>
          )}

          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng' },
              { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0' }
            ]}
          >
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              placeholder="Nhập số lượng"
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Ghi chú"
          >
            <TextArea
              rows={5}
              placeholder="Nhập ghi chú về dịch vụ này..."
              className='custom-textarea'
              maxLength={300}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AdditionalServicesManager;

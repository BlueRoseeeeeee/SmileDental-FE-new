import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  Card,
  Row,
  Col,
  Table,
  Divider,
  Typography,
  Statistic,
  message,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { createInvoice, updateInvoice } from '../../services/mockInvoiceService';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

// Mock data for selectors
const mockPatients = [
  { _id: 'pat_001', name: 'Nguyễn Văn A', phone: '0901234567', email: 'nguyenvana@gmail.com' },
  { _id: 'pat_002', name: 'Trần Thị B', phone: '0912345678', email: 'tranthib@gmail.com' },
  { _id: 'pat_003', name: 'Phạm Văn C', phone: '0923456789', email: 'phamvanc@gmail.com' }
];

const mockDentists = [
  { _id: 'den_001', name: 'BS. Trần Văn B', specialization: 'Phục hồi răng', licenseNumber: 'BYT-123456' },
  { _id: 'den_002', name: 'BS. Lê Văn C', specialization: 'Chỉnh nha', licenseNumber: 'BYT-789012' },
  { _id: 'den_003', name: 'BS. Nguyễn Thị D', specialization: 'Nha khoa tổng quát', licenseNumber: 'BYT-345678' }
];

const mockServices = [
  { _id: 'ser_001', name: 'Khám tổng quát', code: 'KTQ001', type: 'examination', category: 'preventive', price: 200000 },
  { _id: 'ser_002', name: 'Hàn răng composite', code: 'HR001', type: 'filling', category: 'restorative', price: 650000 },
  { _id: 'ser_003', name: 'Vệ sinh răng miệng', code: 'VSR001', type: 'cleaning', category: 'preventive', price: 300000 },
  { _id: 'ser_004', name: 'Chụp X-quang', code: 'XQ001', type: 'xray', category: 'diagnostic', price: 200000 },
  { _id: 'ser_005', name: 'Nhổ răng', code: 'NR001', type: 'extraction', category: 'surgical', price: 500000 },
  { _id: 'ser_006', name: 'Điều trị tủy', code: 'DTT001', type: 'root_canal', category: 'restorative', price: 1500000 },
  { _id: 'ser_007', name: 'Làm răng sứ', code: 'RS001', type: 'crown', category: 'cosmetic', price: 3000000 },
  { _id: 'ser_008', name: 'Niềng răng', code: 'NR002', type: 'orthodontic', category: 'orthodontic', price: 15000000 },
  { _id: 'ser_009', name: 'Tẩy trắng răng', code: 'TTR001', type: 'whitening', category: 'cosmetic', price: 2000000 }
];

const InvoiceFormModal = ({ visible, mode, invoice, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [serviceItems, setServiceItems] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDentist, setSelectedDentist] = useState(null);

  // Financial calculations
  const [financials, setFinancials] = useState({
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 0
  });

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && invoice) {
        // Load invoice data for editing
        loadInvoiceData(invoice);
      } else {
        // Reset form for creation
        form.resetFields();
        setServiceItems([]);
        setSelectedPatient(null);
        setSelectedDentist(null);
        setFinancials({
          subtotal: 0,
          discountAmount: 0,
          taxAmount: 0,
          totalAmount: 0
        });
      }
    }
  }, [visible, mode, invoice, form]);

  // Recalculate when items or discount/tax change
  useEffect(() => {
    calculateFinancials();
  }, [serviceItems, form.getFieldValue('discountType'), form.getFieldValue('discountValue'), form.getFieldValue('taxRate'), form.getFieldValue('taxIncluded')]);

  const loadInvoiceData = (invoiceData) => {
    const patient = mockPatients.find(p => p._id === invoiceData.patientId);
    const dentist = mockDentists.find(d => d.name === invoiceData.dentistInfo.name);

    setSelectedPatient(patient);
    setSelectedDentist(dentist);
    setServiceItems(invoiceData.details || []);

    form.setFieldsValue({
      patientId: invoiceData.patientId,
      dentistId: dentist?._id,
      type: invoiceData.type,
      status: invoiceData.status,
      issueDate: dayjs(invoiceData.issueDate),
      dueDate: dayjs(invoiceData.dueDate),
      discountType: invoiceData.discountInfo?.type || 'none',
      discountValue: invoiceData.discountInfo?.value || 0,
      discountReason: invoiceData.discountInfo?.reason || '',
      taxRate: invoiceData.taxInfo?.taxRate || 10,
      taxIncluded: invoiceData.taxInfo?.taxIncluded !== false,
      description: invoiceData.description || '',
      notes: invoiceData.notes || '',
      internalNotes: invoiceData.internalNotes || ''
    });
  };

  const calculateFinancials = () => {
    // Calculate subtotal from items
    const subtotal = serviceItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    // Get discount info
    const discountType = form.getFieldValue('discountType') || 'none';
    const discountValue = form.getFieldValue('discountValue') || 0;

    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * discountValue) / 100;
    } else if (discountType === 'fixed_amount') {
      discountAmount = discountValue;
    }

    // Calculate after discount
    const afterDiscount = subtotal - discountAmount;

    // Get tax info
    const taxRate = form.getFieldValue('taxRate') || 10;
    const taxIncluded = form.getFieldValue('taxIncluded') !== false;

    let taxAmount = 0;
    if (!taxIncluded) {
      taxAmount = (afterDiscount * taxRate) / 100;
    }

    const totalAmount = afterDiscount + taxAmount;

    setFinancials({
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount
    });
  };

  const handlePatientChange = (patientId) => {
    const patient = mockPatients.find(p => p._id === patientId);
    setSelectedPatient(patient);
  };

  const handleDentistChange = (dentistId) => {
    const dentist = mockDentists.find(d => d._id === dentistId);
    setSelectedDentist(dentist);
  };

  const handleAddService = () => {
    setServiceItems([
      ...serviceItems,
      {
        _id: `temp_${Date.now()}`,
        serviceId: undefined,
        serviceInfo: {},
        unitPrice: 0,
        quantity: 1,
        discountAmount: 0,
        subtotal: 0,
        totalPrice: 0
      }
    ]);
  };

  const handleRemoveService = (index) => {
    const newItems = [...serviceItems];
    newItems.splice(index, 1);
    setServiceItems(newItems);
  };

  const handleServiceChange = (index, serviceId) => {
    const service = mockServices.find(s => s._id === serviceId);
    if (service) {
      const newItems = [...serviceItems];
      newItems[index] = {
        ...newItems[index],
        serviceId: service._id,
        serviceInfo: {
          name: service.name,
          code: service.code,
          type: service.type,
          category: service.category
        },
        unitPrice: service.price,
        quantity: newItems[index].quantity || 1,
        subtotal: service.price * (newItems[index].quantity || 1),
        totalPrice: service.price * (newItems[index].quantity || 1)
      };
      setServiceItems(newItems);
    }
  };

  const handleQuantityChange = (index, quantity) => {
    const newItems = [...serviceItems];
    const item = newItems[index];
    const subtotal = item.unitPrice * quantity;
    const totalPrice = subtotal - (item.discountAmount || 0);
    
    newItems[index] = {
      ...item,
      quantity,
      subtotal,
      totalPrice
    };
    setServiceItems(newItems);
  };

  const handleItemDiscountChange = (index, discountAmount) => {
    const newItems = [...serviceItems];
    const item = newItems[index];
    const totalPrice = item.subtotal - discountAmount;
    
    newItems[index] = {
      ...item,
      discountAmount,
      totalPrice
    };
    setServiceItems(newItems);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();

      if (serviceItems.length === 0) {
        message.error('Vui lòng thêm ít nhất một dịch vụ');
        return;
      }

      if (!selectedPatient || !selectedDentist) {
        message.error('Vui lòng chọn bệnh nhân và Nha sĩ');
        return;
      }

      setLoading(true);

      const values = form.getFieldsValue();

      const invoiceData = {
        type: values.type,
        status: values.status || 'draft',
        patientId: values.patientId,
        patientInfo: {
          name: selectedPatient.name,
          phone: selectedPatient.phone,
          email: selectedPatient.email
        },
        dentistInfo: {
          name: selectedDentist.name,
          specialization: selectedDentist.specialization,
          licenseNumber: selectedDentist.licenseNumber
        },
        issueDate: values.issueDate?.toDate() || new Date(),
        dueDate: values.dueDate?.toDate() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        details: serviceItems,
        discountInfo: {
          type: values.discountType || 'none',
          value: values.discountValue || 0,
          reason: values.discountReason || ''
        },
        taxInfo: {
          taxRate: values.taxRate || 10,
          taxIncluded: values.taxIncluded !== false
        },
        description: values.description || '',
        notes: values.notes || '',
        internalNotes: values.internalNotes || '',
        createdBy: 'user_001',
        createdByRole: 'receptionist'
      };

      let result;
      if (mode === 'edit') {
        result = await updateInvoice(invoice._id, invoiceData);
      } else {
        result = await createInvoice(invoiceData);
      }

      if (result.success) {
        message.success(mode === 'edit' ? 'Cập nhật hóa đơn thành công!' : 'Tạo hóa đơn thành công!');
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting invoice:', error);
      message.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const serviceColumns = [
    {
      title: 'Dịch vụ',
      dataIndex: 'serviceId',
      key: 'service',
      width: '30%',
      render: (value, record, index) => (
        <Select
          placeholder="Chọn dịch vụ"
          value={value}
          onChange={(serviceId) => handleServiceChange(index, serviceId)}
          style={{ width: '100%' }}
          showSearch
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          {mockServices.map(service => (
            <Option key={service._id} value={service._id}>
              {service.name} - {formatCurrency(service.price)}
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: '20%',
      align: 'right',
      render: (value) => formatCurrency(value)
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: '15%',
      render: (value, record, index) => (
        <InputNumber
          min={1}
          max={100}
          value={value}
          onChange={(quantity) => handleQuantityChange(index, quantity)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Giảm giá',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      width: '20%',
      render: (value, record, index) => (
        <InputNumber
          min={0}
          max={record.subtotal}
          value={value}
          onChange={(discount) => handleItemDiscountChange(index, discount)}
          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\$\s?|(,*)/g, '')}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Thành tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: '20%',
      align: 'right',
      render: (value) => (
        <Text strong style={{ color: '#1890ff' }}>
          {formatCurrency(value)}
        </Text>
      )
    },
    {
      title: '',
      key: 'actions',
      width: '5%',
      render: (_, record, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveService(index)}
        />
      )
    }
  ];

  return (
    <Modal
      title={mode === 'edit' ? 'Chỉnh sửa hóa đơn' : 'Tạo hóa đơn mới'}
      open={visible}
      onCancel={onCancel}
      width={1200}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          {mode === 'edit' ? 'Cập nhật' : 'Tạo hóa đơn'}
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: 'appointment',
          status: 'draft',
          issueDate: dayjs(),
          dueDate: dayjs().add(7, 'day'),
          discountType: 'none',
          discountValue: 0,
          taxRate: 10,
          taxIncluded: true
        }}
      >
        {/* Basic Information */}
        <Card title="Thông tin cơ bản" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Bệnh nhân"
                name="patientId"
                rules={[{ required: true, message: 'Vui lòng chọn bệnh nhân' }]}
              >
                <Select
                  placeholder="Chọn bệnh nhân"
                  showSearch
                  onChange={handlePatientChange}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {mockPatients.map(patient => (
                    <Option key={patient._id} value={patient._id}>
                      {patient.name} - {patient.phone}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Nha sĩ điều trị"
                name="dentistId"
                rules={[{ required: true, message: 'Vui lòng chọn Nha sĩ' }]}
              >
                <Select
                  placeholder="Chọn Nha sĩ"
                  showSearch
                  onChange={handleDentistChange}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {mockDentists.map(dentist => (
                    <Option key={dentist._id} value={dentist._id}>
                      {dentist.name} - {dentist.specialization}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Loại hóa đơn"
                name="type"
                rules={[{ required: true, message: 'Vui lòng chọn loại hóa đơn' }]}
              >
                <Select placeholder="Chọn loại">
                  <Option value="appointment">Cuộc hẹn</Option>
                  <Option value="treatment">Điều trị</Option>
                  <Option value="consultation">Tư vấn</Option>
                  <Option value="emergency">Cấp cứu</Option>
                  <Option value="checkup">Kiểm tra</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Trạng thái"
                name="status"
              >
                <Select placeholder="Chọn trạng thái">
                  <Option value="draft">Nháp</Option>
                  <Option value="pending">Chờ thanh toán</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Ngày tạo"
                name="issueDate"
                rules={[{ required: true, message: 'Vui lòng chọn ngày tạo' }]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Hạn thanh toán"
                name="dueDate"
                rules={[{ required: true, message: 'Vui lòng chọn hạn thanh toán' }]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Service Items */}
        <Card
          title="Dịch vụ"
          style={{ marginBottom: 16 }}
          extra={
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddService}
            >
              Thêm dịch vụ
            </Button>
          }
        >
          <Table
            dataSource={serviceItems}
            columns={serviceColumns}
            rowKey="_id"
            pagination={false}
            locale={{ emptyText: 'Chưa có dịch vụ nào' }}
          />
        </Card>

        {/* Discount & Tax */}
        <Card title="Giảm giá & Thuế" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Loại giảm giá" name="discountType">
                <Select>
                  <Option value="none">Không giảm giá</Option>
                  <Option value="percentage">Phần trăm (%)</Option>
                  <Option value="fixed_amount">Số tiền cố định</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Giá trị giảm" name="discountValue">
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  disabled={form.getFieldValue('discountType') === 'none'}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Lý do giảm giá" name="discountReason">
                <Input placeholder="VD: Khách hàng thân thiết" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Thuế VAT (%)" name="taxRate">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Thuế đã bao gồm" name="taxIncluded" valuePropName="checked">
                <Select>
                  <Option value={true}>Đã bao gồm thuế</Option>
                  <Option value={false}>Chưa bao gồm thuế</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Financial Summary */}
        <Card title="Tổng kết tài chính" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Tạm tính"
                value={financials.subtotal}
                formatter={(value) => formatCurrency(value)}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Giảm giá"
                value={financials.discountAmount}
                valueStyle={{ color: '#ff4d4f' }}
                formatter={(value) => `- ${formatCurrency(value)}`}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Thuế VAT"
                value={financials.taxAmount}
                formatter={(value) => formatCurrency(value)}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Tổng cộng"
                value={financials.totalAmount}
                valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
                formatter={(value) => formatCurrency(value)}
              />
            </Col>
          </Row>
        </Card>

        {/* Notes */}
        <Card title="Ghi chú">
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={2} placeholder="Mô tả ngắn gọn về hóa đơn..." maxLength={500} />
          </Form.Item>
          <Form.Item label="Ghi chú (hiển thị cho khách)" name="notes">
            <TextArea rows={2} placeholder="Ghi chú cho bệnh nhân..." maxLength={500} />
          </Form.Item>
          <Form.Item
            label={
              <Space>
                Ghi chú nội bộ
                <Tooltip title="Chỉ hiển thị cho nhân viên">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            name="internalNotes"
          >
            <TextArea rows={2} placeholder="Ghi chú nội bộ..." maxLength={500} />
          </Form.Item>
        </Card>
      </Form>
    </Modal>
  );
};

export default InvoiceFormModal;

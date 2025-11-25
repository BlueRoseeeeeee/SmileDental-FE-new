/**
 * Prescription Form Component
 * 
 * Form for adding/editing prescription in medical record
 * Features:
 * - Add/remove medicine rows
 * - Medicine selector with autocomplete
 * - Dosage, duration, quantity inputs
 * - Notes for each medicine
 * - Save prescription to record
 */

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  Card,
  Row,
  Col,
  message,
  Typography,
  Divider,
  Tag,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  MedicineBoxOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const PrescriptionForm = forwardRef(({ prescription, medicines }, ref) => {
  const [form] = Form.useForm();
  const [medicineList, setMedicineList] = useState([]);

  useEffect(() => {
    // Initialize medicine list
    if (medicines && medicines.length > 0) {
      setMedicineList(medicines);
    }

    // Populate form if prescription exists
    if (prescription && prescription.medicines) {
      form.setFieldsValue({
        medicines: prescription.medicines.map(med => ({
          medicineId: med.medicineId,
          medicineName: med.medicineName,
          unit: med.unit,
          category: med.category,
          dosageInstruction: med.dosageInstruction,
          duration: med.duration,
          quantity: med.quantity,
          note: med.note
        })),
        prescriptionNotes: prescription.notes || ''
      });
    }
  }, [prescription, medicines]);

  // Expose getPrescriptionData method to parent component
  useImperativeHandle(ref, () => ({
    getPrescriptionData: async () => {
      try {
        const values = await form.validateFields();
        
        // ✅ Validate: Check for duplicate medicines
        const medicineIds = values.medicines.map(m => m.medicineId);
        const uniqueMedicineIds = new Set(medicineIds);
        if (medicineIds.length !== uniqueMedicineIds.size) {
          throw new Error('Không được chọn thuốc trùng lặp trong đơn thuốc');
        }

        // Build medicines array
        const prescriptionMedicines = values.medicines.map(med => {
          const medicine = medicineList.find(m => m._id === med.medicineId);
          return {
            medicineId: med.medicineId,
            medicineName: medicine?.name || med.medicineName,
            unit: medicine?.unit || med.unit,
            category: medicine?.category || med.category,
            dosageInstruction: med.dosageInstruction,
            duration: med.duration,
            quantity: med.quantity,
            note: med.note || ''
          };
        });

        // Create prescription data
        return {
          medicines: prescriptionMedicines,
          notes: values.prescriptionNotes || ''
        };
      } catch (error) {
        console.error('❌ Get prescription data error:', error);
        throw error;
      }
    }
  }));

  // Handle medicine selection
  const handleMedicineSelect = (medicineId, fieldName) => {
    const medicine = medicineList.find(m => m._id === medicineId);
    
    if (medicine) {
      const medicines = form.getFieldValue('medicines');
      medicines[fieldName].medicineName = medicine.name;
      medicines[fieldName].unit = medicine.unit;
      medicines[fieldName].category = medicine.category;
      
      form.setFieldsValue({ medicines });
      console.log('✅ Selected medicine:', medicine.name, '- Unit:', medicine.unit, '- Category:', medicine.category);
    }
  };
  
  // Get category color
  const getCategoryColor = (category) => {
    const categoryColors = {
      'thuốc giảm đau': 'orange',
      'kháng sinh': 'red',
      'thuốc bôi': 'green',
      'thuốc súc miệng': 'cyan',
      'vitamin': 'purple',
      'khác': 'default'
    };
    return categoryColors[category] || 'default';
  };

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          medicines: [{}], // Start with one empty medicine row
          prescriptionNotes: ''
        }}
      >
        {/* Medicine List */}
        <Form.List name="medicines">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <Card
                  key={key}
                  size="small"
                  style={{ marginBottom: 12, background: '#fafafa' }}
                  title={
                    <Space>
                      <MedicineBoxOutlined />
                      <Text strong>Thuốc {index + 1}</Text>
                    </Space>
                  }
                  extra={
                    fields.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      >
                        Xóa
                      </Button>
                    )
                  }
                >
                  <Row gutter={[12, 0]}>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'medicineId']}
                        label={
                          <Space>
                            <span>Tên thuốc</span>
                            <Tooltip title="Tìm kiếm theo tên thuốc hoặc thành phần">
                              <InfoCircleOutlined style={{ color: '#1890ff' }} />
                            </Tooltip>
                          </Space>
                        }
                      >
                        <Select
                          showSearch
                          placeholder="Tìm và chọn thuốc"
                          optionFilterProp="label"
                          filterOption={(input, option) => {
                            const searchText = input.toLowerCase();
                            const medicine = medicineList.find(m => m._id === option.value);
                            if (!medicine) return false;
                            
                            return (
                              medicine.name.toLowerCase().includes(searchText) ||
                              (medicine.category && medicine.category.toLowerCase().includes(searchText))
                            );
                          }}
                          onChange={(value) => handleMedicineSelect(value, name)}
                        >
                          {medicineList.map(medicine => {
                            const tooltipContent = (
                              <div style={{ maxWidth: 300 }}>
                                <div><strong>{medicine.name}</strong></div>
                                <div>Đơn vị: {medicine.unit}</div>
                                <div>Phân loại: {medicine.category}</div>
                              </div>
                            );
                            
                            return (
                              <Option 
                                key={medicine._id} 
                                value={medicine._id}
                                label={`${medicine.name} (${medicine.unit})`}
                              >
                                <Tooltip title={tooltipContent} placement="right">
                                  <Space>
                                    <span>{medicine.name}</span>
                                    <Text type="secondary">- {medicine.unit}</Text>
                                    {medicine.category && (
                                      <Tag color={getCategoryColor(medicine.category)} style={{ fontSize: 11 }}>
                                        {medicine.category}
                                      </Tag>
                                    )}
                                  </Space>
                                </Tooltip>
                              </Option>
                            );
                          })}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'dosageInstruction']}
                        label={
                          <Space>
                            <span>Cách dùng</span>
                            <Tooltip title="Cách dùng và số lần dùng trong ngày">
                              <InfoCircleOutlined style={{ color: '#1890ff' }} />
                            </Tooltip>
                          </Space>
                        }
                      >
                        <Input placeholder="VD: 1 viên x 3 lần/ngày sau ăn" />
                      </Form.Item>
                    </Col>

                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'duration']}
                        label="Thời gian dùng"
                      >
                        <Input placeholder="VD: 5 ngày" />
                      </Form.Item>
                    </Col>

                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        label="Số lượng"
                      >
                        <InputNumber
                          min={1}
                          placeholder="Số lượng"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'note']}
                        label="Ghi chú"
                      >
                        <Input placeholder="VD: Uống sau ăn" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}

              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                style={{ marginBottom: 16 }}
              >
                Thêm thuốc
              </Button>
            </>
          )}
        </Form.List>

        <Divider />

        {/* Prescription Notes */}
        <Form.Item
          name="prescriptionNotes"
          label="Ghi chú đơn thuốc"
        >
          <TextArea
            rows={5}
            placeholder="Nhập ghi chú chung về đơn thuốc (lưu ý khi dùng thuốc, kiêng kị, v.v.)..."
            maxLength={500}
            showCount
            className="custom-textarea"
          />
        </Form.Item>
      </Form>

      {/* Prescription Preview */}
      {prescription && prescription.medicines && prescription.medicines.length > 0 && (
        <Card
          title="Đơn thuốc hiện tại"
          size="small"
          style={{ marginTop: 16, background: '#e6f7ff' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {prescription.medicines.map((med, index) => (
              <div key={index}>
                <Tag color="blue">{index + 1}</Tag>
                <Text strong>{med.medicineName}</Text>
                {med.unit && <Text type="secondary"> ({med.unit})</Text>}
                {med.category && <Tag color={getCategoryColor(med.category)} style={{ marginLeft: 8 }}>{med.category}</Tag>}
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  • Cách dùng: {med.dosageInstruction || med.dosage}
                  <br />
                  • Thời gian: {med.duration}
                  <br />
                  • Số lượng: {med.quantity} {med.unit}
                  {med.note && (
                    <>
                      <br />
                      • Ghi chú: {med.note}
                    </>
                  )}
                </Text>
              </div>
            ))}
            
            {prescription.notes && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <Text type="secondary">
                  <strong>Lưu ý:</strong> {prescription.notes}
                </Text>
              </>
            )}
          </Space>
        </Card>
      )}
    </div>
  );
});

PrescriptionForm.displayName = 'PrescriptionForm';

export default PrescriptionForm;

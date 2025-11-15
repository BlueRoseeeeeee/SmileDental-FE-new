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

import React, { useState, useEffect } from 'react';
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
  SaveOutlined,
  MedicineBoxOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import recordService from '../../services/recordService';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const PrescriptionForm = ({ recordId, prescription, medicines, onUpdate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
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
          dosage: med.dosage,
          duration: med.duration,
          quantity: med.quantity,
          note: med.note
        })),
        prescriptionNotes: prescription.notes || ''
      });
    }
  }, [prescription, medicines]);

  // Handle form submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // ✅ Validate: Check for duplicate medicines
      const medicineIds = values.medicines.map(m => m.medicineId);
      const uniqueMedicineIds = new Set(medicineIds);
      if (medicineIds.length !== uniqueMedicineIds.size) {
        message.error('Không được chọn thuốc trùng lặp trong đơn thuốc');
        return;
      }
      
      setLoading(true);

      // Build medicines array
      const prescriptionMedicines = values.medicines.map(med => {
        const medicine = medicineList.find(m => m._id === med.medicineId);
        return {
          medicineId: med.medicineId,
          medicineName: medicine?.name || med.medicineName,
          dosage: med.dosage,
          duration: med.duration,
          quantity: med.quantity,
          note: med.note || ''
        };
      });

      // Create prescription data
      const prescriptionData = {
        medicines: prescriptionMedicines,
        notes: values.prescriptionNotes || ''
      };

      console.log('📝 [PrescriptionForm] Submitting prescription:', prescriptionData);

      // ✅ Call real API to add prescription
      const response = await recordService.addPrescription(recordId, prescriptionData);

      if (response.success) {
        message.success('Đã thêm đơn thuốc thành công');
        
        if (onUpdate) {
          onUpdate(response.data);
        }
      }
    } catch (error) {
      console.error('❌ Add prescription error:', error);
      if (error.errorFields) {
        message.error('Vui lòng điền đầy đủ thông tin thuốc');
      } else {
        message.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi thêm đơn thuốc');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle medicine selection
  const handleMedicineSelect = (medicineId, fieldName) => {
    const medicine = medicineList.find(m => m._id === medicineId);
    
    if (medicine) {
      // Auto-fill medicine name and dosage hint
      const medicines = form.getFieldValue('medicines');
      medicines[fieldName].medicineName = medicine.name;
      
      // ✅ Auto-fill dosage hint from medicine.dosage
      if (medicine.dosage && !medicines[fieldName].dosage) {
        medicines[fieldName].dosage = `${medicine.dosage} - `;
      }
      
      form.setFieldsValue({ medicines });
      console.log('✅ Selected medicine:', medicine.name, '- Dosage hint:', medicine.dosage);
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
                        rules={[
                          { required: true, message: 'Chọn thuốc' },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const medicines = getFieldValue('medicines') || [];
                              const selectedIds = medicines.map(m => m?.medicineId).filter(Boolean);
                              const count = selectedIds.filter(id => id === value).length;
                              if (count > 1) {
                                return Promise.reject(new Error('Thuốc này đã được chọn'));
                              }
                              return Promise.resolve();
                            }
                          })
                        ]}
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
                              (medicine.ingredient && medicine.ingredient.toLowerCase().includes(searchText))
                            );
                          }}
                          onChange={(value) => handleMedicineSelect(value, name)}
                        >
                          {medicineList.map(medicine => {
                            // Build tooltip content
                            const tooltipContent = (
                              <div style={{ maxWidth: 300 }}>
                                <div><strong>{medicine.name}</strong></div>
                                {medicine.ingredient && <div>Thành phần: {medicine.ingredient}</div>}
                                {medicine.dosage && <div>Hàm lượng: {medicine.dosage}</div>}
                                {medicine.instructions && <div style={{ marginTop: 4 }}>Hướng dẫn: {medicine.instructions}</div>}
                                {medicine.contraindications && <div style={{ marginTop: 4, color: '#ff4d4f' }}>Chống chỉ định: {medicine.contraindications}</div>}
                              </div>
                            );
                            
                            return (
                              <Option 
                                key={medicine._id} 
                                value={medicine._id}
                                label={`${medicine.name} ${medicine.dosage || ''}`}
                              >
                                <Tooltip title={tooltipContent} placement="right">
                                  <Space>
                                    <span>{medicine.name}</span>
                                    {medicine.dosage && <Text type="secondary">- {medicine.dosage}</Text>}
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
                        name={[name, 'dosage']}
                        label={
                          <Space>
                            <span>Liều lượng</span>
                            <Tooltip title="Cách dùng và số lần dùng trong ngày">
                              <InfoCircleOutlined style={{ color: '#1890ff' }} />
                            </Tooltip>
                          </Space>
                        }
                        rules={[{ required: true, message: 'Nhập liều lượng' }]}
                      >
                        <Input placeholder="VD: 1 viên x 3 lần/ngày sau ăn" />
                      </Form.Item>
                    </Col>

                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'duration']}
                        label="Thời gian dùng"
                        rules={[{ required: true, message: 'Nhập thời gian' }]}
                      >
                        <Input placeholder="VD: 5 ngày" />
                      </Form.Item>
                    </Col>

                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        label="Số lượng"
                        rules={[{ required: true, message: 'Nhập số lượng' }]}
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
            rows={3}
            placeholder="Nhập ghi chú chung về đơn thuốc (lưu ý khi dùng thuốc, kiêng kị, v.v.)..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        {/* Submit Button */}
        <Form.Item>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            icon={<SaveOutlined />}
            block
            size="large"
          >
            Lưu đơn thuốc
          </Button>
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
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  • Liều lượng: {med.dosage}
                  <br />
                  • Thời gian: {med.duration}
                  <br />
                  • Số lượng: {med.quantity}
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
};

export default PrescriptionForm;

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
  Tag
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import { addPrescription } from '../../services/mockRecordService';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const PrescriptionForm = ({ recordId, prescription, medicines, onUpdate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [medicineList, setMedicineList] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

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
        notes: values.prescriptionNotes || '',
        prescribedBy: currentUser._id || 'unknown'
      };

      // Call API to add prescription
      const response = await addPrescription(recordId, prescriptionData);

      if (response.success) {
        message.success('Đã thêm đơn thuốc thành công');
        
        if (onUpdate) {
          onUpdate(response.data);
        }
      }
    } catch (error) {
      console.error('Add prescription error:', error);
      if (error.errorFields) {
        message.error('Vui lòng điền đầy đủ thông tin thuốc');
      } else {
        message.error(error.message || 'Có lỗi xảy ra khi thêm đơn thuốc');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle medicine selection
  const handleMedicineSelect = (medicineId, fieldName) => {
    const medicine = medicineList.find(m => m._id === medicineId);
    
    if (medicine) {
      // Auto-fill medicine name
      const medicines = form.getFieldValue('medicines');
      medicines[fieldName].medicineName = medicine.name;
      form.setFieldsValue({ medicines });
    }
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
                        label="Tên thuốc"
                        rules={[{ required: true, message: 'Chọn thuốc' }]}
                      >
                        <Select
                          showSearch
                          placeholder="Tìm và chọn thuốc"
                          optionFilterProp="children"
                          filterOption={(input, option) =>
                            option.children.toLowerCase().includes(input.toLowerCase())
                          }
                          onChange={(value) => handleMedicineSelect(value, name)}
                        >
                          {medicineList.map(medicine => (
                            <Option key={medicine._id} value={medicine._id}>
                              {medicine.name} ({medicine.unit})
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'dosage']}
                        label="Liều lượng"
                        rules={[{ required: true, message: 'Nhập liều lượng' }]}
                      >
                        <Input placeholder="VD: 1 viên x 3 lần/ngày" />
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

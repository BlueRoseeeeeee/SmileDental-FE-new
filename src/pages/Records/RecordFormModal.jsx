/**
 * Record Form Modal Component
 * 
 * Modal for creating/editing medical records with tabs
 * Features:
 * - Tab 1: Basic info (patient, service, dentist, date)
 * - Tab 2: Diagnosis and indications
 * - Tab 3: Prescription
 * - Tab 4: Treatment indications (for exam records only)
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tabs,
  Space,
  Button,
  Tag,
  Radio,
  message,
  Spin,
  Row,
  Col,
  Card,
  Alert
} from 'antd';
import {
  UserOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  createRecord,
  updateRecord,
  addPrescription
} from '../../services/mockRecordService';
import PrescriptionForm from './PrescriptionForm';

const { Option } = Select;
const { TextArea } = Input;

const RecordFormModal = ({ visible, mode, record, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [recordType, setRecordType] = useState('exam');
  
  // Mock data - Replace with real API calls
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [medicines, setMedicines] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  useEffect(() => {
    if (visible) {
      loadMockData();
      
      if (mode === 'edit' && record) {
        // Populate form with record data
        form.setFieldsValue({
          ...record,
          date: record.date ? dayjs(record.date) : dayjs(),
          indications: record.indications || []
        });
        setRecordType(record.type || 'exam');
      } else {
        // Reset form for create mode
        form.resetFields();
        form.setFieldsValue({
          date: dayjs(),
          type: 'exam',
          status: 'pending',
          priority: 'normal',
          paymentStatus: 'unpaid'
        });
        setRecordType('exam');
      }
    }
  }, [visible, mode, record]);

  const loadMockData = () => {
    // Mock patients
    setPatients([
      { _id: 'pat_001', name: 'Nguyễn Văn A', phone: '0901234567', birthYear: 1990, gender: 'male' },
      { _id: 'pat_002', name: 'Trần Thị B', phone: '0909876543', birthYear: 1985, gender: 'female' },
      { _id: 'pat_003', name: 'Lê Văn C', phone: '0912345678', birthYear: 1995, gender: 'male' }
    ]);

    // Mock services
    setServices([
      { _id: 'ser_001', name: 'Khám tổng quát', price: 200000 },
      { _id: 'ser_002', name: 'Nhổ răng', price: 500000 },
      { _id: 'ser_003', name: 'Hàn răng', price: 300000 },
      { _id: 'ser_004', name: 'Cạo vôi răng', price: 150000 },
      { _id: 'ser_005', name: 'Tẩy trắng răng', price: 1000000 }
    ]);

    // Mock dentists
    setDentists([
      { _id: 'den_001', fullName: 'BS. Nguyễn Văn An', specialization: 'Tổng quát' },
      { _id: 'den_002', fullName: 'BS. Trần Thị Bình', specialization: 'Nha chu' },
      { _id: 'den_003', fullName: 'BS. Lê Văn Cường', specialization: 'Phẫu thuật' }
    ]);

    // Mock rooms
    setRooms([
      { _id: 'room_001', name: 'Phòng khám 1' },
      { _id: 'room_002', name: 'Phòng phẫu thuật' },
      { _id: 'room_003', name: 'Phòng điều trị' }
    ]);

    // Mock medicines
    setMedicines([
      { _id: 'med_001', name: 'Amoxicillin 500mg', unit: 'viên' },
      { _id: 'med_002', name: 'Ibuprofen 400mg', unit: 'viên' },
      { _id: 'med_003', name: 'Metronidazole 250mg', unit: 'viên' },
      { _id: 'med_004', name: 'Paracetamol 500mg', unit: 'viên' },
      { _id: 'med_005', name: 'Nước súc miệng', unit: 'chai' }
    ]);
  };

  // Handle record type change
  const handleTypeChange = (e) => {
    setRecordType(e.target.value);
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Get selected patient info
      const patient = patients.find(p => p._id === values.patientId);
      const service = services.find(s => s._id === values.serviceId);
      const dentist = dentists.find(d => d._id === values.dentistId);
      const room = rooms.find(r => r._id === values.roomId);

      const recordData = {
        ...values,
        date: values.date.toISOString(),
        patientInfo: patient ? {
          name: patient.name,
          phone: patient.phone,
          birthYear: patient.birthYear,
          gender: patient.gender
        } : {},
        serviceName: service?.name || '',
        dentistName: dentist?.fullName || '',
        roomName: room?.name || '',
        totalCost: service?.price || 0,
        createdBy: currentUser._id || 'unknown',
        lastModifiedBy: currentUser._id || 'unknown'
      };

      let response;
      if (mode === 'edit' && record) {
        response = await updateRecord(record._id, recordData);
      } else {
        response = await createRecord(recordData);
      }

      if (response.success) {
        message.success(mode === 'edit' ? 'Cập nhật hồ sơ thành công' : 'Tạo hồ sơ thành công');
        
        if (onSuccess) {
          onSuccess(response.data);
        }
      }
    } catch (error) {
      console.error('Submit record error:', error);
      if (error.errorFields) {
        message.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      } else {
        message.error(error.message || 'Có lỗi xảy ra khi lưu hồ sơ');
      }
    } finally {
      setLoading(false);
    }
  };

  // Tab 1: Basic Information
  const renderBasicInfoTab = () => {
    const isEditMode = mode === 'edit';
    
    return (
      <div>
        {isEditMode && (
          <Alert
            type="warning"
            message="Thông tin cơ bản đã được tạo khi check-in"
            description="Các trường thông tin bệnh nhân, dịch vụ, nha sĩ, phòng khám đã được khóa và không thể sửa đổi"
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="patientId"
              label="Bệnh nhân"
              rules={[{ required: true, message: 'Vui lòng chọn bệnh nhân' }]}
            >
              <Select
                showSearch
                placeholder="Chọn bệnh nhân"
                optionFilterProp="children"
                disabled={isEditMode}
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {patients.map(patient => (
                  <Option key={patient._id} value={patient._id}>
                    {patient.name} - {patient.phone}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="date"
              label="Ngày khám"
              rules={[{ required: true, message: 'Vui lòng chọn ngày khám' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày khám"
                disabled={isEditMode}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="serviceId"
              label="Dịch vụ"
              rules={[{ required: true, message: 'Vui lòng chọn dịch vụ' }]}
            >
              <Select 
                placeholder="Chọn dịch vụ"
                disabled={isEditMode}
              >
                {services.map(service => (
                  <Option key={service._id} value={service._id}>
                    {service.name} - {service.price.toLocaleString('vi-VN')}đ
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="type"
              label="Loại hồ sơ"
              rules={[{ required: true, message: 'Vui lòng chọn loại hồ sơ' }]}
            >
              <Radio.Group 
                onChange={handleTypeChange}
                disabled={isEditMode}
              >
                <Radio value="exam">Khám bệnh</Radio>
                <Radio value="treatment">Điều trị</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="dentistId"
              label="Nha sĩ"
              rules={[{ required: true, message: 'Vui lòng chọn nha sĩ' }]}
            >
              <Select 
                placeholder="Chọn nha sĩ"
                disabled={isEditMode}
              >
                {dentists.map(dentist => (
                  <Option key={dentist._id} value={dentist._id}>
                    {dentist.fullName} - {dentist.specialization}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="roomId"
              label="Phòng khám"
              rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}
            >
              <Select 
                placeholder="Chọn phòng"
                disabled={isEditMode}
              >
                {rooms.map(room => (
                  <Option key={room._id} value={room._id}>
                    {room.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="pending">Chờ khám</Option>
                <Option value="in_progress">Đang khám</Option>
                <Option value="completed">Hoàn thành</Option>
                <Option value="cancelled">Đã hủy</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="priority"
              label="Độ ưu tiên"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="low">Thấp</Option>
                <Option value="normal">Bình thường</Option>
                <Option value="high">Cao</Option>
                <Option value="urgent">Khẩn cấp</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="paymentStatus"
              label="Thanh toán"
              rules={[{ required: true }]}
            >
              <Select disabled>
                <Option value="unpaid">Chưa thanh toán</Option>
                <Option value="partial">Thanh toán 1 phần</Option>
                <Option value="paid">Đã thanh toán</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </div>
    );
  };

  // Tab 2: Diagnosis
  const renderDiagnosisTab = () => (
    <div>
      {mode === 'edit' && (
        <Alert
          type="info"
          message="Thông tin chẩn đoán và điều trị"
          description="Các trường này có thể cập nhật trong quá trình khám bệnh"
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}
      
      <Form.Item
        name="diagnosis"
        label="Chẩn đoán"
        rules={[{ required: true, message: 'Vui lòng nhập chẩn đoán' }]}
      >
        <TextArea
          rows={4}
          placeholder="Nhập chẩn đoán chi tiết..."
          maxLength={1000}
          showCount
        />
      </Form.Item>

      <Form.Item
        name="indications"
        label="Chỉ định"
      >
        <Select
          mode="tags"
          placeholder="Nhập các chỉ định (nhấn Enter để thêm)"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="notes"
        label="Ghi chú"
      >
        <TextArea
          rows={4}
          placeholder="Nhập ghi chú về bệnh nhân..."
          maxLength={1000}
          showCount
        />
      </Form.Item>
    </div>
  );

  // Tab 3: Prescription
  const renderPrescriptionTab = () => (
    <div>
      <Alert
        type="info"
        message="Đơn thuốc sẽ được thêm sau khi tạo hồ sơ"
        description={mode === 'edit' ? 'Sử dụng form bên dưới để thêm/sửa đơn thuốc' : 'Bạn có thể thêm đơn thuốc sau khi tạo hồ sơ thành công'}
        style={{ marginBottom: 16 }}
      />

      {mode === 'edit' && record && (
        <PrescriptionForm
          recordId={record._id}
          prescription={record.prescription}
          medicines={medicines}
          onUpdate={onSuccess}
        />
      )}

      {mode === 'create' && (
        <div style={{ 
          padding: '24px', 
          textAlign: 'center', 
          background: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <MedicineBoxOutlined style={{ fontSize: 48, color: '#999', marginBottom: 8 }} />
          <p style={{ color: '#999' }}>Vui lòng tạo hồ sơ trước khi thêm đơn thuốc</p>
        </div>
      )}
    </div>
  );

  // Tab 4: Treatment Indications (only for exam records)
  const renderTreatmentIndicationsTab = () => (
    <div>
      {recordType === 'exam' ? (
        <>
          <Alert
            type="info"
            message="Chỉ định điều trị"
            description="Thêm các dịch vụ điều trị được khuyến nghị cho bệnh nhân"
            style={{ marginBottom: 16 }}
          />

          <Form.List name="treatmentIndications">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 8 }}
                    extra={
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      >
                        Xóa
                      </Button>
                    }
                  >
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'serviceId']}
                          label="Dịch vụ điều trị"
                          rules={[{ required: true, message: 'Chọn dịch vụ' }]}
                        >
                          <Select placeholder="Chọn dịch vụ">
                            {services.map(service => (
                              <Option key={service._id} value={service._id}>
                                {service.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'notes']}
                          label="Ghi chú"
                        >
                          <Input placeholder="Ghi chú về chỉ định này" />
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
                >
                  Thêm chỉ định điều trị
                </Button>
              </>
            )}
          </Form.List>
        </>
      ) : (
        <div style={{ 
          padding: '24px', 
          textAlign: 'center', 
          background: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <ExperimentOutlined style={{ fontSize: 48, color: '#999', marginBottom: 8 }} />
          <p style={{ color: '#999' }}>Chỉ định điều trị chỉ áp dụng cho hồ sơ khám bệnh</p>
        </div>
      )}
    </div>
  );

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <UserOutlined />
          Thông tin cơ bản
        </span>
      ),
      children: renderBasicInfoTab()
    },
    {
      key: '2',
      label: (
        <span>
          <FileTextOutlined />
          Chẩn đoán
        </span>
      ),
      children: renderDiagnosisTab()
    },
    {
      key: '3',
      label: (
        <span>
          <MedicineBoxOutlined />
          Đơn thuốc
        </span>
      ),
      children: renderPrescriptionTab()
    },
    {
      key: '4',
      label: (
        <span>
          <ExperimentOutlined />
          Chỉ định điều trị
        </span>
      ),
      children: renderTreatmentIndicationsTab()
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined style={{ fontSize: 20 }} />
          {mode === 'edit' ? 'Sửa hồ sơ bệnh án' : 'Tạo hồ sơ bệnh án mới'}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
        >
          {mode === 'edit' ? 'Cập nhật' : 'Tạo hồ sơ'}
        </Button>
      ]}
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            type: 'exam',
            status: 'pending',
            priority: 'normal',
            paymentStatus: 'unpaid',
            date: dayjs()
          }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
          />
        </Form>
      </Spin>
    </Modal>
  );
};

export default RecordFormModal;

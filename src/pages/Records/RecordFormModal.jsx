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
  InputNumber,
  Tag,
  Radio,
  message,
  Spin,
  Row,
  Col,
  Card,
  Alert,
  Typography,
  Divider
} from 'antd';

const { TextArea } = Input;
const { Text } = Typography;

import {
  UserOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import recordService from '../../services/recordService';
import { servicesService } from '../../services/servicesService';
import userService from '../../services/userService';
import roomService from '../../services/roomService';
import medicineService from '../../services/medicineService';
import PrescriptionForm from './PrescriptionForm';

const { Option } = Select;

const RecordFormModal = ({ visible, mode, record, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [recordType, setRecordType] = useState('exam');
  
  // Real data from APIs
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [medicines, setMedicines] = useState([]);
  
  // ServiceAddOns for selected services in treatmentIndications
  const [serviceAddOnsMap, setServiceAddOnsMap] = useState({}); // { serviceId: [addOns] }
  const [loadingAddOns, setLoadingAddOns] = useState(false);
  
  // 🆕 Additional Services modal state
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [addServiceForm] = Form.useForm();
  const [selectedMainServiceAddOns, setSelectedMainServiceAddOns] = useState([]);
  const [mainServiceDetails, setMainServiceDetails] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  useEffect(() => {
    if (visible) {
      loadData();
      
      if (mode === 'edit' && record) {
        // Populate form with record data
        form.setFieldsValue({
          ...record,
          date: record.date ? dayjs(record.date) : dayjs(),
          indications: record.indications || [],
          treatmentIndications: record.treatmentIndications || []
        });
        setRecordType(record.type || 'exam');
        
        // Load service addons for existing treatment indications
        if (record.treatmentIndications && record.treatmentIndications.length > 0) {
          record.treatmentIndications.forEach(indication => {
            if (indication.serviceId) {
              loadServiceAddOns(indication.serviceId);
            }
          });
        }
        
        // 🆕 Load main service details for additional services tab
        loadMainServiceDetails();
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
        setServiceAddOnsMap({});
      }
    }
  }, [visible, mode, record]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load patients
      const patientsResponse = await userService.getAllPatients(1, 1000);
      if (patientsResponse.success && patientsResponse.data) {
        setPatients(patientsResponse.data);
      }

      // Load services
      const servicesResponse = await servicesService.getAllServices();
      if (servicesResponse.success && servicesResponse.data) {
        setServices(servicesResponse.data);
      }

      // Load dentists (all staff with dentist role will be filtered on backend)
      const dentistsResponse = await userService.getAllStaff(1, 1000);
      if (dentistsResponse.success && dentistsResponse.data) {
        // Filter dentists from staff
        const dentistsList = dentistsResponse.data.filter(staff => staff.role === 'dentist');
        setDentists(dentistsList);
      }

      // Load rooms
      const roomsResponse = await roomService.getRooms(1, 1000);
      if (roomsResponse.success && roomsResponse.data) {
        setRooms(roomsResponse.data);
      }

      // 🆕 Load medicines from medicine service
      const medicinesResponse = await medicineService.getMedicines({ 
        isActive: true, 
        limit: 1000 
      });
      if (medicinesResponse.success && medicinesResponse.data) {
        setMedicines(medicinesResponse.data);
        console.log('✅ Loaded medicines:', medicinesResponse.data.length);
      }
      
    } catch (error) {
      console.error('Load data error:', error);
      message.error('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load service addons when service is selected in treatment indications
  const loadServiceAddOns = async (serviceId) => {
    if (serviceAddOnsMap[serviceId]) {
      return; // Already loaded
    }
    
    try {
      setLoadingAddOns(true);
      const response = await servicesService.getServiceById(serviceId);
      if (response.success && response.data && response.data.serviceAddOns) {
        setServiceAddOnsMap(prev => ({
          ...prev,
          [serviceId]: response.data.serviceAddOns.filter(addon => addon.isActive)
        }));
      }
    } catch (error) {
      console.error('Load service addons error:', error);
      message.error('Không thể tải danh sách dịch vụ con');
    } finally {
      setLoadingAddOns(false);
    }
  };

  // Handle record type change
  const handleTypeChange = (e) => {
    setRecordType(e.target.value);
  };
  
  // 🆕 Load main service details for changing serviceAddOn
  const loadMainServiceDetails = async () => {
    if (!record || !record.serviceId) return;
    
    try {
      const response = await servicesService.getServiceById(record.serviceId);
      if (response.success && response.data) {
        setMainServiceDetails(response.data);
        setSelectedMainServiceAddOns(response.data.serviceAddOns.filter(addon => addon.isActive));
      }
    } catch (error) {
      console.error('Load main service error:', error);
      message.error('Không thể tải thông tin dịch vụ chính');
    }
  };
  
  // 🆕 Handle change main service's serviceAddOn
  const handleChangeMainServiceAddOn = async (newAddOnId) => {
    if (!record || !mainServiceDetails) return;
    
    const newAddOn = selectedMainServiceAddOns.find(a => a._id === newAddOnId);
    if (!newAddOn) return;
    
    try {
      setLoading(true);
      
      // ⚠️ Recalculate totalCost (workaround vì backend không auto-recalculate)
      const baseCost = (record.servicePrice || 0) + newAddOn.price;
      const additionalCost = (record.additionalServices || []).reduce((sum, svc) => sum + (svc.totalPrice || 0), 0);
      const newTotalCost = baseCost + additionalCost;
      
      const response = await recordService.updateRecord(record._id, {
        serviceAddOnId: newAddOn._id,
        serviceAddOnName: newAddOn.name,
        serviceAddOnPrice: newAddOn.price,
        totalCost: newTotalCost // ⚠️ Frontend recalculate và gửi lên
      });
      
      if (response.success) {
        message.success('Đã cập nhật dịch vụ con');
        if (onSuccess) onSuccess(response.data);
      }
    } catch (error) {
      console.error('Update service addon error:', error);
      message.error(error.response?.data?.message || 'Không thể cập nhật dịch vụ con');
    } finally {
      setLoading(false);
    }
  };
  
  // 🆕 Handle add additional service
  const handleAddAdditionalService = () => {
    addServiceForm.resetFields();
    setShowAddServiceModal(true);
  };
  
  // 🆕 Handle submit add service modal
  const handleSubmitAddService = async () => {
    try {
      const values = await addServiceForm.validateFields();
      
      const service = services.find(s => s._id === values.serviceId);
      const addOns = serviceAddOnsMap[values.serviceId] || [];
      const addOn = addOns.find(a => a._id === values.serviceAddOnId);
      
      if (!service || !addOn) {
        message.error('Không tìm thấy thông tin dịch vụ');
        return;
      }
      
      const serviceData = {
        serviceId: service._id,
        serviceName: service.name,
        serviceType: service.type,
        serviceAddOnId: addOn._id,
        serviceAddOnName: addOn.name,
        price: addOn.price,
        quantity: values.quantity || 1,
        notes: values.notes || ''
      };
      
      setLoading(true);
      const response = await recordService.addAdditionalService(record._id, serviceData);
      
      if (response.success) {
        message.success('Đã thêm dịch vụ bổ sung');
        setShowAddServiceModal(false);
        addServiceForm.resetFields();
        if (onSuccess) onSuccess(response.data);
      }
    } catch (error) {
      console.error('Add additional service error:', error);
      message.error(error.response?.data?.message || 'Không thể thêm dịch vụ');
    } finally {
      setLoading(false);
    }
  };
  
  // 🆕 Handle remove additional service
  const handleRemoveAdditionalService = async (serviceItemId, serviceName) => {
    Modal.confirm({
      title: 'Xác nhận xóa dịch vụ',
      content: `Bạn có chắc muốn xóa dịch vụ "${serviceName}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setLoading(true);
          const response = await recordService.removeAdditionalService(record._id, serviceItemId);
          
          if (response.success) {
            message.success('Đã xóa dịch vụ');
            if (onSuccess) onSuccess(response.data);
          }
        } catch (error) {
          console.error('Remove additional service error:', error);
          message.error(error.response?.data?.message || 'Không thể xóa dịch vụ');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      let values;
      
      if (mode === 'edit') {
        // In edit mode, manually get form values (no validation for disabled fields)
        values = form.getFieldsValue();
        
        // Only validate required editable fields
        if (!values.diagnosis || values.diagnosis.trim() === '') {
          message.error('Vui lòng nhập chẩn đoán');
          return;
        }
      } else {
        // In create mode, validate all required fields
        values = await form.validateFields();
      }
      
      setLoading(true);

      let recordData;
      
      if (mode === 'edit' && record) {
        // Edit mode: Only update editable fields (diagnosis, notes, treatmentIndications)
        // Process treatment indications to include service/addon names
        let processedTreatmentIndications = [];
        if (values.treatmentIndications && values.treatmentIndications.length > 0) {
          processedTreatmentIndications = values.treatmentIndications.map(indication => {
            // Ưu tiên dùng serviceName/serviceAddOnName từ hidden fields (đã set tự động)
            // Fallback sang mapping nếu không có
            let serviceName = indication.serviceName;
            let serviceAddOnName = indication.serviceAddOnName;
            
            if (!serviceName) {
              const indicationService = services.find(s => s._id === indication.serviceId);
              serviceName = indicationService?.name || '';
            }
            
            if (indication.serviceAddOnId && !serviceAddOnName) {
              const addOns = serviceAddOnsMap[indication.serviceId] || [];
              const addOn = addOns.find(a => a._id === indication.serviceAddOnId);
              serviceAddOnName = addOn?.name || null;
            }
            
            return {
              serviceId: indication.serviceId,
              serviceName: serviceName,
              serviceAddOnId: indication.serviceAddOnId || null,
              serviceAddOnName: serviceAddOnName || null,
              notes: indication.notes || '',
              used: indication.used || false
            };
          });
        }

        recordData = {
          diagnosis: values.diagnosis,
          notes: values.notes,
          treatmentIndications: processedTreatmentIndications,
          lastModifiedBy: currentUser._id || 'unknown'
        };
      } else {
        // Create mode: Include all fields
        const patient = patients.find(p => p._id === values.patientId);
        const service = services.find(s => s._id === values.serviceId);
        const dentist = dentists.find(d => d._id === values.dentistId);
        const room = rooms.find(r => r._id === values.roomId);

        // Process treatment indications to include service/addon names
        let processedTreatmentIndications = [];
        if (values.treatmentIndications && values.treatmentIndications.length > 0) {
          processedTreatmentIndications = values.treatmentIndications.map(indication => {
            // Ưu tiên dùng serviceName/serviceAddOnName từ hidden fields (đã set tự động)
            // Fallback sang mapping nếu không có
            let serviceName = indication.serviceName;
            let serviceAddOnName = indication.serviceAddOnName;
            
            if (!serviceName) {
              const indicationService = services.find(s => s._id === indication.serviceId);
              serviceName = indicationService?.name || '';
            }
            
            if (indication.serviceAddOnId && !serviceAddOnName) {
              const addOns = serviceAddOnsMap[indication.serviceId] || [];
              const addOn = addOns.find(a => a._id === indication.serviceAddOnId);
              serviceAddOnName = addOn?.name || null;
            }
            
            return {
              serviceId: indication.serviceId,
              serviceName: serviceName,
              serviceAddOnId: indication.serviceAddOnId || null,
              serviceAddOnName: serviceAddOnName || null,
              notes: indication.notes || '',
              used: false
            };
          });
        }

        recordData = {
          ...values,
          date: values.date.toISOString(),
          patientInfo: patient ? {
            name: patient.fullName || patient.name,
            phone: patient.phone,
            birthYear: patient.birthYear,
            gender: patient.gender,
            address: patient.address
          } : {},
          serviceName: service?.name || '',
          dentistName: dentist?.fullName || '',
          roomName: room?.name || '',
          treatmentIndications: processedTreatmentIndications,
          totalCost: 0, // Will be calculated by backend
          createdBy: currentUser._id || 'unknown',
          lastModifiedBy: currentUser._id || 'unknown'
        };
      }

      let response;
      if (mode === 'edit' && record) {
        console.log('📝 [RecordFormModal] Updating record:', record._id, recordData);
        response = await recordService.updateRecord(record._id, recordData);
      } else {
        console.log('📝 [RecordFormModal] Creating record:', recordData);
        response = await recordService.createRecord(recordData);
      }

      if (response.success) {
        message.success(mode === 'edit' ? 'Cập nhật hồ sơ thành công' : 'Tạo hồ sơ thành công');
        
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        throw new Error(response.message || 'Có lỗi xảy ra');
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
        
        {/* Show detailed info in edit mode */}
        {isEditMode && record && (
          <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <div><strong>Bệnh nhân:</strong> {record.patientInfo?.name || 'N/A'}</div>
                <div style={{ fontSize: 12, color: '#666' }}>SĐT: {record.patientInfo?.phone || 'N/A'}</div>
              </Col>
              <Col span={12}>
                <div><strong>Ngày khám:</strong> {dayjs(record.date).format('DD/MM/YYYY')}</div>
              </Col>
              <Col span={12}>
                <div><strong>Dịch vụ:</strong> {record.serviceName || 'N/A'}</div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  Loại: <Tag color={record.type === 'exam' ? 'blue' : 'green'}>
                    {record.type === 'exam' ? 'Khám bệnh' : 'Điều trị'}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <div><strong>Nha sĩ:</strong> {record.dentistName || 'N/A'}</div>
              </Col>
              <Col span={12}>
                <div><strong>Phòng khám:</strong> {record.roomName || 'N/A'}</div>
              </Col>
            </Row>
          </Card>
        )}
        
        {!isEditMode && (
          <>
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
                    filterOption={(input, option) =>
                      option.children.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {patients.map(patient => (
                      <Option key={patient._id} value={patient._id}>
                        {patient.fullName || patient.name} - {patient.phone}
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
                    showSearch
                    optionFilterProp="children"
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
                  <Radio.Group onChange={handleTypeChange}>
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
                    showSearch
                    optionFilterProp="children"
                  >
                    {dentists.map(dentist => (
                      <Option key={dentist._id} value={dentist._id}>
                        {dentist.fullName} {dentist.specialization ? `- ${dentist.specialization}` : ''}
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
                    showSearch
                    optionFilterProp="children"
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

            {/* Status, Priority, Payment - Only in create mode */}
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="pending">Chờ khám</Option>
                    <Option value="in-progress">Đang khám</Option>
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
                  <Select>
                    <Option value="unpaid">Chưa thanh toán</Option>
                    <Option value="partial">Thanh toán 1 phần</Option>
                    <Option value="paid">Đã thanh toán</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
      </div>
    );
  };

  // Tab 2: Diagnosis (removed indications field)
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
          rows={6}
          placeholder="Nhập chẩn đoán chi tiết..."
          maxLength={1000}
          showCount
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

  // Tab 4: Additional Services - Services used during treatment
  const renderAdditionalServicesTab = () => {
    if (mode !== 'edit' || !record) {
      return (
        <div style={{ 
          padding: '24px', 
          textAlign: 'center', 
          background: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <MedicineBoxOutlined style={{ fontSize: 48, color: '#999', marginBottom: 8 }} />
          <p style={{ color: '#999' }}>Vui lòng tạo hồ sơ trước khi thêm dịch vụ bổ sung</p>
        </div>
      );
    }

    const baseCost = (record.servicePrice || 0) + (record.serviceAddOnPrice || 0);
    const additionalCost = (record.additionalServices || []).reduce((sum, svc) => sum + (svc.totalPrice || 0), 0);
    const totalCost = record.totalCost || (baseCost + additionalCost);

    return (
      <div>
        {/* Main Service Section */}
        <Card 
          size="small" 
          style={{ marginBottom: 16, background: '#e6f7ff', borderColor: '#91d5ff' }}
          title={<Text strong>📌 Dịch vụ chính (đã chọn khi tạo hồ sơ)</Text>}
        >
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <div><Text type="secondary">Dịch vụ:</Text></div>
              <div><Text strong>{record.serviceName || 'N/A'}</Text></div>
              <div style={{ fontSize: 12, color: '#666' }}>
                Giá: {(record.servicePrice || 0).toLocaleString('vi-VN')}đ
              </div>
            </Col>
            <Col span={12}>
              <div><Text type="secondary">Dịch vụ con:</Text></div>
              {mainServiceDetails && selectedMainServiceAddOns.length > 0 ? (
                <Select
                  value={record.serviceAddOnId}
                  onChange={handleChangeMainServiceAddOn}
                  style={{ width: '100%' }}
                  loading={loading}
                >
                  {selectedMainServiceAddOns.map(addon => (
                    <Option key={addon._id} value={addon._id}>
                      {addon.name} - {addon.price.toLocaleString('vi-VN')}đ
                    </Option>
                  ))}
                </Select>
              ) : (
                <>
                  <div><Text strong>{record.serviceAddOnName || 'Chưa chọn'}</Text></div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    Giá: {(record.serviceAddOnPrice || 0).toLocaleString('vi-VN')}đ
                  </div>
                </>
              )}
            </Col>
          </Row>
        </Card>

        {/* Additional Services Section */}
        <Card 
          size="small"
          title={
            <Space>
              <Text strong>➕ Dịch vụ bổ sung</Text>
              <Tag color="blue">
                {(record.additionalServices || []).length} dịch vụ
              </Tag>
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddAdditionalService}
            >
              Thêm dịch vụ
            </Button>
          }
        >
          {record.additionalServices && record.additionalServices.length > 0 ? (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {record.additionalServices.map((svc, index) => (
                <Card
                  key={svc._id || index}
                  size="small"
                  style={{ background: '#fafafa' }}
                >
                  <Row gutter={16} align="middle">
                    <Col span={18}>
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <div>
                          <Tag color="blue">{index + 1}</Tag>
                          <Text strong>{svc.serviceName}</Text>
                        </div>
                        {svc.serviceAddOnName && (
                          <div style={{ paddingLeft: 36 }}>
                            <Text type="secondary">Dịch vụ con:</Text> {svc.serviceAddOnName}
                          </div>
                        )}
                        <div style={{ paddingLeft: 36 }}>
                          <Text type="secondary">Đơn giá:</Text> {svc.price.toLocaleString('vi-VN')}đ
                          {' × '}
                          <Text type="secondary">Số lượng:</Text> {svc.quantity}
                          {' = '}
                          <Text strong style={{ color: '#1890ff' }}>
                            {svc.totalPrice.toLocaleString('vi-VN')}đ
                          </Text>
                        </div>
                        {svc.notes && (
                          <div style={{ paddingLeft: 36 }}>
                            <Text type="secondary">Ghi chú:</Text> {svc.notes}
                          </div>
                        )}
                      </Space>
                    </Col>
                    <Col span={6} style={{ textAlign: 'right' }}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveAdditionalService(svc._id, svc.serviceName)}
                      >
                        Xóa
                      </Button>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          ) : (
            <div style={{ 
              padding: '24px', 
              textAlign: 'center', 
              background: '#fafafa',
              borderRadius: '8px',
              border: '1px dashed #d9d9d9'
            }}>
              <Text type="secondary">Chưa có dịch vụ bổ sung nào</Text>
            </div>
          )}

          {/* Total Cost Summary */}
          <Divider />
          <Row gutter={16} style={{ background: '#f0f0f0', padding: '12px', borderRadius: '4px' }}>
            <Col span={12}>
              <div><Text type="secondary">Dịch vụ chính:</Text></div>
              <div><Text strong>{baseCost.toLocaleString('vi-VN')}đ</Text></div>
            </Col>
            <Col span={12}>
              <div><Text type="secondary">Dịch vụ bổ sung:</Text></div>
              <div><Text strong>{additionalCost.toLocaleString('vi-VN')}đ</Text></div>
            </Col>
            <Col span={24} style={{ marginTop: 8 }}>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ textAlign: 'right' }}>
                <Text type="secondary">Tổng cộng: </Text>
                <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                  {totalCost.toLocaleString('vi-VN')}đ
                </Text>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    );
  };

  // Tab 5: Treatment Indications (only for exam records)
  const renderTreatmentIndicationsTab = () => (
    <div>
      {recordType === 'exam' ? (
        <>
          <Alert
            type="info"
            message="Chỉ định điều trị"
            description="Thêm các dịch vụ điều trị được khuyến nghị cho bệnh nhân. Dịch vụ và dịch vụ con sẽ được sử dụng để đặt lịch điều trị sau."
            style={{ marginBottom: 16 }}
          />

          <Form.List name="treatmentIndications">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => {
                  const selectedServiceId = form.getFieldValue(['treatmentIndications', name, 'serviceId']);
                  const addOnsForService = serviceAddOnsMap[selectedServiceId] || [];
                  const selectedService = services.find(s => s._id === selectedServiceId);
                  
                  return (
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
                      {/* Hidden fields for service names */}
                      <Form.Item {...restField} name={[name, 'serviceName']} hidden>
                        <Input />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'serviceAddOnName']} hidden>
                        <Input />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'used']} hidden initialValue={false}>
                        <Input />
                      </Form.Item>
                      
                      <Row gutter={16}>
                        <Col span={10}>
                          <Form.Item
                            {...restField}
                            name={[name, 'serviceId']}
                            label="Dịch vụ điều trị"
                            rules={[{ required: true, message: 'Vui lòng chọn dịch vụ' }]}
                          >
                            <Select 
                              placeholder="Chọn dịch vụ điều trị"
                              showSearch
                              optionFilterProp="children"
                              onChange={(value) => {
                                // Load service addons when service changes
                                loadServiceAddOns(value);
                                // Reset serviceAddOnId when service changes
                                const currentValues = form.getFieldValue('treatmentIndications');
                                if (currentValues && currentValues[name]) {
                                  currentValues[name].serviceAddOnId = null;
                                  currentValues[name].serviceName = null;
                                  currentValues[name].serviceAddOnName = null;
                                  form.setFieldsValue({ treatmentIndications: currentValues });
                                }
                                
                                // Set serviceName
                                const service = services.find(s => s._id === value);
                                if (service && currentValues && currentValues[name]) {
                                  currentValues[name].serviceName = service.name;
                                  form.setFieldsValue({ treatmentIndications: currentValues });
                                }
                              }}
                            >
                              {services.filter(s => 
                                s.type === 'treatment' && 
                                s.requireExamFirst === true && 
                                s.isActive === true
                              ).map(service => (
                                <Option key={service._id} value={service._id}>
                                  <Space>
                                    <span>{service.name}</span>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      - {service.price.toLocaleString('vi-VN')}đ
                                    </Text>
                                  </Space>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                          {selectedService && (
                            <div style={{ marginTop: -12, marginBottom: 8, fontSize: 12, color: '#666' }}>
                              Giá cơ bản: <strong>{selectedService.price.toLocaleString('vi-VN')}đ</strong>
                            </div>
                          )}
                        </Col>

                        <Col span={10}>
                          <Form.Item
                            {...restField}
                            name={[name, 'serviceAddOnId']}
                            label={
                              <span>
                                Dịch vụ con <Text type="secondary" style={{ fontWeight: 'normal' }}>(tùy chọn)</Text>
                              </span>
                            }
                          >
                            <Select 
                              placeholder={selectedServiceId ? "Chọn dịch vụ con (nếu có)" : "Chọn dịch vụ trước"}
                              disabled={!selectedServiceId || loadingAddOns}
                              loading={loadingAddOns}
                              allowClear
                              onChange={(value) => {
                                // Set serviceAddOnName when selected
                                const currentValues = form.getFieldValue('treatmentIndications');
                                if (currentValues && currentValues[name]) {
                                  if (value) {
                                    const addOn = addOnsForService.find(a => a._id === value);
                                    if (addOn) {
                                      currentValues[name].serviceAddOnName = addOn.name;
                                      form.setFieldsValue({ treatmentIndications: currentValues });
                                    }
                                  } else {
                                    // Clear serviceAddOnName when deselected
                                    currentValues[name].serviceAddOnName = null;
                                    form.setFieldsValue({ treatmentIndications: currentValues });
                                  }
                                }
                              }}
                            >
                              {addOnsForService.map(addOn => (
                                <Option key={addOn._id} value={addOn._id}>
                                  <Space>
                                    <span>{addOn.name}</span>
                                    <Tag color="blue">{addOn.unit}</Tag>
                                    <Text type="secondary">- {addOn.price.toLocaleString('vi-VN')}đ</Text>
                                  </Space>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, 'notes']}
                            label="Ghi chú"
                          >
                            <TextArea 
                              placeholder="Nhập ghi chú về chỉ định điều trị (vd: răng số 36, 37...)" 
                              rows={2}
                              maxLength={300}
                              showCount
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  );
                })}

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
          <PlusOutlined />
          Dịch vụ bổ sung
        </span>
      ),
      children: renderAdditionalServicesTab()
    },
    {
      key: '5',
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

      {/* 🆕 Add Service Modal */}
      <Modal
        title="Thêm dịch vụ bổ sung"
        open={showAddServiceModal}
        onCancel={() => setShowAddServiceModal(false)}
        onOk={handleSubmitAddService}
        okText="Thêm"
        cancelText="Hủy"
        width={600}
        confirmLoading={loading}
      >
        <Form
          form={addServiceForm}
          layout="vertical"
          initialValues={{ quantity: 1 }}
        >
          <Form.Item
            name="serviceId"
            label="Chọn dịch vụ"
            rules={[{ required: true, message: 'Vui lòng chọn dịch vụ' }]}
          >
            <Select
              placeholder="Chọn dịch vụ"
              showSearch
              optionFilterProp="children"
              onChange={(value) => {
                loadServiceAddOns(value);
                addServiceForm.setFieldValue('serviceAddOnId', null);
              }}
            >
              {services.map(service => (
                <Option key={service._id} value={service._id}>
                  <Space>
                    <span>{service.name}</span>
                    <Tag color={service.type === 'exam' ? 'blue' : 'green'}>
                      {service.type === 'exam' ? 'Khám' : 'Điều trị'}
                    </Tag>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="serviceAddOnId"
            label="Chọn dịch vụ con"
            rules={[{ required: true, message: 'Vui lòng chọn dịch vụ con' }]}
          >
            <Select
              placeholder="Chọn dịch vụ con"
              disabled={!addServiceForm.getFieldValue('serviceId')}
              loading={loadingAddOns}
            >
              {(() => {
                const serviceId = addServiceForm.getFieldValue('serviceId');
                const addOns = serviceAddOnsMap[serviceId] || [];
                return addOns.map(addon => (
                  <Option key={addon._id} value={addon._id}>
                    <Space>
                      <span>{addon.name}</span>
                      <Text type="secondary">- {addon.price.toLocaleString('vi-VN')}đ</Text>
                      <Tag>{addon.unit}</Tag>
                    </Space>
                  </Option>
                ));
              })()}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng' },
              { type: 'number', min: 1, message: 'Số lượng phải >= 1' }
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
              rows={3}
              placeholder="Nhập ghi chú (tùy chọn)..."
              maxLength={300}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};

export default RecordFormModal;

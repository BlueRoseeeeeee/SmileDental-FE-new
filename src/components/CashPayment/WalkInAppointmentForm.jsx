/**
 * Walk-In Appointment Form Component
 * 
 * Tạo lịch hẹn cho bệnh nhân đến phòng khám trực tiếp
 * Flow:
 * 1. Tìm kiếm bệnh nhân có tài khoản (phone/email/name) hoặc nhập thông tin mới
 * 2. Chọn dịch vụ, nha sĩ, ngày, slot
 * 3. Tạo appointment + check-in ngay (tạo record tự động)
 */

import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  message,
  Spin,
  Divider,
  Steps,
  Alert,
  InputNumber
} from 'antd';

const { Step } = Steps;
import {
  UserAddOutlined,
  SearchOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  DollarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import userService from '../../services/userService';
import { servicesService } from '../../services/servicesService';
import slotService from '../../services/slotService';
import appointmentService from '../../services/appointmentService';
import scheduleConfigService from '../../services/scheduleConfigService'; // 🆕 Import for deposit calculation
import { groupConsecutiveSlots } from '../../utils/slotGrouping'; // ⭐ Import slot grouping utility

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const WalkInAppointmentForm = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Patient search
  const [searchType, setSearchType] = useState('phone'); // phone, email, name
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientInfo, setNewPatientInfo] = useState({
    name: '',
    phone: '',
    email: '',
    birthYear: null
  }); // ⭐ Store new patient info in state
  
  // Services & Dentists
  const [services, setServices] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServiceAddOn, setSelectedServiceAddOn] = useState(null); // ⭐ Add serviceAddOn state
  const [selectedDentist, setSelectedDentist] = useState(null);
  
  // Slots - ⭐ Use slot groups like patient/booking
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlotGroups, setAvailableSlotGroups] = useState({
    morning: [],
    afternoon: [],
    evening: []
  });
  const [selectedSlotGroup, setSelectedSlotGroup] = useState(null);
  
  // Schedule Config - 🆕 For deposit calculation
  const [scheduleConfig, setScheduleConfig] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadServices();
    loadScheduleConfig(); // 🆕 Load deposit config
    // ⭐ Don't load dentists here - they will be loaded after selecting a service
  }, []);

  // 🆕 Load schedule config for deposit calculation
  const loadScheduleConfig = async () => {
    try {
      const response = await scheduleConfigService.getConfig();
      if (response?.data) {
        setScheduleConfig(response.data);
        console.log('✅ Schedule config loaded:', response.data);
      } else {
        // Fallback default
        setScheduleConfig({ depositAmount: 50000 });
      }
    } catch (error) {
      console.error('❌ Error loading schedule config:', error);
      setScheduleConfig({ depositAmount: 50000 }); // Fallback
    }
  };

  // Search patient
  const handleSearchPatient = async () => {
    const searchValue = form.getFieldValue('searchValue');
    if (!searchValue || searchValue.trim() === '') {
      message.warning('Vui lòng nhập thông tin tìm kiếm');
      return;
    }

    setSearchLoading(true);
    try {
      console.log('🔍 Searching patients with:', { searchType, searchValue });
      const response = await userService.getAllPatients(1, 100);
      console.log('📋 API Response:', response);
      
      // API trả về { success: true, users: [...], total, page }
      if (response && response.users) {
        const allPatients = response.users || [];
        console.log(`📊 Total patients from API: ${allPatients.length}`);
        
        const results = allPatients.filter(patient => {
          const value = searchValue.toLowerCase().trim();
          let match = false;
          switch (searchType) {
            case 'phone':
              match = patient.phone?.includes(value) || patient.phoneNumber?.includes(value);
              break;
            case 'email':
              match = patient.email?.toLowerCase().includes(value);
              break;
            case 'name':
              match = patient.fullName?.toLowerCase().includes(value);
              break;
            default:
              match = false;
          }
          if (match) {
            console.log('✅ Match found:', patient);
          }
          return match;
        });

        console.log(`🎯 Filtered results: ${results.length}`, results);
        setSearchResults(results);
        
        if (results.length === 0) {
          message.info('Không tìm thấy bệnh nhân. Vui lòng nhập thông tin mới.');
          setIsNewPatient(true);
        } else {
          message.success(`Tìm thấy ${results.length} bệnh nhân`);
        }
      } else {
        console.error('❌ API response not successful:', response);
        message.error('Lỗi khi tải dữ liệu bệnh nhân');
      }
    } catch (error) {
      console.error('❌ Error searching patient:', error);
      message.error('Lỗi khi tìm kiếm bệnh nhân');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectPatient = (patientId) => {
    console.log('👆 handleSelectPatient called with ID:', patientId);
    console.log('📋 searchResults available:', searchResults.length, searchResults);
    
    const patient = searchResults.find(p => p._id === patientId);
    console.log('🔍 Found patient:', patient);
    
    if (patient) {
      setSelectedPatient(patient);
      setIsNewPatient(false);
      // Extract year from dateOfBirth since patient model has dateOfBirth (Date), not birthYear (Number)
      const birthYear = patient.dateOfBirth ? new Date(patient.dateOfBirth).getFullYear() : null;
      // Patient data có thể dùng 'phone' hoặc 'phoneNumber' tùy API
      form.setFieldsValue({
        patientName: patient.fullName,
        patientPhone: patient.phone || patient.phoneNumber,
        patientEmail: patient.email,
        patientBirthYear: birthYear
      });
      console.log('✅ Form fields set:', {
        name: patient.fullName,
        phone: patient.phone || patient.phoneNumber,
        email: patient.email,
        dateOfBirth: patient.dateOfBirth,
        extractedBirthYear: birthYear
      });
      message.success('Đã chọn bệnh nhân: ' + patient.fullName);
    } else {
      console.error('❌ Patient not found in searchResults!');
      message.error('Không tìm thấy thông tin bệnh nhân');
    }
  };

  const handleCreateNewPatient = () => {
    setIsNewPatient(true);
    setSelectedPatient(null);
    setSearchResults([]);
    form.resetFields(['patientName', 'patientPhone', 'patientEmail', 'patientBirthYear']);
    message.info('Vui lòng nhập thông tin bệnh nhân mới');
  };

  // Load services from API
  const loadServices = async () => {
    try {
      console.log('🔧 Loading services...');
      const response = await servicesService.getAllServices();
      console.log('📋 Services API Response:', response);
      
      // API trả về trực tiếp { services: [...], total, page, limit }
      if (response && response.services) {
        const serviceData = response.services || [];
        console.log(`📊 Total services: ${serviceData.length}`);
        
        // ⭐ Walk-in: Show ALL active services (no requireExamFirst filter)
        // Because walk-in patients may not have accounts/exam records
        const activeServices = serviceData.filter(s => s.isActive);
        console.log(`✅ Active services for walk-in: ${activeServices.length}`, activeServices);
        setServices(activeServices);
      } else {
        console.error('❌ Invalid services response structure:', response);
        setServices([]);
      }
    } catch (error) {
      console.error('❌ Error loading services:', error);
      message.error('Không thể tải danh sách dịch vụ');
      setServices([]);
    }
  };

  // Load dentists from API - using getDentistsWithNearestSlot like patient booking
  const loadDentists = async (serviceDuration = 15, serviceId = null) => {
    try {
      setLoading(true);
      console.log('👨‍⚕️ Loading dentists with nearest slot...');
      console.log('🎯 Service duration:', serviceDuration, 'minutes | Service ID:', serviceId);
      
      const response = await slotService.getDentistsWithNearestSlot(serviceDuration, serviceId);
      console.log('📋 Dentists API Response:', response);
      
      if (response.success && response.data && response.data.dentists) {
        const dentistList = response.data.dentists || [];
        console.log(`✅ Dentists with available slots: ${dentistList.length}`, dentistList);
        setDentists(dentistList);
        
        if (dentistList.length === 0) {
          message.warning('Hiện tại chưa có nha sỹ nào có lịch khám phù hợp với dịch vụ này');
        }
      } else {
        console.error('❌ Invalid dentists response structure:', response);
        setDentists([]);
        message.error('Không thể tải danh sách nha sỹ');
      }
    } catch (error) {
      console.error('❌ Error loading dentists:', error);
      message.error('Không thể tải danh sách nha sỹ');
      setDentists([]);
    } finally {
      setLoading(false);
    }
  };

  // Load available slots when service, dentist, and date are selected
  useEffect(() => {
    if (selectedService && selectedDate && selectedDentist) {
      loadAvailableSlots();
    }
  }, [selectedService, selectedDate, selectedDentist]);

  const loadAvailableSlots = async () => {
    if (!selectedService || !selectedDentist || !selectedDate) {
      return;
    }

    try {
      setLoading(true);
      const dateStr = selectedDate.format('YYYY-MM-DD');
      
      // 🆕 Get service duration - SAME LOGIC AS ONLINE BOOKING
      // Use LONGEST addon duration if service has addons, otherwise use service duration
      let serviceDuration = 15; // default
      
      if (selectedService.serviceAddOns && selectedService.serviceAddOns.length > 0) {
        // Case: Service has addons → use LONGEST addon duration
        const longestAddon = selectedService.serviceAddOns.reduce((longest, addon) => {
          return (addon.durationMinutes > longest.durationMinutes) ? addon : longest;
        }, selectedService.serviceAddOns[0]);
        
        serviceDuration = longestAddon.durationMinutes;
        console.log('🎯 Using LONGEST addon duration:', serviceDuration, 'minutes from', longestAddon.name);
      } else if (selectedService.durationMinutes) {
        // Case: No addons → use service duration
        serviceDuration = selectedService.durationMinutes;
        console.log('🎯 Using service duration:', serviceDuration, 'minutes');
      }
      
      const slotDuration = 15; // Default slot duration
      
      console.log('⏰ Loading slots for:', {
        dentist: selectedDentist.fullName,
        service: selectedService.name,
        hasAddOns: selectedService.serviceAddOns?.length || 0,
        serviceId: selectedService._id,
        date: dateStr,
        serviceDuration: serviceDuration + ' minutes',
        requiredSlots: Math.ceil(serviceDuration / slotDuration),
        allowedRoomTypes: selectedService.allowedRoomTypes
      });
      
      // ⭐ Use getDentistSlotsFuture like patient booking page
      const response = await slotService.getDentistSlotsFuture(selectedDentist._id, {
        date: dateStr,
        shiftName: '', // Get all shifts
        serviceId: selectedService._id, // Pass serviceId for roomType filtering
        minLeadMinutes: 2 // Walk-in: allow slots starting within 2 minutes
      });

      console.log('📋 Slots API Response:', response);

      if (response.success && response.data) {
        let allSlots = [];
        
        // Collect all slots from API response
        if (response.data.shifts) {
          allSlots = [
            ...(response.data.shifts['Ca Sáng'] || []),
            ...(response.data.shifts['Ca Chiều'] || []),
            ...(response.data.shifts['Ca Tối'] || [])
          ];
        } else if (response.data.slots) {
          allSlots = response.data.slots;
        }
        
        console.log(`📊 Total slots: ${allSlots.length}`);
        
        // Filter only active slots (keep all statuses for display)
        const activeSlots = allSlots.filter(slot => slot.isActive === true);
        console.log(`✅ Active slots: ${activeSlots.length}`, activeSlots);
        
        // 🔍 Debug: Show slot status distribution
        const statusCount = activeSlots.reduce((acc, s) => {
          acc[s.status] = (acc[s.status] || 0) + 1;
          return acc;
        }, {});
        console.log('� Slot status distribution:', statusCount);
        
        // ⭐ Group slots by shift first
        const slotsByShift = {
          morning: activeSlots.filter(s => s.shiftName === 'Ca Sáng'),
          afternoon: activeSlots.filter(s => s.shiftName === 'Ca Chiều'),
          evening: activeSlots.filter(s => s.shiftName === 'Ca Tối')
        };
        
        console.log('📦 Slots by shift:', {
          morning: slotsByShift.morning.length,
          afternoon: slotsByShift.afternoon.length,
          evening: slotsByShift.evening.length
        });
        
        // ⭐ Group consecutive slots for each shift
        const groupedSlots = {
          morning: groupConsecutiveSlots(slotsByShift.morning, serviceDuration, slotDuration),
          afternoon: groupConsecutiveSlots(slotsByShift.afternoon, serviceDuration, slotDuration),
          evening: groupConsecutiveSlots(slotsByShift.evening, serviceDuration, slotDuration)
        };
        
        console.log('✨ Grouped slots:', groupedSlots);
        
        setAvailableSlotGroups(groupedSlots);
        
        const totalGroups = groupedSlots.morning.length + 
                           groupedSlots.afternoon.length + 
                           groupedSlots.evening.length;
        
        const availableGroups = [...groupedSlots.morning, ...groupedSlots.afternoon, ...groupedSlots.evening]
          .filter(g => g.isAvailable).length;
        
        console.log('🎯 Total slot groups:', totalGroups, '| Available:', availableGroups);
        
        if (availableGroups === 0) {
          message.warning(`Không có khung giờ phù hợp (cần ${Math.ceil(serviceDuration/slotDuration)} slot liên tục)`);
        } else {
          message.success(`Tìm thấy ${availableGroups} khung giờ khả dụng`);
        }
      } else {
        console.error('❌ Invalid slots response:', response);
        setAvailableSlotGroups({ morning: [], afternoon: [], evening: [] });
        message.error('Không thể tải danh sách slot');
      }
    } catch (error) {
      console.error('❌ Error loading slots:', error);
      message.error('Lỗi khi tải danh sách slot: ' + (error.message || ''));
      setAvailableSlotGroups({ morning: [], afternoon: [], evening: [] });
    } finally {
      setLoading(false);
    }
  };

  // Handle service change - ⭐ Luôn load dentists ngay sau khi chọn service
  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s._id === serviceId);
    setSelectedService(service);
    setSelectedServiceAddOn(null);
    setSelectedDentist(null);
    setSelectedDate(null);
    setAvailableSlotGroups({ morning: [], afternoon: [], evening: [] });
    setSelectedSlotGroup(null);
    form.setFieldsValue({ 
      dentistId: undefined, 
      date: undefined, 
      slotGroup: undefined
    });
    
    // ⭐ Luôn load dentists ngay (không cần chọn serviceAddOn)
    if (service) {
      const serviceDuration = service.durationMinutes || service.duration || 15;
      console.log('🔄 Service selected:', service.name, '| Loading dentists immediately with duration:', serviceDuration);
      loadDentists(serviceDuration, service._id);
    }
  };

  // Handle dentist change
  const handleDentistChange = (dentistId) => {
    const dentist = dentists.find(d => d._id === dentistId);
    setSelectedDentist(dentist);
    setSelectedDate(null);
    setAvailableSlotGroups({ morning: [], afternoon: [], evening: [] }); // ⭐ Reset slot groups
    setSelectedSlotGroup(null); // ⭐ Reset selected slot group
    form.setFieldsValue({ 
      date: undefined, 
      slotGroup: undefined // ⭐ Reset slot group field
    });
  };

  // Handle date change
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setAvailableSlotGroups({ morning: [], afternoon: [], evening: [] }); // ⭐ Reset slot groups
    setSelectedSlotGroup(null); // ⭐ Reset selected slot group
    form.setFieldsValue({ slotGroup: undefined }); // ⭐ Reset slot group field
  };

  // ⭐ Handle slot group selection
  const handleSlotGroupSelect = (slotGroup) => {
    setSelectedSlotGroup(slotGroup);
    console.log('✅ Selected slot group:', slotGroup);
  };

  // Handle form submit - Create offline appointment and immediately check-in
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('📝 Full Form values:', values);
      console.log('📝 Patient fields:', {
        patientName: values.patientName,
        patientPhone: values.patientPhone,
        patientEmail: values.patientEmail,
        patientBirthYear: values.patientBirthYear
      });
      setLoading(true);

      // ⭐ Validate slot group selection
      if (!selectedSlotGroup || !selectedSlotGroup.slotIds || selectedSlotGroup.slotIds.length === 0) {
        message.warning('Vui lòng chọn khung giờ khám');
        setLoading(false);
        return;
      }

      // Debug: Check selectedPatient state
      console.log('🔍 [DEBUG] selectedPatient:', selectedPatient);
      console.log('🔍 [DEBUG] newPatientInfo state:', newPatientInfo);

      // ⭐ Prepare patient info
      // If existing patient selected, use selectedPatient data
      // If new patient, use newPatientInfo state
      let patientInfo;
      
      if (selectedPatient) {
        // Existing patient - use data from selectedPatient object
        const birthYear = selectedPatient.dateOfBirth 
          ? new Date(selectedPatient.dateOfBirth).getFullYear() 
          : null;
        
        patientInfo = {
          name: selectedPatient.fullName,
          phone: selectedPatient.phone || selectedPatient.phoneNumber,
          email: selectedPatient.email || '',
          birthYear: birthYear
        };
        console.log('👥 Using existing patient info:', patientInfo);
      } else {
        // New patient - use state
        patientInfo = {
          name: newPatientInfo.name,
          phone: newPatientInfo.phone,
          email: newPatientInfo.email || '',
          birthYear: newPatientInfo.birthYear
        };
        console.log('👤 Using new patient info from state:', patientInfo);
      }

      // Prepare appointment data
      const appointmentData = {
        patientId: selectedPatient?._id || null, // null for new walk-in patients
        patientInfo: patientInfo,
        serviceId: selectedService._id,
        serviceName: selectedService.name,
        serviceType: selectedService.type,
        dentistId: selectedDentist._id,
        dentistName: selectedDentist.fullName,
        date: selectedDate.format('YYYY-MM-DD'),
        slotIds: selectedSlotGroup?.slotIds || [], // ⭐ Use slot group's slotIds
        notes: values.notes || '',
        isWalkIn: true,
        createdBy: currentUser._id
      };
      
      console.log('🔍 [DEBUG] Selected patient ID:', selectedPatient?._id);
      console.log('🔍 [DEBUG] Current user ID:', currentUser._id);

      // ⭐ Add serviceAddOn info if selected
      if (selectedServiceAddOn) {
        appointmentData.serviceAddOnId = selectedServiceAddOn._id || null;
        appointmentData.serviceAddOnName = selectedServiceAddOn.name;
        appointmentData.serviceAddOnPrice = selectedServiceAddOn.price;
        appointmentData.serviceAddOnUnit = selectedServiceAddOn.unit;
        console.log('✅ ServiceAddOn included:', selectedServiceAddOn.name);
      }

      console.log('📝 Creating walk-in appointment:', appointmentData);

      // Step 1: Create offline appointment
      const createResponse = await appointmentService.createOfflineAppointment(appointmentData);

      if (!createResponse.success || !createResponse.data) {
        message.error(createResponse.message || 'Không thể tạo lịch hẹn');
        return;
      }

      const appointment = createResponse.data;
      console.log('✅ Appointment created:', appointment.appointmentCode);

      // Step 2: Immediately check-in to trigger record creation
      const checkInResponse = await appointmentService.checkInAppointment(
        appointment._id,
        'Walk-in patient - auto check-in'
      );

      if (checkInResponse.success) {
        message.success({
          content: `Tạo lịch hẹn và check-in thành công! Mã lịch: ${appointment.appointmentCode}`,
          duration: 5
        });
        
        console.log('✅ Walk-in appointment checked-in successfully');
        console.log('📋 Record will be auto-created by record-service');
        
        handleReset();
        
        if (onSuccess) {
          onSuccess(appointment);
        }
      } else {
        message.warning({
          content: `Lịch hẹn đã tạo (${appointment.appointmentCode}) nhưng check-in thất bại. Vui lòng check-in thủ công.`,
          duration: 5
        });
      }

    } catch (error) {
      console.error('❌ Create walk-in appointment error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo lịch hẹn';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Reset form and state
  const handleReset = () => {
    form.resetFields();
    setSearchType('phone');
    setSearchResults([]);
    setSelectedPatient(null);
    setIsNewPatient(false);
    setSelectedService(null);
    setSelectedServiceAddOn(null); // ⭐ Reset addOn
    setSelectedDentist(null);
    setSelectedDate(null);
    setAvailableSlotGroups({ morning: [], afternoon: [], evening: [] }); // ⭐ Reset slot groups
    setSelectedSlotGroup(null); // ⭐ Reset selected slot group
    setCurrentStep(0);
  };

  // Navigate between steps
  const handleNext = async () => {
    if (currentStep === 0) {
      try {
        await form.validateFields(['patientName', 'patientPhone', 'patientBirthYear']);
        setCurrentStep(1);
      } catch (error) {
        message.warning('Vui lòng điền đầy đủ thông tin bệnh nhân');
      }
    } else if (currentStep === 1) {
      if (!selectedService) {
        message.warning('Vui lòng chọn dịch vụ');
        return;
      }
      // ⭐ Không cần kiểm tra serviceAddOn nữa
      if (!selectedDentist) {
        message.warning('Vui lòng chọn nha sĩ');
        return;
      }
      setCurrentStep(2);
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <>
      <Card title="Tạo lịch hẹn cho bệnh nhân Walk-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="Bệnh nhân" icon={<UserOutlined />} />
          <Step title="Dịch vụ & Nha sĩ" icon={<MedicineBoxOutlined />} />
          <Step title="Ngày & Giờ" icon={<CalendarOutlined />} />
        </Steps>

        <Form form={form} layout="vertical" onFinish={handleSubmit} preserve={true}>
          {/* Step 0: Patient Search and Info */}
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            {currentStep === 0 && (
            <>
              <Alert
                message="Hướng dẫn"
                description="Tìm kiếm bệnh nhân hiện có bằng số điện thoại, email hoặc tên. Nếu bệnh nhân chưa có trong hệ thống, hãy nhập thông tin mới."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Card title={<Space><SearchOutlined />Tìm kiếm bệnh nhân</Space>} style={{ marginBottom: 16 }}>
                <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
                  <Select
                    value={searchType}
                    onChange={setSearchType}
                    style={{ width: 150 }}
                  >
                    <Option value="phone">Số điện thoại</Option>
                    <Option value="email">Email</Option>
                    <Option value="name">Tên</Option>
                  </Select>
                  <Form.Item name="searchValue" noStyle>
                    <Input
                      placeholder={
                        searchType === 'phone' ? 'Nhập số điện thoại' :
                        searchType === 'email' ? 'Nhập email' :
                        'Nhập tên bệnh nhân'
                      }
                      style={{ flex: 1 }}
                    />
                  </Form.Item>
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSearchPatient}>
                    Tìm kiếm
                  </Button>
                </Space.Compact>

                {searchResults.length > 0 && (
                  <Form.Item label="Kết quả tìm kiếm">
                    <Select
                      placeholder="Chọn bệnh nhân"
                      onChange={handleSelectPatient}
                      value={selectedPatient?._id}
                    >
                      {searchResults.map(patient => (
                        <Option key={patient._id} value={patient._id}>
                          {patient.fullName} - {patient.phone || patient.phoneNumber} - {patient.email}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}

                <Button 
                  type="dashed" 
                  block 
                  icon={<UserAddOutlined />}
                  onClick={handleCreateNewPatient}
                >
                  Tạo bệnh nhân mới
                </Button>
              </Card>

              {selectedPatient && (
                <Alert
                  message="Bệnh nhân đã chọn"
                  description={`${selectedPatient.fullName} - ${selectedPatient.phone || selectedPatient.phoneNumber} - ${selectedPatient.email}`}
                  type="success"
                  showIcon
                  closable
                  onClose={() => setSelectedPatient(null)}
                  style={{ marginBottom: 16 }}
                />
              )}

              <Card title={<Space><UserOutlined />Thông tin bệnh nhân</Space>}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="patientName"
                      label="Họ và tên"
                      rules={[
                        { required: true, message: 'Vui lòng nhập họ tên' },
                        { max: 100, message: 'Tên không quá 100 ký tự' }
                      ]}
                    >
                      <Input 
                        placeholder="Nguyễn Văn A" 
                        disabled={!!selectedPatient}
                        onChange={(e) => setNewPatientInfo({...newPatientInfo, name: e.target.value})}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="patientPhone"
                      label="Số điện thoại"
                      rules={[
                        { required: true, message: 'Vui lòng nhập số điện thoại' },
                        { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại phải là 10-11 chữ số' }
                      ]}
                    >
                      <Input 
                        placeholder="0912345678" 
                        disabled={!!selectedPatient}
                        onChange={(e) => setNewPatientInfo({...newPatientInfo, phone: e.target.value})}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="patientEmail"
                      label="Email (tùy chọn)"
                      rules={[
                        { type: 'email', message: 'Email không hợp lệ' }
                      ]}
                    >
                      <Input 
                        placeholder="example@email.com" 
                        disabled={!!selectedPatient}
                        onChange={(e) => setNewPatientInfo({...newPatientInfo, email: e.target.value})}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="patientBirthYear"
                      label="Năm sinh"
                      rules={[
                        { required: true, message: 'Vui lòng nhập năm sinh' },
                        { 
                          type: 'number', 
                          min: 1900, 
                          max: new Date().getFullYear(),
                          message: `Năm sinh phải từ 1900 đến ${new Date().getFullYear()}`
                        }
                      ]}
                    >
                      <InputNumber 
                        placeholder="1990" 
                        style={{ width: '100%' }}
                        disabled={!!selectedPatient}
                        onChange={(value) => setNewPatientInfo({...newPatientInfo, birthYear: value})}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </>
          )}
          </div>

          {/* Step 1: Service and Dentist Selection */}
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
          {currentStep === 1 && (
            <>
              <Card title={<Space><MedicineBoxOutlined />Chọn dịch vụ</Space>} style={{ marginBottom: 16 }}>
                <Form.Item
                  label="Dịch vụ"
                  rules={[{ required: true, message: 'Vui lòng chọn dịch vụ' }]}
                >
                  <Select
                    placeholder="Chọn dịch vụ khám"
                    onChange={handleServiceChange}
                    value={selectedService?._id}
                  >
                    {services.map(service => (
                      <Option key={service._id} value={service._id}>
                        <Space direction="vertical" size={0}>
                          <Space>
                            <Tag color={service.type === 'examination' ? 'blue' : 'green'}>
                              {service.type === 'examination' ? 'Khám' : 'Điều trị'}
                            </Tag>
                            <Text strong>{service.name}</Text>
                          </Space>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {service.price ? service.price.toLocaleString('vi-VN') : '0'}đ - {service.duration || 0} phút
                          </Text>
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {selectedService && (
                  <Alert
                    message="Thông tin dịch vụ"
                    description={
                      <Space direction="vertical" size={4}>
                        <Text><strong>Tên:</strong> {selectedService.name}</Text>
                        <Text><strong>Loại:</strong> {selectedService.type === 'examination' ? 'Khám' : 'Điều trị'}</Text>
                        <Text><strong>Giá:</strong> {selectedService.price ? selectedService.price.toLocaleString('vi-VN') : '0'}đ</Text>
                        <Text><strong>Thời gian:</strong> {selectedService.duration || 0} phút</Text>
                      </Space>
                    }
                    type="info"
                    showIcon
                  />
                )}

                {/* ⭐ ServiceAddOn Display - Show list instead of Select */}
                {selectedService && selectedService.serviceAddOns && selectedService.serviceAddOns.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Divider orientation="left" style={{ fontSize: 14, fontWeight: 500 }}>
                      📋 Các gói dịch vụ có sẵn
                    </Divider>
                    <Alert
                      message="Thông tin gói dịch vụ"
                      description={
                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                          {selectedService.serviceAddOns.map((addOn, index) => (
                            <Card 
                              key={index}
                              size="small" 
                              style={{ 
                                backgroundColor: '#f9f9f9',
                                border: '1px solid #e8e8e8'
                              }}
                            >
                              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                <Text strong style={{ fontSize: 14, color: '#1890ff' }}>
                                  {index + 1}. {addOn.name}
                                </Text>
                                <Space size="large" wrap>
                                  <Text type="secondary">
                                    <DollarOutlined style={{ color: '#52c41a' }} /> 
                                    <strong> {addOn.price?.toLocaleString('vi-VN') || '0'}đ</strong>/{addOn.unit}
                                  </Text>
                                  <Text type="secondary">
                                    <ClockCircleOutlined style={{ color: '#faad14' }} /> ~{addOn.durationMinutes || 0} phút
                                  </Text>
                                </Space>
                              </Space>
                            </Card>
                          ))}
                        </Space>
                      }
                      type="info"
                      showIcon
                      style={{ backgroundColor: '#e6f7ff', border: '1px solid #91d5ff' }}
                    />
                  </div>
                )}
              </Card>

              <Card title={<Space><UserOutlined />Chọn nha sĩ</Space>}>
                {!selectedService && (
                  <Alert
                    message="Vui lòng chọn dịch vụ trước"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}
                <Form.Item
                  label="Nha sĩ"
                  rules={[{ required: true, message: 'Vui lòng chọn nha sĩ' }]}
                >
                  <Select
                    placeholder={!selectedService ? "Vui lòng chọn dịch vụ trước" : "Chọn nha sĩ"}
                    onChange={handleDentistChange}
                    value={selectedDentist?._id}
                    disabled={!selectedService}
                    showSearch
                    optionFilterProp="children"
                    loading={loading}
                  >
                    {dentists.map(dentist => (
                      <Option key={dentist._id} value={dentist._id}>
                        BS. {dentist.fullName}
                        {dentist.nearestAvailableSlot && (
                          <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                            - Slot gần nhất: {dayjs(dentist.nearestAvailableSlot.date).format('DD/MM/YYYY')} {dentist.nearestAvailableSlot.startTime}
                          </Text>
                        )}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Card>
            </>
          )}
          </div>

          {/* Step 2: Date and Time Slot Selection */}
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
          {currentStep === 2 && (
            <>
              <Card title={<Space><CalendarOutlined />Chọn ngày khám</Space>} style={{ marginBottom: 16 }}>
                <Form.Item
                  label="Ngày khám"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày"
                    onChange={handleDateChange}
                    value={selectedDate}
                    disabledDate={(current) => {
                      return current && current < dayjs().startOf('day');
                    }}
                  />
                </Form.Item>

                {selectedDate && (
                  <>
                    {loading ? (
                      <Spin tip="Đang tải khung giờ...">
                        <div style={{ padding: 50 }} />
                      </Spin>
                    ) : (
                      <>
                        {/* ⭐ Display slot groups by shift - Same style as BookingSelectTime */}
                        {['morning', 'afternoon', 'evening'].map(shift => {
                          const shiftName = shift === 'morning' ? 'Ca Sáng' : shift === 'afternoon' ? 'Ca Chiều' : 'Ca Tối';
                          const slotGroups = availableSlotGroups[shift] || [];
                          
                          return (
                            <div key={shift} style={{ marginBottom: 24 }}>
                              <Title level={5} style={{ margin: 0, marginBottom: 12, color: '#2c5f4f' }}>
                                <ClockCircleOutlined /> {shiftName}
                              </Title>
                              {slotGroups.length === 0 ? (
                                <div style={{ 
                                  padding: '16px', 
                                  textAlign: 'center', 
                                  background: '#f5f5f5', 
                                  borderRadius: 8,
                                  color: '#999'
                                }}>
                                  Không có khung giờ nào trong ca này
                                </div>
                              ) : (
                                <Row gutter={[12, 12]}>
                                  {slotGroups.map(slotGroup => {
                                    const isSelected = selectedSlotGroup?.groupId === slotGroup.groupId;
                                    const isAvailable = slotGroup.isAvailable !== false; // Default true if not set
                                    const slotCount = slotGroup.slots.length;
                                    
                                    return (
                                      <Col key={slotGroup.groupId} xs={12} sm={8} md={6}>
                                        <div 
                                          onClick={() => isAvailable && handleSlotGroupSelect(slotGroup)}
                                          onMouseEnter={(e) => {
                                            if (isAvailable && !isSelected) {
                                              e.currentTarget.style.borderColor = '#40a9ff';
                                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (isAvailable && !isSelected) {
                                              e.currentTarget.style.borderColor = '#d9d9d9';
                                              e.currentTarget.style.boxShadow = 'none';
                                            }
                                          }}
                                          style={{
                                            padding: '12px 8px',
                                            border: '2px solid',
                                            borderColor: isSelected ? '#2c5f4f' : '#d9d9d9',
                                            borderRadius: '8px',
                                            background: isSelected ? '#2c5f4f' : (!isAvailable ? '#fafafa' : 'white'),
                                            color: isSelected ? 'white' : (!isAvailable ? '#999' : '#333'),
                                            cursor: isAvailable ? 'pointer' : 'not-allowed',
                                            opacity: isAvailable ? 1 : 0.6,
                                            textAlign: 'center',
                                            transition: 'all 0.3s ease',
                                            minHeight: '80px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: isSelected ? '0 4px 12px rgba(44, 95, 79, 0.3)' : 'none'
                                          }}
                                        >
                                          <ClockCircleOutlined style={{ fontSize: 18, marginBottom: 6 }} />
                                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                                            {slotGroup.displayTime}
                                          </div>
                                          
                                          {!isAvailable && slotGroup.unavailableReason && (
                                            <Tag 
                                              color={slotGroup.unavailableReason.includes('đặt') && !slotGroup.unavailableReason.includes('giữ') ? 'red' : 'orange'} 
                                              style={{ marginTop: 4, fontSize: 11 }}
                                            >
                                              {slotGroup.unavailableReason.includes('đặt') && !slotGroup.unavailableReason.includes('giữ') ? 'Đã đặt' : 'Đang giữ'}
                                            </Tag>
                                          )}
                                        </div>
                                      </Col>
                                    );
                                  })}
                                </Row>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* ⭐ Show selected slot group info */}
                        {selectedSlotGroup && (
                          <Alert
                            message="Khung giờ đã chọn"
                            description={`${selectedSlotGroup.displayTime} (${selectedSlotGroup.slots.length} slot liên tiếp)`}
                            type="success"
                            showIcon
                            style={{ marginTop: 16 }}
                          />
                        )}
                      </>
                    )}

                    {/* ⭐ Show warning if no slot groups available */}
                    {!loading && 
                     availableSlotGroups.morning.length === 0 && 
                     availableSlotGroups.afternoon.length === 0 && 
                     availableSlotGroups.evening.length === 0 && (
                      <Alert
                        message="Không có khung giờ phù hợp"
                        description="Không có khung giờ liên tiếp đủ dài cho dịch vụ này. Vui lòng chọn ngày khác."
                        type="warning"
                        showIcon
                      />
                    )}
                  </>
                )}
              </Card>

              <Card title={<Space><FileTextOutlined />Ghi chú</Space>}>
                <Form.Item
                  name="notes"
                  label="Ghi chú (tùy chọn)"
                >
                  <TextArea
                    rows={4}
                    placeholder="Ghi chú thêm về lịch hẹn..."
                  />
                </Form.Item>

                {/* ⭐ Price Summary for Walk-in - 🆕 Show deposit like online booking */}
                {selectedService && selectedSlotGroup && scheduleConfig && (
                  <Alert
                    type="info"
                    showIcon
                    icon={<DollarOutlined />}
                    message={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong>💰 Giá dịch vụ (thanh toán sau khám):</Text>
                        <Text strong style={{ fontSize: 18, color: '#2c5f4f' }}>
                          {(selectedSlotGroup.slots.length * scheduleConfig.depositAmount).toLocaleString('vi-VN')} VNĐ
                        </Text>
                      </div>
                    }
                    description={
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">
                          Thời gian dự kiến: {selectedSlotGroup.slots.length} slot × 15 phút = {selectedSlotGroup.slots.length * 15} phút
                        </Text>
                        <br />
                        <Text type="secondary">
                          Tính theo: {scheduleConfig.depositAmount.toLocaleString('vi-VN')} VNĐ × {selectedSlotGroup.slots.length} slot
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          (Walk-in: Thanh toán bằng tiền mặt sau khi hoàn tất khám)
                        </Text>
                      </div>
                    }
                    style={{ marginBottom: 16 }}
                  />
                )}

                {selectedPatient && selectedService && selectedDentist && selectedDate && selectedSlotGroup && (
                  <Alert
                    message="Xác nhận thông tin"
                    description={
                      <Space direction="vertical" size={4}>
                        <Text><strong>Bệnh nhân:</strong> {form.getFieldValue('patientName')} - {form.getFieldValue('patientPhone')}</Text>
                        <Text><strong>Dịch vụ:</strong> {selectedService.name}</Text>
                        {selectedServiceAddOn && (
                          <Text><strong>Gói:</strong> {selectedServiceAddOn.name}</Text>
                        )}
                        <Text><strong>Nha sĩ:</strong> BS. {selectedDentist.fullName}</Text>
                        <Text><strong>Ngày:</strong> {selectedDate.format('DD/MM/YYYY')}</Text>
                        <Text><strong>Giờ khám:</strong> {selectedSlotGroup.displayTime} ({selectedSlotGroup.slots.length} slot)</Text>
                      </Space>
                    }
                    type="success"
                    showIcon
                  />
                )}
              </Card>
            </>
          )}
          </div>

          {/* Navigation Buttons */}
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              {currentStep > 0 && (
                <Button onClick={handlePrev}>
                  Quay lại
                </Button>
              )}
              
              {currentStep < 2 ? (
                <Button type="primary" onClick={handleNext}>
                  Tiếp tục
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<CheckCircleOutlined />}
                >
                  Tạo phiếu
                </Button>
              )}

              <Button onClick={handleReset}>
                Làm mới
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </>
  );
};

export default WalkInAppointmentForm;

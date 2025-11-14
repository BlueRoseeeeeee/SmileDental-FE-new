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
  InputNumber,
  Badge,
  Radio
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
  DollarOutlined,
  StarFilled,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(timezone);
dayjs.extend(utc);
dayjs.extend(isBetween);

import userService from '../../services/userService';
import { servicesService, recordService } from '../../services'; // ⭐ Import recordService
import slotService from '../../services/slotService';
import appointmentService from '../../services/appointmentService';
import scheduleConfigService from '../../services/scheduleConfigService'; // 🆕 Import for deposit calculation
import { groupConsecutiveSlots } from '../../utils/slotGrouping'; // ⭐ Import slot grouping utility
import { getPriceScheduleInfo, formatPrice } from '../../utils/priceScheduleUtils'; // 🆕 Import price schedule utils

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
  const [unusedServices, setUnusedServices] = useState([]); // ⭐ Services from exam records
  const [treatmentIndications, setTreatmentIndications] = useState([]); // 🆕 Treatment indications cho service
  const [serviceSource, setServiceSource] = useState('all'); // 🆕 'all' or 'recommended' - filter by indication
  
  // Services & Dentists
  const [allServices, setAllServices] = useState([]); // 🆕 ALL services loaded from API (cached)
  const [services, setServices] = useState([]); // Filtered services to display
  const [dentists, setDentists] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServiceAddOn, setSelectedServiceAddOn] = useState(null); // ⭐ Add serviceAddOn state
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [examDentistId, setExamDentistId] = useState(null); // 🆕 Dentist đã thực hiện khám
  const [examRecordId, setExamRecordId] = useState(null); // 🆕 Record ID từ chỉ định
  const [requiresAddonSelection, setRequiresAddonSelection] = useState(false); // 🆕 Có bắt buộc chọn addon không
  
  // Slots - ⭐ Use slot groups like patient/booking
  const [selectedDate, setSelectedDate] = useState(null);
  const [workingDates, setWorkingDates] = useState([]); // 🆕 Working dates của dentist
  const [availableSlotGroups, setAvailableSlotGroups] = useState({
    morning: [],
    afternoon: [],
    evening: []
  });
  const [selectedSlotGroup, setSelectedSlotGroup] = useState(null);
  
  // Schedule Config - 🆕 For deposit calculation
  const [scheduleConfig, setScheduleConfig] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  // ⭐ Fix: Check selectedRole from localStorage (role chosen during login)
  const selectedRole = localStorage.getItem('selectedRole');
  const isDentist = selectedRole === 'dentist';
  const [dentistPatients, setDentistPatients] = useState([]); // 🆕 Bệnh nhân của dentist

  // 🆕 Load ALL services on mount (one time only)
  useEffect(() => {
    const loadAllServices = async () => {
      try {
        console.log('🔧 [Initial Load] Loading ALL services...');
        const response = await servicesService.getAllServices();
        
        if (response && response.services) {
          const serviceData = response.services || [];
          const activeServices = serviceData.filter(s => s.isActive);
          console.log(`✅ [Initial Load] Loaded ${activeServices.length} active services`);
          setAllServices(activeServices);
          
          // Initially show only services that don't require exam
          const nonExamServices = activeServices.filter(s => !s.requireExamFirst);
          console.log(`📋 [Initial Load] Showing ${nonExamServices.length} non-exam services initially`);
          setServices(nonExamServices);
        }
      } catch (error) {
        console.error('❌ [Initial Load] Error loading services:', error);
        message.error('Không thể tải danh sách dịch vụ');
      }
    };
    
    loadAllServices();
    loadScheduleConfig(); // 🆕 Load deposit config
    
    // 🆕 Nếu là dentist, load danh sách bệnh nhân của dentist
    if (isDentist && currentUser._id) {
      loadDentistPatients();
    }
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

  // 🆕 Load patients with unused indications for dentist
  const loadDentistPatients = async () => {
    try {
      console.log('👨‍⚕️ [Dentist Mode] Loading patients with unused indications...');
      const response = await recordService.getPatientsWithUnusedIndications(currentUser._id);
      
      if (response.success && response.data) {
        console.log(`✅ [Dentist Mode] Loaded ${response.data.length} patients with unused indications`);
        setDentistPatients(response.data);
      } else {
        console.warn('⚠️ [Dentist Mode] No patients found');
        setDentistPatients([]);
      }
    } catch (error) {
      console.error('❌ [Dentist Mode] Error loading patients:', error);
      setDentistPatients([]);
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
      // 🐛 DEBUG: Check current user role
      console.log('========== DEBUG LOGIN ROLE ==========');
      console.log('📋 currentUser:', currentUser);
      console.log('🎭 currentUser.role:', currentUser.role);
      console.log('🎭 currentUser.activeRole:', currentUser.activeRole);
      console.log('🎭 currentUser.roles:', currentUser.roles);
      console.log('⭐ selectedRole (from localStorage):', selectedRole);
      console.log('✅ isDentist:', isDentist);
      console.log('🔍 searchType:', searchType);
      console.log('🔍 searchValue:', searchValue);
      console.log('👥 dentistPatients.length:', dentistPatients.length);
      console.log('======================================');
      
      console.log('🔍 Searching patients with:', { searchType, searchValue, isDentist });
      
      // 🆕 Nếu là dentist, chỉ tìm trong danh sách bệnh nhân của dentist
      if (isDentist) {
        console.log('👨‍⚕️ [Dentist Mode] Searching in dentist patients only');
        
        if (dentistPatients.length === 0) {
          message.info('Không có bệnh nhân nào có chỉ định chưa sử dụng.');
          setSearchResults([]);
          setSearchLoading(false);
          return;
        }
        
        // 🔍 Tìm kiếm theo searchValue trong dentistPatients (đã có sẵn patientName)
        const value = searchValue.toLowerCase().trim();
        
        // ⚠️ Dentist chỉ có thể tìm theo tên (vì API không trả phone/email)
        if (searchType !== 'name') {
          message.warning('Chế độ nha sĩ: Chỉ có thể tìm kiếm theo tên bệnh nhân.');
          setSearchLoading(false);
          return;
        }
        
        const results = dentistPatients.filter(patient => 
          patient.fullName?.toLowerCase().includes(value) || 
          patient.patientName?.toLowerCase().includes(value)
        );
        
        console.log(`🌟 [Dentist Mode] Filtered results: ${results.length}`, results);
        setSearchResults(results);
        
        if (results.length === 0) {
          message.info('Không tìm thấy bệnh nhân trong danh sách chỉ định của bạn.');
        } else {
          message.success(`Tìm thấy ${results.length} bệnh nhân`);
        }
      } else {
        // Không phải dentist - tìm kiếm bình thường
        // 🐛 DEBUG: Log trước khi gọi API
        console.log('========== BEFORE API CALL ==========');
        console.log('📋 currentUser:', currentUser);
        console.log('🎭 currentUser.role:', currentUser.role);
        console.log('🎭 currentUser.activeRole:', currentUser.activeRole);
        console.log('✅ isDentist:', isDentist);
        console.log('🔍 About to call: userService.getAllPatients(1, 100)');
        console.log('======================================');
        
        const response = await userService.getAllPatients(1, 100);
        console.log('📋 API Response:', response);
        
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
      }
    } catch (error) {
      console.error('❌ Error searching patient:', error);
      message.error('Lỗi khi tìm kiếm bệnh nhân');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectPatient = async (patientId) => {
    console.log('👆 handleSelectPatient called with ID:', patientId);
    console.log('🔍 isDentist:', isDentist);
    console.log('📋 searchResults available:', searchResults.length, searchResults);
    console.log('📋 dentistPatients available:', dentistPatients.length, dentistPatients);
    
    try {
      // 🆕 Tìm patient từ đúng nguồn dữ liệu
      let patient;
      if (isDentist) {
        // Dentist mode: tìm trong dentistPatients
        patient = dentistPatients.find(p => (p._id || p.patientId) === patientId);
        console.log('🔍 Found patient in dentistPatients:', patient);
        
        // 🆕 Fetch full patient info from auth-service
        if (patient) {
          try {
            const fullPatientResponse = await userService.getUserById(patientId);
            console.log('📞 [DEBUG] Full patient response:', fullPatientResponse);
            
            // 🔧 API returns {success, user} not {success, data}
            const userData = fullPatientResponse.user || fullPatientResponse.data;
            
            if (fullPatientResponse.success && userData) {
              console.log('📞 [DEBUG] Full patient data:', userData);
              console.log('📞 [DEBUG] phoneNumber:', userData.phoneNumber);
              console.log('📞 [DEBUG] phone:', userData.phone);
              console.log('📞 [DEBUG] email:', userData.email);
              console.log('📞 [DEBUG] dateOfBirth:', userData.dateOfBirth);
              
              // Merge with full patient data
              // 🔧 API returns 'phone' not 'phoneNumber'
              patient = {
                ...patient,
                phone: userData.phone || userData.phoneNumber,
                phoneNumber: userData.phone || userData.phoneNumber,
                email: userData.email,
                dateOfBirth: userData.dateOfBirth
              };
              console.log('✅ Merged with full patient data:', patient);
            } else {
              console.warn('⚠️ Could not get user data from response');
            }
          } catch (error) {
            console.warn('⚠️ Could not fetch full patient info:', error);
          }
        }
      } else {
        // Other roles: tìm trong searchResults
        patient = searchResults.find(p => p._id === patientId || p.patientId === patientId);
        console.log('🔍 Found patient in searchResults:', patient);
      }
      
      if (patient) {
        // ⭐ Xử lý cả 2 format: dentistPatients và normal searchResults
        const phoneValue = patient.phone || patient.phoneNumber;
        console.log('📞 [DEBUG] phoneValue extracted:', phoneValue);
        
        if (!phoneValue) {
          console.error('❌ Patient phone is missing!');
          message.error('Không tìm thấy số điện thoại của bệnh nhân');
          return;
        }
        
        const patientData = {
          _id: patient._id || patient.patientId,
          fullName: patient.fullName || patient.patientName,
          phone: phoneValue,
          phoneNumber: phoneValue,
          email: patient.email || '',
          dateOfBirth: patient.dateOfBirth
        };
        
        console.log('📝 Final patientData:', patientData);
        
        setSelectedPatient(patientData);
        setIsNewPatient(false);
        
        // Extract year from dateOfBirth
        const birthYear = patientData.dateOfBirth ? new Date(patientData.dateOfBirth).getFullYear() : null;
        
        form.setFieldsValue({
          patientName: patientData.fullName,
          patientPhone: patientData.phone,
          patientEmail: patientData.email,
          patientBirthYear: birthYear
        });
        
        console.log('✅ Form fields set:', {
          name: patientData.fullName,
          phone: patientData.phone,
          email: patientData.email,
          dateOfBirth: patientData.dateOfBirth,
          extractedBirthYear: birthYear
        });
        
        // ⭐ Fetch unused services for selected patient FIRST, then reload services
        await fetchUnusedServicesForPatient(patientData._id);
        
        // 🆕 For dentist role: auto-select dentist's own ID
        if (isDentist && currentUser._id) {
          const dentistInfo = {
            _id: currentUser._id,
            fullName: currentUser.fullName || currentUser.username
          };
          setSelectedDentist(dentistInfo);
          console.log('✅ Auto-selected dentist:', dentistInfo.fullName);
        }
        
        message.success('Đã chọn bệnh nhân: ' + patientData.fullName);
      } else {
        console.error('❌ Patient not found!');
        message.error('Không tìm thấy thông tin bệnh nhân');
      }
    } catch (error) {
      console.error('❌ Error in handleSelectPatient:', error);
      message.error('Lỗi khi tải thông tin bệnh nhân');
    }
  };

  const handleCreateNewPatient = () => {
    setIsNewPatient(true);
    setSelectedPatient(null);
    setSearchResults([]);
    setUnusedServices([]);
    form.resetFields(['patientName', 'patientPhone', 'patientEmail', 'patientBirthYear']);
    // ⭐ Filter to show only non-exam services for new patient
    filterServicesByPatient([], serviceSource);
    message.info('Vui lòng nhập thông tin bệnh nhân mới');
  };

  // ⭐ Fetch unused services from exam records for selected patient
  const fetchUnusedServicesForPatient = async (patientId) => {
    try {
      console.log('🩺 [fetchUnusedServices] Starting for patient:', patientId);
      console.log('🩺 [fetchUnusedServices] API URL:', `${import.meta.env.VITE_RECORD_SERVICE_URL || 'http://localhost:3010'}/api/record/patient/${patientId}/unused-services`);
      
      const response = await recordService.getUnusedServices(patientId);
      console.log('📋 [fetchUnusedServices] RAW Response:', response);
      console.log('📋 [fetchUnusedServices] Response Type:', typeof response);
      console.log('📋 [fetchUnusedServices] Response Keys:', Object.keys(response || {}));
      
      if (response && response.success && response.data) {
        const unusedData = response.data;
        console.log('✅ [fetchUnusedServices] Success! Data:', unusedData);
        console.log('✅ [fetchUnusedServices] Data length:', unusedData.length);
        console.log('✅ [fetchUnusedServices] First item:', unusedData[0]);
        
        // 🆕 Debug: Log serviceAddOn info
        unusedData.forEach((item, idx) => {
          console.log(`📋 Service ${idx + 1}:`, {
            serviceName: item.serviceName,
            serviceAddOnName: item.serviceAddOnName,
            serviceAddOnPrice: item.serviceAddOnPrice,
            serviceAddOnUnit: item.serviceAddOnUnit,
            serviceAddOnDuration: item.serviceAddOnDuration
          });
        });
        
        // ⭐ Set state and filter services with current serviceSource
        setUnusedServices(unusedData);
        filterServicesByPatient(unusedData, serviceSource);
      } else {
        console.warn('⚠️ [fetchUnusedServices] No data or unsuccessful response');
        console.warn('⚠️ [fetchUnusedServices] response.success:', response?.success);
        console.warn('⚠️ [fetchUnusedServices] response.data:', response?.data);
        setUnusedServices([]);
        filterServicesByPatient([], serviceSource);
        
        if (response && !response.success) {
          message.warning('Không tìm thấy dịch vụ chỉ định cho bệnh nhân này');
        }
      }
    } catch (error) {
      console.error('❌ [fetchUnusedServices] Error:', error);
      console.error('❌ [fetchUnusedServices] Error message:', error.message);
      console.error('❌ [fetchUnusedServices] Error response:', error.response?.data);
      console.error('❌ [fetchUnusedServices] Error status:', error.response?.status);
      
      setUnusedServices([]);
      filterServicesByPatient([]);
      
      message.error(`Lỗi tải dịch vụ chỉ định: ${error.response?.data?.message || error.message}`);
    }
  };

  // 🆕 Load exam dentist from record ID
  const loadExamDentistFromRecord = async (recordId) => {
    try {
      console.log('🔍 Loading exam dentist from record:', recordId);
      const response = await recordService.getRecordById(recordId);
      
      if (response.success && response.data && response.data.dentistId) {
        setExamDentistId(response.data.dentistId);
        console.log('✅ Exam dentist ID:', response.data.dentistId, '| Name:', response.data.dentistName);
      }
    } catch (error) {
      console.warn('⚠️ Could not load exam dentist from record:', error.message);
    }
  };

  // 🆕 Helper: Check if service is from indication
  const isServiceFromIndication = (serviceId) => {
    return unusedServices.some(unused => unused.serviceId.toString() === serviceId.toString());
  };

  // 🆕 Helper: Get record ID for service indication
  const getRecordIdForService = (serviceId) => {
    const indication = unusedServices.find(unused => unused.serviceId.toString() === serviceId.toString());
    return indication?.recordId || null;
  };

  // 🆕 Handle service source change (all vs recommended)
  const handleServiceSourceChange = (e) => {
    const source = e.target.value;
    console.log('🔄 Service source changed to:', source);
    setServiceSource(source);
    filterServicesByPatient(unusedServices, source);
  };

  // 🆕 Fetch working dates for selected dentist
  const fetchWorkingDates = async (dentistId, serviceDuration = 15, serviceId = null) => {
    try {
      console.log('📅 Fetching working dates for dentist:', dentistId, 'duration:', serviceDuration);
      const response = await slotService.getDentistWorkingDates(dentistId, serviceDuration, serviceId);
      
      if (response.success && response.data.workingDates) {
        setWorkingDates(response.data.workingDates);
        console.log('✅ Working dates loaded:', response.data.workingDates.length);
        
        if (response.data.workingDates.length === 0) {
          message.warning('Nha sĩ này hiện chưa có lịch làm việc trong thời gian tới');
        }
      } else {
        console.error('Invalid API response format:', response);
        setWorkingDates([]);
      }
    } catch (error) {
      console.error('❌ Error fetching working dates:', error);
      setWorkingDates([]);
    }
  };

  // 🆕 Load treatment indications for selected service and patient
  const loadTreatmentIndications = async (patientId, serviceId) => {
    try {
      console.log('🔍 Checking treatment indications for patient:', patientId, 'service:', serviceId);
      const response = await recordService.getTreatmentIndications(patientId, serviceId);
      const indications = response.data || [];
      
      console.log('✅ Treatment indications found:', indications);
      setTreatmentIndications(indications);
      
      // Check if has specific addon indication
      // Chỉ return true nếu có ADDON được chỉ định cụ thể
      const hasAddonIndication = indications.length > 0 && indications.some(ind => ind.serviceAddOnId);
      console.log('🔍 Has addon indication:', hasAddonIndication, indications);
      return hasAddonIndication;
    } catch (error) {
      console.error('❌ Error fetching treatment indications:', error);
      setTreatmentIndications([]);
      return false;
    }
  };

  // Load services from API
  // 🆕 Filter services based on patient's unused services (no API call)
  const filterServicesByPatient = (unusedSvcs, source = serviceSource) => {
    console.log('🔧 [filterServices] Starting filter...');
    console.log('🔧 [filterServices] allServices count:', allServices.length);
    console.log('🔧 [filterServices] unusedSvcs:', unusedSvcs);
    console.log('🔧 [filterServices] selectedPatient:', selectedPatient);
    console.log('🔧 [filterServices] serviceSource:', source);
    
    if (allServices.length === 0) {
      console.warn('⚠️ [filterServices] No services loaded yet');
      return;
    }
    
    let filtered = [...allServices];
    
    // 🆕 Filter by source (normal or recommended)
    if (source === 'recommended' && unusedSvcs.length > 0) {
      // Chỉ hiển thị dịch vụ được chỉ định
      const recommendedIds = new Set(unusedSvcs.map(s => s.serviceId.toString()));
      filtered = allServices.filter(service => recommendedIds.has(service._id.toString()));
      console.log(`🌟 [filterServices] Showing ONLY recommended services: ${filtered.length}`);
    } else {
      // 🆕 Dịch vụ thường: CHỈ hiển thị dịch vụ KHÔNG yêu cầu khám trước
      // KHÔNG bao gồm dịch vụ được chỉ định
      const recommendedIds = new Set(unusedSvcs.map(s => s.serviceId.toString()));
      filtered = allServices.filter(service => {
        // Loại bỏ dịch vụ chỉ định
        if (recommendedIds.has(service._id.toString())) {
          console.log(`❌ [filterServices] "${service.name}" - is recommended, excluded from normal`);
          return false;
        }
        // Chỉ lấy dịch vụ không yêu cầu khám trước
        if (!service.requireExamFirst) {
          console.log(`✅ [filterServices] "${service.name}" - no exam required`);
          return true;
        }
        console.log(`❌ [filterServices] "${service.name}" - requires exam, excluded`);
        return false;
      });
      console.log(`📊 [filterServices] Showing normal services (non-exam, excluding recommended): ${filtered.length}`);
    }
    
    console.log(`✅ [filterServices] Result: ${filtered.length} services`, filtered.map(s => s.name));
    setServices(filtered);
    
    if (filtered.length === 0 && selectedPatient && source === 'all') {
      message.warning('Không có dịch vụ thường khả dụng. Vui lòng kiểm tra tab "Dịch vụ chỉ định".');
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
      // Priority: selectedServiceAddOn > longest addon > service duration
      let serviceDuration = 15; // default
      
      if (selectedServiceAddOn) {
        // Case 1: User selected a specific addon → USE THAT ADDON's duration
        serviceDuration = selectedServiceAddOn.durationMinutes;
        console.log('🎯 Using selected addon duration:', serviceDuration, 'minutes from', selectedServiceAddOn.name);
      } else if (selectedService.serviceAddOns && selectedService.serviceAddOns.length > 0) {
        // Case 2: Service has addons but none selected → use LONGEST addon duration
        const longestAddon = selectedService.serviceAddOns.reduce((longest, addon) => {
          return (addon.durationMinutes > longest.durationMinutes) ? addon : longest;
        }, selectedService.serviceAddOns[0]);
        
        serviceDuration = longestAddon.durationMinutes;
        console.log('🎯 No addon selected → Using LONGEST addon duration:', serviceDuration, 'minutes from', longestAddon.name);
      } else if (selectedService.durationMinutes) {
        // Case 3: No addons → use service duration
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

  // Handle service change
  const handleServiceChange = async (serviceId) => {
    const service = services.find(s => s._id === serviceId);
    setSelectedService(service);
    setSelectedServiceAddOn(null);
    setSelectedDentist(null);
    setSelectedDate(null);
    setAvailableSlotGroups({ morning: [], afternoon: [], evening: [] });
    setSelectedSlotGroup(null);
    setExamDentistId(null);
    setExamRecordId(null);
    setTreatmentIndications([]);
    setRequiresAddonSelection(false);
    form.setFieldsValue({ 
      dentistId: undefined, 
      date: undefined, 
      slotGroup: undefined
    });
    
    if (!service) return;
    
    // 🆕 Load exam dentist if service is from indication
    if (isServiceFromIndication(service._id)) {
      const recordId = getRecordIdForService(service._id);
      if (recordId) {
        setExamRecordId(recordId);
        loadExamDentistFromRecord(recordId);
      }
    }
    
    // 🆕 Logic mới: Check xem có BẮT BUỘC phải chọn addon không
    // BẮT BUỘC chọn addon KHI:
    // 1. Service có requireExamFirst = true
    // 2. Service có addons
    // 3. Patient đã chọn và có addon được chỉ định
    
    if (service.serviceAddOns && service.serviceAddOns.length > 0) {
      // Service có addons
      if (service.requireExamFirst && selectedPatient && selectedPatient._id) {
        // Service yêu cầu khám trước + có patient → check indications
        const hasAddonIndication = await loadTreatmentIndications(selectedPatient._id, service._id);
        
        if (hasAddonIndication) {
          // Có addon được chỉ định → BẮT BUỘC phải chọn
          console.log('⚠️ Service requires exam AND has addon indication - MUST select addon');
          setRequiresAddonSelection(true);
          setDentists([]); // Clear dentist list
        } else {
          // Không có addon chỉ định → Cho phép skip, load dentists ngay
          console.log('✅ Service has addons but no indication - can skip addon');
          setRequiresAddonSelection(false);
          const serviceDuration = service.durationMinutes || 15;
          loadDentists(serviceDuration, service._id);
        }
      } else {
        // Service không yêu cầu khám hoặc chưa chọn patient → Cho phép skip
        console.log('✅ Service has addons but does not require exam - can skip addon');
        setRequiresAddonSelection(false);
        const serviceDuration = service.durationMinutes || 15;
        loadDentists(serviceDuration, service._id);
      }
    } else {
      // Service không có addons → Load dentists ngay
      console.log('🔄 Service has NO addons - loading dentists immediately');
      const serviceDuration = service.durationMinutes || service.duration || 15;
      loadDentists(serviceDuration, service._id);
    }
  };

  // 🆕 Handle addon selection for walk-in
  const handleServiceAddOnChange = (addonId) => {
    if (!selectedService) return;
    
    const addon = selectedService.serviceAddOns.find(a => a._id === addonId);
    setSelectedServiceAddOn(addon);
    setSelectedDentist(null);
    setSelectedDate(null);
    setAvailableSlotGroups({ morning: [], afternoon: [], evening: [] });
    setSelectedSlotGroup(null);
    form.setFieldsValue({ 
      dentistId: undefined, 
      date: undefined, 
      slotGroup: undefined
    });
    
    // 🆕 Load dentists after selecting addon
    if (addon) {
      const addonDuration = addon.durationMinutes || 15;
      console.log('🔄 Addon selected:', addon.name, '| Loading dentists with duration:', addonDuration);
      loadDentists(addonDuration, selectedService._id);
    }
  };

  // Handle dentist change
  const handleDentistChange = (dentistId) => {
    const dentist = dentists.find(d => d._id === dentistId);
    setSelectedDentist(dentist);
    setSelectedDate(null);
    setWorkingDates([]); // 🆕 Reset working dates
    setAvailableSlotGroups({ morning: [], afternoon: [], evening: [] }); // ⭐ Reset slot groups
    setSelectedSlotGroup(null); // ⭐ Reset selected slot group
    form.setFieldsValue({ 
      date: undefined, 
      slotGroup: undefined // ⭐ Reset slot group field
    });
    
    // 🆕 Load working dates for selected dentist (async, no await needed)
    if (dentist && selectedService) {
      const serviceDuration = selectedServiceAddOn?.durationMinutes 
                           || selectedService?.durationMinutes 
                           || 15;
      console.log('🎯 Loading working dates with duration:', serviceDuration);
      // Call async function without blocking
      fetchWorkingDates(dentist._id, serviceDuration, selectedService._id).catch(err => {
        console.error('Error loading working dates:', err);
      });
    }
  };

  // 🆕 Disable date function - giống BookingSelectDate
  const disabledDate = (current) => {
    // Không cho chọn ngày trong quá khứ
    if (current && current < dayjs().startOf('day')) {
      return true;
    }
    
    // Nếu có workingDates từ API, chỉ cho chọn ngày có trong danh sách
    if (workingDates && workingDates.length > 0) {
      const currentDateStr = current.format('YYYY-MM-DD');
      return !workingDates.some(d => d.date === currentDateStr);
    }
    
    return false;
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
        examRecordId: examRecordId || null, // 🆕 Include recordId if service is from indication
        isWalkIn: true,
        createdBy: currentUser._id
      };
      
      if (examRecordId) {
        console.log('🩺 Exam record ID for hasBeenUsed update:', examRecordId);
      }
      
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
        
        // 🆕 Reset form and reload data
        handleReset();
        
        // 🆕 Reload dentist patients list if dentist role
        if (isDentist && currentUser._id) {
          await loadDentistPatients();
        }
        
        if (onSuccess) {
          onSuccess(appointment);
        }
      } else {
        message.warning({
          content: `Lịch hẹn đã tạo (${appointment.appointmentCode}) nhưng check-in thất bại. Vui lòng check-in thủ công.`,
          duration: 5
        });
        
        // 🆕 Still reset and reload even if check-in failed
        handleReset();
        if (isDentist && currentUser._id) {
          await loadDentistPatients();
        }
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
    setUnusedServices([]); // 🆕 Clear unused services cache
    setServices([]); // 🆕 Clear services list
    setTreatmentIndications([]); // 🆕 Clear treatment indications
    setSelectedService(null);
    setSelectedServiceAddOn(null); // ⭐ Reset addOn
    setSelectedDentist(null);
    setDentists([]); // 🆕 Clear dentists list
    setWorkingDates([]); // 🆕 Clear working dates
    setSelectedDate(null);
    setAvailableSlotGroups({ morning: [], afternoon: [], evening: [] }); // ⭐ Reset slot groups
    setSelectedSlotGroup(null); // ⭐ Reset selected slot group
    setExamDentistId(null); // 🆕 Clear exam dentist
    setExamRecordId(null); // 🆕 Clear exam record
    setRequiresAddonSelection(false); // 🆕 Reset addon requirement
    setCurrentStep(0);
  };

  // Navigate between steps
  const handleNext = async () => {
    if (currentStep === 0) {
      try {
        // 🆕 Dentist chỉ cần chọn bệnh nhân, không cần điền form
        if (isDentist) {
          if (!selectedPatient) {
            message.warning('Vui lòng chọn bệnh nhân từ danh sách');
            return;
          }
          
          // Auto-select first service indication
          if (unusedServices.length > 0) {
            const firstService = unusedServices[0];
            
            // Find full service object from allServices
            const fullService = allServices.find(s => s._id === firstService.serviceId);
            if (fullService) {
              setSelectedService(fullService);
              setExamRecordId(firstService.recordId);
              console.log('✅ Auto-selected service:', fullService.name);
              
              // If has addon indication, auto-select it
              if (firstService.serviceAddOnId && fullService.serviceAddOns) {
                const addon = fullService.serviceAddOns.find(a => a._id === firstService.serviceAddOnId);
                if (addon) {
                  setSelectedServiceAddOn(addon);
                  console.log('✅ Auto-selected addon:', addon.name);
                }
              }
              
              // Load working dates for dentist
              const serviceDuration = firstService.serviceAddOnDuration || fullService.durationMinutes || 15;
              fetchWorkingDates(currentUser._id, serviceDuration, fullService._id).catch(err => {
                console.error('Error loading working dates:', err);
              });
            }
          }
          
          setCurrentStep(1); // Skip to date/time selection
        } else {
          // Non-dentist: validate form fields
          await form.validateFields(['patientName', 'patientPhone', 'patientBirthYear']);
          
          // 🆕 Nếu là bệnh nhân mới (không có selectedPatient), filter để chỉ hiển thị dịch vụ không yêu cầu khám trước
          if (!selectedPatient) {
            console.log('🆕 [handleNext] New patient - filtering to show only non-exam services');
            filterServicesByPatient([], 'all'); // Empty unusedServices, source = 'all' (normal services)
          }
          // Nếu có selectedPatient, thì đã gọi fetchUnusedServicesForPatient rồi
          
          setCurrentStep(1);
        }
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
          {isDentist ? (
            <>
              <Step title="Bệnh nhân & Dịch vụ" icon={<UserOutlined />} />
              <Step title="Ngày & Giờ" icon={<CalendarOutlined />} />
            </>
          ) : (
            <>
              <Step title="Bệnh nhân" icon={<UserOutlined />} />
              <Step title="Dịch vụ & Nha sĩ" icon={<MedicineBoxOutlined />} />
              <Step title="Ngày & Giờ" icon={<CalendarOutlined />} />
            </>
          )}
        </Steps>

        <Form form={form} layout="vertical" onFinish={handleSubmit} preserve={true}>
          {/* Step 0: Patient Search and Info */}
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            {currentStep === 0 && (
            <>
              <Card title={<Space><SearchOutlined />{isDentist ? 'Chọn bệnh nhân có chỉ định' : 'Tìm kiếm bệnh nhân'}</Space>} style={{ marginBottom: 16 }}>
                {/* 🆕 Dentist mode: Hiển thị danh sách bệnh nhân có chỉ định */}
                {isDentist ? (
                  <>
                    <Alert
                      message="Chế độ nha sĩ"
                      description={`Hiển thị ${dentistPatients.length} bệnh nhân có chỉ định chưa sử dụng từ hồ sơ khám của bạn.`}
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    
                    {dentistPatients.length > 0 ? (
                      <Form.Item 
                        label={
                          <Space>
                            <span>Chọn bệnh nhân</span>
                            <Badge 
                              count={dentistPatients.length} 
                              showZero 
                              size="small"
                              style={{ backgroundColor: '#52c41a' }} 
                            />
                          </Space>
                        }
                        rules={[{ required: true, message: 'Vui lòng chọn bệnh nhân' }]}
                      >
                        <Select
                          placeholder="Chọn bệnh nhân từ danh sách chỉ định"
                          onChange={handleSelectPatient}
                          value={selectedPatient?._id}
                          showSearch
                          listHeight={400}
                          optionLabelProp="label"
                          filterOption={(input, option) => {
                            const patient = dentistPatients.find(p => (p._id || p.patientId) === option.value);
                            const name = patient?.fullName || patient?.patientName || '';
                            return name.toLowerCase().includes(input.toLowerCase());
                          }}
                        >
                          {dentistPatients.map(patient => {
                            const id = patient._id || patient.patientId;
                            const name = patient.fullName || patient.patientName;
                            
                            return (
                              <Option 
                                key={id} 
                                value={id}
                                label={name}
                                style={{ height: 'auto', padding: '8px 12px' }}
                              >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <Text strong style={{ fontSize: 14 }}>{name}</Text>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    Mã BA: {patient.recordCode} • {patient.unusedIndicationsCount} chỉ định chưa sử dụng
                                  </Text>
                                </div>
                              </Option>
                            );
                          })}
                        </Select>
                      </Form.Item>
                    ) : (
                      <Alert
                        message="Không có bệnh nhân"
                        description="Hiện tại không có bệnh nhân nào có chỉ định chưa sử dụng từ hồ sơ khám của bạn."
                        type="warning"
                        showIcon
                      />
                    )}
                    
                    {/* 🆕 Hiển thị thông tin dịch vụ chỉ định sau khi chọn bệnh nhân */}
                    {selectedPatient && unusedServices.length > 0 && (
                      <Card 
                        title={
                          <Space>
                            <MedicineBoxOutlined style={{ color: '#52c41a' }} />
                            <span>Dịch vụ được chỉ định ({unusedServices.length})</span>
                          </Space>
                        }
                        style={{ marginTop: 16, borderColor: '#52c41a' }}
                        headStyle={{ backgroundColor: '#f6ffed' }}
                      >
                        <Alert
                          message="Thông tin dịch vụ chỉ định"
                          description="Danh sách các dịch vụ và gói dịch vụ được chỉ định từ hồ sơ khám trước"
                          type="success"
                          showIcon
                          style={{ marginBottom: 16 }}
                        />
                        
                        {unusedServices.map((service, index) => (
                          <Card
                            key={index}
                            size="small"
                            style={{ 
                              marginBottom: index < unusedServices.length - 1 ? 12 : 0,
                              backgroundColor: '#fafafa',
                              border: '1px solid #d9d9d9'
                            }}
                          >
                            <Row gutter={[16, 8]}>
                              <Col span={24}>
                                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                  {/* Tên dịch vụ */}
                                  <div>
                                    <Tag color="blue" style={{ marginBottom: 4 }}>STT {index + 1}</Tag>
                                    <Text strong style={{ fontSize: 15, color: '#1890ff' }}>
                                      {service.serviceName}
                                    </Text>
                                  </div>
                                  
                                  {/* Gói dịch vụ con */}
                                  {service.serviceAddOnName && (
                                    <div style={{ 
                                      padding: '8px 12px', 
                                      backgroundColor: '#e6f7ff', 
                                      borderLeft: '3px solid #1890ff',
                                      borderRadius: '4px'
                                    }}>
                                      <Space direction="vertical" size={4}>
                                        <Text strong style={{ fontSize: 13 }}>
                                          📦 Gói dịch vụ: {service.serviceAddOnName}
                                        </Text>
                                        {service.serviceAddOnPrice && (
                                          <Text type="secondary">
                                            💰 Giá: <strong style={{ color: '#52c41a' }}>
                                              {service.serviceAddOnPrice.toLocaleString('vi-VN')}đ
                                            </strong>
                                            {service.serviceAddOnUnit && ` / ${service.serviceAddOnUnit}`}
                                          </Text>
                                        )}
                                        {service.serviceAddOnDuration && (
                                          <Text type="secondary">
                                            ⏱️ Thời gian: <strong>{service.serviceAddOnDuration} phút</strong>
                                          </Text>
                                        )}
                                      </Space>
                                    </div>
                                  )}
                                  
                                  {/* Thông tin record */}
                                  <div style={{ paddingTop: 4 }}>
                                    <Space split={<Divider type="vertical" />} wrap>
                                      <Text type="secondary" style={{ fontSize: 12 }}>
                                        <FileTextOutlined /> Hồ sơ: <strong>{service.recordCode || 'N/A'}</strong>
                                      </Text>
                                      {service.dentistName && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                          <UserOutlined /> BS: {service.dentistName}
                                        </Text>
                                      )}
                                      {service.createdDate && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                          📅 {dayjs(service.createdDate).format('DD/MM/YYYY')}
                                        </Text>
                                      )}
                                    </Space>
                                  </div>
                                </Space>
                              </Col>
                            </Row>
                          </Card>
                        ))}
                      </Card>
                    )}
                  </>
                ) : (
                  <>
                    {/* Admin/Manager/Receptionist mode: Form tìm kiếm */}
                    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                      <Col xs={24} sm={6} md={5}>
                        <Select
                          value={searchType}
                          onChange={setSearchType}
                          style={{ width: '100%' }}
                        >
                          <Option value="phone">Số điện thoại</Option>
                          <Option value="email">Email</Option>
                          <Option value="name">Tên</Option>
                        </Select>
                      </Col>
                      <Col xs={24} sm={14} md={16}>
                        <Form.Item name="searchValue" noStyle>
                          <Input
                            placeholder={
                              searchType === 'phone' ? 'Nhập số điện thoại' :
                              searchType === 'email' ? 'Nhập email' :
                              'Nhập tên bệnh nhân'
                            }
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={4} md={3}>
                        <button style={{ width: '100%', height: '100%', borderRadius: '5px', background:'#2596be', border: 'none', color: 'white', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} type="primary" icon={<SearchOutlined />} onClick={handleSearchPatient}>
                          <SearchOutlined /> Tìm kiếm
                        </button>
                      </Col>
                    </Row>

                    {searchResults.length > 0 && (
                      <Form.Item 
                        label={
                          <Space>
                            <span>Kết quả tìm kiếm</span>
                            <Badge 
                              count={searchResults.length} 
                              showZero 
                              size="small"
                              style={{ backgroundColor: '#ff4d4f' }} 
                            />
                          </Space>
                        }
                      >
                        <Select
                          placeholder="Chọn bệnh nhân"
                          onChange={handleSelectPatient}
                          value={selectedPatient?._id}
                        >
                          {searchResults.map(patient => {
                            const id = patient._id || patient.patientId;
                            const name = patient.fullName || patient.patientName;
                            const phone = patient.phone || patient.phoneNumber || 'N/A';
                            const email = patient.email || 'N/A';
                            
                            return (
                              <Option key={id} value={id}>
                                {name} - {phone} - {email}
                              </Option>
                            );
                          })}
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
                  </>
                )}
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

              {/* ⭐ Chỉ hiển thị form thông tin bệnh nhân cho non-dentist hoặc khi chưa chọn bệnh nhân */}
              {!isDentist && (
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
              )}
            </>
          )}
          </div>

          {/* Step 1: Service and Dentist Selection */}
          {!isDentist && (
            <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            {currentStep === 1 && (
            <>
              <Card title={<Space><MedicineBoxOutlined />Chọn dịch vụ</Space>} style={{ marginBottom: 16 }}>
                {/* 🆕 Service Source Filter - chỉ hiện khi có dịch vụ được chỉ định */}
                {unusedServices.length > 0 && selectedPatient && (
                  <div style={{ marginBottom: 16 }}>
                    <Radio.Group 
                      value={serviceSource} 
                      onChange={handleServiceSourceChange}
                      buttonStyle="solid"
                      size="large"
                      style={{ width: '100%', display: 'flex', gap: '8px' }}
                    >
                      <Radio.Button value="all" style={{ flex: 1, textAlign: 'center' }}>
                        Dịch vụ thường
                      </Radio.Button>
                      <Radio.Button value="recommended" style={{ flex: 1, textAlign: 'center' }}>
                        <StarFilled style={{ color: '#faad14' }} /> Dịch vụ chỉ định ({unusedServices.length})
                      </Radio.Button>
                    </Radio.Group>
                  </div>
                )}

                <Form.Item
                  label="Dịch vụ"
                  rules={[{ required: true, message: 'Vui lòng chọn dịch vụ' }]}
                >
                  <Select
                    placeholder="Chọn dịch vụ khám"
                    onChange={handleServiceChange}
                    value={selectedService?._id}
                    showSearch
                    filterOption={(input, option) => {
                      // Tìm kiếm theo tên dịch vụ từ service object
                      const service = services.find(s => s._id === option.value);
                      if (!service) return false;
                      const serviceName = service.name?.toLowerCase() || '';
                      const searchTerm = input.toLowerCase();
                      return serviceName.includes(searchTerm);
                    }}
                    optionFilterProp="children"
                  >
                    {services.map(service => {
                      const isFromIndication = isServiceFromIndication(service._id);
                      // Map service type to Vietnamese
                      const serviceTypeVN = service.type === 'exam' ? 'Khám' : service.type === 'treatment' ? 'Điều trị' : service.type;
                      
                      return (
                        <Option key={service._id} value={service._id}>
                          <Space>
                            <Tag color={service.type === 'exam' ? 'blue' : 'green'}>
                              {serviceTypeVN}
                            </Tag>
                            <Text strong>{service.name}</Text>
                            {isFromIndication && (
                              <Tag color="gold" icon={<StarFilled />}>
                                Chỉ định nha sĩ
                              </Tag>
                            )}
                          </Space>
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>

                {/* ⭐ ServiceAddOn Selection - CHỈ hiển thị khi BẮT BUỘC phải chọn */}
                {requiresAddonSelection && selectedService && selectedService.serviceAddOns && selectedService.serviceAddOns.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Divider orientation="left" style={{ fontSize: 14, fontWeight: 500 }}>
                      📋 Chọn gói dịch vụ
                    </Divider>
                    {treatmentIndications.length > 0 && treatmentIndications[0].serviceAddOnId && (
                      <Alert
                        message="Dịch vụ được chỉ định"
                        description={
                          <span>
                            Bệnh nhân đã được chỉ định gói: <strong>{treatmentIndications[0].serviceAddOnName}</strong>
                          </span>
                        }
                        type="success"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    )}
                    <Form.Item
                      label="Gói dịch vụ"
                      rules={[{ required: true, message: 'Vui lòng chọn gói dịch vụ đã được chỉ định' }]}
                    >
                      <Select
                        placeholder="Chọn gói dịch vụ đã được chỉ định"
                        onChange={handleServiceAddOnChange}
                        value={selectedServiceAddOn?._id}
                      >
                        {selectedService.serviceAddOns
                          .filter(addon => {
                            // CHỈ hiển thị addon đã được chỉ định
                            if (treatmentIndications.length > 0 && treatmentIndications[0].serviceAddOnId) {
                              return addon._id === treatmentIndications[0].serviceAddOnId;
                            }
                            return true; // Fallback: hiển thị tất cả
                          })
                          .map((addon) => {
                            const priceInfo = getPriceScheduleInfo(addon.priceSchedules, addon.price);
                            const { activeSchedule, effectivePrice, hasActiveSchedule } = priceInfo;
                            
                            return (
                              <Option key={addon._id} value={addon._id}>
                                <Space direction="vertical" size={0}>
                                  <Space>
                                    <Text strong>{addon.name}</Text>
                                    <Tag color="success" icon={<CheckCircleOutlined />}>
                                      Đã chỉ định
                                    </Tag>
                                  </Space>
                                  <Space size="large">
                                    <Space size={4} direction="vertical" align="start">
                                      {hasActiveSchedule ? (
                                        <>
                                          <Space size={4}>
                                            <DollarOutlined style={{ color: '#ff4d4f' }} />
                                            <Text delete type="secondary" style={{ fontSize: 12 }}>
                                              {formatPrice(addon.price)}
                                            </Text>
                                          </Space>
                                          <Space size={4}>
                                            <Text strong style={{ fontSize: 14, color: '#ff4d4f' }}>
                                              {formatPrice(activeSchedule.price)}
                                            </Text>
                                            <Tag color="red" style={{ fontSize: 10, margin: 0 }}>
                                              Giảm giá
                                            </Tag>
                                          </Space>
                                        </>
                                      ) : (
                                        <Space size={4}>
                                          <DollarOutlined style={{ color: '#d4860f' }} />
                                          <Text strong style={{ fontSize: 14, color: '#d4860f' }}>
                                            {formatPrice(addon.price)}
                                          </Text>
                                          <Text type="secondary" style={{ fontSize: 12 }}>/ {addon.unit}</Text>
                                        </Space>
                                      )}
                                    </Space>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      <ClockCircleOutlined /> {addon.durationMinutes}p
                                    </Text>
                                  </Space>
                                </Space>
                              </Option>
                            );
                          })
                        }
                      </Select>
                    </Form.Item>
                  </div>
                )}

                {/* 🆕 Hiển thị danh sách addon để tham khảo (nếu có addon nhưng KHÔNG bắt buộc chọn) */}
                {!requiresAddonSelection && selectedService && selectedService.serviceAddOns && selectedService.serviceAddOns.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Divider orientation="left" style={{ fontSize: 14, fontWeight: 500 }}>
                      📋 Các gói dịch vụ có sẵn (tham khảo)
                    </Divider>
                    <Alert
                      message="Thông tin gói dịch vụ"
                      description={
                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                          {selectedService.serviceAddOns.map((addOn, index) => {
                            const priceInfo = getPriceScheduleInfo(addOn.priceSchedules, addOn.price);
                            const { activeSchedule, upcomingSchedules, effectivePrice, hasActiveSchedule, hasUpcomingSchedules } = priceInfo;
                            
                            return (
                              <Card 
                                key={index}
                                size="small" 
                                style={{ 
                                  backgroundColor: '#f9f9f9',
                                  border: '1px solid #e8e8e8'
                                }}
                              >
                                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                  <Text strong style={{ fontSize: 14, color: '#1890ff' }}>
                                    {index + 1}. {addOn.name}
                                  </Text>
                                  
                                  {/* Price Display */}
                                  <Space size="large" wrap>
                                    <Space size={4} direction="vertical" align="start">
                                      {hasActiveSchedule ? (
                                        <>
                                          <Space size={4}>
                                            <DollarOutlined style={{ color: '#ff4d4f' }} />
                                            <Text delete type="secondary">
                                              {formatPrice(addOn.price)}
                                            </Text>
                                          </Space>
                                          <Space size={4}>
                                            <Text strong style={{ color: '#ff4d4f' }}>
                                              {formatPrice(activeSchedule.price)}
                                            </Text>
                                            <Tag color="red" style={{ fontSize: 10 }}>
                                              Giảm giá
                                            </Tag>
                                          </Space>
                                        </>
                                      ) : (
                                        <Space size={4}>
                                          <DollarOutlined style={{ color: '#52c41a' }} />
                                          <Text strong>
                                            {formatPrice(addOn.price)}
                                          </Text>
                                          <Text type="secondary">/ {addOn.unit}</Text>
                                        </Space>
                                      )}
                                    </Space>
                                    <Text type="secondary">
                                      <ClockCircleOutlined style={{ color: '#faad14' }} /> ~{addOn.durationMinutes || 0} phút
                                    </Text>
                                  </Space>
                                  
                                  {/* Upcoming Price Schedules */}
                                  {hasUpcomingSchedules && (
                                    <div style={{ 
                                      background: '#e6f7ff', 
                                      border: '1px solid #91d5ff',
                                      borderRadius: 4,
                                      padding: '6px 10px'
                                    }}>
                                      <Space size={4} wrap style={{ width: '100%' }}>
                                        <Space align="center" size={4}>
                                          <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                                          <Text strong style={{ fontSize: 12, color: '#1890ff' }}>
                                            Lịch giá sắp tới:
                                          </Text>
                                        </Space>
                                        <Text style={{ fontSize: 12, color: '#1890ff', fontWeight: 600 }}>
                                          {formatPrice(upcomingSchedules[0].price)}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                          ({new Date(upcomingSchedules[0].startDate).toLocaleDateString('vi-VN')} - {new Date(upcomingSchedules[0].endDate).toLocaleDateString('vi-VN')})
                                        </Text>
                                      </Space>
                                    </div>
                                  )}
                                </Space>
                              </Card>
                            );
                          })}
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
                {requiresAddonSelection && !selectedServiceAddOn && (
                  <Alert
                    message="Vui lòng chọn gói dịch vụ đã được chỉ định trước"
                    description="Dịch vụ này có gói đã được chỉ định, vui lòng chọn gói trước khi chọn nha sĩ"
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}
                {examRecordId && examDentistId && (
                  <Alert
                    message="Nha sĩ đã khám"
                    description="Bệnh nhân đã được khám bởi nha sĩ được đánh dấu bên dưới"
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
                    placeholder={
                      !selectedService ? "Vui lòng chọn dịch vụ trước" :
                      (requiresAddonSelection && !selectedServiceAddOn) ? "Vui lòng chọn gói dịch vụ trước" :
                      "Chọn nha sĩ"
                    }
                    onChange={handleDentistChange}
                    value={selectedDentist?._id}
                    disabled={!selectedService || (requiresAddonSelection && !selectedServiceAddOn)}
                    showSearch
                    optionFilterProp="children"
                    loading={loading}
                  >
                    {dentists.map(dentist => {
                      const isExamDentist = examDentistId && dentist._id === examDentistId;
                      return (
                        <Option key={dentist._id} value={dentist._id}>
                          <Space>
                            <Text>BS. {dentist.fullName}</Text>
                            {isExamDentist && (
                              <Tag color="green" icon={<CheckCircleOutlined />}>
                                Đã khám
                              </Tag>
                            )}
                            {dentist.nearestAvailableSlot && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                - Slot: {dayjs(dentist.nearestAvailableSlot.date).format('DD/MM/YYYY')} {dentist.nearestAvailableSlot.startTime}
                              </Text>
                            )}
                          </Space>
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>
              </Card>
            </>
            )}
            </div>
          )}

          {/* Step 2: Date and Time Slot Selection (Step 1 for dentist) */}
          <div style={{ display: (isDentist ? currentStep === 1 : currentStep === 2) ? 'block' : 'none' }}>
          {(isDentist ? currentStep === 1 : currentStep === 2) && (
            <>
              <Card title={<Space><CalendarOutlined />Chọn ngày khám</Space>} style={{ marginBottom: 16 }}>
                {!selectedDentist && (
                  <Alert
                    message="Vui lòng chọn nha sĩ trước"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}
                {selectedDentist && workingDates.length === 0 && (
                  <Alert
                    message="Đang tải lịch làm việc của nha sĩ..."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}
                <Form.Item
                  label="Ngày khám"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày nha sĩ làm việc"
                    onChange={handleDateChange}
                    value={selectedDate}
                    disabledDate={disabledDate}
                    disabled={!selectedDentist || workingDates.length === 0}
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
              
              {/* Dentist has 2 steps (0,1), others have 3 steps (0,1,2) */}
              {(isDentist ? currentStep < 1 : currentStep < 2) ? (
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

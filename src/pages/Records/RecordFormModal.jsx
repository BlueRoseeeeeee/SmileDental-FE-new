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

import React, { useState, useEffect, useRef } from 'react';
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
  ExperimentOutlined,
  CloseOutlined,
  UndoOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';
import recordService from '../../services/recordService';
import { servicesService } from '../../services/servicesService';
import userService from '../../services/userService';
import roomService from '../../services/roomService';
import medicineService from '../../services/medicineService';
import { getPriceScheduleInfo } from '../../utils/priceScheduleUtils';
import PrescriptionForm from './PrescriptionForm';

dayjs.extend(timezone);
dayjs.extend(utc);
dayjs.extend(isBetween);

const { Option } = Select;

const RecordFormModal = ({ visible, mode, record, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false); // For form submit
  const [loadingData, setLoadingData] = useState(false); // For loading initial data
  const [activeTab, setActiveTab] = useState('1');
  const [recordType, setRecordType] = useState('exam');
  const prescriptionFormRef = useRef(null); // ✅ Ref for PrescriptionForm
  
  // 🆕 Helper function to get price schedule info for addon
  const getPriceScheduleForAddon = (addon) => {
    if (!addon) return { basePrice: 0, schedulePrice: null };
    
    const basePrice = addon.price || 0;
    
    // Get exam date from state or form (use current date as fallback)
    const dateToCheck = examDate || form.getFieldValue('date') || dayjs();
    
    console.log('💰 Checking price schedule for:', addon.name, 'on date:', dayjs(dateToCheck).format('YYYY-MM-DD'));
    
    // Check if exam date falls within any active price schedule
    if (addon.priceSchedules && addon.priceSchedules.length > 0) {
      const activeSchedule = addon.priceSchedules.find(schedule => {
        if (!schedule.isActive) return false;
        
        const startDate = dayjs(schedule.startDate).tz('Asia/Ho_Chi_Minh').startOf('day');
        const endDate = dayjs(schedule.endDate).tz('Asia/Ho_Chi_Minh').endOf('day');
        const checkDate = dayjs(dateToCheck).tz('Asia/Ho_Chi_Minh').startOf('day');
        
        const isInRange = checkDate.isBetween(startDate, endDate, null, '[]');
        
        console.log('📅 Schedule check:', {
          schedulePri: schedule.price,
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
          checkDate: checkDate.format('YYYY-MM-DD'),
          isActive: schedule.isActive,
          isInRange
        });
        
        return isInRange;
      });
      
      if (activeSchedule) {
        console.log('✅ Found active schedule price:', activeSchedule.price);
        return { basePrice, schedulePrice: activeSchedule.price };
      }
    }
    
    console.log('📋 No active schedule, using base price only');
    return { basePrice, schedulePrice: null };
  };
  
  // 🆕 Helper function to calculate effective price based on exam date and price schedules
  const getEffectivePrice = (addon) => {
    const { basePrice, schedulePrice } = getPriceScheduleForAddon(addon);
    return schedulePrice !== null ? schedulePrice : basePrice;
  };
  
  // 🆕 Track if record was modified (to call onSuccess when closing)
  const [recordModified, setRecordModified] = useState(false);
  
  // 🆕 Track temporary main service addon selection (before saving)
  const [tempServiceAddOnId, setTempServiceAddOnId] = useState(null);
  
  // 🆕 Track quantity for main service
  const [tempMainServiceQuantity, setTempMainServiceQuantity] = useState(1);
  
  // Real data from APIs
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [medicines, setMedicines] = useState([]);
  
  // ServiceAddOns for selected services in treatmentIndications
  const [serviceAddOnsMap, setServiceAddOnsMap] = useState({}); // { serviceId: [addOns] }
  const [loadingAddOns, setLoadingAddOns] = useState(false);
  
  // 🆕 Additional Services state
  const [addServiceForm] = Form.useForm();
  const [selectedMainServiceAddOns, setSelectedMainServiceAddOns] = useState([]);
  const [mainServiceDetails, setMainServiceDetails] = useState(null);
  const [selectedAddServiceId, setSelectedAddServiceId] = useState(null); // Track selected service in Add Service form
  
  // 🆕 Temporary additional services (before saving to DB)
  const [tempAdditionalServices, setTempAdditionalServices] = useState([]);
  
  // 🆕 Track service IDs to be deleted (will be deleted when user clicks "Cập nhật")
  const [servicesToDelete, setServicesToDelete] = useState([]);
  
  // 🆕 Track editing state for additional services (_id -> { quantity, notes })
  const [editingAdditionalServices, setEditingAdditionalServices] = useState({});
  
  // 🆕 Inline form state
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  
  // 🆕 Delete confirmation modal state
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    visible: false,
    serviceItemId: null,
    serviceName: ''
  });
  
  // 🆕 Track exam date for price calculation
  const [examDate, setExamDate] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // 🆕 Debug effect to track state changes that affect total cost
  useEffect(() => {
    if (mode === 'edit' && record) {
      console.log('🔄 [Total Cost Trigger] State changed:', {
        tempMainServiceQuantity,
        tempServiceAddOnId,
        tempAdditionalServicesCount: tempAdditionalServices.length,
        servicesToDeleteCount: servicesToDelete.length,
        existingAdditionalServicesCount: record.additionalServices?.length || 0,
        editingAdditionalServicesCount: Object.keys(editingAdditionalServices).length
      });
    }
  }, [tempMainServiceQuantity, tempServiceAddOnId, tempAdditionalServices, servicesToDelete, editingAdditionalServices, mode, record]);

  useEffect(() => {
    if (visible) {
      // ✅ Load data first, then populate form
      const initializeModal = async () => {
        // Always load data first (patients, services, dentists, rooms, medicines)
        await loadData();
        
        if (mode === 'edit' && record) {
          // Populate form with record data AFTER data is loaded
          const recordDate = record.date ? dayjs(record.date) : dayjs();
          form.setFieldsValue({
            ...record,
            date: recordDate,
            indications: record.indications || [],
            treatmentIndications: record.treatmentIndications || []
          });
          setRecordType(record.type || 'exam');
          setExamDate(recordDate); // 🆕 Set exam date for price calculation
          
          // 🆕 Initialize temp service addon ID from record
          setTempServiceAddOnId(record.serviceAddOnId || null);
          
          // 🆕 Initialize temp main service quantity from record
          setTempMainServiceQuantity(record.quantity || 1);
          
          // 🆕 Reset temp additional services and services to delete
          setTempAdditionalServices([]);
          setServicesToDelete([]);
          
          // 🆕 Load main service details for additional services tab
          await loadMainServiceDetails();
          
          // 🆕 Load serviceAddOns for all unique serviceIds in edit mode
          const serviceIds = new Set();
          
          // Dịch vụ bổ sung
          if (Array.isArray(record.additionalServices)) {
            record.additionalServices.forEach(svc => {
              if (svc.serviceId) serviceIds.add(svc.serviceId);
            });
          }
          
          // Chỉ định điều trị
          if (Array.isArray(record.treatmentIndications)) {
            record.treatmentIndications.forEach(ind => {
              if (ind.serviceId) serviceIds.add(ind.serviceId);
            });
          }
          
          // Load all unique serviceIds
          console.log('🔄 Loading serviceAddOns for serviceIds:', Array.from(serviceIds));
          for (const sid of serviceIds) {
            await loadServiceAddOns(sid);
          }
        } else {
          // Reset form for create mode
          const today = dayjs();
          form.resetFields();
          form.setFieldsValue({
            date: today,
            type: 'exam',
            status: 'pending',
            priority: 'normal',
            paymentStatus: 'unpaid'
          });
          setRecordType('exam');
          setExamDate(today); // 🆕 Set default exam date for price calculation
          setServiceAddOnsMap({});
          setSelectedMainServiceAddOns([]);
          setMainServiceDetails(null);
          setTempServiceAddOnId(null); // Reset temp addon selection
        }
      };
      
      initializeModal();
    }
  }, [visible, mode, record]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      
      console.log('🔄 [RecordFormModal] Loading data...');
      
      // Load patients
      const patientsResponse = await userService.getAllPatients(1, 1000);
      if (patientsResponse.success && patientsResponse.data) {
        setPatients(patientsResponse.data);
        console.log('✅ Loaded patients:', patientsResponse.data.length);
      }

      // Load services (only active services)
      const servicesResponse = await servicesService.getAllServices();
      if (servicesResponse.services && Array.isArray(servicesResponse.services)) {
        // Filter only active services for selection
        const activeServices = servicesResponse.services.filter(s => s.isActive === true);
        setServices(activeServices);
        console.log('✅ Loaded services:', activeServices.length);
        
        // 🆕 Build serviceAddOnsMap from loaded services
        const addOnsMap = {};
        activeServices.forEach(service => {
          if (service.serviceAddOns && Array.isArray(service.serviceAddOns)) {
            // Filter only active addons
            addOnsMap[service._id] = service.serviceAddOns.filter(addon => addon.isActive);
          } else {
            addOnsMap[service._id] = [];
          }
        });
        setServiceAddOnsMap(addOnsMap);
        console.log('✅ Built serviceAddOnsMap for', Object.keys(addOnsMap).length, 'services');
      }

      // Load dentists (all staff with dentist role will be filtered on backend)
      const dentistsResponse = await userService.getAllStaff(1, 1000);
      if (dentistsResponse.success && dentistsResponse.data) {
        // Filter dentists from staff
        const dentistsList = dentistsResponse.data.filter(staff => staff.role === 'dentist');
        setDentists(dentistsList);
        console.log('✅ Loaded dentists:', dentistsList.length);
      }

      // Load rooms
      const roomsResponse = await roomService.getRooms(1, 1000);
      if (roomsResponse.success && roomsResponse.data) {
        setRooms(roomsResponse.data);
        console.log('✅ Loaded rooms:', roomsResponse.data.length);
      }

      // 🆕 Load medicines from medicine service (limit max 100)
      const medicinesResponse = await medicineService.getMedicines({ 
        isActive: true, 
        limit: 100 
      });
      if (medicinesResponse.success && medicinesResponse.data) {
        setMedicines(medicinesResponse.data);
        console.log('✅ Loaded medicines:', medicinesResponse.data.length);
      }
      
      console.log('✅ [RecordFormModal] All data loaded successfully');
      
    } catch (error) {
      console.error('❌ Load data error:', error);
      message.error('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoadingData(false);
    }
  };
  
  // Load service addons when service is selected in treatment indications
  const loadServiceAddOns = async (serviceId) => {
    if (serviceAddOnsMap[serviceId]) {
      console.log('⚠️ ServiceAddOns already cached for', serviceId);
      return; // Already loaded
    }
    
    try {
      setLoadingAddOns(true);
      console.log('🔄 Loading serviceAddOns for serviceId:', serviceId);
      const response = await servicesService.getServiceById(serviceId);
      console.log('📦 getServiceById response:', response);
      
      if (response.success && response.data) {
        // ✅ Always set serviceAddOnsMap even if empty to avoid re-fetching
        const serviceAddOns = response.data.serviceAddOns || [];
        const activeAddOns = serviceAddOns.filter(addon => addon.isActive);
        console.log('✅ Found serviceAddOns:', serviceAddOns.length, 'active:', activeAddOns.length, activeAddOns);
        setServiceAddOnsMap(prev => ({
          ...prev,
          [serviceId]: activeAddOns
        }));
        
        if (activeAddOns.length === 0) {
          console.log('⚠️ No active serviceAddOns for this service');
        }
      } else {
        console.log('⚠️ No data in response or API call failed');
        // Still set empty array to prevent re-fetching
        setServiceAddOnsMap(prev => ({
          ...prev,
          [serviceId]: []
        }));
      }
    } catch (error) {
      console.error('❌ Load service addons error:', error);
      message.error('Không thể tải danh sách dịch vụ con');
      // Set empty array on error to prevent infinite retries
      setServiceAddOnsMap(prev => ({
        ...prev,
        [serviceId]: []
      }));
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
      console.log('🔍 Loading service details for serviceId:', record.serviceId);
      const response = await servicesService.getServiceById(record.serviceId);
      console.log('📦 Service API response:', response);
      
      if (response.success && response.data) {
        setMainServiceDetails(response.data);
        // ✅ Check if serviceAddOns exists before filtering
        const serviceAddOns = response.data.serviceAddOns || [];
        console.log('🎯 ServiceAddOns found:', serviceAddOns.length);
        const activeAddOns = serviceAddOns.filter(addon => addon.isActive);
        console.log('✅ Active ServiceAddOns:', activeAddOns.length);
        setSelectedMainServiceAddOns(activeAddOns);
      }
    } catch (error) {
      console.error('❌ Load main service error:', error);
      message.error('Không thể tải thông tin dịch vụ chính');
    }
  };
  
  // 🆕 Handle modal close (cancel/close button)
  const handleModalClose = () => {
    console.log('🔍 [RecordFormModal] Closing modal, recordModified:', recordModified);
    
    // Reset all states
    setRecordModified(false);
    setTempServiceAddOnId(null);
    setTempMainServiceQuantity(1);
    setTempAdditionalServices([]);
    setServicesToDelete([]);
    setEditingAdditionalServices({});
    setShowAddServiceForm(false);
    addServiceForm.resetFields();
    setSelectedAddServiceId(null);
    
    // Call original onCancel
    if (onCancel) {
      onCancel();
    }
  };
  
  // 🆕 Handle change main service's serviceAddOn (just update local state)
  const handleChangeMainServiceAddOn = (newAddOnId) => {
    console.log('🔍 [handleChangeMainServiceAddOn] Selected addon:', newAddOnId);
    setTempServiceAddOnId(newAddOnId);
  };
  
  // 🆕 Handle add additional service
  const handleAddAdditionalService = () => {
    if (showAddServiceForm) {
      // If form is open, close it and reset
      setShowAddServiceForm(false);
      addServiceForm.resetFields();
      setSelectedAddServiceId(null);
    } else {
      // Open the form
      setShowAddServiceForm(true);
    }
  };
  
  // 🆕 Handle submit add service form
  const handleSubmitAddService = async () => {
    console.log('🔥 [handleSubmitAddService] CALLED!');
    
    try {
      const values = await addServiceForm.validateFields();
      console.log('📋 [handleSubmitAddService] Form values:', values);
      
      const service = services.find(s => s._id === values.serviceId);
      const addOns = serviceAddOnsMap[values.serviceId] || [];
      const addOn = addOns.find(a => a._id === values.serviceAddOnId);
      
      console.log('🔍 [handleSubmitAddService] Found:', {
        service: service ? service.name : 'NOT FOUND',
        addOn: addOn ? addOn.name : 'NOT FOUND',
        addOnsCount: addOns.length
      });
      
      if (!service || !addOn) {
        message.error('Không tìm thấy thông tin dịch vụ');
        console.error('❌ Service or addon not found!');
        return;
      }
      
      // Calculate effective price based on price schedules
      const effectivePrice = getEffectivePrice(addOn);
      
      // 🆕 Create temporary service item (not saved to DB yet)
      const newServiceItem = {
        _id: `temp_${Date.now()}`, // Temporary ID
        serviceId: service._id,
        serviceName: service.name,
        serviceType: service.type,
        serviceAddOnId: addOn._id,
        serviceAddOnName: addOn.name,
        serviceAddOnUnit: addOn.unit,
        price: effectivePrice, // Use effective price instead of base price
        quantity: values.quantity || 1,
        totalPrice: effectivePrice * (values.quantity || 1),
        notes: values.notes || '',
        isTemporary: true // Flag to identify temp items
      };
      
      console.log('➕ [handleSubmitAddService] Adding new service item:', newServiceItem);
      console.log('📊 [handleSubmitAddService] Current tempAdditionalServices:', tempAdditionalServices);
      
      // Add to temporary state
      setTempAdditionalServices(prev => {
        const updated = [...prev, newServiceItem];
        console.log('✅ [handleSubmitAddService] Updated tempAdditionalServices:', updated);
        return updated;
      });
      
      message.success('Đã thêm dịch vụ bổ sung vào form. Nhấn "Cập nhật" để lưu vào database.');
      
      // Reset form and close
      addServiceForm.resetFields();
      setSelectedAddServiceId(null);
      setShowAddServiceForm(false);
      
      console.log('✅ [handleSubmitAddService] Service added successfully!');
    } catch (error) {
      console.error('❌ [handleSubmitAddService] Error:', error);
      if (error.errorFields) {
        message.error('Vui lòng điền đầy đủ thông tin');
      } else {
        message.error('Không thể thêm dịch vụ');
      }
    }
  };
  
  // 🆕 Handle remove temporary additional service (not saved yet)
  const handleRemoveTempAdditionalService = (tempId) => {
    setTempAdditionalServices(prev => prev.filter(item => item._id !== tempId));
    message.success('Đã xóa dịch vụ');
  };
  
  // 🆕 Handle edit existing additional service (quantity or notes)
  const handleEditAdditionalService = (serviceId, field, value) => {
    console.log('✏️ [handleEditAdditionalService]', { serviceId, field, value });
    
    setEditingAdditionalServices(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: value
      }
    }));
    
    setRecordModified(true);
  };
  
  // 🆕 Handle remove additional service - show confirmation modal
  const handleRemoveAdditionalService = (serviceItemId, serviceName) => {
    console.log('🔥 [handleRemoveAdditionalService] Opening confirm modal for:', { serviceItemId, serviceName });
    setDeleteConfirmModal({
      visible: true,
      serviceItemId,
      serviceName
    });
  };
  
  // 🆕 Confirm delete additional service
  const confirmDeleteAdditionalService = () => {
    const { serviceItemId, serviceName } = deleteConfirmModal;
    console.log('🗑️ [confirmDeleteAdditionalService] Confirmed! Removing service:', serviceItemId);
    
    // ✅ Add to deletion list
    setServicesToDelete(prev => {
      const newList = [...prev, serviceItemId];
      console.log('✅ [confirmDeleteAdditionalService] Updated servicesToDelete:', newList);
      return newList;
    });
    
    // ✅ Remove from editingAdditionalServices if it was being edited
    setEditingAdditionalServices(prev => {
      const updated = { ...prev };
      delete updated[serviceItemId];
      return updated;
    });
    
    // Mark record as modified
    setRecordModified(true);
    
    // Close modal
    setDeleteConfirmModal({ visible: false, serviceItemId: null, serviceName: '' });
    
    message.success(`Đã đánh dấu xóa dịch vụ "${serviceName}". Nhấn "Cập nhật" để lưu thay đổi.`);
    console.log('✅ [confirmDeleteAdditionalService] Service marked for deletion');
  };
  
  // 🆕 Cancel delete additional service
  const cancelDeleteAdditionalService = () => {
    console.log('❌ [cancelDeleteAdditionalService] Cancelled');
    setDeleteConfirmModal({ visible: false, serviceItemId: null, serviceName: '' });
  };
  
  // 🆕 Restore a service that was marked for deletion
  const handleRestoreAdditionalService = (serviceItemId, serviceName) => {
    console.log('♻️ [handleRestoreAdditionalService] Restoring service:', serviceItemId);
    
    setServicesToDelete(prev => {
      const newList = prev.filter(id => String(id) !== String(serviceItemId));
      console.log('✅ [handleRestoreAdditionalService] Updated servicesToDelete:', newList);
      return newList;
    });
    
    message.success(`Đã khôi phục dịch vụ "${serviceName}".`);
  };

  // Handle form submit
  const handleSubmit = async () => {
    console.log('🔥🔥🔥 [handleSubmit] CALLED!');
    
    try {
      console.log('🚀 [handleSubmit] Starting...', {
        mode,
        recordId: record?._id,
        tempServiceAddOnId,
        tempMainServiceQuantity,
        recordServiceAddOnId: record?.serviceAddOnId,
        recordQuantity: record?.quantity
      });
      
      let values;
      
      if (mode === 'edit') {
        // In edit mode, manually get form values (no validation for disabled fields)
        // ⚠️ getFieldsValue() returns {} for disabled fields, so we need to get specific fields
        const allValues = form.getFieldsValue(true); // true = get all including disabled
        
        // For edit mode, use form values directly (allow empty strings)
        values = {
          diagnosis: allValues.diagnosis !== undefined ? allValues.diagnosis : record.diagnosis || '',
          notes: allValues.notes !== undefined ? allValues.notes : record.notes || '',
          treatmentIndications: allValues.treatmentIndications || record.treatmentIndications || []
        };
        
        console.log('📋 [handleSubmit] Form values:', values);
        console.log('📋 [handleSubmit] All form values (including disabled):', allValues);
        console.log('📋 [handleSubmit] Record data:', {
          diagnosis: record.diagnosis,
          notes: record.notes,
          treatmentIndications: record.treatmentIndications
        });
      } else {
        // In create mode, validate all required fields
        values = await form.validateFields();
      }
      
      setLoading(true);
      
      // 💊 Save prescription first (independent of record update)
      if (mode === 'edit' && prescriptionFormRef.current) {
        try {
          console.log('💊 [RecordFormModal] Checking prescription data...');
          const prescriptionData = await prescriptionFormRef.current.getPrescriptionData();
          
          if (prescriptionData && prescriptionData.medicines && prescriptionData.medicines.length > 0) {
            console.log('💊 [RecordFormModal] Saving prescription:', prescriptionData);
            console.log('💊 [RecordFormModal] First medicine:', JSON.stringify(prescriptionData.medicines[0], null, 2));
            const prescriptionResponse = await recordService.addPrescription(record._id, prescriptionData);
            
            if (prescriptionResponse.success) {
              console.log('✅ [RecordFormModal] Prescription saved successfully');
            } else {
              console.warn('⚠️ [RecordFormModal] Prescription save returned false:', prescriptionResponse);
            }
          } else {
            console.log('ℹ️ [RecordFormModal] No prescription data to save');
          }
        } catch (prescriptionError) {
          console.error('❌ [RecordFormModal] Failed to save prescription:', prescriptionError);
          setLoading(false);
          message.error('Có lỗi khi lưu đơn thuốc: ' + (prescriptionError.response?.data?.message || prescriptionError.message));
          return;
        }
      }

      let recordData;
      
      if (mode === 'edit' && record) {
        // Edit mode: Only update editable fields (diagnosis, notes, treatmentIndications)
        
        // 🆕 Include service addon update if changed
        const serviceAddOnChanged = tempServiceAddOnId !== null && tempServiceAddOnId !== record.serviceAddOnId;
        const quantityChanged = tempMainServiceQuantity !== record.quantity;
        
        console.log('🔍 [handleSubmit] Change detection:', {
          serviceAddOnChanged,
          quantityChanged,
          tempServiceAddOnId,
          recordServiceAddOnId: record.serviceAddOnId,
          tempMainServiceQuantity,
          recordQuantity: record.quantity,
          selectedMainServiceAddOnsCount: selectedMainServiceAddOns.length
        });
        
        // ✅ ALWAYS calculate totalCost from FE and send to BE
        // Get current service addon (from temp or record)
        const currentServiceAddOnId = tempServiceAddOnId !== null ? tempServiceAddOnId : record.serviceAddOnId;
        const currentAddOn = selectedMainServiceAddOns.find(a => a._id === currentServiceAddOnId);
        const currentQuantity = quantityChanged ? tempMainServiceQuantity : (record.quantity || 1);
        
        // ✅ Calculate base cost from serviceAddOn effective price (WITH priceSchedules applied)
        const serviceAddOnPrice = currentAddOn ? getEffectivePrice(currentAddOn) : 0;
        const baseCost = serviceAddOnPrice * currentQuantity;
        
        // Calculate additional services cost (excluding deleted, including edited)
        const existingAdditionalCost = (record.additionalServices || [])
          .filter(svc => !servicesToDelete.some(id => String(id) === String(svc._id))) // Exclude deleted services
          .reduce((sum, svc) => {
            const editedValues = editingAdditionalServices[svc._id] || {};
            const quantity = editedValues.quantity !== undefined ? editedValues.quantity : (svc.quantity || 1);
            const price = svc.price || 0;
            return sum + (price * quantity);
          }, 0);
        
        const tempAdditionalCost = tempAdditionalServices.reduce((sum, svc) => sum + (svc.totalPrice || 0), 0);
        const additionalCost = existingAdditionalCost + tempAdditionalCost;
        const calculatedTotalCost = baseCost + additionalCost;
        
        console.log('💰 [handleSubmit] Final cost calculation:', {
          serviceAddOnPrice,
          currentQuantity,
          baseCost,
          existingAdditionalCost,
          tempAdditionalCost,
          additionalCost,
          calculatedTotalCost
        });
        
        if (serviceAddOnChanged || quantityChanged) {
          if (!currentAddOn) {
            // ✅ Allow update even without serviceAddOn - use existing data from record
            console.warn('⚠️ currentAddOn not found but allowing update. Using record data instead.');
            const effectiveMainPrice = record.serviceAddOnPrice || 0;
            
            recordData = {
              diagnosis: values.diagnosis,
              notes: values.notes,
              serviceAddOnId: record.serviceAddOnId || null,
              serviceAddOnName: record.serviceAddOnName || null,
              serviceAddOnUnit: record.serviceAddOnUnit || null,
              serviceAddOnPrice: effectiveMainPrice,
              quantity: currentQuantity,
              totalCost: calculatedTotalCost,
              treatmentIndications: [], // Will be set below
              lastModifiedBy: currentUser._id || 'unknown'
            };
          } else {
            const effectiveMainPrice = getEffectivePrice(currentAddOn);
            console.log('✅ Service addon or quantity changed:', currentAddOn.name, effectiveMainPrice, 'x', currentQuantity);
            
            recordData = {
              diagnosis: values.diagnosis,
              notes: values.notes,
              serviceAddOnId: currentAddOn._id,
              serviceAddOnName: currentAddOn.name,
              serviceAddOnUnit: currentAddOn.unit,
              serviceAddOnPrice: effectiveMainPrice,
              quantity: currentQuantity,
              totalCost: calculatedTotalCost, // ✅ Always send totalCost from FE
              treatmentIndications: [], // Will be set below
              lastModifiedBy: currentUser._id || 'unknown'
            };
          }
        } else {
          // ✅ Even if no service changes, still send totalCost and serviceAddOn fields
          // to ensure backend has current values (fixes issue where serviceAddOnPrice = 0 after update)
          if (!currentAddOn) {
            // ✅ Allow update even without serviceAddOn - use existing data from record
            console.warn('⚠️ currentAddOn not found but allowing update. Using record data instead.');
            const effectiveMainPrice = record.serviceAddOnPrice || 0;
            
            recordData = {
              diagnosis: values.diagnosis,
              notes: values.notes,
              serviceAddOnId: record.serviceAddOnId || null,
              serviceAddOnName: record.serviceAddOnName || null,
              serviceAddOnUnit: record.serviceAddOnUnit || null,
              serviceAddOnPrice: effectiveMainPrice,
              quantity: currentQuantity,
              totalCost: calculatedTotalCost,
              treatmentIndications: [], // Will be set below
              lastModifiedBy: currentUser._id || 'unknown'
            };
          } else {
            const effectiveMainPrice = getEffectivePrice(currentAddOn);
            console.log('ℹ️ Service addon unchanged, but including in update:', currentAddOn.name, effectiveMainPrice, 'x', currentQuantity);
            
            recordData = {
              diagnosis: values.diagnosis,
              notes: values.notes,
              serviceAddOnId: currentAddOn._id,
              serviceAddOnName: currentAddOn.name,
              serviceAddOnUnit: currentAddOn.unit,
              serviceAddOnPrice: effectiveMainPrice,
              quantity: currentQuantity,
              totalCost: calculatedTotalCost, // ✅ Always send totalCost from FE
              treatmentIndications: [], // Will be set below
              lastModifiedBy: currentUser._id || 'unknown'
            };
          }
        }
        
        
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

        // Assign treatmentIndications to recordData
        recordData.treatmentIndications = processedTreatmentIndications;
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
        console.log('📝 [RecordFormModal] Updating record:', record._id);
        console.log('📦 [RecordFormModal] Record data to send:', JSON.stringify(recordData, null, 2));
        console.log('🔍 [RecordFormModal] Additional service operations:', {
          tempAdditionalServicesCount: tempAdditionalServices.length,
          servicesToDeleteCount: servicesToDelete.length,
          editingAdditionalServicesCount: Object.keys(editingAdditionalServices).length
        });
        
        try {
          response = await recordService.updateRecord(record._id, recordData);
          console.log('✅ [RecordFormModal] Update response:', response);
        } catch (apiError) {
          console.error('❌ [RecordFormModal] API Error:', apiError);
          throw apiError;
        }
        
        // 🆕 Delete marked services
        if (response.success && servicesToDelete.length > 0) {
          console.log('🗑️ [RecordFormModal] Deleting marked services:', servicesToDelete.length);
          for (const serviceId of servicesToDelete) {
            try {
              await recordService.removeAdditionalService(record._id, serviceId);
              console.log('✅ Deleted service:', serviceId);
            } catch (deleteError) {
              console.error('❌ Failed to delete service:', serviceId, deleteError);
              // Continue with other deletions even if one fails
            }
          }
          // Clear the deletion list
          setServicesToDelete([]);
        }
        
        // 🆕 Save temporary additional services if any
        if (response.success && tempAdditionalServices.length > 0) {
          console.log('💾 [RecordFormModal] Saving temp additional services:', tempAdditionalServices.length);
          console.log('📋 [RecordFormModal] Temp services data:', tempAdditionalServices);
          
          for (const tempService of tempAdditionalServices) {
            const serviceData = {
              serviceId: tempService.serviceId,
              serviceName: tempService.serviceName,
              serviceType: tempService.serviceType,
              serviceAddOnId: tempService.serviceAddOnId,
              serviceAddOnName: tempService.serviceAddOnName,
              serviceAddOnUnit: tempService.serviceAddOnUnit || null,
              price: tempService.price,
              quantity: tempService.quantity,
              notes: tempService.notes
            };
            
            console.log('➕ [RecordFormModal] Adding service to record:', serviceData);
            
            try {
              const addResponse = await recordService.addAdditionalService(record._id, serviceData);
              console.log('✅ [RecordFormModal] Added service successfully:', addResponse);
            } catch (addError) {
              console.error('❌ [RecordFormModal] Failed to add service:', addError);
              throw addError; // Stop on first error
            }
          }
          // Clear temp list after saving
          setTempAdditionalServices([]);
          console.log('✅ [RecordFormModal] All temp services saved and cleared');
        } else if (tempAdditionalServices.length > 0) {
          console.warn('⚠️ [RecordFormModal] Temp services exist but response.success is false or response is undefined');
        } else {
          console.log('ℹ️ [RecordFormModal] No temp services to save');
        }
        
        // 🆕 Update edited existing services
        if (response.success && Object.keys(editingAdditionalServices).length > 0) {
          console.log('✏️ [RecordFormModal] Updating edited services:', Object.keys(editingAdditionalServices).length);
          for (const [serviceId, editedFields] of Object.entries(editingAdditionalServices)) {
            try {
              // Find the original service
              const originalService = record.additionalServices?.find(svc => svc._id === serviceId);
              if (!originalService) {
                console.warn('⚠️ Original service not found:', serviceId);
                continue;
              }
              
              // Merge with edited fields
              const updatedServiceData = {
                serviceId: originalService.serviceId,
                serviceName: originalService.serviceName,
                serviceType: originalService.serviceType,
                serviceAddOnId: originalService.serviceAddOnId,
                serviceAddOnName: originalService.serviceAddOnName,
                serviceAddOnUnit: originalService.serviceAddOnUnit || null,
                price: originalService.price,
                quantity: editedFields.quantity !== undefined ? editedFields.quantity : originalService.quantity,
                notes: editedFields.notes !== undefined ? editedFields.notes : originalService.notes
              };
              
              console.log('📝 Updating service:', serviceId, updatedServiceData);
              
              // Delete old and add new (since backend doesn't have update endpoint)
              await recordService.removeAdditionalService(record._id, serviceId);
              await recordService.addAdditionalService(record._id, updatedServiceData);
              
              console.log('✅ Updated service:', serviceId);
            } catch (updateError) {
              console.error('❌ Failed to update service:', serviceId, updateError);
              // Continue with other updates even if one fails
            }
          }
          // Clear editing state after saving
          setEditingAdditionalServices({});
        }
      } else {
        console.log('📝 [RecordFormModal] Creating record:', recordData);
        response = await recordService.createRecord(recordData);
      }

      if (response.success) {
        let successMsg = '';
        
        if (mode === 'edit') {
          const parts = [];
          if (tempAdditionalServices.length > 0) {
            parts.push(`thêm ${tempAdditionalServices.length} dịch vụ bổ sung`);
          }
          if (servicesToDelete.length > 0) {
            parts.push(`xóa ${servicesToDelete.length} dịch vụ`);
          }
          if (Object.keys(editingAdditionalServices).length > 0) {
            parts.push(`cập nhật ${Object.keys(editingAdditionalServices).length} dịch vụ`);
          }
          
          if (parts.length > 0) {
            successMsg = `Cập nhật hồ sơ và ${parts.join(', ')} thành công`;
          } else {
            successMsg = 'Cập nhật hồ sơ thành công';
          }
        } else {
          successMsg = 'Tạo hồ sơ thành công';
        }
        
        message.success(successMsg);
        
        // ✅ Call onSuccess to refresh data and close modal
        if (onSuccess) {
          onSuccess(response.data);
        }
        
        // ✅ Close modal after successful update
        handleModalClose();
      } else {
        throw new Error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('❌❌❌ [RecordFormModal] Submit record error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack,
        errorFields: error.errorFields
      });
      
      if (error.errorFields) {
        message.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      } else if (error.response?.data?.message) {
        message.error(error.response.data.message);
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
                    onChange={(date) => {
                      setExamDate(date);
                      console.log('📅 Exam date changed:', date?.format('YYYY-MM-DD'));
                    }}
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
                    {services.map(service => {
                      // Get min price from serviceAddOns
                      const minPrice = service.serviceAddOns && service.serviceAddOns.length > 0
                        ? Math.min(...service.serviceAddOns.map(a => a.price || 0))
                        : 0;
                      return (
                        <Option key={service._id} value={service._id}>
                          <div style={{ lineHeight: 1.3 }}>
                            <div style={{ fontSize: 13 }}>{service.name}</div>
                            {minPrice > 0 && (
                              <div style={{ fontSize: 11, color: '#666' }}>
                                Từ {minPrice.toLocaleString('vi-VN')}đ
                              </div>
                            )}
                          </div>
                        </Option>
                      );
                    })}
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

              {/* <Col span={8}>
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
              </Col> */}

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
      >
        <TextArea
          rows={5}
          placeholder="Nhập chẩn đoán chi tiết..."
          maxLength={1000}
          showCount
          className='custom-textarea'
        />
      </Form.Item>
    </div>
  );

  // Tab 3: Prescription
  const renderPrescriptionTab = () => {
    console.log('🔍 [RecordFormModal - PrescriptionTab] medicines:', medicines.length, medicines);
    return (
      <div>
        <Alert
          type="info"
          message="Đơn thuốc sẽ được thêm sau khi tạo hồ sơ"
          description={mode === 'edit' ? 'Sử dụng form bên dưới để thêm/sửa đơn thuốc' : 'Bạn có thể thêm đơn thuốc sau khi tạo hồ sơ thành công'}
          style={{ marginBottom: 16 }}
        />

        {mode === 'edit' && record && (
          <PrescriptionForm
            ref={prescriptionFormRef}
            prescription={record.prescription}
            medicines={medicines}
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
  };

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

    // Base cost is from BOTH service price AND service addon price * quantity
    const baseQuantity = tempMainServiceQuantity !== record.quantity ? tempMainServiceQuantity : (record.quantity || 1);
    
    // ✅ Get current addon price from selectedMainServiceAddOns (from API), NOT from record
    // If user changed addon, use temp selection; otherwise use current record's addon
    const currentServiceAddOnId = tempServiceAddOnId !== null ? tempServiceAddOnId : record.serviceAddOnId;
    const currentAddOn = selectedMainServiceAddOns.find(a => a._id === currentServiceAddOnId);
    const baseAddOnPrice = currentAddOn ? getEffectivePrice(currentAddOn) : 0; // Use effective price (with priceSchedules)
    
    // 🔍 DEBUG: Log serviceAddOn information
    console.log('🔍 [DEBUG] ServiceAddOn Info:', {
      recordServiceAddOnId: record.serviceAddOnId,
      recordServiceAddOnPrice: record.serviceAddOnPrice,
      tempServiceAddOnId,
      currentServiceAddOnId,
      currentAddOn,
      selectedMainServiceAddOns,
      calculatedBaseAddOnPrice: baseAddOnPrice
    });
    
    // ✅ CORRECT: Calculate base cost from serviceAddOnPrice ONLY (service has no price)
    const baseCost = (baseAddOnPrice || 0) * (baseQuantity || 1);
    
    // Calculate additional services cost (including edited values, excluding deleted)
    // Convert _id to string for comparison
    const existingAdditionalCost = (record.additionalServices || [])
      .filter(svc => !servicesToDelete.some(id => String(id) === String(svc._id))) // Exclude deleted services
      .reduce((sum, svc) => {
        const editedValues = editingAdditionalServices[svc._id] || {};
        const quantity = editedValues.quantity !== undefined ? editedValues.quantity : (svc.quantity || 1);
        const price = svc.price || 0;
        return sum + (price * quantity);
      }, 0);
    
    const tempAdditionalCost = tempAdditionalServices.reduce((sum, svc) => sum + (svc.totalPrice || 0), 0);
    const additionalCost = (existingAdditionalCost || 0) + (tempAdditionalCost || 0);
    const totalCost = (baseCost || 0) + (additionalCost || 0);

    // Debug logging for total cost calculation
    console.log('💰 [AdditionalServices] Cost Calculation:', {
      baseAddOnPrice,
      baseQuantity,
      baseCost,
      existingAdditionalCost,
      tempAdditionalCost,
      additionalCost,
      totalCost,
      existingServices: record.additionalServices?.length || 0,
      tempServices: tempAdditionalServices.length,
      servicesToDelete: servicesToDelete.length,
      formula: `(${baseAddOnPrice} * ${baseQuantity}) + ${additionalCost} = ${totalCost}`
    });

    return (
      <div>
        {/* Main Service Section */}
        <Card 
          size="small" 
          style={{ marginBottom: 16, background: '#e6f7ff', borderColor: '#91d5ff' }}
          title={<Text strong>📌 Dịch vụ chính (đã chọn khi tạo hồ sơ)</Text>}
        >
          <Row gutter={[16, 8]}>
            <Col span={8}>
              <div><Text type="secondary">Dịch vụ:</Text></div>
              <div><Text strong>{record.serviceName || 'N/A'}</Text></div>
            </Col>
            <Col span={10}>
              <div>
                <Text type="secondary">Dịch vụ con: </Text>
                <Text type="warning" style={{ fontSize: 12 }}>
                  (Bắt buộc chọn)
                </Text>
              </div>
              {loading ? (
                <div><Text type="secondary">Đang tải danh sách dịch vụ con...</Text></div>
              ) : selectedMainServiceAddOns.length > 0 ? (
                <Select
                  value={tempServiceAddOnId !== null ? tempServiceAddOnId : record.serviceAddOnId}
                  onChange={handleChangeMainServiceAddOn}
                  style={{ width: '100%' }}
                  placeholder="Vui lòng chọn dịch vụ con"
                  showSearch
                  optionFilterProp="children"
                >
                  {selectedMainServiceAddOns.map(addon => {
                    const { basePrice, schedulePrice } = getPriceScheduleForAddon(addon);
                    const hasSchedulePrice = schedulePrice !== null && schedulePrice !== basePrice;
                    return (
                      <Option key={addon._id} value={addon._id}>
                        <div style={{ lineHeight: 1.3 }}>
                          <div style={{ fontSize: 13 }}>{addon.name} <span style={{ color: '#1890ff', fontSize: 11 }}>({addon.unit})</span></div>
                          <div style={{ fontSize: 11 }}>
                            {hasSchedulePrice ? (
                              <>
                                <span style={{ textDecoration: 'line-through', color: '#999', marginRight: 4 }}>
                                  {basePrice.toLocaleString('vi-VN')}đ
                                </span>
                                <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
                                  {schedulePrice.toLocaleString('vi-VN')}đ
                                </span>
                              </>
                            ) : (
                              <span style={{ color: '#666' }}>
                                {basePrice.toLocaleString('vi-VN')}đ
                              </span>
                            )}
                          </div>
                        </div>
                      </Option>
                    );
                  })}
                </Select>
              ) : (
                <Alert
                  message="Dịch vụ này không có dịch vụ con"
                  type="warning"
                  showIcon
                  style={{ marginTop: 8 }}
                />
              )}
            </Col>
            <Col span={6}>
              <div>
                <Text type="secondary">Số lượng: </Text>
                {(() => {
                  const currentAddOnId = tempServiceAddOnId !== null ? tempServiceAddOnId : record.serviceAddOnId;
                  const currentAddOn = selectedMainServiceAddOns.find(a => a._id === currentAddOnId);
                  const unit = currentAddOn?.unit || '';
                  return unit && <Tag color="blue" style={{ fontSize: 11 }}>{unit}</Tag>;
                })()}
                {tempMainServiceQuantity !== record.quantity && (
                  <Text type="warning" style={{ fontSize: 11, marginLeft: 8 }}>
                    ⚠️ Chưa lưu
                  </Text>
                )}
              </div>
              <InputNumber
                min={1}
                value={tempMainServiceQuantity}
                onChange={(value) => setTempMainServiceQuantity(value || 1)}
                style={{ width: '100%' }}
                placeholder="Số lượng"
              />
            </Col>
          </Row>
        </Card>

        {/* Additional Services Section */}
        {(() => {
          // Include ALL existing services (including those marked for deletion)
          const existingServices = (record.additionalServices || []);
          // Filter out deleted ones for counting active services
          const activeExistingServices = existingServices.filter(
            svc => !servicesToDelete.some(id => String(id) === String(svc._id))
          );
          const allServices = [...existingServices, ...tempAdditionalServices];
          const activeServicesCount = activeExistingServices.length + tempAdditionalServices.length;
          
          return (
            <Card 
              size="small"
              title={
                <Space>
                  <Text strong>➕ Dịch vụ bổ sung</Text>
                  <Tag color="blue">
                    {activeServicesCount} dịch vụ
                  </Tag>
                  {tempAdditionalServices.length > 0 && (
                    <Tag color="orange">{tempAdditionalServices.length} chưa lưu</Tag>
                  )}
                  {servicesToDelete.length > 0 && (
                    <Tag color="red">{servicesToDelete.length} sẽ bị xóa</Tag>
                  )}
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
              {allServices.length === 0 && !showAddServiceForm ? (
                <div style={{ 
                  padding: '24px', 
                  textAlign: 'center', 
                  background: '#fafafa',
                  borderRadius: '8px',
                  border: '1px dashed #d9d9d9'
                }}>
                  <Text type="secondary">Chưa có dịch vụ bổ sung nào</Text>
                </div>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {/* Existing + Temp services - Editable Form */}
                  {allServices.map((svc, index) => {
                    // Get edited values or original values
                    const editedValues = editingAdditionalServices[svc._id] || {};
                    const currentQuantity = editedValues.quantity !== undefined ? editedValues.quantity : svc.quantity;
                    const currentNotes = editedValues.notes !== undefined ? editedValues.notes : svc.notes;
                    const currentTotalPrice = svc.price * currentQuantity;
                    
                    // Check if this service has been edited
                    const isEdited = editedValues.quantity !== undefined || editedValues.notes !== undefined;
                    
                    // Check if this service is marked for deletion
                    const isMarkedForDeletion = servicesToDelete.some(id => String(id) === String(svc._id));
                    
                    return (
                      <Card
                        key={svc._id || index}
                        size="small"
                        style={{ 
                          background: isMarkedForDeletion ? '#fff1f0' : (svc.isTemporary ? '#fff7e6' : (isEdited ? '#fff1f0' : '#f0f5ff')),
                          border: isMarkedForDeletion ? '2px dashed #ff4d4f' : (svc.isTemporary ? '2px dashed #ffa940' : (isEdited ? '2px solid #ff7875' : '1px solid #d9d9d9')),
                          opacity: isMarkedForDeletion ? 0.6 : 1
                        }}
                        title={
                          <Space>
                            <Tag color={isMarkedForDeletion ? 'red' : 'blue'}>{index + 1}</Tag>
                            <Text strong style={{ textDecoration: isMarkedForDeletion ? 'line-through' : 'none' }}>
                              {svc.serviceName}
                            </Text>
                            {isMarkedForDeletion && (
                              <Tag color="red">Sẽ bị xóa</Tag>
                            )}
                            {svc.isTemporary && !isMarkedForDeletion && (
                              <Tag color="orange">Chưa lưu</Tag>
                            )}
                            {isEdited && !svc.isTemporary && !isMarkedForDeletion && (
                              <Tag color="red">Đã sửa - Chưa lưu</Tag>
                            )}
                          </Space>
                        }
                        extra={
                          isMarkedForDeletion ? (
                            <Button
                              type="primary"
                              size="small"
                              icon={<UndoOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestoreAdditionalService(svc._id, svc.serviceName);
                              }}
                            >
                              Khôi phục
                            </Button>
                          ) : (
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('🗑️ Delete button clicked for:', svc._id, svc.serviceName, 'isTemporary:', svc.isTemporary);
                                if (svc.isTemporary) {
                                  handleRemoveTempAdditionalService(svc._id);
                                } else {
                                  handleRemoveAdditionalService(svc._id, svc.serviceName);
                                }
                              }}
                            >
                              Xóa
                            </Button>
                          )
                        }
                      >
                        <Row gutter={16}>
                          <Col span={8}>
                            <div style={{ marginBottom: 4 }}>
                              <Text type="secondary">Dịch vụ con:</Text>
                            </div>
                            <Select
                              value={svc.serviceAddOnId}
                              disabled
                              style={{ width: '100%' }}
                            >
                              <Option value={svc.serviceAddOnId}>
                                <Space>
                                  <span>{svc.serviceAddOnName}</span>
                                  <Text type="secondary">-</Text>
                                  <Text strong style={{ color: '#1890ff' }}>
                                    {svc.price.toLocaleString('vi-VN')}đ
                                  </Text>
                                  {svc.serviceAddOnUnit && (
                                    <Tag color="blue">{svc.serviceAddOnUnit}</Tag>
                                  )}
                                </Space>
                              </Option>
                            </Select>
                          </Col>
                          <Col span={4}>
                            <div style={{ marginBottom: 4 }}>
                              <Text type="secondary">Số lượng:</Text>
                              {svc.serviceAddOnUnit && (
                                <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>
                                  {svc.serviceAddOnUnit}
                                </Tag>
                              )}
                              {isEdited && (
                                <Text type="warning" style={{ fontSize: 10, marginLeft: 4 }}>
                                  *
                                </Text>
                              )}
                            </div>
                            <InputNumber
                              value={currentQuantity}
                              disabled={svc.isTemporary} // Temporary services can't be edited here
                              min={1}
                              style={{ width: '100%' }}
                              onChange={(value) => {
                                if (!svc.isTemporary && value >= 1) {
                                  handleEditAdditionalService(svc._id, 'quantity', value);
                                }
                              }}
                            />
                          </Col>
                          <Col span={12}>
                            <div style={{ marginBottom: 4 }}>
                              <Text type="secondary">Ghi chú:</Text>
                              {isEdited && editedValues.notes !== undefined && (
                                <Text type="warning" style={{ fontSize: 10, marginLeft: 4 }}>
                                  *
                                </Text>
                              )}
                            </div>
                            <Input.TextArea
                              value={currentNotes}
                              disabled={svc.isTemporary}
                              placeholder="Nhập ghi chú (không bắt buộc)"
                              rows={1}
                              style={{ width: '100%' }}
                              onChange={(e) => {
                                if (!svc.isTemporary) {
                                  handleEditAdditionalService(svc._id, 'notes', e.target.value);
                                }
                              }}
                            />
                          </Col>
                        </Row>
                        <Divider style={{ margin: '12px 0' }} />
                        <Row>
                          <Col span={24}>
                            <Text type="secondary">Thành tiền: </Text>
                            <Text strong style={{ color: isEdited ? '#ff4d4f' : '#1890ff', fontSize: 16 }}>
                              {currentTotalPrice.toLocaleString('vi-VN')}đ
                            </Text>
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                              ({svc.price.toLocaleString('vi-VN')}đ × {currentQuantity})
                            </Text>
                            {isEdited && (
                              <Text type="warning" style={{ marginLeft: 8, fontSize: 11 }}>
                                (Đã thay đổi từ {svc.totalPrice.toLocaleString('vi-VN')}đ)
                              </Text>
                            )}
                          </Col>
                        </Row>
                      </Card>
                    );
                  })}
                </Space>
              )}

              {/* 🆕 Add New Service Form */}
              {showAddServiceForm && (
            <Card
              size="small"
              style={{
                marginTop: allServices.length > 0 ? 16 : 0,
                background: '#f0f7ff',
                border: '2px dashed #1890ff'
              }}
              title={<Text strong style={{ color: '#1890ff' }}>➕ Thêm dịch vụ bổ sung mới</Text>}
            >
              {/* ✅ Use component=false to prevent rendering nested <form> */}
              <Form
                form={addServiceForm}
                layout="vertical"
                component={false}
              >
                <Row gutter={16}>
                  <Col span={12}>
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
                          console.log('🎯 [Add Service Form] Service selected:', value);
                          setSelectedAddServiceId(value);
                          loadServiceAddOns(value);
                          addServiceForm.setFieldValue('serviceAddOnId', null);
                        }}
                      >
                        {(() => {
                          // 🧠 Smart filtering logic:
                          // 1. Get all used service addon IDs (from main service + additional services + temp services)
                          const usedServiceAddOnIds = new Set();
                          
                          // Main service addon
                          if (record?.serviceAddOnId) {
                            usedServiceAddOnIds.add(record.serviceAddOnId);
                          }
                          // Temp main service addon (if changed but not saved)
                          if (tempServiceAddOnId && tempServiceAddOnId !== record?.serviceAddOnId) {
                            usedServiceAddOnIds.add(tempServiceAddOnId);
                          }
                          
                          // Additional services (saved)
                          (record?.additionalServices || []).forEach(svc => {
                            if (svc.serviceAddOnId) {
                              usedServiceAddOnIds.add(svc.serviceAddOnId);
                            }
                          });
                          
                          // Temp additional services (not saved yet)
                          tempAdditionalServices.forEach(svc => {
                            if (svc.serviceAddOnId) {
                              usedServiceAddOnIds.add(svc.serviceAddOnId);
                            }
                          });
                          
                          console.log('🔍 [Filter] Used ServiceAddOn IDs:', Array.from(usedServiceAddOnIds));
                          
                          // 2. Filter services based on available addons
                          const filteredServices = services.filter(service => {
                            const serviceAddOns = serviceAddOnsMap[service._id] || [];
                            
                            // Filter out used addons
                            const availableAddOns = serviceAddOns.filter(addon => 
                              !usedServiceAddOnIds.has(addon._id)
                            );
                            
                            // Only show service if it has available addons
                            return availableAddOns.length > 0;
                          });
                          
                          console.log('🔍 [Filter] Filtered services:', filteredServices.map(s => s.name));
                          
                          return filteredServices.map(service => {
                            const allAddOns = serviceAddOnsMap[service._id] || [];
                            const availableAddOns = allAddOns.filter(addon => 
                              !usedServiceAddOnIds.has(addon._id)
                            );
                            
                            return (
                              <Option 
                                key={service._id} 
                                value={service._id}
                              >
                                <div style={{ lineHeight: 1.3 }}>
                                  <div style={{ fontSize: 13 }}>
                                    {service.name}
                                    <span style={{ color: service.type === 'exam' ? '#1890ff' : '#52c41a', fontSize: 11, marginLeft: 6 }}>
                                      ({service.type === 'exam' ? 'Khám' : 'Điều trị'})
                                    </span>
                                  </div>
                                  <div style={{ fontSize: 11, color: '#13c2c2' }}>
                                    Còn {availableAddOns.length}/{allAddOns.length} dịch vụ con
                                  </div>
                                </div>
                              </Option>
                            );
                          });
                        })()}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      name="serviceAddOnId"
                      label="Chọn dịch vụ con"
                      rules={[{ required: true, message: 'Vui lòng chọn dịch vụ con' }]}
                    >
                      <Select
                        placeholder={selectedAddServiceId ? "Chọn dịch vụ con" : "Chọn dịch vụ trước"}
                        disabled={!selectedAddServiceId || loadingAddOns}
                        loading={loadingAddOns}
                      >
                        {(() => {
                          const allAddOns = serviceAddOnsMap[selectedAddServiceId] || [];
                          
                          // Get used service addon IDs
                          const usedServiceAddOnIds = new Set();
                          
                          // Main service addon
                          if (record?.serviceAddOnId) {
                            usedServiceAddOnIds.add(record.serviceAddOnId);
                          }
                          // Temp main service addon
                          if (tempServiceAddOnId && tempServiceAddOnId !== record?.serviceAddOnId) {
                            usedServiceAddOnIds.add(tempServiceAddOnId);
                          }
                          
                          // Additional services
                          (record?.additionalServices || []).forEach(svc => {
                            if (svc.serviceAddOnId) {
                              usedServiceAddOnIds.add(svc.serviceAddOnId);
                            }
                          });
                          
                          // Temp additional services
                          tempAdditionalServices.forEach(svc => {
                            if (svc.serviceAddOnId) {
                              usedServiceAddOnIds.add(svc.serviceAddOnId);
                            }
                          });
                          
                          // Filter available addons
                          const availableAddOns = allAddOns.filter(addon => 
                            !usedServiceAddOnIds.has(addon._id)
                          );
                          
                          return availableAddOns.map(addon => {
                            const { basePrice, schedulePrice } = getPriceScheduleForAddon(addon);
                            const hasSchedulePrice = schedulePrice !== null && schedulePrice !== basePrice;
                            return (
                              <Option key={addon._id} value={addon._id}>
                                <div style={{ lineHeight: 1.3 }}>
                                  <div style={{ fontSize: 13 }}>{addon.name}</div>
                                  <div style={{ fontSize: 11 }}>
                                    {hasSchedulePrice ? (
                                      <>
                                        <span style={{ textDecoration: 'line-through', color: '#999', marginRight: 4 }}>
                                          {basePrice.toLocaleString('vi-VN')}đ
                                        </span>
                                        <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
                                          {schedulePrice.toLocaleString('vi-VN')}đ
                                        </span>
                                      </>
                                    ) : (
                                      <span style={{ color: '#666' }}>
                                        {basePrice.toLocaleString('vi-VN')}đ
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Option>
                            );
                          });
                        })()}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item
                      name="quantity"
                      label="Số lượng"
                      initialValue={1}
                      rules={[
                        { required: true, message: 'Vui lòng nhập số lượng' },
                        { type: 'number', min: 1, message: 'Số lượng phải >= 1' }
                      ]}
                    >
                      <InputNumber
                        min={1}
                        style={{ width: '100%' }}
                        placeholder="Số lượng"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={16}>
                    <Form.Item
                      name="notes"
                      label="Ghi chú"
                    >
                      <Input.TextArea
                        rows={1}
                        placeholder="Ghi chú về dịch vụ này..."
                        maxLength={200}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Space>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleSubmitAddService}
                      >
                        Xác nhận
                      </Button>
                      <Button
                        onClick={() => {
                          setShowAddServiceForm(false);
                          addServiceForm.resetFields();
                          setSelectedAddServiceId(null);
                        }}
                      >
                        Hủy
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Form>
            </Card>
          )}
            </Card>
          );
        })()}

        {/* Total Cost Summary */}
        <Divider />
        <Card size="small" style={{ background: '#f0f0f0' }}>
          <Row gutter={16}>
            <Col span={12}>
              <div><Text type="secondary">Dịch vụ chính:</Text></div>
              <div>
                <Text strong>{(baseCost || 0).toLocaleString('vi-VN')}đ</Text>
                {(() => {
                  const currentAddOnId = tempServiceAddOnId !== null ? tempServiceAddOnId : record.serviceAddOnId;
                  const currentAddOn = selectedMainServiceAddOns.find(a => a._id === currentAddOnId);
                  const unit = currentAddOn?.unit || '';
                  const quantity = tempMainServiceQuantity !== record.quantity ? tempMainServiceQuantity : (record.quantity || 1);
                  
                  // Get addon price from temp addon or record
                  let addonPrice = record.serviceAddOnPrice || 0;
                  if (tempServiceAddOnId !== null && tempServiceAddOnId !== record.serviceAddOnId && currentAddOn) {
                    addonPrice = getEffectivePrice(currentAddOn);
                  }
                  
                  // ✅ Only serviceAddOn has price, service itself has no price
                  const totalUnitPrice = addonPrice;
                  
                  if (quantity > 0 && totalUnitPrice > 0) {
                    return (
                      <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                        ({addonPrice.toLocaleString('vi-VN')}đ × {quantity}{unit ? ' ' + unit : ''})
                      </Text>
                    );
                  }
                  return null;
                })()}
              </div>
            </Col>
            <Col span={12}>
              <div><Text type="secondary">Dịch vụ bổ sung:</Text></div>
              <div><Text strong>{(additionalCost || 0).toLocaleString('vi-VN')}đ</Text></div>
            </Col>
            <Col span={24} style={{ marginTop: 8 }}>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ textAlign: 'right' }}>
                <Text type="secondary">Tổng cộng: </Text>
                <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                  {(totalCost || 0).toLocaleString('vi-VN')}đ
                </Text>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    );
  };

  // Tab 5: Treatment Indications (for all record types)
  const renderTreatmentIndicationsTab = () => (
    <div>
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
                              {(() => {
                                const filteredServices = services.filter(s => 
                                  s.type === 'treatment' && 
                                  s.requireExamFirst === true && 
                                  s.isActive === true
                                );
                                console.log('🔍 [Treatment Indications Tab] Total services:', services.length);
                                console.log('🔍 [Treatment Indications Tab] Filtered services:', filteredServices.length, filteredServices);
                                return filteredServices.map(service => {
                                  // Get min price from serviceAddOns
                                  const minPrice = service.serviceAddOns && service.serviceAddOns.length > 0
                                    ? Math.min(...service.serviceAddOns.map(a => a.price || 0))
                                    : 0;
                                  return (
                                    <Option key={service._id} value={service._id}>
                                      <Space>
                                        <span>{service.name}</span>
                                        {minPrice > 0 && (
                                          <Text type="secondary" style={{ fontSize: 12 }}>
                                            - Từ {minPrice.toLocaleString('vi-VN')}đ
                                          </Text>
                                        )}
                                      </Space>
                                    </Option>
                                  );
                                });
                              })()}
                            </Select>
                          </Form.Item>
                          {selectedService && selectedService.serviceAddOns && selectedService.serviceAddOns.length > 0 && (
                            <div style={{ marginTop: -12, marginBottom: 8, fontSize: 12, color: '#666' }}>
                              Giá từ: <strong>{Math.min(...selectedService.serviceAddOns.map(a => a.price || 0)).toLocaleString('vi-VN')}đ</strong>
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
                              notFoundContent={
                                selectedServiceId 
                                  ? (loadingAddOns ? 'Đang tải...' : 'Dịch vụ này không có dịch vụ con nào')
                                  : 'Vui lòng chọn dịch vụ trước'
                              }
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
                              {(() => {
                                console.log('🔍 [Treatment Indications - AddOns Select] serviceId:', selectedServiceId, 'addOns:', addOnsForService.length, addOnsForService);
                                return addOnsForService.map(addOn => (
                                  <Option key={addOn._id} value={addOn._id}>
                                    <Space>
                                      <span>{addOn.name}</span>
                                      <Tag color="blue">{addOn.unit}</Tag>
                                      <Text type="secondary">- {getEffectivePrice(addOn).toLocaleString('vi-VN')}đ</Text>
                                    </Space>
                                  </Option>
                                ));
                              })()}
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
                              rows={5}
                              maxLength={300}
                              showCount
                              className='custom-textarea'
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
    <>
    <Modal
      title={
        <Space>
          <FileTextOutlined style={{ fontSize: 20 }} />
          {mode === 'edit' ? 'Sửa hồ sơ bệnh án' : 'Tạo hồ sơ bệnh án mới'}
        </Space>
      }
      open={visible}
      onCancel={handleModalClose}
      width={900}
      footer={[
        <Button key="cancel" onClick={handleModalClose} disabled={loading}>
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
      {loadingData ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Đang tải dữ liệu...</div>
        </div>
      ) : (
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
      )}

    </Modal>
    
    {/* 🆕 Delete confirmation modal */}
    <Modal
      title="Xác nhận xóa dịch vụ"
      open={deleteConfirmModal.visible}
      onOk={confirmDeleteAdditionalService}
      onCancel={cancelDeleteAdditionalService}
      okText="Xóa"
      cancelText="Hủy"
      okButtonProps={{ danger: true }}
    >
      <p>Bạn có chắc muốn xóa dịch vụ <strong>"{deleteConfirmModal.serviceName}"</strong>?</p>
      <p style={{ color: '#666', fontSize: 13 }}>Thay đổi sẽ được lưu khi bạn nhấn "Cập nhật".</p>
    </Modal>
    </>
  );
};

export default RecordFormModal;

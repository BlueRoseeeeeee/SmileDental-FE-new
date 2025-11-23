import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Typography, 
  Button, 
  Space,
  Tag,
  Alert,
  Row,
  Col,
  Spin,
  Empty,
  message,
  Tooltip
} from 'antd';
import { 
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import slotService from '../../services/slotService.js';
import scheduleConfigService from '../../services/scheduleConfigService.js';
import { mockSlots, mockServices, mockDentists } from '../../services/mockData.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { groupConsecutiveSlots, groupSlotsByShift, formatCurrency } from '../../utils/slotGrouping.js';
import './BookingSelectTime.css';

const { Title, Text } = Typography;

// Toggle this to use mock data for testing
const USE_MOCK_DATA = false;

const BookingSelectTime = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServiceAddOn, setSelectedServiceAddOn] = useState(null); // 🆕 Store selected addon
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlotGroup, setSelectedSlotGroup] = useState(null); // 🆕 Change from single slot to group
  const [availableSlotGroups, setAvailableSlotGroups] = useState({
    morning: [],
    afternoon: [],
    evening: []
  });
  const [loading, setLoading] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState(null); // 🆕 Store config for deposit calculation
  const [selectedRoom, setSelectedRoom] = useState(null);

  // 🆕 Helper function to get service duration
  const getServiceDuration = () => {
    if (selectedServiceAddOn) {
      // Case 1: User selected a specific addon
      return selectedServiceAddOn.durationMinutes;
    } else if (selectedService?.serviceAddOns && selectedService.serviceAddOns.length > 0) {
      // Case 2: No addon selected → use LONGEST ACTIVE addon duration
      const activeAddons = selectedService.serviceAddOns.filter(addon => addon.isActive === true);
      if (activeAddons.length > 0) {
        const longestAddon = activeAddons.reduce((longest, addon) => {
          return (addon.durationMinutes > longest.durationMinutes) ? addon : longest;
        }, activeAddons[0]);
        return longestAddon.durationMinutes;
      }
      // Fallback if no active addons
    } else if (selectedService?.durationMinutes) {
      // Case 3: Fallback to service duration (if exists)
      return selectedService.durationMinutes;
    }
    return 15; // Default
  };

  useEffect(() => {
    // Fetch schedule config for deposit amount
    const fetchScheduleConfig = async () => {
      try {
        const response = await scheduleConfigService.getConfig();
        if (response.success && response.data) {
          setScheduleConfig(response.data);
          console.log('📋 Schedule config loaded:', response.data);
        }
      } catch (error) {
        console.error('Error fetching schedule config:', error);
        // Set default if fetch fails
        setScheduleConfig({ depositAmount: 50000 });
      }
    };

    fetchScheduleConfig();
  }, []);

  useEffect(() => {
    // Pre-populate localStorage with mock data if using mocks
    if (USE_MOCK_DATA) {
      if (!localStorage.getItem('booking_service')) {
        localStorage.setItem('booking_service', JSON.stringify(mockServices[0]));
      }
      if (!localStorage.getItem('booking_dentist')) {
        localStorage.setItem('booking_dentist', JSON.stringify(mockDentists[0]));
      }
      if (!localStorage.getItem('booking_date')) {
        localStorage.setItem('booking_date', '2025-10-20'); // Mock date matching slots
      }
    }

    // Kiểm tra xem đã chọn đủ thông tin chưa
    const service = localStorage.getItem('booking_service');
    const serviceAddOn = localStorage.getItem('booking_serviceAddOn');
    const serviceAddOnUserSelected = localStorage.getItem('booking_serviceAddOn_userSelected');
    const dentist = localStorage.getItem('booking_dentist');
    const date = localStorage.getItem('booking_date');
    
    if (!service || !dentist || !date) {
      navigate('/patient/booking/select-service');
      return;
    }
    
    const serviceData = JSON.parse(service);
    const serviceAddOnData = serviceAddOn ? JSON.parse(serviceAddOn) : null;
    const dentistData = JSON.parse(dentist);
    
    setSelectedService(serviceData);
    // Only set selectedServiceAddOn if user actually selected it (not auto-selected)
    setSelectedServiceAddOn(serviceAddOnUserSelected === 'true' ? serviceAddOnData : null);
    setSelectedDentist(dentistData);
    setSelectedDate(dayjs(date));
    
    // Fetch available slots with service info
    fetchAvailableSlots(dentistData._id, date, serviceData);
  }, []);

  const fetchAvailableSlots = async (dentistId, date, serviceData) => {
    try {
      setLoading(true);
      
      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setAvailableSlotGroups(mockSlots);
      } else {
        // 🏥 Log service info for debugging
        console.log('🏥 Service ID:', serviceData?._id);
        console.log('🏥 Allowed RoomTypes:', serviceData?.allowedRoomTypes);
        
        // Call API to get dentist's slots on selected date with serviceId
        const response = await slotService.getDentistSlotsFuture(dentistId, {
          date: date,
          shiftName: '', // Get all shifts
          serviceId: serviceData?._id // 🏥 Pass serviceId for roomType filtering
        });
        
        console.log('⏰ Slots API response:', response);
        
        if (response.success && response.data) {
          // Load selectedServiceAddOn from localStorage (priority: addon duration > service duration)
          const serviceAddOnData = localStorage.getItem('booking_serviceAddOn');
          const selectedServiceAddOn = serviceAddOnData ? JSON.parse(serviceAddOnData) : null;
          
          // Get duration: prioritize selectedServiceAddOn, fallback to longest addon duration, default to 15min
          let serviceDuration = 15; // default
          
          if (selectedServiceAddOn) {
            // Case 1: User selected a specific addon
            serviceDuration = selectedServiceAddOn.durationMinutes;
            console.log('🎯 Using selected addon duration:', serviceDuration, 'minutes from', selectedServiceAddOn.name);
          } else if (serviceData?.serviceAddOns && serviceData.serviceAddOns.length > 0) {
            // Case 2: No addon selected → use LONGEST ACTIVE addon duration
            const activeAddons = serviceData.serviceAddOns.filter(addon => addon.isActive === true);
            if (activeAddons.length > 0) {
              const longestAddon = activeAddons.reduce((longest, addon) => {
                return (addon.durationMinutes > longest.durationMinutes) ? addon : longest;
              }, activeAddons[0]);
              
              serviceDuration = longestAddon.durationMinutes;
              console.log('🎯 No addon selected → Using LONGEST ACTIVE addon duration:', serviceDuration, 'minutes from', longestAddon.name);
            } else {
              console.log('⚠️ No active addons, using service duration');
            }
          } else if (serviceData?.durationMinutes) {
            // Case 3: Fallback to service duration (if exists)
            serviceDuration = serviceData.durationMinutes;
            console.log('🎯 Using service duration:', serviceDuration, 'minutes');
          }
          
          const slotDuration = 15; // Default slot duration (should match backend config)
          
          console.log('🔍 Service:', serviceData?.name, '| Selected AddOn:', selectedServiceAddOn?.name || 'none', '| Final Duration:', serviceDuration, 'min');
          
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
          
          console.log('📊 Total slots before filtering:', allSlots.length);
          
          // ✅ Filter only active slots (keep all statuses for display)
          const activeSlots = allSlots.filter(slot => slot.isActive === true);
          console.log('✅ Active slots:', activeSlots.length, '/', allSlots.length);
          
          // 🔍 Debug: Show slot status distribution
          const statusCount = activeSlots.reduce((acc, s) => {
            acc[s.status] = (acc[s.status] || 0) + 1;
            return acc;
          }, {});
          console.log('� Slot status distribution:', statusCount);
          
          // Debug: Log first few slots to check structure
          if (activeSlots.length > 0) {
            console.log('🔍 Sample slot structure:', {
              slot: activeSlots[0],
              startTime: activeSlots[0].startTime,
              startTimeVN: activeSlots[0].startTimeVN,
              endTime: activeSlots[0].endTime,
              endTimeVN: activeSlots[0].endTimeVN,
              isActive: activeSlots[0].isActive
            });
          }
          
          // Group slots by shift first
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
          
          // 🔥 Group consecutive slots for each shift
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
          
          console.log('� Total slot groups created:', totalGroups);
          
          if (totalGroups === 0) {
            message.warning(`Không có khung giờ phù hợp (cần ${Math.ceil(serviceDuration/slotDuration)} slot liên tục)`);
          }
        } else {
          console.error('Invalid API response format:', response);
          message.error('Không thể tải danh sách giờ khám');
        }
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      message.error('Lỗi kết nối: ' + (error.message || 'Không thể kết nối đến server'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (slotGroup) => {
    setSelectedSlotGroup(slotGroup);
  };

  const handleContinue = () => {
    if (selectedSlotGroup) {
      // 🆕 Lưu danh sách slot IDs và thông tin group
      localStorage.setItem('booking_slotIds', JSON.stringify(selectedSlotGroup.slotIds));
      localStorage.setItem('booking_slotGroup', JSON.stringify(selectedSlotGroup));
      
      // Check if user is authenticated
      if (!isAuthenticated) {
        // Redirect to login with return path
        navigate('/login', { state: { from: '/patient/booking/create-appointment' } });
      } else {
        navigate('/patient/booking/create-appointment');
      }
    }
  };

  const handleBack = () => {
    navigate('/patient/booking/select-date');
  };

  const renderShiftSlots = (shift, shiftName, slotGroups) => {
    const serviceDuration = getServiceDuration();
    const requiredSlots = Math.ceil(serviceDuration / 15);
    
    return (
      <div key={shift} style={{ marginBottom: 24 }}>
        <Space style={{ marginBottom: 12 }}>
          <Title level={5} style={{ margin: 0, color: '#2c5f4f' }}>
            <ClockCircleOutlined /> {shiftName}
          </Title>
          {/* <Tooltip title={`Mỗi khung giờ sẽ đặt ${requiredSlots} slot liên tục (${serviceDuration} phút)`}>
            <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
          </Tooltip> */}
        </Space>
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
            {slotGroups.map((slotGroup) => {
              const isSelected = selectedSlotGroup?.groupId === slotGroup.groupId;
              const slotCount = slotGroup.slots.length;
              const isAvailable = slotGroup.isAvailable !== false; // Default true if not set
              
              return (
                <Col xs={12} sm={8} md={6} key={slotGroup.groupId}>
                  <Tooltip 
                    title={
                      !isAvailable 
                        ? slotGroup.unavailableReason || 'Khung giờ không khả dụng'
                        : `${slotCount} slot - ${slotGroup.displayTime}`
                    }
                  >
                    <div 
                      className={`time-slot-wrapper ${!isAvailable ? 'unavailable' : ''} ${isSelected ? 'selected' : ''}`}
                      onClick={() => isAvailable && handleSelectSlot(slotGroup)}
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
                        justifyContent: 'center'
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
                      
                      {/* {isAvailable && slotCount > 1 && (
                        <Tag color="blue" style={{ marginTop: 4, fontSize: 11 }}>
                          {slotCount} slot
                        </Tag>
                      )} */}
                    </div>
                  </Tooltip>
                </Col>
              );
            })}
          </Row>
        )}
      </div>
    );
  };

  const totalGroups = availableSlotGroups.morning.length + 
                      availableSlotGroups.afternoon.length + 
                      availableSlotGroups.evening.length;

  return (
    <div className="booking-select-time-page">

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
        <div className='breadcrumb-container-booking-select-time'>
          <Space split=">">
            <a href="/patient/booking/select-service">Trang chủ</a>
            <a href="/patient/booking">Đặt lịch khám</a>
            <a href='/patient/booking/select-service'>Chọn dịch vụ</a>
            <a href='/patient/booking/select-addon'>Chọn gói dịch vụ</a>
            <a href='/patient/booking/select-dentist'>Chọn nha sĩ</a>
            <a href='/patient/booking/select-date'>Chọn ngày khám</a>
            <Text>Chọn giờ khám</Text>
          </Space>
        </div>
          <Row gutter={[24, 24]}>
            {/* Left: Summary Info */}
            <Col xs={24} md={8}>
              <Card className="summary-card" title={<><ClockCircleOutlined /> Thông tin chi tiết</>}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Dịch vụ:</Text>
                    <Text color="blue" style={{ fontSize: 13 }}>
                      {selectedService?.name}
                    </Text>
                  </div>
                  
                  {selectedServiceAddOn && (
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>Gói dịch vụ:</Text>
                      <Text style={{ fontSize: 13 }}>
                        {selectedServiceAddOn.name}
                      </Text>
                    </div>
                  )}
                  
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Thời gian dự kiến:</Text>
                    {selectedServiceAddOn ? (
                      <Tag color="cyan" style={{ fontSize: 13 }}>
                        ⏱️ {selectedServiceAddOn.durationMinutes} phút
                      </Tag>
                    ) : selectedService?.serviceAddOns && selectedService.serviceAddOns.length > 0 ? (
                      <>
                        <Tag color="orange" style={{ fontSize: 12 }}>
                          ⏱️ {getServiceDuration()} phút
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                          (Gói dài nhất trong dịch vụ)
                        </Text>
                      </>
                    ) : selectedService?.durationMinutes ? (
                      <Tag color="cyan" style={{ fontSize: 12 }}>
                        ⏱️ {selectedService.durationMinutes} phút
                      </Tag>
                    ) : null}
                  </div>
                  
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Nha sĩ:</Text>
                    <Text style={{ fontSize: 13 }}>
                      {selectedDentist?.title || 'NS. '} {selectedDentist?.fullName}
                    </Text>
                  </div>
                  
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Giới tính:</Text>
                    <Text style={{ fontSize: 13 }}>
                      {selectedDentist?.gender === 'male' ? 'Nam' : selectedDentist?.gender === 'female' ? 'Nữ' : 'Khác'}
                    </Text>
                  </div>
                  
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Ngày khám:</Text>
                    <Tag color="green" style={{ fontSize: 13 }}>
                      {selectedDate?.format('DD/MM/YYYY')}
                    </Tag>
                  </div>
                  
                  {selectedSlotGroup && scheduleConfig && (
                    <>
                      <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Thời gian khám:</Text>
                        <Tag color="orange" style={{ fontSize: 13 }}>
                          {selectedSlotGroup.displayTime}
                        </Tag>
                      </div>
                      {/* <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Số slot đặt:</Text>
                        <Tag color="purple" style={{ fontSize: 13 }}>
                          {selectedSlotGroup.slots.length} slot × 15 phút
                        </Tag>
                      </div> */}
                      <Alert
                        type="success"
                        showIcon
                        message="💰 Tiền cọc"
                        description={`${formatCurrency(selectedSlotGroup.slots.length * scheduleConfig.depositAmount)}`}
                        style={{ marginTop: 8 }}
                      />
                    </>
                  )}
                </Space>
              </Card>
            </Col>

            {/* Right: Time Slots */}
            <Col xs={24} md={16}>
              <Card className="booking-card">
              <div className='booking-card-header'>
                <h5>
                  Vui lòng chọn giờ khám
                </h5>
              </div>

                <Spin spinning={loading}>
                  <div style={{ marginBottom: 24 }}>
                    <Alert
                      type="info"
                      showIcon
                      message={totalGroups > 0 
                        ? `Có ${totalGroups} khung giờ phù hợp trong ngày ${selectedDate?.format('DD/MM/YYYY')}`
                        : `Ngày ${selectedDate?.format('DD/MM/YYYY')} - Chọn khung giờ phù hợp`
                      }
                      // description={
                      //   (() => {
                      //     const duration = getServiceDuration();
                      //     const slotsNeeded = Math.ceil(duration / 15);
                      //     const serviceName = selectedServiceAddOn ? `${selectedService?.name} - ${selectedServiceAddOn.name}` : selectedService?.name;
                      //     return serviceName && `Dịch vụ "${serviceName}" cần ${slotsNeeded} slot liên tục (${duration} phút)`;
                      //   })()
                      // }
                    />
                  </div>

                  {/* Always show all 3 shifts */}
                  {renderShiftSlots('morning', 'Ca sáng', availableSlotGroups.morning)}
                  {renderShiftSlots('afternoon', 'Ca chiều', availableSlotGroups.afternoon)}
                  {renderShiftSlots('evening', 'Ca tối', availableSlotGroups.evening)}

                  {selectedSlotGroup && scheduleConfig && (
                    <Alert
                      type="success"
                      showIcon
                      message={`Đã chọn: ${selectedSlotGroup.displayTime}`}
                      description={`Tiền cọc: ${formatCurrency(selectedSlotGroup.slots.length * scheduleConfig.depositAmount)}`}
                      style={{ marginTop: 16 }}
                    />
                  )}
                </Spin>

                {/* Actions */}
                <div style={{ marginTop: 32, textAlign: 'center' }}>
                  <Space size="large">
                    <Button 
                      size="large" 
                      icon={<ArrowLeftOutlined />}
                      onClick={handleBack} 
                      style={{ borderRadius: 6 }}
                    >
                      Quay lại bước trước
                    </Button>
                    {selectedSlotGroup && (
                      <button 
                        onClick={handleContinue}
                        style={{ 
                          backgroundColor: '#3498db',
                          borderRadius: 6,
                          color: 'white',
                          fontSize: 16,
                          padding: '4px 20px',
                          cursor: 'pointer',
                          border: 'none'
                        }}
                      >
                        Tiếp tục {scheduleConfig && `(${formatCurrency(selectedSlotGroup.slots.length * scheduleConfig.depositAmount)})`}
                      </button>
                    )}
                  </Space>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default BookingSelectTime;

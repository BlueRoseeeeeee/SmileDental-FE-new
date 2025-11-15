/**
 * PATCH FOR BookingSelectTime.jsx
 * Replace the fetchAvailableSlots function (starting from line 128) with this code
 * 
 * Changes:
 * - Use getDentistWorkingDates API instead of getDentistSlotsFuture
 * - API already filters by roomType, so no need to re-filter on frontend
 * - Extract date data from workingDates response
 * - Transform shift slots format to match frontend expectations
 */

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
      
      // Load selectedServiceAddOn from localStorage
      const serviceAddOnData = localStorage.getItem('booking_serviceAddOn');
      const selectedServiceAddOn = serviceAddOnData ? JSON.parse(serviceAddOnData) : null;
      
      // Get duration: prioritize selectedServiceAddOn, fallback to longest addon duration, default to 15min
      let serviceDuration = 15; // default
      
      if (selectedServiceAddOn) {
        // Case 1: User selected a specific addon
        serviceDuration = selectedServiceAddOn.durationMinutes;
        console.log('🎯 Using selected addon duration:', serviceDuration, 'minutes from', selectedServiceAddOn.name);
      } else if (serviceData?.serviceAddOns && serviceData.serviceAddOns.length > 0) {
        // Case 2: No addon selected → use LONGEST addon duration
        const longestAddon = serviceData.serviceAddOns.reduce((longest, addon) => {
          return (addon.durationMinutes > longest.durationMinutes) ? addon : longest;
        }, serviceData.serviceAddOns[0]);
        
        serviceDuration = longestAddon.durationMinutes;
        console.log('🎯 No addon selected → Using LONGEST addon duration:', serviceDuration, 'minutes from', longestAddon.name);
      } else if (serviceData?.durationMinutes) {
        // Case 3: Fallback to service duration (if exists)
        serviceDuration = serviceData.durationMinutes;
        console.log('🎯 Using service duration:', serviceDuration, 'minutes');
      }
      
      console.log('🔍 Service:', serviceData?.name, '| Selected AddOn:', selectedServiceAddOn?.name || 'none', '| Final Duration:', serviceDuration, 'min');
      
      // 🆕 Call working-dates API instead of details/future (already filters by roomType)
      const response = await slotService.getDentistWorkingDates(
        dentistId,
        serviceDuration,
        serviceData?._id // Pass serviceId for roomType filtering
      );
      
      console.log('⏰ Working dates API response:', response);
      
      if (response.success && response.data) {
        // 🆕 Extract slots for the selected date from working-dates response
        const workingDates = response.data.workingDates || [];
        const selectedDateStr = dayjs(date).format('YYYY-MM-DD');
        
        console.log('🔍 Looking for date:', selectedDateStr);
        console.log('📅 Available working dates:', workingDates.map(d => d.date));
        
        const dateData = workingDates.find(d => d.date === selectedDateStr);
        
        if (!dateData) {
          console.warn('⚠️ No data found for selected date:', selectedDateStr);
          message.warning('Không có lịch làm việc cho ngày đã chọn');
          setAvailableSlotGroups({ morning: [], afternoon: [], evening: [] });
          setLoading(false);
          return;
        }
        
        console.log('✅ Found date data:', dateData);
        
        const slotDuration = 15; // Default slot duration
        const requiredSlots = Math.ceil(serviceDuration / slotDuration);
        
        // 🆕 Transform API format to frontend format
        const transformShiftSlots = (shiftData) => {
          if (!shiftData.available || !shiftData.slots || shiftData.slots.length === 0) {
            return [];
          }
          
          // Group consecutive slots
          const groups = [];
          let currentGroup = [];
          
          for (let i = 0; i < shiftData.slots.length; i++) {
            const slot = shiftData.slots[i];
            
            // Start new group or add to current group
            if (currentGroup.length === 0) {
              currentGroup.push(slot);
            } else {
              const lastSlot = currentGroup[currentGroup.length - 1];
              // Check if slots are consecutive (within 15 minutes)
              const lastEndTime = new Date(`2000-01-01 ${lastSlot.endTime}`);
              const currentStartTime = new Date(`2000-01-01 ${slot.startTime}`);
              const diffMinutes = (currentStartTime - lastEndTime) / (1000 * 60);
              
              if (diffMinutes <= 1) { // Allow 1 minute tolerance
                currentGroup.push(slot);
              } else {
                // Save current group if it meets requirements
                if (currentGroup.length >= requiredSlots) {
                  groups.push({
                    slotIds: currentGroup.map(s => s._id),
                    slots: currentGroup,
                    startTime: currentGroup[0].startTime,
                    endTime: currentGroup[currentGroup.length - 1].endTime,
                    count: currentGroup.length,
                    duration: currentGroup.length * slotDuration
                  });
                }
                // Start new group
                currentGroup = [slot];
              }
            }
          }
          
          // Save last group if valid
          if (currentGroup.length >= requiredSlots) {
            groups.push({
              slotIds: currentGroup.map(s => s._id),
              slots: currentGroup,
              startTime: currentGroup[0].startTime,
              endTime: currentGroup[currentGroup.length - 1].endTime,
              count: currentGroup.length,
              duration: currentGroup.length * slotDuration
            });
          }
          
          return groups;
        };
        
        // 🆕 Use data from working-dates API (already filtered by roomType)
        const groupedSlots = {
          morning: transformShiftSlots(dateData.shifts.morning),
          afternoon: transformShiftSlots(dateData.shifts.afternoon),
          evening: transformShiftSlots(dateData.shifts.evening)
        };
        
        console.log('✨ Transformed slot groups:', groupedSlots);
        
        setAvailableSlotGroups(groupedSlots);
        
        const totalGroups = groupedSlots.morning.length + 
                           groupedSlots.afternoon.length + 
                           groupedSlots.evening.length;
        
        console.log('🎯 Total slot groups created:', totalGroups);
        
        if (totalGroups === 0) {
          message.warning(`Không có khung giờ phù hợp (cần ${requiredSlots} slot liên tục cho dịch vụ ${serviceDuration} phút)`);
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

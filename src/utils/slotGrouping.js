/**
 * @author: TrungNghia & ThuTram
 * Slot Grouping Utilities - Group consecutive slots based on service duration
 */

import dayjs from 'dayjs';

/**
 * Group consecutive available slots based on service duration
 * @param {Array} slots - Array of slot objects with startTime, endTime, status
 * @param {Number} serviceDurationMinutes - Service duration in minutes (e.g., 45)
 * @param {Number} slotDurationMinutes - Duration of each slot (e.g., 15)
 * @returns {Array} Array of slot groups, each group contains consecutive slots
 * 
 * Example:
 * - Service duration: 45 minutes
 * - Slot duration: 15 minutes
 * - Required slots: 45/15 = 3 slots
 * - Input: [slot1, slot2, slot3, slot4, slot5]
 * - Output: [[slot1, slot2, slot3], [slot2, slot3, slot4], [slot3, slot4, slot5]]
 */
export const groupConsecutiveSlots = (slots, serviceDurationMinutes, slotDurationMinutes = 15) => {
  // Calculate required number of consecutive slots
  const requiredSlotCount = Math.ceil(serviceDurationMinutes / slotDurationMinutes);
  
  console.log('🔢 Slot grouping params:', {
    totalSlots: slots.length,
    serviceDuration: serviceDurationMinutes,
    slotDuration: slotDurationMinutes,
    requiredSlotCount
  });
  
  // If service fits in 1 slot or less, return individual slots with status
  if (requiredSlotCount <= 1) {
    return slots
      .map(slot => ({
        groupId: slot._id,
        slots: [slot],
        slotIds: [slot._id],
        startTime: slot.startTime,
        endTime: slot.endTime,
        displayTime: formatSlotTime(slot.startTime, slot.endTime),
        isAvailable: slot.status === 'available',
        unavailableReason: slot.status === 'locked' ? 'Đang được giữ chỗ' : 
                          slot.status === 'booked' ? 'Đã có người đặt' : null
      }));
  }
  
  // Sort ALL slots (don't filter by status yet)
  const sortedSlots = slots
    .sort((a, b) => {
      const timeA = parseTimeToMinutes(a.startTimeVN || a.startTime);
      const timeB = parseTimeToMinutes(b.startTimeVN || b.startTime);
      return timeA - timeB;
    });
  
  console.log('📊 Total slots to process:', sortedSlots.length);
  console.log('📊 Slot status breakdown:', {
    available: sortedSlots.filter(s => s.status === 'available').length,
    locked: sortedSlots.filter(s => s.status === 'locked').length,
    booked: sortedSlots.filter(s => s.status === 'booked').length
  });
  
  // Find all possible consecutive groups (including unavailable ones)
  const slotGroups = [];
  
  for (let i = 0; i <= sortedSlots.length - requiredSlotCount; i++) {
    const potentialGroup = [];
    let isConsecutive = true;
    let hasUnavailableSlot = false;
    let unavailableReasons = [];
    let statusPriority = 0; // 0: available, 1: locked, 2: booked
    
    // Check if we can form a consecutive group starting from index i
    for (let j = 0; j < requiredSlotCount; j++) {
      const currentSlot = sortedSlots[i + j];
      
      if (!currentSlot) {
        isConsecutive = false;
        break;
      }
      
      // Track unavailable slots with priority
      // Priority: booked (2) > locked (1) > available (0)
      if (currentSlot.status !== 'available') {
        hasUnavailableSlot = true;
        
        if (currentSlot.status === 'booked') {
          statusPriority = Math.max(statusPriority, 2);
          unavailableReasons.push('booked'); // Track for priority
        } else if (currentSlot.status === 'locked') {
          statusPriority = Math.max(statusPriority, 1);
          unavailableReasons.push('locked'); // Track for priority
        }
      }
      
      // Check if current slot is consecutive with previous slot
      if (j > 0) {
        const prevSlot = potentialGroup[j - 1];
        if (!areSlotsConsecutive(prevSlot, currentSlot)) {
          isConsecutive = false;
          break;
        }
      }
      
      potentialGroup.push(currentSlot);
    }
    
    // If we found a valid consecutive group, add it (even if unavailable)
    if (isConsecutive && potentialGroup.length === requiredSlotCount) {
      const firstSlot = potentialGroup[0];
      const lastSlot = potentialGroup[potentialGroup.length - 1];
      
      const startTimeToUse = firstSlot.startTimeVN || firstSlot.startTime;
      const endTimeToUse = lastSlot.endTimeVN || lastSlot.endTime;
      
      // Determine display reason based on highest priority status
      let displayReason = null;
      if (statusPriority === 2) {
        displayReason = 'Có slot đã được đặt';
      } else if (statusPriority === 1) {
        displayReason = 'Có slot đang được giữ chỗ';
      }
      
      slotGroups.push({
        groupId: `group_${firstSlot._id}`,
        slots: potentialGroup,
        slotIds: potentialGroup.map(s => s._id),
        startTime: startTimeToUse,
        endTime: endTimeToUse,
        displayTime: formatSlotTime(startTimeToUse, endTimeToUse),
        roomId: firstSlot.roomId,
        roomName: firstSlot.roomName,
        shiftName: firstSlot.shiftName,
        isAvailable: !hasUnavailableSlot,
        unavailableReason: displayReason,
        statusPriority: statusPriority, // For sorting/debugging
        slotStatuses: potentialGroup.map(s => s.status) // For debugging
      });
    }
  }
  
  console.log('📦 Total slot groups created:', slotGroups.length);
  console.log('✅ Available groups:', slotGroups.filter(g => g.isAvailable).length);
  console.log('❌ Unavailable groups:', slotGroups.filter(g => !g.isAvailable).length);
  
  return slotGroups;
};

/**
 * Check if two slots are consecutive (endTime of slot1 === startTime of slot2)
 */
const areSlotsConsecutive = (slot1, slot2) => {
  // ✅ VALIDATE 1: Must be from the same room
  const room1Id = slot1.room?.id || slot1.room?._id || null;
  const room2Id = slot2.room?.id || slot2.room?._id || null;
  
  // If room info exists, they must match
  if (room1Id && room2Id) {
    if (room1Id.toString() !== room2Id.toString()) {
      console.log(`❌ Slots not in same room: ${room1Id} vs ${room2Id}`);
      return false;
    }
  }
  
  // ✅ VALIDATE 2: Must be in the same subRoom (if exists)
  const subRoom1Id = slot1.room?.subRoom?.id || slot1.room?.subRoom?._id || null;
  const subRoom2Id = slot2.room?.subRoom?.id || slot2.room?.subRoom?._id || null;
  
  // Both must have same subRoom status (both null or both have value)
  if (subRoom1Id !== subRoom2Id) {
    // Convert to string for comparison if both exist
    if (subRoom1Id && subRoom2Id) {
      if (subRoom1Id.toString() !== subRoom2Id.toString()) {
        console.log(`❌ Slots not in same subRoom: ${subRoom1Id} vs ${subRoom2Id}`);
        return false;
      }
    } else {
      // One has subRoom, one doesn't
      console.log(`❌ SubRoom mismatch: one has subRoom, one doesn't`);
      return false;
    }
  }
  
  // ✅ VALIDATE 3: Time must be consecutive
  const endTime1 = parseTimeToMinutes(slot1.endTimeVN || slot1.endTime);
  const startTime2 = parseTimeToMinutes(slot2.startTimeVN || slot2.startTime);
  
  // Allow 0-1 minute gap for rounding errors
  const isTimeConsecutive = Math.abs(endTime1 - startTime2) <= 1;
  
  if (!isTimeConsecutive) {
    console.log(`❌ Slots not time-consecutive: gap = ${Math.abs(endTime1 - startTime2)} minutes`);
  }
  
  return isTimeConsecutive;
};

/**
 * Parse time string (HH:mm) or Date object to minutes since midnight
 */
const parseTimeToMinutes = (time) => {
  if (!time) return 0;
  
  let timeStr;
  if (typeof time === 'string') {
    // Check if it's already HH:mm format
    if (time.includes(':') && time.length <= 5) {
      timeStr = time;
    } else {
      // Try to parse as Date string (ISO format)
      timeStr = dayjs(time).format('HH:mm');
    }
  } else if (time instanceof Date || dayjs.isDayjs(time)) {
    timeStr = dayjs(time).format('HH:mm');
  } else {
    console.warn('Unknown time format:', time);
    return 0;
  }
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Format slot time range for display
 */
const formatSlotTime = (startTime, endTime) => {
  let start, end;
  
  // Prioritize VN time format (HH:mm string)
  if (typeof startTime === 'string' && startTime.includes(':') && startTime.length <= 5) {
    start = startTime;
  } else {
    start = dayjs(startTime).format('HH:mm');
  }
  
  if (typeof endTime === 'string' && endTime.includes(':') && endTime.length <= 5) {
    end = endTime;
  } else {
    end = dayjs(endTime).format('HH:mm');
  }
  
  return `${start} - ${end}`;
};

/**
 * Group slots by shift for display
 */
export const groupSlotsByShift = (slotGroups) => {
  return {
    morning: slotGroups.filter(g => g.shiftName === 'Ca Sáng'),
    afternoon: slotGroups.filter(g => g.shiftName === 'Ca Chiều'),
    evening: slotGroups.filter(g => g.shiftName === 'Ca Tối')
  };
};

/**
 * Calculate total deposit amount
 */
export const calculateDepositAmount = (slotCount, depositPerSlot = 50000) => {
  return slotCount * depositPerSlot;
};

/**
 * Format currency (VND)
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

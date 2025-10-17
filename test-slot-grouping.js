/**
 * Test Slot Grouping Logic
 * Run: node test-slot-grouping.js
 */

// Mock slots data
const mockSlots = [
  { _id: '1', startTimeVN: '08:00', endTimeVN: '08:15', status: 'available', shiftName: 'Ca Sáng' },
  { _id: '2', startTimeVN: '08:15', endTimeVN: '08:30', status: 'available', shiftName: 'Ca Sáng' },
  { _id: '3', startTimeVN: '08:30', endTimeVN: '08:45', status: 'available', shiftName: 'Ca Sáng' },
  { _id: '4', startTimeVN: '08:45', endTimeVN: '09:00', status: 'available', shiftName: 'Ca Sáng' },
  { _id: '5', startTimeVN: '09:00', endTimeVN: '09:15', status: 'available', shiftName: 'Ca Sáng' },
];

// Simplified grouping logic
function parseTimeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function areSlotsConsecutive(slot1, slot2) {
  const endTime1 = parseTimeToMinutes(slot1.endTimeVN);
  const startTime2 = parseTimeToMinutes(slot2.startTimeVN);
  return Math.abs(endTime1 - startTime2) <= 1;
}

function groupConsecutiveSlots(slots, serviceDurationMinutes, slotDurationMinutes = 15) {
  const requiredSlotCount = Math.ceil(serviceDurationMinutes / slotDurationMinutes);
  
  console.log('\n🔢 Grouping params:', {
    serviceDuration: serviceDurationMinutes,
    slotDuration: slotDurationMinutes,
    requiredSlotCount,
    totalSlots: slots.length
  });
  
  const availableSlots = slots
    .filter(slot => slot.status === 'available')
    .sort((a, b) => parseTimeToMinutes(a.startTimeVN) - parseTimeToMinutes(b.startTimeVN));
  
  const slotGroups = [];
  
  for (let i = 0; i <= availableSlots.length - requiredSlotCount; i++) {
    const potentialGroup = [];
    let isConsecutive = true;
    
    for (let j = 0; j < requiredSlotCount; j++) {
      const currentSlot = availableSlots[i + j];
      
      if (!currentSlot) {
        isConsecutive = false;
        break;
      }
      
      if (j > 0) {
        const prevSlot = potentialGroup[j - 1];
        if (!areSlotsConsecutive(prevSlot, currentSlot)) {
          isConsecutive = false;
          break;
        }
      }
      
      potentialGroup.push(currentSlot);
    }
    
    if (isConsecutive && potentialGroup.length === requiredSlotCount) {
      const firstSlot = potentialGroup[0];
      const lastSlot = potentialGroup[potentialGroup.length - 1];
      
      slotGroups.push({
        groupId: `group_${firstSlot._id}`,
        displayTime: `${firstSlot.startTimeVN} - ${lastSlot.endTimeVN}`,
        slotIds: potentialGroup.map(s => s._id),
        slots: potentialGroup
      });
    }
  }
  
  return slotGroups;
}

// Test 1: 15-minute service (1 slot)
console.log('\n=== TEST 1: 15-minute service ===');
const groups15 = groupConsecutiveSlots(mockSlots, 15);
console.log('Groups:', groups15.map(g => g.displayTime));

// Test 2: 30-minute service (2 slots)
console.log('\n=== TEST 2: 30-minute service ===');
const groups30 = groupConsecutiveSlots(mockSlots, 30);
console.log('Groups:', groups30.map(g => g.displayTime));

// Test 3: 45-minute service (3 slots)
console.log('\n=== TEST 3: 45-minute service ===');
const groups45 = groupConsecutiveSlots(mockSlots, 45);
console.log('Groups:', groups45.map(g => g.displayTime));

// Test 4: With missing slot
console.log('\n=== TEST 4: With slot 3 booked ===');
const slotsWithGap = [
  { _id: '1', startTimeVN: '08:00', endTimeVN: '08:15', status: 'available', shiftName: 'Ca Sáng' },
  { _id: '2', startTimeVN: '08:15', endTimeVN: '08:30', status: 'available', shiftName: 'Ca Sáng' },
  { _id: '3', startTimeVN: '08:30', endTimeVN: '08:45', status: 'booked', shiftName: 'Ca Sáng' },
  { _id: '4', startTimeVN: '08:45', endTimeVN: '09:00', status: 'available', shiftName: 'Ca Sáng' },
  { _id: '5', startTimeVN: '09:00', endTimeVN: '09:15', status: 'available', shiftName: 'Ca Sáng' },
];
const groupsGap = groupConsecutiveSlots(slotsWithGap, 45);
console.log('Groups:', groupsGap.map(g => g.displayTime));
console.log('Expected: Only ["08:45 - 09:30"] because slot 3 is booked');

console.log('\n✅ All tests complete!');

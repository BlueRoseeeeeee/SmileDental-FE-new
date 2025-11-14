import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

const VIETNAM_TZ = 'Asia/Ho_Chi_Minh';

/**
 * Get current active and upcoming price schedules for a service add-on
 * @param {Array} priceSchedules - Array of price schedules from serviceAddOn
 * @param {Number} basePrice - Base price of the add-on
 * @returns {Object} Object containing activeSchedule, upcomingSchedules, and effectivePrice
 */
export const getPriceScheduleInfo = (priceSchedules = [], basePrice = 0) => {
  if (!priceSchedules || priceSchedules.length === 0) {
    return {
      activeSchedule: null,
      upcomingSchedules: [],
      effectivePrice: basePrice,
      hasActiveSchedule: false,
      hasUpcomingSchedules: false
    };
  }

  // Get current time in Vietnam timezone
  const now = dayjs().tz(VIETNAM_TZ);

  // Filter only active schedules
  const activeSchedules = priceSchedules.filter(schedule => schedule.isActive === true);

  // Find currently active schedule (price schedule in effect now)
  const activeSchedule = activeSchedules.find(schedule => {
    const startDate = dayjs(schedule.startDate).tz(VIETNAM_TZ);
    const endDate = dayjs(schedule.endDate).tz(VIETNAM_TZ);
    return now.isBetween(startDate, endDate, null, '[]'); // inclusive of both start and end
  });

  // Find upcoming schedules (schedules that haven't started yet)
  const upcomingSchedules = activeSchedules
    .filter(schedule => {
      const startDate = dayjs(schedule.startDate).tz(VIETNAM_TZ);
      return now.isBefore(startDate);
    })
    .sort((a, b) => {
      // Sort by start date (earliest first)
      return dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf();
    });

  // Determine effective price
  const effectivePrice = activeSchedule ? activeSchedule.price : basePrice;

  return {
    activeSchedule,
    upcomingSchedules,
    effectivePrice,
    hasActiveSchedule: !!activeSchedule,
    hasUpcomingSchedules: upcomingSchedules.length > 0
  };
};

/**
 * Format date range for display
 * @param {String} startDate - Start date ISO string
 * @param {String} endDate - End date ISO string
 * @returns {String} Formatted date range string
 */
export const formatDateRange = (startDate, endDate) => {
  const start = dayjs(startDate).tz(VIETNAM_TZ);
  const end = dayjs(endDate).tz(VIETNAM_TZ);
  
  return `${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')}`;
};

/**
 * Format price with VND currency
 * @param {Number} price - Price value
 * @returns {String} Formatted price string
 */
export const formatPrice = (price) => {
  return price.toLocaleString('vi-VN') + ' VNĐ';
};

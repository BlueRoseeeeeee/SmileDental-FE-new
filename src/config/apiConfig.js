/**
 * Smart API Configuration with Auto-Fallback
 * Tries production backend first, falls back to localhost if unavailable
 */

// Production backend (deployed on VPS)
const PRODUCTION_BASE = 'https://be.smilecare.io.vn/api';
const PRODUCTION_BACKEND = 'https://be.smilecare.io.vn';

// Local development backend
const LOCAL_BASE = 'http://localhost';
const LOCAL_PORTS = {
  auth: 3001,
  user: 3001,
  room: 3002,
  service: 3003,
  schedule: 3005,
  appointment: 3006,
  payment: 3007,
  invoice: 3008,
  medicine: 3009,
  record: 3010,
  statistic: 3011,
  chatbot: 3013,
};

// Cache for backend availability check
let isProductionAvailable = null;
let lastCheckTime = 0;
const CHECK_INTERVAL = 60000; // Re-check every 60 seconds

/**
 * Check if production backend is available
 */
async function checkProductionAvailability() {
  const now = Date.now();
  
  // Use cached result if checked recently
  if (isProductionAvailable !== null && (now - lastCheckTime) < CHECK_INTERVAL) {
    return isProductionAvailable;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const response = await fetch(`${PRODUCTION_BACKEND}/health`, {
      signal: controller.signal,
      method: 'GET',
    });
    
    clearTimeout(timeoutId);
    isProductionAvailable = response.ok;
    lastCheckTime = now;
    
    console.log(`🔍 [API Config] Production backend: ${isProductionAvailable ? '✅ Available' : '❌ Unavailable'}`);
    return isProductionAvailable;
  } catch (error) {
    isProductionAvailable = false;
    lastCheckTime = now;
    console.log('⚠️ [API Config] Production backend unavailable, using localhost');
    return false;
  }
}

/**
 * Get API URL for a service with smart fallback
 * @param {string} serviceName - Name of the service (auth, user, etc.)
 * @returns {Promise<string>} The API URL to use
 */
export async function getServiceUrl(serviceName) {
  const useProduction = await checkProductionAvailability();
  
  if (useProduction) {
    return PRODUCTION_BASE;
  }
  
  const port = LOCAL_PORTS[serviceName] || 3001;
  return `${LOCAL_BASE}:${port}/api`;
}

/**
 * Get backend URL (without /api suffix)
 */
export async function getBackendUrl(serviceName) {
  const useProduction = await checkProductionAvailability();
  
  if (useProduction) {
    return PRODUCTION_BACKEND;
  }
  
  const port = LOCAL_PORTS[serviceName] || 3001;
  return `${LOCAL_BASE}:${port}`;
}

/**
 * Force refresh the availability check
 */
export function refreshAvailabilityCheck() {
  isProductionAvailable = null;
  lastCheckTime = 0;
}

/**
 * Get all service URLs at once (for initial setup)
 */
export async function getAllServiceUrls() {
  const useProduction = await checkProductionAvailability();
  
  if (useProduction) {
    return {
      auth: PRODUCTION_BASE,
      user: PRODUCTION_BASE,
      room: PRODUCTION_BASE,
      service: PRODUCTION_BASE,
      schedule: PRODUCTION_BASE,
      appointment: PRODUCTION_BASE,
      payment: PRODUCTION_BASE,
      invoice: PRODUCTION_BASE,
      medicine: PRODUCTION_BASE,
      record: PRODUCTION_BACKEND,
      statistic: PRODUCTION_BASE,
      chatbot: PRODUCTION_BASE,
      backend: PRODUCTION_BACKEND,
    };
  }
  
  return {
    auth: `${LOCAL_BASE}:${LOCAL_PORTS.auth}/api`,
    user: `${LOCAL_BASE}:${LOCAL_PORTS.user}/api`,
    room: `${LOCAL_BASE}:${LOCAL_PORTS.room}/api`,
    service: `${LOCAL_BASE}:${LOCAL_PORTS.service}/api`,
    schedule: `${LOCAL_BASE}:${LOCAL_PORTS.schedule}/api`,
    appointment: `${LOCAL_BASE}:${LOCAL_PORTS.appointment}/api`,
    payment: `${LOCAL_BASE}:${LOCAL_PORTS.payment}/api`,
    invoice: `${LOCAL_BASE}:${LOCAL_PORTS.invoice}/api`,
    medicine: `${LOCAL_BASE}:${LOCAL_PORTS.medicine}/api`,
    record: `${LOCAL_BASE}:${LOCAL_PORTS.record}`,
    statistic: `${LOCAL_BASE}:${LOCAL_PORTS.statistic}/api`,
    chatbot: `${LOCAL_BASE}:${LOCAL_PORTS.chatbot}/api`,
    backend: `${LOCAL_BASE}:${LOCAL_PORTS.appointment}`,
  };
}

// Export for immediate use (synchronous, uses env vars as fallback)
export const API_URLS = {
  // Will be populated by getAllServiceUrls() on app start
  auth: import.meta.env.VITE_AUTH_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.auth}/api`,
  user: import.meta.env.VITE_USER_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.user}/api`,
  room: import.meta.env.VITE_ROOM_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.room}/api`,
  service: import.meta.env.VITE_SERVICE_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.service}/api`,
  schedule: import.meta.env.VITE_SCHEDULE_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.schedule}/api`,
  appointment: import.meta.env.VITE_APPOINTMENT_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.appointment}/api`,
  payment: import.meta.env.VITE_PAYMENT_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.payment}/api`,
  invoice: import.meta.env.VITE_INVOICE_SERVICE_URL || `${LOCAL_BASE}:${LOCAL_PORTS.invoice}/api`,
  medicine: import.meta.env.VITE_MEDICINE_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.medicine}/api`,
  record: import.meta.env.VITE_RECORD_SERVICE_URL || `${LOCAL_BASE}:${LOCAL_PORTS.record}`,
  statistic: import.meta.env.VITE_STATISTIC_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.statistic}/api`,
  chatbot: import.meta.env.VITE_CHATBOT_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.chatbot}/api`,
  backend: import.meta.env.VITE_BACKEND_URL || `${LOCAL_BASE}:${LOCAL_PORTS.appointment}`,
};

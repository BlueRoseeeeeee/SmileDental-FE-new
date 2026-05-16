/**
 * Local API Configuration
 * Keep frontend traffic on local microservices by default.
 */

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

export const API_URLS = {
  api: import.meta.env.VITE_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.auth}/api`,
  auth: import.meta.env.VITE_AUTH_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.auth}/api`,
  user: import.meta.env.VITE_USER_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.user}/api`,
  userService: import.meta.env.VITE_USER_SERVICE_URL || `${LOCAL_BASE}:${LOCAL_PORTS.user}`,
  room: import.meta.env.VITE_ROOM_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.room}/api`,
  service: import.meta.env.VITE_SERVICE_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.service}/api`,
  schedule: import.meta.env.VITE_SCHEDULE_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.schedule}/api`,
  appointment: import.meta.env.VITE_APPOINTMENT_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.appointment}/api`,
  appointmentService: import.meta.env.VITE_APPOINTMENT_SERVICE_URL || `${LOCAL_BASE}:${LOCAL_PORTS.appointment}`,
  payment: import.meta.env.VITE_PAYMENT_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.payment}/api`,
  invoice: import.meta.env.VITE_INVOICE_SERVICE_URL || `${LOCAL_BASE}:${LOCAL_PORTS.invoice}/api/invoice`,
  medicine: import.meta.env.VITE_MEDICINE_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.medicine}/api`,
  record: import.meta.env.VITE_RECORD_SERVICE_URL || `${LOCAL_BASE}:${LOCAL_PORTS.record}`,
  statistic: import.meta.env.VITE_STATISTIC_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.statistic}/api`,
  chatbot: import.meta.env.VITE_CHATBOT_API_URL || `${LOCAL_BASE}:${LOCAL_PORTS.chatbot}/api`,
  backend: import.meta.env.VITE_BACKEND_URL || `${LOCAL_BASE}:${LOCAL_PORTS.appointment}`,
};

export async function getServiceUrl(serviceName) {
  return API_URLS[serviceName] || API_URLS.auth;
}

export async function getBackendUrl(serviceName) {
  const serviceKey = `${serviceName}Service`;
  if (API_URLS[serviceKey]) {
    return API_URLS[serviceKey];
  }

  const port = LOCAL_PORTS[serviceName] || LOCAL_PORTS.auth;
  return `${LOCAL_BASE}:${port}`;
}

export function refreshAvailabilityCheck() {
  return undefined;
}

export async function getAllServiceUrls() {
  return API_URLS;
}

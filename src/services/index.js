/**
 * @author: HoTram
 * Services Index - Central export point cho tất cả services
 */

// API Instances
export { 
  getApiInstance, 
  authApi, 
  roomApi, 
  serviceApi, 
  userApi 
} from './apiFactory.js';

// Services
export { authService } from './authService.js';
export { userService } from './userService.js';
export { default as roomService } from './roomService.js';
export { servicesService } from './servicesService.js';

// Utilities
export { toast } from './toastService.js';

// Default exports for backward compatibility
export { authService as default } from './authService.js';
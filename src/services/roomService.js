/**
 * @author: HoTram
 */
import axios from 'axios';

// Room service API base URL
const ROOM_API_BASE_URL = 'http://localhost:3002/api';

// Create axios instance for room service
const roomApi = axios.create({
  baseURL: ROOM_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add auth token if available
roomApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


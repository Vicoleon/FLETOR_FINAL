// API Configuration - automatically detects environment
const isDevelopment = import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';

// Get API base URL based on environment
const getApiBaseUrl = () => {
  // For production, use environment variable or default production URL
  if (!isDevelopment) {
    return import.meta.env.VITE_API_BASE_URL || 'https://odontotravel-api.onrender.com';
  }
  
  // For development, use localhost
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    PROFILE: `${API_BASE_URL}/api/auth/profile`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
    NOTIFICATIONS: `${API_BASE_URL}/api/auth/notifications`,
    NOTIFICATIONS_UNREAD: `${API_BASE_URL}/api/auth/notifications/unread-count`,
  },
  
  // Package endpoints
  PACKAGES: {
    LIST: `${API_BASE_URL}/api/packages/`,
    MY_PACKAGES: `${API_BASE_URL}/api/packages/my-packages`,
  },
  
  // Booking endpoints
  BOOKINGS: {
    CREATE: `${API_BASE_URL}/api/bookings/`,
    MY_BOOKINGS: `${API_BASE_URL}/api/bookings/my-bookings`,
    PENDING_REQUESTS: `${API_BASE_URL}/api/bookings/pending-requests`,
    ACCEPT: (id) => `${API_BASE_URL}/api/bookings/${id}/accept`,
    DECLINE: (id) => `${API_BASE_URL}/api/bookings/${id}/decline`,
    STATUS: (id) => `${API_BASE_URL}/api/bookings/${id}/status`,
  },
  
  // Notification endpoints
  NOTIFICATIONS: {
    LIST: `${API_BASE_URL}/api/notifications/`,
    UNREAD_COUNT: `${API_BASE_URL}/api/notifications/unread-count`,
    MARK_READ: (id) => `${API_BASE_URL}/api/notifications/${id}/read`,
    MARK_ALL_READ: `${API_BASE_URL}/api/notifications/mark-all-read`,
    DELETE: (id) => `${API_BASE_URL}/api/notifications/${id}`,
    CLEAR_ALL: `${API_BASE_URL}/api/notifications/clear-all`,
  },
  
  // Admin endpoints
  ADMIN: {
    STATS: `${API_BASE_URL}/api/admin/stats`,
    USERS: `${API_BASE_URL}/api/admin/users`,
    PACKAGES: `${API_BASE_URL}/api/admin/packages`,
    BOOKINGS: `${API_BASE_URL}/api/admin/bookings`,
    ANALYTICS_REVENUE: `${API_BASE_URL}/api/admin/analytics/revenue`,
  },
  
  // Health check
  HEALTH: `${API_BASE_URL}/api/health`,
};

export default API_BASE_URL; 
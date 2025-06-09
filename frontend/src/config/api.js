// API Configuration - automatically detects environment
const getApiBaseUrl = () => {
  // Check multiple indicators for development environment
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const isDevelopment = 
    import.meta.env.DEV === true ||
    import.meta.env.NODE_ENV === 'development' ||
    import.meta.env.VITE_APP_ENV === 'development' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('.local');

  // Get environment variables
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  const appEnv = import.meta.env.VITE_APP_ENV;
  
  // Log environment info for debugging (only in development or if console is available)
  if (typeof console !== 'undefined') {
    console.log('🔧 API Environment Detection:', {
      isDev: import.meta.env.DEV,
      nodeEnv: import.meta.env.NODE_ENV,
      appEnv: appEnv,
      hostname: hostname,
      isDevelopment: isDevelopment,
      envApiUrl: envApiUrl,
      mode: import.meta.env.MODE
    });
  }

  // Force production API URL if explicitly set to production
  if (appEnv === 'production' && envApiUrl) {
    console.log('🚀 Using production API URL from environment:', envApiUrl);
    return envApiUrl;
  }

  // For development, use localhost
  if (isDevelopment) {
    console.log('🛠️ Using development API URL: http://localhost:5000');
    return 'http://localhost:5000';
  }

  // For production, prioritize environment variable, then fall back to default
  const productionApiUrl = envApiUrl || 'https://odontotravel-api.onrender.com';
  console.log('🌐 Using production API URL:', productionApiUrl);
  
  return productionApiUrl;
};

export const API_BASE_URL = getApiBaseUrl();

// Log the final API configuration
if (typeof console !== 'undefined') {
  console.log('🎯 Final API Configuration:', {
    baseUrl: API_BASE_URL,
    environment: import.meta.env.VITE_APP_ENV || 'development',
    mode: import.meta.env.MODE
  });
}

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
  
  // Treatment and Specialization endpoints
  TREATMENTS: {
    TREATMENT_TYPES: `${API_BASE_URL}/api/treatments/treatment-types`,
    SPECIALIZATIONS: `${API_BASE_URL}/api/treatments/specializations`,
    POPULATE_DEFAULTS: `${API_BASE_URL}/api/treatments/populate-defaults`,
    CREATE_TREATMENT: `${API_BASE_URL}/api/treatments/treatment-types`,
    CREATE_SPECIALIZATION: `${API_BASE_URL}/api/treatments/specializations`,
    UPDATE_TREATMENT: (id) => `${API_BASE_URL}/api/treatments/treatment-types/${id}`,
    UPDATE_SPECIALIZATION: (id) => `${API_BASE_URL}/api/treatments/specializations/${id}`,
    DELETE_TREATMENT: (id) => `${API_BASE_URL}/api/treatments/treatment-types/${id}`,
    DELETE_SPECIALIZATION: (id) => `${API_BASE_URL}/api/treatments/specializations/${id}`,
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
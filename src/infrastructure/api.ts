import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';

const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.DEBUG_MODE ? 15000 : 30000, // Longer timeout for production
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@token_id');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Debug logging (only in development)
      if (ENV.ENABLE_LOGGING) {
        console.log('🔄 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          fullURL: `${config.baseURL}${config.url}`,
          headers: {
            Authorization: config.headers.Authorization ? 'Bearer [TOKEN]' : 'No token',
            'Content-Type': config.headers['Content-Type']
          },
          data: config.data
        });
      }
      
      return config;
    } catch (error) {
      console.error('❌ Error in request interceptor:', error);
      return config;
    }
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (ENV.ENABLE_LOGGING) {
      console.log('✅ API Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.config.url,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'Unknown URL',
      data: error.response?.data,
      message: error.message,
      code: error.code
    });

    // Handle specific error cases
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      console.error('🌐 Network Error - Check if backend is running on:', ENV.API_BASE_URL);
    }
    
    if (error.response?.status === 401) {
      console.error('🔐 Authentication Error - Token might be invalid or expired');
    }
    
    if (error.response?.status === 403) {
      console.error('🚫 Authorization Error - User might not have permission');
    }

    return Promise.reject(error);
  }
);

export default api;

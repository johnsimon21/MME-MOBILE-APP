import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Alert } from 'react-native';
import { ENV } from '@/src/config/env';
import { auth } from '@/src/config/firebase';

// Types for better TypeScript support
export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
}

// Base URL configuration
const BASE_URL = __DEV__ 
  ? `${ENV.API_BASE_URL}`  // Development
  : 'https://your-production-domain.com/'; // Production


// Create axios instance
export const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management using Firebase
export const tokenManager = {
  async getToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Error getting Firebase ID token:', error);
      return null;
    }
  },

  async getUserData(): Promise<any> {
    try {
      const user = auth.currentUser;
      return user ? {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
      } : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // These methods are kept for compatibility but use Firebase auth state
  async setToken(token: string): Promise<void> {
    // Firebase handles token storage automatically
    console.log('Token storage handled by Firebase');
  },

  async removeToken(): Promise<void> {
    // Firebase handles token removal on signOut
    console.log('Token removal handled by Firebase');
  },

  async setUserData(userData: any): Promise<void> {
    // User data is stored in Firestore, not locally
    console.log('User data stored in Firestore');
  },
};

// Request interceptor
instance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const customConfig = config as InternalAxiosRequestConfig & CustomAxiosRequestConfig;
    
    // Skip auth for certain endpoints
    if (customConfig.skipAuth) {
      return config;
    }

    try {
      // Get Firebase ID token
      const token = await tokenManager.getToken();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔑 Added Firebase ID token to request');
      } else {
        console.warn('⚠️ No Firebase ID token available');
      }
    } catch (error) {
      console.error('❌ Error adding auth token:', error);
    }

    // Add development headers if needed
    if (__DEV__) {
      const user = auth.currentUser;
      if (user) {
        config.headers['X-Dev-User-Id'] = user.uid;
      }
    }

    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    const customConfig = error.config as InternalAxiosRequestConfig & CustomAxiosRequestConfig;
    
    console.error(`❌ ${error.response?.status || 'Network Error'} ${error.config?.url}:`, error.message);

    // Handle token expiration
    if (error.response?.status === 401) {
      console.log('🔄 Token expired, attempting refresh...');
      
      try {
        const user = auth.currentUser;
        if (user) {
          // Force refresh the token
          await user.getIdToken(true);
          
          // Retry the original request
          if (error.config) {
            const token = await user.getIdToken();
            error.config.headers.Authorization = `Bearer ${token}`;
            return instance.request(error.config);
          }
        } else {
          // User is not authenticated, redirect to login
          console.log('🚪 User not authenticated, should redirect to login');
          // You might want to emit an event here to trigger logout
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        // Force logout
        try {
          await auth.signOut();
        } catch (signOutError) {
          console.error('❌ Sign out error:', signOutError);
        }
      }
    }

    // Skip error handling for certain requests
    if (customConfig?.skipErrorHandling) {
      return Promise.reject(error);
    }

    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          console.warn('⚠️ Bad Request:', (data as any)?.message);
          break;
        case 403:
          console.warn('⚠️ Forbidden:', (data as any)?.message);
          Alert.alert('Acesso Negado', (data as any)?.message || 'Você não tem permissão para esta ação.');
          break;
        case 404:
          console.warn('⚠️ Not Found:', (data as any)?.message);
          break;
        case 429:
          console.warn('⚠️ Too Many Requests:', (data as any)?.message);
          Alert.alert('Muitas Tentativas', 'Aguarde um momento antes de tentar novamente.');
          break;
        case 500:
          console.error('❌ Server Error:', (data as any)?.message);
          Alert.alert('Erro do Servidor', 'Ocorreu um erro interno. Tente novamente mais tarde.');
          break;
        default:
          console.error(`❌ HTTP ${status}:`, (data as any)?.message);
      }
    } else if (error.request) {
      // Network error
      console.error('❌ Network Error:', error.message);
      Alert.alert(
        'Erro de Conexão', 
        'Verifique sua conexão com a internet e tente novamente.'
      );
    } else {
      // Other error
      console.error('❌ Request Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Custom instance function for the generated API
export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  return instance.request<T>(config).then(response => response.data);
};

export default instance;

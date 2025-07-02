import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Types for better TypeScript support
export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
}

// Base URL configuration
const BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Development
  : 'https://your-production-domain.com/api'; // Production

// Create axios instance
export const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = '@mme_auth_token';
const USER_KEY = '@mme_user_data';

export const tokenManager = {
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  async getUserData(): Promise<any> {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  async setUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error setting user data:', error);
    }
  },
};

// Request interceptor - Fixed TypeScript compatibility
instance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Cast to our custom config to access custom properties
    const customConfig = config as InternalAxiosRequestConfig & CustomAxiosRequestConfig;
    
    // Add auth token if not skipped
    if (!customConfig.skipAuth) {
      const token = await tokenManager.getToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Add development user ID if in development mode
    if (__DEV__) {
      const userData = await tokenManager.getUserData();
      if (userData?.uid) {
        config.headers = config.headers || {};
        config.headers['X-Dev-User-Id'] = userData.uid;
      }
    }

    // Log requests in development
    if (__DEV__) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data) {
        console.log('📤 Request Data:', config.data);
      }
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log responses in development
    if (__DEV__) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
      console.log('📥 Response Data:', response.data);
    }

    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & CustomAxiosRequestConfig;
    
    // Log errors in development
    if (__DEV__) {
      console.error('❌ API Error:', error.response?.status, error.response?.data);
    }

    // Handle different error types
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          await tokenManager.removeToken();
          if (!config?.skipErrorHandling) {
            Alert.alert(
              'Sessão Expirada',
              'Sua sessão expirou. Por favor, faça login novamente.',
              [{ text: 'OK' }]
            );
            // You can add navigation to login screen here
            // NavigationService.navigate('Login');
          }
          break;

        case 403:
          // Forbidden
          if (!config?.skipErrorHandling) {
            Alert.alert(
              'Acesso Negado',
              'Você não tem permissão para realizar esta ação.',
              [{ text: 'OK' }]
            );
          }
          break;

        case 404:
          // Not Found
          if (!config?.skipErrorHandling) {
            Alert.alert(
              'Não Encontrado',
              'O recurso solicitado não foi encontrado.',
              [{ text: 'OK' }]
            );
          }
          break;

        case 422:
          // Validation Error
          if (!config?.skipErrorHandling) {
            const message = Array.isArray((data as any)?.message) 
              ? (data as any).message.join('\n') 
              : (data as any)?.message || 'Dados inválidos';
            Alert.alert('Erro de Validação', message, [{ text: 'OK' }]);
          }
          break;

        case 429:
          // Rate Limit
          if (!config?.skipErrorHandling) {
            Alert.alert(
              'Muitas Tentativas',
              'Você fez muitas tentativas. Tente novamente mais tarde.',
              [{ text: 'OK' }]
            );
          }
          break;

        case 500:
          // Server Error
          if (!config?.skipErrorHandling) {
            Alert.alert(
              'Erro do Servidor',
              'Ocorreu um erro interno. Tente novamente mais tarde.',
              [{ text: 'OK' }]
            );
          }
          break;

        default:
          if (!config?.skipErrorHandling) {
            const message = (data as any)?.message || 'Ocorreu um erro inesperado';
            Alert.alert('Erro', message, [{ text: 'OK' }]);
          }
      }
    } else if (error.request) {
      // Network Error
      if (!config?.skipErrorHandling) {
        Alert.alert(
          'Erro de Conexão',
          'Verifique sua conexão com a internet e tente novamente.',
          [{ text: 'OK' }]
        );
      }
    }

    return Promise.reject(error);
  }
);

// Helper functions for common operations
export const apiHelpers = {
  // Login helper that stores token
  async login(credentials: { email: string; password: string }) {
    try {
      const response = await instance.post('/auth/login', credentials, {
        skipAuth: true,
      } as CustomAxiosRequestConfig);
      
      const { customToken, ...userData } = response.data;
      
      // In a real app, you'd exchange customToken for ID token using Firebase SDK
      // For now, we'll store the custom token
      await tokenManager.setToken(customToken);
      await tokenManager.setUserData(userData);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout helper
  async logout() {
    await tokenManager.removeToken();
    // You can add additional logout logic here
  },

  // Upload file helper
  async uploadFile(file: any, endpoint: string, additionalData?: any) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return instance.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await tokenManager.getToken();
    return !!token;
  },

  // Get current user data
  async getCurrentUser() {
    return await tokenManager.getUserData();
  },
};

export const customInstance = () => instance;

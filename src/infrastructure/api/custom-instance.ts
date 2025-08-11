import axios from 'axios';
import { authStorage } from '../../services/authStorage';

export const tokenManager = {
  // Get token from storage
  async getToken(): Promise<string | null> {
    try {
      return await authStorage.getToken();
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Set token in storage
  async setToken(token: string): Promise<void> {
    try {
      await authStorage.setToken(token);
    } catch (error) {
      console.error('Error setting token:', error);
      throw error;
    }
  },

  // Remove token from storage
  async removeToken(): Promise<void> {
    try {
      await authStorage.removeToken();
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  // Check if token exists
  async hasToken(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  },
};

// Custom axios instance for orval
export const customInstance = axios.create();

// Add request interceptor to include auth token
customInstance.interceptors.request.use(
  async (config) => {
    const token = await tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
customInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, remove it
      await tokenManager.removeToken();
    }
    return Promise.reject(error);
  }
);

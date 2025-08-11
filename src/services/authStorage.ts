import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IUserAuth } from '../interfaces/user.interface';

const KEYS = {
  TOKEN: '@mme_auth_token',
  USER: '@mme_user_data',
  REMEMBER_EMAIL: '@mme_remember_email',
  BIOMETRIC_ENABLED: '@mme_biometric_enabled',
} as const;

export const authStorage = {
  // Token management
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.TOKEN, token);
    } catch (error) {
      console.error('Error setting token:', error);
      throw error;
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.TOKEN);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  // User data management
  async getUser(): Promise<IUserAuth | null> {
    try {
      const userData = await AsyncStorage.getItem(KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  async setUser(user: IUserAuth): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error setting user data:', error);
      throw error;
    }
  },

  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.USER);
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  },

  // Remember email functionality
  async getRememberedEmail(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.REMEMBER_EMAIL);
    } catch (error) {
      console.error('Error getting remembered email:', error);
      return null;
    }
  },

  async setRememberedEmail(email: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.REMEMBER_EMAIL, email);
    } catch (error) {
      console.error('Error setting remembered email:', error);
    }
  },

  async removeRememberedEmail(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.REMEMBER_EMAIL);
    } catch (error) {
      console.error('Error removing remembered email:', error);
    }
  },

  // Biometric settings
  async getBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(KEYS.BIOMETRIC_ENABLED);
      return enabled === 'true';
    } catch (error) {
      console.error('Error getting biometric setting:', error);
      return false;
    }
  },

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.BIOMETRIC_ENABLED, enabled.toString());
    } catch (error) {
      console.error('Error setting biometric setting:', error);
    }
  },

  // Clear all auth data
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.TOKEN,
        KEYS.USER,
        KEYS.BIOMETRIC_ENABLED,
      ]);
      // Keep remembered email unless explicitly cleared
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },

  // Get all auth data at once
  async getAllAuthData(): Promise<{
    token: string | null;
    user: IUserAuth | null;
    rememberedEmail: string | null;
    biometricEnabled: boolean;
  }> {
    try {
      const [token, user, rememberedEmail, biometricEnabled] = await Promise.all([
        this.getToken(),
        this.getUser(),
        this.getRememberedEmail(),
        this.getBiometricEnabled(),
      ]);

      return {
        token,
        user,
        rememberedEmail,
        biometricEnabled,
      };
    } catch (error) {
      console.error('Error getting all auth data:', error);
      return {
        token: null,
        user: null,
        rememberedEmail: null,
        biometricEnabled: false,
      };
    }
  },
};
import { useAuth } from "../context/AuthContext";
import api from "../infrastructure/api";
import {
  IUserSettings,
  ISettingsCategory,
  IUpdateUserSettings,
  IBulkSettingsUpdate,
  IBulkSettingsUpdateResponse,
  ISettingsExport
} from "../interfaces/settings.interface";

export const useSettings = () => {
  const { user, getIdToken } = useAuth();

  const getHeaders = async () => {
    const token = await getIdToken();
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }
    return {
      Authorization: `Bearer ${token}`
    };
  };

  // Get user settings by ID
  const getUserSettings = async (userId: string): Promise<IUserSettings> => {
    try {
      console.log('🔄 useSettings: Fetching settings for user:', userId);
      
      const headers = await getHeaders();
      const { data } = await api.get<IUserSettings>(`/settings/users/${userId}`, { headers });
      
      console.log('✅ useSettings: Settings fetched successfully:', data);
      return data;
    } catch (error: any) {
      console.error('❌ useSettings: Failed to fetch user settings:', error);
      throw error;
    }
  };

  // Get current user settings (convenience method)
  const getMySettings = async (): Promise<IUserSettings> => {
    try {
      console.log('🔄 useSettings: Fetching current user settings');
      
      const headers = await getHeaders();
      const { data } = await api.get<IUserSettings>('/settings/me', { headers });
      
      console.log('✅ useSettings: Current user settings fetched successfully:', data);
      return data;
    } catch (error: any) {
      console.error('❌ useSettings: Failed to fetch current user settings:', error);
      throw error;
    }
  };

  // Update user settings by ID
  const updateUserSettings = async (userId: string, settingsUpdate: IUpdateUserSettings): Promise<IUserSettings> => {
    try {
      console.log('🔄 useSettings: Updating settings for user:', userId, 'with data:', settingsUpdate);
      
      const headers = await getHeaders();
      
      // Clean the data
      const cleanData = Object.fromEntries(
        Object.entries(settingsUpdate).filter(([key, value]) => {
          return value !== undefined && value !== null;
        })
      );
      
      console.log('🔄 Clean settings update data:', cleanData);
      
      const { data } = await api.put<IUserSettings>(`/settings/users/${userId}`, cleanData, { headers });
      
      console.log('✅ useSettings: Settings updated successfully:', data);
      return data;
    } catch (error: any) {
      console.error('❌ useSettings: Failed to update user settings:', error);
      throw error;
    }
  };

  // Update current user settings (convenience method)
  const updateMySettings = async (settingsUpdate: IUpdateUserSettings): Promise<IUserSettings> => {
    try {
      console.log('🔄 useSettings: Updating current user settings with data:', settingsUpdate);
      
      const headers = await getHeaders();
      
      // Clean the data
      const cleanData = Object.fromEntries(
        Object.entries(settingsUpdate).filter(([key, value]) => {
          return value !== undefined && value !== null;
        })
      );
      
      console.log('🔄 Clean settings update data:', cleanData);
      
      const { data } = await api.put<IUserSettings>('/settings/me', cleanData, { headers });
      
      console.log('✅ useSettings: Current user settings updated successfully:', data);
      return data;
    } catch (error: any) {
      console.error('❌ useSettings: Failed to update current user settings:', error);
      throw error;
    }
  };

  // Reset user settings to default
  const resetUserSettings = async (userId: string): Promise<IUserSettings> => {
    try {
      console.log('🔄 useSettings: Resetting settings for user:', userId);
      
      const headers = await getHeaders();
      const { data } = await api.post<IUserSettings>(`/settings/users/${userId}/reset`, {}, { headers });
      
      console.log('✅ useSettings: Settings reset successfully:', data);
      return data;
    } catch (error: any) {
      console.error('❌ useSettings: Failed to reset user settings:', error);
      throw error;
    }
  };

  // Reset current user settings (convenience method)
  const resetMySettings = async (): Promise<IUserSettings> => {
    try {
      console.log('🔄 useSettings: Resetting current user settings');
      
      const headers = await getHeaders();
      const { data } = await api.post<IUserSettings>('/settings/me/reset', {}, { headers });
      
      console.log('✅ useSettings: Current user settings reset successfully:', data);
      return data;
    } catch (error: any) {
      console.error('❌ useSettings: Failed to reset current user settings:', error);
      throw error;
    }
  };

  // Get settings categories with current values
  const getSettingsCategories = async (userId: string): Promise<ISettingsCategory[]> => {
    try {
      console.log('🔄 useSettings: Fetching settings categories for user:', userId);
      
      const headers = await getHeaders();
      const { data } = await api.get<ISettingsCategory[]>(`/settings/users/${userId}/categories`, { headers });
      
      console.log('✅ useSettings: Settings categories fetched successfully:', data);
      return data;
    } catch (error: any) {
      console.error('❌ useSettings: Failed to fetch settings categories:', error);
      throw error;
    }
  };

  // Get current user settings categories (convenience method)
  const getMySettingsCategories = async (): Promise<ISettingsCategory[]> => {
    try {
      console.log('🔄 useSettings: Fetching current user settings categories');
      
      const headers = await getHeaders();
      const { data } = await api.get<ISettingsCategory[]>('/settings/me/categories', { headers });
      
      console.log('✅ useSettings: Current user settings categories fetched successfully:', data);
      return data;
    } catch (error: any) {
      console.error('❌ useSettings: Failed to fetch current user settings categories:', error);
      throw error;
    }
  };

  // Export user settings
  const exportUserSettings = async (userId: string): Promise<ISettingsExport> => {
    try {
      console.log('🔄 useSettings: Exporting settings for user:', userId);
      
      const headers = await getHeaders();
      const { data } = await api.get<ISettingsExport>(`/settings/users/${userId}/export`, { headers });
      
      console.log('✅ useSettings: Settings exported successfully:', data);
      return data;
    } catch (error: any) {
      console.error('❌ useSettings: Failed to export user settings:', error);
      throw error;
    }
  };

  // Export current user settings (convenience method)
  const exportMySettings = async (): Promise<ISettingsExport> => {
    try {
      console.log('🔄 useSettings: Exporting current user settings');
      
      const headers = await getHeaders();
      const { data } = await api.get<ISettingsExport>('/settings/me/export', { headers });
      
      console.log('✅ useSettings: Current user settings exported successfully:', data);
      return data;
    } catch (error: any) {
      console.error('❌ useSettings: Failed to export current user settings:', error);
      throw error;
    }
  };

  // Import user settings
  const importUserSettings = async (userId: string, settingsData: any): Promise<IUserSettings> => {
    try {
      console.log('🔄 useSettings: Importing settings for user:', userId);
      
      const headers = await getHeaders();
      const { data } = await api.post<IUserSettings>(`/settings/users/${userId}/import`, settingsData, { headers });
      
      console.log('✅ useSettings: Settings imported successfully:', data);
      return data;
    } catch (error: any) {
      console.error('❌ useSettings: Failed to import user settings:', error);
      throw error;
    }
  };

  // Import current user settings (convenience method)
  const importMySettings = async (settingsData: any): Promise<IUserSettings> => {
    try {
      console.log('🔄 useSettings: Importing current user settings');
      
      const headers = await getHeaders();
      const { data } = await api.post<IUserSettings>('/settings/me/import', settingsData, { headers });
      
      console.log('✅ useSettings: Current user settings imported successfully:', data);
      return data;
    } catch (error: any) {
      console.error('❌ useSettings: Failed to import current user settings:', error);
      throw error;
    }
  };

  // Bulk update settings (coordinator only)
  const bulkUpdateSettings = async (bulkUpdate: IBulkSettingsUpdate): Promise<IBulkSettingsUpdateResponse> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      console.log('🔄 useSettings: Performing bulk settings update for', bulkUpdate.userIds.length, 'users');
      
      const headers = await getHeaders();
      const { data } = await api.post<IBulkSettingsUpdateResponse>('/settings/bulk-update', bulkUpdate, { headers });
      
      console.log('✅ useSettings: Bulk settings update completed:', data);
      return data;
    } catch (error: any) {
      console.error('❌ useSettings: Failed to perform bulk settings update:', error);
      throw error;
    }
  };

  // ✅ NEW: Update specific setting by key path
  const updateSettingByKey = async (keyPath: string, value: any): Promise<IUserSettings> => {
    try {
      console.log('🔄 useSettings: Updating setting by key:', keyPath, 'with value:', value);
      
      // Parse the key path and build nested update object
      const keys = keyPath.split('.');
      const updateObj: any = {};
      
      let current = updateObj;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      console.log('🔄 Generated update object:', updateObj);
      
      return await updateMySettings(updateObj);
    } catch (error: any) {
      console.error('❌ useSettings: Failed to update setting by key:', error);
      throw error;
    }
  };

  // ✅ NEW: Get specific setting value by key path
  const getSettingValue = (settings: IUserSettings, keyPath: string): any => {
    try {
      const keys = keyPath.split('.');
      let current: any = settings;
      
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return undefined;
        }
      }
      
      return current;
    } catch (error) {
      console.warn('⚠️ useSettings: Failed to get setting value for key:', keyPath);
      return undefined;
    }
  };

  // ✅ NEW: Validate settings data
  const validateSettings = (settings: Partial<IUserSettings>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate session duration
    if (settings.sessions?.defaultSessionDuration) {
      const duration = settings.sessions.defaultSessionDuration;
      if (duration < 15 || duration > 480) {
        errors.push('Duração da sessão deve estar entre 15 e 480 minutos');
      }
    }

    // Validate max concurrent sessions
    if (settings.sessions?.maxConcurrentSessions) {
      const max = settings.sessions.maxConcurrentSessions;
      if (max < 1 || max > 5) {
        errors.push('Máximo de sessões simultâneas deve estar entre 1 e 5');
      }
    }

    // Validate cache size
    if (settings.dataStorage?.cacheSize) {
      const cache = settings.dataStorage.cacheSize;
      if (cache < 50 || cache > 1000) {
        errors.push('Tamanho do cache deve estar entre 50MB e 1000MB');
      }
    }

    // Validate data retention
    if (settings.dataStorage?.dataRetention) {
      const retention = settings.dataStorage.dataRetention;
      if (retention < 30 || retention > 365) {
        errors.push('Retenção de dados deve estar entre 30 e 365 dias');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return {
    // Basic operations
    getUserSettings,
    getMySettings,
    updateUserSettings,
    updateMySettings,
    resetUserSettings,
    resetMySettings,

    // Categories and structure
    getSettingsCategories,
    getMySettingsCategories,

    // Import/Export
    exportUserSettings,
    exportMySettings,
    importUserSettings,
    importMySettings,

    // Admin operations
    bulkUpdateSettings,

    // Helper functions
    updateSettingByKey, // ✅ NEW
    getSettingValue, // ✅ NEW
    validateSettings, // ✅ NEW
  };
};

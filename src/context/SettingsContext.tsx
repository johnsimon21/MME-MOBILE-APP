import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useSettings } from "../hooks/useSettings";
import { IUserSettings, ISettingsCategory, IUpdateUserSettings } from "../interfaces/settings.interface";

interface SettingsContextProps {
  // State
  settings: IUserSettings | null;
  categories: ISettingsCategory[];
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  loadCategories: () => Promise<void>;
  updateSettings: (updates: IUpdateUserSettings) => Promise<boolean>;
  updateSettingByKey: (keyPath: string, value: any) => Promise<boolean>;
  resetSettings: () => Promise<boolean>;
  exportSettings: () => Promise<void>;
  importSettings: (settingsData: any) => Promise<boolean>;
  clearError: () => void;

  // Helpers
  getSettingValue: (keyPath: string) => any;
  validateSettings: (settingsData: Partial<IUserSettings>) => { isValid: boolean; errors: string[] };
}

const SettingsContext = createContext<SettingsContextProps>({} as SettingsContextProps);

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const {
    getMySettings,
    getMySettingsCategories,
    updateMySettings,
    updateSettingByKey: updateSettingByKeyHook,
    resetMySettings,
    exportMySettings,
    importMySettings,
    getSettingValue: getSettingValueHook,
    validateSettings: validateSettingsHook
  } = useSettings();

  // State
  const [settings, setSettings] = useState<IUserSettings | null>(null);
  const [categories, setCategories] = useState<ISettingsCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enhanced error handler
  const handleError = useCallback((error: any, context: string) => {
    console.error(`❌ SettingsContext ${context}:`, error);

    let errorMessage = 'Erro inesperado. Tente novamente.';

    if (error?.response?.status) {
      switch (error.response.status) {
        case 400:
          errorMessage = 'Dados de configuração inválidos.';
          break;
        case 401:
          errorMessage = 'Acesso negado. Faça login novamente.';
          break;
        case 403:
          errorMessage = 'Você não tem permissão para esta ação.';
          break;
        case 404:
          errorMessage = 'Configurações não encontradas.';
          break;
        case 422:
          errorMessage = 'Dados inválidos. Verifique os campos.';
          break;
        case 429:
          errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos.';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor. Tente novamente.';
          break;
        default:
          errorMessage = error.response.data?.message || 'Erro de conexão.';
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }

    setError(errorMessage);
    return errorMessage;
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load user settings
  const loadSettings = useCallback(async (): Promise<void> => {
    if (!user || !isAuthenticated) {
      console.log('⚠️ SettingsContext: No authenticated user to load settings for');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 SettingsContext: Loading user settings...');
      const userSettings = await getMySettings();
      setSettings(userSettings);

      console.log('✅ SettingsContext: Settings loaded successfully');
    } catch (error: any) {
      handleError(error, 'Load settings failed');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, isAuthenticated, getMySettings, handleError]);

  // Load settings categories
  const loadCategories = useCallback(async (): Promise<void> => {
    if (!user || !isAuthenticated) {
      console.log('⚠️ SettingsContext: No authenticated user to load categories for');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 SettingsContext: Loading settings categories...');
      const settingsCategories = await getMySettingsCategories();
      setCategories(settingsCategories);

      console.log('✅ SettingsContext: Categories loaded successfully');
    } catch (error: any) {
      handleError(error, 'Load categories failed');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, isAuthenticated, getMySettingsCategories, handleError]);

  // Update settings
  const updateSettings = useCallback(async (updates: IUpdateUserSettings): Promise<boolean> => {
    if (!user || !isAuthenticated) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      setIsUpdating(true);
      setError(null);

      console.log('🔄 SettingsContext: Updating settings...');

      // Validate settings before updating
      const validation = validateSettingsHook(updates as Partial<IUserSettings>);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return false;
      }

      const updatedSettings = await updateMySettings(updates);
      setSettings(updatedSettings);

      console.log('✅ SettingsContext: Settings updated successfully');
      return true;
    } catch (error: any) {
      handleError(error, 'Update settings failed');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [user?.uid, isAuthenticated, updateMySettings, validateSettingsHook, handleError]);

  // Update setting by key path
  const updateSettingByKey = useCallback(async (keyPath: string, value: any): Promise<boolean> => {
    if (!user || !isAuthenticated) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      setIsUpdating(true);
      setError(null);

      console.log('🔄 SettingsContext: Updating setting by key:', keyPath, 'with value:', value);

      const updatedSettings = await updateSettingByKeyHook(keyPath, value);
      setSettings(updatedSettings);

      console.log('✅ SettingsContext: Setting updated successfully');
      return true;
    } catch (error: any) {
      handleError(error, 'Update setting by key failed');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [user?.uid, isAuthenticated, updateSettingByKeyHook, handleError]);

  // Reset settings
  const resetSettings = useCallback(async (): Promise<boolean> => {
    if (!user || !isAuthenticated) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      setIsUpdating(true);
      setError(null);

      console.log('🔄 SettingsContext: Resetting settings...');

      const defaultSettings = await resetMySettings();
      setSettings(defaultSettings);

      console.log('✅ SettingsContext: Settings reset successfully');
      return true;
    } catch (error: any) {
      handleError(error, 'Reset settings failed');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [user?.uid, isAuthenticated, resetMySettings, handleError]);

  // Export settings
  const exportSettings = useCallback(async (): Promise<void> => {
    if (!user || !isAuthenticated) {
      setError('Usuário não autenticado');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 SettingsContext: Exporting settings...');

      const exportData = await exportMySettings();
      
      // Here you could implement file saving logic
      // For now, we'll just log the exported data
      console.log('✅ SettingsContext: Settings exported:', exportData);
      
      // You could also trigger a download or share the data
      // This would depend on your specific implementation needs
    } catch (error: any) {
      handleError(error, 'Export settings failed');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, isAuthenticated, exportMySettings, handleError]);

  // Import settings
  const importSettings = useCallback(async (settingsData: any): Promise<boolean> => {
    if (!user || !isAuthenticated) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      setIsUpdating(true);
      setError(null);

      console.log('🔄 SettingsContext: Importing settings...');

      // Validate imported data
      const validation = validateSettingsHook(settingsData);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return false;
      }

      const importedSettings = await importMySettings(settingsData);
      setSettings(importedSettings);

      console.log('✅ SettingsContext: Settings imported successfully');
      return true;
    } catch (error: any) {
      handleError(error, 'Import settings failed');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [user?.uid, isAuthenticated, importMySettings, validateSettingsHook, handleError]);

  // Get setting value helper
  const getSettingValue = useCallback((keyPath: string): any => {
    if (!settings) return undefined;
    return getSettingValueHook(settings, keyPath);
  }, [settings, getSettingValueHook]);

  // Validate settings helper
  const validateSettings = useCallback((settingsData: Partial<IUserSettings>) => {
    return validateSettingsHook(settingsData);
  }, [validateSettingsHook]);

  // Auto-load settings when user changes
  useEffect(() => {
    if (user && isAuthenticated && !settings) {
      // Only load if we don't have settings yet
      loadSettings();
      loadCategories();
    } else if (!user || !isAuthenticated) {
      // Clear settings when user logs out
      setSettings(null);
      setCategories([]);
      setError(null);
    }
  }, [user?.uid, isAuthenticated, settings]); // Only depend on user ID, auth status, and current settings

  const contextValue: SettingsContextProps = {
    // State
    settings,
    categories,
    isLoading,
    isUpdating,
    error,

    // Actions
    loadSettings,
    loadCategories,
    updateSettings,
    updateSettingByKey,
    resetSettings,
    exportSettings,
    importSettings,
    clearError,

    // Helpers
    getSettingValue,
    validateSettings,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

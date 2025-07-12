export interface IUserSettings {
  id: string;
  userId: string;
  
  // Profile Settings
  profile: {
    displayName?: string;
    bio?: string;
    location?: string;
    timezone: string;
    language: string;
    theme: 'light' | 'dark' | 'system';
  };

  // Privacy & Security
  privacy: {
    profileVisibility: 'public' | 'mentors_only' | 'private';
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    showEmail: boolean;
    showPhone: boolean;
    twoFactorEnabled: boolean;
  };

  // Session Settings
  sessions: {
    autoStartSession: boolean;
    saveSessionHistory: boolean;
    defaultSessionDuration: number; // in minutes
    sessionReminders: boolean;
    recordingSetting: 'always' | 'ask' | 'never';
    maxConcurrentSessions: number;
  };

  // Communication Settings
  communication: {
    chatSettings: {
      showTypingIndicator: boolean;
      readReceipts: boolean;
      messagePreview: boolean;
      soundEnabled: boolean;
      vibrationEnabled: boolean;
    };
    callSettings: {
      autoAnswer: boolean;
      videoQuality: 'low' | 'medium' | 'high' | 'auto';
      audioQuality: 'low' | 'medium' | 'high';
      backgroundBlur: boolean;
      noiseCancellation: boolean;
    };
    audioRecording: {
      quality: 'low' | 'medium' | 'high';
      format: 'mp3' | 'wav' | 'aac';
      autoSave: boolean;
    };
  };

  // Notification Settings
  notifications: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    categories: {
      session: {
        enabled: boolean;
        pushEnabled: boolean;
        emailEnabled: boolean;
        soundEnabled: boolean;
      };
      message: {
        enabled: boolean;
        pushEnabled: boolean;
        emailEnabled: boolean;
        soundEnabled: boolean;
      };
      system: {
        enabled: boolean;
        pushEnabled: boolean;
        emailEnabled: boolean;
        soundEnabled: boolean;
      };
      call: {
        enabled: boolean;
        pushEnabled: boolean;
        emailEnabled: boolean;
        soundEnabled: boolean;
      };
    };
    quietHours: {
      enabled: boolean;
      startTime: string;
      endTime: string;
      timezone: string;
    };
    frequency: {
      digest: 'immediate' | 'hourly' | 'daily' | 'weekly';
      reminders: boolean;
      batching: boolean;
    };
  };

  // Data & Storage
  dataStorage: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    dataRetention: number; // in days
    downloadQuality: 'original' | 'compressed';
    cacheSize: number; // in MB
    offlineMode: boolean;
  };

  // Appearance
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large' | 'extra_large';
    colorScheme: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    floatingButtonPosition: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
    compactMode: boolean;
    animationsEnabled: boolean;
  };

  // Accessibility
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
    reduceMotion: boolean;
    colorBlindSupport: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  };

  // Advanced Settings
  advanced: {
    developerMode: boolean;
    debugLogs: boolean;
    betaFeatures: boolean;
    analyticsEnabled: boolean;
    crashReporting: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface ISettingsCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  settings: ISettingItem[];
}

export interface ISettingItem {
  key: string;
  type: 'boolean' | 'string' | 'number' | 'select' | 'multiselect' | 'time' | 'date';
  label: string;
  description?: string;
  currentValue: any;
  defaultValue: any;
  options?: { value: any; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    required?: boolean;
    pattern?: string;
  };
  dependencies?: {
    key: string;
    value: any;
  }[];
}

// Update DTOs
export interface IUpdateUserSettings {
  profile?: Partial<IUserSettings['profile']>;
  privacy?: Partial<IUserSettings['privacy']>;
  sessions?: Partial<IUserSettings['sessions']>;
  communication?: {
    chatSettings?: Partial<IUserSettings['communication']['chatSettings']>;
    callSettings?: Partial<IUserSettings['communication']['callSettings']>;
    audioRecording?: Partial<IUserSettings['communication']['audioRecording']>;
  };
  notifications?: Partial<IUserSettings['notifications']>;
  dataStorage?: Partial<IUserSettings['dataStorage']>;
  appearance?: Partial<IUserSettings['appearance']>;
  accessibility?: Partial<IUserSettings['accessibility']>;
  advanced?: Partial<IUserSettings['advanced']>;
}

export interface IBulkSettingsUpdate {
  userIds: string[];
  settings: IUpdateUserSettings;
  reason?: string;
}

export interface IBulkSettingsUpdateResponse {
  updated: number;
  failed: number;
  details: {
    successful: string[];
    failed: { userId: string; error: string }[];
  };
}

export interface ISettingsExport {
  settings: IUserSettings;
  exportedAt: Date;
}

// Settings filter and pagination
export interface ISettingsFilters {
  category?: string;
  search?: string;
}

export interface IPaginatedSettings {
  settings: IUserSettings[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

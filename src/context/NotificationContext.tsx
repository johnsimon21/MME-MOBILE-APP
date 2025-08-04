import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import {
  INotification,
  NotificationStatsResponse,
  NotificationPreferencesResponse,
  NotificationFilters,
  UpdateNotificationPreferencesRequest,
} from '../interfaces/notification.interface';

interface NotificationContextType {
  // State
  notifications: INotification[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  unreadCount: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  stats: NotificationStatsResponse | null;
  preferences: NotificationPreferencesResponse | null;
  isSocketConnected: boolean;

  // Actions
  loadNotifications: (filters?: NotificationFilters, page?: number, refresh?: boolean) => Promise<void>;
  loadMore: () => void;
  refresh: () => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  loadStats: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  updatePreferences: (preferences: UpdateNotificationPreferencesRequest) => Promise<void>;
  handleNotificationAction: (notification: INotification) => void;
  getFilteredNotifications: (filters: NotificationFilters) => INotification[];

  // Socket actions
  connectSocket: () => void;
  disconnectSocket: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const notificationHook = useNotifications();

  return (
    <NotificationContext.Provider value={notificationHook}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

// Safe version that returns null if not within provider
export const useNotificationContextSafe = (): NotificationContextType | null => {
  return useContext(NotificationContext);
};

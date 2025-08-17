import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { NotificationAPI } from '../infrastructure/notificationApi';
import { useNotificationSocket } from './useNotificationSocket';
import {
  INotification,
  NotificationsListResponse,
  NotificationStatsResponse,
  NotificationPreferencesResponse,
  QueryNotificationsRequest,
  UpdateNotificationPreferencesRequest,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
} from '../interfaces/notification.interface';

export interface NotificationState {
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
}

export interface NotificationFilters {
  type?: NotificationType;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  isRead?: boolean;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export const useNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const lastFetchTime = useRef<number>(0);
  
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
    unreadCount: 0,
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasMore: false,
    stats: null,
    preferences: null,
    isSocketConnected: false,
  });

  // WebSocket callbacks
  const socketCallbacks = {
    onNewNotification: (notification: INotification) => {
      console.log('🔔 New notification received in hook:', notification);
      setState(prev => ({
        ...prev,
        notifications: [notification, ...prev.notifications],
        unreadCount: prev.unreadCount + 1,
        total: prev.total + 1,
      }));

      // UI will update automatically via state change
    },

    onNotificationsList: (data: NotificationsListResponse) => {
      setState(prev => ({
        ...prev,
        notifications: data.page === 1 ? data.notifications : [...prev.notifications, ...data.notifications],
        total: data.total,
        unreadCount: data.unreadCount,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
        hasMore: data.hasMore,
        isLoading: false,
        isRefreshing: false,
      }));
    },

    onNotificationRead: (data: { notificationId: string; timestamp: Date }) => {
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification =>
          notification.id === data.notificationId
            ? { ...notification, isRead: true }
            : notification
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    },

    onAllNotificationsRead: (data: { count: number; timestamp: Date }) => {
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification => ({ ...notification, isRead: true })),
        unreadCount: 0,
      }));
    },

    onNotificationDeleted: (data: { notificationId: string; timestamp: Date }) => {
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(notification => notification.id !== data.notificationId),
        total: Math.max(0, prev.total - 1),
      }));
    },

    onUnreadCountUpdated: (data: { unreadCount: number }) => {
      setState(prev => ({ ...prev, unreadCount: data.unreadCount }));
    },

    onNotificationStats: (stats: NotificationStatsResponse) => {
      setState(prev => ({ ...prev, stats, unreadCount: stats.unreadCount }));
    },

    onPreferencesUpdated: (preferences: NotificationPreferencesResponse) => {
      setState(prev => ({ ...prev, preferences }));
    },

    onError: (error: string) => {
      setState(prev => ({ ...prev, error }));
    },
  };

  // Initialize WebSocket
  const socket = useNotificationSocket(socketCallbacks);

  // Update socket connection state
  useEffect(() => {
    setState(prev => ({ ...prev, isSocketConnected: socket.isConnected }));
  }, [socket.isConnected]);

  // Load notifications (with cache optimization)
  const loadNotifications = useCallback(async (
    filters: NotificationFilters = {},
    page: number = 1,
    refresh: boolean = false
  ) => {
    if (!isAuthenticated || !user?.uid) {
      console.log('📱 Skipping loadNotifications - not authenticated', { isAuthenticated, userUid: user?.uid });
      return;
    }

    // Prevent excessive API calls
    const now = Date.now();
    if (!refresh && now - lastFetchTime.current < 1000) {
      console.log('📱 Skipping loadNotifications - too soon');
      return;
    }
    lastFetchTime.current = now;

    try {
      console.log('📱 Loading notifications:', { page, filters, socketConnected: socket.isConnected });
      
      setState(prev => ({
        ...prev,
        isLoading: page === 1 && !refresh,
        isRefreshing: refresh,
        error: null,
      }));

      const params: QueryNotificationsRequest = {
        page,
        limit: state.limit,
        ...filters,
      };

      // Try socket first, fallback to API
      if (socket.isConnected && page === 1 && Object.keys(filters).length === 0) {
        console.log('📱 Using socket to get notifications');
        socket.getNotifications(params);
      } else {
        console.log('📱 Using API to get notifications');
        const data = await NotificationAPI.getUserNotifications(user.uid, params);
        console.log('📱 API response:', { count: data.notifications.length, total: data.total, unreadCount: data.unreadCount });
        setState(prev => ({
          ...prev,
          notifications: page === 1 ? data.notifications : [...prev.notifications, ...data.notifications],
          total: data.total,
          unreadCount: data.unreadCount,
          page: data.page,
          totalPages: data.totalPages,
          hasMore: data.hasMore,
          isLoading: false,
          isRefreshing: false,
        }));
      }
    } catch (error: any) {
      console.error('❌ Failed to load notifications:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao carregar notificações',
        isLoading: false,
        isRefreshing: false,
      }));
    }
  }, [isAuthenticated, user?.uid, state.limit, socket.isConnected]);

  // Load more notifications (pagination)
  const loadMore = useCallback(() => {
    if (state.hasMore && !state.isLoading && state.page < state.totalPages) {
      loadNotifications({}, state.page + 1);
    }
  }, [state.hasMore, state.isLoading, state.page, state.totalPages, loadNotifications]);

  // Refresh notifications
  const refresh = useCallback(() => {
    if (!isAuthenticated || !user?.uid) return;
    
    setState(prev => ({ ...prev, isRefreshing: true }));
    
    const params: QueryNotificationsRequest = {
      page: 1,
      limit: state.limit,
    };

    if (socket.isConnected) {
      socket.getNotifications(params);
    } else {
      NotificationAPI.getUserNotifications(user.uid, params)
        .then(data => {
          setState(prev => ({
            ...prev,
            notifications: data.notifications,
            total: data.total,
            unreadCount: data.unreadCount,
            page: data.page,
            totalPages: data.totalPages,
            hasMore: data.hasMore,
            isRefreshing: false,
          }));
        })
        .catch(error => {
          console.error('❌ Failed to refresh notifications:', error);
          setState(prev => ({ ...prev, isRefreshing: false }));
        });
    }
  }, [isAuthenticated, user?.uid, state.limit, socket.isConnected]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.uid) return;

    try {
      // Optimistic update
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));

      // Use socket if connected, otherwise API
      if (socket.isConnected) {
        socket.markAsRead(notificationId);
      } else {
        await NotificationAPI.markAsRead(user.uid, notificationId);
      }
    } catch (error: any) {
      console.error('❌ Failed to mark notification as read:', error);
      // Revert optimistic update
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: false }
            : notification
        ),
        unreadCount: prev.unreadCount + 1,
      }));
    }
  }, [user?.uid, socket.isConnected]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.uid) return;

    try {
      // Optimistic update
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification => ({ ...notification, isRead: true })),
        unreadCount: 0,
      }));

      // Use socket if connected, otherwise API
      if (socket.isConnected) {
        socket.markAllAsRead();
      } else {
        await NotificationAPI.markAllAsRead(user.uid);
      }
    } catch (error: any) {
      console.error('❌ Failed to mark all notifications as read:', error);
      refresh(); // Reload to get correct state
    }
  }, [user?.uid, socket.isConnected]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user?.uid) return;

    try {
      // Optimistic update
      const notificationToDelete = state.notifications.find(n => n.id === notificationId);
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(notification => notification.id !== notificationId),
        total: Math.max(0, prev.total - 1),
        unreadCount: notificationToDelete && !notificationToDelete.isRead 
          ? Math.max(0, prev.unreadCount - 1) 
          : prev.unreadCount,
      }));

      // Use socket if connected, otherwise API
      if (socket.isConnected) {
        socket.deleteNotification(notificationId);
      } else {
        await NotificationAPI.deleteNotification(user.uid, notificationId);
      }
    } catch (error: any) {
      console.error('❌ Failed to delete notification:', error);
      refresh(); // Reload to get correct state
    }
  }, [user?.uid, socket.isConnected]);

  // Load notification stats
  const loadStats = useCallback(async () => {
    if (!user?.uid) return;

    try {
      if (socket.isConnected) {
        socket.getStats();
      } else {
        const stats = await NotificationAPI.getNotificationStats(user.uid);
        setState(prev => ({ ...prev, stats }));
      }
    } catch (error: any) {
      console.error('❌ Failed to load notification stats:', error);
    }
  }, [user?.uid, socket.isConnected]);

  // Load notification preferences
  const loadPreferences = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const preferences = await NotificationAPI.getNotificationPreferences(user.uid);
      setState(prev => ({ ...prev, preferences }));
    } catch (error: any) {
      console.error('❌ Failed to load notification preferences:', error);
    }
  }, [user?.uid]);

  // Update notification preferences
  const updatePreferences = useCallback(async (preferences: UpdateNotificationPreferencesRequest) => {
    if (!user?.uid) return;

    try {
      // Use socket if connected, otherwise API
      if (socket.isConnected) {
        socket.updatePreferences(preferences);
      } else {
        const updatedPreferences = await NotificationAPI.updateNotificationPreferences(user.uid, preferences);
        setState(prev => ({ ...prev, preferences: updatedPreferences }));
      }
    } catch (error: any) {
      console.error('❌ Failed to update notification preferences:', error);
      throw error;
    }
  }, [user?.uid, socket.isConnected]);

  // Handle notification action (navigation)
  const handleNotificationAction = useCallback((notification: INotification) => {
    // Mark as read first
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Handle navigation based on notification type and data
    console.log('📱 Handling notification action:', notification);
    
    // We need access to navigation, so this will be overridden in the screen components
    // This is just a fallback
  }, []);

  // Filter notifications
  const getFilteredNotifications = useCallback((filters: NotificationFilters) => {
    let filtered = [...state.notifications];

    if (filters.isRead !== undefined) {
      filtered = filtered.filter(n => n.isRead === filters.isRead);
    }

    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    if (filters.category) {
      filtered = filtered.filter(n => n.category === filters.category);
    }

    if (filters.priority) {
      filtered = filtered.filter(n => n.priority === filters.priority);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchLower) ||
        n.message.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [state.notifications]);

  // Initialize notifications on auth
  useEffect(() => {
    let mounted = true;

    const initializeNotifications = async () => {
      if (isAuthenticated && user?.uid && mounted) {
        console.log('📱 Initializing notifications for user:', user.uid);
        console.log('📱 Socket connected:', socket.isConnected);
        console.log('📱 Current notifications count:', state.notifications.length);
        try {
          await loadNotifications();
          await loadStats();
          await loadPreferences();
          console.log('📱 Notifications initialized successfully');
        } catch (error) {
          console.error('❌ Failed to initialize notifications:', error);
        }
      } else {
        console.log('📱 Skipping notification initialization:', { isAuthenticated, userUid: user?.uid, mounted });
      }
    };

    initializeNotifications();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user?.uid]); // Removed functions from dependencies

  return {
    // State
    ...state,
    
    // Actions
    loadNotifications,
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadStats,
    loadPreferences,
    updatePreferences,
    handleNotificationAction,
    getFilteredNotifications,
    
    // Socket actions
    connectSocket: socket.connect,
    disconnectSocket: socket.disconnect,
  };
};

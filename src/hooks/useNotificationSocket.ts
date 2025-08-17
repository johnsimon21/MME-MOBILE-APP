import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { ENV } from '../config/env';
import { useAuth } from '../context/AuthContext';
import {
  INotification,
  NotificationsListResponse,
  NotificationStatsResponse,
  NotificationPreferencesResponse,
  NotificationSocketEvents,
  UpdateNotificationPreferencesRequest,
} from '../interfaces/notification.interface';

export interface NotificationSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  unreadCount: number;
}

export interface NotificationSocketActions {
  connect: () => void;
  disconnect: () => void;
  getNotifications: (params?: { page?: number; limit?: number; isRead?: boolean }) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  getStats: () => void;
  updatePreferences: (preferences: UpdateNotificationPreferencesRequest) => void;
}

export interface NotificationSocketCallbacks {
  onNewNotification?: (notification: INotification) => void;
  onNotificationsList?: (data: NotificationsListResponse) => void;
  onNotificationRead?: (data: { notificationId: string; timestamp: Date }) => void;
  onAllNotificationsRead?: (data: { count: number; timestamp: Date }) => void;
  onNotificationDeleted?: (data: { notificationId: string; timestamp: Date }) => void;
  onUnreadCountUpdated?: (data: { unreadCount: number }) => void;
  onNotificationStats?: (stats: NotificationStatsResponse) => void;
  onPreferencesUpdated?: (preferences: NotificationPreferencesResponse) => void;
  onSystemNotification?: (notification: any) => void;
  onUserStatusChanged?: (data: { userId: string; status: 'online' | 'offline'; timestamp: Date }) => void;
  onError?: (error: string) => void;
}

export const useNotificationSocket = (callbacks: NotificationSocketCallbacks = {}) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<typeof Socket | null>(null);
  
  const [state, setState] = useState<NotificationSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    unreadCount: 0,
  });

  // Get WebSocket URL
  const getSocketUrl = useCallback(() => {
    const baseUrl = ENV.API_BASE_URL.replace('/api', '');
    return `${baseUrl}/notifications`;
  }, []);

  // Connect to notification socket
  const connect = useCallback(() => {
    if (!isAuthenticated || !user?.uid || socketRef.current?.connected || state.isConnecting) {
      console.log('🔌 Skipping connection - already connected or connecting');
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      console.log('🔌 Connecting to notification socket...');
      
      const socket = io(getSocketUrl(), {
        transports: ['websocket', 'polling'],
        autoConnect: false,
        query: {
          userId: user.uid,
        },
        timeout: 10000,
        forceNew: true,
      });

      // Connection events
      socket.on('connect', () => {
        console.log('✅ Notification socket connected');
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          isConnecting: false, 
          error: null 
        }));
      });

      socket.on('disconnect', (reason: any) => {
        console.log('🔌 Notification socket disconnected:', reason);
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isConnecting: false 
        }));
      });

      socket.on('connect_error', (error: { message: string; }) => {
        console.error('❌ Notification socket connection error:', error);
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isConnecting: false, 
          error: error.message 
        }));
        callbacks.onError?.(error.message);
      });

      // Notification events
      socket.on('connected', (data: { userId: string; message: string; unreadCount: number; timestamp: Date }) => {
        console.log('📱 Notification service connected:', data);
        setState(prev => ({ ...prev, unreadCount: data.unreadCount }));
        
        // Notify that connection is established
        callbacks.onNotificationsList?.({
          notifications: [],
          total: 0,
          unreadCount: data.unreadCount,
          page: 1,
          limit: 20,
          totalPages: 0,
          hasMore: false
        });
      });

      socket.on('error', (data: { message: string }) => {
        console.error('❌ Notification socket error:', data.message);
        setState(prev => ({ ...prev, error: data.message }));
        callbacks.onError?.(data.message);
      });

      socket.on('new-notification', (notification: INotification) => {
        console.log('🔔 New notification received:', notification);
        callbacks.onNewNotification?.(notification);
      });

      socket.on('notifications-list', (data: NotificationsListResponse) => {
        console.log('📋 Notifications list received:', data);
        callbacks.onNotificationsList?.(data);
      });

      socket.on('notification-read', (data: { notificationId: string; timestamp: Date }) => {
        console.log('✅ Notification marked as read:', data);
        callbacks.onNotificationRead?.(data);
      });

      socket.on('all-notifications-read', (data: { count: number; timestamp: Date }) => {
        console.log('✅ All notifications marked as read:', data);
        setState(prev => ({ ...prev, unreadCount: 0 }));
        callbacks.onAllNotificationsRead?.(data);
      });

      socket.on('notification-deleted', (data: { notificationId: string; timestamp: Date }) => {
        console.log('🗑️ Notification deleted:', data);
        callbacks.onNotificationDeleted?.(data);
      });

      socket.on('unread-count-updated', (data: { unreadCount: number }) => {
        console.log('🔢 Unread count updated:', data);
        setState(prev => ({ ...prev, unreadCount: data.unreadCount }));
        callbacks.onUnreadCountUpdated?.(data);
      });

      socket.on('notification-stats', (stats: NotificationStatsResponse) => {
        console.log('📊 Notification stats received:', stats);
        setState(prev => ({ ...prev, unreadCount: stats.unreadCount }));
        callbacks.onNotificationStats?.(stats);
      });

      socket.on('preferences-updated', (preferences: NotificationPreferencesResponse) => {
        console.log('⚙️ Notification preferences updated:', preferences);
        callbacks.onPreferencesUpdated?.(preferences);
      });

      socket.on('system-notification', (notification: any) => {
        console.log('🔔 System notification received:', notification);
        callbacks.onSystemNotification?.(notification);
      });

      socket.on('user-status-changed', (data: { userId: string; status: 'online' | 'offline'; timestamp: Date }) => {
        console.log('👤 User status changed:', data);
        callbacks.onUserStatusChanged?.(data);
      });

      socketRef.current = socket;
      socket.connect();

    } catch (error: any) {
      console.error('❌ Failed to create notification socket:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error.message 
      }));
      callbacks.onError?.(error.message);
    }
  }, [isAuthenticated, user?.uid]);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('🔌 Disconnecting notification socket...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setState(prev => ({ ...prev, isConnected: false, isConnecting: false }));
    }
  }, []);

  // Socket actions
  const actions: NotificationSocketActions = {
    connect,
    disconnect,
    
    getNotifications: (params = {}) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('get-notifications', params);
      }
    },

    markAsRead: (notificationId: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('mark-as-read', { notificationId });
      }
    },

    markAllAsRead: () => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('mark-all-read', {});
      }
    },

    deleteNotification: (notificationId: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('delete-notification', { notificationId });
      }
    },

    getStats: () => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('get-stats', {});
      }
    },

    updatePreferences: (preferences: UpdateNotificationPreferencesRequest) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('update-preferences', preferences);
      }
    },
  };

  // Auto-connect when authenticated
  useEffect(() => {
    let mounted = true;

    if (isAuthenticated && user?.uid && mounted) {
      console.log('🔌 Auto-connecting notification socket for user:', user.uid);
      connect();
    } else if (mounted) {
      console.log('🔌 Auto-disconnecting notification socket');
      disconnect();
    }

    return () => {
      mounted = false;
      disconnect();
    };
  }, [isAuthenticated, user?.uid]); // Removed connect/disconnect from dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    ...actions,
  };
};

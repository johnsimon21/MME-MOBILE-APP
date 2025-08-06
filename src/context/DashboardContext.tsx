import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { ENV } from '../config/env';
import { useDashboard } from '../hooks/useDashboard';
import {
  IDashboardStats,
  IDashboardStatsQuery,
  IRealTimeStats,
  IRecentActivity,
  ISessionAnalytics,
  ISessionAnalyticsQuery,
  IUserAnalyticsListResponse,
  IUserAnalyticsQuery
} from '../interfaces/dashboard.interface';
import { useAuth } from './AuthContext';

interface DashboardContextType {
  // Real-time data
  dashboardStats: IDashboardStats | null;
  userAnalytics: IUserAnalyticsListResponse | null;
  sessionAnalytics: ISessionAnalytics | null;
  realTimeStats: IRealTimeStats | null;
  recentActivity: IRecentActivity[];

  // Connection state
  isConnected: boolean;
  connectionError: string | null;

  // Loading states
  isLoadingStats: boolean;
  isLoadingUsers: boolean;
  isLoadingSessions: boolean;

  // Actions
  refreshDashboardStats: (query?: IDashboardStatsQuery) => Promise<void>;
  refreshUserAnalytics: (query?: IUserAnalyticsQuery) => Promise<void>;
  refreshSessionAnalytics: (query?: ISessionAnalyticsQuery) => Promise<void>;
  requestUserAnalytics: (filters: IUserAnalyticsQuery) => void;
  requestSessionAnalytics: (filters: ISessionAnalyticsQuery) => void;

  // Socket actions
  connect: () => void;
  disconnect: () => void;

  // Utility
  clearErrors: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  // Socket state
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Data state
  const [dashboardStats, setDashboardStats] = useState<IDashboardStats | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<IUserAnalyticsListResponse | null>(null);
  const [sessionAnalytics, setSessionAnalytics] = useState<ISessionAnalytics | null>(null);
  const [realTimeStats, setRealTimeStats] = useState<IRealTimeStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<IRecentActivity[]>([]);

  // Loading states
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const { user, getIdToken } = useAuth();
  const dashboardHook = useDashboard();

  // Get WebSocket URL
  const getSocketUrl = useCallback(() => {
    const baseUrl = ENV.API_BASE_URL.replace('/api', '');
    return `${baseUrl}/dashboard`;
  }, []);

  // Socket connection
  const connect = useCallback(async () => {
    if (!user || socket?.connected) return;

    try {
      const token = await getIdToken();
      if (!token) {
        console.log('⚠️ No token available for dashboard socket connection');
        return;
      }

      console.log('🔄 Connecting to dashboard socket...');

      const newSocket = io(getSocketUrl(), {
        query: {
          userId: user.uid,
          role: user.role,
          token: token
        },
        transports: ['websocket'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        forceNew: true,
        autoConnect: false
      });

      newSocket.connect();

      // Connection events
      newSocket.on('connect', () => {
        console.log('✅ Dashboard socket connected:', newSocket.id);
        setIsConnected(true);
        setConnectionError(null);
      });

      newSocket.on('disconnect', (reason: any) => {
        console.log('🔌 Dashboard socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error: any) => {
        console.error('❌ Dashboard socket connection error:', error.message);
        setConnectionError(`Erro de conexão: ${error.message}`);
        setIsConnected(false);
      });

      // Dashboard data events
      newSocket.on('dashboard-stats', (data: IDashboardStats) => {
        console.log('📊 Dashboard stats updated:', data);
        setDashboardStats(data);
      });

      newSocket.on('user-analytics', (data: IUserAnalyticsListResponse) => {
        console.log('👥 User analytics updated:', data);
        setUserAnalytics(data);
      });

      newSocket.on('session-analytics', (data: ISessionAnalytics) => {
        console.log('📅 Session analytics updated:', data);
        setSessionAnalytics(data);
      });

      newSocket.on('real-time-stats', (data: IRealTimeStats) => {
        console.log('⚡ Real-time stats updated:', data);
        setRealTimeStats(data);
      });

      newSocket.on('user-activity', (data: IRecentActivity) => {
        console.log('🔔 New user activity:', data);
        setRecentActivity(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 activities
      });

      newSocket.on('session-update', (data: any) => {
        console.log('📅 Session update:', data);
        // Update session analytics directly instead of triggering refresh to avoid loops
        if (data.sessionAnalytics) {
          setSessionAnalytics(data.sessionAnalytics);
        }
      });

      newSocket.on('error', (data: any) => {
        console.error('❌ Dashboard socket error:', data.message);
        setConnectionError(data.message);
      });

      setSocket(newSocket);
    } catch (error: any) {
      console.error('❌ Error setting up dashboard socket:', error);
      setConnectionError(`Erro ao configurar dashboard: ${error.message}`);
    }
  }, [user, getIdToken, socket]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
    }
  }, [socket]);

  // Data refresh functions
  const refreshDashboardStats = useCallback(async (query?: IDashboardStatsQuery) => {
    try {
      setIsLoadingStats(true);
      const stats = await dashboardHook.getDashboardStats(query);
      setDashboardStats(stats);
    } catch (error: any) {
      console.error('Error refreshing dashboard stats:', error);
      setConnectionError(error.message);
    } finally {
      setIsLoadingStats(false);
    }
  }, [dashboardHook]);

  const refreshUserAnalytics = useCallback(async (query?: IUserAnalyticsQuery) => {
    try {
      setIsLoadingUsers(true);
      const analytics = await dashboardHook.getUserAnalytics(query);
      setUserAnalytics(analytics);
    } catch (error: any) {
      console.error('Error refreshing user analytics:', error);
      setConnectionError(error.message);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [dashboardHook]);

  const refreshSessionAnalytics = useCallback(async (query?: ISessionAnalyticsQuery) => {
    try {
      setIsLoadingSessions(true);
      const analytics = await dashboardHook.getSessionAnalytics(query);
      setSessionAnalytics(analytics);
    } catch (error: any) {
      console.error('Error refreshing session analytics:', error);
      setConnectionError(error.message);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [dashboardHook]);

  // Socket request functions
  const requestUserAnalytics = useCallback((filters: IUserAnalyticsQuery) => {
    if (socket && isConnected) {
      socket.emit('request-user-analytics', filters);
    }
  }, [socket, isConnected]);

  const requestSessionAnalytics = useCallback((filters: ISessionAnalyticsQuery) => {
    if (socket && isConnected) {
      socket.emit('request-session-analytics', filters);
    }
  }, [socket, isConnected]);

  const clearErrors = useCallback(() => {
    setConnectionError(null);
    dashboardHook.clearError();
  }, [dashboardHook]);

  // Auto-connect when user is available
  useEffect(() => {
    if (user && user.role === 'coordinator') {
      const timer = setTimeout(() => {
        connect();
      }, 2000);

      return () => {
        clearTimeout(timer);
        disconnect();
      };
    } else {
      disconnect();
    }
  }, [user, connect, disconnect]);

  // Load initial data only once when user becomes coordinator
  useEffect(() => {
    if (user && user.role === 'coordinator') {
      // Use a timeout to prevent immediate firing on every dependency change
      const timer = setTimeout(() => {
        refreshDashboardStats();
        refreshUserAnalytics();
        refreshSessionAnalytics();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user?.uid, user?.role]); // Only depend on user id and role, not the refresh functions

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
    };
  }, []);

  const contextValue: DashboardContextType = {
    // Real-time data
    dashboardStats,
    userAnalytics,
    sessionAnalytics,
    realTimeStats,
    recentActivity,

    // Connection state
    isConnected,
    connectionError,

    // Loading states
    isLoadingStats,
    isLoadingUsers,
    isLoadingSessions,

    // Actions
    refreshDashboardStats,
    refreshUserAnalytics,
    refreshSessionAnalytics,
    requestUserAnalytics,
    requestSessionAnalytics,

    // Socket actions
    connect,
    disconnect,

    // Utility
    clearErrors,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
};

export const useDashboardSafe = () => {
  try {
    return useContext(DashboardContext);
  } catch (error) {
    console.warn('DashboardContext not available, returning null');
    return null;
  }
};
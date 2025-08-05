import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { SupportAPI } from '../infrastructure/supportApi';
import { useSupportSocket } from './useSupportSocket';
import {
  ISupportStats,
  IAdminUsersResponse,
  ISupportChatSession,
} from '../interfaces/support.interface';

export interface SupportAdminState {
  stats: ISupportStats | null;
  adminUsers: IAdminUsersResponse | null;
  waitingSessions: ISupportChatSession[];
  isLoadingStats: boolean;
  isLoadingUsers: boolean;
  isLoadingSessions: boolean;
  isRefreshing: boolean;
  error: string | null;
  isSocketConnected: boolean;
  onlineAdmins: string[];
}

export const useSupportAdmin = () => {
  const { user, isAuthenticated } = useAuth();
  const lastFetchTime = useRef<number>(0);
  
  const [state, setState] = useState<SupportAdminState>({
    stats: null,
    adminUsers: null,
    waitingSessions: [],
    isLoadingStats: false,
    isLoadingUsers: false,
    isLoadingSessions: false,
    isRefreshing: false,
    error: null,
    isSocketConnected: false,
    onlineAdmins: [],
  });

  // Check if user is admin/coordinator
  const isAdmin = user?.role === 'coordinator';

  // WebSocket callbacks for admin
  const socketCallbacks = {
    onWaitingSessions: (data: { sessions: ISupportChatSession[]; count: number }) => {
      console.log('⏳ Waiting sessions received:', data);
      setState(prev => ({
        ...prev,
        waitingSessions: data.sessions,
        isLoadingSessions: false,
      }));
    },

    onSessionAssigned: (data: { sessionId: string; assignedTo: string; timestamp: Date }) => {
      console.log('👨‍💼 Session assigned:', data);
      setState(prev => ({
        ...prev,
        waitingSessions: prev.waitingSessions.filter(session => session.id !== data.sessionId),
      }));
    },

    onSessionAssignedSuccess: (data: { sessionId: string; session: ISupportChatSession }) => {
      console.log('✅ Session assigned successfully:', data);
      setState(prev => ({
        ...prev,
        waitingSessions: prev.waitingSessions.filter(session => session.id !== data.sessionId),
      }));
    },

    onAdminOnline: (data: { adminId: string; timestamp: Date }) => {
      console.log('👨‍💼 Admin online:', data);
      setState(prev => ({
        ...prev,
        onlineAdmins: [...prev.onlineAdmins.filter(id => id !== data.adminId), data.adminId],
      }));
    },

    onAdminOffline: (data: { adminId: string; timestamp: Date }) => {
      console.log('👨‍💼 Admin offline:', data);
      setState(prev => ({
        ...prev,
        onlineAdmins: prev.onlineAdmins.filter(id => id !== data.adminId),
      }));
    },

    onNewChatSession: (data: { sessionId: string; session: ISupportChatSession; timestamp: Date }) => {
      console.log('💬 New chat session for admin:', data);
      if (data.session.status === 'waiting') {
        setState(prev => ({
          ...prev,
          waitingSessions: [data.session, ...prev.waitingSessions],
        }));
      }
    },

    onNewTicket: (data: { ticketId: string; ticket: any; timestamp: Date }) => {
      console.log('🎫 New ticket for admin:', data);
      // Could trigger a notification or update stats
    },

    onError: (error: string) => {
      setState(prev => ({ ...prev, error }));
    },
  };

  // Initialize WebSocket (only for admins)
  const socket = useSupportSocket(isAdmin ? socketCallbacks : {});

  // Update socket connection state
  useEffect(() => {
    setState(prev => ({ 
      ...prev, 
      isSocketConnected: socket.isConnected,
      onlineAdmins: socket.onlineAdmins,
    }));
  }, [socket.isConnected, socket.onlineAdmins]);

  // Load support stats
  const loadStats = useCallback(async (
    period: 'day' | 'week' | 'month' | 'year' = 'month',
    refresh: boolean = false
  ) => {
    if (!isAuthenticated || !isAdmin) {
      console.log('📊 Skipping loadStats - not authenticated or not admin');
      return;
    }

    // Prevent excessive API calls
    const now = Date.now();
    if (!refresh && now - lastFetchTime.current < 5000) {
      console.log('📊 Skipping loadStats - too soon');
      return;
    }
    lastFetchTime.current = now;

    try {
      setState(prev => ({
        ...prev,
        isLoadingStats: true,
        error: null,
      }));

      const stats = await SupportAPI.getSupportStats(period);
      
      setState(prev => ({
        ...prev,
        stats,
        isLoadingStats: false,
      }));

    } catch (error: any) {
      console.error('❌ Failed to load support stats:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao carregar estatísticas',
        isLoadingStats: false,
      }));
    }
  }, [isAuthenticated, isAdmin]);

  // Load admin users
  const loadAdminUsers = useCallback(async (
    page: number = 1,
    limit: number = 20,
    search?: string,
    refresh: boolean = false
  ) => {
    if (!isAuthenticated || !isAdmin) {
      console.log('👥 Skipping loadAdminUsers - not authenticated or not admin');
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        isLoadingUsers: !refresh && page === 1,
        isRefreshing: refresh,
        error: null,
      }));

      const adminUsers = await SupportAPI.getAdminUsers(page, limit, search);
      
      setState(prev => ({
        ...prev,
        adminUsers,
        isLoadingUsers: false,
        isRefreshing: false,
      }));

    } catch (error: any) {
      console.error('❌ Failed to load admin users:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao carregar usuários administradores',
        isLoadingUsers: false,
        isRefreshing: false,
      }));
    }
  }, [isAuthenticated, isAdmin]);

  // Load waiting chat sessions
  const loadWaitingSessions = useCallback(() => {
    if (!isAuthenticated || !isAdmin || !socket.isConnected) {
      console.log('⏳ Skipping loadWaitingSessions - not authenticated, not admin, or socket not connected');
      return;
    }

    setState(prev => ({ ...prev, isLoadingSessions: true }));
    socket.getWaitingSessions();
  }, [isAuthenticated, isAdmin, socket.isConnected]);

  // Assign chat session to admin
  const assignSession = useCallback(async (sessionId: string): Promise<void> => {
    if (!isAuthenticated || !isAdmin) {
      throw new Error('Not authorized to assign sessions');
    }

    try {
      if (socket.isConnected) {
        socket.assignSession(sessionId);
      } else {
        // Fallback to API if socket not connected
        await SupportAPI.assignChatSession(sessionId, user!.uid);
        
        // Remove from waiting sessions
        setState(prev => ({
          ...prev,
          waitingSessions: prev.waitingSessions.filter(session => session.id !== sessionId),
        }));
      }
    } catch (error: any) {
      console.error('❌ Failed to assign session:', error);
      throw error;
    }
  }, [isAuthenticated, isAdmin, socket.isConnected, user?.uid]);

  // Refresh all admin data
  const refreshAll = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) return;

    setState(prev => ({ ...prev, isRefreshing: true }));

    try {
      await Promise.all([
        loadStats('month', true),
        loadAdminUsers(1, 20, undefined, true),
      ]);

      if (socket.isConnected) {
        loadWaitingSessions();
      }
    } catch (error) {
      console.error('❌ Failed to refresh admin data:', error);
    } finally {
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, [isAuthenticated, isAdmin, loadStats, loadAdminUsers, loadWaitingSessions, socket.isConnected]);

  // Get stats summary for dashboard
  const getStatsSummary = useCallback(() => {
    if (!state.stats) return null;

    return {
      totalTickets: state.stats.tickets.total,
      openTickets: state.stats.tickets.open,
      activeChatSessions: state.stats.chat.activeSessions,
      waitingChatSessions: state.stats.chat.waitingSessions,
      totalFAQs: state.stats.faqs.total,
      averageResolutionTime: state.stats.tickets.averageResolutionTime,
      averageResponseTime: state.stats.chat.averageResponseTime,
    };
  }, [state.stats]);

  // Get ticket stats by category
  const getTicketsByCategory = useCallback(() => {
    if (!state.stats) return [];

    return Object.entries(state.stats.tickets.byCategory).map(([category, count]) => ({
      category,
      count,
      percentage: state.stats!.tickets.total > 0 
        ? (count / state.stats!.tickets.total) * 100 
        : 0,
    }));
  }, [state.stats]);

  // Get ticket stats by priority
  const getTicketsByPriority = useCallback(() => {
    if (!state.stats) return [];

    return Object.entries(state.stats.tickets.byPriority).map(([priority, count]) => ({
      priority,
      count,
      percentage: state.stats!.tickets.total > 0 
        ? (count / state.stats!.tickets.total) * 100 
        : 0,
    }));
  }, [state.stats]);

  // Initialize admin data on auth (only for admins)
  useEffect(() => {
    let mounted = true;

    const initializeAdminData = async () => {
      if (isAuthenticated && isAdmin && mounted) {
        console.log('📊 Initializing admin data for user:', user?.uid);
        try {
          await loadStats();
          await loadAdminUsers();
        } catch (error) {
          console.error('❌ Failed to initialize admin data:', error);
        }
      }
    };

    initializeAdminData();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, isAdmin, user?.uid]);

  // Load waiting sessions when socket connects (for admins)
  useEffect(() => {
    if (isAuthenticated && isAdmin && socket.isConnected) {
      loadWaitingSessions();
    }
  }, [isAuthenticated, isAdmin, socket.isConnected, loadWaitingSessions]);

  return {
    // State
    ...state,
    isAdmin,
    
    // Actions
    loadStats,
    loadAdminUsers,
    loadWaitingSessions,
    assignSession,
    refreshAll,
    getStatsSummary,
    getTicketsByCategory,
    getTicketsByPriority,
    
    // Socket actions
    connectSocket: socket.connect,
    disconnectSocket: socket.disconnect,
  };
};

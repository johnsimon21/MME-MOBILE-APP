import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { SupportAPI } from '../infrastructure/supportApi';
import { useSupportSocket } from './useSupportSocket';
import {
  ISupportChatSession,
  ISupportChatMessage,
  IChatSessionsResponse,
  IStartChatSessionRequest,
  ISendChatMessageRequest,
  ICloseChatSessionRequest,
  ChatSessionStatus,
  ChatPriority,
} from '../interfaces/support.interface';

export interface SupportChatState {
  sessions: ISupportChatSession[];
  currentSession: ISupportChatSession | null;
  messages: ISupportChatMessage[];
  isLoading: boolean;
  isRefreshing: boolean;
  isSendingMessage: boolean;
  isStartingSession: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  stats: {
    waiting: number;
    active: number;
    closed: number;
    averageWaitTime: number;
    averageResponseTime: number;
  } | null;
  typingUsers: Map<string, { isTyping: boolean; timestamp: Date }>;
  isSocketConnected: boolean;
}

export interface SupportChatFilters {
  status?: ChatSessionStatus;
  priority?: ChatPriority;
  search?: string;
}

export const useSupportChat = () => {
  const { user, isAuthenticated } = useAuth();
  const lastFetchTime = useRef<number>(0);
  const typingTimeoutRef = useRef<any>(null);
  
  const [state, setState] = useState<SupportChatState>({
    sessions: [],
    currentSession: null,
    messages: [],
    isLoading: false,
    isRefreshing: false,
    isSendingMessage: false,
    isStartingSession: false,
    error: null,
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasMore: false,
    stats: null,
    typingUsers: new Map(),
    isSocketConnected: false,
  });

  // WebSocket callbacks
  const socketCallbacks = {
    onNewChatSession: (data: { sessionId: string; session: ISupportChatSession; timestamp: Date }) => {
      console.log('💬 New chat session received:', data);
      setState(prev => ({
        ...prev,
        sessions: [data.session, ...prev.sessions],
        total: prev.total + 1,
      }));
    },

    onJoinedSupportChat: (data: { sessionId: string; message: string }) => {
      console.log('💬 Joined support chat:', data);
    },

    onLeftSupportChat: (data: { sessionId: string; message: string }) => {
      console.log('💬 Left support chat:', data);
      setState(prev => ({
        ...prev,
        currentSession: prev.currentSession?.id === data.sessionId ? null : prev.currentSession,
        messages: prev.currentSession?.id === data.sessionId ? [] : prev.messages,
      }));
    },

    onNewSupportMessage: (data: { sessionId: string; message: ISupportChatMessage }) => {
      console.log('💬 New support message:', data);
      setState(prev => ({
        ...prev,
        messages: prev.currentSession?.id === data.sessionId 
          ? [...prev.messages, data.message]
          : prev.messages,
        sessions: prev.sessions.map(session =>
          session.id === data.sessionId
            ? {
                ...session,
                lastMessage: {
                  message: data.message.message,
                  senderName: data.message.sender.fullName,
                  senderType: data.message.sender.senderType,
                  timestamp: data.message.timestamp,
                },
                lastActivity: data.message.timestamp,
                messagesCount: session.messagesCount + 1,
              }
            : session
        ),
      }));
    },

    onSupportMessageSent: (data: { sessionId: string; messageId: string; timestamp: Date }) => {
      console.log('✅ Support message sent:', data);
      setState(prev => ({ ...prev, isSendingMessage: false }));
    },

    onSupportUserTyping: (data: { sessionId: string; userId: string; userRole: string; isTyping: boolean }) => {
      if (state.currentSession?.id === data.sessionId && data.userId !== user?.uid) {
        setState(prev => {
          const newTypingUsers = new Map(prev.typingUsers);
          if (data.isTyping) {
            newTypingUsers.set(data.userId, { isTyping: true, timestamp: new Date() });
          } else {
            newTypingUsers.delete(data.userId);
          }
          return { ...prev, typingUsers: newTypingUsers };
        });
      }
    },

    onAdminJoinedSession: (data: { sessionId: string; admin: any; timestamp: Date }) => {
      console.log('👨‍💼 Admin joined session:', data);
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(session =>
          session.id === data.sessionId
            ? { ...session, admin: data.admin, status: ChatSessionStatus.ACTIVE }
            : session
        ),
        currentSession: prev.currentSession?.id === data.sessionId
          ? { ...prev.currentSession, admin: data.admin, status: ChatSessionStatus.ACTIVE }
          : prev.currentSession,
      }));
    },

    onUserJoinedChat: (data: { sessionId: string; userId: string; userRole: string; timestamp: Date }) => {
      console.log('👤 User joined chat:', data);
    },

    onUserLeftChat: (data: { sessionId: string; userId: string; timestamp: Date }) => {
      console.log('👤 User left chat:', data);
    },

    onError: (error: string) => {
      setState(prev => ({ ...prev, error }));
    },
  };

  // Initialize WebSocket
  const socket = useSupportSocket(socketCallbacks);

  // Update socket connection state
  useEffect(() => {
    setState(prev => ({ ...prev, isSocketConnected: socket.isConnected }));
  }, [socket.isConnected]);

  // Load chat sessions
  const loadSessions = useCallback(async (
    page: number = 1,
    limit: number = 20,
    status?: string,
    refresh: boolean = false
  ) => {
    if (!isAuthenticated || !user?.uid) {
      console.log('💬 Skipping loadSessions - not authenticated');
      return;
    }

    // Prevent excessive API calls
    const now = Date.now();
    if (!refresh && now - lastFetchTime.current < 1000) {
      console.log('💬 Skipping loadSessions - too soon');
      return;
    }
    lastFetchTime.current = now;

    try {
      setState(prev => ({
        ...prev,
        isLoading: page === 1 && !refresh,
        isRefreshing: refresh,
        error: null,
      }));

      const data = await SupportAPI.getChatSessions(page, limit, status);
      
      setState(prev => ({
        ...prev,
        sessions: page === 1 ? data.sessions : [...prev.sessions, ...data.sessions],
        total: data.total,
        page: data.page,
        totalPages: data.totalPages,
        hasMore: data.page < data.totalPages,
        stats: data.stats || null,
        isLoading: false,
        isRefreshing: false,
      }));

    } catch (error: any) {
      console.error('❌ Failed to load chat sessions:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao carregar sessões de chat',
        isLoading: false,
        isRefreshing: false,
      }));
    }
  }, [isAuthenticated, user?.uid]);

  // Load more sessions (pagination)
  const loadMore = useCallback(() => {
    if (state.hasMore && !state.isLoading && state.page < state.totalPages) {
      loadSessions(state.page + 1, state.limit);
    }
  }, [state.hasMore, state.isLoading, state.page, state.totalPages, state.limit, loadSessions]);

  // Refresh sessions
  const refresh = useCallback(() => {
    if (!isAuthenticated || !user?.uid) return;
    
    setState(prev => ({ ...prev, isRefreshing: true }));
    loadSessions(1, state.limit, undefined, true);
  }, [isAuthenticated, user?.uid, state.limit, loadSessions]);

  // Start chat session
  const startChatSession = useCallback(async (
    sessionData: IStartChatSessionRequest
  ): Promise<ISupportChatSession> => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      setState(prev => ({ ...prev, isStartingSession: true, error: null }));

      const session = await SupportAPI.startChatSession(sessionData);

      // Add to local state
      setState(prev => ({
        ...prev,
        sessions: [session, ...prev.sessions],
        currentSession: session,
        messages: [],
        total: prev.total + 1,
        isStartingSession: false,
      }));

      // Join chat room for real-time updates
      if (socket.isConnected) {
        socket.joinSupportChat(session.id);
      }

      return session;
    } catch (error: any) {
      console.error('❌ Failed to start chat session:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao iniciar sessão de chat',
        isStartingSession: false,
      }));
      throw error;
    }
  }, [user?.uid, socket.isConnected]);

  // Join existing session
  const joinSession = useCallback(async (sessionId: string): Promise<ISupportChatSession> => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const session = await SupportAPI.getChatSession(sessionId);

      setState(prev => ({
        ...prev,
        currentSession: session,
        messages: [], // Messages will be loaded separately or via WebSocket
        isLoading: false,
      }));

      // Join chat room for real-time updates
      if (socket.isConnected) {
        socket.joinSupportChat(sessionId);
      }

      return session;
    } catch (error: any) {
      console.error('❌ Failed to join chat session:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao entrar na sessão de chat',
        isLoading: false,
      }));
      throw error;
    }
  }, [user?.uid, socket.isConnected]);

  // Send message
  const sendMessage = useCallback(async (
    sessionId: string,
    message: string
  ): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      setState(prev => ({ ...prev, isSendingMessage: true, error: null }));

      // Use socket for real-time if connected, otherwise API
      if (socket.isConnected) {
        socket.sendSupportMessage(sessionId, message);
      } else {
        await SupportAPI.sendChatMessage(sessionId, { message });
        setState(prev => ({ ...prev, isSendingMessage: false }));
      }

    } catch (error: any) {
      console.error('❌ Failed to send message:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao enviar mensagem',
        isSendingMessage: false,
      }));
      throw error;
    }
  }, [user?.uid, socket.isConnected]);

  // Start typing indicator
  const startTyping = useCallback((sessionId: string) => {
    if (socket.isConnected) {
      socket.startTyping(sessionId);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (socket.isConnected) {
          socket.stopTyping(sessionId);
        }
      }, 3000) as any;
    }
  }, [socket.isConnected]);

  // Stop typing indicator
  const stopTyping = useCallback((sessionId: string) => {
    if (socket.isConnected) {
      socket.stopTyping(sessionId);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket.isConnected]);

  // Close chat session
  const closeChatSession = useCallback(async (
    sessionId: string,
    closeData: ICloseChatSessionRequest
  ): Promise<ISupportChatSession> => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const session = await SupportAPI.closeChatSession(sessionId, closeData);

      // Update local state
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(s =>
          s.id === sessionId ? session : s
        ),
        currentSession: prev.currentSession?.id === sessionId ? null : prev.currentSession,
        messages: prev.currentSession?.id === sessionId ? [] : prev.messages,
      }));

      // Leave chat room
      if (socket.isConnected) {
        socket.leaveSupportChat(sessionId);
      }

      return session;
    } catch (error: any) {
      console.error('❌ Failed to close chat session:', error);
      throw error;
    }
  }, [user?.uid, socket.isConnected]);

  // Leave current session
  const leaveCurrentSession = useCallback(() => {
    if (socket.isConnected && state.currentSession) {
      socket.leaveSupportChat(state.currentSession.id);
    }
    setState(prev => ({ 
      ...prev, 
      currentSession: null, 
      messages: [],
      typingUsers: new Map(),
    }));
  }, [socket.isConnected, state.currentSession]);

  // Filter sessions
  const getFilteredSessions = useCallback((filters: SupportChatFilters) => {
    let filtered = [...state.sessions];

    if (filters.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(s => s.priority === filters.priority);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(s => 
        s.subject?.toLowerCase().includes(searchLower) ||
        s.user.fullName.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [state.sessions]);

  // Get typing users for current session
  const getTypingUsers = useCallback(() => {
    return Array.from(state.typingUsers.entries())
      .filter(([_, value]) => value.isTyping)
      .map(([userId]) => userId);
  }, [state.typingUsers]);

  // Initialize chat sessions on auth
  useEffect(() => {
    let mounted = true;

    const initializeChatSessions = async () => {
      if (isAuthenticated && user?.uid && mounted) {
        console.log('💬 Initializing chat sessions for user:', user.uid);
        try {
          await loadSessions();
        } catch (error) {
          console.error('❌ Failed to initialize chat sessions:', error);
        }
      }
    };

    initializeChatSessions();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user?.uid]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      leaveCurrentSession();
    };
  }, [leaveCurrentSession]);

  return {
    // State
    ...state,
    
    // Actions
    loadSessions,
    loadMore,
    refresh,
    startChatSession,
    joinSession,
    sendMessage,
    startTyping,
    stopTyping,
    closeChatSession,
    leaveCurrentSession,
    getFilteredSessions,
    getTypingUsers,
    
    // Socket actions
    connectSocket: socket.connect,
    disconnectSocket: socket.disconnect,
  };
};

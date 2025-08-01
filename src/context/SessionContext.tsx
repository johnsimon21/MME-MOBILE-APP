import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { ISessionResponse, SessionStatus } from '../interfaces/sessions.interface';
import { useSessions } from '../hooks/useSessions';
import { useSessionSocket } from '../hooks/useSessionSocket';
import { useAuth } from './AuthContext';

interface SessionState {
  sessions: ISessionResponse[];
  activeSessions: ISessionResponse[];
  upcomingSessions: ISessionResponse[];
  currentSession: ISessionResponse | null;
  isLoading: boolean;
  error: string | null;
  stats: any;
}

type SessionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSIONS'; payload: ISessionResponse[] }
  | { type: 'SET_ACTIVE_SESSIONS'; payload: ISessionResponse[] }
  | { type: 'SET_UPCOMING_SESSIONS'; payload: ISessionResponse[] }
  | { type: 'SET_CURRENT_SESSION'; payload: ISessionResponse | null }
  | { type: 'UPDATE_SESSION'; payload: ISessionResponse }
  | { type: 'ADD_SESSION'; payload: ISessionResponse }
  | { type: 'REMOVE_SESSION'; payload: string }
  | { type: 'SET_STATS'; payload: any };

const initialState: SessionState = {
  sessions: [],
  activeSessions: [],
  upcomingSessions: [],
  currentSession: null,
  isLoading: false,
  error: null,
  stats: null,
};

const sessionReducer = (state: SessionState, action: SessionAction): SessionState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload, isLoading: false };
    
    case 'SET_ACTIVE_SESSIONS':
      return { ...state, activeSessions: action.payload };
    
    case 'SET_UPCOMING_SESSIONS':
      return { ...state, upcomingSessions: action.payload };
    
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload };
    
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map(s => 
          s.id === action.payload.id ? action.payload : s
        ),
        activeSessions: state.activeSessions.map(s => 
          s.id === action.payload.id ? action.payload : s
        ),
        upcomingSessions: state.upcomingSessions.map(s => 
          s.id === action.payload.id ? action.payload : s
        ),
        currentSession: state.currentSession?.id === action.payload.id 
          ? action.payload 
          : state.currentSession,
      };
    
    case 'ADD_SESSION':
      return {
        ...state,
        sessions: [action.payload, ...state.sessions],
        upcomingSessions: action.payload.status === SessionStatus.SCHEDULED
          ? [action.payload, ...state.upcomingSessions]
          : state.upcomingSessions,
      };
    
    case 'REMOVE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter(s => s.id !== action.payload),
        activeSessions: state.activeSessions.filter(s => s.id !== action.payload),
        upcomingSessions: state.upcomingSessions.filter(s => s.id !== action.payload),
        currentSession: state.currentSession?.id === action.payload 
          ? null 
          : state.currentSession,
      };
    
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    
    default:
      return state;
  }
};

interface SessionContextType extends SessionState {
  // Actions
  loadSessions: () => Promise<void>;
  loadActiveSessions: () => Promise<void>;
  loadUpcomingSessions: () => Promise<void>;
  loadSessionStats: () => Promise<void>;
  createSession: (sessionData: any) => Promise<ISessionResponse>;
  updateSession: (sessionId: string, updateData: any) => Promise<ISessionResponse>;
  deleteSession: (sessionId: string) => Promise<void>;
  startSession: (sessionId: string) => Promise<ISessionResponse>;
  endSession: (sessionId: string) => Promise<ISessionResponse>;
  cancelSession: (sessionId: string, reason?: string) => Promise<ISessionResponse>;
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
  setCurrentSession: (session: ISessionResponse | null) => void;
  // FIXED: Add missing methods
  refreshSessions: () => Promise<void>;
  clearError: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const { user } = useAuth();
  const sessionsHook = useSessions();
  const { on, off, joinSession: socketJoinSession, leaveSession: socketLeaveSession } = useSessionSocket();

  // Load initial data
  useEffect(() => {
    if (user?.uid) {
      loadSessions();
      loadActiveSessions();
      loadUpcomingSessions();
      loadSessionStats();
    }
  }, [user?.uid]);

  // Setup socket listeners
  useEffect(() => {
    // Session created
    on('session-created', (data) => {
      dispatch({ type: 'ADD_SESSION', payload: data.session });
    });

    // Session updated
    on('session-updated', (data: { sessionId: string; session: ISessionResponse; action?: string; performedBy: string; timestamp: string }) => {
      dispatch({ type: 'UPDATE_SESSION', payload: data.session });
      
      // Handle specific actions that affect session state
      if (data.action === 'start') {
        // Move from upcoming to active
        loadActiveSessions();
        loadUpcomingSessions();
      } else if (data.action === 'end') {
        // Remove from active sessions
        loadActiveSessions();
      } else if (data.action === 'cancel') {
        loadActiveSessions();
        loadUpcomingSessions();
      }
    });

    // Session cancelled
    on('session-cancelled', (data: { sessionId: string; reason?: string; timestamp: string }) => {
      // Reload session data to reflect cancellation
      loadActiveSessions();
      loadUpcomingSessions();
      loadSessions();
    });

    // Participant joined
    on('participant-joined', (data: { sessionId: string; userId: string; timestamp: string }) => {
      // Refresh session data
      if (state.currentSession?.id === data.sessionId) {
        refreshCurrentSession();
      }
    });

    // Participant left
    on('participant-left', (data: { sessionId: string; userId: string; timestamp: string }) => {
      // Refresh session data
      if (state.currentSession?.id === data.sessionId) {
        refreshCurrentSession();
      }
    });

    // Session reminder
    on('session-reminder', (data: { sessionId: string; minutesBefore: number; timestamp: string }) => {
      // Handle session reminder notification
      console.log('Session reminder:', data);
    });

    return () => {
      off('session-created');
      off('session-updated');
      off('session-cancelled');
      off('participant-joined');
      off('participant-left');
      off('session-reminder');
    };
  }, [state.currentSession?.id]);

  // Actions
  const loadSessions = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await sessionsHook.getSessions();
      dispatch({ type: 'SET_SESSIONS', payload: response.sessions });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [sessionsHook]);

  const loadActiveSessions = useCallback(async () => {
    try {
      const response = await sessionsHook.getActiveSessions();
      dispatch({ type: 'SET_ACTIVE_SESSIONS', payload: response.sessions });
    } catch (error: any) {
      console.error('Error loading active sessions:', error);
    }
  }, [sessionsHook]);

  const loadUpcomingSessions = useCallback(async () => {
    try {
      const response = await sessionsHook.getUpcomingSessions();
      dispatch({ type: 'SET_UPCOMING_SESSIONS', payload: response.sessions });
    } catch (error: any) {
      console.error('Error loading upcoming sessions:', error);
    }
  }, [sessionsHook]);

  const loadSessionStats = useCallback(async () => {
    try {
      const stats = await sessionsHook.getSessionStats();
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch (error: any) {
      console.error('Error loading session stats:', error);
    }
  }, [sessionsHook]);

  const createSession = useCallback(async (sessionData: any): Promise<ISessionResponse> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const session = await sessionsHook.createSession(sessionData);
      dispatch({ type: 'ADD_SESSION', payload: session });
      return session;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [sessionsHook]);

  const updateSession = useCallback(async (sessionId: string, updateData: any): Promise<ISessionResponse> => {
    try {
      const session = await sessionsHook.updateSession(sessionId, updateData);
      dispatch({ type: 'UPDATE_SESSION', payload: session });
      return session;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [sessionsHook]);

  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      await sessionsHook.deleteSession(sessionId);
      dispatch({ type: 'REMOVE_SESSION', payload: sessionId });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [sessionsHook]);

  const startSession = useCallback(async (sessionId: string): Promise<ISessionResponse> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const session = await sessionsHook.startSession(sessionId);
      dispatch({ type: 'UPDATE_SESSION', payload: session });
      loadActiveSessions();
      loadUpcomingSessions();
      return session;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [sessionsHook, loadActiveSessions, loadUpcomingSessions]);

  const endSession = useCallback(async (sessionId: string): Promise<ISessionResponse> => {
    try {
      const session = await sessionsHook.endSession(sessionId);
      dispatch({ type: 'UPDATE_SESSION', payload: session });
      loadActiveSessions();
      return session;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [sessionsHook, loadActiveSessions]);

  const cancelSession = useCallback(async (sessionId: string, reason?: string): Promise<ISessionResponse> => {
    try {
      const session = await sessionsHook.cancelSession(sessionId, reason);
      dispatch({ type: 'UPDATE_SESSION', payload: session });
      loadActiveSessions();
      loadUpcomingSessions();
      return session;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [sessionsHook, loadActiveSessions, loadUpcomingSessions]);

  const joinSession = useCallback((sessionId: string) => {
    socketJoinSession(sessionId);
  }, [socketJoinSession]);

  const leaveSession = useCallback((sessionId: string) => {
    socketLeaveSession(sessionId);
  }, [socketLeaveSession]);

  const setCurrentSession = useCallback((session: ISessionResponse | null) => {
    dispatch({ type: 'SET_CURRENT_SESSION', payload: session });
  }, []);

  const refreshCurrentSession = useCallback(async () => {
    if (state.currentSession?.id) {
      try {
        const session = await sessionsHook.getSessionById(state.currentSession.id);
        dispatch({ type: 'SET_CURRENT_SESSION', payload: session });
      } catch (error) {
        console.error('Error refreshing current session:', error);
      }
    }
  }, [state.currentSession?.id, sessionsHook]);

  // FIXED: Add refreshSessions method
  const refreshSessions = useCallback(async () => {
    await Promise.all([
      loadSessions(),
      loadActiveSessions(),
      loadUpcomingSessions(),
      loadSessionStats()
    ]);
  }, [loadSessions, loadActiveSessions, loadUpcomingSessions, loadSessionStats]);

  // FIXED: Add clearError method
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const value: SessionContextType = {
    ...state,
    loadSessions,
    loadActiveSessions,
    loadUpcomingSessions,
    loadSessionStats,
    createSession,
    updateSession,
    deleteSession,
    startSession,
    endSession,
    cancelSession,
    joinSession,
    leaveSession,
    setCurrentSession,
    // FIXED: Add to context value
    refreshSessions,
    clearError,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
};

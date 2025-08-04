import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { ISessionResponse } from '../interfaces/sessions.interface';
import { ENV } from '../config/env';

interface SessionSocketEvents {
  'connected': (data: { userId: string; message: string; timestamp: string }) => void;
  'session-joined': (data: { sessionId: string; participants: string[]; session: ISessionResponse }) => void;
  'session-left': (data: { sessionId: string }) => void;
  'session-updated': (data: { sessionId: string; session: ISessionResponse; action?: string; performedBy: string; timestamp: string }) => void;
  'participant-updated': (data: { sessionId: string; action: 'add' | 'remove'; menteeId: string; session: ISessionResponse; performedBy: string; timestamp: string }) => void;
  'participant-joined': (data: { sessionId: string; userId: string; timestamp: string }) => void;
  'participant-left': (data: { sessionId: string; userId: string; timestamp: string }) => void;
  'participant-presence': (data: { sessionId: string; userId: string; status: 'active' | 'away' | 'busy'; timestamp: string }) => void;
  'session-invitation': (data: { sessionId: string; action: 'add' | 'remove'; menteeId: string; performedBy: string; timestamp: string }) => void;
  'session-created': (data: { sessionId: string; session: ISessionResponse; timestamp: string }) => void;
  'session-reminder': (data: { sessionId: string; minutesBefore: number; timestamp: string }) => void;
  'session-cancelled': (data: { sessionId: string; reason?: string; timestamp: string }) => void;
  'error': (data: { message: string }) => void;
}

export const useSessionSocket = () => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventListeners = useRef<Map<string, Function[]>>(new Map());

  // Get WebSocket URL
  const getSocketUrl = useCallback(() => {
    const baseUrl = ENV.API_BASE_URL.replace('/api', '');
    return `${baseUrl}/sessions`;
  }, []);

  const connect = useCallback(async () => {
    if (!user?.uid || socket?.connected || !isAuthenticated) return;

    try {
      console.log('🔄 Connecting to session socket...');

      const newSocket = io(getSocketUrl(), {
        query: { userId: user.uid },
        transports: ['websocket'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        forceNew: true,
        autoConnect: false
      });

      newSocket.connect();

      newSocket.on('connect', () => {
        console.log('✅ Connected to session socket:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason: any) => {
        console.log('🔌 Session socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error: any) => {
        console.error('❌ Session socket connection error:', error);
        setIsConnected(false);
      });

      newSocket.on('error', (error: any) => {
        console.error('❌ Session socket error:', error);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('❌ Failed to initialize session socket:', error);
    }
  }, [user?.uid, socket]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  useEffect(() => {
    if (user?.uid && !socket) {
      // Add delay and check authentication state
      const timer = setTimeout(() => {
        if (user?.uid) { // Double-check user still exists
          connect();
        }
      }, 2000);

      return () => {
        clearTimeout(timer);
      };
    } else if (!user?.uid) {
      // Disconnect if user logs out
      disconnect();
    }
  }, [user?.uid, socket]);

  const on = <K extends keyof SessionSocketEvents>(
    event: K,
    callback: SessionSocketEvents[K]
  ) => {
    if (!socket) return;

    socket.on(event, callback);

    // Store listener for cleanup
    const listeners = eventListeners.current.get(event) || [];
    listeners.push(callback);
    eventListeners.current.set(event, listeners);
  };

  const off = <K extends keyof SessionSocketEvents>(
    event: K,
    callback?: SessionSocketEvents[K]
  ) => {
    if (!socket) return;

    if (callback) {
      socket.off(event, callback);

      // Remove from stored listeners
      const listeners = eventListeners.current.get(event) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
        eventListeners.current.set(event, listeners);
      }
    } else {
      socket.off(event);
      eventListeners.current.delete(event);
    }
  };

  const emit = (event: string, data?: any) => {
    if (!socket || !isConnected) {
      console.warn('Socket not connected, cannot emit event:', event);
      return;
    }

    socket.emit(event, data);
  };

  // Join session room for real-time updates
  const joinSession = useCallback((sessionId: string) => {
    emit('join-session', { sessionId });
  }, [emit]);

  // Leave session room
  const leaveSession = useCallback((sessionId: string) => {
    emit('leave-session', { sessionId });
  }, [emit]);

  // Send session action
  const sendSessionAction = useCallback((sessionId: string, action: string, reason?: string) => {
    emit('session-action', { sessionId, action, reason });
  }, [emit]);

  // Send session update
  const sendSessionUpdate = useCallback((sessionId: string, updates: any) => {
    emit('session-update', { sessionId, updates });
  }, [emit]);

  // Send participant action
  const sendParticipantAction = useCallback((sessionId: string, action: 'add' | 'remove', menteeId: string, reason?: string) => {
    emit('participant-action', { sessionId, action, menteeId, reason });
  }, [emit]);

  // Send presence update
  const sendPresenceUpdate = useCallback((sessionId: string, status: 'active' | 'away' | 'busy') => {
    emit('session-presence', { sessionId, status });
  }, [emit]);

  return {
    socket,
    isConnected,
    on,
    off,
    emit,
    connect,
    disconnect,
    joinSession,
    leaveSession,
    sendSessionAction,
    sendSessionUpdate,
    sendParticipantAction,
    sendPresenceUpdate,
  };
};

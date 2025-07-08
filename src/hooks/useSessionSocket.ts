import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { ISessionResponse } from '../interfaces/sessions.interface';

interface SessionSocketEvents {
  'session-created': (data: { session: ISessionResponse }) => void;
  'session-updated': (data: { session: ISessionResponse }) => void;
  'session-started': (data: { session: ISessionResponse }) => void;
  'session-ended': (data: { session: ISessionResponse }) => void;
  'session-cancelled': (data: { session: ISessionResponse; reason?: string }) => void;
  'participant-joined': (data: { sessionId: string; participant: any }) => void;
  'participant-left': (data: { sessionId: string; participantId: string }) => void;
  'session-reminder': (data: { session: ISessionResponse; minutesUntilStart: number }) => void;
}

export const useSessionSocket = () => {
  const { user, getIdToken } = useAuth();
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventListeners = useRef<Map<string, Function[]>>(new Map());

  useEffect(() => {
    if (!user?.uid) return;

    const initSocket = async () => {
      try {
        const token = await getIdToken();
        
        const newSocket = io(`${process.env.EXPO_PUBLIC_API_URL}/sessions`, {
          auth: { token },
          query: { userId: user.uid }
        });

        newSocket.on('connect', () => {
          console.log('✅ Connected to session socket');
          setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
          console.log('❌ Disconnected from session socket');
          setIsConnected(false);
        });

        newSocket.on('error', (error: Error) => {
          console.error('❌ Session socket error:', error);
        });

        setSocket(newSocket);
      } catch (error) {
        console.error('❌ Failed to initialize session socket:', error);
      }
    };

    initSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user?.uid]);

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
  const joinSession = (sessionId: string) => {
    emit('join-session', { sessionId });
  };

  // Leave session room
  const leaveSession = (sessionId: string) => {
    emit('leave-session', { sessionId });
  };

  // Send session action
  const sendSessionAction = (sessionId: string, action: string, data?: any) => {
    emit('session-action', { sessionId, action, ...data });
  };

  return {
    socket,
    isConnected,
    on,
    off,
    emit,
    joinSession,
    leaveSession,
    sendSessionAction,
  };
};

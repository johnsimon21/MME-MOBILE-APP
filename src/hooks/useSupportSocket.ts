import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { ENV } from '../config/env';
import { useAuth } from '../context/AuthContext';
import {
  ISupportChatSession,
  ISupportChatMessage,
  SupportSocketEvents,
  SupportSocketEmitEvents,
} from '../interfaces/support.interface';

export interface SupportSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  currentChatSession: string | null;
  currentTicket: string | null;
  typingUsers: Map<string, { isTyping: boolean; timestamp: Date }>;
  onlineAdmins: string[];
}

export interface SupportSocketActions {
  connect: () => void;
  disconnect: () => void;
  
  // Chat actions
  joinSupportChat: (sessionId: string) => void;
  leaveSupportChat: (sessionId: string) => void;
  sendSupportMessage: (sessionId: string, message: string) => void;
  startTyping: (sessionId: string) => void;
  stopTyping: (sessionId: string) => void;
  
  // Ticket actions
  joinTicket: (ticketId: string) => void;
  leaveTicket: (ticketId: string) => void;
  
  // Admin actions
  getWaitingSessions: () => void;
  assignSession: (sessionId: string) => void;
}

export interface SupportSocketCallbacks {
  // Connection events
  onConnected?: (data: { userId: string; userRole: string; message: string; timestamp: Date }) => void;
  onError?: (error: string) => void;

  // Support Chat events
  onJoinedSupportChat?: (data: { sessionId: string; message: string }) => void;
  onLeftSupportChat?: (data: { sessionId: string; message: string }) => void;
  onNewSupportMessage?: (data: { sessionId: string; message: ISupportChatMessage }) => void;
  onSupportMessageSent?: (data: { sessionId: string; messageId: string; timestamp: Date }) => void;
  onSupportUserTyping?: (data: { sessionId: string; userId: string; userRole: string; isTyping: boolean }) => void;
  onAdminJoinedSession?: (data: { sessionId: string; admin: any; timestamp: Date }) => void;
  onUserJoinedChat?: (data: { sessionId: string; userId: string; userRole: string; timestamp: Date }) => void;
  onUserLeftChat?: (data: { sessionId: string; userId: string; timestamp: Date }) => void;

  // Ticket events
  onJoinedTicket?: (data: { ticketId: string; message: string }) => void;
  onLeftTicket?: (data: { ticketId: string; message: string }) => void;
  onTicketUpdated?: (data: { ticketId: string; update: any; timestamp: Date }) => void;
  onNewTicket?: (data: { ticketId: string; ticket: any; timestamp: Date }) => void;

  // Admin events
  onWaitingSessions?: (data: { sessions: ISupportChatSession[]; count: number }) => void;
  onSessionAssigned?: (data: { sessionId: string; assignedTo: string; timestamp: Date }) => void;
  onSessionAssignedSuccess?: (data: { sessionId: string; session: ISupportChatSession }) => void;
  onAdminOnline?: (data: { adminId: string; timestamp: Date }) => void;
  onAdminOffline?: (data: { adminId: string; timestamp: Date }) => void;
  onNewChatSession?: (data: { sessionId: string; session: ISupportChatSession; timestamp: Date }) => void;

  // Notification events
  onSupportNotification?: (notification: any) => void;
}

export const useSupportSocket = (callbacks: SupportSocketCallbacks = {}) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<typeof Socket | null>(null);
  
  const [state, setState] = useState<SupportSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    currentChatSession: null,
    currentTicket: null,
    typingUsers: new Map(),
    onlineAdmins: [],
  });

  // Get WebSocket URL
  const getSocketUrl = useCallback(() => {
    const baseUrl = ENV.API_BASE_URL.replace('/api', '');
    return `${baseUrl}/support`;
  }, []);

  // Connect to support socket
  const connect = useCallback(() => {
    if (!isAuthenticated || !user?.uid || socketRef.current?.connected || state.isConnecting) {
      console.log('🔌 Skipping support socket connection - already connected or connecting');
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      console.log('🔌 Connecting to support socket...');
      
      const socket = io(getSocketUrl(), {
        transports: ['websocket', 'polling'],
        autoConnect: false,
        query: {
          userId: user.uid,
          userRole: user.role,
        },
        timeout: 10000,
        forceNew: true,
      });

      // Connection events
      socket.on('connect', () => {
        console.log('✅ Support socket connected');
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          isConnecting: false, 
          error: null 
        }));
      });

      socket.on('disconnect', (reason: any) => {
        console.log('🔌 Support socket disconnected:', reason);
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isConnecting: false,
          currentChatSession: null,
          currentTicket: null,
        }));
      });

      socket.on('connect_error', (error: { message: string; }) => {
        console.error('❌ Support socket connection error:', error);
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isConnecting: false, 
          error: error.message 
        }));
        callbacks.onError?.(error.message);
      });

      // Base events
      socket.on('connected', (data: { userId: string; userRole: string; message: string; timestamp: Date }) => {
        console.log('📱 Support service connected:', data);
        callbacks.onConnected?.(data);
      });

      socket.on('error', (data: { message: string }) => {
        console.error('❌ Support socket error:', data.message);
        setState(prev => ({ ...prev, error: data.message }));
        callbacks.onError?.(data.message);
      });

      // Support Chat events
      socket.on('joined-support-chat', (data: { sessionId: string; message: string }) => {
        console.log('💬 Joined support chat:', data);
        setState(prev => ({ ...prev, currentChatSession: data.sessionId }));
        callbacks.onJoinedSupportChat?.(data);
      });

      socket.on('left-support-chat', (data: { sessionId: string; message: string }) => {
        console.log('💬 Left support chat:', data);
        setState(prev => ({ 
          ...prev, 
          currentChatSession: prev.currentChatSession === data.sessionId ? null : prev.currentChatSession 
        }));
        callbacks.onLeftSupportChat?.(data);
      });

      socket.on('new-support-message', (data: { sessionId: string; message: ISupportChatMessage }) => {
        console.log('💬 New support message:', data);
        callbacks.onNewSupportMessage?.(data);
      });

      socket.on('support-message-sent', (data: { sessionId: string; messageId: string; timestamp: Date }) => {
        console.log('✅ Support message sent:', data);
        callbacks.onSupportMessageSent?.(data);
      });

      socket.on('support-user-typing', (data: { sessionId: string; userId: string; userRole: string; isTyping: boolean }) => {
        console.log('⌨️ User typing status:', data);
        setState(prev => {
          const newTypingUsers = new Map(prev.typingUsers);
          if (data.isTyping) {
            newTypingUsers.set(data.userId, { isTyping: true, timestamp: new Date() });
          } else {
            newTypingUsers.delete(data.userId);
          }
          return { ...prev, typingUsers: newTypingUsers };
        });
        callbacks.onSupportUserTyping?.(data);
      });

      socket.on('admin-joined-session', (data: { sessionId: string; admin: any; timestamp: Date }) => {
        console.log('👨‍💼 Admin joined session:', data);
        callbacks.onAdminJoinedSession?.(data);
      });

      socket.on('user-joined-chat', (data: { sessionId: string; userId: string; userRole: string; timestamp: Date }) => {
        console.log('👤 User joined chat:', data);
        callbacks.onUserJoinedChat?.(data);
      });

      socket.on('user-left-chat', (data: { sessionId: string; userId: string; timestamp: Date }) => {
        console.log('👤 User left chat:', data);
        callbacks.onUserLeftChat?.(data);
      });

      // Ticket events
      socket.on('joined-ticket', (data: { ticketId: string; message: string }) => {
        console.log('🎫 Joined ticket:', data);
        setState(prev => ({ ...prev, currentTicket: data.ticketId }));
        callbacks.onJoinedTicket?.(data);
      });

      socket.on('left-ticket', (data: { ticketId: string; message: string }) => {
        console.log('🎫 Left ticket:', data);
        setState(prev => ({ 
          ...prev, 
          currentTicket: prev.currentTicket === data.ticketId ? null : prev.currentTicket 
        }));
        callbacks.onLeftTicket?.(data);
      });

      socket.on('ticket-updated', (data: { ticketId: string; update: any; timestamp: Date }) => {
        console.log('🎫 Ticket updated:', data);
        callbacks.onTicketUpdated?.(data);
      });

      socket.on('new-ticket', (data: { ticketId: string; ticket: any; timestamp: Date }) => {
        console.log('🎫 New ticket:', data);
        callbacks.onNewTicket?.(data);
      });

      // Admin events
      socket.on('waiting-sessions', (data: { sessions: ISupportChatSession[]; count: number }) => {
        console.log('⏳ Waiting sessions:', data);
        callbacks.onWaitingSessions?.(data);
      });

      socket.on('session-assigned', (data: { sessionId: string; assignedTo: string; timestamp: Date }) => {
        console.log('👨‍💼 Session assigned:', data);
        callbacks.onSessionAssigned?.(data);
      });

      socket.on('session-assigned-success', (data: { sessionId: string; session: ISupportChatSession }) => {
        console.log('✅ Session assigned successfully:', data);
        callbacks.onSessionAssignedSuccess?.(data);
      });

      socket.on('admin:online', (data: { adminId: string; timestamp: Date }) => {
        console.log('👨‍💼 Admin online:', data);
        setState(prev => ({
          ...prev,
          onlineAdmins: [...prev.onlineAdmins.filter(id => id !== data.adminId), data.adminId]
        }));
        callbacks.onAdminOnline?.(data);
      });

      socket.on('admin:offline', (data: { adminId: string; timestamp: Date }) => {
        console.log('👨‍💼 Admin offline:', data);
        setState(prev => ({
          ...prev,
          onlineAdmins: prev.onlineAdmins.filter(id => id !== data.adminId)
        }));
        callbacks.onAdminOffline?.(data);
      });

      socket.on('new-chat-session', (data: { sessionId: string; session: ISupportChatSession; timestamp: Date }) => {
        console.log('💬 New chat session:', data);
        callbacks.onNewChatSession?.(data);
      });

      // Notification events
      socket.on('support-notification', (notification: any) => {
        console.log('🔔 Support notification:', notification);
        callbacks.onSupportNotification?.(notification);
      });

      socketRef.current = socket;
      socket.connect();

    } catch (error: any) {
      console.error('❌ Failed to create support socket:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error.message 
      }));
      callbacks.onError?.(error.message);
    }
  }, [isAuthenticated, user?.uid, user?.role]);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('🔌 Disconnecting support socket...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        isConnecting: false,
        currentChatSession: null,
        currentTicket: null,
        typingUsers: new Map(),
        onlineAdmins: [],
      }));
    }
  }, []);

  // Socket actions
  const actions: SupportSocketActions = {
    connect,
    disconnect,
    
    // Chat actions
    joinSupportChat: (sessionId: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('join-support-chat', { sessionId });
      }
    },

    leaveSupportChat: (sessionId: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('leave-support-chat', { sessionId });
      }
    },

    sendSupportMessage: (sessionId: string, message: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('send-support-message', { sessionId, message });
      }
    },

    startTyping: (sessionId: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('support-typing-start', { sessionId });
      }
    },

    stopTyping: (sessionId: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('support-typing-stop', { sessionId });
      }
    },

    // Ticket actions
    joinTicket: (ticketId: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('join-ticket', { ticketId });
      }
    },

    leaveTicket: (ticketId: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('leave-ticket', { ticketId });
      }
    },

    // Admin actions
    getWaitingSessions: () => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('admin-get-waiting-sessions');
      }
    },

    assignSession: (sessionId: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('admin-assign-session', { sessionId });
      }
    },
  };

  // Auto-connect when authenticated
  useEffect(() => {
    let mounted = true;

    if (isAuthenticated && user?.uid && mounted) {
      console.log('🔌 Auto-connecting support socket for user:', user.uid);
      connect();
    } else if (mounted) {
      console.log('🔌 Auto-disconnecting support socket');
      disconnect();
    }

    return () => {
      mounted = false;
      disconnect();
    };
  }, [isAuthenticated, user?.uid]); // Removed connect/disconnect from dependencies

  // Cleanup typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const now = new Date();
        const newTypingUsers = new Map();
        
        prev.typingUsers.forEach((value, key) => {
          // Remove typing indicators after 3 seconds
          if (now.getTime() - value.timestamp.getTime() < 3000) {
            newTypingUsers.set(key, value);
          }
        });
        
        return { ...prev, typingUsers: newTypingUsers };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

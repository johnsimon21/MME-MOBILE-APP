import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { IChatSocketEvents } from '../interfaces/chat.interface';
import { ENV } from '../config/env';

interface SocketContextType {
    socket: typeof Socket | null;
    isConnected: boolean;
    connectionError: string | null;
    on: <K extends keyof IChatSocketEvents>(event: K, callback: IChatSocketEvents[K]) => void;
    off: <K extends keyof IChatSocketEvents>(event: K, callback?: IChatSocketEvents[K]) => void;
    emit: (event: string, data?: any) => void;
    connect: () => void;
    disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<typeof Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const { user, getIdToken } = useAuth();

    const connect = async () => {
        if (!user || socket?.connected) return;

        try {
            // Check if we have authentication
            if (!user.uid) {
                console.log('⚠️ No user ID available, skipping socket connection');
                return;
            }

            console.log('🔄 Attempting socket connection...');

            // Use ENV configuration for socket connection
            const socketUrl = `${ENV.API_BASE_URL.replace('/api', '')}/chat`;
            console.log('🔗 Connecting to socket URL:', socketUrl);
            
            const newSocket = io(socketUrl, {
                query: {
                    userId: user.uid
                },
                transports: ['websocket'],
                timeout: 15000,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                forceNew: true,
                autoConnect: false
            });

            // Connect manually with error handling
            newSocket.connect();

            newSocket.on('connect', () => {
                console.log('✅ Socket connected:', newSocket.id);
                setIsConnected(true);
                setConnectionError(null);
            });

            newSocket.on('disconnect', (reason: any) => {
                console.log('🔌 Socket disconnected:', reason);
                setIsConnected(false);
            });

            newSocket.on('connect_error', (error: any) => {
                console.error('❌ Socket connection error:', error.message);
                setConnectionError(`Erro de conexão: ${error.message}`);
                setIsConnected(false);

                // Don't retry if it's a critical error
                if (error.message.includes('websocket error') || error.message.includes('timeout')) {
                    console.log('🚫 Critical socket error, not retrying');
                    newSocket.disconnect();
                    setSocket(null);
                }
            });

            newSocket.on('reconnect', (attemptNumber: any) => {
                console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
                setIsConnected(true);
                setConnectionError(null);
            });

            newSocket.on('reconnect_error', (error: { message: React.SetStateAction<string | null>; }) => {
                console.error('❌ Socket reconnection error:', error.message);
                setConnectionError(`Erro de reconexão: ${error.message}`);
            });

            newSocket.on('reconnect_failed', () => {
                console.error('❌ Socket reconnection failed completely');
                setConnectionError('Falha na reconexão. Chat offline.');
                setIsConnected(false);
            });

            setSocket(newSocket);
        } catch (error: any) {
            console.error('❌ Error setting up socket:', error);
            setConnectionError(`Erro ao configurar chat: ${error.message}`);
        }
    };

    const disconnect = () => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
            setConnectionError(null);
        }
    };

    const on = <K extends keyof IChatSocketEvents>(
        event: K,
        callback: IChatSocketEvents[K]
    ) => {
        if (socket) {
            socket.on(event as string, callback as any);
        }
    };

    const off = <K extends keyof IChatSocketEvents>(
        event: K,
        callback?: IChatSocketEvents[K]
    ) => {
        if (socket) {
            if (callback) {
                socket.off(event as string, callback as any);
            } else {
                socket.off(event as string);
            }
        }
    };

    const emit = (event: string, data?: any) => {
        if (socket && isConnected) {
            socket.emit(event, data);
        }
    };

    // Connect when user is available
    useEffect(() => {
        if (user?.uid && !socket) {
            // Reduced delay for better UX while maintaining stability
            const timer = setTimeout(() => {
                console.log('🚀 Initializing socket connection for user:', user.uid);
                connect();
            }, 1500); // Shorter delay for better responsiveness

            return () => {
                clearTimeout(timer);
            };
        } else if (!user?.uid) {
            // Disconnect if no user
            disconnect();
        }
    }, [user?.uid, socket]);

    // Add this to prevent hanging during initialization
    useEffect(() => {
        // Cleanup on unmount to prevent memory leaks
        return () => {
            if (socket) {
                socket.removeAllListeners();
                socket.disconnect();
            }
        };
    }, []);

    const contextValue: SocketContextType = {
        socket,
        isConnected,
        connectionError,
        on,
        off,
        emit,
        connect,
        disconnect,
    };

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = (): SocketContextType => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

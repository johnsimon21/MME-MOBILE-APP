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
            const token = await getIdToken();
            if (!token) {
                console.log('⚠️ No token available, skipping socket connection');
                return;
            }

            console.log('🔄 Attempting socket connection...');

            const newSocket = io(`http://192.168.1.103:3000/chat`, {
                query: {
                    userId: user.uid,
                    token: token
                },
                transports: ['websocket'],
                timeout: 10000, // Reduced timeout
                reconnection: true,
                reconnectionAttempts: 3, // Reduced attempts
                reconnectionDelay: 2000,
                forceNew: true, // Force new connection
                autoConnect: false // Don't auto connect
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
        if (user && ENV.API_BASE_URL) {
            // Add a longer delay to ensure auth is fully established
            const timer = setTimeout(() => {
                connect();
            }, 2000); // Increased delay

            return () => {
                clearTimeout(timer);
                disconnect();
            };
        } else {
            // Don't disconnect immediately, wait a bit
            const timer = setTimeout(() => {
                disconnect();
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [user]);

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

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import io,{  Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { IChatSocketEvents } from '../interfaces/chat.interface';

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

            const newSocket = io(`${process.env.EXPO_PUBLIC_API_URL}/chat`, {
                query: {
                    userId: user.uid,
                    token: token
                },
                transports: ['websocket'],
                timeout: 20000,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                setIsConnected(true);
                setConnectionError(null);
            });

            newSocket.on('disconnect', (reason: any) => {
                console.log('Socket disconnected:', reason);
                setIsConnected(false);
            });

            newSocket.on('connect_error', (error: any) => {
                console.error('Socket connection error:', error);
                setConnectionError(error.message);
                setIsConnected(false);
            });

            newSocket.on('reconnect', (attemptNumber: any) => {
                console.log('Socket reconnected after', attemptNumber, 'attempts');
                setIsConnected(true);
                setConnectionError(null);
            });

            newSocket.on('reconnect_error', (error: { message: React.SetStateAction<string | null>; }) => {
                console.error('Socket reconnection error:', error);
                setConnectionError(error.message);
            });

            setSocket(newSocket);
        } catch (error: any) {
            console.error('Error connecting socket:', error);
            setConnectionError(error.message);
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
        if (user) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [user]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
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

import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    IChatResponse,
    IMessageResponse,
    IChatsListResponse,
    IMessagesListResponse,
    ICreateChatRequest,
    ISendMessageRequest,
    ISendFileMessageRequest,
    IAddMenteeRequest,
    IChatQueryParams,
    IMessagesQueryParams,
    ChatType,
    MessageType
} from '../interfaces/chat.interface';
import api from '../infrastructure/api';

export const useChat = () => {
    const { user, getIdToken } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRequest = useCallback(async <T>(
        request: () => Promise<T>,
        loadingState: boolean = true
    ): Promise<T> => {
        try {
            if (loadingState) setIsLoading(true);
            setError(null);

            const token = await getIdToken();
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            return await request();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Erro desconhecido';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            if (loadingState) setIsLoading(false);
        }
    }, [getIdToken]);

    // Create a new chat
    const createChat = useCallback(async (chatData: ICreateChatRequest): Promise<IChatResponse> => {
        return handleRequest(async () => {
            const response = await api.post('/chats', chatData);
            return response.data;
        });
    }, [handleRequest]);

    // Get user's chats
    const getUserChats = useCallback(async (params?: IChatQueryParams): Promise<IChatsListResponse> => {
        return handleRequest(async () => {
            const response = await api.get('/chats', { params });
           
            return response.data;
        });
    }, [handleRequest]);

    // Get chat by ID
    const getChatById = useCallback(async (chatId: string): Promise<IChatResponse> => {
        return handleRequest(async () => {
            const response = await api.get(`/chats/${chatId}`);
            return response.data;
        });
    }, [handleRequest]);

    // Send text message
    const sendMessage = useCallback(async (
        chatId: string,
        messageData: ISendMessageRequest
    ): Promise<IMessageResponse> => {
        return handleRequest(async () => {
            const response = await api.post(`/chats/${chatId}/messages`, messageData);
            return response.data;
        }, false); // Don't show loading for messages
    }, [handleRequest]);

    // Send file message
    const sendFileMessage = useCallback(async (
        chatId: string,
        fileData: ISendFileMessageRequest
    ): Promise<IMessageResponse> => {
        return handleRequest(async () => {
            const formData = new FormData();

            // Append file
            formData.append('file', {
                uri: fileData.file.uri,
                type: fileData.file.type,
                name: fileData.file.name,
            } as any);

            // Append other data
            formData.append('type', fileData.type);
            if (fileData.caption) formData.append('caption', fileData.caption);
            if (fileData.replyTo) formData.append('replyTo', fileData.replyTo);

            const response = await api.post(`/chats/${chatId}/messages/file`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        });
    }, [handleRequest]);

    // Get chat messages
    const getChatMessages = useCallback(async (
        chatId: string,
        params?: IMessagesQueryParams
    ): Promise<IMessagesListResponse> => {
        return handleRequest(async () => {
            const response = await api.get(`/chats/${chatId}/messages`, { params });
            return response.data;
        });
    }, [handleRequest]);

    // Mark messages as read
    const markMessagesAsRead = useCallback(async (chatId: string): Promise<{ message: string }> => {
        return handleRequest(async () => {
            const response = await api.post(`/chats/${chatId}/messages/read`);
            return response.data;
        }, false);
    }, [handleRequest]);

    // Delete message
    const deleteMessage = useCallback(async (
        chatId: string,
        messageId: string
    ): Promise<{ message: string }> => {
        return handleRequest(async () => {
            const response = await api.delete(`/chats/${chatId}/messages/${messageId}`);
            return response.data;
        });
    }, [handleRequest]);

    // Delete file message
    const deleteFileMessage = useCallback(async (
        chatId: string,
        messageId: string
    ): Promise<{ message: string }> => {
        return handleRequest(async () => {
            const response = await api.delete(`/chats/${chatId}/messages/${messageId}/file`);
            return response.data;
        });
    }, [handleRequest]);

    // Add mentee to session chat (mentor only)
    const addMenteeToSession = useCallback(async (
        chatId: string,
        menteeData: IAddMenteeRequest
    ): Promise<IChatResponse> => {
        return handleRequest(async () => {
            const response = await api.post(`/chats/${chatId}/participants`, menteeData);
            return response.data;
        });
    }, [handleRequest]);

    // Remove mentee from session chat (mentor only)
    const removeMenteeFromSession = useCallback(async (
        chatId: string,
        menteeId: string
    ): Promise<IChatResponse> => {
        return handleRequest(async () => {
            const response = await api.delete(`/chats/${chatId}/participants/${menteeId}`);
            return response.data;
        });
    }, [handleRequest]);

    // Get chats by type
    const getChatsByType = useCallback(async (type: ChatType): Promise<IChatsListResponse> => {
        return getUserChats({ type });
    }, [getUserChats]);

    // Search chats
    const searchChats = useCallback(async (searchTerm: string): Promise<IChatsListResponse> => {
        return getUserChats({ search: searchTerm });
    }, [getUserChats]);

    // Search messages in chat
    const searchMessages = useCallback(async (
        chatId: string,
        searchTerm: string
    ): Promise<IMessagesListResponse> => {
        return getChatMessages(chatId, { search: searchTerm });
    }, [getChatMessages]);

    // Get unread chats count
    const getUnreadChatsCount = useCallback(async (): Promise<number> => {
        try {
            const chats = await getUserChats();
            return chats.chats.reduce((count, chat) => count + chat.unreadCount, 0);
        } catch (error) {
            console.error('Error getting unread chats count:', error);
            return 0;
        }
    }, [getUserChats]);

    // Check if user can create session chat
    const canCreateSessionChat = useCallback((): boolean => {
        return user?.role === 'mentor';
    }, [user?.role]);

    // Check if user can add participants to session
    const canManageSessionParticipants = useCallback((chat: IChatResponse): boolean => {
        return user?.role === 'mentor' && chat.type === ChatType.SESSION;
    }, [user?.role]);

    // Utility functions
    const isImageFile = useCallback((fileName: string): boolean => {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    }, []);

    const formatFileSize = useCallback((bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }, []);

    const getMessageTypeIcon = useCallback((type: MessageType): string => {
        switch (type) {
            case MessageType.TEXT: return 'message-circle';
            case MessageType.IMAGE: return 'image';
            case MessageType.FILE: return 'file';
            case MessageType.SYSTEM: return 'info';
            case MessageType.CALL: return 'phone';
            default: return 'message-circle';
        }
    }, []);

    return {
        // State
        isLoading,
        error,

        // Core chat operations
        createChat,
        getUserChats,
        getChatById,
        sendMessage,
        sendFileMessage,
        getChatMessages,
        markMessagesAsRead,
        deleteMessage,
        deleteFileMessage,

        // Session chat management
        addMenteeToSession,
        removeMenteeFromSession,

        // Search and filtering
        getChatsByType,
        searchChats,
        searchMessages,

        // Utility functions
        getUnreadChatsCount,
        canCreateSessionChat,
        canManageSessionParticipants,
        isImageFile,
        formatFileSize,
        getMessageTypeIcon,

        // Clear error
        clearError: () => setError(null),
    };
};

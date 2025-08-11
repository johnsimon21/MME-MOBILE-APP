import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { useChat } from '../hooks/useChat';
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
    MessageType,
    IChatSocketEvents
} from '../interfaces/chat.interface';

// State interface
interface ChatState {
    chats: IChatResponse[];
    currentChat: IChatResponse | null;
    messages: IMessageResponse[];
    isLoading: boolean;
    isLoadingMessages: boolean;
    error: string | null;
    unreadCount: number;
    typingUsers: { [chatId: string]: string[] };
    onlineUsers: string[];
    hasMoreMessages: boolean;
    messagesPage: number;
}

// Action types
type ChatAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_LOADING_MESSAGES'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_CHATS'; payload: IChatResponse[] }
    | { type: 'ADD_CHAT'; payload: IChatResponse }
    | { type: 'UPDATE_CHAT'; payload: IChatResponse }
    | { type: 'REMOVE_CHAT'; payload: string }
    | { type: 'SET_CURRENT_CHAT'; payload: IChatResponse | null }
    | { type: 'SET_MESSAGES'; payload: IMessageResponse[] }
    | { type: 'ADD_MESSAGE'; payload: IMessageResponse }
    | { type: 'UPDATE_MESSAGE'; payload: IMessageResponse }
    | { type: 'REMOVE_MESSAGE'; payload: string }
    | { type: 'PREPEND_MESSAGES'; payload: IMessageResponse[] }
    | { type: 'SET_UNREAD_COUNT'; payload: number }
    | { type: 'SET_TYPING_USERS'; payload: { chatId: string; users: string[] } }
    | { type: 'SET_ONLINE_USERS'; payload: string[] }
    | { type: 'ADD_ONLINE_USER'; payload: string }
    | { type: 'REMOVE_ONLINE_USER'; payload: string }
    | { type: 'SET_HAS_MORE_MESSAGES'; payload: boolean }
    | { type: 'SET_MESSAGES_PAGE'; payload: number }
    | { type: 'MARK_MESSAGES_READ'; payload: { chatId: string; userId: string } }
    | { type: 'UPDATE_LAST_MESSAGE'; payload: { chatId: string; message: IMessageResponse } };

// Context type
interface ChatContextType extends ChatState {
    // Chat operations
    loadChats: (params?: IChatQueryParams) => Promise<void>;
    createChat: (chatData: ICreateChatRequest) => Promise<IChatResponse>;
    selectChat: (chat: IChatResponse) => void;
    leaveCurrentChat: () => void;

    // Message operations
    loadMessages: (chatId: string, params?: IMessagesQueryParams) => Promise<void>;
    loadMoreMessages: () => Promise<void>;
    sendMessage: (content: string, timestamp: Date, replyTo?: string) => Promise<void>;
    sendFileMessage: (fileData: ISendFileMessageRequest) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    markAsRead: (chatId?: string) => Promise<void>;

    // Session management
    addMenteeToSession: (chatId: string, menteeId: string) => Promise<void>;
    removeMenteeFromSession: (chatId: string, menteeId: string) => Promise<void>;

    // Real-time operations
    joinChat: (chatId: string) => void;
    leaveChat: (chatId: string) => void;
    startTyping: (chatId: string) => void;
    stopTyping: (chatId: string) => void;

    // Utility functions
    getUnreadCount: () => number;
    getChatParticipants: (chat: IChatResponse) => string[];
    isUserTyping: (chatId: string, userId: string) => boolean;
    isUserOnline: (userId: string) => boolean;
    refreshChats: () => Promise<void>;
    clearError: () => void;
}

// Initial state
const initialState: ChatState = {
    chats: [],
    currentChat: null,
    messages: [],
    isLoading: false,
    isLoadingMessages: false,
    error: null,
    unreadCount: 0,
    typingUsers: {},
    onlineUsers: [],
    hasMoreMessages: false,
    messagesPage: 1,
};

// Reducer
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };

        case 'SET_LOADING_MESSAGES':
            return { ...state, isLoadingMessages: action.payload };

        case 'SET_ERROR':
            return { ...state, error: action.payload };

        case 'SET_CHATS':
            return {
                ...state,
                chats: action.payload,
                unreadCount: action.payload.reduce((count, chat) => count + chat.unreadCount, 0)
            };

        case 'ADD_CHAT':
            return {
                ...state,
                chats: [action.payload, ...state.chats],
                unreadCount: state.unreadCount + action.payload.unreadCount
            };

        case 'UPDATE_CHAT':
            const updatedChats = state.chats.map(chat =>
                chat.id === action.payload.id ? action.payload : chat
            );
            return {
                ...state,
                chats: updatedChats,
                currentChat: state.currentChat?.id === action.payload.id ? action.payload : state.currentChat,
                unreadCount: updatedChats.reduce((count, chat) => count + chat.unreadCount, 0)
            };

        case 'REMOVE_CHAT':
            const filteredChats = state.chats.filter(chat => chat.id !== action.payload);
            return {
                ...state,
                chats: filteredChats,
                currentChat: state.currentChat?.id === action.payload ? null : state.currentChat,
                unreadCount: filteredChats.reduce((count, chat) => count + chat.unreadCount, 0)
            };

        case 'SET_CURRENT_CHAT':
            return {
                ...state,
                currentChat: action.payload,
                messages: action.payload ? state.messages : [],
                messagesPage: 1
            };

        case 'SET_MESSAGES':
            return {
                ...state,
                messages: action.payload,
                messagesPage: 1
            };

        case 'ADD_MESSAGE':
            return {
                ...state,
                messages: [...state.messages, action.payload]
            };

        case 'UPDATE_MESSAGE':
            return {
                ...state,
                messages: state.messages.map(msg =>
                    msg.id === action.payload.id ? action.payload : msg
                )
            };

        case 'REMOVE_MESSAGE':
            return {
                ...state,
                messages: state.messages.filter(msg => msg.id !== action.payload)
            };

        case 'PREPEND_MESSAGES':
            return {
                ...state,
                messages: [...action.payload, ...state.messages],
                messagesPage: state.messagesPage + 1
            };

        case 'SET_UNREAD_COUNT':
            return { ...state, unreadCount: action.payload };

        case 'SET_TYPING_USERS':
            return {
                ...state,
                typingUsers: {
                    ...state.typingUsers,
                    [action.payload.chatId]: action.payload.users
                }
            };

        case 'SET_ONLINE_USERS':
            return { ...state, onlineUsers: action.payload };

        case 'ADD_ONLINE_USER':
            return {
                ...state,
                onlineUsers: [...state.onlineUsers.filter(id => id !== action.payload), action.payload]
            };

        case 'REMOVE_ONLINE_USER':
            return {
                ...state,
                onlineUsers: state.onlineUsers.filter(id => id !== action.payload)
            };

        case 'SET_HAS_MORE_MESSAGES':
            return { ...state, hasMoreMessages: action.payload };

        case 'SET_MESSAGES_PAGE':
            return { ...state, messagesPage: action.payload };

        case 'MARK_MESSAGES_READ':
            const chatsWithReadMessages = state.chats.map(chat => {
                if (chat.id === action.payload.chatId) {
                    return { ...chat, unreadCount: 0 };
                }
                return chat;
            });
            return {
                ...state,
                chats: chatsWithReadMessages,
                unreadCount: chatsWithReadMessages.reduce((count, chat) => count + chat.unreadCount, 0)
            };

        case 'UPDATE_LAST_MESSAGE':
            const chatsWithUpdatedMessage = state.chats.map(chat => {
                if (chat.id === action.payload.chatId) {
                    return {
                        ...chat,
                        lastMessage: {
                            content: action.payload.message.content,
                            senderId: action.payload.message.sender.uid,
                            senderName: action.payload.message.sender.fullName,
                            timestamp: action.payload.message.timestamp,
                            type: action.payload.message.type
                        },
                        lastActivity: action.payload.message.timestamp
                    };
                }
                return chat;
            });

            // Sort chats by last activity
            chatsWithUpdatedMessage.sort((a, b) =>
                new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
            );

            return { ...state, chats: chatsWithUpdatedMessage };

        default:
            return state;
    }
};

// Context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider
interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(chatReducer, initialState);
    const { user, isAuthenticated } = useAuth();
    const { socket, isConnected, on, off, emit } = useSocket();
    const chatHook = useChat();

    // Don't log warning constantly - this is normal during initialization
    if (!socket && user) {
        console.log('⚠️ Socket not available yet, rendering children without socket features');
    }

    // Setup socket listeners
    useEffect(() => {
        if (!socket) return;
        
        console.log('🔗 Setting up socket listeners, connected:', isConnected);

        // Connection events
        on('connected', (data: any) => {
            console.log('Chat connected:', data);
        });

        // Chat events
        on('joined-chat', (data: any) => {
            console.log('Joined chat:', data);
        });

        on('left-chat', (data: any) => {
            console.log('Left chat:', data);
        });

        // Message events
        on('new-message', (data: any) => {
            console.log('📩 New message received:', data);
            
            // Transform message timestamp
            const transformedMessage = {
                ...data.message,
                timestamp: data.message.timestamp ? 
                    (typeof data.message.timestamp === 'string' ? data.message.timestamp : new Date(data.message.timestamp).toISOString()) :
                    new Date().toISOString()
            };
            
            dispatch({ type: 'ADD_MESSAGE', payload: transformedMessage });
            dispatch({ type: 'UPDATE_LAST_MESSAGE', payload: { chatId: data.chatId, message: transformedMessage } });

            // Update unread count if not current chat
            if (state.currentChat?.id !== data.chatId) {
                const updatedChat = state.chats.find(chat => chat.id === data.chatId);
                if (updatedChat) {
                    dispatch({
                        type: 'UPDATE_CHAT',
                        payload: { ...updatedChat, unreadCount: updatedChat.unreadCount + 1 }
                    });
                }
            }

            // CRITICAL: Refresh chats list to update Messages screen
            setTimeout(() => {
                loadChats(); // Refresh chats list for Messages screen
            }, 100);
        });

        on('message-sent', (data: any) => {
            console.log('Message sent confirmation:', data);
        });

        on('file-message-received', (data: any) => {
            console.log('File message received:', data);
        });

        // Typing events
        on('user-typing', (data: any) => {
            const currentUsers = state.typingUsers[data.chatId] || [];
            let updatedUsers: string[];

            if (data.isTyping) {
                updatedUsers = [...currentUsers.filter(id => id !== data.userId), data.userId];
            } else {
                updatedUsers = currentUsers.filter(id => id !== data.userId);
            }

            dispatch({
                type: 'SET_TYPING_USERS',
                payload: { chatId: data.chatId, users: updatedUsers }
            });
        });

        // Read events
        on('messages-read', (data: any) => {
            dispatch({
                type: 'MARK_MESSAGES_READ',
                payload: { chatId: data.chatId, userId: data.userId }
            });
        });

        // Online status events
        on('user:online', (data: any) => {
            dispatch({ type: 'ADD_ONLINE_USER', payload: data.userId });
        });

        on('user:offline', (data: any) => {
            dispatch({ type: 'REMOVE_ONLINE_USER', payload: data.userId });
        });

        // Session events
        on('participant-joined', (data: any) => {
            if (state.currentChat?.id === data.chatId) {
                // Refresh current chat to get updated participants
                refreshCurrentChat();
            }
        });

        on('participant-left', (data: any) => {
            if (state.currentChat?.id === data.chatId) {
                // Refresh current chat to get updated participants
                refreshCurrentChat();
            }
        });

        on('added-to-session', (data: any) => {
            // User was added to a session, refresh chats
            loadChats();
        });

        on('removed-from-session', (data: any) => {
            // User was removed from session
            if (state.currentChat?.id === data.chatId) {
                dispatch({ type: 'SET_CURRENT_CHAT', payload: null });
            }
            loadChats();
        });

        on('session-changed', (data: any) => {
            console.log('Session changed:', data);
            // Refresh current chat if it's the affected session
            if (state.currentChat?.id === data.chatId) {
                refreshCurrentChat();
            }
        });

        // Error events
        on('error', (data: any) => {
            dispatch({ type: 'SET_ERROR', payload: data.message });
        });

        // Cleanup listeners on unmount
        return () => {
            off('connected');
            off('joined-chat');
            off('left-chat');
            off('new-message');
            off('message-sent');
            off('file-message-received');
            off('user-typing');
            off('messages-read');
            off('user:online');
            off('user:offline');
            off('participant-joined');
            off('participant-left');
            off('added-to-session');
            off('removed-from-session');
            off('session-changed');
            off('error');
        };
    }, [isConnected, socket, state.currentChat?.id, state.chats, state.typingUsers]);

    // Helper function to refresh current chat
    const refreshCurrentChat = async () => {
        if (state.currentChat) {
            try {
                const updatedChat = await chatHook.getChatById(state.currentChat.id);
                dispatch({ type: 'UPDATE_CHAT', payload: updatedChat });
                dispatch({ type: 'SET_CURRENT_CHAT', payload: updatedChat });
            } catch (error) {
                console.error('Error refreshing current chat:', error);
            }
        }
    };

    // Transform dates from Firebase Timestamps to JavaScript Dates/strings
    // Since backend now returns ISO strings, no transformation needed
    const transformChatDates = useCallback((chats: IChatResponse[]): IChatResponse[] => {
        return chats;
    }, []);



    // Load chats
    const loadChats = useCallback(async (params?: IChatQueryParams) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            dispatch({ type: 'SET_ERROR', payload: null });

            const response = await chatHook.getUserChats(params);
            
            // DEBUG: Log the first chat's raw data to understand the timestamp format
            if (response.chats.length > 0) {
                const firstChat = response.chats[0];
                console.log('🔍 Raw chat from API:', {
                    id: firstChat.id,
                    createdAt: firstChat.createdAt,
                    lastActivity: firstChat.lastActivity,
                    lastMessage: firstChat.lastMessage,
                    lastMessageTimestamp: firstChat.lastMessage?.timestamp
                });
            }
            
            const transformedChats = transformChatDates(response.chats);
            
            // DEBUG: Log the first transformed chat
            if (transformedChats.length > 0) {
                const firstTransformed = transformedChats[0];
                console.log('✅ Transformed chat:', {
                    id: firstTransformed.id,
                    createdAt: firstTransformed.createdAt,
                    lastActivity: firstTransformed.lastActivity,
                    lastMessage: firstTransformed.lastMessage,
                    lastMessageTimestamp: firstTransformed.lastMessage?.timestamp
                });
            }
            
            dispatch({ type: 'SET_CHATS', payload: transformedChats });
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [transformChatDates]); // Remove chatHook dependency to prevent recreations

    // Create chat
    const createChat = async (chatData: ICreateChatRequest): Promise<IChatResponse> => {
        try {
            dispatch({ type: 'SET_ERROR', payload: null });

            const newChat = await chatHook.createChat(chatData);
            const transformedChat = transformChatDates([newChat])[0];
            dispatch({ type: 'ADD_CHAT', payload: transformedChat });

            return transformedChat;
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    };

    // Select chat
    const selectChat = (chat: IChatResponse) => {
        dispatch({ type: 'SET_CURRENT_CHAT', payload: chat });

        // Join chat room via socket
        if (isConnected) {
            emit('join-chat', { chatId: chat.id });
        }
    };

    // Leave current chat
    const leaveCurrentChat = () => {
        if (state.currentChat && isConnected) {
            emit('leave-chat', { chatId: state.currentChat.id });
        }
        dispatch({ type: 'SET_CURRENT_CHAT', payload: null });
        dispatch({ type: 'SET_MESSAGES', payload: [] });
    };

    // Load messages
    const loadMessages = async (chatId: string, params?: IMessagesQueryParams) => {
        try {
            dispatch({ type: 'SET_LOADING_MESSAGES', payload: true });
            dispatch({ type: 'SET_ERROR', payload: null });

            const response = await chatHook.getChatMessages(chatId, params);
            dispatch({ type: 'SET_MESSAGES', payload: response.messages });
            dispatch({ type: 'SET_HAS_MORE_MESSAGES', payload: response.hasMore });
            dispatch({ type: 'SET_MESSAGES_PAGE', payload: 1 });
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
        } finally {
            dispatch({ type: 'SET_LOADING_MESSAGES', payload: false });
        }
    };

    // Load more messages (pagination)
    const loadMoreMessages = async () => {
        if (!state.currentChat || !state.hasMoreMessages || state.isLoadingMessages) return;

        try {
            dispatch({ type: 'SET_LOADING_MESSAGES', payload: true });

            const oldestMessage = state.messages[0];
            const response = await chatHook.getChatMessages(state.currentChat.id, {
                before: oldestMessage?.id,
                limit: 50
            });

            dispatch({ type: 'PREPEND_MESSAGES', payload: response.messages });
            dispatch({ type: 'SET_HAS_MORE_MESSAGES', payload: response.hasMore });
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
        } finally {
            dispatch({ type: 'SET_LOADING_MESSAGES', payload: false });
        }
    };

    // Send message
    const sendMessage = async (content: string, timestamp: Date, replyTo?: string) => {
        if (!state.currentChat) return;

        try {
            dispatch({ type: 'SET_ERROR', payload: null });

            const messageData: ISendMessageRequest = {
                content,
                type: MessageType.TEXT,
                replyTo,
                timestamp
            };

            // Send via socket for real-time
            if (isConnected) {
                emit('send-message', {
                    chatId: state.currentChat.id,
                    message: messageData
                });
            } else {
                // Fallback to HTTP if socket not connected
                const message = await chatHook.sendMessage(state.currentChat.id, messageData);
                dispatch({ type: 'ADD_MESSAGE', payload: message });
                dispatch({ type: 'UPDATE_LAST_MESSAGE', payload: { chatId: state.currentChat.id, message } });
            }
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    };

    // Send file message
    const sendFileMessage = async (fileData: ISendFileMessageRequest) => {
        if (!state.currentChat) return;

        try {
            dispatch({ type: 'SET_ERROR', payload: null });

            const message = await chatHook.sendFileMessage(state.currentChat.id, fileData);
            dispatch({ type: 'ADD_MESSAGE', payload: message });
            dispatch({ type: 'UPDATE_LAST_MESSAGE', payload: { chatId: state.currentChat.id, message } });

            // Notify via socket
            if (isConnected) {
                emit('file-uploaded', {
                    chatId: state.currentChat.id,
                    messageId: message.id,
                    fileType: fileData.type === MessageType.IMAGE ? 'image' : 'file',
                    fileName: fileData.file.name
                });
            }
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    };

    // Delete message
    const deleteMessage = async (messageId: string) => {
        if (!state.currentChat) return;

        try {
            dispatch({ type: 'SET_ERROR', payload: null });

            const message = state.messages.find(msg => msg.id === messageId);

            if (message?.fileUrl) {
                await chatHook.deleteFileMessage(state.currentChat.id, messageId);
            } else {
                await chatHook.deleteMessage(state.currentChat.id, messageId);
            }

            dispatch({ type: 'REMOVE_MESSAGE', payload: messageId });
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    };

    // Mark messages as read
    const markAsRead = async (chatId?: string) => {
        const targetChatId = chatId || state.currentChat?.id;
        if (!targetChatId) return;

        try {
            await chatHook.markMessagesAsRead(targetChatId);

            // Emit via socket for real-time update
            if (isConnected) {
                emit('mark-read', { chatId: targetChatId });
            }

            dispatch({
                type: 'MARK_MESSAGES_READ',
                payload: { chatId: targetChatId, userId: user?.uid || '' }
            });
        } catch (error: any) {
            console.error('Error marking messages as read:', error);
        }
    };

    // Add mentee to session
    const addMenteeToSession = async (chatId: string, menteeId: string) => {
        try {
            dispatch({ type: 'SET_ERROR', payload: null });

            const updatedChat = await chatHook.addMenteeToSession(chatId, { menteeId });
            dispatch({ type: 'UPDATE_CHAT', payload: updatedChat });

            if (state.currentChat?.id === chatId) {
                dispatch({ type: 'SET_CURRENT_CHAT', payload: updatedChat });
            }

            // Notify via socket
            if (isConnected) {
                emit('session-participant-added', { chatId, menteeId });
            }
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    };

    // Remove mentee from session
    const removeMenteeFromSession = async (chatId: string, menteeId: string) => {
        try {
            dispatch({ type: 'SET_ERROR', payload: null });

            const updatedChat = await chatHook.removeMenteeFromSession(chatId, menteeId);
            dispatch({ type: 'UPDATE_CHAT', payload: updatedChat });

            if (state.currentChat?.id === chatId) {
                dispatch({ type: 'SET_CURRENT_CHAT', payload: updatedChat });
            }

            // Notify via socket
            if (isConnected) {
                emit('session-participant-removed', { chatId, menteeId });
            }
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    };

    // Join chat room
    const joinChat = (chatId: string) => {
        if (isConnected) {
            emit('join-chat', { chatId });
        }
    };

    // Leave chat room
    const leaveChat = (chatId: string) => {
        if (isConnected) {
            emit('leave-chat', { chatId });
        }
    };

    // Start typing
    const startTyping = (chatId: string) => {
        if (isConnected) {
            emit('typing-start', { chatId });
        }
    };

    // Stop typing
    const stopTyping = (chatId: string) => {
        if (isConnected) {
            emit('typing-stop', { chatId });
        }
    };

    // Get total unread count
    const getUnreadCount = (): number => {
        return state.unreadCount;
    };

    // Get chat participants
    const getChatParticipants = (chat: IChatResponse): string[] => {
        return chat.participants.map(p => p.uid);
    };

    // Check if user is typing
    const isUserTyping = (chatId: string, userId: string): boolean => {
        const typingUsers = state.typingUsers[chatId] || [];
        return typingUsers.includes(userId);
    };

    // Check if user is online
    const isUserOnline = (userId: string): boolean => {
        return state.onlineUsers.includes(userId);
    };

    // Refresh chats
    const refreshChats = useCallback(async () => {
        await loadChats();
    }, [loadChats]);

    // Clear error
    const clearError = useCallback(() => {
        dispatch({ type: 'SET_ERROR', payload: null });
    }, []);

    // Load chats on mount
    useEffect(() => {
        if (user?.uid) {
            loadChats();
        }
    }, [user?.uid, loadChats]);

    const contextValue: ChatContextType = {
        // State
        ...state,

        // Chat operations
        loadChats,
        createChat,
        selectChat,
        leaveCurrentChat,

        // Message operations
        loadMessages,
        loadMoreMessages,
        sendMessage,
        sendFileMessage,
        deleteMessage,
        markAsRead,

        // Session management
        addMenteeToSession,
        removeMenteeFromSession,

        // Real-time operations
        joinChat,
        leaveChat,
        startTyping,
        stopTyping,

        // Utility functions
        getUnreadCount,
        getChatParticipants,
        isUserTyping,
        isUserOnline,
        refreshChats,
        clearError,
    };

    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    );
};

// Hook to use chat context
export const useChatContext = (): ChatContextType => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
};

export const useChatSafe = () => {
  try {
    return useContext(ChatContext);
  } catch (error) {
    console.warn('ChatContext not available, returning null');
    return null;
  }
};

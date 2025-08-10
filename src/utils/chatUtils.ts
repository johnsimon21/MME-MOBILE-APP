import { IChatResponse, IMessageResponse, IChatParticipant } from '@/src/interfaces/chat.interface';

export const chatUtils = {
    // Get other participant in a chat
    getOtherParticipant: (chat: IChatResponse, currentUserId: string): IChatParticipant | null => {
        if (!chat.participants || !Array.isArray(chat.participants)) {
            return null;
        }
        return chat.participants.find(p => p.uid !== currentUserId) || null;
    },

    // Check if message is from current user
    isOwnMessage: (message: IMessageResponse, currentUserId: string): boolean => {
        return message.sender.uid === currentUserId;
    },

    // Format message timestamp
    formatMessageTime: (timestamp: any): string => {
        if (!timestamp) return '';

        console.log('--------------Time Stamp-------------');
        console.log(timestamp);

        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            console.warn('Invalid timestamp received in formatMessageTime:', timestamp);
            return '';
        }

        const now = new Date();

        // Diferença em milissegundos
        const diffMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffMs / (1000 * 60));
        const diffInHours = Math.floor(diffMs / (1000 * 60 * 60));

        console.log('Time difference debug:', {
            timestampReceived: timestamp,
            parsedDate: date.toISOString(),
            currentTime: now.toISOString(),
            diffMs,
            diffInMinutes,
            diffInHours
        });

        // Handle future timestamps (server time differences)
        if (diffMs < 0) {
            console.log('Future timestamp detected, returning "Agora"');
            return 'Agora';
        }

        // Less than 1 minute
        if (diffInMinutes < 1) {
            console.log('Less than 1 minute, returning "Agora"');
            return 'Agora';
        }
        
        // Less than 1 hour
        if (diffInHours < 1) {
            console.log(`Less than 1 hour, returning "${diffInMinutes}m"`);
            return `${diffInMinutes}m`;
        }
        
        // Same day but more than 1 hour
        if (diffInHours < 24 && 
            now.getFullYear() === date.getFullYear() &&
            now.getMonth() === date.getMonth() &&
            now.getDate() === date.getDate()) {
            console.log(`Same day, returning "${diffInHours}h"`);
            return `${diffInHours}h`;
        }

        // Check if it's yesterday
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (
            date.getFullYear() === yesterday.getFullYear() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getDate() === yesterday.getDate()
        ) {
            console.log('Yesterday, returning "Ontem"');
            return 'Ontem';
        }

        // Any other date
        const formattedDate = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        });
        console.log(`Other date, returning "${formattedDate}"`);
        return formattedDate;
    }
    ,
    // Format file size
    formatFileSize: (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Get chat title
    getChatTitle: (chat: IChatResponse, currentUserId: string): string => {
        if (chat.title) return chat.title;

        const otherParticipant = chatUtils.getOtherParticipant(chat, currentUserId);
        return otherParticipant?.fullName || 'Chat';
    },

    // Check if chat has unread messages
    hasUnreadMessages: (chat: IChatResponse): boolean => {
        return chat.unreadCount > 0;
    },

    // Get last message preview
    getLastMessagePreview: (chat: IChatResponse): string => {
        if (!chat.lastMessage) return 'Sem mensagens';

        switch (chat.lastMessage.type) {
            case 'image':
                return '📷 Imagem';
            case 'file':
                return '📎 Arquivo';
            case 'system':
                return chat.lastMessage.content;
            default:
                return chat.lastMessage.content;
        }
    },

    // Sort chats by last activity
    sortChatsByActivity: (chats: IChatResponse[]): IChatResponse[] => {
        return [...chats].sort((a, b) => {
            const dateA = new Date(a.lastActivity);
            const dateB = new Date(b.lastActivity);

            // Handle invalid dates
            const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
            const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();

            return timeB - timeA;
        });
    },

    // Filter chats by type
    filterChatsByType: (chats: IChatResponse[], type: string): IChatResponse[] => {
        if (type === 'all') return chats;
        return chats.filter(chat => chat.type === type);
    },

    // Search chats
    searchChats: (chats: IChatResponse[], query: string, currentUserId: string): IChatResponse[] => {
        if (!query.trim()) return chats;

        const searchTerm = query.toLowerCase();
        return chats.filter(chat => {
            const otherParticipant = chatUtils.getOtherParticipant(chat, currentUserId);
            const participantName = otherParticipant?.fullName?.toLowerCase() || '';
            const lastMessage = chat.lastMessage?.content?.toLowerCase() || '';

            return participantName.includes(searchTerm) || lastMessage.includes(searchTerm);
        });
    }
};

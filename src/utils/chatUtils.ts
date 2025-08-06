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
  formatMessageTime: (timestamp: string): string => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) {
          const diffInMinutes = Math.floor(diffInHours * 60);
          return diffInMinutes < 1 ? 'Agora' : `${diffInMinutes}m`;
      } else if (diffInHours < 24) {
          return `${Math.floor(diffInHours)}h`;
      } else if (diffInHours < 48) {
          return 'Ontem';
      } else {
          return date.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit'
          });
      }
  },

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
      return [...chats].sort((a, b) => 
          new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
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

import { MessageType, ChatType, IChatResponse, IMessageResponse } from '../interfaces/chat.interface';

export const chatUtils = {
  // Get message type icon
  getMessageTypeIcon: (type: MessageType): string => {
    switch (type) {
      case MessageType.TEXT: return '💬';
      case MessageType.IMAGE: return '📷';
      case MessageType.FILE: return '📎';
      case MessageType.SYSTEM: return 'ℹ️';
      case MessageType.CALL: return '📞';
      default: return '💬';
    }
  },

  // Get chat type display name
  getChatTypeDisplayName: (type: ChatType): string => {
    switch (type) {
      case ChatType.GENERAL: return 'Chat Geral';
      case ChatType.SESSION: return 'Sessão';
      default: return 'Chat';
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

  // Check if file is image
  isImageFile: (fileName: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  },

  // Get file extension
  getFileExtension: (fileName: string): string => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  },

  // Format message time
  formatMessageTime: (timestamp: Date): string => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 24 * 7) {
      return messageDate.toLocaleDateString('pt-BR', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return messageDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },

  // Format last activity
  formatLastActivity: (timestamp: Date): string => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffInMinutes = (now.getTime() - activityDate.getTime()) / (1000 * 60);

    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}min`;
    
    const diffInHours = diffInMinutes / 60;
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h`;
    
    const diffInDays = diffInHours / 24;
    if (diffInDays < 7) return `${Math.floor(diffInDays)}d`;
    
    return activityDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  },

  // Get other participant from chat
  getOtherParticipant: (chat: IChatResponse, currentUserId: string) => {
    return chat.participants.find(p => p.uid !== currentUserId);
  },

  // Get chat display name
  getChatDisplayName: (chat: IChatResponse, currentUserId: string): string => {
    if (chat.title) return chat.title;
    
    const otherParticipant = chatUtils.getOtherParticipant(chat, currentUserId);
    return otherParticipant?.fullName || 'Chat';
  },

  // Get unread badge color
  getUnreadBadgeColor: (count: number): string => {
    if (count === 0) return 'transparent';
    if (count < 10) return '#EF4444'; // red-500
    return '#DC2626'; // red-600
  },

  // Truncate message content
  truncateMessage: (content: string, maxLength: number = 50): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  },

  // Get message preview for chat list
  getMessagePreview: (message: IMessageResponse): string => {
    switch (message.type) {
      case MessageType.TEXT:
        return chatUtils.truncateMessage(message.content);
      case MessageType.IMAGE:
        return '📷 Imagem';
      case MessageType.FILE:
        return `📎 ${message.fileName || 'Arquivo'}`;
      case MessageType.SYSTEM:
        return message.content;
      case MessageType.CALL:
        return '📞 Chamada';
      default:
        return message.content;
    }
  },

  // Check if message is from current user
  isOwnMessage: (message: IMessageResponse, currentUserId: string): boolean => {
    return message.sender.uid === currentUserId;
  },

  // Group messages by date
  groupMessagesByDate: (messages: IMessageResponse[]): { [date: string]: IMessageResponse[] } => {
    return messages.reduce((groups, message) => {
      const date = new Date(message.timestamp).toLocaleDateString('pt-BR');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {} as { [date: string]: IMessageResponse[] });
  },

  // Check if should show sender name
  shouldShowSenderName: (
    message: IMessageResponse, 
    previousMessage: IMessageResponse | null,
    currentUserId: string
  ): boolean => {
    if (chatUtils.isOwnMessage(message, currentUserId)) return false;
    if (!previousMessage) return true;
    if (previousMessage.sender.uid !== message.sender.uid) return true;
    
    // Show name if more than 5 minutes between messages
    const timeDiff = new Date(message.timestamp).getTime() - new Date(previousMessage.timestamp).getTime();
    return timeDiff > 5 * 60 * 1000; // 5 minutes
  },

  // Get online status color
  getOnlineStatusColor: (isOnline: boolean): string => {
    return isOnline ? '#10B981' : '#6B7280'; // green-500 : gray-500
  },

  // Generate chat room name for socket
  getChatRoomName: (chatId: string): string => {
    return `chat:${chatId}`;
  },

  // Generate user room name for socket
  getUserRoomName: (userId: string): string => {
    return `user:${userId}`;
  },
};

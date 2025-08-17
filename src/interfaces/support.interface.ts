// Support Module Interfaces
// Matches backend DTOs and follows existing interface patterns

// ========================================
// TICKET INTERFACES
// ========================================

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_USER = 'waiting_user',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TicketCategory {
  TECHNICAL = 'technical',
  ACCOUNT = 'account',
  BILLING = 'billing',
  FEATURE_REQUEST = 'feature_request',
  BUG_REPORT = 'bug_report',
  OTHER = 'other'
}

export interface ITicketAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string; // Changed to string for consistency
}

export interface ITicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'admin';
  message: string;
  attachments: ITicketAttachment[];
  timestamp: string; // Changed to string for consistency
  isInternal: boolean;
}

export interface ITicket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  user: {
    uid: string;
    fullName: string;
    email: string;
    role: string;
  };
  assignedAdmin?: {
    uid: string;
    fullName: string;
    email: string;
  };
  attachments: ITicketAttachment[];
  messagesCount: number;
  lastMessage?: {
    message: string;
    senderName: string;
    senderType: 'user' | 'admin';
    timestamp: string; // Changed to string for consistency
  };
  createdAt: string; // Changed to string for consistency
  updatedAt: string; // Changed to string for consistency
  resolvedAt?: string; // Changed to string for consistency
}

export interface ITicketDetails extends ITicket {
  messages: ITicketMessage[];
}

export interface ICreateTicketRequest {
  title: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
}

export interface IUpdateTicketRequest {
  title?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  assignedAdminId?: string;
}

export interface IUpdateTicketStatusRequest {
  status: TicketStatus;
  note?: string;
}

export interface IAddTicketMessageRequest {
  message: string;
  isInternal?: boolean;
}

export interface ITicketsResponse {
  tickets: ITicket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  stats?: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
}

export interface IQueryTicketsRequest {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  userId?: string;
  assignedAdminId?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ========================================
// SUPPORT CHAT INTERFACES
// ========================================

export enum ChatSessionStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  CLOSED = 'closed',
  TRANSFERRED = 'transferred'
}

export enum ChatPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high'
}

export interface ISupportChatMessage {
  id: string;
  sessionId: string;
  sender: {
    uid: string;
    fullName: string;
    senderType: 'user' | 'admin' | 'system';
  };
  message: string;
  timestamp: string; // Changed to string for consistency
  readBy: string[];
  attachments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
}

export interface ISupportChatSession {
  id: string;
  user: {
    uid: string;
    fullName: string;
    email: string;
    role: string;
  };
  admin?: {
    uid: string;
    fullName: string;
    email: string;
  };
  status: ChatSessionStatus;
  priority: ChatPriority;
  subject?: string;
  startedAt: string; // Changed to string for consistency
  endedAt?: string; // Changed to string for consistency
  lastActivity: string; // Changed to string for consistency
  messagesCount: number;
  lastMessage?: {
    message: string;
    senderName: string;
    senderType: 'user' | 'admin' | 'system';
    timestamp: string; // Changed to string for consistency
  };
  waitTime?: number;
  responseTime?: number;
}

export interface IStartChatSessionRequest {
  subject?: string;
  priority?: ChatPriority;
  initialMessage?: string;
}

export interface ISendChatMessageRequest {
  message: string;
}

export interface ICloseChatSessionRequest {
  note?: string;
}

export interface IChatSessionsResponse {
  sessions: ISupportChatSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: {
    waiting: number;
    active: number;
    closed: number;
    averageWaitTime: number;
    averageResponseTime: number;
  };
}

// ========================================
// FAQ INTERFACES
// ========================================

export enum FAQCategory {
  GENERAL = 'general',
  ACCOUNT = 'account',
  TECHNICAL = 'technical',
  SESSION = 'session',
  COMMUNICATION = 'communication'
}

export interface IFAQ {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  tags: string[];
  helpfulCount: number;
  notHelpfulCount: number;
  isActive: boolean;
  order: number;
  createdBy: {
    uid: string;
    fullName: string;
  };
  createdAt: string; // Changed to string for consistency
  updatedAt: string; // Changed to string for consistency
  userVote?: boolean; // true if helpful, false if not helpful, undefined if not voted
}

export interface ICreateFAQRequest {
  question: string;
  answer: string;
  category: FAQCategory;
  tags?: string[];
  order?: number;
  isActive?: boolean;
}

export interface IUpdateFAQRequest {
  question?: string;
  answer?: string;
  category?: FAQCategory;
  tags?: string[];
  order?: number;
  isActive?: boolean;
}

export interface IVoteFAQRequest {
  isHelpful: boolean;
}

export interface IQueryFAQsRequest {
  search?: string;
  category?: FAQCategory;
  tags?: string[];
  isActive?: boolean;
  sortBy?: 'createdAt' | 'order' | 'helpfulCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface IFAQsResponse {
  faqs: IFAQ[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  categories: Array<{
    category: FAQCategory;
    count: number;
  }>;
}

// ========================================
// ADMIN INTERFACES
// ========================================

export interface ISupportStats {
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
    averageResolutionTime: number; // in hours
  };
  chat: {
    totalSessions: number;
    activeSessions: number;
    waitingSessions: number;
    averageWaitTime: number; // in minutes
    averageResponseTime: number; // in minutes
    averageSessionDuration: number; // in minutes
  };
  faqs: {
    total: number;
    active: number;
    byCategory: Record<string, number>;
    totalVotes: number;
    averageHelpfulness: number; // percentage
  };
  timeRange: {
    from: Date;
    to: Date;
    period: 'day' | 'week' | 'month' | 'year';
  };
  trends?: Array<{
    date: string;
    tickets: number;
    chatSessions: number;
    faqViews: number;
  }>;
}

export interface IAdminUser {
  uid: string;
  fullName: string;
  email: string;
  role: string;
  school?: string;
  ticketsCount: number;
  chatSessionsCount: number;
  lastActivity?: Date;
  isOnline: boolean;
}

export interface IAdminUsersResponse {
  users: IAdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========================================
// WEBSOCKET EVENT INTERFACES
// ========================================

export interface SupportSocketEvents {
  // Connection events
  'connected': (data: { userId: string; userRole: string; message: string; timestamp: Date }) => void;
  'error': (data: { message: string }) => void;

  // Support Chat events
  'joined-support-chat': (data: { sessionId: string; message: string }) => void;
  'left-support-chat': (data: { sessionId: string; message: string }) => void;
  'new-support-message': (data: { sessionId: string; message: ISupportChatMessage }) => void;
  'support-message-sent': (data: { sessionId: string; messageId: string; timestamp: Date }) => void;
  'support-user-typing': (data: { sessionId: string; userId: string; userRole: string; isTyping: boolean }) => void;
  'admin-joined-session': (data: { sessionId: string; admin: any; timestamp: Date }) => void;
  'user-joined-chat': (data: { sessionId: string; userId: string; userRole: string; timestamp: Date }) => void;
  'user-left-chat': (data: { sessionId: string; userId: string; timestamp: Date }) => void;

  // Ticket events
  'joined-ticket': (data: { ticketId: string; message: string }) => void;
  'left-ticket': (data: { ticketId: string; message: string }) => void;
  'ticket-updated': (data: { ticketId: string; update: any; timestamp: Date }) => void;
  'new-ticket': (data: { ticketId: string; ticket: any; timestamp: Date }) => void;

  // Admin events
  'waiting-sessions': (data: { sessions: ISupportChatSession[]; count: number }) => void;
  'session-assigned': (data: { sessionId: string; assignedTo: string; timestamp: Date }) => void;
  'session-assigned-success': (data: { sessionId: string; session: ISupportChatSession }) => void;
  'admin:online': (data: { adminId: string; timestamp: Date }) => void;
  'admin:offline': (data: { adminId: string; timestamp: Date }) => void;
  'new-chat-session': (data: { sessionId: string; session: ISupportChatSession; timestamp: Date }) => void;

  // Notification events
  'support-notification': (notification: any) => void;
}

export interface SupportSocketEmitEvents {
  // Chat events
  'join-support-chat': (data: { sessionId: string }) => void;
  'leave-support-chat': (data: { sessionId: string }) => void;
  'send-support-message': (data: { sessionId: string; message: string }) => void;
  'support-typing-start': (data: { sessionId: string }) => void;
  'support-typing-stop': (data: { sessionId: string }) => void;

  // Ticket events
  'join-ticket': (data: { ticketId: string }) => void;
  'leave-ticket': (data: { ticketId: string }) => void;

  // Admin events
  'admin-get-waiting-sessions': () => void;
  'admin-assign-session': (data: { sessionId: string }) => void;
}

// ========================================
// UTILITY TYPES
// ========================================

export type SupportModuleType = 'tickets' | 'chat' | 'faqs' | 'admin';

export interface ISupportFilter {
  status?: TicketStatus | ChatSessionStatus;
  priority?: TicketPriority | ChatPriority;
  category?: TicketCategory | FAQCategory;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface ISupportModalState {
  type: 'create-ticket' | 'ticket-detail' | 'start-chat' | 'create-faq' | 'faq-detail' | null;
  data?: any;
  isVisible: boolean;
}

// Filter type aliases for better compatibility
export type TicketFilters = {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  search?: string;
  userId?: string;
  assignedAdminId?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
};

export type SupportChatFilters = {
  status?: ChatSessionStatus;
  priority?: ChatPriority;
  search?: string;
};

export type FAQFilters = {
  category?: FAQCategory;
  tags?: string[];
  isActive?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'order' | 'helpfulCount';
  sortOrder?: 'asc' | 'desc';
};

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  isRead: boolean;
  priority: NotificationPriority;
  category: NotificationCategory;
  timestamp: Date;
  expiresAt?: Date;
  actionUrl?: string;
  imageUrl?: string;
  createdBy?: string;
  metadata?: Record<string, any>;
}

export enum NotificationType {
  SESSION_STARTED = 'session_started',
  SESSION_COMPLETED = 'session_completed',
  SESSION_CANCELLED = 'session_cancelled',
  SESSION_REMINDER = 'session_reminder',
  SESSION_INVITATION = 'session_invitation',
  MESSAGE_RECEIVED = 'message_received',
  FILE_SHARED = 'file_shared',
  CALL_MISSED = 'call_missed',
  CALL_INCOMING = 'call_incoming',
  MENTEE_ASSIGNED = 'mentee_assigned',
  MENTOR_ASSIGNED = 'mentor_assigned',
  REPORT_GENERATED = 'report_generated',
  SYSTEM_UPDATE = 'system_update',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  FEEDBACK_REQUEST = 'feedback_request',
  RESOURCE_SHARED = 'resource_shared',
  ANNOUNCEMENT = 'announcement',
  REMINDER = 'reminder',
  WARNING = 'warning',
  ERROR = 'error'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationCategory {
  SESSION = 'session',
  MESSAGE = 'message',
  CALL = 'call',
  SYSTEM = 'system',
  SOCIAL = 'social',
  EDUCATIONAL = 'educational',
  ADMINISTRATIVE = 'administrative'
}

export interface NotificationData {
  userId?: string;
  userName?: string;
  userPhoto?: string;
  sessionId?: string;
  chatId?: string;
  messageId?: string;
  callId?: string;
  resourceId?: string;
  reportId?: string;
  actionData?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: string;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  categories: {
    [key in NotificationCategory]: {
      enabled: boolean;
      pushEnabled: boolean;
      emailEnabled: boolean;
      smsEnabled: boolean;
    };
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;
    timezone: string;
  };
  frequency: {
    digest: 'immediate' | 'hourly' | 'daily' | 'weekly';
    reminders: boolean;
  };
}

// API Response DTOs
export interface NotificationsListResponse {
  notifications: INotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface NotificationStatsResponse {
  total: number;
  unreadCount: number;
  readCount: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  recentActivity: Array<{ date: string; count: number }>;
}

export interface NotificationPreferencesResponse extends NotificationPreferences {
  updatedAt: Date;
}

// API Request DTOs
export interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  priority: NotificationPriority;
  category: NotificationCategory;
  expiresAt?: string;
  actionUrl?: string;
  imageUrl?: string;
  createdBy?: string;
  metadata?: Record<string, any>;
}

export interface BulkNotificationRequest {
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  priority: NotificationPriority;
  category: NotificationCategory;
}

export interface QueryNotificationsRequest {
  page?: number;
  limit?: number;
  type?: NotificationType;
  category?: NotificationCategory;
  isRead?: boolean;
  priority?: NotificationPriority;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export interface UpdateNotificationPreferencesRequest {
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  categories?: Record<string, any>;
  quietHours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  frequency?: {
    digest: 'immediate' | 'hourly' | 'daily' | 'weekly';
    reminders: boolean;
  };
}

// WebSocket Events
export interface NotificationSocketEvents {
  // Client -> Server
  'get-notifications': { page?: number; limit?: number; isRead?: boolean };
  'mark-as-read': { notificationId: string };
  'mark-all-read': {};
  'delete-notification': { notificationId: string };
  'get-stats': {};
  'update-preferences': UpdateNotificationPreferencesRequest;

  // Server -> Client
  'connected': { userId: string; message: string; unreadCount: number; timestamp: Date };
  'error': { message: string };
  'notifications-list': NotificationsListResponse;
  'notification-read': { notificationId: string; timestamp: Date };
  'all-notifications-read': { count: number; timestamp: Date };
  'notification-deleted': { notificationId: string; timestamp: Date };
  'notification-stats': NotificationStatsResponse;
  'preferences-updated': NotificationPreferencesResponse;
  'new-notification': INotification;
  'unread-count-updated': { unreadCount: number };
  'system-notification': any;
  'user-status-changed': { userId: string; status: 'online' | 'offline'; timestamp: Date };
}

// Filtering interface
export interface NotificationFilters {
  type?: NotificationType;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  isRead?: boolean;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

// For your existing notification format compatibility
export interface LegacyNotification {
  id: string;
  type: 'session' | 'message' | 'call' | 'system' | 'reminder';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionData?: {
    userId?: number;
    userName?: string;
    sessionId?: string;
    chatId?: string;
    userPhoto?: string | null;
  };
}

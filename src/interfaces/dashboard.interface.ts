export interface IDashboardStats {
  totalUsers: number;
  activeSessions: number;
  totalSessions: number;
  pendingSessions: number;
  completedSessions: number;
  usersByRole: {
    mentors: number;
    mentees: number;
    coordinators: number;
  };
  usersBySchool: Record<string, number>;
  sessionTrends: number[]; // Last 7 days session counts
  averageSessionDuration: number;
  totalHoursLogged: number;
  lastUpdated: string; // Changed to string for consistency
}

export interface IUserAnalytics {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  school: string;
  profileImage?: string;
  isOnline: boolean;
  lastActive: string; // Changed to string for consistency
  joinedDate: string; // Changed to string for consistency
  sessionsCount: number;
  completedSessions: number;
  completionRate: number;
  averageRating?: number;
  totalHours?: number;
  lastSessionDate?: string; // Changed to string for consistency
}

export interface ISessionAnalytics {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  averageDuration: number;
  sessionsByStatus: Record<string, number>;
  sessionsBySubject: Record<string, number>;
  sessionTrends: number[];
  completionRate: number;
}

export interface IRecentActivity {
  id: string;
  type: ActivityType;
  description: string;
  userId: string;
  userName: string;
  timestamp: string; // Changed to string for consistency
  metadata?: Record<string, any>;
}

export interface ISystemHealth {
  uptime: number;
  activeConnections: number;
  memoryUsage: number;
  responseTime: number;
  errorRate: number;
  lastUpdated: Date;
}

export interface ISubjectStats {
  subject: string;
  sessionCount: number;
  averageRating: number;
  totalDuration: number;
  completionRate: number;
}

export interface ISchoolStats {
  school: string;
  totalUsers: number;
  mentors: number;
  mentees: number;
  coordinators: number;
  activeSessions: number;
  totalSessions: number;
}

export interface IUserAnalyticsListResponse {
  users: IUserAnalytics[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IMessagesListResponse {
  messages: IUserAnalytics[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface IRealTimeStats {
  onlineUsers: number;
  activeSessions: number;
  activeConnections: number;
  systemLoad: number;
  errorRate: number;
  uptime: number;
  memoryUsage: number;
  lastUpdated: string; // Changed to string for consistency
}

// Query interfaces
export interface IDashboardStatsQuery {
  startDate?: Date;
  endDate?: Date;
  school?: string;
  role?: string;
}

export interface IUserAnalyticsQuery {
  page?: number;
  limit?: number;
  role?: string;
  school?: string;
  search?: string;
  isOnline?: boolean;
  sortBy?: 'name' | 'lastActive' | 'sessionsCount' | 'completionRate';
  sortOrder?: 'asc' | 'desc';
}

export interface ISessionAnalyticsQuery {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  mentorId?: string;
  subject?: string;
}

export interface IExportUserDataQuery extends IUserAnalyticsQuery {
  format?: ExportFormat;
  includePersonalData?: boolean;
  includeSessionData?: boolean;
}

// Enums
export enum DashboardType {
  DASHBOARD = 'dashboard',
  USER_ANALYTICS = 'user_analytics',
  SESSION_ANALYTICS = 'session_analytics',
  SYSTEM_HEALTH = 'system_health'
}

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'xlsx',
  JSON = 'json'
}

export enum ActivityType {
  USER_REGISTERED = 'user_registered',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  SESSION_CREATED = 'session_created',
  SESSION_STARTED = 'session_started',
  SESSION_COMPLETED = 'session_completed',
  SESSION_CANCELLED = 'session_cancelled',
  CHAT_MESSAGE_SENT = 'chat_message_sent',
  FILE_UPLOADED = 'file_uploaded',
  USER_PROFILE_UPDATED = 'user_profile_updated',
  SYSTEM_ERROR = 'system_error',
}

export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
  BUSY = 'busy'
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Socket events for real-time dashboard
export interface IDashboardSocketEvents {
  'connected': (data: { message: string; timestamp: Date }) => void;
  'dashboard-stats': (data: IDashboardStats) => void;
  'user-analytics': (data: IUserAnalyticsListResponse) => void;
  'session-analytics': (data: ISessionAnalytics) => void;
  'real-time-stats': (data: IRealTimeStats) => void;
  'user-activity': (data: IRecentActivity) => void;
  'session-update': (data: any) => void;
  'error': (data: { message: string }) => void;
}
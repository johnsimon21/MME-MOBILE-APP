export interface ISessionResponse {
  id: string;
  title: string;
  description?: string;
  mentor: {
    uid: string;
    fullName: string;
    email: string;
    image?: string;
  };
  participants: Array<{
    uid: string;
    fullName: string;
    email: string;
    role: string;
    image?: string;
    status: 'invited' | 'confirmed' | 'joined' | 'left' | 'no_show';
    joinedAt?: Date;
    leftAt?: Date;
  }>;
  status: SessionStatus;
  type: SessionType;
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration: number;
  actualDuration?: number;
  chatId?: string;
  metadata: {
    subject?: string;
    materials?: string[];
    maxParticipants?: number;
    isRecurring?: boolean;
  };
  stats?: {
    participantCount: number;
    joinedCount: number;
    completionRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ISessionsListResponse {
  sessions: ISessionResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ISessionStatsResponse {
  totalSessions: number;
  scheduledSessions: number;
  activeSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  totalParticipants: number;
  averageSessionDuration: number;
  averageRating: number;
  thisWeekSessions: number;
  thisMonthSessions: number;
  upcomingThisWeek: number;
  completionRate: number;
}

export interface ICreateSessionRequest {
  title: string;
  description?: string;
  menteeIds: string[];
  type: SessionType;
  scheduledAt: string;
  duration: number;
  subject?: string;
  materials?: string[];
  maxParticipants?: number;
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
    daysOfWeek?: number[];
  };
}

export interface IUpdateSessionRequest {
  title?: string;
  description?: string;
  scheduledAt?: string;
  duration?: number;
  subject?: string;
  materials?: string[];
  maxParticipants?: number;
  notes?: string;
}

export interface ISessionActionRequest {
  action: 'start' | 'pause' | 'resume' | 'end' | 'cancel';
  reason?: string;
  notes?: string;
}

export interface IAddParticipantRequest {
  menteeId: string;
  sendNotification?: boolean;
}

export interface IRemoveParticipantRequest {
  reason?: string;
  sendNotification?: boolean;
}

export interface ISessionQueryParams {
  page?: number;
  limit?: number;
  status?: SessionStatus;
  type?: SessionType;
  search?: string;
  subject?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'scheduledAt' | 'startedAt' | 'endedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  mentorId?: string;
  menteeId?: string;
}

export interface ISessionStatsQueryParams {
  dateFrom?: string;
  dateTo?: string;
  mentorId?: string;
  type?: SessionType;
}

export enum SessionType {
  INDIVIDUAL = 'individual',
  GROUP = 'group',
  WORKSHOP = 'workshop'
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active', 
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

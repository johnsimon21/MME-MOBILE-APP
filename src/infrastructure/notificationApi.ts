import api from './api';
import {
  INotification,
  NotificationsListResponse,
  NotificationStatsResponse,
  NotificationPreferencesResponse,
  CreateNotificationRequest,
  BulkNotificationRequest,
  QueryNotificationsRequest,
  UpdateNotificationPreferencesRequest,
} from '../interfaces/notification.interface';

export class NotificationAPI {
  // User Notifications CRUD
  static async getUserNotifications(
    userId: string,
    params: QueryNotificationsRequest = {}
  ): Promise<NotificationsListResponse> {
    console.log('📱 API: getUserNotifications called', { userId, params });
    const { data } = await api.get<NotificationsListResponse>(
      `/notifications/users/${userId}`,
      { params }
    );
    console.log('📱 API: getUserNotifications response', { 
      count: data.notifications?.length || 0, 
      total: data.total, 
      unreadCount: data.unreadCount 
    });
    return data;
  }

  static async markAsRead(userId: string, notificationId: string): Promise<{ message: string }> {
    const { data } = await api.put<{ message: string }>(
      `/notifications/users/${userId}/${notificationId}/read`
    );
    return data;
  }

  static async markAllAsRead(userId: string): Promise<{ message: string; count: number }> {
    const { data } = await api.put<{ message: string; count: number }>(
      `/notifications/users/${userId}/read-all`
    );
    return data;
  }

  static async deleteNotification(userId: string, notificationId: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(
      `/notifications/users/${userId}/${notificationId}`
    );
    return data;
  }

  // Stats and Preferences
  static async getNotificationStats(userId: string): Promise<NotificationStatsResponse> {
    const { data } = await api.get<NotificationStatsResponse>(
      `/notifications/users/${userId}/stats`
    );
    return data;
  }

  static async getNotificationPreferences(userId: string): Promise<NotificationPreferencesResponse> {
    const { data } = await api.get<NotificationPreferencesResponse>(
      `/notifications/users/${userId}/preferences`
    );
    return data;
  }

  static async updateNotificationPreferences(
    userId: string,
    preferences: UpdateNotificationPreferencesRequest
  ): Promise<NotificationPreferencesResponse> {
    const { data } = await api.put<NotificationPreferencesResponse>(
      `/notifications/users/${userId}/preferences`,
      preferences
    );
    return data;
  }

  // Admin/Coordinator Functions
  static async createNotification(notification: CreateNotificationRequest): Promise<INotification> {
    const { data } = await api.post<INotification>('/notifications', notification);
    return data;
  }

  static async createBulkNotifications(
    bulkNotification: BulkNotificationRequest
  ): Promise<{ created: number; skipped: number }> {
    const { data } = await api.post<{ created: number; skipped: number }>(
      '/notifications/bulk',
      bulkNotification
    );
    return data;
  }

  // Real-time notification triggers
  static async notifySessionStarted(sessionId: string, mentorId: string, menteeId: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/notifications/session/started', {
      sessionId,
      mentorId,
      menteeId,
    });
    return data;
  }

  static async notifySessionCompleted(sessionId: string, mentorId: string, menteeId: string, duration: number): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/notifications/session/completed', {
      sessionId,
      mentorId,
      menteeId,
      duration,
    });
    return data;
  }

  static async notifyMessageReceived(chatId: string, senderId: string, recipientId: string, messagePreview: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/notifications/message/received', {
      chatId,
      senderId,
      recipientId,
      messagePreview,
    });
    return data;
  }

  static async notifyIncomingCall(callId: string, callerId: string, recipientId: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/notifications/call/incoming', {
      callId,
      callerId,
      recipientId,
    });
    return data;
  }

  static async notifyMenteeAssigned(mentorId: string, menteeId: string, assignedBy: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/notifications/assignment/mentee', {
      mentorId,
      menteeId,
      assignedBy,
    });
    return data;
  }

  static async notifyReportGenerated(reportId: string, userId: string, reportTitle: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/notifications/report/generated', {
      reportId,
      userId,
      reportTitle,
    });
    return data;
  }

  static async sendSystemAnnouncement(title: string, message: string, userIds?: string[]): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/notifications/system/announcement', {
      title,
      message,
      userIds,
    });
    return data;
  }

  // Analytics (Admin/Coordinator only)
  static async getNotificationAnalytics(days: number = 30): Promise<any> {
    const { data } = await api.get('/notifications/analytics/overview', {
      params: { days },
    });
    return data;
  }

  static async getNotificationTemplates(): Promise<any[]> {
    const { data } = await api.get<any[]>('/notifications/templates');
    return data;
  }
}

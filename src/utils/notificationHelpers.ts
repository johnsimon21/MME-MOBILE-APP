import { NotificationAPI } from '../infrastructure/notificationApi';
import { 
  NotificationType, 
  NotificationPriority, 
  NotificationCategory,
  CreateNotificationRequest 
} from '../interfaces/notification.interface';

/**
 * Helper functions to send notifications for common scenarios in your app
 */
export class NotificationHelpers {
  
  // Session related notifications
  static async notifySessionStarted(sessionId: string, mentorId: string, menteeId: string) {
    try {
      await NotificationAPI.notifySessionStarted(sessionId, mentorId, menteeId);
      console.log('✅ Session started notification sent');
    } catch (error) {
      console.error('❌ Failed to send session started notification:', error);
    }
  }

  static async notifySessionCompleted(sessionId: string, mentorId: string, menteeId: string, duration: number) {
    try {
      await NotificationAPI.notifySessionCompleted(sessionId, mentorId, menteeId, duration);
      console.log('✅ Session completed notification sent');
    } catch (error) {
      console.error('❌ Failed to send session completed notification:', error);
    }
  }

  static async notifySessionReminder(sessionId: string, userId: string, mentorName: string, minutesUntilStart: number) {
    try {
      const notification: CreateNotificationRequest = {
        userId,
        type: NotificationType.SESSION_REMINDER,
        title: 'Lembrete de Sessão',
        message: `Sua sessão com ${mentorName} começará em ${minutesUntilStart} minutos`,
        priority: NotificationPriority.HIGH,
        category: NotificationCategory.SESSION,
        data: {
          sessionId,
          userName: mentorName,
        },
      };
      
      await NotificationAPI.createNotification(notification);
      console.log('✅ Session reminder notification sent');
    } catch (error) {
      console.error('❌ Failed to send session reminder notification:', error);
    }
  }

  // Message related notifications
  static async notifyMessageReceived(chatId: string, senderId: string, recipientId: string, messagePreview: string) {
    try {
      await NotificationAPI.notifyMessageReceived(chatId, senderId, recipientId, messagePreview);
      console.log('✅ Message received notification sent');
    } catch (error) {
      console.error('❌ Failed to send message received notification:', error);
    }
  }

  static async notifyFileShared(chatId: string, senderId: string, recipientId: string, fileName: string, senderName: string) {
    try {
      const notification: CreateNotificationRequest = {
        userId: recipientId,
        type: NotificationType.FILE_SHARED,
        title: 'Arquivo Recebido',
        message: `${senderName} enviou o arquivo: ${fileName}`,
        priority: NotificationPriority.MEDIUM,
        category: NotificationCategory.MESSAGE,
        data: {
          chatId,
          userId: senderId,
          userName: senderName,
        },
      };
      
      await NotificationAPI.createNotification(notification);
      console.log('✅ File shared notification sent');
    } catch (error) {
      console.error('❌ Failed to send file shared notification:', error);
    }
  }

  // Call related notifications
  static async notifyIncomingCall(callId: string, callerId: string, recipientId: string) {
    try {
      await NotificationAPI.notifyIncomingCall(callId, callerId, recipientId);
      console.log('✅ Incoming call notification sent');
    } catch (error) {
      console.error('❌ Failed to send incoming call notification:', error);
    }
  }

  static async notifyMissedCall(callId: string, callerId: string, recipientId: string, callerName: string) {
    try {
      const notification: CreateNotificationRequest = {
        userId: recipientId,
        type: NotificationType.CALL_MISSED,
        title: 'Chamada Perdida',
        message: `Você perdeu uma chamada de ${callerName}`,
        priority: NotificationPriority.HIGH,
        category: NotificationCategory.CALL,
        data: {
          callId,
          userId: callerId,
          userName: callerName,
        },
      };
      
      await NotificationAPI.createNotification(notification);
      console.log('✅ Missed call notification sent');
    } catch (error) {
      console.error('❌ Failed to send missed call notification:', error);
    }
  }

  // Assignment related notifications
  static async notifyMenteeAssigned(mentorId: string, menteeId: string, assignedBy: string) {
    try {
      await NotificationAPI.notifyMenteeAssigned(mentorId, menteeId, assignedBy);
      console.log('✅ Mentee assigned notification sent');
    } catch (error) {
      console.error('❌ Failed to send mentee assigned notification:', error);
    }
  }

  static async notifyMentorAssigned(mentorId: string, menteeId: string, mentorName: string) {
    try {
      const notification: CreateNotificationRequest = {
        userId: menteeId,
        type: NotificationType.MENTOR_ASSIGNED,
        title: 'Mentor Designado',
        message: `${mentorName} foi designado como seu mentor`,
        priority: NotificationPriority.HIGH,
        category: NotificationCategory.ADMINISTRATIVE,
        data: {
          userId: mentorId,
          userName: mentorName,
        },
      };
      
      await NotificationAPI.createNotification(notification);
      console.log('✅ Mentor assigned notification sent');
    } catch (error) {
      console.error('❌ Failed to send mentor assigned notification:', error);
    }
  }

  // Achievement and progress notifications
  static async notifyAchievementUnlocked(userId: string, achievementName: string, achievementDescription: string) {
    try {
      const notification: CreateNotificationRequest = {
        userId,
        type: NotificationType.ACHIEVEMENT_UNLOCKED,
        title: 'Conquista Desbloqueada!',
        message: `Parabéns! Você desbloqueou: ${achievementName}`,
        priority: NotificationPriority.LOW,
        category: NotificationCategory.SOCIAL,
        data: {
          actionData: {
            achievementName,
            description: achievementDescription,
          },
        },
      };
      
      await NotificationAPI.createNotification(notification);
      console.log('✅ Achievement unlocked notification sent');
    } catch (error) {
      console.error('❌ Failed to send achievement notification:', error);
    }
  }

  // Report related notifications
  static async notifyReportGenerated(reportId: string, userId: string, reportTitle: string) {
    try {
      await NotificationAPI.notifyReportGenerated(reportId, userId, reportTitle);
      console.log('✅ Report generated notification sent');
    } catch (error) {
      console.error('❌ Failed to send report generated notification:', error);
    }
  }

  static async notifyFeedbackRequest(userId: string, sessionId: string, mentorName: string) {
    try {
      const notification: CreateNotificationRequest = {
        userId,
        type: NotificationType.FEEDBACK_REQUEST,
        title: 'Feedback Solicitado',
        message: `Por favor, avalie sua sessão com ${mentorName}`,
        priority: NotificationPriority.MEDIUM,
        category: NotificationCategory.SESSION,
        data: {
          sessionId,
          userName: mentorName,
        },
      };
      
      await NotificationAPI.createNotification(notification);
      console.log('✅ Feedback request notification sent');
    } catch (error) {
      console.error('❌ Failed to send feedback request notification:', error);
    }
  }

  // System notifications
  static async notifySystemUpdate(userIds: string[], updateTitle: string, updateMessage: string) {
    try {
      await NotificationAPI.sendSystemAnnouncement(updateTitle, updateMessage, userIds);
      console.log('✅ System update notification sent');
    } catch (error) {
      console.error('❌ Failed to send system update notification:', error);
    }
  }

  static async notifyMaintenanceScheduled(userIds: string[], startTime: string, endTime: string) {
    try {
      await NotificationAPI.sendSystemAnnouncement(
        'Manutenção Programada',
        `O sistema estará em manutenção de ${startTime} às ${endTime}`,
        userIds
      );
      console.log('✅ Maintenance notification sent');
    } catch (error) {
      console.error('❌ Failed to send maintenance notification:', error);
    }
  }

  // Educational content notifications
  static async notifyResourceShared(userId: string, resourceTitle: string, sharedBy: string, resourceId: string) {
    try {
      const notification: CreateNotificationRequest = {
        userId,
        type: NotificationType.RESOURCE_SHARED,
        title: 'Novo Recurso Compartilhado',
        message: `${sharedBy} compartilhou: ${resourceTitle}`,
        priority: NotificationPriority.MEDIUM,
        category: NotificationCategory.EDUCATIONAL,
        data: {
          resourceId,
          userName: sharedBy,
        },
      };
      
      await NotificationAPI.createNotification(notification);
      console.log('✅ Resource shared notification sent');
    } catch (error) {
      console.error('❌ Failed to send resource shared notification:', error);
    }
  }

  // Custom notification
  static async sendCustomNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    category: NotificationCategory = NotificationCategory.SYSTEM,
    data?: any
  ) {
    try {
      const notification: CreateNotificationRequest = {
        userId,
        type,
        title,
        message,
        priority,
        category,
        data,
      };
      
      await NotificationAPI.createNotification(notification);
      console.log('✅ Custom notification sent');
    } catch (error) {
      console.error('❌ Failed to send custom notification:', error);
    }
  }

  // Bulk notifications
  static async sendBulkNotification(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    category: NotificationCategory = NotificationCategory.SYSTEM,
    data?: any
  ) {
    try {
      await NotificationAPI.createBulkNotifications({
        userIds,
        type,
        title,
        message,
        priority,
        category,
        data,
      });
      console.log('✅ Bulk notification sent');
    } catch (error) {
      console.error('❌ Failed to send bulk notification:', error);
    }
  }
}

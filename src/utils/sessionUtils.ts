/**
 * Session-related utility functions including date transformation
 */

import { ISessionResponse } from '../interfaces/sessions.interface';

/**
 * Transforms various timestamp formats to valid ISO string
 * Handles Firebase Timestamps, Date objects, ISO strings, and empty objects
 */
const transformTimestamp = (timestamp: any, fallbackTimestamp?: any): string => {
  // Handle fallback first if main timestamp is invalid
  if (!timestamp || (typeof timestamp === 'object' && Object.keys(timestamp).length === 0)) {
    if (fallbackTimestamp) {
      return transformTimestamp(fallbackTimestamp);
    }
    // Use current date as final fallback
    return new Date().toISOString();
  }

  try {
    // If it's already a string (ISO format), validate and return
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return transformTimestamp(fallbackTimestamp);
      }
      return date.toISOString();
    }

    // If it's a Date object
    if (timestamp instanceof Date) {
      if (isNaN(timestamp.getTime())) {
        return transformTimestamp(fallbackTimestamp);
      }
      return timestamp.toISOString();
    }

    // If it's a Firebase Timestamp-like object
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
      return date.toISOString();
    }

    // If it's an object with toDate method (Firebase Timestamp)
    if (timestamp && typeof timestamp === 'object' && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }

    // Try to parse as number (Unix timestamp)
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return transformTimestamp(fallbackTimestamp);
      }
      return date.toISOString();
    }

    // If all else fails, use fallback or current date
    return transformTimestamp(fallbackTimestamp);
  } catch (error) {
    console.warn('Error transforming timestamp:', timestamp, error);
    return transformTimestamp(fallbackTimestamp);
  }
};

/**
 * Transform session dates from various formats to ISO strings
 */
export const transformSessionDates = (session: any): ISessionResponse => {
  const transformed = {
    ...session,
    scheduledAt: transformTimestamp(session.scheduledAt, session.createdAt),
    startedAt: session.startedAt ? transformTimestamp(session.startedAt) : undefined,
    endedAt: session.endedAt ? transformTimestamp(session.endedAt) : undefined,
    createdAt: transformTimestamp(session.createdAt),
    updatedAt: transformTimestamp(session.updatedAt, session.createdAt),
  };

  return transformed;
};

/**
 * Format session time for display
 */
export const formatSessionTime = (timestamp: string | Date): string => {
  try {
    const date = new Date(timestamp);
    
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }

    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // If the date is in the future (scheduled sessions)
    if (diffMs > 0) {
      if (diffMinutes < 60) {
        return `Em ${diffMinutes} min`;
      } else if (diffHours < 24) {
        return `Em ${diffHours}h`;
      } else {
        return `Em ${diffDays} dias`;
      }
    }

    // If the date is in the past
    const absDiffMinutes = Math.abs(diffMinutes);
    const absDiffHours = Math.abs(diffHours);
    const absDiffDays = Math.abs(diffDays);

    if (absDiffMinutes < 1) {
      return 'Agora';
    } else if (absDiffMinutes < 60) {
      return `${absDiffMinutes} min atrás`;
    } else if (absDiffHours < 24) {
      return `${absDiffHours}h atrás`;
    } else if (absDiffDays === 1) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  } catch (error) {
    console.warn('Error formatting session time:', timestamp, error);
    return 'Data inválida';
  }
};

/**
 * Sort sessions by date activity (latest first)
 */
export const sortSessionsByActivity = (sessions: ISessionResponse[]): ISessionResponse[] => {
  return sessions.sort((a, b) => {
    // Use the most recent activity date for sorting
    const aDate = new Date(a.updatedAt || a.createdAt);
    const bDate = new Date(b.updatedAt || b.createdAt);
    
    // Handle invalid dates
    if (isNaN(aDate.getTime()) && isNaN(bDate.getTime())) return 0;
    if (isNaN(aDate.getTime())) return 1;
    if (isNaN(bDate.getTime())) return -1;
    
    return bDate.getTime() - aDate.getTime();
  });
};

/**
 * Check if a session is upcoming (scheduled in the future)
 */
export const isUpcomingSession = (session: ISessionResponse): boolean => {
  try {
    const scheduledDate = new Date(session.scheduledAt);
    const now = new Date();
    return scheduledDate.getTime() > now.getTime() && session.status === 'scheduled';
  } catch {
    return false;
  }
};

/**
 * Check if a session is active (currently running)
 */
export const isActiveSession = (session: ISessionResponse): boolean => {
  return session.status === 'active';
};

/**
 * Get session duration in human readable format
 */
export const formatSessionDuration = (durationInMinutes: number): string => {
  if (durationInMinutes < 60) {
    return `${durationInMinutes} min`;
  }
  
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;
  
  if (minutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${minutes}min`;
};

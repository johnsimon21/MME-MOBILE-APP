# 🔔 Notification System Integration Guide

## Overview

This guide explains how to use the comprehensive notification system integrated into your React Native MME (Meu Mentor Eiffel) application. The system provides real-time notifications using WebSocket connections and full CRUD operations via REST API.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React Native)                │
├─────────────────────────────────────────────────────────────┤
│  Components  │  Hooks     │  Context    │  API Client      │
│  - Screens   │  - useNot  │  - Provider │  - REST          │
│  - Badge     │  - useWS   │  - State    │  - WebSocket     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (NestJS + Firebase)             │
├─────────────────────────────────────────────────────────────┤
│  Gateway     │  Service   │  Controller │  Database        │
│  - WebSocket │  - CRUD    │  - REST API │  - Firestore     │
│  - Real-time │  - Logic   │  - Auth     │  - Real-time     │
└─────────────────────────────────────────────────────────────┘
```

## 📂 File Structure

```
src/
├── context/
│   └── NotificationContext.tsx         # Main context provider
├── hooks/
│   ├── useNotifications.ts            # Main notification hook
│   └── useNotificationSocket.ts       # WebSocket management
├── infrastructure/
│   └── notificationApi.ts             # API client
├── interfaces/
│   └── notification.interface.ts      # TypeScript interfaces
├── presentation/components/ui/
│   └── NotificationBadge.tsx          # Badge components
├── utils/
│   └── notificationHelpers.ts         # Helper functions
└── examples/
    └── NotificationIntegrationExample.tsx # Usage examples
```

## 🚀 Quick Start

### 1. Provider Setup (Already configured in your app)

The `NotificationProvider` is already integrated into your `_layout.tsx`:

```tsx
<SocketProvider>
  <NotificationProvider>  // ✅ Already added
    <ChatProvider>
      {/* Your app components */}
    </ChatProvider>
  </NotificationProvider>
</SocketProvider>
```

### 2. Using Notifications in Components

```tsx
import { useNotificationContext } from '@/src/context/NotificationContext';

const MyComponent = () => {
  const {
    notifications,
    unreadCount,
    isSocketConnected,
    markAsRead,
    markAllAsRead,
    refresh
  } = useNotificationContext();

  return (
    <View>
      <Text>Unread: {unreadCount}</Text>
      <Text>Status: {isSocketConnected ? 'Online' : 'Offline'}</Text>
    </View>
  );
};
```

### 3. Sending Notifications

```tsx
import { NotificationHelpers } from '@/src/utils/notificationHelpers';

// Send session started notification
await NotificationHelpers.notifySessionStarted(
  'session_123',
  'mentor_id',
  'mentee_id'
);

// Send message notification
await NotificationHelpers.notifyMessageReceived(
  'chat_123',
  'sender_id',
  'recipient_id',
  'Hello! How are you?'
);

// Send custom notification
await NotificationHelpers.sendCustomNotification(
  'user_id',
  NotificationType.ACHIEVEMENT_UNLOCKED,
  'Congratulations!',
  'You completed your first session!',
  NotificationPriority.MEDIUM,
  NotificationCategory.SOCIAL
);
```

### 4. Notification Badge (Already integrated in Navbar)

The notification badge is automatically displayed in your navbar:

```tsx
import { NotificationBadge } from '@/src/presentation/components/ui/NotificationBadge';

// Use in custom components
<NotificationBadge showLabel size="large" />
```

## 🎯 Key Features

### Real-time Updates
- ✅ WebSocket connection for instant notifications
- ✅ Automatic reconnection on network recovery
- ✅ Fallback to API when WebSocket unavailable

### Full CRUD Operations
- ✅ Create notifications (admin/mentor/coordinator)
- ✅ Read notifications with pagination
- ✅ Mark as read (single/bulk)
- ✅ Delete notifications
- ✅ Update preferences

### Rich Notification Types
- 📚 Session notifications (started, completed, reminder)
- 💬 Message notifications (received, file shared)
- 📞 Call notifications (incoming, missed)
- 🏆 Achievement notifications
- 🔧 System notifications
- 👥 Assignment notifications

### Advanced Features
- ✅ Priority levels (low, medium, high, urgent)
- ✅ Categories (session, message, call, system, etc.)
- ✅ User preferences and quiet hours
- ✅ Statistics and analytics
- ✅ Bulk operations
- ✅ Offline support with caching

## 📱 Usage Examples

### 1. In Chat Components

```tsx
// When sending a message
const sendMessage = async (message: string, recipientId: string, chatId: string) => {
  // Send message to backend
  await sendMessageToAPI(message, recipientId, chatId);
  
  // Send notification
  await NotificationHelpers.notifyMessageReceived(
    chatId,
    currentUser.uid,
    recipientId,
    message.substring(0, 50) + '...'
  );
};
```

### 2. In Session Components

```tsx
// When starting a session
const startSession = async (sessionData: SessionData) => {
  // Start session in backend
  const session = await createSession(sessionData);
  
  // Notify participants
  await NotificationHelpers.notifySessionStarted(
    session.id,
    session.mentorId,
    session.menteeId
  );
};
```

### 3. In Call Components

```tsx
// When initiating a call
const initiateCall = async (recipientId: string, callType: 'voice' | 'video') => {
  // Start call
  const call = await startCall(recipientId, callType);
  
  // Notify recipient
  await NotificationHelpers.notifyIncomingCall(
    call.id,
    currentUser.uid,
    recipientId
  );
};
```

### 4. In Admin Components

```tsx
// Send system announcement
const sendAnnouncement = async (title: string, message: string, userIds?: string[]) => {
  await NotificationHelpers.notifySystemUpdate(
    userIds || [], // All users if empty
    title,
    message
  );
};
```

## ⚙️ Configuration

### Environment Variables (already configured)

```typescript
// src/config/env.ts
export const ENV = {
  API_BASE_URL: __DEV__
    ? `http://${IP}:3000/api`
    : 'https://your-production-domain.com/api',
};
```

### WebSocket URL

The WebSocket automatically uses your API base URL:
- Development: `http://192.168.240.92:3000/notifications`
- Production: `https://your-domain.com/notifications`

## 🔧 Customization

### 1. Custom Notification Types

Add new types to the interface:

```typescript
// src/interfaces/notification.interface.ts
export enum NotificationType {
  // ... existing types
  CUSTOM_EVENT = 'custom_event',
}
```

### 2. Custom Categories

```typescript
export enum NotificationCategory {
  // ... existing categories
  CUSTOM_CATEGORY = 'custom_category',
}
```

### 3. Custom Notification Helper

```typescript
// Add to NotificationHelpers class
static async notifyCustomEvent(userId: string, eventData: any) {
  const notification: CreateNotificationRequest = {
    userId,
    type: NotificationType.CUSTOM_EVENT,
    title: 'Custom Event',
    message: 'Something custom happened!',
    priority: NotificationPriority.MEDIUM,
    category: NotificationCategory.CUSTOM_CATEGORY,
    data: eventData,
  };
  
  await NotificationAPI.createNotification(notification);
}
```

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket not connecting**
   - Check if backend is running
   - Verify IP address in `env.ts`
   - Check network connectivity

2. **Notifications not appearing**
   - Ensure user is authenticated
   - Check if NotificationProvider is wrapping components
   - Verify WebSocket connection status

3. **Badge not updating**
   - Check if useNotificationContext is called
   - Ensure component is within NotificationProvider

### Debug Information

```tsx
const { isSocketConnected, error } = useNotificationContext();

console.log('Socket connected:', isSocketConnected);
console.log('Error:', error);
```

## 📊 Analytics and Stats

Access notification statistics:

```tsx
const { stats, loadStats } = useNotificationContext();

// Load stats
await loadStats();

// Access data
console.log('Total notifications:', stats?.total);
console.log('Unread count:', stats?.unreadCount);
console.log('By category:', stats?.byCategory);
```

## 🔐 Security

- ✅ Authentication required for all operations
- ✅ Users can only access their own notifications
- ✅ Role-based permissions (coordinators can send bulk)
- ✅ Firebase security rules applied

## 🚀 Performance

- ✅ Pagination for large notification lists
- ✅ Optimistic updates for better UX
- ✅ Efficient WebSocket connection management
- ✅ Caching and offline support

## 📋 Testing

To test the notification system:

1. **Use the example component** (optional):
   ```tsx
   import { NotificationIntegrationExample } from '@/src/examples/NotificationIntegrationExample';
   
   // Add to any screen for testing
   <NotificationIntegrationExample />
   ```

2. **Test real scenarios**:
   - Send messages between users
   - Start/complete sessions
   - Make calls
   - Create system announcements

## 🎉 You're Ready!

The notification system is now fully integrated into your app. The main features include:

- ✅ Real-time notifications via WebSocket
- ✅ REST API for full CRUD operations
- ✅ Automatic badge updates in navbar
- ✅ Comprehensive notification types
- ✅ User preferences and settings
- ✅ Offline support and caching

Start using `NotificationHelpers` in your components to send notifications and `useNotificationContext` to access notification data!

## 📞 Support

If you need help implementing or customizing the notification system, refer to:
- The example files in `/src/examples/`
- The interface definitions in `/src/interfaces/`
- The helper functions in `/src/utils/notificationHelpers.ts`

Happy coding! 🚀

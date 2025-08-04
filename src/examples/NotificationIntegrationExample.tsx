import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import tw from 'twrnc';
import { useNotificationContext } from '../context/NotificationContext';
import { NotificationHelpers } from '../utils/notificationHelpers';
import { useAuth } from '../context/AuthContext';
import { NotificationBadge } from '../presentation/components/ui/NotificationBadge';

/**
 * Example component showing how to integrate the notification system
 * This is for demonstration purposes - integrate these patterns into your actual components
 */
export const NotificationIntegrationExample: React.FC = () => {
  const { user } = useAuth();
  const {
    unreadCount,
    isSocketConnected,
    markAllAsRead,
    refresh,
  } = useNotificationContext();

  // Example: Send session started notification
  const handleSessionStarted = async () => {
    if (!user?.uid) return;
    
    try {
      await NotificationHelpers.notifySessionStarted(
        'session_123',
        'mentor_456',
        user.uid
      );
      Alert.alert('Sucesso', 'Notificação de sessão iniciada enviada!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar notificação');
    }
  };

  // Example: Send message notification
  const handleMessageReceived = async () => {
    if (!user?.uid) return;
    
    try {
      await NotificationHelpers.notifyMessageReceived(
        'chat_789',
        'sender_123',
        user.uid,
        'Olá! Como você está?'
      );
      Alert.alert('Sucesso', 'Notificação de mensagem enviada!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar notificação');
    }
  };

  // Example: Send custom notification
  const handleCustomNotification = async () => {
    if (!user?.uid) return;
    
    try {
      await NotificationHelpers.sendCustomNotification(
        user.uid,
        'achievement_unlocked' as any,
        'Parabéns!',
        'Você completou seu primeiro dia no app!',
        'medium' as any,
        'social' as any
      );
      Alert.alert('Sucesso', 'Notificação customizada enviada!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar notificação');
    }
  };

  return (
    <View style={tw`p-4 bg-white m-4 rounded-lg`}>
      <Text style={tw`text-lg font-bold mb-4`}>Notification System Demo</Text>
      
      {/* Status Display */}
      <View style={tw`mb-4 p-3 bg-gray-50 rounded-lg`}>
        <Text style={tw`text-sm text-gray-600 mb-1`}>
          Status: {isSocketConnected ? '🟢 Conectado' : '🟡 Offline'}
        </Text>
        <Text style={tw`text-sm text-gray-600`}>
          Não lidas: {unreadCount}
        </Text>
      </View>

      {/* Notification Badge Component */}
      <View style={tw`mb-4 items-center`}>
        <Text style={tw`text-sm text-gray-600 mb-2`}>Notification Badge:</Text>
        <NotificationBadge showLabel size="large" />
      </View>

      {/* Action Buttons */}
      <View style={tw`gap-3`}>
        <TouchableOpacity
          style={tw`bg-blue-500 p-3 rounded-lg`}
          onPress={handleSessionStarted}
        >
          <Text style={tw`text-white text-center font-medium`}>
            Simular Sessão Iniciada
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`bg-green-500 p-3 rounded-lg`}
          onPress={handleMessageReceived}
        >
          <Text style={tw`text-white text-center font-medium`}>
            Simular Mensagem Recebida
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`bg-purple-500 p-3 rounded-lg`}
          onPress={handleCustomNotification}
        >
          <Text style={tw`text-white text-center font-medium`}>
            Enviar Notificação Customizada
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`bg-orange-500 p-3 rounded-lg`}
          onPress={markAllAsRead}
        >
          <Text style={tw`text-white text-center font-medium`}>
            Marcar Todas Como Lidas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`bg-gray-500 p-3 rounded-lg`}
          onPress={refresh}
        >
          <Text style={tw`text-white text-center font-medium`}>
            Atualizar Notificações
          </Text>
        </TouchableOpacity>
      </View>

      {/* Integration Examples */}
      <View style={tw`mt-6 p-3 bg-yellow-50 rounded-lg`}>
        <Text style={tw`font-bold text-yellow-800 mb-2`}>Como Integrar:</Text>
        <Text style={tw`text-sm text-yellow-700 mb-1`}>
          1. Use NotificationHelpers para enviar notificações
        </Text>
        <Text style={tw`text-sm text-yellow-700 mb-1`}>
          2. Use useNotificationContext para acessar dados
        </Text>
        <Text style={tw`text-sm text-yellow-700 mb-1`}>
          3. Use NotificationBadge nos componentes UI
        </Text>
        <Text style={tw`text-sm text-yellow-700`}>
          4. O WebSocket conecta automaticamente quando autenticado
        </Text>
      </View>
    </View>
  );
};

// Integration examples for different scenarios:

// 1. IN YOUR CHAT COMPONENT:
/*
import { NotificationHelpers } from '@/src/utils/notificationHelpers';

const sendMessage = async (message: string, recipientId: string, chatId: string) => {
  // Send the message
  await sendMessageToBackend(message, recipientId, chatId);
  
  // Send notification
  await NotificationHelpers.notifyMessageReceived(
    chatId,
    currentUserId,
    recipientId,
    message.substring(0, 50) + '...'
  );
};
*/

// 2. IN YOUR SESSION COMPONENT:
/*
import { NotificationHelpers } from '@/src/utils/notificationHelpers';

const startSession = async (sessionId: string, mentorId: string, menteeId: string) => {
  // Start the session
  await startSessionInBackend(sessionId);
  
  // Send notifications
  await NotificationHelpers.notifySessionStarted(sessionId, mentorId, menteeId);
};
*/

// 3. IN YOUR CALL COMPONENT:
/*
import { NotificationHelpers } from '@/src/utils/notificationHelpers';

const initiateCall = async (callId: string, callerId: string, recipientId: string) => {
  // Start the call
  await startCall(callId);
  
  // Send notification
  await NotificationHelpers.notifyIncomingCall(callId, callerId, recipientId);
};
*/

// 4. ACCESSING NOTIFICATION DATA:
/*
import { useNotificationContext } from '@/src/context/NotificationContext';

const MyComponent = () => {
  const { 
    notifications, 
    unreadCount, 
    isSocketConnected,
    markAsRead,
    refresh 
  } = useNotificationContext();
  
  return (
    <View>
      <Text>Unread: {unreadCount}</Text>
      <Text>Connected: {isSocketConnected ? 'Yes' : 'No'}</Text>
    </View>
  );
};
*/

// 5. SHOWING NOTIFICATION BADGE:
/*
import { NotificationBadge } from '@/src/presentation/components/ui/NotificationBadge';

const NavBar = () => {
  return (
    <View style={tw`flex-row items-center justify-between p-4`}>
      <Text>My App</Text>
      <NotificationBadge size="medium" />
    </View>
  );
};
*/

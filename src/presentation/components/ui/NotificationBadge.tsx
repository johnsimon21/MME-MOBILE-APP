import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { useRouter } from 'expo-router';
import { useNotificationContextSafe } from '@/src/context/NotificationContext';

interface NotificationBadgeProps {
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  showLabel = false,
  size = 'medium',
  color = '#4F46E5'
}) => {
  const router = useRouter();
  const notificationContext = useNotificationContextSafe();
  
  const unreadCount = notificationContext?.unreadCount || 0;
  const isConnected = notificationContext?.isSocketConnected || false;

  const iconSizes = {
    small: 20,
    medium: 24,
    large: 28
  };

  const badgeSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  const handlePress = () => {
    router.push('/notifications');
  };

  return (
    <TouchableOpacity
      style={tw`flex-row items-center`}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={tw`relative`}>
        <Feather 
          name="bell" 
          size={iconSizes[size]} 
          color={unreadCount > 0 ? color : '#9CA3AF'} 
        />
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <View style={tw`absolute -top-1 -right-1 ${badgeSizes[size]} bg-red-500 rounded-full items-center justify-center border-2 border-white`}>
            <Text style={tw`text-white text-xs font-bold`}>
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
          </View>
        )}

        {/* Connection status indicator */}
        {!isConnected && (
          <View style={tw`absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full border border-white`} />
        )}
      </View>

      {showLabel && (
        <Text style={tw`ml-2 text-sm text-gray-700`}>
          {unreadCount > 0 ? `${unreadCount} notificações` : 'Notificações'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Compact version for use in floating buttons or tight spaces
export const NotificationIcon: React.FC<{ size?: number; color?: string }> = ({ 
  size = 24, 
  color = '#FFFFFF' 
}) => {
  const router = useRouter();
  const notificationContext = useNotificationContextSafe();
  
  const unreadCount = notificationContext?.unreadCount || 0;

  const handlePress = () => {
    router.push('/notifications');
  };

  return (
    <TouchableOpacity onPress={handlePress} style={tw`relative`}>
      <Feather name="bell" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={tw`absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center`}>
          <Text style={tw`text-white text-xs font-bold`}>
            {unreadCount > 9 ? '9+' : unreadCount.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

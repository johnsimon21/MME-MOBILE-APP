import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { formatMessageTime } from '@/src/utils/dateFormatter';
import { Navbar } from '@/src/presentation/components/ui/navbar';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useNotificationContext } from '@/src/context/NotificationContext';
import { 
    INotification, 
    NotificationType, 
    NotificationCategory, 
    NotificationPriority 
} from '@/src/interfaces/notification.interface';

export default function NotificationScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    
    // Use notification context
    const {
        notifications,
        isLoading,
        isRefreshing,
        error,
        unreadCount,
        hasMore,
        isSocketConnected,
        loadNotifications,
        loadMore,
        refresh,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        handleNotificationAction,
        getFilteredNotifications,
    } = useNotificationContext();

    const [filter, setFilter] = useState<'all' | 'unread' | NotificationCategory>('all');

    // Get filtered notifications based on current filter
    const filteredNotifications = React.useMemo(() => {
        if (filter === 'all') return notifications;
        if (filter === 'unread') return notifications.filter(n => !n.isRead);
        return notifications.filter(n => n.category === filter);
    }, [notifications, filter]);

    // Enhanced navigation handler
    const handleNotificationTap = useCallback((notification: INotification) => {
        // Mark as read first
        if (!notification.isRead) {
            markAsRead(notification.id);
        }

        // Handle navigation based on notification type and data
        switch (notification.type) {
            case NotificationType.MESSAGE_RECEIVED:
                if (notification.data?.chatId) {
                    router.push(`/(tabs)/messages`);
                } else {
                    router.push('/(tabs)/messages');
                }
                break;

            case NotificationType.CALL_INCOMING:
            case NotificationType.CALL_MISSED:
                if (notification.data?.userId && notification.data?.userName) {
                    router.push({
                        pathname: '/normal-call',
                        params: {
                            userId: notification.data.userId.toString(),
                            userName: notification.data.userName,
                            userPhoto: notification.data.userPhoto || ''
                        }
                    });
                }
                break;

            case NotificationType.SESSION_STARTED:
            case NotificationType.SESSION_COMPLETED:
            case NotificationType.SESSION_CANCELLED:
            case NotificationType.SESSION_REMINDER:
                router.push('/(tabs)/session');
                break;

            case NotificationType.SYSTEM_UPDATE:
            case NotificationType.ANNOUNCEMENT:
                // @ts-ignore
                navigation.navigate('Settings');
                break;

            default:
                console.log('Unknown notification type:', notification.type);
                break;
        }
    }, [markAsRead, router, navigation]);

    // Delete notification with confirmation
    const handleDeleteNotification = useCallback((notificationId: string) => {
        Alert.alert(
            "Excluir Notificação",
            "Tem certeza que deseja excluir esta notificação?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: () => deleteNotification(notificationId)
                }
            ]
        );
    }, [deleteNotification]);

    // Get notification icon based on type and priority
    const getNotificationIcon = useCallback((notification: INotification) => {
        const iconColor = notification.priority === NotificationPriority.HIGH || notification.priority === NotificationPriority.URGENT 
            ? '#EF4444' 
            : notification.priority === NotificationPriority.MEDIUM 
            ? '#F59E0B' 
            : '#6B7280';

        switch (notification.type) {
            case NotificationType.SESSION_STARTED:
            case NotificationType.SESSION_COMPLETED:
            case NotificationType.SESSION_CANCELLED:
            case NotificationType.SESSION_REMINDER:
                return <MaterialIcons name="group" size={24} color={iconColor} />;
            
            case NotificationType.MESSAGE_RECEIVED:
            case NotificationType.FILE_SHARED:
                return <Feather name="message-circle" size={24} color={iconColor} />;
            
            case NotificationType.CALL_INCOMING:
            case NotificationType.CALL_MISSED:
                return <Feather name="phone" size={24} color={iconColor} />;
            
            case NotificationType.REMINDER:
                return <Feather name="clock" size={24} color={iconColor} />;
            
            case NotificationType.SYSTEM_UPDATE:
            case NotificationType.ANNOUNCEMENT:
                return <Feather name="settings" size={24} color={iconColor} />;
            
            case NotificationType.ACHIEVEMENT_UNLOCKED:
                return <Feather name="award" size={24} color={iconColor} />;
            
            default:
                return <Feather name="bell" size={24} color={iconColor} />;
        }
    }, []);

    // Get localized category name
    const getCategoryLabel = useCallback((category: NotificationCategory): string => {
        switch (category) {
            case NotificationCategory.SESSION: return 'Sessões';
            case NotificationCategory.MESSAGE: return 'Mensagens';
            case NotificationCategory.CALL: return 'Chamadas';
            case NotificationCategory.SYSTEM: return 'Sistema';
            case NotificationCategory.SOCIAL: return 'Social';
            case NotificationCategory.EDUCATIONAL: return 'Educacional';
            case NotificationCategory.ADMINISTRATIVE: return 'Administrativo';
            default: return 'Outros';
        }
    }, []);

    // Filter button component
    const FilterButton = ({
        filterType,
        label,
        count
    }: {
        filterType: typeof filter,
        label: string,
        count?: number
    }) => (
        <TouchableOpacity
            style={tw`flex justify-center items-center px-4 py-2 rounded-full mr-2 ${
                filter === filterType ? 'bg-[#4F46E5]' : 'bg-gray-200'
            }`}
            onPress={() => setFilter(filterType)}
        >
            <Text style={tw`text-xs ${
                filter === filterType ? 'text-white' : 'text-gray-700'
            } font-medium`}>
                {label} {count !== undefined && count > 0 && `(${count})`}
            </Text>
        </TouchableOpacity>
    );

    // Notification item component
    const NotificationItem = ({ item }: { item: INotification }) => (
        <TouchableOpacity
            style={tw`bg-white p-4 mb-2 rounded-xl ${!item.isRead ? 'border-l-4 border-[#4F46E5]' : ''}`}
            onPress={() => handleNotificationTap(item)}
        >
            <View style={tw`flex-row items-start`}>
                <View style={tw`w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-3`}>
                    {getNotificationIcon(item)}
                </View>

                <View style={tw`flex-1`}>
                    <View style={tw`flex-row items-center justify-between mb-1`}>
                        <Text style={tw`font-bold text-gray-800 flex-1`} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text style={tw`text-xs text-gray-500 ml-2`}>
                            {formatMessageTime(item.timestamp.toString())}
                        </Text>
                    </View>

                    <Text style={tw`text-gray-600 mb-2`} numberOfLines={2}>
                        {item.message}
                    </Text>

                    <View style={tw`flex-row items-center justify-between`}>
                        <View style={tw`flex-row items-center`}>
                            {!item.isRead && (
                                <View style={tw`w-2 h-2 bg-[#4F46E5] rounded-full mr-2`} />
                            )}
                            <Text style={tw`text-xs text-gray-500 capitalize`}>
                                {getCategoryLabel(item.category)}
                            </Text>
                            {item.data?.userName && (
                                <Text style={tw`text-xs text-gray-400 ml-1`}>
                                    • {item.data.userName}
                                </Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={tw`p-1`}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(item.id);
                            }}
                        >
                            <Feather name="x" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Connection status indicator
    const ConnectionStatus = () => (
        <View style={tw`flex-row items-center px-4 py-2 ${isSocketConnected ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <View style={tw`w-2 h-2 rounded-full mr-2 ${isSocketConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <Text style={tw`text-xs ${isSocketConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                {isSocketConnected ? 'Conectado - Tempo real' : 'Offline - Dados em cache'}
            </Text>
        </View>
    );

    // Error display
    if (error) {
        return (
            <View style={tw`flex-1 bg-[#F7F7F7]`}>
                <Navbar title="Notificações" showBackButton={true} />
                <View style={tw`flex-1 items-center justify-center p-4`}>
                    <Feather name="alert-circle" size={48} color="#EF4444" />
                    <Text style={tw`text-red-600 text-lg mt-4 text-center`}>Erro ao carregar notificações</Text>
                    <Text style={tw`text-gray-500 text-sm mt-2 text-center`}>{error}</Text>
                    <TouchableOpacity
                        style={tw`mt-4 px-6 py-3 bg-[#4F46E5] rounded-lg`}
                        onPress={() => refresh()}
                    >
                        <Text style={tw`text-white font-medium`}>Tentar novamente</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={tw`flex-1 bg-[#F7F7F7]`}>
            <Navbar title="Notificações" showBackButton={true} />

            {/* Connection Status */}
            <ConnectionStatus />

            {/* Header Actions */}
            <View style={tw`flex-row justify-between items-center px-4 py-3 bg-white mb-2`}>
                <Text style={tw`text-lg font-bold text-gray-800`}>
                    {unreadCount > 0 ? `${unreadCount} não lidas` : 'Todas lidas'}
                </Text>

                {unreadCount > 0 && (
                    <TouchableOpacity
                        style={tw`px-3 py-1 bg-[#4F46E5] rounded-full`}
                        onPress={markAllAsRead}
                    >
                        <Text style={tw`text-white text-sm font-medium`}>Marcar todas como lidas</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Filters */}
            <View style={tw`mb-4 h-12`}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={tw`px-4 h-full`}
                    contentContainerStyle={tw`items-center`}
                >
                    <FilterButton filterType="all" label="Todas" />
                    <FilterButton
                        filterType="unread"
                        label="Não lidas"
                        count={unreadCount}
                    />
                    <FilterButton
                        filterType={NotificationCategory.SESSION}
                        label="Sessões"
                        count={notifications.filter(n => n.category === NotificationCategory.SESSION).length}
                    />
                    <FilterButton
                        filterType={NotificationCategory.MESSAGE}
                        label="Mensagens"
                        count={notifications.filter(n => n.category === NotificationCategory.MESSAGE).length}
                    />
                    <FilterButton
                        filterType={NotificationCategory.CALL}
                        label="Chamadas"
                        count={notifications.filter(n => n.category === NotificationCategory.CALL).length}
                    />
                    <FilterButton
                        filterType={NotificationCategory.SYSTEM}
                        label="Sistema"
                        count={notifications.filter(n => n.category === NotificationCategory.SYSTEM).length}
                    />
                </ScrollView>
            </View>

            {/* Notifications List */}
            <FlatList
                data={filteredNotifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <NotificationItem item={item} />}
                contentContainerStyle={tw`px-4 pb-6`}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={refresh}
                        colors={['#4F46E5']}
                        tintColor="#4F46E5"
                    />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.1}
                ListFooterComponent={() => {
                    if (hasMore && isLoading) {
                        return (
                            <View style={tw`py-4 items-center`}>
                                <ActivityIndicator size="small" color="#4F46E5" />
                            </View>
                        );
                    }
                    return null;
                }}
                ListEmptyComponent={() => (
                    <View style={tw`items-center justify-center py-12`}>
                        {isLoading ? (
                            <>
                                <ActivityIndicator size="large" color="#4F46E5" />
                                <Text style={tw`text-gray-500 text-lg mt-4`}>Carregando notificações...</Text>
                            </>
                        ) : (
                            <>
                                <Feather name="bell-off" size={48} color="#9CA3AF" />
                                <Text style={tw`text-gray-500 text-lg mt-4`}>Nenhuma notificação</Text>
                                <Text style={tw`text-gray-400 text-sm mt-1`}>
                                    {filter === 'unread' ? 'Todas as notificações foram lidas' : 'Você está em dia!'}
                                </Text>
                            </>
                        )}
                    </View>
                )}
            />
        </View>
    );
}

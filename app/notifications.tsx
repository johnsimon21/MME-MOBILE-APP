import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { formatMessageTime } from '@/src/utils/dateFormatter';
import { Navbar } from '@/src/presentation/components/ui/navbar';
import { useRouter } from 'expo-router';

interface Notification {
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

export default function NotificationScreen() {
    const router = useRouter();

    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            type: 'session',
            title: 'Nova Sessão Iniciada',
            message: 'Sessão com Lukombo Afonso foi iniciada',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            isRead: false,
            priority: 'high',
            actionData: {
                userId: 1,
                userName: 'Lukombo Afonso',
                sessionId: 'session_1',
                userPhoto: null
            }
        },
        {
            id: '2',
            type: 'message',
            title: 'Nova Mensagem',
            message: 'Cardoso Manuel enviou uma mensagem',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            isRead: false,
            priority: 'medium',
            actionData: {
                userId: 2,
                userName: 'Cardoso Manuel',
                chatId: 'chat_2',
                userPhoto: null
            }
        },
        {
            id: '3',
            type: 'call',
            title: 'Chamada Perdida',
            message: 'Você perdeu uma chamada de Lucy Script',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            isRead: true,
            priority: 'high',
            actionData: {
                userId: 3,
                userName: 'Lucy Script',
                userPhoto: null
            }
        },
        {
            id: '4',
            type: 'session',
            title: 'Sessão Finalizada',
            message: 'Sessão com Java Simon foi concluída (45 min)',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            isRead: true,
            priority: 'medium',
            actionData: {
                userId: 4,
                userName: 'Java Simon',
                sessionId: 'session_4',
                userPhoto: null
            }
        },
        {
            id: '5',
            type: 'reminder',
            title: 'Lembrete de Sessão',
            message: 'Você tem uma sessão agendada em 30 minutos',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            isRead: false,
            priority: 'medium'
        },
        {
            id: '6',
            type: 'system',
            title: 'Backup Concluído',
            message: 'Backup automático dos seus dados foi realizado com sucesso',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            isRead: true,
            priority: 'low'
        },
        {
            id: '7',
            type: 'message',
            title: 'Arquivo Recebido',
            message: 'Lukombo Afonso enviou um documento',
            timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
            isRead: true,
            priority: 'medium',
            actionData: {
                userId: 1,
                userName: 'Lukombo Afonso',
                chatId: 'chat_1',
                userPhoto: null
            }
        }
    ]);

    const [filter, setFilter] = useState<'all' | 'unread' | 'session' | 'message' | 'call'>('all');

    // Filter notifications
    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !notification.isRead;
        return notification.type === filter;
    });

    // Get unread count
    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Mark notification as read
    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === id ? { ...notification, isRead: true } : notification
            )
        );
    };

    // Mark all as read
    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(notification => ({ ...notification, isRead: true }))
        );
    };

    // Delete notification
    const deleteNotification = (id: string) => {
        Alert.alert(
            "Excluir Notificação",
            "Tem certeza que deseja excluir esta notificação?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: () => {
                        setNotifications(prev => prev.filter(n => n.id !== id));
                    }
                }
            ]
        );
    };

    // Enhanced navigation handler
    const handleNotificationAction = (notification: Notification) => {
        markAsRead(notification.id);

        switch (notification.type) {
            case 'message':
                router.push('/(tabs)/messages');
                break;

            case 'call':
                if (notification.actionData?.userId && notification.actionData?.userName) {
                    router.push({
                        pathname: '/normal-call',
                        params: {
                            userId: notification.actionData.userId.toString(),
                            userName: notification.actionData.userName,
                            userPhoto: notification.actionData.userPhoto || ''
                        }
                    });
                }
                break;

            case 'session':
                router.push('/(tabs)/session');
                break;

            case 'reminder':
                if (notification.message.includes('sessão agendada')) {
                    router.push('/(tabs)/session');
                } else {
                    Alert.alert("Lembrete", notification.message, [{ text: "OK" }]);
                }
                break;

            case 'system':
                router.push('/settings');
                break;

            default:
                console.log('Unknown notification type:', notification.type);
                break;
        }
    };


    // Get notification icon
    const getNotificationIcon = (type: string, priority: string) => {
        const iconColor = priority === 'high' ? '#EF4444' : priority === 'medium' ? '#F59E0B' : '#6B7280';

        switch (type) {
            case 'session':
                return <MaterialIcons name="group" size={24} color={iconColor} />;
            case 'message':
                return <Feather name="message-circle" size={24} color={iconColor} />;
            case 'call':
                return <Feather name="phone" size={24} color={iconColor} />;
            case 'reminder':
                return <Feather name="clock" size={24} color={iconColor} />;
            case 'system':
                return <Feather name="settings" size={24} color={iconColor} />;
            default:
                return <Feather name="bell" size={24} color={iconColor} />;
        }
    };

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
            style={tw`flex justify-center items-center px-4 py-2 rounded-full mr-2 ${filter === filterType ? 'bg-[#4F46E5]' : 'bg-gray-200'
                }`}
            onPress={() => setFilter(filterType)}
        >
            <Text style={tw`text-xs ${filter === filterType ? 'text-white' : 'text-gray-700'
                } font-medium`}>
                {label} {count !== undefined && count > 0 && `(${count})`}
            </Text>
        </TouchableOpacity>
    );

    // Notification item component
    const NotificationItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={tw`bg-white p-4 mb-2 rounded-xl ${!item.isRead ? 'border-l-4 border-[#4F46E5]' : ''}`}
            onPress={() => handleNotificationAction(item)}
        >
            <View style={tw`flex-row items-start`}>
                <View style={tw`w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-3`}>
                    {getNotificationIcon(item.type, item.priority)}
                </View>

                <View style={tw`flex-1`}>
                    <View style={tw`flex-row items-center justify-between mb-1`}>
                        <Text style={tw`font-bold text-gray-800 flex-1`} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text style={tw`text-xs text-gray-500 ml-2`}>
                            {formatMessageTime(item.timestamp)}
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
                                {item.type === 'session' ? 'Sessão' :
                                    item.type === 'message' ? 'Mensagem' :
                                        item.type === 'call' ? 'Chamada' :
                                            item.type === 'reminder' ? 'Lembrete' : 'Sistema'}
                            </Text>
                            {/* Show target user name if available */}
                            {item.actionData?.userName && (
                                <Text style={tw`text-xs text-gray-400 ml-1`}>
                                    • {item.actionData.userName}
                                </Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={tw`p-1`}
                            onPress={(e) => {
                                e.stopPropagation(); // Prevent navigation when deleting
                                deleteNotification(item.id);
                            }}
                        >
                            <Feather name="x" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={tw`flex-1 bg-[#F7F7F7]`}>
            <Navbar title="Notificações" showBackButton={true} />

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
                        filterType="session"
                        label="Sessões"
                        count={notifications.filter(n => n.type === 'session').length}
                    />
                    <FilterButton
                        filterType="message"
                        label="Mensagens"
                        count={notifications.filter(n => n.type === 'message').length}
                    />
                    <FilterButton
                        filterType="call"
                        label="Chamadas"
                        count={notifications.filter(n => n.type === 'call').length}
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
                ListEmptyComponent={() => (
                    <View style={tw`items-center justify-center py-12`}>
                        <Feather name="bell-off" size={48} color="#9CA3AF" />
                        <Text style={tw`text-gray-500 text-lg mt-4`}>Nenhuma notificação</Text>
                        <Text style={tw`text-gray-400 text-sm mt-1`}>
                            {filter === 'unread' ? 'Todas as notificações foram lidas' : 'Você está em dia!'}
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}


import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { formatSessionTime, transformSessionDates } from '@/src/utils/sessionUtils';
import { chatUtils } from '@/src/utils/chatUtils';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Modal,
    Platform,
    Dimensions,
    StatusBar,
    StyleSheet,
    SafeAreaView,
    Pressable,
    Animated,
    Vibration,
} from 'react-native';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Context and Hooks
import { useAuthState } from '@/src/hooks/useAuthState';
import { useConnections } from '@/src/hooks/useConnections';
import { useUsers } from '@/src/hooks/useUsers';
import { useChatContext } from '@/src/context/ChatContext';
import { useNotificationContextSafe } from "@/src/context/NotificationContext";

// Interfaces
import { UserRole } from '@/src/interfaces/index.interface';
import { IUser } from '@/src/interfaces/user.interface';
import { IConnectionResponse } from '@/src/interfaces/connections.interface';
import { ChatType } from '@/src/interfaces/chat.interface';

// Components
import { EnhancedFilterModal } from '@/src/presentation/components/ui/EnhancedFilterModal';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH > 768;

interface EnhancedUser extends IUser {
    connectionStatus: 'none' | 'pending' | 'accepted' | 'blocked';
    connectionType?: 'sent' | 'received';
    connectionId?: string;
    canCancel?: boolean;
    mutualConnections?: number;
}

// Union type for FlatList data
type ListItemData = EnhancedUser | IConnectionResponse;

interface TabItem {
    key: 'discover' | 'friends' | 'requests' | 'sent';
    title: string;
    icon: string;
    badge?: number;
}

export function HomeScreen() {
    const navigation = useNavigation();
    const router = useRouter();
    const notificationContext = useNotificationContextSafe();
    const { user } = useAuth();
    const isMentor = user?.role === UserRole.MENTOR;
    const { getAvailableUsers } = useUsers();
    const { createChat } = useChatContext();

    const {
        sendConnectionRequest,
        cancelConnectionRequest,
        getConnectionStatus,
        acceptConnectionRequest,
        rejectConnectionRequest,
        getReceivedRequests,
        getSentRequests,
        getUserFriends,
    } = useConnections();

    // State Management
    const [activeTab, setActiveTab] = useState<'discover' | 'friends' | 'requests' | 'sent'>('discover');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Simple loading guard
    const isLoadingRef = useRef(false);

    // Data State
    const [availableUsers, setAvailableUsers] = useState<EnhancedUser[]>([]);
    const [friends, setFriends] = useState<IConnectionResponse[]>([]);
    const [receivedRequests, setReceivedRequests] = useState<IConnectionResponse[]>([]);
    const [sentRequests, setSentRequests] = useState<IConnectionResponse[]>([]);

    // UI State
    const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [filterModalVisible, setFilterModalVisible] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        userType: null as "Mentor" | "Mentorado" | null,
        status: null as "Disponível" | "Indisponível" | null,
        location: null as string | null,
    });

    // Animation values - use useRef to persist across re-renders
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;


    const handleViewProfile = (userId: string) => {
        // @ts-ignore
        navigation.navigate('UserProfile', { userId });
    };

    // Get notification count from context
    const notificationCount = notificationContext?.unreadCount || 0;


    const navigateToNotifications = () => {
        router.push('/notifications');
    };

    // Tab configuration
    const tabs: TabItem[] = useMemo(() => [
        {
            key: 'discover',
            title: 'Descobrir',
            icon: 'search',
        },
        {
            key: 'friends',
            title: 'Amigos',
            icon: 'users',
            badge: friends.length,
        },
        {
            key: 'requests',
            title: 'Recebidas',
            icon: 'user-plus',
            badge: receivedRequests.length,
        },
        {
            key: 'sent',
            title: 'Enviadas',
            icon: 'send',
            badge: sentRequests.length,
        },
    ], [friends.length, receivedRequests.length, sentRequests.length]);

    // Simplified load data function without complex throttling
    const loadData = useCallback(async (refresh = false) => {
        // Prevent multiple simultaneous loads
        if (isLoadingRef.current) {
            console.log('🚫 Already loading, skipping...');
            return;
        }

        try {
            console.log('🔄 Starting data load...', { refresh, userId: user?.uid });
            isLoadingRef.current = true;

            if (refresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            if (!user?.uid) {
                throw new Error('User not authenticated');
            }

            // Load data sequentially with minimal delays
            console.log('📡 Loading available users...');
            const availableResponse = await getAvailableUsers(user.uid, { page: 1, limit: 20 });

            console.log('📡 Loading user friends...');
            const friendsResponse = await getUserFriends(user.uid);

            console.log('📡 Loading received requests...');
            const requestsResponse = await getReceivedRequests();

            console.log('📡 Loading sent requests...');
            const sentResponse = await getSentRequests();

            // Process available users
            console.log(`✅ Processing ${availableResponse.users.length} available users`);

            const enhancedUsers: EnhancedUser[] = availableResponse.users.map((user: IUser): EnhancedUser => ({
                ...user,
                connectionStatus: 'none',
                mutualConnections: 0,
            }));

            // Update state
            setAvailableUsers(enhancedUsers);
            setFriends(friendsResponse.connections || []);
            setReceivedRequests(requestsResponse.connections || []);
            setSentRequests(sentResponse.connections || []);

            console.log('✅ Data loaded successfully!', {
                users: enhancedUsers.length,
                friends: friendsResponse.connections?.length || 0,
                requests: requestsResponse.connections?.length || 0,
                sent: sentResponse.connections?.length || 0
            });

        } catch (error: any) {
            console.error('❌ Error loading data:', error);
            setError(error.message || 'Erro ao carregar dados');
        } finally {
            console.log('🏁 Finishing data load...');
            isLoadingRef.current = false;
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user?.uid, getAvailableUsers, getUserFriends, getReceivedRequests, getSentRequests]);

    // Initial load - only once when component mounts and user is available
    const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

    useEffect(() => {
        if (user?.uid && !hasInitiallyLoaded) {
            console.log('🚀 Initial data load triggered for user:', user.uid);
            setHasInitiallyLoaded(true);
            loadData(false);
        }
    }, [user?.uid]); // Only depend on user ID

    useFocusEffect(
        useCallback(() => {
            // DISABLED: No animation or automatic refresh on focus to prevent rate limiting
            // Data will only refresh on manual pull-to-refresh or initial load
            console.log('🎯 Screen focused - using existing data to prevent rate limiting');
        }, [])
    );

    // Lazy load connection status for a specific user
    const loadConnectionStatus = async (targetUserId: string) => {
        try {
            const status = await getConnectionStatus(targetUserId);

            setAvailableUsers(prev =>
                prev.map(user =>
                    user.uid === targetUserId
                        ? {
                            ...user,
                            connectionStatus: status.status as any,
                            connectionType: status.type as any,
                            connectionId: status.connectionId,
                            canCancel: status.type === 'sent'
                        }
                        : user
                )
            );
        } catch (error) {
            console.warn(`Failed to load connection status for ${targetUserId}:`, error);
        }
    };

    // Connection Request Handlers
    const handleSendConnectionRequest = async (targetUserId: string) => {
        try {
            // Haptic feedback
            if (Platform.OS === 'ios') {
                Vibration.vibrate(10);
            }

            setProcessingRequests(prev => new Set([...prev, targetUserId]));

            await sendConnectionRequest(targetUserId);

            // Update user status locally for immediate UI feedback
            setAvailableUsers(prev =>
                prev.map(user =>
                    user.uid === targetUserId
                        ? { ...user, connectionStatus: 'pending', connectionType: 'sent', canCancel: true }
                        : user
                )
            );

            Alert.alert('Sucesso', 'Solicitação de conexão enviada!');
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Falha ao enviar solicitação');
        } finally {
            setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(targetUserId);
                return newSet;
            });
        }
    };

    const handleAcceptRequest = async (connectionId: string, requesterId: string) => {
        try {
            setProcessingRequests(prev => new Set([...prev, connectionId]));

            await acceptConnectionRequest(connectionId);

            // Move from requests to friends
            const acceptedRequest = receivedRequests.find(req => req.id === connectionId);
            if (acceptedRequest) {
                setReceivedRequests(prev => prev.filter(req => req.id !== connectionId));
                setFriends(prev => [...prev, acceptedRequest]);
            }

            Alert.alert('Sucesso', 'Conexão aceita!');
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Falha ao aceitar conexão');
        } finally {
            setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(connectionId);
                return newSet;
            });
        }
    };

    const handleRejectRequest = async (connectionId: string, requesterId: string) => {
        try {
            setProcessingRequests(prev => new Set([...prev, connectionId]));

            await rejectConnectionRequest(connectionId);

            setReceivedRequests(prev => prev.filter(req => req.id !== connectionId));

            Alert.alert('Sucesso', 'Solicitação rejeitada');
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Falha ao rejeitar solicitação');
        } finally {
            setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(connectionId);
                return newSet;
            });
        }
    };

    const handleCancelRequest = async (connectionId: string) => {
        try {
            setProcessingRequests(prev => new Set([...prev, connectionId]));

            await cancelConnectionRequest(connectionId);

            setSentRequests(prev => prev.filter(req => req.id !== connectionId));

            Alert.alert('Sucesso', 'Solicitação cancelada');
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Falha ao cancelar solicitação');
        } finally {
            setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(connectionId);
                return newSet;
            });
        }
    };

    // Start a general chat with a connected user
    const handleStartChat = async (userId: string, userName: string) => {
        try {
            // Create a general chat
            const newChat = await createChat({
                type: ChatType.GENERAL,
                participantId: userId
            });

            // Navigate to the chat
            // @ts-ignore
            navigation.navigate('ChatScreen', { chat: newChat });
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Falha ao iniciar conversa');
        }
    };

    // Apply filters to available users
    const applyUserFilters = useCallback((users: EnhancedUser[]) => {
        return users.filter(user => {
            // User type filter
            if (filters.userType) {
                const targetRole = filters.userType === 'Mentor' ? UserRole.MENTOR : UserRole.MENTEE;
                if (user.role !== targetRole) return false;
            }

            // Location filter
            if (filters.location && user.province !== filters.location) {
                return false;
            }

            return true;
        });
    }, [filters]);

    // Filter data based on search and active tab
    const filteredData = useMemo(() => {
        let data: any[] = [];

        switch (activeTab) {
            case 'discover':
                let filteredUsers = applyUserFilters(availableUsers);
                data = filteredUsers.filter(user =>
                    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.municipality.toLowerCase().includes(searchQuery.toLowerCase())
                );
                break;
            case 'friends':
                data = friends.filter(friend =>
                    friend.connectedUser?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
                );
                break;
            case 'requests':
                data = receivedRequests.filter(request =>
                    request.connectedUser?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
                );
                break;
            case 'sent':
                data = sentRequests.filter(request =>
                    request.connectedUser?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
                );
                break;
        }

        return data;
    }, [activeTab, availableUsers, friends, receivedRequests, sentRequests, searchQuery, applyUserFilters]);

    // Custom Navigation Header - using useCallback to prevent unnecessary re-renders
    const renderHeader = useCallback(() => (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
            <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <View style={styles.welcomeSection}>
                            <Text style={styles.welcomeText}>
                                Olá, {user?.firebaseClaims.name?.split(' ')[0] || 'Usuário'}
                            </Text>
                            <Text style={styles.subtitleText}>
                                Conecte-se com outros {isMentor ? 'mentees' : 'mentores'}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.notificationButton}
                            onPress={() => navigateToNotifications()}
                        >
                            <Ionicons name="notifications-outline" size={24} color="white" />
                            {notificationCount > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationBadgeText}>
                                        {notificationCount > 9 ? '9+' : notificationCount.toString()}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <Feather name="search" size={20} color="#9CA3AF" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar pessoas..."
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                returnKeyType="search"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Feather name="x" size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={() => setFilterModalVisible(true)}
                        >
                            <Feather name="filter" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </>
    ), [user?.firebaseClaims.name, isMentor, receivedRequests.length, searchQuery]);

    // Tab Navigation
    const renderTabNavigation = () => (
        <View style={styles.tabContainer}>
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab.key}
                    style={[
                        styles.tabItem,
                        activeTab === tab.key && styles.tabItemActive,
                    ]}
                    onPress={() => setActiveTab(tab.key)}
                    activeOpacity={0.7}
                >
                    <View style={styles.tabIconContainer}>
                        <Feather
                            name={tab.icon as any}
                            size={20}
                            color={activeTab === tab.key ? '#4F46E5' : '#6B7280'}
                        />
                        {tab.badge !== undefined && tab.badge > 0 && (
                            <View style={styles.tabBadge}>
                                <Text style={styles.tabBadgeText}>
                                    {tab.badge > 99 ? '99+' : String(tab.badge)}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={[
                        styles.tabText,
                        activeTab === tab.key && styles.tabTextActive,
                    ]}>
                        {tab.title}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    // User Card for Discover Tab
    const renderUserCard = ({ item }: { item: EnhancedUser }) => (
        <Pressable
            style={({ pressed }) => [
                styles.userCard,
                pressed && styles.userCardPressed,
            ]}
            onPress={() => handleViewProfile(item.uid)}
        >
            <View style={styles.userCardHeader}>
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {item.fullName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    {/* Online Status Indicator */}
                    <View style={[styles.statusIndicator, styles.statusOnline]} />
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                        {item.fullName}
                    </Text>
                    <View style={styles.userMeta}>
                        <View style={styles.roleContainer}>
                            <MaterialIcons
                                name={item.role === UserRole.MENTOR ? 'school' : 'person'}
                                size={16}
                                color="#6B7280"
                            />
                            <Text style={styles.roleText}>
                                {item.role === UserRole.MENTOR ? 'Mentor' : 'Mentorado'}
                            </Text>
                        </View>
                        <View style={styles.locationContainer}>
                            <Feather name="map-pin" size={14} color="#6B7280" />
                            <Text style={styles.locationText} numberOfLines={1}>
                                {item.municipality}
                            </Text>
                        </View>
                    </View>
                    {item.school && (
                        <Text style={styles.schoolText} numberOfLines={1}>
                            {item.school}
                        </Text>
                    )}
                </View>

                {/* Connection Action Button */}
                <View style={styles.actionContainer}>
                    {processingRequests.has(item.uid) ? (
                        <ActivityIndicator size="small" color="#4F46E5" />
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                item.connectionStatus === 'pending' && styles.actionButtonPending,
                            ]}
                            onPress={async () => {
                                // First, check actual connection status if not already checked
                                if (item.connectionStatus === 'none') {
                                    await loadConnectionStatus(item.uid);
                                    // After loading status, check if we can still send request
                                    const updatedUser = availableUsers.find(u => u.uid === item.uid);
                                    if (updatedUser?.connectionStatus !== 'none') {
                                        return; // Don't send request if already connected/pending
                                    }
                                }

                                // Only send request if status is 'none'
                                if (item.connectionStatus === 'none') {
                                    handleSendConnectionRequest(item.uid);
                                }
                            }}
                            disabled={item.connectionStatus === 'pending' || item.connectionStatus === 'accepted'}
                        >
                            <Feather
                                name={
                                    item.connectionStatus === 'pending' ? 'clock' :
                                        item.connectionStatus === 'accepted' ? 'check' : 'user-plus'
                                }
                                size={16}
                                color={
                                    item.connectionStatus === 'pending' ? '#F59E0B' :
                                        item.connectionStatus === 'accepted' ? '#10B981' : 'white'
                                }
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Additional Info */}
            {item.mutualConnections && item.mutualConnections > 0 && (
                <View style={styles.mutualConnectionsContainer}>
                    <Feather name="users" size={14} color="#6B7280" />
                    <Text style={styles.mutualConnectionsText}>
                        {item.mutualConnections} conexões em comum
                    </Text>
                </View>
            )}
        </Pressable>
    );

    // Friend Card
    const renderFriendCard = ({ item: friend }: { item: IConnectionResponse }) => (
        <Pressable
            style={({ pressed }) => [
                styles.userCard,
                pressed && styles.userCardPressed,
            ]}
            onPress={() => handleViewProfile(friend.connectedUser.uid)}
        >
            <View style={styles.userCardHeader}>
                <View style={styles.avatarContainer}>
                    {friend.connectedUser.image ? (
                        <Image source={{ uri: friend.connectedUser.image }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {friend.connectedUser.fullName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <View style={[styles.statusIndicator, styles.statusOnline]} />
                </View>

                <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                        {friend.connectedUser.fullName}
                    </Text>
                    <View style={styles.userMeta}>
                        <View style={styles.roleContainer}>
                            <MaterialIcons
                                name={friend.connectedUser.role === UserRole.MENTOR ? 'school' : 'person'}
                                size={16}
                                color="#6B7280"
                            />
                            <Text style={styles.roleText}>
                                {friend.connectedUser.role === UserRole.MENTOR ? 'Mentor' : 'Mentorado'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.connectionDate}>
                        Conectado em {chatUtils.formatMessageTime(friend.createdAt) || 'Data não disponível'}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.messageButton}
                    onPress={() => handleStartChat(friend.connectedUser.uid, friend.connectedUser.fullName)}
                >
                    <Feather name="message-circle" size={20} color="#4F46E5" />
                </TouchableOpacity>
            </View>
        </Pressable>
    );

    // Request Card
    const renderRequestCard = ({ item: request }: { item: IConnectionResponse }) => (
        <View style={styles.requestCard}>
            <View style={styles.userCardHeader}>
                <View style={styles.avatarContainer}>
                    {request.connectedUser?.image ? (
                        <Image source={{ uri: request.connectedUser.image }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {request.connectedUser?.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                        {request.connectedUser?.fullName || 'Usuário não encontrado'}
                    </Text>
                    <View style={styles.userMeta}>
                        <View style={styles.roleContainer}>
                            <MaterialIcons
                                name={request.connectedUser?.role === UserRole.MENTOR ? 'school' : 'person'}
                                size={16}
                                color="#6B7280"
                            />
                            <Text style={styles.roleText}>
                                {request.connectedUser?.role === UserRole.MENTOR ? 'Mentor' : 'Mentorado'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.requestDate}>
                        {chatUtils.formatMessageTime(request.createdAt) || 'Data não disponível'}
                    </Text>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.requestActions}>
                {processingRequests.has(request.id) ? (
                    <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                    <>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleRejectRequest(request.id, request.connectedUser?.uid)}
                        >
                            <Feather name="x" size={16} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.acceptButton]}
                            onPress={() => handleAcceptRequest(request.id, request.connectedUser?.uid)}
                        >
                            <Feather name="check" size={16} color="white" />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );

    // Sent Request Card with Cancel functionality
    const renderSentRequestCard = ({ item: request }: { item: IConnectionResponse }) => (
        <View style={styles.requestCard}>
            <View style={styles.userCardHeader}>
                <View style={styles.avatarContainer}>
                    {request.connectedUser?.image ? (
                        <Image source={{ uri: request.connectedUser.image }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {request.connectedUser?.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                        {request.connectedUser?.fullName || 'Usuário não encontrado'}
                    </Text>
                    <View style={styles.userMeta}>
                        <View style={styles.roleContainer}>
                            <MaterialIcons
                                name={request.connectedUser?.role === UserRole.MENTOR ? 'school' : 'person'}
                                size={16}
                                color="#6B7280"
                            />
                            <Text style={styles.roleText}>
                                {request.connectedUser?.role === UserRole.MENTOR ? 'Mentor' : 'Mentorado'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.requestDate}>
                        Enviado {chatUtils.formatMessageTime(request.createdAt) || 'Data não disponível'}
                    </Text>
                </View>
            </View>

            {/* Cancel Button */}
            <View style={styles.requestActions}>
                {processingRequests.has(request.id) ? (
                    <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => handleCancelRequest(request.id)}
                    >
                        <Feather name="x" size={16} color="white" />
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    // Empty State
    const renderEmptyState = () => {
        const emptyStates = {
            discover: {
                icon: 'search',
                title: 'Nenhum usuário encontrado',
                subtitle: 'Tente ajustar os filtros de busca',
            },
            friends: {
                icon: 'users',
                title: 'Nenhuma conexão ainda',
                subtitle: 'Comece enviando solicitações de conexão',
            },
            requests: {
                icon: 'inbox',
                title: 'Nenhuma solicitação',
                subtitle: 'Você não possui solicitações pendentes',
            },
            sent: {
                icon: 'send',
                title: 'Nenhuma solicitação enviada',
                subtitle: 'Conecte-se com novos usuários na aba Descobrir',
            },
        };

        const state = emptyStates[activeTab];

        return (
            <View style={styles.emptyState}>
                <Feather name={state.icon as any} size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>{state.title}</Text>
                <Text style={styles.emptySubtitle}>{state.subtitle}</Text>
            </View>
        );
    };

    // Loading State - only show if truly loading and no data
    if (isLoading && availableUsers.length === 0 && friends.length === 0 && receivedRequests.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                {renderHeader()}
                <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={styles.loadingText}>Carregando...</Text>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}
            {renderTabNavigation()}

            {/* Error Message */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={() => setError(null)}>
                        <Feather name="x" size={16} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Content */}
            <FlatList<ListItemData>
                data={filteredData}
                renderItem={({ item, index }) => {
                    switch (activeTab) {
                        case 'discover':
                            return renderUserCard({ item: item as EnhancedUser });
                        case 'friends':
                            return renderFriendCard({ item: item as IConnectionResponse });
                        case 'requests':
                            return renderRequestCard({ item: item as IConnectionResponse });
                        case 'sent':
                            return renderSentRequestCard({ item: item as IConnectionResponse });
                        default:
                            return null;
                    }
                }}
                keyExtractor={(item: any) =>
                    activeTab === 'discover' ? item.uid : item.id
                }
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => loadData(true)} // Manual refresh
                        colors={['#4F46E5']}
                        tintColor="#4F46E5"
                    />
                }
                ListEmptyComponent={renderEmptyState}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                // Performance optimizations
                removeClippedSubviews={Platform.OS === 'android'}
                maxToRenderPerBatch={10}
                initialNumToRender={8}
                windowSize={10}
                getItemLayout={(data, index) => ({
                    length: 88, // Estimated item height
                    offset: 88 * index,
                    index,
                })}
                // Enable optimize for large lists
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            />

            {/* Floating Action Button */}
            {activeTab === 'discover' && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setFilterModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#4F46E5', '#7C3AED']}
                        style={styles.fabGradient}
                    >
                        <Feather name="filter" size={20} color="white" />
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* Enhanced Filter Modal */}
            <EnhancedFilterModal
                visible={filterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                filters={filters}
                setFilters={setFilters}
                onApply={() => {
                    // Apply filters logic if needed
                    console.log('Filters applied:', filters);
                }}
                onReset={() => {
                    setFilters({
                        userType: null,
                        status: null,
                        location: null,
                    });
                }}
            />
        </SafeAreaView>
    );
}

// Native Styles for Cross-Platform Consistency
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10,
        paddingBottom: 20,
    },
    headerContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    welcomeSection: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    subtitleText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    notificationButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    notificationBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#374151',
        paddingVertical: 0,
    },
    filterButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingHorizontal: 4,
        paddingVertical: 8,
        marginHorizontal: 16,
        marginTop: -22,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    tabItemActive: {
        backgroundColor: '#F0F7FF',
    },
    tabIconContainer: {
        position: 'relative',
        marginBottom: 4,
    },
    tabBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    tabBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    tabTextActive: {
        color: '#4F46E5',
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 100,
    },
    userCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    userCardPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.8,
    },
    userCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    avatarPlaceholder: {
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#6B7280',
    },
    statusIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: 'white',
    },
    statusOnline: {
        backgroundColor: '#10B981',
    },
    statusOffline: {
        backgroundColor: '#D1D5DB',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    userMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    roleText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 4,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    locationText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 4,
    },
    schoolText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    actionContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonPending: {
        backgroundColor: '#F59E0B',
    },
    messageButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F7FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mutualConnectionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    mutualConnectionsText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
    },
    requestCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#FEF3C7',
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    connectionDate: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    requestDate: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    requestActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
        gap: 8,
    },
    acceptButton: {
        backgroundColor: '#10B981',
    },
    rejectButton: {
        backgroundColor: '#EF4444',
    },
    cancelButton: {
        backgroundColor: '#F59E0B',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        width: 'auto',
        paddingVertical: 8,
        borderRadius: 20,
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    separator: {
        height: 12,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 12,
    },
    errorContainer: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginHorizontal: 16,
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        flex: 1,
    },
    // Floating Action Button
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    fabGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default HomeScreen;

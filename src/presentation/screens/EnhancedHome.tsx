import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

// Interfaces
import { UserRole } from '@/src/interfaces/index.interface';
import { IUser } from '@/src/interfaces/user.interface';
import { IConnectionResponse } from '@/src/interfaces/connections.interface';

// Components
import { EnhancedFilterModal } from '@/src/presentation/components/ui/EnhancedFilterModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH > 768;

interface EnhancedUser extends IUser {
    connectionStatus: 'none' | 'pending' | 'accepted' | 'blocked';
    connectionType?: 'sent' | 'received';
    connectionId?: string;
    canCancel?: boolean;
    mutualConnections?: number;
}

interface TabItem {
    key: 'discover' | 'friends' | 'requests';
    title: string;
    icon: string;
    badge?: number;
}

export function EnhancedHomeScreen() {
    const navigation = useNavigation();
    const { user, isCoordinator, isMentor, isMentee } = useAuthState();
    const { getAvailableUsers } = useUsers();
    const {
        sendConnectionRequest,
        cancelConnectionRequest,
        getConnectionStatus,
        acceptConnectionRequest,
        rejectConnectionRequest,
        getReceivedRequests,
        getUserFriends,
    } = useConnections();

    // State Management
    const [activeTab, setActiveTab] = useState<'discover' | 'friends' | 'requests'>('discover');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
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
        userType: null as "Mentor" | "Mentee" | null,
        status: null as "Disponível" | "Indisponível" | null,
        location: null as string | null,
    });

    // Animation values
    const fadeAnim = new Animated.Value(0);
    const slideAnim = new Animated.Value(-50);

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
            title: 'Solicitações',
            icon: 'user-plus',
            badge: receivedRequests.length,
        },
    ], [friends.length, receivedRequests.length]);

    // Load initial data
    const loadData = useCallback(async (refresh = false) => {
        try {
            if (refresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            if (!user?.uid) {
                throw new Error('User not authenticated');
            }

            // Load data in parallel
            const [availableResponse, friendsResponse, requestsResponse] = await Promise.all([
                getAvailableUsers(user.uid, { page: 1, limit: 50 }),
                getUserFriends(user.uid),
                getReceivedRequests(),
            ]);

            // Process available users with connection status
            const enhancedUsers = await Promise.all(
                availableResponse.users.map(async (user: IUser): Promise<EnhancedUser> => {
                    try {
                        const status = await getConnectionStatus(user.uid);
                        return {
                            ...user,
                            connectionStatus: status.status as any,
                            connectionType: status.type as any,
                            connectionId: status.connectionId,
                            canCancel: status.type === 'sent',
                            mutualConnections: 0, // TODO: Implement mutual connections count
                        };
                    } catch (error) {
                        return {
                            ...user,
                            connectionStatus: 'none',
                            mutualConnections: 0,
                        };
                    }
                })
            );

            setAvailableUsers(enhancedUsers);
            setFriends(friendsResponse.connections || []);
            setReceivedRequests(requestsResponse.connections || []);

        } catch (error: any) {
            console.error('Error loading data:', error);
            setError(error.message || 'Erro ao carregar dados');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user?.uid, getAvailableUsers, getUserFriends, getReceivedRequests, getConnectionStatus]);

    // Initial load and focus refresh
    useEffect(() => {
        loadData();
    }, []);

    useFocusEffect(
        useCallback(() => {
            // Animate in
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Refresh data when screen comes into focus
            if (user?.uid) {
                loadData(true);
            }
        }, [loadData, user?.uid])
    );

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
                    request.requester?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
                );
                break;
        }
        
        return data;
    }, [activeTab, availableUsers, friends, receivedRequests, searchQuery, applyUserFilters]);

    // Custom Navigation Header
    const renderHeader = () => (
        <SafeAreaView style={styles.headerContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
            <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradient}
            >
                <Animated.View 
                    style={[
                        styles.headerContent,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }
                    ]}
                >
                    <View style={styles.headerTop}>
                        <View style={styles.welcomeSection}>
                            <Text style={styles.welcomeText}>Olá, {user?.fullName?.split(' ')[0]}</Text>
                            <Text style={styles.subtitleText}>Conecte-se com outros {isMentor ? 'mentees' : 'mentores'}</Text>
                        </View>
                        
                        <TouchableOpacity
                            style={styles.notificationButton}
                            onPress={() => {/* TODO: Navigate to notifications */}}
                        >
                            <Ionicons name="notifications-outline" size={24} color="white" />
                            {receivedRequests.length > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationBadgeText}>
                                        {receivedRequests.length}
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
                </Animated.View>
            </LinearGradient>
        </SafeAreaView>
    );

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
                                    {tab.badge > 99 ? '99+' : tab.badge}
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
    const renderUserCard = ({ item: user }: { item: EnhancedUser }) => (
        <Pressable
            style={({ pressed }) => [
                styles.userCard,
                pressed && styles.userCardPressed,
            ]}
            onPress={() => navigation.navigate('UserProfile', { userId: user.uid })}
        >
            <View style={styles.userCardHeader}>
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    {user.image ? (
                        <Image source={{ uri: user.image }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {user.fullName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    {/* Online Status Indicator */}
                    <View style={[styles.statusIndicator, styles.statusOnline]} />
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                        {user.fullName}
                    </Text>
                    <View style={styles.userMeta}>
                        <View style={styles.roleContainer}>
                            <MaterialIcons 
                                name={user.role === UserRole.MENTOR ? 'school' : 'person'} 
                                size={16} 
                                color="#6B7280" 
                            />
                            <Text style={styles.roleText}>
                                {user.role === UserRole.MENTOR ? 'Mentor' : 'Mentee'}
                            </Text>
                        </View>
                        <View style={styles.locationContainer}>
                            <Feather name="map-pin" size={14} color="#6B7280" />
                            <Text style={styles.locationText} numberOfLines={1}>
                                {user.municipality}
                            </Text>
                        </View>
                    </View>
                    {user.school && (
                        <Text style={styles.schoolText} numberOfLines={1}>
                            {user.school}
                        </Text>
                    )}
                </View>

                {/* Connection Action Button */}
                <View style={styles.actionContainer}>
                    {processingRequests.has(user.uid) ? (
                        <ActivityIndicator size="small" color="#4F46E5" />
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                user.connectionStatus === 'pending' && styles.actionButtonPending,
                            ]}
                            onPress={() => handleSendConnectionRequest(user.uid)}
                            disabled={user.connectionStatus !== 'none'}
                        >
                            <Feather
                                name={
                                    user.connectionStatus === 'pending' ? 'clock' : 
                                    user.connectionStatus === 'accepted' ? 'check' : 'user-plus'
                                }
                                size={16}
                                color={
                                    user.connectionStatus === 'pending' ? '#F59E0B' :
                                    user.connectionStatus === 'accepted' ? '#10B981' : 'white'
                                }
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Additional Info */}
            {user.mutualConnections && user.mutualConnections > 0 && (
                <View style={styles.mutualConnectionsContainer}>
                    <Feather name="users" size={14} color="#6B7280" />
                    <Text style={styles.mutualConnectionsText}>
                        {user.mutualConnections} conexões em comum
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
            onPress={() => navigation.navigate('UserProfile', { userId: friend.connectedUser.uid })}
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
                                {friend.connectedUser.role === UserRole.MENTOR ? 'Mentor' : 'Mentee'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.connectionDate}>
                        Conectado em {new Date(friend.createdAt).toLocaleDateString('pt-BR')}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.messageButton}
                    onPress={() => {/* TODO: Start chat */}}
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
                    {request.requester?.image ? (
                        <Image source={{ uri: request.requester.image }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {request.requester?.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                        {request.requester?.fullName || 'Usuário não encontrado'}
                    </Text>
                    <View style={styles.userMeta}>
                        <View style={styles.roleContainer}>
                            <MaterialIcons 
                                name={request.requester?.role === UserRole.MENTOR ? 'school' : 'person'} 
                                size={16} 
                                color="#6B7280" 
                            />
                            <Text style={styles.roleText}>
                                {request.requester?.role === UserRole.MENTOR ? 'Mentor' : 'Mentee'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.requestDate}>
                        {new Date(request.createdAt).toLocaleDateString('pt-BR')}
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
                            onPress={() => handleRejectRequest(request.id, request.requester?.uid)}
                        >
                            <Feather name="x" size={16} color="white" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.actionButton, styles.acceptButton]}
                            onPress={() => handleAcceptRequest(request.id, request.requester?.uid)}
                        >
                            <Feather name="check" size={16} color="white" />
                        </TouchableOpacity>
                    </>
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

    // Loading State
    if (isLoading) {
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
        <View style={styles.container}>
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
            <FlatList
                data={filteredData}
                renderItem={
                    activeTab === 'discover' ? renderUserCard :
                    activeTab === 'friends' ? renderFriendCard :
                    renderRequestCard
                }
                keyExtractor={(item: any) => 
                    activeTab === 'discover' ? item.uid : item.id
                }
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => loadData(true)}
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
        </View>
    );
}

// Native Styles for Cross-Platform Consistency
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerContainer: {
        backgroundColor: '#4F46E5',
    },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0,
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
        marginTop: -12,
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

export { EnhancedHomeScreen };

import { useAuthState } from "@/src/hooks/useAuthState";
import { useConnections } from "@/src/hooks/useConnections";
import { useUsers } from "@/src/hooks/useUsers";
import { UserRole } from "@/src/interfaces/index.interface";
import { IUser } from "@/src/interfaces/user.interface";
import { FilterModal } from "@/src/presentation/components/ui/FilterModal";
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import * as React from "react";
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import tw from 'twrnc';
import { Navbar } from "../components/ui/navbar";
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Enhanced interface to include connection status
interface EnhancedUser extends IUser {
    id: string;
    name: string;
    photo: string | null;
    location: string;
    mentorias: number;
    programCount: number;
    userType: "Mentor" | "Mentorado";
    status: "Disponível" | "Indisponível";
    // ✅ NEW: Connection status fields
    connectionStatus: 'none' | 'pending' | 'accepted' | 'blocked';
    connectionType?: 'sent' | 'received';
    connectionId?: string;
    canCancel?: boolean;
    mutualConnections?: number;
}

export function HomeScreen() {
    const navigation = useNavigation();
    const { getAvailableUsers } = useUsers(); // ✅ Use getAvailableUsers instead of getUsers
    const {
        sendConnectionRequest,
        cancelConnectionRequest,
        getConnectionStatus,
        acceptConnectionRequest,
        rejectConnectionRequest,
        getReceivedRequests
    } = useConnections();
    const { user, isAuthenticated } = useAuthState();

    // State management
    const [filterModalVisible, setFilterModalVisible] = React.useState(false);
    const [filters, setFilters] = React.useState({
        userType: null as "Mentor" | "Mentorado" | null,
        status: null as "Disponível" | "Indisponível" | null,
        location: null as string | null,
    });
    const [searchQuery, setSearchQuery] = React.useState("");
    const [allUsers, setAllUsers] = React.useState<IUser[]>([]);
    const [filteredUsers, setFilteredUsers] = React.useState<EnhancedUser[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    // ✅ NEW: Enhanced connection state management
    const [connectionRequests, setConnectionRequests] = React.useState<Set<string>>(new Set());
    const [connectionStatuses, setConnectionStatuses] = React.useState<Map<string, {
        status: string;
        type?: string;
        connectionId?: string;
        canCancel?: boolean;
    }>>(new Map());

    // ✅ NEW: Received connection requests state
    const [receivedRequests, setReceivedRequests] = React.useState<any[]>([]);
    const [showRequestsModal, setShowRequestsModal] = React.useState(false);
    const [requestsLoading, setRequestsLoading] = React.useState(false);
    const [processingRequests, setProcessingRequests] = React.useState<Set<string>>(new Set());

    // ✅ NEW: Fetch available users (non-connections)
    const fetchAvailableUsers = async (refresh = false) => {
        try {
            if (refresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            console.log('🔄 Fetching available users from backend...');

            if (!user?.uid) {
                throw new Error('User not authenticated');
            }

            const response = await getAvailableUsers(user.uid, {
                page: 1,
                limit: 50,
                // Apply current filters
                ...(filters.userType && {
                    role: filters.userType === "Mentor" ? UserRole.MENTOR : UserRole.MENTEE
                }),
                ...(searchQuery && { search: searchQuery }),
                ...(filters.location && { municipality: filters.location }),
            });

            console.log('✅ Available users fetched successfully:', response.users.length);
            setAllUsers(response.users);

        } catch (error) {
            console.error('❌ Error fetching available users:', error);
            Alert.alert('Erro', 'Falha ao carregar usuários disponíveis');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // ✅ NEW: Fetch connection status for multiple users
    const fetchConnectionStatuses = async (userIds: string[]) => {
        try {
            const statusPromises = userIds.map(async (userId) => {
                try {
                    const status = await getConnectionStatus(userId);
                    return { userId, status };
                } catch (error) {
                    console.warn(`Failed to get connection status for ${userId}:`, error);
                    return { userId, status: { status: 'none' } };
                }
            });

            const results = await Promise.allSettled(statusPromises);
            const newStatuses = new Map(connectionStatuses);

            results.forEach((result) => {
                if (result.status === 'fulfilled') {
                    newStatuses.set(result.value.userId, result.value.status);
                }
            });

            setConnectionStatuses(newStatuses);
        } catch (error) {
            console.error('❌ Error fetching connection statuses:', error);
        }
    };

    // Transform IUser to EnhancedUser format with connection status
    const transformUser = (user: IUser): EnhancedUser => {
        const connectionStatus = connectionStatuses.get(user.uid) || { status: 'none' };

        return {
            ...user,
            id: user.uid,
            name: user.fullName,
            photo: user.image || null,
            location: `${user.municipality || ''}, ${user.province || ''}`.replace(/^, |, $/, ''),
            mentorias: user.role === UserRole.MENTOR ? 0 : 0, // TODO: Get real data
            programCount: user.programs?.length || 0,
            userType: user.role === UserRole.MENTOR ? "Mentor" : "Mentorado",
            status: user.role === UserRole.MENTOR && (user.maxMenteeNumber ?? 0) < 15 ? "Disponível" : "Indisponível",

            connectionStatus: connectionStatus.status as any,
            connectionType: connectionStatus.type as any,
            connectionId: connectionStatus.connectionId,
            canCancel: connectionStatus.canCancel,
            mutualConnections: 0 // TODO: Get from API response
        };
    };

    // Load users on component mount
    React.useEffect(() => {
        if (isAuthenticated && user?.uid) {
            fetchAvailableUsers();
            fetchReceivedRequests(); // ✅ NEW: Also fetch received requests
        }
    }, [isAuthenticated, user?.uid]);

    // ✅ NEW: Fetch connection statuses when users change
    React.useEffect(() => {
        if (allUsers.length > 0) {
            const userIds = allUsers.map(u => u.uid);
            fetchConnectionStatuses(userIds);
        }
    }, [allUsers]);

    // ✅ ENHANCED: Handle connection request with better state management
    const handleConnectionRequest = async (userId: string) => {
        try {
            // Add to pending requests immediately for UI feedback
            setConnectionRequests(prev => new Set([...prev, userId]));

            console.log('🔄 Sending connection request to:', userId);

            const response = await sendConnectionRequest(userId);

            // Update connection status
            setConnectionStatuses(prev => new Map(prev.set(userId, {
                status: 'pending',
                type: 'sent',
                connectionId: response.connectionId,
                canCancel: true
            })));

            Alert.alert(
                'Sucesso',
                'Solicitação de conexão enviada com sucesso!',
                [{ text: 'OK' }]
            );

        } catch (error: any) {
            console.error('❌ Error sending connection request:', error);

            // Remove from pending requests on error
            setConnectionRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });

            let errorMessage = 'Falha ao enviar solicitação de conexão';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            Alert.alert('Erro', errorMessage);
        } finally {
            // Remove from pending requests after a delay
            setTimeout(() => {
                setConnectionRequests(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(userId);
                    return newSet;
                });
            }, 1000);
        }
    };

    // ✅ NEW: Handle cancel connection request
    const handleCancelRequest = async (userId: string, connectionId: string) => {
        try {
            setConnectionRequests(prev => new Set([...prev, userId]));

            console.log('🔄 Canceling connection request to:', userId);

            await cancelConnectionRequest(connectionId);

            // Update connection status
            setConnectionStatuses(prev => new Map(prev.set(userId, {
                status: 'none'
            })));

            Alert.alert(
                'Sucesso',
                'Solicitação de conexão cancelada com sucesso!',
                [{ text: 'OK' }]
            );

        } catch (error: any) {
            console.error('❌ Error canceling connection request:', error);
            Alert.alert('Erro', 'Falha ao cancelar solicitação de conexão');
        } finally {
            setConnectionRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };

    // ✅ NEW: Handle accept connection request
    const handleAcceptRequest = async (userId: string, connectionId: string) => {
        try {
            setConnectionRequests(prev => new Set([...prev, userId]));

            console.log('🔄 Accepting connection request from:', userId);

            await acceptConnectionRequest(connectionId);

            // Update connection status
            setConnectionStatuses(prev => new Map(prev.set(userId, {
                status: 'accepted',
                type: 'received',
                connectionId: connectionId,
                canCancel: false
            })));

            Alert.alert(
                'Sucesso',
                'Solicitação de conexão aceita com sucesso!',
                [{ text: 'OK' }]
            );

        } catch (error: any) {
            console.error('❌ Error accepting connection request:', error);
            Alert.alert('Erro', 'Falha ao aceitar solicitação de conexão');
        } finally {
            setConnectionRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };

    // ✅ NEW: Handle reject connection request
    const handleRejectRequest = async (userId: string, connectionId: string) => {
        try {
            setConnectionRequests(prev => new Set([...prev, userId]));

            console.log('🔄 Rejecting connection request from:', userId);

            await rejectConnectionRequest(connectionId);

            // Update connection status
            setConnectionStatuses(prev => new Map(prev.set(userId, {
                status: 'none'
            })));

            Alert.alert(
                'Sucesso',
                'Solicitação de conexão rejeitada com sucesso!',
                [{ text: 'OK' }]
            );

        } catch (error: any) {
            console.error('❌ Error rejecting connection request:', error);
            Alert.alert('Erro', 'Falha ao rejeitar solicitação de conexão');
        } finally {
            setConnectionRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };

    // ✅ NEW: Fetch received connection requests
    const fetchReceivedRequests = async () => {
        try {
            setRequestsLoading(true);
            console.log('🔄 Fetching received connection requests...');

            const response = await getReceivedRequests();
            setReceivedRequests(response.connections || []);

            console.log('✅ Received requests fetched:', response.connections?.length || 0);
        } catch (error) {
            console.error('❌ Error fetching received requests:', error);
            Alert.alert('Erro', 'Não foi possível carregar solicitações de conexão');
        } finally {
            setRequestsLoading(false);
        }
    };

    // ✅ NEW: Handle accept connection request
    const handleAcceptConnectionRequest = async (connectionId: string, requesterId: string) => {
        try {
            setProcessingRequests(prev => new Set([...prev, connectionId]));

            console.log('🔄 Accepting connection request:', connectionId);

            await acceptConnectionRequest(connectionId);

            // Remove from received requests
            setReceivedRequests(prev => prev.filter(req => req.id !== connectionId));

            Alert.alert('Sucesso', 'Solicitação de conexão aceita!');

            // Refresh the available users list to reflect the new connection
            fetchAvailableUsers(true);

        } catch (error: any) {
            console.error('❌ Error accepting connection request:', error);
            Alert.alert('Erro', error.message || 'Não foi possível aceitar a solicitação');
        } finally {
            setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(connectionId);
                return newSet;
            });
        }
    };

    // ✅ NEW: Handle reject connection request  
    const handleRejectConnectionRequest = async (connectionId: string, requesterId: string) => {
        try {
            setProcessingRequests(prev => new Set([...prev, connectionId]));

            console.log('🔄 Rejecting connection request:', connectionId);

            await rejectConnectionRequest(connectionId);

            // Remove from received requests
            setReceivedRequests(prev => prev.filter(req => req.id !== connectionId));

            Alert.alert('Sucesso', 'Solicitação de conexão rejeitada');

        } catch (error: any) {
            console.error('❌ Error rejecting connection request:', error);
            Alert.alert('Erro', error.message || 'Não foi possível rejeitar a solicitação');
        } finally {
            setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(connectionId);
                return newSet;
            });
        }
    };

    const handleViewProfile = (userId: string) => {
        // @ts-ignore
        navigation.navigate('UserProfile', { userId });
    };

    const handleChatOpen = (userId: string) => {
        // @ts-ignore
        navigation.navigate('ChatScreen', { userId });
    };

    // Apply filters function
    const applyFilters = () => {
        let result = allUsers.map(transformUser);

        // Apply search query filter
        if (searchQuery.trim()) {
            result = result.filter(user =>
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.location.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply user type filter
        if (filters.userType) {
            result = result.filter(user => user.userType === filters.userType);
        }

        // Apply status filter
        if (filters.status) {
            result = result.filter(user => user.status === filters.status);
        }

        // Apply location filter
        if (filters.location && filters.location.trim()) {
            result = result.filter(user =>
                user.location.toLowerCase().includes(filters.location!.toLowerCase())
            );
        }

        setFilteredUsers(result);
        setFilterModalVisible(false);
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            userType: null,
            status: null,
            location: null,
        });
        setSearchQuery("");
        setFilterModalVisible(false);
        // Refetch data with no filters
        fetchAvailableUsers();
    };

    // Handle search input changes
    const handleSearch = (text: string) => {
        setSearchQuery(text);
    };

    // Apply filters when dependencies change
    React.useEffect(() => {
        if (allUsers.length > 0) {
            let result = allUsers.map(transformUser);

            // Apply search query filter
            if (searchQuery.trim()) {
                result = result.filter(user =>
                    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.location.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            // Apply user type filter
            if (filters.userType) {
                result = result.filter(user => user.userType === filters.userType);
            }

            // Apply status filter
            if (filters.status) {
                result = result.filter(user => user.status === filters.status);
            }

            // Apply location filter
            if (filters.location && filters.location.trim()) {
                result = result.filter(user =>
                    user.location.toLowerCase().includes(filters.location!.toLowerCase())
                );
            }

            setFilteredUsers(result);
        }
    }, [allUsers, searchQuery, filters.userType, filters.status, filters.location, connectionStatuses]);

    // ✅ NEW: Get button text and style based on connection status
    const getConnectionButtonConfig = (user: EnhancedUser) => {
        const isProcessing = connectionRequests.has(user.id);

        switch (user.connectionStatus) {
            case 'pending':
                if (user.connectionType === 'sent') {
                    return {
                        text: isProcessing ? 'Cancelando...' : 'Cancelar',
                        disabled: isProcessing,
                        style: tw`bg-red-500 border-red-500`,
                        textStyle: tw`text-white`,
                        onPress: () => user.connectionId && handleCancelRequest(user.id, user.connectionId)
                    };
                } else {
                    return {
                        text: isProcessing ? 'Processando...' : 'Aceitar',
                        disabled: isProcessing,
                        style: tw`bg-green-500 border-green-500`,
                        textStyle: tw`text-white`,
                        onPress: () => user.connectionId && handleAcceptRequest(user.id, user.connectionId),
                        // ✅ NEW: Add reject button for received requests
                        secondaryButton: {
                            text: 'Rejeitar',
                            style: tw`bg-red-500 border-red-500 ml-2`,
                            textStyle: tw`text-white`,
                            onPress: () => user.connectionId && handleRejectRequest(user.id, user.connectionId)
                        }
                    };
                }
            case 'accepted':
                return {
                    text: 'Conectado',
                    disabled: true,
                    style: tw`bg-green-100 border-green-300`,
                    textStyle: tw`text-green-700`,
                    onPress: () => handleChatOpen(user.id)
                };
            case 'blocked':
                return {
                    text: 'Bloqueado',
                    disabled: true,
                    style: tw`bg-gray-300 border-gray-400`,
                    textStyle: tw`text-gray-600`,
                    onPress: () => { }
                };
            default: // 'none'
                return {
                    text: isProcessing ? 'Enviando...' : 'Conectar',
                    disabled: isProcessing,
                    style: tw`bg-blue-500 border-blue-500`,
                    textStyle: tw`text-white`,
                    onPress: () => handleConnectionRequest(user.id)
                };
        }
    };

    // ✅ ENHANCED: User card component with connection status
    const renderUserCard = ({ item: user }: { item: EnhancedUser }) => {
        const buttonConfig = getConnectionButtonConfig(user);
        const isProcessing = connectionRequests.has(user.id);

        return (
            <View style={styles.cardContainer}>
                {/* User Header */}
                <View style={styles.cardHeader}>
                    <TouchableOpacity onPress={() => handleViewProfile(user.id)} accessibilityLabel="Ver perfil">
                        <Image
                            source={
                                user.photo
                                    ? { uri: user.photo }
                                    : require("@/assets/images/avatar.svg")
                            }
                            style={styles.avatar}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <TouchableOpacity onPress={() => handleViewProfile(user.id)}>
                            <Text style={styles.userName}>{user.name}</Text>
                        </TouchableOpacity>
                        <View style={styles.userTypeRow}>
                            <View style={[styles.badge, styles.badgeBlue]}>
                                <Text style={styles.badgeTextBlue}>{user.userType}</Text>
                            </View>
                            {user.connectionStatus !== 'none' && (
                                <View style={[styles.badge, styles.badgeGray]}>
                                    <Text style={styles.badgeTextGray}>
                                        {user.connectionStatus === 'pending'
                                            ? (user.connectionType === 'sent' ? 'Enviado' : 'Recebido')
                                            : user.connectionStatus === 'accepted'
                                                ? 'Conectado'
                                                : 'Bloqueado'
                                        }
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                    {user.role === UserRole.MENTOR &&
                        <View style={styles.statusContainer}>
                            <View
                                style={[
                                    styles.statusDot,
                                    user.status === "Disponível" ? styles.statusDotAvailable : styles.statusDotUnavailable,
                                ]}
                            />
                            <Text style={styles.statusText}>{user.status}</Text>
                        </View>
                    }
                </View>
                {/* User Info */}
                <View style={styles.infoRow}>
                    <Feather name="map-pin" size={14} color="#6B7280" />
                    <Text style={styles.infoText}>{user.location || 'Localização não informada'}</Text>
                </View>
                <View style={styles.infoRowBetween}>
                    <View style={styles.infoRow}>
                        <Feather name="users" size={14} color="#6B7280" />
                        <Text style={styles.infoText}>
                            {user.userType === "Mentor"
                                ? `${user.mentorias} mentorias`
                                : `${user.programCount} programas`
                            }
                        </Text>
                    </View>
                    {(user.mutualConnections && user.mutualConnections > 0) ? (
                        <View style={styles.infoRow}>
                            <Feather name="link" size={14} color="#6B7280" />
                            <Text style={styles.infoText}>
                                {user.mutualConnections} conexões mútuas
                            </Text>
                        </View>
                    ) : null}
                </View>
                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        onPress={() => handleViewProfile(user.id)}
                        style={styles.profileButton}
                        accessibilityLabel="Ver perfil"
                    >
                        <Text style={styles.profileButtonText}>Ver Perfil</Text>
                    </TouchableOpacity>
                    <View style={styles.flex1Row}>
                        <TouchableOpacity
                            onPress={buttonConfig.onPress}
                            disabled={buttonConfig.disabled || isProcessing}
                            style={[
                                styles.connectButton,
                                buttonConfig.style,
                                (buttonConfig.disabled || isProcessing) && styles.disabledButton
                            ]}
                            accessibilityLabel={buttonConfig.text}
                        >
                            {isProcessing ? (
                                <View style={styles.centerRow}>
                                    <ActivityIndicator size="small" color="white" />
                                    <Text style={[styles.connectButtonText, buttonConfig.textStyle, { marginLeft: 8 }]}>
                                        {buttonConfig.text}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={[styles.connectButtonText, buttonConfig.textStyle]}>
                                    {buttonConfig.text}
                                </Text>
                            )}
                        </TouchableOpacity>
                        {buttonConfig.secondaryButton && (
                            <TouchableOpacity
                                onPress={buttonConfig.secondaryButton.onPress}
                                disabled={isProcessing}
                                style={[
                                    styles.rejectButton,
                                    buttonConfig.secondaryButton.style,
                                    isProcessing && styles.disabledButton
                                ]}
                                accessibilityLabel={buttonConfig.secondaryButton.text}
                            >
                                <Text style={[styles.rejectButtonText, buttonConfig.secondaryButton.textStyle]}>
                                    {buttonConfig.secondaryButton.text}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                {user.connectionStatus === 'accepted' && (
                    <TouchableOpacity
                        onPress={() => handleChatOpen(user.id)}
                        style={styles.chatButton}
                        accessibilityLabel="Iniciar conversa"
                    >
                        <View style={styles.centerRow}>
                            <Feather name="message-circle" size={16} color="#3B82F6" />
                            <Text style={styles.chatButtonText}>Iniciar Conversa</Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    // Loading state
    if (isLoading) {
        return (
            <View style={tw`flex-1 bg-gray-50`}>
                <Navbar title='Emparelhamentos' />
                <View style={tw`flex-1 justify-center items-center`}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={tw`mt-4 text-gray-600`}>Carregando usuários...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <Navbar title='Emparelhamentos' />
            {/* Search and Filter Header */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <View style={styles.searchBox}>
                            <Feather name="search" size={20} color="#6B7280" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar usuários..."
                                value={searchQuery}
                                onChangeText={handleSearch}
                                placeholderTextColor="#9CA3AF"
                                accessibilityLabel="Buscar usuários"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery("")}>
                                    <Feather name="x" size={20} color="#6B7280" />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity
                            onPress={() => setFilterModalVisible(true)}
                            style={styles.filterButton}
                            accessibilityLabel="Abrir filtros"
                        >
                            <Ionicons name="options" size={26} color="black" />
                        </TouchableOpacity>
                    </View>
                    {(filters.userType || filters.status || filters.location) && (
                        <View style={styles.activeFiltersRow}>
                            <Text style={styles.activeFiltersLabel}>Filtros ativos:</Text>
                            {filters.userType && (
                                <View style={[styles.badge, styles.badgeBlue]}>
                                    <Text style={styles.badgeTextBlue}>{filters.userType}</Text>
                                </View>
                            )}
                            {filters.status && (
                                <View style={[styles.badge, styles.badgeGreen]}>
                                    <Text style={styles.badgeTextGreen}>{filters.status}</Text>
                                </View>
                            )}
                            {filters.location && (
                                <View style={[styles.badge, styles.badgePurple]}>
                                    <Text style={styles.badgeTextPurple}>{filters.location}</Text>
                                </View>
                            )}
                            <TouchableOpacity onPress={resetFilters}>
                                <Text style={styles.clearFiltersText}>Limpar</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* ✅ NEW: Connection Requests Section */}
                {receivedRequests.length > 0 && (
                    <View style={tw`mx-4 mb-4`}>
                        <View style={tw`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden`}>
                            {/* Header */}
                            <View style={[
                                tw`px-4 py-3 flex-row items-center justify-between`,
                                { backgroundColor: '#3B82F6' }
                            ]}>
                                <View style={tw`flex-row items-center`}>
                                    <View style={tw`w-8 h-8 bg-white bg-opacity-20 rounded-full items-center justify-center mr-3`}>
                                        <Feather name="user-plus" size={16} color="white" />
                                    </View>
                                    <Text style={tw`text-white font-bold text-lg`}>
                                        Solicitações de Conexão
                                    </Text>
                                </View>
                                <View style={tw`bg-white bg-opacity-20 rounded-full px-2 py-1`}>
                                    <Text style={tw`text-white font-bold text-sm`}>
                                        {receivedRequests.length}
                                    </Text>
                                </View>
                            </View>

                            {/* Requests List */}
                            <View style={tw`p-4`}>
                                {receivedRequests.slice(0, 3).map((request, index) => (
                                    <View key={request.id} style={tw`${index > 0 ? 'mt-3 pt-3 border-t border-gray-100' : ''}`}>
                                        <View style={tw`flex-row items-center`}>
                                            {/* User Avatar */}
                                            <View style={tw`w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3`}>
                                                {request.requester?.image ? (
                                                    <Image
                                                        source={{ uri: request.requester.image }}
                                                        style={tw`w-12 h-12 rounded-full`}
                                                    />
                                                ) : (
                                                    <Text style={tw`text-blue-600 font-bold text-lg`}>
                                                        {request.requester?.fullName?.charAt(0)?.toUpperCase() || '?'}
                                                    </Text>
                                                )}
                                            </View>

                                            {/* User Info */}
                                            <View style={tw`flex-1 mr-3`}>
                                                <Text style={tw`font-semibold text-gray-800 text-base`}>
                                                    {request.requester?.fullName || 'Usuário não encontrado'}
                                                </Text>
                                                <Text style={tw`text-gray-600 text-sm`}>
                                                    {request.requester?.role === 'mentor' ? '👨‍🏫 Mentor' : '👨‍🎓 Mentee'} • {request.requester?.school || 'Escola não informada'}
                                                </Text>
                                                {request.createdAt && (
                                                    <Text style={tw`text-gray-500 text-xs mt-1`}>
                                                        {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                                                    </Text>
                                                )}
                                            </View>

                                            {/* Action Buttons */}
                                            <View style={tw`flex-row items-center`}>
                                                {processingRequests.has(request.id) ? (
                                                    <ActivityIndicator size="small" color="#3B82F6" />
                                                ) : (
                                                    <>
                                                        {/* Accept Button */}
                                                        <TouchableOpacity
                                                            onPress={() => handleAcceptConnectionRequest(request.id, request.requester?.uid)}
                                                            style={[
                                                                tw`w-10 h-10 rounded-full items-center justify-center mr-2`,
                                                                { backgroundColor: '#10B981' }
                                                            ]}
                                                            activeOpacity={0.8}
                                                        >
                                                            <Feather name="check" size={16} color="white" />
                                                        </TouchableOpacity>

                                                        {/* Reject Button */}
                                                        <TouchableOpacity
                                                            onPress={() => handleRejectConnectionRequest(request.id, request.requester?.uid)}
                                                            style={[
                                                                tw`w-10 h-10 rounded-full items-center justify-center`,
                                                                { backgroundColor: '#EF4444' }
                                                            ]}
                                                            activeOpacity={0.8}
                                                        >
                                                            <Feather name="x" size={16} color="white" />
                                                        </TouchableOpacity>
                                                    </>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                ))}

                                {/* Show More Button */}
                                {receivedRequests.length > 3 && (
                                    <TouchableOpacity
                                        onPress={() => setShowRequestsModal(true)}
                                        style={tw`mt-4 bg-blue-50 border border-blue-200 rounded-xl py-3 px-4 flex-row items-center justify-center`}
                                        activeOpacity={0.8}
                                    >
                                        <Feather name="plus" size={16} color="#3B82F6" />
                                        <Text style={tw`text-blue-600 font-semibold ml-2`}>
                                            Ver todas ({receivedRequests.length})
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                )}

                {/* Users List */}
                <View style={styles.listContainer}>
                    {filteredUsers.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Feather name="users" size={64} color="#D1D5DB" />
                            <Text style={styles.emptyTitle}>Nenhum usuário encontrado</Text>
                            <Text style={styles.emptyDesc}>
                                {searchQuery || filters.userType || filters.status || filters.location
                                    ? "Tente ajustar os filtros de busca"
                                    : "Não há usuários disponíveis para conexão no momento"
                                }
                            </Text>
                            {(searchQuery || filters.userType || filters.status || filters.location) && (
                                <TouchableOpacity
                                    onPress={resetFilters}
                                    style={styles.clearFiltersButton}
                                >
                                    <Text style={styles.clearFiltersButtonText}>Limpar Filtros</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <FlatList
                            data={filteredUsers}
                            renderItem={renderUserCard}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            refreshing={isRefreshing}
                            onRefresh={() => fetchAvailableUsers(true)}
                            contentContainerStyle={styles.flatListContent}
                        />
                    )}
                </View>
            </ScrollView>

            {/* ✅ NEW: Connection Requests Modal */}
            <Modal
                visible={showRequestsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowRequestsModal(false)}
            >
                <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
                    <View style={tw`bg-white rounded-t-3xl max-h-5/6`}>
                        {/* Modal Header */}
                        <View style={[
                            tw`px-6 py-4 border-b border-gray-200 flex-row items-center justify-between`,
                            { backgroundColor: '#3B82F6' }
                        ]}>
                            <Text style={tw`text-white text-xl font-bold`}>
                                Solicitações de Conexão ({receivedRequests.length})
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowRequestsModal(false)}
                                style={tw`w-8 h-8 bg-white bg-opacity-20 rounded-full items-center justify-center`}
                            >
                                <Feather name="x" size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Content */}
                        <FlatList
                            data={receivedRequests}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={tw`p-4`}
                            showsVerticalScrollIndicator={false}
                            refreshing={requestsLoading}
                            onRefresh={fetchReceivedRequests}
                            renderItem={({ item: request }) => (
                                <View style={tw`bg-white border border-gray-200 rounded-xl p-4 mb-3 shadow-sm`}>
                                    <View style={tw`flex-row items-center`}>
                                        {/* User Avatar */}
                                        <View style={tw`w-14 h-14 bg-blue-100 rounded-full items-center justify-center mr-4`}>
                                            {request.requester?.image ? (
                                                <Image
                                                    source={{ uri: request.requester.image }}
                                                    style={tw`w-14 h-14 rounded-full`}
                                                />
                                            ) : (
                                                <Text style={tw`text-blue-600 font-bold text-xl`}>
                                                    {request.requester?.fullName?.charAt(0)?.toUpperCase() || '?'}
                                                </Text>
                                            )}
                                        </View>

                                        {/* User Info */}
                                        <View style={tw`flex-1 mr-4`}>
                                            <Text style={tw`font-bold text-gray-800 text-lg`}>
                                                {request.requester?.fullName || 'Usuário não encontrado'}
                                            </Text>
                                            <Text style={tw`text-gray-600 text-base`}>
                                                {request.requester?.role === 'mentor' ? '👨‍🏫 Mentor' : '👨‍🎓 Mentee'}
                                            </Text>
                                            <Text style={tw`text-gray-500 text-sm`}>
                                                {request.requester?.school || 'Escola não informada'}
                                            </Text>
                                            {request.requester?.municipality && (
                                                <Text style={tw`text-gray-500 text-sm`}>
                                                    📍 {request.requester.municipality}
                                                </Text>
                                            )}
                                            {request.createdAt && (
                                                <Text style={tw`text-gray-400 text-xs mt-1`}>
                                                    Solicitado em: {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                                                </Text>
                                            )}
                                        </View>

                                        {/* Action Buttons */}
                                        <View style={tw`flex-col items-center`}>
                                            {processingRequests.has(request.id) ? (
                                                <ActivityIndicator size="large" color="#3B82F6" />
                                            ) : (
                                                <>
                                                    {/* Accept Button */}
                                                    <TouchableOpacity
                                                        onPress={() => handleAcceptConnectionRequest(request.id, request.requester?.uid)}
                                                        style={[
                                                            tw`w-12 h-12 rounded-full items-center justify-center mb-2`,
                                                            { backgroundColor: '#10B981' }
                                                        ]}
                                                        activeOpacity={0.8}
                                                    >
                                                        <Feather name="check" size={20} color="white" />
                                                    </TouchableOpacity>

                                                    {/* Reject Button */}
                                                    <TouchableOpacity
                                                        onPress={() => handleRejectConnectionRequest(request.id, request.requester?.uid)}
                                                        style={[
                                                            tw`w-12 h-12 rounded-full items-center justify-center`,
                                                            { backgroundColor: '#EF4444' }
                                                        ]}
                                                        activeOpacity={0.8}
                                                    >
                                                        <Feather name="x" size={20} color="white" />
                                                    </TouchableOpacity>
                                                </>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={
                                <View style={tw`flex-1 items-center justify-center py-12`}>
                                    <Feather name="inbox" size={64} color="#D1D5DB" />
                                    <Text style={tw`text-gray-500 text-lg font-medium mt-4`}>
                                        Nenhuma solicitação
                                    </Text>
                                    <Text style={tw`text-gray-400 text-center mt-2`}>
                                        Você não possui solicitações de conexão pendentes
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>

            <FilterModal
                visible={filterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                filters={filters}
                setFilters={setFilters}
                onApply={applyFilters}
                onReset={resetFilters}
            />
        </View>
    );
}

// --- Styles ---
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    header: {
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    searchBox: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F3F4F6",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === "ios" ? 12 : 10,
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        color: "#374151",
        fontSize: 16,
        paddingVertical: 0,
    },
    filterButton: {
        // backgroundColor: "#F3F4F6",
        borderRadius: 10,
        padding: 1,
    },
    activeFiltersRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        flexWrap: "wrap",
    },
    activeFiltersLabel: {
        fontSize: 14,
        color: "#4B5563",
        marginRight: 8,
    },
    badge: {
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 6,
        marginBottom: 4,
    },
    badgeBlue: { backgroundColor: "#DBEAFE" },
    badgeGreen: { backgroundColor: "#D1FAE5" },
    badgePurple: { backgroundColor: "#EDE9FE" },
    badgeGray: { backgroundColor: "#F3F4F6" },
    badgeTextBlue: { color: "#2563EB", fontSize: 12, fontWeight: "600" },
    badgeTextGreen: { color: "#059669", fontSize: 12, fontWeight: "600" },
    badgeTextPurple: { color: "#7C3AED", fontSize: 12, fontWeight: "600" },
    badgeTextGray: { color: "#6B7280", fontSize: 12, fontWeight: "600" },
    clearFiltersText: {
        color: "#EF4444",
        fontSize: 12,
        textDecorationLine: "underline",
        marginLeft: 8,
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 38,

    },
    resultsHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
    },
    resultsTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1F2937",
    },
    resultsCount: {
        fontSize: 14,
        color: "#6B7280",
    },
    flatListContent: {
        paddingBottom: 24,
    },
    cardContainer: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginRight: 12,
        backgroundColor: "#E5E7EB",
    },
    headerInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1F2937",
    },
    userTypeRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    statusContainer: {
        alignItems: "center",
        marginLeft: 8,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginBottom: 2,
    },
    statusDotAvailable: { backgroundColor: "#34D399" },
    statusDotUnavailable: { backgroundColor: "#D1D5DB" },
    statusText: {
        fontSize: 12,
        color: "#6B7280",
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    infoRowBetween: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: "#6B7280",
        marginLeft: 6,
    },
    actionRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        marginBottom: 4,
    },
    profileButton: {
        flex: 1,
        backgroundColor: "#F3F4F6",
        borderColor: "#D1D5DB",
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 10,
        marginRight: 8,
        alignItems: "center",
    },
    profileButtonText: {
        color: "#374151",
        fontWeight: "600",
        fontSize: 15,
    },
    flex1Row: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    connectButton: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
        marginRight: 0,
        backgroundColor: "#2563EB",
        borderColor: "#2563EB",
        borderWidth: 1,
    },
    connectButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 15,
    },
    rejectButton: {
        marginLeft: 8,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        alignItems: "center",
        backgroundColor: "#EF4444",
        borderColor: "#EF4444",
        borderWidth: 1,
    },
    rejectButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 13,
    },
    disabledButton: {
        opacity: 0.6,
    },
    chatButton: {
        marginTop: 10,
        backgroundColor: "#DBEAFE",
        borderColor: "#BFDBFE",
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
    },
    chatButtonText: {
        color: "#2563EB",
        fontWeight: "600",
        fontSize: 15,
        marginLeft: 8,
    },
    centerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#6B7280",
        marginTop: 16,
    },
    emptyDesc: {
        color: "#9CA3AF",
        fontSize: 15,
        textAlign: "center",
        marginTop: 8,
        marginHorizontal: 24,
    },
    clearFiltersButton: {
        backgroundColor: "#2563EB",
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginTop: 16,
    },
    clearFiltersButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 15,
        textAlign: "center",
    },
});
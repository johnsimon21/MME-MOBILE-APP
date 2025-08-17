import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Alert,
    FlatList,
    Image,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import tw from 'twrnc';
import { Navbar } from '../components/ui/navbar';
import { useDashboardContext } from '../../context/DashboardContext';
import { useRealTimeDashboard } from '../../hooks/useRealTimeDashboard';
import { useExport } from '../../hooks/useExport';
import { useUsers } from '../../hooks/useUsers';
import { DashboardSettings, DashboardSettings as DashboardSettingsComponent } from '@/src/components/dashboard/DashboardSettings';
import {
    ExportFormat,
    IUserAnalytics,
    ActivityType
} from '../../interfaces/dashboard.interface';

export function AdminDashboardScreen() {
    const navigation = useNavigation();
    const [selectedUser, setSelectedUser] = useState<IUserAnalytics | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
    const [photoViewerUser, setPhotoViewerUser] = useState<IUserAnalytics | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>({
        autoRefresh: true,
        refreshInterval: 5,
        showRealTimeStats: true,
        showSystemHealth: true,
        enableNotifications: true,
        compactView: false,
    });
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);

    // Dashboard context
    const {
        dashboardStats,
        userAnalytics,
        recentActivity,
        isLoadingStats,
        isLoadingUsers,
        connectionError,
        refreshDashboardStats,
        refreshUserAnalytics,
        clearErrors,
    } = useDashboardContext();

    // Real-time dashboard hook
    const {
        realTimeStats,
        lastUpdate,
        connectionStatus,
        systemHealthStatus,
    } = useRealTimeDashboard();

    // Export functionality
    const { isExporting, exportUserAnalytics } = useExport();

    // Users management
    const { deleteUser } = useUsers();

    // Refresh all data
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                refreshDashboardStats(),
                refreshUserAnalytics(),
            ]);
            clearErrors();
        } catch (error) {
            console.error('Refresh error:', error);
            Alert.alert('Erro', 'Falha ao atualizar dados');
        } finally {
            setRefreshing(false);
        }
    }, [refreshDashboardStats, refreshUserAnalytics, clearErrors]);

    // Handle user removal
    const handleRemoveUser = useCallback(async (userId: string, userName: string) => {
        Alert.alert(
            "Remover Usuário",
            `Tem certeza que deseja remover ${userName}? Esta ação não pode ser desfeita.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Remover",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteUser(userId);

                            // Close modal if the removed user was selected
                            if (selectedUser?.userId === userId) {
                                closeUserModal();
                            }

                            // Refresh user analytics
                            await refreshUserAnalytics();

                            Alert.alert("Sucesso", `${userName} foi removido com sucesso.`);
                        } catch (error: any) {
                            Alert.alert("Erro", `Falha ao remover usuário: ${error.message}`);
                        }
                    }
                }
            ]
        );
    }, [deleteUser, selectedUser, refreshUserAnalytics]);

    // Handle export
    const handleExport = useCallback(() => {
        Alert.alert(
            'Exportar Dados',
            'Escolha o formato de exportação:',
            [
                {
                    text: 'CSV',
                    onPress: () => exportUserAnalytics({}, ExportFormat.CSV),
                },
                {
                    text: 'Excel',
                    onPress: () => exportUserAnalytics({}, ExportFormat.EXCEL),
                },
                { text: 'Cancelar', style: 'cancel' },
            ]
        );
    }, [exportUserAnalytics]);

    // Dynamic Stats Card Component
    const StatCard = ({ title, value, icon, color, subtitle, isLoading }: any) => (
        <View style={tw`bg-white p-4 rounded-xl shadow-sm flex-1 mx-1`}>
            <View style={tw`w-10 h-10 rounded-full bg-${color}-100 items-center justify-center mb-2`}>
                <Feather name={icon} size={20} color="#4F46E5" />
            </View>
            {isLoading ? (
                <ActivityIndicator size="small" color="#4F46E5" />
            ) : (
                <>
                    <Text style={tw`text-2xl font-bold text-gray-800 mb-1`}>{value}</Text>
                    <Text style={tw`text-gray-600 text-sm`}>{title}</Text>
                    {subtitle && (
                        <Text style={tw`text-gray-500 text-xs mt-1`}>{subtitle}</Text>
                    )}
                </>
            )}
        </View>
    );

    // Get status color and text
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return '#10B981';
            case 'away': return '#F59E0B';
            case 'offline': return '#6B7280';
            default: return '#6B7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'online': return 'Online';
            case 'away': return 'Ausente';
            case 'offline': return 'Offline';
            default: return 'Desconhecido';
        }
    };

    // Get activity icon
    const getActivityIcon = (type: ActivityType): "person-add" | "log-in" | "calendar" | "checkmark-circle" | "chatbubble" | "information-circle" => {
        switch (type) {
            case ActivityType.USER_REGISTERED: return 'person-add';
            case ActivityType.SESSION_CREATED: return 'calendar';
            case ActivityType.SESSION_COMPLETED: return 'checkmark-circle';
            case ActivityType.CHAT_MESSAGE_SENT: return 'chatbubble';
            case ActivityType.USER_LOGIN: return 'log-in';
            default: return 'information-circle';
        }
    };

    // Format time ago
    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Agora';
        if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} h atrás`;
        return `${Math.floor(diffInMinutes / 1440)} dias atrás`;
    };

    // Progress Bar Component
    const ProgressBar = ({ progress, color = "#4F46E5" }: { progress: number; color?: string }) => (
        <View style={tw`w-full h-2 bg-gray-200 rounded-full overflow-hidden`}>
            <View
                style={[
                    tw`h-full rounded-full`,
                    { width: `${Math.min(progress, 100)}%`, backgroundColor: color }
                ]}
            />
        </View>
    );

    // Mini Chart Component
    const MiniChart = ({ data }: { data: number[] }) => {
        if (!data || data.length === 0) return null;

        const maxValue = Math.max(...data);
        return (
            <View style={tw`flex-row items-end h-16 bg-gray-50 rounded-lg p-2`}>
                {data.map((value, index) => (
                    <View key={index} style={tw`flex-1 items-center mx-0.5`}>
                        <View
                            style={[
                                tw`bg-blue-500 rounded-t-sm w-full`,
                                { height: maxValue > 0 ? (value / maxValue) * 40 : 0 }
                            ]}
                        />
                        <Text style={tw`text-xs text-gray-500 mt-1`}>
                            {['J', 'F', 'M', 'A', 'M', 'J', 'J'][index] || ''}
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    // Modal control functions
    const openUserModal = (userData: IUserAnalytics) => {
        setSelectedUser(userData);
        setModalVisible(true);
    };

    const closeUserModal = () => {
        setModalVisible(false);
        setSelectedUser(null);
    };

    const openPhotoViewer = (user: IUserAnalytics) => {
        setPhotoViewerUser(user);
        setPhotoViewerVisible(true);
    };

    const closePhotoViewer = () => {
        setPhotoViewerVisible(false);
        setPhotoViewerUser(null);
    };

    // Photo Viewer Modal Component
    const PhotoViewerModal = () => {
        if (!photoViewerUser) return null;

        return (
            <Modal
                visible={photoViewerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closePhotoViewer}
            >
                <View style={tw`flex-1 bg-black bg-opacity-90 justify-center items-center`}>
                    <TouchableOpacity
                        style={tw`absolute top-12 right-4 z-10 bg-black bg-opacity-50 rounded-full p-3`}
                        onPress={closePhotoViewer}
                    >
                        <MaterialIcons name="close" size={24} color="white" />
                    </TouchableOpacity>

                    <View style={tw`absolute top-12 left-4 z-10`}>
                        <Text style={tw`text-white text-xl font-bold`}>{photoViewerUser.fullName}</Text>
                        <Text style={tw`text-gray-300 text-sm`}>{photoViewerUser.role}</Text>
                    </View>

                    <View style={tw`flex-1 justify-center items-center w-full`}>
                        <Image
                            source={{
                                uri: photoViewerUser.profileImage ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(photoViewerUser.fullName)}&background=4F46E5&color=fff&size=400`
                            }}
                            style={tw`w-full h-full`}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={tw`absolute bottom-12 left-4 right-4 bg-black bg-opacity-50 rounded-xl p-4`}>
                        <View style={tw`flex-row items-center justify-between`}>
                            <View>
                                <Text style={tw`text-white font-medium`}>
                                    Status: {getStatusText(photoViewerUser.isOnline ? 'online' : 'offline')}
                                </Text>
                                <Text style={tw`text-gray-300 text-sm`}>
                                    Último acesso: {formatTimeAgo(photoViewerUser.lastActive)}
                                </Text>
                            </View>
                            <View
                                style={[
                                    tw`w-4 h-4 rounded-full`,
                                    { backgroundColor: getStatusColor(photoViewerUser.isOnline ? 'online' : 'offline') }
                                ]}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    // User Details Modal Component
    const UserDetailsModal = () => {
        if (!selectedUser) return null;

        const handleViewProfile = () => {
            closeUserModal();
            // @ts-ignore
            navigation.navigate('UserProfile', { userId: selectedUser.userId });
        };

        const handleRemoveFromModal = () => {
            handleRemoveUser(selectedUser.userId, selectedUser.fullName);
        };

        return (
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeUserModal}
            >
                <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
                    <View style={tw`bg-white rounded-t-3xl h-4/5`}>
                        {/* Modal Header */}
                        <View style={tw`flex-row items-center justify-between p-4 border-b border-gray-200`}>
                            <View style={tw`flex-row items-center flex-1`}>
                                <TouchableOpacity
                                    onPress={() => {
                                        closeUserModal();
                                        setTimeout(() => openPhotoViewer(selectedUser), 100);
                                    }}
                                    style={tw`w-12 h-12 rounded-full mr-3 relative`}
                                    activeOpacity={0.8}
                                >
                                    <Image
                                        source={{
                                            uri: selectedUser.profileImage ||
                                                `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.fullName)}&background=4F46E5&color=fff&size=48`
                                        }}
                                        style={tw`w-12 h-12 rounded-full`}
                                    />
                                    <View
                                        style={[
                                            tw`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white`,
                                            { backgroundColor: getStatusColor(selectedUser.isOnline ? 'online' : 'offline') }
                                        ]}
                                    />
                                    <View style={tw`absolute inset-0 rounded-full bg-black bg-opacity-20 items-center justify-center`}>
                                        <MaterialIcons name="zoom-in" size={12} color="white" style={tw`opacity-70`} />
                                    </View>
                                </TouchableOpacity>
                                <View style={tw`flex-1`}>
                                    <Text style={tw`font-bold text-gray-800 text-lg`}>{selectedUser.fullName}</Text>
                                    <Text style={tw`text-gray-500 text-sm`}>{selectedUser.email}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={closeUserModal} style={tw`p-2`}>
                                <MaterialIcons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                            {/* User Info Section */}
                            <View style={tw`p-4`}>
                                <View style={tw`flex-row items-center justify-between mb-4`}>
                                    <View style={tw`flex-row items-center`}>
                                        <Text style={tw`text-gray-600 mr-2`}>Status:</Text>
                                        <Text style={tw`font-medium`}>
                                            {getStatusText(selectedUser.isOnline ? 'online' : 'offline')}
                                        </Text>
                                    </View>
                                    {selectedUser.role === 'admin' && (
                                        <View style={tw`bg-purple-100 px-3 py-1 rounded-full`}>
                                            <Text style={tw`text-purple-800 text-sm font-medium`}>Admin</Text>
                                        </View>
                                    )}
                                </View>

                                {/* User Stats Grid */}
                                <View style={tw`bg-gray-50 rounded-xl p-4 mb-4`}>
                                    <Text style={tw`font-semibold text-gray-800 mb-3`}>Estatísticas</Text>
                                    <View style={tw`flex-row justify-between`}>
                                        <View style={tw`items-center flex-1`}>
                                            <Text style={tw`text-2xl font-bold text-blue-600`}>
                                                {selectedUser.sessionsCount}
                                            </Text>
                                            <Text style={tw`text-gray-600 text-sm text-center`}>Total de Sessões</Text>
                                        </View>
                                        <View style={tw`items-center flex-1`}>
                                            <Text style={tw`text-2xl font-bold text-green-600`}>
                                                {selectedUser.completedSessions}
                                            </Text>
                                            <Text style={tw`text-gray-600 text-sm text-center`}>Concluídas</Text>
                                        </View>
                                        <View style={tw`items-center flex-1`}>
                                            <Text style={tw`text-2xl font-bold text-purple-600`}>
                                                {selectedUser.completionRate.toFixed(1)}%
                                            </Text>
                                            <Text style={tw`text-gray-600 text-sm text-center`}>Taxa de Conclusão</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Progress Bars */}
                                <View style={tw`mb-4`}>
                                    <View style={tw`mb-3`}>
                                        <View style={tw`flex-row justify-between items-center mb-2`}>
                                            <Text style={tw`text-gray-600`}>Taxa de Conclusão</Text>
                                            <Text style={tw`text-gray-800 font-medium`}>
                                                {selectedUser.completionRate.toFixed(1)}%
                                            </Text>
                                        </View>
                                        <ProgressBar progress={selectedUser.completionRate} color="#10B981" />
                                    </View>

                                    {selectedUser.averageRating && (
                                        <View style={tw`mb-3`}>
                                            <View style={tw`flex-row justify-between items-center mb-2`}>
                                                <Text style={tw`text-gray-600`}>Avaliação Média</Text>
                                                <Text style={tw`text-gray-800 font-medium`}>
                                                    {selectedUser.averageRating.toFixed(1)}/5.0
                                                </Text>
                                            </View>
                                            <ProgressBar progress={(selectedUser.averageRating / 5) * 100} color="#F59E0B" />
                                        </View>
                                    )}
                                </View>

                                {/* User Details */}
                                <View style={tw`bg-white border border-gray-200 rounded-xl p-4 mb-4`}>
                                    <Text style={tw`font-semibold text-gray-800 mb-3`}>Informações</Text>

                                    <View style={tw`space-y-3`}>
                                        <View style={tw`flex-row items-center`}>
                                            <MaterialIcons name="school" size={20} color="#6B7280" />
                                            <Text style={tw`ml-3 text-gray-600`}>Escola:</Text>
                                            <Text style={tw`ml-2 font-medium text-gray-800`}>{selectedUser.school}</Text>
                                        </View>

                                        <View style={tw`flex-row items-center`}>
                                            <MaterialIcons name="person" size={20} color="#6B7280" />
                                            <Text style={tw`ml-3 text-gray-600`}>Papel:</Text>
                                            <Text style={tw`ml-2 font-medium text-gray-800 capitalize`}>
                                                {selectedUser.role}
                                            </Text>
                                        </View>

                                        <View style={tw`flex-row items-center`}>
                                            <MaterialIcons name="calendar-today" size={20} color="#6B7280" />
                                            <Text style={tw`ml-3 text-gray-600`}>Membro desde:</Text>
                                            <Text style={tw`ml-2 font-medium text-gray-800`}>
                                                {new Date(selectedUser.joinedDate).toLocaleDateString('pt-BR')}
                                            </Text>
                                        </View>

                                        <View style={tw`flex-row items-center`}>
                                            <MaterialIcons name="access-time" size={20} color="#6B7280" />
                                            <Text style={tw`ml-3 text-gray-600`}>Último acesso:</Text>
                                            <Text style={tw`ml-2 font-medium text-gray-800`}>
                                                {formatTimeAgo(selectedUser.lastActive)}
                                            </Text>
                                        </View>

                                        {selectedUser.totalHours && (
                                            <View style={tw`flex-row items-center`}>
                                                <MaterialIcons name="schedule" size={20} color="#6B7280" />
                                                <Text style={tw`ml-3 text-gray-600`}>Total de Horas:</Text>
                                                <Text style={tw`ml-2 font-medium text-gray-800`}>
                                                    {selectedUser.totalHours.toFixed(1)}h
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Modal Actions */}
                        <View style={tw`p-4 border-t border-gray-200 bg-white`}>
                            <View style={tw`flex-row space-x-3`}>
                                <TouchableOpacity
                                    onPress={handleViewProfile}
                                    style={tw`flex-1 bg-blue-500 py-3 rounded-xl flex-row items-center justify-center`}
                                >
                                    <MaterialIcons name="visibility" size={20} color="white" />
                                    <Text style={tw`text-white font-medium ml-2`}>Ver Perfil</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleRemoveFromModal}
                                    style={tw`flex-1 bg-red-500 py-3 rounded-xl flex-row items-center justify-center`}
                                >
                                    <MaterialIcons name="delete" size={20} color="white" />
                                    <Text style={tw`text-white font-medium ml-2`}>Remover</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    const UserItem = ({ item }: { item: IUserAnalytics }) => (
        <TouchableOpacity
            style={tw`bg-white p-4 rounded-xl shadow-sm mb-3 border border-gray-100`}
            onPress={() => openUserModal(item)}
            activeOpacity={0.7}
        >
            <View style={tw`flex-row items-center`}>
                <View style={tw`relative`}>
                    <Image
                        source={{
                            uri: item.profileImage ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(item.fullName)}&background=4F46E5&color=fff&size=48`
                        }}
                        style={tw`w-12 h-12 rounded-full`}
                    />
                    <View
                        style={[
                            tw`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white`,
                            { backgroundColor: getStatusColor(item.isOnline ? 'online' : 'offline') }
                        ]}
                    />
                </View>

                <View style={tw`flex-1 ml-3`}>
                    <Text style={tw`font-semibold text-gray-800`}>{item.fullName}</Text>
                    <Text style={tw`text-gray-500 text-sm`}>{item.email}</Text>
                    <View style={tw`flex-row items-center mt-1`}>
                        <Text style={tw`text-xs text-gray-500 capitalize`}>{item.role}</Text>
                        <Text style={tw`text-xs text-gray-400 mx-2`}>•</Text>
                        <Text style={tw`text-xs text-gray-500`}>{item.school}</Text>
                    </View>
                </View>

                <View style={tw`items-end`}>
                    <Text style={tw`text-sm font-medium text-gray-800`}>
                        {item.sessionsCount} sessões
                    </Text>
                    <Text style={tw`text-xs text-gray-500`}>
                        {item.completionRate.toFixed(0)}% conclusão
                    </Text>
                    <Text style={tw`text-xs text-gray-400 mt-1`}>
                        {formatTimeAgo(item.lastActive)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const ActivityItem = ({ item }: { item: any }) => (
        <View style={tw`flex-row items-center py-3 border-b border-gray-100`}>
            <View style={tw`w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3`}>
                <MaterialIcons
                    name={getActivityIcon(item.type).replace('log-in', 'login') as keyof typeof MaterialIcons.glyphMap}
                    size={16}
                    color="#4F46E5"
                />
            </View>
            <View style={tw`flex-1`}>
                <Text style={tw`text-gray-800 font-medium text-sm`}>{item.description}</Text>
                <Text style={tw`text-gray-500 text-xs`}>
                    {item.userName} • {formatTimeAgo(item.timestamp)}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            <Navbar title="Dashboard Admin" />

            {/* Connection Status & Export Header */}
            <View style={tw`bg-white px-4 py-3 border-b border-gray-200`}>
                <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center`}>
                        <View style={tw`w-3 h-3 rounded-full bg-${connectionStatus.color}-500 mr-2`} />
                        <Text style={tw`text-sm text-gray-600`}>{connectionStatus.text}</Text>
                        {lastUpdate && (
                            <Text style={tw`text-xs text-gray-400 ml-2`}>
                                • {lastUpdate.toLocaleTimeString()}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={handleExport}
                        disabled={isExporting}
                        style={tw`bg-indigo-500 px-3 py-2 rounded-lg flex-row items-center ${isExporting ? 'opacity-50' : ''
                            }`}
                    >
                        <Feather name="download" size={14} color="white" />
                        <Text style={tw`text-white font-medium ml-1 text-sm`}>
                            {isExporting ? 'Exportando...' : 'Exportar'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Error Display */}
                {connectionError && (
                    <View style={tw`mt-2 bg-red-50 border border-red-200 rounded-lg p-2`}>
                        <View style={tw`flex-row items-center`}>
                            <MaterialIcons name="error" size={16} color="#DC2626" />
                            <Text style={tw`text-red-700 ml-2 flex-1 text-sm`}>{connectionError}</Text>
                            <TouchableOpacity onPress={clearErrors}>
                                <MaterialIcons name="close" size={16} color="#DC2626" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* <TouchableOpacity
                    onPress={() => setIsSettingsVisible(true)}
                    style={tw`bg-gray-100 p-2 rounded-lg ml-2`}
                >
                    <MaterialIcons name="settings" size={20} color="#6B7280" />
                </TouchableOpacity> */}
            </View>

            <ScrollView
                style={tw`flex-1`}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Real-time Stats */}
                {realTimeStats && (
                    <View style={tw`mx-4 mt-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4`}>
                        <Text style={tw`text-white font-bold text-lg mb-3`}>Status em Tempo Real</Text>
                        <View style={tw`flex-row justify-between`}>
                            <View style={tw`items-center`}>
                                <Text style={tw`text-2xl font-bold text-white`}>
                                    {realTimeStats.onlineUsers}
                                </Text>
                                <Text style={tw`text-blue-100 text-sm`}>Online</Text>
                            </View>
                            <View style={tw`items-center`}>
                                <Text style={tw`text-2xl font-bold text-white`}>
                                    {realTimeStats.activeSessions}
                                </Text>
                                <Text style={tw`text-blue-100 text-sm`}>Sessões Ativas</Text>
                            </View>
                            <View style={tw`items-center`}>
                                <Text style={tw`text-2xl font-bold text-white`}>
                                    {realTimeStats.activeConnections}
                                </Text>
                                <Text style={tw`text-blue-100 text-sm`}>Conexões</Text>
                            </View>
                            <View style={tw`items-center`}>
                                <View style={tw`flex-row items-center`}>
                                    <View style={tw`w-2 h-2 rounded-full bg-${systemHealthStatus.color}-400 mr-1`} />
                                    <Text style={tw`text-white font-medium text-sm`}>
                                        {systemHealthStatus.text}
                                    </Text>
                                </View>
                                <Text style={tw`text-blue-100 text-sm`}>Sistema</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Main Stats Grid */}
                <View style={tw`mx-4 mt-4`}>
                    <View style={tw`flex-row mb-4`}>
                        <StatCard
                            title="Total de Usuários"
                            value={dashboardStats?.totalUsers || 0}
                            icon="users"
                            color="blue"
                            isLoading={isLoadingStats}
                        />
                        <StatCard
                            title="Sessões Ativas"
                            value={dashboardStats?.activeSessions || 0}
                            icon="calendar"
                            color="green"
                            subtitle="Em andamento"
                            isLoading={isLoadingStats}
                        />
                    </View>

                    <View style={tw`flex-row mb-4`}>
                        <StatCard
                            title="Total de Sessões"
                            value={dashboardStats?.totalSessions || 0}
                            icon="book"
                            color="purple"
                            isLoading={isLoadingStats}
                        />
                        <StatCard
                            title="Sessões Pendentes"
                            value={dashboardStats?.pendingSessions || 0}
                            icon="clock"
                            color="orange"
                            subtitle="Aguardando"
                            isLoading={isLoadingStats}
                        />
                    </View>
                </View>

                {/* User Role Distribution */}
                {dashboardStats?.usersByRole && (
                    <View style={tw`mx-4 mb-4 bg-white rounded-xl p-4 shadow-sm`}>
                        <Text style={tw`font-bold text-gray-800 text-lg mb-4`}>Distribuição por Papel</Text>
                        <View style={tw`flex-row justify-between`}>
                            <View style={tw`items-center flex-1`}>
                                <Text style={tw`text-2xl font-bold text-blue-600`}>
                                    {dashboardStats.usersByRole.mentors || 0}
                                </Text>
                                <Text style={tw`text-gray-600 text-sm`}>Mentores</Text>
                                <View style={tw`w-full mt-2`}>
                                    <ProgressBar
                                        progress={dashboardStats.totalUsers > 0 ?
                                            (dashboardStats.usersByRole.mentors / dashboardStats.totalUsers) * 100 : 0
                                        }
                                        color="#3B82F6"
                                    />
                                </View>
                            </View>

                            <View style={tw`items-center flex-1 mx-4`}>
                                <Text style={tw`text-2xl font-bold text-green-600`}>
                                    {dashboardStats.usersByRole.mentees || 0}
                                </Text>
                                <Text style={tw`text-gray-600 text-sm`}>Mentorados</Text>
                                <View style={tw`w-full mt-2`}>
                                    <ProgressBar
                                        progress={dashboardStats.totalUsers > 0 ?
                                            (dashboardStats.usersByRole.mentees / dashboardStats.totalUsers) * 100 : 0
                                        }
                                        color="#10B981"
                                    />
                                </View>
                            </View>

                            <View style={tw`items-center flex-1`}>
                                <Text style={tw`text-2xl font-bold text-purple-600`}>
                                    {dashboardStats.usersByRole.coordinators || 0}
                                </Text>
                                <Text style={tw`text-gray-600 text-sm`}>Coordenadores</Text>
                                <View style={tw`w-full mt-2`}>
                                    <ProgressBar
                                        progress={dashboardStats.totalUsers > 0 ?
                                            (dashboardStats.usersByRole.coordinators / dashboardStats.totalUsers) * 100 : 0
                                        }
                                        color="#8B5CF6"
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Session Analytics Chart */}
                {dashboardStats?.sessionTrends && (
                    <View style={tw`mx-4 mb-4 bg-white rounded-xl p-4 shadow-sm`}>
                        <Text style={tw`font-bold text-gray-800 text-lg mb-4`}>Tendência de Sessões</Text>
                        <MiniChart data={dashboardStats.sessionTrends} />
                        <View style={tw`flex-row justify-between mt-3`}>
                            <Text style={tw`text-gray-500 text-sm`}>Últimos 7 dias</Text>
                            <Text style={tw`text-gray-500 text-sm`}>
                                Média: {dashboardStats.sessionTrends.length > 0 ?
                                    (dashboardStats.sessionTrends.reduce((a, b) => a + b, 0) / dashboardStats.sessionTrends.length).toFixed(1) : 0
                                } sessões/dia
                            </Text>
                        </View>
                    </View>
                )}

                {/* Recent Activity */}
                <View style={tw`mx-4 mb-4 bg-white rounded-xl p-4 shadow-sm`}>
                    <View style={tw`flex-row items-center justify-between mb-4`}>
                        <Text style={tw`font-bold text-gray-800 text-lg`}>Atividade Recente</Text>
                        <Text style={tw`text-gray-500 text-sm`}>
                            {recentActivity.length} atividades
                        </Text>
                    </View>

                    {recentActivity.length > 0 ? (
                        <View>
                            {recentActivity.slice(0, 5).map((activity, index) => (
                                <ActivityItem key={activity.id || index} item={activity} />
                            ))}

                            {recentActivity.length > 5 && (
                                <TouchableOpacity style={tw`mt-3 py-2`}>
                                    <Text style={tw`text-blue-500 text-center font-medium`}>
                                        Ver todas as atividades ({recentActivity.length - 5} mais)
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <View style={tw`items-center py-8`}>
                            <MaterialIcons name="timeline" size={48} color="#9CA3AF" />
                            <Text style={tw`text-gray-500 mt-2`}>Nenhuma atividade recente</Text>
                        </View>
                    )}
                </View>

                {/* User Analytics Section */}
                <View style={tw`mx-4 mb-6 bg-white rounded-xl p-4 shadow-sm`}>
                    <View style={tw`flex-row items-center justify-between mb-4`}>
                        <Text style={tw`font-bold text-gray-800 text-lg`}>Usuários Ativos</Text>
                        <Text style={tw`text-gray-500 text-sm`}>
                            {userAnalytics?.users.length || 0} usuários
                        </Text>
                    </View>

                    {isLoadingUsers ? (
                        <View style={tw`items-center py-8`}>
                            <ActivityIndicator size="large" color="#4F46E5" />
                            <Text style={tw`text-gray-500 mt-2`}>Carregando usuários...</Text>
                        </View>
                    ) : userAnalytics?.users && userAnalytics.users.length > 0 ? (
                        <FlatList
                            data={userAnalytics.users.slice(0, 10)} // Show first 10 users
                            renderItem={({ item }) => <UserItem item={item} />}
                            keyExtractor={(item) => item.userId}
                            scrollEnabled={false}
                            showsVerticalScrollIndicator={false}
                            ListFooterComponent={
                                userAnalytics.users.length > 10 ? (
                                    <TouchableOpacity
                                        style={tw`mt-3 py-3 bg-gray-50 rounded-xl`}
                                        onPress={() => {
                                            // Navigate to full user list
                                            // @ts-ignore
                                            navigation.navigate('UserManagement');
                                        }}
                                    >
                                        <Text style={tw`text-blue-500 text-center font-medium`}>
                                            Ver todos os usuários ({userAnalytics.users.length - 10} mais)
                                        </Text>
                                    </TouchableOpacity>
                                ) : null
                            }
                        />
                    ) : (
                        <View style={tw`items-center py-8`}>
                            <MaterialIcons name="people-outline" size={48} color="#9CA3AF" />
                            <Text style={tw`text-gray-500 mt-2`}>Nenhum usuário encontrado</Text>
                        </View>
                    )}
                </View>

                {/* System Performance */}
                {realTimeStats && (
                    <View style={tw`mx-4 mb-6 bg-white rounded-xl p-4 shadow-sm`}>
                        <Text style={tw`font-bold text-gray-800 text-lg mb-4`}>Performance do Sistema</Text>

                        <View style={tw`space-y-4`}>
                            <View>
                                <View style={tw`flex-row justify-between items-center mb-2`}>
                                    <Text style={tw`text-gray-600`}>Carga do Sistema</Text>
                                    <Text style={tw`text-gray-800 font-medium`}>
                                        {realTimeStats.systemLoad?.toFixed(1) || 0}%
                                    </Text>
                                </View>
                                <ProgressBar
                                    progress={realTimeStats.systemLoad || 0}
                                    color={realTimeStats.systemLoad > 80 ? "#EF4444" :
                                        realTimeStats.systemLoad > 60 ? "#F59E0B" : "#10B981"}
                                />
                            </View>

                            <View>
                                <View style={tw`flex-row justify-between items-center mb-2`}>
                                    <Text style={tw`text-gray-600`}>Taxa de Erro</Text>
                                    <Text style={tw`text-gray-800 font-medium`}>
                                        {realTimeStats.errorRate?.toFixed(2) || 0}%
                                    </Text>
                                </View>
                                <ProgressBar
                                    progress={realTimeStats.errorRate || 0}
                                    color={realTimeStats.errorRate > 5 ? "#EF4444" :
                                        realTimeStats.errorRate > 2 ? "#F59E0B" : "#10B981"}
                                />
                            </View>

                            {realTimeStats.uptime && (
                                <View style={tw`flex-row justify-between items-center`}>
                                    <Text style={tw`text-gray-600`}>Tempo de Atividade</Text>
                                    <Text style={tw`text-gray-800 font-medium`}>
                                        {Math.floor(realTimeStats.uptime / 3600)}h {Math.floor((realTimeStats.uptime % 3600) / 60)}m
                                    </Text>
                                </View>
                            )}

                            {realTimeStats.memoryUsage && (
                                <View>
                                    <View style={tw`flex-row justify-between items-center mb-2`}>
                                        <Text style={tw`text-gray-600`}>Uso de Memória</Text>
                                        <Text style={tw`text-gray-800 font-medium`}>
                                            {realTimeStats.memoryUsage.toFixed(1)}%
                                        </Text>
                                    </View>
                                    <ProgressBar
                                        progress={realTimeStats.memoryUsage}
                                        color={realTimeStats.memoryUsage > 85 ? "#EF4444" :
                                            realTimeStats.memoryUsage > 70 ? "#F59E0B" : "#10B981"}
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Bottom Spacing */}
                <View style={tw`h-20`} />
            </ScrollView>

            {/* Modals */}
            <UserDetailsModal />
            <PhotoViewerModal />
            {/* <DashboardSettingsComponent
                visible={isSettingsVisible}
                onClose={() => setIsSettingsVisible(false)}
                currentSettings={dashboardSettings}
                onSettingsChange={setDashboardSettings}
            /> */}
        </View>
    );
}

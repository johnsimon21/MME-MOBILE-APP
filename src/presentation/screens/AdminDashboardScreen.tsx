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
    Dimensions,
    StatusBar,
    Platform,
} from 'react-native';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Navbar } from '../components/ui/navbar';
import { useDashboardContext } from '../../context/DashboardContext';
import { useRealTimeDashboard } from '../../hooks/useRealTimeDashboard';
import { useExport } from '../../hooks/useExport';
import { useUsers } from '../../hooks/useUsers';
import { formatMessageTime } from '../../utils/dateFormatter';
import {
    ExportFormat,
    IUserAnalytics,
    ActivityType
} from '../../interfaces/dashboard.interface';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

export function AdminDashboardScreen() {
    const navigation = useNavigation();
    const [selectedUser, setSelectedUser] = useState<IUserAnalytics | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

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

    // Debug logs
    useEffect(() => {
        console.log('🎛️ Dashboard Debug:', {
            dashboardStats: !!dashboardStats,
            userAnalyticsCount: userAnalytics?.users?.length || 0,
            recentActivityCount: recentActivity?.length || 0,
            isLoadingStats,
            isLoadingUsers,
            connectionError,
        });
    }, [dashboardStats, userAnalytics, recentActivity, isLoadingStats, isLoadingUsers, connectionError]);

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

    // Focus effect to refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            console.log('🎛️ Dashboard screen focused, refreshing data...');
            refreshDashboardStats();
            refreshUserAnalytics();
        }, [])
    );

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

    // Modern Stat Card Component with native styles
    const StatCard = ({ title, value, icon, gradient, subtitle, isLoading }: any) => (
        <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            flex: 1,
            marginHorizontal: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 3,
        }}>
            <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: gradient[0] + '15',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
            }}>
                <Feather name={icon} size={24} color={gradient[0]} />
            </View>
            
            {isLoading ? (
                <ActivityIndicator size="small" color={gradient[0]} />
            ) : (
                <>
                    <Text style={{
                        fontSize: isTablet ? 32 : 28,
                        fontWeight: '700',
                        color: '#1F2937',
                        marginBottom: 4,
                    }}>{value}</Text>
                    <Text style={{
                        fontSize: 14,
                        color: '#6B7280',
                        fontWeight: '500',
                    }}>{title}</Text>
                    {subtitle && (
                        <Text style={{
                            fontSize: 12,
                            color: '#9CA3AF',
                            marginTop: 4,
                        }}>{subtitle}</Text>
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
    const getActivityIcon = (type: ActivityType): keyof typeof MaterialIcons.glyphMap => {
        switch (type) {
            case ActivityType.USER_REGISTERED: return 'person-add';
            case ActivityType.SESSION_CREATED: return 'event';
            case ActivityType.SESSION_COMPLETED: return 'check-circle';
            case ActivityType.CHAT_MESSAGE_SENT: return 'chat';
            case ActivityType.USER_LOGIN: return 'login';
            default: return 'info';
        }
    };

    // Enhanced time formatting using the same approach as chat/session
    const formatTimeAgo = (date: Date | string) => {
        try {
            const timestamp = typeof date === 'string' ? new Date(date) : date;
            if (isNaN(timestamp.getTime())) {
                console.warn('Invalid date in formatTimeAgo:', date);
                return 'Data inválida';
            }
            
            return formatMessageTime(timestamp.toISOString());
        } catch (error) {
            console.error('Error formatting time:', error);
            return 'Data inválida';
        }
    };

    // Progress Bar Component with native styles
    const ProgressBar = ({ progress, color = "#4F46E5" }: { progress: number; color?: string }) => (
        <View style={{
            width: '100%',
            height: 8,
            backgroundColor: '#F3F4F6',
            borderRadius: 4,
            overflow: 'hidden',
        }}>
            <View style={{
                height: '100%',
                width: `${Math.min(Math.max(progress, 0), 100)}%`,
                backgroundColor: color,
                borderRadius: 4,
            }} />
        </View>
    );

    // Modal control functions
    const openUserModal = (userData: IUserAnalytics) => {
        setSelectedUser(userData);
        setModalVisible(true);
    };

    const closeUserModal = () => {
        setModalVisible(false);
        setSelectedUser(null);
    };

    // Enhanced User Details Modal Component
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
                statusBarTranslucent
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'flex-end',
                }}>
                    <View style={{
                        backgroundColor: '#FFFFFF',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        height: height * 0.85,
                        paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
                    }}>
                        {/* Modal Header */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 20,
                            borderBottomWidth: 1,
                            borderBottomColor: '#F3F4F6',
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <View style={{ position: 'relative' }}>
                                    <Image
                                        source={{
                                            uri: selectedUser.profileImage ||
                                                `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.fullName)}&background=4F46E5&color=fff&size=64`
                                        }}
                                        style={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 28,
                                        }}
                                    />
                                    <View style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        width: 16,
                                        height: 16,
                                        borderRadius: 8,
                                        backgroundColor: getStatusColor(selectedUser.isOnline ? 'online' : 'offline'),
                                        borderWidth: 3,
                                        borderColor: '#FFFFFF',
                                    }} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 16 }}>
                                    <Text style={{
                                        fontSize: 18,
                                        fontWeight: '700',
                                        color: '#1F2937',
                                    }}>{selectedUser.fullName}</Text>
                                    <Text style={{
                                        fontSize: 14,
                                        color: '#6B7280',
                                        marginTop: 2,
                                    }}>{selectedUser.email}</Text>
                                    <Text style={{
                                        fontSize: 12,
                                        color: '#9CA3AF',
                                        textTransform: 'capitalize',
                                        marginTop: 2,
                                    }}>{selectedUser.role} • {selectedUser.school}</Text>
                                </View>
                            </View>
                            <TouchableOpacity 
                                onPress={closeUserModal} 
                                style={{
                                    padding: 8,
                                    borderRadius: 20,
                                    backgroundColor: '#F9FAFB',
                                }}
                            >
                                <Feather name="x" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                            {/* User Stats Grid */}
                            <View style={{ padding: 20 }}>
                                <View style={{
                                    backgroundColor: '#F8FAFC',
                                    borderRadius: 16,
                                    padding: 20,
                                    marginBottom: 20,
                                }}>
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: '600',
                                        color: '#374151',
                                        marginBottom: 16,
                                    }}>Estatísticas de Performance</Text>
                                    
                                    <View style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                    }}>
                                        <View style={{ alignItems: 'center', flex: 1 }}>
                                            <Text style={{
                                                fontSize: 24,
                                                fontWeight: '700',
                                                color: '#3B82F6',
                                            }}>{selectedUser.sessionsCount}</Text>
                                            <Text style={{
                                                fontSize: 12,
                                                color: '#6B7280',
                                                textAlign: 'center',
                                                marginTop: 4,
                                            }}>Total Sessões</Text>
                                        </View>
                                        
                                        <View style={{ alignItems: 'center', flex: 1 }}>
                                            <Text style={{
                                                fontSize: 24,
                                                fontWeight: '700',
                                                color: '#10B981',
                                            }}>{selectedUser.completedSessions}</Text>
                                            <Text style={{
                                                fontSize: 12,
                                                color: '#6B7280',
                                                textAlign: 'center',
                                                marginTop: 4,
                                            }}>Concluídas</Text>
                                        </View>
                                        
                                        <View style={{ alignItems: 'center', flex: 1 }}>
                                            <Text style={{
                                                fontSize: 24,
                                                fontWeight: '700',
                                                color: '#8B5CF6',
                                            }}>{selectedUser.completionRate.toFixed(1)}%</Text>
                                            <Text style={{
                                                fontSize: 12,
                                                color: '#6B7280',
                                                textAlign: 'center',
                                                marginTop: 4,
                                            }}>Taxa Conclusão</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Progress Indicators */}
                                <View style={{ marginBottom: 20 }}>
                                    <View style={{ marginBottom: 16 }}>
                                        <View style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: 8,
                                        }}>
                                            <Text style={{
                                                fontSize: 14,
                                                color: '#6B7280',
                                                fontWeight: '500',
                                            }}>Taxa de Conclusão</Text>
                                            <Text style={{
                                                fontSize: 14,
                                                color: '#1F2937',
                                                fontWeight: '600',
                                            }}>{selectedUser.completionRate.toFixed(1)}%</Text>
                                        </View>
                                        <ProgressBar progress={selectedUser.completionRate} color="#10B981" />
                                    </View>

                                    {selectedUser.averageRating && (
                                        <View>
                                            <View style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: 8,
                                            }}>
                                                <Text style={{
                                                    fontSize: 14,
                                                    color: '#6B7280',
                                                    fontWeight: '500',
                                                }}>Avaliação Média</Text>
                                                <Text style={{
                                                    fontSize: 14,
                                                    color: '#1F2937',
                                                    fontWeight: '600',
                                                }}>{selectedUser.averageRating.toFixed(1)}/5.0</Text>
                                            </View>
                                            <ProgressBar progress={(selectedUser.averageRating / 5) * 100} color="#F59E0B" />
                                        </View>
                                    )}
                                </View>

                                {/* User Details */}
                                <View style={{
                                    backgroundColor: '#FFFFFF',
                                    borderWidth: 1,
                                    borderColor: '#E5E7EB',
                                    borderRadius: 16,
                                    padding: 20,
                                }}>
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: '600',
                                        color: '#374151',
                                        marginBottom: 16,
                                    }}>Informações Detalhadas</Text>

                                    <View style={{ gap: 16 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <MaterialIcons name="school" size={20} color="#6B7280" />
                                            <Text style={{
                                                marginLeft: 12,
                                                fontSize: 14,
                                                color: '#6B7280',
                                                fontWeight: '500',
                                            }}>Escola:</Text>
                                            <Text style={{
                                                marginLeft: 8,
                                                fontSize: 14,
                                                fontWeight: '600',
                                                color: '#1F2937',
                                            }}>{selectedUser.school}</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <MaterialIcons name="person" size={20} color="#6B7280" />
                                            <Text style={{
                                                marginLeft: 12,
                                                fontSize: 14,
                                                color: '#6B7280',
                                                fontWeight: '500',
                                            }}>Papel:</Text>
                                            <Text style={{
                                                marginLeft: 8,
                                                fontSize: 14,
                                                fontWeight: '600',
                                                color: '#1F2937',
                                                textTransform: 'capitalize',
                                            }}>{selectedUser.role}</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <MaterialIcons name="today" size={20} color="#6B7280" />
                                            <Text style={{
                                                marginLeft: 12,
                                                fontSize: 14,
                                                color: '#6B7280',
                                                fontWeight: '500',
                                            }}>Membro desde:</Text>
                                            <Text style={{
                                                marginLeft: 8,
                                                fontSize: 14,
                                                fontWeight: '600',
                                                color: '#1F2937',
                                            }}>{formatTimeAgo(selectedUser.joinedDate)}</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <MaterialIcons name="access-time" size={20} color="#6B7280" />
                                            <Text style={{
                                                marginLeft: 12,
                                                fontSize: 14,
                                                color: '#6B7280',
                                                fontWeight: '500',
                                            }}>Último acesso:</Text>
                                            <Text style={{
                                                marginLeft: 8,
                                                fontSize: 14,
                                                fontWeight: '600',
                                                color: '#1F2937',
                                            }}>{formatTimeAgo(selectedUser.lastActive)}</Text>
                                        </View>

                                        {selectedUser.totalHours && (
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <MaterialIcons name="schedule" size={20} color="#6B7280" />
                                                <Text style={{
                                                    marginLeft: 12,
                                                    fontSize: 14,
                                                    color: '#6B7280',
                                                    fontWeight: '500',
                                                }}>Total de Horas:</Text>
                                                <Text style={{
                                                    marginLeft: 8,
                                                    fontSize: 14,
                                                    fontWeight: '600',
                                                    color: '#1F2937',
                                                }}>{selectedUser.totalHours.toFixed(1)}h</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Modal Actions */}
                        <View style={{
                            padding: 20,
                            borderTopWidth: 1,
                            borderTopColor: '#F3F4F6',
                            backgroundColor: '#FFFFFF',
                        }}>
                            <View style={{
                                flexDirection: 'row',
                                gap: 12,
                            }}>
                                <TouchableOpacity
                                    onPress={handleViewProfile}
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#3B82F6',
                                        paddingVertical: 16,
                                        borderRadius: 12,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <MaterialIcons name="visibility" size={20} color="white" />
                                    <Text style={{
                                        color: '#FFFFFF',
                                        fontWeight: '600',
                                        marginLeft: 8,
                                        fontSize: 16,
                                    }}>Ver Perfil</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleRemoveFromModal}
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#EF4444',
                                        paddingVertical: 16,
                                        borderRadius: 12,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <MaterialIcons name="delete" size={20} color="white" />
                                    <Text style={{
                                        color: '#FFFFFF',
                                        fontWeight: '600',
                                        marginLeft: 8,
                                        fontSize: 16,
                                    }}>Remover</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    // Enhanced User Item Component
    const UserItem = ({ item }: { item: IUserAnalytics }) => (
        <TouchableOpacity
            style={{
                backgroundColor: '#FFFFFF',
                padding: 16,
                borderRadius: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#F3F4F6',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
            }}
            onPress={() => openUserModal(item)}
            activeOpacity={0.7}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ position: 'relative' }}>
                    <Image
                        source={{
                            uri: item.profileImage ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(item.fullName)}&background=4F46E5&color=fff&size=48`
                        }}
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                        }}
                    />
                    <View style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: getStatusColor(item.isOnline ? 'online' : 'offline'),
                        borderWidth: 2,
                        borderColor: '#FFFFFF',
                    }} />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: '#1F2937',
                    }}>{item.fullName}</Text>
                    <Text style={{
                        fontSize: 13,
                        color: '#6B7280',
                        marginTop: 2,
                    }}>{item.email}</Text>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 4,
                    }}>
                        <Text style={{
                            fontSize: 12,
                            color: '#9CA3AF',
                            textTransform: 'capitalize',
                        }}>{item.role}</Text>
                        <Text style={{
                            fontSize: 12,
                            color: '#D1D5DB',
                            marginHorizontal: 6,
                        }}>•</Text>
                        <Text style={{
                            fontSize: 12,
                            color: '#9CA3AF',
                        }}>{item.school}</Text>
                    </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#1F2937',
                    }}>{item.sessionsCount} sessões</Text>
                    <Text style={{
                        fontSize: 12,
                        color: '#6B7280',
                        marginTop: 2,
                    }}>{item.completionRate.toFixed(0)}% conclusão</Text>
                    <Text style={{
                        fontSize: 11,
                        color: '#9CA3AF',
                        marginTop: 4,
                    }}>{formatTimeAgo(item.lastActive)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Enhanced Activity Item Component
    const ActivityItem = ({ item }: { item: any }) => (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
        }}>
            <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#EEF2FF',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
            }}>
                <MaterialIcons
                    name={getActivityIcon(item.type)}
                    size={20}
                    color="#4F46E5"
                />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{
                    fontSize: 14,
                    color: '#1F2937',
                    fontWeight: '500',
                    marginBottom: 2,
                }}>{item.description}</Text>
                <Text style={{
                    fontSize: 12,
                    color: '#6B7280',
                }}>{item.userName} • {formatTimeAgo(item.timestamp)}</Text>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
            <Navbar title="Dashboard Admin" />

            {/* Header with Connection Status */}
            <View style={{
                backgroundColor: '#FFFFFF',
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: connectionStatus.color === 'green' ? '#10B981' : 
                                           connectionStatus.color === 'yellow' ? '#F59E0B' : '#EF4444',
                            marginRight: 8,
                        }} />
                        <Text style={{
                            fontSize: 14,
                            color: '#6B7280',
                            fontWeight: '500',
                        }}>{connectionStatus.text}</Text>
                        {lastUpdate && (
                            <Text style={{
                                fontSize: 12,
                                color: '#9CA3AF',
                                marginLeft: 8,
                            }}>• {lastUpdate.toLocaleTimeString('pt-BR')}</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={handleExport}
                        disabled={isExporting}
                        style={{
                            backgroundColor: '#4F46E5',
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            opacity: isExporting ? 0.6 : 1,
                        }}
                    >
                        <Feather name="download" size={16} color="white" />
                        <Text style={{
                            color: '#FFFFFF',
                            fontWeight: '600',
                            marginLeft: 6,
                            fontSize: 14,
                        }}>{isExporting ? 'Exportando...' : 'Exportar'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Error Display */}
                {connectionError && (
                    <View style={{
                        marginTop: 12,
                        backgroundColor: '#FEF2F2',
                        borderWidth: 1,
                        borderColor: '#FECACA',
                        borderRadius: 12,
                        padding: 12,
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                            <MaterialIcons name="error" size={16} color="#DC2626" />
                            <Text style={{
                                color: '#B91C1C',
                                marginLeft: 8,
                                flex: 1,
                                fontSize: 13,
                            }}>{connectionError}</Text>
                            <TouchableOpacity onPress={clearErrors}>
                                <MaterialIcons name="close" size={16} color="#DC2626" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            <ScrollView
                style={{ flex: 1 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#4F46E5']}
                        tintColor="#4F46E5"
                    />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Real-time Stats Card */}
                {realTimeStats && (
                    <View style={{ marginHorizontal: 20, marginTop: 20 }}>
                        <LinearGradient
                            colors={['#4F46E5', '#7C3AED']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                borderRadius: 20,
                                padding: 24,
                            }}
                        >
                            <Text style={{
                                color: '#FFFFFF',
                                fontSize: 20,
                                fontWeight: '700',
                                marginBottom: 20,
                            }}>Status em Tempo Real</Text>
                            
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <View style={{ alignItems: 'center', flex: 1 }}>
                                    <Text style={{
                                        fontSize: isTablet ? 32 : 28,
                                        fontWeight: '800',
                                        color: '#FFFFFF',
                                    }}>{realTimeStats.onlineUsers}</Text>
                                    <Text style={{
                                        fontSize: 12,
                                        color: '#C7D2FE',
                                        textAlign: 'center',
                                    }}>Usuários Online</Text>
                                </View>
                                
                                <View style={{ alignItems: 'center', flex: 1 }}>
                                    <Text style={{
                                        fontSize: isTablet ? 32 : 28,
                                        fontWeight: '800',
                                        color: '#FFFFFF',
                                    }}>{realTimeStats.activeSessions}</Text>
                                    <Text style={{
                                        fontSize: 12,
                                        color: '#C7D2FE',
                                        textAlign: 'center',
                                    }}>Sessões Ativas</Text>
                                </View>
                                
                                <View style={{ alignItems: 'center', flex: 1 }}>
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginBottom: 4,
                                    }}>
                                        <View style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor: systemHealthStatus.color === 'green' ? '#10B981' : 
                                                           systemHealthStatus.color === 'orange' ? '#F59E0B' : '#EF4444',
                                            marginRight: 6,
                                        }} />
                                        <Text style={{
                                            color: '#FFFFFF',
                                            fontSize: isTablet ? 18 : 16,
                                            fontWeight: '700',
                                        }}>{systemHealthStatus.text}</Text>
                                    </View>
                                    <Text style={{
                                        fontSize: 12,
                                        color: '#C7D2FE',
                                        textAlign: 'center',
                                    }}>Sistema</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>
                )}

                {/* Main Stats Grid */}
                <View style={{ marginHorizontal: 20, marginTop: 20 }}>
                    <View style={{
                        flexDirection: 'row',
                        marginBottom: 16,
                    }}>
                        <StatCard
                            title="Total Usuários"
                            value={dashboardStats?.totalUsers || 0}
                            icon="users"
                            gradient={['#3B82F6', '#1E40AF']}
                            isLoading={isLoadingStats}
                        />
                        <StatCard
                            title="Sessões Ativas"
                            value={dashboardStats?.activeSessions || 0}
                            icon="calendar"
                            gradient={['#10B981', '#059669']}
                            subtitle="Em andamento"
                            isLoading={isLoadingStats}
                        />
                    </View>

                    <View style={{ flexDirection: 'row' }}>
                        <StatCard
                            title="Total Sessões"
                            value={dashboardStats?.totalSessions || 0}
                            icon="book"
                            gradient={['#8B5CF6', '#7C3AED']}
                            isLoading={isLoadingStats}
                        />
                        <StatCard
                            title="Pendentes"
                            value={dashboardStats?.pendingSessions || 0}
                            icon="clock"
                            gradient={['#F59E0B', '#D97706']}
                            subtitle="Aguardando"
                            isLoading={isLoadingStats}
                        />
                    </View>
                </View>

                {/* User Role Distribution */}
                {dashboardStats?.usersByRole && (
                    <View style={{
                        marginHorizontal: 20,
                        marginTop: 24,
                        backgroundColor: '#FFFFFF',
                        borderRadius: 20,
                        padding: 24,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 12,
                        elevation: 3,
                    }}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            color: '#1F2937',
                            marginBottom: 20,
                        }}>Distribuição por Papel</Text>
                        
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                        }}>
                            <View style={{ alignItems: 'center', flex: 1 }}>
                                <Text style={{
                                    fontSize: 24,
                                    fontWeight: '700',
                                    color: '#3B82F6',
                                }}>{dashboardStats.usersByRole.mentors || 0}</Text>
                                <Text style={{
                                    fontSize: 13,
                                    color: '#6B7280',
                                    marginBottom: 8,
                                }}>Mentores</Text>
                                <View style={{ width: '100%' }}>
                                    <ProgressBar
                                        progress={dashboardStats.totalUsers > 0 ?
                                            (dashboardStats.usersByRole.mentors / dashboardStats.totalUsers) * 100 : 0
                                        }
                                        color="#3B82F6"
                                    />
                                </View>
                            </View>

                            <View style={{ alignItems: 'center', flex: 1, marginHorizontal: 16 }}>
                                <Text style={{
                                    fontSize: 24,
                                    fontWeight: '700',
                                    color: '#10B981',
                                }}>{dashboardStats.usersByRole.mentees || 0}</Text>
                                <Text style={{
                                    fontSize: 13,
                                    color: '#6B7280',
                                    marginBottom: 8,
                                }}>Mentorados</Text>
                                <View style={{ width: '100%' }}>
                                    <ProgressBar
                                        progress={dashboardStats.totalUsers > 0 ?
                                            (dashboardStats.usersByRole.mentees / dashboardStats.totalUsers) * 100 : 0
                                        }
                                        color="#10B981"
                                    />
                                </View>
                            </View>

                            <View style={{ alignItems: 'center', flex: 1 }}>
                                <Text style={{
                                    fontSize: 24,
                                    fontWeight: '700',
                                    color: '#8B5CF6',
                                }}>{dashboardStats.usersByRole.coordinators || 0}</Text>
                                <Text style={{
                                    fontSize: 13,
                                    color: '#6B7280',
                                    marginBottom: 8,
                                }}>Coordenadores</Text>
                                <View style={{ width: '100%' }}>
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

                {/* Recent Activity */}
                <View style={{
                    marginHorizontal: 20,
                    marginTop: 24,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    padding: 24,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 3,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 20,
                    }}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            color: '#1F2937',
                        }}>Atividade Recente</Text>
                        <Text style={{
                            fontSize: 13,
                            color: '#6B7280',
                        }}>{recentActivity?.length || 0} atividades</Text>
                    </View>

                    {recentActivity && recentActivity.length > 0 ? (
                        <View>
                            {recentActivity.slice(0, 6).map((activity, index) => (
                                <ActivityItem key={activity.id || index} item={activity} />
                            ))}

                            {recentActivity.length > 6 && (
                                <TouchableOpacity style={{
                                    marginTop: 16,
                                    paddingVertical: 12,
                                    backgroundColor: '#F9FAFB',
                                    borderRadius: 12,
                                    alignItems: 'center',
                                }}>
                                    <Text style={{
                                        color: '#4F46E5',
                                        fontWeight: '600',
                                        fontSize: 14,
                                    }}>Ver todas as atividades ({recentActivity.length - 6} mais)</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <View style={{
                            alignItems: 'center',
                            paddingVertical: 40,
                        }}>
                            <MaterialIcons name="timeline" size={48} color="#D1D5DB" />
                            <Text style={{
                                color: '#9CA3AF',
                                marginTop: 12,
                                fontSize: 14,
                            }}>Nenhuma atividade recente</Text>
                        </View>
                    )}
                </View>

                {/* User Analytics Section */}
                <View style={{
                    marginHorizontal: 20,
                    marginTop: 24,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    padding: 24,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 3,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 20,
                    }}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            color: '#1F2937',
                        }}>Usuários Ativos</Text>
                        <Text style={{
                            fontSize: 13,
                            color: '#6B7280',
                        }}>{userAnalytics?.users?.length || 0} usuários</Text>
                    </View>

                    {isLoadingUsers ? (
                        <View style={{
                            alignItems: 'center',
                            paddingVertical: 40,
                        }}>
                            <ActivityIndicator size="large" color="#4F46E5" />
                            <Text style={{
                                color: '#9CA3AF',
                                marginTop: 12,
                                fontSize: 14,
                            }}>Carregando usuários...</Text>
                        </View>
                    ) : userAnalytics?.users && userAnalytics.users.length > 0 ? (
                        <FlatList
                            data={userAnalytics.users.slice(0, 8)} // Show first 8 users for better performance
                            renderItem={({ item }) => <UserItem item={item} />}
                            keyExtractor={(item) => item.userId}
                            scrollEnabled={false}
                            showsVerticalScrollIndicator={false}
                            ListFooterComponent={
                                userAnalytics.users.length > 8 ? (
                                    <TouchableOpacity
                                        style={{
                                            marginTop: 16,
                                            paddingVertical: 16,
                                            backgroundColor: '#F9FAFB',
                                            borderRadius: 12,
                                            alignItems: 'center',
                                        }}
                                        onPress={() => {
                                            // Navigate to full user list
                                            // @ts-ignore
                                            navigation.navigate('UserManagement');
                                        }}
                                    >
                                        <Text style={{
                                            color: '#4F46E5',
                                            fontWeight: '600',
                                            fontSize: 14,
                                        }}>Ver todos os usuários ({userAnalytics.users.length - 8} mais)</Text>
                                    </TouchableOpacity>
                                ) : null
                            }
                        />
                    ) : (
                        <View style={{
                            alignItems: 'center',
                            paddingVertical: 40,
                        }}>
                            <MaterialIcons name="people-outline" size={48} color="#D1D5DB" />
                            <Text style={{
                                color: '#9CA3AF',
                                marginTop: 12,
                                fontSize: 14,
                            }}>Nenhum usuário encontrado</Text>
                        </View>
                    )}
                </View>

                {/* Simplified System Performance - only if really needed */}
                {realTimeStats && realTimeStats.systemLoad && (
                    <View style={{
                        marginHorizontal: 20,
                        marginTop: 24,
                        backgroundColor: '#FFFFFF',
                        borderRadius: 20,
                        padding: 24,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 12,
                        elevation: 3,
                    }}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            color: '#1F2937',
                            marginBottom: 20,
                        }}>Performance do Sistema</Text>

                        <View style={{ gap: 16 }}>
                            <View>
                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 8,
                                }}>
                                    <Text style={{
                                        fontSize: 14,
                                        color: '#6B7280',
                                        fontWeight: '500',
                                    }}>Carga do Sistema</Text>
                                    <Text style={{
                                        fontSize: 14,
                                        color: '#1F2937',
                                        fontWeight: '600',
                                    }}>{realTimeStats.systemLoad?.toFixed(1) || 0}%</Text>
                                </View>
                                <ProgressBar
                                    progress={realTimeStats.systemLoad || 0}
                                    color={realTimeStats.systemLoad > 80 ? "#EF4444" :
                                        realTimeStats.systemLoad > 60 ? "#F59E0B" : "#10B981"}
                                />
                            </View>

                            {realTimeStats.errorRate !== undefined && (
                                <View>
                                    <View style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 8,
                                    }}>
                                        <Text style={{
                                            fontSize: 14,
                                            color: '#6B7280',
                                            fontWeight: '500',
                                        }}>Taxa de Erro</Text>
                                        <Text style={{
                                            fontSize: 14,
                                            color: '#1F2937',
                                            fontWeight: '600',
                                        }}>{realTimeStats.errorRate?.toFixed(2) || 0}%</Text>
                                    </View>
                                    <ProgressBar
                                        progress={realTimeStats.errorRate || 0}
                                        color={realTimeStats.errorRate > 5 ? "#EF4444" :
                                            realTimeStats.errorRate > 2 ? "#F59E0B" : "#10B981"}
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Modals */}
            <UserDetailsModal />
        </View>
    );
}

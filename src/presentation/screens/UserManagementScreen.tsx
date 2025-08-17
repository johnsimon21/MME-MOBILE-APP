import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    Image,
    TextInput,
    Modal,
    ActivityIndicator,
    RefreshControl,
    StatusBar,
    Platform,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Navbar } from '../components/ui/navbar';
import { useDashboardContext } from '../../context/DashboardContext';
import { useUsers } from '../../hooks/useUsers';
import { formatMessageTime } from '../../utils/dateFormatter';
import { IUserAnalytics } from '../../interfaces/dashboard.interface';

export function UserManagementScreen() {
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<'all' | 'mentor' | 'mentee' | 'coordinator'>('all');
    const [selectedUser, setSelectedUser] = useState<IUserAnalytics | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Context and hooks
    const {
        userAnalytics,
        isLoadingUsers,
        connectionError,
        refreshUserAnalytics,
        clearErrors,
    } = useDashboardContext();

    const { deleteUser } = useUsers();

    // Debug logs
    useEffect(() => {
        console.log('👥 UserManagement Debug:', {
            userCount: userAnalytics?.users?.length || 0,
            isLoading: isLoadingUsers,
            error: connectionError,
        });
    }, [userAnalytics, isLoadingUsers, connectionError]);

    // Focus effect to refresh data
    useFocusEffect(
        useCallback(() => {
            console.log('👥 UserManagement screen focused, refreshing...');
            refreshUserAnalytics();
        }, [])
    );

    // Refresh function
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refreshUserAnalytics();
            clearErrors();
        } catch (error) {
            console.error('Refresh error:', error);
            Alert.alert('Erro', 'Falha ao atualizar lista de usuários');
        } finally {
            setRefreshing(false);
        }
    }, [refreshUserAnalytics, clearErrors]);

    // Filter users based on search and role
    const filteredUsers = userAnalytics?.users?.filter(user => {
        const matchesSearch = !searchQuery || 
            user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesRole = selectedRole === 'all' || user.role === selectedRole;
        
        return matchesSearch && matchesRole;
    }) || [];

    // Get status color
    const getStatusColor = (isOnline: boolean) => {
        return isOnline ? '#10B981' : '#6B7280';
    };

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
                            
                            if (selectedUser?.userId === userId) {
                                setModalVisible(false);
                                setSelectedUser(null);
                            }
                            
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

    // Role Filter Button
    const RoleFilterButton = ({ role, label }: { role: typeof selectedRole, label: string }) => (
        <TouchableOpacity
            style={{
                backgroundColor: selectedRole === role ? '#4F46E5' : '#F3F4F6',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
            }}
            onPress={() => setSelectedRole(role)}
        >
            <Text style={{
                color: selectedRole === role ? '#FFFFFF' : '#6B7280',
                fontSize: 14,
                fontWeight: '600',
            }}>{label}</Text>
        </TouchableOpacity>
    );

    // User Item Component
    const UserItem = ({ item }: { item: IUserAnalytics }) => (
        <TouchableOpacity
            style={{
                backgroundColor: '#FFFFFF',
                padding: 16,
                borderRadius: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: '#F3F4F6',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
            }}
            onPress={() => {
                setSelectedUser(item);
                setModalVisible(true);
            }}
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
                        backgroundColor: getStatusColor(item.isOnline),
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
                        <View style={{
                            backgroundColor: item.role === 'coordinator' ? '#8B5CF6' : 
                                           item.role === 'mentor' ? '#3B82F6' : '#10B981',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 12,
                        }}>
                            <Text style={{
                                fontSize: 11,
                                color: '#FFFFFF',
                                fontWeight: '600',
                                textTransform: 'capitalize',
                            }}>{item.role}</Text>
                        </View>
                        <Text style={{
                            fontSize: 12,
                            color: '#9CA3AF',
                            marginLeft: 8,
                        }}>{item.school}</Text>
                    </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#1F2937',
                    }}>{item.sessionsCount}</Text>
                    <Text style={{
                        fontSize: 11,
                        color: '#6B7280',
                        marginTop: 2,
                    }}>sessões</Text>
                    <Text style={{
                        fontSize: 10,
                        color: '#9CA3AF',
                        marginTop: 4,
                    }}>{formatMessageTime(item.lastActive)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    // User Details Modal
    const UserDetailsModal = () => {
        if (!selectedUser) return null;

        const handleViewProfile = () => {
            setModalVisible(false);
            setSelectedUser(null);
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
                onRequestClose={() => {
                    setModalVisible(false);
                    setSelectedUser(null);
                }}
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
                        maxHeight: '80%',
                        paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
                    }}>
                        {/* Header */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 20,
                            borderBottomWidth: 1,
                            borderBottomColor: '#F3F4F6',
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
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
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    setModalVisible(false);
                                    setSelectedUser(null);
                                }}
                                style={{
                                    padding: 8,
                                    borderRadius: 20,
                                    backgroundColor: '#F9FAFB',
                                }}
                            >
                                <Feather name="x" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
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
                                }}>Informações</Text>
                                
                                <View style={{ gap: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MaterialIcons name="person" size={20} color="#6B7280" />
                                        <Text style={{
                                            marginLeft: 12,
                                            fontSize: 14,
                                            color: '#6B7280',
                                        }}>Papel:</Text>
                                        <View style={{
                                            backgroundColor: selectedUser.role === 'coordinator' ? '#8B5CF6' : 
                                                           selectedUser.role === 'mentor' ? '#3B82F6' : '#10B981',
                                            paddingHorizontal: 12,
                                            paddingVertical: 4,
                                            borderRadius: 12,
                                            marginLeft: 8,
                                        }}>
                                            <Text style={{
                                                fontSize: 12,
                                                color: '#FFFFFF',
                                                fontWeight: '600',
                                                textTransform: 'capitalize',
                                            }}>{selectedUser.role}</Text>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MaterialIcons name="school" size={20} color="#6B7280" />
                                        <Text style={{
                                            marginLeft: 12,
                                            fontSize: 14,
                                            color: '#6B7280',
                                        }}>Escola:</Text>
                                        <Text style={{
                                            marginLeft: 8,
                                            fontSize: 14,
                                            fontWeight: '600',
                                            color: '#1F2937',
                                        }}>{selectedUser.school}</Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MaterialIcons name="today" size={20} color="#6B7280" />
                                        <Text style={{
                                            marginLeft: 12,
                                            fontSize: 14,
                                            color: '#6B7280',
                                        }}>Membro desde:</Text>
                                        <Text style={{
                                            marginLeft: 8,
                                            fontSize: 14,
                                            fontWeight: '600',
                                            color: '#1F2937',
                                        }}>{formatMessageTime(selectedUser.joinedDate)}</Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MaterialIcons name="access-time" size={20} color="#6B7280" />
                                        <Text style={{
                                            marginLeft: 12,
                                            fontSize: 14,
                                            color: '#6B7280',
                                        }}>Último acesso:</Text>
                                        <Text style={{
                                            marginLeft: 8,
                                            fontSize: 14,
                                            fontWeight: '600',
                                            color: '#1F2937',
                                        }}>{formatMessageTime(selectedUser.lastActive)}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Stats */}
                            <View style={{
                                flexDirection: 'row',
                                backgroundColor: '#F8FAFC',
                                borderRadius: 16,
                                padding: 20,
                                marginBottom: 20,
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
                                    }}>Concluídas</Text>
                                </View>
                                
                                <View style={{ alignItems: 'center', flex: 1 }}>
                                    <Text style={{
                                        fontSize: 24,
                                        fontWeight: '700',
                                        color: '#8B5CF6',
                                    }}>{selectedUser.completionRate.toFixed(0)}%</Text>
                                    <Text style={{
                                        fontSize: 12,
                                        color: '#6B7280',
                                        textAlign: 'center',
                                    }}>Taxa Conclusão</Text>
                                </View>
                            </View>
                        </View>

                        {/* Actions */}
                        <View style={{
                            padding: 20,
                            borderTopWidth: 1,
                            borderTopColor: '#F3F4F6',
                            backgroundColor: '#FFFFFF',
                        }}>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
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

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
            <Navbar title="Gerenciar Usuários" showBackButton={true} />

            {/* Search and Filters */}
            <View style={{
                backgroundColor: '#FFFFFF',
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
            }}>
                {/* Search Input */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F9FAFB',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    marginBottom: 16,
                }}>
                    <Feather name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        style={{
                            flex: 1,
                            marginLeft: 12,
                            fontSize: 16,
                            color: '#1F2937',
                        }}
                        placeholder="Buscar por nome ou email..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Feather name="x" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Role Filters */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <RoleFilterButton role="all" label="Todos" />
                    <RoleFilterButton role="mentor" label="Mentores" />
                    <RoleFilterButton role="mentee" label="Mentorados" />
                    <RoleFilterButton role="coordinator" label="Coordenadores" />
                </View>

                {/* Results Count */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 16,
                }}>
                    <Text style={{
                        fontSize: 14,
                        color: '#6B7280',
                    }}>
                        {filteredUsers.length} de {userAnalytics?.total || 0} usuários
                    </Text>
                    
                    {connectionError && (
                        <TouchableOpacity onPress={clearErrors}>
                            <MaterialIcons name="error" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Users List */}
            <FlatList
                data={filteredUsers}
                renderItem={({ item }) => <UserItem item={item} />}
                keyExtractor={(item) => item.userId}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#4F46E5']}
                        tintColor="#4F46E5"
                    />
                }
                ListEmptyComponent={() => (
                    <View style={{
                        alignItems: 'center',
                        paddingVertical: 60,
                    }}>
                        {isLoadingUsers ? (
                            <>
                                <ActivityIndicator size="large" color="#4F46E5" />
                                <Text style={{
                                    color: '#9CA3AF',
                                    marginTop: 16,
                                    fontSize: 16,
                                }}>Carregando usuários...</Text>
                            </>
                        ) : (
                            <>
                                <MaterialIcons name="people-outline" size={64} color="#D1D5DB" />
                                <Text style={{
                                    color: '#9CA3AF',
                                    marginTop: 16,
                                    fontSize: 16,
                                    fontWeight: '600',
                                }}>Nenhum usuário encontrado</Text>
                                <Text style={{
                                    color: '#D1D5DB',
                                    marginTop: 8,
                                    fontSize: 14,
                                    textAlign: 'center',
                                }}>
                                    {searchQuery || selectedRole !== 'all' 
                                        ? 'Tente ajustar os filtros de busca'
                                        : 'Nenhum usuário cadastrado ainda'
                                    }
                                </Text>
                            </>
                        )}
                    </View>
                )}
            />

            {/* Modal */}
            <UserDetailsModal />
        </View>
    );
}

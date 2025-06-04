import { useAuth } from '@/src/context/AuthContext';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, FlatList, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';
import { Navbar } from '../components/ui/navbar';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'online' | 'offline' | 'away';
    lastActive: string;
    sessionsCount: number;
    joinedDate: string;
    totalHours: number;
    completionRate: number;
    averageRating: number;
    profile: string;
    monthlyProgress: number[];
    recentSessions: {
        date: string;
        duration: number;
        type: string;
        rating: number;
    }[];
}


interface DashboardStats {
    totalUsers: number;
    activeSessions: number;
    totalSessions: number;
    pendingSessions: number;
}

export function AdminDashboardScreen() {
    const { user } = useAuth();
    const navigation = useNavigation();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
    const [photoViewerUser, setPhotoViewerUser] = useState<User | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 156,
        activeSessions: 12,
        totalSessions: 1247,
        pendingSessions: 8,
    });

    const [users, setUsers] = useState<User[]>([
        {
            id: "1",
            name: "Lukombo Afonso",
            email: "lukombo@example.com",
            role: "admin",
            status: "online",
            lastActive: "Agora",
            sessionsCount: 15,
            joinedDate: "2024-03-15",
            totalHours: 45.5,
            completionRate: 87,
            averageRating: 4.2,
            profile: "https://randomuser.me/api/portraits/men/1.jpg", // Add profile image
            monthlyProgress: [12, 8, 15, 10, 18, 14, 20],
            recentSessions: [
                { date: "2025-01-15", duration: 60, type: "Mentoria", rating: 5 },
                { date: "2025-01-12", duration: 45, type: "Coaching", rating: 4 },
                { date: "2025-01-10", duration: 30, type: "Feedback", rating: 4 }
            ]
        },
        {
            id: "2",
            name: "Lucy Script",
            email: "lucy@example.com",
            role: "user",
            status: "online",
            lastActive: "Agora",
            sessionsCount: 16,
            joinedDate: "2024-03-15",
            totalHours: 45.5,
            completionRate: 87,
            averageRating: 4.2,
            profile: "https://randomuser.me/api/portraits/women/2.jpg", // Add profile image
            monthlyProgress: [12, 8, 15, 10, 18, 14, 20],
            recentSessions: [
                { date: "2025-01-15", duration: 60, type: "Mentoria", rating: 5 },
                { date: "2025-01-12", duration: 45, type: "Coaching", rating: 4 },
                { date: "2025-01-10", duration: 30, type: "Feedback", rating: 4 }
            ]
        },
        {
            id: "3",
            name: "Java Simon",
            email: "java@example.com",
            role: "user",
            status: "online",
            lastActive: "Agora",
            sessionsCount: 14,
            joinedDate: "2024-03-15",
            totalHours: 45.5,
            completionRate: 87,
            averageRating: 4.2,
            profile: "https://randomuser.me/api/portraits/men/3.jpg", // Add profile image
            monthlyProgress: [12, 8, 15, 10, 18, 14, 20],
            recentSessions: [
                { date: "2025-01-15", duration: 60, type: "Mentoria", rating: 5 },
                { date: "2025-01-12", duration: 45, type: "Coaching", rating: 4 },
                { date: "2025-01-10", duration: 30, type: "Feedback", rating: 4 }
            ]
        },
        {
            id: "4",
            name: "Jocy Simon",
            email: "jocy@example.com",
            role: "user",
            status: "offline",
            lastActive: "2 horas atrás",
            sessionsCount: 14,
            joinedDate: "2024-03-15",
            totalHours: 45.5,
            completionRate: 87,
            averageRating: 4.2,
            profile: "https://randomuser.me/api/portraits/women/4.jpg", // Add profile image
            monthlyProgress: [12, 8, 15, 10, 18, 14, 20],
            recentSessions: [
                { date: "2025-01-15", duration: 60, type: "Mentoria", rating: 5 },
                { date: "2025-01-12", duration: 45, type: "Coaching", rating: 4 },
                { date: "2025-01-10", duration: 30, type: "Feedback", rating: 4 }
            ]
        },
        {
            id: "5",
            name: "Cardoso Manuel",
            email: "cardoso@example.com",
            role: "user",
            status: "away",
            lastActive: "5 min atrás",
            sessionsCount: 8,
            joinedDate: "2024-05-20",
            totalHours: 24.0,
            completionRate: 92,
            averageRating: 4.5,
            profile: "https://randomuser.me/api/portraits/men/5.jpg", // Add profile image
            monthlyProgress: [5, 3, 8, 6, 12, 9, 15],
            recentSessions: [
                { date: "2025-01-14", duration: 50, type: "Mentoria", rating: 5 },
                { date: "2025-01-11", duration: 40, type: "Coaching", rating: 4 }
            ]
        }
    ]);


    const handleRemoveUser = (userId: string, userName: string) => {
        Alert.alert(
            "Remover Usuário",
            `Tem certeza que deseja remover ${userName}? Esta ação não pode ser desfeita.`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Remover",
                    style: "destructive",
                    onPress: () => {
                        // Remove user from the list
                        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));

                        // Close modal if the removed user was selected
                        if (selectedUser?.id === userId) {
                            closeUserModal();
                        }

                        // Show success message
                        Alert.alert("Sucesso", `${userName} foi removido com sucesso.`);
                    }
                }
            ]
        );
    };

    const StatCard = ({ title, value, icon, color }: any) => (
        <View style={tw`bg-white p-4 rounded-xl shadow-sm flex-1 mx-1`}>
            <View style={tw`w-10 h-10 rounded-full bg-${color}-100 items-center justify-center mb-2`}>
                <Feather name={icon} size={20} color="#4F46E5" />
            </View>
            <Text style={tw`text-2xl font-bold text-gray-800 mb-1`}>{value}</Text>
            <Text style={tw`text-gray-600 text-sm`}>{title}</Text>
        </View>
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return '#10B981'; // Green
            case 'away': return '#F59E0B'; // Yellow
            case 'offline': return '#6B7280'; // Gray
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

    // Simple progress bar component
    const ProgressBar = ({ progress, color = "#4F46E5" }: { progress: number; color?: string }) => (
        <View style={tw`w-full h-2 bg-gray-200 rounded-full overflow-hidden`}>
            <View
                style={[
                    tw`h-full rounded-full`,
                    { width: `${progress}%`, backgroundColor: color }
                ]}
            />
        </View>
    );

    // Simple chart component for monthly progress
    const MiniChart = ({ data }: { data: number[] }) => {
        const maxValue = Math.max(...data);
        return (
            <View style={tw`flex-row items-end h-16 bg-gray-50 rounded-lg p-2`}>
                {data.map((value, index) => (
                    <View key={index} style={tw`flex-1 items-center mx-0.5`}>
                        <View
                            style={[
                                tw`bg-blue-500 rounded-t-sm w-full`,
                                { height: (value / maxValue) * 40 }
                            ]}
                        />
                        <Text style={tw`text-xs text-gray-500 mt-1`}>
                            {['J', 'F', 'M', 'A', 'M', 'J', 'J'][index]}
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    // Modal control functions
    const openUserModal = (userData: User) => {
        setSelectedUser(userData);
        setModalVisible(true);
    };

    const closeUserModal = () => {
        setModalVisible(false);
        setSelectedUser(null);
    };

    const openPhotoViewer = (user: User) => {
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
                        <Text style={tw`text-white text-xl font-bold`}>{photoViewerUser.name}</Text>
                        <Text style={tw`text-gray-300 text-sm`}>{photoViewerUser.role}</Text>
                    </View>

                    <View
                        style={tw`flex-1 justify-center items-center w-full`}
                    >
                        <Image
                            source={{ uri: photoViewerUser.profile }}
                            style={tw`w-full h-full`}
                            resizeMode="contain"
                            defaultSource={{ uri: 'https://via.placeholder.com/400x400/CCCCCC/FFFFFF?text=' + photoViewerUser.name.charAt(0) }}
                        />
                    </View>

                    <View style={tw`absolute bottom-12 left-4 right-4 bg-black bg-opacity-50 rounded-xl p-4`}>
                        <View style={tw`flex-row items-center justify-between`}>
                            <View>
                                <Text style={tw`text-white font-medium`}>Status: {getStatusText(photoViewerUser.status)}</Text>
                                <Text style={tw`text-gray-300 text-sm`}>Último acesso: {photoViewerUser.lastActive}</Text>
                            </View>
                            <View
                                style={[
                                    tw`w-4 h-4 rounded-full`,
                                    { backgroundColor: getStatusColor(photoViewerUser.status) }
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
            navigation.navigate('UserProfile', { userId: selectedUser.id });
        };

        const handleRemoveFromModal = () => {
            handleRemoveUser(selectedUser.id, selectedUser.name);
        };

        return (
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeUserModal}
            >
                <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
                    <View style={tw`bg-white rounded-t-3xl h-4/5 `}>
                        {/* Modal Header */}
                        <View style={tw`flex-row items-center justify-between p-4 border-b border-gray-200`}>
                            <View style={tw`flex-row items-center flex-1`}>
                                <TouchableOpacity
                                    onPress={() => {
                                        closeUserModal(); // Close modal first
                                        setTimeout(() => openPhotoViewer(selectedUser), 100); // Then open photo viewer
                                    }}
                                    style={tw`w-12 h-12 rounded-full mr-3 relative`}
                                    activeOpacity={0.8}
                                >
                                    <Image
                                        source={{ uri: selectedUser.profile }}
                                        style={tw`w-12 h-12 rounded-full`}
                                        defaultSource={{ uri: 'https://via.placeholder.com/48x48/CCCCCC/FFFFFF?text=' + selectedUser.name.charAt(0) }}
                                    />
                                    <View
                                        style={[
                                            tw`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white`,
                                            { backgroundColor: getStatusColor(selectedUser.status) }
                                        ]}
                                    />
                                    {/* Add zoom icon overlay */}
                                    <View style={tw`absolute inset-0 rounded-full bg-black bg-opacity-20 items-center justify-center`}>
                                        <MaterialIcons name="zoom-in" size={12} color="white" style={tw`opacity-70`} />
                                    </View>
                                </TouchableOpacity>
                                <View style={tw`flex-1`}>
                                    <Text style={tw`font-bold text-gray-800 text-lg`}>{selectedUser.name}</Text>
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
                                        <Text style={tw`font-medium`}>{getStatusText(selectedUser.status)}</Text>
                                    </View>
                                    {selectedUser.role === 'admin' && (
                                        <View style={tw`bg-purple-100 px-3 py-1 rounded-full`}>
                                            <Text style={tw`text-purple-800 text-sm font-medium`}>Admin</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Stats Grid */}
                                <View style={tw`bg-gray-50 rounded-xl p-4 mb-4`}>
                                    <Text style={tw`font-bold text-gray-800 mb-3`}>Estatísticas</Text>
                                    <View style={tw`flex-row justify-between mb-4`}>
                                        <View style={tw`items-center flex-1`}>
                                            <Text style={tw`text-2xl font-bold text-gray-800`}>{selectedUser.totalHours}h</Text>
                                            <Text style={tw`text-xs text-gray-500 text-center`}>Total de Horas</Text>
                                        </View>
                                        <View style={tw`items-center flex-1`}>
                                            <Text style={tw`text-2xl font-bold text-green-600`}>{selectedUser.completionRate}%</Text>
                                            <Text style={tw`text-xs text-gray-500 text-center`}>Taxa Conclusão</Text>
                                        </View>
                                        <View style={tw`items-center flex-1`}>
                                            <View style={tw`flex-row items-center`}>
                                                <Text style={tw`text-2xl font-bold text-yellow-600`}>{selectedUser.averageRating}</Text>
                                                <MaterialIcons name="star" size={20} color="#EAB308" />
                                            </View>
                                            <Text style={tw`text-xs text-gray-500 text-center`}>Avaliação Média</Text>
                                        </View>
                                    </View>
                                    <View style={tw`items-center`}>
                                        <Text style={tw`text-2xl font-bold text-blue-600`}>{selectedUser.sessionsCount}</Text>
                                        <Text style={tw`text-xs text-gray-500`}>Sessões Realizadas</Text>
                                    </View>
                                </View>

                                {/* Progress Section */}
                                <View style={tw`mb-4`}>
                                    <Text style={tw`font-bold text-gray-800 mb-3`}>Progresso do Mês</Text>
                                    <View style={tw`flex-row justify-between items-center mb-2`}>
                                        <Text style={tw`text-sm text-gray-600`}>Conclusão</Text>
                                        <Text style={tw`text-sm font-medium text-gray-800`}>{selectedUser.completionRate}%</Text>
                                    </View>
                                    <ProgressBar progress={selectedUser.completionRate} />
                                </View>

                                {/* Monthly Activity Chart */}
                                <View style={tw`mb-4`}>
                                    <Text style={tw`font-bold text-gray-800 mb-3`}>Atividade dos Últimos 7 Meses</Text>
                                    <MiniChart data={selectedUser.monthlyProgress} />
                                </View>

                                {/* Recent Sessions */}
                                <View style={tw`mb-4`}>
                                    <Text style={tw`font-bold text-gray-800 mb-3`}>Sessões Recentes</Text>
                                    {selectedUser.recentSessions.map((session, index) => (
                                        <View key={index} style={tw`bg-white p-3 rounded-lg mb-2 border border-gray-100`}>
                                            <View style={tw`flex-row justify-between items-center`}>
                                                <View style={tw`flex-1`}>
                                                    <Text style={tw`font-medium text-gray-800`}>{session.type}</Text>
                                                    <Text style={tw`text-sm text-gray-500 mt-1`}>
                                                        {new Date(session.date).toLocaleDateString('pt-BR')} • {session.duration} min
                                                    </Text>
                                                </View>
                                                <View style={tw`flex-row items-center bg-yellow-50 px-2 py-1 rounded-full`}>
                                                    <MaterialIcons name="star" size={16} color="#EAB308" />
                                                    <Text style={tw`text-sm font-medium text-yellow-800 ml-1`}>{session.rating}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                {/* Action Buttons */}
                                <View style={tw`flex-row justify-between mb-6`}>
                                    <TouchableOpacity
                                        style={tw`bg-blue-100 px-6 py-3 rounded-xl flex-1 mr-2`}
                                        onPress={handleViewProfile}
                                    >
                                        <Text style={tw`text-blue-600 text-center font-medium`}>Ver Perfil</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={tw`bg-red-100 px-6 py-3 rounded-xl flex-1 mr-2`}
                                        onPress={handleRemoveFromModal}
                                    >
                                        <Text style={tw`text-red-600 text-center font-medium`}>Remover</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    };

    const UserItem = ({ item }: { item: User }) => (
        <View style={tw`bg-white p-4 rounded-xl shadow-sm mb-3 mx-4`}>
            <TouchableOpacity
                style={tw`flex-row items-center`}
                onPress={() => openUserModal(item)}
            >

                {/* Avatar */}
                <TouchableOpacity
                    onPress={(e) => {
                        e.stopPropagation(); // Prevent opening user modal
                        openPhotoViewer(item);
                    }}
                    style={tw`w-12 h-12 rounded-full mr-3 relative`}
                    activeOpacity={0.8}
                >
                    <Image
                        source={{ uri: item.profile }}
                        style={tw`w-12 h-12 rounded-full`}
                        defaultSource={{ uri: 'https://via.placeholder.com/48x48/CCCCCC/FFFFFF?text=' + item.name.charAt(0) }}
                    />
                    <View
                        style={[
                            tw`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white`,
                            { backgroundColor: getStatusColor(item.status) }
                        ]}
                    />
                    {/* Add subtle zoom overlay */}
                    <View style={tw`absolute inset-0 rounded-full bg-black bg-opacity-10 items-center justify-center`}>
                        <MaterialIcons name="zoom-in" size={12} color="white" style={tw`opacity-80`} />
                    </View>
                </TouchableOpacity>

                {/* User Info */}
                <View style={tw`flex-1`}>
                    <View style={tw`flex-row items-center justify-between mb-1`}>
                        <Text style={tw`font-bold text-gray-800 flex-1`} numberOfLines={1}>
                            {item.name}
                        </Text>
                        {item.role === 'admin' && (
                            <View style={tw`bg-purple-100 px-2 py-1 rounded-full ml-2`}>
                                <Text style={tw`text-purple-800 text-xs font-medium`}>Admin</Text>
                            </View>
                        )}
                    </View>

                    <Text style={tw`text-gray-500 text-sm mb-1`} numberOfLines={1}>
                        {item.email}
                    </Text>

                    <View style={tw`flex-row items-center justify-between`}>
                        <Text style={tw`text-xs text-gray-400`}>
                            {getStatusText(item.status)} • {item.lastActive}
                        </Text>
                        <Text style={tw`text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full`}>
                            {item.sessionsCount} sessões
                        </Text>
                    </View>
                </View>

                {/* Arrow Icon */}
                <TouchableOpacity
                    onPress={() => handleRemoveUser(item.id, item.name)}
                    style={tw`ml-3 p-2 bg-gray-100 rounded-full`}>
                    <Feather name="trash-2" size={16} color="#EF4444" />
                </TouchableOpacity>
            </TouchableOpacity>
        </View >
    );

    return (
        <View style={tw`flex-1 bg-[#F7F7F7]`}>
            <Navbar title={`Painel de Controle`} />

            <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                <View style={tw`px-4 py-4`}>
                    <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Visão Geral do Sistema</Text>

                    <View style={tw`flex-row mb-4`}>
                        <StatCard title="Usuários" value={stats.totalUsers} icon="users" color="blue" />
                        <StatCard title="Sessões Ativas" value={stats.activeSessions} icon="activity" color="green" />
                    </View>

                    <View style={tw`flex-row mb-6`}>
                        <StatCard title="Total Sessões" value={stats.totalSessions} icon="calendar" color="yellow" />
                        <StatCard title="Pendentes" value={stats.pendingSessions} icon="clock" color="red" />
                    </View>
                </View>

                {/* Users List */}
                <View style={tw`flex-1`}>
                    <View style={tw`flex-row justify-between items-center px-4 mb-4`}>
                        <Text style={tw`text-lg font-bold text-gray-800`}>Usuários do Sistema</Text>
                        <TouchableOpacity style={tw`bg-indigo-600 px-4 py-2 rounded-full flex-row items-center`}>
                            <MaterialIcons name="person-add" size={16} color="white" />
                            <Text style={tw`text-white font-medium ml-1 text-sm`}>Adicionar</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={users}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => <UserItem item={item} />}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={tw`pb-6`}
                    />
                </View>

                {/* Modals */}
                <UserDetailsModal />
                <PhotoViewerModal />
            </ScrollView>
        </View>
    );
}

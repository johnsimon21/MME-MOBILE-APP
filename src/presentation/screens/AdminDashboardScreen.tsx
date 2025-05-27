import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useAuth } from '@/src/context/AuthContext';
import { Navbar } from '../components/ui/navbar';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
    status: 'online' | 'offline' | 'away';
    lastActive: string;
    sessionsCount: number;
}

interface DashboardStats {
    totalUsers: number;
    activeSessions: number;
    totalSessions: number;
    pendingSessions: number;
}

export function AdminDashboardScreen() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 156,
        activeSessions: 12,
        totalSessions: 1247,
        pendingSessions: 8,
    });

    const [users, setUsers] = useState<User[]>([
        {
            id: 1,
            name: "Lukombo Afonso",
            email: "lukombo@example.com",
            role: "user",
            status: "online",
            lastActive: "Agora",
            sessionsCount: 15
        },
        {
            id: 2,
            name: "Cardoso Manuel",
            email: "cardoso@example.com",
            role: "user",
            status: "away",
            lastActive: "5 min atrás",
            sessionsCount: 8
        },
        {
            id: 3,
            name: "Lucy Script",
            email: "lucy@example.com",
            role: "admin",
            status: "online",
            lastActive: "Agora",
            sessionsCount: 23
        },
        {
            id: 4,
            name: "Java Simon",
            email: "java@example.com",
            role: "user",
            status: "offline",
            lastActive: "2 horas atrás",
            sessionsCount: 12
        },
        {
            id: 5,
            name: "Maria Santos",
            email: "maria@example.com",
            role: "user",
            status: "online",
            lastActive: "Agora",
            sessionsCount: 7
        },
        {
            id: 6,
            name: "João Silva",
            email: "joao@example.com",
            role: "user",
            status: "offline",
            lastActive: "1 dia atrás",
            sessionsCount: 19
        }
    ]);

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

    const UserItem = ({ item }: { item: User }) => (
        <TouchableOpacity style={tw`bg-white p-4 rounded-xl shadow-sm mb-3 mx-4`}>
            <View style={tw`flex-row items-center`}>
                {/* Avatar */}
                <View style={tw`w-12 h-12 bg-indigo-100 rounded-full items-center justify-center mr-3 relative`}>
                    <Text style={tw`text-indigo-600 font-bold text-lg`}>
                        {item.name.charAt(0).toUpperCase()}
                    </Text>
                    {/* Status indicator */}
                    <View 
                        style={[
                            tw`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white`,
                            { backgroundColor: getStatusColor(item.status) }
                        ]} 
                    />
                </View>

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

                {/* Action Button */}
                <TouchableOpacity style={tw`ml-3 p-2`}>
                    <MaterialIcons name="more-vert" size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={tw`flex-1 bg-[#F7F7F7]`}>
            <Navbar title={`Dashboard - ${user?.fullName}`} />
            
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
                        ListEmptyComponent={() => (
                            <View style={tw`items-center justify-center py-12 mx-4`}>
                                <MaterialIcons name="people-outline" size={64} color="#9CA3AF" />
                                <Text style={tw`text-gray-500 text-lg mt-4`}>Nenhum usuário encontrado</Text>
                                <Text style={tw`text-gray-400 text-sm mt-1 text-center`}>
                                    Adicione usuários para começar a gerenciar o sistema
                                </Text>
                            </View>
                        )}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

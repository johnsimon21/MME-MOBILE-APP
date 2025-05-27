import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Animated } from 'react-native';
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
    joinedDate: string;
    totalHours: number;
    completionRate: number;
    averageRating: number;
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
    const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
    const [animatedValues] = useState(new Map());
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
            role: "admin",
            status: "online",
            lastActive: "Agora",
            sessionsCount: 15,
            joinedDate: "2024-03-15",
            totalHours: 45.5,
            completionRate: 87,
            averageRating: 4.2,
            monthlyProgress: [12, 8, 15, 10, 18, 14, 20],
            recentSessions: [
                { date: "2025-01-15", duration: 60, type: "Mentoria", rating: 5 },
                { date: "2025-01-12", duration: 45, type: "Coaching", rating: 4 },
                { date: "2025-01-10", duration: 30, type: "Feedback", rating: 4 }
            ]
        },
        {
            id: 2,
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
            monthlyProgress: [12, 8, 15, 10, 18, 14, 20],
            recentSessions: [
                { date: "2025-01-15", duration: 60, type: "Mentoria", rating: 5 },
                { date: "2025-01-12", duration: 45, type: "Coaching", rating: 4 },
                { date: "2025-01-10", duration: 30, type: "Feedback", rating: 4 }
            ]
        },
        {
            id: 3,
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
            monthlyProgress: [12, 8, 15, 10, 18, 14, 20],
            recentSessions: [
                { date: "2025-01-15", duration: 60, type: "Mentoria", rating: 5 },
                { date: "2025-01-12", duration: 45, type: "Coaching", rating: 4 },
                { date: "2025-01-10", duration: 30, type: "Feedback", rating: 4 }
            ]
        },
        {
            id: 4,
            name: "Jocy Simon",
            email: "jocy@example.com",
            role: "user",
            status: "offline",
            lastActive: "Agora",
            sessionsCount: 14,
            joinedDate: "2024-03-15",
            totalHours: 45.5,
            completionRate: 87,
            averageRating: 4.2,
            monthlyProgress: [12, 8, 15, 10, 18, 14, 20],
            recentSessions: [
                { date: "2025-01-15", duration: 60, type: "Mentoria", rating: 5 },
                { date: "2025-01-12", duration: 45, type: "Coaching", rating: 4 },
                { date: "2025-01-10", duration: 30, type: "Feedback", rating: 4 }
            ]
        },
        {
            id: 5,
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
            monthlyProgress: [5, 3, 8, 6, 12, 9, 15],
            recentSessions: [
                { date: "2025-01-14", duration: 50, type: "Mentoria", rating: 5 },
                { date: "2025-01-11", duration: 40, type: "Coaching", rating: 4 }
            ]
        }
    ]);

    // Initialize animated values for each user
    useEffect(() => {
        users.forEach(user => {
            if (!animatedValues.has(user.id)) {
                animatedValues.set(user.id, new Animated.Value(0));
            }
        });
    }, [users]);

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

    const toggleUserExpansion = (userId: number) => {
        const isCurrentlyExpanded = expandedUserId === userId;

        if (isCurrentlyExpanded) {
            // Closing the current expanded card
            if (animatedValues.has(userId)) {
                Animated.timing(animatedValues.get(userId), {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }).start(() => {
                    setExpandedUserId(null);
                });
            } else {
                setExpandedUserId(null);
            }
        } else {
            // Close any currently expanded card first
            if (expandedUserId && animatedValues.has(expandedUserId)) {
                Animated.timing(animatedValues.get(expandedUserId), {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }).start();
            }

            // Set the new expanded card and animate
            setExpandedUserId(userId);

            // Ensure the animated value exists and start from 0
            if (!animatedValues.has(userId)) {
                animatedValues.set(userId, new Animated.Value(0));
            }

            // Reset to 0 first, then animate to 1
            const animValue = animatedValues.get(userId);
            animValue.setValue(0);

            Animated.timing(animValue, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
            }).start();
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

    const UserItem = ({ item }: { item: User }) => {
        const isExpanded = expandedUserId === item.id;
        const animatedValue = animatedValues.get(item.id) || new Animated.Value(0);

        const expandedHeight = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 400], // Adjust based on content
        });

        return (
            <View style={tw`bg-white rounded-xl shadow-sm mb-3 mx-4 overflow-hidden`}>
                {/* Main User Card */}
                <TouchableOpacity
                    style={tw`p-4`}
                    onPress={() => toggleUserExpansion(item.id)}
                >
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

                        {/* Expand/Collapse Icon */}
                        <View style={tw`ml-3 p-2`}>
                            <MaterialIcons
                                name={isExpanded ? "expand-less" : "expand-more"}
                                size={24}
                                color="#6B7280"
                            />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Expanded Content */}
                <Animated.View style={[tw`overflow-hidden`, { height: expandedHeight }]}>
                    <View style={tw`px-4 pb-4 border-t border-gray-100`}>
                        {/* Stats Row */}
                        <View style={tw`flex-row justify-between mb-4 mt-4`}>
                            <View style={tw`items-center flex-1`}>
                                <Text style={tw`text-lg font-bold text-gray-800`}>{item.totalHours}h</Text>
                                <Text style={tw`text-xs text-gray-500`}>Total de Horas</Text>
                            </View>
                            <View style={tw`items-center flex-1`}>
                                <Text style={tw`text-lg font-bold text-green-600`}>{item.completionRate}%</Text>
                                <Text style={tw`text-xs text-gray-500`}>Taxa Conclusão</Text>
                            </View>
                            <View style={tw`items-center flex-1`}>
                                <View style={tw`flex-row items-center`}>
                                    <Text style={tw`text-lg font-bold text-yellow-600`}>{item.averageRating}</Text>
                                    <MaterialIcons name="star" size={16} color="#EAB308" />
                                </View>
                                <Text style={tw`text-xs text-gray-500`}>Avaliação</Text>
                            </View>
                        </View>

                        {/* Progress Bar */}
                        <View style={tw`mb-4`}>
                            <View style={tw`flex-row justify-between items-center mb-2`}>
                                <Text style={tw`text-sm font-medium text-gray-700`}>Progresso do Mês</Text>
                                <Text style={tw`text-sm text-gray-500`}>{item.completionRate}%</Text>
                            </View>
                            <ProgressBar progress={item.completionRate} />
                        </View>

                        {/* Monthly Progress Chart */}
                        <View style={tw`mb-4`}>
                            <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>Atividade dos Últimos 7 Meses</Text>
                            <MiniChart data={item.monthlyProgress} />
                        </View>

                        {/* Recent Sessions */}
                        <View style={tw`mb-2`}>
                            <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>Sessões Recentes</Text>
                            {item.recentSessions.slice(0, 3).map((session, index) => (
                                <View key={index} style={tw`flex-row justify-between items-center py-2 border-b border-gray-50`}>
                                    <View style={tw`flex-1`}>
                                        <Text style={tw`text-sm font-medium text-gray-800`}>{session.type}</Text>
                                        <Text style={tw`text-xs text-gray-500`}>
                                            {new Date(session.date).toLocaleDateString('pt-BR')} • {session.duration}min
                                        </Text>
                                    </View>
                                    <View style={tw`flex-row items-center`}>
                                        <MaterialIcons name="star" size={14} color="#EAB308" />
                                        <Text style={tw`text-sm text-gray-600 ml-1`}>{session.rating}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Action Buttons */}
                        <View style={tw`flex-row justify-between mt-4`}>
                            <TouchableOpacity style={tw`bg-blue-50 px-4 py-2 rounded-lg flex-1 mr-2`}>
                                <Text style={tw`text-blue-600 text-center font-medium`}>Ver Perfil</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={tw`bg-green-50 px-4 py-2 rounded-lg flex-1 ml-2`}>
                                <Text style={tw`text-green-600 text-center font-medium`}>Nova Sessão</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </View>
        );
    };

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

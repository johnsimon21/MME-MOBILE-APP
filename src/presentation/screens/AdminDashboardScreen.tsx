import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useAuth } from '@/src/context/AuthContext';
import { Navbar } from '../components/ui/navbar';

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

    const StatCard = ({ title, value, icon, color }: any) => (
        <View style={tw`bg-white p-4 rounded-xl shadow-sm flex-1 mx-1`}>
            <View style={tw`w-10 h-10 rounded-full bg-${color}-100 items-center justify-center mb-2`}>
                <Feather name={icon} size={20} color="#4F46E5" />
            </View>
            <Text style={tw`text-2xl font-bold text-gray-800 mb-1`}>{value}</Text>
            <Text style={tw`text-gray-600 text-sm`}>{title}</Text>
        </View>
    );

    return (
        <View style={tw`flex-1 bg-[#F7F7F7]`}>
            <Navbar title={`Dashboard - ${user?.fullName}`} />
            
            <ScrollView style={tw`flex-1 px-4 py-4`}>
                <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Visão Geral do Sistema</Text>
                
                <View style={tw`flex-row mb-4`}>
                    <StatCard title="Usuários" value={stats.totalUsers} icon="users" color="blue" />
                    <StatCard title="Sessões Ativas" value={stats.activeSessions} icon="activity" color="green" />
                </View>
                
                <View style={tw`flex-row mb-6`}>
                    <StatCard title="Total Sessões" value={stats.totalSessions} icon="calendar" color="yellow" />
                    <StatCard title="Pendentes" value={stats.pendingSessions} icon="clock" color="red" />
                </View>

                {/* Quick Actions */}
                <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Ações Rápidas</Text>
                <View style={tw`flex-row flex-wrap`}>
                    <TouchableOpacity style={tw`bg-white p-4 rounded-xl shadow-sm w-[48%] mr-2 mb-4`}>
                        <MaterialIcons name="person-add" size={24} color="#4F46E5" />
                        <Text style={tw`text-gray-800 font-medium mt-2`}>Adicionar Usuário</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={tw`bg-white p-4 rounded-xl shadow-sm w-[48%] mb-4`}>
                        <MaterialIcons name="assessment" size={24} color="#10B981" />
                        <Text style={tw`text-gray-800 font-medium mt-2`}>Gerar Relatório</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

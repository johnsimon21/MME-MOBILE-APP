import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import tw from 'twrnc';
import { Navbar } from '../components/ui/navbar';

export function AdminReportsScreen() {
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
    
    const reports = [
        {
            id: '1',
            title: 'Relatório de Sessões - Janeiro 2025',
            type: 'sessions',
            status: 'completed',
            size: '2.4 MB'
        },
        {
            id: '2',
            title: 'Relatório de Usuários - Janeiro 2025',
            type: 'users',
            status: 'completed',
            size: '1.8 MB'
        }
    ];

    return (
        <View style={tw`flex-1 bg-[#F7F7F7]`}>
            <Navbar title="Relatórios Administrativos" />
            
            <ScrollView style={tw`flex-1 px-4 py-4`}>
                <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Gerar Novo Relatório</Text>
                
                {/* Period Selection */}
                <View style={tw`flex-row bg-gray-100 rounded-xl p-1 mb-6`}>
                    {[
                        { key: 'week', label: 'Semana' },
                        { key: 'month', label: 'Mês' },
                        { key: 'quarter', label: 'Trimestre' }
                    ].map((period) => (
                        <TouchableOpacity
                            key={period.key}
                            style={tw`flex-1 py-2 rounded-lg ${
                                selectedPeriod === period.key ? 'bg-white shadow-sm' : ''
                            }`}
                            onPress={() => setSelectedPeriod(period.key as any)}
                        >
                            <Text style={tw`text-center text-sm ${
                                selectedPeriod === period.key ? 'text-gray-800 font-medium' : 'text-gray-600'
                            }`}>
                                {period.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Report Types */}
                <View style={tw`flex-row flex-wrap mb-6`}>
                    {[
                        { type: 'sessions', label: 'Sessões', icon: 'group' },
                        { type: 'users', label: 'Usuários', icon: 'people' }
                    ].map((reportType) => (
                        <TouchableOpacity 
                            key={reportType.type}
                            style={tw`bg-white p-4 rounded-xl shadow-sm w-[48%] ${
                                reportType.type === 'sessions' ? 'mr-2' : ''
                            } mb-3`}
                        >
                            <MaterialIcons name={reportType.icon as any} size={24} color="#4F46E5" />
                            <Text style={tw`text-gray-800 font-medium mt-2`}>
                                Relatório de {reportType.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Recent Reports */}
                <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Relatórios Recentes</Text>
                {reports.map((report) => (
                    <View key={report.id} style={tw`bg-white p-4 rounded-xl shadow-sm mb-3`}>
                        <Text style={tw`font-medium text-gray-800`}>{report.title}</Text>
                        <Text style={tw`text-gray-500 text-sm mt-1`}>{report.size}</Text>
                        <TouchableOpacity style={tw`mt-2`}>
                            <Text style={tw`text-blue-600 font-medium`}>Download</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

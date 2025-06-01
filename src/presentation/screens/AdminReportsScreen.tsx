import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import tw from 'twrnc';
import { Navbar } from '../components/ui/navbar';
import { getSessions, Session } from '@/src/data/sessionService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface ReportMetrics {
    totalSessions: number;
    completedSessions: number;
    totalParticipants: number;
    averageSessionDuration: number;
    completionRate: number;
    totalMentorHours: number;
    activeMentors: number;
    activeMentees: number;
}

interface MonthlyData {
    month: string;
    sessions: number;
    participants: number;
    hours: number;
}

export function AdminReportsScreen() {
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
    const [sessions, setSessions] = useState<Session[]>([]);
    const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    useEffect(() => {
        loadData();
    }, [selectedPeriod]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const allSessions = await getSessions();
            setSessions(allSessions);

            const calculatedMetrics = calculateMetrics(allSessions);
            setMetrics(calculatedMetrics);

            const monthlyStats = calculateMonthlyData(allSessions);
            setMonthlyData(monthlyStats);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateMetrics = (sessions: Session[]): ReportMetrics => {
        const now = new Date();
        const periodStart = getPeriodStart(now, selectedPeriod);

        const periodSessions = sessions.filter(session => {
            const sessionDate = new Date(session.scheduledDate);
            return sessionDate >= periodStart;
        });

        const completedSessions = periodSessions.filter(s => s.status === 'Concluída');
        const uniqueParticipants = new Set(periodSessions.map(s => s.participantId)).size;
        const uniqueMentors = new Set(periodSessions.map(s => s.participantId)).size; // In real app, you'd have mentorId

        const totalDuration = completedSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        const averageDuration = completedSessions.length > 0 ? totalDuration / completedSessions.length : 0;
        const completionRate = periodSessions.length > 0 ? (completedSessions.length / periodSessions.length) * 100 : 0;

        return {
            totalSessions: periodSessions.length,
            completedSessions: completedSessions.length,
            totalParticipants: uniqueParticipants,
            averageSessionDuration: averageDuration,
            completionRate,
            totalMentorHours: totalDuration / 60, // Convert minutes to hours
            activeMentors: Math.min(uniqueMentors, 5), // Mock data
            activeMentees: uniqueParticipants
        };
    };

    const calculateMonthlyData = (sessions: Session[]): MonthlyData[] => {
        const monthlyStats: { [key: string]: MonthlyData } = {};

        sessions.forEach(session => {
            const date = new Date(session.scheduledDate);
            const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = {
                    month: monthKey,
                    sessions: 0,
                    participants: 0,
                    hours: 0
                };
            }

            monthlyStats[monthKey].sessions++;
            monthlyStats[monthKey].hours += (session.duration || 0) / 60;
        });

        return Object.values(monthlyStats).slice(-6); // Last 6 months
    };

    const getPeriodStart = (now: Date, period: string): Date => {
        const start = new Date(now);
        switch (period) {
            case 'week':
                start.setDate(now.getDate() - 7);
                break;
            case 'month':
                start.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(now.getMonth() - 3);
                break;
        }
        return start;
    };

    const generateReport = async () => {
        if (!metrics) return;

        setIsGeneratingReport(true);

        try {
            const reportData = {
                period: selectedPeriod,
                generatedAt: new Date().toISOString(),
                metrics,
                monthlyData,
                sessions: sessions.slice(0, 10) // Include recent sessions
            };

            const reportContent = `
RELATÓRIO DE MENTORIA - MME
============================

Período: ${selectedPeriod === 'week' ? 'Última Semana' : selectedPeriod === 'month' ? 'Último Mês' : 'Último Trimestre'}
Gerado em: ${new Date().toLocaleDateString('pt-BR')}

MÉTRICAS PRINCIPAIS
-------------------
• Total de Sessões: ${metrics.totalSessions}
• Sessões Concluídas: ${metrics.completedSessions}
• Taxa de Conclusão: ${metrics.completionRate.toFixed(1)}%
• Participantes Únicos: ${metrics.totalParticipants}
• Mentores Ativos: ${metrics.activeMentors}
• Mentees Ativos: ${metrics.activeMentees}
• Duração Média por Sessão: ${metrics.averageSessionDuration.toFixed(0)} min
• Total de Horas de Mentoria: ${metrics.totalMentorHours.toFixed(1)}h

TENDÊNCIA MENSAL
----------------
${monthlyData.map(data =>
                `${data.month}: ${data.sessions} sessões, ${data.hours.toFixed(1)}h`
            ).join('\n')}

SESSÕES RECENTES
----------------
${sessions.slice(0, 5).map(session =>
                `• ${session.name} - ${session.status} - ${session.scheduledDate}`
            ).join('\n')}

---
Relatório gerado automaticamente pelo sistema MME
            `.trim();

            const fileName = `relatorio_mentoria_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.txt`;
            const fileUri = FileSystem.documentDirectory + fileName;

            await FileSystem.writeAsStringAsync(fileUri, reportContent);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'text/plain',
                    dialogTitle: 'Compartilhar Relatório de Mentoria'
                });
            } else {
                Alert.alert('Sucesso', 'Relatório gerado com sucesso!');
            }

        } catch (error) {
            Alert.alert('Erro', 'Não foi possível gerar o relatório.');
            console.error('Error generating report:', error);
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const shareReport = async () => {
        if (!metrics) return;

        const shareText = `📊 Relatório de Mentoria MME

📅 Período: ${selectedPeriod === 'week' ? 'Última Semana' : selectedPeriod === 'month' ? 'Último Mês' : 'Último Trimestre'}

✅ ${metrics.completedSessions} sessões concluídas
👥 ${metrics.totalParticipants} participantes
⏱️ ${metrics.totalMentorHours.toFixed(1)}h de mentoria
📈 ${metrics.completionRate.toFixed(1)}% taxa de conclusão

#Mentoria #Educação #MME`;

        try {
            await Share.share({
                message: shareText,
                title: 'Relatório de Mentoria MME'
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    if (isLoading) {
        return (
            <View style={tw`flex-1 bg-gray-50 items-center justify-center`}>
                <View style={tw`w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4`} />
                <Text style={tw`text-gray-600`}>Carregando dados...</Text>
            </View>
        );
    }

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            <Navbar title="Relatórios de Mentoria" />

            <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                {/* Period Selection */}
                <View style={tw`bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm`}>
                    <Text style={tw`text-lg font-bold text-gray-800 mb-3`}>Período do Relatório</Text>
                    <View style={tw`flex-row bg-gray-100 rounded-xl p-1`}>
                        {[
                            { key: 'week', label: 'Semana' },
                            { key: 'month', label: 'Mês' },
                            { key: 'quarter', label: 'Trimestre' }
                        ].map((period) => (
                            <TouchableOpacity
                                key={period.key}
                                style={tw`flex-1 py-3 rounded-lg ${selectedPeriod === period.key ? 'bg-blue-500 shadow-sm' : ''
                                    }`}
                                onPress={() => setSelectedPeriod(period.key as any)}
                            >
                                <Text style={tw`text-center font-medium ${selectedPeriod === period.key ? 'text-white' : 'text-gray-600'
                                    }`}>
                                    {period.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Key Metrics */}
                {metrics && (
                    <View style={tw`mx-4 mt-4`}>
                        <Text style={tw`text-lg font-bold text-gray-800 mb-3`}>Métricas Principais</Text>

                        <View style={tw`flex-row flex-wrap`}>
                            <View style={tw`w-1/2 pr-2 mb-4`}>
                                <View style={tw`bg-white rounded-xl p-4 shadow-sm`}>
                                    <View style={tw`flex-row items-center justify-between mb-2`}>
                                        <MaterialIcons name="video-call" size={24} color="#3B82F6" />
                                        <Text style={tw`text-2xl font-bold text-gray-800`}>{metrics.totalSessions}</Text>
                                    </View>
                                    <Text style={tw`text-gray-600 text-sm`}>Total de Sessões</Text>
                                </View>
                            </View>

                            <View style={tw`w-1/2 pl-2 mb-4`}>
                                <View style={tw`bg-white rounded-xl p-4 shadow-sm`}>
                                    <View style={tw`flex-row items-center justify-between mb-2`}>
                                        <MaterialIcons name="check-circle" size={24} color="#10B981" />
                                        <Text style={tw`text-2xl font-bold text-gray-800`}>{metrics.completionRate.toFixed(0)}%</Text>
                                    </View>
                                    <Text style={tw`text-gray-600 text-sm`}>Taxa de Conclusão</Text>
                                </View>
                            </View>

                            <View style={tw`w-1/2 pr-2 mb-4`}>
                                <View style={tw`bg-white rounded-xl p-4 shadow-sm`}>
                                    <View style={tw`flex-row items-center justify-between mb-2`}>
                                        <MaterialIcons name="people" size={24} color="#8B5CF6" />
                                        <Text style={tw`text-2xl font-bold text-gray-800`}>{metrics.totalParticipants}</Text>
                                    </View>
                                    <Text style={tw`text-gray-600 text-sm`}>Participantes</Text>
                                </View>
                            </View>

                            <View style={tw`w-1/2 pl-2 mb-4`}>
                                <View style={tw`bg-white rounded-xl p-4 shadow-sm`}>
                                    <View style={tw`flex-row items-center justify-between mb-2`}>
                                        <MaterialIcons name="schedule" size={24} color="#F59E0B" />
                                        <Text style={tw`text-2xl font-bold text-gray-800`}>{metrics.totalMentorHours.toFixed(0).toString()}h</Text>
                                    </View>
                                    <Text style={tw`text-gray-600 text-sm`}>Horas de Mentoria</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Additional Stats */}
                {metrics && (
                    <View style={tw`bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm`}>
                        <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Estatísticas Detalhadas</Text>

                        <View style={tw`space-y-3`}>
                            <View style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}>
                                <Text style={tw`text-gray-600`}>Mentores Ativos</Text>
                                <Text style={tw`font-semibold text-gray-800`}>{metrics.activeMentors}</Text>
                            </View>
                            <View style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}>
                                <Text style={tw`text-gray-600`}>Mentees Ativos</Text>
                                <Text style={tw`font-semibold text-gray-800`}>{metrics.activeMentees}</Text>
                            </View>

                            <View style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}>
                                <Text style={tw`text-gray-600`}>Duração Média por Sessão</Text>
                                <Text style={tw`font-semibold text-gray-800`}>{metrics.averageSessionDuration.toFixed(0)} min</Text>
                            </View>

                            <View style={tw`flex-row justify-between items-center py-2`}>
                                <Text style={tw`text-gray-600`}>Sessões Concluídas</Text>
                                <Text style={tw`font-semibold text-gray-800`}>{metrics.completedSessions}/{metrics.totalSessions}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Monthly Trend */}
                {monthlyData.length > 0 && (
                    <View style={tw`bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm`}>
                        <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Tendência Mensal</Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={tw`flex-row`}>
                                {monthlyData.map((data, index) => (
                                    <View key={index} style={tw`mr-4 items-center`}>
                                        <View style={tw`bg-blue-50 rounded-lg p-3 w-20 items-center`}>
                                            <Text style={tw`text-blue-600 font-bold text-lg`}>{data.sessions}</Text>
                                            <Text style={tw`text-blue-500 text-xs`}>sessões</Text>
                                            <Text style={tw`text-gray-500 text-xs mt-1`}>{data.hours.toFixed(0)}h</Text>
                                        </View>
                                        <Text style={tw`text-gray-600 text-xs mt-2 text-center`}>{data.month}</Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}

                {/* Recent Sessions */}
                <View style={tw`bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm`}>
                    <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Sessões Recentes</Text>

                    {sessions.slice(0, 5).map((session, index) => (
                        <View key={session.id} style={tw`flex-row items-center justify-between py-3 ${index < 4 ? 'border-b border-gray-100' : ''
                            }`}>
                            <View style={tw`flex-1`}>
                                <Text style={tw`font-medium text-gray-800`}>{session.name}</Text>
                                <Text style={tw`text-gray-500 text-sm`}>{session.participantName}</Text>
                                <Text style={tw`text-gray-400 text-xs`}>{session.scheduledDate}</Text>
                            </View>

                            <View style={tw`items-end`}>
                                <View style={tw`px-2 py-1 rounded-full ${session.status === 'Concluída'
                                    ? 'bg-green-100'
                                    : 'bg-blue-100'
                                    }`}>
                                    <Text style={tw`text-xs font-medium ${session.status === 'Concluída'
                                        ? 'text-green-800'
                                        : 'text-blue-800'
                                        }`}>
                                        {session.status}
                                    </Text>
                                </View>
                                {session.duration && (
                                    <Text style={tw`text-gray-500 text-xs mt-1`}>{session.duration} min</Text>
                                )}
                            </View>
                        </View>
                    ))}

                    {sessions.length === 0 && (
                        <View style={tw`items-center py-8`}>
                            <MaterialIcons name="event-note" size={48} color="#9CA3AF" />
                            <Text style={tw`text-gray-500 mt-2`}>Nenhuma sessão encontrada</Text>
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={tw`mx-4 mt-6 mb-8`}>
                    <View style={tw`flex-row justify-between`}>
                        <TouchableOpacity
                            onPress={generateReport}
                            disabled={isGeneratingReport}
                            style={tw`flex-1 bg-blue-200 rounded-xl py-4 mr-2 flex-row items-center justify-center ${isGeneratingReport ? 'opacity-50' : ''
                                }`}
                        >
                            {isGeneratingReport ? (
                                <View style={tw`w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2`} />
                            ) : (
                                <Feather name="download" size={20} color="white" style={tw`mr-2 text-blue-800`} />
                            )}
                            <Text style={tw`text-blue-800 font-semibold`}>
                                {isGeneratingReport ? 'Gerando...' : 'Baixar Relatório'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={shareReport}
                            style={tw`flex-1 bg-green-200 rounded-xl py-4 flex-row items-center justify-center`}
                        >
                            <Feather name="share-2" size={20} color="green" style={tw`mr-2 text-green-800`} />
                            <Text style={tw`text-green-800 font-semibold`}>Compartilhar</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={loadData}
                        style={tw`bg-gray-100 rounded-xl py-3 flex-row items-center justify-center mt-3`}
                    >
                        <Feather name="refresh-cw" size={18} color="#6B7280" style={tw`mr-2`} />
                        <Text style={tw`text-gray-600 font-medium`}>Atualizar Dados</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

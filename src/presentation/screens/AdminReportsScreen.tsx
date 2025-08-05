import { useReports } from '@/src/hooks/useReports';
import type { IReportMetrics, ITrendData } from '@/src/interfaces/reports.interface';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';
import { Navbar } from '../components/ui/navbar';



export function AdminReportsScreen() {
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
    const [metrics, setMetrics] = useState<IReportMetrics | null>(null);
    const [trendData, setTrendData] = useState<ITrendData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        getDashboardAnalytics,
        exportReport,
        getPeriodLabel,
        formatDate,
        formatPercentage,
        formatHours
    } = useReports();

    useEffect(() => {
        loadData();
    }, [selectedPeriod]);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Convert selectedPeriod to API format
            const apiPeriod = selectedPeriod === 'week' ? 'last_7_days' :
                selectedPeriod === 'month' ? 'last_30_days' : 'last_3_months';

            const dashboardData = await getDashboardAnalytics(apiPeriod as any);
            setMetrics(dashboardData.metrics);

            // Create trend data from the dashboard analytics
            const trend: ITrendData[] = [
                {
                    period: formatDate(new Date().toString()),
                    sessions: dashboardData.metrics.totalSessions,
                    completedSessions: dashboardData.metrics.completedSessions,
                    uniqueUsers: dashboardData.metrics.uniqueParticipants,
                    totalHours: dashboardData.metrics.totalMentoringHours,
                    averageRating: dashboardData.metrics.averageRating
                }
            ];
            setTrendData(trend);
        } catch (error) {
            console.error('Error loading data:', error);
            setError('Erro ao carregar dados do relatório');
        } finally {
            setIsLoading(false);
        }
    };



    const generateReport = async () => {
        if (!metrics) return;

        setIsGeneratingReport(true);

        try {
            // Convert selectedPeriod to API format
            const apiPeriod = selectedPeriod === 'week' ? 'last_7_days' :
                selectedPeriod === 'month' ? 'last_30_days' : 'last_3_months';

            const result = await exportReport({
                type: 'mentorship_overview' as any,
                period: apiPeriod as any,
                format: 'pdf' as any,
                includeBranding: true
            });

            if (result?.downloadUrl) {
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(result.downloadUrl, {
                        mimeType: 'application/pdf',
                        dialogTitle: 'Compartilhar Relatório de Mentoria'
                    });
                } else {
                    Alert.alert('Sucesso', 'Relatório gerado com sucesso!', [
                        { text: 'OK', onPress: () => { } }
                    ]);
                }
            } else {
                throw new Error('Falha ao gerar relatório');
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

📅 Período: ${getPeriodLabel(selectedPeriod === 'week' ? 'last_7_days' : selectedPeriod === 'month' ? 'last_30_days' : 'last_3_months' as any)}

✅ ${metrics.completedSessions} sessões concluídas
👥 ${metrics.uniqueParticipants} participantes
⏱️ ${formatHours(metrics.totalMentoringHours)} de mentoria
📈 ${formatPercentage(metrics.completionRate)} taxa de conclusão

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

    if (error) {
        return (
            <View style={tw`flex-1 bg-gray-50`}>
                <Navbar title="Relatórios de Mentoria" />
                <View style={tw`flex-1 items-center justify-center px-4`}>
                    <MaterialIcons name="error-outline" size={64} color="#EF4444" />
                    <Text style={tw`text-red-600 text-lg font-semibold mt-4 text-center`}>{error}</Text>
                    <TouchableOpacity
                        onPress={loadData}
                        style={tw`bg-blue-500 px-6 py-3 rounded-lg mt-4`}
                    >
                        <Text style={tw`text-white font-semibold`}>Tentar Novamente</Text>
                    </TouchableOpacity>
                </View>
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
                                        <Text style={tw`text-2xl font-bold text-gray-800`}>{metrics.uniqueParticipants}</Text>
                                    </View>
                                    <Text style={tw`text-gray-600 text-sm`}>Participantes</Text>
                                </View>
                            </View>

                            <View style={tw`w-1/2 pl-2 mb-4`}>
                                <View style={tw`bg-white rounded-xl p-4 shadow-sm`}>
                                    <View style={tw`flex-row items-center justify-between mb-2`}>
                                        <MaterialIcons name="schedule" size={24} color="#F59E0B" />
                                        <Text style={tw`text-2xl font-bold text-gray-800`}>{formatHours(metrics.totalMentoringHours)}</Text>
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

                {/* Trend Data */}
                {trendData.length > 0 && (
                    <View style={tw`bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm`}>
                        <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Tendência de Dados</Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={tw`flex-row`}>
                                {trendData.map((data, index) => (
                                    <View key={index} style={tw`mr-4 items-center`}>
                                        <View style={tw`bg-blue-50 rounded-lg p-3 w-20 items-center`}>
                                            <Text style={tw`text-blue-600 font-bold text-lg`}>{data.sessions}</Text>
                                            <Text style={tw`text-blue-500 text-xs`}>sessões</Text>
                                            <Text style={tw`text-gray-500 text-xs mt-1`}>{formatHours(data.totalHours)}</Text>
                                        </View>
                                        <Text style={tw`text-gray-600 text-xs mt-2 text-center`}>{data.period}</Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}

                {/* Additional Metrics Summary */}
                <View style={tw`bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm`}>
                    <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Resumo Adicional</Text>

                    <View style={tw`flex-row justify-between items-center py-3 border-b border-gray-100`}>
                        <Text style={tw`text-gray-600`}>Avaliação Média</Text>
                        <Text style={tw`font-semibold text-gray-800`}>{metrics?.averageRating?.toFixed(1) || '--'} ⭐</Text>
                    </View>

                    <View style={tw`flex-row justify-between items-center py-3 border-b border-gray-100`}>
                        <Text style={tw`text-gray-600`}>Sessões Canceladas</Text>
                        <Text style={tw`font-semibold text-gray-800`}>{metrics?.cancelledSessions || 0}</Text>
                    </View>

                    <View style={tw`flex-row justify-between items-center py-3`}>
                        <Text style={tw`text-gray-600`}>Período Selecionado</Text>
                        <Text style={tw`font-semibold text-gray-800`}>
                            {getPeriodLabel(selectedPeriod === 'week' ? 'last_7_days' : selectedPeriod === 'month' ? 'last_30_days' : 'last_3_months' as any)}
                        </Text>
                    </View>
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

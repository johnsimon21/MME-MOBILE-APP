import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import tw from 'twrnc';
import { Navbar } from '../components/ui/navbar';

interface ReportData {
    id: string;
    title: string;
    type: 'engajamento' | 'desempenho' | 'sessoes';
    period: string;
    generatedAt: string;
    status: 'completed' | 'processing' | 'failed';
    size: string;
    metrics?: {
        totalParticipants?: number;
        averageSessionTime?: string;
        completionRate?: string;
        satisfactionScore?: string;
    };
}

export function AdminReportsScreen() {
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'engajamento' | 'desempenho' | 'sessoes'>('all');
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

    const [reports] = useState<ReportData[]>([
        {
            id: '1',
            title: 'Relatório de Engajamento - Janeiro 2025',
            type: 'engajamento',
            period: 'Janeiro 2025',
            generatedAt: '2025-01-15T10:30:00Z',
            status: 'completed',
            size: '2.4 MB',
            metrics: {
                totalParticipants: 156,
                averageSessionTime: '45 min',
                completionRate: '87%',
                satisfactionScore: '4.2/5'
            }
        },
        {
            id: '2',
            title: 'Relatório de Desempenho - Janeiro 2025',
            type: 'desempenho',
            period: 'Janeiro 2025',
            generatedAt: '2025-01-14T09:15:00Z',
            status: 'completed',
            size: '3.1 MB',
            metrics: {
                totalParticipants: 142,
                averageSessionTime: '52 min',
                completionRate: '92%',
                satisfactionScore: '4.5/5'
            }
        },
        {
            id: '3',
            title: 'Relatório de Sessões Realizadas - Dezembro 2024',
            type: 'sessoes',
            period: 'Dezembro 2024',
            generatedAt: '2025-01-10T14:20:00Z',
            status: 'processing',
            size: '-',
            metrics: {
                totalParticipants: 189,
                averageSessionTime: '38 min',
                completionRate: '79%'
            }
        },
        {
            id: '4',
            title: 'Relatório de Engajamento - Dezembro 2024',
            type: 'engajamento',
            period: 'Dezembro 2024',
            generatedAt: '2025-01-08T16:45:00Z',
            status: 'completed',
            size: '2.8 MB',
            metrics: {
                totalParticipants: 134,
                averageSessionTime: '41 min',
                completionRate: '84%',
                satisfactionScore: '4.1/5'
            }
        }
    ]);

    // Filter reports based on selected filter
    const filteredReports = reports.filter(report => {
        if (selectedFilter === 'all') return true;
        return report.type === selectedFilter;
    });

    // Get report type label
    const getReportTypeLabel = (type: string) => {
        switch (type) {
            case 'engajamento': return 'Engajamento';
            case 'desempenho': return 'Desempenho';
            case 'sessoes': return 'Sessões Realizadas';
            default: return type;
        }
    };

    // Get report type icon
    const getReportTypeIcon = (type: string) => {
        switch (type) {
            case 'engajamento': return 'heart';
            case 'desempenho': return 'trending-up';
            case 'sessoes': return 'users';
            default: return 'file-text';
        }
    };

    // Get report type color
    const getReportTypeColor = (type: string) => {
        switch (type) {
            case 'engajamento': return '#EF4444'; // Red
            case 'desempenho': return '#10B981'; // Green
            case 'sessoes': return '#3B82F6'; // Blue
            default: return '#6B7280';
        }
    };

    const ReportCard = ({ item }: { item: ReportData }) => (
        <View style={tw`bg-white p-4 rounded-xl shadow-sm mb-4`}>
            <View style={tw`flex-row items-center justify-between mb-3`}>
                <View style={tw`flex-row items-center flex-1`}>
                    <View style={tw`w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-3`}>
                        <MaterialIcons
                            name={getReportTypeIcon(item.type) as any}
                            size={24}
                            color={getReportTypeColor(item.type)}
                        />
                    </View>
                    <View style={tw`flex-1`}>
                        <Text style={tw`font-bold text-gray-800 mb-1`} numberOfLines={2}>
                            {item.title}
                        </Text>
                        <Text style={tw`text-gray-500 text-sm`}>
                            {new Date(item.generatedAt).toLocaleDateString('pt-BR')} • {item.size}
                        </Text>
                    </View>
                </View>

                <View style={tw`items-end`}>
                    <View style={tw`px-3 py-1 rounded-full mb-2 ${item.status === 'completed' ? 'bg-green-100' :
                            item.status === 'processing' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                        <Text style={tw`text-xs font-medium ${item.status === 'completed' ? 'text-green-800' :
                                item.status === 'processing' ? 'text-yellow-800' : 'text-red-800'
                            }`}>
                            {item.status === 'completed' ? 'Concluído' :
                                item.status === 'processing' ? 'Processando' : 'Falhou'}
                        </Text>
                    </View>

                    {item.status === 'completed' && (
                        <TouchableOpacity style={tw`flex-row items-center bg-blue-50 px-3 py-1 rounded-full`}>
                            <Feather name="download" size={14} color="#3B82F6" />
                            <Text style={tw`text-blue-600 text-xs font-medium ml-1`}>Download</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Metrics Preview */}
            {item.metrics && (
                <View style={tw`border-t border-gray-100 pt-3`}>
                    <Text style={tw`text-gray-600 text-xs font-medium mb-2`}>Métricas Principais:</Text>
                    <View style={tw`flex-row flex-wrap`}>
                        {item.metrics.totalParticipants && (
                            <View style={tw`bg-gray-50 px-2 py-1 rounded-md mr-2 mb-1`}>
                                <Text style={tw`text-xs text-gray-700`}>
                                    {item.metrics.totalParticipants} participantes
                                </Text>
                            </View>
                        )}
                        {item.metrics.averageSessionTime && (
                            <View style={tw`bg-gray-50 px-2 py-1 rounded-md mr-2 mb-1`}>
                                <Text style={tw`text-xs text-gray-700`}>
                                    Tempo médio: {item.metrics.averageSessionTime}
                                </Text>
                            </View>
                        )}
                        {item.metrics.completionRate && (
                            <View style={tw`bg-gray-50 px-2 py-1 rounded-md mr-2 mb-1`}>
                                <Text style={tw`text-xs text-gray-700`}>
                                    Taxa conclusão: {item.metrics.completionRate}
                                </Text>
                            </View>
                        )}
                        {item.metrics.satisfactionScore && (
                            <View style={tw`bg-gray-50 px-2 py-1 rounded-md mr-2 mb-1`}>
                                <Text style={tw`text-xs text-gray-700`}>
                                    Satisfação: {item.metrics.satisfactionScore}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            )}
        </View>
    );

    const FilterButton = ({
        filterType,
        label,
        icon,
        color
    }: {
        filterType: typeof selectedFilter,
        label: string,
        icon: string,
        color: string
    }) => (
        <TouchableOpacity
            style={tw`flex-row items-center px-4 py-2 rounded-full mr-3 mb-2 ${selectedFilter === filterType ? 'bg-blue-500' : 'bg-white border border-gray-200'
                }`}
            onPress={() => setSelectedFilter(filterType)}
        >
            <MaterialIcons
                name={icon as any}
                size={16}
                color={selectedFilter === filterType ? 'white' : color}
            />
            <Text style={tw`ml-2 text-sm font-medium ${selectedFilter === filterType ? 'text-white' : 'text-gray-700'
                }`}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={tw`flex-1 bg-[#F7F7F7]`}>
            <Navbar title="Relatórios de Engajamento e Desempenho" />

            <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                {/* Header Stats */}
                <View style={tw`px-4 py-4 bg-white mb-4`}>
                    <View style={tw`flex-row justify-between`}>
                        <View style={tw`items-center flex-1`}>
                            <Text style={tw`text-2xl font-bold text-gray-800`}>
                                {filteredReports.filter(r => r.status === 'completed').length}
                            </Text>
                            <Text style={tw`text-gray-600 text-sm`}>Relatórios Prontos</Text>
                        </View>
                        <View style={tw`items-center flex-1`}>
                            <Text style={tw`text-2xl font-bold text-yellow-600`}>
                                {filteredReports.filter(r => r.status === 'processing').length}
                            </Text>
                            <Text style={tw`text-gray-600 text-sm`}>Em Processamento</Text>
                        </View>
                        <View style={tw`items-center flex-1`}>
                            <Text style={tw`text-2xl font-bold text-blue-600`}>
                                {filteredReports.length}
                            </Text>
                            <Text style={tw`text-gray-600 text-sm`}>Total</Text>
                        </View>
                    </View>
                </View>

                {/* Filters */}
                <View style={tw`px-4 mb-4`}>
                    <Text style={tw`text-lg font-bold text-gray-800 mb-3`}>Filtrar por Tipo</Text>
                    <View style={tw`flex-row flex-wrap`}>
                        <FilterButton
                            filterType="all"
                            label="Todos"
                            icon="view-list"
                            color="#6B7280"
                        />
                        <FilterButton
                            filterType="engajamento"
                            label="Engajamento"
                            icon="favorite"
                            color="#EF4444"
                        />
                        <FilterButton
                            filterType="desempenho"
                            label="Desempenho"
                            icon="trending-up"
                            color="#10B981"
                        />
                        <FilterButton
                            filterType="sessoes"
                            label="Sessões Realizadas"
                            icon="group"
                            color="#3B82F6"
                        />
                    </View>
                </View>

                {/* Generate New Report Section */}
                <View style={tw`px-4 mb-4`}>
                    <Text style={tw`text-lg font-bold text-gray-800 mb-3`}>Gerar Novo Relatório</Text>

                    {/* Period Selection */}
                    <View style={tw`mb-4`}>
                        <Text style={tw`text-gray-700 mb-2 font-medium`}>Período</Text>
                        <View style={tw`flex-row bg-gray-100 rounded-xl p-1`}>
                            {[
                                { key: 'week', label: 'Semana' },
                                { key: 'month', label: 'Mês' },
                                { key: 'quarter', label: 'Trimestre' },
                                { key: 'year', label: 'Ano' }
                            ].map((period) => (
                                <TouchableOpacity
                                    key={period.key}
                                    style={tw`flex-1 py-2 rounded-lg ${selectedPeriod === period.key ? 'bg-white shadow-sm' : ''
                                        }`}
                                    onPress={() => setSelectedPeriod(period.key as any)}
                                >
                                    <Text style={tw`text-center text-sm ${selectedPeriod === period.key ? 'text-gray-800 font-medium' : 'text-gray-600'
                                        }`}>
                                        {period.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Report Type Cards */}
                    <View style={tw`flex-row flex-wrap mb-6`}>
                        {[
                            {
                                type: 'engajamento',
                                label: 'Engajamento',
                                icon: 'favorite',
                                color: '#EF4444',
                                description: 'Participação e interação dos usuários'
                            },
                            {
                                type: 'desempenho',
                                label: 'Desempenho',
                                icon: 'trending-up',
                                color: '#10B981',
                                description: 'Resultados e eficácia das sessões'
                            },
                            {
                                type: 'sessoes',
                                label: 'Sessões Realizadas',
                                icon: 'group',
                                color: '#3B82F6',
                                description: 'Estatísticas completas das sessões'
                            }
                        ].map((reportType) => (
                            <TouchableOpacity
                                key={reportType.type}
                                style={tw`bg-white p-4 rounded-xl shadow-sm w-full mb-3`}
                            >
                                <View style={tw`flex-row items-center`}>
                                    <View style={tw`w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-3`}>
                                        <MaterialIcons
                                            name={reportType.icon as any}
                                            size={24}
                                            color={reportType.color}
                                        />
                                    </View>
                                    <View style={tw`flex-1`}>
                                        <Text style={tw`font-bold text-gray-800`}>
                                            Relatório de {reportType.label}
                                        </Text>
                                        <Text style={tw`text-gray-500 text-sm mt-1`}>
                                            {reportType.description}
                                        </Text>
                                    </View>
                                    <View style={tw`bg-blue-500 px-4 py-2 rounded-full`}>
                                        <Text style={tw`text-white text-sm font-medium`}>Gerar</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Reports List */}
                <View style={tw`px-4 pb-6`}>
                    <Text style={tw`text-lg font-bold text-gray-800 mb-3`}>
                        Relatórios {selectedFilter === 'all' ? 'Recentes' : `de ${getReportTypeLabel(selectedFilter)}`}
                    </Text>

                    {filteredReports.length > 0 ? (
                        filteredReports.map((report) => (
                            <ReportCard key={report.id} item={report} />
                        ))
                    ) : (
                        <View style={tw`bg-white p-8 rounded-xl shadow-sm items-center`}>
                            <MaterialIcons name="description" size={48} color="#9CA3AF" />
                            <Text style={tw`text-gray-500 text-lg mt-4 font-medium`}>
                                Nenhum relatório encontrado
                            </Text>
                            <Text style={tw`text-gray-400 text-sm mt-1 text-center`}>
                                Gere um novo relatório para começar a analisar os dados
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

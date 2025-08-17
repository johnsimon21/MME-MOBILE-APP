import React, { useState, useMemo } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    FlatList, 
    Modal, 
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    StatusBar,
    Platform
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { UITicket } from '@/src/utils/ticketAdapters';
import { TicketItem } from './TicketItem';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

interface TicketsListProps {
    tickets: UITicket[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onTicketPress: (ticket: UITicket) => void;
    onNewTicket: () => void;
    isAdmin?: boolean;
    isLoading?: boolean;
    error?: string | null;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export function TicketsList({ 
    tickets, 
    searchQuery, 
    onSearchChange, 
    onTicketPress, 
    onNewTicket,
    isAdmin = false,
    isLoading = false,
    error = null,
    onRefresh,
    isRefreshing = false
}: TicketsListProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedPriority, setSelectedPriority] = useState<string>('all');

    const statusFilters = isAdmin 
        ? ['all', 'open', 'in-progress', 'resolved', 'closed']
        : ['all', 'open', 'in-progress', 'resolved'];

    const priorityFilters = ['all', 'low', 'medium', 'high', 'urgent'];

    // Filter tickets with search and filters
    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            const matchesSearch = !searchQuery || 
                ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesStatus = selectedStatus === 'all' || ticket.status === selectedStatus;
            const matchesPriority = selectedPriority === 'all' || ticket.priority === selectedPriority;
            
            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [tickets, searchQuery, selectedStatus, selectedPriority]);

    const getStatusLabel = (status: string) => {
        const labels: { [key: string]: string } = {
            'all': 'Todos',
            'open': 'Abertos',
            'in-progress': 'Em Andamento',
            'resolved': 'Resolvidos',
            'closed': 'Fechados'
        };
        return labels[status] || status;
    };

    const getPriorityLabel = (priority: string) => {
        const labels: { [key: string]: string } = {
            'all': 'Todas',
            'low': 'Baixa',
            'medium': 'Média',
            'high': 'Alta',
            'urgent': 'Urgente'
        };
        return labels[priority] || priority;
    };

    const getTicketStats = () => {
        const stats = {
            total: tickets.length,
            open: tickets.filter(t => t.status === 'open').length,
            inProgress: tickets.filter(t => t.status === 'in-progress').length,
            resolved: tickets.filter(t => t.status === 'resolved').length,
            urgent: tickets.filter(t => t.priority === 'urgent').length
        };
        return stats;
    };

    const stats = getTicketStats();

    const toggleModal = () => {
        setModalVisible(!modalVisible);
    };

    const clearFilters = () => {
        setSelectedStatus('all');
        setSelectedPriority('all');
        setModalVisible(false);
    };

    const applyFilters = () => {
        setModalVisible(false);
    };

    // Color helpers
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return '#EF4444';
            case 'high': return '#F59E0B';
            case 'medium': return '#3B82F6';
            case 'low': return '#10B981';
            default: return '#6B7280';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return '#3B82F6';
            case 'in-progress': return '#F59E0B';
            case 'resolved': return '#10B981';
            case 'closed': return '#6B7280';
            default: return '#6B7280';
        }
    };

    // Stats Card Component
    const StatsCard = ({ title, count, color, icon }: { 
        title: string; 
        count: number; 
        color: string; 
        icon: string; 
    }) => (
        <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            flex: 1,
            marginHorizontal: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
        }}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8,
            }}>
                <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: color + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                }}>
                    <Feather name={icon as any} size={16} color={color} />
                </View>
                <Text style={{
                    fontSize: isTablet ? 28 : 24,
                    fontWeight: '700',
                    color: '#1F2937',
                }}>{count}</Text>
            </View>
            <Text style={{
                fontSize: 12,
                color: '#6B7280',
                fontWeight: '500',
            }}>{title}</Text>
        </View>
    );

    // Empty State Component
    const EmptyState = () => (
        <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 60,
            paddingHorizontal: 20,
        }}>
            {isLoading ? (
                <>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={{
                        color: '#9CA3AF',
                        marginTop: 16,
                        fontSize: 16,
                    }}>Carregando tickets...</Text>
                </>
            ) : (
                <>
                    <MaterialIcons name="support-agent" size={64} color="#D1D5DB" />
                    <Text style={{
                        color: '#9CA3AF',
                        fontSize: 18,
                        fontWeight: '600',
                        marginTop: 16,
                        textAlign: 'center',
                    }}>
                        {filteredTickets.length === 0 && tickets.length > 0
                            ? 'Nenhum ticket encontrado'
                            : isAdmin 
                                ? 'Nenhum ticket de suporte'
                                : 'Você não tem tickets'
                        }
                    </Text>
                    <Text style={{
                        color: '#D1D5DB',
                        fontSize: 14,
                        marginTop: 8,
                        textAlign: 'center',
                    }}>
                        {filteredTickets.length === 0 && tickets.length > 0
                            ? 'Tente ajustar os filtros de busca'
                            : isAdmin 
                                ? 'Os tickets dos usuários aparecerão aqui'
                                : 'Crie um ticket para relatar problemas'
                        }
                    </Text>
                    {!isAdmin && filteredTickets.length === 0 && (
                        <TouchableOpacity
                            onPress={onNewTicket}
                            style={{
                                marginTop: 20,
                                backgroundColor: '#4F46E5',
                                paddingHorizontal: 24,
                                paddingVertical: 12,
                                borderRadius: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Feather name="plus" size={16} color="white" />
                            <Text style={{
                                color: '#FFFFFF',
                                fontWeight: '600',
                                marginLeft: 8,
                            }}>Criar Primeiro Ticket</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
            
            {/* Error Display */}
            {error && (
                <View style={{
                    backgroundColor: '#FEF2F2',
                    borderWidth: 1,
                    borderColor: '#FECACA',
                    borderRadius: 12,
                    padding: 16,
                    margin: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                    <MaterialIcons name="error" size={20} color="#DC2626" />
                    <Text style={{
                        color: '#B91C1C',
                        marginLeft: 8,
                        flex: 1,
                        fontSize: 14,
                    }}>{error}</Text>
                </View>
            )}
            
            {/* Header with Search and Stats */}
            <View style={{
                backgroundColor: '#FFFFFF',
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
                paddingHorizontal: 20,
                paddingVertical: 16,
            }}>
                {/* Search Bar */}
                <View style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    marginBottom: 16,
                }}>
                    <Feather name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        placeholder="Buscar tickets..."
                        placeholderTextColor="#9CA3AF"
                        style={{
                            flex: 1,
                            marginLeft: 12,
                            fontSize: 16,
                            color: '#1F2937',
                        }}
                        value={searchQuery}
                        onChangeText={onSearchChange}
                    />
                    <TouchableOpacity onPress={toggleModal}>
                        <Feather name="filter" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* Stats Cards */}
                <View style={{
                    flexDirection: 'row',
                    marginBottom: 8,
                }}>
                    <StatsCard
                        title="Total"
                        count={stats.total}
                        color="#4F46E5"
                        icon="clipboard"
                    />
                    <StatsCard
                        title="Abertos"
                        count={stats.open}
                        color="#3B82F6"
                        icon="circle"
                    />
                    <StatsCard
                        title="Em Andamento"
                        count={stats.inProgress}
                        color="#F59E0B"
                        icon="clock"
                    />
                    <StatsCard
                        title="Resolvidos"
                        count={stats.resolved}
                        color="#10B981"
                        icon="check-circle"
                    />
                </View>

                {/* Action Button for Non-Admin */}
                {!isAdmin && (
                    <TouchableOpacity
                        onPress={onNewTicket}
                        style={{
                            backgroundColor: '#4F46E5',
                            borderRadius: 12,
                            paddingVertical: 14,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 8,
                        }}
                    >
                        <Feather name="plus" size={20} color="white" />
                        <Text style={{
                            color: '#FFFFFF',
                            fontWeight: '600',
                            marginLeft: 8,
                            fontSize: 16,
                        }}>Novo Ticket</Text>
                    </TouchableOpacity>
                )}

                {/* Results Count */}
                <Text style={{
                    fontSize: 13,
                    color: '#6B7280',
                    marginTop: 8,
                }}>
                    {filteredTickets.length} de {tickets.length} tickets
                    {searchQuery && ` para "${searchQuery}"`}
                </Text>
            </View>

            {/* Tickets List */}
            <FlatList
                data={filteredTickets}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ 
                    paddingHorizontal: 20, 
                    paddingVertical: 16,
                    paddingBottom: 100 
                }}
                renderItem={({ item }) => (
                    <TicketItem 
                        ticket={item} 
                        onPress={() => onTicketPress(item)}
                        isAdmin={isAdmin}
                    />
                )}
                ListEmptyComponent={<EmptyState />}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            colors={['#4F46E5']}
                            tintColor="#4F46E5"
                        />
                    ) : undefined
                }
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />

            {/* Filter Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={toggleModal}
                statusBarTranslucent
            >
                <View style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }}>
                    <View style={{
                        backgroundColor: '#FFFFFF',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
                        maxHeight: '80%',
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
                            <Text style={{
                                fontSize: 20,
                                fontWeight: '700',
                                color: '#1F2937',
                            }}>Filtros</Text>
                            <TouchableOpacity
                                onPress={toggleModal}
                                style={{
                                    padding: 8,
                                    borderRadius: 20,
                                    backgroundColor: '#F9FAFB',
                                }}
                            >
                                <Feather name="x" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ padding: 20 }}>
                            {/* Status Filter */}
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: '#374151',
                                    marginBottom: 12,
                                }}>Status do Ticket</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                    {statusFilters.map((status) => (
                                        <TouchableOpacity
                                            key={status}
                                            onPress={() => setSelectedStatus(status)}
                                            style={{
                                                backgroundColor: selectedStatus === status ? '#4F46E5' : '#F3F4F6',
                                                paddingHorizontal: 16,
                                                paddingVertical: 10,
                                                borderRadius: 20,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <View style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: 4,
                                                backgroundColor: getStatusColor(status),
                                                marginRight: 8,
                                            }} />
                                            <Text style={{
                                                color: selectedStatus === status ? '#FFFFFF' : '#6B7280',
                                                fontSize: 14,
                                                fontWeight: '600',
                                            }}>{getStatusLabel(status)}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Priority Filter */}
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: '#374151',
                                    marginBottom: 12,
                                }}>Prioridade</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                    {priorityFilters.map((priority) => (
                                        <TouchableOpacity
                                            key={priority}
                                            onPress={() => setSelectedPriority(priority)}
                                            style={{
                                                backgroundColor: selectedPriority === priority ? '#4F46E5' : '#F3F4F6',
                                                paddingHorizontal: 16,
                                                paddingVertical: 10,
                                                borderRadius: 20,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <View style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: 4,
                                                backgroundColor: getPriorityColor(priority),
                                                marginRight: 8,
                                            }} />
                                            <Text style={{
                                                color: selectedPriority === priority ? '#FFFFFF' : '#6B7280',
                                                fontSize: 14,
                                                fontWeight: '600',
                                            }}>{getPriorityLabel(priority)}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* Modal Actions */}
                        <View style={{
                            padding: 20,
                            borderTopWidth: 1,
                            borderTopColor: '#F3F4F6',
                            backgroundColor: '#FFFFFF',
                            flexDirection: 'row',
                            gap: 12,
                        }}>
                            <TouchableOpacity
                                onPress={clearFilters}
                                style={{
                                    flex: 1,
                                    paddingVertical: 16,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: '#E5E7EB',
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{
                                    color: '#6B7280',
                                    fontWeight: '600',
                                    fontSize: 16,
                                }}>Limpar Filtros</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={applyFilters}
                                style={{
                                    flex: 1,
                                    backgroundColor: '#4F46E5',
                                    paddingVertical: 16,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{
                                    color: '#FFFFFF',
                                    fontWeight: '600',
                                    fontSize: 16,
                                }}>Aplicar Filtros</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

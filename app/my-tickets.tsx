import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import tw from 'twrnc';
import { useSupport } from '../src/context/SupportContext';
import { ITicket, TicketPriority, TicketStatus } from '../src/interfaces/support.interface';
import { formatSupportDate, getPriorityColor, getStatusColor } from '../src/utils/support.utils';

export default function MyTicketsScreen() {
    const router = useRouter();
    const { tickets: ticketService } = useSupport();
    const [tickets, setTickets] = useState<ITicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<'all' | TicketStatus>('all');

    const loadTickets = async () => {
        try {
            setLoading(true);
            const response = await ticketService.getMyTickets({
                status: selectedFilter === 'all' ? undefined : selectedFilter,
                sortBy: 'updatedAt',
                sortOrder: 'desc'
            });
            setTickets(response.tickets);
        } catch (error) {
            console.error('Error loading tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTickets();
        setRefreshing(false);
    };

    useEffect(() => {
        loadTickets();
    }, [selectedFilter]);

    const getStatusIcon = (status: TicketStatus) => {
        switch (status) {
            case TicketStatus.OPEN:
                return 'alert-circle';
            case TicketStatus.IN_PROGRESS:
                return 'clock';
            case TicketStatus.WAITING_USER:
                return 'user-check';
            case TicketStatus.RESOLVED:
                return 'check-circle';
            case TicketStatus.CLOSED:
                return 'x-circle';
            default:
                return 'circle';
        }
    };

    const getPriorityIcon = (priority: TicketPriority) => {
        switch (priority) {
            case TicketPriority.URGENT:
                return 'alert-triangle';
            case TicketPriority.HIGH:
                return 'arrow-up';
            case TicketPriority.MEDIUM:
                return 'minus';
            case TicketPriority.LOW:
                return 'arrow-down';
            default:
                return 'minus';
        }
    };

    const filterOptions = [
        { id: 'all', label: 'Todos', count: tickets.length },
        { id: TicketStatus.OPEN, label: 'Abertos', count: tickets.filter(t => t.status === TicketStatus.OPEN).length },
        { id: TicketStatus.IN_PROGRESS, label: 'Em Andamento', count: tickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length },
        { id: TicketStatus.WAITING_USER, label: 'Aguardando', count: tickets.filter(t => t.status === TicketStatus.WAITING_USER).length },
        { id: TicketStatus.RESOLVED, label: 'Resolvidos', count: tickets.filter(t => t.status === TicketStatus.RESOLVED).length },
    ];

    const filteredTickets = selectedFilter === 'all' 
        ? tickets 
        : tickets.filter(ticket => ticket.status === selectedFilter);

    const TicketItem = ({ item }: { item: ITicket }) => {
        const statusColor = getStatusColor(item.status);
        const priorityColor = getPriorityColor(item.priority);

        return (
            <TouchableOpacity
                style={tw`bg-white rounded-xl shadow-sm border border-gray-100 mb-3 overflow-hidden`}
                onPress={() => router.push(`/ticket-details/${item.id}`)}
                activeOpacity={0.7}
            >
                {/* Priority Indicator */}
                <View style={tw`h-1 bg-orange-200`} />
                
                <View style={tw`p-4`}>
                    {/* Header */}
                    <View style={tw`flex-row items-start justify-between mb-3`}>
                        <View style={tw`flex-1 mr-3`}>
                            <Text style={tw`font-bold text-gray-800 text-base mb-1`} numberOfLines={2}>
                                {item.title}
                            </Text>
                            <Text style={tw`text-gray-600 text-sm`} numberOfLines={2}>
                                {item.description}
                            </Text>
                        </View>
                        
                        {/* Status Badge */}
                        <View style={tw`bg-blue-100 px-3 py-1 rounded-full flex-row items-center`}>
                            <Feather 
                                name={getStatusIcon(item.status)} 
                                size={12} 
                                color="#3B82F6" 
                                style={tw`mr-1`}
                            />
                            <Text style={tw`text-blue-800 text-xs font-medium`}>
                                {item.status === TicketStatus.OPEN ? 'Aberto' :
                                 item.status === TicketStatus.IN_PROGRESS ? 'Em Andamento' :
                                 item.status === TicketStatus.WAITING_USER ? 'Aguardando' :
                                 item.status === TicketStatus.RESOLVED ? 'Resolvido' : 'Fechado'}
                            </Text>
                        </View>
                    </View>

                    {/* Details Row */}
                    <View style={tw`flex-row items-center justify-between`}>
                        <View style={tw`flex-row items-center`}>
                            {/* Priority */}
                            <View style={tw`flex-row items-center mr-4`}>
                                <MaterialIcons 
                                    name={getPriorityIcon(item.priority) as any} 
                                    size={16} 
                                    color="#6B7280" 
                                />
                                <Text style={tw`text-gray-600 text-sm ml-1`}>
                                    {item.priority === TicketPriority.URGENT ? 'Urgente' :
                                     item.priority === TicketPriority.HIGH ? 'Alta' :
                                     item.priority === TicketPriority.MEDIUM ? 'Média' : 'Baixa'}
                                </Text>
                            </View>

                            {/* Messages Count */}
                            {item.messagesCount > 0 && (
                                <View style={tw`flex-row items-center mr-4`}>
                                    <Feather name="message-circle" size={16} color="#6B7280" />
                                    <Text style={tw`text-gray-600 text-sm ml-1`}>
                                        {item.messagesCount}
                                    </Text>
                                </View>
                            )}

                            {/* Attachments */}
                            {item.attachments && item.attachments.length > 0 && (
                                <View style={tw`flex-row items-center`}>
                                    <Feather name="paperclip" size={16} color="#6B7280" />
                                    <Text style={tw`text-gray-600 text-sm ml-1`}>
                                        {item.attachments.length}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Date */}
                        <Text style={tw`text-gray-500 text-xs`}>
                            {formatSupportDate(item.updatedAt.toString())}
                        </Text>
                    </View>

                    {/* Last Message */}
                    {item.lastMessage && (
                        <View style={tw`mt-3 pt-3 border-t border-gray-100`}>
                            <View style={tw`flex-row items-center mb-1`}>
                                <Text style={tw`text-gray-500 text-xs`}>
                                    Última mensagem de {item.lastMessage.senderName}:
                                </Text>
                            </View>
                            <Text style={tw`text-gray-700 text-sm`} numberOfLines={2}>
                                {item.lastMessage.message}
                            </Text>
                        </View>
                    )}
                </View>

                {/* New Message Indicator */}
                {item.status === TicketStatus.WAITING_USER && (
                    <View style={tw`absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white`} />
                )}
            </TouchableOpacity>
        );
    };

    const EmptyState = () => (
        <View style={tw`flex-1 items-center justify-center py-12`}>
            <View style={tw`w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4`}>
                <Feather name="inbox" size={32} color="#9CA3AF" />
            </View>
            <Text style={tw`text-gray-800 font-bold text-lg mb-2`}>
                {selectedFilter === 'all' ? 'Nenhum ticket encontrado' : 'Nenhum ticket nesta categoria'}
            </Text>
            <Text style={tw`text-gray-500 text-center mb-6 px-8`}>
                {selectedFilter === 'all' 
                    ? 'Você ainda não criou nenhum ticket de suporte. Crie um para começar.'
                    : 'Não há tickets nesta categoria no momento.'
                }
            </Text>
            {selectedFilter === 'all' && (
                <TouchableOpacity
                    onPress={() => router.push('/create-ticket')}
                    style={tw`bg-purple-500 px-6 py-3 rounded-xl flex-row items-center`}
                >
                    <Feather name="plus" size={20} color="white" />
                    <Text style={tw`text-white font-medium ml-2`}>Criar Primeiro Ticket</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={tw`flex-1 bg-gray-50`}>
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={tw`pt-12 pb-6 px-6`}
                >
                    <View style={tw`flex-row items-center justify-between`}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={tw`w-10 h-10 bg-white bg-opacity-20 rounded-full items-center justify-center`}
                        >
                            <Feather name="arrow-left" size={20} color="white" />
                        </TouchableOpacity>
                        <Text style={tw`text-white text-xl font-bold`}>Meus Tickets</Text>
                        <View style={tw`w-10 h-10`} />
                    </View>
                </LinearGradient>
                
                <View style={tw`flex-1 items-center justify-center`}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={tw`text-gray-600 mt-4`}>Carregando tickets...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Header */}
            <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                style={tw`pt-12 pb-6 px-6`}
            >
                <View style={tw`flex-row items-center justify-between mb-4`}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={tw`w-10 h-10 bg-white bg-opacity-20 rounded-full items-center justify-center`}
                    >
                        <Feather name="arrow-left" size={20} color="white" />
                    </TouchableOpacity>

                    <Text style={tw`text-white text-xl font-bold`}>Meus Tickets</Text>

                    <TouchableOpacity
                        onPress={() => router.push('/create-ticket')}
                        style={tw`w-10 h-10 bg-white bg-opacity-20 rounded-full items-center justify-center`}
                    >
                        <Feather name="plus" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                <Text style={tw`text-white text-opacity-90`}>
                    {tickets.length} ticket(s) total
                </Text>
            </LinearGradient>

            {/* Filter Tabs */}
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={tw`bg-white border-b border-gray-200 max-h-14`}
                contentContainerStyle={tw`px-4 py-3`}
            >
                {filterOptions.map((filter) => (
                    <TouchableOpacity
                        key={filter.id}
                        onPress={() => setSelectedFilter(filter.id as any)}
                        style={tw`${selectedFilter === filter.id 
                            ? 'bg-indigo-100 border-indigo-500' 
                            : 'bg-gray-50 border-gray-200'
                        } border rounded-full px-4 py-2 mr-3 flex-row items-center`}
                    >
                        <Text style={tw`${selectedFilter === filter.id 
                            ? 'text-indigo-700' 
                            : 'text-gray-600'
                        } font-medium text-sm`}>
                            {filter.label}
                        </Text>
                        {filter.count > 0 && (
                            <View style={tw`${selectedFilter === filter.id 
                                ? 'bg-indigo-500' 
                                : 'bg-gray-400'
                            } rounded-full w-5 h-5 items-center justify-center ml-2`}>
                                <Text style={tw`text-white text-xs font-bold`}>
                                    {filter.count}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Tickets List */}
            <FlatList
                data={filteredTickets}
                renderItem={TicketItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={tw`p-4`}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={EmptyState}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

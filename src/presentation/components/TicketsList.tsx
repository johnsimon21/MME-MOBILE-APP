import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { SupportTicket } from '@/src/types/support.types';
import { TicketItem } from './TicketItem';

interface TicketsListProps {
    tickets: SupportTicket[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onTicketPress: (ticket: SupportTicket) => void;
    onNewTicket: () => void;
    isAdmin?: boolean;
}

export function TicketsList({ 
    tickets, 
    searchQuery, 
    onSearchChange, 
    onTicketPress, 
    onNewTicket,
    isAdmin = false 
}: TicketsListProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedPriority, setSelectedPriority] = useState<string>('all');

    const statusFilters = isAdmin 
        ? ['all', 'open', 'in-progress', 'resolved', 'closed']
        : ['all', 'open', 'in-progress', 'resolved'];

    const priorityFilters = ['all', 'low', 'medium', 'high', 'urgent'];

    const filteredTickets = tickets.filter(ticket => {
        const matchesStatus = selectedStatus === 'all' || ticket.status === selectedStatus;
        const matchesPriority = selectedPriority === 'all' || ticket.priority === selectedPriority;
        return matchesStatus && matchesPriority;
    });

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
    const getSpecificTicketStats = (status: "all" | "open" | "in-progress" | "resolved" | "urgent") => {
        const stats: { [key: string]: number } = {
            "all": tickets.length,
            "open": tickets.filter(t => t.status === 'open').length,
            "in-progress": tickets.filter(t => t.status === 'in-progress').length,
            "resolved": tickets.filter(t => t.status === 'resolved').length,
            "urgent": tickets.filter(t => t.priority === 'urgent').length
        };
        return stats[status] || 0;
    };

    const stats = getTicketStats();

    const toggleModal = () => {
        setModalVisible(!modalVisible);
    };

    const applyFilters = () => {
        // Logic to apply filters
        toggleModal();
    };

    const EmptyState = () => (
        <View style={tw`items-center justify-center py-12`}>
            <Feather name="clipboard" size={48} color="#9CA3AF" />
            <Text style={tw`text-gray-500 text-lg mt-4`}>
                {isAdmin ? 'Nenhum ticket encontrado' : 'Você não tem tickets'}
            </Text>
            <Text style={tw`text-gray-400 text-sm mt-1 text-center`}>
                {isAdmin 
                    ? 'Os tickets dos usuários aparecerão aqui' 
                    : 'Crie um ticket para relatar problemas'
                }
            </Text>
            {!isAdmin && (
                <TouchableOpacity
                    onPress={onNewTicket}
                    style={tw`mt-4 bg-blue-500 px-6 py-3 rounded-lg`}
                >
                    <Text style={tw`text-white font-medium`}>Criar Primeiro Ticket</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Header with Search and Filter */}
            <View style={tw`bg-white p-2 border-b border-gray-200 flex-row items-center justify-between`}>
                {/* Search Bar */}
                <View style={tw`bg-gray-100 rounded-lg flex-row items-center px-2 py-1 mb-2 flex-1`}>
                    <TextInput
                        placeholder="Buscar tickets..."
                        style={tw`flex-1 ml-2 text-gray-700`}
                        value={searchQuery}
                        onChangeText={onSearchChange}
                    />
                    <TouchableOpacity onPress={toggleModal}>
                        <Feather name="filter" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* New Ticket Button for Users */}
                {!isAdmin && (
                    <TouchableOpacity
                        onPress={onNewTicket}
                        style={tw`bg-blue-500 py-2 rounded-lg flex-row items-center justify-center ml-2`}
                    >
                        <Feather name="plus" size={20} color="white" />
                        <Text style={tw`text-white font-medium ml-2`}>Novo Ticket</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Tickets List */}
            <FlatList
                data={filteredTickets}
                keyExtractor={(item) => item.id}
                contentContainerStyle={tw`p-4`}
                renderItem={({ item }) => (
                    <TicketItem 
                        ticket={item} 
                        onPress={() => onTicketPress(item)}
                        isAdmin={isAdmin}
                    />
                )}
                ListEmptyComponent={<Text style={tw`text-center text-gray-500`}>Nenhum ticket encontrado</Text>}
                showsVerticalScrollIndicator={false}
            />

            {/* Filter Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={toggleModal}
            >
                <View style={tw`flex-1 justify-center bg-black bg-opacity-50`}>
                    <View style={tw`bg-white rounded-lg p-4 mx-4`}>
                        <Text style={tw`text-lg font-bold mb-4`}>Filtros</Text>
                        {/* Status Filter */}
                        <Text style={tw`font-medium mb-2`}>Status:</Text>
                        {statusFilters.map((status) => (
                            <TouchableOpacity key={status} onPress={() => setSelectedStatus(status)}>
                                <Text style={tw`p-2 text-center ${selectedStatus === status ? 'bg-blue-200 text-blue-800' : 'bg-gray-100'}`}>
                                    {getStatusLabel(status)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {/* Priority Filter */}
                        <Text style={tw`font-medium mt-4 mb-2`}>Prioridade:</Text>
                        {priorityFilters.map((priority) => (
                            <TouchableOpacity key={priority} onPress={() => setSelectedPriority(priority)}>
                                <Text style={tw`p-2 text-center ${selectedPriority === priority ? 'bg-purple-200 text-purple-800' : 'bg-gray-100'}`}>
                                    {getPriorityLabel(priority)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={applyFilters} style={tw`mt-4 bg-blue-500 p-2 rounded`}>
                            <Text style={tw`text-white text-center`}>Aplicar Filtros</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={toggleModal} style={tw`mt-2 p-2 rounded border border-gray-300`}>
                            <Text style={tw`text-center`}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

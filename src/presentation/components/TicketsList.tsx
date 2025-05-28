import React from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
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
    isAdmin?: boolean; // Add this prop
}

export function TicketsList({ 
    tickets, 
    searchQuery, 
    onSearchChange, 
    onTicketPress, 
    onNewTicket,
    isAdmin = false
}: TicketsListProps) {
    const EmptyState = () => (
        <View style={tw`items-center justify-center py-12`}>
            <Feather name="clipboard" size={48} color="#9CA3AF" />
            <Text style={tw`text-gray-500 text-lg mt-4`}>Nenhum ticket encontrado</Text>
            <Text style={tw`text-gray-400 text-sm mt-1 text-center`}>
                {isAdmin ? 'Não há tickets para revisar' : 'Crie seu primeiro ticket de suporte'}
            </Text>
        </View>
    );

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Search and Filter */}
            <View style={tw`bg-white p-4 border-b border-gray-200`}>
                <View style={tw`bg-gray-100 rounded-lg flex-row items-center px-4 py-3 mb-3`}>
                    <Feather name="search" size={20} color="#6B7280" />
                    <TextInput
                        placeholder="Buscar tickets..."
                        style={tw`flex-1 ml-3 text-gray-700`}
                        value={searchQuery}
                        onChangeText={onSearchChange}
                    />
                </View>
                
                {!isAdmin && (
                    <TouchableOpacity
                        onPress={onNewTicket}
                        style={tw`bg-blue-500 py-3 rounded-lg flex-row items-center justify-center`}
                    >
                        <Feather name="plus" size={20} color="white" />
                        <Text style={tw`text-white font-medium ml-2`}>Novo Ticket</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Tickets List */}
            <FlatList
                data={tickets}
                keyExtractor={(item) => item.id}
                contentContainerStyle={tw`p-4`}
                renderItem={({ item }) => (
                    <TicketItem 
                        ticket={item} 
                        onPress={onTicketPress} 
                        isAdmin={isAdmin}
                    />
                )}
                ListEmptyComponent={EmptyState}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

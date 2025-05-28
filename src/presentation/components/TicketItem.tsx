import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { SupportTicket } from '@/src/types/support.types';
import { getStatusColor, getStatusText, getPriorityColor, formatSupportDate } from '@/src/utils/support.utils';

interface TicketItemProps {
    ticket: SupportTicket;
    onPress: (ticket: SupportTicket) => void;
    isAdmin?: boolean; // Add this as a prop instead of using context
}

export function TicketItem({ ticket, onPress, isAdmin = false }: TicketItemProps) {
    return (
        <TouchableOpacity
            onPress={() => onPress(ticket)}
            style={tw`bg-white p-4 rounded-xl mb-3 shadow-sm`}
        >
            <View style={tw`flex-row items-start justify-between mb-2`}>
                <View style={tw`flex-1`}>
                    <Text style={tw`font-semibold text-gray-800 mb-1`}>{ticket.title}</Text>
                    {isAdmin && (
                        <Text style={tw`text-gray-500 text-sm mb-1`}>Por: {ticket.userName}</Text>
                    )}
                    <Text style={tw`text-gray-600 text-sm`} numberOfLines={2}>
                        {ticket.description}
                    </Text>
                </View>
                <View style={tw`ml-3 items-end`}>
                    <View style={tw`flex-row items-center mb-1`}>
                        <View 
                            style={[
                                tw`w-3 h-3 rounded-full mr-2`,
                                { backgroundColor: getStatusColor(ticket.status) }
                            ]} 
                        />
                        <Text style={tw`text-xs font-medium`}>
                            {getStatusText(ticket.status)}
                        </Text>
                    </View>
                    <View 
                        style={[
                            tw`px-2 py-1 rounded-full`,
                            { backgroundColor: getPriorityColor(ticket.priority) + '20' }
                        ]}
                    >
                        <Text 
                            style={[
                                tw`text-xs font-medium`,
                                { color: getPriorityColor(ticket.priority) }
                            ]}
                        >
                            {ticket.priority.toUpperCase()}
                        </Text>
                    </View>
                </View>
            </View>
            
            <View style={tw`flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100`}>
                <Text style={tw`text-gray-400 text-xs`}>
                    Criado: {formatSupportDate(ticket.createdAt)}
                </Text>
                <Text style={tw`text-gray-400 text-xs`}>
                    #{ticket.id}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

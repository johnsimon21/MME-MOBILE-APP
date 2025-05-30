import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { SupportTicket } from '@/src/types/support.types';
import { getStatusColor, getStatusText, getPriorityColor, formatSupportDate } from '@/src/utils/support.utils';

interface TicketItemProps {
    ticket: SupportTicket;
    onPress: () => void;
    isAdmin?: boolean;
}

export function TicketItem({ ticket, onPress, isAdmin = false }: TicketItemProps) {
    const getTimeAgo = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

        if (diffInMinutes < 60) {
            return `${diffInMinutes}m atrás`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)}h atrás`;
        } else {
            return `${Math.floor(diffInMinutes / 1440)}d atrás`;
        }
    };

    const getUrgencyIndicator = () => {
        if (ticket.priority === 'urgent') {
            return (
                <View style={tw`absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white`} />
            );
        }
        return null;
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            style={tw`bg-white rounded-xl p-4 mb-3 shadow-sm border-l-4`}
            activeOpacity={0.7}
        >
            <View style={tw`flex-row items-start justify-between mb-3`}>
                <View style={tw`flex-1 mr-3`}>
                    <View style={tw`flex-row items-center mb-2`}>
                        <Text style={tw`font-bold text-gray-800 flex-1`} numberOfLines={1}>
                            {isAdmin ? `#${ticket.id} - ${ticket.title}` : ticket.title}
                        </Text>
                        {getUrgencyIndicator()}
                    </View>

                    {isAdmin && (
                        <View style={tw`flex-row items-center mb-2`}>
                            <Feather name="user" size={14} color="#6B7280" />
                            <Text style={tw`text-gray-600 text-sm ml-1`}>
                                {ticket.userName}
                            </Text>
                        </View>
                    )}

                    <Text style={tw`text-gray-600 text-sm mb-2`} numberOfLines={2}>
                        {ticket.description}
                    </Text>

                    <View style={tw`flex-row items-center justify-between`}>
                        <View style={tw`flex-row items-center`}>
                            <View style={tw`px-2 py-1 rounded-full ${getStatusColor(ticket.status)} mr-2`}>
                                <Text style={tw`text-xs font-medium text-white`}>
                                    {getStatusText(ticket.status)}
                                </Text>
                            </View>

                            <View style={tw`px-2 py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
                                <Text style={tw`text-xs font-medium text-white`}>
                                    {ticket.priority === 'low' ? 'Baixa' :
                                        ticket.priority === 'medium' ? 'Média' :
                                            ticket.priority === 'high' ? 'Alta' : 'Urgente'}
                                </Text>
                            </View>
                        </View>

                        <Text style={tw`text-xs text-gray-500`}>
                            {getTimeAgo(ticket.updatedAt)}
                        </Text>
                    </View>
                </View>

                <View style={tw`items-center`}>
                    <View style={tw`w-10 h-10 bg-gray-100 rounded-full items-center justify-center mb-2`}>
                        <Feather
                            name={
                                ticket.status === 'open' ? 'alert-circle' :
                                    ticket.status === 'in-progress' ? 'clock' :
                                        ticket.status === 'resolved' ? 'check-circle' : 'x-circle'
                            }
                            size={20}
                            color={
                                ticket.status === 'open' ? '#EF4444' :
                                    ticket.status === 'in-progress' ? '#F59E0B' :
                                        ticket.status === 'resolved' ? '#10B981' : '#6B7280'
                            }
                        />
                    </View>

                    {ticket.messages && ticket.messages.length > 1 && (
                        <View style={tw`flex-row items-center`}>
                            <Feather name="message-circle" size={12} color="#6B7280" />
                            <Text style={tw`text-xs text-gray-500 ml-1`}>
                                {ticket.messages.length}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Admin Quick Actions */}
            {isAdmin && (
                <View style={tw`border-t border-gray-100 pt-3 flex-row justify-between items-center`}>
                    <View style={tw`flex-row items-center`}>
                        <Text style={tw`text-xs text-gray-500 mr-3`}>
                            Categoria: {ticket.category}
                        </Text>
                        <Text style={tw`text-xs text-gray-500`}>
                            Criado: {formatSupportDate(ticket.createdAt)}
                        </Text>
                    </View>

                    <View style={tw`flex-row items-center`}>
                        {ticket.status === 'open' && (
                            <View style={tw`w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse`} />
                        )}
                        <Feather name="chevron-right" size={16} color="#6B7280" />
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
}

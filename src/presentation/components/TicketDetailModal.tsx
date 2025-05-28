import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { SupportTicket, TicketMessage } from '@/src/types/support.types';
import { getStatusColor, getStatusText, getPriorityColor, formatSupportDate } from '@/src/utils/support.utils';

interface TicketDetailModalProps {
    visible: boolean;
    ticket: SupportTicket | null;
    onClose: () => void;
    onUpdateTicket: (ticket: SupportTicket) => void;
    currentUser?: { id: string; fullName: string }; // Add user prop
    isAdmin?: boolean; // Add admin prop
}

export function TicketDetailModal({ 
    visible, 
    ticket, 
    onClose, 
    onUpdateTicket, 
    currentUser,
    isAdmin = false 
}: TicketDetailModalProps) {
    const [newMessage, setNewMessage] = useState('');

    if (!ticket) return null;

    const sendMessage = () => {
        if (!newMessage.trim()) return;

        const message: TicketMessage = {
            id: Date.now().toString(),
            message: newMessage,
            sender: isAdmin ? 'admin' : 'user',
            timestamp: new Date().toISOString()
        };

        const updatedTicket: SupportTicket = {
            ...ticket,
            messages: [...ticket.messages, message],
            updatedAt: new Date().toISOString(),
            status: isAdmin && ticket.status === 'open' ? 'in-progress' : ticket.status
        };

        onUpdateTicket(updatedTicket);
        setNewMessage('');
    };

    const updateTicketStatus = (newStatus: string) => {
        const updatedTicket: SupportTicket = {
            ...ticket,
            status: newStatus as any,
            updatedAt: new Date().toISOString()
        };
        onUpdateTicket(updatedTicket);
    };

    const MessageItem = ({ message }: { message: TicketMessage }) => (
        <View style={tw`mb-4 ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <View style={tw`max-w-[85%] ${
                message.sender === 'user' 
                    ? 'bg-blue-500 rounded-tl-xl rounded-tr-xl rounded-bl-xl' 
                    : 'bg-gray-100 rounded-tl-xl rounded-tr-xl rounded-br-xl'
            } p-4 shadow-sm`}>
                <Text style={tw`${message.sender === 'user' ? 'text-white' : 'text-gray-800'} leading-6`}>
                    {message.message}
                </Text>
            </View>
            <Text style={tw`text-xs text-gray-500 mt-1`}>
                {message.sender === 'user' ? ticket.userName : 'Suporte'} • {formatSupportDate(message.timestamp)}
            </Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={tw`flex-1 bg-white`}>
                {/* Header */}
                <View style={tw`bg-white pt-12 pb-4 px-4 border-b border-gray-200`}>
                    <View style={tw`flex-row items-center justify-between mb-3`}>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="arrow-left" size={24} color="#4F46E5" />
                        </TouchableOpacity>
                        <Text style={tw`font-bold text-lg`}>Ticket #{ticket.id}</Text>
                        <View style={tw`w-6`} />
                    </View>
                    
                    <Text style={tw`font-bold text-xl mb-2`}>{ticket.title}</Text>
                    
                    <View style={tw`flex-row items-center justify-between`}>
                        <View style={tw`flex-row items-center`}>
                            <View 
                                style={[
                                    tw`w-3 h-3 rounded-full mr-2`,
                                    { backgroundColor: getStatusColor(ticket.status) }
                                ]} 
                            />
                            <Text style={tw`font-medium mr-4`}>
                                {getStatusText(ticket.status)}
                            </Text>
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
                        
                        {isAdmin && (
                            <View style={tw`flex-row`}>
                                {ticket.status !== 'resolved' && (
                                    <TouchableOpacity
                                        onPress={() => updateTicketStatus('resolved')}
                                        style={tw`bg-green-500 px-3 py-1 rounded-full mr-2`}
                                    >
                                        <Text style={tw`text-white text-xs font-medium`}>Resolver</Text>
                                    </TouchableOpacity>
                                )}
                                {ticket.status !== 'closed' && (
                                    <TouchableOpacity
                                        onPress={() => updateTicketStatus('closed')}
                                        style={tw`bg-gray-500 px-3 py-1 rounded-full`}
                                    >
                                        <Text style={tw`text-white text-xs font-medium`}>Fechar</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                </View>

                {/* Messages */}
                <FlatList
                    data={ticket.messages}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={tw`p-4`}
                    renderItem={({ item }) => <MessageItem message={item} />}
                    showsVerticalScrollIndicator={false}
                />

                {/* Message Input */}
                {ticket.status !== 'closed' && (
                    <View style={tw`bg-white p-4 border-t border-gray-200 flex-row items-center`}>
                        <View style={tw`flex-1 bg-gray-100 rounded-full px-4 py-2 flex-row items-center mr-3`}>
                            <TextInput
                                placeholder="Digite sua resposta..."
                                style={tw`flex-1 text-gray-700`}
                                value={newMessage}
                                onChangeText={setNewMessage}
                                multiline
                            />
                        </View>
                        <TouchableOpacity
                            onPress={sendMessage}
                            style={tw`${newMessage.trim() ? 'bg-blue-500' : 'bg-gray-300'} p-3 rounded-full`}
                            disabled={!newMessage.trim()}
                        >
                            <Feather name="send" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    );
}

import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { SupportTicket } from '@/src/types/support.types';
import { getStatusColor, getStatusText, getPriorityColor, formatSupportDate } from '@/src/utils/support.utils';

interface TicketDetailModalProps {
    visible: boolean;
    ticket: SupportTicket | null;
    onClose: () => void;
    onUpdateTicket: (ticket: SupportTicket) => void;
    currentUser: any;
    isAdmin?: boolean;
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
    const [selectedStatus, setSelectedStatus] = useState(ticket?.status || 'open');
    const [selectedPriority, setSelectedPriority] = useState(ticket?.priority || 'medium');

    React.useEffect(() => {
        if (ticket) {
            setSelectedStatus(ticket.status);
            setSelectedPriority(ticket.priority);
        }
    }, [ticket]);

    if (!ticket) return null;

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        const updatedTicket: SupportTicket = {
            ...ticket,
            messages: [
                ...ticket.messages,
                {
                    id: Date.now().toString(),
                    message: newMessage,
                    sender: isAdmin ? 'admin' : 'user',
                    timestamp: new Date().toISOString()
                }
            ],
            updatedAt: new Date().toISOString()
        };

        onUpdateTicket(updatedTicket);
        setNewMessage('');
    };

    const handleStatusChange = (status: "open" | "in-progress" | "resolved" | "closed") => {
        setSelectedStatus(status);
        const updatedTicket: SupportTicket = {
            ...ticket,
            status,
            updatedAt: new Date().toISOString()
        };
        onUpdateTicket(updatedTicket);
    };

    const handlePriorityChange = (priority: "low" | "medium" | "high" | "urgent") => {
        setSelectedPriority(priority);
        const updatedTicket: SupportTicket = {
            ...ticket,
            priority,
            updatedAt: new Date().toISOString()
        };
        onUpdateTicket(updatedTicket);
    };

    const statusOptions: Array<"open" | "in-progress" | "resolved" | "closed"> = ['open', 'in-progress', 'resolved', 'closed'];
    const priorityOptions: Array<"low" | "medium" | "high" | "urgent"> = ['low', 'medium', 'high', 'urgent'];

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={tw`flex-1 bg-black bg-opacity-50`}>
                <View style={tw`bg-white rounded-t-3xl mt-20 flex-1`}>
                    {/* Header */}
                    <View style={tw`flex-row items-center justify-between p-6 border-b border-gray-200`}>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-xl font-bold text-gray-800`}>
                                {isAdmin ? `Ticket #${ticket.id}` : 'Meu Ticket'}
                            </Text>
                            <Text style={tw`text-gray-600 mt-1`}>{ticket.title}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="x" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Ticket Info */}
                    <View style={tw`p-6 border-b border-gray-200`}>
                        <View style={tw`flex-row items-center justify-between mb-4`}>
                            <View style={tw`flex-row items-center`}>
                                <View style={tw`px-3 py-1 rounded-full ${getStatusColor(ticket.status)} mr-3`}>
                                    <Text style={tw`text-white text-sm font-medium`}>
                                        {getStatusText(ticket.status)}
                                    </Text>
                                </View>
                                <View style={tw`px-3 py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
                                    <Text style={tw`text-white text-sm font-medium`}>
                                        {ticket.priority === 'low' ? 'Baixa' :
                                         ticket.priority === 'medium' ? 'Média' :
                                         ticket.priority === 'high' ? 'Alta' : 'Urgente'}
                                    </Text>
                                </View>
                            </View>
                            
                            {isAdmin && (
                                <Text style={tw`text-gray-500 text-sm`}>
                                    Por: {ticket.userName}
                                </Text>
                            )}
                        </View>

                        <Text style={tw`text-gray-700 mb-4`}>{ticket.description}</Text>
                        
                        <View style={tw`flex-row justify-between text-sm text-gray-500`}>
                            <Text>Criado: {formatSupportDate(ticket.createdAt)}</Text>
                            <Text>Atualizado: {formatSupportDate(ticket.updatedAt)}</Text>
                        </View>
                    </View>

                    {/* Admin Controls */}
                    {isAdmin && (
                        <View style={tw`p-6 bg-blue-50 border-b border-gray-200`}>
                            <Text style={tw`font-medium text-gray-800 mb-3`}>Controles do Admin:</Text>
                            
                            <View style={tw`flex-row justify-between mb-4`}>
                                <View style={tw`flex-1 mr-3`}>
                                    <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>Status:</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={tw`flex-row`}>
                                            {statusOptions.map((status) => (
                                                <TouchableOpacity
                                                    key={status}
                                                    onPress={() => handleStatusChange(status)}
                                                    style={tw`px-3 py-2 mr-2 rounded-full ${
                                                        selectedStatus === status ? 'bg-blue-500' : 'bg-gray-200'
                                                    }`}
                                                >
                                                    <Text style={tw`text-xs font-medium ${
                                                        selectedStatus === status ? 'text-white' : 'text-gray-700'
                                                    }`}>
                                                        {getStatusText(status)}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
                                
                                <View style={tw`flex-1`}>
                                    <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>Prioridade:</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={tw`flex-row`}>
                                            {priorityOptions.map((priority) => (
                                                <TouchableOpacity
                                                    key={priority}
                                                    onPress={() => handlePriorityChange(priority)}
                                                    style={tw`px-3 py-2 mr-2 rounded-full ${
                                                        selectedPriority === priority ? 'bg-purple-500' : 'bg-gray-200'
                                                    }`}
                                                >
                                                    <Text style={tw`text-xs font-medium ${
                                                        selectedPriority === priority ? 'text-white' : 'text-gray-700'
                                                    }`}>
                                                        {priority === 'low' ? 'Baixa' :
                                                         priority === 'medium' ? 'Média' :
                                                         priority === 'high' ? 'Alta' : 'Urgente'}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Messages */}
                    <ScrollView style={tw`flex-1 p-6`}>
                        {ticket.messages.map((message, index) => (
                            <View key={message.id} style={tw`mb-4`}>
                                <View style={tw`flex-row items-center mb-2`}>
                                    <View style={tw`w-8 h-8 rounded-full ${
                                        message.sender === 'admin' ? 'bg-blue-500' : 'bg-gray-400'
                                    } items-center justify-center mr-3`}>
                                        <Feather 
                                            name={message.sender === 'admin' ? 'shield' : 'user'} 
                                            size={16} 
                                            color="white" 
                                        />
                                    </View>
                                    <Text style={tw`font-medium text-gray-800`}>
                                        {message.sender === 'admin' ? 'Suporte' : ticket.userName}
                                    </Text>
                                    <Text style={tw`text-gray-500 text-sm ml-2`}>
                                        {formatSupportDate(message.timestamp)}
                                    </Text>
                                </View>
                                <View style={tw`ml-11 bg-gray-50 p-3 rounded-lg`}>
                                    <Text style={tw`text-gray-700`}>{message.message}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Message Input */}
                    <View style={tw`p-6 border-t border-gray-200`}>
                        <View style={tw`flex-row items-end`}>
                            <View style={tw`flex-1 mr-3`}>
                                <TextInput
                                    placeholder={isAdmin ? "Digite sua resposta..." : "Digite sua mensagem..."}
                                    style={tw`border border-gray-300 rounded-lg px-4 py-3 max-h-24`}
                                    value={newMessage}
                                    onChangeText={setNewMessage}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>
                            <TouchableOpacity
                                onPress={handleSendMessage}
                                style={tw`${newMessage.trim() ? 'bg-blue-500' : 'bg-gray-300'} p-3 rounded-lg`}
                                disabled={!newMessage.trim()}
                            >
                                <Feather name="send" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { ITicketDetails, IUpdateTicketRequest, IUpdateTicketStatusRequest, TicketStatus, TicketPriority } from '@/src/interfaces/support.interface';
import { getStatusColor, getStatusText, getPriorityColor, formatSupportDate } from '@/src/utils/support.utils';
import { useSupport } from '@/src/context/SupportContext';

interface TicketDetailModalProps {
    visible: boolean;
    ticket: ITicketDetails | null;
    onClose: () => void;
    currentUser: any;
    isAdmin?: boolean;
}

export function TicketDetailModal({ 
    visible, 
    ticket, 
    onClose, 
    currentUser,
    isAdmin = false 
}: TicketDetailModalProps) {
    const { tickets } = useSupport();
    const [newMessage, setNewMessage] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<TicketStatus>(TicketStatus.OPEN);
    const [selectedPriority, setSelectedPriority] = useState<TicketPriority>(TicketPriority.MEDIUM);

    useEffect(() => {
        if (ticket) {
            setSelectedStatus(ticket.status);
            setSelectedPriority(ticket.priority);
        }
    }, [ticket]);

    if (!ticket) return null;

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            await tickets.addTicketMessage(ticket.id, {
                message: newMessage
            });
            setNewMessage('');
            Alert.alert('Sucesso', 'Mensagem enviada com sucesso');
        } catch (error) {
            Alert.alert('Erro', 'Falha ao enviar mensagem');
        }
    };

    const handleUpdateStatus = async () => {
        if (!isAdmin) return;
        console.log("Update Ticket Datas ==> ", selectedStatus)
        try {
            const statusData: IUpdateTicketStatusRequest = {
                status: selectedStatus,
                note: `Status alterado para ${selectedStatus}`
            };
            
            await tickets.updateTicketStatus(ticket.id, statusData);
            Alert.alert('Sucesso', 'Status atualizado com sucesso');
        } catch (error) {
            Alert.alert('Erro', 'Falha ao atualizar status');
        }
    };

    const handleUpdatePriority = async () => {
        try {
            const updateData: IUpdateTicketRequest = {
                priority: selectedPriority
            };
            
            await tickets.updateTicket(ticket.id, updateData);
            Alert.alert('Sucesso', 'Prioridade atualizada com sucesso');
        } catch (error) {
            Alert.alert('Erro', 'Falha ao atualizar prioridade');
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={tw`flex-1 bg-white`}>
                {/* Header */}
                <View style={tw`flex-row items-center justify-between p-4 border-b border-gray-200`}>
                    <Text style={tw`text-lg font-semibold flex-1 mr-4`}>{ticket.title}</Text>
                    <TouchableOpacity onPress={onClose} style={tw`p-2`}>
                        <Feather name="x" size={24} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={tw`flex-1 p-4`}>
                    {/* Ticket Info */}
                    <View style={tw`bg-gray-50 p-4 rounded-lg mb-4`}>
                        <Text style={tw`text-sm text-gray-600 mb-2`}>Descrição</Text>
                        <Text style={tw`text-gray-800 mb-4`}>{ticket.description}</Text>
                        
                        <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
                            <View style={tw`px-3 py-1 rounded-full bg-blue-500`}>
                                <Text style={tw`text-xs font-medium text-white`}>
                                    {getStatusText(ticket.status)}
                                </Text>
                            </View>
                            <View style={tw`px-3 py-1 rounded-full bg-orange-500`}>
                                <Text style={tw`text-xs font-medium text-white`}>
                                    {ticket.priority === TicketPriority.LOW ? 'Baixa' : 
                                     ticket.priority === TicketPriority.MEDIUM ? 'Média' : 
                                     ticket.priority === TicketPriority.HIGH ? 'Alta' : 'Urgente'}
                                </Text>
                            </View>
                            <View style={tw`px-3 py-1 rounded-full bg-blue-100`}>
                                <Text style={tw`text-xs font-medium text-blue-800`}>{ticket.category}</Text>
                            </View>
                        </View>
                        
                        <View style={tw`flex-row justify-between text-xs text-gray-500`}>
                            <Text>Criado: {formatSupportDate(ticket.createdAt.toString())}</Text>
                            <Text>Atualizado: {formatSupportDate(ticket.updatedAt.toString())}</Text>
                        </View>
                        
                        <Text style={tw`text-sm text-gray-600 mt-2`}>
                            Usuário: {ticket.user?.fullName || 'Usuário desconhecido'}
                        </Text>
                    </View>

                    {/* Admin Controls */}
                    {isAdmin && (
                        <View style={tw`bg-yellow-50 p-4 rounded-lg mb-4`}>
                            <Text style={tw`text-sm font-medium text-yellow-800 mb-3`}>Controles de Admin</Text>
                            
                            {/* Status Control */}
                            <Text style={tw`text-sm text-gray-600 mb-2`}>Status</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-4`}>
                                {Object.values(TicketStatus).map((status) => (
                                    <TouchableOpacity
                                        key={status}
                                        onPress={() => setSelectedStatus(status)}
                                        style={[
                                            tw`mr-2 px-3 py-2 rounded-lg border`,
                                            selectedStatus === status ? tw`bg-blue-100 border-blue-300` : tw`bg-white border-gray-300`
                                        ]}
                                    >
                                        <Text style={[
                                            tw`text-sm`,
                                            selectedStatus === status ? tw`text-blue-800` : tw`text-gray-600`
                                        ]}>
                                            {getStatusText(status)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            
                            <TouchableOpacity
                                onPress={handleUpdateStatus}
                                style={tw`bg-blue-500 py-2 px-4 rounded-lg mb-4`}
                            >
                                <Text style={tw`text-white text-center font-medium`}>Atualizar Status</Text>
                            </TouchableOpacity>

                            {/* Priority Control */}
                            <Text style={tw`text-sm font-medium text-gray-800 mb-3`}>Prioridade</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-4`}>
                                {Object.values(TicketPriority).map((priority) => (
                                    <TouchableOpacity
                                        key={priority}
                                        onPress={() => setSelectedPriority(priority)}
                                        style={[
                                            tw`mr-2 px-3 py-2 rounded-lg border`,
                                            selectedPriority === priority ? tw`bg-purple-100 border-purple-300` : tw`bg-white border-gray-300`
                                        ]}
                                    >
                                        <Text style={[
                                            tw`text-sm`,
                                            selectedPriority === priority ? tw`text-purple-800` : tw`text-gray-600`
                                        ]}>
                                            {priority === 'low' ? 'Baixa' : 
                                             priority === 'medium' ? 'Média' : 
                                             priority === 'high' ? 'Alta' : 'Urgente'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            
                            <TouchableOpacity
                                onPress={handleUpdatePriority}
                                style={tw`bg-purple-500 py-2 px-4 rounded-lg`}
                            >
                                <Text style={tw`text-white text-center font-medium`}>Atualizar Prioridade</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Messages */}
                    <View style={tw`mb-4`}>
                        <Text style={tw`text-lg font-semibold mb-3`}>Mensagens</Text>
                        {ticket.messages && ticket.messages.length > 0 ? (
                            ticket.messages.map((message, index) => (
                                <View key={message.id || index} style={tw`mb-3 p-3 bg-gray-50 rounded-lg`}>
                                    <View style={tw`flex-row justify-between items-start mb-2`}>
                                        <Text style={tw`font-medium text-gray-800`}>
                                            {message.senderName || 'Usuário'}
                                        </Text>
                                        <Text style={tw`text-xs text-gray-500`}>
                                            {formatSupportDate(message.timestamp.toString())}
                                        </Text>
                                    </View>
                                    <Text style={tw`text-gray-700`}>{message.message}</Text>
                                    {message.senderType && (
                                        <View style={tw`mt-2`}>
                                            <Text style={[
                                                tw`text-xs px-2 py-1 rounded`,
                                                message.senderType === 'admin' ? tw`bg-red-100 text-red-800` : tw`bg-blue-100 text-blue-800`
                                            ]}>
                                                {message.senderType === 'admin' ? 'Admin' : 'Usuário'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ))
                        ) : (
                            <Text style={tw`text-gray-500 text-center py-4`}>Nenhuma mensagem ainda</Text>
                        )}
                    </View>

                    {/* New Message */}
                    <View style={tw`bg-gray-50 p-4 rounded-lg mb-4`}>
                        <Text style={tw`text-sm font-medium text-gray-800 mb-2`}>Nova Mensagem</Text>
                        <TextInput
                            style={tw`border border-gray-300 rounded-lg p-3 mb-3 min-h-20`}
                            value={newMessage}
                            onChangeText={setNewMessage}
                            placeholder="Digite sua mensagem..."
                            multiline
                            textAlignVertical="top"
                        />
                        <TouchableOpacity
                            onPress={handleSendMessage}
                            style={tw`bg-green-500 py-3 px-4 rounded-lg`}
                            disabled={!newMessage.trim()}
                        >
                            <Text style={tw`text-white text-center font-medium`}>Enviar Mensagem</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

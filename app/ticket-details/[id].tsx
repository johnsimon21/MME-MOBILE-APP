import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import tw from 'twrnc';
import { useSupport } from '../../src/context/SupportContext';
import { ITicketDetails, ITicketMessage, TicketPriority, TicketStatus } from '../../src/interfaces/support.interface';
import { formatSupportDate, getPriorityColor, getStatusColor } from '../../src/utils/support.utils';

export default function TicketDetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { tickets: ticketService } = useSupport();
    
    const [ticket, setTicket] = useState<ITicketDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);

    const loadTicketDetails = async () => {
        try {
            setLoading(true);
            const response = await ticketService.getTicketById(id as string);
            setTicket(response);
        } catch (error) {
            console.error('Error loading ticket details:', error);
            Alert.alert('Erro', 'Não foi possível carregar os detalhes do ticket.');
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !ticket) return;

        try {
            setSendingMessage(true);
            await ticketService.addMessage(ticket.id, {
                message: newMessage.trim()
            });
            setNewMessage('');
            await loadTicketDetails(); // Refresh to show new message
        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Erro', 'Não foi possível enviar a mensagem. Tente novamente.');
        } finally {
            setSendingMessage(false);
        }
    };

    useEffect(() => {
        if (id) {
            loadTicketDetails();
        }
    }, [id]);

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

    const MessageItem = ({ message }: { message: ITicketMessage }) => {
        const isUser = message.senderType === 'user';
        
        return (
            <View style={tw`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
                <View style={tw`max-w-[80%] ${isUser ? 'bg-indigo-500' : 'bg-white border border-gray-200'} rounded-2xl p-4`}>
                    {/* Message Header */}
                    <View style={tw`flex-row items-center justify-between mb-2`}>
                        <Text style={tw`${isUser ? 'text-indigo-100' : 'text-gray-600'} text-xs font-medium`}>
                            {message.senderName}
                        </Text>
                        <Text style={tw`${isUser ? 'text-indigo-200' : 'text-gray-500'} text-xs`}>
                            {formatSupportDate(message.timestamp.toString())}
                        </Text>
                    </View>
                    
                    {/* Message Content */}
                    <Text style={tw`${isUser ? 'text-white' : 'text-gray-800'} text-base leading-5`}>
                        {message.message}
                    </Text>

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                        <View style={tw`mt-3 pt-3 border-t ${isUser ? 'border-indigo-400' : 'border-gray-200'}`}>
                            {message.attachments.map((attachment) => (
                                <TouchableOpacity
                                    key={attachment.id}
                                    style={tw`flex-row items-center mb-2`}
                                >
                                    <Feather 
                                        name="paperclip" 
                                        size={16} 
                                        color={isUser ? '#C7D2FE' : '#6B7280'} 
                                    />
                                    <Text style={tw`${isUser ? 'text-indigo-200' : 'text-gray-600'} text-sm ml-2 flex-1`} numberOfLines={1}>
                                        {attachment.fileName}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Internal Message Indicator */}
                    {message.isInternal && (
                        <View style={tw`mt-2 flex-row items-center`}>
                            <Feather 
                                name="eye-off" 
                                size={12} 
                                color={isUser ? '#C7D2FE' : '#6B7280'} 
                            />
                            <Text style={tw`${isUser ? 'text-indigo-200' : 'text-gray-500'} text-xs ml-1`}>
                                Mensagem interna
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

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
                        <Text style={tw`text-white text-xl font-bold`}>Detalhes do Ticket</Text>
                        <View style={tw`w-10 h-10`} />
                    </View>
                </LinearGradient>
                
                <View style={tw`flex-1 items-center justify-center`}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={tw`text-gray-600 mt-4`}>Carregando detalhes...</Text>
                </View>
            </View>
        );
    }

    if (!ticket) {
        return (
            <View style={tw`flex-1 bg-gray-50 items-center justify-center`}>
                <Text style={tw`text-gray-600 text-lg`}>Ticket não encontrado</Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={tw`bg-indigo-500 px-6 py-3 rounded-xl mt-4`}
                >
                    <Text style={tw`text-white font-medium`}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statusColor = getStatusColor(ticket.status);
    const priorityColor = getPriorityColor(ticket.priority);

    return (
        <KeyboardAvoidingView 
            style={tw`flex-1 bg-gray-50`} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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

                    <Text style={tw`text-white text-lg font-bold flex-1 text-center mx-4`} numberOfLines={1}>
                        Ticket #{ticket.id.slice(-6).toUpperCase()}
                    </Text>

                    <View style={tw`w-10 h-10`} />
                </View>

                {/* Status and Priority */}
                <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`bg-blue-500 px-3 py-1 rounded-full flex-row items-center`}>
                        <Feather 
                            name={getStatusIcon(ticket.status)} 
                            size={14} 
                            color="white"
                            style={tw`mr-2`}
                        />
                        <Text style={tw`text-white text-sm font-medium`}>
                            {ticket.status === TicketStatus.OPEN ? 'Aberto' :
                             ticket.status === TicketStatus.IN_PROGRESS ? 'Em Andamento' :
                             ticket.status === TicketStatus.WAITING_USER ? 'Aguardando Resposta' :
                             ticket.status === TicketStatus.RESOLVED ? 'Resolvido' : 'Fechado'}
                        </Text>
                    </View>

                    <View style={tw`bg-orange-100 px-3 py-1 rounded-full flex-row items-center`}>
                        <MaterialIcons 
                            name={getPriorityIcon(ticket.priority) as any} 
                            size={14} 
                            color="#F59E0B"
                            style={tw`mr-1`}
                        />
                        <Text style={tw`text-orange-800 text-sm font-medium`}>
                            {ticket.priority === TicketPriority.URGENT ? 'Urgente' :
                             ticket.priority === TicketPriority.HIGH ? 'Alta' :
                             ticket.priority === TicketPriority.MEDIUM ? 'Média' : 'Baixa'}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                {/* Ticket Details */}
                <View style={tw`bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-4`}>
                    <Text style={tw`font-bold text-gray-800 text-lg mb-2`}>
                        {ticket.title}
                    </Text>
                    <Text style={tw`text-gray-600 leading-5 mb-4`}>
                        {ticket.description}
                    </Text>

                    {/* Meta Information */}
                    <View style={tw`flex-row flex-wrap`}>
                        <View style={tw`flex-row items-center mr-6 mb-2`}>
                            <Feather name="calendar" size={16} color="#6B7280" />
                            <Text style={tw`text-gray-600 text-sm ml-2`}>
                                Criado em {formatSupportDate(ticket.createdAt.toString())}
                            </Text>
                        </View>
                        
                        <View style={tw`flex-row items-center mr-6 mb-2`}>
                            <Feather name="tag" size={16} color="#6B7280" />
                            <Text style={tw`text-gray-600 text-sm ml-2 capitalize`}>
                                {ticket.category}
                            </Text>
                        </View>

                        {ticket.assignedAdmin && (
                            <View style={tw`flex-row items-center mb-2`}>
                                <Feather name="user" size={16} color="#6B7280" />
                                <Text style={tw`text-gray-600 text-sm ml-2`}>
                                    Atribuído a {ticket.assignedAdmin.fullName}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Initial Attachments */}
                    {ticket.attachments && ticket.attachments.length > 0 && (
                        <View style={tw`mt-4 pt-4 border-t border-gray-200`}>
                            <Text style={tw`font-semibold text-gray-800 mb-2`}>Anexos:</Text>
                            {ticket.attachments.map((attachment) => (
                                <TouchableOpacity
                                    key={attachment.id}
                                    style={tw`flex-row items-center justify-between py-2 px-3 bg-gray-50 rounded-lg mb-2`}
                                >
                                    <View style={tw`flex-row items-center flex-1`}>
                                        <Feather name="paperclip" size={16} color="#6B7280" />
                                        <Text style={tw`text-gray-700 text-sm ml-2 flex-1`} numberOfLines={1}>
                                            {attachment.fileName}
                                        </Text>
                                    </View>
                                    <Feather name="download" size={16} color="#6366F1" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Messages */}
                <View style={tw`mx-4 mt-4 mb-4`}>
                    <Text style={tw`font-bold text-gray-800 text-lg mb-4`}>
                        Conversação ({ticket.messagesCount} mensagem{ticket.messagesCount !== 1 ? 's' : ''})
                    </Text>

                    {ticket.messages && ticket.messages.length > 0 ? (
                        ticket.messages.map((message) => (
                            <MessageItem key={message.id} message={message} />
                        ))
                    ) : (
                        <View style={tw`bg-white rounded-xl p-8 items-center border border-gray-100`}>
                            <Feather name="message-circle" size={48} color="#D1D5DB" />
                            <Text style={tw`text-gray-500 mt-4 text-center`}>
                                Nenhuma mensagem ainda.{'\n'}Envie uma mensagem para começar a conversa.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Message Input */}
            {(ticket.status === TicketStatus.OPEN || ticket.status === TicketStatus.IN_PROGRESS || ticket.status === TicketStatus.WAITING_USER) && (
                <View style={tw`bg-white border-t border-gray-200 px-4 py-3`}>
                    <View style={tw`flex-row items-end`}>
                        <TextInput
                            style={tw`flex-1 border border-gray-300 rounded-2xl px-4 py-3 mr-3 max-h-24`}
                            placeholder="Digite sua mensagem..."
                            value={newMessage}
                            onChangeText={setNewMessage}
                            multiline
                            textAlignVertical="top"
                            editable={!sendingMessage}
                        />
                        
                        <TouchableOpacity
                            onPress={sendMessage}
                            disabled={!newMessage.trim() || sendingMessage}
                            style={tw`${!newMessage.trim() || sendingMessage 
                                ? 'bg-gray-300' 
                                : 'bg-indigo-500'
                            } w-12 h-12 rounded-full items-center justify-center`}
                        >
                            {sendingMessage ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Feather 
                                    name="send" 
                                    size={20} 
                                    color="white" 
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Closed ticket message */}
            {(ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED) && (
                <View style={tw`bg-gray-100 border-t border-gray-200 px-4 py-3`}>
                    <View style={tw`flex-row items-center justify-center`}>
                        <Feather name="lock" size={16} color="#6B7280" />
                        <Text style={tw`text-gray-600 ml-2 text-center`}>
                            Este ticket foi {ticket.status === TicketStatus.RESOLVED ? 'resolvido' : 'fechado'} e não aceita mais mensagens.
                        </Text>
                    </View>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

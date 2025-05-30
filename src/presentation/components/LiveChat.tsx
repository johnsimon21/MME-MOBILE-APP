import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { ChatMessage } from '@/src/types/support.types';
import { useSupportContext } from '@/src/context/SupportContext';
import { useAuth } from '@/src/context/AuthContext';
import { formatSupportDate } from '@/src/utils/support.utils';

interface LiveChatProps {
    isAdmin?: boolean;
}

export function LiveChat({ isAdmin = false }: LiveChatProps) {
    const { user } = useAuth();
    const { chatMessages, sendChatMessage } = useSupportContext();
    const [newMessage, setNewMessage] = useState('');
    const [isOnline, setIsOnline] = useState(isAdmin); // Admin is always online
    const [activeUsers, setActiveUsers] = useState(isAdmin ? 3 : 0); // Mock active users
    const flatListRef = useRef<FlatList>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatMessages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [chatMessages]);

    // Simulate admin availability
    useEffect(() => {
        if (!isAdmin) {
            // Check if admin is available (mock)
            const checkAdminAvailability = () => {
                const isAvailable = Math.random() > 0.3; // 70% chance admin is available
                setIsOnline(isAvailable);
            };
            
            checkAdminAvailability();
            const interval = setInterval(checkAdminAvailability, 30000); // Check every 30s
            
            return () => clearInterval(interval);
        }
    }, [isAdmin]);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        if (!isAdmin && !isOnline) {
            Alert.alert(
                'Suporte Offline', 
                'O suporte não está disponível no momento. Tente novamente mais tarde ou crie um ticket.'
            );
            return;
        }

        sendChatMessage(newMessage);
        setNewMessage('');
    };

    const MessageItem = ({ message }: { message: ChatMessage }) => {
        const isCurrentUser = isAdmin ? message.sender === 'admin' : message.sender === 'user';
        
        return (
            <View style={tw`mb-4 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                <View style={tw`max-w-[85%] ${
                    isCurrentUser 
                        ? 'bg-blue-500 rounded-tl-xl rounded-tr-xl rounded-bl-xl' 
                        : 'bg-gray-100 rounded-tl-xl rounded-tr-xl rounded-br-xl'
                } p-4 shadow-sm`}>
                    <Text style={tw`${isCurrentUser ? 'text-white' : 'text-gray-800'} leading-6`}>
                        {message.message}
                    </Text>
                </View>
                <Text style={tw`text-xs text-gray-500 mt-1`}>
                    {message.senderName} • {formatSupportDate(message.timestamp)}
                </Text>
            </View>
        );
    };

    const AdminHeader = () => (
        <View style={tw`bg-blue-50 p-4 border-b border-blue-200`}>
            <View style={tw`flex-row items-center justify-between mb-2`}>
                <Text style={tw`font-bold text-blue-800`}>Chat ao Vivo - Admin</Text>
                <View style={tw`flex-row items-center`}>
                    <View style={tw`w-2 h-2 bg-green-500 rounded-full mr-2`} />
                    <Text style={tw`text-green-700 text-sm font-medium`}>Online</Text>
                </View>
            </View>
            <Text style={tw`text-blue-600 text-sm`}>
                {activeUsers} usuários ativos aguardando suporte
            </Text>
        </View>
    );

    const UserHeader = () => (
        <View style={tw`bg-white p-4 border-b border-gray-200`}>
            <View style={tw`flex-row items-center justify-between`}>
                <Text style={tw`font-bold text-gray-800`}>Chat ao Vivo</Text>
                <View style={tw`flex-row items-center`}>
                    <View style={tw`w-2 h-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-2`} />
                    <Text style={tw`${isOnline ? 'text-green-700' : 'text-red-700'} text-sm font-medium`}>
                        {isOnline ? 'Suporte Online' : 'Suporte Offline'}
                    </Text>
                </View>
            </View>
            {!isOnline && (
                <Text style={tw`text-red-600 text-sm mt-1`}>
                    Suporte indisponível. Considere criar um ticket.
                </Text>
            )}
        </View>
    );

      const EmptyState = () => (
        <View style={tw`flex-1 items-center justify-center p-8`}>
            <Feather name="message-circle" size={48} color="#9CA3AF" />
            <Text style={tw`text-gray-500 text-lg mt-4 text-center`}>
                {isAdmin ? 'Aguardando mensagens dos usuários' : 'Inicie uma conversa'}
            </Text>
            <Text style={tw`text-gray-400 text-sm mt-1 text-center`}>
                {isAdmin 
                    ? 'As mensagens dos usuários aparecerão aqui' 
                    : 'Digite uma mensagem para começar o chat'
                }
            </Text>
        </View>
    );

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Header */}
            {isAdmin ? <AdminHeader /> : <UserHeader />}

            {/* Messages */}
            <View style={tw`flex-1`}>
                {chatMessages.length === 0 ? (
                    <EmptyState />
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={chatMessages}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={tw`p-4`}
                        renderItem={({ item }) => <MessageItem message={item} />}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            {/* Quick Responses for Admin */}
            {isAdmin && (
                <View style={tw`bg-white p-4 border-t border-gray-200`}>
                    <Text style={tw`font-medium text-gray-700 mb-2`}>Respostas Rápidas:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={tw`flex-row`}>
                            {[
                                'Olá! Como posso ajudá-lo?',
                                'Vou verificar isso para você.',
                                'Obrigado por aguardar.',
                                'Problema resolvido?',
                                'Precisa de mais alguma coisa?'
                            ].map((quickResponse, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => setNewMessage(quickResponse)}
                                    style={tw`bg-blue-100 px-3 py-2 rounded-full mr-2`}
                                >
                                    <Text style={tw`text-blue-700 text-sm`}>{quickResponse}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            )}

            {/* Message Input */}
            <View style={tw`bg-white p-4 border-t border-gray-200 flex-row items-center`}>
                <View style={tw`flex-1 bg-gray-100 rounded-full px-4 py-2 flex-row items-center mr-3`}>
                    <TextInput
                        placeholder={
                            isAdmin 
                                ? "Digite sua resposta..." 
                                : isOnline 
                                    ? "Digite sua mensagem..." 
                                    : "Suporte offline..."
                        }
                        style={tw`flex-1 text-gray-700`}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        editable={isAdmin || isOnline}
                    />
                </View>
                <TouchableOpacity
                    onPress={handleSendMessage}
                    style={tw`${
                        newMessage.trim() && (isAdmin || isOnline) ? 'bg-blue-500' : 'bg-gray-300'
                    } p-3 rounded-full`}
                    disabled={!newMessage.trim() || (!isAdmin && !isOnline)}
                >
                    <Feather name="send" size={20} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}


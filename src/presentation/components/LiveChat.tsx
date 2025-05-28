import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { ChatMessage as ChatMessageType } from '@/src/types/support.types';
import { ChatMessage } from './ChatMessage';
import { useAuth } from '@/src/context/AuthContext';

interface LiveChatProps {
    initialMessages?: ChatMessageType[];
}

export function LiveChat({ initialMessages = [] }: LiveChatProps) {
    const { user, isAdmin } = useAuth();
    
    const [chatMessages, setChatMessages] = useState<ChatMessageType[]>([
        {
            id: '1',
            message: 'Olá! Como posso ajudá-lo hoje?',
            sender: 'admin',
            timestamp: new Date().toISOString(),
            senderName: 'Suporte MME'
        },
        ...initialMessages
    ]);
    const [newMessage, setNewMessage] = useState('');

    const sendMessage = () => {
        if (!newMessage.trim()) return;

              const message: ChatMessageType = {
            id: Date.now().toString(),
            message: newMessage,
            sender: isAdmin() ? 'admin' : 'user',
            timestamp: new Date().toISOString(),
            senderName: isAdmin() ? 'Admin' : user?.fullName || 'Usuário'
        };

        setChatMessages(prev => [...prev, message]);
        setNewMessage('');

        // Simulate admin response (only if user sent message)
        if (!isAdmin()) {
            setTimeout(() => {
                const adminResponse: ChatMessageType = {
                    id: (Date.now() + 1).toString(),
                    message: 'Obrigado pela sua mensagem. Um de nossos especialistas irá responder em breve.',
                    sender: 'admin',
                    timestamp: new Date().toISOString(),
                    senderName: 'Suporte MME'
                };
                setChatMessages(prev => [...prev, adminResponse]);
            }, 2000);
        }
    };

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Chat Header */}
            <View style={tw`bg-white p-4 border-b border-gray-200`}>
                <View style={tw`flex-row items-center`}>
                    <View style={tw`w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3`}>
                        <Feather name="message-circle" size={20} color="#10B981" />
                    </View>
                    <View>
                        <Text style={tw`font-semibold text-gray-800`}>Chat ao Vivo</Text>
                        <View style={tw`flex-row items-center`}>
                            <View style={tw`w-2 h-2 bg-green-500 rounded-full mr-2`} />
                            <Text style={tw`text-green-600 text-sm`}>Online</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Messages */}
            <FlatList
                data={chatMessages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={tw`p-4`}
                renderItem={({ item }) => <ChatMessage message={item} />}
                showsVerticalScrollIndicator={false}
            />

            {/* Message Input */}
            <View style={tw`bg-white p-4 border-t border-gray-200 flex-row items-center`}>
                <View style={tw`flex-1 bg-gray-100 rounded-full px-4 py-2 flex-row items-center mr-3`}>
                    <TextInput
                        placeholder="Digite sua mensagem..."
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
        </View>
    );
}

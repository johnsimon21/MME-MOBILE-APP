import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSupport } from '../src/context/SupportContext';
import { ISupportChatMessage } from '../src/interfaces/support.interface';

export default function ChatSupportScreen() {
    const router = useRouter();
    const [newMessage, setNewMessage] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const { chat } = useSupport();
    
    // Header animation
    const headerHeight = useRef(new Animated.Value(1)).current;
    const lastScrollY = useRef(0);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chat.messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [chat.messages]);

    // Initialize chat session if needed
    useEffect(() => {
        if (!chat.currentSession) {
            // Start a chat session for the user
            chat.startChatSession({
                subject: 'Suporte ao usuário',
                priority: 'normal' as any
            }).catch(console.error);
        }
    }, []);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !chat.currentSession) return;

        try {
            await chat.sendMessage(chat.currentSession.id, newMessage);
            setNewMessage('');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível enviar a mensagem. Tente novamente.');
        }
    };

    // Handle scroll for header animation
    const handleScroll = (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const scrollDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';
        
        if (Math.abs(currentScrollY - lastScrollY.current) > 5) {
            if (scrollDirection === 'up' && !isHeaderVisible) {
                setIsHeaderVisible(true);
                Animated.timing(headerHeight, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: false,
                }).start();
            } else if (scrollDirection === 'down' && isHeaderVisible && currentScrollY > 50) {
                setIsHeaderVisible(false);
                Animated.timing(headerHeight, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                }).start();
            }
        }
        
        lastScrollY.current = currentScrollY;
    };

    const formatTime = (timestamp: Date) => {
        return new Date(timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const MessageItem = ({ message }: { message: ISupportChatMessage }) => {
        const isUser = message.sender.senderType === 'user';
        
        return (
            <View style={tw`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
                <View style={tw`max-w-[85%] ${
                    isUser 
                        ? 'bg-blue-500 rounded-tl-xl rounded-tr-xl rounded-bl-xl' 
                        : 'bg-white rounded-tl-xl rounded-tr-xl rounded-br-xl border border-gray-200'
                } p-4 shadow-sm`}>
                    <Text style={tw`${isUser ? 'text-white' : 'text-gray-800'} leading-6`}>
                        {message.message}
                    </Text>
                </View>
                <View style={tw`flex-row items-center mt-1 ${isUser ? 'flex-row-reverse' : ''}`}>
                    <Text style={tw`text-xs text-gray-500`}>
                        {message.sender.fullName} • {formatTime(new Date(message.timestamp))}
                    </Text>
                </View>
            </View>
        );
    };

    const TypingIndicator = () => {
        const typingUsers = chat.getTypingUsers();
        const isTyping = typingUsers.length > 0;
        
        return isTyping ? (
            <View style={tw`items-start mb-4`}>
                <View style={tw`bg-white rounded-tl-xl rounded-tr-xl rounded-br-xl border border-gray-200 p-4 shadow-sm`}>
                    <View style={tw`flex-row items-center`}>
                        <View style={tw`flex-row`}>
                            {[1, 2, 3].map((dot) => (
                                <Animated.View
                                    key={dot}
                                    style={[
                                        tw`w-2 h-2 bg-gray-400 rounded-full mx-0.5`,
                                        {
                                            opacity: new Animated.Value(0.3)
                                        }
                                    ]}
                                />
                            ))}
                        </View>
                        <Text style={tw`text-gray-500 text-sm ml-2`}>Suporte está digitando...</Text>
                    </View>
                </View>
            </View>
        ) : null;
    };

    const CollapsibleHeader = () => (
        <Animated.View 
            style={[
                tw`bg-white border-b border-gray-200`,
                {
                    height: headerHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 80],
                    }),
                    opacity: headerHeight,
                    overflow: 'hidden',
                }
            ]}
        >
            <View style={tw`p-4`}>
                <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center`}>
                        <View style={tw`w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3`}>
                            <Text style={tw`text-blue-600 font-bold`}>S</Text>
                        </View>
                        <View>
                            <Text style={tw`font-bold text-gray-800`}>Suporte MME</Text>
                            <View style={tw`flex-row items-center`}>
                                <View style={tw`w-2 h-2 ${chat.isSocketConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-2`} />
                                <Text style={tw`text-sm ${chat.isSocketConnected ? 'text-green-600' : 'text-red-600'}`}>
                                    {chat.isSocketConnected ? 'Online' : 'Offline'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity style={tw`p-2`}>
                        <Feather name="more-vertical" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );

    const ShowHeaderButton = () => (
        !isHeaderVisible && (
            <TouchableOpacity
                style={tw`absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-3 py-1 rounded-full z-10`}
                onPress={() => {
                    setIsHeaderVisible(true);
                    Animated.timing(headerHeight, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: false,
                    }).start();
                }}
            >
                <Feather name="chevron-down" size={16} color="white" />
            </TouchableOpacity>
        )
    );

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Fixed Header */}
            <LinearGradient
                colors={['#10B981', '#059669']}
                style={tw`pt-12 pb-4 px-6`}
            >
                <View style={tw`flex-row items-center justify-between`}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={tw`w-10 h-10 bg-white bg-opacity-20 rounded-full items-center justify-center`}
                    >
                        <Feather name="arrow-left" size={20} color="white" />
                    </TouchableOpacity>
                    
                    <Text style={tw`text-white text-xl font-bold`}>Chat ao Vivo</Text>
                    
                    <TouchableOpacity style={tw`w-10 h-10 bg-white bg-opacity-20 rounded-full items-center justify-center`}>
                        <Feather name="phone" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Collapsible Agent Info */}
            <CollapsibleHeader />
            
            {/* Show Header Button */}
            <ShowHeaderButton />

            {/* Messages */}
            <View style={tw`flex-1`}>
                <FlatList
                    ref={flatListRef}
                    data={chat.messages}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={tw`p-4`}
                    renderItem={({ item }) => <MessageItem message={item} />}
                    showsVerticalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    ListFooterComponent={<TypingIndicator />}
                />
            </View>

            {/* Quick Responses */}
            <View style={tw`bg-white border-t border-gray-200 px-4 py-3`}>
                <Text style={tw`text-gray-600 text-sm mb-2`}>Respostas rápidas:</Text>
                <View style={tw`flex-row flex-wrap`}>
                    {[
                        'Olá!',
                        'Preciso de ajuda',
                        'Tenho um problema',
                        'Como faço para...'
                    ].map((quickResponse, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => setNewMessage(quickResponse)}
                            style={tw`bg-gray-100 px-3 py-2 rounded-full mr-2 mb-2`}
                        >
                            <Text style={tw`text-gray-700 text-sm`}>{quickResponse}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Message Input */}
            <View style={tw`bg-white p-4 border-t border-gray-200 flex-row items-center`}>
                <TouchableOpacity style={tw`p-2 mr-2`}>
                    <Feather name="paperclip" size={20} color="#6B7280" />
                </TouchableOpacity>
                
                <View style={tw`flex-1 bg-gray-100 rounded-full px-4 py-2 flex-row items-center mr-3`}>
                    <TextInput
                        placeholder={chat.isSocketConnected ? "Digite sua mensagem..." : "Suporte offline..."}
                        style={tw`flex-1 text-gray-700`}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        editable={chat.isSocketConnected}
                    />
                    <TouchableOpacity style={tw`ml-2`}>
                        <Feather name="smile" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                    onPress={handleSendMessage}
                    style={tw`${
                        newMessage.trim() && chat.isSocketConnected ? 'bg-green-500' : 'bg-gray-300'
                    } p-3 rounded-full`}
                    disabled={!newMessage.trim() || !chat.isSocketConnected || chat.isSendingMessage}
                >
                    <Feather name="send" size={20} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

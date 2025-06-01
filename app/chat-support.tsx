import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

interface ChatMessage {
    id: string;
    message: string;
    sender: 'user' | 'support';
    senderName: string;
    timestamp: string;
    type?: 'text' | 'system';
}

export default function ChatSupportScreen() {
    const router = useRouter();
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            message: 'Olá! Bem-vindo ao suporte da MME. Como posso ajudá-lo hoje?',
            sender: 'support',
            senderName: 'Ana - Suporte',
            timestamp: new Date().toISOString(),
            type: 'text'
        }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [isOnline, setIsOnline] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [supportAgent] = useState('Ana - Suporte');
    const flatListRef = useRef<FlatList>(null);
    
    // Header animation
    const headerHeight = useRef(new Animated.Value(1)).current;
    const lastScrollY = useRef(0);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

        // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [messages]);

    // Simulate support agent typing
    useEffect(() => {
        if (messages.length > 1) {
            const timer = setTimeout(() => {
                setIsTyping(true);
                setTimeout(() => {
                    setIsTyping(false);
                    // Add automated response
                    const responses = [
                        'Entendi sua questão. Deixe-me verificar isso para você.',
                        'Posso ajudá-lo com mais detalhes sobre isso.',
                        'Essa é uma ótima pergunta! Vou explicar passo a passo.',
                        'Obrigada por aguardar. Aqui está a informação que você precisa.'
                    ];
                    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                    
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        message: randomResponse,
                        sender: 'support',
                        senderName: supportAgent,
                        timestamp: new Date().toISOString(),
                        type: 'text'
                    }]);
                }, 2000);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [messages.length]);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        if (!isOnline) {
            Alert.alert(
                'Suporte Offline', 
                'O suporte não está disponível no momento. Tente novamente mais tarde.'
            );
            return;
        }

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            message: newMessage,
            sender: 'user',
            senderName: 'Você',
            timestamp: new Date().toISOString(),
            type: 'text'
        };

        setMessages(prev => [...prev, userMessage]);
        setNewMessage('');
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

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const MessageItem = ({ message }: { message: ChatMessage }) => {
        const isUser = message.sender === 'user';
        
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
                        {message.senderName} • {formatTime(message.timestamp)}
                    </Text>
                </View>
            </View>
        );
    };

    const TypingIndicator = () => (
        isTyping && (
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
                        <Text style={tw`text-gray-500 text-sm ml-2`}>{supportAgent} está digitando...</Text>
                    </View>
                </View>
            </View>
        )
    );

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
                            <Text style={tw`text-blue-600 font-bold`}>A</Text>
                        </View>
                        <View>
                            <Text style={tw`font-bold text-gray-800`}>{supportAgent}</Text>
                            <View style={tw`flex-row items-center`}>
                                <View style={tw`w-2 h-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-2`} />
                                <Text style={tw`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                                    {isOnline ? 'Online' : 'Offline'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => setIsOnline(!isOnline)}
                        style={tw`p-2`}
                    >
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
                    data={messages}
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
                        placeholder={isOnline ? "Digite sua mensagem..." : "Suporte offline..."}
                        style={tw`flex-1 text-gray-700`}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        editable={isOnline}
                    />
                    <TouchableOpacity style={tw`ml-2`}>
                        <Feather name="smile" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                    onPress={handleSendMessage}
                    style={tw`${
                        newMessage.trim() && isOnline ? 'bg-green-500' : 'bg-gray-300'
                    } p-3 rounded-full`}
                    disabled={!newMessage.trim() || !isOnline}
                >
                    <Feather name="send" size={20} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

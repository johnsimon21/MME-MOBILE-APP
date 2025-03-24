import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { User } from "./MessagesScreen";
import { formatMessageTime } from "../../utils/dateFormatter";

type RootStackParamList = {
    ChatScreen: { user: User };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>;

interface Message {
    id: string;
    text: string;
    timestamp: string;
    isSent: boolean;
    isRead: boolean;  // New property
}

export function ChatScreen({ route, navigation }: Props) {
    const { user } = route.params;
    const [messages, setMessages] = useState<Message[]>(user.messages || []);
    const [newMessage, setNewMessage] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
    const scrollViewRef = useRef<ScrollView>(null);

    // Monitor new messages and update unread count
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && !lastMessage.isSent && !isScrolledToBottom) {
            setUnreadCount(prev => prev + 1);
        }
    }, [messages]);

    const handleScroll = (event: any) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 20;
        const currentlyAtBottom = layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom;

        setIsScrolledToBottom(currentlyAtBottom);

        if (currentlyAtBottom) {
            setUnreadCount(0);
            markMessagesAsRead();
        }
    };

    const markMessagesAsRead = () => {
        setMessages(prevMessages =>
            prevMessages.map(msg => (!msg.isSent && !msg.isRead) ? { ...msg, isRead: true } : msg)
        );
    };

    const scrollToBottom = () => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
        setUnreadCount(0);
        markMessagesAsRead();
    };

    const handleNewMessageIndicatorPress = () => {
        scrollToBottom();
    };


    const handleSendMessage = () => {
        if (newMessage.trim()) {
            const message: Message = {
                id: Date.now().toString(),
                text: newMessage,
                timestamp: new Date().toISOString(),
                isSent: true,
                isRead: false
            };

            scrollToBottom();
            setMessages([...messages, message]);
            setNewMessage("");
        }
    };

    useEffect(() => {
        scrollToBottom();
      }, []);

    return (
        <View style={tw`flex-1 bg-white`}>
            {/* Header */}
            <View style={tw`px-4 py-3 flex-row items-center border-b border-gray-200`}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </Pressable>
                <View style={tw`ml-3 flex-row items-center`}>
                    {user.image ? (
                        <Image source={{ uri: user.image }} style={tw`w-10 h-10 rounded-full`} />
                    ) : (
                        <View style={tw`w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center`}>
                            <Text style={tw`text-lg font-bold text-gray-700`}>{user.name[0]}</Text>
                        </View>
                    )}
                    <View style={tw`ml-3`}>
                        <Text style={tw`text-lg font-semibold`}>{user.name}</Text>
                        <Text style={tw`text-sm text-green-500`}>Online agora</Text>
                    </View>
                </View>
                <View style={tw`flex-1 flex-row justify-end`}>
                    <Ionicons name="call" size={24} color="black" style={tw`ml-4`} />
                    <Ionicons name="ellipsis-vertical" size={24} color="black" style={tw`ml-4`} />
                </View>
            </View>

            {/* Chat Messages */}
            <ScrollView
                ref={scrollViewRef}
                style={tw`flex-1 px-4 py-2`}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                
            >
                {messages.map((message) => (
                    <View
                        key={message.id}
                        style={tw`${message.isSent ? 'self-end bg-blue-500' : 'self-start bg-gray-100'} p-3 rounded-lg max-w-3/4 mb-2`}
                    >
                        <Text style={tw`${message.isSent ? 'text-white' : 'text-gray-700'}`}>
                            {message.text}
                        </Text>
                        <View style={tw`flex-row items-center justify-end mt-1`}>
                            <Text style={tw`text-xs ${message.isSent ? 'text-white' : 'text-gray-500'} mr-1`}>
                                {formatMessageTime(message.timestamp)}
                            </Text>
                            {message.isSent && (
                                <Ionicons
                                    name={message.isRead ? "checkmark-done" : "checkmark"}
                                    size={16}
                                    color={message.isRead ? "#4CAF50" : "#fff"}
                                />
                            )}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {!isScrolledToBottom && unreadCount > 0 && (
                <Pressable
                    onPress={handleNewMessageIndicatorPress}
                    style={tw`absolute bottom-20 self-center bg-blue-500 px-3 py-1 rounded-full`}
                >
                    <Text style={tw`text-white`}>{unreadCount} novas mensagens</Text>
                </Pressable>
            )}

            {/* Input */}
            <View style={tw`flex-row items-center border-t border-gray-200 px-4 py-3`}>
                <TextInput
                    placeholder="Mensagem"
                    style={tw`flex-1 text-gray-700 bg-gray-100 px-4 py-2 rounded-full`}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    onSubmitEditing={handleSendMessage}
                />
                <Pressable style={tw`ml-3`} onPress={handleSendMessage}>
                    <Ionicons name="send" size={24} color={newMessage.trim() ? "blue" : "gray"} />
                </Pressable>
            </View>
        </View>
    );
}
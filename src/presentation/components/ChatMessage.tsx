import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import { ChatMessage as ChatMessageType } from '@/src/types/support.types';
import { formatSupportDate } from '@/src/utils/support.utils';

interface ChatMessageProps {
    message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.sender === 'user';

    return (
        <View style={tw`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
            <View style={tw`max-w-[80%] ${
                isUser 
                    ? 'bg-blue-500 rounded-tl-xl rounded-tr-xl rounded-bl-xl' 
                    : 'bg-white rounded-tl-xl rounded-tr-xl rounded-br-xl'
            } p-3 shadow-sm`}>
                <Text style={tw`${isUser ? 'text-white' : 'text-gray-800'}`}>
                    {message.message}
                </Text>
            </View>
            <Text style={tw`text-xs text-gray-500 mt-1`}>
                {message.senderName} • {formatSupportDate(message.timestamp)}
            </Text>
        </View>
    );
}

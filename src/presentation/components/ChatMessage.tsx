import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { IMessageResponse } from '@/src/interfaces/chat.interface';
import { chatUtils } from '@/src/utils/chatUtils';
import { useAuth } from '@/src/context/AuthContext';

interface ChatMessageProps {
    message: IMessageResponse;
    onImagePress?: (uri: string) => void;
    onFilePress?: (fileUrl: string, fileName: string) => void;
    onReplyPress?: (message: IMessageResponse) => void;
}

export function ChatMessage({ message, onImagePress, onFilePress, onReplyPress }: ChatMessageProps) {
    const { user } = useAuth();
    const isOwnMessage = chatUtils.isOwnMessage(message, user?.uid || '');
  
    const renderMessageContent = () => {
        switch (message.type) {
            case 'image':
                return (
                    <TouchableOpacity
                        onPress={() => onImagePress?.(message.fileUrl || '')}
                        style={tw`rounded-lg overflow-hidden`}
                    >
                        <Image
                            source={{ uri: message.fileUrl }}
                            style={tw`w-60 h-60`}
                            resizeMode="cover"
                        />
                        {message.content && (
                            <Text style={tw`${isOwnMessage ? 'text-white' : 'text-gray-800'} mt-2`}>
                                {message.content}
                            </Text>
                        )}
                    </TouchableOpacity>
                );

            case 'file':
                return (
                    <TouchableOpacity
                        onPress={() => onFilePress?.(message.fileUrl || '', message.fileName || '')}
                        style={tw`flex-row items-center bg-opacity-20 ${
                            isOwnMessage ? 'bg-white' : 'bg-indigo-100'
                        } p-3 rounded-lg`}
                    >
                        <View style={tw`w-10 h-10 rounded-lg ${
                            isOwnMessage ? 'bg-white' : 'bg-indigo-100'
                        } items-center justify-center`}>
                            <Feather name="file" size={20} color="#4F46E5" />
                        </View>
                        <View style={tw`ml-3 flex-1`}>
                            <Text style={tw`font-medium ${
                                isOwnMessage ? 'text-white' : 'text-gray-800'
                            }`} numberOfLines={1}>
                                {message.fileName}
                            </Text>
                            <Text style={tw`text-xs ${
                                isOwnMessage ? 'text-white opacity-80' : 'text-gray-600'
                            }`}>
                                {message.fileSize ? chatUtils.formatFileSize(message.fileSize) : 'Unknown size'}
                            </Text>
                        </View>
                        <Feather name="download" size={20} color={isOwnMessage ? "white" : "#4F46E5"} />
                    </TouchableOpacity>
                );

            case 'system':
                return (
                    <View style={tw`bg-gray-100 p-2 rounded-lg`}>
                        <Text style={tw`text-gray-600 text-center text-sm italic`}>
                            {message.content}
                        </Text>
                    </View>
                );

            default:
                return (
                    <View>
                        {message.replyTo && (
                            <View style={tw`mb-2 p-2 border-l-2 border-gray-300 bg-gray-50 rounded`}>
                                <Text style={tw`text-xs text-gray-500 mb-1`}>
                                    Respondendo a {message.replyTo.senderName}
                                </Text>
                                <Text style={tw`text-sm text-gray-700`} numberOfLines={2}>
                                    {message.replyTo.content}
                                </Text>
                            </View>
                        )}
                        <Text style={tw`${isOwnMessage ? 'text-white' : 'text-gray-800'}`}>
                            {message.content}
                        </Text>
                    </View>
                );
        }
    };

    return (
        <View style={tw`mb-4 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
            <View style={tw`max-w-[80%] ${
                isOwnMessage 
                    ? 'bg-blue-500 rounded-tl-xl rounded-tr-xl rounded-bl-xl' 
                    : 'bg-white rounded-tl-xl rounded-tr-xl rounded-br-xl'
            } p-3 shadow-sm`}>
                {renderMessageContent()}
            </View>
            
            <View style={tw`flex-row items-center mt-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                <Text style={tw`text-xs text-gray-500`}>
                    {message.sender.fullName} • {chatUtils.formatMessageTime(message.timestamp)}
                </Text>
                
                {isOwnMessage && (
                    <View style={tw`ml-2 flex-row`}>
                        {message.readBy.length > 0 ? (
                            <Feather name="check-circle" size={12} color="#10B981" />
                        ) : (
                            <Feather name="check" size={12} color="#6B7280" />
                        )}
                    </View>
                )}
            </View>

            {/* Reply button */}
            {!isOwnMessage && (
                <TouchableOpacity
                    onPress={() => onReplyPress?.(message)}
                    style={tw`mt-1 opacity-70`}
                >
                    <Feather name="corner-up-left" size={14} color="#6B7280" />
                </TouchableOpacity>
            )}
        </View>
    );
}

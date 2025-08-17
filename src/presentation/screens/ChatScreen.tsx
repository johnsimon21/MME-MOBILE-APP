import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, Animated, Platform, KeyboardAvoidingView, Alert, ActivityIndicator, Modal } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import tw from "twrnc";
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from 'expo-file-system';
import EmojiSelector, { Categories } from 'react-native-emoji-selector';
import { Audio } from 'expo-av';
import { useRouter } from "expo-router";

// Import contexts and interfaces
import { useChatContext } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { IChatResponse, IMessageResponse, MessageType, ChatType } from "../../interfaces/chat.interface";
import { chatUtils } from "../../utils/chatUtils";
import { useCall } from "../../hooks/useCall";
import { useAuthState } from "../../hooks/useAuthState";
import { useSessions } from "../../hooks/useSessions";
import { useConnections } from "../../hooks/useConnections";

type RootStackParamList = {
    ChatScreen: {
        chat: IChatResponse;
        startSession?: boolean;
    };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>;

export function ChatScreen({ route, navigation }: Props) {
    const { chat, startSession } = route.params;
    const router = useRouter();
    const { user } = useAuth();
    const { isMentor, isMentee } = useAuthState();
    const { getSessionById, addParticipant, endSession } = useSessions();
    const { getUserFriends } = useConnections();
    const { 
        currentChat, 
        messages, 
        isLoadingMessages,
        error,
        selectChat,
        loadMessages,
        sendMessage,
        sendFileMessage,
        markAsRead,
        joinChat,
        leaveChat,
        startTyping,
        stopTyping,
        isUserTyping,
        isUserOnline
    } = useChatContext();
    const { isConnected, connect } = useSocket();
    const { startCall, canMakeCall } = useCall();


    // State variables
    const [newMessage, setNewMessage] = useState("");
    const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRecordingAudio, setIsRecordingAudio] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
    const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null);
    
    // Session-specific state
    const [sessionData, setSessionData] = useState<any>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(false);
    const [showMenteeSelection, setShowMenteeSelection] = useState(false);
    const [availableMentees, setAvailableMentees] = useState<any[]>([]);

    // Refs
    const scrollViewRef = useRef<ScrollView>(null);

    // Get other participant info
    const otherParticipant = chatUtils.getOtherParticipant(chat, user?.uid || '');
    const chatTitle = chatUtils.getChatTitle(chat, user?.uid || '');
    const isOnline = otherParticipant ? isUserOnline(otherParticipant.uid) : false;
    const isTyping = otherParticipant ? isUserTyping(chat.id, otherParticipant.uid) : false;

    // Initialize chat when component mounts
    useEffect(() => {
        if (chat && user) {
            selectChat(chat);
            loadMessages(chat.id);
            joinChat(chat.id);

            return () => {
                leaveChat(chat.id);
            };
        }
    }, [chat.id, user?.uid]);

    // Load session data if this is a session chat
    useEffect(() => {
        const loadSessionData = async () => {
            if (chat.type === ChatType.SESSION && chat.sessionId) {
                try {
                    setIsLoadingSession(true);
                    const session = await getSessionById(chat.sessionId);
                    setSessionData(session);
                } catch (error) {
                    console.error('Error loading session data:', error);
                } finally {
                    setIsLoadingSession(false);
                }
            }
        };

        loadSessionData();
    }, [chat.sessionId, chat.type]);

    // Rejoin chat when connection is restored
    useEffect(() => {
        if (isConnected && chat?.id && user) {
            console.log('🔄 Connection restored, rejoining chat:', chat.id);
            joinChat(chat.id);
        }
    }, [isConnected, chat?.id, user]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    // Mark as read when user scrolls or when messages load (indicating user is viewing)
    const handleMarkAsRead = useCallback(() => {
        if (chat.unreadCount > 0) {
            markAsRead(chat.id);
        }
    }, [chat.id, chat.unreadCount, markAsRead]);

    // Mark as read when messages are loaded and user is viewing the chat
    useEffect(() => {
        if (messages.length > 0 && chat.unreadCount > 0) {
            // Debounce to avoid excessive calls
            const timer = setTimeout(() => {
                handleMarkAsRead();
            }, 2000); // Wait 2 seconds before marking as read

            return () => clearTimeout(timer);
        }
    }, [messages.length]);

    // Handle typing indicators
    const handleTypingStart = useCallback(() => {
        if (typingTimer) {
            clearTimeout(typingTimer);
        }
        
        startTyping(chat.id);
        
        const timer = setTimeout(() => {
            stopTyping(chat.id);
        }, 3000) as unknown as NodeJS.Timeout;
        
        setTypingTimer(timer);
    }, [chat.id, typingTimer]);

    const handleTypingStop = useCallback(() => {
        if (typingTimer) {
            clearTimeout(typingTimer);
            setTypingTimer(null);
        }
        stopTyping(chat.id);
    }, [chat.id, typingTimer]);

    // Handle text input changes
    const handleTextChange = useCallback((text: string) => {
        setNewMessage(text);
        
        if (text.length > 0) {
            handleTypingStart();
        } else {
            handleTypingStop();
        }
    }, [handleTypingStart, handleTypingStop]);

    // Send text message
    const handleSendMessage = useCallback(async () => {
        if (!newMessage.trim() || !currentChat) return;

        try {
            handleTypingStop();
            await sendMessage(newMessage.trim(), new Date());
            setNewMessage("");
            setShowEmojiPicker(false);
        } catch (error: any) {
            Alert.alert('Erro', 'Não foi possível enviar a mensagem');
        }
    }, [newMessage, currentChat, sendMessage, handleTypingStop]);

    // Handle emoji selection
    const handleEmojiSelected = useCallback((emoji: string) => {
        setNewMessage(prev => prev + emoji);
        handleTypingStart();
    }, [handleTypingStart]);

    // Voice call handler
    const handleVoiceCall = useCallback(async () => {
        if (!otherParticipant || !canMakeCall()) {
            Alert.alert('Erro', 'Não é possível iniciar chamada no momento');
            return;
        }
        
        try {
            await startCall(chat.id, otherParticipant.uid, false); // false = audio only
            
            // Navigate to call screen
            router.push({
                pathname: '/normal-call',
                params: {
                    userId: otherParticipant.uid,
                    userName: otherParticipant.fullName,
                    userPhoto: otherParticipant.image || ''
                }
            });
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Falha ao iniciar chamada');
        }
    }, [otherParticipant, canMakeCall, startCall, chat.id, router]);

    // Image picker
    const pickImage = useCallback(async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                const file = {
                    uri: asset.uri,
                    type: asset.type || 'image/jpeg',
                    name: asset.fileName || 'image.jpg',
                    size: asset.fileSize || 0
                };

                await sendFileMessage({
                    file,
                    type: MessageType.IMAGE,
                    caption: ''
                });
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível enviar a imagem');
        }
        setShowAttachmentOptions(false);
    }, [sendFileMessage]);

    // Document picker
    const pickDocument = useCallback(async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({});

            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                const file = {
                    uri: asset.uri,
                    type: asset.mimeType || 'application/octet-stream',
                    name: asset.name,
                    size: asset.size || 0
                };

                await sendFileMessage({
                    file,
                    type: MessageType.FILE,
                    caption: ''
                });
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível enviar o arquivo');
        }
        setShowAttachmentOptions(false);
    }, [sendFileMessage]);

    // Camera capture
    const takePicture = useCallback(async () => {
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                const file = {
                    uri: asset.uri,
                    type: asset.type || 'image/jpeg',
                    name: 'camera_image.jpg',
                    size: asset.fileSize || 0
                };

                await sendFileMessage({
                    file,
                    type: MessageType.IMAGE,
                    caption: ''
                });
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível tirar a foto');
        }
        setShowAttachmentOptions(false);
    }, [sendFileMessage]);

    // Audio recording
    const startRecording = useCallback(async () => {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(recording);
            setIsRecordingAudio(true);
            setRecordingDuration(0);

            const timer = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000) as unknown as NodeJS.Timeout;

            setRecordingTimer(timer);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível iniciar a gravação');
        }
    }, []);

    const stopRecording = useCallback(async () => {
        if (!recording) return;

        try {
            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            const uri = recording.getURI();
            if (uri) {
                const fileInfo = await FileSystem.getInfoAsync(uri);
                const file = {
                    uri,
                    type: 'audio/m4a',
                    name: 'audio_recording.m4a',
                    size: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0
                };

                await sendFileMessage({
                    file,
                    type: MessageType.FILE,
                    caption: `Áudio ${Math.floor(recordingDuration / 60)}:${(recordingDuration % 60).toString().padStart(2, '0')}`
                });
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível enviar o áudio');
        }

        if (recordingTimer) {
            clearInterval(recordingTimer);
        }

        setRecording(null);
        setIsRecordingAudio(false);
        setRecordingTimer(null);
    }, [recording, recordingDuration, recordingTimer, sendFileMessage]);

    // Session management functions
    const handleSessionManagement = async () => {
        if (!sessionData) {
            Alert.alert('Erro', 'Dados da sessão não carregados');
            return;
        }

        Alert.alert(
            'Gerenciar Sessão',
            `Sessão: ${sessionData.title}`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Adicionar Mentee',
                    onPress: () => handleAddMentee()
                },
                {
                    text: 'Finalizar Sessão',
                    style: 'destructive',
                    onPress: () => handleEndSession()
                }
            ]
        );
    };

    const handleAddMentee = async () => {
        try {
            // Load available mentees (friends who are mentees and not already in session)
            const friendsResponse = await getUserFriends(user?.uid || '');
            const mentees = friendsResponse.connections
                ?.filter(conn => conn.connectedUser.role === 'mentee')
                ?.filter(conn => !sessionData?.participants.some((p: any) => p.uid === conn.connectedUser.uid))
                || [];

            if (mentees.length === 0) {
                Alert.alert('Aviso', 'Não há mentees disponíveis para adicionar à sessão');
                return;
            }

            setAvailableMentees(mentees);
            setShowMenteeSelection(true);
        } catch (error: any) {
            Alert.alert('Erro', 'Falha ao carregar mentees disponíveis');
        }
    };

    const handleSelectMentee = async (mentee: any) => {
        try {
            if (!sessionData) return;

            await addParticipant(sessionData.id, { menteeId: mentee.connectedUser.uid });
            
            // Refresh session data
            const updatedSession = await getSessionById(sessionData.id);
            setSessionData(updatedSession);
            
            setShowMenteeSelection(false);
            Alert.alert('Sucesso', `${mentee.connectedUser.fullName} foi adicionado à sessão`);
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Falha ao adicionar mentee à sessão');
        }
    };

    const handleEndSession = async () => {
        if (!sessionData) return;

        Alert.alert(
            'Finalizar Sessão',
            'Tem certeza que deseja finalizar esta sessão? Esta ação marcará a sessão como concluída.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Finalizar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await endSession(sessionData.id);
                            Alert.alert('Sucesso', 'Sessão finalizada com sucesso!');
                            
                            // Refresh session data
                            if (chat.sessionId) {
                                const updatedSession = await getSessionById(chat.sessionId);
                                setSessionData(updatedSession);
                            }
                        } catch (error: any) {
                            Alert.alert('Erro', error.message || 'Falha ao finalizar sessão');
                        }
                    }
                }
            ]
        );
    };

    // Render message content
    const renderMessageContent = useCallback((message: IMessageResponse) => {
        const isSent = message.sender.uid === user?.uid;
        const isMentorMessage = sessionData?.mentor?.uid === message.sender.uid;

        switch (message.type) {
            case MessageType.IMAGE:
                return (
                    <TouchableOpacity onPress={() => {/* Open image viewer */}}>
                        <Image
                            source={{ uri: message.fileUrl }}
                            style={tw`w-60 h-60 rounded-lg`}
                            resizeMode="cover"
                        />
                        {message.content && (
                            <Text style={tw`mt-2 ${isSent 
                                ? 'text-white' 
                                : (isMentorMessage ? 'text-purple-800' : 'text-gray-800')
                            }`}>
                                {message.content}
                            </Text>
                        )}
                    </TouchableOpacity>
                );

            case MessageType.FILE:
                return (
                    <TouchableOpacity
                        style={tw`flex-row items-center bg-opacity-20 ${isSent ? 'bg-white' : 'bg-indigo-100'} p-3 rounded-lg`}
                        onPress={() => {/* Download/open file */}}
                    >
                        <View style={tw`w-10 h-10 rounded-lg ${isSent ? 'bg-white' : 'bg-indigo-100'} items-center justify-center`}>
                            <Feather name="file" size={20} color="#4F46E5" />
                        </View>
                        <View style={tw`ml-3 flex-1`}>
                            <Text style={tw`font-medium ${isSent 
                                ? 'text-white' 
                                : (isMentorMessage ? 'text-purple-800' : 'text-gray-800')
                            }`} numberOfLines={1}>
                                {message.fileName || 'Arquivo'}
                            </Text>
                            {message.fileSize && (
                                <Text style={tw`text-xs ${isSent 
                                    ? 'text-white opacity-80' 
                                    : (isMentorMessage ? 'text-purple-600' : 'text-gray-600')
                                }`}>
                                    {Math.round(message.fileSize / 1024)} KB
                                </Text>
                            )}
                            {message.content && (
                                <Text style={tw`text-sm mt-1 ${isSent 
                                    ? 'text-white opacity-90' 
                                    : (isMentorMessage ? 'text-purple-700' : 'text-gray-700')
                                }`}>
                                    {message.content}
                                </Text>
                            )}
                        </View>
                        <Feather name="download" size={20} color={isSent ? "white" : "#4F46E5"} />
                    </TouchableOpacity>
                );

            default:
                return (
                    <Text style={tw`${isSent 
                        ? 'text-white' 
                        : (isMentorMessage ? 'text-purple-800' : 'text-gray-800')
                    }`}>
                        {message.content}
                    </Text>
                );
        }
    }, [user?.uid, sessionData]);

    if (isLoadingMessages && messages.length === 0) {
        return (
            <View style={tw`flex-1 bg-white items-center justify-center`}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={tw`mt-4 text-gray-600`}>Carregando mensagens...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={tw`flex-1 bg-white`}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            {/* Header */}
            <View style={tw`bg-white border-b border-gray-200 px-4 pt-12 pb-3 flex-row items-center`}>
                <TouchableOpacity
                    style={tw`p-2 -ml-2`}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#4F46E5" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={tw`flex-row items-center flex-1`}
                    onPress={() => {/* Navigate to profile */}}
                >
                    {otherParticipant?.image ? (
                        <Image source={{ uri: otherParticipant.image }} style={tw`w-10 h-10 rounded-full`} />
                    ) : (
                        <View style={tw`w-10 h-10 rounded-full bg-indigo-100 items-center justify-center`}>
                            <Text style={tw`text-lg font-bold text-indigo-600`}>
                               <Feather name="users" size={20} color="#8B5CF6" />
                            </Text>
                        </View>
                    )}

                    <View style={tw`ml-2`}>
                        <View style={tw`flex-row items-center`}>
                            <Text style={tw`font-bold text-gray-800 max-w-38`} numberOfLines={1}>{chatTitle}</Text>
                            {/* {chat.type === ChatType.SESSION && (
                                <View style={tw`ml-1 bg-purple-100 px-2 py-1 rounded-full`}>
                                    <Text style={tw`text-xs font-medium text-purple-600`}>Sessão</Text>
                                </View>
                            )} */}
                        </View>
                        {isTyping ? (
                            <Text style={tw`text-xs text-green-600`}>Digitando...</Text>
                        ) : (
                            <View style={tw`flex-row items-center`}>
                                <View style={tw`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                                <Text style={tw`text-xs text-gray-500`}>
                                    {isOnline ? 'Online' : 'Offline'}
                                </Text>
                                {chat.type === ChatType.SESSION && sessionData && (
                                    <Text style={tw`text-xs text-purple-600 ml-2 flex`}  numberOfLines={1}>
                                        • Mentor: {sessionData.mentor?.fullName?.split(' ')[0] || 'Carregando...'}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                {/* Connection status */}
                {!isConnected && (
                    <TouchableOpacity 
                        style={tw`bg-orange-100 px-3 py-1 rounded-full mr-2`}
                        onPress={() => {
                            connect();
                        }}
                    >
                        <Text style={tw`text-orange-600 text-xs`}>
                            Reconectando... (toque para tentar novamente)
                        </Text>
                    </TouchableOpacity>
                )}

                <View style={tw`flex-row items-center`}>                                     
                    {/* Session status indicator */}
                    {chat.type === ChatType.SESSION && sessionData && (
                        <View style={tw`mr-2`}>
                            <View style={tw`${
                                sessionData.status === 'active' ? 'bg-green-100' :
                                sessionData.status === 'scheduled' ? 'bg-blue-100' :
                                sessionData.status === 'completed' ? 'bg-gray-100' : 'bg-red-100'
                            } px-2 py-1 rounded-full`}>
                                <Text style={tw`text-xs font-medium ${
                                    sessionData.status === 'active' ? 'text-green-700' :
                                    sessionData.status === 'scheduled' ? 'text-blue-700' :
                                    sessionData.status === 'completed' ? 'text-gray-700' : 'text-red-700'
                                }`}>
                                    {sessionData.status === 'active' ? 'Ativa' :
                                     sessionData.status === 'scheduled' ? 'Agendada' :
                                     sessionData.status === 'completed' ? 'Finalizada' : 'Cancelada'}
                                </Text>
                            </View>
                        </View>
                    )}

                       {/* Session-specific actions */}
                    {chat.type === ChatType.SESSION && isMentor && sessionData && (
                        <TouchableOpacity
                            onPress={handleSessionManagement}
                            style={tw`p-2 mr-1`}
                        >
                            <Feather name="users" size={20} color="#8B5CF6" />
                        </TouchableOpacity>
                    )}
                    
                    {/* <TouchableOpacity
                        onPress={handleVoiceCall}
                        style={tw`p-2 mr-1`}
                    >
                        <Feather name="phone" size={20} color="#222222" />
                    </TouchableOpacity> */}
                </View>
            </View>

            {/* Messages */}
            <View style={tw`flex-1 p-4 pt-0`}>
                <ScrollView
                    ref={scrollViewRef}
                    style={tw`flex-1`}
                    contentContainerStyle={tw`py-2`}
                    showsVerticalScrollIndicator={false}
                    onScrollEndDrag={handleMarkAsRead}
                    onMomentumScrollEnd={handleMarkAsRead}
                >
                    {messages.map((message) => {
                        const isSent = message.sender.uid === user?.uid;
                        const isSessionChat = chat.type === ChatType.SESSION;
                        const isMentorMessage = sessionData?.mentor?.uid === message.sender.uid;
                        
                        return (
                            <View key={message.id} style={tw`${isSent ? 'self-end' : 'self-start'} max-w-3/4 mb-3`}>
                                {/* Show sender info for session chats (received messages only) */}
                                {isSessionChat && !isSent && (
                                    <View style={tw`flex-row items-center mb-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
                                        {/* Sender Avatar */}
                                        <View style={tw`w-6 h-6 rounded-full mr-2 ${isMentorMessage ? 'bg-purple-100 border-2 border-purple-400' : 'bg-indigo-100'} items-center justify-center`}>
                                            {message.sender.image ? (
                                                <Image 
                                                    source={{ uri: message.sender.image }} 
                                                    style={tw`w-6 h-6 rounded-full`} 
                                                />
                                            ) : (
                                                <Text style={tw`text-xs font-bold ${isMentorMessage ? 'text-purple-600' : 'text-indigo-600'}`}>
                                                    {message.sender.fullName.charAt(0).toUpperCase()}
                                                </Text>
                                            )}
                                        </View>
                                        
                                        {/* Sender Name with Mentor Badge */}
                                        <View style={tw`flex-row items-center`}>
                                            <Text style={tw`text-xs font-medium ${isMentorMessage ? 'text-purple-700' : 'text-gray-600'}`}>
                                                {message.sender.fullName.split(' ')[0]}
                                            </Text>
                                            {isMentorMessage && (
                                                <View style={tw`ml-1 bg-purple-500 px-1.5 py-0.5 rounded-full`}>
                                                    <Text style={tw`text-xs font-bold text-white`}>MENTOR</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                )}

                                <View style={tw`
                                    ${isSent
                                        ? isMentorMessage 
                                            ? 'bg-purple-600 rounded-tl-xl rounded-tr-xl rounded-bl-xl' 
                                            : 'bg-indigo-600 rounded-tl-xl rounded-tr-xl rounded-bl-xl'
                                        : isMentorMessage
                                            ? 'bg-purple-50 border-2 border-purple-200 rounded-tl-xl rounded-tr-xl rounded-br-xl'
                                            : 'bg-white border border-gray-200 rounded-tl-xl rounded-tr-xl rounded-br-xl'} 
                                    p-3 shadow-sm
                                `}>
                                    {renderMessageContent(message)}
                                </View>

                                <View style={tw`flex-row items-center ${isSent ? 'justify-end' : 'justify-start'} mt-1`}>
                                    <Text style={tw`text-xs text-gray-500`}>
                                        {chatUtils.formatMessageTime(message.timestamp)}
                                    </Text>
                                    {isSent && (
                                        <Ionicons
                                            name="checkmark-done"
                                            size={16}
                                            color="#4CAF50"
                                            style={tw`ml-1`}
                                        />
                                    )}
                                </View>
                            </View>
                        );
                    })}

                    {isLoadingMessages && messages.length > 0 && (
                        <View style={tw`items-center py-4`}>
                            <ActivityIndicator size="small" color="#4F46E5" />
                        </View>
                    )}
                </ScrollView>

                {/* Attachment options */}
                {showAttachmentOptions && (
                    <View style={tw`flex-row px-2 py-3 bg-gray-50 rounded-xl mb-2`}>
                        <TouchableOpacity style={tw`items-center mr-4`} onPress={pickImage}>
                            <View style={tw`w-12 h-12 rounded-full bg-indigo-100 items-center justify-center mb-1`}>
                                <Feather name="image" size={24} color="#4F46E5" />
                            </View>
                            <Text style={tw`text-xs text-gray-600`}>Imagem</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={tw`items-center mr-4`} onPress={pickDocument}>
                            <View style={tw`w-12 h-12 rounded-full bg-green-100 items-center justify-center mb-1`}>
                                <Feather name="file" size={24} color="#10B981" />
                            </View>
                            <Text style={tw`text-xs text-gray-600`}>Documento</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={tw`items-center mr-4`} onPress={takePicture}>
                            <View style={tw`w-12 h-12 rounded-full bg-blue-100 items-center justify-center mb-1`}>
                                <Feather name="camera" size={24} color="#3B82F6" />
                            </View>
                            <Text style={tw`text-xs text-gray-600`}>Câmera</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={tw`items-center`}
                            onPress={isRecordingAudio ? stopRecording : startRecording}
                        >
                            <View style={tw`w-12 h-12 rounded-full ${isRecordingAudio ? 'bg-red-100' : 'bg-purple-100'} items-center justify-center mb-1`}>
                                <Feather name={isRecordingAudio ? "stop-circle" : "mic"} size={24} color={isRecordingAudio ? "#EF4444" : "#8B5CF6"} />
                            </View>
                            <Text style={tw`text-xs text-gray-600`}>{isRecordingAudio ? 'Parar' : 'Áudio'}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Audio recording indicator */}
                {isRecordingAudio && (
                    <View style={tw`flex-row items-center justify-between bg-red-50 px-4 py-2 rounded-lg mb-2`}>
                        <View style={tw`flex-row items-center`}>
                            <View style={tw`w-3 h-3 rounded-full bg-red-500 mr-2`} />
                            <Text style={tw`text-red-600 font-medium`}>Gravando áudio</Text>
                        </View>
                        <Text style={tw`text-red-600`}>
                            {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:
                            {(recordingDuration % 60).toString().padStart(2, '0')}
                        </Text>
                    </View>
                )}

                {/* Input Area */}
                <View style={tw`flex-row items-center`}>
                    <TouchableOpacity
                        style={tw`p-2 mr-1`}
                        onPress={() => setShowAttachmentOptions(!showAttachmentOptions)}
                    >
                        <Feather name="plus" size={24} color="#4F46E5" />
                    </TouchableOpacity>

                    <View style={tw`flex-1 bg-gray-100 rounded-full px-4 py-2 flex-row items-center`}>
                        <TextInput
                            placeholder="Mensagem..."
                            style={tw`flex-1 text-gray-700 max-h-[100px]`}
                            value={newMessage}
                            onChangeText={handleTextChange}
                            onBlur={handleTypingStop}
                            multiline
                        />
                        <TouchableOpacity 
                            style={tw`ml-2`} 
                            onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                            <Feather name="smile" size={22} color={showEmojiPicker ? "#4F46E5" : "gray"} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={tw`p-2 ml-1 ${newMessage.trim() ? 'bg-indigo-600' : 'bg-gray-300'} rounded-full`}
                        onPress={handleSendMessage}
                        disabled={!newMessage.trim()}
                    >
                        <Feather name="send" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <View style={tw`h-64 bg-white border-t border-gray-200`}>
                        <EmojiSelector
                            category={Categories.emotion}
                            onEmojiSelected={handleEmojiSelected}
                            showSearchBar={false}
                            showTabs={true}
                            showHistory={false}
                            columns={8}
                        />
                    </View>
                )}
            </View>

            {/* Error display */}
            {error && (
                <View style={tw`bg-red-50 border border-red-200 mx-4 mb-4 p-3 rounded-lg`}>
                    <Text style={tw`text-red-700 text-sm`}>{error}</Text>
                </View>
            )}

            {/* Mentee Selection Modal */}
            <Modal
                visible={showMenteeSelection}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowMenteeSelection(false)}
            >
                <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
                    <View style={tw`bg-white rounded-t-3xl p-6 max-h-3/4`}>
                        <View style={tw`flex-row items-center justify-between mb-4`}>
                            <Text style={tw`text-xl font-bold text-gray-800`}>Adicionar Mentee</Text>
                            <TouchableOpacity onPress={() => setShowMenteeSelection(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <Text style={tw`text-gray-600 mb-4`}>
                            Selecione um mentee para adicionar à sessão:
                        </Text>

                        <ScrollView style={tw`max-h-96`} showsVerticalScrollIndicator={false}>
                            {availableMentees.map((mentee) => (
                                <TouchableOpacity
                                    key={mentee.connectedUser.uid}
                                    onPress={() => handleSelectMentee(mentee)}
                                    style={tw`flex-row items-center p-4 border-b border-gray-100`}
                                >
                                    <View style={tw`w-12 h-12 bg-indigo-100 rounded-full items-center justify-center mr-3`}>
                                        <Text style={tw`text-indigo-600 font-bold text-lg`}>
                                            {mentee.connectedUser.fullName.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={tw`flex-1`}>
                                        <Text style={tw`font-medium text-gray-800`}>
                                            {mentee.connectedUser.fullName}
                                        </Text>
                                        <Text style={tw`text-gray-600 text-sm`}>
                                            {mentee.connectedUser.email}
                                        </Text>
                                        <Text style={tw`text-gray-500 text-xs`}>
                                            {mentee.connectedUser.school}
                                        </Text>
                                    </View>
                                    <Feather name="plus-circle" size={20} color="#10B981" />
                                </TouchableOpacity>
                            ))}

                            {availableMentees.length === 0 && (
                                <View style={tw`items-center py-8`}>
                                    <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                                    <Text style={tw`text-gray-500 mt-2`}>Nenhum mentee disponível</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Image, TouchableOpacity, Animated, Platform, KeyboardAvoidingView, Modal } from "react-native";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import tw from "twrnc";
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { User } from "./MessagesScreen";
import { formatMessageTime } from "../../utils/dateFormatter";
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from 'expo-file-system';
import EmojiSelector, { Categories } from 'react-native-emoji-selector';
import { Audio } from 'expo-av';

// First, let's extend our Message interface to support different content types
interface Message {
    id: string;
    text: string;
    timestamp: string;
    isSent: boolean;
    isRead: boolean;
    contentType?: 'text' | 'image' | 'file' | 'audio';
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    fileThumbnail?: string;
    audioDuration?: string;
}

type RootStackParamList = {
    ChatScreen: { user: User };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>;

export function ChatScreen({ route, navigation }: Props) {
    // Existing state variables
    const { user } = route.params;
    const [messages, setMessages] = useState<Message[]>(user.messages || []);
    const [newMessage, setNewMessage] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
    const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    // New state variables for emoji and file handling
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRecordingAudio, setIsRecordingAudio] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);

    // Refs
    const scrollViewRef = useRef<ScrollView>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // Function to handle emoji selection
    const handleEmojiSelected = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
    };

    useEffect(() => {
        // Simulate typing status changes
        const typingInterval = setInterval(() => {
            // Random typing simulation (10% chance of typing)
            if (Math.random() < 0.1) {
                setIsTyping(true);
                // Stop typing after 2-5 seconds
                setTimeout(() => {
                    setIsTyping(false);
                }, 2000 + Math.random() * 3000);
            }
        }, 10000); // Check every 10 seconds

        return () => clearInterval(typingInterval);
    }, []);

    // Function to toggle emoji picker
    const toggleEmojiPicker = () => {
        setShowEmojiPicker(!showEmojiPicker);
        setShowAttachmentOptions(false);
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

    // For the image picker function
    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const fileInfo = await FileSystem.getInfoAsync(asset.uri);

                // Check if file exists and size is available
                const fileSize = fileInfo.exists && 'size' in fileInfo
                    ? `${(fileInfo.size / 1024 / 1024).toFixed(2)} MB`
                    : "Unknown";

                sendFileMessage({
                    contentType: 'image',
                    fileUrl: asset.uri,
                    fileName: asset.fileName || 'image.jpg',
                    fileSize,
                    fileThumbnail: asset.uri
                });
            }
        } catch (error) {
            console.log('Error picking image:', error);
        }

        setShowAttachmentOptions(false);
    };

    // For the document picker
    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({});

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const fileInfo = await FileSystem.getInfoAsync(asset.uri);

                // Check if file exists and size is available
                const fileSize = fileInfo.exists && 'size' in fileInfo
                    ? `${(fileInfo.size / 1024 / 1024).toFixed(2)} MB`
                    : "Unknown";

                sendFileMessage({
                    contentType: 'file',
                    fileUrl: asset.uri,
                    fileName: asset.name,
                    fileSize
                });
            }
        } catch (error) {
            console.log('Error picking document:', error);
        }

        setShowAttachmentOptions(false);
    };

    // Function to start recording audio
    const startRecording = async () => {
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

            // Start timer to track recording duration
            const timer = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000) as unknown as NodeJS.Timeout;

            setRecordingTimer(timer);
        } catch (error) {
            console.log('Error starting recording:', error);
        }
    };

    // Function to stop recording audio
    const stopRecording = async () => {
        if (!recording) return;

        try {
            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            const uri = recording.getURI();
            if (uri) {
                const fileInfo = await FileSystem.getInfoAsync(uri);

                // Check if file exists and size is available
                const fileSize = fileInfo.exists && 'size' in fileInfo
                    ? `${(fileInfo.size / 1024 / 1024).toFixed(2)} MB`
                    : "Unknown";

                // Format duration as mm:ss
                const minutes = Math.floor(recordingDuration / 60);
                const seconds = recordingDuration % 60;
                const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                sendFileMessage({
                    contentType: 'audio',
                    fileUrl: uri,
                    fileName: 'audio_recording.m4a',
                    fileSize,
                    audioDuration: formattedDuration
                });
            }
        } catch (error) {
            console.log('Error stopping recording:', error);
        }

        if (recordingTimer) {
            clearInterval(recordingTimer);
        }

        setRecording(null);
        setIsRecordingAudio(false);
        setRecordingTimer(null);
    };

    // Function to cancel recording
    const cancelRecording = async () => {
        if (!recording) return;

        try {
            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });
        } catch (error) {
            console.log('Error canceling recording:', error);
        }

        if (recordingTimer) {
            clearInterval(recordingTimer);
        }

        setRecording(null);
        setIsRecordingAudio(false);
        setRecordingTimer(null);
    };

    // Function to send a file message
    const sendFileMessage = (fileData: {
        contentType: 'image' | 'file' | 'audio',
        fileUrl: string,
        fileName: string,
        fileSize: string,
        fileThumbnail?: string,
        audioDuration?: string
    }) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            text: fileData.fileName,
            timestamp: new Date().toISOString(),
            isSent: true,
            isRead: false,
            contentType: fileData.contentType,
            fileUrl: fileData.fileUrl,
            fileName: fileData.fileName,
            fileSize: fileData.fileSize,
            fileThumbnail: fileData.fileThumbnail,
            audioDuration: fileData.audioDuration
        };

        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);

        // Make sure we scroll to bottom after state update
        setTimeout(() => {
            scrollToBottom();
        }, 100);
    };

    // Modified handleSendMessage to support text messages
    const handleSendMessage = () => {
        if (newMessage.trim()) {
            const message: Message = {
                id: Date.now().toString(),
                text: newMessage,
                timestamp: new Date().toISOString(),
                isSent: true,
                isRead: false,
                contentType: 'text'
            };

            scrollToBottom();
            setMessages([...messages, message]);
            setNewMessage("");

            // Simulate reply after a delay (existing code)
        }
    };

    // Function to render message content based on type
    const renderMessageContent = (message: Message) => {
        switch (message.contentType) {
            case 'image':
                return (
                    <TouchableOpacity
                        onPress={() => {
                            // Open image viewer
                        }}
                    >
                        <Image
                            source={{ uri: message.fileUrl }}
                            style={tw`w-60 h-60 rounded-lg`}
                            resizeMode="cover"
                        />
                        <View style={tw`flex-row items-center mt-1`}>
                            <Feather name="image" size={14} color={message.isSent ? "white" : "gray"} />
                            <Text style={tw`ml-1 text-xs ${message.isSent ? 'text-white' : 'text-gray-600'}`}>
                                {message.fileSize}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );

            case 'file':
                return (
                    <TouchableOpacity
                        style={tw`flex-row items-center bg-opacity-20 ${message.isSent ? 'bg-white' : 'bg-indigo-100'} p-3 rounded-lg`}
                        onPress={() => {
                            // Open file
                        }}
                    >
                        <View style={tw`w-10 h-10 rounded-lg ${message.isSent ? 'bg-white' : 'bg-indigo-100'} items-center justify-center`}>
                            <Feather name="file" size={20} color={message.isSent ? "#4F46E5" : "#4F46E5"} />
                        </View>
                        <View style={tw`ml-3 flex-1`}>
                            <Text style={tw`font-medium ${message.isSent ? 'text-white' : 'text-gray-800'}`} numberOfLines={1}>
                                {message.fileName}
                            </Text>
                            <Text style={tw`text-xs ${message.isSent ? 'text-white opacity-80' : 'text-gray-600'}`}>
                                {message.fileSize}
                            </Text>
                        </View>
                        <Feather name="download" size={20} color={message.isSent ? "white" : "#4F46E5"} />
                    </TouchableOpacity>
                );

            case 'audio':
                return (
                    <TouchableOpacity
                        style={tw`flex-row items-center bg-opacity-20 ${message.isSent ? 'bg-white' : 'bg-indigo-100'} p-3 rounded-lg`}
                        onPress={() => {
                            // Play audio
                        }}
                    >
                        <View style={tw`w-10 h-10 rounded-full ${message.isSent ? 'bg-white' : 'bg-indigo-100'} items-center justify-center`}>
                            <Feather name="play" size={20} color={message.isSent ? "#4F46E5" : "#4F46E5"} />
                        </View>
                        <View style={tw`ml-3 flex-1`}>
                            <View style={tw`w-40 h-2 ${message.isSent ? 'bg-white opacity-50' : 'bg-gray-300'} rounded-full`} />
                            <Text style={tw`text-xs mt-1 ${message.isSent ? 'text-white opacity-80' : 'text-gray-600'}`}>
                                {message.audioDuration}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );

            default:
                return (
                    <Text style={tw`${message.isSent ? 'text-white' : 'text-gray-800'}`}>
                        {message.text}
                    </Text>
                );
        }
    };

    return (
        <KeyboardAvoidingView
            style={tw`flex-1 bg-white`}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <View style={tw`bg-white border-b border-gray-200 px-4 pt-12 pb-3 flex-row items-center`}>
                <TouchableOpacity
                    style={tw`p-2 -ml-2`}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#4F46E5" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={tw`flex-row items-center flex-1 ml-2`}
                    onPress={() => {
                        // Navigate to user profile or info
                        // navigation.navigate('UserProfile', { userId: user.id });
                    }}
                >
                    {/* Use a default icon instead of avatar */}
                    <View style={tw`w-10 h-10 rounded-full bg-indigo-100 items-center justify-center`}>
                        <Feather name="user" size={20} color="#4F46E5" />
                    </View>

                    <View style={tw`ml-3`}>
                        <Text style={tw`font-bold text-gray-800`}>{user.name}</Text>
                        {isTyping ? (
                            <Text style={tw`text-xs text-green-600`}>Digitando...</Text>
                        ) : (
                            <Text style={tw`text-xs text-gray-500`}>
                                {/* Use a static status or another property if available */}
                                Disponível
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>

                <View style={tw`flex-row items-center`}>
                    <TouchableOpacity style={tw`p-2 mr-1`}>
                        <Feather name="phone" size={20} color="#4F46E5" />
                    </TouchableOpacity>
                    <TouchableOpacity style={tw`p-2`}>
                        <Feather name="more-vertical" size={20} color="#4F46E5" />
                    </TouchableOpacity>
                </View>
            </View>


            <View style={tw`flex-1 p-4`}>
                <ScrollView
                    ref={scrollViewRef}
                    style={tw`flex-1`}
                    contentContainerStyle={tw`pb-2`}
                    onContentSizeChange={() => isScrolledToBottom && scrollToBottom()}
                >
                    {messages.map((message, index) => (
                        <React.Fragment key={message.id}>
                            {/* Date header code would go here */}

                            <View style={tw`${message.isSent ? 'self-end' : 'self-start'} max-w-3/4 mb-2`}>
                                <View style={tw`
                                ${message.isSent
                                        ? 'bg-indigo-600 rounded-tl-xl rounded-tr-xl rounded-bl-xl'

                                        : 'bg-white border border-gray-200 rounded-tl-xl rounded-tr-xl rounded-br-xl'} 
                                p-3 shadow-sm
                                ${message.contentType !== 'text' ? 'overflow-hidden' : ''}
                            `}>
                                    {renderMessageContent(message)}
                                </View>

                                <View style={tw`flex-row items-center ${message.isSent ? 'justify-end' : 'justify-start'} mt-1`}>
                                    <Text style={tw`text-xs text-gray-500 mr-1`}>
                                        {formatMessageTime(message.timestamp)}
                                    </Text>
                                    {message.isSent && (
                                        <Ionicons
                                            name={message.isRead ? "checkmark-done" : "checkmark"}
                                            size={16}
                                            color={message.isRead ? "#4CAF50" : "#9CA3AF"}
                                        />
                                    )}
                                </View>
                            </View>
                        </React.Fragment>
                    ))}
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

                        <TouchableOpacity style={tw`items-center mr-4`} onPress={() => {
                            // Launch camera
                            ImagePicker.launchCameraAsync({
                                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                allowsEditing: true,
                                quality: 0.8,
                            }).then(result => {
                                if (!result.canceled && result.assets && result.assets.length > 0) {
                                    const asset = result.assets[0];
                                    FileSystem.getInfoAsync(asset.uri).then(fileInfo => {
                                        // Check if file exists and size is available
                                        const fileSize = fileInfo.exists && 'size' in fileInfo
                                            ? `${(fileInfo.size / 1024 / 1024).toFixed(2)} MB`
                                            : "Unknown";

                                        sendFileMessage({
                                            contentType: 'image',
                                            fileUrl: asset.uri,
                                            fileName: 'camera_image.jpg',
                                            fileSize,
                                            fileThumbnail: asset.uri
                                        });
                                    });
                                }
                                setShowAttachmentOptions(false);
                            }).catch(error => {
                                console.log('Error taking photo:', error);
                                setShowAttachmentOptions(false);
                            });
                        }}>
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
                            <View style={tw`w-3 h-3 rounded-full bg-red-500 mr-2 animate-pulse`} />
                            <Text style={tw`text-red-600 font-medium`}>Gravando áudio</Text>
                        </View>
                        <Text style={tw`text-red-600`}>
                            {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:
                            {(recordingDuration % 60).toString().padStart(2, '0')}
                        </Text>
                        <TouchableOpacity onPress={cancelRecording}>
                            <Text style={tw`text-red-600 font-medium`}>Cancelar</Text>
                        </TouchableOpacity>
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
                            placeholder="Mensagem"
                            style={tw`flex-1 text-gray-700 max-h-[100px]`}
                            value={newMessage}
                            onChangeText={setNewMessage}
                            multiline
                        />
                        <TouchableOpacity style={tw`ml-2`} onPress={toggleEmojiPicker}>
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
                            showHistory={true}
                            columns={8}
                        />
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

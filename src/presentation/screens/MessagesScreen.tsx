import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Image, TouchableOpacity, Animated, Platform, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import tw from "twrnc";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useChatContext } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { useAuthState } from "../../hooks/useAuthState";
import { useConnections } from "../../hooks/useConnections";
import { useSessions } from "../../hooks/useSessions";
import { IChatResponse, ChatType } from "../../interfaces/chat.interface";
import { chatUtils } from "../../utils/chatUtils";
import { UserRole } from "@/src/interfaces/index.interface";
import { SessionType } from "../../interfaces/sessions.interface";

type RootStackParamList = {
  ChatScreen: { chat: IChatResponse };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedChatType, setSelectedChatType] = useState<"all" | "general" | "session">("all");
  const navigation = useNavigation<NavigationProp>();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [hideHeader, setHideHeader] = useState(false);

  const { user } = useAuth();
  const isMentor = user?.role === UserRole.MENTOR;
  const { getUserFriends } = useConnections();
  const { createSession } = useSessions();
  
  // State for friends list
  const [friends, setFriends] = useState<any[]>([]);
  const {
    chats,
    isLoading,
    error,
    loadChats,
    selectChat,
    markAsRead,
    onlineUsers,
    clearError,
    refreshChats,
    isUserTyping,
    createChat
  } = useChatContext();

  // Load friends when component mounts
  useEffect(() => {
    const loadFriends = async () => {
      if (user?.uid) {
        try {
          const friendsResponse = await getUserFriends(user.uid);
          setFriends(friendsResponse.connections || []);
        } catch (error) {
          console.error('Error loading friends:', error);
        }
      }
    };
    loadFriends();
  }, [user?.uid ]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleChatOpen = async (chat: IChatResponse) => {
    try {
      selectChat(chat);

      // Mark messages as read if there are unread messages
      if (chat.unreadCount > 0) {
        await markAsRead(chat.id);
      }

      navigation.navigate('ChatScreen', { chat });
    } catch (error) {
      console.error('Error opening chat:', error);
      Alert.alert('Erro', 'Não foi possível abrir a conversa');
    }
  };

  const lastSender = (senderId: string | undefined) => {
   if(senderId && user && senderId === user?.uid) return 'Você: ';
   return "";
  };

  // Start a new general chat with a user
  const handleStartNewChat = async (participant: any) => {
  try {
  // Create a general chat
  const newChat = await createChat({
  type: ChatType.GENERAL,
  participantId: participant.uid
  });

  // Navigate to the chat
  navigation.navigate('ChatScreen', { chat: newChat });
  } catch (error: any) {
  console.error('Error starting new chat:', error);
  Alert.alert('Erro', 'Falha ao iniciar conversa');
  }
  };

  // Start a new session (mentors only)
  const handleStartNewSession = async () => {
    try {
      if (!isMentor) {
        Alert.alert('Erro', 'Apenas mentores podem criar sessões');
        return;
      }

      // Show session creation options
      Alert.alert(
        'Nova Sessão',
        'Que tipo de sessão deseja criar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Individual',
            onPress: () => createSessionWithType(SessionType.INDIVIDUAL)
          },
          {
            text: 'Grupo',
            onPress: () => createSessionWithType(SessionType.GROUP)
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Erro', 'Falha ao criar sessão');
    }
  };

  // Create session with specific type
  const createSessionWithType = async (sessionType: SessionType) => {
    try {
      // Get available mentees from friends
      const mentees = friends.filter(friend => friend.connectedUser.role === UserRole.MENTEE);
      
      if (mentees.length === 0) {
        Alert.alert('Aviso', 'Você precisa ter conexões com mentees para criar uma sessão');
        return;
      }

      // For now, create with first mentee - TODO: Show selection modal
      const firstMentee = mentees[0].connectedUser;
      
      const sessionData = {
        title: `Sessão ${sessionType === SessionType.INDIVIDUAL ? 'Individual' : 'em Grupo'}`,
        description: 'Sessão criada pelo chat',
        type: sessionType,
        duration: 60, // Default 60 minutes
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        menteeIds: [firstMentee.uid]
      };

      const newSession = await createSession(sessionData);
      
      // Create session chat
      const sessionChat = await createChat({
        type: ChatType.SESSION,
        participantId: firstMentee.uid,
        sessionId: newSession.id,
        title: `Sessão: ${newSession.title}`
      });

      // Navigate to session chat
      navigation.navigate('ChatScreen', { chat: sessionChat });
      
      Alert.alert('Sucesso', 'Sessão criada com sucesso!');
    } catch (error: any) {
      console.error('Error creating session:', error);
      Alert.alert('Erro', error.message || 'Falha ao criar sessão');
    }
  };

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      setHideHeader(value > 20);
    });
    
    return () => {
      scrollY.removeListener(listener);
    };
  }, []);

  const getUnreadCount = (chat: IChatResponse) => {
    return chat.unreadCount;
  };
  // Filter chats based on search query, filter selection, and chat type
  const filteredChats = chats.filter(chat => {
    const otherParticipant = chatUtils.getOtherParticipant(chat, user?.uid || '');
    const chatTitle = chatUtils.getChatTitle(chat, user?.uid || '');

    const matchesSearch = chatTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase()) || false);

    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "unread" && getUnreadCount(chat) > 0) ||
      (selectedFilter === "read" && getUnreadCount(chat) === 0);

    const matchesChatType =
      selectedChatType === "all" ||
      (selectedChatType === "general" && chat.type === ChatType.GENERAL) ||
      (selectedChatType === "session" && chat.type === ChatType.SESSION);

    return matchesSearch && matchesFilter && matchesChatType;
  });

  // Get status indicator color
  const getStatusColor = (participantId: string) => {
    const isOnline = onlineUsers.includes(participantId);
    return isOnline ? "bg-green-500" : "bg-gray-400";
  };

  // Get comprehensive active users list: includes chat participants AND all friends
  const activeParticipants = React.useMemo(() => {
    // Get participants from existing chats
    const chatParticipants = chats
      .map(chat => chatUtils.getOtherParticipant(chat, user?.uid || ''))
      .filter(participant => participant);

    // Get friends from connections
    const friendUsers = friends.map(friend => friend.connectedUser);

    // Combine and deduplicate by uid
    const allUsers = [...chatParticipants, ...friendUsers]
      .reduce((unique: any[], participant) => {
        if (participant && !unique.some(p => p?.uid === participant.uid)) {
          unique.push(participant);
        }
        return unique;
      }, []);

    // Show online users first, then offline friends (but only if mentor is also online for active status)
    return allUsers
      .filter(participant => {
        const isOnline = onlineUsers.includes(participant.uid);
        // For mentors: show online status only when mentor is also online
        // For mentees: show all friends regardless of mentor status
        if (isMentor) {
          return isOnline; // Mentors see only online users
        } else {
          return true; // Mentees see all friends (both online and offline)
        }
      })
      .slice(0, 15); // Limit to 15 users
  }, [chats, friends, onlineUsers, user?.uid, isMentor]);

  const handleRefresh = useCallback(async () => {
    try {
      console.log('Manual refresh triggered');
      await loadChats();
    } catch (error) {
      console.error('Error refreshing chats:', error);
    }
  }, [loadChats]);

  // Auto-refresh when screen comes into focus (throttled to prevent excessive calls)
  const lastFocusTime = useRef<number>(0);
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFocusTime.current > 1000) { // Throttle to once per second
        console.log('MessagesScreen focused, refreshing chats');
        handleRefresh();
        lastFocusTime.current = now;
      }
    }, [handleRefresh])
  );

  // Real-time updates are handled via WebSocket in ChatContext
  // No polling needed - all updates come through socket events

  if (isLoading && chats.length === 0) {
    return (
      <View style={tw`flex-1 bg-gray-50 justify-center items-center`}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={tw`mt-4 text-gray-600`}>Carregando conversas...</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Header */}
      <View style={tw`pt-2 pb-1 border border-1 border-gray-300 bg-white shadow-sm`}>
        <View style={tw`flex-row justify-between items-center mx-5`}>
          <Text style={tw`text-2xl font-bold text-gray-800`}>Mensagens</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Feather name="refresh-cw" size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* Active Users */}
        {activeParticipants.length > 0 && (
          <View style={tw`bg-white`}>
            <Text style={tw`text-sm font-medium text-gray-600 mx-5 mb-2`}>
              {isMentor ? 'Usuários Online' : 'Amigos'}
            </Text>
            <Animated.View style={tw`bg-white overflow-hidden`}>
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={tw`px-5`}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
            >
              {activeParticipants.map((participant, index) => (
                <TouchableOpacity
                  key={`active-${participant!.uid}-${index}`}
                  style={tw`items-center mr-2`}
                  onPress={async () => {
                    const existingChat = chats.find(c =>
                      chatUtils.getOtherParticipant(c, user?.uid || '')?.uid === participant!.uid
                    );
                    
                    if (existingChat) {
                      // Open existing chat
                      handleChatOpen(existingChat);
                    } else {
                      // Start new general chat
                      await handleStartNewChat(participant);
                    }
                  }}
                >
                  <View style={tw`relative`}>
                    {participant!.image ? (
                      <Image source={{ uri: participant!.image }} style={tw`w-16 h-16 rounded-full border-2 border-white`} />
                    ) : (
                      <View style={tw`w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white`}>
                        <Text style={tw`text-xl font-bold text-indigo-600`}>{participant!.fullName[0]}</Text>
                      </View>
                    )}
                    <View style={tw`absolute bottom-0 right-0 w-4 h-4 rounded-full ${getStatusColor(participant!.uid)} border-2 border-white`} />
                  </View>
                  <Text style={tw`text-xs mt-1 font-medium text-gray-800`} numberOfLines={1}>
                    {participant!.fullName.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.ScrollView>

            {/* Gradient fade effect for scroll indication */}
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
              start={{ x: 0.9, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={tw`absolute right-0 top-0 bottom-0 w-10`}
            />
          </Animated.View>
          </View>
        )}

        {/* Search Bar */}
        <View style={tw`mt-1 flex-row items-center bg-gray-100 px-4 py-1 rounded-full mx-5`}>
          <Feather name="search" size={20} color="gray" />
          <TextInput
            placeholder="Buscar conversas..."
            style={tw`flex-1 ml-2 text-gray-700`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color="gray" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Tabs */}
        <View style={tw`flex-row justify-between mt-4 mx-5`}>
          {/* Chat Type Tabs */}
          <View style={tw`flex-row justify-start`}>
            <TouchableOpacity
              style={tw`mr-4 pb-2 ${selectedChatType === "all" ? "border-b-2 border-indigo-600" : ""}`}
              onPress={() => setSelectedChatType("all")}
            >
              <Text style={tw`${selectedChatType === "all" ? "text-indigo-600 font-medium" : "text-gray-500"}`}>
                Todas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`mr-4 pb-2 ${selectedChatType === "general" ? "border-b-2 border-indigo-600" : ""}`}
              onPress={() => setSelectedChatType("general")}
            >
              <Text style={tw`${selectedChatType === "general" ? "text-indigo-600 font-medium" : "text-gray-500"}`}>
                Geral
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`mr-4 pb-2 ${selectedChatType === "session" ? "border-b-2 border-indigo-600" : ""}`}
              onPress={() => setSelectedChatType("session")}
            >
              <Text style={tw`${selectedChatType === "session" ? "text-indigo-600 font-medium" : "text-gray-500"}`}>
                Sessões
              </Text>
            </TouchableOpacity>
          </View>

          {/* Read Status Tabs */}
          <View style={tw`flex-row justify-end`}>
            <TouchableOpacity
              style={tw`mr-4 pb-2 ${selectedFilter === "all" ? "border-b-2 border-green-500" : ""}`}
              onPress={() => setSelectedFilter("all")}
            >
              <Text style={tw`${selectedFilter === "all" ? "text-green-600 font-medium" : "text-gray-500"}`}>
                Todas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`mr-4 pb-2 ${selectedFilter === "unread" ? "border-b-2 border-orange-500" : ""}`}
              onPress={() => setSelectedFilter("unread")}
            >
              <Text style={tw`${selectedFilter === "unread" ? "text-orange-600 font-medium" : "text-gray-500"}`}>
                Não lidas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`pb-2 ${selectedFilter === "read" ? "border-b-2 border-gray-500" : ""}`}
              onPress={() => setSelectedFilter("read")}
            >
              <Text style={tw`${selectedFilter === "read" ? "text-gray-600 font-medium" : "text-gray-500"}`}>
                Lidas
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View style={tw`mx-5 mt-2 bg-red-100 p-3 rounded-lg`}>
            <Text style={tw`text-red-700 text-sm`}>{error}</Text>
          </View>
        )}
      </View>

      {/* Conversation List */}
      <Animated.ScrollView
        style={tw`flex-1`}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
      >
        <ScrollView style={tw`flex-1`}>
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => {
              const otherParticipant = chatUtils.getOtherParticipant(chat, user?.uid || '');
              const chatTitle = chatUtils.getChatTitle(chat, user?.uid || '');
              const lastMessagePreview = chatUtils.getLastMessagePreview(chat);
              const isOnline = otherParticipant ? onlineUsers.includes(otherParticipant.uid) : false;
              const isOtherUserTyping = otherParticipant ? isUserTyping(chat.id, otherParticipant.uid) : false;
            
              return (
                <TouchableOpacity
                  key={chat.id}
                  onPress={() => handleChatOpen(chat)}
                  style={tw`px-5 py-2 bg-white mb-1 border-l-4 ${getUnreadCount(chat) > 0 ? 'border-indigo-600' : 'border-transparent'}`}
                >
                  <View style={tw`flex-row items-center`}>
                    {/* Avatar */}
                    <View style={tw`relative`}>
                      {otherParticipant?.image ? (
                        <Image source={{ uri: otherParticipant.image }} style={tw`w-14 h-14 rounded-full`} />
                      ) : (
                        <View style={tw`w-13 h-13 rounded-full bg-indigo-100 flex items-center justify-center`}>
                          <Text style={tw`text-xl font-bold text-indigo-600`}>
                            {otherParticipant?.fullName[0] || chatTitle[0] || 'C'}
                          </Text>
                        </View>
                      )}
                     {chat.type === ChatType.GENERAL && <View style={tw`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'} border-2 border-white`} />}
                    </View>

                    {/* Message Content */}
                    <View style={tw`ml-4 flex-1`}>
                      <View style={tw`flex-row justify-between items-center`}>
                        <Text style={tw`text-md font-semibold text-gray-800`} numberOfLines={1}>
                          {chatTitle}
                        </Text>
                        <Text style={tw`text-xs text-gray-500`}>
                          {chat.lastMessage ? chatUtils.formatMessageTime(chat.lastMessage.timestamp) : ''}
                        </Text>
                      </View>

                      <View style={tw`flex-row items-center mt-1`}>
                        {chat.lastMessage?.senderId === user?.uid && chat.unreadCount > 0 && (
                          <Ionicons
                            name="checkmark-done"
                            size={16}
                            color="#4CAF50"
                            style={tw`mr-1`}
                          />
                        )}
                        <Text
                          style={tw`text-gray-600 flex-1`}
                          numberOfLines={1}
                        >
                          {isOtherUserTyping ? 'Digitando...' : lastSender(chat.lastMessage?.senderId) + lastMessagePreview}
                        </Text>

                        {/* Typing indicator */}
                        {isOtherUserTyping && (
                          <View style={tw`flex-row items-center mr-2`}>
                            <View style={tw`w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse`} />
                            <View style={tw`w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse delay-150`} />
                            <View style={tw`w-2 h-2 bg-green-500 rounded-full animate-pulse delay-300`} />
                          </View>
                        )}

                        {!isOtherUserTyping && getUnreadCount(chat) > 0 && (
                          <View style={tw`bg-indigo-600 min-w-5 h-5 rounded-full flex items-center justify-center ml-2`}>
                            <Text style={tw`text-white text-xs font-medium`}>{String(getUnreadCount(chat))}</Text>
                          </View>
                        )}
                      </View>

                      {/* Session chat indicator */}
                      {chat.type === ChatType.SESSION && (
                        <Text style={tw`text-xs text-indigo-600 mt-1`}>
                          💼 Chat de Sessão
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={tw`flex-1 items-center justify-center py-20`}>
              <Ionicons name="chatbubble-ellipses-outline" size={70} color="#CBD5E0" />
              <Text style={tw`mt-4 text-gray-500 text-lg font-medium`}>
                {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa'}
              </Text>
              <Text style={tw`mt-2 text-gray-400 text-center px-10`}>
                {searchQuery
                  ? `Não encontramos resultados para "${searchQuery}"`
                  : "Inicie uma nova conversa para começar a mensagem"}
              </Text>
              {/* {!searchQuery && (
                <TouchableOpacity
                  style={tw`mt-6 bg-indigo-600 px-6 py-3 rounded-full flex-row items-center`}
                  onPress={() => {
                    // Navigate to create chat screen or show user list
                    // This would need to be implemented based on your navigation structure
                    Alert.alert('Info', 'Funcionalidade de nova mensagem em desenvolvimento');
                  }}
                >
                  <Feather name="edit" size={20} color="white" />
                  <Text style={tw`ml-2 text-white font-medium`}>Nova Mensagem</Text>
                </TouchableOpacity>
              )} */}
            </View>
          )}
        </ScrollView>
      </Animated.ScrollView>

      {/* Floating Action Button for Session Chat (Mentors Only) */}
      {isMentor && selectedChatType === 'session' && (
        <TouchableOpacity
          style={tw`absolute bottom-22 right-6 w-14 h-14 bg-purple-600 rounded-full shadow-lg items-center justify-center`}
          onPress={handleStartNewSession}
        >
          <Feather name="users" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

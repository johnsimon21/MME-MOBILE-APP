import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Image, TouchableOpacity, Animated, Platform, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import tw from "twrnc";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useChatContext } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { IChatResponse, ChatType } from "../../interfaces/chat.interface";
import { chatUtils } from "../../utils/chatUtils";

type RootStackParamList = {
  ChatScreen: { chat: IChatResponse };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "unread" | "read">("all");
  const navigation = useNavigation<NavigationProp>();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [hideHeader, setHideHeader] = useState(false);

  const { user } = useAuth();
  const {
    chats,
    isLoading,
    error,
    loadChats,
    selectChat,
    markAsRead,
    onlineUsers,
    clearError
  } = useChatContext();

  // Load chats when component mounts (removed - ChatContext handles this)

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

  // Filter chats based on search query and filter selection
  const filteredChats = chats.filter(chat => {
    const otherParticipant = chatUtils.getOtherParticipant(chat, user?.uid || '');
    const chatTitle = chatUtils.getChatTitle(chat, user?.uid || '');
    
    const matchesSearch = chatTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "unread" && getUnreadCount(chat) > 0) ||
      (selectedFilter === "read" && getUnreadCount(chat) === 0);

    return matchesSearch && matchesFilter;
  });

  // Get status indicator color
  const getStatusColor = (participantId: string) => {
    const isOnline = onlineUsers.includes(participantId);
    return isOnline ? "bg-green-500" : "bg-gray-400";
  };

  // Get active participants for horizontal scroll
  const activeParticipants = chats
    .map(chat => chatUtils.getOtherParticipant(chat, user?.uid || ''))
    .filter(participant => participant && onlineUsers.includes(participant.uid))
    .slice(0, 10); // Limit to 10 active users

  const handleRefresh = useCallback(async () => {
    try {
      console.log('Manual refresh triggered');
      await loadChats();
    } catch (error) {
      console.error('Error refreshing chats:', error);
    }
  }, [loadChats]);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('MessagesScreen focused, refreshing chats');
      handleRefresh();
    }, [handleRefresh])
  );

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
      <View style={tw`pt-10 pb-1 border border-1 border-gray-300 bg-white shadow-sm`}>
        <View style={tw`flex-row justify-between items-center mx-5`}>
          <Text style={tw`text-2xl font-bold text-gray-800`}>Mensagens</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Feather name="refresh-cw" size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* Active Users */}
        {activeParticipants.length > 0 && (
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
              {activeParticipants.map((participant) => (
                <TouchableOpacity
                  key={participant!.uid}
                  style={tw`items-center mr-2`}
                  onPress={() => {
                    const chat = chats.find(c => 
                      chatUtils.getOtherParticipant(c, user?.uid || '')?.uid === participant!.uid
                    );
                    if (chat) handleChatOpen(chat);
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
        <View style={tw`flex-row mt-4 mx-5`}>
          <TouchableOpacity
            style={tw`mr-4 pb-2 ${selectedFilter === "all" ? "border-b-2 border-indigo-600" : ""}`}
            onPress={() => setSelectedFilter("all")}
          >
            <Text style={tw`${selectedFilter === "all" ? "text-indigo-600 font-medium" : "text-gray-500"}`}>
              Todas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`mr-4 pb-2 ${selectedFilter === "unread" ? "border-b-2 border-indigo-600" : ""}`}
            onPress={() => setSelectedFilter("unread")}
          >
            <Text style={tw`${selectedFilter === "unread" ? "text-indigo-600 font-medium" : "text-gray-500"}`}>
              Não lidas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`pb-2 ${selectedFilter === "read" ? "border-b-2 border-indigo-600" : ""}`}
            onPress={() => setSelectedFilter("read")}
          >
            <Text style={tw`${selectedFilter === "read" ? "text-indigo-600 font-medium" : "text-gray-500"}`}>
              Lidas
            </Text>
          </TouchableOpacity>
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
                      <View style={tw`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'} border-2 border-white`} />
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
                        {chat.lastMessage?.senderId === user?.uid && (
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
                          {lastMessagePreview}
                        </Text>

                        {getUnreadCount(chat) > 0 && (
                          <View style={tw`bg-indigo-600 min-w-5 h-5 rounded-full flex items-center justify-center ml-2`}>
                            <Text style={tw`text-white text-xs font-medium`}>{getUnreadCount(chat)}</Text>
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
              {!searchQuery && (
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
              )}
            </View>
          )}
        </ScrollView>
      </Animated.ScrollView>
    </View>
  );
}

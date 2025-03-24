import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatMessageTime } from "../../utils/dateFormatter";

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isSent: boolean;
  isRead: boolean;
}

export interface User {
  id: number;
  name: string;
  image?: string;
  messages: Message[];
  timestamp: string;
  unreadCount?: number;
  isTyping?: boolean;
}

type RootStackParamList = {
  ChatScreen: { user: User };
};

const users: User[] = [
  {
    id: 1,
    name: "Lukombo Afonso",
    image: "",
    messages: [
      {
        id: "1",
        text: "Tá fx agora é só esperar",
        timestamp: "2025-02-15T08:24",
        isSent: false,
        isRead: true
      },
      {
        id: "2",
        text: "Checa o seu Email",
        timestamp: "2025-02-15T08:24",
        isSent: true,
        isRead: true
      }
    ],
    timestamp: "2025-02-15T08:24",
    unreadCount: 2
  },
  {
    id: 2,
    name: "Ângelo Domingos",
    image: "",
    messages: [
      {
        id: "1",
        text: "Ângelo, cá resolveu os exercícios?",
        timestamp: "2025-02-15T18:24",
        isSent: true,
        isRead: true
      },
      {
        id: "2",
        text: "Sim, já resolvi todos",
        timestamp: "2025-03-08T16:26",
        isSent: false,
        isRead: true
      }
    ],
    timestamp: "2025-02-15T18:24"
  },
  {
    id: 3,
    name: "Talakaka António",
    image: "",
    messages: [
      {
        id: "1",
        text: "Howdy, Simon?",
        timestamp: "2025-02-15T18:24",
        isSent: false,
        isRead: false
      }
    ],
    timestamp: "2025-02-15T18:24",
    unreadCount: 1
  },
  {
    id: 4,
    name: "Miguel Del Castilio",
    image: "",
    messages: [
      {
        id: "1",
        text: "Ontem encontrei o resultado da última equação...",
        timestamp: "2025-02-15T07:10",
        isSent: false,
        isRead: true
      },
      {
        id: "2",
        text: "Qual foi o resultado?",
        timestamp: "2025-02-15T07:15",
        isSent: true,
        isRead: true
      }
    ],
    timestamp: "2025-02-15T07:10"
  },
  {
    id: 5,
    name: "King Dacis",
    image: "",
    messages: [
      {
        id: "1",
        text: "Bro, fizeste commit das últimas features?",
        timestamp: "2025-02-15T15:00",
        isSent: true,
        isRead: false
      }
    ],
    timestamp: "2025-02-15T15:00"
  },
  {
    id: 6,
    name: "Mauro Twister",
    image: "",
    messages: [
      {
        id: "1",
        text: "Vou enviar o código agora",
        timestamp: "2025-02-15T12:00",
        isSent: false,
        isRead: true
      }
    ],
    timestamp: "2025-02-15T12:00",
    isTyping: true
  }
];

const activeUsers = [
  { id: 1, name: "Lukombo", image: "" },
  { id: 2, name: "Ângelo", image: "" },
  { id: 3, name: "Talakaka", image: "" },
  { id: 4, name: "Miguel", image: "" },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation<NavigationProp>();

  const handleChatOpen = (user: User) => {
    navigation.navigate('ChatScreen', {
      user: {
        ...user,
        messages: user.messages
      }
    });
  };

  const getLastMessage = (messages: Message[]) => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return '';

    return lastMessage.isSent ? `Tu: ${lastMessage.text}` : lastMessage.text;
  };

  const getUnreadCount = (messages: Message[]) => {
    return messages.filter(msg => !msg.isSent && !msg.isRead).length;
  };
  

  return (
    <View style={tw`flex-1 bg-white`}>
      <View style={tw`px-4 mt-4 flex-row justify-between items-center`}>
        <Text style={tw`text-xl font-bold`}>Conversas</Text>
        <Ionicons name="menu" size={24} color="black" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mt-4 px-4`}>
        {activeUsers.map((user) => (
          <View key={user.id} style={tw`items-center mr-4`}>
            {user.image ? (
              <Image source={{ uri: user.image }} style={tw`w-12 h-12 rounded-full`} />
            ) : (
              <View style={tw`w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center`}>
                <Text style={tw`text-lg font-bold text-gray-700`}>{user.name[0]}</Text>
              </View>
            )}
            <Text style={tw`text-xs mt-1`}>{user.name}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={tw`px-4 mt-4`}>
        <View style={tw`flex-row items-center bg-gray-200 px-4 py-3 rounded-full`}>
          <TextInput
            placeholder="Buscar mensagem..."
            style={tw`flex-1 text-gray-700`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Ionicons name={searchQuery ? "close-circle" : "search"} size={20} color="gray" onPress={() => setSearchQuery("")} />
        </View>
      </View>

      <ScrollView style={tw`mt-4 px-4`}>
        {users.filter((user) => user.name.toLowerCase().includes(searchQuery.toLowerCase())).map((user) => (
          <TouchableOpacity key={user.id} onPress={() => handleChatOpen(user)}>
            <View style={tw`flex-row items-center bg-white p-4 rounded-lg shadow-md mb-4`}>
              {/* Avatar section stays the same */}

              <View style={tw`ml-4 flex-1`}>
                <Text style={tw`text-lg font-semibold`}>{user.name}</Text>
                <View style={tw`flex-row items-center`}>
                  {user.messages[user.messages.length - 1]?.isSent && (
                    <Ionicons
                      name={user.messages[user.messages.length - 1]?.isRead ? "checkmark-done" : "checkmark"}
                      size={16}
                      color={user.messages[user.messages.length - 1]?.isRead ? "#4CAF50" : "#9CA3AF"}
                      style={tw`mr-1`}
                    />
                  )}
                  <Text
                    style={tw`${user.isTyping ? "text-blue-500" : "text-gray-600"}`}
                    numberOfLines={1}
                  >
                    {user.isTyping ? "escrevendo..." : getLastMessage(user.messages)}
                  </Text>
                </View>
              </View>

              <View style={tw`items-end`}>
                <Text style={tw`text-gray-400 text-xs`}>
                  {formatMessageTime(user.messages[user.messages.length - 1]?.timestamp)}
                </Text>
                {getUnreadCount(user.messages) > 0 && (
                  <View style={tw`bg-blue-500 w-5 h-5 rounded-full flex items-center justify-center mt-1`}>
                    <Text style={tw`text-white text-xs`}>{getUnreadCount(user.messages)}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Pressable style={tw`absolute bottom-8 right-6 bg-blue-500 w-12 h-12 rounded-full flex items-center justify-center shadow-lg`}>
        <Ionicons name="add" size={24} color="white" />
      </Pressable>
    </View>
  );
}
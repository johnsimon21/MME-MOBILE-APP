import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Image, TouchableOpacity, Animated, Platform } from "react-native";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import tw from "twrnc";
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatMessageTime } from "../../utils/dateFormatter";
import { LinearGradient } from 'expo-linear-gradient';

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
  avatar?: string;
  isOnline?: boolean;
  isTyping?: boolean;
  status?: "online" | "offline" | "away";
  lastSeen?: string;
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
    unreadCount: 2,
    status: "online"
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
    timestamp: "2025-02-15T18:24",
    status: "away",
    lastSeen: "1h atrás"
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
    unreadCount: 1,
    status: "online"
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
    timestamp: "2025-02-15T07:10",
    status: "offline",
    lastSeen: "3h atrás"
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
    timestamp: "2025-02-15T15:00",
    status: "online"
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
    isTyping: true,
    status: "online"
  }
];

const activeUsers = [
  { id: 1, name: "Lukombo", image: "", status: "online" },
  { id: 2, name: "Ângelo", image: "", status: "online" },
  { id: 3, name: "Talakaka", image: "", status: "online" },
  { id: 4, name: "Miguel", image: "", status: "away" },
  { id: 5, name: "King", image: "", status: "online" },
  { id: 6, name: "Mauro", image: "", status: "online" },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "unread" | "read">("all");
  const navigation = useNavigation<NavigationProp>();
  const scrollX = useRef(new Animated.Value(0)).current;

  const scrollY = useRef(new Animated.Value(0)).current;
  const [hideHeader, setHideHeader] = useState(false);


  const handleChatOpen = (user: User) => {
    navigation.navigate('ChatScreen', {
      user: {
        ...user,
        messages: user.messages
      }
    });
  };

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      setHideHeader(value > 20);
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, []);


  const getLastMessage = (messages: Message[]) => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return '';

    return lastMessage.isSent ? `Tu: ${lastMessage.text}` : lastMessage.text;
  };

  const getUnreadCount = (messages: Message[]) => {
    return messages.filter(msg => !msg.isSent && !msg.isRead).length;
  };

  // Filter users based on search query and filter selection
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "unread" && getUnreadCount(user.messages) > 0) ||
      (selectedFilter === "read" && getUnreadCount(user.messages) === 0);

    return matchesSearch && matchesFilter;
  });

  // Get status indicator color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "away": return "bg-yellow-500";
      default: return "bg-gray-400";
    }
  };

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Header */}
      <View style={tw` pt-10 pb-4 bg-white shadow-sm`}>
        <View style={tw`flex-row justify-between items-center mx-5`}>
          <Text style={tw`text-2xl font-bold text-gray-800`}>Mensagens</Text>
          {/* <View style={tw`flex-row`}>
            <TouchableOpacity style={tw`mr-4`}>
              <Feather name="edit" size={24} color="#4F46E5" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Feather name="more-vertical" size={24} color="#4F46E5" />
            </TouchableOpacity>
          </View> */}
        </View>

        {/* Active Users */}
        <Animated.View
          style={[
            tw`bg-white overflow-hidden`,
            {
              height: hideHeader ? 0 : undefined,
              opacity: hideHeader ? 0 : 1,
              transform: [{ scaleY: hideHeader ? 0.95 : 1 }],
            }
          ]}
        >

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
            {activeUsers.map((user, index) => (
              <TouchableOpacity
                key={user.id}
                style={tw`items-center mr-6`}
                onPress={() => {
                  const fullUser = users.find(u => u.id === user.id);
                  if (fullUser) handleChatOpen(fullUser);
                }}
              >
                <View style={tw`relative`}>
                  {user.image ? (
                    <Image source={{ uri: user.image }} style={tw`w-16 h-16 rounded-full border-2 border-white`} />
                  ) : (
                    <View style={tw`w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white`}>
                      <Text style={tw`text-xl font-bold text-indigo-600`}>{user.name[0]}</Text>
                    </View>
                  )}
                  <View style={tw`absolute bottom-0 right-0 w-4 h-4 rounded-full ${getStatusColor(user.status)} border-2 border-white`} />
                </View>
                <Text style={tw`text-sm mt-1 font-medium text-gray-800`}>{user.name}</Text>
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

      {/* Search Bar */}
      <View style={tw`mt-1 flex-row items-center bg-gray-100 px-4 py-2 rounded-full mx-5`}>
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
    </View>

      {/* Conversation List */ }
  <Animated.ScrollView
    style={tw`flex-1`}
    scrollEventThrottle={16}
    onScroll={Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: false }
    )}
  >
    <ScrollView style={tw`flex-1`}>
      {filteredUsers.length > 0 ? (
        filteredUsers.map((user) => (
          <TouchableOpacity
            key={user.id}
            onPress={() => handleChatOpen(user)}
            style={tw`px-5 py-4 bg-white mb-1 border-l-4 ${getUnreadCount(user.messages) > 0 ? 'border-indigo-600' : 'border-transparent'}`}
          >
            <View style={tw`flex-row items-center`}>
              {/* Avatar */}
              <View style={tw`relative`}>
                {user.image ? (
                  <Image source={{ uri: user.image }} style={tw`w-14 h-14 rounded-full`} />
                ) : (
                  <View style={tw`w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center`}>
                    <Text style={tw`text-xl font-bold text-indigo-600`}>{user.name[0]}</Text>
                  </View>
                )}
                <View style={tw`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ${getStatusColor(user.status)} border-2 border-white`} />
              </View>

              {/* Message Content */}
              <View style={tw`ml-4 flex-1`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-lg font-semibold text-gray-800`}>{user.name}</Text>
                  <Text style={tw`text-xs text-gray-500`}>
                    {formatMessageTime(user.messages[user.messages.length - 1]?.timestamp)}
                  </Text>
                </View>

                <View style={tw`flex-row items-center mt-1`}>
                  {user.messages[user.messages.length - 1]?.isSent && (
                    <Ionicons
                      name={user.messages[user.messages.length - 1]?.isRead ? "checkmark-done" : "checkmark"}
                      size={16}
                      color={user.messages[user.messages.length - 1]?.isRead ? "#4CAF50" : "#9CA3AF"}
                      style={tw`mr-1`}
                    />
                  )}
                  <Text
                    style={tw`${user.isTyping ? "text-indigo-600 font-medium" : "text-gray-600"} flex-1`}
                    numberOfLines={1}
                  >
                    {user.isTyping ? "escrevendo..." : getLastMessage(user.messages)}
                  </Text>

                  {getUnreadCount(user.messages) > 0 && (
                    <View style={tw`bg-indigo-600 min-w-5 h-5 rounded-full flex items-center justify-center ml-2`}>
                      <Text style={tw`text-white text-xs font-medium`}>{getUnreadCount(user.messages)}</Text>
                    </View>
                  )}
                </View>

                {user.status === "away" && user.lastSeen && (
                  <Text style={tw`text-xs text-gray-400 mt-1`}>
                    Visto por último: {user.lastSeen}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={tw`flex-1 items-center justify-center py-20`}>
          <Ionicons name="chatbubble-ellipses-outline" size={70} color="#CBD5E0" />
          <Text style={tw`mt-4 text-gray-500 text-lg font-medium`}>Nenhuma conversa encontrada</Text>
          <Text style={tw`mt-2 text-gray-400 text-center px-10`}>
            {searchQuery ?
              `Não encontramos resultados para "${searchQuery}"` :
              "Inicie uma nova conversa para começar a mensagem"}
          </Text>
          <TouchableOpacity
            style={tw`mt-6 bg-indigo-600 px-6 py-3 rounded-full flex-row items-center`}
          >
            <Feather name="edit" size={20} color="white" />
            <Text style={tw`ml-2 text-white font-medium`}>Nova Mensagem</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  </Animated.ScrollView>

  {/* Floating Action Button */ }
  <TouchableOpacity
    style={tw`absolute bottom-6 right-6 bg-indigo-600 w-14 h-14 rounded-full flex items-center justify-center shadow-lg`}
  >
    <Feather name="edit" size={24} color="white" />
  </TouchableOpacity>
    </View >
  );
}


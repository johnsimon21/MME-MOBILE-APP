import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Image, Modal, Pressable, Text, TextInput, View } from 'react-native';
import tw from 'twrnc';

import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';

interface User {
    id: number;
    name: string;
    photo: string | null;
}

interface UserDrawerProps {
    visible: boolean;
    onClose: () => void;
    onSelectUser: (user: User) => void;
}

const sampleUsers: User[] = [
    { id: 1, name: "Lukombo Afonso", photo: null },
    { id: 2, name: "Cardoso Manuel", photo: null },
    { id: 3, name: "Lucy Script", photo: null },
    { id: 4, name: "Java Simon", photo: null },
];

export function UserDrawer({ visible, onClose, onSelectUser }: UserDrawerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const navigation = useNavigation();

    // HandleAction function:
    const handleAction = (action: 'message' | 'call', user: User) => {
        if (action === 'call') {
            onClose(); // Close the drawer first
            router.push({
                pathname: '/voice-call',
                params: {
                    userId: user.id.toString(),
                    userName: user.name,
                    userPhoto: user.photo || ''
                }
            });
        } else if (action === 'message') {
            // Format the user data for ChatScreen
            const chatUser = {
                id: user.id,
                name: user.name,
                image: user.photo,
                messages: [], // Start with empty messages or fetch from a service
                timestamp: new Date().toString(),
                unreadCount: 0
            };

            onClose(); // Close the drawer
            console.log('Chat user:', chatUser);
            // Navigate to ChatScreen
            // @ts-ignore - Ignore type checking for navigation
            navigation.navigate('Mensagens', { screen: 'ChatScreen', params: { user: chatUser , startSession: true } });
        }
    };

    const filteredUsers = sampleUsers.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={tw`flex-1 bg-black bg-opacity-50`}>
                <View style={tw`bg-white rounded-t-3xl absolute bottom-0 left-0 right-0 h-3/4 shadow-lg`}>
                    {/* Header */}
                    <View style={tw`flex-row justify-between items-center p-4 border-b border-gray-200`}>
                        <Text style={tw`text-lg font-bold`}>Iniciar Sessão</Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close" size={24} color="#4A4852" />
                        </Pressable>
                    </View>

                    {/* Search Bar */}
                    <View style={tw`px-4 py-3`}>
                        <View style={tw`flex-row items-center bg-gray-100 px-4 py-3 rounded-full border border-gray-200 shadow-sm`}>
                            <Ionicons name="search" size={20} color="#4A4852" />
                            <TextInput
                                placeholder="Buscar usuário..."
                                style={tw`flex-1 ml-2 text-gray-700`}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                                autoCorrect={false}
                                clearButtonMode="while-editing"
                            />
                            {searchQuery.length > 0 && (
                                <Pressable onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color="#4A4852" />
                                </Pressable>
                            )}
                        </View>
                    </View>

                    {/* User List */}
                    <FlatList
                        data={filteredUsers}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={tw`px-4 pb-10`}
                        renderItem={({ item }) => (
                            <Pressable
                                style={tw`flex-row items-center justify-between py-3 border-b border-gray-100`}
                            >
                                <View style={tw`flex-row items-center flex-1`}>
                                    {/* Profile Picture or Avatar */}
                                    <View style={tw`w-12 h-12 bg-gray-200 rounded-full mr-3 items-center justify-center`}>
                                        {item.photo ? (
                                            <Image
                                                source={{ uri: item.photo }}
                                                style={tw`w-12 h-12 rounded-full`}
                                            />
                                        ) : (
                                            <Text style={tw`text-lg font-bold text-gray-500`}>
                                                {item.name.charAt(0)}
                                            </Text>
                                        )}
                                    </View>

                                    {/* User Name */}
                                    <Text style={tw`text-base font-medium`}>{item.name}</Text>
                                </View>

                                {/* Direct Action Icons */}
                                <View style={tw`flex-row`}>
                                    {/* Message Icon */}
                                    <Pressable
                                        style={tw`p-2 mr-2`}
                                        onPress={() => handleAction('message', item)}
                                    >
                                        <MaterialIcons name="message" size={22} color="#4A4852" />
                                    </Pressable>

                                    {/* Call Icon */}
                                    <Pressable
                                        style={tw`p-2`}
                                        onPress={() => handleAction('call', item)}
                                    >
                                        <MaterialIcons name="call" size={22} color="#4A4852" />
                                    </Pressable>
                                </View>
                            </Pressable>
                        )}
                        ListEmptyComponent={() => (
                            <View style={tw`items-center justify-center py-10`}>
                                <Text style={tw`text-gray-500 text-base`}>Nenhum usuário encontrado</Text>
                            </View>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );
}
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function SupportScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const supportOptions = [
        {
            id: 'my-tickets',
            title: 'Meus Tickets',
            description: 'Visualize e acompanhe seus tickets',
            icon: 'inbox',
            color: 'from-indigo-400 to-indigo-600',
            iconBg: 'bg-indigo-100',
            iconColor: '#6366F1'
        },
        {
            id: 'ticket',
            title: 'Criar Ticket',
            description: 'Relate um problema detalhado',
            icon: 'clipboard',
            color: 'from-purple-400 to-purple-600',
            iconBg: 'bg-purple-100',
            iconColor: '#8B5CF6'
        },
        {
            id: 'faq',
            title: 'Perguntas Frequentes',
            description: 'Encontre respostas rápidas para dúvidas comuns',
            icon: 'help-circle',
            color: 'from-blue-400 to-blue-600',
            iconBg: 'bg-blue-100',
            iconColor: '#3B82F6'
        },
        {
            id: 'chat',
            title: 'Chat ao Vivo',
            description: 'Converse com nossa equipe de suporte',
            icon: 'message-circle',
            color: 'from-green-400 to-green-600',
            iconBg: 'bg-green-100',
            iconColor: '#10B981',
            badge: 'Online'
        }
    ];

    const handleSupportOption = (optionId: string) => {
        switch (optionId) {
            case 'my-tickets':
                // Navigate to my tickets
                router.push('/my-tickets');
                break;
            case 'faq':
                // Navigate to FAQ section
                router.push('/faq');
                break;
            case 'chat':
                // Navigate to live chat
                router.push('/chat-support');
                break;
            case 'ticket':
                // Navigate to create ticket
                router.push('/create-ticket');
                break;
        }
    };

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Header */}
            <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={tw`pt-12 pb-6 px-6`}
            >
                <View style={tw`flex-row items-center justify-between mb-4`}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={tw`w-10 h-10 bg-white bg-opacity-20 rounded-full items-center justify-center`}
                    >
                        <Feather name="arrow-left" size={20} color="white" />
                    </TouchableOpacity>

                    <Text style={tw`text-white text-xl font-bold`}>Central de Ajuda</Text>

                    <View style={tw`w-10 h-10`} />
                </View>

                {/* Search Bar */}
                {/* <View style={tw`bg-white bg-opacity-20 rounded-full flex-row items-center px-4 py-3`}>
                    <Feather name="search" size={20} color="white" />
                    <TextInput
                        placeholder="Como podemos ajudar você?"
                        placeholderTextColor="rgba(255,255,255,0.8)"
                        style={tw`flex-1 ml-3 text-white`}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View> */}
            </LinearGradient>

            <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                {/* Support Options */}
                <View style={tw`p-6`}>
                    <Text style={tw`text-xl font-bold text-gray-800 mb-4`}>Como você gostaria de ser atendido?</Text>

                    <View style={tw`flex-row flex-wrap justify-between`}>
                        {supportOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                onPress={() => handleSupportOption(option.id)}
                                style={tw`w-[48%] mb-4`}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={option.color.includes('blue') ? ['#3B82F6', '#1D4ED8'] :
                                        option.color.includes('green') ? ['#10B981', '#059669'] :
                                            option.color.includes('purple') ? ['#8B5CF6', '#7C3AED'] :
                                                ['#F59E0B', '#D97706']}
                                    style={tw`rounded-2xl p-4 h-42 justify-between relative overflow-hidden`}
                                >
                                    {/* Background Pattern */}
                                    <View style={tw`absolute -top-4 -right-4 w-16 h-16 bg-white bg-opacity-10 rounded-full`} />
                                    <View style={tw`absolute -bottom-2 -left-2 w-12 h-12 bg-white bg-opacity-10 rounded-full`} />

                                    {/* Badge */}
                                    {option.badge && (
                                        <View style={tw`absolute top-3 right-3 bg-white bg-opacity-20 px-2 py-1 rounded-full`}>
                                            <Text style={tw`text-white text-xs font-medium`}>{option.badge}</Text>
                                        </View>
                                    )}

                                    {/* Icon */}
                                    <View style={tw`w-12 h-12 bg-white bg-opacity-20 rounded-full items-center justify-center`}>
                                        <Feather name={option.icon as any} size={24} color="white" />
                                    </View>

                                    {/* Content */}
                                    <View>
                                        <Text style={tw`text-white font-bold text-base mb-1`}>{option.title}</Text>
                                        <Text style={tw`text-white text-opacity-90 text-xs leading-4`}>{option.description}</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { SupportTab } from '@/src/types/support.types';

interface HelpCenterProps {
    onTabChange: (tab: SupportTab) => void; // Changed from string to SupportTab
}

export function HelpCenter({ onTabChange }: HelpCenterProps) {
    const quickActions = [
        { title: 'Criar Ticket', desc: 'Relatar um problema', icon: 'plus-circle', action: () => onTabChange('tickets') },
        { title: 'Chat ao Vivo', desc: 'Falar com suporte', icon: 'message-circle', action: () => onTabChange('chat') },
        { title: 'Perguntas Frequentes', desc: 'Respostas rápidas', icon: 'help-circle', action: () => onTabChange('faq') }
    ];

    const popularTopics = [
        { title: 'Problemas de Login', desc: 'Recuperar acesso à conta', icon: 'lock' },
        { title: 'Gerenciar Sessões', desc: 'Agendar e modificar sessões', icon: 'calendar' },
        { title: 'Problemas de Conexão', desc: 'Resolver problemas técnicos', icon: 'wifi-off' },
        { title: 'Configurações de Conta', desc: 'Alterar perfil e preferências', icon: 'settings' }
    ];

    return (
        <ScrollView style={tw`flex-1 bg-gray-50`} showsVerticalScrollIndicator={false}>
            {/* Welcome Section */}
            <View style={tw`bg-gradient-to-r from-blue-500 to-purple-600 p-6 m-4 rounded-xl`}>
                <Text style={tw`text-white text-2xl font-bold mb-2`}>Como podemos ajudar?</Text>
                <Text style={tw`text-blue-100 text-base`}>
                    Encontre respostas rápidas ou entre em contato conosco
                </Text>
            </View>

            {/* Quick Actions */}
            <View style={tw`px-4 mb-6`}>
                <Text style={tw`text-lg font-bold mb-4`}>Ações Rápidas</Text>
                <View style={tw`flex-row justify-between`}>
                    {quickActions.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={action.action}
                            style={tw`bg-white p-4 rounded-xl flex-1 mx-1 shadow-sm items-center`}
                        >
                            <View style={tw`w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-3`}>
                                <Feather name={action.icon as any} size={24} color="#4F46E5" />
                            </View>
                            <Text style={tw`font-semibold text-center text-gray-800 mb-1`}>
                                {action.title}
                            </Text>
                            <Text style={tw`text-xs text-gray-500 text-center`}>
                                {action.desc}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Popular Topics */}
            <View style={tw`px-4 mb-6`}>
                <Text style={tw`text-lg font-bold mb-4`}>Tópicos Populares</Text>
                {popularTopics.map((topic, index) => (
                    <TouchableOpacity
                        key={index}
                        style={tw`bg-white p-4 rounded-xl mb-3 flex-row items-center shadow-sm`}
                    >
                        <View style={tw`w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-4`}>
                            <Feather name={topic.icon as any} size={20} color="#4F46E5" />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`font-semibold text-gray-800`}>{topic.title}</Text>
                            <Text style={tw`text-gray-500 text-sm mt-1`}>{topic.desc}</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#6B7280" />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Contact Options */}
            <View style={tw`px-4 mb-6`}>
                <Text style={tw`text-lg font-bold mb-4`}>Entre em Contato</Text>
                <View style={tw`bg-white rounded-xl p-4 shadow-sm`}>
                    <View style={tw`flex-row items-center justify-between mb-4`}>
                        <View style={tw`flex-row items-center`}>
                            <View style={tw`w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3`}>
                                <Feather name="message-circle" size={20} color="#10B981" />
                            </View>
                            <View>
                                <Text style={tw`font-semibold`}>Chat ao Vivo</Text>
                                <Text style={tw`text-green-600 text-sm`}>Online agora</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => onTabChange('chat')}
                            style={tw`bg-green-500 px-4 py-2 rounded-lg`}
                        >
                            <Text style={tw`text-white font-medium`}>Iniciar</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={tw`border-t border-gray-200 pt-4`}>
                        <View style={tw`flex-row items-center justify-between`}>
                            <View style={tw`flex-row items-center`}>
                                <View style={tw`w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3`}>
                                    <Feather name="mail" size={20} color="#3B82F6" />
                                </View>
                                <View>
                                    <Text style={tw`font-semibold`}>Email</Text>
                                    <Text style={tw`text-gray-500 text-sm`}>suporte@mme.com</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={tw`bg-blue-500 px-4 py-2 rounded-lg`}>
                                <Text style={tw`text-white font-medium`}>Enviar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

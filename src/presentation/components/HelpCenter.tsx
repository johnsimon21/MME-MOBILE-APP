import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { SupportTab } from '@/src/types/support.types';
import { useSupport } from '@/src/context/SupportContext';

interface HelpCenterProps {
    onTabChange: (tab: SupportTab) => void;
    isAdmin?: boolean;
}

export function HelpCenter({ onTabChange, isAdmin = false }: HelpCenterProps) {
    const { admin } = useSupport();
    const adminActions = [
        { 
            title: 'Gerenciar Tickets', 
            desc: 'Visualizar e responder tickets', 
            icon: 'clipboard', 
            action: () => onTabChange('tickets'),
            bg_color: 'bg-blue-200',
            text_color: 'text-blue-800',
        },
        { 
            title: 'Chat ao Vivo', 
            desc: 'Atender usuários em tempo real', 
            icon: 'message-circle', 
            action: () => onTabChange('chat'),
            bg_color: 'bg-green-200',
            text_color: 'text-green-800',
        },
        { 
            title: 'Gerenciar FAQ', 
            desc: 'Adicionar e editar perguntas', 
            icon: 'help-circle', 
            action: () => onTabChange('faq'),
            bg_color: 'bg-purple-200',
            text_color: 'text-purple-800',
        }
    ];

    const userActions = [
        { title: 'Criar Ticket', desc: 'Relatar um problema', icon: 'plus-circle', action: () => onTabChange('tickets') },
        { title: 'Chat ao Vivo', desc: 'Falar com suporte', icon: 'message-circle', action: () => onTabChange('chat') },
        { title: 'Perguntas Frequentes', desc: 'Respostas rápidas', icon: 'help-circle', action: () => onTabChange('faq') }
    ];

    // Real admin stats from backend
    const adminStats = [
        { 
            label: 'Tickets Abertos', 
            value: admin.stats?.tickets?.open?.toString() || '0', 
            icon: 'alert-circle', 
            color: 'text-red-600' 
        },
        { 
            label: 'Em Andamento', 
            value: admin.stats?.tickets?.inProgress?.toString() || '0', 
            icon: 'clock', 
            color: 'text-yellow-600' 
        },
        { 
            label: 'Resolvidos', 
            value: admin.stats?.tickets?.resolved?.toString() || '0', 
            icon: 'check-circle', 
            color: 'text-green-600' 
        },
        { 
            label: 'FAQs Ativas', 
            value: admin.stats?.faqs?.active?.toString() || '0', 
            icon: 'help-circle', 
            color: 'text-blue-600' 
        }
    ];

    const recentActivity = [
        { action: 'Ticket #1234 foi resolvido', time: '5 min atrás', icon: 'check-circle' },
        { action: 'Nova mensagem no chat', time: '12 min atrás', icon: 'message-circle' },
        { action: 'FAQ atualizada', time: '1 hora atrás', icon: 'edit' },
        { action: 'Ticket #1233 criado', time: '2 horas atrás', icon: 'plus-circle' }
    ];

    if (isAdmin) {
        return (
            <ScrollView style={tw`flex-1 bg-gray-50`} showsVerticalScrollIndicator={false}>
                {/* Admin Welcome */}
                <View style={tw`bg-gradient-to-r from-blue-600 to-purple-600 p-6 m-4 rounded-xl`}>
                    <Text style={tw`text-white text-2xl font-bold mb-2`}>Painel de Suporte</Text>
                    <Text style={tw`text-blue-100 text-base`}>
                        Gerencie tickets, responda usuários e mantenha a base de conhecimento
                    </Text>
                </View>

                {/* Stats */}
                <View style={tw`px-4 mb-6`}>
                    <View style={tw`flex-row items-center justify-between mb-4`}>
                        <Text style={tw`text-lg font-bold`}>Estatísticas</Text>
                        {admin.isLoadingStats && (
                            <Text style={tw`text-blue-500 text-sm`}>Atualizando...</Text>
                        )}
                        <TouchableOpacity 
                            onPress={() => admin.loadStats('month')}
                            style={tw`p-2`}
                        >
                            <Feather name="refresh-cw" size={16} color="#4F46E5" />
                        </TouchableOpacity>
                    </View>
                    <View style={tw`flex-row flex-wrap justify-between`}>
                        {adminStats.map((stat, index) => (
                            <View key={index} style={tw`bg-white p-4 rounded-xl w-[48%] mb-3 shadow-sm`}>
                                <View style={tw`flex-row items-center justify-between mb-2`}>
                                    <Feather name={stat.icon as any} size={20} color="#6B7280" />
                                    <Text style={tw`text-2xl font-bold ${stat.color}`}>{stat.value}</Text>
                                </View>
                                <Text style={tw`text-gray-600 text-sm`}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Admin Actions */}
                <View style={tw`px-4 mb-6`}>
                    <Text style={tw`text-lg font-bold mb-4`}>Ações Principais</Text>
                    <View style={tw`flex-row justify-between`}>
                        {adminActions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={action.action}
                                style={tw`bg-white p-4 rounded-xl flex-1 mx-1 shadow-sm items-center`}
                            >
                                <View style={tw`w-12 h-12 ${action.bg_color} rounded-full items-center justify-center mb-3`}>
                                    <Feather name={action.icon as any} size={24} color="black" style={tw`${action.text_color}`}/>
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

                {/* Recent Activity */}
                <View style={tw`px-4 mb-6`}>
                    <Text style={tw`text-lg font-bold mb-4`}>Atividade Recente</Text>
                    <View style={tw`bg-white rounded-xl shadow-sm`}>
                        {recentActivity.map((activity, index) => (
                            <View key={index} style={tw`p-4 ${index < recentActivity.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                <View style={tw`flex-row items-center`}>
                                    <View style={tw`w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-3`}>
                                        <Feather name={activity.icon as any} size={16} color="#6B7280" />
                                    </View>
                                    <View style={tw`flex-1`}>
                                        <Text style={tw`text-gray-800 font-medium`}>{activity.action}</Text>
                                        <Text style={tw`text-gray-500 text-sm`}>{activity.time}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Quick Tools */}
                <View style={tw`px-4 mb-6`}>
                    <Text style={tw`text-lg font-bold mb-4`}>Ferramentas Rápidas</Text>
                    <View style={tw`bg-white rounded-xl p-4 shadow-sm`}>
                        <TouchableOpacity style={tw`flex-row items-center justify-between py-3 border-b border-gray-100`}>
                            <View style={tw`flex-row items-center`}>
                                <Feather name="download" size={20} color="#4F46E5" />
                                <Text style={tw`ml-3 font-medium`}>Exportar Relatórios</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#6B7280" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={tw`flex-row items-center justify-between py-3 border-b border-gray-100`}>
                            <View style={tw`flex-row items-center`}>
                                <Feather name="settings" size={20} color="#4F46E5" />
                                <Text style={tw`ml-3 font-medium`}>Configurações do Suporte</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#6B7280" />
                        </TouchableOpacity>
                        
                                             <TouchableOpacity style={tw`flex-row items-center justify-between py-3`}>
                            <View style={tw`flex-row items-center`}>
                                <Feather name="users" size={20} color="#4F46E5" />
                                <Text style={tw`ml-3 font-medium`}>Gerenciar Usuários</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        );
    }

    // User view (original)
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
                    {userActions.map((action, index) => (
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

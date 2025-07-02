import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    helpful: number;
    notHelpful: number;
    isExpanded?: boolean;
}

export default function FAQScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [faqs, setFaqs] = useState<FAQ[]>([
        {
            id: '1',
            question: 'Como criar uma nova sessão?',
            answer: 'Para criar uma nova sessão, vá até a tela de "Gerenciamento de Sessões", toque no botão "+" e selecione o usuário com quem deseja iniciar a sessão. Você pode escolher entre chat ou chamada de voz.',
            category: 'Sessões',
            helpful: 15,
            notHelpful: 2,
            isExpanded: false
        },
        {
            id: '2',
            question: 'Como enviar arquivos no chat?',
            answer: 'No chat, toque no ícone "+" ao lado do campo de mensagem. Você pode escolher entre enviar imagens da galeria, tirar uma foto, enviar documentos ou gravar áudio.',
            category: 'Comunicação',
            helpful: 23,
            notHelpful: 1,
            isExpanded: false
        },
        {
            id: '3',
            question: 'Posso alterar minha senha?',
            answer: 'Sim! Vá em Configurações > Conta > Alterar Senha. Você precisará inserir sua senha atual e depois a nova senha duas vezes para confirmar.',
            category: 'Conta',
            helpful: 18,
            notHelpful: 0,
            isExpanded: false
        },
        {
            id: '4',
            question: 'O que fazer se a chamada não conectar?',
            answer: 'Verifique sua conexão com a internet. Se o problema persistir, tente reiniciar o aplicativo. Certifique-se também de que você deu permissão para o app usar o microfone.',
            category: 'Técnico',
            helpful: 12,
            notHelpful: 3,
            isExpanded: false
        },
        {
            id: '5',
            question: 'Como visualizar o histórico de sessões?',
            answer: 'Acesse "Gerenciamento de Sessões" e use os filtros para ver sessões concluídas. Você pode ver detalhes como duração, participantes e data de cada sessão.',
            category: 'Sessões',
            helpful: 20,
            notHelpful: 1,
            isExpanded: false
        },
        {
            id: '6',
            question: 'Como ativar notificações?',
            answer: 'Vá em Configurações > Notificações e ative os tipos de notificação que deseja receber. Certifique-se de que as notificações estão habilitadas nas configurações do seu dispositivo.',
            category: 'Geral',
            helpful: 14,
            notHelpful: 2,
            isExpanded: false
        }
    ]);

    const categories = ['Todas', 'Conta', 'Sessões', 'Comunicação', 'Técnico', 'Geral'];

    const filteredFaqs = faqs.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'Todas' || faq.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const toggleFAQ = (id: string) => {
        setFaqs(prev => prev.map(faq =>
            faq.id === id ? { ...faq, isExpanded: !faq.isExpanded } : faq
        ));
    };

    const markHelpful = (id: string, isHelpful: boolean) => {
        setFaqs(prev => prev.map(faq =>
            faq.id === id
                ? {
                    ...faq,
                    helpful: isHelpful ? faq.helpful + 1 : faq.helpful,
                    notHelpful: !isHelpful ? faq.notHelpful + 1 : faq.notHelpful
                }
                : faq
        ));
    };

    const FAQItem = ({ item }: { item: FAQ }) => (
        <View style={tw`bg-white rounded-xl mb-3 shadow-sm border border-gray-100 overflow-hidden`}>
            <TouchableOpacity
                onPress={() => toggleFAQ(item.id)}
                style={tw`p-4`}
                activeOpacity={0.7}
            >
                <View style={tw`flex-row items-start justify-between`}>
                    <View style={tw`flex-1 mr-3`}>
                        <View style={tw`flex-row items-center mb-2`}>
                            <View style={tw`px-2 py-1 bg-blue-100 rounded-full mr-2`}>
                                <Text style={tw`text-blue-800 text-xs font-medium`}>{item.category}</Text>
                            </View>
                            <View style={tw`flex-row items-center`}>
                                <Feather name="thumbs-up" size={12} color="#10B981" />
                                <Text style={tw`text-green-600 text-xs ml-1`}>{item.helpful}</Text>
                            </View>
                        </View>
                        <Text style={tw`font-semibold text-gray-800 leading-5`}>{item.question}</Text>
                    </View>
                    <Feather
                        name={item.isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#6B7280"
                    />
                </View>
            </TouchableOpacity>

            {item.isExpanded && (
                <View style={tw`px-4 pb-4 border-t border-gray-100`}>
                    <Text style={tw`text-gray-600 leading-6 mt-3 mb-4`}>{item.answer}</Text>

                    <View style={tw`flex-row items-center justify-between`}>
                        <Text style={tw`text-gray-500 text-sm`}>Esta resposta foi útil?</Text>
                        <View style={tw`flex-row`}>
                            <TouchableOpacity
                                onPress={() => markHelpful(item.id, true)}
                                style={tw`flex-row items-center bg-green-50 px-3 py-2 rounded-lg mr-2`}
                            >
                                <Feather name="thumbs-up" size={16} color="#10B981" />
                                <Text style={tw`text-green-700 ml-1 text-sm font-medium`}>Sim</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => markHelpful(item.id, false)}
                                style={tw`flex-row items-center bg-red-50 px-3 py-2 rounded-lg`}
                            >
                                <Feather name="thumbs-down" size={16} color="#EF4444" />
                                <Text style={tw`text-red-700 ml-1 text-sm font-medium`}>Não</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Header */}
            <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={tw`pt-12 pb-6 px-6`}
            >
                <View style={tw`flex-row items-center justify-between mb-4`}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={tw`w-10 h-10 bg-white bg-opacity-20 rounded-full items-center justify-center`}
                    >
                        <Feather name="arrow-left" size={20} color="white" />
                    </TouchableOpacity>

                    <Text style={tw`text-white text-xl font-bold`}>Perguntas Frequentes</Text>

                    <View style={tw`w-10 h-10`} />
                </View>

                {/* Search Bar */}
                <View style={tw`bg-white bg-opacity-20 rounded-full flex-row items-center px-4 py-3`}>
                    <Feather name="search" size={20} color="white" />
                    <TextInput
                        placeholder="Buscar perguntas..."
                        placeholderTextColor="rgba(255,255,255,0.8)"
                        style={tw`flex-1 ml-3 text-white`}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Feather name="x" size={20} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>

            {/* Categories */}
            <View style={tw`bg-white border-b border-gray-200`}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={tw`px-6 py-4`}
                >
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category}
                            onPress={() => setSelectedCategory(category)}
                            style={tw`px-4 py-2 rounded-full mr-3 ${selectedCategory === category ? 'bg-blue-500' : 'bg-gray-100'
                                }`}
                        >
                            <Text style={tw`font-medium ${selectedCategory === category ? 'text-white' : 'text-gray-600'
                                }`}>
                                {category}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Results Count */}
            <View style={tw`px-6 py-3 bg-white border-b border-gray-100`}>
                <Text style={tw`text-gray-600 text-sm`}>
                    {filteredFaqs.length} pergunta{filteredFaqs.length !== 1 ? 's' : ''} encontrada{filteredFaqs.length !== 1 ? 's' : ''}
                </Text>
            </View>

            {/* FAQ List */}
            <FlatList
                data={filteredFaqs}
                keyExtractor={(item) => item.id}
                contentContainerStyle={tw`p-6`}
                renderItem={({ item }) => <FAQItem item={item} />}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View style={tw`items-center justify-center py-12`}>
                        <Feather name="search" size={48} color="#9CA3AF" />
                        <Text style={tw`text-gray-500 text-lg mt-4`}>Nenhuma pergunta encontrada</Text>
                        <Text style={tw`text-gray-400 text-sm mt-1 text-center`}>
                            Tente usar palavras-chave diferentes ou selecione outra categoria
                        </Text>
                    </View>
                )}
            />

            {/* Help Footer */}
            <View style={tw`bg-white border-t border-gray-200 p-6`}>
                <View style={tw`bg-blue-50 rounded-xl p-4 flex-row items-center`}>
                    <View style={tw`w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3`}>
                        <Feather name="help-circle" size={24} color="#3B82F6" />
                    </View>
                    <View style={tw`flex-1`}>
                        <Text style={tw`font-semibold text-blue-800`}>Não encontrou sua resposta?</Text>
                        <Text style={tw`text-blue-600 text-sm`}>Entre em contato conosco</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/support')}
                        style={tw`bg-blue-500 px-4 py-2 rounded-lg`}
                    >
                        <Text style={tw`text-white font-medium`}>Contato</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
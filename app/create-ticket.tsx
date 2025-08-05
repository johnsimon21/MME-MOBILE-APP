import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSupport } from '../src/context/SupportContext';
import { ICreateTicketRequest, TicketCategory, TicketPriority } from '../src/interfaces/support.interface';


export default function CreateTicketScreen() {
    const router = useRouter();
    const { tickets } = useSupport();
    const [formData, setFormData] = useState<ICreateTicketRequest>({
        title: '',
        category: TicketCategory.OTHER,
        priority: TicketPriority.MEDIUM,
        description: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = [
        { id: TicketCategory.TECHNICAL, label: 'Problema Técnico', icon: 'tool' },
        { id: TicketCategory.ACCOUNT, label: 'Conta e Perfil', icon: 'user' },
        { id: TicketCategory.BUG_REPORT, label: 'Relatar Bug', icon: 'alert-circle' },
        { id: TicketCategory.BILLING, label: 'Cobrança', icon: 'credit-card' },
        { id: TicketCategory.FEATURE_REQUEST, label: 'Solicitação de Recurso', icon: 'plus-circle' },
        { id: TicketCategory.OTHER, label: 'Outros', icon: 'help-circle' }
    ];

    const priorities = [
        { id: TicketPriority.LOW, label: 'Baixa', color: 'bg-green-100 text-green-800', description: 'Não urgente' },
        { id: TicketPriority.MEDIUM, label: 'Média', color: 'bg-yellow-100 text-yellow-800', description: 'Moderadamente importante' },
        { id: TicketPriority.HIGH, label: 'Alta', color: 'bg-red-100 text-red-800', description: 'Urgente' }
    ];

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.category || !formData.description.trim()) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        setIsSubmitting(true);
        console.log("Ticket Form Data ===> ", formData)
        try {
            const ticketData = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                priority: formData.priority
            };
            
            console.log('Creating ticket with data:', ticketData);
            await tickets.createTicket(ticketData);

            Alert.alert(
                'Ticket Criado!',
                'Seu ticket foi criado com sucesso. Você receberá uma resposta em breve.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível criar o ticket. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateFormData = (field: keyof ICreateTicketRequest, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Header */}
            <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={tw`pt-12 pb-6 px-6`}
            >
                <View style={tw`flex-row items-center justify-between`}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={tw`w-10 h-10 bg-white bg-opacity-20 rounded-full items-center justify-center`}
                    >
                        <Feather name="arrow-left" size={20} color="white" />
                    </TouchableOpacity>

                    <Text style={tw`text-white text-xl font-bold`}>Criar Ticket</Text>

                    <View style={tw`w-10 h-10`} />
                </View>

                <Text style={tw`text-white text-opacity-90 mt-2`}>
                    Descreva seu problema e nossa equipe entrará em contato
                </Text>
            </LinearGradient>

            <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                <View style={tw`p-6`}>
                    {/* title */}
                    <View style={tw`mb-6`}>
                        <Text style={tw`text-gray-800 font-semibold mb-2`}>
                            Assunto <Text style={tw`text-red-500`}>*</Text>
                        </Text>
                        <TextInput
                            style={tw`bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800`}
                            placeholder="Resumo do seu problema"
                            value={formData.title}
                            onChangeText={(value) => updateFormData('title', value)}
                        />
                    </View>

                    {/* Category */}
                    <View style={tw`mb-6`}>
                        <Text style={tw`text-gray-800 font-semibold mb-3`}>
                            Categoria <Text style={tw`text-red-500`}>*</Text>
                        </Text>
                        <View style={tw`flex-row flex-wrap`}>
                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category.id}
                                    onPress={() => updateFormData('category', category.id)}
                                    style={tw`w-[48%] mb-3 mr-[2%] ${formData.category === category.id
                                            ? 'bg-purple-500'
                                            : 'bg-white border border-gray-200'
                                        } rounded-xl p-4`}
                                >
                                    <View style={tw`items-center`}>
                                        <View style={tw`w-12 h-12 ${formData.category === category.id
                                                ? 'bg-white bg-opacity-20'
                                                : 'bg-gray-100'
                                            } rounded-full items-center justify-center mb-2`}>
                                            <Feather
                                                name={category.icon as any}
                                                size={20}
                                                color={formData.category === category.id ? 'white' : '#6B7280'}
                                            />
                                        </View>
                                        <Text style={tw`text-center text-sm font-medium ${formData.category === category.id ? 'text-white' : 'text-gray-800'
                                            }`}>
                                            {category.label}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Priority */}
                    <View style={tw`mb-6`}>
                        <Text style={tw`text-gray-800 font-semibold mb-3`}>Prioridade</Text>
                        <View style={tw`bg-white rounded-xl border border-gray-200 overflow-hidden`}>
                            {priorities.map((priority, index) => (
                                <TouchableOpacity
                                    key={priority.id}
                                    onPress={() => updateFormData('priority', priority.id)}
                                    style={tw`p-4 flex-row items-center justify-between ${index < priorities.length - 1 ? 'border-b border-gray-100' : ''
                                        } ${formData.priority === priority.id ? 'bg-gray-50' : ''}`}
                                >
                                    <View style={tw`flex-row items-center flex-1`}>
                                        <View style={tw`w-4 h-4 rounded-full border-2 ${formData.priority === priority.id
                                                ? 'border-purple-500 bg-purple-500'
                                                : 'border-gray-300'
                                            } mr-3 items-center justify-center`}>
                                            {formData.priority === priority.id && (
                                                <View style={tw`w-2 h-2 bg-white rounded-full`} />
                                            )}
                                        </View>
                                        <View style={tw`flex-1`}>
                                            <Text style={tw`font-medium text-gray-800`}>{priority.label}</Text>
                                            <Text style={tw`text-gray-500 text-sm`}>{priority.description}</Text>
                                        </View>
                                    </View>
                                    <View style={tw`px-2 py-1 rounded-full ${priority.color.split(' ')[0]} ${priority.color.split(' ')[1]}`}>
                                        <Text style={tw`text-xs font-medium ${priority.color.split(' ')[1]}`}>
                                            {priority.label}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Description */}
                    <View style={tw`mb-6`}>
                        <Text style={tw`text-gray-800 font-semibold mb-2`}>
                            Descrição <Text style={tw`text-red-500`}>*</Text>
                        </Text>
                        <TextInput
                            style={tw`bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 h-32`}
                            placeholder="Descreva seu problema em detalhes..."
                            value={formData.description}
                            onChangeText={(value) => updateFormData('description', value)}
                            multiline
                            textAlignVertical="top"
                        />
                        <Text style={tw`text-gray-500 text-sm mt-1`}>
                            {formData.description.length}/500 caracteres
                        </Text>
                    </View>

                    {/* Tips */}
                    <View style={tw`bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6`}>
                        <View style={tw`flex-row items-start`}>
                            <Feather name="info" size={20} color="#3B82F6" style={tw`mr-3 mt-0.5`} />
                            <View style={tw`flex-1`}>
                                <Text style={tw`font-semibold text-blue-800 mb-2`}>Dicas para um melhor atendimento:</Text>
                                <Text style={tw`text-blue-700 text-sm leading-5`}>
                                    • Seja específico sobre o problema{'\n'}
                                    • Inclua passos para reproduzir o erro{'\n'}
                                    • Mencione quando o problema começou{'\n'}
                                    • Anexe capturas de tela se necessário
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        style={tw`${isSubmitting ? 'bg-gray-400' : 'bg-purple-500'
                            } rounded-xl py-4 items-center mb-6`}
                    >
                        <View style={tw`flex-row items-center`}>
                            {isSubmitting && (
                                <View style={tw`w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin`} />
                            )}
                            <Text style={tw`text-white font-semibold text-lg`}>
                                {isSubmitting ? 'Criando Ticket...' : 'Criar Ticket'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

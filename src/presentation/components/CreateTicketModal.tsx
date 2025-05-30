import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { validateTicketData } from '@/src/utils/support.utils';

interface CreateTicketModalProps {
    visible: boolean;
    onClose: () => void;
    onCreateTicket: (ticketData: any) => void;
}

export function CreateTicketModal({ visible, onClose, onCreateTicket }: CreateTicketModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Geral',
        priority: 'medium'
    });

    const categories = ['Conta', 'Sessões', 'Comunicação', 'Técnico', 'Geral'];
    const priorities = [
        { value: 'low', label: 'Baixa', color: 'bg-blue-500' },
        { value: 'medium', label: 'Média', color: 'bg-yellow-500' },
        { value: 'high', label: 'Alta', color: 'bg-orange-500' },
        { value: 'urgent', label: 'Urgente', color: 'bg-red-500' }
    ];

    const handleSubmit = () => {
        const validation = validateTicketData(formData);
        
        if (!validation.isValid) {
            Alert.alert('Erro', validation.errors.join('\n'));
            return;
        }

        onCreateTicket(formData);
        
        // Reset form
        setFormData({
            title: '',
            description: '',
            category: 'Geral',
            priority: 'medium'
        });
    };

    const handleClose = () => {
        // Reset form when closing
        setFormData({
            title: '',
            description: '',
            category: 'Geral',
            priority: 'medium'
        });
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
                <View style={tw`bg-white rounded-t-3xl p-6 max-h-[90%]`}>
                    <View style={tw`flex-row items-center justify-between mb-6`}>
                        <Text style={tw`text-xl font-bold`}>Criar Novo Ticket</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Feather name="x" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Title */}
                        <View style={tw`mb-4`}>
                            <Text style={tw`font-semibold mb-2`}>Título *</Text>
                            <TextInput
                                style={tw`border border-gray-300 rounded-lg px-4 py-3`}
                                placeholder="Descreva brevemente o problema..."
                                value={formData.title}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                            />
                        </View>

                        {/* Category */}
                        <View style={tw`mb-4`}>
                            <Text style={tw`font-semibold mb-2`}>Categoria</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={tw`flex-row`}>
                                    {categories.map((category) => (
                                        <TouchableOpacity
                                            key={category}
                                            onPress={() => setFormData(prev => ({ ...prev, category }))}
                                            style={tw`px-4 py-2 mr-2 rounded-full border ${
                                                formData.category === category 
                                                    ? 'bg-blue-500 border-blue-500' 
                                                    : 'bg-white border-gray-300'
                                            }`}
                                        >
                                            <Text style={tw`${
                                                formData.category === category ? 'text-white' : 'text-gray-600'
                                            }`}>
                                                {category}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        {/* Priority */}
                        <View style={tw`mb-4`}>
                            <Text style={tw`font-semibold mb-2`}>Prioridade</Text>
                            <View style={tw`flex-row flex-wrap`}>
                                {priorities.map((priority) => (
                                    <TouchableOpacity
                                        key={priority.value}
                                        onPress={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                                                                              style={tw`px-4 py-2 mr-2 mb-2 rounded-full ${
                                            formData.priority === priority.value 
                                                ? priority.color 
                                                : 'bg-gray-200'
                                        }`}
                                    >
                                        <Text style={tw`${
                                            formData.priority === priority.value ? 'text-white' : 'text-gray-600'
                                        } font-medium`}>
                                            {priority.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Description */}
                        <View style={tw`mb-6`}>
                            <Text style={tw`font-semibold mb-2`}>Descrição *</Text>
                            <TextInput
                                style={tw`border border-gray-300 rounded-lg px-4 py-3 h-32`}
                                placeholder="Descreva detalhadamente o problema que você está enfrentando..."
                                value={formData.description}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                                multiline
                                textAlignVertical="top"
                            />
                            <Text style={tw`text-gray-500 text-sm mt-1`}>
                                Mínimo 10 caracteres ({formData.description.length}/10)
                            </Text>
                        </View>

                        {/* Tips */}
                        <View style={tw`bg-blue-50 p-4 rounded-lg mb-6`}>
                            <View style={tw`flex-row items-center mb-2`}>
                                <Feather name="info" size={16} color="#3B82F6" />
                                <Text style={tw`font-semibold text-blue-800 ml-2`}>Dicas para um bom ticket:</Text>
                            </View>
                            <Text style={tw`text-blue-700 text-sm mb-1`}>• Seja específico sobre o problema</Text>
                            <Text style={tw`text-blue-700 text-sm mb-1`}>• Inclua passos para reproduzir o erro</Text>
                            <Text style={tw`text-blue-700 text-sm mb-1`}>• Mencione quando o problema começou</Text>
                            <Text style={tw`text-blue-700 text-sm`}>• Adicione capturas de tela se necessário</Text>
                        </View>

                        {/* Action Buttons */}
                        <View style={tw`flex-row justify-between`}>
                            <TouchableOpacity
                                onPress={handleClose}
                                style={tw`flex-1 bg-gray-200 py-4 rounded-lg mr-2`}
                            >
                                <Text style={tw`text-center font-semibold text-gray-700`}>Cancelar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                onPress={handleSubmit}
                                style={tw`flex-1 bg-blue-500 py-4 rounded-lg ml-2 ${
                                    !formData.title.trim() || !formData.description.trim() ? 'opacity-50' : ''
                                }`}
                                disabled={!formData.title.trim() || !formData.description.trim()}
                            >
                                <Text style={tw`text-center font-semibold text-white`}>Criar Ticket</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

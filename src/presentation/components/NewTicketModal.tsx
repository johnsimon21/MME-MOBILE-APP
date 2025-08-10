import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { ICreateTicketRequest, TicketCategory, TicketPriority } from '@/src/interfaces/support.interface';

interface NewTicketModalProps {
    visible: boolean;
    onClose: () => void;
    onCreateTicket: (ticketData: ICreateTicketRequest) => void;
    currentUser?: { id: string; fullName: string };
}

export function NewTicketModal({ visible, onClose, onCreateTicket, currentUser }: NewTicketModalProps) {
    const [ticketData, setTicketData] = useState({
        title: '',
        description: '',
        category: TicketCategory.OTHER,
        priority: TicketPriority.MEDIUM
    });

    const categories = [
        { value: TicketCategory.ACCOUNT, label: 'Conta' },
        { value: TicketCategory.TECHNICAL, label: 'Técnico' },
        { value: TicketCategory.OTHER, label: 'Geral' },
        { value: TicketCategory.BUG_REPORT, label: 'Bug Report' }
    ];
    
    const priorities = [
        { value: TicketPriority.LOW, label: 'Baixa', color: '#10B981' },
        { value: TicketPriority.MEDIUM, label: 'Média', color: '#F59E0B' },
        { value: TicketPriority.HIGH, label: 'Alta', color: '#EF4444' },
        { value: TicketPriority.URGENT, label: 'Urgente', color: '#DC2626' }
    ];

    const createTicket = () => {
        if (!ticketData.title.trim() || !ticketData.description.trim()) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const newTicketData: ICreateTicketRequest = {
            title: ticketData.title,
            description: ticketData.description,
            category: ticketData.category,
            priority: ticketData.priority
        };

        onCreateTicket(newTicketData);
        setTicketData({ 
            title: '', 
            description: '', 
            category: TicketCategory.OTHER, 
            priority: TicketPriority.MEDIUM 
        });
        onClose();
        Alert.alert('Sucesso', 'Ticket criado com sucesso!');
    };

    const resetForm = () => {
        setTicketData({ 
            title: '', 
            description: '', 
            category: TicketCategory.OTHER, 
            priority: TicketPriority.MEDIUM 
        });
    };

    const handleClose = () => {
        resetForm();
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
                        <Text style={tw`text-xl font-bold`}>Novo Ticket</Text>
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
                                placeholder="Descreva brevemente o problema"
                                value={ticketData.title}
                                onChangeText={(text) => setTicketData(prev => ({ ...prev, title: text }))}
                            />
                        </View>

                        {/* Category */}
                        <View style={tw`mb-4`}>
                            <Text style={tw`font-semibold mb-2`}>Categoria</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={tw`flex-row`}>
                                    {categories.map((category) => (
                                    <TouchableOpacity
                                    key={category.value}
                                    onPress={() => setTicketData(prev => ({ ...prev, category: category.value }))}
                                    style={tw`px-4 py-2 mr-2 rounded-full border ${ticketData.category === category.value
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'bg-white border-gray-300'
                                    }`}
                                    >
                                    <Text style={tw`${ticketData.category === category.value ? 'text-white' : 'text-gray-600'
                                    }`}>
                                    {category.label}
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
                                        onPress={() => setTicketData(prev => ({ ...prev, priority: priority.value }))}
                                        style={tw`flex-row items-center px-3 py-2 mr-2 mb-2 rounded-full border ${ticketData.priority === priority.value
                                                ? 'border-gray-800 bg-gray-100'
                                                : 'border-gray-300'
                                            }`}
                                    >
                                        <View
                                            style={[
                                                tw`w-3 h-3 rounded-full mr-2`,
                                                { backgroundColor: priority.color }
                                            ]}
                                        />
                                        <Text style={tw`text-gray-700`}>{priority.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Description */}
                        <View style={tw`mb-6`}>
                            <Text style={tw`font-semibold mb-2`}>Descrição *</Text>
                            <TextInput
                                style={tw`border border-gray-300 rounded-lg px-4 py-3 h-32`}
                                placeholder="Descreva detalhadamente o problema..."
                                value={ticketData.description}
                                onChangeText={(text) => setTicketData(prev => ({ ...prev, description: text }))}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={createTicket}
                            style={tw`bg-blue-500 py-4 rounded-lg ${!ticketData.title.trim() || !ticketData.description.trim() ? 'opacity-50' : ''
                                }`}
                            disabled={!ticketData.title.trim() || !ticketData.description.trim()}
                        >
                            <Text style={tw`text-white font-semibold text-center`}>Criar Ticket</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

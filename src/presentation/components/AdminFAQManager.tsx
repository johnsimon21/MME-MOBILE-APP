import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, Alert, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { FAQ } from '@/src/types/support.types';

interface AdminFAQManagerProps {
    faqs: FAQ[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAddFAQ: (faq: Partial<FAQ>) => void;
    onUpdateFAQ: (faqId: string, faq: Partial<FAQ>) => void;
    onDeleteFAQ: (faqId: string) => void;
    onUpdateHelpful: (faqId: string, helpful: number) => void;
}

export function AdminFAQManager({ 
    faqs, 
    searchQuery, 
    onSearchChange, 
    onAddFAQ, 
    onUpdateFAQ, 
    onDeleteFAQ,
    onUpdateHelpful 
}: AdminFAQManagerProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const categories = ['all', 'Conta', 'Sessões', 'Comunicação', 'Técnico', 'Geral'];
    
    const filteredFAQs = faqs.filter(faq => {
        const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleDeleteFAQ = (faqId: string) => {
        Alert.alert(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir esta FAQ?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Excluir', style: 'destructive', onPress: () => onDeleteFAQ(faqId) }
            ]
        );
    };

    const AdminFAQItem = ({ faq }: { faq: FAQ }) => (
        <View style={tw`bg-white rounded-xl mb-3 shadow-sm overflow-hidden`}>
            <View style={tw`p-4`}>
                <View style={tw`flex-row items-start justify-between mb-2`}>
                    <View style={tw`flex-1 mr-3`}>
                        <Text style={tw`font-semibold text-gray-800 mb-1`}>
                            {faq.question}
                        </Text>
                        <Text style={tw`text-gray-600 text-sm mb-2`}>
                            {faq.answer}
                        </Text>
                        <View style={tw`flex-row items-center`}>
                            <Text style={tw`text-blue-500 text-xs font-medium mr-3`}>
                                {faq.category}
                            </Text>
                            <View style={tw`flex-row items-center`}>
                                <Feather name="thumbs-up" size={12} color="#10B981" />
                                <Text style={tw`text-green-600 text-xs ml-1`}>
                                    {faq.helpful} úteis
                                </Text>
                            </View>
                        </View>
                    </View>
                    
                    <View style={tw`flex-row`}>
                        <TouchableOpacity
                            onPress={() => {
                                setEditingFAQ(faq);
                                setShowEditModal(true);
                            }}
                            style={tw`p-2 mr-1`}
                        >
                            <Feather name="edit-2" size={16} color="#4F46E5" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleDeleteFAQ(faq.id)}
                            style={tw`p-2`}
                        >
                            <Feather name="trash-2" size={16} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    const EmptyState = () => (
        <View style={tw`items-center justify-center py-12`}>
            <Feather name="help-circle" size={48} color="#9CA3AF" />
            <Text style={tw`text-gray-500 text-lg mt-4`}>Nenhuma FAQ encontrada</Text>
            <Text style={tw`text-gray-400 text-sm mt-1 text-center`}>
                Adicione a primeira FAQ para começar
            </Text>
        </View>
    );

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Header with Search and Add Button */}
            <View style={tw`bg-white flex-row items-center px-2 py-1 mb-2 `}>
                <View style={tw`bg-gray-100 rounded-lg flex-row items-center flex-1 px-4 py-1 mr-2`}>
                    <Feather name="search" size={20} color="#6B7280" />
                    <TextInput
                        placeholder="Buscar FAQs..."
                        style={tw`flex-1 ml-3 text-gray-700`}
                        value={searchQuery}
                        onChangeText={onSearchChange}
                    />
                </View>
                <TouchableOpacity
                    onPress={() => setShowAddModal(true)}
                    style={tw`bg-blue-500 p-3 rounded-lg flex-row items-center justify-center`}
                >
                    <Feather name="plus" size={20} color="white" />
                </TouchableOpacity>
                
            </View>

            {/* Categories */}
            <View style={tw`bg-white px-4 py-3 border-b border-gray-200`}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={tw`flex-row`}>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category}
                                onPress={() => setSelectedCategory(category)}
                                style={tw`px-4 py-2 mr-2 rounded-full ${
                                    selectedCategory === category ? 'bg-blue-200' : 'bg-gray-100'
                                }`}
                            >
                                <Text style={tw`font-medium ${
                                    selectedCategory === category ? 'text-blue-800' : 'text-gray-600'
                                }`}>
                                    {category === 'all' ? 'Todas' : category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* FAQ List */}
            <FlatList
                data={filteredFAQs}
                keyExtractor={(item) => item.id}
                contentContainerStyle={tw`p-4`}
                renderItem={({ item }) => <AdminFAQItem faq={item} />}
                ListEmptyComponent={EmptyState}
                showsVerticalScrollIndicator={false}
            />

            {/* Add/Edit FAQ Modal */}
            <FAQModal
                visible={showAddModal || showEditModal}
                faq={editingFAQ}
                onClose={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditingFAQ(null);
                }}
                onSave={(faqData) => {
                    if (editingFAQ) {
                        onUpdateFAQ(editingFAQ.id, faqData);
                    } else {
                        onAddFAQ(faqData);
                    }
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditingFAQ(null);
                }}
                isEditing={!!editingFAQ}
            />
        </View>
    );
}

// FAQ Modal Component
interface FAQModalProps {
    visible: boolean;
    faq: FAQ | null;
    onClose: () => void;
    onSave: (faq: Partial<FAQ>) => void;
    isEditing: boolean;
}

function FAQModal({ visible, faq, onClose, onSave, isEditing }: FAQModalProps) {
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        category: 'Geral'
    });

    const categories = ['Conta', 'Sessões', 'Comunicação', 'Técnico', 'Geral'];

    React.useEffect(() => {
        if (faq && isEditing) {
            setFormData({
                question: faq.question,
                answer: faq.answer,
                category: faq.category
            });
        } else {
            setFormData({
                question: '',
                answer: '',
                category: 'Geral'
            });
        }
    }, [faq, isEditing, visible]);

    const handleSave = () => {
        if (!formData.question.trim() || !formData.answer.trim()) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }

        const faqData: Partial<FAQ> = {
            question: formData.question,
            answer: formData.answer,
            category: formData.category,
            helpful: isEditing ? faq?.helpful : 0
        };

        onSave(faqData);
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
                <View style={tw`bg-white rounded-t-3xl p-6 max-h-[90%]`}>
                    <View style={tw`flex-row items-center justify-between mb-6`}>
                        <Text style={tw`text-xl font-bold`}>
                            {isEditing ? 'Editar FAQ' : 'Nova FAQ'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="x" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Question */}
                        <View style={tw`mb-4`}>
                            <Text style={tw`font-semibold mb-2`}>Pergunta *</Text>
                            <TextInput
                                style={tw`border border-gray-300 rounded-lg px-4 py-3`}
                                placeholder="Digite a pergunta..."
                                value={formData.question}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, question: text }))}
                                multiline
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
                                                    ? 'bg-blue-200 border-blue-300' 
                                                    : 'bg-white border-gray-300'
                                            }`}
                                        >
                                            <Text style={tw`${
                                                formData.category === category ? 'text-blue-800' : 'text-gray-600'
                                            }`}>
                                                {category}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        {/* Answer */}
                        <View style={tw`mb-6`}>
                            <Text style={tw`font-semibold mb-2`}>Resposta *</Text>
                            <TextInput
                                style={tw`border border-gray-300 rounded-lg px-4 py-3 h-32`}
                                placeholder="Digite a resposta detalhada..."
                                value={formData.answer}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, answer: text }))}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            onPress={handleSave}
                            style={tw`bg-blue-500 py-4 rounded-lg ${
                                !formData.question.trim() || !formData.answer.trim() ? 'opacity-50' : ''
                            }`}
                            disabled={!formData.question.trim() || !formData.answer.trim()}
                        >
                            <Text style={tw`text-white font-semibold text-center`}>
                                {isEditing ? 'Atualizar FAQ' : 'Criar FAQ'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

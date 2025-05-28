import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { FAQ } from '@/src/types/support.types';
import { FAQItem } from './FAQItem';

interface FAQListProps {
    faqs: FAQ[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onUpdateFAQ: (faqId: string, helpful: number) => void;
}

export function FAQList({ faqs, searchQuery, onSearchChange, onUpdateFAQ }: FAQListProps) {
    const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories = ['all', 'Conta', 'Sessões', 'Comunicação', 'Técnico'];
    
    const filteredFAQs = faqs.filter(faq => {
        const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleHelpful = (faqId: string, helpful: boolean) => {
        const faq = faqs.find(f => f.id === faqId);
        if (faq) {
            const newHelpfulCount = helpful ? faq.helpful + 1 : Math.max(0, faq.helpful - 1);
            onUpdateFAQ(faqId, newHelpfulCount);
        }
    };

    const EmptyState = () => (
        <View style={tw`items-center justify-center py-12`}>
            <Feather name="help-circle" size={48} color="#9CA3AF" />
            <Text style={tw`text-gray-500 text-lg mt-4`}>Nenhuma pergunta encontrada</Text>
            <Text style={tw`text-gray-400 text-sm mt-1 text-center`}>
                Tente ajustar sua busca ou categoria
            </Text>
        </View>
    );

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Search */}
            <View style={tw`bg-white p-4 border-b border-gray-200`}>
                <View style={tw`bg-gray-100 rounded-lg flex-row items-center px-4 py-3`}>
                    <Feather name="search" size={20} color="#6B7280" />
                    <TextInput
                        placeholder="Buscar perguntas..."
                        style={tw`flex-1 ml-3 text-gray-700`}
                        value={searchQuery}
                        onChangeText={onSearchChange}
                    />
                </View>
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
                                    selectedCategory === category ? 'bg-blue-500' : 'bg-gray-100'
                                }`}
                            >
                                <Text style={tw`font-medium ${
                                    selectedCategory === category ? 'text-white' : 'text-gray-600'
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
                renderItem={({ item }) => (
                    <FAQItem
                        faq={item}
                        isExpanded={expandedFAQ === item.id}
                        onToggle={() => setExpandedFAQ(expandedFAQ === item.id ? null : item.id)}
                        onHelpful={(helpful) => handleHelpful(item.id, helpful)}
                    />
                )}
                ListEmptyComponent={EmptyState}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

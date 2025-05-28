import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { FAQ } from '@/src/types/support.types';

interface FAQItemProps {
    faq: FAQ;
    isExpanded: boolean;
    onToggle: () => void;
    onHelpful: (helpful: boolean) => void;
}

export function FAQItem({ faq, isExpanded, onToggle, onHelpful }: FAQItemProps) {
    return (
        <View style={tw`bg-white rounded-xl mb-3 shadow-sm overflow-hidden`}>
            <TouchableOpacity
                onPress={onToggle}
                style={tw`p-4 flex-row items-center justify-between`}
            >
                <View style={tw`flex-1 mr-3`}>
                    <Text style={tw`font-semibold text-gray-800 mb-1`}>
                        {faq.question}
                    </Text>
                    <View style={tw`flex-row items-center`}>
                        <Text style={tw`text-blue-500 text-xs font-medium mr-3`}>
                            {faq.category}
                        </Text>
                        <View style={tw`flex-row items-center`}>
                            <Feather name="thumbs-up" size={12} color="#10B981" />
                            <Text style={tw`text-green-600 text-xs ml-1`}>
                                {faq.helpful}
                            </Text>
                        </View>
                    </View>
                </View>
                <Feather 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#6B7280" 
                />
            </TouchableOpacity>
            
            {isExpanded && (
                <Animated.View style={tw`px-4 pb-4 border-t border-gray-100`}>
                    <Text style={tw`text-gray-600 leading-6 mt-3 mb-4`}>
                        {faq.answer}
                    </Text>
                    
                    <View style={tw`flex-row items-center justify-between`}>
                        <Text style={tw`text-gray-500 text-sm`}>
                            Esta resposta foi útil?
                        </Text>
                        <View style={tw`flex-row`}>
                            <TouchableOpacity 
                                style={tw`flex-row items-center mr-4`}
                                onPress={() => onHelpful(true)}
                            >
                                <Feather name="thumbs-up" size={16} color="#10B981" />
                                <Text style={tw`text-green-600 ml-1 text-sm`}>Sim</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={tw`flex-row items-center`}
                                onPress={() => onHelpful(false)}
                            >
                                <Feather name="thumbs-down" size={16} color="#EF4444" />
                                <Text style={tw`text-red-600 ml-1 text-sm`}>Não</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}

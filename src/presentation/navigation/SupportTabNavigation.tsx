import React from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { SupportTab } from '@/src/types/support.types';

interface SupportTabNavigationProps {
    activeTab: SupportTab;
    onTabChange: (tab: SupportTab) => void;
    slideAnim: Animated.Value;
}

export function SupportTabNavigation({ activeTab, onTabChange, slideAnim }: SupportTabNavigationProps) {
    const tabs = [
        { key: 'help' as SupportTab, label: 'Ajuda', icon: 'help-circle' },
        { key: 'tickets' as SupportTab, label: 'Tickets', icon: 'clipboard' },
        { key: 'chat' as SupportTab, label: 'Chat', icon: 'message-circle' },
        { key: 'faq' as SupportTab, label: 'FAQ', icon: 'book-open' }
    ];

    const handleTabPress = (tab: SupportTab) => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start(() => {
            onTabChange(tab);
            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }).start();
        });
    };

    return (
        <View style={tw`bg-white border-b border-gray-200`}>
            <View style={tw`flex-row justify-around py-3`}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => handleTabPress(tab.key)}
                        style={tw`items-center px-4 py-2 ${
                            activeTab === tab.key ? 'bg-blue-50 rounded-lg' : ''
                        }`}
                    >
                        <Feather 
                            name={tab.icon as any} 
                            size={20} 
                            color={activeTab === tab.key ? '#4F46E5' : '#6B7280'} 
                        />
                        <Text style={tw`text-xs mt-1 font-medium ${
                            activeTab === tab.key ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

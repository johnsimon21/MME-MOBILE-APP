import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { SupportTab } from '@/src/types/support.types';

interface SupportTabNavigationProps {
    activeTab: SupportTab;
    onTabChange: (tab: SupportTab) => void;
    slideAnim: Animated.Value;
    isAdmin?: boolean;
}

export function SupportTabNavigation({
    activeTab,
    onTabChange,
    slideAnim,
    isAdmin = false
}: SupportTabNavigationProps) {

    const adminTabs = [
        { id: 'tickets' as SupportTab, label: 'Tickets', icon: 'clipboard' },
        { id: 'chat' as SupportTab, label: 'Chat ao Vivo', icon: 'message-circle' },
        { id: 'faq' as SupportTab, label: 'Gerenciar FAQ', icon: 'help-circle' },
    ];

    const userTabs = [
        { id: 'tickets' as SupportTab, label: 'Meus Tickets', icon: 'clipboard' },
        { id: 'faq' as SupportTab, label: 'FAQ', icon: 'help-circle' },
        { id: 'chat' as SupportTab, label: 'Chat', icon: 'message-circle' }
    ];

    const tabs = isAdmin ? adminTabs : userTabs;

    const handleTabPress = (tab: SupportTab) => {
        // Animate tab change
        Animated.sequence([
            Animated.timing(slideAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        onTabChange(tab);
    };

    return (
        <View style={tw`bg-white px-4 py-3 border-b border-gray-200`}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
            >
                <View style={tw`flex-row`}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => handleTabPress(tab.id)}
                            style={tw`flex-row items-center px-4 py-2 mr-3 rounded-full ${activeTab === tab.id
                                ? 'bg-blue-200'
                                : 'bg-gray-100'
                                }`}
                        >
                            <Feather
                                name={tab.icon as any}
                                size={16}
                                style={tw`${activeTab === tab.id ? 'text-blue-800' : 'text-gray-600'}`}
                            />
                            <Text style={tw`ml-2 font-medium ${activeTab === tab.id ? 'text-blue-800' : 'text-gray-600'
                                }`}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

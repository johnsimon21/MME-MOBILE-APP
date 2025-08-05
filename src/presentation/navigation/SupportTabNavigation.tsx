import React from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
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
  
  const tabs: Array<{ key: SupportTab; label: string; icon?: string }> = [
    { key: 'tickets', label: 'Tickets' },
    { key: 'faq', label: 'FAQs' },
    { key: 'chat', label: 'Chat' },
    { key: 'help', label: 'Ajuda' },
  ];

  const handleTabPress = (tab: SupportTab) => {
    // Simple animation
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0.8,
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
    <View style={tw`bg-white border-b border-gray-200 px-4 py-2`}>
      <View style={tw`flex-row justify-around items-center`}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => handleTabPress(tab.key)}
            style={tw`flex-1 py-3 mx-1 rounded-lg items-center ${
              activeTab === tab.key 
                ? 'bg-blue-500' 
                : 'bg-gray-100'
            }`}
            activeOpacity={0.7}
          >
            <Text
              style={tw`text-sm font-medium ${
                activeTab === tab.key 
                  ? 'text-white' 
                  : 'text-gray-600'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

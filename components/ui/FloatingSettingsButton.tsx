import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { useRouter } from 'expo-router';

export function FloatingSettingsButton() {
    const router = useRouter();

    const handlePress = () => {
        router.push('/settings');
    };

    return (
        <TouchableOpacity
            style={tw`absolute bottom-20 right-6 w-14 h-14 bg-[#4F46E5] rounded-full shadow-lg items-center justify-center z-50`}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <Feather name="settings" size={24} color="white" />
        </TouchableOpacity>
    );
}

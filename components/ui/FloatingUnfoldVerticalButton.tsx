import React, { useRef } from 'react';
import { TouchableOpacity, View, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { useRouter } from 'expo-router';
import { UnfoldVerticalIcon } from '@/assets/images/svg';

export function FloatingOptionsButton() {
    const [unfold, setUnfold] = React.useState(false);
    const router = useRouter();
    
    // Animation values
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;

    const handleNavigateToSettings = () => {
        router.push('/settings');
    };
    
    const handleNavigateToNotifications = () => {
        router.push('/notifications');
    };

    const toggleUnfold = () => {
        const toValue = unfold ? 0 : 1;
        
        setUnfold(!unfold);
        
        // Parallel animations for smooth effect
        Animated.parallel([
            // Slide up animation
            Animated.spring(slideAnim, {
                toValue: toValue,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
            }),
            // Fade in/out animation
            Animated.timing(fadeAnim, {
                toValue: toValue,
                duration: 200,
                useNativeDriver: true,
            }),
            // Rotate main button
            Animated.timing(rotateAnim, {
                toValue: toValue,
                duration: 300,
                useNativeDriver: true,
            }),
            // Scale animation for buttons
            Animated.spring(scaleAnim, {
                toValue: toValue,
                useNativeDriver: true,
                tension: 150,
                friction: 6,
            }),
        ]).start();
    };

    // Animation interpolations
    const slideTransform = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [100, 0], // Start 100px below, end at 0
    });

    const rotateTransform = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'], // Rotate the main button
    });

    const scaleTransform = scaleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1], // Scale from 0 to 1
    });

    return (
        <View style={tw`absolute bottom-20 right-6 w-14 items-center justify-center z-50`}>
            {/* Options Container */}
            <Animated.View 
                style={[
                    tw`mb-2 bg-white rounded-full flex-col items-center justify-center shadow-lg`,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { translateY: slideTransform },
                            { scale: scaleTransform }
                        ],
                    }
                ]}
                pointerEvents={unfold ? 'auto' : 'none'}
            >
                {/* Settings Button */}
                <Animated.View
                    style={[
                        tw`overflow-hidden`,
                        {
                            transform: [
                                { 
                                    translateY: slideAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [20, 0],
                                    })
                                }
                            ]
                        }
                    ]}
                >
                    <TouchableOpacity
                        style={tw`items-center justify-center z-50 w-14 h-14 rounded-full bg-white`}
                        onPress={handleNavigateToSettings}
                        activeOpacity={0.8}
                    >
                        <Feather name="settings" size={24} color="#222222" />
                    </TouchableOpacity>
                </Animated.View>

                {/* Notifications Button */}
                <Animated.View
                    style={[
                        tw`overflow-hidden`,
                        {
                            transform: [
                                { 
                                    translateY: slideAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [40, 0],
                                    })
                                }
                            ]
                        }
                    ]}
                >
                    <TouchableOpacity
                        style={tw`items-center justify-center z-50 w-14 h-14 rounded-full bg-white`}
                        onPress={handleNavigateToNotifications}
                        activeOpacity={0.8}
                    >
                        <Feather name="bell" size={24} color="#222222" />
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>

            {/* Main Toggle Button */}
            <Animated.View
                style={[
                    tw`bg-white rounded-full shadow-lg items-center justify-center w-14 h-14`,
                    {
                        transform: [{ rotate: rotateTransform }]
                    }
                ]}
            >
                <TouchableOpacity
                    style={tw`items-center justify-center z-50 w-14 h-14 rounded-full`}
                    onPress={toggleUnfold}
                    activeOpacity={0.8}
                >
                    <UnfoldVerticalIcon size={24} color="#222222" />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

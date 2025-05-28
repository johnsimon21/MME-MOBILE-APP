import React, { useRef, useState, useEffect } from 'react';
import { TouchableOpacity, View, Animated, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { useRouter } from 'expo-router';
import { UnfoldVerticalIcon } from '@/assets/images/svg';
import { useFloatingButton } from '@/src/context/FloatingButtonContext';
// import { UnfoldVerticalIcon } from '@/assets/images/svg';

export function FloatingOptionsButton() {
    const [unfold, setUnfold] = React.useState(false);
    const [onTop, setOnTop] = React.useState(false);
    const [unreadCount, setUnreadCount] = useState(3); // This should come from your notification service
    const router = useRouter();
    const { position } = useFloatingButton();

    // Animation values
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const badgeScaleAnim = useRef(new Animated.Value(1)).current;

    // Animate badge when count changes
    useEffect(() => {
        if (unreadCount > 0) {
            Animated.sequence([
                Animated.timing(badgeScaleAnim, {
                    toValue: 1.2,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(badgeScaleAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [unreadCount]);

    useEffect(() => {
        if (position.includes('right-top') || position.includes('left-top')) {
            setOnTop(true);
        } else {
            setOnTop(false);
        }
    }, [position]);

    const getPositionStyle = () => {
        const baseStyle = 'absolute w-14 items-center justify-center z-50 rounded-full';

        switch (position) {
            case 'left-top':
                // setOnTop(true);
                return `${baseStyle} top-30 left-6`;
            case 'left-bottom':
                // setOnTop(false);
                return `${baseStyle} bottom-20 left-6`;
            case 'right-top':
                // setOnTop(true);
                return `${baseStyle} top-30 right-6`;
            case 'right-bottom':
            default:
                // setOnTop(false);
                return `${baseStyle} bottom-20 right-6`;
        }
    };

    const handleNavigateToSettings = () => {
        router.push('/settings');
    };

    const handleNavigateToNotifications = () => {
        // Reset unread count when navigating to notifications
        setUnreadCount(0);
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
        outputRange: onTop ? [-100, 0] : [100, 0], // Start 100px (if onTop) below (else) above, end at 0
    });

    const rotateTransform = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'], // Rotate the main button
    });

    const scaleTransform = scaleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1], // Scale from 0 to 1
    });

    // Badge component for notification count
    const NotificationBadge = ({ count }: { count: number }) => {
        if (count === 0) return null;

        const displayCount = count > 99 ? '99+' : count.toString();

        return (
            <Animated.View
                style={[
                    tw`absolute top-1 right-3 bg-[#FF7266] rounded-full min-w-5 h-5 items-center justify-center z-10`,
                    {
                        transform: [{ scale: badgeScaleAnim }]
                    }
                ]}
            >
                <Text style={tw`text-white text-xs font-bold px-1`}>
                    {displayCount}
                </Text>
            </Animated.View>
        );
    };

    return (
        <View style={tw`${getPositionStyle()}`}>
            {/* Options Container */}
            <Animated.View
                style={[
                    tw`absolute ${onTop ? 'top-15' : 'bottom-13'} mb-2 bg-white rounded-full flex-col items-center justify-center shadow-lg`,
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

                {/* Notifications Button with Badge */}
                <Animated.View
                    style={[
                        tw`overflow-hidden relative`,
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
                        style={tw`items-center justify-center z-50 w-14 h-14 rounded-full bg-white relative`}
                        onPress={handleNavigateToNotifications}
                        activeOpacity={0.8}
                    >
                        <Feather name="bell" size={24} color="#222222" />
                        <NotificationBadge count={unreadCount} />
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

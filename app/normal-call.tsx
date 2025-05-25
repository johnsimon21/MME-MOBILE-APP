import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Image, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

type NormalCallRouteParams = {
    NormalCall: {
        userId: number;
        userName: string;
        userPhoto: string | null;
    };
};

export default function NormalCallScreen() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<NormalCallRouteParams, 'NormalCall'>>();
    const { userId, userName, userPhoto } = route.params;

    const [callStatus, setCallStatus] = useState<'connecting' | 'ongoing' | 'ended'>('connecting');
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(false);

    // Simulate call connecting
    useEffect(() => {
        const timer = setTimeout(() => {
            setCallStatus('ongoing');
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    // Call duration timer
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (callStatus === 'ongoing') {
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [callStatus]);

    // Format call duration as MM:SS
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle ending the call
    const handleEndCall = () => {
        setCallStatus('ended');
        setTimeout(() => {
            navigation.goBack();
        }, 500);
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-[#2C3E50]`}>
            <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />

            {/* Call Information */}
            <View style={tw`flex-1 items-center justify-center`}>
                {/* User Avatar */}
                <View style={tw`w-32 h-32 bg-[#34495E] rounded-full items-center justify-center mb-6 border-4 border-[#5D6D7E]`}>
                    {userPhoto ? (
                        <Image
                            source={{ uri: userPhoto }}
                            style={tw`w-full h-full rounded-full`}
                        />
                    ) : (
                        <Text style={tw`text-5xl font-bold text-white`}>
                            {userName.charAt(0)}
                        </Text>
                    )}
                </View>

                {/* User Name */}
                <Text style={tw`text-white text-3xl font-bold mb-2`}>{userName}</Text>

                {/* Call Status */}
                <Text style={tw`text-[#BDC3C7] text-lg mb-4`}>
                    {callStatus === 'connecting' ? 'Conectando...' :
                        callStatus === 'ongoing' ? formatDuration(callDuration) :
                            'Chamada finalizada'}
                </Text>

                {/* Call Type Indicator */}
                <View style={tw`bg-[#3498DB] px-3 py-1 rounded-full mb-6`}>
                    <Text style={tw`text-white text-sm font-medium`}>Chamada Normal</Text>
                </View>

                {/* Audio Wave Animation (simplified) */}
                {callStatus === 'ongoing' && (
                    <View style={tw`flex-row items-center justify-center w-40 h-10 mb-6`}>
                        {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                            <View
                                key={item}
                                style={[tw`bg-[#5D6D7E] w-2 mx-1 rounded-full animate-pulse`, {
                                    height: Math.random() * 30 + 10,
                                }]}
                            />
                        ))}
                    </View>
                )}
            </View>

            {/* Call Controls */}
            <View style={tw`bg-[#34495E] rounded-t-3xl pt-8 pb-12 px-6`}>
                <View style={tw`flex-row justify-around items-center mb-8`}>
                    {/* Mute Button */}
                    <Pressable
                        style={tw`items-center`}
                        onPress={() => setIsMuted(!isMuted)}
                    >
                        <View style={tw`w-14 h-14 rounded-full ${isMuted ? 'bg-[#E74C3C]' : 'bg-[#5D6D7E]'} items-center justify-center mb-2`}>
                            <Feather name={isMuted ? "mic-off" : "mic"} size={24} color="white" />
                        </View>
                        <Text style={tw`text-white text-xs`}>{isMuted ? 'Ativar' : 'Mudo'}</Text>
                    </Pressable>

                    {/* Speaker Button */}
                    <Pressable
                        style={tw`items-center`}
                        onPress={() => setIsSpeakerOn(!isSpeakerOn)}
                    >
                        <View style={tw`w-14 h-14 rounded-full ${isSpeakerOn ? 'bg-[#3498DB]' : 'bg-[#5D6D7E]'} items-center justify-center mb-2`}>
                            <MaterialIcons name={isSpeakerOn ? "volume-up" : "volume-down"} size={28} color="white" />
                        </View>
                        <Text style={tw`text-white text-xs`}>{isSpeakerOn ? 'Alto-falante' : 'Fone'}</Text>
                    </Pressable>

                    {/* Keypad Button */}
                    <Pressable style={tw`items-center`}>
                        <View style={tw`w-14 h-14 rounded-full bg-[#5D6D7E] items-center justify-center mb-2`}>
                            <MaterialIcons name="dialpad" size={24} color="white" />
                        </View>
                        <Text style={tw`text-white text-xs`}>Teclado</Text>
                    </Pressable>
                </View>

                {/* End Call Button */}
                <Pressable
                    style={tw`bg-[#E74C3C] h-16 rounded-full items-center justify-center mx-10`}
                    onPress={handleEndCall}
                >
                    <Text style={tw`text-white text-lg font-semibold`}>Desligar</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

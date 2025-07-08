import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View, StatusBar } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import tw from "twrnc";

interface AuthHeaderProps {
    navigation: any;
    activeTab: "Login" | "Cadastro" | "ForgotPassword" | "ResetPassword";
    step: number;
    showBackButton?: boolean;
}

export default function AuthHeader({ navigation, activeTab, step, showBackButton = true }: AuthHeaderProps) {
    const router = useRouter();

    const getHeaderHeight = () => {
        if (step !== 1 && activeTab === "Cadastro") return 155;
        if (activeTab === "ForgotPassword" || activeTab === "ResetPassword") return 180;
        return 200;
    };

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#4285F4" />
            <LinearGradient
                colors={['#4285F4', '#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[tw`w-full justify-center items-center px-5 pt-12 pb-8`, { height: getHeaderHeight() }]}
            >
                {/* Background Pattern */}
                <View style={tw`absolute inset-0 opacity-10`}>
                    <View style={tw`absolute top-10 right-10 w-20 h-20 rounded-full bg-white`} />
                    <View style={tw`absolute top-20 left-5 w-12 h-12 rounded-full bg-white`} />
                    <View style={tw`absolute bottom-10 right-20 w-8 h-8 rounded-full bg-white`} />
                </View>

                {/* Back Button */}
                {showBackButton && (
                    <TouchableOpacity 
                        style={tw`w-10 h-10 flex justify-center items-center bg-white/20 backdrop-blur-sm rounded-full absolute top-14 left-5 border border-white/30`} 
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                )}

                {/* Title Section */}
                <View style={tw`items-center mb-6`}>
                    <Text style={tw`text-white text-3xl font-bold text-center mb-2`}>
                        Meu Mentor Eiffel
                    </Text>
                    <Text style={tw`text-white/90 text-base text-center leading-6 px-4`}>
                        Conectando mentores e mentorados para um aprendizado eficaz
                    </Text>
                </View>

                {/* Tab Switcher - Only show for Login/Register */}
                {(activeTab === "Login" || activeTab === "Cadastro") && (
                    <View style={[tw`flex-row bg-white/20 backdrop-blur-sm rounded-2xl p-1 border border-white/30 absolute -bottom-6 shadow-lg`, {zIndex: 10}]}>
                        <TouchableOpacity
                            style={[
                                tw`px-6 py-3 rounded-xl min-w-20 items-center`,
                                activeTab === "Login" ? tw`bg-white shadow-sm` : tw`bg-transparent`
                            ]}
                            onPress={() => router.push("/auth/LoginScreen")}
                            activeOpacity={0.8}
                        >
                            <Text style={[
                                tw`font-semibold text-sm`,
                                activeTab === "Login" ? tw`text-gray-800` : tw`text-black`
                            ]}>
                                Entrar
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                tw`px-6 py-3 rounded-xl min-w-20 items-center`,
                                activeTab === "Cadastro" ? tw`bg-white shadow-sm` : tw`bg-transparent`
                            ]}
                            onPress={() => router.push("/auth/RegisterScreen")}
                            activeOpacity={0.8}
                        >
                            <Text style={[
                                tw`font-semibold text-sm`,
                                activeTab === "Cadastro" ? tw`text-gray-800` : tw`text-black`
                            ]}>
                                Cadastro
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Progress Indicator for Registration */}
                {activeTab === "Cadastro" && (
                    <View style={tw`flex-row items-center absolute -bottom-3`}>
                        {[1, 2, 3].map((stepNumber) => (
                            <View key={stepNumber} style={tw`flex-row items-center`}>
                                <View style={[
                                    tw`w-3 h-3 rounded-full`,
                                    step >= stepNumber ? tw`bg-white` : tw`bg-white/40`
                                ]} />
                                {stepNumber < 3 && (
                                    <View style={[
                                        tw`w-8 h-0.5 mx-1`,
                                        step > stepNumber ? tw`bg-white` : tw`bg-white/40`
                                    ]} />
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </LinearGradient>
        </>
    );
}

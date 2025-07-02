import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface AuthHeaderProps {
    navigation: any;
    activeTab: "Login" | "Cadastro" | "ForgotPassword" | "ResetPassword";
    step: number;
    showBackButton?: boolean;
}

export default function AuthHeader({ navigation, activeTab, step, showBackButton = true }: AuthHeaderProps) {
    const router = useRouter();

    return (
        <View style={step !== 1 && activeTab === "Cadastro" ? tw`flex-1 h-[155px] w-full max-h-[155px] justify-center items-center bg-[#4285F4] p-5` : tw`flex-1 h-[220px] max-h-[220px] w-full justify-center items-center bg-[#4285F4] p-5`}>
            {showBackButton &&
                <TouchableOpacity style={tw`w-8 h-8 flex justify-center items-center bg-white rounded-full absolute elevation-10 shadow-lg z-100 border border-[#A5A3B1] border-[0.2px] overflow-visible bottom-[-14px] left-5`} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="#4F46E5" />
                </TouchableOpacity>
            }
            <Text style={tw`text-white text-2xl font-bold`}>Bem-vindo ao Meu Mentor Eiffel</Text>
            <Text style={tw`text-sm text-white mt-1`}>
                Conectando mentores e mentorados para um aprendizado eficaz
            </Text>

            <View style={tw`flex-1 justify-center items-center flex-row rounded-2xl p-0.5 w-[174px] max-h-[36px] bg-[#F3F5F5] absolute bottom-[-16px] z-100 elevation-10 shadow-md overflow-visible`}>
                <TouchableOpacity
                    style={activeTab === "Login" ? tw`flex-1 justify-center items-center bg-white rounded-2xl border-0 text-black h-[30px]` : tw`flex-1 justify-center items-center rounded-2xl border-0 text-black h-[26px]`}
                    onPress={() => router.push("/auth/LoginScreen")}
                >
                    <Text>Entrar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={activeTab === "Cadastro" ? tw`flex-1 justify-center items-center bg-white rounded-2xl border-0 text-black h-[26px]` : tw`flex-1 justify-center items-center rounded-2xl border-0 text-black h-[26px]`}
                    onPress={() => router.push("/auth/RegisterScreen")}
                >
                    <Text>Cadastro</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface AuthHeaderProps {
    navigation: any;
    activeTab: "Login" | "Cadastro";
    step: number;
}

export default function AuthHeader({ navigation, activeTab, step }: AuthHeaderProps) {
    return (
        <View style={step !== 1 && activeTab === "Cadastro" ? tw`flex-1 h-[155px] w-full max-h-[155px] justify-center items-center bg-[#4285F4] p-5` : tw`flex-1 h-[220px] max-h-[220px] w-full justify-center items-center bg-[#4285F4] p-5`}>
            <Text style={tw`w-7 h-7 flex justify-center items-center bg-white rounded-full absolute elevation-10 shadow-lg z-100 border border-[#A5A3B1] border-[0.2px] overflow-visible bottom-[-14px] left-5`} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#4F46E5" />
            </Text>
            <Text style={tw`text-white text-2xl font-bold`}>Bem-vindo ao Meu Mentor Eiffel</Text>
            <Text style={tw`text-sm text-white mt-1`}>
                Conectando mentores e mentorados para um aprendizado eficaz
            </Text>

            <View style={tw`flex-1 justify-center items-center flex-row rounded-2xl p-0.5 w-[174px] max-h-[32px] bg-[#F3F5F5] absolute bottom-[-16px] z-100 elevation-10 shadow-md overflow-visible`}>
                <TouchableOpacity
                    style={activeTab === "Login" ? tw`flex-1 justify-center items-center bg-white rounded-2xl border-0 text-black h-[26px]` : tw`flex-1 justify-center items-center rounded-2xl border-0 text-black h-[26px]`}
                    onPress={() => navigation.navigate("Login")}
                >
                    <Text>Entrar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={activeTab === "Cadastro" ? tw`flex-1 justify-center items-center bg-white rounded-2xl border-0 text-black h-[26px]` : tw`flex-1 justify-center items-center rounded-2xl border-0 text-black h-[26px]`}
                    onPress={() => navigation.navigate("RegisterScreen")}
                >
                    <Text>Cadastro</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

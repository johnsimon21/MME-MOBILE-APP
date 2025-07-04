import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import tw from "twrnc";
import AuthHeader from "../../src/presentation/components/AuthHeader";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const { login, isLoading, error, clearError } = useAuth();

    const handleLogin = async () => {
        clearError();

        // Validation
        if (!email.trim()) {
            alert("Por favor, insira seu email");
            return;
        }

        if (!password.trim()) {
            alert("Por favor, insira sua senha");
            return;
        }

        if (password.length < 6) {
            alert("A senha deve ter pelo menos 6 caracteres");
            return;
        }

        try {
            console.log("🔄 Iniciando login com Firebase...");

            const success = await login(email.trim().toLowerCase(), password);

            if (success) {
                console.log("✅ Login com Firebase bem-sucedido!");
                // Navigation is handled automatically by the auth context
            }
        } catch (error) {
            console.error("❌ Erro no login com Firebase:", error);
            // Error handling is done in the auth context
        }
    };

    const handleForgotPassword = () => {
        // @ts-ignore
        router.push('auth/ForgotPasswordScreen');
    };

    const handleRegister = () => {
        // @ts-ignore
        router.push('auth/RegisterScreen');
    };

    return (
        <View style={tw`flex-1 items-center bg-white`}>
            {/* Top Section */}
            <AuthHeader navigation={navigation} showBackButton={false} activeTab="Login" step={1} />

            {/* Form Section */}
            <View style={tw`bg-white flex-2 max-w-[400px] w-full px-10 justify-start items-center mt-20 relative z-0`}>
                {/* Error Message */}
                {error && (
                    <View style={tw`w-full bg-red-100 border border-red-300 rounded-lg p-3 mb-4`}>
                        <Text style={tw`text-red-700 text-sm text-center`}>
                            {error}
                        </Text>
                    </View>
                )}

                <TextInput
                    placeholder="Email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#333] rounded-full border-0`}
                />
                <TextInput
                    placeholder="Senha"
                    secureTextEntry={true}
                    value={password}
                    onChangeText={setPassword}
                    editable={!isLoading}
                    style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#333] rounded-full border-0`}
                />

                {/* Login Button */}
                <TouchableOpacity
                    onPress={handleLogin}
                    disabled={isLoading}
                    style={tw`w-full py-4 px-5 mb-5 bg-[#007AFF] rounded-full ${isLoading ? 'opacity-50' : ''}`}
                >
                    {isLoading ? (
                        <View style={tw`flex-row justify-center items-center`}>
                            <ActivityIndicator color="#FFFFFF" size="small" />
                            <Text style={tw`text-white text-center font-semibold text-base ml-2`}>
                                Entrando...
                            </Text>
                        </View>
                    ) : (
                        <Text style={tw`text-white text-center font-semibold text-base`}>
                            Entrar
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Forgot Password Link */}
                <TouchableOpacity
                    onPress={handleForgotPassword}
                    disabled={isLoading}
                    style={tw`mb-5`}
                >
                    <Text style={tw`text-[#007AFF] text-sm`}>
                        Esqueceu a senha?
                    </Text>
                </TouchableOpacity>

                {/* Register Link */}
                <View style={tw`flex-row items-center`}>
                    <Text style={tw`text-[#A5A3B1] text-sm`}>
                        Não tem uma conta?{" "}
                    </Text>
                    <TouchableOpacity
                        onPress={handleRegister}
                        disabled={isLoading}
                    >
                        <Text style={tw`text-[#007AFF] text-sm font-semibold`}>
                            Registrar
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

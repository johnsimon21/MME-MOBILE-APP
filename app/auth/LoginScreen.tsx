import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import AuthHeader from "../../src/presentation/components/AuthHeader";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const router = useRouter();

    const { login, isLoading, error, clearError } = useAuth();

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleEmailChange = (text: string) => {
        setEmail(text);
        if (emailError) setEmailError("");
        if (error) clearError();
    };

    const handlePasswordChange = (text: string) => {
        setPassword(text);
        if (passwordError) setPasswordError("");
        if (error) clearError();
    };

    const handleLogin = async () => {
        clearError();
        setEmailError("");
        setPasswordError("");

        // Validation
        let hasError = false;

        if (!email.trim()) {
            setEmailError("Email é obrigatório");
            hasError = true;
        } else if (!validateEmail(email.trim())) {
            setEmailError("Email inválido");
            hasError = true;
        }

        if (!password.trim()) {
            setPasswordError("Senha é obrigatória");
            hasError = true;
        } else if (password.length < 6) {
            setPasswordError("Senha deve ter pelo menos 6 caracteres");
            hasError = true;
        }

        if (hasError) return;

        try {
            console.log("🔄 Iniciando login com Firebase...");
            const success = await login(email.trim().toLowerCase(), password);
            if (success) {
                console.log("✅ Login com Firebase bem-sucedido!");
            }
        } catch (error) {
            console.error("❌ Erro no login com Firebase:", error);
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
        <KeyboardAvoidingView 
            style={tw`flex-1 bg-gray-50`}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <AuthHeader navigation={navigation} showBackButton={false} activeTab="Login" step={1} />
            
            <ScrollView 
                style={tw`flex-1`}
                contentContainerStyle={tw`flex-grow justify-center`}
                showsVerticalScrollIndicator={false}
            >
                <View style={tw`px-6 py-8 mt-6`}>
                    {/* Welcome Text */}
                    {/* <View style={tw`mb-8`}>
                        <Text style={tw`text-3xl font-bold text-gray-900 mb-2`}>
                            Bem-vindo de volta!
                        </Text>
                        <Text style={tw`text-gray-600 text-base`}>
                            Entre na sua conta para continuar
                        </Text>
                    </View> */}

                    {/* Global Error Message */}
                    {error && (
                        <View style={tw`bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex-row items-center`}>
                            <Ionicons name="alert-circle" size={20} color="#EF4444" />
                            <Text style={tw`text-red-700 text-sm ml-2 flex-1`}>
                                {error}
                            </Text>
                        </View>
                    )}

                    {/* Email Input */}
                    <View style={tw`mb-4`}>
                        {/* <Text style={tw`text-gray-700 font-medium mb-2`}>Email</Text> */}
                        <View style={[
                            tw`flex-row items-center bg-white rounded-xl px-4 py-2 border`,
                            emailError ? tw`border-red-300` : tw`border-gray-200`
                        ]}>
                            <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                            <TextInput
                                placeholder="Digite seu email"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={handleEmailChange}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!isLoading}
                                style={tw`flex-1 ml-3 text-gray-900 text-base`}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                        {emailError && (
                            <Text style={tw`text-red-500 text-sm mt-1 ml-1`}>
                                {emailError}
                            </Text>
                        )}
                    </View>

                    {/* Password Input */}
                    <View style={tw`mb-6`}>
                        {/* <Text style={tw`text-gray-700 font-medium mb-2`}>Senha</Text> */}
                        <View style={[
                            tw`flex-row items-center bg-white rounded-xl px-4 py-2 border`,
                            passwordError ? tw`border-red-300` : tw`border-gray-200`
                        ]}>
                            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                            <TextInput
                                placeholder="Digite sua senha"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={handlePasswordChange}
                                editable={!isLoading}
                                style={tw`flex-1 ml-3 text-gray-900 text-base`}
                                placeholderTextColor="#9CA3AF"
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={tw`p-1`}
                            >
                                <Ionicons 
                                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                    size={20} 
                                    color="#9CA3AF" 
                                />
                            </TouchableOpacity>
                        </View>
                        {passwordError && (
                            <Text style={tw`text-red-500 text-sm mt-1 ml-1`}>
                                {passwordError}
                            </Text>
                        )}
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={isLoading}
                        style={[
                            tw`bg-blue-600 rounded-xl py-4 px-6 mb-4 shadow-sm`,
                            isLoading && tw`opacity-70`
                        ]}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <View style={tw`flex-row justify-center items-center`}>
                                <ActivityIndicator color="#FFFFFF" size="small" />
                                <Text style={tw`text-white font-semibold text-base ml-2`}>
                                    Entrando...
                                </Text>
                            </View>
                        ) : (
                            <Text style={tw`text-white font-semibold text-base text-center`}>
                                Entrar
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Forgot Password Link */}
                    <TouchableOpacity
                        onPress={handleForgotPassword}
                        disabled={isLoading}
                        style={tw`py-2 mb-6`}
                    >
                        <Text style={tw`text-blue-600 text-center font-medium`}>
                            Esqueceu a senha?
                        </Text>
                    </TouchableOpacity>

                    {/* Register Link */}
                    <View style={tw`flex-row justify-center items-center`}>
                        <Text style={tw`text-gray-600`}>
                            Não tem uma conta?{" "}
                        </Text>
                        <TouchableOpacity
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            <Text style={tw`text-blue-600 font-semibold`}>
                                Criar conta
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

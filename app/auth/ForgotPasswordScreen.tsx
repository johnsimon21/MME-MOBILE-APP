import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import AuthHeader from "../../src/presentation/components/AuthHeader";
import { useAuth } from "@/src/context/AuthContext";

export default function ForgotPasswordScreen({ navigation }: any) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [emailError, setEmailError] = useState("");
    
    const { forgotPassword, error, clearError } = useAuth();

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleEmailChange = (text: string) => {
        setEmail(text);
        if (emailError) setEmailError("");
        if (error) clearError();
    };

    const handleForgotPassword = async () => {
        clearError();
        setEmailError("");
        
        // Validation
        if (!email.trim()) {
            setEmailError("Email é obrigatório");
            return;
        }

        if (!validateEmail(email.trim())) {
            setEmailError("Email inválido");
            return;
        }

        try {
            setIsLoading(true);
            console.log("🔄 Enviando email de recuperação...");
            
            await forgotPassword(email.trim().toLowerCase());
            
            setEmailSent(true);
            console.log("✅ Email de recuperação enviado");
            
        } catch (error) {
            console.error("❌ Erro ao enviar email de recuperação:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigation.navigate('LoginScreen');
    };

    const handleResendEmail = () => {
        setEmailSent(false);
        handleForgotPassword();
    };

    return (
        <KeyboardAvoidingView 
            style={tw`flex-1 bg-gray-50`}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <AuthHeader 
                navigation={navigation} 
                showBackButton={true} 
                activeTab="ForgotPassword" 
                step={1} 
            />

            <ScrollView 
                style={tw`flex-1`}
                contentContainerStyle={tw`flex-grow justify-center`}
                showsVerticalScrollIndicator={false}
            >
                <View style={tw`px-6 py-8 mt-8`}>
                    
                    {!emailSent ? (
                        <>
                            {/* Header */}
                            <View style={tw`mb-8 items-center`}>
                                <View style={tw`w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4`}>
                                    <Ionicons name="mail-outline" size={32} color="#3B82F6" />
                                </View>
                                <Text style={tw`text-3xl font-bold text-gray-900 mb-2 text-center`}>
                                    Esqueceu a senha?
                                </Text>
                                <Text style={tw`text-gray-600 text-center leading-6`}>
                                    Digite seu email e enviaremos instruções para redefinir sua senha.
                                </Text>
                            </View>

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
                            <View style={tw`mb-6`}>
                                <Text style={tw`text-gray-700 font-medium mb-2`}>Email</Text>
                                <View style={[
                                    tw`flex-row items-center bg-white rounded-xl px-4 py-4 border`,
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

                            {/* Send Email Button */}
                            <TouchableOpacity
                                onPress={handleForgotPassword}
                                disabled={isLoading}
                                style={[
                                    tw`bg-blue-600 rounded-xl py-4 px-6 mb-6 shadow-sm`,
                                    isLoading && tw`opacity-70`
                                ]}
                                activeOpacity={0.8}
                            >
                                {isLoading ? (
                                    <View style={tw`flex-row justify-center items-center`}>
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                        <Text style={tw`text-white font-semibold text-base ml-2`}>
                                            Enviando...
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={tw`text-white font-semibold text-base text-center`}>
                                        Enviar Email
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Back to Login */}
                            <TouchableOpacity
                                onPress={handleBackToLogin}
                                disabled={isLoading}
                                style={tw`py-2`}
                            >
                                <Text style={tw`text-blue-600 text-center font-medium`}>
                                    Voltar ao Login
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {/* Success State */}
                            <View style={tw`items-center mb-8`}>
                                <View style={tw`w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4`}>
                                    <Ionicons name="checkmark" size={32} color="#10B981" />
                                </View>
                                
                                <Text style={tw`text-3xl font-bold text-gray-900 mb-2 text-center`}>
                                    Email Enviado!
                                </Text>
                                
                                <Text style={tw`text-gray-600 text-center mb-2 leading-6`}>
                                    Enviamos instruções para redefinir sua senha para:
                                </Text>
                                
                                <View style={tw`bg-blue-50 rounded-xl p-3 mb-6`}>
                                    <Text style={tw`text-blue-700 font-semibold text-center`}>
                                        {email}
                                    </Text>
                                </View>
                                
                                <Text style={tw`text-gray-600 text-center text-sm leading-5`}>
                                    Verifique sua caixa de entrada e spam. O link expira em 1 hora.
                                </Text>
                            </View>

                            {/* Action Buttons */}
                            <TouchableOpacity
                                onPress={handleBackToLogin}
                                style={tw`bg-blue-600 rounded-xl py-4 px-6 mb-4 shadow-sm`}
                                activeOpacity={0.8}
                            >
                                <Text style={tw`text-white font-semibold text-base text-center`}>
                                    Voltar ao Login
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleResendEmail}
                                style={tw`py-2`}
                            >
                                <Text style={tw`text-blue-600 text-center font-medium`}>
                                    Não recebeu? Reenviar email
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Development Info */}
                    {__DEV__ && (
                        <View style={tw`mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl`}>
                            <View style={tw`flex-row items-center mb-2`}>
                                <Ionicons name="warning-outline" size={16} color="#F59E0B" />
                                <Text style={tw`text-yellow-800 text-xs font-semibold ml-2`}>
                                    Modo Desenvolvimento
                                </Text>
                            </View>
                            <Text style={tw`text-yellow-700 text-xs leading-4`}>
                                • Email enviado via backend{'\n'}
                                • Verifique logs do servidor{'\n'}
                                • Link de reset será enviado por email
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import tw from "twrnc";
import AuthHeader from "../../src/presentation/components/AuthHeader";
import { useAuth } from "../../src/context/AuthContext";

export default function ForgotPasswordScreen({ navigation }: any) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    
    const { forgotPassword, error, clearError } = useAuth();

    const handleForgotPassword = async () => {
        clearError();
        
        // Validation
        if (!email.trim()) {
            Alert.alert("Erro", "Por favor, insira seu email");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            Alert.alert("Erro", "Por favor, insira um email válido");
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
        <View style={tw`flex-1 items-center bg-white`}>
            {/* Top Section */}
            <AuthHeader 
                navigation={navigation} 
                showBackButton={true} 
                activeTab="ForgotPassword" 
                step={1} 
            />

            {/* Form Section */}
            <View style={tw`bg-white flex-2 max-w-[400px] w-full px-10 justify-start items-center mt-20 relative z-0`}>
                
                {!emailSent ? (
                    <>
                        {/* Title */}
                        <Text style={tw`text-2xl font-bold text-[#333] mb-2 text-center`}>
                            Esqueceu a senha?
                        </Text>
                        
                        <Text style={tw`text-[#666] text-center mb-8 leading-6`}>
                            Digite seu email e enviaremos instruções para redefinir sua senha.
                        </Text>

                        {/* Error Message */}
                        {error && (
                            <View style={tw`w-full bg-red-100 border border-red-300 rounded-lg p-3 mb-4`}>
                                <Text style={tw`text-red-700 text-sm text-center`}>
                                    {error}
                                </Text>
                            </View>
                        )}

                        {/* Email Input */}
                        <TextInput
                            placeholder="Digite seu email"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                            style={tw`w-full py-4 px-5 mb-6 bg-[#F5F5F5] text-[#333] rounded-full border-0`}
                        />

                        {/* Send Email Button */}
                        <TouchableOpacity
                            onPress={handleForgotPassword}
                            disabled={isLoading}
                            style={tw`w-full py-4 px-5 mb-5 bg-[#007AFF] rounded-full ${isLoading ? 'opacity-50' : ''}`}
                        >
                            {isLoading ? (
                                <View style={tw`flex-row justify-center items-center`}>
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                    <Text style={tw`text-white text-center font-semibold text-base ml-2`}>
                                        Enviando...
                                    </Text>
                                </View>
                            ) : (
                                <Text style={tw`text-white text-center font-semibold text-base`}>
                                    Enviar Email
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Back to Login */}
                        <TouchableOpacity
                            onPress={handleBackToLogin}
                            disabled={isLoading}
                            style={tw`mb-5`}
                        >
                            <Text style={tw`text-[#007AFF] text-sm`}>
                                Voltar ao Login
                            </Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        {/* Success State */}
                        <View style={tw`items-center mb-8`}>
                            <View style={tw`w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4`}>
                                <Text style={tw`text-green-600 text-3xl`}>✓</Text>
                            </View>
                            
                            <Text style={tw`text-2xl font-bold text-[#333] mb-2 text-center`}>
                                Email Enviado!
                            </Text>
                            
                            <Text style={tw`text-[#666] text-center mb-2 leading-6`}>
                                Enviamos instruções para redefinir sua senha para:
                            </Text>
                            
                            <Text style={tw`text-[#007AFF] font-semibold text-center mb-6`}>
                                {email}
                            </Text>
                            
                            <Text style={tw`text-[#666] text-center text-sm leading-5`}>
                                Verifique sua caixa de entrada e spam. O link expira em 1 hora.
                            </Text>
                        </View>

                        {/* Action Buttons */}
                        <TouchableOpacity
                            onPress={handleBackToLogin}
                            style={tw`w-full py-4 px-5 mb-4 bg-[#007AFF] rounded-full`}
                        >
                            <Text style={tw`text-white text-center font-semibold text-base`}>
                                Voltar ao Login
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleResendEmail}
                            style={tw`mb-5`}
                        >
                            <Text style={tw`text-[#007AFF] text-sm`}>
                                Não recebeu? Reenviar email
                            </Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* Development Info */}
                {__DEV__ && (
                    <View style={tw`mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg`}>
                        <Text style={tw`text-yellow-800 text-xs font-semibold mb-2`}>
                            🚧 Modo Desenvolvimento
                        </Text>
                        <Text style={tw`text-yellow-700 text-xs`}>
                            • Email enviado via backend{'\n'}
                            • Verifique logs do servidor{'\n'}
                            • Link de reset será enviado por email
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}
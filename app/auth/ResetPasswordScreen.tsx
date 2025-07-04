import React, { useState, useEffect } from "react";
import { View, TextInput, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import tw from "twrnc";
import AuthHeader from "../../src/presentation/components/AuthHeader";
import { useAuth } from "@/src/context/AuthContext";

interface ResetPasswordScreenProps {
    navigation: any;
    route: {
        params: {
            token?: string;
            uid?: string;
        };
    };
}

export default function ResetPasswordScreen({ navigation, route }: ResetPasswordScreenProps) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);
    
    const { resetPassword, error, clearError } = useAuth();
    const { token, uid } = route.params || {};

    useEffect(() => {
        // Validate token when component mounts
        if (token) {
            validateToken();
        } else {
            setTokenValid(false);
        }
    }, [token]);

    const validateToken = async () => {
        try {
            // You can add token validation logic here
            // For now, we'll assume it's valid if present
            setTokenValid(true);
        } catch (error) {
            console.error("Token validation failed:", error);
            setTokenValid(false);
        }
    };

    const handleResetPassword = async () => {
        clearError();
        
        // Validation
        if (!newPassword.trim()) {
            Alert.alert("Erro", "Por favor, insira a nova senha");
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Erro", "As senhas não coincidem");
            return;
        }

        if (!uid) {
            Alert.alert("Erro", "ID do usuário inválido");
            return;
        }

        try {
            setIsLoading(true);
            console.log("🔄 Redefinindo senha...");
            
            await resetPassword(
                uid,
                newPassword
            );
            
            console.log("✅ Senha redefinida com sucesso");
            
        } catch (error) {
            console.error("❌ Erro ao redefinir senha:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigation.navigate('LoginScreen');
    };

    // Loading state while validating token
    if (tokenValid === null) {
        return (
            <View style={tw`flex-1 justify-center items-center bg-white`}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={tw`mt-4 text-base text-gray-600`}>
                    Validando token...
                </Text>
            </View>
        );
    }

    // Invalid token state
    if (tokenValid === false) {
        return (
            <View style={tw`flex-1 items-center bg-white`}>
                <AuthHeader 
                    navigation={navigation} 
                    showBackButton={true} 
                    activeTab="ResetPassword" 
                    step={1} 
                />
                
                <View style={tw`bg-white flex-2 max-w-[400px] w-full px-10 justify-center items-center`}>
                    <View style={tw`items-center mb-8`}>
                        <View style={tw`w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4`}>
                            <Text style={tw`text-red-600 text-3xl`}>✗</Text>
                        </View>
                        
                        <Text style={tw`text-2xl font-bold text-[#333] mb-2 text-center`}>
                            Link Inválido
                        </Text>
                        
                        <Text style={tw`text-[#666] text-center mb-6 leading-6`}>
                            Este link de redefinição de senha é inválido ou expirou.
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={handleBackToLogin}
                        style={tw`w-full py-4 px-5 mb-4 bg-[#007AFF] rounded-full`}
                    >
                        <Text style={tw`text-white text-center font-semibold text-base`}>
                            Voltar ao Login
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('ForgotPasswordScreen')}
                        style={tw`mb-5`}
                    >
                        <Text style={tw`text-[#007AFF] text-sm`}>
                            Solicitar novo link
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={tw`flex-1 items-center bg-white`}>
            {/* Top Section */}
            <AuthHeader 
                navigation={navigation} 
                showBackButton={true} 
                activeTab="ResetPassword" 
                step={1} 
            />

            {/* Form Section */}
            <View style={tw`bg-white flex-2 max-w-[400px] w-full px-10 justify-start items-center mt-20 relative z-0`}>
                
                {/* Title */}
                <Text style={tw`text-2xl font-bold text-[#333] mb-2 text-center`}>
                    Nova Senha
                </Text>
                
                <Text style={tw`text-[#666] text-center mb-8 leading-6`}>
                    Digite sua nova senha abaixo.
                </Text>

                {/* Error Message */}
                {error && (
                    <View style={tw`w-full bg-red-100 border border-red-300 rounded-lg p-3 mb-4`}>
                        <Text style={tw`text-red-700 text-sm text-center`}>
                            {error}
                        </Text>
                    </View>
                )}

                {/* New Password Input */}
                <TextInput
                    placeholder="Nova senha"
                    secureTextEntry={true}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    editable={!isLoading}
                    style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#333] rounded-full border-0`}
                />

                {/* Confirm Password Input */}
                <TextInput
                    placeholder="Confirmar nova senha"
                    secureTextEntry={true}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!isLoading}
                    style={tw`w-full py-4 px-5 mb-6 bg-[#F5F5F5] text-[#333] rounded-full border-0`}
                />

                        {/* Password Requirements */}
                <View style={tw`w-full mb-6`}>
                    <Text style={tw`text-xs text-[#666] mb-2`}>A senha deve ter:</Text>
                    <Text style={tw`text-xs text-[#666] ${newPassword.length >= 6 ? 'text-green-600' : ''}`}>
                        • Pelo menos 6 caracteres
                    </Text>
                    <Text style={tw`text-xs text-[#666] ${newPassword === confirmPassword && newPassword.length > 0 ? 'text-green-600' : ''}`}>
                        • Confirmação deve coincidir
                    </Text>
                </View>

                {/* Reset Password Button */}
                <TouchableOpacity
                    onPress={handleResetPassword}
                    disabled={isLoading}
                    style={tw`w-full py-4 px-5 mb-5 bg-[#007AFF] rounded-full ${isLoading ? 'opacity-50' : ''}`}
                >
                    {isLoading ? (
                        <View style={tw`flex-row justify-center items-center`}>
                            <ActivityIndicator color="#FFFFFF" size="small" />
                            <Text style={tw`text-white text-center font-semibold text-base ml-2`}>
                                Redefinindo...
                            </Text>
                        </View>
                    ) : (
                        <Text style={tw`text-white text-center font-semibold text-base`}>
                            Redefinir Senha
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

                {/* Development Info */}
                {__DEV__ && (
                    <View style={tw`mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg`}>
                        <Text style={tw`text-yellow-800 text-xs font-semibold mb-2`}>
                            🚧 Modo Desenvolvimento
                        </Text>
                        <Text style={tw`text-yellow-700 text-xs`}>
                            • Token: {token ? '✅ Presente' : '❌ Ausente'}{'\n'}
                            • UID: {uid ? '✅ Presente' : '❌ Ausente'}{'\n'}
                            • Validação: {tokenValid ? '✅ Válido' : '❌ Inválido'}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

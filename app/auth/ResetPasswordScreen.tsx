import React, { useState, useEffect } from "react";
import { View, TextInput, Text, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

    const { resetPassword, error, clearError } = useAuth();
    const { token, uid } = route.params || {};

    useEffect(() => {
        if (token) {
            validateToken();
        } else {
            setTokenValid(false);
        }
    }, [token]);

    const validateToken = async () => {
        try {
            // Token validation logic here
            setTokenValid(true);
        } catch (error) {
            console.error("Token validation failed:", error);
            setTokenValid(false);
        }
    };

    const validatePassword = (password: string) => {
        const errors: { [key: string]: string } = {};

        if (!password.trim()) {
            errors.newPassword = "Senha é obrigatória";
        } else if (password.length < 6) {
            errors.newPassword = "Senha deve ter pelo menos 6 caracteres";
        }

        if (!confirmPassword.trim()) {
            errors.confirmPassword = "Confirmação de senha é obrigatória";
        } else if (password !== confirmPassword) {
            errors.confirmPassword = "Senhas não coincidem";
        }

        return errors;
    };

    const handlePasswordChange = (text: string) => {
        setNewPassword(text);
        if (errors.newPassword) {
            setErrors(prev => ({ ...prev, newPassword: '' }));
        }
        if (error) clearError();
    };

    const handleConfirmPasswordChange = (text: string) => {
        setConfirmPassword(text);
        if (errors.confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: '' }));
        }
        if (error) clearError();
    };

    const handleResetPassword = async () => {
        clearError();

        const validationErrors = validatePassword(newPassword);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        if (!uid) {
            Alert.alert("Erro", "ID do usuário inválido");
            return;
        }

        try {
            setIsLoading(true);
            console.log("🔄 Redefinindo senha...");

            await resetPassword(uid, newPassword);

            console.log("✅ Senha redefinida com sucesso");
            setPasswordResetSuccess(true);

        } catch (error) {
            console.error("❌ Erro ao redefinir senha:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigation.navigate('LoginScreen');
    };

    const getInputStyle = (fieldName: string) => [
        tw`flex-row items-center bg-white rounded-xl px-4 py-4 border`,
        errors[fieldName] ? tw`border-red-300` : tw`border-gray-200`
    ];

    // Loading state while validating token
    if (tokenValid === null) {
        return (
            <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={tw`mt-4 text-base text-gray-600`}>
                    Validando token...
                </Text>
            </View>
        );
    }

    // Invalid token state
    if (tokenValid === false) {
        return (
            <KeyboardAvoidingView
                style={tw`flex-1 bg-gray-50`}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <AuthHeader
                    navigation={navigation}
                    showBackButton={true}
                    activeTab="ResetPassword"
                    step={1}
                />

                <ScrollView
                    style={tw`flex-1`}
                    contentContainerStyle={tw`flex-grow justify-center`}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={tw`px-6 py-8`}>
                        <View style={tw`items-center mb-8`}>
                            <View style={tw`w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4`}>
                                <Ionicons name="close-circle" size={32} color="#EF4444" />
                            </View>

                            <Text style={tw`text-3xl font-bold text-gray-900 mb-2 text-center`}>
                                Link Inválido
                            </Text>

                            <Text style={tw`text-gray-600 text-center mb-6 leading-6`}>
                                Este link de redefinição de senha é inválido ou expirou.
                            </Text>
                        </View>

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
                            onPress={() => navigation.navigate('ForgotPasswordScreen')}
                            style={tw`py-2`}
                        >
                            <Text style={tw`text-blue-600 text-center font-medium`}>
                                Solicitar novo link
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    // Success state
    if (passwordResetSuccess) {
        return (
            <KeyboardAvoidingView
                style={tw`flex-1 bg-gray-50`}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <AuthHeader
                    navigation={navigation}
                    showBackButton={false}
                    activeTab="ResetPassword"
                    step={1}
                />

                <ScrollView
                    style={tw`flex-1`}
                    contentContainerStyle={tw`flex-grow justify-center`}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={tw`px-6 py-8`}>
                        <View style={tw`items-center mb-8`}>
                            <View style={tw`w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4`}>
                                <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                            </View>

                            <Text style={tw`text-3xl font-bold text-gray-900 mb-2 text-center`}>
                                Senha Redefinida!
                            </Text>

                            <Text style={tw`text-gray-600 text-center mb-6 leading-6`}>
                                Sua senha foi redefinida com sucesso. Agora você pode fazer login com sua nova senha.
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={handleBackToLogin}
                            style={tw`bg-blue-600 rounded-xl py-4 px-6 shadow-sm`}
                            activeOpacity={0.8}
                        >
                            <Text style={tw`text-white font-semibold text-base text-center`}>
                                Fazer Login
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    return (
        <KeyboardAvoidingView
            style={tw`flex-1 bg-gray-50`}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <AuthHeader
                navigation={navigation}
                showBackButton={true}
                activeTab="ResetPassword"
                step={1}
            />

            <ScrollView
                style={tw`flex-1`}
                contentContainerStyle={tw`flex-grow`}
                showsVerticalScrollIndicator={false}
            >
                <View style={tw`px-6 py-8 mt-8`}>

                    {/* Header */}
                    <View style={tw`mb-8 items-center`}>
                        <View style={tw`w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4`}>
                            <Ionicons name="lock-closed-outline" size={32} color="#3B82F6" />
                        </View>
                        <Text style={tw`text-3xl font-bold text-gray-900 mb-2 text-center`}>
                            Nova Senha
                        </Text>
                        <Text style={tw`text-gray-600 text-center leading-6`}>
                            Digite sua nova senha abaixo.
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

                    {/* New Password Input */}
                    <View style={tw`mb-4`}>
                        <Text style={tw`text-gray-700 font-medium mb-2`}>Nova Senha</Text>
                        <View style={getInputStyle('newPassword')}>
                            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                            <TextInput
                                placeholder="Digite sua nova senha"
                                secureTextEntry={!showNewPassword}
                                value={newPassword}
                                onChangeText={handlePasswordChange}
                                editable={!isLoading}
                                style={tw`flex-1 ml-3 text-gray-900 text-base`}
                                placeholderTextColor="#9CA3AF"
                            />
                            <TouchableOpacity
                                onPress={() => setShowNewPassword(!showNewPassword)}
                                style={tw`p-1`}
                            >
                                <Ionicons
                                    name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color="#9CA3AF"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.newPassword && (
                            <Text style={tw`text-red-500 text-sm mt-1 ml-1`}>
                                {errors.newPassword}
                            </Text>
                        )}
                    </View>

                    {/* Confirm Password Input */}
                    <View style={tw`mb-6`}>
                        <Text style={tw`text-gray-700 font-medium mb-2`}>Confirmar Nova Senha</Text>
                        <View style={getInputStyle('confirmPassword')}>
                            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                            <TextInput
                                placeholder="Confirme sua nova senha"
                                secureTextEntry={!showConfirmPassword}
                                value={confirmPassword}
                                onChangeText={handleConfirmPasswordChange}
                                editable={!isLoading}
                                style={tw`flex-1 ml-3 text-gray-900 text-base`}
                                placeholderTextColor="#9CA3AF"
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={tw`p-1`}
                            >
                                <Ionicons
                                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color="#9CA3AF"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.confirmPassword && (
                            <Text style={tw`text-red-500 text-sm mt-1 ml-1`}>
                                {errors.confirmPassword}
                            </Text>
                        )}
                    </View>

                    {/* Password Requirements */}
                    <View style={tw`bg-gray-50 rounded-xl p-4 mb-6`}>
                        <Text style={tw`text-gray-700 font-medium mb-2`}>Requisitos da senha:</Text>
                        <View style={tw`space-y-1`}>
                            <View style={tw`flex-row items-center`}>
                                <Ionicons
                                    name={newPassword.length >= 6 ? "checkmark-circle" : "ellipse-outline"}
                                    size={16}
                                    color={newPassword.length >= 6 ? "#10B981" : "#9CA3AF"}
                                />
                                <Text style={[
                                    tw`ml-2 text-sm`,
                                    newPassword.length >= 6 ? tw`text-green-600` : tw`text-gray-600`
                                ]}>
                                    Pelo menos 6 caracteres
                                </Text>
                            </View>
                            <View style={tw`flex-row items-center`}>
                                <Ionicons
                                    name={newPassword === confirmPassword && newPassword.length > 0 ? "checkmark-circle" : "ellipse-outline"}
                                    size={16}
                                    color={newPassword === confirmPassword && newPassword.length > 0 ? "#10B981" : "#9CA3AF"}
                                />
                                <Text style={[
                                    tw`ml-2 text-sm`,
                                    newPassword === confirmPassword && newPassword.length > 0 ? tw`text-green-600` : tw`text-gray-600`
                                ]}>
                                    Senhas coincidem
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Reset Password Button */}
                    <TouchableOpacity
                        onPress={handleResetPassword}
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
                                    Redefinindo...
                                </Text>
                            </View>
                        ) : (
                            <Text style={tw`text-white font-semibold text-base text-center`}>
                                Redefinir Senha
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
                                • Token: {token ? '✅ Presente' : '❌ Ausente'}{'\n'}
                                • UID: {uid ? '✅ Presente' : '❌ Ausente'}{'\n'}
                                • Validação: {tokenValid ? '✅ Válido' : '❌ Inválido'}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

import { useAuth } from "@/src/context/AuthContext";
import { FormData1, FormData2, UserRegisterData } from "@/src/interfaces/auth.interface";
import { Gender, Grade, School, UserRole } from "@/src/interfaces/index.interface";
import React, { useState } from "react";
import { Text, TouchableOpacity, View, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import AuthHeader from "../../src/presentation/components/AuthHeader";
import Form1 from "../../src/presentation/components/RegistrationForm1";
import Form2 from "../../src/presentation/components/RegistrationForm2";
import SelectProfile from "../../src/presentation/components/SelectProfile";

export default function RegisterScreen({ navigation }: any) {
    const [selectedProfile, setSelectedProfile] = useState<UserRole>(UserRole.MENTOR);
    const [registerStep, setRegisterStep] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
    const { register, error, clearError } = useAuth();

    const [formData1, setFormData1] = useState<FormData1>({
        role: selectedProfile,
        fullName: "",
        gender: Gender.MALE,
        birth: new Date(),
        cellphone: "",
        email: "",
    });

    const [formData2, setFormData2] = useState<FormData2>({
        school: School.CAXITO,
        grade: Grade.GRADE_10,
        password: "",
        maxMenteeNumber: null,
        municipality: "",
        province: "",
        schoolYear: null,
    });

    const [confirmPassword, setConfirmPassword] = useState("");

    const handleForm1Change = (field: keyof FormData1, value: any) => {
        setFormData1((prev) => ({ ...prev, [field]: value }));
        if (error) clearError();
    };

    const handleForm2Change = (field: keyof FormData2, value: string | number) => {
        setFormData2((prev) => ({ ...prev, [field]: value }));
        if (error) clearError();
    };

    const validateStep1 = () => {
        const { fullName, email, cellphone } = formData1;

        if (!fullName.trim()) {
            alert("Nome é obrigatório");
            return false;
        }

        if (!cellphone.trim()) {
            alert("Telefone é obrigatório");
            return false;
        }

        if (!email.trim()) {
            alert("Email é obrigatório");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            alert("Email inválido");
            return false;
        }

        return true;
    };

    const validateStep2 = () => {
        const { school, password, province, municipality } = formData2;

        if (!school) {
            alert("Escola é obrigatória");
            return false;
        }

        if (selectedProfile === UserRole.MENTEE && !formData2.grade) {
            alert("Classe é obrigatória para mentorados");
            return false;
        }

        if (selectedProfile !== UserRole.MENTEE && !formData2.schoolYear) {
            alert("Ano de conclusão é obrigatório");
            return false;
        }

        if (!province) {
            alert("Província é obrigatória");
            return false;
        }

        if (!municipality) {
            alert("Município é obrigatório");
            return false;
        }

        if (!password.trim()) {
            alert("Senha é obrigatória");
            return false;
        }

        if (password.length < 6) {
            alert("Senha deve ter pelo menos 6 caracteres");
            return false;
        }

        if (password !== confirmPassword) {
            alert("As senhas não coincidem!");
            return false;
        }

        return true;
    };

    const getStepTitle = () => {
        switch (registerStep) {
            case 1:
                return "Escolha seu perfil";
            case 2:
                return "Informações pessoais";
            case 3:
                return "Informações acadêmicas";
            default:
                return "Cadastro";
        }
    };

    const getStepDescription = () => {
        switch (registerStep) {
            case 1:
                return "Selecione como você deseja participar da plataforma";
            case 2:
                return "Preencha seus dados pessoais";
            case 3:
                return "Complete suas informações acadêmicas e crie sua senha";
            default:
                return "";
        }
    };

    const handleNext = () => {
        // Clear any previous errors when moving to next step
        if (error) {
            clearError();
        }
        
        if (registerStep === 1) {
            setRegisterStep(2);
        } else if (registerStep === 2) {
            if (validateStep1()) {
                setRegisterStep(3);
            }
        } else {
            handleSubmitForm();
        }
    };

    const handleBack = () => {
        if (error) {
            clearError(); // Clear errors when going back
        }
        
        if (registerStep > 1) {
            setRegisterStep(registerStep - 1);
        } else {
            navigation.goBack(); // Go back to previous screen
        }
    };

    const handleSubmitForm = async () => {
        if (!validateStep2()) {
            return;
        }

        const registerData: UserRegisterData = {
            ...formData1,
            ...formData2,
            role: selectedProfile,
        };

        try {
            setIsLoading(true);
            setRegistrationStatus('loading');
            clearError(); // Clear any previous errors

            console.log("🔄 Iniciando registro...", registerData);

            if (!register) return;

            const result = await register(registerData);

            if (result) {
                console.log("✅ Registro bem-sucedido!");
                setRegistrationStatus('success');
            }

        } catch (error: any) {
            console.error("❌ Erro no registro:", error);
            // setRegistrationStatus('error');

            // Handle specific error cases
            if (error?.status === 409 || error?.message?.includes('409')) {
                // Email already exists
                alert("Este email já está registrado. Tente fazer login ou use outro email.");
            } else if (error?.message) {
                alert(`Erro no registro: ${error.message}`);
            } else {
                alert("Erro no registro. Tente novamente.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const getButtonText = () => {
        switch (registerStep) {
            case 1:
                return "Continuar";
            case 2:
                return "Próximo";
            case 3:
                return "Criar Conta";
            default:
                return "Continuar";
        }
    };

    return (
        <KeyboardAvoidingView
            style={tw`flex-1 bg-gray-50`}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <AuthHeader
                navigation={navigation}
                showBackButton={registerStep !== 1}
                activeTab="Cadastro"
                step={registerStep}
            />

            <ScrollView
                style={tw`flex-1`}
                contentContainerStyle={tw`flex-grow`}
                showsVerticalScrollIndicator={false}
            >
                <View style={tw`px-6 py-8 mt-8`}>
                    {/* Progress Indicator */}
                    <View style={tw`mb-8`}>
                        <View style={tw`flex-row justify-between items-center mb-4`}>
                            {[1, 2, 3].map((step) => (
                                <View key={step} style={tw`flex-1 flex-row items-center`}>
                                    <View style={[
                                        tw`w-8 h-8 rounded-full flex items-center justify-center`,
                                        step <= registerStep ? tw`bg-blue-600` : tw`bg-gray-300`
                                    ]}>
                                        {step < registerStep ? (
                                            <Ionicons name="checkmark" size={16} color="white" />
                                        ) : (
                                            <Text style={[
                                                tw`text-sm font-semibold`,
                                                step <= registerStep ? tw`text-white` : tw`text-gray-600`
                                            ]}>
                                                {step}
                                            </Text>
                                        )}
                                    </View>
                                    {step < 3 && (
                                        <View style={[
                                            tw`flex-1 h-0.5 mx-2`,
                                            step < registerStep ? tw`bg-blue-600` : tw`bg-gray-300`
                                        ]} />
                                    )}
                                </View>
                            ))}
                        </View>

                        <Text style={tw`text-2xl font-bold text-gray-900 mb-2`}>
                            {getStepTitle()}
                        </Text>
                        <Text style={tw`text-gray-600 leading-6`}>
                            {getStepDescription()}
                        </Text>
                    </View>

                    {/* Global Error Message */}
                    {error && (
                        <View style={tw`bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6`}>
                            <View style={tw`flex-row items-center mb-2`}>
                                <Ionicons name="alert-circle" size={24} color="#EF4444" />
                                <Text style={tw`text-red-800 font-semibold text-base ml-2`}>
                                    Erro no Cadastro
                                </Text>
                            </View>
                            <Text style={tw`text-red-700 text-sm leading-5`}>
                                {error}
                            </Text>
                            {error.includes("email") && (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('LoginScreen')}
                                    style={tw`mt-3 bg-red-100 rounded-lg py-2 px-3`}
                                >
                                    <Text style={tw`text-red-700 font-medium text-center`}>
                                        Ir para Login
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Form Content */}
                    <View style={tw`mb-8`}>
                        {registerStep === 1 && (
                            <SelectProfile
                                selectedProfile={selectedProfile}
                                setSelectedProfile={(value) => {
                                    setSelectedProfile(value);
                                    setFormData1((prev) => ({ ...prev, role: value }));
                                }}
                            />
                        )}

                        {registerStep === 2 && (
                            <Form1 formData={formData1} onChange={handleForm1Change} />
                        )}

                        {registerStep === 3 && (
                            <Form2
                                onChange={handleForm2Change}
                                setConfirmPassword={setConfirmPassword}
                                role={selectedProfile}
                            />
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={tw`space-y-4`}>
                        <TouchableOpacity
                            onPress={handleNext}
                            disabled={isLoading}
                            style={[
                                tw`bg-blue-600 rounded-xl py-4 px-6 shadow-sm`,
                                isLoading && tw`opacity-70`
                            ]}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <View style={tw`flex-row justify-center items-center`}>
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                    <Text style={tw`text-white font-semibold text-base ml-2`}>
                                        Criando conta...
                                    </Text>
                                </View>
                            ) : (
                                <Text style={tw`text-white font-semibold text-base text-center`}>
                                    {getButtonText()}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {registerStep > 1 && (
                            <TouchableOpacity
                                onPress={handleBack}
                                disabled={isLoading}
                                style={tw`py-2`}
                            >
                                <Text style={tw`text-blue-600 text-center font-medium`}>
                                    Voltar
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Login Link */}
                    <View style={tw`flex-row justify-center items-center mt-8`}>
                        <Text style={tw`text-gray-600 text-base`}>
                            Já tem uma conta?{" "}
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('LoginScreen')}
                            disabled={isLoading}
                        >
                            <Text style={tw`text-blue-600 font-semibold text-base`}>
                                Entrar
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Info Box */}
                    <View style={tw`mt-8 bg-blue-50 rounded-xl p-4 flex-row items-start`}>
                        <Ionicons name="shield-checkmark-outline" size={20} color="#3B82F6" style={tw`mr-3 mt-0.5`} />
                        <Text style={tw`text-blue-800 text-sm leading-5 flex-1`}>
                            Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade.
                            Suas informações são protegidas e criptografadas.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

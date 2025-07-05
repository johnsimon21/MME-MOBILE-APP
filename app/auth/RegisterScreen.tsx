import { useAuth } from "@/src/context/AuthContext";
import { FormData1, FormData2, UserRegisterData } from "@/src/interfaces/auth.interface";
import { Gender, Grade, School, UserRole } from "@/src/interfaces/index.interface";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import AuthHeader from "../../src/presentation/components/AuthHeader";
import Form1 from "../../src/presentation/components/RegistrationForm1";
import Form2 from "../../src/presentation/components/RegistrationForm2";
import SelectProfile from "../../src/presentation/components/SelectProfile";


export default function RegisterScreen({ navigation }: any) {
    const [selectedProfile, setSelectedProfile] = useState<UserRole>(UserRole.MENTOR); // Default to MENTOR
    var [registerStep, setRegisterStep] = useState<number>(1);
    const [submitMessage, setSubmitMessage] = useState<"Próximo" | "Criar">("Próximo");
    const { register } = useAuth();

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
        schoolYear: null,
    });

    const [confirmPassword, setConfirmPassword] = useState("");

    const handleForm1Change = (field: keyof FormData1, value: any) => {
        setFormData1((prev) => ({ ...prev, [field]: value }));
    };

    const handleForm2Change = (field: keyof FormData2, value: string) => {
        setFormData2((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (registerStep < 2) {
            setRegisterStep(registerStep + 1);
            setSubmitMessage('Próximo');
            console.log(registerStep)
        } else {
            if (registerStep === 2) {
                setRegisterStep(registerStep + 1);
                setSubmitMessage('Criar');
            } else {
                handleSubmitForm();
            }
        }
    };

    const handleSubmitForm = async () => {
        if (formData2.password !== confirmPassword) {
            alert("As senhas não coincidem!");
            return;
        }

        const registerData: UserRegisterData = {
            ...formData1,
            ...formData2,
            role: selectedProfile,
        };
        console.log(registerData)
        if (!register) return; // Ensure auth context is available

        await register(registerData);
    };

    return (
        <View style={tw`flex-1 items-center bg-white`}>
            <AuthHeader navigation={navigation} showBackButton={registerStep !== 1 ? true : false} activeTab="Cadastro" step={registerStep} />

            <View style={tw`relative  border-0 flex-1 h-full max-w-[400px] w-full px-10 py-0 mt-20 z-0`}>
                {registerStep === 1 &&
                    <SelectProfile
                        selectedProfile={selectedProfile}
                        setSelectedProfile={(value) => {
                            setSelectedProfile(value);
                            setFormData1((prev) => ({ ...prev, role: value }));
                        }}
                    />
                }
                {registerStep === 2 &&
                    <Form1 formData={formData1} onChange={handleForm1Change} />
                }
                {registerStep === 3 &&
                    <Form2 onChange={handleForm2Change} setConfirmPassword={setConfirmPassword} role={selectedProfile} />
                }

                <TouchableOpacity style={tw`w-full bg-[#4285F4] rounded-3xl mt-8 p-4 border-0 cursor-pointer`} onPress={handleSubmit}>
                    <Text style={tw`text-center text-white font-bold text-md`}>{submitMessage}</Text>
                </TouchableOpacity >
            </View>
        </View>
    );
}

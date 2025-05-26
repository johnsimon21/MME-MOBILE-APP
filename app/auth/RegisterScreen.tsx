import React, { useContext, useState } from "react";
import AuthHeader from "../../src/presentation/components/AuthHeader";
import SelectProfile from "../../src/presentation/components/SelectProfile";
import Form1 from "../../src/presentation/components/RegistrationForm1";
import { AuthContext, RegisterFullFormData } from "../../src/context/AuthContext";
import Form2 from "../../src/presentation/components/RegistrationForm2";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

export type FormData1 = {
    profile: "MENTOR" | "MENTORADO" | "COORDENADOR";
    fullName: string;
    gender: "MASCULINO" | "FEMININO";
    birth: Date;
    cellphone: string;
    email: string;
};

export type FormData2 = {
    school: "CAXITO" | "MALANJE" | "NDALATANDO" | "ONDJIVA";
    grade: "10" | "11" | "12" | null;
    password: string;
    schoolYear: number | null;
    maxMenteeNumber: number | null;
};

export default function RegisterScreen({ navigation }: any) {
    const [selectedProfile, setSelectedProfile] = useState<FormData1["profile"]>("MENTOR");
    var [registerStep, setRegisterStep] = useState<number>(1);
    const [submitMessage, setSubmitMessage] = useState<"Próximo" | "Criar">("Próximo");
    const auth = useContext(AuthContext);

    const [formData1, setFormData1] = useState<FormData1>({
        profile: selectedProfile,
        fullName: "",
        gender: "MASCULINO",
        birth: new Date(),
        cellphone: "",
        email: "",
    });

    const [formData2, setFormData2] = useState<FormData2>({
        school: "CAXITO",
        grade: "10",
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

        const registerData: RegisterFullFormData = {
            ...formData1,
            ...formData2,
            profile: selectedProfile,
        };
        console.log(registerData)
        if (!auth) return; // Ensure auth context is available

        await auth.register(registerData);
    };

    return (
        <View style={tw`flex-1 items-center bg-white`}>
            <AuthHeader navigation={navigation} activeTab="Cadastro" step={registerStep} />

            <View style={tw`relative  border-0 flex-1 h-full max-w-[400px] w-full px-10 py-0 mt-20 z-0`}>
                {registerStep === 1 &&
                    <SelectProfile
                        selectedProfile={selectedProfile}
                        setSelectedProfile={(value) => {
                            setSelectedProfile(value);
                            setFormData1((prev) => ({ ...prev, profile: value }));
                        }}
                    />
                }
                {registerStep === 2 &&
                    <Form1 formData={formData1} onChange={handleForm1Change} />
                }
                {registerStep === 3 &&
                    <Form2 onChange={handleForm2Change} setConfirmPassword={setConfirmPassword} profile={selectedProfile} />
                }

                <TouchableOpacity  style={tw`w-full bg-[#4285F4] rounded-3xl mt-8 p-4 border-0 cursor-pointer`} onPress={handleSubmit}>
                    <Text style={tw`text-center text-white font-bold text-md`}>{submitMessage}</Text>
                </TouchableOpacity >
            </View>
        </View>
    );
}

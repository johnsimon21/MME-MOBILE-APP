import React, { useContext, useState } from "react";
import { View, TextInput, Text, Button, TouchableOpacity } from "react-native";
import tw from "twrnc";
import AuthHeader from "../../src/presentation/components/AuthHeader";
import { AuthContext } from "@/src/context/AuthContext";

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const auth = useContext(AuthContext);

    const handleLogin = async () => {
        const result = await auth?.login(email, password);
        console.log("Tentando fazer login com:", email, password);
        if (result) {
            console.log("Login bem-sucedido!");
        } else {
            alert("Credenciais inválidas");
        }
    };

    return (
        <View style={tw`flex-1 items-center bg-white`}>
            {/* Top Section */}
            <AuthHeader navigation={navigation} activeTab="Login" step={1} />

            {/* Form Section */}
            <View style={tw`bg-white flex-2 max-w-[400px] w-full px-10 justify-start items-center mt-20 relative z-0`}>
                <TextInput
                    placeholder="Telefone ou email"
                    keyboardType="email-address"
                    value={email}
                    onChange={(event) => setEmail(event.nativeEvent.text)}
                    style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
                />
                <TextInput
                    placeholder="Palavra passe"
                    secureTextEntry={true}
                    value={password}
                    onChange={(event) => setPassword(event.nativeEvent.text)}
                    style={tw`w-full py-4 px-5 mb-8 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
                />
                <Text style={tw`text-[#4A4852] text-xs mb-8`}>Esqueceste a palavra passe?</Text>

                {/* Login Button */}
                <TouchableOpacity  style={tw`w-full bg-[#4285F4] rounded-3xl mt-5 p-4 border-0 cursor-pointer flex justify-center items-center`} onPress={handleLogin}>
                    <Text style={tw`text-white font-bold text-md`}>Entrar</Text>
                </TouchableOpacity >

            </View>
        </View>
    );
}

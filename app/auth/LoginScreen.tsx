import React, { useContext, useState } from "react";
import "@/src/presentation/styles/global.css";
import { View, TextInput, Text, Button, TouchableOpacity } from "react-native";
import tw from "twrnc";
import AuthHeader from "../../src/presentation/components/AuthHeader";

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        navigation.navigate('AppNavigator')           
        if (email === "user@example.com" && password === "123456") {
            // await auth?.login(email, password);
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
                <input
                    placeholder="Telefone ou email"
                    type="text"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
                />
                <input
                    placeholder="Palavra passe"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    style={tw`w-full py-4 px-5 mb-8 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
                />
                <Text style={tw`text-[#4A4852] text-xs mb-8`}>Esqueceste a palavra passe?</Text>

                {/* Login Button */}
                <TouchableOpacity  style={tw`w-full bg-[#4285F4] rounded-3xl mt-5 p-4 text-white font-bold text-md border-0 cursor-pointer`} onPress={handleLogin}>
                    Entrar
                </TouchableOpacity >

            </View>
        </View>
    );
}

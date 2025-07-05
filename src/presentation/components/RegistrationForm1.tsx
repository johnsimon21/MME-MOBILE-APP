import { FormData1 } from "@/src/interfaces/auth.interface";
import React from "react";
import { TextInput, View } from "react-native";
import tw from "twrnc";

interface Form1Props {
    onChange: (field: keyof FormData1, value: any) => void,
    formData: FormData1;
}


export default function Form1({ formData, onChange }: Form1Props) {
    const genderOptions = {
        "Masculino": "male",
        "Feminino": "female",
    };

    return (
        <View style={tw`bg-transparent m-0 p-0 w-full flex flex-col justify-start items-center`} >
            {/* Nome Completo */}
            <TextInput
                style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
                placeholder="Nome Completo"
                value={formData.fullName}
                onChange={(text) => onChange("fullName", text.nativeEvent.text)}
            />

            {/* Gênero (Dropdown) */}
            < select
                required
                style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
                onChange={(event) => {
                    onChange("gender", event.target.value);
                }}

            >
                {Object.entries(genderOptions).map(([key, value], index) => (
                    <option key={index} value={key}>
                        {value}
                    </option>
                ))}
            </select>

            {/* Data de Nascimento */}
            <TextInput
                style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
                placeholder="Data de Nascimento"
                value={formData.birth ? formData.birth.toISOString().slice(0, 10) : ""}
                onChange={(text) => onChange("birth", text.nativeEvent.text)}
            />

            {/* Telefone */}
            <TextInput
                style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
                placeholder="Telefone"
                value={formData.cellphone}
                onChange={(text) => onChange("cellphone", text.nativeEvent.text)}
            />

            {/* E-mail */}
            <TextInput
                style={tw`w-full py-4 px-5 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
                placeholder="E-mail"
                value={formData.email}
                onChange={(text) => onChange("email", text.nativeEvent.text)}
            />
        </View>
    );
}


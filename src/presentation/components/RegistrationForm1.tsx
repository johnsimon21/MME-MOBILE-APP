import React from "react";
import { View } from "react-native";
import { FormData1 } from "../../../app/auth/RegisterScreen";
import tw from "twrnc";

interface Form1Props {
    onChange: (field: keyof FormData1, value: any) => void,
    formData: FormData1;
}


export default function Form1({ formData, onChange }: Form1Props) {
    const genderOptions = ['MASCULINO', 'FEMININO'];

    return (
        <View style={tw`bg-transparent m-0 p-0 w-full flex flex-col justify-start items-center`} >
            {/* Nome Completo */}
            <input
                style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
                placeholder="Nome Completo"
                value={formData.fullName}
                onChange={(text) => onChange("fullName", text.target.value)}
            />

            {/* Gênero (Dropdown) */}
            <select
                required
                style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
                onChange={(event) => {
                    onChange("gender", event.target.value);
                }}

            >
                {genderOptions.map((option, index) => (
                    <option key={index} value={option}>
                        {option}
                    </option>
                ))}
            </select>

            {/* Data de Nascimento */}
            <input
                required
                type="date"
                style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
                placeholder="Data de Nascimento"
                onChange={(text) => onChange("birth", text)}
            />

            {/* Telefone */}
            <input
                style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
                placeholder="Telefone"
                value={formData.cellphone}
                onChange={(text) => onChange("cellphone", text.target.value)}
            />

            {/* E-mail */}
            <input
                style={tw`w-full py-4 px-5 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
                placeholder="E-mail"
                value={formData.email}
                onChange={(text) => onChange("email", text.target.value)}
            />
        </View>
    );
}


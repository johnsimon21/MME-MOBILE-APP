import React from "react";
import { Text, View } from "react-native";
import tw from "twrnc";
import { Radio } from "./Radio"; // Import the custom Radio component

interface SelectProfileProps {
  selectedProfile: "MENTOR" | "MENTORADO" | "COORDENADOR";
  setSelectedProfile: (profile: "MENTOR" | "MENTORADO" | "COORDENADOR") => void;
}

export default function SelectProfile({ selectedProfile, setSelectedProfile }: SelectProfileProps) {
  return (
    <View style={tw`bg-white m-0 p-0`}>
      <Text style={tw`text-sm mb-6`}>Selecione o seu perfil</Text>

      <Radio checked={selectedProfile === "MENTOR"} onChange={() => setSelectedProfile("MENTOR")}>
        Mentor
      </Radio>

      <Radio checked={selectedProfile === "MENTORADO"} onChange={() => setSelectedProfile("MENTORADO")}>
        Mentorado
      </Radio>

      <Radio checked={selectedProfile === "COORDENADOR"} onChange={() => setSelectedProfile("COORDENADOR")}>
        Coordenador
      </Radio>
    </View>
  );
}

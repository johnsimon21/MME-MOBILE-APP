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
         <Text style={tw`text-sm`}> Mentor</Text>
      </Radio>

      <Radio checked={selectedProfile === "MENTORADO"} onChange={() => setSelectedProfile("MENTORADO")}>
        <Text style={tw`text-sm`}> Mentorado</Text>
      </Radio>

      <Radio checked={selectedProfile === "COORDENADOR"} onChange={() => setSelectedProfile("COORDENADOR")}>
        <Text style={tw`text-sm`}> Coordenador</Text>
      </Radio>
    </View>
  );
}

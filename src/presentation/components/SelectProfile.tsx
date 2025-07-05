import React from "react";
import { Text, View } from "react-native";
import tw from "twrnc";
import { Radio } from "./Radio"; // Import the custom Radio component
import { UserRole } from "@/src/interfaces/index.interface";

interface SelectProfileProps {
  selectedProfile: UserRole;
  setSelectedProfile: (role: UserRole) => void;
}

export default function SelectProfile({ selectedProfile, setSelectedProfile }: SelectProfileProps) {
  return (
    <View style={tw`bg-white m-0 p-0`}>
      <Text style={tw`text-sm mb-6`}>Selecione o seu perfil</Text>
  
      <Radio checked={selectedProfile === UserRole.MENTOR} onChange={() => setSelectedProfile(UserRole.MENTOR)}>
         <Text style={tw`text-sm`}> Mentor</Text>
      </Radio>

      <Radio checked={selectedProfile === UserRole.MENTEE} onChange={() => setSelectedProfile(UserRole.MENTEE)}>
        <Text style={tw`text-sm`}> Mentorado</Text>
      </Radio>

      <Radio checked={selectedProfile === UserRole.COORDINATOR} onChange={() => setSelectedProfile(UserRole.COORDINATOR)}>
        <Text style={tw`text-sm`}> Coordenador</Text>
      </Radio>
    </View>
  );
}

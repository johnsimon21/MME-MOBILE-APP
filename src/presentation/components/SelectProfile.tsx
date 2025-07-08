import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { UserRole } from "@/src/interfaces/index.interface";

interface SelectProfileProps {
  selectedProfile: UserRole;
  setSelectedProfile: (role: UserRole) => void;
}

export default function SelectProfile({ selectedProfile, setSelectedProfile }: SelectProfileProps) {
  const profiles = [
    {
      role: UserRole.MENTOR,
      title: "Mentor",
      description: "Compartilhe conhecimento e oriente estudantes",
      icon: "school-outline",
      color: "blue"
    },
    {
      role: UserRole.MENTEE,
      title: "Mentorado",
      description: "Receba orientação e acelere seu aprendizado",
      icon: "person-outline",
      color: "green"
    },
    {
      role: UserRole.COORDINATOR,
      title: "Coordenador",
      description: "Gerencie e coordene programas de mentoria",
      icon: "people-outline",
      color: "purple"
    }
  ];

  const getCardStyle = (role: UserRole, color: string) => {
    const isSelected = selectedProfile === role;
    const baseStyle = tw`bg-white rounded-2xl px-6 py-4 mb-4 border-2`;
    
    if (isSelected) {
      switch (color) {
        case "blue": return [baseStyle, tw`border-blue-500 bg-blue-50`];
        case "green": return [baseStyle, tw`border-green-500 bg-green-50`];
        case "purple": return [baseStyle, tw`border-purple-500 bg-purple-50`];
        default: return [baseStyle, tw`border-blue-500 bg-blue-50`];
      }
    }
    
    return [baseStyle, tw`border-gray-200`];
  };

  const getIconColor = (role: UserRole, color: string) => {
    const isSelected = selectedProfile === role;
    if (isSelected) {
      switch (color) {
        case "blue": return "#3B82F6";
        case "green": return "#10B981";
        case "purple": return "#8B5CF6";
        default: return "#3B82F6";
      }
    }
    return "#9CA3AF";
  };

  const getTextColor = (role: UserRole) => {
    return selectedProfile === role ? tw`text-gray-900` : tw`text-gray-700`;
  };

  return (
    <View style={tw`w-full`}>
      {profiles.map((profile) => (
        <TouchableOpacity
          key={profile.role}
          onPress={() => setSelectedProfile(profile.role)}
          style={getCardStyle(profile.role, profile.color)}
          activeOpacity={0.8}
        >
          <View style={tw`flex-row items-center`}>
            {/* Icon */}
            <View style={tw`mr-4`}>
              <Ionicons 
                name={profile.icon as any} 
                size={32} 
                color={getIconColor(profile.role, profile.color)} 
              />
            </View>

            {/* Content */}
            <View style={tw`flex-1`}>
              <Text style={[tw`text-xl font-bold mb-1`, getTextColor(profile.role)]}>
                {profile.title}
              </Text>
              <Text style={tw`text-gray-600 text-sm leading-5`}>
                {profile.description}
              </Text>
            </View>

            {/* Selection Indicator */}
            <View style={tw`ml-4`}>
              {selectedProfile === profile.role ? (
                <View style={[
                  tw`w-6 h-6 rounded-full items-center justify-center`,
                  profile.color === "blue" && tw`bg-blue-500`,
                  profile.color === "green" && tw`bg-green-500`,
                  profile.color === "purple" && tw`bg-purple-500`
                ]}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
              ) : (
                <View style={tw`w-6 h-6 rounded-full border-2 border-gray-300`} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}

      {/* Help Text */}
      <View style={tw`bg-blue-50 rounded-xl p-4 mt-4 flex-row items-start`}>
        <Ionicons name="information-circle-outline" size={20} color="#3B82F6" style={tw`mr-3 mt-0.5`} />
        <Text style={tw`text-blue-800 text-sm leading-5 flex-1`}>
          Você pode alterar seu perfil posteriormente nas configurações da conta.
        </Text>
      </View>
    </View>
  );
}

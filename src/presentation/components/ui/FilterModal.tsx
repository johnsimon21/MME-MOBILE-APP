import * as React from "react";
import { View, Text, TextInput, Modal, Pressable } from "react-native";
import tw from "twrnc";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: {
    userType: "Mentor" | "Mentorado" | null;
    status: "Disponível" | "Indisponível" | null;
    location: string | null;
  };
  setFilters: React.Dispatch<
    React.SetStateAction<{
      userType: "Mentor" | "Mentorado" | null;
      status: "Disponível" | "Indisponível" | null;
      location: string | null;
    }>
  >;
  onApply: () => void;
  onReset: () => void;
}

export function FilterModal({
  visible,
  onClose,
  filters,
  setFilters,
  onApply,
  onReset,
}: FilterModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 justify-end bg-black bg-opacity-50`}>
        <View style={tw`bg-white rounded-t-3xl p-5 h-2/3`}>
          <Text style={tw`text-xl font-bold mb-5 text-center`}>Filtrar por</Text>
          
          {/* User Type Filter */}
          <Text style={tw`text-lg font-semibold mb-2`}>Tipo de Usuário</Text>
          <View style={tw`flex-row mb-4`}>
            <Pressable
              style={tw`mr-2 px-4 py-2 rounded-full ${filters.userType === "Mentor" ? "bg-blue-500" : "bg-gray-200"}`}
              onPress={() => setFilters({...filters, userType: filters.userType === "Mentor" ? null : "Mentor"})}
            >
              <Text style={tw`${filters.userType === "Mentor" ? "text-white" : "text-gray-800"}`}>Mentor</Text>
            </Pressable>
            <Pressable
              style={tw`px-4 py-2 rounded-full ${filters.userType === "Mentorado" ? "bg-blue-500" : "bg-gray-200"}`}
              onPress={() => setFilters({...filters, userType: filters.userType === "Mentorado" ? null : "Mentorado"})}
            >
              <Text style={tw`${filters.userType === "Mentorado" ? "text-white" : "text-gray-800"}`}>Mentorado</Text>
            </Pressable>
          </View>
          
          {/* Status Filter */}
          <Text style={tw`text-lg font-semibold mb-2`}>Status</Text>
          <View style={tw`flex-row mb-4`}>
            <Pressable
              style={tw`mr-2 px-4 py-2 rounded-full ${filters.status === "Disponível" ? "bg-green-500" : "bg-gray-200"}`}
              onPress={() => setFilters({...filters, status: filters.status === "Disponível" ? null : "Disponível"})}
            >
              <Text style={tw`${filters.status === "Disponível" ? "text-white" : "text-gray-800"}`}>Disponível</Text>
            </Pressable>
            <Pressable
              style={tw`px-4 py-2 rounded-full ${filters.status === "Indisponível" ? "bg-red-500" : "bg-gray-200"}`}
              onPress={() => setFilters({...filters, status: filters.status === "Indisponível" ? null : "Indisponível"})}
            >
              <Text style={tw`${filters.status === "Indisponível" ? "text-white" : "text-gray-800"}`}>Indisponível</Text>
            </Pressable>
          </View>
          
          {/* Location Filter */}
          <Text style={tw`text-lg font-semibold mb-2`}>Localização</Text>
          <TextInput
            placeholder="Digite a localização"
            value={filters.location || ""}
            onChangeText={(text) => setFilters({...filters, location: text || null})}
            style={tw`bg-gray-100 px-4 py-2 rounded-lg mb-5`}
          />
          
          {/* Action Buttons */}
          <View style={tw`flex-row justify-between mt-4`}>
            <Pressable
              style={tw`flex-1 border border-gray-300 py-3 rounded-full mr-2`}
              onPress={onReset}
            >
              <Text style={tw`text-center`}>Limpar Filtros</Text>
            </Pressable>
            
            <Pressable
              style={tw`flex-1 bg-blue-500 py-3 rounded-full ml-2`}
              onPress={onApply}
            >
              <Text style={tw`text-center text-white`}>Aplicar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

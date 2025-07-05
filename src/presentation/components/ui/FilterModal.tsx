import React from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput } from 'react-native';
import tw from 'twrnc';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: {
    userType: "Mentor" | "Mentorado" | null;
    status: "Disponível" | "Indisponível" | null;
    location: string | null;
  };
  setFilters: (filters: any) => void;
  onApply: () => void;
  onReset: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  setFilters,
  onApply,
  onReset,
}) => {
  const [localLocation, setLocalLocation] = React.useState(filters.location || '');

  React.useEffect(() => {
    setLocalLocation(filters.location || '');
  }, [filters.location]);

  const handleApply = () => {
    setFilters({
      ...filters,
      location: localLocation.trim() || null,
    });
    onApply();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={tw`flex-1 bg-black bg-opacity-50 justify-center items-center`}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={tw`bg-white rounded-xl p-6 w-11/12 max-w-md mx-4`}>
          <Text style={tw`text-xl font-bold mb-6 text-center`}>Filtros</Text>

          {/* User Type Filter */}
          <View style={tw`mb-6`}>
            <Text style={tw`text-base font-semibold mb-3`}>Tipo de Usuário</Text>
            <View style={tw`flex-row flex-wrap`}>
              {['Mentor', 'Mentorado'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={tw`mr-3 mb-2 px-4 py-2 rounded-full border ${
                    filters.userType === type
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-gray-100 border-gray-300'
                  }`}
                  onPress={() =>
                    setFilters({
                      ...filters,
                      userType: filters.userType === type ? null : type as "Mentor" | "Mentorado",
                    })
                  }
                >
                  <Text
                    style={tw`${
                      filters.userType === type ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Status Filter */}
          <View style={tw`mb-6`}>
            <Text style={tw`text-base font-semibold mb-3`}>Status</Text>
            <View style={tw`flex-row flex-wrap`}>
              {['Disponível', 'Indisponível'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={tw`mr-3 mb-2 px-4 py-2 rounded-full border ${
                    filters.status === status
                      ? 'bg-green-500 border-green-500'
                      : 'bg-gray-100 border-gray-300'
                  }`}
                  onPress={() =>
                    setFilters({
                      ...filters,
                      status: filters.status === status ? null : status as "Disponível" | "Indisponível",
                    })
                  }
                >
                  <Text
                    style={tw`${
                      filters.status === status ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location Filter */}
          <View style={tw`mb-6`}>
            <Text style={tw`text-base font-semibold mb-3`}>Localização</Text>
            <TextInput
              style={tw`border border-gray-300 rounded-lg px-4 py-3 text-base`}
              placeholder="Digite a cidade ou província"
              value={localLocation}
              onChangeText={setLocalLocation}
            />
          </View>

          {/* Action Buttons */}
          <View style={tw`flex-row justify-between`}>
            <TouchableOpacity
              style={tw`flex-1 bg-gray-200 py-3 rounded-lg mr-2`}
              onPress={() => {
                onReset();
                setLocalLocation('');
              }}
            >
              <Text style={tw`text-center font-semibold text-gray-700`}>
                Limpar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`flex-1 bg-blue-500 py-3 rounded-lg ml-2`}
              onPress={handleApply}
            >
              <Text style={tw`text-center font-semibold text-white`}>
                Aplicar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

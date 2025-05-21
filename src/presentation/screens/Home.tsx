import { Feather } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import * as React from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import tw from "twrnc";

import { FilterModal } from "@/src/presentation/components/ui/FilterModal";
import { Navbar } from "../components/ui/navbar";

interface Mentor {
  id: number;
  name: string;
  photo: string | null;
  location: string;
  mentorias: number;
  subjects: number;
  userType: "Mentor" | "Mentorado";
  status: "Disponível" | "Indisponível";
}

const mentors: Mentor[] = [
  { id: 1, name: "Lukombo Afonso", photo: null, location: "Luanda, Angola", mentorias: 406, subjects: 12, userType: "Mentor", status: "Disponível" },
  { id: 2, name: "Cardoso Manuel", photo: null, location: "Luanda, Angola", mentorias: 126, subjects: 8, userType: "Mentor", status: "Indisponível" },
  { id: 3, name: "Lucy Script", photo: null, location: "Washington, USA", mentorias: 0, subjects: 0, userType: "Mentorado", status: "Disponível" },
  { id: 4, name: "Java Simon", photo: "../../assets/images/passe.png", location: "Luanda, Angola", mentorias: 0, subjects: 0, userType: "Mentorado", status: "Disponível" },
];

export function HomeScreen() {
  const navigation = useNavigation();
  const [filterModalVisible, setFilterModalVisible] = React.useState(false);
  const [filters, setFilters] = React.useState({
    userType: null as "Mentor" | "Mentorado" | null,
    status: null as "Disponível" | "Indisponível" | null,
    location: null as string | null,
  });

  const [searchQuery, setSearchQuery] = React.useState("");
  const [filteredMentors, setFilteredMentors] = React.useState(mentors);

  // Apply filters function
  const applyFilters = () => {
    let result = [...mentors];
    
    // Apply search query filter
    if (searchQuery.trim()) {
      result = result.filter(mentor => 
        mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mentor.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply user type filter
    if (filters.userType) {
      result = result.filter(mentor => mentor.userType === filters.userType);
    }
    
    // Apply status filter
    if (filters.status) {
      result = result.filter(mentor => mentor.status === filters.status);
    }
    
    // Apply location filter
    if (filters.location && filters.location.trim()) {
      result = result.filter(mentor => 
        mentor.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }
    
    setFilteredMentors(result);
    setFilterModalVisible(false);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      userType: null,
      status: null,
      location: null,
    });

    // If there's a search query, only apply that filter
    if (searchQuery.trim()) {
      const result = mentors.filter(mentor =>
        mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mentor.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMentors(result);
    } else {
      setFilteredMentors(mentors);
    }

    setFilterModalVisible(false);
  };

  // Handle search input changes
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    
    // Only apply search, not other filters
    let result = [...mentors];
    
    if (text.trim()) {
      result = result.filter(mentor => 
        mentor.name.toLowerCase().includes(text.toLowerCase()) ||
        mentor.location.toLowerCase().includes(text.toLowerCase())
      );
    }
    
    setFilteredMentors(result);
  };

  return (
    <View style={tw`flex-1 bg-[#F7F7F7]`}>
      {/* Navbar */}
      <Navbar title="Emparelhamento" />

      {/* Search Bar and Filter */}
      <View style={tw`px-4 mt-1 flex-row items-center`}>
        <TextInput
          placeholder="Pesquisar mentores e mentorados"
          style={tw`bg-white px-5 py-3 rounded-full text-gray-400 flex-1 mr-2`}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <Pressable
          onPress={() => setFilterModalVisible(true)}
        >
          <Feather name="sliders" size={20} color="#4A4852" />
        </Pressable>
      </View>

      {/* Filter Status Indicators */}
      {(filters.userType || filters.status || filters.location) && (
        <View style={tw`flex-row flex-wrap px-4 mt-2`}>
          {filters.userType && (
            <View style={tw`bg-blue-100 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center`}>
              <Text style={tw`text-blue-800 text-xs`}>Tipo: {filters.userType}</Text>
              <Pressable
                style={tw`ml-1`}
                onPress={() => setFilters({ ...filters, userType: null })}
              >
                <Text style={tw`text-blue-800 font-bold`}>×</Text>
              </Pressable>
            </View>
          )}

          {filters.status && (
            <View style={tw`bg-green-100 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center`}>
              <Text style={tw`text-green-800 text-xs`}>Status: {filters.status}</Text>
              <Pressable
                style={tw`ml-1`}
                onPress={() => setFilters({ ...filters, status: null })}
              >
                <Text style={tw`text-green-800 font-bold`}>×</Text>
              </Pressable>
            </View>
          )}

          {filters.location && (
            <View style={tw`bg-purple-100 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center`}>
              <Text style={tw`text-purple-800 text-xs`}>Local: {filters.location}</Text>
              <Pressable
                style={tw`ml-1`}
                onPress={() => setFilters({ ...filters, location: null })}
              >
                <Text style={tw`text-purple-800 font-bold`}>×</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            style={tw`bg-gray-100 rounded-full px-3 py-1 mb-2 flex-row items-center`}
            onPress={resetFilters}
          >
            <Text style={tw`text-gray-800 text-xs`}>Limpar todos</Text>
          </Pressable>
        </View>
      )}

      {/* Filter Modal Component */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={applyFilters}
        onReset={resetFilters}
      />


      {/* Mentor List */}
      <ScrollView style={tw`mt-4 px-2`}>
        {filteredMentors.length > 0 ? (
          filteredMentors.map((mentor) => (
            <View key={mentor.id} style={tw`bg-white p-4 rounded-3xl mb-4`}>
              <View style={tw`flex-row justify-between`}>
                <View style={tw`flex-col items-start self-start`}>
                  {/* Profile Picture Placeholder */}
                  <View style={tw`w-12 h-12 bg-[#E1E1E1] rounded-full mb-1`}>
                    {mentor.photo && (
                      <Image
                        source={mentor.photo
                          ? require('@/src/assets/images/passe.png')
                          : mentor.photo
                            ? { uri: mentor.photo }
                            : null
                        }
                        alt={`Foto do ${""}`}
                        style={tw`w-full h-full object-cover rounded-full`}
                      />
                    )}
                  </View>

                  <View style={tw`flex-row items-center`}>
                    <Text style={tw`text-sm font-semibold pr-1`}>
                      {mentor.name}
                    </Text>
                    <Text
                      style={tw`px-[6px] py-[3px] text-[10px] border border-[0.6px] rounded-1 ${mentor.status === "Disponível"
                        ? "bg-[#D5FFE0] text-[#3CA458] border-[#3CA458]"
                        : "bg-[#F8F9FA] text-[#9CA1A1] border-[#B3B3B3]"
                        }`}
                    >
                      {mentor.status}
                    </Text>
                  </View>
                  <Text style={tw`text-[#4A4852]`}>{mentor.location}</Text>
                </View>

                {mentor.userType === "Mentor" && (
                  <View style={tw`flex-row items-center self-start -ml-20`}>
                    {mentor.mentorias > 0 && (
                      <View style={tw`flex-col items-center`}>
                        <Text style={tw`text-xs text-gray-800`}>
                          {mentor.mentorias}
                        </Text>
                        <Text style={tw`text-xs text-gray-800`}>Mentorias</Text>
                      </View>
                    )}
                    {mentor.subjects > 0 && (
                      <View style={tw`flex-col items-center ml-2`}>
                        <Text style={tw`text-xs text-gray-800`}>
                          {mentor.subjects}
                        </Text>
                        <Text style={tw`text-xs text-gray-800`}>Disciplinas</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={tw`flex-row items-center self-start`}>
                  <Text style={tw`text-sm text-[#4285F4]`}>
                    #{mentor.userType}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={tw`flex-row justify-between mt-4`}>
                <Pressable
                  style={tw`flex-1 border border-[#E9E9E9] py-2 rounded-full ${mentor.status === "Indisponível"
                    ? "opacity-50 border-[#E9E9E9] bg-[#F5F5F5]"
                    : ""
                    }`}
                  disabled={mentor.status === "Indisponível"}
                >
                  <Text style={tw`text-center`}>Emparelhar</Text>
                </Pressable>

                <View style={tw`w-4`} />

                <Pressable
                  style={tw`flex-1 border border-[#E9E9E9] py-2 rounded-full`}
                >
                  <Text style={tw`text-center`}>Mensagem</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <View style={tw`flex-1 items-center justify-center py-10`}>
            <Text style={tw`text-gray-500 text-lg`}>Nenhum resultado encontrado</Text>
            <Text style={tw`text-gray-400 text-sm mt-1`}>Tente ajustar seus filtros</Text>
            <Pressable
              style={tw`mt-4 bg-blue-500 px-4 py-2 rounded-full`}
              onPress={resetFilters}
            >
              <Text style={tw`text-white`}>Limpar filtros</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

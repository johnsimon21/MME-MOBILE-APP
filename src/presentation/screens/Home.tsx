import { Feather } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import * as React from "react";
import { Image, Pressable, FlatList, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert } from "react-native";
import tw from "twrnc";

import { FilterModal } from "@/src/presentation/components/ui/FilterModal";
import { Navbar } from "../components/ui/navbar";
import { useUsers } from "@/src/hooks/useUsers";
import { useConnections } from "@/src/hooks/useConnections";
import { useAuthState } from "@/src/hooks/useAuthState";
import { IUser } from "@/src/interfaces/user.interface";
import { UserRole } from "@/src/interfaces/index.interface";

// Update the interface to match your backend data
interface MentorUser extends IUser {
  id: string;
  name: string;
  photo: string | null;
  location: string;
  mentorias: number;
  programCount: number;
  userType: "Mentor" | "Mentorado";
  status: "Disponível" | "Indisponível";
}

export function HomeScreen() {
  const navigation = useNavigation();
  const { getUsers } = useUsers();
  const { sendConnectionRequest } = useConnections();
  const { user, isAuthenticated } = useAuthState();

  // State management
  const [filterModalVisible, setFilterModalVisible] = React.useState(false);
  const [filters, setFilters] = React.useState({
    userType: null as "Mentor" | "Mentorado" | null,
    status: null as "Disponível" | "Indisponível" | null,
    location: null as string | null,
  });
  const [searchQuery, setSearchQuery] = React.useState("");
  const [allUsers, setAllUsers] = React.useState<IUser[]>([]);
  const [filteredMentors, setFilteredMentors] = React.useState<MentorUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [connectionRequests, setConnectionRequests] = React.useState<Set<string>>(new Set());

  // Fetch users from backend
  const fetchUsers = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      console.log('🔄 Fetching users from backend...');

      const response = await getUsers({
        page: 1,
        limit: 50,
      });

      console.log('✅ Users fetched successfully:', response.users.length);

      // Filter out current user
      const filteredUsers = response.users.filter(u => u.uid !== user?.uid);
      setAllUsers(filteredUsers);

    } catch (error) {
      console.error('❌ Error fetching users:', error);
      Alert.alert('Erro', 'Falha ao carregar usuários');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Transform IUser to MentorUser format
  const transformUser = (user: IUser): MentorUser => {
    return {
      ...user,
      id: user.uid,
      name: user.fullName,
      photo: user.image || null,
      location: `${user.municipality || ''}, ${user.province || ''}`.replace(/^, |, $/, ''),
      mentorias: user.role === UserRole.MENTOR ? 0 : 0, // TODO: Get real data
      programCount: user.programs?.length || 0,
      userType: user.role === UserRole.MENTOR ? "Mentor" : "Mentorado",
      status: "Disponível", // TODO: Implement real status logic
    };
  };

  // Load users on component mount
  React.useEffect(() => {
    if (isAuthenticated && user?.uid && allUsers.length === 0) {
      fetchUsers();
    }
  }, [isAuthenticated, user?.uid]);

  // Handle connection request
  const handleConnectionRequest = async (userId: string) => {
    try {
      // Add to pending requests
      setConnectionRequests(prev => new Set([...prev, userId]));

      console.log('🔄 Sending connection request to:', userId);

      await sendConnectionRequest(userId);

      Alert.alert(
        'Sucesso',
        'Solicitação de conexão enviada com sucesso!',
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('❌ Error sending connection request:', error);

      // Remove from pending requests on error
      setConnectionRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });

      let errorMessage = 'Falha ao enviar solicitação de conexão';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('Erro', errorMessage);
    }
  };


  const handleViewProfile = (userId: string) => {
    // @ts-ignore
    navigation.navigate('UserProfile', { userId });
  };

  const handleChatOpen = (userId: string) => {
    // @ts-ignore
    navigation.navigate('ChatScreen', { userId });
  };

  // Apply filters function
  const applyFilters = () => {
    let result = allUsers.map(transformUser);

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
    setSearchQuery("");
    setFilterModalVisible(false);
  };

  // Handle search input changes
  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  // Apply filters when dependencies change
  React.useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  React.useEffect(() => {
    if (allUsers.length > 0) {
      let result = allUsers.map(transformUser);

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
    }
  }, [allUsers, searchQuery, filters.userType, filters.status, filters.location]);

  // Loading state
  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-[#F7F7F7]`}>
        <Navbar title="Emparelhamento" />
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={tw`mt-4 text-gray-600`}>Carregando usuários...</Text>
        </View>
      </View>
    );
  }

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
        <Pressable onPress={() => setFilterModalVisible(true)}>
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
      <FlatList
        style={tw`mt-4 px-2`}
        data={filteredMentors}
        keyExtractor={(mentor) => mentor.id}
        refreshing={isRefreshing}
        onRefresh={() => fetchUsers(true)}
        ListEmptyComponent={
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
        }
        renderItem={({ item: mentor }) => (
          <View key={mentor.id} style={tw`bg-white p-4 rounded-3xl mb-4`}>
            <View style={tw`flex-row justify-between`}>
              <TouchableOpacity
                onPress={() => handleViewProfile(mentor.id)}
                style={tw`flex-col items-start self-start`}
              >
                {/* Profile Picture */}
                <View style={tw`w-12 h-12 bg-[#E1E1E1] rounded-full mb-1 overflow-hidden`}>
                  {mentor.photo ? (
                    <Image
                      source={{ uri: mentor.photo }}
                      style={tw`w-full h-full`}
                      defaultSource={require('@/src/assets/images/passe.png')}
                    />
                  ) : (
                    <View style={tw`w-full h-full bg-gray-300 items-center justify-center`}>
                      <Text style={tw`text-gray-600 text-lg font-bold`}>
                        {mentor.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
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
              </TouchableOpacity>

              {mentor.userType === "Mentor" && (
                <View style={tw`flex-row items-center self-start -ml-20`}>
                  {mentor.mentorias > 0 && (
                    <View style={tw`flex-col items-center`}>
                      <Text style={tw`text-xs text-gray-800`}>
                        {/* {mentor.mentorias} */}
                      </Text>
                      <Text style={tw`text-xs text-gray-800`}>Mentorias</Text>
                    </View>
                  )}
                  {mentor.programCount > 0 && (
                    <View style={tw`flex-col items-center ml-2`}>
                      <Text style={tw`text-xs text-gray-800`}>
                        {mentor.programCount}
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
                style={tw`flex-1 border border-[#E9E9E9] py-2 rounded-full ${mentor.status === "Indisponível" || connectionRequests.has(mentor.id)
                  ? "opacity-50 border-[#E9E9E9] bg-[#F5F5F5]"
                  : ""
                  }`}
                disabled={mentor.status === "Indisponível" || connectionRequests.has(mentor.id)}
                onPress={() => handleConnectionRequest(mentor.id)}
              >
                <Text style={tw`text-center`}>
                  {connectionRequests.has(mentor.id) ? 'Enviando...' : 'Emparelhar'}
                </Text>
              </Pressable>

              <View style={tw`w-4`} />

              <Pressable
                onPress={() => handleChatOpen(mentor.id)}
                style={tw`flex-1 border border-[#E9E9E9] py-2 rounded-full`}
              >
                <Text style={tw`text-center`}>Mensagem</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

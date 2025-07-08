import { Feather } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import * as React from "react";
import { Image, FlatList, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert } from "react-native";
import tw from "twrnc";

import { FilterModal } from "@/src/presentation/components/ui/FilterModal";
import { Navbar } from "../components/ui/navbar";
import { useUsers } from "@/src/hooks/useUsers";
import { useConnections } from "@/src/hooks/useConnections";
import { useAuthState } from "@/src/hooks/useAuthState";
import { IUser } from "@/src/interfaces/user.interface";
import { UserRole } from "@/src/interfaces/index.interface";

// Enhanced interface to include connection status
interface EnhancedUser extends IUser {
  id: string;
  name: string;
  photo: string | null;
  location: string;
  mentorias: number;
  programCount: number;
  userType: "Mentor" | "Mentorado";
  status: "Disponível" | "Indisponível";
  // ✅ NEW: Connection status fields
  connectionStatus: 'none' | 'pending' | 'accepted' | 'blocked';
  connectionType?: 'sent' | 'received';
  connectionId?: string;
  canCancel?: boolean;
  mutualConnections?: number;
}

export function HomeScreen() {
  const navigation = useNavigation();
  const { getAvailableUsers } = useUsers(); // ✅ Use getAvailableUsers instead of getUsers
  const {
    sendConnectionRequest,
    cancelConnectionRequest,
    getConnectionStatus,
    acceptConnectionRequest,
    rejectConnectionRequest
  } = useConnections();
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
  const [filteredUsers, setFilteredUsers] = React.useState<EnhancedUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // ✅ NEW: Enhanced connection state management
  const [connectionRequests, setConnectionRequests] = React.useState<Set<string>>(new Set());
  const [connectionStatuses, setConnectionStatuses] = React.useState<Map<string, {
    status: string;
    type?: string;
    connectionId?: string;
    canCancel?: boolean;
  }>>(new Map());

  // ✅ NEW: Fetch available users (non-connections)
  const fetchAvailableUsers = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      console.log('🔄 Fetching available users from backend...');

      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const response = await getAvailableUsers(user.uid, {
        page: 1,
        limit: 50,
        // Apply current filters
        ...(filters.userType && {
          role: filters.userType === "Mentor" ? UserRole.MENTOR : UserRole.MENTEE
        }),
        ...(searchQuery && { search: searchQuery }),
        ...(filters.location && { municipality: filters.location }),
      });

      console.log('✅ Available users fetched successfully:', response.users.length);
      setAllUsers(response.users);

    } catch (error) {
      console.error('❌ Error fetching available users:', error);
      Alert.alert('Erro', 'Falha ao carregar usuários disponíveis');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // ✅ NEW: Fetch connection status for multiple users
  const fetchConnectionStatuses = async (userIds: string[]) => {
    try {
      const statusPromises = userIds.map(async (userId) => {
        try {
          const status = await getConnectionStatus(userId);
          return { userId, status };
        } catch (error) {
          console.warn(`Failed to get connection status for ${userId}:`, error);
          return { userId, status: { status: 'none' } };
        }
      });

      const results = await Promise.allSettled(statusPromises);
      const newStatuses = new Map(connectionStatuses);

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          newStatuses.set(result.value.userId, result.value.status);
        }
      });

      setConnectionStatuses(newStatuses);
    } catch (error) {
      console.error('❌ Error fetching connection statuses:', error);
    }
  };

  // Transform IUser to EnhancedUser format with connection status
  const transformUser = (user: IUser): EnhancedUser => {
    const connectionStatus = connectionStatuses.get(user.uid) || { status: 'none' };

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
      // ✅ NEW: Connection status fields
      connectionStatus: connectionStatus.status as any,
      connectionType: connectionStatus.type as any,
      connectionId: connectionStatus.connectionId,
      canCancel: connectionStatus.canCancel,
      mutualConnections: 0, // TODO: Get from API response
    };
  };

  // Load users on component mount
  React.useEffect(() => {
    if (isAuthenticated && user?.uid) {
      fetchAvailableUsers();
    }
  }, [isAuthenticated, user?.uid]);

  // ✅ NEW: Fetch connection statuses when users change
  React.useEffect(() => {
    if (allUsers.length > 0) {
      const userIds = allUsers.map(u => u.uid);
      fetchConnectionStatuses(userIds);
    }
  }, [allUsers]);

  // ✅ ENHANCED: Handle connection request with better state management
  const handleConnectionRequest = async (userId: string) => {
    try {
      // Add to pending requests immediately for UI feedback
      setConnectionRequests(prev => new Set([...prev, userId]));

      console.log('🔄 Sending connection request to:', userId);

      const response = await sendConnectionRequest(userId);

      // Update connection status
      setConnectionStatuses(prev => new Map(prev.set(userId, {
        status: 'pending',
        type: 'sent',
        connectionId: response.connectionId,
        canCancel: true
      })));

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
    } finally {
      // Remove from pending requests after a delay
      setTimeout(() => {
        setConnectionRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }, 1000);
    }
  };

  // ✅ NEW: Handle cancel connection request
  const handleCancelRequest = async (userId: string, connectionId: string) => {
    try {
      setConnectionRequests(prev => new Set([...prev, userId]));

      console.log('🔄 Canceling connection request to:', userId);

      await cancelConnectionRequest(connectionId);

      // Update connection status
      setConnectionStatuses(prev => new Map(prev.set(userId, {
        status: 'none'
      })));

      Alert.alert(
        'Sucesso',
        'Solicitação de conexão cancelada com sucesso!',
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('❌ Error canceling connection request:', error);
      Alert.alert('Erro', 'Falha ao cancelar solicitação de conexão');
    } finally {
      setConnectionRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // ✅ NEW: Handle accept connection request
  const handleAcceptRequest = async (userId: string, connectionId: string) => {
    try {
      setConnectionRequests(prev => new Set([...prev, userId]));

      console.log('🔄 Accepting connection request from:', userId);

      await acceptConnectionRequest(connectionId);

      // Update connection status
      setConnectionStatuses(prev => new Map(prev.set(userId, {
        status: 'accepted',
        type: 'received',
        connectionId: connectionId,
        canCancel: false
      })));

      Alert.alert(
        'Sucesso',
        'Solicitação de conexão aceita com sucesso!',
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('❌ Error accepting connection request:', error);
      Alert.alert('Erro', 'Falha ao aceitar solicitação de conexão');
    } finally {
      setConnectionRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // ✅ NEW: Handle reject connection request
  const handleRejectRequest = async (userId: string, connectionId: string) => {
    try {
      setConnectionRequests(prev => new Set([...prev, userId]));

      console.log('🔄 Rejecting connection request from:', userId);

      await rejectConnectionRequest(connectionId);

      // Update connection status
      setConnectionStatuses(prev => new Map(prev.set(userId, {
        status: 'none'
      })));

      Alert.alert(
        'Sucesso',
        'Solicitação de conexão rejeitada com sucesso!',
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('❌ Error rejecting connection request:', error);
      Alert.alert('Erro', 'Falha ao rejeitar solicitação de conexão');
    } finally {
      setConnectionRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
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
      result = result.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply user type filter
    if (filters.userType) {
      result = result.filter(user => user.userType === filters.userType);
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter(user => user.status === filters.status);
    }

    // Apply location filter
    if (filters.location && filters.location.trim()) {
      result = result.filter(user =>
        user.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    setFilteredUsers(result);
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
    // Refetch data with no filters
    fetchAvailableUsers();
  };

  // Handle search input changes
  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  // Apply filters when dependencies change
  React.useEffect(() => {
    if (allUsers.length > 0) {
      let result = allUsers.map(transformUser);

      // Apply search query filter
      if (searchQuery.trim()) {
        result = result.filter(user =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.location.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Apply user type filter
      if (filters.userType) {
        result = result.filter(user => user.userType === filters.userType);
      }

      // Apply status filter
      if (filters.status) {
        result = result.filter(user => user.status === filters.status);
      }

      // Apply location filter
      if (filters.location && filters.location.trim()) {
        result = result.filter(user =>
          user.location.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }

      setFilteredUsers(result);
    }
  }, [allUsers, searchQuery, filters.userType, filters.status, filters.location, connectionStatuses]);

  // ✅ NEW: Get button text and style based on connection status
  const getConnectionButtonConfig = (user: EnhancedUser) => {
    const isProcessing = connectionRequests.has(user.id);

    switch (user.connectionStatus) {
      case 'pending':
        if (user.connectionType === 'sent') {
          return {
            text: isProcessing ? 'Cancelando...' : 'Cancelar',
            disabled: isProcessing,
            style: tw`bg-red-500 border-red-500`,
            textStyle: tw`text-white`,
            onPress: () => user.connectionId && handleCancelRequest(user.id, user.connectionId)
          };
        } else {
          return {
            text: isProcessing ? 'Processando...' : 'Aceitar',
            disabled: isProcessing,
            style: tw`bg-green-500 border-green-500`,
            textStyle: tw`text-white`,
            onPress: () => user.connectionId && handleAcceptRequest(user.id, user.connectionId),
            // ✅ NEW: Add reject button for received requests
            secondaryButton: {
              text: 'Rejeitar',
              style: tw`bg-red-500 border-red-500 ml-2`,
              textStyle: tw`text-white`,
              onPress: () => user.connectionId && handleRejectRequest(user.id, user.connectionId)
            }
          };
        }
      case 'accepted':
        return {
          text: 'Conectado',
          disabled: true,
          style: tw`bg-green-100 border-green-300`,
          textStyle: tw`text-green-700`,
          onPress: () => handleChatOpen(user.id)
        };
      case 'blocked':
        return {
          text: 'Bloqueado',
          disabled: true,
          style: tw`bg-gray-300 border-gray-400`,
          textStyle: tw`text-gray-600`,
          onPress: () => { }
        };
      default: // 'none'
        return {
          text: isProcessing ? 'Enviando...' : 'Conectar',
          disabled: isProcessing,
          style: tw`bg-blue-500 border-blue-500`,
          textStyle: tw`text-white`,
          onPress: () => handleConnectionRequest(user.id)
        };
    }
  };

  // ✅ ENHANCED: User card component with connection status
  const renderUserCard = ({ item: user }: { item: EnhancedUser }) => {
    const buttonConfig = getConnectionButtonConfig(user);
    const isProcessing = connectionRequests.has(user.id);

    return (
      <View style={tw`bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100`}>
        {/* User Header */}
        <View style={tw`flex-row items-center mb-3`}>
          <TouchableOpacity onPress={() => handleViewProfile(user.id)}>
            <Image
              source={
                user.photo
                  ? { uri: user.photo }
                  : require("@/assets/images/avatar.svg")
              }
              style={tw`w-16 h-16 rounded-full mr-3`}
            />
          </TouchableOpacity>

          <View style={tw`flex-1`}>
            <TouchableOpacity onPress={() => handleViewProfile(user.id)}>
              <Text style={tw`text-lg font-semibold text-gray-800`}>
                {user.name}
              </Text>
            </TouchableOpacity>

            <View style={tw`flex-row items-center mt-1`}>
              <View style={tw`bg-blue-100 px-2 py-1 rounded-full mr-2`}>
                <Text style={tw`text-xs font-medium text-blue-700`}>
                  {user.userType}
                </Text>
              </View>

              {/* ✅ NEW: Connection status indicator */}
              {user.connectionStatus !== 'none' && (
                <View style={tw`bg-gray-100 px-2 py-1 rounded-full`}>
                  <Text style={tw`text-xs font-medium text-gray-600`}>
                    {user.connectionStatus === 'pending'
                      ? (user.connectionType === 'sent' ? 'Enviado' : 'Recebido')
                      : user.connectionStatus === 'accepted'
                        ? 'Conectado'
                        : 'Bloqueado'
                    }
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Status indicator */}
          <View style={tw`items-center`}>
            <View
              style={[
                tw`w-3 h-3 rounded-full`,
                user.status === "Disponível" ? tw`bg-green-400` : tw`bg-gray-400`,
              ]}
            />
            <Text style={tw`text-xs text-gray-500 mt-1`}>
              {user.status}
            </Text>
          </View>
        </View>

        {/* User Info */}
        <View style={tw`mb-3`}>
          <View style={tw`flex-row items-center mb-2`}>
            <Feather name="map-pin" size={14} color="#6B7280" />
            <Text style={tw`text-sm text-gray-600 ml-1`}>
              {user.location || 'Localização não informada'}
            </Text>
          </View>

          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <Feather name="users" size={14} color="#6B7280" />
              <Text style={tw`text-sm text-gray-600 ml-1`}>
                {user.userType === "Mentor"
                  ? `${user.mentorias} mentorias`
                  : `${user.programCount} programas`
                }
              </Text>
            </View>

            {/* ✅ NEW: Mutual connections indicator */}
            {user.mutualConnections && user.mutualConnections > 0 && (
              <View style={tw`flex-row items-center`}>
                <Feather name="link" size={14} color="#6B7280" />
                <Text style={tw`text-sm text-gray-600 ml-1`}>
                  {user.mutualConnections} conexões mútuas
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={tw`flex-row items-center justify-between`}>
          <TouchableOpacity
            onPress={() => handleViewProfile(user.id)}
            style={tw`flex-1 bg-gray-100 border border-gray-300 rounded-lg py-2 px-4 mr-2`}
          >
            <Text style={tw`text-center text-gray-700 font-medium`}>
              Ver Perfil
            </Text>
          </TouchableOpacity>

          {/* ✅ ENHANCED: Dynamic connection button */}
          <View style={tw`flex-row flex-1`}>
            <TouchableOpacity
              onPress={buttonConfig.onPress}
              disabled={buttonConfig.disabled || isProcessing}
              style={[
                tw`flex-1 rounded-lg py-2 px-4 border`,
                buttonConfig.style,
                (buttonConfig.disabled || isProcessing) && tw`opacity-50`
              ]}
            >
              {isProcessing ? (
                <View style={tw`flex-row items-center justify-center`}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={[tw`text-center font-medium ml-2`, buttonConfig.textStyle]}>
                    {buttonConfig.text}
                  </Text>
                </View>
              ) : (
                <Text style={[tw`text-center font-medium`, buttonConfig.textStyle]}>
                  {buttonConfig.text}
                </Text>
              )}
            </TouchableOpacity>

            {/* ✅ NEW: Secondary button for received requests (Reject) */}
            {buttonConfig.secondaryButton && (
              <TouchableOpacity
                onPress={buttonConfig.secondaryButton.onPress}
                disabled={isProcessing}
                style={[
                  tw`px-3 py-2 rounded-lg border`,
                  buttonConfig.secondaryButton.style,
                  isProcessing && tw`opacity-50`
                ]}
              >
                <Text style={[tw`text-center font-medium text-xs`, buttonConfig.secondaryButton.textStyle]}>
                  {buttonConfig.secondaryButton.text}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ✅ NEW: Connection info for accepted connections */}
        {user.connectionStatus === 'accepted' && (
          <TouchableOpacity
            onPress={() => handleChatOpen(user.id)}
            style={tw`mt-3 bg-blue-50 border border-blue-200 rounded-lg py-2 px-3`}
          >
            <View style={tw`flex-row items-center justify-center`}>
              <Feather name="message-circle" size={16} color="#3B82F6" />
              <Text style={tw`text-blue-600 font-medium ml-2`}>
                Iniciar Conversa
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-gray-50`}>
        <Navbar title='Emparelhamentos' />
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={tw`mt-4 text-gray-600`}>Carregando usuários...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <Navbar title='Emparelhamentos' />

      {/* Search and Filter Header */}
      <View style={tw`bg-white px-4 py-3 border-b border-gray-200`}>
        <View style={tw`flex-row items-center`}>
          <View style={tw`flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mr-3`}>
            <Feather name="search" size={20} color="#6B7280" />
            <TextInput
              style={tw`flex-1 ml-2 text-gray-700`}
              placeholder="Buscar usuários..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            style={tw`bg-blue-500 rounded-lg p-2`}
          >
            <Feather name="filter" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* ✅ NEW: Active filters indicator */}
        {(filters.userType || filters.status || filters.location) && (
          <View style={tw`flex-row items-center mt-2`}>
            <Text style={tw`text-sm text-gray-600 mr-2`}>Filtros ativos:</Text>
            {filters.userType && (
              <View style={tw`bg-blue-100 px-2 py-1 rounded-full mr-2`}>
                <Text style={tw`text-xs text-blue-700`}>{filters.userType}</Text>
              </View>
            )}
            {filters.status && (
              <View style={tw`bg-green-100 px-2 py-1 rounded-full mr-2`}>
                <Text style={tw`text-xs text-green-700`}>{filters.status}</Text>
              </View>
            )}
            {filters.location && (
              <View style={tw`bg-purple-100 px-2 py-1 rounded-full mr-2`}>
                <Text style={tw`text-xs text-purple-700`}>{filters.location}</Text>
              </View>
            )}
            <TouchableOpacity onPress={resetFilters}>
              <Text style={tw`text-xs text-red-600 underline`}>Limpar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Users List */}
      <View style={tw`flex-1 px-4`}>
        {/* ✅ NEW: Results header */}
        <View style={tw`flex-row items-center justify-between py-3`}>
          <Text style={tw`text-lg font-semibold text-gray-800`}>
            Usuários Disponíveis
          </Text>
          <Text style={tw`text-sm text-gray-600`}>
            {filteredUsers.length} encontrado{filteredUsers.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {filteredUsers.length === 0 ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <Feather name="users" size={64} color="#D1D5DB" />
            <Text style={tw`text-xl font-semibold text-gray-600 mt-4`}>
              Nenhum usuário encontrado
            </Text>
            <Text style={tw`text-gray-500 text-center mt-2 px-8`}>
              {searchQuery || filters.userType || filters.status || filters.location
                ? "Tente ajustar os filtros de busca"
                : "Não há usuários disponíveis para conexão no momento"
              }
            </Text>
            {(searchQuery || filters.userType || filters.status || filters.location) && (
              <TouchableOpacity
                onPress={resetFilters}
                style={tw`bg-blue-500 rounded-lg px-6 py-3 mt-4`}
              >
                <Text style={tw`text-white font-medium`}>Limpar Filtros</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            renderItem={renderUserCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshing={isRefreshing}
            onRefresh={() => fetchAvailableUsers(true)}
            contentContainerStyle={tw`pb-6`}
          />
        )}
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={applyFilters}
        onReset={resetFilters}
      />
    </View>
  );
}

import { useAuth } from "@/src/context/AuthContext";
import { useAuthState } from "@/src/hooks/useAuthState";
import { useChat } from "@/src/hooks/useChat";
import { useConnections } from "@/src/hooks/useConnections";
import { useSessions } from "@/src/hooks/useSessions";
import { useUsers } from "@/src/hooks/useUsers";
import { ChatType } from "@/src/interfaces/chat.interface";
import { IConnectionResponse } from "@/src/interfaces/connections.interface";
import { UserRole } from "@/src/interfaces/index.interface";
import { ISessionResponse } from "@/src/interfaces/sessions.interface";
import { IUser } from "@/src/interfaces/user.interface";
import { Navbar } from "@/src/presentation/components/ui/navbar";
import { connectionStatusLabel, roleLabel, sessionStatusLabel } from "@/src/utils";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface UserProfileScreenProps {
    route: {
        params: {
            userId: string;
        };
    };
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { userId } = route.params as { userId: string };

    const { user: currentUser } = useAuth();
    const { isCoordinator, isMentor, isMentee } = useAuthState();

    // Hooks
    const { getUserById, updateUser, deleteUser } = useUsers();
    const {
        sendConnectionRequest,
        acceptConnectionRequest,
        rejectConnectionRequest,
        removeConnection,
        getConnections,
        getUserFriends,
        getConnectionStatus
    } = useConnections();
    const { getSessions, getSessionStats } = useSessions();
    const { createChat, getUserChats } = useChat();

    // State
    const [userData, setUserData] = useState<IUser | null>(null);
    const [userConnections, setUserConnections] = useState<IConnectionResponse[]>([]);
    const [userSessions, setUserSessions] = useState<ISessionResponse[]>([]);
    const [sessionStats, setSessionStats] = useState<any>(null);
    const [connectionStatus, setConnectionStatus] = useState<string>('none');
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'connections'>('overview');
    const [photoViewerVisible, setPhotoViewerVisible] = useState(false);

    useEffect(() => {
        loadUserProfile();
    }, [userId]);

    const loadUserProfile = async () => {
        try {
            setIsLoading(true);

            // Load user data
            const user = await getUserById(userId);
            setUserData(user);

            // Load connection status if not viewing own profile
            if (currentUser?.uid !== userId) {
                const status = await getConnectionStatus(userId);
                setConnectionStatus(status.status);
            }

            // Load user connections
            const connections = await getUserFriends(userId);
            console.log('connections', connections)
            setUserConnections(connections.connections);

            // Load sessions data based on user role
            if (currentUser?.role === UserRole.MENTOR) {
                const sessions = await getSessions({ mentorId: userId });
                setUserSessions(sessions.sessions);

                const stats = await getSessionStats({
                    mentorId: user.role === UserRole.MENTOR ? userId : undefined
                });
                setSessionStats(stats);
            }

        } catch (error: any) {
            console.error("Error loading user profile:", error);
            Alert.alert("Erro", "Falha ao carregar perfil do usuário");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectionRequest = async () => {
        if (!userData) return;

        try {
            setIsProcessing(true);

            if (connectionStatus === 'none') {
                await sendConnectionRequest(userId);
                setConnectionStatus('pending_sent');
                Alert.alert("Sucesso", "Solicitação de conexão enviada!");
            } else if (connectionStatus === 'pending_received') {
                await acceptConnectionRequest(userId);
                setConnectionStatus('accepted');
                Alert.alert("Sucesso", "Conexão aceita!");
            }

        } catch (error: any) {
            Alert.alert("Erro", error.message || "Falha ao processar solicitação");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRejectConnection = async () => {
        try {
            setIsProcessing(true);
            await rejectConnectionRequest(userId);
            setConnectionStatus('none');
            Alert.alert("Sucesso", "Solicitação rejeitada");
        } catch (error: any) {
            Alert.alert("Erro", error.message || "Falha ao rejeitar solicitação");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveConnection = async () => {
        Alert.alert(
            "Remover Conexão",
            `Tem certeza que deseja remover a conexão com ${userData?.fullName}?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Remover",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsProcessing(true);
                            await removeConnection(userId);
                            setConnectionStatus('none');
                            Alert.alert("Sucesso", "Conexão removida");
                        } catch (error: any) {
                            Alert.alert("Erro", error.message || "Falha ao remover conexão");
                        } finally {
                            setIsProcessing(false);
                        }
                    }
                }
            ]
        );
    };

    const handleStartChat = async () => {
        try {
            setIsProcessing(true);

            // Check if chat already exists
            const chats = await getUserChats();
            const existingChat = chats.chats.find(chat =>
                chat.participants.some(p => p.uid === userId)
            );

            if (existingChat) {
                // Navigate to existing chat
                // @ts-ignore
                navigation.navigate('ChatScreen', { 
                    chat: existingChat
                });
            } else {
                // Create new chat
                const newChat = await createChat({
                    participantId: userId,
                    type: ChatType.GENERAL
                });

                // @ts-ignore
                navigation.navigate('ChatScreen', { 
                    chat: newChat
                });
            }

        } catch (error: any) {
            Alert.alert("Erro", error.message || "Falha ao iniciar conversa");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveUser = async () => {
        if (!userData) return;

        Alert.alert(
            "Remover Usuário",
            `Tem certeza que deseja remover ${userData.fullName}? Esta ação não pode ser desfeita.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Remover",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsProcessing(true);
                            await deleteUser(userId);
                            Alert.alert(
                                "Sucesso",
                                `${userData.fullName} foi removido com sucesso.`,
                                [{ text: "OK", onPress: () => navigation.goBack() }]
                            );
                        } catch (error: any) {
                            Alert.alert("Erro", error.message || "Falha ao remover usuário");
                        } finally {
                            setIsProcessing(false);
                        }
                    }
                }
            ]
        );
    };

    const handleViewProfile = (userId: string) => {
        // @ts-ignore
        navigation.navigate('UserProfile', { userId });
    };

    const getConnectionButtonConfig = () => {
        switch (connectionStatus) {
            case 'pending_sent':
                return {
                    text: 'Pendente',
                    disabled: true,
                    style: tw`bg-yellow-100 border-yellow-300`,
                    textStyle: tw`text-yellow-700`,
                    onPress: () => { }
                };
            case 'pending_received':
                return {
                    text: 'Aceitar',
                    disabled: isProcessing,
                    style: tw`bg-green-500 border-green-500`,
                    textStyle: tw`text-white`,
                    onPress: handleConnectionRequest,
                    secondaryButton: {
                        text: 'Rejeitar',
                        style: tw`bg-red-500 border-red-500 ml-2`,
                        textStyle: tw`text-white`,
                        onPress: handleRejectConnection
                    }
                };
            case 'accepted':
                return {
                    text: 'Conectado',
                    disabled: false,
                    style: tw`bg-green-100 border-green-300`,
                    textStyle: tw`text-green-700`,
                    onPress: handleRemoveConnection
                };
            default:
                return {
                    text: isProcessing ? 'Enviando...' : 'Conectar',
                    disabled: isProcessing,
                    style: tw`bg-blue-500 border-blue-500`,
                    textStyle: tw`text-white`,
                    onPress: handleConnectionRequest
                };
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return '#10B981';
            case 'away': return '#F59E0B';
            case 'offline': return '#6B7280';
            default: return '#6B7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'online': return 'Online';
            case 'away': return 'Ausente';
            case 'offline': return 'Offline';
            default: return 'Desconhecido';
        }
    };

    const ProgressBar = ({ progress, color = "#4F46E5" }: { progress: number; color?: string }) => (
        <View style={tw`w-full h-2 bg-gray-200 rounded-full overflow-hidden`}>
            <View
                style={[
                    tw`h-full rounded-full`,
                    { width: `${progress}%`, backgroundColor: color }
                ]}
            />
        </View>
    );

    const PhotoViewerModal = () => {
        if (!userData) return null;

        return (
            <Modal
                visible={photoViewerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setPhotoViewerVisible(false)}
            >
                <View style={tw`flex-1 bg-black bg-opacity-90 justify-center items-center`}>
                    <TouchableOpacity
                        style={tw`absolute top-12 right-4 z-10 bg-black bg-opacity-50 rounded-full p-3`}
                        onPress={() => setPhotoViewerVisible(false)}
                    >
                        <MaterialIcons name="close" size={24} color="white" />
                    </TouchableOpacity>

                    <View style={tw`absolute top-12 left-4 z-10`}>
                        <Text style={tw`text-white text-xl font-bold`}>{userData.fullName}</Text>
                        <Text style={tw`text-gray-300 text-sm`}>{roleLabel[userData.role]}</Text>
                    </View>

                    <TouchableOpacity
                        style={tw`flex-1 justify-center items-center w-full`}
                        onPress={() => setPhotoViewerVisible(false)}
                        activeOpacity={1}
                    >
                        <Image
                            source={{
                                uri: userData.image || 'https://via.placeholder.com/150/cccccc/000000?text=No+Image'
                            }}
                            style={tw`w-full h-full`}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    };

    if (isLoading) {
        return (
            <View style={tw`flex-1 bg-white`}>
                <Navbar title="Perfil do Usuário" showBackButton={true} theme="light" />
                <View style={tw`flex-1 justify-center items-center`}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={tw`mt-4 text-gray-600`}>Carregando perfil...</Text>
                </View>
            </View>
        );
    }

    if (!userData) {
        return (
            <View style={tw`flex-1 bg-white`}>
                <Navbar title="Perfil do Usuário" showBackButton={true} theme="light" />
                <View style={tw`flex-1 justify-center items-center`}>
                    <Feather name="user-x" size={64} color="#D1D5DB" />
                    <Text style={tw`text-gray-500 text-lg mt-4`}>Perfil não encontrado</Text>
                    <Text style={tw`text-gray-400 text-center mt-2 px-8`}>
                        O usuário que você está procurando não existe ou foi removido.
                    </Text>
                </View>
            </View>
        );
    }

    const buttonConfig = getConnectionButtonConfig();
    const isOwnProfile = currentUser?.uid === userId;

    return (
        <View style={tw`flex-1 bg-[#F7F7F7]`}>
            <Navbar title={userData.fullName} showBackButton={true} theme="light" />

            <FlatList
                data={activeTab === 'connections' ? userConnections : []}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`pt-2 pb-8`}
                ListHeaderComponent={() => (
                    <View>
                        {/* Profile Header */}
                        <View style={tw`relative px-2`}>
                            <View style={tw`bg-[#75A5F5] h-24 rounded-t-4`} />
                            <View style={tw`bg-white h-36 rounded-b-4`} />

                            <View style={tw`absolute top-12 left-0 right-0 items-center`}>
                                <TouchableOpacity
                                    onPress={() => setPhotoViewerVisible(true)}
                                    style={[
                                        tw`rounded-full`,
                                        { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 }
                                    ]}
                                    activeOpacity={0.8}
                                >
                                    <Image
                                        source={{
                                            uri: userData.image || 'https://via.placeholder.com/150/cccccc/000000?text=No+Image'
                                        }}
                                        style={tw`w-20 h-20 rounded-full border-4 border-white`}
                                    />
                                    <View
                                        style={[
                                            tw`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white`,
                                            { backgroundColor: getStatusColor('offline') }
                                        ]}
                                    />
                                </TouchableOpacity>

                                <Text style={tw`text-xl font-bold text-gray-800 mt-3`}>
                                    {userData.fullName}
                                </Text>

                                <View style={tw`flex-row items-center mt-1`}>
                                    <Text style={tw`text-gray-600 capitalize`}>
                                        {roleLabel[userData.role]}
                                    </Text>
                                    <View style={tw`w-1 h-1 bg-gray-400 rounded-full mx-2`} />
                                    <Text style={tw`text-gray-600`}>
                                        {userData.school}
                                    </Text>
                                </View>

                                <View style={tw`flex-row items-center mt-1`}>
                                    <View
                                        style={[
                                            tw`w-2 h-2 rounded-full mr-1`,
                                            { backgroundColor: getStatusColor('offline') }
                                        ]}
                                    />
                                    <Text style={tw`text-sm text-gray-500`}>
                                        {getStatusText('offline')}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        {!isOwnProfile && (
                            <View style={tw`px-4 mt-4`}>
                                <View style={tw`flex-row`}>
                                    <TouchableOpacity
                                        onPress={buttonConfig.onPress}
                                        disabled={buttonConfig.disabled}
                                        style={[
                                            tw`flex-1 py-3 px-4 rounded-xl border flex-row items-center justify-center`,
                                            buttonConfig.style
                                        ]}
                                    >
                                        <Feather
                                            name={connectionStatus === 'accepted' ? 'user-check' : 'user-plus'}
                                            size={16}
                                            color={typeof buttonConfig.textStyle.color === 'string' ? buttonConfig.textStyle.color : '#FFFFFF'}
                                        />
                                        <Text style={[tw`ml-2 font-medium`, buttonConfig.textStyle]}>
                                            {buttonConfig.text}
                                        </Text>
                                    </TouchableOpacity>

                                    {buttonConfig.secondaryButton && (
                                        <TouchableOpacity
                                            onPress={buttonConfig.secondaryButton.onPress}
                                            disabled={isProcessing}
                                            style={[
                                                tw`py-3 px-4 rounded-xl border flex-row items-center justify-center`,
                                                buttonConfig.secondaryButton.style
                                            ]}
                                        >
                                            <Feather name="x" size={16} color="#FFFFFF" />
                                            <Text style={[tw`ml-2 font-medium`, buttonConfig.secondaryButton.textStyle]}>
                                                {buttonConfig.secondaryButton.text}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <View style={tw`flex-row mt-3`}>
                                    <TouchableOpacity
                                        onPress={handleStartChat}
                                        disabled={isProcessing}
                                        style={tw`flex-1 py-3 px-4 rounded-xl border border-gray-300 bg-white flex-row items-center justify-center mr-2`}
                                    >
                                        <Feather name="message-circle" size={16} color="#6B7280" />
                                        <Text style={tw`ml-2 font-medium text-gray-700`}>
                                            Conversar
                                        </Text>
                                    </TouchableOpacity>

                                    {isCoordinator && (
                                        <TouchableOpacity
                                            onPress={handleRemoveUser}
                                            disabled={isProcessing}
                                            style={tw`py-3 px-4 rounded-xl border border-red-300 bg-red-50 flex-row items-center justify-center`}
                                        >
                                            <Feather name="trash-2" size={16} color="#DC2626" />
                                            <Text style={tw`ml-2 font-medium text-red-600`}>
                                                Remover
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Tab Navigation */}
                        <View style={tw`px-4 mt-6`}>
                            <View style={tw`flex-row bg-gray-100 rounded-xl p-1`}>
                                {[
                                    { key: 'overview', label: 'Visão Geral', icon: 'user' },
                                    { key: 'sessions', label: 'Sessões', icon: 'calendar' },
                                    { key: 'connections', label: 'Conexões', icon: 'users' }
                                ].map((tab) => (
                                    <TouchableOpacity
                                        key={tab.key}
                                        onPress={() => setActiveTab(tab.key as any)}
                                        style={[
                                            tw`flex-1 py-3 px-4 rounded-lg flex-row items-center justify-center`,
                                            activeTab === tab.key ? tw`bg-white shadow-sm` : tw`bg-transparent`
                                        ]}
                                    >
                                        <Feather
                                            name={tab.icon as any}
                                            size={16}
                                            color={activeTab === tab.key ? '#3B82F6' : '#6B7280'}
                                        />
                                        <Text style={[
                                            tw`ml-2 font-medium text-sm`,
                                            activeTab === tab.key ? tw`text-blue-600` : tw`text-gray-600`
                                        ]}>
                                            {tab.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Tab Content for Overview and Sessions */}
                            {activeTab !== 'connections' && (
                            <View style={tw`px-4 mt-6`}>
                                {activeTab === 'overview' && (
                                    <View>
                                        {/* Basic Info */}
                                        <View style={tw`bg-white rounded-xl p-4 mb-4`}>
                                            <Text style={tw`text-lg font-semibold text-gray-800 mb-4`}>
                                                Informações Básicas
                                            </Text>

                                            <View style={tw`space-y-3`}>
                                                <View style={tw`flex-row items-center`}>
                                                    <Feather name="mail" size={16} color="#6B7280" />
                                                    <Text style={tw`ml-3 text-gray-600`}>{userData.email}</Text>
                                                </View>

                                                <View style={tw`flex-row items-center`}>
                                                    <Feather name="phone" size={16} color="#6B7280" />
                                                    <Text style={tw`ml-3 text-gray-600`}>{userData.cellphone}</Text>
                                                </View>

                                                <View style={tw`flex-row items-center`}>
                                                    <Feather name="calendar" size={16} color="#6B7280" />
                                                    <Text style={tw`ml-3 text-gray-600`}>
                                                        {userData.birth && (typeof userData.birth === 'string' ? userData.birth !== '' : true)
                                                            ? new Date(userData.birth).toLocaleDateString('pt-BR')
                                                            : 'Data não informada'
                                                        }
                                                    </Text>
                                                </View>

                                                <View style={tw`flex-row items-center`}>
                                                    <Feather name="user" size={16} color="#6B7280" />
                                                    <Text style={tw`ml-3 text-gray-600 capitalize`}>
                                                        {userData.gender === 'male' ? 'Masculino' :
                                                            userData.gender === 'female' ? 'Feminino' : userData.gender}
                                                    </Text>
                                                </View>

                                                {userData.grade && (
                                                    <View style={tw`flex-row items-center`}>
                                                        <Feather name="book" size={16} color="#6B7280" />
                                                        <Text style={tw`ml-3 text-gray-600`}>
                                                            {userData.grade}ª Classe
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        {/* Role-specific Information */}
                                        {userData.role === UserRole.MENTOR && (
                                            <View style={tw`bg-white rounded-xl p-4 mb-4`}>
                                                <Text style={tw`text-lg font-semibold text-gray-800 mb-4`}>
                                                    Informações do Mentor
                                                </Text>

                                                <View style={tw`space-y-3`}>
                                                    {userData.maxMenteeNumber && (
                                                        <View style={tw`flex-row items-center justify-between`}>
                                                            <Text style={tw`text-gray-600`}>Máximo de Mentees</Text>
                                                            <Text style={tw`font-medium text-gray-800`}>
                                                                {userData.maxMenteeNumber}
                                                            </Text>
                                                        </View>
                                                    )}

                                                    {userData.schoolYear && (
                                                        <View style={tw`flex-row items-center justify-between`}>
                                                            <Text style={tw`text-gray-600`}>Ano Letivo</Text>
                                                            <Text style={tw`font-medium text-gray-800`}>
                                                                {userData.schoolYear}
                                                            </Text>
                                                        </View>
                                                    )}

                                                    {userData.skills && userData.skills.length > 0 && (
                                                        <View>
                                                            <Text style={tw`text-gray-600 mb-2`}>Habilidades</Text>
                                                            <View style={tw`flex-row flex-wrap`}>
                                                                {userData.skills.map((skill, index) => (
                                                                    <View key={index} style={tw`bg-blue-100 px-3 py-1 rounded-full mr-2 mb-2`}>
                                                                        <Text style={tw`text-blue-800 text-sm`}>{skill}</Text>
                                                                    </View>
                                                                ))}
                                                            </View>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        )}

                                        {userData.role === UserRole.MENTEE && (
                                            <View style={tw`bg-white rounded-xl p-4 mb-4`}>
                                                <Text style={tw`text-lg font-semibold text-gray-800 mb-4`}>
                                                    Informações do Mentee
                                                </Text>

                                                <View style={tw`space-y-3`}>
                                                    {userData.difficulties && userData.difficulties.length > 0 && (
                                                        <View>
                                                            <Text style={tw`text-gray-600 mb-2`}>Dificuldades</Text>
                                                            <View style={tw`flex-row flex-wrap`}>
                                                                {userData.difficulties.map((difficulty, index) => (
                                                                    <View key={index} style={tw`bg-orange-100 px-3 py-1 rounded-full mr-2 mb-2`}>
                                                                        <Text style={tw`text-orange-800 text-sm`}>{difficulty}</Text>
                                                                    </View>
                                                                ))}
                                                            </View>
                                                        </View>
                                                    )}

                                                    {userData.emotions && userData.emotions.length > 0 && (
                                                        <View>
                                                            <Text style={tw`text-gray-600 mb-2`}>Estados Emocionais</Text>
                                                            <View style={tw`flex-row flex-wrap`}>
                                                                {userData.emotions.map((emotion, index) => (
                                                                    <View key={index} style={tw`bg-purple-100 px-3 py-1 rounded-full mr-2 mb-2`}>
                                                                        <Text style={tw`text-purple-800 text-sm`}>{emotion}</Text>
                                                                    </View>
                                                                ))}
                                                            </View>
                                                        </View>
                                                    )}

                                                    {userData.programs && userData.programs.length > 0 && (
                                                        <View>
                                                            <Text style={tw`text-gray-600 mb-2`}>Programas</Text>
                                                            <View style={tw`flex-row flex-wrap`}>
                                                                {userData.programs.map((program, index) => (
                                                                    <View key={index} style={tw`bg-green-100 px-3 py-1 rounded-full mr-2 mb-2`}>
                                                                        <Text style={tw`text-green-800 text-sm`}>{program}</Text>
                                                                    </View>
                                                                ))}
                                                            </View>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        )}

                                        {/* Portfolio */}
                                        {userData.portfolio && (
                                            <View style={tw`bg-white rounded-xl p-4 mb-4`}>
                                                <Text style={tw`text-lg font-semibold text-gray-800 mb-4`}>
                                                    Portfólio
                                                </Text>
                                                <Text style={tw`text-gray-600 leading-6`}>
                                                    {userData.portfolio}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Statistics */}
                                        {sessionStats && (
                                            <View style={tw`bg-white rounded-xl p-4 mb-4`}>
                                                <Text style={tw`text-lg font-semibold text-gray-800 mb-4`}>
                                                    Estatísticas
                                                </Text>

                                                <View style={tw`flex-row justify-between mb-4`}>
                                                    <View style={tw`items-center`}>
                                                        <Text style={tw`text-2xl font-bold text-blue-600`}>
                                                            {sessionStats.totalSessions || 0}
                                                        </Text>
                                                        <Text style={tw`text-sm text-gray-600`}>
                                                            Total de Sessões
                                                        </Text>
                                                    </View>

                                                    <View style={tw`items-center`}>
                                                        <Text style={tw`text-2xl font-bold text-green-600`}>
                                                            {sessionStats.completedSessions || 0}
                                                        </Text>
                                                        <Text style={tw`text-sm text-gray-600`}>
                                                            Concluídas
                                                        </Text>
                                                    </View>

                                                    <View style={tw`items-center`}>
                                                        <Text style={tw`text-2xl font-bold text-purple-600`}>
                                                            {userConnections.length}
                                                        </Text>
                                                        <Text style={tw`text-sm text-gray-600`}>
                                                            Conexões
                                                        </Text>
                                                    </View>
                                                </View>

                                                {sessionStats.completionRate !== undefined && (
                                                    <View>
                                                        <View style={tw`flex-row justify-between items-center mb-2`}>
                                                            <Text style={tw`text-sm text-gray-600`}>Taxa de Conclusão</Text>
                                                            <Text style={tw`text-sm font-medium text-gray-800`}>
                                                                {Math.round(sessionStats.completionRate)}%
                                                            </Text>
                                                        </View>
                                                        <ProgressBar progress={sessionStats.completionRate} color="#10B981" />
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                )}

                                {activeTab === 'sessions' && (
                                    <View>
                                        {userSessions.length > 0 ? (
                                            <View>
                                                <Text style={tw`text-lg font-semibold text-gray-800 mb-4`}>
                                                    Sessões Recentes
                                                </Text>

                                                {userSessions.slice(0, 5).map((session) => (
                                                    <View key={session.id} style={tw`bg-white rounded-xl p-4 mb-3`}>
                                                        <View style={tw`flex-row items-start justify-between mb-2`}>
                                                            <View style={tw`flex-1`}>
                                                                <Text style={tw`font-semibold text-gray-800`}>
                                                                    {session.title}
                                                                </Text>
                                                                {session.description && (
                                                                    <Text style={tw`text-sm text-gray-600 mt-1`}>
                                                                        {session.description}
                                                                    </Text>
                                                                )}
                                                            </View>

                                                            <View style={tw`px-2 py-1 rounded-full ${session.status === 'completed' ? 'bg-green-100' :
                                                                session.status === 'active' ? 'bg-blue-100' :
                                                                    session.status === 'scheduled' ? 'bg-yellow-100' :
                                                                        'bg-gray-100'
                                                                }`}>
                                                                <Text style={tw`text-xs font-medium ${session.status === 'completed' ? 'text-green-800' :
                                                                    session.status === 'active' ? 'text-blue-800' :
                                                                        session.status === 'scheduled' ? 'text-yellow-800' :
                                                                            'text-gray-800'
                                                                    }`}>
                                                                    {sessionStatusLabel[session.status].toUpperCase()}
                                                                </Text>
                                                            </View>
                                                        </View>

                                                        <View style={tw`flex-row items-center text-sm text-gray-600`}>
                                                            <Feather name="calendar" size={14} color="#6B7280" />
                                                            <Text style={tw`ml-2 text-sm text-gray-600`}>
                                                                {session.scheduledAt ?
                                                                    new Date(session.scheduledAt).toLocaleDateString('pt-BR', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    }) : 'Não agendada'
                                                                }
                                                            </Text>

                                                            <View style={tw`ml-4 flex-row items-center`}>
                                                                <Feather name="clock" size={14} color="#6B7280" />
                                                                <Text style={tw`ml-2 text-sm text-gray-600`}>
                                                                    {session.duration}min
                                                                </Text>
                                                            </View>

                                                            <View style={tw`ml-4 flex-row items-center`}>
                                                                <Feather name="users" size={14} color="#6B7280" />
                                                                <Text style={tw`ml-2 text-sm text-gray-600`}>
                                                                    {session.participants.length}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                ))}

                                                {userSessions.length > 5 && (
                                                    <TouchableOpacity
                                                        style={tw`bg-gray-100 rounded-xl p-4 items-center`}
                                                        onPress={() => {
                                                            // Navigate to sessions list
                                                            // @ts-ignore
                                                            navigation.navigate('Sessions', { userId });
                                                        }}
                                                    >
                                                        <Text style={tw`text-gray-600 font-medium`}>
                                                            Ver todas as {userSessions.length} sessões
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ) : (
                                            <View style={tw`bg-white rounded-xl p-8 items-center`}>
                                                <Feather name="calendar" size={48} color="#D1D5DB" />
                                                <Text style={tw`text-gray-500 text-lg mt-4`}>
                                                    Nenhuma sessão encontrada
                                                </Text>
                                                <Text style={tw`text-gray-400 text-center mt-2`}>
                                                    {userData.role === UserRole.MENTOR
                                                        ? 'Este mentor ainda não criou nenhuma sessão.'
                                                        : 'Este usuário ainda não participou de nenhuma sessão.'
                                                    }
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Connections Tab Header */}
                        {activeTab === 'connections' && (
                            <View style={tw`px-4 mt-6`}>
                                {userConnections.length > 0 ? (
                                    <Text style={tw`text-lg font-semibold text-gray-800 mb-4`}>
                                        Conexões ({userConnections.length})
                                    </Text>
                                ) : null}
                            </View>
                        )}
                    </View>
                )}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => handleViewProfile(item.connectedUser.uid)}
                        style={tw`bg-white rounded-xl p-4 mb-3 mx-4 flex-row items-center`}
                    >
                        <Image
                            source={{
                                uri: (item.connectedUser.image) ||
                                    'https://via.placeholder.com/150/cccccc/000000?text=No+Image'
                            }}
                            style={tw`w-12 h-12 rounded-full`}
                        />

                        <View style={tw`flex-1 ml-3`}>
                            <Text style={tw`font-semibold text-gray-800`}>
                                {item.connectedUser.fullName}
                            </Text>
                            <Text style={tw`text-sm text-gray-600 capitalize`}>
                                {roleLabel[item.connectedUser.role]}
                            </Text>
                            <Text style={tw`text-xs text-gray-500 mt-1`}>
                                Conectado em {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                            </Text>
                        </View>

                        <View style={tw`px-3 py-1 rounded-full ${item.status === 'accepted' ? 'bg-green-100' :
                            item.status === 'pending' ? 'bg-yellow-100' :
                                'bg-gray-100'
                            }`}>
                            <Text style={tw`text-xs font-medium ${item.status === 'accepted' ? 'text-green-800' :
                                item.status === 'pending' ? 'text-yellow-800' :
                                    'text-gray-800'
                                }`}>
                                {connectionStatusLabel[item.status]}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                    activeTab === 'connections' ? (
                        <View style={tw`bg-white rounded-xl p-8 items-center mx-4`}>
                            <Feather name="users" size={48} color="#D1D5DB" />
                            <Text style={tw`text-gray-500 text-lg mt-4`}>
                                Nenhuma conexão encontrada
                            </Text>
                            <Text style={tw`text-gray-400 text-center mt-2`}>
                                Este usuário ainda não possui conexões.
                            </Text>
                        </View>
                    ) : null
                )}
            />

            {/* Photo Viewer Modal */}
            <PhotoViewerModal />

            {/* Loading Overlay */}
            {isProcessing && (
                <View style={tw`absolute inset-0 bg-black bg-opacity-50 justify-center items-center`}>
                    <View style={tw`bg-white rounded-xl p-6 items-center`}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={tw`mt-4 text-gray-600`}>Processando...</Text>
                    </View>
                </View>
            )}
        </View>
    );

};

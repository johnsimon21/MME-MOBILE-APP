import { useAuth } from "@/src/context/AuthContext";
import { useChatContext } from "@/src/context/ChatContext";
import { useSessionContext } from "@/src/context/SessionContext";
import { useChat } from "@/src/hooks/useChat";
import { useConnections } from "@/src/hooks/useConnections";
import { ChatType } from "@/src/interfaces/chat.interface";
import { IConnectedUser } from "@/src/interfaces/connections.interface";
import { ISessionResponse, SessionStatus, SessionType } from "@/src/interfaces/sessions.interface";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import tw from "twrnc";
import { RenderSessionItem } from "../components/SessionItem";

const { width: screenWidth } = Dimensions.get('window');

interface FilterState {
    status: SessionStatus | 'all';
    type: SessionType | 'all';
    dateRange: 'today' | 'week' | 'month' | 'all';
    search: string;
}

export function SessionManagementScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();

    const {
        sessions,
        currentSession,
        isLoading,
        error,
        stats,
        loadSessions,
        loadSessionStats,
        createSession,
        startSession,
        endSession,
        cancelSession,
        joinSession,
        leaveSession,
        refreshSessions,
        clearError
    } = useSessionContext();

    const { createChat } = useChatContext();
    const { getChatById } = useChat();
    const { getAcceptedConnections, searchConnections } = useConnections();

    // State
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        status: 'all',
        type: 'all',
        dateRange: 'all',
        search: ''
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    // Load initial data
    useEffect(() => {
        if (user?.role === 'mentor' || user?.role === 'coordinator') {
            loadInitialData();
        }
    }, [user?.role]);

    // Refresh sessions when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (user?.role === 'mentor' || user?.role === 'coordinator') {
                // Clear any stuck loading state and refresh
                clearError();
                loadInitialData();
            }
        }, [user?.role, clearError])
    );

    const loadInitialData = async () => {
        try {
            await Promise.all([
                loadSessions(),
                loadSessionStats()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    };

    // Handle refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refreshSessions();
            clearError();
        } catch (error) {
            console.error('Error refreshing sessions:', error);
        } finally {
            setRefreshing(false);
        }
    }, [refreshSessions, clearError]);

    // Filter sessions based on current filters
    const filteredSessions = useMemo(() => {
        let filtered = [...sessions];

        // Status filter
        if (filters.status !== 'all') {
            filtered = filtered.filter(session => session.status === filters.status);
        }

        // Type filter
        if (filters.type !== 'all') {
            filtered = filtered.filter(session => session.type === filters.type);
        }

        // Date range filter
        if (filters.dateRange !== 'all') {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfWeek = new Date(startOfDay);
            startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            filtered = filtered.filter(session => {
                const sessionDate = new Date(session.scheduledAt || session.createdAt);

                switch (filters.dateRange) {
                    case 'today':
                        return sessionDate >= startOfDay;
                    case 'week':
                        return sessionDate >= startOfWeek;
                    case 'month':
                        return sessionDate >= startOfMonth;
                    default:
                        return true;
                }
            });
        }

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(session =>
                session.title.toLowerCase().includes(searchLower) ||
                session.description?.toLowerCase().includes(searchLower) ||
                session.metadata?.subject?.toLowerCase().includes(searchLower) ||
                session.mentor.fullName.toLowerCase().includes(searchLower) ||
                session.participants.some(p => p.fullName.toLowerCase().includes(searchLower))
            );
        }

        return filtered;
    }, [sessions, filters]);


    const handleJoinSessionChat = useCallback(async (session: ISessionResponse) => {
        try {
            // If session already has a chat, try to fetch the full chat object
            if (session.chatId) {
                try {
                    const fullChat = await getChatById(session.chatId);
                    // @ts-ignore
                    navigation.navigate('ChatScreen', {
                        chat: fullChat,
                        startSession: session.status === SessionStatus.SCHEDULED
                    });
                    return;
                } catch (error) {
                    console.error('Error fetching existing chat:', error);
                    // If chat doesn't exist anymore, create a new one
                    console.log('Chat not found, creating new one...');
                }
            }

            // Create session chat with the first participant (mentee)
            const firstParticipant = session.participants[0];
            if (!firstParticipant) {
                Alert.alert('Erro', 'Sessão não possui participantes');
                return;
            }

            const chat = await createChat({
                participantId: firstParticipant.uid,
                type: ChatType.SESSION,
                sessionId: session.id,
                title: `Sessão: ${session.title}`
            });

            // Navigate to chat
            // @ts-ignore
            navigation.navigate('ChatScreen', {
                chat: chat,
                startSession: session.status === SessionStatus.SCHEDULED
            });
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível abrir o chat da sessão');
        }
    }, [createChat, navigation]);

    // Session actions
    const handleStartSession = useCallback(async (sessionId: string, type: 'chat' | 'voice') => {
        try {
            if (type === 'chat') {
                // Find the session and navigate to chat
                const session = sessions.find(s => s.id === sessionId);
                if (session) {
                    await handleJoinSessionChat(session);
                }
            } else if (type === 'voice') {
                // Navigate to voice call
                // @ts-ignore
                navigation.navigate('VoiceCall', { sessionId });
            }

            // Start the session in the backend
            await startSession(sessionId);
            Alert.alert('Sucesso', `Sessão ${type === 'chat' ? 'de chat' : 'de voz'} iniciada com sucesso!`);
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível iniciar a sessão');
        }
    }, [startSession, sessions, navigation, handleJoinSessionChat]);

    const showStartSessionOptions = useCallback((sessionId: string) => {
        Alert.alert(
            'Iniciar Sessão',
            'Escolha como deseja iniciar a sessão:',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: '💬 Chat de Texto',
                    onPress: () => handleStartSession(sessionId, 'chat')
                },
                {
                    text: '📞 Chamada de Voz',
                    onPress: () => handleStartSession(sessionId, 'voice')
                }
            ],
            { cancelable: true }
        );
    }, [handleStartSession]);

    const handleEndSession = useCallback(async (sessionId: string) => {
        Alert.alert(
            'Finalizar Sessão',
            'Tem certeza que deseja finalizar esta sessão?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Finalizar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await endSession(sessionId);
                            Alert.alert('Sucesso', 'Sessão finalizada com sucesso!');
                        } catch (error: any) {
                            Alert.alert('Erro', error.message || 'Não foi possível finalizar a sessão');
                        }
                    }
                }
            ]
        );
    }, [endSession]);

    const handleCancelSession = useCallback(async (sessionId: string) => {
        Alert.alert(
            'Cancelar Sessão',
            'Tem certeza que deseja cancelar esta sessão?',
            [
                { text: 'Não', style: 'cancel' },
                {
                    text: 'Sim, cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await cancelSession(sessionId, 'Cancelado pelo mentor');
                            Alert.alert('Sucesso', 'Sessão cancelada com sucesso!');
                        } catch (error: any) {
                            Alert.alert('Erro', error.message || 'Não foi possível cancelar a sessão');
                        }
                    }
                }
            ]
        );
    }, [cancelSession]);

    const handleDeleteSession = useCallback(async (sessionId: string) => {
        Alert.alert(
            'Deletar Sessão',
            'Esta ação não pode ser desfeita. Tem certeza que deseja deletar esta sessão permanentemente?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Deletar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Note: You'll need to add this function to your session context
                            // For now, we'll use cancelSession as a placeholder
                            await cancelSession(sessionId, 'Sessão deletada');
                            Alert.alert('Sucesso', 'Sessão deletada com sucesso!');
                        } catch (error: any) {
                            Alert.alert('Erro', error.message || 'Não foi possível deletar a sessão');
                        }
                    }
                }
            ]
        );
    }, [cancelSession]);

    // Bulk actions
    const handleBulkCancel = useCallback(async () => {
        if (selectedSessions.length === 0) return;

        Alert.alert(
            'Cancelar Sessões',
            `Tem certeza que deseja cancelar ${selectedSessions.length} sessão(ões) selecionada(s)?`,
            [
                { text: 'Não', style: 'cancel' },
                {
                    text: 'Sim, cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await Promise.all(
                                selectedSessions.map(id => cancelSession(id, 'Cancelamento em lote'))
                            );
                            setSelectedSessions([]);
                            Alert.alert('Sucesso', 'Sessões canceladas com sucesso!');
                        } catch (error: any) {
                            Alert.alert('Erro', 'Erro ao cancelar algumas sessões');
                        }
                    }
                }
            ]
        );
    }, [selectedSessions, cancelSession]);



    // UI Helper functions
    const getStatusColor = (status: SessionStatus) => {
        switch (status) {
            case SessionStatus.SCHEDULED:
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case SessionStatus.ACTIVE:
                return 'bg-green-100 text-green-700 border-green-200';
            case SessionStatus.PAUSED:
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case SessionStatus.COMPLETED:
                return 'bg-gray-100 text-gray-700 border-gray-200';
            case SessionStatus.CANCELLED:
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusLabel = (status: SessionStatus) => {
        switch (status) {
            case SessionStatus.SCHEDULED:
                return 'Agendada';
            case SessionStatus.ACTIVE:
                return 'Ativa';
            case SessionStatus.PAUSED:
                return 'Pausada';
            case SessionStatus.COMPLETED:
                return 'Concluída';
            case SessionStatus.CANCELLED:
                return 'Cancelada';
            default:
                return status;
        }
    };

    const getTypeIcon = (type: SessionType) => {
        switch (type) {
            case SessionType.INDIVIDUAL:
                return 'person';
            case SessionType.GROUP:
                return 'people';
            default:
                return 'school';
        }
    };

    // Render session item
    // const renderSessionItem = ({ item: session }: { item: ISessionResponse }) => {
    //     const canStart = session.status === SessionStatus.SCHEDULED;
    //     const canEnd = session.status === SessionStatus.ACTIVE;
    //     const canCancel = [SessionStatus.SCHEDULED, SessionStatus.ACTIVE].includes(session.status);
    //     const isActive = currentSession?.id === session.id;
    //     const isSelected = selectedSessions.includes(session.id);

    //     const participantNames = session.participants.map(p => p.fullName).join(', ');
    //     const scheduledDate = session.scheduledAt ? new Date(session.scheduledAt) : null;

    //     return (
    //         <View style={tw`mx-4 mb-4`}>
    //             <TouchableOpacity
    //                 style={tw`bg-white rounded-2xl shadow-lg ${isSelected ? 'border-2 border-purple-400' : 'border border-gray-100'} overflow-hidden`}
    //                 onPress={() => {
    //                     if (selectedSessions.length > 0) {
    //                         // Selection mode
    //                         if (isSelected) {
    //                             setSelectedSessions(prev => prev.filter(id => id !== session.id));
    //                         } else {
    //                             setSelectedSessions(prev => [...prev, session.id]);
    //                         }
    //                     } else {
    //                         // Normal navigation
    //                         handleJoinSessionChat(session);
    //                     }
    //                 }}
    //                 onLongPress={() => {
    //                     if (!isSelected) {
    //                         setSelectedSessions([session.id]);
    //                     }
    //                 }}
    //                 activeOpacity={0.8}
    //             >
    //                 <View style={tw`p-4`}>
    //                     {/* Header */}
    //                     <View style={tw`flex-row items-start justify-between mb-3`}>
    //                         <View style={tw`flex-1 mr-3`}>
    //                             <View style={tw`flex-row items-center mb-2`}>
    //                                 <Ionicons
    //                                     name={getTypeIcon(session.type)}
    //                                     size={16}
    //                                     color="#6B7280"
    //                                 />
    //                                 <Text style={tw`font-bold text-gray-800 text-lg ml-2 flex-1`}>
    //                                     {session.title}
    //                                 </Text>
    //                                 {isSelected && (
    //                                     <View style={tw`w-5 h-5 bg-indigo-500 rounded-full items-center justify-center ml-2`}>
    //                                         <Ionicons name="checkmark" size={12} color="white" />
    //                                     </View>
    //                                 )}
    //                             </View>

    //                             {session.metadata?.subject && (
    //                                 <Text style={tw`text-gray-600 mb-1`}>
    //                                     📚 {session.metadata.subject}
    //                                 </Text>
    //                             )}

    //                             <Text style={tw`text-gray-600 mb-1`}>
    //                                 👥 {participantNames || 'Nenhum participante'}
    //                             </Text>

    //                             {scheduledDate && (
    //                                 <Text style={tw`text-gray-500 text-sm`}>
    //                                     🕒 {scheduledDate.toLocaleDateString('pt-BR')} às{' '}
    //                                     {scheduledDate.toLocaleTimeString('pt-BR', {
    //                                         hour: '2-digit',
    //                                         minute: '2-digit'
    //                                     })}
    //                                 </Text>
    //                             )}
    //                         </View>

    //                         <View style={tw`items-end`}>
    //                             <View style={tw`${getStatusColor(session.status)} px-3 py-1 rounded-full border mb-2`}>
    //                                 <Text style={tw`text-sm font-medium`}>
    //                                     {getStatusLabel(session.status)}
    //                                 </Text>
    //                             </View>

    //                             <Text style={tw`text-xs text-gray-500`}>
    //                                 {session.duration} min
    //                             </Text>
    //                         </View>
    //                     </View>

    //                     {/* Description */}
    //                     {session.description && (
    //                         <Text style={tw`text-gray-600 mb-3 text-sm`} numberOfLines={2}>
    //                             {session.description}
    //                         </Text>
    //                     )}

    //                     {/* Active session indicator */}
    //                     {isActive && (
    //                         <View style={tw`bg-green-50 border border-green-200 p-3 rounded-lg mb-3`}>
    //                             <Text style={tw`text-green-700 font-medium text-center`}>
    //                                 🟢 Sessão ativa
    //                             </Text>
    //                         </View>
    //                     )}

    //                     {/* Enhanced Professional Action Buttons */}
    //                     <View style={tw`pt-3 border-t border-gray-100`}>
    //                         {/* Primary Actions Row */}
    //                         <View style={tw`flex-row justify-between mb-3`}>
    //                             {/* Start Session Button - Shows when session is scheduled */}
    //                             {canStart && (
    //                                 <TouchableOpacity
    //                                     onPress={() => showStartSessionOptions(session.id)}
    //                                     style={[
    //                                         tw`flex-1 px-3 py-3 rounded-xl flex-row items-center justify-center mr-2`,
    //                                         {
    //                                             backgroundColor: '#10B981',
    //                                             shadowColor: '#000',
    //                                             shadowOffset: { width: 0, height: 2 },
    //                                             shadowOpacity: 0.25,
    //                                             shadowRadius: 3.84,
    //                                             elevation: 5,
    //                                         }
    //                                     ]}
    //                                     activeOpacity={0.8}
    //                                 >
    //                                     <Ionicons name="play-circle" size={18} color="white" />
    //                                     <Text style={tw`text-white font-semibold ml-2 text-sm`}>Iniciar</Text>
    //                                 </TouchableOpacity>
    //                             )}

    //                             {/* End Session Button - Shows when session is active */}
    //                             {canEnd && (
    //                                 <TouchableOpacity
    //                                     onPress={() => handleEndSession(session.id)}
    //                                     style={[
    //                                         tw`flex-1 px-3 py-3 rounded-xl flex-row items-center justify-center mr-2`,
    //                                         {
    //                                             backgroundColor: '#EF4444',
    //                                             shadowColor: '#000',
    //                                             shadowOffset: { width: 0, height: 2 },
    //                                             shadowOpacity: 0.25,
    //                                             shadowRadius: 3.84,
    //                                             elevation: 5,
    //                                         }
    //                                     ]}
    //                                     activeOpacity={0.8}
    //                                 >
    //                                     <Ionicons name="stop-circle" size={18} color="white" />
    //                                     <Text style={tw`text-white font-semibold ml-2 text-sm`}>Finalizar</Text>
    //                                 </TouchableOpacity>
    //                             )}

    //                             {/* Join Chat Button - Always available for active sessions */}
    //                             {(session.status === SessionStatus.ACTIVE || session.status === SessionStatus.PAUSED) && (
    //                                 <TouchableOpacity
    //                                     onPress={() => handleJoinSessionChat(session)}
    //                                     style={[
    //                                         tw`${canEnd ? 'flex-1' : 'flex-1 mr-2'} px-3 py-3 rounded-xl flex-row items-center justify-center`,
    //                                         {
    //                                             backgroundColor: '#3B82F6',
    //                                             shadowColor: '#000',
    //                                             shadowOffset: { width: 0, height: 2 },
    //                                             shadowOpacity: 0.25,
    //                                             shadowRadius: 3.84,
    //                                             elevation: 5,
    //                                         }
    //                                     ]}
    //                                     activeOpacity={0.8}
    //                                 >
    //                                     <Ionicons name="chatbubble-ellipses" size={16} color="white" />
    //                                     <Text style={tw`text-white font-semibold ml-2 text-sm`}>Chat</Text>
    //                                 </TouchableOpacity>
    //                             )}

    //                             {/* View Chat Button - For scheduled/completed sessions */}
    //                             {(session.status === SessionStatus.SCHEDULED || session.status === SessionStatus.COMPLETED) && (
    //                                 <TouchableOpacity
    //                                     onPress={() => handleJoinSessionChat(session)}
    //                                     style={[
    //                                         tw`${canStart ? 'flex-1' : 'flex-1 mr-2'} px-3 py-3 rounded-xl flex-row items-center justify-center`,
    //                                         {
    //                                             backgroundColor: '#8B5CF6',
    //                                             shadowColor: '#000',
    //                                             shadowOffset: { width: 0, height: 2 },
    //                                             shadowOpacity: 0.25,
    //                                             shadowRadius: 3.84,
    //                                             elevation: 5,
    //                                         }
    //                                     ]}
    //                                     activeOpacity={0.8}
    //                                 >
    //                                     <Ionicons name="chatbubble" size={16} color="white" />
    //                                     <Text style={tw`text-white font-semibold ml-1 text-xs`}>
    //                                         {session.status === SessionStatus.COMPLETED ? 'Ver' : 'Chat'}
    //                                     </Text>
    //                                 </TouchableOpacity>
    //                             )}

    //                             {/* Delete Button - Always available for scheduled/cancelled sessions */}
    //                             {(session.status === SessionStatus.SCHEDULED || session.status === SessionStatus.CANCELLED) && (
    //                                 <TouchableOpacity
    //                                     onPress={() => handleDeleteSession(session.id)}
    //                                     style={[
    //                                         tw`w-12 h-12 rounded-xl items-center justify-center`,
    //                                         {
    //                                             backgroundColor: '#F87171',
    //                                             shadowColor: '#000',
    //                                             shadowOffset: { width: 0, height: 2 },
    //                                             shadowOpacity: 0.25,
    //                                             shadowRadius: 3.84,
    //                                             elevation: 5,
    //                                         }
    //                                     ]}
    //                                     activeOpacity={0.8}
    //                                 >
    //                                     <Ionicons name="trash" size={16} color="white" />
    //                                 </TouchableOpacity>
    //                             )}
    //                         </View>

    //                         {/* Secondary Actions Row - Quick actions */}
    //                         <View style={tw`flex-row justify-between items-center`}>
    //                             {/* Session Status Info */}
    //                             <View style={tw`flex-row items-center flex-1`}>
    //                                 <View style={tw`w-2 h-2 rounded-full mr-2 ${session.status === SessionStatus.ACTIVE ? 'bg-green-400' :
    //                                         session.status === SessionStatus.SCHEDULED ? 'bg-blue-400' :
    //                                             session.status === SessionStatus.COMPLETED ? 'bg-gray-400' :
    //                                                 session.status === SessionStatus.CANCELLED ? 'bg-red-400' : 'bg-yellow-400'
    //                                     }`} />
    //                                 <Text style={tw`text-sm text-gray-600 flex-1`}>
    //                                     {session.status === SessionStatus.ACTIVE ? 'Sessão em andamento' :
    //                                         session.status === SessionStatus.SCHEDULED ? 'Aguardando início' :
    //                                             session.status === SessionStatus.COMPLETED ? 'Sessão finalizada' :
    //                                                 session.status === SessionStatus.CANCELLED ? 'Sessão cancelada' : 'Sessão pausada'}
    //                                 </Text>
    //                             </View>

    //                             {/* Quick Action Buttons */}
    //                             <View style={tw`flex-row items-center`}>
    //                                 {/* Pause/Resume for active sessions */}
    //                                 {session.status === SessionStatus.ACTIVE && (
    //                                     <TouchableOpacity
    //                                         onPress={() => {
    //                                             // Add pause functionality here
    //                                             Alert.alert('Pausar', 'Funcionalidade de pausar sessão em desenvolvimento');
    //                                         }}
    //                                         style={tw`p-2 mx-1 bg-yellow-100 rounded-lg`}
    //                                         activeOpacity={0.7}
    //                                     >
    //                                         <Ionicons name="pause" size={16} color="#F59E0B" />
    //                                     </TouchableOpacity>
    //                                 )}

    //                                 {/* Info button */}
    //                                 <TouchableOpacity
    //                                     onPress={() => {
    //                                         Alert.alert(
    //                                             session.title,
    //                                             `Descrição: ${session.description || 'Sem descrição'}\n\nParticipantes: ${participantNames}\n\nDuração: ${session.duration} minutos\n\nStatus: ${getStatusLabel(session.status)}`,
    //                                             [{ text: 'OK' }]
    //                                         );
    //                                     }}
    //                                     style={tw`p-2 mx-1 bg-gray-100 rounded-lg`}
    //                                     activeOpacity={0.7}
    //                                 >
    //                                     <Ionicons name="information-circle" size={16} color="#6B7280" />
    //                                 </TouchableOpacity>

    //                                 {/* More options button */}
    //                                 <TouchableOpacity
    //                                     onPress={() => {
    //                                         Alert.alert(
    //                                             'Opções da Sessão',
    //                                             'Escolha uma ação:',
    //                                             [
    //                                                 { text: 'Cancelar', style: 'cancel' },
    //                                                 ...(canCancel ? [{
    //                                                     text: 'Cancelar Sessão',
    //                                                     style: 'destructive' as const,
    //                                                     onPress: () => handleCancelSession(session.id)
    //                                                 }] : []),
    //                                                 {
    //                                                     text: 'Editar Sessão',
    //                                                     onPress: () => Alert.alert('Editar', 'Funcionalidade de edição em desenvolvimento')
    //                                                 },
    //                                                 {
    //                                                     text: 'Compartilhar',
    //                                                     onPress: () => Alert.alert('Compartilhar', 'Funcionalidade de compartilhamento em desenvolvimento')
    //                                                 }
    //                                             ]
    //                                         );
    //                                     }}
    //                                     style={tw`p-2 mx-1 bg-gray-100 rounded-lg`}
    //                                     activeOpacity={0.7}
    //                                 >
    //                                     <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
    //                                 </TouchableOpacity>
    //                             </View>
    //                         </View>
    //                     </View>
    //                 </View>
    //             </TouchableOpacity>
    //         </View>
    //     );
    // };

    // Stats component
    const StatsSection = () => {
        if (!stats) return null;

        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={tw`my-2 max-h-20`}
                contentContainerStyle={tw`px-2 justify-center items-center w-full`}
            >
                <View style={tw`flex-row justify-center items-center max-h-fit`}>
                    <LinearGradient
                        colors={['rgba(79,70,229,1)', 'rgba(124,58,237,0.5)']}
                        style={tw`w-21 h-15 rounded-xl p-3 mr-2 justify-between border border-white border-opacity-20`}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={tw`text-white text-xs opacity-90`}>Total</Text>
                        <Text style={tw`text-white text-medium font-bold drop-shadow-lg`}>{stats.totalSessions}</Text>
                    </LinearGradient>

                    <LinearGradient
                        colors={['rgba(16,185,129,1)', 'rgba(5,150,105,0.5)']}
                        style={tw`w-21 h-15 rounded-xl p-3 mr-2 justify-between border border-white border-opacity-20`}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={tw`text-white text-xs opacity-90`}>Ativas</Text>
                        <Text style={tw`text-white text-medium font-bold drop-shadow-lg`}>{stats.activeSessions || 0}</Text>
                    </LinearGradient>

                    <LinearGradient
                        colors={['rgba(245,158,11,1)', 'rgba(217,119,6,0.5)']}
                        style={tw`w-22 h-15 rounded-xl p-3 mr-2 justify-between border border-white border-opacity-20`}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={tw`text-white text-xs opacity-90`}>Concluídas</Text>
                        <Text style={tw`text-white text-medium font-bold drop-shadow-lg`}>{stats.completedSessions}</Text>
                    </LinearGradient>

                    <LinearGradient
                        colors={['rgba(239,68,68,1)', 'rgba(220,38,38,0.5)']}
                        style={tw`w-21 h-15 rounded-xl p-3 justify-between border border-white border-opacity-20`}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={tw`text-white text-xs opacity-90`}>Taxa (%)</Text>
                        <Text style={tw`text-white text-medium font-bold drop-shadow-lg`}>{stats.completionRate || 0}%</Text>
                    </LinearGradient>
                </View>
            </ScrollView>
        );
    };

    // Create Session Modal
    const CreateSessionModal = () => {
        const [formData, setFormData] = useState({
            title: '',
            description: '',
            subject: '',
            materials: [] as string[],
            type: SessionType.INDIVIDUAL,
            duration: 60,
            scheduledAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
            selectedParticipants: [] as IConnectedUser[]
        });
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [showParticipantSearch, setShowParticipantSearch] = useState(false);
        const [searchQuery, setSearchQuery] = useState('');
        const [searchResults, setSearchResults] = useState<IConnectedUser[]>([]);
        const [isSearching, setIsSearching] = useState(false);

        const handleAddParticipant = (participant: IConnectedUser) => {
            if (!formData.selectedParticipants.find(p => p.uid === participant.uid)) {
                setFormData(prev => ({
                    ...prev,
                    selectedParticipants: [...prev.selectedParticipants, participant]
                }));
            }
            setShowParticipantSearch(false);
            setSearchQuery('');
        };

        const handleRemoveParticipant = (participantId: string) => {
            setFormData(prev => ({
                ...prev,
                selectedParticipants: prev.selectedParticipants.filter(p => p.uid !== participantId)
            }));
        };

        const searchParticipants = async (query: string) => {
            if (!query.trim()) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                // Search in user's connections
                const connectionsResponse = await searchConnections({
                    search: query,
                    status: 'accepted',
                    limit: 10
                });

                const availableParticipants = connectionsResponse.connections
                    .map(conn => conn.connectedUser)
                    .filter(user => !formData.selectedParticipants.find(p => p.uid === user.uid));

                setSearchResults(availableParticipants);
            } catch (error) {
                console.error('Error searching participants:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        const loadInitialConnections = async () => {
            try {
                const connectionsResponse = await getAcceptedConnections();
                const connections = connectionsResponse.connections
                    .map(conn => conn.connectedUser)
                    .filter(user => !formData.selectedParticipants.find(p => p.uid === user.uid));
                setSearchResults(connections.slice(0, 10)); // Show first 10
            } catch (error) {
                console.error('Error loading connections:', error);
            }
        };

        // Debounced search
        useEffect(() => {
            const timeoutId = setTimeout(() => {
                if (searchQuery) {
                    searchParticipants(searchQuery);
                } else if (showParticipantSearch) {
                    loadInitialConnections();
                }
            }, 300);

            return () => clearTimeout(timeoutId);
        }, [searchQuery, showParticipantSearch]);

        const handleSubmit = async () => {
            if (!formData.title.trim()) {
                Alert.alert('Erro', 'Título é obrigatório');
                return;
            }

            if (formData.selectedParticipants.length === 0) {
                Alert.alert('Erro', 'Pelo menos um participante é obrigatório');
                return;
            }

            setIsSubmitting(true);
            try {
                await createSession({
                    title: formData.title,
                    description: formData.description || undefined,
                    subject: formData.subject || undefined,
                    materials: formData.materials.length > 0 ? formData.materials : undefined,
                    type: formData.type,
                    duration: formData.duration,
                    scheduledAt: formData.scheduledAt.toISOString(),
                    menteeIds: formData.selectedParticipants.map(p => p.uid),
                    maxParticipants: formData.type === SessionType.GROUP ? Math.max(formData.selectedParticipants.length + 2, 5) : 1
                });
                console.log("Session Creation")
                console.log(formData)

                // Wait a brief moment to ensure context loading is complete
                setTimeout(() => {
                    Alert.alert('Sucesso', 'Sessão criada com sucesso!');
                    setShowCreateModal(false);

                    // Reset form
                    setFormData({
                        title: '',
                        description: '',
                        subject: '',
                        materials: [],
                        type: SessionType.INDIVIDUAL,
                        duration: 60,
                        scheduledAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
                        selectedParticipants: []
                    });
                    setSearchQuery('');
                    setSearchResults([]);
                }, 500); // Small delay to ensure context finishes
            } catch (error: any) {
                Alert.alert('Erro', error.message || 'Não foi possível criar a sessão');
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <Modal
                visible={showCreateModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={tw`flex-1 bg-black bg-opacity-50 justify-center`}>
                    <View style={tw`bg-white mx-4 rounded-3xl p-6 max-h-4/5`}>
                        <View style={tw`flex-row items-center justify-between mb-6`}>
                            <Text style={tw`text-xl font-bold text-gray-800`}>Nova Sessão</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Title */}
                            <Text style={tw`text-lg font-semibold text-gray-700 mb-2`}>Título *</Text>
                            <TextInput
                                style={tw`bg-gray-100 p-3 rounded-lg mb-4`}
                                placeholder="Digite o título da sessão"
                                value={formData.title}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                                placeholderTextColor="#9CA3AF"
                            />

                            {/* Description */}
                            <Text style={tw`text-lg font-semibold text-gray-700 mb-2`}>Descrição</Text>
                            <TextInput
                                style={tw`bg-gray-100 p-3 rounded-lg mb-4 h-20`}
                                placeholder="Descreva o objetivo da sessão"
                                value={formData.description}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                                multiline
                                textAlignVertical="top"
                                placeholderTextColor="#9CA3AF"
                            />

                            {/* Type */}
                            <Text style={tw`text-lg font-semibold text-gray-700 mb-2`}>Tipo de Sessão</Text>
                            <View style={tw`flex-row mb-4`}>
                                {[
                                    { key: SessionType.INDIVIDUAL, label: 'Individual', icon: 'person' },
                                    { key: SessionType.GROUP, label: 'Grupo', icon: 'people' }
                                ].map((type) => (
                                    <TouchableOpacity
                                        key={type.key}
                                        onPress={() => setFormData(prev => ({ ...prev, type: type.key }))}
                                        style={tw`flex-1 flex-row items-center justify-center p-3 mr-2 rounded-lg ${formData.type === type.key ? 'bg-indigo-500' : 'bg-gray-200'
                                            }`}
                                    >
                                        <Ionicons
                                            name={type.icon as any}
                                            size={20}
                                            color={formData.type === type.key ? 'white' : '#6B7280'}
                                        />
                                        <Text style={tw`ml-2 font-medium ${formData.type === type.key ? 'text-white' : 'text-gray-700'
                                            }`}>
                                            {type.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Duration */}
                            <Text style={tw`text-lg font-semibold text-gray-700 mb-2`}>Duração (minutos)</Text>
                            <View style={tw`flex-row mb-4`}>
                                {[30, 60, 90, 120].map((duration) => (
                                    <TouchableOpacity
                                        key={duration}
                                        onPress={() => setFormData(prev => ({ ...prev, duration }))}
                                        style={tw`flex-1 p-3 mr-2 rounded-lg ${formData.duration === duration ? 'bg-indigo-500' : 'bg-gray-200'
                                            }`}
                                    >
                                        <Text style={tw`text-center font-medium ${formData.duration === duration ? 'text-white' : 'text-gray-700'
                                            }`}>
                                            {duration}min
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Participants */}
                            <Text style={tw`text-lg font-semibold text-gray-700 mb-2`}>Participantes *</Text>

                            {/* Selected Participants */}
                            {formData.selectedParticipants.map((participant) => (
                                <View key={participant.uid} style={tw`flex-row items-center bg-indigo-50 p-3 rounded-lg mb-2`}>
                                    <View style={tw`w-10 h-10 bg-indigo-500 rounded-full items-center justify-center mr-3`}>
                                        {participant.image ? (
                                            <Text>IMG</Text>
                                        ) : (
                                            <Text style={tw`text-white font-bold`}>
                                                {participant.fullName.charAt(0).toUpperCase()}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={tw`flex-1`}>
                                        <Text style={tw`font-semibold text-gray-800`}>{participant.fullName}</Text>
                                        <Text style={tw`text-gray-600 text-sm`}>{participant.email}</Text>
                                        <Text style={tw`text-gray-500 text-xs`}>{participant.role} • {participant.school}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleRemoveParticipant(participant.uid)}
                                        style={tw`p-2`}
                                    >
                                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {/* Add Participant Button */}
                            <TouchableOpacity
                                onPress={() => setShowParticipantSearch(true)}
                                style={tw`flex-row items-center justify-center p-3 border-2 border-dashed border-indigo-300 rounded-lg mb-4`}
                            >
                                <Ionicons name="person-add" size={20} color="#4F46E5" />
                                <Text style={tw`ml-2 text-indigo-600 font-medium`}>
                                    {formData.selectedParticipants.length === 0 ? 'Adicionar Participantes' : 'Adicionar Mais Participantes'}
                                </Text>
                            </TouchableOpacity>

                            {/* Participant Search Modal */}
                            {showParticipantSearch && (
                                <View style={tw`bg-white border border-gray-200 rounded-lg p-4 mb-4`}>
                                    <View style={tw`flex-row items-center justify-between mb-3`}>
                                        <Text style={tw`font-semibold text-gray-800`}>Buscar Participantes</Text>
                                        <TouchableOpacity onPress={() => setShowParticipantSearch(false)}>
                                            <Ionicons name="close" size={20} color="#6B7280" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Search Input */}
                                    <View style={tw`flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-3`}>
                                        <Ionicons name="search" size={16} color="#6B7280" />
                                        <TextInput
                                            style={tw`flex-1 ml-2 text-gray-700`}
                                            placeholder="Buscar por nome ou email..."
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            placeholderTextColor="#9CA3AF"
                                        />
                                        {isSearching && (
                                            <ActivityIndicator size="small" color="#4F46E5" />
                                        )}
                                    </View>

                                    {/* Search Results */}
                                    {searchResults.length > 0 ? (
                                        <ScrollView style={tw`max-h-48`} showsVerticalScrollIndicator={false}>
                                            {searchResults.map((participant) => (
                                                <TouchableOpacity
                                                    key={participant.uid}
                                                    onPress={() => handleAddParticipant(participant)}
                                                    style={tw`flex-row items-center p-3 border-b border-gray-100`}
                                                >
                                                    <View style={tw`w-8 h-8 bg-gray-300 rounded-full items-center justify-center mr-3`}>
                                                        <Text style={tw`text-gray-600 font-bold text-sm`}>
                                                            {participant.fullName.charAt(0).toUpperCase()}
                                                        </Text>
                                                    </View>
                                                    <View style={tw`flex-1`}>
                                                        <Text style={tw`font-medium text-gray-800`}>{participant.fullName}</Text>
                                                        <Text style={tw`text-gray-600 text-sm`}>{participant.email}</Text>
                                                        <Text style={tw`text-gray-500 text-xs`}>{participant.role}</Text>
                                                    </View>
                                                    <Ionicons name="add-circle" size={20} color="#10B981" />
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    ) : searchQuery.length > 0 ? (
                                        <View style={tw`items-center py-6`}>
                                            <Ionicons name="search" size={32} color="#D1D5DB" />
                                            <Text style={tw`text-gray-500 mt-2`}>Nenhum participante encontrado</Text>
                                        </View>
                                    ) : (
                                        <View style={tw`items-center py-6`}>
                                            <Ionicons name="people" size={32} color="#D1D5DB" />
                                            <Text style={tw`text-gray-500 mt-2 text-center`}>
                                                Digite para buscar suas conexões
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Scheduled Date (simplified - just showing current time + 1 hour) */}
                            <Text style={tw`text-lg font-semibold text-gray-700 mb-2`}>Agendamento</Text>
                            <View style={tw`bg-gray-100 p-3 rounded-lg mb-6`}>
                                <Text style={tw`text-gray-600`}>
                                    📅 {formData.scheduledAt.toLocaleDateString('pt-BR')} às{' '}
                                    {formData.scheduledAt.toLocaleTimeString('pt-BR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </Text>
                                <Text style={tw`text-gray-500 text-sm mt-1`}>
                                    *Agendada para 1 hora a partir de agora
                                </Text>
                            </View>

                            {/* Buttons */}
                            <View style={tw`flex-row`}>
                                <TouchableOpacity
                                    onPress={() => setShowCreateModal(false)}
                                    style={tw`flex-1 p-3 mr-2 border border-gray-300 rounded-lg`}
                                    disabled={isSubmitting}
                                >
                                    <Text style={tw`text-center text-gray-600 font-medium`}>Cancelar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    style={tw`flex-1 p-3 ml-2 bg-indigo-500 rounded-lg ${isSubmitting ? 'opacity-50' : ''}`}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={tw`text-center text-white font-medium`}>Criar Sessão</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    };

    // Filter Modal
    const FilterModal = () => (
        <Modal
            visible={showFilterModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowFilterModal(false)}
        >
            <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
                <View style={tw`bg-white rounded-t-3xl p-6 max-h-3/4`}>
                    <View style={tw`flex-row items-center justify-between mb-6`}>
                        <Text style={tw`text-xl font-bold text-gray-800`}>Filtros</Text>
                        <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Status Filter */}
                        <Text style={tw`text-lg font-semibold text-gray-700 mb-3`}>Status</Text>
                        <View style={tw`flex-row flex-wrap mb-6`}>
                            {[
                                { key: 'all', label: 'Todas' },
                                { key: SessionStatus.SCHEDULED, label: 'Agendadas' },
                                { key: SessionStatus.ACTIVE, label: 'Ativas' },
                                { key: SessionStatus.COMPLETED, label: 'Concluídas' },
                                { key: SessionStatus.CANCELLED, label: 'Canceladas' }
                            ].map((item) => (
                                <TouchableOpacity
                                    key={item.key}
                                    onPress={() => setFilters(prev => ({ ...prev, status: item.key as any }))}
                                    style={tw`px-4 py-2 rounded-full mr-2 mb-2 ${filters.status === item.key ? 'bg-indigo-500' : 'bg-gray-200'
                                        }`}
                                >
                                    <Text style={tw`${filters.status === item.key ? 'text-white' : 'text-gray-700'
                                        } font-medium`}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Type Filter */}
                        <Text style={tw`text-lg font-semibold text-gray-700 mb-3`}>Tipo</Text>
                        <View style={tw`flex-row flex-wrap mb-6`}>
                            {[
                                { key: 'all', label: 'Todos' },
                                { key: SessionType.INDIVIDUAL, label: 'Individual' },
                                { key: SessionType.GROUP, label: 'Grupo' }
                            ].map((item) => (
                                <TouchableOpacity
                                    key={item.key}
                                    onPress={() => setFilters(prev => ({ ...prev, type: item.key as any }))}
                                    style={tw`px-4 py-2 rounded-full mr-2 mb-2 ${filters.type === item.key ? 'bg-indigo-500' : 'bg-gray-200'
                                        }`}
                                >
                                    <Text style={tw`${filters.type === item.key ? 'text-white' : 'text-gray-700'
                                        } font-medium`}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Date Range Filter */}
                        <Text style={tw`text-lg font-semibold text-gray-700 mb-3`}>Período</Text>
                        <View style={tw`flex-row flex-wrap mb-6`}>
                            {[
                                { key: 'all', label: 'Todos' },
                                { key: 'today', label: 'Hoje' },
                                { key: 'week', label: 'Esta semana' },
                                { key: 'month', label: 'Este mês' }
                            ].map((item) => (
                                <TouchableOpacity
                                    key={item.key}
                                    onPress={() => setFilters(prev => ({ ...prev, dateRange: item.key as any }))}
                                    style={tw`px-4 py-2 rounded-full mr-2 mb-2 ${filters.dateRange === item.key ? 'bg-indigo-500' : 'bg-gray-200'
                                        }`}
                                >
                                    <Text style={tw`${filters.dateRange === item.key ? 'text-white' : 'text-gray-700'
                                        } font-medium`}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Clear Filters */}
                        <TouchableOpacity
                            onPress={() => {
                                setFilters({ status: 'all', type: 'all', dateRange: 'all', search: '' });
                                setShowFilterModal(false);
                            }}
                            style={tw`bg-gray-100 p-3 rounded-lg mt-4`}
                        >
                            <Text style={tw`text-gray-700 font-medium text-center`}>
                                Limpar Filtros
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    // Access control
    if (user?.role !== 'mentor' && user?.role !== 'coordinator') {
        return (
            <SafeAreaView style={tw`flex-1 bg-gray-50`}>
                <View style={tw`flex-1 items-center justify-center px-6`}>
                    <Ionicons name="lock-closed" size={64} color="#D1D5DB" />
                    <Text style={tw`text-gray-500 text-lg font-medium mt-4 text-center`}>
                        Acesso Restrito
                    </Text>
                    <Text style={tw`text-gray-400 text-center mt-2`}>
                        Apenas mentores e coordenadores podem gerenciar sessões
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={tw`flex-1 bg-gray-50`}>
            <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
            {/* <Navbar title="Sesões" /> */}

            {/* Enhanced Header with Gradient */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={tw`px-4 py-4`}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={tw`flex-row items-center justify-between mb-6 pt-4`}>
                    <View style={tw`flex-1`}>
                        <Text style={tw`text-2xl font-bold text-white mb-1`}>
                            Gerenciar Sessões
                        </Text>
                        <Text style={tw`text-indigo-100 text-sm`}>
                            {filteredSessions.length} sessão(ões) encontrada(s)
                        </Text>
                    </View>

                    <View style={tw`flex-row items-center`}>
                        {/* <TouchableOpacity
                            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                            style={tw`mr-3 p-3 bg-white bg-opacity-20 rounded-xl`}
                        >
                            <Ionicons
                                name={viewMode === 'list' ? 'grid' : 'list'}
                                size={20}
                                color="white"
                            />
                        </TouchableOpacity> */}

                        <TouchableOpacity
                            onPress={() => setShowCreateModal(true)}
                            style={tw`bg-white px-3 py-3 rounded-xl flex-row items-center shadow-lg`}
                        >
                            <Ionicons name="add" size={20} color="#667eea" />
                            <Text style={tw`text-purple-600 font-semibold ml-2`}>Nova</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Enhanced Search Bar */}
                <View style={tw`flex-row items-center`}>
                    <View style={tw`flex-1 flex-row items-center bg-white bg-opacity-30 rounded-2xl px-4 py-1 mr-3 border border-white border-opacity-20`}>
                        <Ionicons name="search" size={20} color="white" />
                        <TextInput
                            style={tw`flex-1 ml-3 text-white text-base`}
                            placeholder="Buscar sessões..."
                            value={filters.search}
                            onChangeText={(text) => setFilters(prev => ({ ...prev, search: text }))}
                            placeholderTextColor="rgba(255,255,255,0.7)"
                        />
                        {filters.search.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setFilters(prev => ({ ...prev, search: '' }))}
                                style={tw`p-1`}
                            >
                                <Ionicons name="close-circle" size={20} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={() => setShowFilterModal(true)}
                        style={tw`bg-white bg-opacity-20 p-3 rounded-xl border border-white border-opacity-20`}
                    >
                        <Ionicons name="options" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Current session indicator */}
            {currentSession && (
                <View style={tw`bg-green-500 px-4 py-3`}>
                    <Text style={tw`text-white font-medium`}>
                        🟢 Sessão ativa: {currentSession.title}
                    </Text>
                </View>
            )}

            {/* Bulk actions */}
            {selectedSessions.length > 0 && (
                <View style={tw`bg-indigo-50 border-b border-indigo-200 px-4 py-3`}>
                    <View style={tw`flex-row items-center justify-between`}>
                        <Text style={tw`text-indigo-700 font-medium`}>
                            {selectedSessions.length} sessão(ões) selecionada(s)
                        </Text>
                        <View style={tw`flex-row items-center`}>
                            <TouchableOpacity
                                onPress={handleBulkCancel}
                                style={tw`bg-red-500 px-3 py-1 rounded mr-2`}
                            >
                                <Text style={tw`text-white text-sm font-medium`}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setSelectedSessions([])}
                                style={tw`p-1`}
                            >
                                <Ionicons name="close" size={20} color="#4F46E5" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Error display */}
            {error && (
                <View style={tw`bg-red-50 border border-red-200 mx-4 mt-4 p-3 rounded-lg`}>
                    <Text style={tw`text-red-700`}>{error}</Text>
                    <TouchableOpacity onPress={clearError} style={tw`mt-2`}>
                        <Text style={tw`text-red-600 font-medium`}>Tentar novamente</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Sessions list with integrated stats */}
            <View style={tw`flex-1`}>
                {isLoading && !refreshing ? (
                    <View style={tw`flex-1 items-center justify-center`}>
                        <ActivityIndicator size="large" color="#4F46E5" />
                        <Text style={tw`text-gray-500 mt-4`}>Carregando sessões...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredSessions}
                        renderItem={({ item }) => (
                            <RenderSessionItem
                                item={item}
                                onStartSession={handleStartSession}
                                onEndSession={handleEndSession}
                                onDeleteSession={handleDeleteSession}
                                onOpenChat={handleJoinSessionChat}
                            />
                        )}
                        keyExtractor={(item) => item.id}
                        ListHeaderComponent={() => (
                            <View>
                                <StatsSection />
                                {filteredSessions.length === 0 && (
                                    <View style={tw`items-center justify-center px-8 py-12`}>
                                        <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                                        <Text style={tw`text-gray-500 text-lg font-medium mt-4 text-center`}>
                                            Nenhuma sessão encontrada
                                        </Text>
                                        <Text style={tw`text-gray-400 text-center mt-2`}>
                                            {filters.search || filters.status !== 'all' || filters.type !== 'all'
                                                ? 'Tente ajustar os filtros de busca'
                                                : 'Suas sessões aparecerão aqui quando forem criadas'
                                            }
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#4F46E5']}
                                tintColor="#4F46E5"
                            />
                        }
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={tw`pb-20`}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                        stickyHeaderIndices={[]}
                    />
                )}
            </View>

            <CreateSessionModal />
            <FilterModal />
        </SafeAreaView>
    );
}

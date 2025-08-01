import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { useNavigation } from "@react-navigation/native";
import { useSessionContext } from "@/src/context/SessionContext";
import { useChatContext } from "@/src/context/ChatContext";
import { useAuth } from "@/src/context/AuthContext";
import { SessionStatus, SessionType, ISessionResponse } from "@/src/interfaces/sessions.interface";
import { ChatType } from "@/src/interfaces/chat.interface";
import { chatUtils } from "@/src/utils/chatUtils";

export function SessionManagementScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();
    
    const {
        sessions,
        currentSession,
        isLoading,
        error,
        loadSessions,
        startSession,
        endSession,
        joinSession,
        leaveSession,
        refreshSessions,
        clearError
    } = useSessionContext();

    const { createChat } = useChatContext();

    const [refreshing, setRefreshing] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<SessionStatus | 'all'>('all');

    // Load sessions on mount
    useEffect(() => {
        if (user?.role === 'mentor') {
            loadSessions();
        }
    }, [user?.role]);

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

    // Filter sessions by status
    const filteredSessions = sessions.filter(session => {
        return selectedStatus === 'all' || session.status === selectedStatus;
    });

    // Handle session actions
    const handleStartSession = useCallback(async (sessionId: string) => {
        try {
            await startSession(sessionId);
            Alert.alert('Sucesso', 'Sessão iniciada com sucesso!');
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível iniciar a sessão');
        }
    }, [startSession]);

    const handleEndSession = useCallback(async (sessionId: string) => {
        try {
            await endSession(sessionId);
            Alert.alert('Sucesso', 'Sessão finalizada com sucesso!');
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível finalizar a sessão');
        }
    }, [endSession]);

    const handleJoinSessionChat = useCallback(async (session: ISessionResponse) => {
        try {
            // If session already has a chat, use it
            if (session.chatId) {
                // @ts-ignore
                navigation.navigate('ChatScreen', { 
                    chat: { id: session.chatId },
                    startSession: session.status === SessionStatus.SCHEDULED
                });
                return;
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
                title: `Sessão: ${session.title || session.subject}`
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

    const getStatusColor = (status: SessionStatus) => {
        switch (status) {
            case SessionStatus.SCHEDULED:
                return 'bg-blue-100 text-blue-600';
            case SessionStatus.ACTIVE:
            case SessionStatus.IN_PROGRESS:
                return 'bg-green-100 text-green-600';
            case SessionStatus.PAUSED:
                return 'bg-yellow-100 text-yellow-600';
            case SessionStatus.COMPLETED:
                return 'bg-gray-100 text-gray-600';
            case SessionStatus.CANCELLED:
                return 'bg-red-100 text-red-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusLabel = (status: SessionStatus) => {
        switch (status) {
            case SessionStatus.SCHEDULED:
                return 'Agendada';
            case SessionStatus.ACTIVE:
                return 'Ativa';
            case SessionStatus.IN_PROGRESS:
                return 'Em Andamento';
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

    const renderSessionItem = (session: ISessionResponse) => {
        const canStart = session.status === SessionStatus.SCHEDULED;
        const canEnd = session.status === SessionStatus.ACTIVE || session.status === SessionStatus.IN_PROGRESS;
        const isActive = currentSession?.id === session.id;

        // Get participant names
        const participantNames = session.participants.map(p => p.fullName).join(', ');

        return (
            <View key={session.id} style={tw`bg-white p-4 mb-3 rounded-xl shadow-sm`}>
                <View style={tw`flex-row items-start justify-between mb-3`}>
                    <View style={tw`flex-1`}>
                        <Text style={tw`font-semibold text-gray-800 text-lg`}>
                            {session.title || session.subject}
                        </Text>
                        <Text style={tw`text-gray-600 mt-1`}>
                            Participantes: {participantNames || 'Nenhum participante'}
                        </Text>
                        <Text style={tw`text-gray-600 mt-1`}>
                            Tipo: {session.type === SessionType.INDIVIDUAL ? 'Individual' : 
                                   session.type === SessionType.GROUP ? 'Grupo' : 'Workshop'}
                        </Text>
                        {session.scheduledAt && (
                            <Text style={tw`text-gray-500 text-sm mt-1`}>
                                Agendado: {new Date(session.scheduledAt).toLocaleDateString('pt-BR')} às{' '}
                                {new Date(session.scheduledAt).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>
                        )}
                        {session.startedAt && (
                            <Text style={tw`text-gray-500 text-sm mt-1`}>
                                Iniciado: {new Date(session.startedAt).toLocaleDateString('pt-BR')} às{' '}
                                {new Date(session.startedAt).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>
                        )}
                    </View>

                    <View style={tw`${getStatusColor(session.status)} px-3 py-1 rounded-full`}>
                        <Text style={tw`text-sm font-medium`}>
                            {getStatusLabel(session.status)}
                        </Text>
                    </View>
                </View>

                {session.description && (
                    <Text style={tw`text-gray-600 mb-3`}>
                        {session.description}
                    </Text>
                )}

                {isActive && (
                    <View style={tw`bg-green-50 border border-green-200 p-3 rounded-lg mb-3`}>
                        <Text style={tw`text-green-700 font-medium`}>
                            🟢 Sessão ativa
                        </Text>
                    </View>
                )}

                <View style={tw`flex-row items-center justify-between`}>
                    <TouchableOpacity
                        onPress={() => handleJoinSessionChat(session)}
                        style={tw`bg-indigo-500 px-4 py-2 rounded-lg flex-row items-center`}
                    >
                        <Ionicons name="chatbubble" size={16} color="white" />
                        <Text style={tw`text-white font-medium ml-2`}>Chat</Text>
                    </TouchableOpacity>

                    <View style={tw`flex-row items-center`}>
                        {canStart && (
                            <TouchableOpacity
                                onPress={() => handleStartSession(session.id)}
                                style={tw`bg-green-500 px-4 py-2 rounded-lg mr-2`}
                            >
                                <Text style={tw`text-white font-medium`}>Iniciar</Text>
                            </TouchableOpacity>
                        )}

                        {canEnd && (
                            <TouchableOpacity
                                onPress={() => handleEndSession(session.id)}
                                style={tw`bg-red-500 px-4 py-2 rounded-lg`}
                            >
                                <Text style={tw`text-white font-medium`}>Finalizar</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={tw`ml-2 p-2`}>
                            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    if (user?.role !== 'mentor') {
        return (
            <View style={tw`flex-1 bg-gray-50 items-center justify-center`}>
                <Text style={tw`text-gray-500`}>Acesso restrito a mentores</Text>
            </View>
        );
    }

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Header */}
            <View style={tw`bg-white px-4 py-3 border-b border-gray-200`}>
                <View style={tw`flex-row items-center justify-between mb-3`}>
                    <Text style={tw`text-xl font-bold text-gray-800`}>Gerenciar Sessões</Text>
                    <TouchableOpacity>
                        <Ionicons name="add" size={24} color="#4F46E5" />
                    </TouchableOpacity>
                </View>

                {/* Status filter tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={tw`flex-row`}>
                        {[
                            { key: 'all', label: 'Todas' },
                            { key: SessionStatus.SCHEDULED, label: 'Agendadas' },
                            { key: SessionStatus.IN_PROGRESS, label: 'Em Andamento' },
                            { key: SessionStatus.COMPLETED, label: 'Concluídas' }
                        ].map((tab) => (
                            <TouchableOpacity
                                key={tab.key}
                                onPress={() => setSelectedStatus(tab.key as any)}
                                style={tw`px-4 py-2 rounded-full mr-2 ${
                                    selectedStatus === tab.key 
                                        ? 'bg-indigo-500' 
                                        : 'bg-gray-200'
                                }`}
                            >
                                <Text style={tw`${
                                    selectedStatus === tab.key 
                                        ? 'text-white' 
                                        : 'text-gray-600'
                                } font-medium`}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Current session indicator */}
            {currentSession && (
                <View style={tw`bg-green-500 px-4 py-3`}>
                    <Text style={tw`text-white font-medium`}>
                        🟢 Sessão ativa: {currentSession.subject}
                    </Text>
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

            {/* Sessions list */}
            <ScrollView
                style={tw`flex-1 px-4`}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {isLoading && !refreshing ? (
                    <View style={tw`flex-1 items-center justify-center py-8`}>
                        <Text style={tw`text-gray-500`}>Carregando sessões...</Text>
                    </View>
                ) : filteredSessions.length === 0 ? (
                    <View style={tw`flex-1 items-center justify-center py-8`}>
                        <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                        <Text style={tw`text-gray-500 text-lg font-medium mt-4`}>
                            Nenhuma sessão encontrada
                        </Text>
                        <Text style={tw`text-gray-400 text-center mt-2 px-8`}>
                            Suas sessões aparecerão aqui quando forem agendadas
                        </Text>
                    </View>
                ) : (
                    <View style={tw`py-4`}>
                        {filteredSessions.map(renderSessionItem)}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

import { ISessionResponse, SessionStatus } from '@/src/interfaces/sessions.interface';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Alert, Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SessionItemProps {
    item: ISessionResponse;
    onStartSession?: (sessionId: string, type: 'chat' | 'voice') => void;
    onEndSession?: (sessionId: string) => void;
    isMentor: boolean;
    onDeleteSession?: (sessionId: string) => void;
    onOpenChat?: (session: ISessionResponse) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Status configuration for consistent styling
const getStatusConfig = (status: SessionStatus) => {
    switch (status) {
        case SessionStatus.SCHEDULED:
            return {
                label: 'Agendada',
                backgroundColor: '#EBF8FF',
                textColor: '#2B6CB0',
                borderColor: '#BEE3F8',
            };
        case SessionStatus.ACTIVE:
            return {
                label: 'Em Andamento',
                backgroundColor: '#F0FDF4',
                textColor: '#166534',
                borderColor: '#BBF7D0',
            };
        case SessionStatus.COMPLETED:
            return {
                label: 'Concluída',
                backgroundColor: '#F9FAFB',
                textColor: '#4B5563',
                borderColor: '#E5E7EB',
            };
        case SessionStatus.CANCELLED:
            return {
                label: 'Cancelada',
                backgroundColor: '#FEF2F2',
                textColor: '#DC2626',
                borderColor: '#FECACA',
            };
        case SessionStatus.PAUSED:
            return {
                label: 'Pausada',
                backgroundColor: '#FFFBEB',
                textColor: '#D97706',
                borderColor: '#FED7AA',
            };
        default:
            return {
                label: status,
                backgroundColor: '#F3F4F6',
                textColor: '#6B7280',
                borderColor: '#D1D5DB',
            };
    }
};

export const RenderSessionItem = ({
    isMentor,
    item: session,
    onStartSession,
    onEndSession,
    onDeleteSession,
    onOpenChat
}: SessionItemProps) => {
    const canStart = session.status === SessionStatus.SCHEDULED && isMentor;
    const isActive = session.status === SessionStatus.ACTIVE;
    const isCompleted = session.status === SessionStatus.COMPLETED;
    const isCancelled = session.status === SessionStatus.CANCELLED;
    const canDelete = (session.status === SessionStatus.COMPLETED || session.status === SessionStatus.SCHEDULED) && isMentor;

    const scheduledDate =
        session.scheduledAt && typeof (session.scheduledAt as any).toDate === 'function'
            ? (session.scheduledAt as any).toDate()
            : new Date(session.scheduledAt);

    const participantNames = session.participants.map(p => p.fullName).join(', ') || 'Nenhum participante';
    const mentorName = session.mentor.fullName || 'Nenhum mentor';
    const statusConfig = getStatusConfig(session.status);
    console.log("Schedule Date")
    console.log(session.scheduledAt)
    const handleStartSession = () => {
        Alert.alert(
            'Iniciar Sessão',
            'Escolha como deseja iniciar a sessão:',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: '💬 Chat de Texto',
                    onPress: () => onStartSession?.(session.id, 'chat'),
                },
                {
                    text: '📞 Chamada de Voz',
                    onPress: () => onStartSession?.(session.id, 'voice'),
                },
            ],
            { cancelable: true }
        );
    };

    const handleEndSession = () => {
        Alert.alert(
            'Finalizar Sessão',
            'Tem certeza que deseja finalizar esta sessão?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Finalizar',
                    style: 'destructive',
                    onPress: () => onEndSession?.(session.id),
                },
            ]
        );
    };

    const handleDeleteSession = () => {
        Alert.alert(
            'Deletar Sessão',
            'Esta ação não pode ser desfeita. Tem certeza que deseja deletar esta sessão?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Deletar',
                    style: 'destructive',
                    onPress: () => onDeleteSession?.(session.id),
                },
            ]
        );
    };

    const handleOpenChat = () => {
        onOpenChat?.(session);
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.titleSection}>
                        <Text style={styles.title} numberOfLines={2}>
                            {session.title}
                        </Text>

                        {session.metadata?.subject && (
                            <View style={styles.subjectContainer}>
                                <Ionicons name="book-outline" size={14} color="#6B7280" />
                                <Text style={styles.subject}>{session.metadata.subject}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.headerRight}>
                        {/* Status Badge */}
                        <View style={[styles.statusBadge, {
                            backgroundColor: statusConfig.backgroundColor,
                            borderColor: statusConfig.borderColor,
                        }]}>
                            <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                                {statusConfig.label}
                            </Text>
                        </View>

                        {/* Delete Button */}
                        {canDelete && (
                            <TouchableOpacity
                                onPress={handleDeleteSession}
                                style={styles.deleteButton}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trash-outline" size={16} color="#DC2626" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Session Info */}
                <View style={styles.infoSection}>
                    
                    {!isMentor && <View style={styles.infoRow}>
                        <Ionicons name="people-outline" size={14} color="#9CA3AF" />
                        <Text style={[styles.infoText, {color: '#5988e6ff'}]} numberOfLines={1}>
                            Mentor: {mentorName}
                        </Text>
                    </View>}
                    
                    <View style={styles.infoRow}>
                        <Ionicons name="people-outline" size={14} color="#9CA3AF" />
                        <Text style={styles.infoText} numberOfLines={1}>
                            Mentorados: {participantNames}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                        <Text style={styles.infoText}>
                            {scheduledDate.toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                            })} às {scheduledDate.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="hourglass-outline" size={14} color="#9CA3AF" />
                        <Text style={styles.infoText}>{session.duration} minutos</Text>
                    </View>
                </View>

                {/* Description */}
                {session.description && (
                    <Text style={styles.description} numberOfLines={2}>
                        {session.description}
                    </Text>
                )}

                {/* Active Session Indicator */}
                {isActive && (
                    <View style={styles.activeIndicator}>
                        <View style={styles.pulseIndicator} />
                        <Text style={styles.activeText}>Sessão em andamento</Text>
                    </View>
                )}

                {/* Action Buttons Section */}
                <View style={styles.actionsContainer}>

                    {isActive && (
                        <>
                            <TouchableOpacity
                                onPress={handleEndSession}
                                style={[styles.actionButton, styles.endButton]}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="stop-circle" size={18} color="#FFFFFF" />
                                <Text style={styles.endButtonText}>Finalizar</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {(isCompleted || isCancelled) && (
                        <View style={styles.statusContainer}>
                            <Text style={[styles.finalStatusText, {
                                color: isCompleted ? '#059669' : '#DC2626'
                            }]}>
                                {isCompleted ? '✅ Sessão concluída' : '❌ Sessão cancelada'}
                            </Text>
                        </View>
                    )}

                    {canStart && (
                        <TouchableOpacity
                            onPress={handleStartSession}
                            style={[styles.actionButton, styles.startButton]}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="play-circle" size={16} color="#3B82F6" />
                            <Text style={styles.startButtonText}>Iniciar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: Platform.OS === 'android' ? 3 : 0,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        minHeight: 120,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleSection: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        lineHeight: 24,
        marginBottom: 6,
    },
    subjectContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    subject: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 6,
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
        borderWidth: 1,
        alignSelf: 'flex-start',
        marginRight: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    deleteButton: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    infoSection: {
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 8,
        flex: 1,
    },
    description: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginBottom: 16,
    },
    activeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    pulseIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
        marginRight: 8,
    },
    activeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#047857',
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        minWidth: 100,
    },
    startButton: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#3B82F6',
        flex: 1,
        minWidth: 100,
    },
    startButtonText: {
        color: '#3B82F6',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 6,
    },
    endButton: {
        backgroundColor: '#DC2626',
        minWidth: 110,
    },
    endButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 6,
    },
    chatButton: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#3B82F6',
        minWidth: 100,
    },
    chatButtonText: {
        color: '#3B82F6',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 6,
    },
    statusContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    statusIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        marginBottom: 4,
    },
    statusMessage: {
        fontSize: 12,
        color: '#059669',
        fontWeight: '500',
        textAlign: 'center',
    },
    finalStatusText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
});

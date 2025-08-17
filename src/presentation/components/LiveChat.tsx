import React, { useState, useRef, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    FlatList, 
    Alert, 
    ScrollView, 
    Animated, 
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ChatMessage } from '@/src/types/support.types';
import { useAuth } from '@/src/context/AuthContext';
import { formatSupportDate } from '@/src/utils/support.utils';
import { useSupport } from '@/src/hooks/useSupport';

interface LiveChatProps {
    isAdmin?: boolean;
}

interface LiveChatState {
    loading: boolean;
    error: string | null;
    connectionStatus: 'connected' | 'connecting' | 'disconnected';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

export function LiveChat({ isAdmin = false }: LiveChatProps) {
    const { user } = useAuth();
    const { chatMessages, sendChatMessage } = useSupport();
    const [newMessage, setNewMessage] = useState('');
    const [isOnline, setIsOnline] = useState(isAdmin);
    const [showQuickResponses, setShowQuickResponses] = useState(false);
    const [activeUsers, setActiveUsers] = useState(isAdmin ? 3 : 0);
    const [state, setState] = useState<LiveChatState>({
        loading: false,
        error: null,
        connectionStatus: 'connected'
    });
    
    const flatListRef = useRef<FlatList>(null);
    const quickResponsesHeight = useRef(new Animated.Value(0)).current;

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatMessages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [chatMessages]);

    // Simulate connection status
    useEffect(() => {
        setState(prev => ({ ...prev, connectionStatus: 'connecting' }));
        const timer = setTimeout(() => {
            setState(prev => ({ ...prev, connectionStatus: 'connected' }));
            if (!isAdmin) {
                setIsOnline(true);
            }
        }, 1000);
        
        return () => clearTimeout(timer);
    }, [isAdmin]);

    // Animate quick responses
    useEffect(() => {
        Animated.timing(quickResponsesHeight, {
            toValue: showQuickResponses ? 80 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [showQuickResponses]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || state.loading) return;

        if (!isAdmin && !isOnline) {
            Alert.alert(
                'Suporte Offline',
                'O suporte não está disponível no momento. Tente novamente mais tarde ou crie um ticket.'
            );
            return;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            await sendChatMessage(newMessage);
            setNewMessage('');
        } catch (error) {
            setState(prev => ({ 
                ...prev, 
                error: 'Erro ao enviar mensagem. Tente novamente.' 
            }));
        } finally {
            setState(prev => ({ ...prev, loading: false }));
        }
    };

    const MessageItem = ({ message }: { message: ChatMessage }) => {
        const isCurrentUser = isAdmin ? message.sender === 'admin' : message.sender === 'user';

        return (
            <View style={[
                styles.messageContainer,
                isCurrentUser ? styles.messageRight : styles.messageLeft
            ]}>
                <View style={[
                    styles.messageBubble,
                    isCurrentUser ? styles.messageBubbleUser : styles.messageBubbleOther
                ]}>
                    <Text style={[
                        styles.messageText,
                        isCurrentUser ? styles.messageTextUser : styles.messageTextOther
                    ]}>
                        {message.message}
                    </Text>
                </View>
                <Text style={styles.messageTimestamp}>
                    {message.senderName} • {formatSupportDate(message.timestamp)}
                </Text>
            </View>
        );
    };

    const AdminHeader = () => (
        <View style={styles.adminHeader}>
            <View style={styles.headerRow}>
                <Text style={styles.adminHeaderTitle}>Chat ao Vivo - Admin</Text>
                <View style={styles.statusContainer}>
                    {state.connectionStatus === 'connecting' ? (
                        <ActivityIndicator size="small" color="#10B981" />
                    ) : (
                        <View style={styles.statusIndicator} />
                    )}
                    <Text style={styles.statusText}>
                        {state.connectionStatus === 'connected' ? 'Online' : 'Conectando...'}
                    </Text>
                </View>
            </View>
            <Text style={styles.adminHeaderSubtitle}>
                {activeUsers} usuários ativos aguardando suporte
            </Text>
        </View>
    );

    const UserHeader = () => (
        <View style={styles.userHeader}>
            <View style={styles.headerRow}>
                <Text style={styles.userHeaderTitle}>Chat ao Vivo</Text>
                <View style={styles.statusContainer}>
                    {state.connectionStatus === 'connecting' ? (
                        <ActivityIndicator size="small" color={isOnline ? '#10B981' : '#EF4444'} />
                    ) : (
                        <View style={[
                            styles.statusIndicator,
                            { backgroundColor: isOnline ? '#10B981' : '#EF4444' }
                        ]} />
                    )}
                    <Text style={[
                        styles.statusText,
                        { color: isOnline ? '#047857' : '#DC2626' }
                    ]}>
                        {state.connectionStatus === 'connecting' 
                            ? 'Conectando...' 
                            : isOnline ? 'Suporte Online' : 'Suporte Offline'
                        }
                    </Text>
                </View>
            </View>
            {!isOnline && state.connectionStatus === 'connected' && (
                <Text style={styles.userHeaderWarning}>
                    Suporte indisponível. Considere criar um ticket.
                </Text>
            )}
        </View>
    );

    const EmptyState = () => (
        <View style={styles.emptyState}>
            <Feather name="message-circle" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>
                {isAdmin ? 'Aguardando mensagens dos usuários' : 'Inicie uma conversa'}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
                {isAdmin
                    ? 'As mensagens dos usuários aparecerão aqui'
                    : 'Digite uma mensagem para começar o chat'
                }
            </Text>
        </View>
    );

    const QuickResponses = () => {
        const quickResponses = [
            'Olá! Como posso ajudá-lo?',
            'Vou verificar isso para você.',
            'Obrigado por aguardar.',
            'Problema resolvido?',
            'Precisa de mais alguma coisa?'
        ];

        return (
            <Animated.View style={[styles.quickResponsesContainer, { height: quickResponsesHeight }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickResponsesScroll}>
                    {quickResponses.map((response, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => setNewMessage(response)}
                            style={styles.quickResponseButton}
                        >
                            <Text style={styles.quickResponseText}>{response}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animated.View>
        );
    };

    const ErrorBanner = () => {
        if (!state.error) return null;

        return (
            <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{state.error}</Text>
                <TouchableOpacity onPress={() => setState(prev => ({ ...prev, error: null }))}>
                    <Feather name="x" size={16} color="#DC2626" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header */}
            {isAdmin ? <AdminHeader /> : <UserHeader />}
            
            {/* Error Banner */}
            <ErrorBanner />

            {/* Messages */}
            <View style={styles.messagesContainer}>
                {chatMessages.length === 0 ? (
                    <EmptyState />
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={chatMessages}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.messagesList}
                        renderItem={({ item }) => <MessageItem message={item} />}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            {/* Quick Responses for Admin */}
            {isAdmin && (
                <View style={styles.quickResponsesSection}>
                    <TouchableOpacity
                        onPress={() => setShowQuickResponses(!showQuickResponses)}
                        style={styles.quickResponsesHeader}
                    >
                        <Text style={styles.quickResponsesHeaderText}>Respostas Rápidas</Text>
                        <Feather
                            name={showQuickResponses ? "chevron-up" : "chevron-down"}
                            size={16}
                            color="#6B7280"
                        />
                    </TouchableOpacity>
                    {showQuickResponses && <QuickResponses />}
                </View>
            )}

            {/* Message Input */}
            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        placeholder={
                            isAdmin
                                ? "Digite sua resposta..."
                                : state.connectionStatus === 'connecting'
                                    ? "Conectando..."
                                    : isOnline
                                        ? "Digite sua mensagem..."
                                        : "Suporte offline..."
                        }
                        style={styles.textInput}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        editable={isAdmin || (isOnline && state.connectionStatus === 'connected')}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
                <TouchableOpacity
                    onPress={handleSendMessage}
                    style={[
                        styles.sendButton,
                        (!newMessage.trim() || state.loading || (!isAdmin && !isOnline)) && styles.sendButtonDisabled
                    ]}
                    disabled={!newMessage.trim() || state.loading || (!isAdmin && !isOnline)}
                >
                    {state.loading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Feather name="send" size={20} color="white" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    
    // Header Styles
    adminHeader: {
        backgroundColor: '#EBF8FF',
        paddingHorizontal: isTablet ? 24 : 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#BFDBFE',
    },
    userHeader: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: isTablet ? 24 : 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    adminHeaderTitle: {
        fontSize: isTablet ? 20 : 18,
        fontWeight: '700',
        color: '#1E40AF',
    },
    userHeaderTitle: {
        fontSize: isTablet ? 20 : 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
        marginRight: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#047857',
    },
    adminHeaderSubtitle: {
        fontSize: 14,
        color: '#2563EB',
    },
    userHeaderWarning: {
        fontSize: 14,
        color: '#DC2626',
        marginTop: 4,
    },

    // Error Banner
    errorBanner: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#FECACA',
    },
    errorText: {
        flex: 1,
        marginLeft: 8,
        marginRight: 12,
        fontSize: 14,
        color: '#DC2626',
    },

    // Messages
    messagesContainer: {
        flex: 1,
    },
    messagesList: {
        padding: isTablet ? 24 : 16,
        paddingBottom: 20,
    },
    messageContainer: {
        marginBottom: 16,
    },
    messageLeft: {
        alignItems: 'flex-start',
    },
    messageRight: {
        alignItems: 'flex-end',
    },
    messageBubble: {
        maxWidth: isTablet ? '70%' : '85%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    messageBubbleUser: {
        backgroundColor: '#3B82F6',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 4,
    },
    messageBubbleOther: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 18,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    messageTextUser: {
        color: '#FFFFFF',
    },
    messageTextOther: {
        color: '#1F2937',
    },
    messageTimestamp: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },

    // Empty State
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyStateTitle: {
        fontSize: 18,
        color: '#6B7280',
        marginTop: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 8,
        textAlign: 'center',
    },

    // Quick Responses
    quickResponsesSection: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    quickResponsesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    quickResponsesHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    quickResponsesContainer: {
        overflow: 'hidden',
    },
    quickResponsesScroll: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    quickResponseButton: {
        backgroundColor: '#EBF8FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    quickResponseText: {
        color: '#1E40AF',
        fontSize: 14,
        fontWeight: '500',
    },

    // Input
    inputContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 12,
        maxHeight: 100,
    },
    textInput: {
        fontSize: 16,
        color: '#1F2937',
        textAlignVertical: 'center',
        minHeight: 20,
    },
    sendButton: {
        backgroundColor: '#3B82F6',
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#D1D5DB',
    },
});

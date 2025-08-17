import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  RefreshControl
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ITicketDetails, IUpdateTicketRequest, IUpdateTicketStatusRequest, TicketStatus, TicketPriority } from '@/src/interfaces/support.interface';
import { getStatusColor, getStatusText, getPriorityColor } from '@/src/utils/support.utils';
import { formatMessageTime } from '@/src/utils/dateFormatter';
import { useSupport } from '@/src/context/SupportContext';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

interface TicketDetailModalProps {
    visible: boolean;
    ticket: ITicketDetails | null;
    onClose: () => void;
    currentUser: any;
    isAdmin?: boolean;
}

interface StatusBadgeProps {
  status: TicketStatus;
}

interface PriorityBadgeProps {
  priority: TicketPriority;
}

interface MessageItemProps {
  message: any;
  index: number;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const colors = getStatusColor(status);
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg === 'bg-red-200' ? '#FEE2E2' : 
                                   colors.bg === 'bg-yellow-200' ? '#FEF3C7' :
                                   colors.bg === 'bg-green-200' ? '#D1FAE5' : '#F3F4F6' }]}>
      <Text style={[styles.badgeText, { color: colors.text === 'text-red-800' ? '#991B1B' :
                                        colors.text === 'text-yellow-800' ? '#92400E' :
                                        colors.text === 'text-green-800' ? '#065F46' : '#374151' }]}>
        {getStatusText(status)}
      </Text>
    </View>
  );
};

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const getPriorityText = (p: TicketPriority) => {
    const texts = {
      [TicketPriority.LOW]: 'Baixa',
      [TicketPriority.MEDIUM]: 'Média', 
      [TicketPriority.HIGH]: 'Alta',
      [TicketPriority.URGENT]: 'Urgente'
    };
    return texts[p] || p;
  };

  const getPriorityColor = (p: TicketPriority) => {
    const colors = {
      [TicketPriority.LOW]: { bg: '#DBEAFE', text: '#1E40AF' },
      [TicketPriority.MEDIUM]: { bg: '#FEF3C7', text: '#92400E' },
      [TicketPriority.HIGH]: { bg: '#FED7AA', text: '#C2410C' },
      [TicketPriority.URGENT]: { bg: '#FEE2E2', text: '#991B1B' }
    };
    return colors[p] || { bg: '#F3F4F6', text: '#374151' };
  };

  const colors = getPriorityColor(priority);
  
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>
        {getPriorityText(priority)}
      </Text>
    </View>
  );
};

const MessageItem: React.FC<MessageItemProps> = ({ message, index }) => (
  <View key={message.id || index} style={styles.messageItem}>
    <View style={styles.messageHeader}>
      <View style={styles.senderInfo}>
        <Text style={styles.senderName}>
          {message.senderName || 'Usuário'}
        </Text>
        {message.senderType && (
          <View style={[
            styles.senderTypeBadge,
            { backgroundColor: message.senderType === 'admin' ? '#FEE2E2' : '#DBEAFE' }
          ]}>
            <Text style={[
              styles.senderTypeText,
              { color: message.senderType === 'admin' ? '#991B1B' : '#1E40AF' }
            ]}>
              {message.senderType === 'admin' ? 'Admin' : 'Usuário'}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.messageTime}>
        {formatMessageTime(message.timestamp.toString())}
      </Text>
    </View>
    <Text style={styles.messageText}>{message.message}</Text>
  </View>
);

export function TicketDetailModal({ 
    visible, 
    ticket, 
    onClose, 
    currentUser,
    isAdmin = false 
}: TicketDetailModalProps) {
    const { tickets } = useSupport();
    const [newMessage, setNewMessage] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<TicketStatus>(TicketStatus.OPEN);
    const [selectedPriority, setSelectedPriority] = useState<TicketPriority>(TicketPriority.MEDIUM);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [messageLoading, setMessageLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [priorityLoading, setPriorityLoading] = useState(false);

    useEffect(() => {
        if (ticket) {
            setSelectedStatus(ticket.status);
            setSelectedPriority(ticket.priority);
        }
    }, [ticket]);

    const onRefresh = async () => {
        setIsRefreshing(true);
        // Simulate refresh - replace with actual refresh logic
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    if (!ticket) return null;

    const handleSendMessage = async () => {
        if (!newMessage.trim() || messageLoading) return;

        setMessageLoading(true);
        try {
            await tickets.addTicketMessage(ticket.id, {
                message: newMessage
            });
            setNewMessage('');
            Alert.alert('Sucesso', 'Mensagem enviada com sucesso');
        } catch (error) {
            Alert.alert('Erro', 'Falha ao enviar mensagem');
        } finally {
            setMessageLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!isAdmin || statusLoading) return;
        
        setStatusLoading(true);
        try {
            const statusData: IUpdateTicketStatusRequest = {
                status: selectedStatus,
                note: `Status alterado para ${selectedStatus}`
            };
            
            await tickets.updateTicketStatus(ticket.id, statusData);
            Alert.alert('Sucesso', 'Status atualizado com sucesso');
        } catch (error) {
            Alert.alert('Erro', 'Falha ao atualizar status');
        } finally {
            setStatusLoading(false);
        }
    };

    const handleUpdatePriority = async () => {
        if (priorityLoading) return;

        setPriorityLoading(true);
        try {
            const updateData: IUpdateTicketRequest = {
                priority: selectedPriority
            };
            
            await tickets.updateTicket(ticket.id, updateData);
            Alert.alert('Sucesso', 'Prioridade atualizada com sucesso');
        } catch (error) {
            Alert.alert('Erro', 'Falha ao atualizar prioridade');
        } finally {
            setPriorityLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <KeyboardAvoidingView 
                style={styles.container} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle} numberOfLines={2}>
                            {ticket.title}
                        </Text>
                        <TouchableOpacity 
                            onPress={onClose} 
                            style={styles.closeButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Feather name="x" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView 
                    style={styles.scrollView}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {/* Ticket Info */}
                    <View style={styles.ticketInfoContainer}>
                        <Text style={styles.sectionLabel}>Descrição</Text>
                        <Text style={styles.description}>{ticket.description}</Text>
                        
                        <View style={styles.badgesContainer}>
                            <StatusBadge status={ticket.status} />
                            <PriorityBadge priority={ticket.priority} />
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryBadgeText}>{ticket.category}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.datesContainer}>
                            <Text style={styles.dateText}>
                                Criado: {formatMessageTime(ticket.createdAt.toString())}
                            </Text>
                            <Text style={styles.dateText}>
                                Atualizado: {formatMessageTime(ticket.updatedAt.toString())}
                            </Text>
                        </View>
                        
                        <Text style={styles.userInfo}>
                            Usuário: {ticket.user?.fullName || 'Usuário desconhecido'}
                        </Text>
                    </View>

                    {/* Admin Controls */}
                    {isAdmin && (
                        <View style={styles.adminControlsContainer}>
                            <Text style={styles.adminControlsTitle}>Controles de Admin</Text>
                            
                            {/* Status Control */}
                            <View style={styles.controlSection}>
                                <Text style={styles.controlLabel}>Status</Text>
                                <ScrollView 
                                    horizontal 
                                    showsHorizontalScrollIndicator={false} 
                                    style={styles.horizontalScroll}
                                >
                                    {Object.values(TicketStatus).map((status) => (
                                        <TouchableOpacity
                                            key={status}
                                            onPress={() => setSelectedStatus(status)}
                                            style={[
                                                styles.optionButton,
                                                selectedStatus === status && styles.optionButtonSelected
                                            ]}
                                        >
                                            <Text style={[
                                                styles.optionButtonText,
                                                selectedStatus === status && styles.optionButtonTextSelected
                                            ]}>
                                                {getStatusText(status)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                
                                <TouchableOpacity
                                    onPress={handleUpdateStatus}
                                    style={[styles.updateButton, styles.statusButton]}
                                    disabled={statusLoading}
                                >
                                    {statusLoading ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <Text style={styles.updateButtonText}>Atualizar Status</Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Priority Control */}
                            <View style={styles.controlSection}>
                                <Text style={styles.controlLabel}>Prioridade</Text>
                                <ScrollView 
                                    horizontal 
                                    showsHorizontalScrollIndicator={false} 
                                    style={styles.horizontalScroll}
                                >
                                    {Object.values(TicketPriority).map((priority) => (
                                        <TouchableOpacity
                                            key={priority}
                                            onPress={() => setSelectedPriority(priority)}
                                            style={[
                                                styles.optionButton,
                                                selectedPriority === priority && [styles.optionButtonSelected, styles.prioritySelected]
                                            ]}
                                        >
                                            <Text style={[
                                                styles.optionButtonText,
                                                selectedPriority === priority && [styles.optionButtonTextSelected, styles.prioritySelectedText]
                                            ]}>
                                                {priority === 'low' ? 'Baixa' : 
                                                 priority === 'medium' ? 'Média' : 
                                                 priority === 'high' ? 'Alta' : 'Urgente'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                
                                <TouchableOpacity
                                    onPress={handleUpdatePriority}
                                    style={[styles.updateButton, styles.priorityButton]}
                                    disabled={priorityLoading}
                                >
                                    {priorityLoading ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <Text style={styles.updateButtonText}>Atualizar Prioridade</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Messages */}
                    <View style={styles.messagesContainer}>
                        <Text style={styles.messagesTitle}>Mensagens</Text>
                        {ticket.messages && ticket.messages.length > 0 ? (
                            ticket.messages.map((message, index) => (
                                <MessageItem key={message.id || index} message={message} index={index} />
                            ))
                        ) : (
                            <View style={styles.noMessagesContainer}>
                                <Feather name="message-circle" size={48} color="#D1D5DB" />
                                <Text style={styles.noMessagesText}>Nenhuma mensagem ainda</Text>
                                <Text style={styles.noMessagesSubtext}>
                                    Seja o primeiro a enviar uma mensagem neste ticket
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* New Message Input - Fixed at bottom */}
                <View style={styles.newMessageContainer}>
                    <Text style={styles.newMessageLabel}>Nova Mensagem</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.messageInput}
                            value={newMessage}
                            onChangeText={setNewMessage}
                            placeholder="Digite sua mensagem..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            textAlignVertical="top"
                            maxLength={500}
                        />
                        <TouchableOpacity
                            onPress={handleSendMessage}
                            style={[
                                styles.sendButton,
                                !newMessage.trim() && styles.sendButtonDisabled
                            ]}
                            disabled={!newMessage.trim() || messageLoading}
                        >
                            {messageLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Feather name="send" size={20} color="#FFFFFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.characterCount}>
                        {newMessage.length}/500
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = {
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    headerContent: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: Platform.OS === 'ios' ? 54 : 16,
    },
    headerTitle: {
        fontSize: isTablet ? 22 : 18,
        fontWeight: '600' as const,
        color: '#111827',
        flex: 1,
        marginRight: 16,
    },
    closeButton: {
        padding: 8,
        borderRadius: 8,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    ticketInfoContainer: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
        fontWeight: '500' as const,
    },
    description: {
        fontSize: 16,
        color: '#374151',
        lineHeight: 24,
        marginBottom: 16,
    },
    badgesContainer: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        gap: 8,
        marginBottom: 16,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600' as const,
    },
    categoryBadge: {
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    categoryBadgeText: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: '#1E40AF',
    },
    datesContainer: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        marginBottom: 12,
    },
    dateText: {
        fontSize: 12,
        color: '#6B7280',
    },
    userInfo: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500' as const,
    },
    adminControlsContainer: {
        backgroundColor: '#FFFBEB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    adminControlsTitle: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: '#92400E',
        marginBottom: 16,
    },
    controlSection: {
        marginBottom: 16,
    },
    controlLabel: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 8,
        fontWeight: '500' as const,
    },
    horizontalScroll: {
        marginBottom: 12,
    },
    optionButton: {
        marginRight: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
    },
    optionButtonSelected: {
        backgroundColor: '#DBEAFE',
        borderColor: '#3B82F6',
    },
    prioritySelected: {
        backgroundColor: '#F3E8FF',
        borderColor: '#8B5CF6',
    },
    optionButtonText: {
        fontSize: 14,
        color: '#6B7280',
    },
    optionButtonTextSelected: {
        color: '#1E40AF',
        fontWeight: '600' as const,
    },
    prioritySelectedText: {
        color: '#6B46C1',
    },
    updateButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        minHeight: 44,
    },
    statusButton: {
        backgroundColor: '#3B82F6',
    },
    priorityButton: {
        backgroundColor: '#8B5CF6',
    },
    updateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600' as const,
    },
    messagesContainer: {
        marginBottom: 16,
    },
    messagesTitle: {
        fontSize: 18,
        fontWeight: '600' as const,
        color: '#111827',
        marginBottom: 16,
    },
    messageItem: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    messageHeader: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'flex-start' as const,
        marginBottom: 8,
    },
    senderInfo: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        flex: 1,
    },
    senderName: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: '#111827',
        marginRight: 8,
    },
    senderTypeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    senderTypeText: {
        fontSize: 10,
        fontWeight: '600' as const,
    },
    messageTime: {
        fontSize: 12,
        color: '#6B7280',
    },
    messageText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    noMessagesContainer: {
        alignItems: 'center' as const,
        paddingVertical: 32,
    },
    noMessagesText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500' as const,
        marginTop: 12,
    },
    noMessagesSubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center' as const,
        marginTop: 4,
    },
    newMessageContainer: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        ...Platform.select({
            ios: {
                paddingBottom: 34, // Safe area padding
            },
        }),
    },
    newMessageLabel: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: '#374151',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row' as const,
        alignItems: 'flex-end' as const,
        gap: 8,
    },
    messageInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
        backgroundColor: '#FFFFFF',
        maxHeight: 120,
        minHeight: 44,
    },
    sendButton: {
        backgroundColor: '#10B981',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        minWidth: 44,
        minHeight: 44,
    },
    sendButtonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    characterCount: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'right' as const,
        marginTop: 4,
    },
};

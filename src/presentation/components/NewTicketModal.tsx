import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    Modal, 
    Alert, 
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ICreateTicketRequest, TicketCategory, TicketPriority } from '@/src/interfaces/support.interface';
import { validateTicketData } from '@/src/utils/support.utils';

interface NewTicketModalProps {
    visible: boolean;
    onClose: () => void;
    onCreateTicket: (ticketData: ICreateTicketRequest) => Promise<void>;
    currentUser?: { id: string; fullName: string };
}

interface FormErrors {
    title?: string;
    description?: string;
}

interface TicketFormData {
    title: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

export function NewTicketModal({ visible, onClose, onCreateTicket, currentUser }: NewTicketModalProps) {
    const [ticketData, setTicketData] = useState<TicketFormData>({
        title: '',
        description: '',
        category: TicketCategory.OTHER,
        priority: TicketPriority.MEDIUM
    });
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const slideAnim = useRef(new Animated.Value(screenHeight)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const categories = [
        { value: TicketCategory.ACCOUNT, label: 'Conta', icon: 'user' as const },
        { value: TicketCategory.TECHNICAL, label: 'Técnico', icon: 'settings' as const },
        { value: TicketCategory.OTHER, label: 'Geral', icon: 'help-circle' as const },
        { value: TicketCategory.BUG_REPORT, label: 'Bug Report', icon: 'alert-triangle' as const }
    ];
    
    const priorities = [
        { value: TicketPriority.LOW, label: 'Baixa', color: '#10B981' },
        { value: TicketPriority.MEDIUM, label: 'Média', color: '#F59E0B' },
        { value: TicketPriority.HIGH, label: 'Alta', color: '#EF4444' },
        { value: TicketPriority.URGENT, label: 'Urgente', color: '#DC2626' }
    ];

    // Animation effects
    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: screenHeight,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    const validateForm = (): boolean => {
        const validation = validateTicketData(ticketData);
        
        if (!validation.isValid) {
            const newErrors: FormErrors = {};
            
            validation.errors.forEach(error => {
                if (error.includes('Título')) {
                    newErrors.title = error;
                } else if (error.includes('Descrição')) {
                    newErrors.description = error;
                }
            });
            
            setErrors(newErrors);
            return false;
        }
        
        setErrors({});
        return true;
    };

    const createTicket = async () => {
        if (!validateForm() || loading) return;

        setLoading(true);

        try {
            const newTicketData: ICreateTicketRequest = {
                title: ticketData.title.trim(),
                description: ticketData.description.trim(),
                category: ticketData.category,
                priority: ticketData.priority
            };

            await onCreateTicket(newTicketData);
            resetForm();
            onClose();
            
            // Success feedback
            setTimeout(() => {
                Alert.alert(
                    'Sucesso',
                    'Ticket criado com sucesso! Você será notificado sobre atualizações.',
                    [{ text: 'OK', style: 'default' }]
                );
            }, 300);
            
        } catch (error) {
            Alert.alert(
                'Erro',
                'Não foi possível criar o ticket. Tente novamente.',
                [{ text: 'OK', style: 'default' }]
            );
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTicketData({ 
            title: '', 
            description: '', 
            category: TicketCategory.OTHER, 
            priority: TicketPriority.MEDIUM 
        });
        setErrors({});
    };

    const handleClose = () => {
        if (loading) return;
        resetForm();
        onClose();
    };

    const updateTicketData = (field: keyof TicketFormData, value: any) => {
        setTicketData(prev => ({ ...prev, [field]: value }));
        
        // Clear error when user starts typing
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const isFormValid = ticketData.title.trim().length >= 5 && ticketData.description.trim().length >= 10;

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <TouchableOpacity 
                    style={styles.overlayTouch} 
                    onPress={handleClose}
                    disabled={loading}
                    activeOpacity={1}
                />
                
                <Animated.View 
                    style={[
                        styles.modalContainer,
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardAvoid}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.dragHandle} />
                            <View style={styles.headerContent}>
                                <View>
                                    <Text style={styles.title}>Novo Ticket</Text>
                                    <Text style={styles.subtitle}>
                                        Descreva seu problema para receber suporte
                                    </Text>
                                </View>
                                <TouchableOpacity 
                                    onPress={handleClose}
                                    style={styles.closeButton}
                                    disabled={loading}
                                >
                                    <Feather name="x" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView 
                            style={styles.scrollView}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Title Input */}
                            <View style={styles.inputSection}>
                                <Text style={styles.labelRequired}>Título</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        errors.title && styles.inputError
                                    ]}
                                    placeholder="Descreva brevemente o problema"
                                    value={ticketData.title}
                                    onChangeText={(text) => updateTicketData('title', text)}
                                    maxLength={100}
                                    editable={!loading}
                                    placeholderTextColor="#9CA3AF"
                                />
                                {errors.title && (
                                    <View style={styles.errorContainer}>
                                        <Feather name="alert-circle" size={14} color="#DC2626" />
                                        <Text style={styles.errorText}>{errors.title}</Text>
                                    </View>
                                )}
                                <Text style={styles.charCount}>
                                    {ticketData.title.length}/100
                                </Text>
                            </View>

                            {/* Category Selection */}
                            <View style={styles.inputSection}>
                                <Text style={styles.label}>Categoria</Text>
                                <ScrollView 
                                    horizontal 
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.categoriesContainer}
                                >
                                    {categories.map((category) => (
                                        <TouchableOpacity
                                            key={category.value}
                                            onPress={() => updateTicketData('category', category.value)}
                                            style={[
                                                styles.categoryButton,
                                                ticketData.category === category.value && styles.categoryButtonSelected
                                            ]}
                                            disabled={loading}
                                        >
                                            <Feather 
                                                name={category.icon} 
                                                size={18} 
                                                color={ticketData.category === category.value ? '#3B82F6' : '#6B7280'} 
                                            />
                                            <Text style={[
                                                styles.categoryButtonText,
                                                ticketData.category === category.value && styles.categoryButtonTextSelected
                                            ]}>
                                                {category.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Priority Selection */}
                            <View style={styles.inputSection}>
                                <Text style={styles.label}>Prioridade</Text>
                                <View style={styles.priorityGrid}>
                                    {priorities.map((priority) => (
                                        <TouchableOpacity
                                            key={priority.value}
                                            onPress={() => updateTicketData('priority', priority.value)}
                                            style={[
                                                styles.priorityButton,
                                                ticketData.priority === priority.value && styles.priorityButtonSelected
                                            ]}
                                            disabled={loading}
                                        >
                                            <View
                                                style={[
                                                    styles.priorityIndicator,
                                                    { backgroundColor: priority.color }
                                                ]}
                                            />
                                            <Text style={[
                                                styles.priorityButtonText,
                                                ticketData.priority === priority.value && styles.priorityButtonTextSelected
                                            ]}>
                                                {priority.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Description Input */}
                            <View style={styles.inputSection}>
                                <Text style={styles.labelRequired}>Descrição</Text>
                                <TextInput
                                    style={[
                                        styles.textArea,
                                        errors.description && styles.inputError
                                    ]}
                                    placeholder="Descreva detalhadamente o problema, incluindo passos para reproduzi-lo se aplicável..."
                                    value={ticketData.description}
                                    onChangeText={(text) => updateTicketData('description', text)}
                                    multiline
                                    textAlignVertical="top"
                                    maxLength={1000}
                                    editable={!loading}
                                    placeholderTextColor="#9CA3AF"
                                />
                                {errors.description && (
                                    <View style={styles.errorContainer}>
                                        <Feather name="alert-circle" size={14} color="#DC2626" />
                                        <Text style={styles.errorText}>{errors.description}</Text>
                                    </View>
                                )}
                                <Text style={styles.charCount}>
                                    {ticketData.description.length}/1000
                                </Text>
                            </View>

                            {/* Tips */}
                            <View style={styles.tipsContainer}>
                                <View style={styles.tipsHeader}>
                                    <Feather name="info" size={16} color="#F59E0B" />
                                    <Text style={styles.tipsTitle}>Dicas para um melhor suporte:</Text>
                                </View>
                                <Text style={styles.tipsText}>
                                    • Seja específico sobre o problema{'\n'}
                                    • Inclua passos para reproduzir o erro{'\n'}
                                    • Mencione quando o problema começou{'\n'}
                                    • Descreva o comportamento esperado
                                </Text>
                            </View>
                        </ScrollView>

                        {/* Submit Button */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                onPress={createTicket}
                                style={[
                                    styles.submitButton,
                                    (!isFormValid || loading) && styles.submitButtonDisabled
                                ]}
                                disabled={!isFormValid || loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <>
                                        <Feather name="send" size={18} color="white" />
                                        <Text style={styles.submitButtonText}>Criar Ticket</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    overlayTouch: {
        flex: 1,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: screenHeight * 0.95,
        minHeight: screenHeight * 0.7,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    keyboardAvoid: {
        flex: 1,
    },
    
    // Header
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#D1D5DB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: isTablet ? 24 : 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 16,
    },

    // Content
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    inputSection: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    labelRequired: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#FFFFFF',
    },
    textArea: {
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#FFFFFF',
        height: 120,
        textAlignVertical: 'top',
    },
    inputError: {
        borderColor: '#DC2626',
        backgroundColor: '#FEF2F2',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    errorText: {
        fontSize: 14,
        color: '#DC2626',
        marginLeft: 6,
    },
    charCount: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 4,
    },

    // Categories
    categoriesContainer: {
        flexDirection: 'row',
    },
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 12,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        minWidth: 100,
    },
    categoryButtonSelected: {
        borderColor: '#3B82F6',
        backgroundColor: '#EBF8FF',
    },
    categoryButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
        marginLeft: 8,
    },
    categoryButtonTextSelected: {
        color: '#3B82F6',
    },

    // Priority
    priorityGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    priorityButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        flex: 1,
        minWidth: isTablet ? 140 : 120,
    },
    priorityButtonSelected: {
        borderColor: '#1F2937',
        backgroundColor: '#F9FAFB',
    },
    priorityIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    priorityButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
        marginLeft: 8,
    },
    priorityButtonTextSelected: {
        color: '#1F2937',
    },

    // Tips
    tipsContainer: {
        backgroundColor: '#FFFBEB',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#FED7AA',
        marginBottom: 16,
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400E',
        marginLeft: 8,
    },
    tipsText: {
        fontSize: 14,
        color: '#92400E',
        lineHeight: 20,
    },

    // Footer
    footer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    submitButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: '#D1D5DB',
        shadowColor: 'transparent',
        elevation: 0,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 8,
    },
});

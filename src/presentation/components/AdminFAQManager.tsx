import { FAQCategory, IFAQ } from '@/src/interfaces/support.interface';
import { formatMessageTime } from '@/src/utils/dateFormatter';
import { Feather } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// ========================================
// INTERFACES & TYPES
// ========================================

interface AdminFAQManagerProps {
    faqs: IFAQ[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAddFAQ: (faq: Partial<IFAQ>) => void;
    onUpdateFAQ: (faqId: string, faq: Partial<IFAQ>) => void;
    onDeleteFAQ: (faqId: string) => void;
    onUpdateHelpful: (faqId: string, helpful: number) => void;
    loading?: boolean;
    error?: string | null;
}

interface FAQModalProps {
    visible: boolean;
    faq: IFAQ | null;
    onClose: () => void;
    onSave: (faq: Partial<IFAQ>) => void;
    isEditing: boolean;
    loading?: boolean;
}

interface FilterState {
    category: FAQCategory | 'all';
    sortBy: 'createdAt' | 'order' | 'helpfulCount' | 'question';
    sortOrder: 'asc' | 'desc';
    showActiveOnly: boolean;
}

// ========================================
// CONSTANTS & UTILITIES
// ========================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;

const CATEGORY_LABELS: Record<FAQCategory | 'all', string> = {
    all: 'Todas',
    [FAQCategory.GENERAL]: 'Geral',
    [FAQCategory.ACCOUNT]: 'Conta',
    [FAQCategory.TECHNICAL]: 'Técnico',
    [FAQCategory.SESSION]: 'Sessão',
    [FAQCategory.COMMUNICATION]: 'Comunicação'
};

const getCategoryConfig = (category: FAQCategory) => {
    switch (category) {
        case FAQCategory.GENERAL:
            return { color: '#3B82F6', backgroundColor: '#EBF8FF' };
        case FAQCategory.ACCOUNT:
            return { color: '#10B981', backgroundColor: '#ECFDF5' };
        case FAQCategory.TECHNICAL:
            return { color: '#F59E0B', backgroundColor: '#FFFBEB' };
        case FAQCategory.SESSION:
            return { color: '#8B5CF6', backgroundColor: '#F3E8FF' };
        case FAQCategory.COMMUNICATION:
            return { color: '#EF4444', backgroundColor: '#FEF2F2' };
        default:
            return { color: '#6B7280', backgroundColor: '#F9FAFB' };
    }
};

// ========================================
// MAIN COMPONENT
// ========================================

export function AdminFAQManager({
    faqs,
    searchQuery,
    onSearchChange,
    onAddFAQ,
    onUpdateFAQ,
    onDeleteFAQ,
    onUpdateHelpful,
    loading = false,
    error = null
}: AdminFAQManagerProps) {
    const [filters, setFilters] = useState<FilterState>({
        category: 'all',
        sortBy: 'order',
        sortOrder: 'asc',
        showActiveOnly: true
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingFAQ, setEditingFAQ] = useState<IFAQ | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Memoized filtered and sorted FAQs
    const filteredFAQs = useMemo(() => {
        let filtered = faqs.filter(faq => {
            const matchesCategory = filters.category === 'all' || faq.category === filters.category;
            const matchesSearch = searchQuery === '' ||
                faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesActive = !filters.showActiveOnly || faq.isActive;

            return matchesCategory && matchesSearch && matchesActive;
        });

        // Sort FAQs
        filtered.sort((a, b) => {
            let comparison = 0;

            switch (filters.sortBy) {
                case 'question':
                    comparison = a.question.localeCompare(b.question);
                    break;
                case 'createdAt':
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case 'order':
                    comparison = (a.order || 0) - (b.order || 0);
                    break;
                case 'helpfulCount':
                    comparison = a.helpfulCount - b.helpfulCount;
                    break;
                default:
                    comparison = 0;
            }

            return filters.sortOrder === 'desc' ? -comparison : comparison;
        });

        return filtered;
    }, [faqs, searchQuery, filters]);

    const handleDeleteFAQ = useCallback((faqId: string) => {
        Alert.alert(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir esta FAQ? Esta ação não pode ser desfeita.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: () => onDeleteFAQ(faqId)
                }
            ]
        );
    }, [onDeleteFAQ]);

    const handleCloseModal = useCallback(() => {
        setShowAddModal(false);
        setShowEditModal(false);
        setEditingFAQ(null);
    }, []);

    const handleSaveFAQ = useCallback((faqData: Partial<IFAQ>) => {
        if (editingFAQ) {
            onUpdateFAQ(editingFAQ.id, faqData);
        } else {
            onAddFAQ(faqData);
        }
        handleCloseModal();
    }, [editingFAQ, onUpdateFAQ, onAddFAQ, handleCloseModal]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <Feather name="search" size={20} color="#6B7280" />
                    <TextInput
                        placeholder="Buscar FAQs..."
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={onSearchChange}
                        placeholderTextColor="#9CA3AF"
                    />
                    {loading && (
                        <ActivityIndicator size="small" color="#3B82F6" style={styles.searchLoader} />
                    )}
                </View>

                <TouchableOpacity
                    onPress={() => setShowFilters(!showFilters)}
                    style={[styles.filterButton, showFilters && styles.filterButtonActive]}
                    accessibilityRole="button"
                    accessibilityLabel="Filtros"
                >
                    <Feather name="filter" size={20} color={showFilters ? "#3B82F6" : "#6B7280"} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setShowAddModal(true)}
                    style={styles.addButton}
                    accessibilityRole="button"
                    accessibilityLabel="Adicionar FAQ"
                >
                    <Feather name="plus" size={20} color="white" />
                </TouchableOpacity>
            </View>

            {/* Error Display */}
            {error && (
                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={16} color="#DC2626" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Filters */}
            {showFilters && (
                <View style={styles.filtersContainer}>
                    {/* Category Filter */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterLabel}>Categoria</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.categoryRow}>
                                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                    <TouchableOpacity
                                        key={key}
                                        onPress={() => setFilters(prev => ({ ...prev, category: key as any }))}
                                        style={[
                                            styles.categoryChip,
                                            filters.category === key && styles.categoryChipActive
                                        ]}
                                    >
                                        <Text style={[
                                            styles.categoryChipText,
                                            filters.category === key && styles.categoryChipTextActive
                                        ]}>
                                            {label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Sort and Active Filter */}
                    <View style={styles.filterRow}>
                        <View style={styles.sortContainer}>
                            <Text style={styles.filterLabel}>Ordenar por</Text>
                            <TouchableOpacity
                                style={styles.sortButton}
                                onPress={() => {
                                    // Cycle through sort options
                                    const sortOptions: FilterState['sortBy'][] = ['order', 'question', 'createdAt', 'helpfulCount'];
                                    const currentIndex = sortOptions.indexOf(filters.sortBy);
                                    const nextIndex = (currentIndex + 1) % sortOptions.length;
                                    setFilters(prev => ({ ...prev, sortBy: sortOptions[nextIndex] }));
                                }}
                            >
                                <Text style={styles.sortButtonText}>
                                    {filters.sortBy === 'order' ? 'Ordem' :
                                        filters.sortBy === 'question' ? 'Pergunta' :
                                            filters.sortBy === 'createdAt' ? 'Data' : 'Úteis'}
                                </Text>
                                <Feather
                                    name={filters.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                                    size={16}
                                    color="#6B7280"
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={() => setFilters(prev => ({ ...prev, showActiveOnly: !prev.showActiveOnly }))}
                            style={[styles.activeToggle, filters.showActiveOnly && styles.activeToggleActive]}
                        >
                            <Text style={[
                                styles.activeToggleText,
                                filters.showActiveOnly && styles.activeToggleTextActive
                            ]}>
                                Apenas Ativas
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{filteredFAQs.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{filteredFAQs.filter(f => f.isActive).length}</Text>
                    <Text style={styles.statLabel}>Ativas</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{filteredFAQs.reduce((acc, f) => acc + f.helpfulCount, 0)}</Text>
                    <Text style={styles.statLabel}>Úteis</Text>
                </View>
            </View>

            {/* FAQ List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Carregando FAQs...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredFAQs}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    renderItem={({ item }) => (
                        <AdminFAQItem
                            faq={item}
                            onEdit={(faq) => {
                                setEditingFAQ(faq);
                                setShowEditModal(true);
                            }}
                            onDelete={handleDeleteFAQ}
                        />
                    )}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyState}>
                            <Feather name="help-circle" size={48} color="#9CA3AF" />
                            <Text style={styles.emptyTitle}>
                                {searchQuery ? 'Nenhuma FAQ encontrada' : 'Nenhuma FAQ cadastrada'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {searchQuery
                                    ? 'Tente ajustar os filtros de busca'
                                    : 'Adicione a primeira FAQ para começar'
                                }
                            </Text>
                        </View>
                    )}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading}
                />
            )}

            {/* Add/Edit FAQ Modal */}
            <FAQModal
                visible={showAddModal || showEditModal}
                faq={editingFAQ}
                onClose={handleCloseModal}
                onSave={handleSaveFAQ}
                isEditing={!!editingFAQ}
                loading={loading}
            />
        </View>
    );
}

// ========================================
// FAQ ITEM COMPONENT
// ========================================

interface AdminFAQItemProps {
    faq: IFAQ;
    onEdit: (faq: IFAQ) => void;
    onDelete: (faqId: string) => void;
}

const AdminFAQItem = React.memo(({ faq, onEdit, onDelete }: AdminFAQItemProps) => {
    const categoryConfig = getCategoryConfig(faq.category);

    return (
        <View style={styles.faqItem}>
            <View style={styles.faqHeader}>
                <View style={styles.faqMetadata}>
                    <View style={[styles.categoryBadge, { backgroundColor: categoryConfig.backgroundColor }]}>
                        <Text style={[styles.categoryText, { color: categoryConfig.color }]}>
                            {CATEGORY_LABELS[faq.category]}
                        </Text>
                    </View>
                    {!faq.isActive && (
                        <View style={styles.inactiveBadge}>
                            <Text style={styles.inactiveText}>Inativa</Text>
                        </View>
                    )}
                </View>

                <View style={styles.faqActions}>
                    <TouchableOpacity
                        onPress={() => onEdit(faq)}
                        style={styles.editButton}
                        accessibilityRole="button"
                        accessibilityLabel="Editar FAQ"
                    >
                        <Feather name="edit-2" size={16} color="#4F46E5" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => onDelete(faq.id)}
                        style={styles.deleteButton}
                        accessibilityRole="button"
                        accessibilityLabel="Excluir FAQ"
                    >
                        <Feather name="trash-2" size={16} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.faqQuestion}>{faq.question}</Text>
            <Text style={styles.faqAnswer} numberOfLines={3}>
                {faq.answer}
            </Text>

            <View style={styles.faqFooter}>
                <View style={styles.faqStats}>
                    <View style={styles.statGroup}>
                        <Feather name="thumbs-up" size={12} color="#10B981" />
                        <Text style={styles.statText}>{faq.helpfulCount}</Text>
                    </View>
                    <View style={styles.statGroup}>
                        <Feather name="thumbs-down" size={12} color="#EF4444" />
                        <Text style={styles.statText}>{faq.notHelpfulCount}</Text>
                    </View>
                </View>

                <Text style={styles.faqDate}>
                    {formatMessageTime(faq.createdAt.toString())}
                </Text>
            </View>

            {faq.tags && faq.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                    {faq.tags.slice(0, 3).map((tag, index) => (
                        <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                    {faq.tags.length > 3 && (
                        <Text style={styles.moreTagsText}>+{faq.tags.length - 3}</Text>
                    )}
                </View>
            )}
        </View>
    );
});

// ========================================
// FAQ MODAL COMPONENT
// ========================================

function FAQModal({ visible, faq, onClose, onSave, isEditing, loading = false }: FAQModalProps) {
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        category: FAQCategory.GENERAL,
        tags: [] as string[],
        order: 0,
        isActive: true
    });
    const [tagInput, setTagInput] = useState('');

    React.useEffect(() => {
        if (faq && isEditing) {
            setFormData({
                question: faq.question,
                answer: faq.answer,
                category: faq.category,
                tags: faq.tags || [],
                order: faq.order || 0,
                isActive: faq.isActive !== undefined ? faq.isActive : true
            });
            setTagInput((faq.tags || []).join(', '));
        } else {
            setFormData({
                question: '',
                answer: '',
                category: FAQCategory.GENERAL,
                tags: [],
                order: 0,
                isActive: true
            });
            setTagInput('');
        }
    }, [faq, isEditing, visible]);

    const handleSave = () => {
        if (!formData.question.trim() || !formData.answer.trim()) {
            Alert.alert('Erro', 'Por favor, preencha a pergunta e resposta.');
            return;
        }

        const faqData: Partial<IFAQ> = {
            question: formData.question.trim(),
            answer: formData.answer.trim(),
            category: formData.category,
            tags: formData.tags,
            order: formData.order,
            isActive: formData.isActive
        };

        onSave(faqData);
    };

    const updateTags = (text: string) => {
        setTagInput(text);
        const tags = text.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .slice(0, 10); // Limit to 10 tags
        setFormData(prev => ({ ...prev, tags }));
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {isEditing ? 'Editar FAQ' : 'Nova FAQ'}
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.modalCloseButton}
                            accessibilityRole="button"
                            accessibilityLabel="Fechar"
                        >
                            <Feather name="x" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.modalContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Question */}
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Pergunta *</Text>
                            <TextInput
                                style={[styles.formInput, styles.multilineInput]}
                                placeholder="Digite a pergunta..."
                                placeholderTextColor="#9CA3AF"
                                value={formData.question}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, question: text }))}
                                multiline
                                maxLength={500}
                            />
                            <Text style={styles.characterCount}>
                                {formData.question.length}/500
                            </Text>
                        </View>

                        {/* Category */}
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Categoria</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.categoryRow}>
                                    {Object.values(FAQCategory).map((category) => {
                                        const config = getCategoryConfig(category);
                                        const isSelected = formData.category === category;

                                        return (
                                            <TouchableOpacity
                                                key={category}
                                                onPress={() => setFormData(prev => ({ ...prev, category }))}
                                                style={[
                                                    styles.categoryOption,
                                                    { borderColor: config.color },
                                                    isSelected && { backgroundColor: config.backgroundColor }
                                                ]}
                                            >
                                                <Text style={[
                                                    styles.categoryOptionText,
                                                    { color: isSelected ? config.color : '#6B7280' }
                                                ]}>
                                                    {CATEGORY_LABELS[category]}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        </View>

                        {/* Answer */}
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Resposta *</Text>
                            <TextInput
                                style={[styles.formInput, styles.answerInput]}
                                placeholder="Digite a resposta detalhada..."
                                placeholderTextColor="#9CA3AF"
                                value={formData.answer}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, answer: text }))}
                                multiline
                                textAlignVertical="top"
                                maxLength={2000}
                            />
                            <Text style={styles.characterCount}>
                                {formData.answer.length}/2000
                            </Text>
                        </View>

                        {/* Tags */}
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Tags (separadas por vírgula)</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="Ex: dúvida, tutorial, configuração..."
                                placeholderTextColor="#9CA3AF"
                                value={tagInput}
                                onChangeText={updateTags}
                                maxLength={200}
                            />
                            {formData.tags.length > 0 && (
                                <View style={styles.tagPreview}>
                                    {formData.tags.map((tag, index) => (
                                        <View key={index} style={styles.previewTag}>
                                            <Text style={styles.previewTagText}>{tag}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Settings Row */}
                        <View style={styles.settingsRow}>
                            <View style={styles.orderContainer}>
                                <Text style={styles.formLabel}>Ordem</Text>
                                <TextInput
                                    style={[styles.formInput, styles.orderInput]}
                                    placeholder="0"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.order.toString()}
                                    onChangeText={(text) => setFormData(prev => ({
                                        ...prev,
                                        order: parseInt(text) || 0
                                    }))}
                                    keyboardType="numeric"
                                    maxLength={3}
                                />
                            </View>

                            <View style={styles.statusContainer}>
                                <Text style={styles.formLabel}>Status</Text>
                                <TouchableOpacity
                                    onPress={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                    style={[
                                        styles.statusToggle,
                                        formData.isActive ? styles.statusToggleActive : styles.statusToggleInactive
                                    ]}
                                >
                                    <Text style={[
                                        styles.statusToggleText,
                                        formData.isActive ? styles.statusToggleTextActive : styles.statusToggleTextInactive
                                    ]}>
                                        {formData.isActive ? 'Ativo' : 'Inativo'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Modal Footer */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.cancelButton}
                            accessibilityRole="button"
                            accessibilityLabel="Cancelar"
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSave}
                            style={[
                                styles.saveButton,
                                (!formData.question.trim() || !formData.answer.trim() || loading) && styles.saveButtonDisabled
                            ]}
                            disabled={!formData.question.trim() || !formData.answer.trim() || loading}
                            accessibilityRole="button"
                            accessibilityLabel={isEditing ? 'Salvar alterações' : 'Criar FAQ'}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.saveButtonText}>
                                    {isEditing ? 'Salvar' : 'Criar'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC'
    },

    // Header styles
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: IS_TABLET ? 12 : 10,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#1F2937',
        ...(IS_TABLET && { fontSize: 18 }),
    },
    searchLoader: {
        marginLeft: 8,
    },
    filterButton: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
    },
    filterButtonActive: {
        backgroundColor: '#EBF8FF',
    },
    addButton: {
        backgroundColor: '#3B82F6',
        padding: 12,
        borderRadius: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },

    // Error styles
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#FECACA',
    },
    errorText: {
        color: '#DC2626',
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },

    // Filters styles
    filtersContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    filterSection: {
        marginBottom: 16,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    categoryRow: {
        flexDirection: 'row',
        paddingVertical: 4,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    categoryChipActive: {
        backgroundColor: '#EBF8FF',
        borderColor: '#3B82F6',
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    categoryChipTextActive: {
        color: '#3B82F6',
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sortContainer: {
        flex: 1,
        marginRight: 16,
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sortButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    activeToggle: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activeToggleActive: {
        backgroundColor: '#ECFDF5',
        borderColor: '#10B981',
    },
    activeToggleText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    activeToggleTextActive: {
        color: '#10B981',
    },

    // Stats styles
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        ...(IS_TABLET && { fontSize: 20 }),
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },

    // List styles
    listContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 12,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 8,
        textAlign: 'center',
        maxWidth: 280,
    },

    // FAQ Item styles
    faqItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 12,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    faqMetadata: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 8,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
    },
    inactiveBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#FEF2F2',
    },
    inactiveText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#DC2626',
    },
    faqActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editButton: {
        padding: 8,
        marginRight: 4,
    },
    deleteButton: {
        padding: 8,
    },
    faqQuestion: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
        lineHeight: 22,
    },
    faqAnswer: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 12,
    },
    faqFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    statText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
        fontWeight: '500',
    },
    faqDate: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    tagsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    tag: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
    },
    tagText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    moreTagsText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.9,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    modalCloseButton: {
        padding: 8,
    },
    modalContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    formGroup: {
        marginVertical: 16,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#FFFFFF',
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    answerInput: {
        minHeight: 120,
        textAlignVertical: 'top',
    },
    characterCount: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 4,
    },
    categoryOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
        backgroundColor: '#FFFFFF',
    },
    categoryOptionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    tagPreview: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    previewTag: {
        backgroundColor: '#EBF8FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    previewTagText: {
        fontSize: 12,
        color: '#1D4ED8',
        fontWeight: '500',
    },
    settingsRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    orderContainer: {
        flex: 1,
        marginRight: 16,
    },
    orderInput: {
        textAlign: 'center',
        minHeight: 48,
    },
    statusContainer: {
        flex: 1,
    },
    statusToggle: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        minHeight: 48,
    },
    statusToggleActive: {
        backgroundColor: '#ECFDF5',
        borderColor: '#10B981',
    },
    statusToggleInactive: {
        backgroundColor: '#F9FAFB',
        borderColor: '#D1D5DB',
    },
    statusToggleText: {
        fontSize: 14,
        fontWeight: '600',
    },
    statusToggleTextActive: {
        color: '#10B981',
    },
    statusToggleTextInactive: {
        color: '#6B7280',
    },

    // Modal Footer
    modalFooter: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
    },
    cancelButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    saveButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginLeft: 8,
        backgroundColor: '#3B82F6',
        ...Platform.select({
            ios: {
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    saveButtonDisabled: {
        backgroundColor: '#9CA3AF',
        ...Platform.select({
            ios: {
                shadowColor: 'transparent',
            },
            android: {
                elevation: 0,
            },
        }),
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

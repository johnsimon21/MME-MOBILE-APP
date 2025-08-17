import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Dimensions,
  Platform,
  RefreshControl,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SupportTab } from '@/src/types/support.types';
import { useSupport } from '@/src/context/SupportContext';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

interface HelpCenterProps {
    onTabChange: (tab: SupportTab) => void;
    isAdmin?: boolean;
}

interface ActionItemProps {
  title: string;
  desc: string;
  icon: string;
  action: () => void;
  bgColor?: string;
  textColor?: string;
  loading?: boolean;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
  loading?: boolean;
}

interface TopicItemProps {
  title: string;
  desc: string;
  icon: string;
  onPress: () => void;
}

interface FAQItemProps {
  question: string;
  answer: string;
  category: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const ActionItem: React.FC<ActionItemProps> = ({ 
  title, 
  desc, 
  icon, 
  action, 
  bgColor = '#DBEAFE', 
  textColor = '#1E40AF',
  loading = false 
}) => (
  <TouchableOpacity
    onPress={action}
    style={[styles.actionItem, { opacity: loading ? 0.6 : 1 }]}
    disabled={loading}
    activeOpacity={0.7}
  >
    <View style={[styles.actionIcon, { backgroundColor: bgColor }]}>
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Feather name={icon as any} size={24} color={textColor} />
      )}
    </View>
    <Text style={styles.actionTitle} numberOfLines={2}>
      {title}
    </Text>
    <Text style={styles.actionDesc} numberOfLines={2}>
      {desc}
    </Text>
  </TouchableOpacity>
);

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, loading = false }) => (
  <View style={styles.statCard}>
    <View style={styles.statHeader}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      )}
    </View>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const TopicItem: React.FC<TopicItemProps> = ({ title, desc, icon, onPress }) => (
  <TouchableOpacity
    style={styles.topicItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.topicIconContainer}>
      <Feather name={icon as any} size={20} color="#4F46E5" />
    </View>
    <View style={styles.topicContent}>
      <Text style={styles.topicTitle}>{title}</Text>
      <Text style={styles.topicDesc}>{desc}</Text>
    </View>
    <Feather name="chevron-right" size={20} color="#6B7280" />
  </TouchableOpacity>
);

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, category, isExpanded, onToggle }) => (
  <View style={styles.faqItem}>
    <TouchableOpacity
      style={styles.faqHeader}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.faqQuestionContainer}>
        <View style={styles.faqCategory}>
          <Text style={styles.faqCategoryText}>{category}</Text>
        </View>
        <Text style={styles.faqQuestion}>{question}</Text>
      </View>
      <Feather 
        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
        size={20} 
        color="#6B7280" 
      />
    </TouchableOpacity>
    {isExpanded && (
      <View style={styles.faqAnswerContainer}>
        <Text style={styles.faqAnswer}>{answer}</Text>
      </View>
    )}
  </View>
);

export function HelpCenter({ onTabChange, isAdmin = false }: HelpCenterProps) {
    const { admin } = useSupport();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFAQs, setExpandedFAQs] = useState<Set<number>>(new Set());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const onRefresh = async () => {
        setIsRefreshing(true);
        try {
            if (isAdmin) {
                await admin.loadStats('month');
            }
        } catch (error) {
            Alert.alert('Erro', 'Falha ao atualizar dados');
        } finally {
            setIsRefreshing(false);
        }
    };

    const toggleFAQ = (index: number) => {
        setExpandedFAQs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const adminActions = [
        { 
            title: 'Gerenciar Tickets', 
            desc: 'Visualizar e responder tickets', 
            icon: 'clipboard', 
            action: () => onTabChange('tickets'),
            bgColor: '#DBEAFE',
            textColor: '#1E40AF',
        },
        { 
            title: 'Chat ao Vivo', 
            desc: 'Atender usuários em tempo real', 
            icon: 'message-circle', 
            action: () => onTabChange('chat'),
            bgColor: '#D1FAE5',
            textColor: '#065F46',
        },
        { 
            title: 'Gerenciar FAQ', 
            desc: 'Adicionar e editar perguntas', 
            icon: 'help-circle', 
            action: () => onTabChange('faq'),
            bgColor: '#F3E8FF',
            textColor: '#6B46C1',
        }
    ];

    const userActions = [
        { 
            title: 'Criar Ticket', 
            desc: 'Relatar um problema', 
            icon: 'plus-circle', 
            action: () => onTabChange('tickets')
        },
        { 
            title: 'Chat ao Vivo', 
            desc: 'Falar com suporte', 
            icon: 'message-circle', 
            action: () => onTabChange('chat')
        },
        { 
            title: 'Perguntas Frequentes', 
            desc: 'Respostas rápidas', 
            icon: 'help-circle', 
            action: () => onTabChange('faq')
        }
    ];

    const adminStats = [
        { 
            label: 'Tickets Abertos', 
            value: admin.stats?.tickets?.open?.toString() || '0', 
            icon: 'alert-circle', 
            color: '#DC2626' 
        },
        { 
            label: 'Em Andamento', 
            value: admin.stats?.tickets?.inProgress?.toString() || '0', 
            icon: 'clock', 
            color: '#D97706' 
        },
        { 
            label: 'Resolvidos', 
            value: admin.stats?.tickets?.resolved?.toString() || '0', 
            icon: 'check-circle', 
            color: '#059669' 
        },
        { 
            label: 'FAQs Ativas', 
            value: admin.stats?.faqs?.active?.toString() || '0', 
            icon: 'help-circle', 
            color: '#2563EB' 
        }
    ];

    const popularTopics = [
        { 
            title: 'Problemas de Login', 
            desc: 'Recuperar acesso à conta', 
            icon: 'lock',
            onPress: () => onTabChange('faq')
        },
        { 
            title: 'Gerenciar Sessões', 
            desc: 'Agendar e modificar sessões', 
            icon: 'calendar',
            onPress: () => onTabChange('tickets')
        },
        { 
            title: 'Problemas de Conexão', 
            desc: 'Resolver problemas técnicos', 
            icon: 'wifi-off',
            onPress: () => onTabChange('chat')
        },
        { 
            title: 'Configurações de Conta', 
            desc: 'Alterar perfil e preferências', 
            icon: 'settings',
            onPress: () => onTabChange('faq')
        }
    ];

    const faqs = [
        {
            category: 'Login',
            question: 'Como redefinir minha senha?',
            answer: 'Para redefinir sua senha, clique em "Esqueci minha senha" na tela de login e siga as instruções enviadas por email.'
        },
        {
            category: 'Sessões',
            question: 'Como agendar uma nova sessão?',
            answer: 'Acesse o menu "Agendar" no aplicativo, selecione o profissional, data e horário desejados.'
        },
        {
            category: 'Técnico',
            question: 'O que fazer se o aplicativo estiver lento?',
            answer: 'Feche e reabra o aplicativo. Se o problema persistir, reinicie seu dispositivo ou verifique sua conexão com a internet.'
        },
        {
            category: 'Conta',
            question: 'Como alterar minhas informações pessoais?',
            answer: 'Acesse "Perfil" no menu principal, toque em "Editar" e faça as alterações necessárias.'
        },
    ];

    const filteredFAQs = useMemo(() => {
        if (!searchQuery) return faqs;
        return faqs.filter(faq => 
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const recentActivity = [
        { action: 'Ticket #1234 foi resolvido', time: '5 min atrás', icon: 'check-circle' },
        { action: 'Nova mensagem no chat', time: '12 min atrás', icon: 'message-circle' },
        { action: 'FAQ atualizada', time: '1 hora atrás', icon: 'edit' },
        { action: 'Ticket #1233 criado', time: '2 horas atrás', icon: 'plus-circle' }
    ];

    if (isAdmin) {
        return (
            <ScrollView 
                style={styles.container} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
                }
            >
                {/* Admin Welcome */}
                <LinearGradient
                    colors={['#4F46E5', '#7C3AED']}
                    style={styles.welcomeContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.welcomeTitle}>Painel de Suporte</Text>
                    <Text style={styles.welcomeSubtitle}>
                        Gerencie tickets, responda usuários e mantenha a base de conhecimento
                    </Text>
                </LinearGradient>

                {/* Stats */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Estatísticas</Text>
                        <TouchableOpacity 
                            onPress={() => admin.loadStats('month')}
                            style={styles.refreshButton}
                            disabled={admin.isLoadingStats}
                        >
                            {admin.isLoadingStats ? (
                                <ActivityIndicator size="small" color="#4F46E5" />
                            ) : (
                                <Feather name="refresh-cw" size={16} color="#4F46E5" />
                            )}
                        </TouchableOpacity>
                    </View>
                    <View style={styles.statsGrid}>
                        {adminStats.map((stat, index) => (
                            <StatCard 
                                key={index} 
                                {...stat} 
                                loading={admin.isLoadingStats}
                            />
                        ))}
                    </View>
                </View>

                {/* Admin Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ações Principais</Text>
                    <View style={styles.actionsGrid}>
                        {adminActions.map((action, index) => (
                            <ActionItem key={index} {...action} />
                        ))}
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Atividade Recente</Text>
                    <View style={styles.activityContainer}>
                        {recentActivity.map((activity, index) => (
                            <View 
                                key={index} 
                                style={[
                                    styles.activityItem,
                                    index < recentActivity.length - 1 && styles.activityItemBorder
                                ]}
                            >
                                <View style={styles.activityIconContainer}>
                                    <Feather name={activity.icon as any} size={16} color="#6B7280" />
                                </View>
                                <View style={styles.activityContent}>
                                    <Text style={styles.activityAction}>{activity.action}</Text>
                                    <Text style={styles.activityTime}>{activity.time}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Quick Tools */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ferramentas Rápidas</Text>
                    <View style={styles.toolsContainer}>
                        <TouchableOpacity style={styles.toolItem} activeOpacity={0.7}>
                            <View style={styles.toolContent}>
                                <Feather name="download" size={20} color="#4F46E5" />
                                <Text style={styles.toolText}>Exportar Relatórios</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#6B7280" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.toolItem} activeOpacity={0.7}>
                            <View style={styles.toolContent}>
                                <Feather name="settings" size={20} color="#4F46E5" />
                                <Text style={styles.toolText}>Configurações do Suporte</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#6B7280" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.toolItem} activeOpacity={0.7}>
                            <View style={styles.toolContent}>
                                <Feather name="users" size={20} color="#4F46E5" />
                                <Text style={styles.toolText}>Gerenciar Usuários</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        );
    }

    // User view
    return (
        <ScrollView 
            style={styles.container} 
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
        >
            {/* Welcome Section */}
            <LinearGradient
                colors={['#3B82F6', '#8B5CF6']}
                style={styles.welcomeContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Text style={styles.welcomeTitle}>Como podemos ajudar?</Text>
                <Text style={styles.welcomeSubtitle}>
                    Encontre respostas rápidas ou entre em contato conosco
                </Text>
            </LinearGradient>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ações Rápidas</Text>
                <View style={styles.actionsGrid}>
                    {userActions.map((action, index) => (
                        <ActionItem key={index} {...action} />
                    ))}
                </View>
            </View>

            {/* Search FAQ */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Perguntas Frequentes</Text>
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <Feather name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar nas perguntas frequentes..."
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setSearchQuery('')}
                                style={styles.clearButton}
                            >
                                <Feather name="x" size={16} color="#6B7280" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* FAQ Items */}
                <View style={styles.faqContainer}>
                    {filteredFAQs.map((faq, index) => (
                        <FAQItem
                            key={index}
                            {...faq}
                            isExpanded={expandedFAQs.has(index)}
                            onToggle={() => toggleFAQ(index)}
                        />
                    ))}
                    {filteredFAQs.length === 0 && searchQuery && (
                        <View style={styles.noResultsContainer}>
                            <Feather name="search" size={48} color="#D1D5DB" />
                            <Text style={styles.noResultsTitle}>Nenhum resultado encontrado</Text>
                            <Text style={styles.noResultsSubtitle}>
                                Tente usar outras palavras-chave ou entre em contato conosco
                            </Text>
                            <TouchableOpacity
                                style={styles.contactButton}
                                onPress={() => onTabChange('chat')}
                            >
                                <Text style={styles.contactButtonText}>Falar com Suporte</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* Popular Topics */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tópicos Populares</Text>
                {popularTopics.map((topic, index) => (
                    <TopicItem key={index} {...topic} />
                ))}
            </View>

            {/* Contact Options */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Entre em Contato</Text>
                <View style={styles.contactContainer}>
                    <View style={styles.contactOption}>
                        <View style={styles.contactInfo}>
                            <View style={[styles.contactIcon, { backgroundColor: '#D1FAE5' }]}>
                                <Feather name="message-circle" size={20} color="#10B981" />
                            </View>
                            <View>
                                <Text style={styles.contactTitle}>Chat ao Vivo</Text>
                                <Text style={styles.contactStatus}>Online agora</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => onTabChange('chat')}
                            style={[styles.contactButton, { backgroundColor: '#10B981' }]}
                        >
                            <Text style={styles.contactButtonText}>Iniciar</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={[styles.contactOption, styles.contactOptionBorder]}>
                        <View style={styles.contactInfo}>
                            <View style={[styles.contactIcon, { backgroundColor: '#DBEAFE' }]}>
                                <Feather name="mail" size={20} color="#3B82F6" />
                            </View>
                            <View>
                                <Text style={styles.contactTitle}>Email</Text>
                                <Text style={styles.contactSubtitle}>suporte@mme.com</Text>
                            </View>
                        </View>
                        <TouchableOpacity 
                            style={[styles.contactButton, { backgroundColor: '#3B82F6' }]}
                        >
                            <Text style={styles.contactButtonText}>Enviar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = {
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    welcomeContainer: {
        margin: 16,
        padding: 24,
        borderRadius: 16,
    },
    welcomeTitle: {
        fontSize: isTablet ? 28 : 24,
        fontWeight: 'bold' as const,
        color: '#FFFFFF',
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: isTablet ? 18 : 16,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 24,
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold' as const,
        color: '#111827',
    },
    refreshButton: {
        padding: 8,
    },
    statsGrid: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        justifyContent: 'space-between' as const,
        gap: 12,
    },
    statCard: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        width: isTablet ? '23%' : '48%' as any,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    statHeader: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        marginBottom: 8,
    },
    statIconContainer: {
        padding: 8,
        borderRadius: 8,
    },
    statValue: {
        fontSize: isTablet ? 28 : 24,
        fontWeight: 'bold' as const,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500' as const,
    },
    actionsGrid: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        gap: isTablet ? 16 : 8,
    },
    actionItem: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        flex: 1,
        alignItems: 'center' as const,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: '#111827',
        textAlign: 'center' as const,
        marginBottom: 4,
    },
    actionDesc: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center' as const,
    },
    searchContainer: {
        marginBottom: 16,
    },
    searchInputContainer: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        marginLeft: 12,
    },
    clearButton: {
        padding: 4,
    },
    faqContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden' as const,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    faqItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    faqHeader: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        padding: 16,
    },
    faqQuestionContainer: {
        flex: 1,
        marginRight: 12,
    },
    faqCategory: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start' as const,
        marginBottom: 8,
    },
    faqCategoryText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500' as const,
    },
    faqQuestion: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: '#111827',
        lineHeight: 22,
    },
    faqAnswerContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#F9FAFB',
    },
    faqAnswer: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    noResultsContainer: {
        alignItems: 'center' as const,
        paddingVertical: 48,
        paddingHorizontal: 24,
    },
    noResultsTitle: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: '#111827',
        marginTop: 16,
        marginBottom: 8,
    },
    noResultsSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center' as const,
        marginBottom: 20,
    },
    topicItem: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    topicIconContainer: {
        width: 48,
        height: 48,
        backgroundColor: '#F3F4F6',
        borderRadius: 24,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginRight: 16,
    },
    topicContent: {
        flex: 1,
    },
    topicTitle: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: '#111827',
        marginBottom: 2,
    },
    topicDesc: {
        fontSize: 14,
        color: '#6B7280',
    },
    activityContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden' as const,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    activityItem: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        padding: 16,
    },
    activityItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    activityIconContainer: {
        width: 32,
        height: 32,
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityAction: {
        fontSize: 14,
        fontWeight: '500' as const,
        color: '#111827',
        marginBottom: 2,
    },
    activityTime: {
        fontSize: 12,
        color: '#6B7280',
    },
    toolsContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden' as const,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    toolItem: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    toolContent: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    },
    toolText: {
        fontSize: 16,
        fontWeight: '500' as const,
        color: '#111827',
        marginLeft: 12,
    },
    contactContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden' as const,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    contactOption: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        padding: 16,
    },
    contactOptionBorder: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    contactInfo: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        flex: 1,
    },
    contactIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginRight: 12,
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: '#111827',
        marginBottom: 2,
    },
    contactStatus: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '500' as const,
    },
    contactSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    contactButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    contactButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600' as const,
    },
};

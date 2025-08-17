import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    View, 
    Animated, 
    Alert, 
    StatusBar, 
    Platform, 
    Dimensions,
    ScrollView,
    RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Navbar } from '../components/ui/navbar';
import { useSupport } from '@/src/context/SupportContext';
import { useAuth } from '@/src/context/AuthContext';
import { SupportTab } from '@/src/types/support.types';
import { adaptTicketsForUI } from '@/src/utils/ticketAdapters';

// Import all components
import { SupportTabNavigation } from '../navigation/SupportTabNavigation';
import { TicketsList } from '../components/TicketsList';
import { LiveChat } from '../components/LiveChat';
import { NewTicketModal } from '../components/NewTicketModal';
import { TicketDetailModal } from '../components/TicketDetailModal';
import { AdminFAQManager } from '../components/AdminFAQManager';
import { HelpCenter } from '../components/HelpCenter';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export function SupportScreen() {
    const { user } = useAuth();
    const { tickets, faqs, admin } = useSupport();
    
    // Check if user is admin
    const isAdmin = user?.role === 'coordinator';
    
    // State management
    const [activeTab, setActiveTab] = useState<SupportTab>(isAdmin ? 'tickets' : 'help');
    const [showNewTicketModal, setShowNewTicketModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [showTicketDetail, setShowTicketDetail] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    
    // Animation
    const slideAnim = useRef(new Animated.Value(1)).current;

    // Debug logs
    useEffect(() => {
        console.log('🎫 Support Debug:', {
            isAdmin,
            activeTab,
            ticketsCount: tickets.tickets?.length || 0,
            faqsCount: faqs.faqs?.length || 0,
            isLoading: tickets.isLoading || faqs.isLoading || admin.isLoadingStats,
        });
    }, [isAdmin, activeTab, tickets.tickets, faqs.faqs, tickets.isLoading, faqs.isLoading, admin.isLoadingStats]);

    // Load admin data when admin user accesses the screen
    useFocusEffect(
        useCallback(() => {
            if (isAdmin) {
                console.log('🎫 Support admin screen focused, loading data...');
                admin.loadStats('month');
                admin.loadAdminUsers();
                admin.loadWaitingSessions();
                tickets.loadTickets();
                faqs.loadFAQs();
            } else {
                console.log('🎫 Support user screen focused, loading user data...');
                tickets.loadTickets();
                faqs.loadFAQs();
            }
        }, [isAdmin])
    );

    // Refresh all data
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                tickets.refresh(),
                faqs.refresh(),
                ...(isAdmin ? [admin.refreshAll()] : [])
            ]);
        } catch (error) {
            console.error('Support refresh error:', error);
            Alert.alert('Erro', 'Falha ao atualizar dados do suporte');
        } finally {
            setRefreshing(false);
        }
    }, [isAdmin, tickets.refresh, faqs.refresh, admin.refreshAll]);

    // Event handlers
    const handleTabChange = (tab: SupportTab) => {
        // Animate tab transition
        Animated.sequence([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();

        setActiveTab(tab);
        setSearchQuery('');
    };

    const handleCreateTicket = async (newTicketData: any) => {
        try {
            console.log('🎫 Creating ticket:', newTicketData);
            await tickets.createTicket(newTicketData);
            setShowNewTicketModal(false);
            Alert.alert('Sucesso', 'Ticket criado com sucesso!');
        } catch (error: any) {
            console.error('Error creating ticket:', error);
            Alert.alert('Erro', `Falha ao criar ticket: ${error.message}`);
        }
    };

    const handleTicketPress = (ticket: any) => {
        console.log('🎫 Opening ticket details:', ticket.id);
        setSelectedTicket(ticket);
        setShowTicketDetail(true);
    };

    const handleUpdateTicket = async (updatedTicketData: any) => {
        console.log('🎫 Updating ticket:', selectedTicket?.id, updatedTicketData);
        try {
            if (selectedTicket) {
                await tickets.updateTicket(selectedTicket.id, updatedTicketData);
                setSelectedTicket({ ...selectedTicket, ...updatedTicketData });
                Alert.alert('Sucesso', 'Ticket atualizado com sucesso!');
            }
        } catch (error: any) {
            console.error('Error updating ticket:', error);
            Alert.alert('Erro', `Falha ao atualizar ticket: ${error.message}`);
        }
    };

    // Admin-specific FAQ handlers
    const handleAddFAQ = async (faqData: any) => {
        try {
            console.log('❓ Creating FAQ:', faqData);
            await faqs.createFAQ(faqData);
            Alert.alert('Sucesso', 'FAQ criada com sucesso!');
        } catch (error: any) {
            console.error('Error creating FAQ:', error);
            Alert.alert('Erro', `Falha ao criar FAQ: ${error.message}`);
        }
    };

    const handleUpdateFAQ = async (faqId: string, faqData: any) => {
        try {
            console.log('❓ Updating FAQ:', faqId, faqData);
            await faqs.updateFAQ(faqId, faqData);
            Alert.alert('Sucesso', 'FAQ atualizada com sucesso!');
        } catch (error: any) {
            console.error('Error updating FAQ:', error);
            Alert.alert('Erro', `Falha ao atualizar FAQ: ${error.message}`);
        }
    };

    const handleDeleteFAQ = async (faqId: string) => {
        try {
            console.log('❓ Deleting FAQ:', faqId);
            await faqs.deleteFAQ(faqId);
            Alert.alert('Sucesso', 'FAQ removida com sucesso!');
        } catch (error: any) {
            console.error('Error deleting FAQ:', error);
            Alert.alert('Erro', `Falha ao remover FAQ: ${error.message}`);
        }
    };

    // Render content based on active tab
    const renderContent = () => {
        return (
            <Animated.View 
                style={{
                    flex: 1,
                    opacity: slideAnim,
                    transform: [{
                        translateY: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                        })
                    }]
                }}
            >   
                {activeTab === 'tickets' && (
                    <TicketsList
                        tickets={adaptTicketsForUI(tickets.tickets)}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onTicketPress={handleTicketPress}
                        onNewTicket={() => setShowNewTicketModal(true)}
                        isAdmin={isAdmin}
                        isLoading={tickets.isLoading}
                        error={tickets.error}
                        onRefresh={tickets.refresh}
                        isRefreshing={tickets.isRefreshing}
                    />
                )}
                
                {activeTab === 'faq' && (
                    isAdmin ? (
                        <AdminFAQManager
                            faqs={faqs.faqs}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onAddFAQ={handleAddFAQ}
                            onUpdateFAQ={handleUpdateFAQ}
                            onDeleteFAQ={handleDeleteFAQ}
                            onUpdateHelpful={(faqId: string, helpful: number) => faqs.voteFAQ(faqId, helpful > 0)}
                            loading={faqs.isLoading || faqs.isCreating || faqs.isUpdating}
                            error={faqs.error}
                        />
                    ) : (
                        <HelpCenter 
                            onTabChange={handleTabChange}
                            isAdmin={false}
                        />
                    )
                )}
                
                {activeTab === 'chat' && (
                    <LiveChat 
                        isAdmin={isAdmin}
                    />
                )}
                
                {activeTab === 'help' && !isAdmin && (
                    <HelpCenter 
                        onTabChange={handleTabChange}
                        isAdmin={false}
                    />
                )}
            </Animated.View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
            <Navbar title={isAdmin ? "Painel de Suporte" : "Centro de Ajuda"} />
            
            <ScrollView
                style={{ flex: 1 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#4F46E5']}
                        tintColor="#4F46E5"
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                <SupportTabNavigation
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    slideAnim={slideAnim}
                    isAdmin={isAdmin}
                />
                
                {renderContent()}
            </ScrollView>

            {/* Modals */}
            <NewTicketModal
                visible={showNewTicketModal}
                onClose={() => setShowNewTicketModal(false)}
                onCreateTicket={handleCreateTicket}
                currentUser={
                    user && user.uid && user.firebaseClaims.name
                        ? { id: user.uid, fullName: user.firebaseClaims.name }
                        : undefined
                }
            />

            <TicketDetailModal
                visible={showTicketDetail}
                ticket={selectedTicket}
                onClose={() => {
                    setShowTicketDetail(false);
                    setSelectedTicket(null);
                }}
                currentUser={user}
                isAdmin={isAdmin}
            />
        </View>
    );
}

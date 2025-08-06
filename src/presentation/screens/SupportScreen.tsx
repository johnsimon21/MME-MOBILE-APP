import React, { useState, useRef, useEffect } from 'react';
import { View, Animated, Alert } from 'react-native';
import tw from 'twrnc';
import { Navbar } from '../components/ui/navbar';
import { useSupport } from '@/src/context/SupportContext';
import { useAuth } from '@/src/context/AuthContext';
import { SupportTab } from '@/src/types/support.types';
import { adaptTicketsForUI } from '@/src/utils/ticketAdapters';

// Import all components
import { SupportTabNavigation } from '../navigation/SupportTabNavigation';
import { TicketsList } from '../components/TicketsList';
import { FAQList } from '../components/FAQList';
import { LiveChat } from '../components/LiveChat';
import { NewTicketModal } from '../components/NewTicketModal';
import { TicketDetailModal } from '../components/TicketDetailModal';
import { AdminFAQManager } from '../components/AdminFAQManager';
import { HelpCenter } from '../components/HelpCenter';

export function SupportScreen() {
    const { user } = useAuth();
    const { tickets, faqs, admin } = useSupport();
    
    // Check if user is admin
    const isAdmin = user?.role === 'coordinator';
    
    // Redirect if not admin and load admin stats
    useEffect(() => {
        if (!isAdmin) {
            Alert.alert('Acesso Negado', 'Esta área é restrita para administradores.');
            // You might want to navigate back here
        } else {
            // Load admin stats when component mounts
            admin.loadStats('month');
            admin.loadAdminUsers();
            admin.loadWaitingSessions();
        }
    }, [isAdmin]);
    
    // State management
    const [activeTab, setActiveTab] = useState<SupportTab>('tickets'); // Start with tickets for admin
    const [showNewTicketModal, setShowNewTicketModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [showTicketDetail, setShowTicketDetail] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Animation
    const slideAnim = useRef(new Animated.Value(1)).current;

    // Event handlers
    const handleTabChange = (tab: SupportTab) => {
        setActiveTab(tab);
        setSearchQuery('');
    };

    const handleCreateTicket = async (newTicketData: any) => {
        try {
            await tickets.createTicket(newTicketData);
            setShowNewTicketModal(false);
        } catch (error) {
            console.error('Error creating ticket:', error);
        }
    };

    const handleTicketPress = (ticket: any) => {
        setSelectedTicket(ticket);
        setShowTicketDetail(true);
    };

    const handleUpdateTicket = async (updatedTicketData: any) => {

        console.log("Update Ticket Data ==> ", updatedTicketData)
        try {
            if (selectedTicket) {
                await tickets.updateTicket(selectedTicket.id, updatedTicketData);
                setSelectedTicket({ ...selectedTicket, ...updatedTicketData });
            }
        } catch (error) {
            console.error('Error updating ticket:', error);
        }
    };

    // Admin-specific FAQ handlers
    const handleAddFAQ = async (faqData: any) => {
        try {
            await faqs.createFAQ(faqData);
        } catch (error) {
            console.error('Error creating FAQ:', error);
        }
    };

    const handleUpdateFAQ = async (faqId: string, faqData: any) => {
        try {
            await faqs.updateFAQ(faqId, faqData);
        } catch (error) {
            console.error('Error updating FAQ:', error);
        }
    };

    const handleDeleteFAQ = async (faqId: string) => {
        try {
            await faqs.deleteFAQ(faqId);
        } catch (error) {
            console.error('Error deleting FAQ:', error);
        }
    };

    // Render content based on active tab
    const renderContent = () => {
        return (
            <Animated.View 
                style={[
                    tw`flex-1`,
                    {
                        opacity: slideAnim,
                        transform: [{
                            translateY: slideAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0],
                            })
                        }]
                    }
                ]}
            >   
                {activeTab === 'tickets' && (
                    <TicketsList
                        tickets={adaptTicketsForUI(tickets.tickets)}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onTicketPress={handleTicketPress}
                        onNewTicket={() => setShowNewTicketModal(true)}
                        isAdmin={true}
                    />
                )}
                
                {activeTab === 'faq' && (
                    <AdminFAQManager
                        faqs={faqs.faqs}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onAddFAQ={handleAddFAQ}
                        onUpdateFAQ={handleUpdateFAQ}
                        onDeleteFAQ={handleDeleteFAQ}
                        onUpdateHelpful={(faqId: string, helpful: number) => faqs.voteFAQ(faqId, helpful > 0)}
                    />
                )}
                
                {activeTab === 'chat' && (
                    <LiveChat isAdmin={true} />
                )}
                
                {activeTab === 'help' && (
                    <HelpCenter 
                        onTabChange={handleTabChange}
                        isAdmin={true}
                    />
                )}
            </Animated.View>
        );
    };

    // Don't render if not admin
    if (!isAdmin) {
        return null;
    }

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            <Navbar title="Painel de Suporte" />
            
            <SupportTabNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
                slideAnim={slideAnim}
                isAdmin={true}
            />
            
            {renderContent()}

            {/* Modals */}
            <NewTicketModal
                visible={showNewTicketModal}
                onClose={() => setShowNewTicketModal(false)}
                onCreateTicket={handleCreateTicket}
                currentUser={
                    user && user.uid && user.firebaseClaims?.name
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
                isAdmin={true}
            />
        </View>
    );
}

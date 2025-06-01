import React, { useState, useRef } from 'react';
import { View, Animated, Alert } from 'react-native';
import tw from 'twrnc';
import { Navbar } from '../components/ui/navbar';
import { SupportTab } from '@/src/types/support.types';
import { useSupportContext } from '@/src/context/SupportContext';
import { useAuth } from '@/src/context/AuthContext';

// Import all components
import { SupportTabNavigation } from '../navigation/SupportTabNavigation';
import { TicketsList } from '../components/TicketsList';
import { FAQList } from '../components/FAQList';
import { LiveChat } from '../components/LiveChat';
import { NewTicketModal } from '../components/NewTicketModal';
import { TicketDetailModal } from '../components/TicketDetailModal';
import { AdminFAQManager } from '../components/AdminFAQManager';

export function SupportScreen() {
    const { user, isAdmin } = useAuth();
    const {
        tickets,
        faqs,
        createTicket,
        updateTicket,
        updateFAQHelpful,
        getFilteredTickets,
        getFilteredFAQs,
        addFAQ,
        updateFAQ,
        deleteFAQ
    } = useSupportContext();
    
    // Redirect if not admin
    React.useEffect(() => {
        if (!isAdmin()) {
            Alert.alert('Acesso Negado', 'Esta área é restrita para administradores.');
            // You might want to navigate back here
        }
    }, [isAdmin]);
    
    // State management
    const [activeTab, setActiveTab] = useState<SupportTab>('tickets'); // Start with tickets for admin
    const [showNewTicketModal, setShowNewTicketModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
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
            await createTicket(newTicketData);
            setShowNewTicketModal(false);
        } catch (error) {
            console.error('Error creating ticket:', error);
        }
    };

    const handleTicketPress = (ticket: any) => {
        setSelectedTicket(ticket);
        setShowTicketDetail(true);
    };

    const handleUpdateTicket = (updatedTicket: any) => {
        updateTicket(updatedTicket);
        setSelectedTicket(updatedTicket);
    };

    // Admin-specific FAQ handlers
    const handleAddFAQ = (faqData: any) => {
        addFAQ(faqData);
    };

    const handleUpdateFAQ = (faqId: string, faqData: any) => {
        updateFAQ(faqId, faqData);
    };

    const handleDeleteFAQ = (faqId: string) => {
        deleteFAQ(faqId);
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
                        tickets={getFilteredTickets(searchQuery)}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onTicketPress={handleTicketPress}
                        onNewTicket={() => setShowNewTicketModal(true)}
                        isAdmin={true}
                    />
                )}
                
                {activeTab === 'faq' && (
                    <AdminFAQManager
                        faqs={getFilteredFAQs(searchQuery, 'all')}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onAddFAQ={handleAddFAQ}
                        onUpdateFAQ={handleUpdateFAQ}
                        onDeleteFAQ={handleDeleteFAQ}
                        onUpdateHelpful={updateFAQHelpful}
                    />
                )}
                
                {activeTab === 'chat' && (
                    <LiveChat isAdmin={true} />
                )}
            </Animated.View>
        );
    };

    // Don't render if not admin
    if (!isAdmin()) {
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
                    user && user.id && user.fullName
                        ? { id: user.id, fullName: user.fullName }
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
                onUpdateTicket={handleUpdateTicket}
                currentUser={user}
                isAdmin={true}
            />
        </View>
    );
}

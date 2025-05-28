import React, { useState, useRef } from 'react';
import { View, Animated } from 'react-native';
import tw from 'twrnc';
import { Navbar } from '../components/ui/navbar';
import { SupportTab } from '@/src/types/support.types';
import { useSupportContext } from '@/src/context/SupportContext';
import { FAQList } from '../components/FAQList';
import { HelpCenter } from '../components/HelpCenter';
import { LiveChat } from '../components/LiveChat';
import { NewTicketModal } from '../components/NewTicketModal';
import { TicketDetailModal } from '../components/TicketDetailModal';
import { TicketsList } from '../components/TicketsList';
import { SupportTabNavigation } from '../navigation/SupportTabNavigation';

// Import all components

export function SupportScreen() {
    const {
        tickets,
        faqs,
        createTicket,
        updateTicket,
        updateFAQHelpful,
        getFilteredTickets,
        getFilteredFAQs
    } = useSupportContext();
    
    // State management
    const [activeTab, setActiveTab] = useState<SupportTab>('help');
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
                {activeTab === 'help' && (
                    <HelpCenter onTabChange={handleTabChange} />
                )}
                
                {activeTab === 'tickets' && (
                    <TicketsList
                        tickets={getFilteredTickets(searchQuery)}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onTicketPress={handleTicketPress}
                        onNewTicket={() => setShowNewTicketModal(true)}
                    />
                )}
                
                {activeTab === 'faq' && (
                    <FAQList
                        faqs={faqs}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onUpdateFAQ={updateFAQHelpful}
                    />
                )}
                
                {activeTab === 'chat' && (
                    <LiveChat />
                )}
            </Animated.View>
        );
    };

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            <Navbar title="Suporte" />
            
            <SupportTabNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
                slideAnim={slideAnim}
            />
            
            {renderContent()}

            {/* Modals */}
            <NewTicketModal
                visible={showNewTicketModal}
                onClose={() => setShowNewTicketModal(false)}
                onCreateTicket={handleCreateTicket}
            />

            <TicketDetailModal
                visible={showTicketDetail}
                ticket={selectedTicket}
                onClose={() => {
                    setShowTicketDetail(false);
                    setSelectedTicket(null);
                }}
                onUpdateTicket={handleUpdateTicket}
            />
        </View>
    );
}

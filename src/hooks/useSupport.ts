import { useState, useCallback } from 'react';
import { SupportTicket, FAQ, ChatMessage } from '@/src/types/support.types';
import { useAuth } from '@/src/context/AuthContext';

export function useSupport() {
    const { user, isAdmin } = useAuth();
    
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ticket operations
    const createTicket = useCallback(async (ticketData: Partial<SupportTicket>) => {
        setLoading(true);
        try {
            const newTicket: SupportTicket = {
                id: Date.now().toString(),
                title: ticketData.title || '',
                description: ticketData.description || '',
                status: 'open',
                priority: ticketData.priority || 'medium',
                category: ticketData.category || 'Geral',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: user?.id || '',
                userName: user?.fullName || 'Usuário',
                messages: [{
                    id: '1',
                    message: ticketData.description || '',
                    sender: 'user',
                    timestamp: new Date().toISOString()
                }]
            };

            setTickets(prev => [newTicket, ...prev]);
            return newTicket;
        } catch (err) {
            setError('Erro ao criar ticket');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user]);

    const updateTicket = useCallback((updatedTicket: SupportTicket) => {
        setTickets(prev => prev.map(ticket => 
            ticket.id === updatedTicket.id ? updatedTicket : ticket
        ));
    }, []);

    const deleteTicket = useCallback((ticketId: string) => {
        setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
    }, []);

    // FAQ operations
    const updateFAQHelpful = useCallback((faqId: string, helpful: number) => {
        setFaqs(prev => prev.map(faq => 
            faq.id === faqId ? { ...faq, helpful } : faq
        ));
    }, []);

    // Chat operations
    const sendChatMessage = useCallback((message: string) => {
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            message,
            sender: isAdmin() ? 'admin' : 'user',
            timestamp: new Date().toISOString(),
            senderName: isAdmin() ? 'Admin' : user?.fullName || 'Usuário'
        };

        setChatMessages(prev => [...prev, newMessage]);
        return newMessage;
    }, [user, isAdmin]);

    // Filter functions
    const getFilteredTickets = useCallback((searchQuery: string) => {
        return tickets.filter(ticket => {
            const matchesUser = isAdmin() || ticket.userId === user?.id;
            const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesUser && matchesSearch;
        });
    }, [tickets, user, isAdmin]);

    const getFilteredFAQs = useCallback((searchQuery: string, category: string) => {
        return faqs.filter(faq => {
            const matchesCategory = category === 'all' || faq.category === category;
            const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [faqs]);

    return {
        // State
        tickets,
        faqs,
        chatMessages,
        loading,
        error,
        
        // Actions
        createTicket,
        updateTicket,
        deleteTicket,
        updateFAQHelpful,
        sendChatMessage,
        
        // Filters
        getFilteredTickets,
        getFilteredFAQs,
        
        // Setters
        setTickets,
        setFaqs,
        setChatMessages,
        setError
    };
}

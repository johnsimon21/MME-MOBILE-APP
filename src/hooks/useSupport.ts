import { IFAQ, ITicket, ICreateTicketRequest, TicketStatus, TicketPriority, TicketCategory } from '@/src/interfaces/support.interface';
import { ChatMessage } from '@/src/types/support.types';
import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAuthState } from './useAuthState';

export function useSupport() {
    const { user } = useAuth();
    const { isCoordinator } = useAuthState();

    const [tickets, setTickets] = useState<ITicket[]>([]);
    const [faqs, setFaqs] = useState<IFAQ[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ticket operations
    const createTicket = useCallback(async (ticketData: ICreateTicketRequest) => {
        setLoading(true);
        try {
            const newTicket: ITicket = {
                id: Date.now().toString(),
                title: ticketData.title || '',
                description: ticketData.description || '',
                status: TicketStatus.OPEN,
                priority: ticketData.priority || TicketPriority.MEDIUM,
                category: ticketData.category || TicketCategory.OTHER,
                user: {
                    uid: user?.uid || '',
                    fullName: user?.firebaseClaims.name || 'Usuário',
                    email: user?.email || '',
                    role: user?.role || 'user'
                },
                attachments: [],
                messagesCount: 1,
                lastMessage: {
                    message: ticketData.description || '',
                    senderName: user?.firebaseClaims.name || 'Usuário',
                    senderType: 'user',
                    timestamp: new Date().toISOString()
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
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

    const updateTicket = useCallback((updatedTicket: ITicket) => {
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
            sender: isCoordinator ? 'admin' : 'user',
            timestamp: new Date().toString(),
            senderName: isCoordinator ? 'Admin' : user?.firebaseClaims.name || 'Usuário'
        };

        setChatMessages(prev => [...prev, newMessage]);
        return newMessage;
    }, [user, isCoordinator]);

    // Filter functions
    const getFilteredTickets = useCallback((searchQuery: string) => {
        return tickets.filter(ticket => {
            const matchesUser = isCoordinator || ticket.user.uid === user?.uid;
            const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesUser && matchesSearch;
        });
    }, [tickets, user, isCoordinator]);

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

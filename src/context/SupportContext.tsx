import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SupportTicket, FAQ, ChatMessage } from '@/src/types/support.types';

interface SupportContextType {
    // Tickets
    tickets: SupportTicket[];
    createTicket: (ticketData: Partial<SupportTicket>) => Promise<void>;
    updateTicket: (ticket: SupportTicket) => void;
    getFilteredTickets: (searchQuery: string, status?: string) => SupportTicket[];
    
    // FAQs
    faqs: FAQ[];
    updateFAQHelpful: (faqId: string, helpful: number) => void;
    getFilteredFAQs: (searchQuery: string, category: string) => FAQ[];
    addFAQ: (faq: Partial<FAQ>) => void;
    updateFAQ: (faqId: string, faq: Partial<FAQ>) => void;
    deleteFAQ: (faqId: string) => void;
    
    // Chat
    chatMessages: ChatMessage[];
    sendChatMessage: (message: string) => void;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export function SupportProvider({ children }: { children: ReactNode }) {
    // Sample data
    const [tickets, setTickets] = useState<SupportTicket[]>([
        {
            id: '1',
            title: 'Problema de Login',
            description: 'Não consigo fazer login na minha conta',
            status: 'open',
            priority: 'high',
            category: 'Conta',
            userId: '1',
            userName: 'João Silva',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            messages: [
                {
                    id: '1',
                    message: 'Não consigo fazer login na minha conta. Aparece erro de senha incorreta.',
                    sender: 'user',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
                }
            ]
        },
        {
            id: '2',
            title: 'Erro na Sessão',
            description: 'A sessão não está carregando corretamente',
            status: 'in-progress',
            priority: 'medium',
            category: 'Sessões',
            userId: '2',
            userName: 'Maria Santos',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            messages: [
                {
                    id: '2',
                    message: 'A sessão não está carregando. Fica na tela de loading.',
                    sender: 'user',
                    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: '3',
                    message: 'Vou verificar o problema. Pode tentar limpar o cache do app?',
                    sender: 'admin',
                    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
                }
            ]
        }
    ]);

    const [faqs, setFaqs] = useState<FAQ[]>([
        {
            id: '1',
            question: 'Como redefinir minha senha?',
            answer: 'Para redefinir sua senha, vá em Configurações > Conta > Alterar Senha. Você receberá um email com instruções.',
            category: 'Conta',
            helpful: 15
        },
        {
            id: '2',
            question: 'Como agendar uma sessão?',
            answer: 'Para agendar uma sessão, acesse a aba "Gerenciamento de Sessões" e clique em "Nova Sessão". Escolha o participante e a data desejada.',
            category: 'Sessões',
            helpful: 23
        },
        {
            id: '3',
            question: 'O app não está funcionando. O que fazer?',
            answer: 'Primeiro, tente fechar e abrir o app novamente. Se o problema persistir, verifique sua conexão com a internet e reinicie o dispositivo.',
            category: 'Técnico',
            helpful: 8
        }
    ]);

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            message: 'Olá! Preciso de ajuda com minha conta.',
            sender: 'user',
            senderName: 'João Silva',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        },
        {
            id: '2',
            message: 'Olá João! Claro, posso ajudá-lo. Qual é o problema específico?',
            sender: 'admin',
            senderName: 'Suporte',
            timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString()
        }
    ]);

    // Ticket functions
    const createTicket = async (ticketData: Partial<SupportTicket>) => {
        const newTicket: SupportTicket = {
            id: Date.now().toString(),
            title: ticketData.title || '',
            description: ticketData.description || '',
            status: 'open',
            priority: ticketData.priority || 'medium',
            category: ticketData.category || 'Geral',
            userId: ticketData.userId || '1',
            userName: ticketData.userName || 'Usuário',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [
                {
                    id: Date.now().toString(),
                    message: ticketData.description || '',
                    sender: 'user',
                    timestamp: new Date().toISOString()
                }
            ]
        };

        setTickets(prev => [newTicket, ...prev]);
    };

    const updateTicket = (updatedTicket: SupportTicket) => {
        setTickets(prev => prev.map(ticket => 
            ticket.id === updatedTicket.id ? updatedTicket : ticket
        ));
    };

    const getFilteredTickets = (searchQuery: string, status?: string) => {
        return tickets.filter(ticket => {
            const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = !status || status === 'all' || ticket.status === status;
            return matchesSearch && matchesStatus;
        });
    };

    // FAQ functions
    const addFAQ = (faqData: Partial<FAQ>) => {
        const newFAQ: FAQ = {
            id: Date.now().toString(),
            question: faqData.question || '',
            answer: faqData.answer || '',
            category: faqData.category || 'Geral',
            helpful: 0
        };

        setFaqs(prev => [newFAQ, ...prev]);
    };

    const updateFAQ = (faqId: string, faqData: Partial<FAQ>) => {
        setFaqs(prev => prev.map(faq => 
            faq.id === faqId ? { ...faq, ...faqData } : faq
        ));
    };

    const deleteFAQ = (faqId: string) => {
        setFaqs(prev => prev.filter(faq => faq.id !== faqId));
    };

    const updateFAQHelpful = (faqId: string, helpful: number) => {
        setFaqs(prev => prev.map(faq => 
            faq.id === faqId ? { ...faq, helpful } : faq
        ));
    };

        const getFilteredFAQs = (searchQuery: string, category: string) => {
        return faqs.filter(faq => {
            const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = category === 'all' || faq.category === category;
            return matchesSearch && matchesCategory;
        });
    };

    // Chat functions
    const sendChatMessage = (message: string) => {
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            message,
            sender: 'user', // This would be determined by user role
            senderName: 'Usuário', // This would come from auth context
            timestamp: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, newMessage]);

        // Simulate admin response (for demo purposes)
        setTimeout(() => {
            const adminResponse: ChatMessage = {
                id: (Date.now() + 1).toString(),
                message: 'Obrigado pela sua mensagem. Vou analisar e responder em breve.',
                sender: 'admin',
                senderName: 'Suporte',
                timestamp: new Date().toISOString()
            };
            setChatMessages(prev => [...prev, adminResponse]);
        }, 2000);
    };

    const value: SupportContextType = {
        // Tickets
        tickets,
        createTicket,
        updateTicket,
        getFilteredTickets,
        
        // FAQs
        faqs,
        updateFAQHelpful,
        getFilteredFAQs,
        addFAQ,
        updateFAQ,
        deleteFAQ,
        
        // Chat
        chatMessages,
        sendChatMessage
    };

    return (
        <SupportContext.Provider value={value}>
            {children}
        </SupportContext.Provider>
    );
}

export function useSupportContext() {
    const context = useContext(SupportContext);
    if (context === undefined) {
        throw new Error('useSupportContext must be used within a SupportProvider');
    }
    return context;
}

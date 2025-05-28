import React, { createContext, useContext, ReactNode } from 'react';
import { useSupport } from '@/src/hooks/useSupport';
import { SupportTicket, FAQ, ChatMessage } from '@/src/types/support.types';

interface SupportContextType {
    tickets: SupportTicket[];
    faqs: FAQ[];
    chatMessages: ChatMessage[];
    loading: boolean;
    error: string | null;
    createTicket: (ticketData: Partial<SupportTicket>) => Promise<SupportTicket>;
    updateTicket: (ticket: SupportTicket) => void;
    deleteTicket: (ticketId: string) => void;
    updateFAQHelpful: (faqId: string, helpful: number) => void;
    sendChatMessage: (message: string) => ChatMessage;
    getFilteredTickets: (searchQuery: string) => SupportTicket[];
    getFilteredFAQs: (searchQuery: string, category: string) => FAQ[];
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export function SupportProvider({ children }: { children: ReactNode }) {
    const supportHook = useSupport();

    return (
        <SupportContext.Provider value={supportHook}>
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

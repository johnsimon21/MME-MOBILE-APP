export interface SupportTicket {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    userName: string;
    adminResponse?: string;
    messages: TicketMessage[];
}

export interface TicketMessage {
    id: string;
    message: string;
    sender: 'user' | 'admin';
    timestamp: string;
}

export interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    helpful: number;
}

export interface ChatMessage {
    id: string;
    message: string;
    sender: 'user' | 'admin';
    timestamp: string;
    senderName: string;
}

export type SupportTab = 'help' | 'tickets' | 'chat' | 'faq';

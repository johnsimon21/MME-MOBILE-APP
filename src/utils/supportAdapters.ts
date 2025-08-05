// Adapters to convert between new support interfaces and existing component types
import { ITicket, IFAQ } from '../interfaces/support.interface';
import { SupportTicket, FAQ } from '../types/support.types';

export function adaptTicketToSupportTicket(ticket: ITicket): SupportTicket {
  // Map ticket status to expected format
  const statusMap: Record<string, 'open' | 'in-progress' | 'resolved' | 'closed'> = {
    'open': 'open',
    'in_progress': 'in-progress',
    'waiting_user': 'in-progress',
    'resolved': 'resolved',
    'closed': 'closed'
  };

  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: statusMap[ticket.status] || 'open',
    priority: ticket.priority,
    category: ticket.category,
    createdAt: ticket.createdAt.toString(),
    updatedAt: ticket.updatedAt.toString(),
    userId: ticket.user.uid,
    userName: ticket.user.fullName,
    adminResponse: ticket.lastMessage?.message,
    messages: [], // Will need to be populated from ticket details
  };
}

export function adaptTicketsToSupportTickets(tickets: ITicket[]): SupportTicket[] {
  return tickets.map(adaptTicketToSupportTicket);
}

export function adaptFAQToFAQ(faq: IFAQ): FAQ {
  return {
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    category: faq.category,
    helpful: faq.helpfulCount,
  };
}

export function adaptFAQsToFAQs(faqs: IFAQ[]): FAQ[] {
  return faqs.map(adaptFAQToFAQ);
}

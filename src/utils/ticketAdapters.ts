import { ITicket, ITicketDetails } from '../interfaces/support.interface';

// Legacy ticket type for UI compatibility
export interface UITicket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  userId: string;
  userName: string;
  messages: Array<{
    id: string;
    message: string;
    sender: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Convert ITicket to UITicket for UI components
export const adaptTicketForUI = (ticket: ITicket): UITicket => {
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    userId: ticket.user.uid,
    userName: ticket.user.fullName,
    messages: ticket.lastMessage ? [{
      id: `${ticket.id}-last`,
      message: ticket.lastMessage.message,
      sender: ticket.lastMessage.senderType,
      timestamp: ticket.lastMessage.timestamp.toString(),
    }] : [],
    createdAt: ticket.createdAt.toString(),
    updatedAt: ticket.updatedAt.toString(),
  };
};

// Convert array of ITickets to UITickets
export const adaptTicketsForUI = (tickets: ITicket[]): UITicket[] => {
  return tickets.map(adaptTicketForUI);
};

// Convert ITicketDetails to UITicket (with full messages)
export const adaptTicketDetailsForUI = (ticketDetails: ITicketDetails): UITicket => {
  return {
    id: ticketDetails.id,
    title: ticketDetails.title,
    description: ticketDetails.description,
    status: ticketDetails.status,
    priority: ticketDetails.priority,
    category: ticketDetails.category,
    userId: ticketDetails.user.uid,
    userName: ticketDetails.user.fullName,
    messages: ticketDetails.messages.map(msg => ({
      id: msg.id,
      message: msg.message,
      sender: msg.senderType,
      timestamp: msg.timestamp.toString(),
    })),
    createdAt: ticketDetails.createdAt.toString(),
    updatedAt: ticketDetails.updatedAt.toString(),
  };
};

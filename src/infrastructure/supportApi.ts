import api from './api';
import {
  // Ticket interfaces
  ITicket,
  ITicketDetails,
  ITicketsResponse,
  ICreateTicketRequest,
  IUpdateTicketRequest,
  IUpdateTicketStatusRequest,
  IAddTicketMessageRequest,
  IQueryTicketsRequest,
  
  // Support Chat interfaces
  ISupportChatSession,
  IChatSessionsResponse,
  IStartChatSessionRequest,
  ISendChatMessageRequest,
  ICloseChatSessionRequest,
  
  // FAQ interfaces
  IFAQ,
  IFAQsResponse,
  ICreateFAQRequest,
  IUpdateFAQRequest,
  IVoteFAQRequest,
  IQueryFAQsRequest,
  
  // Admin interfaces
  ISupportStats,
  IAdminUsersResponse,
} from '../interfaces/support.interface';

export class SupportAPI {
  // ========================================
  // TICKETS API
  // ========================================

  static async createTicket(
    createData: ICreateTicketRequest,
    files?: File[]
  ): Promise<ITicket> {
    // Use JSON for ticket data only - no file attachments for now
    const response = await api.post('/support/tickets', {
      title: createData.title,
      description: createData.description,
      category: createData.category,
      priority: createData.priority || 'MEDIUM'
    });
    
    return response.data;
  }

  static async getTickets(
    params: IQueryTicketsRequest = {}
  ): Promise<ITicketsResponse> {
    const response = await api.get('/support/tickets', { params });
    return response.data;
  }

  static async getTicketById(ticketId: string): Promise<ITicketDetails> {
    const response = await api.get(`/support/tickets/${ticketId}`);
    return response.data;
  }

  static async updateTicket(
    ticketId: string,
    updateData: IUpdateTicketRequest
  ): Promise<ITicket> {
    const response = await api.put(`/support/tickets/${ticketId}`, updateData);
    return response.data;
  }

  static async updateTicketStatus(
    ticketId: string,
    statusData: IUpdateTicketStatusRequest
  ): Promise<ITicket> {
    const response = await api.put(`/support/tickets/${ticketId}/status`, statusData);
    return response.data;
  }

  static async addTicketMessage(
    ticketId: string,
    messageData: IAddTicketMessageRequest,
    files?: File[]
  ): Promise<{ message: string }> {
    const formData = new FormData();
    
    // Add message data
    Object.entries(messageData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    
    // Add files if provided
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const response = await api.post(`/support/tickets/${ticketId}/messages`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  static async assignTicket(
    ticketId: string,
    assigneeId: string
  ): Promise<ITicket> {
    const response = await api.put(`/support/tickets/${ticketId}/assign`, {
      assigneeId,
    });
    return response.data;
  }

  // ========================================
  // SUPPORT CHAT API
  // ========================================

  static async startChatSession(
    sessionData: IStartChatSessionRequest
  ): Promise<ISupportChatSession> {
    const response = await api.post('/support/chat/sessions', sessionData);
    return response.data;
  }

  static async getChatSessions(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<IChatSessionsResponse> {
    const params = { page, limit, status };
    const response = await api.get('/support/chat/sessions', { params });
    return response.data;
  }

  static async getChatSession(sessionId: string): Promise<ISupportChatSession> {
    const response = await api.get(`/support/chat/sessions/${sessionId}`);
    return response.data;
  }

  static async sendChatMessage(
    sessionId: string,
    messageData: ISendChatMessageRequest
  ): Promise<{ message: string }> {
    const response = await api.post(
      `/support/chat/sessions/${sessionId}/messages`,
      messageData
    );
    return response.data;
  }

  static async closeChatSession(
    sessionId: string,
    closeData: ICloseChatSessionRequest
  ): Promise<ISupportChatSession> {
    const response = await api.put(
      `/support/chat/sessions/${sessionId}/close`,
      closeData
    );
    return response.data;
  }

  static async assignChatSession(
    sessionId: string,
    agentId: string
  ): Promise<{ message: string }> {
    const response = await api.put(
      `/support/chat/sessions/${sessionId}/assign`,
      { agentId }
    );
    return response.data;
  }

  static async getChatMessages(
    sessionId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ message: string }> {
    const params = { page, limit };
    const response = await api.get(
      `/support/chat/sessions/${sessionId}/messages`,
      { params }
    );
    return response.data;
  }

  // ========================================
  // FAQ API
  // ========================================

  static async createFAQ(faqData: ICreateFAQRequest): Promise<IFAQ> {
    const response = await api.post('/support/faqs', faqData);
    return response.data;
  }

  static async getFAQs(params: IQueryFAQsRequest = {}): Promise<IFAQsResponse> {
    const response = await api.get('/support/faqs', { params });
    return response.data;
  }

  static async getFAQById(faqId: string): Promise<IFAQ> {
    const response = await api.get(`/support/faqs/${faqId}`);
    return response.data;
  }

  static async updateFAQ(
    faqId: string,
    updateData: IUpdateFAQRequest
  ): Promise<IFAQ> {
    const response = await api.put(`/support/faqs/${faqId}`, updateData);
    return response.data;
  }

  static async deleteFAQ(faqId: string): Promise<{ message: string }> {
    const response = await api.delete(`/support/faqs/${faqId}`);
    return response.data;
  }

  static async voteFAQ(
    faqId: string,
    voteData: IVoteFAQRequest
  ): Promise<{ message: string }> {
    const response = await api.post(`/support/faqs/${faqId}/vote`, voteData);
    return response.data;
  }

  // ========================================
  // ADMIN API
  // ========================================

  static async getSupportStats(
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<ISupportStats> {
    const response = await api.get('/support/admin/stats', {
      params: { period },
    });
    return response.data;
  }

  static async getAdminUsers(
    page: number = 1,
    limit: number = 20,
    search?: string
  ): Promise<IAdminUsersResponse> {
    const params = { page, limit, search };
    const response = await api.get('/support/admin/users', { params });
    return response.data;
  }
}

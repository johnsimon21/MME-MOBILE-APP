import React, { createContext, useContext, ReactNode } from 'react';
import { useTickets } from '../hooks/useTickets';
import { useSupportChat } from '../hooks/useSupportChat';
import { useFAQs } from '../hooks/useFAQs';
import { useSupportAdmin } from '../hooks/useSupportAdmin';
import {
  // Ticket types
  ITicket,
  ITicketDetails,
  ICreateTicketRequest,
  IUpdateTicketRequest,
  IUpdateTicketStatusRequest,
  IAddTicketMessageRequest,
  TicketFilters,
  
  // Support Chat types
  ISupportChatSession,
  ISupportChatMessage,
  IStartChatSessionRequest,
  ISendChatMessageRequest,
  ICloseChatSessionRequest,
  SupportChatFilters,
  
  // FAQ types
  IFAQ,
  ICreateFAQRequest,
  IUpdateFAQRequest,
  FAQFilters,
  
  // Admin types
  ISupportStats,
  IAdminUsersResponse,
} from '../interfaces/support.interface';

interface SupportContextType {
  // ========================================
  // TICKETS
  // ========================================
  tickets: {
    // State
    tickets: ITicket[];
    currentTicket: ITicketDetails | null;
    isLoading: boolean;
    isRefreshing: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    error: string | null;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
    stats: {
      open: number;
      inProgress: number;
      resolved: number;
      closed: number;
    } | null;
    isSocketConnected: boolean;

    // Actions
    loadTickets: (filters?: TicketFilters, page?: number, refresh?: boolean) => Promise<void>;
    loadMore: () => void;
    refresh: () => void;
    createTicket: (ticketData: ICreateTicketRequest, files?: File[]) => Promise<ITicket>;
    getTicketDetails: (ticketId: string) => Promise<ITicketDetails>;
    updateTicket: (ticketId: string, updateData: IUpdateTicketRequest) => Promise<ITicket>;
    updateTicketStatus: (ticketId: string, statusData: IUpdateTicketStatusRequest) => Promise<ITicket>;
    addTicketMessage: (ticketId: string, messageData: IAddTicketMessageRequest, files?: File[]) => Promise<{ message: string }>;
    assignTicket: (ticketId: string, assigneeId: string) => Promise<ITicket>;
    leaveCurrentTicket: () => void;
    getFilteredTickets: (filters: TicketFilters) => ITicket[];
    connectSocket: () => void;
    disconnectSocket: () => void;
  };

  // ========================================
  // SUPPORT CHAT
  // ========================================
  chat: {
    // State
    sessions: ISupportChatSession[];
    currentSession: ISupportChatSession | null;
    messages: ISupportChatMessage[];
    isLoading: boolean;
    isRefreshing: boolean;
    isSendingMessage: boolean;
    isStartingSession: boolean;
    error: string | null;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
    stats: {
      waiting: number;
      active: number;
      closed: number;
      averageWaitTime: number;
      averageResponseTime: number;
    } | null;
    typingUsers: Map<string, { isTyping: boolean; timestamp: Date }>;
    isSocketConnected: boolean;

    // Actions
    loadSessions: (page?: number, limit?: number, status?: string, refresh?: boolean) => Promise<void>;
    loadMore: () => void;
    refresh: () => void;
    startChatSession: (sessionData: IStartChatSessionRequest) => Promise<ISupportChatSession>;
    joinSession: (sessionId: string) => Promise<ISupportChatSession>;
    sendMessage: (sessionId: string, message: string) => Promise<void>;
    startTyping: (sessionId: string) => void;
    stopTyping: (sessionId: string) => void;
    closeChatSession: (sessionId: string, closeData: ICloseChatSessionRequest) => Promise<ISupportChatSession>;
    leaveCurrentSession: () => void;
    getFilteredSessions: (filters: SupportChatFilters) => ISupportChatSession[];
    getTypingUsers: () => string[];
    connectSocket: () => void;
    disconnectSocket: () => void;
  };

  // ========================================
  // FAQS
  // ========================================
  faqs: {
    // State
    faqs: IFAQ[];
    currentFAQ: IFAQ | null;
    isLoading: boolean;
    isRefreshing: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isVoting: boolean;
    error: string | null;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
    categories: Array<{
      category: string;
      count: number;
    }>;

    // Actions
    loadFAQs: (filters?: FAQFilters, page?: number, refresh?: boolean) => Promise<void>;
    loadMore: () => void;
    refresh: () => void;
    createFAQ: (faqData: ICreateFAQRequest) => Promise<IFAQ>;
    getFAQDetails: (faqId: string) => Promise<IFAQ>;
    updateFAQ: (faqId: string, updateData: IUpdateFAQRequest) => Promise<IFAQ>;
    deleteFAQ: (faqId: string) => Promise<void>;
    voteFAQ: (faqId: string, isHelpful: boolean) => Promise<void>;
    clearCurrentFAQ: () => void;
    getFilteredFAQs: (filters: FAQFilters) => IFAQ[];
    getFAQCategories: () => Array<{ category: string; count: number }>;
    getPopularFAQs: (limit?: number) => IFAQ[];
    getRecentFAQs: (limit?: number) => IFAQ[];
  };

  // ========================================
  // ADMIN
  // ========================================
  admin: {
    // State
    stats: ISupportStats | null;
    adminUsers: IAdminUsersResponse | null;
    waitingSessions: ISupportChatSession[];
    isLoadingStats: boolean;
    isLoadingUsers: boolean;
    isLoadingSessions: boolean;
    isRefreshing: boolean;
    error: string | null;
    isSocketConnected: boolean;
    onlineAdmins: string[];
    isAdmin: boolean;

    // Actions
    loadStats: (period?: 'day' | 'week' | 'month' | 'year', refresh?: boolean) => Promise<void>;
    loadAdminUsers: (page?: number, limit?: number, search?: string, refresh?: boolean) => Promise<void>;
    loadWaitingSessions: () => void;
    assignSession: (sessionId: string) => Promise<void>;
    refreshAll: () => Promise<void>;
    getStatsSummary: () => any;
    getTicketsByCategory: () => Array<{ category: string; count: number; percentage: number }>;
    getTicketsByPriority: () => Array<{ priority: string; count: number; percentage: number }>;
    connectSocket: () => void;
    disconnectSocket: () => void;
  };
}

const SupportContext = createContext<SupportContextType | null>(null);

interface SupportProviderProps {
  children: ReactNode;
}

export function SupportProvider({ children }: SupportProviderProps) {
  const ticketsHook = useTickets();
  const chatHook = useSupportChat();
  const faqsHook = useFAQs();
  const adminHook = useSupportAdmin();

  const contextValue: SupportContextType = {
    tickets: {
      // State
      tickets: ticketsHook.tickets,
      currentTicket: ticketsHook.currentTicket,
      isLoading: ticketsHook.isLoading,
      isRefreshing: ticketsHook.isRefreshing,
      isCreating: ticketsHook.isCreating,
      isUpdating: ticketsHook.isUpdating,
      error: ticketsHook.error,
      total: ticketsHook.total,
      page: ticketsHook.page,
      limit: ticketsHook.limit,
      totalPages: ticketsHook.totalPages,
      hasMore: ticketsHook.hasMore,
      stats: ticketsHook.stats,
      isSocketConnected: ticketsHook.isSocketConnected,

      // Actions
      loadTickets: ticketsHook.loadTickets,
      loadMore: ticketsHook.loadMore,
      refresh: ticketsHook.refresh,
      createTicket: ticketsHook.createTicket,
      getTicketDetails: ticketsHook.getTicketDetails,
      updateTicket: ticketsHook.updateTicket,
      updateTicketStatus: ticketsHook.updateTicketStatus,
      addTicketMessage: ticketsHook.addTicketMessage,
      assignTicket: ticketsHook.assignTicket,
      leaveCurrentTicket: ticketsHook.leaveCurrentTicket,
      getFilteredTickets: ticketsHook.getFilteredTickets,
      connectSocket: ticketsHook.connectSocket,
      disconnectSocket: ticketsHook.disconnectSocket,
    },

    chat: {
      // State
      sessions: chatHook.sessions,
      currentSession: chatHook.currentSession,
      messages: chatHook.messages,
      isLoading: chatHook.isLoading,
      isRefreshing: chatHook.isRefreshing,
      isSendingMessage: chatHook.isSendingMessage,
      isStartingSession: chatHook.isStartingSession,
      error: chatHook.error,
      total: chatHook.total,
      page: chatHook.page,
      limit: chatHook.limit,
      totalPages: chatHook.totalPages,
      hasMore: chatHook.hasMore,
      stats: chatHook.stats,
      typingUsers: chatHook.typingUsers,
      isSocketConnected: chatHook.isSocketConnected,

      // Actions
      loadSessions: chatHook.loadSessions,
      loadMore: chatHook.loadMore,
      refresh: chatHook.refresh,
      startChatSession: chatHook.startChatSession,
      joinSession: chatHook.joinSession,
      sendMessage: chatHook.sendMessage,
      startTyping: chatHook.startTyping,
      stopTyping: chatHook.stopTyping,
      closeChatSession: chatHook.closeChatSession,
      leaveCurrentSession: chatHook.leaveCurrentSession,
      getFilteredSessions: chatHook.getFilteredSessions,
      getTypingUsers: chatHook.getTypingUsers,
      connectSocket: chatHook.connectSocket,
      disconnectSocket: chatHook.disconnectSocket,
    },

    faqs: {
      // State
      faqs: faqsHook.faqs,
      currentFAQ: faqsHook.currentFAQ,
      isLoading: faqsHook.isLoading,
      isRefreshing: faqsHook.isRefreshing,
      isCreating: faqsHook.isCreating,
      isUpdating: faqsHook.isUpdating,
      isVoting: faqsHook.isVoting,
      error: faqsHook.error,
      total: faqsHook.total,
      page: faqsHook.page,
      limit: faqsHook.limit,
      totalPages: faqsHook.totalPages,
      hasMore: faqsHook.hasMore,
      categories: faqsHook.categories,

      // Actions
      loadFAQs: faqsHook.loadFAQs,
      loadMore: faqsHook.loadMore,
      refresh: faqsHook.refresh,
      createFAQ: faqsHook.createFAQ,
      getFAQDetails: faqsHook.getFAQDetails,
      updateFAQ: faqsHook.updateFAQ,
      deleteFAQ: faqsHook.deleteFAQ,
      voteFAQ: faqsHook.voteFAQ,
      clearCurrentFAQ: faqsHook.clearCurrentFAQ,
      getFilteredFAQs: faqsHook.getFilteredFAQs,
      getFAQCategories: faqsHook.getFAQCategories,
      getPopularFAQs: faqsHook.getPopularFAQs,
      getRecentFAQs: faqsHook.getRecentFAQs,
    },

    admin: {
      // State
      stats: adminHook.stats,
      adminUsers: adminHook.adminUsers,
      waitingSessions: adminHook.waitingSessions,
      isLoadingStats: adminHook.isLoadingStats,
      isLoadingUsers: adminHook.isLoadingUsers,
      isLoadingSessions: adminHook.isLoadingSessions,
      isRefreshing: adminHook.isRefreshing,
      error: adminHook.error,
      isSocketConnected: adminHook.isSocketConnected,
      onlineAdmins: adminHook.onlineAdmins,
      isAdmin: adminHook.isAdmin,

      // Actions
      loadStats: adminHook.loadStats,
      loadAdminUsers: adminHook.loadAdminUsers,
      loadWaitingSessions: adminHook.loadWaitingSessions,
      assignSession: adminHook.assignSession,
      refreshAll: adminHook.refreshAll,
      getStatsSummary: adminHook.getStatsSummary,
      getTicketsByCategory: adminHook.getTicketsByCategory,
      getTicketsByPriority: adminHook.getTicketsByPriority,
      connectSocket: adminHook.connectSocket,
      disconnectSocket: adminHook.disconnectSocket,
    },
  };

  return (
    <SupportContext.Provider value={contextValue}>
      {children}
    </SupportContext.Provider>
  );
}

export function useSupport() {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error('useSupport must be used within a SupportProvider');
  }
  return context;
}

export default SupportContext;

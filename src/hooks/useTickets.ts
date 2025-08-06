import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { SupportAPI } from '../infrastructure/supportApi';
import { useSupportSocket } from './useSupportSocket';
import {
  ITicket,
  ITicketDetails,
  ITicketsResponse,
  ICreateTicketRequest,
  IUpdateTicketRequest,
  IUpdateTicketStatusRequest,
  IAddTicketMessageRequest,
  IQueryTicketsRequest,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from '../interfaces/support.interface';

export interface TicketsState {
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
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  search?: string;
  userId?: string;
  assignedAdminId?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export const useTickets = () => {
  const { user, isAuthenticated } = useAuth();
  const lastFetchTime = useRef<number>(0);
  
  const [state, setState] = useState<TicketsState>({
    tickets: [],
    currentTicket: null,
    isLoading: false,
    isRefreshing: false,
    isCreating: false,
    isUpdating: false,
    error: null,
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasMore: false,
    stats: null,
    isSocketConnected: false,
  });

  // WebSocket callbacks
  const socketCallbacks = {
    onNewTicket: (data: { ticketId: string; ticket: any; timestamp: Date }) => {
      console.log('🎫 New ticket received in hook:', data);
      setState(prev => ({
        ...prev,
        tickets: [data.ticket, ...prev.tickets],
        total: prev.total + 1,
      }));
    },

    onTicketUpdated: (data: { ticketId: string; update: any; timestamp: Date }) => {
      console.log('🎫 Ticket updated:', data);
      setState(prev => ({
        ...prev,
        tickets: prev.tickets.map(ticket =>
          ticket.id === data.ticketId ? { ...ticket, ...data.update } : ticket
        ),
        currentTicket: prev.currentTicket?.id === data.ticketId 
          ? { ...prev.currentTicket, ...data.update }
          : prev.currentTicket,
      }));
    },

    onJoinedTicket: (data: { ticketId: string; message: string }) => {
      console.log('🎫 Joined ticket:', data);
    },

    onLeftTicket: (data: { ticketId: string; message: string }) => {
      console.log('🎫 Left ticket:', data);
    },

    onError: (error: string) => {
      setState(prev => ({ ...prev, error }));
    },
  };

  // Initialize WebSocket
  const socket = useSupportSocket(socketCallbacks);

  // Update socket connection state
  useEffect(() => {
    setState(prev => ({ ...prev, isSocketConnected: socket.isConnected }));
  }, [socket.isConnected]);

  // Load tickets
  const loadTickets = useCallback(async (
    filters: TicketFilters = {},
    page: number = 1,
    refresh: boolean = false
  ) => {
    if (!isAuthenticated || !user?.uid) {
      console.log('🎫 Skipping loadTickets - not authenticated');
      return;
    }

    // Prevent excessive API calls
    const now = Date.now();
    if (!refresh && now - lastFetchTime.current < 1000) {
      console.log('🎫 Skipping loadTickets - too soon');
      return;
    }
    lastFetchTime.current = now;

    try {
      setState(prev => ({
        ...prev,
        isLoading: page === 1 && !refresh,
        isRefreshing: refresh,
        error: null,
      }));

      const params: IQueryTicketsRequest = {
        page,
        limit: state.limit,
        ...filters,
      };

      const data = await SupportAPI.getTickets(params);
      
      setState(prev => ({
        ...prev,
        tickets: page === 1 ? data.tickets : [...prev.tickets, ...data.tickets],
        total: data.total,
        page: data.page,
        totalPages: data.totalPages,
        hasMore: data.hasNext,
        stats: data.stats || null,
        isLoading: false,
        isRefreshing: false,
      }));

    } catch (error: any) {
      console.error('❌ Failed to load tickets:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao carregar tickets',
        isLoading: false,
        isRefreshing: false,
      }));
    }
  }, [isAuthenticated, user?.uid, state.limit]);

  // Load more tickets (pagination)
  const loadMore = useCallback(() => {
    if (state.hasMore && !state.isLoading && state.page < state.totalPages) {
      loadTickets({}, state.page + 1);
    }
  }, [state.hasMore, state.isLoading, state.page, state.totalPages, loadTickets]);

  // Refresh tickets
  const refresh = useCallback(() => {
    if (!isAuthenticated || !user?.uid) return;
    
    setState(prev => ({ ...prev, isRefreshing: true }));
    loadTickets({}, 1, true);
  }, [isAuthenticated, user?.uid, loadTickets]);

  // Create ticket
  const createTicket = useCallback(async (
    ticketData: ICreateTicketRequest,
    files?: File[]
  ): Promise<ITicket> => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      setState(prev => ({ ...prev, isCreating: true, error: null }));

      const ticket = await SupportAPI.createTicket(ticketData, files);

      // Add to local state
      setState(prev => ({
        ...prev,
        tickets: [ticket, ...prev.tickets],
        total: prev.total + 1,
        isCreating: false,
      }));

      return ticket;
    } catch (error: any) {
      console.error('❌ Failed to create ticket:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao criar ticket',
        isCreating: false,
      }));
      throw error;
    }
  }, [user?.uid]);

  // Get ticket details
  const getTicketDetails = useCallback(async (ticketId: string): Promise<ITicketDetails> => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const ticket = await SupportAPI.getTicketById(ticketId);

      setState(prev => ({
        ...prev,
        currentTicket: ticket,
        isLoading: false,
      }));

      // Join ticket room for real-time updates
      if (socket.isConnected) {
        socket.joinTicket(ticketId);
      }

      return ticket;
    } catch (error: any) {
      console.error('❌ Failed to get ticket details:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao carregar detalhes do ticket',
        isLoading: false,
      }));
      throw error;
    }
  }, [user?.uid, socket.isConnected]);

  // Update ticket
  const updateTicket = useCallback(async (
    ticketId: string,
    updateData: IUpdateTicketRequest
  ): Promise<ITicket> => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      setState(prev => ({ ...prev, isUpdating: true, error: null }));

      const updatedTicket = await SupportAPI.updateTicket(ticketId, updateData);

    // Update local state
      setState(prev => ({
        ...prev,
        tickets: prev.tickets.map(ticket =>
          ticket.id === ticketId ? updatedTicket : ticket
        ),
        currentTicket: prev.currentTicket?.id === ticketId 
          ? { ...prev.currentTicket, ...updatedTicket }
          : prev.currentTicket,
        isUpdating: false,
      }));

      return updatedTicket;
    } catch (error: any) {
      console.error('❌ Failed to update ticket:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao atualizar ticket',
        isUpdating: false,
      }));
      throw error;
    }
  }, [user?.uid]);

  // Update ticket status (admin only)
  const updateTicketStatus = useCallback(async (
    ticketId: string,
    statusData: IUpdateTicketStatusRequest
  ): Promise<ITicket> => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      setState(prev => ({ ...prev, isUpdating: true, error: null }));

      const updatedTicket = await SupportAPI.updateTicketStatus(ticketId, statusData);

      // Update local state
      setState(prev => ({
        ...prev,
        tickets: prev.tickets.map(ticket =>
          ticket.id === ticketId ? updatedTicket : ticket
        ),
        currentTicket: prev.currentTicket?.id === ticketId 
          ? { ...prev.currentTicket, ...updatedTicket }
          : prev.currentTicket,
        isUpdating: false,
      }));

      return updatedTicket;
    } catch (error: any) {
      console.error('❌ Failed to update ticket status:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao atualizar status do ticket',
        isUpdating: false,
      }));
      throw error;
    }
  }, [user?.uid]);

  // Add message to ticket
  const addTicketMessage = useCallback(async (
    ticketId: string,
    messageData: IAddTicketMessageRequest,
    files?: File[]
  ): Promise<{ message: string }> => {
    if (!user?.uid) throw new Error('User not authenticated');
    try {
      const result = await SupportAPI.addTicketMessage(ticketId, messageData, files);

      // Refresh ticket details to show new message
      if (state.currentTicket?.id === ticketId) {
        await getTicketDetails(ticketId);
      }

      return result;
    } catch (error: any) {
      console.error('❌ Failed to add ticket message:', error);
      throw error;
    }
  }, [user?.uid, state.currentTicket?.id, getTicketDetails]);

  // Assign ticket (admin only)
  const assignTicket = useCallback(async (
    ticketId: string,
    assigneeId: string
  ): Promise<ITicket> => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      setState(prev => ({ ...prev, isUpdating: true, error: null }));

      const updatedTicket = await SupportAPI.assignTicket(ticketId, assigneeId);

      // Update local state
      setState(prev => ({
        ...prev,
        tickets: prev.tickets.map(ticket =>
          ticket.id === ticketId ? updatedTicket : ticket
        ),
        currentTicket: prev.currentTicket?.id === ticketId 
          ? { ...prev.currentTicket, ...updatedTicket }
          : prev.currentTicket,
        isUpdating: false,
      }));

      return updatedTicket;
    } catch (error: any) {
      console.error('❌ Failed to assign ticket:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao atribuir ticket',
        isUpdating: false,
      }));
      throw error;
    }
  }, [user?.uid]);

  // Get user's tickets (alias for loadTickets with user filter)
  const getMyTickets = useCallback(async (filters: TicketFilters = {}): Promise<ITicketsResponse> => {
    if (!isAuthenticated || !user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const params: IQueryTicketsRequest = {
        page: 1,
        limit: state.limit,
        ...filters,
      };

      const data = await SupportAPI.getTickets(params);
      
      setState(prev => ({
        ...prev,
        tickets: data.tickets,
        total: data.total,
        page: data.page,
        totalPages: data.totalPages,
        hasMore: data.hasNext,
        stats: data.stats || null,
        isLoading: false,
      }));

      return data;
    } catch (error: any) {
      console.error('❌ Failed to get my tickets:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao carregar meus tickets',
        isLoading: false,
      }));
      throw error;
    }
  }, [isAuthenticated, user?.uid, state.limit]);

  // Get ticket by ID (alias for getTicketDetails)
  const getTicketById = useCallback(async (ticketId: string): Promise<ITicketDetails> => {
    return getTicketDetails(ticketId);
  }, [getTicketDetails]);

  // Add message (alias for addTicketMessage with simpler interface)
  const addMessage = useCallback(async (
    ticketId: string,
    messageData: IAddTicketMessageRequest,
    files?: File[]
  ): Promise<{ message: string }> => {
    return addTicketMessage(ticketId, messageData, files);
  }, [addTicketMessage]);

  // Leave current ticket room
  const leaveCurrentTicket = useCallback(() => {
    if (socket.isConnected && state.currentTicket) {
      socket.leaveTicket(state.currentTicket.id);
    }
    setState(prev => ({ ...prev, currentTicket: null }));
  }, [socket.isConnected, state.currentTicket]);

  // Filter tickets
  const getFilteredTickets = useCallback((filters: TicketFilters) => {
    let filtered = [...state.tickets];

    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }

    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [state.tickets]);

  // Initialize tickets on auth
  useEffect(() => {
    let mounted = true;

    const initializeTickets = async () => {
      if (isAuthenticated && user?.uid && mounted) {
        console.log('🎫 Initializing tickets for user:', user.uid);
        try {
          await loadTickets();
        } catch (error) {
          console.error('❌ Failed to initialize tickets:', error);
        }
      }
    };

    initializeTickets();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user?.uid]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveCurrentTicket();
    };
  }, [leaveCurrentTicket]);

  return {
    // State
    ...state,
    
    // Actions
    loadTickets,
    loadMore,
    refresh,
    createTicket,
    getTicketDetails,
    getTicketById,
    getMyTickets,
    updateTicket,
    updateTicketStatus,
    addTicketMessage,
    addMessage,
    assignTicket,
    leaveCurrentTicket,
    getFilteredTickets,
    
    // Socket actions
    connectSocket: socket.connect,
    disconnectSocket: socket.disconnect,
  };
};

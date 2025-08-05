import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { SupportAPI } from '../infrastructure/supportApi';
import {
  IFAQ,
  IFAQsResponse,
  ICreateFAQRequest,
  IUpdateFAQRequest,
  IVoteFAQRequest,
  IQueryFAQsRequest,
  FAQCategory,
} from '../interfaces/support.interface';

export interface FAQsState {
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
    category: FAQCategory;
    count: number;
  }>;
}

export interface FAQFilters {
  category?: FAQCategory;
  tags?: string[];
  isActive?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'order' | 'helpfulCount';
  sortOrder?: 'asc' | 'desc';
}

export const useFAQs = () => {
  const { user, isAuthenticated } = useAuth();
  const lastFetchTime = useRef<number>(0);
  
  const [state, setState] = useState<FAQsState>({
    faqs: [],
    currentFAQ: null,
    isLoading: false,
    isRefreshing: false,
    isCreating: false,
    isUpdating: false,
    isVoting: false,
    error: null,
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasMore: false,
    categories: [],
  });

  // Load FAQs
  const loadFAQs = useCallback(async (
    filters: FAQFilters = {},
    page: number = 1,
    refresh: boolean = false
  ) => {
    // Prevent excessive API calls
    const now = Date.now();
    if (!refresh && now - lastFetchTime.current < 1000) {
      console.log('❓ Skipping loadFAQs - too soon');
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

      const params: IQueryFAQsRequest = {
        page,
        limit: state.limit,
        ...filters,
      };

      const data = await SupportAPI.getFAQs(params);
      
      setState(prev => ({
        ...prev,
        faqs: page === 1 ? data.faqs : [...prev.faqs, ...data.faqs],
        total: data.total,
        page: data.page,
        totalPages: data.totalPages,
        hasMore: data.page < data.totalPages,
        categories: data.categories,
        isLoading: false,
        isRefreshing: false,
      }));

    } catch (error: any) {
      console.error('❌ Failed to load FAQs:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao carregar FAQs',
        isLoading: false,
        isRefreshing: false,
      }));
    }
  }, [state.limit]);

  // Load more FAQs (pagination)
  const loadMore = useCallback(() => {
    if (state.hasMore && !state.isLoading && state.page < state.totalPages) {
      loadFAQs({}, state.page + 1);
    }
  }, [state.hasMore, state.isLoading, state.page, state.totalPages, loadFAQs]);

  // Refresh FAQs
  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, isRefreshing: true }));
    loadFAQs({}, 1, true);
  }, [loadFAQs]);

  // Create FAQ (admin only)
  const createFAQ = useCallback(async (
    faqData: ICreateFAQRequest
  ): Promise<IFAQ> => {
    if (!isAuthenticated || !user?.uid) throw new Error('User not authenticated');

    try {
      setState(prev => ({ ...prev, isCreating: true, error: null }));

      const faq = await SupportAPI.createFAQ(faqData);

      // Add to local state
      setState(prev => ({
        ...prev,
        faqs: [faq, ...prev.faqs],
        total: prev.total + 1,
        isCreating: false,
      }));

      return faq;
    } catch (error: any) {
      console.error('❌ Failed to create FAQ:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao criar FAQ',
        isCreating: false,
      }));
      throw error;
    }
  }, [isAuthenticated, user?.uid]);

  // Get FAQ details
  const getFAQDetails = useCallback(async (faqId: string): Promise<IFAQ> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const faq = await SupportAPI.getFAQById(faqId);

      setState(prev => ({
        ...prev,
        currentFAQ: faq,
        isLoading: false,
      }));

      return faq;
    } catch (error: any) {
      console.error('❌ Failed to get FAQ details:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao carregar detalhes da FAQ',
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  // Update FAQ (admin only)
  const updateFAQ = useCallback(async (
    faqId: string,
    updateData: IUpdateFAQRequest
  ): Promise<IFAQ> => {
    if (!isAuthenticated || !user?.uid) throw new Error('User not authenticated');

    try {
      setState(prev => ({ ...prev, isUpdating: true, error: null }));

      const updatedFAQ = await SupportAPI.updateFAQ(faqId, updateData);

      // Update local state
      setState(prev => ({
        ...prev,
        faqs: prev.faqs.map(faq =>
          faq.id === faqId ? updatedFAQ : faq
        ),
        currentFAQ: prev.currentFAQ?.id === faqId ? updatedFAQ : prev.currentFAQ,
        isUpdating: false,
      }));

      return updatedFAQ;
    } catch (error: any) {
      console.error('❌ Failed to update FAQ:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao atualizar FAQ',
        isUpdating: false,
      }));
      throw error;
    }
  }, [isAuthenticated, user?.uid]);

  // Delete FAQ (admin only)
  const deleteFAQ = useCallback(async (faqId: string): Promise<void> => {
    if (!isAuthenticated || !user?.uid) throw new Error('User not authenticated');

    try {
      setState(prev => ({ ...prev, isUpdating: true, error: null }));

      await SupportAPI.deleteFAQ(faqId);

      // Remove from local state
      setState(prev => ({
        ...prev,
        faqs: prev.faqs.filter(faq => faq.id !== faqId),
        currentFAQ: prev.currentFAQ?.id === faqId ? null : prev.currentFAQ,
        total: Math.max(0, prev.total - 1),
        isUpdating: false,
      }));

    } catch (error: any) {
      console.error('❌ Failed to delete FAQ:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao excluir FAQ',
        isUpdating: false,
      }));
      throw error;
    }
  }, [isAuthenticated, user?.uid]);

  // Vote on FAQ
  const voteFAQ = useCallback(async (
    faqId: string,
    isHelpful: boolean
  ): Promise<void> => {
    if (!isAuthenticated || !user?.uid) throw new Error('User not authenticated');

    try {
      setState(prev => ({ ...prev, isVoting: true, error: null }));

      // Optimistic update
      setState(prev => ({
        ...prev,
        faqs: prev.faqs.map(faq => {
          if (faq.id === faqId) {
            const currentVote = faq.userVote;
            const updatedFAQ = { ...faq };

            // Remove previous vote if exists
            if (currentVote === true) {
              updatedFAQ.helpfulCount = Math.max(0, updatedFAQ.helpfulCount - 1);
            } else if (currentVote === false) {
              updatedFAQ.notHelpfulCount = Math.max(0, updatedFAQ.notHelpfulCount - 1);
            }

            // Add new vote
            if (isHelpful) {
              updatedFAQ.helpfulCount += 1;
            } else {
              updatedFAQ.notHelpfulCount += 1;
            }

            updatedFAQ.userVote = isHelpful;
            return updatedFAQ;
          }
          return faq;
        }),
        currentFAQ: prev.currentFAQ?.id === faqId 
          ? (() => {
              const currentVote = prev.currentFAQ.userVote;
              const updatedFAQ = { ...prev.currentFAQ };

              // Remove previous vote if exists
              if (currentVote === true) {
                updatedFAQ.helpfulCount = Math.max(0, updatedFAQ.helpfulCount - 1);
              } else if (currentVote === false) {
                updatedFAQ.notHelpfulCount = Math.max(0, updatedFAQ.notHelpfulCount - 1);
              }

              // Add new vote
              if (isHelpful) {
                updatedFAQ.helpfulCount += 1;
              } else {
                updatedFAQ.notHelpfulCount += 1;
              }

              updatedFAQ.userVote = isHelpful;
              return updatedFAQ;
            })()
          : prev.currentFAQ,
      }));

      await SupportAPI.voteFAQ(faqId, { isHelpful });

      setState(prev => ({ ...prev, isVoting: false }));

    } catch (error: any) {
      console.error('❌ Failed to vote on FAQ:', error);
      
      // Revert optimistic update on error
      refresh();
      
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao votar na FAQ',
        isVoting: false,
      }));
      throw error;
    }
  }, [isAuthenticated, user?.uid, refresh]);

  // Clear current FAQ
  const clearCurrentFAQ = useCallback(() => {
    setState(prev => ({ ...prev, currentFAQ: null }));
  }, []);

  // Filter FAQs
  const getFilteredFAQs = useCallback((filters: FAQFilters) => {
    let filtered = [...state.faqs];

    if (filters.category) {
      filtered = filtered.filter(faq => faq.category === filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(faq => 
        filters.tags!.some(tag => 
          faq.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())
        )
      );
    }

    if (filters.isActive !== undefined) {
      filtered = filtered.filter(faq => faq.isActive === filters.isActive);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(searchLower) ||
        faq.answer.toLowerCase().includes(searchLower) ||
        faq.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (filters.sortBy) {
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'order':
            aValue = a.order;
            bValue = b.order;
            break;
          case 'helpfulCount':
            aValue = a.helpfulCount;
            bValue = b.helpfulCount;
            break;
          default:
            return 0;
        }

        if (filters.sortOrder === 'desc') {
          return bValue - aValue;
        }
        return aValue - bValue;
      });
    }

    return filtered;
  }, [state.faqs]);

  // Get FAQ categories with counts
  const getFAQCategories = useCallback(() => {
    return state.categories;
  }, [state.categories]);

  // Get popular FAQs (highest helpful count)
  const getPopularFAQs = useCallback((limit: number = 5) => {
    return [...state.faqs]
      .filter(faq => faq.isActive)
      .sort((a, b) => b.helpfulCount - a.helpfulCount)
      .slice(0, limit);
  }, [state.faqs]);

  // Get recent FAQs
  const getRecentFAQs = useCallback((limit: number = 5) => {
    return [...state.faqs]
      .filter(faq => faq.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }, [state.faqs]);

  // Initialize FAQs
  useEffect(() => {
    let mounted = true;

    const initializeFAQs = async () => {
      if (mounted) {
        console.log('❓ Initializing FAQs');
        try {
          await loadFAQs();
        } catch (error) {
          console.error('❌ Failed to initialize FAQs:', error);
        }
      }
    };

    initializeFAQs();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    loadFAQs,
    loadMore,
    refresh,
    createFAQ,
    getFAQDetails,
    updateFAQ,
    deleteFAQ,
    voteFAQ,
    clearCurrentFAQ,
    getFilteredFAQs,
    getFAQCategories,
    getPopularFAQs,
    getRecentFAQs,
  };
};

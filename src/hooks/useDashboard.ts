import { useState, useCallback, useRef } from 'react';
import {
  IDashboardStats,
  IUserAnalyticsListResponse,
  ISessionAnalytics,
  IRecentActivity,
  IDashboardStatsQuery,
  IUserAnalyticsQuery,
  ISessionAnalyticsQuery
} from '../interfaces/dashboard.interface';
import api from '../infrastructure/api';

export const useDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRequests = useRef(new Set<string>());

  const getDashboardStats = useCallback(async (query?: IDashboardStatsQuery): Promise<IDashboardStats> => {

    const requestKey = 'dashboard-stats';

    if (activeRequests.current.has(requestKey)) {
      console.log('Dashboard stats request already in progress, skipping...');
      return Promise.reject(new Error('Request already in progress'));
    }

    try {
      activeRequests.current.add(requestKey);
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (query?.startDate) params.append('startDate', query.startDate.toISOString());
      if (query?.endDate) params.append('endDate', query.endDate.toISOString());
      if (query?.school) params.append('school', query.school);
      if (query?.role) params.append('role', query.role);

      const response = await api.get(`/dashboard/stats?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar estatísticas do dashboard';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      activeRequests.current.delete(requestKey);
      setIsLoading(false);
    }
  }, []);

  const getUserAnalytics = useCallback(async (query?: IUserAnalyticsQuery): Promise<IUserAnalyticsListResponse> => {
    const requestKey = 'user-analytics';

    if (activeRequests.current.has(requestKey)) {
      console.log('User analytics request already in progress, skipping...');
      return Promise.reject(new Error('Request already in progress'));
    }

    try {
      activeRequests.current.add(requestKey);
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (query?.page) params.append('page', query.page.toString());
      if (query?.limit) params.append('limit', query.limit.toString());
      if (query?.role) params.append('role', query.role);
      if (query?.school) params.append('school', query.school);
      if (query?.search) params.append('search', query.search);
      if (query?.isOnline !== undefined) params.append('isOnline', query.isOnline.toString());
      if (query?.sortBy) params.append('sortBy', query.sortBy);
      if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

      const response = await api.get(`/dashboard/users?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar análise de usuários';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);


  const getSessionAnalytics = useCallback(async (query?: ISessionAnalyticsQuery): Promise<ISessionAnalytics> => {
    const requestKey = 'session-analytics';

    if (activeRequests.current.has(requestKey)) {
      console.log('Session analytics request already in progress, skipping...');
      return Promise.reject(new Error('Request already in progress'));
    }

    try {
      activeRequests.current.add(requestKey);
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (query?.startDate) params.append('startDate', query.startDate.toISOString());
      if (query?.endDate) params.append('endDate', query.endDate.toISOString());
      if (query?.status) params.append('status', query.status);
      if (query?.mentorId) params.append('mentorId', query.mentorId);
      if (query?.subject) params.append('subject', query.subject);

      const response = await api.get(`/dashboard/sessions?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar análise de sessões';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      activeRequests.current.delete(requestKey);
      setIsLoading(false);
    }
  }, []);

  const getRecentActivity = useCallback(async (query?: { limit?: number }): Promise<IRecentActivity[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (query?.limit) params.append('limit', query.limit.toString());

      const response = await api.get(`/dashboard/activity?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar atividades recentes';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    getDashboardStats,
    getUserAnalytics,
    getSessionAnalytics,
    getRecentActivity,
    clearError,
  };
};
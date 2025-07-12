import { useAuth } from "../context/AuthContext";
import api from "../infrastructure/api";
import {
  IReportResponse,
  IReportsListResponse,
  IDashboardAnalytics,
  IGenerateReportRequest,
  IExportReportRequest,
  IScheduleReportRequest,
  IExportResult,
  IScheduleResult,
  IChartData,
  IComparisonAnalytics,
  IScheduledReport,
  ReportPeriod,
  ReportType
} from "../interfaces/reports.interface";

export const useReports = () => {
  const { user, getIdToken } = useAuth();

  const getHeaders = async () => {
    const token = await getIdToken();
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }
    return {
      Authorization: `Bearer ${token}`
    };
  };

  // Generate comprehensive report
  const generateReport = async (reportRequest: IGenerateReportRequest): Promise<IReportResponse> => {
    try {
      console.log('🔄 useReports: Generating report:', reportRequest);
      
      const headers = await getHeaders();
      const { data } = await api.post<IReportResponse>('/reports/generate', reportRequest, { headers });
      
      console.log('✅ useReports: Report generated successfully:', data.reportId);
      return data;
    } catch (error: any) {
      console.error('❌ useReports: Failed to generate report:', error);
      throw error;
    }
  };

  // Get all reports with pagination
  const getReports = async (page: number = 1, limit: number = 10): Promise<IReportsListResponse> => {
    try {
      console.log('🔄 useReports: Fetching reports, page:', page);
      
      const headers = await getHeaders();
      const { data } = await api.get<IReportsListResponse>('/reports', {
        params: { page, limit },
        headers
      });
      
      console.log('✅ useReports: Reports fetched successfully:', data.total, 'total reports');
      return data;
    } catch (error: any) {
      console.error('❌ useReports: Failed to fetch reports:', error);
      throw error;
    }
  };

  // Get specific report by ID
  const getReport = async (reportId: string): Promise<IReportResponse> => {
    try {
      console.log('🔄 useReports: Fetching report:', reportId);
      
      const headers = await getHeaders();
      const { data } = await api.get<IReportResponse>(`/reports/${reportId}`, { headers });
      
      console.log('✅ useReports: Report fetched successfully:', data.title);
      return data;
    } catch (error: any) {
      console.error('❌ useReports: Failed to fetch report:', error);
      throw error;
    }
  };

  // Export report in various formats
  const exportReport = async (exportRequest: IExportReportRequest): Promise<IExportResult> => {
    try {
      console.log('🔄 useReports: Exporting report as:', exportRequest.format);
      
      const headers = await getHeaders();
      const { data } = await api.post<IExportResult>('/reports/export', exportRequest, { headers });
      
      console.log('✅ useReports: Report exported successfully:', data.downloadUrl);
      return data;
    } catch (error: any) {
      console.error('❌ useReports: Failed to export report:', error);
      throw error;
    }
  };

  // Schedule automatic report generation
  const scheduleReport = async (scheduleRequest: IScheduleReportRequest): Promise<IScheduleResult> => {
    try {
      console.log('🔄 useReports: Scheduling report:', scheduleRequest.frequency);
      
      const headers = await getHeaders();
      const { data } = await api.post<IScheduleResult>('/reports/schedule', scheduleRequest, { headers });
      
      console.log('✅ useReports: Report scheduled successfully:', data.scheduleId);
      return data;
    } catch (error: any) {
      console.error('❌ useReports: Failed to schedule report:', error);
      throw error;
    }
  };

  // Get scheduled reports
  const getScheduledReports = async (): Promise<IScheduledReport[]> => {
    try {
      console.log('🔄 useReports: Fetching scheduled reports');
      
      const headers = await getHeaders();
      const { data } = await api.get<IScheduledReport[]>('/reports/scheduled/list', { headers });
      
      console.log('✅ useReports: Scheduled reports fetched successfully:', data.length);
      return data;
    } catch (error: any) {
      console.error('❌ useReports: Failed to fetch scheduled reports:', error);
      throw error;
    }
  };

  // Cancel scheduled report
  const cancelScheduledReport = async (scheduleId: string): Promise<{ message: string }> => {
    try {
      console.log('🔄 useReports: Canceling scheduled report:', scheduleId);
      
      const headers = await getHeaders();
      const { data } = await api.delete<{ message: string }>(`/reports/scheduled/${scheduleId}`, { headers });
      
      console.log('✅ useReports: Scheduled report canceled successfully');
      return data;
    } catch (error: any) {
      console.error('❌ useReports: Failed to cancel scheduled report:', error);
      throw error;
    }
  };

  // Get chart data for report visualization
  const getReportCharts = async (reportId: string): Promise<IChartData> => {
    try {
      console.log('🔄 useReports: Fetching chart data for report:', reportId);
      
      const headers = await getHeaders();
      const { data } = await api.get<IChartData>(`/reports/${reportId}/charts`, { headers });
      
      console.log('✅ useReports: Chart data fetched successfully');
      return data;
    } catch (error: any) {
      console.error('❌ useReports: Failed to fetch chart data:', error);
      throw error;
    }
  };

  // Delete report
  const deleteReport = async (reportId: string): Promise<{ message: string }> => {
    try {
      console.log('🔄 useReports: Deleting report:', reportId);
      
      const headers = await getHeaders();
      const { data } = await api.delete<{ message: string }>(`/reports/${reportId}`, { headers });
      
      console.log('✅ useReports: Report deleted successfully');
      return data;
    } catch (error: any) {
      console.error('❌ useReports: Failed to delete report:', error);
      throw error;
    }
  };

  // ✅ QUICK ANALYTICS ENDPOINTS

  // Get dashboard analytics
  const getDashboardAnalytics = async (
    period: ReportPeriod = ReportPeriod.LAST_30_DAYS,
    school?: string
  ): Promise<IDashboardAnalytics> => {
    try {
      console.log('🔄 useReports: Fetching dashboard analytics for period:', period);
      
      const headers = await getHeaders();
      const params: any = { period };
      if (school) params.school = school;
      
      const { data } = await api.get<IDashboardAnalytics>('/reports/analytics/dashboard', {
        params,
        headers
      });
      
      console.log('✅ useReports: Dashboard analytics fetched successfully');
      return data;
    } catch (error: any) {
      console.error('❌ useReports: Failed to fetch dashboard analytics:', error);
      throw error;
    }
  };

  // Get comparison analytics
  const getComparisonAnalytics = async (
    compareBy: 'schools' | 'mentors' | 'subjects',
    period: ReportPeriod = ReportPeriod.LAST_30_DAYS,
    limit: number = 10
  ): Promise<IComparisonAnalytics> => {
    try {
      console.log('🔄 useReports: Fetching comparison analytics:', compareBy);
      
      const headers = await getHeaders();
      const { data } = await api.get<IComparisonAnalytics>('/reports/analytics/comparison', {
        params: { compareBy, period, limit },
        headers
      });
      
      console.log('✅ useReports: Comparison analytics fetched successfully');
      return data;
    } catch (error: any) {
      console.error('❌ useReports: Failed to fetch comparison analytics:', error);
      throw error;
    }
  };

  // Get mentor performance report (for mentors only)
  const getMyPerformance = async (period: ReportPeriod = ReportPeriod.LAST_30_DAYS): Promise<IReportResponse> => {
    try {
      console.log('🔄 useReports: Fetching my performance for period:', period);
      
      const headers = await getHeaders();
      const { data } = await api.get<IReportResponse>('/reports/quick/my-performance', {
        params: { period },
        headers
      });
      
      console.log('✅ useReports: My performance fetched successfully');
      return data;
    } catch (error: any) {
      console.error('❌ useReports: Failed to fetch my performance:', error);
      throw error;
    }
  };

  // Get school overview report (for coordinators only)
  const getSchoolOverview = async (
    school?: string,
    period: ReportPeriod = ReportPeriod.LAST_30_DAYS
  ): Promise<IReportResponse> => {
    try {
      console.log('🔄 useReports: Fetching school overview for:', school || 'all schools');
      
      const headers = await getHeaders();
      const params: any = { period };
      if (school) params.school = school;
      
      const { data } = await api.get<IReportResponse>('/reports/quick/school-overview', {
        params,
        headers
      });
      
      console.log('✅ useReports: School overview fetched successfully');
      return data;
    } catch (error: any) {
      console.error('❌ useReports: Failed to fetch school overview:', error);
      throw error;
    }
  };

  // ✅ HELPER FUNCTIONS

  // Get period label in Portuguese
  const getPeriodLabel = (period: ReportPeriod): string => {
    switch (period) {
      case ReportPeriod.LAST_7_DAYS:
        return 'Últimos 7 dias';
      case ReportPeriod.LAST_30_DAYS:
        return 'Últimos 30 dias';
      case ReportPeriod.LAST_3_MONTHS:
        return 'Últimos 3 meses';
      case ReportPeriod.LAST_6_MONTHS:
        return 'Últimos 6 meses';
      case ReportPeriod.LAST_YEAR:
        return 'Último ano';
      case ReportPeriod.CUSTOM:
        return 'Período personalizado';
      default:
        return 'Período selecionado';
    }
  };

  // Get report type label in Portuguese
  const getReportTypeLabel = (type: ReportType): string => {
    switch (type) {
      case ReportType.MENTORSHIP_OVERVIEW:
        return 'Visão Geral da Mentoria';
      case ReportType.USER_PERFORMANCE:
        return 'Performance dos Usuários';
      case ReportType.SESSION_ANALYTICS:
        return 'Análise de Sessões';
      case ReportType.SCHOOL_COMPARISON:
        return 'Comparação entre Escolas';
      case ReportType.MENTOR_EFFECTIVENESS:
        return 'Efetividade dos Mentores';
      case ReportType.SUBJECT_POPULARITY:
        return 'Popularidade das Disciplinas';
      case ReportType.ENGAGEMENT_METRICS:
        return 'Métricas de Engajamento';
      case ReportType.COMPLETION_RATES:
        return 'Taxas de Conclusão';
      case ReportType.CUSTOM:
        return 'Relatório Personalizado';
      default:
        return 'Relatório';
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 10) / 10}%`;
  };

  // Format hours
  const formatHours = (hours: number): string => {
    return `${Math.round(hours * 10) / 10}h`;
  };

  // Validate report request
  const validateReportRequest = (request: IGenerateReportRequest): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!request.type) {
      errors.push('Tipo de relatório é obrigatório');
    }

    if (!request.period) {
      errors.push('Período é obrigatório');
    }

    if (request.period === ReportPeriod.CUSTOM) {
      if (!request.startDate || !request.endDate) {
        errors.push('Data de início e fim são obrigatórias para período personalizado');
      }
      
      if (request.startDate && request.endDate) {
        const start = new Date(request.startDate);
        const end = new Date(request.endDate);
        
        if (start >= end) {
          errors.push('Data de início deve ser anterior à data de fim');
        }
        
        const diffMonths = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (diffMonths > 12) {
          errors.push('Período não pode ser superior a 12 meses');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return {
    // Core report operations
    generateReport,
    getReports,
    getReport,
    exportReport,
    scheduleReport,
    getScheduledReports,
    cancelScheduledReport,
    getReportCharts,
    deleteReport,

    // Quick analytics
    getDashboardAnalytics,
    getComparisonAnalytics,
    getMyPerformance,
    getSchoolOverview,

    // Helper functions
    getPeriodLabel,
    getReportTypeLabel,
    formatDate,
    formatPercentage,
    formatHours,
    validateReportRequest,
  };
};

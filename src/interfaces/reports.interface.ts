// Report Types and Enums
export enum ReportType {
  MENTORSHIP_OVERVIEW = 'mentorship_overview',
  USER_PERFORMANCE = 'user_performance',
  SESSION_ANALYTICS = 'session_analytics',
  SCHOOL_COMPARISON = 'school_comparison',
  MENTOR_EFFECTIVENESS = 'mentor_effectiveness',
  SUBJECT_POPULARITY = 'subject_popularity',
  ENGAGEMENT_METRICS = 'engagement_metrics',
  COMPLETION_RATES = 'completion_rates',
  CUSTOM = 'custom'
}

export enum ReportPeriod {
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_3_MONTHS = 'last_3_months',
  LAST_6_MONTHS = 'last_6_months',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom'
}

export enum ExportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json'
}

// Core Data Interfaces
export interface IReportMetrics {
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  uniqueParticipants: number;
  activeMentors: number;
  activeMentees: number;
  averageSessionDuration: number;
  totalMentoringHours: number;
  averageRating: number;
  cancelledSessions: number;
}

export interface ISchoolPerformance {
  school: string;
  totalSessions: number;
  completionRate: number;
  averageRating: number;
  activeMentors: number;
  activeMentees: number;
  totalHours: number;
}

export interface IMentorPerformance {
  mentorId: string;
  mentorName: string;
  school: string;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  averageRating: number;
  totalHours: number;
  uniqueMentees: number;
  subjects: string[];
}

export interface ISubjectAnalytics {
  subject: string;
  sessionCount: number;
  averageRating: number;
  completionRate: number;
  totalHours: number;
  uniqueMentors: number;
  uniqueMentees: number;
}

export interface ITrendData {
  period: string;
  sessions: number;
  completedSessions: number;
  uniqueUsers: number;
  totalHours: number;
  averageRating: number;
}

export interface IReportResponse {
  reportId: string;
  title: string;
  type: ReportType;
  startDate: string;
  endDate: string;
  metrics: IReportMetrics;
  schoolPerformance: ISchoolPerformance[];
  topMentors: IMentorPerformance[];
  subjectAnalytics: ISubjectAnalytics[];
  trendData: ITrendData[];
  generatedAt: string;
  generatedBy: string;
  insights?: string;
  keyFindings?: string[];
}

export interface IReportListItem {
  id: string;
  title: string;
  type: ReportType;
  generatedAt: string;
  generatedBy: string;
  status: string;
  downloadUrl?: string;
}

export interface IReportsListResponse {
  reports: IReportListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Request DTOs
export interface IGenerateReportRequest {
  type: ReportType;
  period: ReportPeriod;
  startDate?: string;
  endDate?: string;
  schools?: string[];
  roles?: string[];
  userIds?: string[];
  includeDetails?: boolean;
  includeCharts?: boolean;
  title?: string;
}

export interface IExportReportRequest extends IGenerateReportRequest {
  format: ExportFormat;
  includeBranding?: boolean;
  emailTo?: string[];
}

export interface IScheduleReportRequest extends IGenerateReportRequest {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  dayOfWeek?: number;
  dayOfMonth?: number;
}

// Dashboard Analytics
export interface IDashboardAnalytics {
  metrics: IReportMetrics;
  schoolPerformance?: ISchoolPerformance[];
  topMentors?: IMentorPerformance[];
  subjectAnalytics?: ISubjectAnalytics[];
  generatedAt: string;
}

// Filters and Pagination
export interface IReportFilters {
  type?: ReportType;
  period?: ReportPeriod;
  school?: string;
  startDate?: string;
  endDate?: string;
}

export interface IPaginatedReports {
  reports: IReportListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Export Results
export interface IExportResult {
  downloadUrl: string;
}

export interface IScheduleResult {
  scheduleId: string;
}

// Chart Data
export interface IChartData {
  completionRateChart: any;
  schoolComparisonChart: any;
  subjectPopularityChart: any;
  trendChart: any;
  mentorPerformanceChart: any;
}

// Quick Analytics Types
export interface IComparisonAnalytics {
  compareBy: 'schools' | 'mentors' | 'subjects';
  data: any[];
  period: ReportPeriod;
  generatedAt: string;
}

// Scheduled Reports
export interface IScheduledReport {
  id: string;
  type: ReportType;
  frequency: string;
  recipients: string[];
  createdBy: string;
  createdAt: Date;
  nextRun: Date;
  lastRun?: Date;
  status: 'active' | 'cancelled';
  lastReportId?: string;
  executionCount?: number;
  errorCount?: number;
  lastError?: string;
  lastErrorAt?: Date;
}

import {
  AccessLevel,
  EducationLevel,
  IBulkActionResponse,
  IEducationalResource,
  IMyResourcesFilters,
  IResourceCommentRequest,
  IResourceDownloadResponse,
  IResourceFilters,
  IResourcesListResponse,
  IResourceStats,
  IUpdateResourceRequest,
  IUploadResourceRequest,
  ResourceType
} from '@/src/interfaces/educational-resources.interface';
import { useState } from 'react';
import { useSettingsContext } from '../context/SettingsContext';
import api from '../infrastructure/api';

export const useEducationalResources = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettingsContext();

  const handleApiCall = async <T>(apiCall: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      return result;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro inesperado';
      setError(errorMessage);
      console.error('Educational Resources API Error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get all educational resources (public endpoint)
  const getResources = async (filters?: IResourceFilters): Promise<IResourcesListResponse | null> => {
    return handleApiCall(async () => {
      const params = new URLSearchParams();
      
      if (filters?.search) params.append('search', filters.search);
      if (filters?.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters?.uploader) params.append('uploader', filters.uploader);
      if (filters?.school) params.append('school', filters.school);
      if (filters?.subject) params.append('subject', filters.subject);
      if (filters?.educationLevel) params.append('educationLevel', filters.educationLevel);
      if (filters?.accessLevel) params.append('accessLevel', filters.accessLevel);
      if (filters?.isPublished !== undefined) params.append('isPublished', filters.isPublished.toString());
      if (filters?.minSize) params.append('minSize', filters.minSize.toString());
      if (filters?.maxSize) params.append('maxSize', filters.maxSize.toString());
      if (filters?.minRating) params.append('minRating', filters.minRating.toString());
      if (filters?.maxRating) params.append('maxRating', filters.maxRating.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters?.tags?.length) {
        filters.tags.forEach(tag => params.append('tags', tag));
      }

      const queryString = params.toString();
      const url = queryString ? `/educational-resources?${queryString}` : '/educational-resources';
      
      const response = await api.get(url);
      return response.data;
    });
  };

  // Get my resources (authenticated)
  const getMyResources = async (filters?: IMyResourcesFilters): Promise<IResourcesListResponse | null> => {
    return handleApiCall(async () => {
      const params = new URLSearchParams();
      
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.subject) params.append('subject', filters.subject);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const url = queryString ? `/educational-resources/my-resources?${queryString}` : '/educational-resources/my-resources';
      
      const response = await api.get(url);
      return response.data;
    });
  };

  // Get resource by ID
  const getResourceById = async (resourceId: string): Promise<IEducationalResource | null> => {
    return handleApiCall(async () => {
      const response = await api.get(`/educational-resources/${resourceId}`);
      return response.data;
    });
  };

  // Upload new resource
  const uploadResource = async (
    file: File | { uri: string; name: string; type: string },
    data: IUploadResourceRequest
  ): Promise<IEducationalResource | null> => {
    return handleApiCall(async () => {
      const formData = new FormData();
      
      // Add file
      if ('uri' in file) {
        // React Native file
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any);
      } else {
        // Web file
        formData.append('file', file);
      }

      // Add metadata
      formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      if (data.subject) formData.append('subject', data.subject);
      if (data.educationLevel) formData.append('educationLevel', data.educationLevel);
      formData.append('accessLevel', data.accessLevel);
      if (data.isPublished !== undefined) formData.append('isPublished', data.isPublished.toString());
      if (data.tags?.length) {
        formData.append('tags', data.tags.join(','));
      }

      const response = await api.post('/educational-resources/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    });
  };

  // Update resource
  const updateResource = async (
    resourceId: string,
    data: IUpdateResourceRequest
  ): Promise<IEducationalResource | null> => {
    return handleApiCall(async () => {
      const response = await api.patch(`/educational-resources/${resourceId}`, data);
      return response.data;
    });
  };

  // Delete resource
  const deleteResource = async (resourceId: string): Promise<boolean> => {
    return handleApiCall(async () => {
      await api.delete(`/educational-resources/${resourceId}`);
      return true;
    }) !== null;
  };

  // Publish resource
  const publishResource = async (resourceId: string): Promise<IEducationalResource | null> => {
    return handleApiCall(async () => {
      const response = await api.post(`/educational-resources/${resourceId}/publish`);
      return response.data;
    });
  };

  // Generate download link
  const generateDownloadLink = async (resourceId: string): Promise<IResourceDownloadResponse | null> => {
    return handleApiCall(async () => {
      const response = await api.post(`/educational-resources/${resourceId}/download-link`);
      return response.data;
    });
  };

  // Add comment to resource
  const addComment = async (
    resourceId: string,
    comment: IResourceCommentRequest
  ): Promise<{ id: string; message: string } | null> => {
    return handleApiCall(async () => {
      const response = await api.post(`/educational-resources/${resourceId}/comments`, comment);
      return response.data;
    });
  };

  // Get resource statistics
  const getResourceStats = async (userId?: string): Promise<IResourceStats | null> => {
    return handleApiCall(async () => {
      const url = userId ? `/educational-resources/stats?userId=${userId}` : '/educational-resources/stats';
      const response = await api.get(url);
      return response.data;
    });
  };

  // Get unpublished resources
  const getUnpublishedResources = async (): Promise<IEducationalResource[] | null> => {
    return handleApiCall(async () => {
      const response = await api.get('/educational-resources/unpublished');
      return response.data;
    });
  };

  // Bulk publish resources
  const bulkPublishResources = async (resourceIds: string[]): Promise<IBulkActionResponse | null> => {
    return handleApiCall(async () => {
      const response = await api.post('/educational-resources/bulk/publish', {
        resourceIds,
        userId: '', // Will be set by backend from auth
      });
      return response.data;
    });
  };

  // Bulk delete resources
  const bulkDeleteResources = async (resourceIds: string[]): Promise<{ message: string; deletedCount: number } | null> => {
    return handleApiCall(async () => {
      const response = await api.post('/educational-resources/bulk/delete', {
        resourceIds,
      });
      return response.data;
    });
  };

  // Get search suggestions
  const getSearchSuggestions = async (query: string, type?: string): Promise<{ suggestions: string[] } | null> => {
    return handleApiCall(async () => {
      const params = new URLSearchParams();
      params.append('q', query);
      if (type) params.append('type', type);
      
      const response = await api.get(`/educational-resources/search/suggestions?${params.toString()}`);
      return response.data;
    });
  };

  // Get available subjects
  const getSubjects = async (): Promise<{ subjects: string[] } | null> => {
    return handleApiCall(async () => {
      const response = await api.get('/educational-resources/categories/subjects');
      return response.data;
    });
  };

  // Get popular tags
  const getPopularTags = async (): Promise<{ tags: Array<{ name: string; count: number }> } | null> => {
    return handleApiCall(async () => {
      const response = await api.get('/educational-resources/categories/tags');
      return response.data;
    });
  };

  // Helper functions
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  const getFileTypeIcon = (type: ResourceType): string => {
    switch (type) {
      case ResourceType.PDF:
        return 'document-text';
      case ResourceType.VIDEO:
        return 'videocam';
      case ResourceType.IMAGE:
        return 'image';
      case ResourceType.DOCX:
        return 'document';
      case ResourceType.PPTX:
        return 'easel';
      case ResourceType.XLSX:
        return 'grid';
      case ResourceType.TXT:
        return 'document-text';
      case ResourceType.AUDIO:
        return 'musical-note';
      case ResourceType.ZIP:
        return 'archive';
      default:
        return 'document';
    }
  };

  const getFileTypeColor = (type: ResourceType): string => {
    switch (type) {
      case ResourceType.PDF:
        return '#FF5252';
      case ResourceType.VIDEO:
        return '#4CAF50';
      case ResourceType.IMAGE:
        return '#2196F3';
      case ResourceType.DOCX:
        return '#673AB7';
      case ResourceType.PPTX:
        return '#FF9800';
      case ResourceType.XLSX:
        return '#4CAF50';
      case ResourceType.TXT:
        return '#607D8B';
      case ResourceType.AUDIO:
        return '#9C27B0';
      case ResourceType.ZIP:
        return '#795548';
      default:
        return '#607D8B';
    }
  };

  const canUserUpload = (userRole?: string): boolean => {
    return userRole === 'COORDINATOR' || userRole === 'MENTOR';
  };

  const canUserManage = (userRole?: string): boolean => {
    return userRole === 'COORDINATOR' || userRole === 'MENTOR';
  };

  const canUserSeeStats = (userRole?: string): boolean => {
    return userRole === 'COORDINATOR' || userRole === 'MENTOR';
  };

  return {
    // State
    isLoading,
    error,
    
    // Resource management
    getResources,
    getMyResources,
    getResourceById,
    uploadResource,
    updateResource,
    deleteResource,
    publishResource,
    
    // Downloads and interactions
    generateDownloadLink,
    addComment,
    
    // Statistics and analytics
    getResourceStats,
    getUnpublishedResources,
    
    // Bulk operations
    bulkPublishResources,
    bulkDeleteResources,
    
    // Search and discovery
    getSearchSuggestions,
    getSubjects,
    getPopularTags,
    
    // Helper functions
    formatFileSize,
    formatDuration,
    getFileTypeIcon,
    getFileTypeColor,
    
    // Permission helpers
    canUserUpload,
    canUserManage,
    canUserSeeStats,
    
    // Constants
    ResourceType,
    EducationLevel,
    AccessLevel,
  };
};

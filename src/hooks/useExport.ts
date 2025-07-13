import { useState, useCallback } from 'react';
import { Alert, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ExportFormat, IExportUserDataQuery } from '../interfaces/dashboard.interface';
import api from '../infrastructure/api';

export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const exportUserAnalytics = useCallback(async (
    query: IExportUserDataQuery,
    format: ExportFormat = ExportFormat.CSV
  ) => {
    try {
      setIsExporting(true);
      setExportProgress(0);

      // Prepare query parameters
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.role) params.append('role', query.role);
      if (query.school) params.append('school', query.school);
      if (query.search) params.append('search', query.search);
      if (query.isOnline !== undefined) params.append('isOnline', query.isOnline.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);
      if (query.includePersonalData) params.append('includePersonalData', 'true');
      if (query.includeSessionData) params.append('includeSessionData', 'true');
      params.append('format', format);

      setExportProgress(25);

      // Make API request
      const response = await api.get(`/dashboard/export/users?${params.toString()}`, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setExportProgress(25 + (progress * 0.5)); // 25% to 75%
          }
        },
      });

      setExportProgress(75);

      // Get file extension based on format
      const getFileExtension = (format: ExportFormat) => {
        switch (format) {
          case ExportFormat.CSV: return 'csv';
          case ExportFormat.EXCEL: return 'xlsx';
          case ExportFormat.JSON: return 'json';
          default: return 'csv';
        }
      };

      // Create file name with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `user_analytics_${timestamp}.${getFileExtension(format)}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Convert blob to base64 and save file
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          setExportProgress(90);

          // Check if sharing is available
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(fileUri, {
              mimeType: getMimeType(format),
              dialogTitle: 'Exportar Dados de Usuários',
            });
          } else {
            // Fallback to native share
            await Share.share({
              url: fileUri,
              title: 'Dados de Usuários Exportados',
            });
          }

          setExportProgress(100);

          Alert.alert(
            'Exportação Concluída',
            `Os dados foram exportados com sucesso como ${fileName}`,
            [{ text: 'OK' }]
          );

        } catch (error) {
          console.error('Error saving/sharing file:', error);
          Alert.alert('Erro', 'Falha ao salvar ou compartilhar o arquivo');
        }
      };

      reader.onerror = () => {
        Alert.alert('Erro', 'Falha ao processar os dados exportados');
      };

      reader.readAsDataURL(response.data);

    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert(
        'Erro na Exportação',
        error.response?.data?.message || 'Falha ao exportar dados'
      );
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, []);

  const getMimeType = (format: ExportFormat): string => {
    switch (format) {
      case ExportFormat.CSV:
        return 'text/csv';
      case ExportFormat.EXCEL:
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case ExportFormat.JSON:
        return 'application/json';
      default:
        return 'text/csv';
    }
  };

  const exportSessionAnalytics = useCallback(async (
    query: any,
    format: ExportFormat = ExportFormat.CSV
  ) => {
    try {
      setIsExporting(true);
      setExportProgress(0);

      const params = new URLSearchParams();
      if (query.startDate) params.append('startDate', query.startDate.toISOString());
      if (query.endDate) params.append('endDate', query.endDate.toISOString());
      if (query.status) params.append('status', query.status);
      if (query.mentorId) params.append('mentorId', query.mentorId);
      if (query.subject) params.append('subject', query.subject);
      if (query.school) params.append('school', query.school);
      if (query.search) params.append('search', query.search);
      if (query.isOnline !== undefined) params.append('isOnline', query.isOnline.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);
      if (query.includePersonalData) params.append('includePersonalData', 'true');
      if (query.includeSessionData) params.append('includeSessionData', 'true');
      params.append('format', format);

      setExportProgress(25);

      // Make API request
      const response = await api.get(`/dashboard/export/sessions?${params.toString()}`, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setExportProgress(25 + (progress * 0.5)); // 25% to 75%
          }
        },
      });

      setExportProgress(75);

      // Get file extension based on format
      const getFileExtension = (format: ExportFormat) => {
        switch (format) {
          case ExportFormat.CSV: return 'csv';
          case ExportFormat.EXCEL: return 'xlsx';
          case ExportFormat.JSON: return 'json';
          default: return 'csv';
        }
      };

      // Create file name with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `session_analytics_${timestamp}.${getFileExtension(format)}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Convert blob to base64 and save file
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          setExportProgress(90);

          // Check if sharing is available
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(fileUri, {
              mimeType: getMimeType(format),
              dialogTitle: 'Exportar Dados de Usuários',
            });
          } else {
            // Fallback to native share
            await Share.share({
              url: fileUri,
              title: 'Dados de Usuários Exportados',
            });
          }

          setExportProgress(100);

          Alert.alert(
            'Exportação Concluída',
            `Os dados foram exportados com sucesso como ${fileName}`,
            [{ text: 'OK' }]
          );

        } catch (error) {
          console.error('Error saving/sharing file:', error);
          Alert.alert('Erro', 'Falha ao salvar ou compartilhar o arquivo');
        }
      };

      reader.onerror = () => {
        Alert.alert('Erro', 'Falha ao processar os dados exportados');
      };

      reader.readAsDataURL(response.data);

    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert(
        'Erro na Exportação',
        error.response?.data?.message || 'Falha ao exportar dados'
      );
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, []);

  return {
    isExporting,
    exportUserAnalytics,
    exportSessionAnalytics,
  };
};
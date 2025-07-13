import { useEffect, useRef, useState } from 'react';
import { useDashboardContext } from '../context/DashboardContext';
import { IRealTimeStats } from '../interfaces/dashboard.interface';
import { Socket } from 'socket.io-client';

export const useRealTimeDashboard = (refreshInterval: number = 30000) => {
  const {
    realTimeStats,
    isConnected,
    refreshDashboardStats,
    refreshUserAnalytics,
    refreshSessionAnalytics
  } = useDashboardContext();

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const listenersSetup = useRef(false);

  // Auto-refresh data periodically
  useEffect(() => {
    if (!isConnected || !Socket || listenersSetup.current) return;

    const interval = setInterval(() => {
      refreshDashboardStats();
      refreshUserAnalytics();
      refreshSessionAnalytics();
      setLastUpdate(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isConnected, refreshInterval, refreshDashboardStats, refreshUserAnalytics, refreshSessionAnalytics]);

  // Update last update time when real-time stats change
  useEffect(() => {
    if (realTimeStats) {
      setLastUpdate(new Date(realTimeStats.lastUpdated));
    }
  }, [realTimeStats]);

  const getConnectionStatus = () => {
    if (!isConnected) return { status: 'disconnected', color: 'red', text: 'Desconectado' };
    if (realTimeStats) return { status: 'connected', color: 'green', text: 'Conectado' };
    return { status: 'connecting', color: 'yellow', text: 'Conectando...' };
  };

  const getSystemHealthStatus = () => {
    if (!realTimeStats) return { status: 'unknown', color: 'gray', text: 'Desconhecido' };

    const { systemLoad, errorRate } = realTimeStats;

    if (systemLoad > 80 || errorRate > 5) {
      return { status: 'critical', color: 'red', text: 'Crítico' };
    } else if (systemLoad > 60 || errorRate > 2) {
      return { status: 'warning', color: 'orange', text: 'Atenção' };
    } else {
      return { status: 'healthy', color: 'green', text: 'Saudável' };
    }
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / (24 * 60 * 60));
    const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((uptime % (60 * 60)) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return {
    realTimeStats,
    lastUpdate,
    isConnected,
    connectionStatus: getConnectionStatus(),
    systemHealthStatus: getSystemHealthStatus(),
    formatUptime,
  };
};
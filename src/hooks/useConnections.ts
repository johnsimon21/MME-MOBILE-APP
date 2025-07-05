import { useAuth } from "../context/AuthContext";
import api from "../infrastructure/api";
import {
    IConnectionResponse,
    IConnectionsListResponse,
    IConnectionStats,
    IConnectionSuggestion,
} from "../interfaces/connections.interface";

export const useConnections = () => {
  const { user, getIdToken } = useAuth();

  const getHeaders = async () => {
    const token = await getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    return {
      Authorization: `Bearer ${token}`
    };
  };

  // Send a connection request
  const sendConnectionRequest = async (targetUserId: string): Promise<IConnectionResponse> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const headers = await getHeaders();
      console.log('🔄 Sending connection request for user:', user.uid);
      
      const { data } = await api.post<IConnectionResponse>(
        `/users/${user?.uid}/connections/send`,
        { targetUserId },
        { headers }
      );
      
      console.log('✅ Connection request sent successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error sending connection request:', error);
      throw error;
    }
  };

  // Accept a connection request
  const acceptConnectionRequest = async (connectionId: string): Promise<IConnectionResponse> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const headers = await getHeaders();
      console.log('🔄 Accepting connection request for user:', user.uid);
      
      const { data } = await api.put<IConnectionResponse>(
        `/users/${user?.uid}/connections/${connectionId}/accept`,
        {},
        { headers }
      );
      
      console.log('✅ Connection request accepted successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error accepting connection request:', error);
      throw error;
    }
  };

  // Reject a connection request
  const rejectConnectionRequest = async (connectionId: string): Promise<{ message: string }> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const headers = await getHeaders();
      console.log('🔄 Rejecting connection request for user:', user.uid);
      
      const { data } = await api.put<{ message: string }>(
        `/users/${user?.uid}/connections/${connectionId}/reject`,
        {},
        { headers }
      );
      
      console.log('✅ Connection request rejected successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error rejecting connection request:', error);
      throw error;
    }
  };

  // Block a user
  const blockUser = async (connectionId: string): Promise<IConnectionResponse> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const headers = await getHeaders();
      console.log('🔄 Blocking user for user:', user.uid);
      
      const { data } = await api.put<IConnectionResponse>(
        `/users/${user?.uid}/connections/${connectionId}/block`,
        {},
        { headers }
      );
      
      console.log('✅ User blocked successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error blocking user:', error);
      throw error;
    }
  };

  // Remove a connection
  const removeConnection = async (connectionId: string): Promise<{ message: string }> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const headers = await getHeaders();
      console.log('🔄 Removing connection for user:', user.uid);
      
      const { data } = await api.delete<{ message: string }>(
        `/users/${user?.uid}/connections/${connectionId}`,
        { headers }
      );
      
      console.log('✅ Connection removed successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error removing connection:', error);
      throw error;
    }
  };

  // List all connections (with filters)
  const getConnections = async (params = {}): Promise<IConnectionsListResponse> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const headers = await getHeaders();
      console.log('🔄 Fetching connections for user:', user.uid);
      
      const { data } = await api.get<IConnectionsListResponse>(
        `/users/${user?.uid}/connections`,
        { params, headers }
      );
      
      console.log('✅ Connections fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching connections:', error);
      throw error;
    }
  };

  // Get pending connections
  const getPendingConnections = async (): Promise<IConnectionsListResponse> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const headers = await getHeaders();
      console.log('🔄 Fetching pending connections for user:', user.uid);
      
      const { data } = await api.get<IConnectionsListResponse>(
        `/users/${user?.uid}/connections/pending`,
        { headers }
      );
      
      console.log('✅ Pending connections fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching pending connections:', error);
      throw error;
    }
  };

  // Get friends
  const getFriends = async (): Promise<IConnectionsListResponse> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const headers = await getHeaders();
      console.log('🔄 Fetching friends for user:', user.uid);
      
      const { data } = await api.get<IConnectionsListResponse>(
        `/users/${user?.uid}/connections/friends`,
        { headers }
      );
      
      console.log('✅ Friends fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching friends:', error);
      throw error;
    }
  };

  // Get connection stats
  const getConnectionStats = async (): Promise<IConnectionStats> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const headers = await getHeaders();
      console.log('🔄 Fetching connection stats for user:', user.uid);
      
      const { data } = await api.get<IConnectionStats>(
        `/users/${user?.uid}/connections/stats`,
        { headers }
      );
      
      console.log('✅ Connection stats fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching connection stats:', error);
      throw error;
    }
  };

  // Get connection suggestions
  const getConnectionSuggestions = async (limit?: number): Promise<IConnectionSuggestion[]> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const headers = await getHeaders();
      console.log('🔄 Fetching connection suggestions for user:', user.uid);
      
      const { data } = await api.get<IConnectionSuggestion[]>(
        `/users/${user?.uid}/connections/suggestions`,
        { params: { limit }, headers }
      );
      
      console.log('✅ Connection suggestions fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching connection suggestions:', error);
      throw error;
    }
  };

  // Get mutual connections with another user
  const getMutualConnections = async (otherUserId: string): Promise<IConnectionResponse[]> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const headers = await getHeaders();
      console.log('🔄 Fetching mutual connections for user:', user.uid);
      
      const { data } = await api.get<IConnectionResponse[]>(
        `/users/${user?.uid}/connections/mutual/${otherUserId}`,
        { headers }
      );
      
      console.log('✅ Mutual connections fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching mutual connections:', error);
      throw error;
    }
  };

  return {
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    blockUser,
    removeConnection,
    getConnections,
    getPendingConnections,
    getFriends,
    getConnectionStats,
    getConnectionSuggestions,
    getMutualConnections,
  };
};
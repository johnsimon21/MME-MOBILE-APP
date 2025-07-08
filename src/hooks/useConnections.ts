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

  // ✅ NEW: Cancel a sent connection request
  const cancelConnectionRequest = async (connectionId: string): Promise<{ message: string }> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const headers = await getHeaders();
      console.log('🔄 Canceling connection request for user:', user.uid);

      const { data } = await api.delete<{ message: string }>(
        `/users/${user?.uid}/connections/sent/${connectionId}/cancel`,
        { headers }
      );

      console.log('✅ Connection request canceled successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error canceling connection request:', error);
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

  // ✅ NEW: Unblock a user
  const unblockUser = async (connectionId: string): Promise<{ message: string }> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const headers = await getHeaders();
      console.log('🔄 Unblocking user for user:', user.uid);

      const { data } = await api.delete<{ message: string }>(
        `/users/${user?.uid}/connections/${connectionId}/unblock`,
        { headers }
      );

      console.log('✅ User unblocked successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error unblocking user:', error);
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
  const getConnections = async (userId: string, params = {}): Promise<IConnectionsListResponse> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const headers = await getHeaders();
      console.log('🔄 Fetching connections for user:', user.uid);

      const { data } = await api.get<IConnectionsListResponse>(
        `/users/${userId}/connections`,
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
        `/users/${user?.uid}/connections`,
        { headers }
      );

      console.log('✅ Pending connections fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching pending connections:', error);
      throw error;
    }
  };

  // ✅ NEW: Get sent connection requests
  const getSentRequests = async (): Promise<IConnectionsListResponse> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const headers = await getHeaders();
      console.log('🔄 Fetching sent requests for user:', user.uid);

      const { data } = await api.get<IConnectionsListResponse>(
        `/users/${user?.uid}/connections/pending`,
        {  headers }
      );

      console.log('✅ Sent requests fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching sent requests:', error);
      throw error;
    }
  };

  // ✅ NEW: Get received connection requests
  const getReceivedRequests = async (): Promise<IConnectionsListResponse> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const headers = await getHeaders();
      console.log('🔄 Fetching received requests for user:', user.uid);

      const { data } = await api.get<IConnectionsListResponse>(
        `/users/${user?.uid}/connections`,
        { params: { status: 'pending', type: 'received' }, headers }
      );

      console.log('✅ Received requests fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching received requests:', error);
      throw error;
    }
  };

  // Get accepted connections
  const getAcceptedConnections = async (): Promise<IConnectionsListResponse> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const headers = await getHeaders();
      console.log('🔄 Fetching accepted connections for user:', user.uid);

      const { data } = await api.get<IConnectionsListResponse>(
        `/users/${user?.uid}/connections/friends`,
        { headers }
      );

      console.log('✅ Accepted connections fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching accepted connections:', error);
      throw error;
    }
  };

  // Get user's friends
  const getUserFriends = async (userId: string): Promise<IConnectionsListResponse> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const headers = await getHeaders();
      console.log('🔄 Fetching user friends for user:', userId);

      const { data } = await api.get<IConnectionsListResponse>(
        `/users/${userId}/connections/friends`,
        { headers }
      );

      console.log('✅ User friends fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching user friends:', error);
      throw error;
    }
  };

  // ✅ NEW: Get blocked users
  const getBlockedUsers = async (): Promise<IConnectionsListResponse> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const headers = await getHeaders();
      console.log('🔄 Fetching blocked users for user:', user.uid);

      const { data } = await api.get<IConnectionsListResponse>(
        `/users/${user?.uid}/connections`,
        { params: { status: 'blocked' }, headers }
      );

      console.log('✅ Blocked users fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching blocked users:', error);
      throw error;
    }
  };

  // Get connection statistics
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
  const getConnectionSuggestions = async (limit = 10): Promise<IConnectionSuggestion[]> => {
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

  // ✅ NEW: Get connection status with specific user
  const getConnectionStatus = async (targetUserId: string): Promise<{
    status: string;
    type?: string;
    connectionId?: string;
    canCancel?: boolean;
  }> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const headers = await getHeaders();
      console.log('🔄 Fetching connection status with user:', targetUserId);

      const { data } = await api.get<{
        status: string;
        type?: string;
        connectionId?: string;
        canCancel?: boolean;
      }>(
        `/users/${user?.uid}/connections/status/${targetUserId}`,
        { headers }
      );

      console.log('✅ Connection status fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching connection status:', error);
      throw error;
    }
  };

  // ✅ NEW: Search connections
  const searchConnections = async (searchParams: {
    search?: string;
    status?: 'pending' | 'accepted' | 'blocked';
    type?: 'sent' | 'received';
    page?: number;
    limit?: number;
  }): Promise<IConnectionsListResponse> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const headers = await getHeaders();
      console.log('🔄 Searching connections for user:', user.uid);

      const { data } = await api.get<IConnectionsListResponse>(
        `/users/${user?.uid}/connections`,
        { params: searchParams, headers }
      );

      console.log('✅ Connection search completed successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error searching connections:', error);
      throw error;
    }
  };

  // ✅ NEW: Bulk operations
  const bulkAcceptRequests = async (connectionIds: string[]): Promise<{ message: string; results: any[] }> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const headers = await getHeaders();
      console.log('🔄 Bulk accepting connection requests for user:', user.uid);

      const results = await Promise.allSettled(
        connectionIds.map(id => acceptConnectionRequest(id))
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;

      console.log(`✅ Bulk accept completed: ${successCount} success, ${failureCount} failed`);

      return {
        message: `${successCount} solicitações aceitas, ${failureCount} falharam`,
        results: results
      };
    } catch (error) {
      console.error('❌ Error in bulk accept:', error);
      throw error;
    }
  };

  const bulkRejectRequests = async (connectionIds: string[]): Promise<{ message: string; results: any[] }> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      console.log('🔄 Bulk rejecting connection requests for user:', user.uid);

      const results = await Promise.allSettled(
        connectionIds.map(id => rejectConnectionRequest(id))
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;

      console.log(`✅ Bulk reject completed: ${successCount} success, ${failureCount} failed`);

      return {
        message: `${successCount} solicitações rejeitadas, ${failureCount} falharam`,
        results: results
      };
    } catch (error) {
      console.error('❌ Error in bulk reject:', error);
      throw error;
    }
  };

  return {
    // Basic connection operations
    sendConnectionRequest,
    cancelConnectionRequest, // ✅ NEW
    acceptConnectionRequest,
    rejectConnectionRequest,
    blockUser,
    unblockUser, // ✅ NEW
    removeConnection,

    // Get connections with filters
    getConnections,
    getPendingConnections,
    getSentRequests, // ✅ NEW
    getReceivedRequests, // ✅ NEW
    getAcceptedConnections,
    getUserFriends,
    getBlockedUsers, // ✅ NEW

    // Additional features
    getConnectionStats,
    getConnectionSuggestions,
    getConnectionStatus, // ✅ NEW
    searchConnections, // ✅ NEW

    // Bulk operations
    bulkAcceptRequests, // ✅ NEW
    bulkRejectRequests, // ✅ NEW
  };
};

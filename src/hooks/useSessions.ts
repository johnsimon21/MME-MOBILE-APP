import { useAuth } from "../context/AuthContext";
import api from "../infrastructure/api";
import {
    ISessionResponse,
    ISessionsListResponse,
    ISessionStatsResponse,
    ICreateSessionRequest,
    IUpdateSessionRequest,
    ISessionActionRequest,
    IAddParticipantRequest,
    IRemoveParticipantRequest,
    ISessionQueryParams,
    ISessionStatsQueryParams
} from "../interfaces/sessions.interface";

export const useSessions = () => {
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

    // ✅ Create a new session (mentors only)
    const createSession = async (sessionData: ICreateSessionRequest): Promise<ISessionResponse> => {
        try {
            console.log('🔄 Creating session:', sessionData);

            const headers = await getHeaders();
            const { data } = await api.post<ISessionResponse>(
                '/sessions',
                sessionData,
                { headers }
            );

            console.log('✅ Session created successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Error creating session:', error);
            throw error;
        }
    };

    // ✅ Get sessions with filters
    const getSessions = async (params: ISessionQueryParams = {}): Promise<ISessionsListResponse> => {
        try {
            console.log('🔄 Fetching sessions with params:', params);

            const headers = await getHeaders();
            const { data } = await api.get<ISessionsListResponse>(
                '/sessions',
                { params, headers }
            );

            console.log('✅✅✅✅✅ Sessions fetched successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Error fetching sessions:', error);
            throw error;
        }
    };

    // ✅ Get session statistics
    const getSessionStats = async (params: ISessionStatsQueryParams = {}): Promise<ISessionStatsResponse> => {
        try {
            console.log('🔄 Fetching session stats with params:', params);

            const headers = await getHeaders();
            const { data } = await api.get<ISessionStatsResponse>(
                '/sessions/stats',
                { params, headers }
            );

            console.log('✅ Session stats fetched successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Error fetching session stats:', error);
            throw error;
        }
    };

    // ✅ Get session by ID
    const getSessionById = async (sessionId: string): Promise<ISessionResponse> => {
        try {
            console.log('🔄 Fetching session by ID:', sessionId);

            const headers = await getHeaders();
            const { data } = await api.get<ISessionResponse>(
                `/sessions/${sessionId}`,
                { headers }
            );

            console.log('✅ Session fetched successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Error fetching session:', error);
            throw error;
        }
    };

    // ✅ Update session
    const updateSession = async (sessionId: string, updateData: IUpdateSessionRequest): Promise<ISessionResponse> => {
        try {
            console.log('🔄 Updating session:', sessionId, updateData);

            const headers = await getHeaders();
            const { data } = await api.put<ISessionResponse>(
                `/sessions/${sessionId}`,
                updateData,
                { headers }
            );

            console.log('✅ Session updated successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Error updating session:', error);
            throw error;
        }
    };

    // ✅ Perform session action (start, pause, resume, end, cancel)
    const performSessionAction = async (sessionId: string, action: ISessionActionRequest): Promise<ISessionResponse> => {
        try {
            console.log('🔄 Performing session action:', sessionId, action);

            const headers = await getHeaders();
            const { data } = await api.post<ISessionResponse>(
                `/sessions/${sessionId}/actions`,
                action,
                { headers }
            );

            console.log('✅ Session action performed successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Error performing session action:', error);
            throw error;
        }
    };

    // ✅ Add participant to session
    const addParticipant = async (sessionId: string, participantData: IAddParticipantRequest): Promise<ISessionResponse> => {
        try {
            console.log('🔄 Adding participant to session:', sessionId, participantData);

            const headers = await getHeaders();
            const { data } = await api.post<ISessionResponse>(
                `/sessions/${sessionId}/participants`,
                participantData,
                { headers }
            );

            console.log('✅ Participant added successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Error adding participant:', error);
            throw error;
        }
    };

    // ✅ Remove participant from session
    const removeParticipant = async (
        sessionId: string,
        menteeId: string,
        removeData: IRemoveParticipantRequest
    ): Promise<ISessionResponse> => {
        try {
            console.log('🔄 Removing participant from session:', sessionId, menteeId, removeData);

            const headers = await getHeaders();
            const { data } = await api.delete<ISessionResponse>(
                `/sessions/${sessionId}/participants/${menteeId}`,
                {
                    headers,
                    data: removeData
                }
            );

            console.log('✅ Participant removed successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Error removing participant:', error);
            throw error;
        }
    };

    // ✅ Delete/Cancel session
    const deleteSession = async (sessionId: string): Promise<{ message: string }> => {
        try {
            console.log('🔄 Deleting session:', sessionId);

            const headers = await getHeaders();
            const { data } = await api.delete<{ message: string }>(
                `/sessions/${sessionId}`,
                { headers }
            );

            console.log('✅ Session deleted successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Error deleting session:', error);
            throw error;
        }
    };

    // ✅ Get my sessions (as mentor)
    const getMySessions = async (params: ISessionQueryParams = {}): Promise<ISessionsListResponse> => {
        try {
            if (!user?.uid) {
                throw new Error('User not authenticated');
            }

            console.log('🔄 Fetching my sessions as mentor');

            const headers = await getHeaders();
            const { data } = await api.get<ISessionsListResponse>(
                '/sessions',
                {
                    params: {
                        ...params,
                        // Backend will automatically filter by mentor for mentor role
                    },
                    headers
                }
            );

            console.log('✅ My sessions fetched successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Error fetching my sessions:', error);
            throw error;
        }
    };

    // ✅ Get sessions I'm participating in (as mentee)
    const getMyParticipations = async (params: ISessionQueryParams = {}): Promise<ISessionsListResponse> => {
        try {
            if (!user?.uid) {
                throw new Error('User not authenticated');
            }

            console.log('🔄 Fetching my participations as mentee');

            const headers = await getHeaders();
            const { data } = await api.get<ISessionsListResponse>(
                '/sessions',
                {
                    params: {
                        ...params,
                        // Backend will automatically filter by mentee for mentee role
                    },
                    headers
                }
            );

            console.log('✅ My participations fetched successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Error fetching my participations:', error);
            throw error;
        }
    };

    // ✅ Get upcoming sessions
    const getUpcomingSessions = async (limit = 10): Promise<ISessionsListResponse> => {
        try {
            console.log('🔄 Fetching upcoming sessions');

            const headers = await getHeaders();
            const { data } = await api.get<ISessionsListResponse>(
                '/sessions',
                {
                    params: {
                        status: 'scheduled',
                        sortBy: 'scheduledAt',
                        sortOrder: 'asc',
                        limit,
                        dateFrom: new Date().toISOString()
                    },
                    headers
                }
            );

            console.log('✅ Upcoming sessions fetched successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Error fetching upcoming sessions:', error);
            throw error;
        }
    };

    // ✅ Get active sessions
    const getActiveSessions = async (): Promise<ISessionsListResponse> => {
        try {
            console.log('🔄 Fetching active sessions');

            const headers = await getHeaders();
            const { data } = await api.get<ISessionsListResponse>(
                '/sessions',
                {
                    params: {
                        status: 'active',
                        sortBy: 'startedAt',
                        sortOrder: 'desc'
                    },
                    headers
                }
            );

            console.log('✅ Active sessions fetched successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Error fetching active sessions:', error);
            throw error;
        }
    };

    // ✅ Get completed sessions
    const getCompletedSessions = async (params: ISessionQueryParams = {}): Promise<ISessionsListResponse> => {
        try {
            console.log('🔄 Fetching completed sessions');

            const headers = await getHeaders();
            const { data } = await api.get<ISessionsListResponse>(
                '/sessions',
                {
                    params: {
                        ...params,
                        status: 'completed',
                        sortBy: 'endedAt',
                        sortOrder: 'desc'
                    },
                    headers
                }
            );

            console.log('✅ Completed sessions fetched successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Error fetching completed sessions:', error);
            throw error;
        }
    };

    // ✅ Search sessions
    const searchSessions = async (searchParams: {
        search?: string;
        status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
        type?: 'individual' | 'group' | 'workshop';
        subject?: string;
        dateFrom?: string;
        dateTo?: string;
        page?: number;
        limit?: number;
    }): Promise<ISessionsListResponse> => {
        try {
            console.log('🔄 Searching sessions with params:', searchParams);

            const headers = await getHeaders();
            const { data } = await api.get<ISessionsListResponse>(
                '/sessions',
                { params: searchParams, headers }
            );

            console.log('✅ Session search completed successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Error searching sessions:', error);
            throw error;
        }
    };

    // ✅ Quick session actions
    const startSession = async (sessionId: string): Promise<ISessionResponse> => {
        return performSessionAction(sessionId, { action: 'start' });
    };

    const pauseSession = async (sessionId: string): Promise<ISessionResponse> => {
        return performSessionAction(sessionId, { action: 'pause' });
    };

    const resumeSession = async (sessionId: string): Promise<ISessionResponse> => {
        return performSessionAction(sessionId, { action: 'resume' });
    };

    const endSession = async (sessionId: string): Promise<ISessionResponse> => {
        return performSessionAction(sessionId, { action: 'end' });
    };

    const cancelSession = async (sessionId: string, reason?: string): Promise<ISessionResponse> => {
        return performSessionAction(sessionId, { action: 'cancel', reason });
    };

    // ✅ Bulk operations
    const bulkUpdateSessions = async (
        sessionIds: string[],
        updateData: IUpdateSessionRequest
    ): Promise<{ results: ISessionResponse[]; errors: any[] }> => {
        try {
            console.log('🔄 Bulk updating sessions:', sessionIds.length);

            const results = await Promise.allSettled(
                sessionIds.map(id => updateSession(id, updateData))
            );

            const successful = results
                .filter(r => r.status === 'fulfilled')
                .map(r => (r as PromiseFulfilledResult<ISessionResponse>).value);

            const errors = results
                .filter(r => r.status === 'rejected')
                .map(r => (r as PromiseRejectedResult).reason);

            console.log(`✅ Bulk update completed: ${successful.length} success, ${errors.length} failed`);

            return { results: successful, errors };
        } catch (error: any) {
            console.error('❌ Error in bulk update:', error);
            throw error;
        }
    };

    const bulkCancelSessions = async (
        sessionIds: string[],
        reason?: string
    ): Promise<{ results: ISessionResponse[]; errors: any[] }> => {
        try {
            console.log('🔄 Bulk canceling sessions:', sessionIds.length);

            const results = await Promise.allSettled(
                sessionIds.map(id => cancelSession(id, reason))
            );

            const successful = results
                .filter(r => r.status === 'fulfilled')
                .map(r => (r as PromiseFulfilledResult<ISessionResponse>).value);

            const errors = results
                .filter(r => r.status === 'rejected')
                .map(r => (r as PromiseRejectedResult).reason);

            console.log(`✅ Bulk cancel completed: ${successful.length} success, ${errors.length} failed`);

            return { results: successful, errors };
        } catch (error: any) {
            console.error('❌ Error in bulk cancel:', error);
            throw error;
        }
    };

    return {
        // Core CRUD operations
        createSession,
        getSessions,
        getSessionById,
        updateSession,
        deleteSession,

        // Session actions
        performSessionAction,
        startSession,
        pauseSession,
        resumeSession,
        endSession,
        cancelSession,

        // Participant management
        addParticipant,
        removeParticipant,

        // Filtered queries
        getMySessions,
        getMyParticipations,
        getUpcomingSessions,
        getActiveSessions,
        getCompletedSessions,
        searchSessions,

        // Statistics
        getSessionStats,

        // Bulk operations
        bulkUpdateSessions,
        bulkCancelSessions,
    };
};


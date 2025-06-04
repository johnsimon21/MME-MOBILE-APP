import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the Session type
export interface Session {
  id: string;
  name: string;
  description: string;
  status: "Nova" | "Concluída";
  scheduledDate: string;
  completedDate?: string;
  type?: string;
  participantId?: string;
  participantName?: string;
  duration?: number;
}

const SESSIONS_STORAGE_KEY = 'mme_sessions';

// Get all sessions
export const getSessions = async (): Promise<Session[]> => {
  try {
    const sessionsJson = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
    return sessionsJson ? JSON.parse(sessionsJson) : [];
  } catch (error) {
    console.error('Error getting sessions:', error);
    return [];
  }
};

// Add a new session
export const addSession = async (session: Session): Promise<void> => {
  try {
    // Get current sessions
    const sessions = await getSessions();
    console.log("Current sessions count:", sessions.length);
    
    // Add new session to the beginning
    const updatedSessions = [session, ...sessions];
    
    // Save updated sessions
    await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
    
    console.log("Session added successfully. New count:", updatedSessions.length);
  } catch (error) {
    console.error('Error adding session:', error);
  }
};
// Update a session
export const updateSession = async (updatedSession: Session): Promise<void> => {
  try {
    const sessions = await getSessions();
    const index = sessions.findIndex(s => s.id === updatedSession.id);
    
    if (index !== -1) {
      sessions[index] = updatedSession;
      await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    }
  } catch (error) {
    console.error('Error updating session:', error);
  }
};

// Delete a session
export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    const sessions = await getSessions();
    const filteredSessions = sessions.filter(s => s.id !== sessionId);
    await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(filteredSessions));
  } catch (error) {
    console.error('Error deleting session:', error);
  }
};
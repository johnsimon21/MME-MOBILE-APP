import { useAuth } from "../context/AuthContext";
import { AuthState } from "../interfaces/auth.interface";

export const useAuthState = (): AuthState => {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  return {
    user,
    isLoading,
    isAuthenticated,
    isCoordinator: user?.role === 'coordinator',
    isMentor: user?.role === 'mentor',
    isMentee: user?.role === 'mentee',
  };
};
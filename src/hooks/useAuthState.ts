import { useAuth } from "../context/AuthContext";
import { AuthState } from "../interfaces/auth.interface";
import { UserRole } from "../interfaces/index.interface";

export const useAuthState = (): AuthState & {
  isMentor: boolean;
  isMentee: boolean;
  isCoordinator: boolean;
} => {
  
  const { user, isLoading, isAuthenticated } = useAuth();
  
  return {
    user,
    isLoading,
    isAuthenticated,
    isCoordinator: user?.role === UserRole.COORDINATOR,
    isMentor: user?.role === UserRole.MENTOR,
    isMentee: user?.role === UserRole.MENTEE,
  };
};
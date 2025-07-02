import { useAuth } from '../context/AuthContext';

export const useAuthState = () => {
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import type { 
  LoginDto, 
  RegisterDto, 
  ForgotPasswordDto, 
  ResetPasswordDto 
} from '../infrastructure/api/generated/model';

export const useAuthMutations = () => {
  const { login, register, logout, forgotPassword, resetPassword } = useAuth();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginDto) => login(credentials.email, credentials.password),
    onSuccess: () => {
      // Invalidate and refetch any queries that depend on auth
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      console.error('Login mutation error:', error);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: RegisterDto) => register(userData),
    onSuccess: () => {
      console.log('Registration successful');
    },
    onError: (error) => {
      console.error('Registration mutation error:', error);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
    },
    onError: (error) => {
      console.error('Logout mutation error:', error);
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (emailData: ForgotPasswordDto) => forgotPassword(emailData.email),
    onError: (error) => {
      console.error('Forgot password mutation error:', error);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, data }: { token: string; data: ResetPasswordDto }) => 
      resetPassword(token, data),
    onError: (error) => {
      console.error('Reset password mutation error:', error);
    },
  });

  return {
    loginMutation,
    registerMutation,
    logoutMutation,
    forgotPasswordMutation,
    resetPasswordMutation,
  };
};
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import tw from 'twrnc';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredRoles?: ('mentor' | 'mentee' | 'coordinator')[];
  loadingComponent?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  requiredRoles,
  loadingComponent,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      router.replace('/auth/LoginScreen');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return (
      loadingComponent || (
        <View style={tw`flex-1 justify-center items-center bg-white`}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={tw`mt-4 text-base text-gray-600`}>Carregando...</Text>
        </View>
      )
    );
  }

  // Check authentication
  if (!isAuthenticated || !user) {
    return (
      fallback || (
        <View style={tw`flex-1 justify-center items-center bg-white p-5`}>
          <Text style={tw`text-lg font-bold text-red-600 text-center mb-2`}>
            Acesso negado
          </Text>
          <Text style={tw`text-sm text-gray-600 text-center`}>
            Você precisa estar logado para acessar esta área.
          </Text>
        </View>
      )
    );
  }

  // Check role permissions
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = user.role && requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      return (
        fallback || (
          <View style={tw`flex-1 justify-center items-center bg-white p-5`}>
            <Text style={tw`text-lg font-bold text-red-600 text-center mb-2`}>
              Permissão insuficiente
            </Text>
            <Text style={tw`text-sm text-gray-600 text-center`}>
              Você não tem permissão para acessar esta área.
            </Text>
            <Text style={tw`text-xs text-gray-500 text-center mt-2`}>
              Seu perfil: {user.role}
            </Text>
          </View>
        )
      );
    }
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
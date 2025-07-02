import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import tw from 'twrnc';

export default function InitialScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        console.log('✅ User authenticated, redirecting to main app');
        router.replace('/(tabs)');
      } else {
        console.log('❌ User not authenticated, redirecting to login');
        router.replace('/auth/LoginScreen');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <View style={tw`flex-1 justify-center items-center bg-white`}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={tw`mt-4 text-base text-gray-600`}>
        {isLoading ? 'Verificando autenticação...' : 'Carregando...'}
      </Text>
      
      {__DEV__ && (
        <View style={tw`mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg mx-4`}>
          <Text style={tw`text-blue-800 text-xs font-semibold mb-2`}>
            🔥 Firebase Status
          </Text>
          <Text style={tw`text-blue-700 text-xs`}>
            • Autenticação: {isAuthenticated ? '✅ Ativo' : '❌ Inativo'}{'\n'}
            • Carregando: {isLoading ? '⏳ Sim' : '✅ Não'}{'\n'}
            • Usuário: {user ? `✅ ${user.email}` : '❌ Nenhum'}
          </Text>
        </View>
      )}
    </View>
  );
}
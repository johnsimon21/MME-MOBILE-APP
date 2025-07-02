import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  signInWithCustomToken,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import {
  getAuthentication,
  AuthVerifyTokenResult
} from '../infrastructure/api/generated/authentication/authentication';
import { AuthResetPasswordParams, ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from '../infrastructure/api/generated/model';

// Types matching your backend
export interface User {
  uid: string;
  email: string;
  fullName: string;
  role: 'mentor' | 'mentee' | 'coordinator';
  school: string;
  // Add other user fields from your backend
  cellphone?: string;
  birth?: Date;
  gender?: string;
  municipality?: string;
  province?: string;
  image?: string;
}

export interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  idToken: string | null;
}

export interface AuthContextType extends AuthState {
  // Auth actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, data: ResetPasswordDto) => Promise<void>;

  // Utility functions
  refreshUser: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  clearError: () => void;

  // Error state
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    firebaseUser: null,
    isLoading: true,
    isAuthenticated: false,
    idToken: null,
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Get API functions
  const api = getAuthentication();

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Firebase auth state changed:', firebaseUser?.uid);

      if (firebaseUser) {
        try {
          // Get ID token
          const idToken = await firebaseUser.getIdToken();

          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data() as User;

            setState({
              user: userData,
              firebaseUser,
              isLoading: false,
              isAuthenticated: true,
              idToken,
            });

            console.log('✅ User authenticated:', userData.email);
          } else {
            console.warn('⚠️ User document not found in Firestore');
            setState({
              user: null,
              firebaseUser: null,
              isLoading: false,
              isAuthenticated: false,
              idToken: null,
            });
          }
        } catch (error) {
          console.error('❌ Error getting user data:', error);
          setState({
            user: null,
            firebaseUser: null,
            isLoading: false,
            isAuthenticated: false,
            idToken: null,
          });
        }
      } else {
        setState({
          user: null,
          firebaseUser: null,
          isLoading: false,
          isAuthenticated: false,
          idToken: null,
        });
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setState(prev => ({ ...prev, isLoading: true }));

      console.log('🔄 Iniciando login com Firebase...', email+"-----"+password);

      // 🔑 Etapa 1: Login com Firebase Auth (direto)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      console.log('✅ Firebase login bem-sucedido:', firebaseUser.uid);

      // 🔐 Etapa 2: Obter ID Token (JWT)
      const idToken = await firebaseUser.getIdToken();

      // 📦 Etapa 3: Buscar dados do usuário no Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        throw new Error('Dados do usuário não encontrados no Firestore');
      }

      const userData = userDoc.data() as User;

      // Atualizar estado global
      setState({
        user: userData,
        firebaseUser,
        isLoading: false,
        isAuthenticated: true,
        idToken,
      });

      console.log('✅ Login completo:', userData.email);

      // Redirecionar
      router.replace('/(tabs)');
      return true;
    } catch (error: any) {
      console.error('❌ Falha no login:', error);
      setState(prev => ({ ...prev, isLoading: false }));

      let errorMessage = 'Erro ao fazer login';

      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = 'E-mail ou senha incorretos';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Erro de conexão. Verifique sua internet.';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      } else {
        errorMessage = error.message || errorMessage;
      }

      setError(errorMessage);
      Alert.alert('Erro no Login', errorMessage);
      return false;
    }
  };

  const register = async (userData: RegisterDto) => {
    try {
      setError(null);
      setState(prev => ({ ...prev, isLoading: true }));

      const response = await api.authRegister(userData);
      console.log('✅ Registration successful:', response);

      setState(prev => ({ ...prev, isLoading: false }));

      Alert.alert(
        'Cadastro Realizado',
        'Sua conta foi criada com sucesso! Faça login para continuar.',
        [{
          text: 'OK',
          onPress: () => router.push('/auth/LoginScreen')
        }]
      );
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      setState(prev => ({ ...prev, isLoading: false }));

      const errorMessage = error.response?.data?.message || 'Erro ao criar conta';
      setError(errorMessage);
      Alert.alert('Erro no Cadastro', errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Sign out from Firebase
      await signOut(auth);

      setState({
        user: null,
        firebaseUser: null,
        isLoading: false,
        isAuthenticated: false,
        idToken: null,
      });

      setError(null);
      console.log('✅ Logout successful');

      // Navigate to login
      router.replace('/auth/LoginScreen');
    } catch (error) {
      console.error('❌ Logout error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setError(null);
      const emailData: ForgotPasswordDto = { email };
      const response = await api.authForgotPassword(emailData);

      Alert.alert(
        'Email Enviado',
        response.message || 'Verifique seu email para redefinir a senha.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('❌ Forgot password failed:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao enviar email';
      setError(errorMessage);
      Alert.alert('Erro', errorMessage);
      throw error;
    }
  };

  const resetPassword = async (token: string, data: ResetPasswordDto) => {
    try {
      setError(null);
      const params: AuthResetPasswordParams = { token };
      const response = await api.authResetPassword(data, params);

      Alert.alert(
        'Senha Redefinida',
        response.message || 'Sua senha foi redefinida com sucesso!',
        [{
          text: 'OK',
          onPress: () => router.push('/auth/LoginScreen')
        }]
      );
    } catch (error: any) {
      console.error('❌ Reset password failed:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao redefinir senha';
      setError(errorMessage);
      Alert.alert('Erro', errorMessage);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      if (state.firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', state.firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setState(prev => ({ ...prev, user: userData }));
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    try {
      if (state.firebaseUser) {
        return await state.firebaseUser.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue: AuthContextType = {
    ...state,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    refreshUser,
    getIdToken,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
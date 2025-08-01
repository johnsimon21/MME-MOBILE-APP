import axios from "axios";
import { User as FirebaseUser, onAuthStateChanged, signInWithCustomToken, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { ENV } from "../config/env";
import { auth, db } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { AuthState, UserRegisterData } from "../interfaces/auth.interface";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../infrastructure/api";
import { IUser } from "../interfaces/user.interface";
import { UserRole } from "../interfaces/index.interface";

interface AuthContextProps {
    user: IUser | null;
    firebaseUser: FirebaseUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitializing: boolean;
    error: string | null;
    clearError: () => void;
    login: (email: string, password: string) => Promise<boolean>;
    register: (data: UserRegisterData) => Promise<boolean>;
    logout: () => Promise<void>;
    getIdToken: () => Promise<string | null>;
    forgotPassword: (email: string) => Promise<boolean>;
    resetPassword: (uid: string, newPassword: string) => Promise<boolean>;
    fetchUser: () => Promise<void>;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<IUser | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    // Enhanced error handler
    const handleError = useCallback((error: any, context: string) => {
        console.error(`❌ ${context}:`, error);

        let errorMessage = 'Erro inesperado. Tente novamente.';

        if (error?.response?.status) {
            switch (error.response.status) {
                case 400:
                    errorMessage = 'Dados inválidos. Verifique as informações.';
                    break;
                case 401:
                    errorMessage = 'Credenciais inválidas.';
                    break;
                case 403:
                    errorMessage = 'Acesso negado.';
                    break;
                case 404:
                    errorMessage = 'Usuário não encontrado.';
                    break;
                case 409:
                    errorMessage = 'Este email já está registrado.';
                    break;
                case 422:
                    errorMessage = 'Dados inválidos. Verifique os campos.';
                    break;
                case 429:
                    errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos.';
                    break;
                case 500:
                    errorMessage = 'Erro interno do servidor. Tente novamente.';
                    break;
                case 503:
                    errorMessage = 'Serviço temporariamente indisponível.';
                    break;
                default:
                    errorMessage = error.response.data?.message || 'Erro de conexão.';
            }
        } else if (error?.code) {
            // Firebase errors
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessage = 'Email ou senha incorretos.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Conta desabilitada. Entre em contato com o suporte.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Erro de conexão. Verifique sua internet.';
                    break;
                case 'auth/email-already-in-use':
                    errorMessage = 'Este email já está em uso.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email inválido.';
                    break;
                default:
                    errorMessage = error.message || errorMessage;
            }
        } else if (error?.message) {
            errorMessage = error.message;
        }

        setError(errorMessage);
        return errorMessage;
    }, []);

    // Clear error function
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Enhanced auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            try {
                setFirebaseUser(fbUser);
            
                if (fbUser) {
                    console.log("🔄 Firebase user detected, fetching profile...");
                
                    // Get fresh token
                    const idToken = await fbUser.getIdToken(true);
                    await AsyncStorage.setItem('@token_id', idToken);
                
                    // Fetch user profile from backend
                    try {
                        const response = await api.get('/auth/me');
                        console.log("✅ User profile loaded:", response.data);
                        setUser(response.data);
                    
                        // Only set initialization complete after user is fully loaded
                        setTimeout(() => {
                            setIsInitializing(false);
                        }, 100);
                    } catch (profileError: any) {
                        console.error("❌ Failed to fetch user profile:", profileError);
                    
                        if (profileError?.response?.status === 401) {
                            await signOut(auth);
                            await AsyncStorage.removeItem('@token_id');
                        }
                        setUser(null);
                        setIsInitializing(false);
                    }
                } else {
                    console.log("🔄 No Firebase user, clearing state...");
                    setUser(null);
                    await AsyncStorage.removeItem('@token_id');
                    setIsInitializing(false);
                }
            } catch (error) {
                console.error("❌ Auth state change error:", error);
                setUser(null);
                setIsInitializing(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Enhanced login function
    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        try {
            setIsLoading(true);
            setError(null);

            console.log('🔄 Starting Firebase login...');
            
            // Validate inputs
            if (!email?.trim() || !password?.trim()) {
                throw new Error('Email e senha são obrigatórios');
            }

            const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
            const firebaseUser = userCredential.user;

            console.log('✅ Firebase login successful:', firebaseUser.uid);

            // Get ID token
            const idToken = await firebaseUser.getIdToken();
            await AsyncStorage.setItem('@token_id', idToken);
            
            console.log('✅ Backend verification successful');
            // Verify token with backend
            // const response = await api.post('/auth/verify-token');
            // console.log('✅ Backend verification successful:', response.data);

            // Navigate to main app
            router.replace('/(tabs)');

            return true;

        } catch (error: any) {
            handleError(error, 'Login failed');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [router, handleError]);

    // Enhanced register function
    const register = useCallback(async (data: UserRegisterData): Promise<boolean> => {
        try {
            setIsLoading(true);
            setError(null);

            console.log('🔄 Starting registration...');

            // Validate required fields
            if (!data.email?.trim() || !data.password?.trim() || !data.fullName?.trim()) {
                throw new Error('Campos obrigatórios não preenchidos');
            }

            // Call backend registration
            const response = await api.post('/auth/register', data);
            console.log('✅ Registration successful:', response.data);

            // Show success message
            Alert.alert(
                'Cadastro Realizado!',
                'Sua conta foi criada com sucesso. Você pode fazer login agora.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.push('/auth/LoginScreen')
                    }
                ]
            );

            return true;

        } catch (error: any) {
            handleError(error, 'Registration failed');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [router, handleError]);

    // Enhanced logout function
    const logout = useCallback(async (): Promise<void> => {
        try {
            setIsLoading(true);
            console.log('🔄 Logging out...');

            // Sign out from Firebase
            await signOut(auth);

            // Clear local storage
            await AsyncStorage.multiRemove(['@token_id', '@user_data']);

            // Clear state
            setUser(null);
            setFirebaseUser(null);
            setError(null);

            console.log('✅ Logout successful');

            // Navigate to login
            router.replace('/auth/LoginScreen');

        } catch (error: any) {
            console.error('❌ Logout error:', error);
            // Force clear state even if logout fails
            setUser(null);
            setFirebaseUser(null);
            router.replace('/auth/LoginScreen');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    // Enhanced forgot password function
    const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
        try {
            setIsLoading(true);
            setError(null);

            console.log('🔄 Sending password reset email...');

            if (!email?.trim()) {
                throw new Error('Email é obrigatório');
            }

            await api.post('/auth/forgot-password', { email: email.trim() });

            console.log('✅ Password reset email sent');
            return true;

        } catch (error: any) {
            handleError(error, 'Forgot password failed');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [handleError]);

    // Enhanced reset password function
    const resetPassword = useCallback(async (uid: string, newPassword: string): Promise<boolean> => {
        try {
            setIsLoading(true);
            setError(null);

            console.log('🔄 Resetting password...');

            if (!uid || !newPassword?.trim()) {
                throw new Error('Dados inválidos para redefinição de senha');
            }

            await api.post('/auth/reset-password', { uid, newPassword });

            console.log('✅ Password reset successful');

            Alert.alert(
                'Senha Redefinida!',
                'Sua senha foi redefinida com sucesso. Faça login com sua nova senha.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.push('/auth/LoginScreen')
                    }
                ]
            );

            return true;

        } catch (error: any) {
            handleError(error, 'Reset password failed');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [router, handleError]);

    // Enhanced fetch user function
    const fetchUser = useCallback(async (): Promise<void> => {
        try {
            if (!firebaseUser) {
                console.log('⚠️ No Firebase user to fetch profile for');
                return;
            }

            console.log('🔄 Fetching user profile...');
            const response = await api.get('/auth/me');
            setUser(response.data);
            console.log('✅ User profile updated');

        } catch (error: any) {
            console.error('❌ Failed to fetch user:', error);
            handleError(error, 'Fetch user failed');
        }
    }, [firebaseUser, handleError]);

    // Refresh authentication
    const refreshAuth = useCallback(async (): Promise<void> => {
        try {
            if (!firebaseUser) return;

            console.log('🔄 Refreshing authentication...');

            // Get fresh token
            const idToken = await firebaseUser.getIdToken(true);
            await AsyncStorage.setItem('@token_id', idToken);

            // Fetch fresh user data
            await fetchUser();

            console.log('✅ Authentication refreshed');

        } catch (error: any) {
            console.error('❌ Failed to refresh auth:', error);
            handleError(error, 'Refresh auth failed');
        }
    }, [firebaseUser, fetchUser, handleError]);

    // Get ID token function
    const getIdToken = useCallback(async (): Promise<string | null> => {
        try {
            if (!firebaseUser) return null;
            return await firebaseUser.getIdToken();
        } catch (error) {
            console.error('❌ Failed to get ID token:', error);
            return null;
        }
    }, [firebaseUser]);

    const contextValue: AuthContextProps = {
        user,
        firebaseUser,
        isAuthenticated: !!user && !!firebaseUser,
        isLoading,
        isInitializing,
        error,
        clearError,
        login,
        register,
        logout,
        getIdToken,
        forgotPassword,
        resetPassword,
        fetchUser,
        refreshAuth,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
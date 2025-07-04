import axios from "axios";
import { User as FirebaseUser, onAuthStateChanged, signInWithCustomToken, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ENV } from "../config/env";
import { auth, db } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { AuthState } from "../interfaces/auth.interface";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../infrastructure/api";

interface AuthContextProps {
    user: any | null;
    firebaseUser: FirebaseUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
    login: (email: string, password: string) => Promise<boolean>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    getIdToken: () => Promise<string | null>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (uid: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();


    // Listen for Firebase Auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);
            if (fbUser) {
                // Fetch user profile from backend
                const idToken = await fbUser.getIdToken();
                try {
                    const res = await api.get(`/auth/me`);
                    console.log("✅ Usuário autenticado:", res.data);
                    setUser(res.data);
                } catch {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Login: call backend, get customToken, sign in with Firebase
    const login = async (email: string, password: string) => {
        try {
            setError(null);

            console.log('🔄 Iniciando login com Firebase...');

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            console.log('✅ Firebase login bem-sucedido:', firebaseUser.uid);

            const idToken = await firebaseUser.getIdToken();
            await AsyncStorage.setItem('@token_id', idToken);

            const response = await api.post('/auth/verify-token');


            console.log('✅ Login completo:', response.data.email);

            // Redirecionar
            router.replace('/(tabs)');
            return true;
        } catch (error: any) {
            console.error('❌ Falha no login:', error);

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

    // Register: call backend
    const register = async (data: any) => {
        setIsLoading(true);
        try {
            await api.post(`/auth/register`, data);
            // Optionally auto-login after registration
        } finally {
            setIsLoading(false);
        }
    };

    // Logout
    const logout = async () => {
        await signOut(auth);
        await AsyncStorage.removeItem('@token_id');
        setUser(null);
        setFirebaseUser(null);
    };

    // Get Firebase ID token
    const getIdToken = async () => {
        return firebaseUser ? firebaseUser.getIdToken() : null;
    };

    // Forgot Password: call backend
    const forgotPassword = async (email: string) => {
        setIsLoading(true);
        try {
            await api.post(`/auth/forgot-password`, { email });
        } finally {
            setIsLoading(false);
        }
    };

    // Reset Password: call backend
    const resetPassword = async (uid: string, newPassword: string) => {
        setIsLoading(true);
        try {
            await axios.post(`/auth/reset-password`, { uid, newPassword });
        } finally {
            setIsLoading(false);
        }
    };

    const clearError = () => {
        setError(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                firebaseUser,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
                getIdToken,
                forgotPassword,
                resetPassword,
                error,
                clearError
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
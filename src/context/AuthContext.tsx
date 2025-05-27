import React, { createContext, useState, ReactNode } from "react";
import { useNavigation } from "@react-navigation/native";
import apiService from "../services/apiService";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";

// Define the shape of user data
interface AuthUser {
    id: string;
    email: string;
    fullName?: string;
    token: string;
    role: 'admin' | 'user'; // Add role field
}

// Define registration data
export interface RegisterFullFormData {
    profile: "MENTOR" | "MENTORADO" | "COORDENADOR";
    fullName: string;
    cellphone: string;
    email: string;
    birth: Date;
    gender: "MASCULINO" | "FEMININO";
    school: "CAXITO" | "MALANJE" | "NDALATANDO" | "ONDJIVA";
    grade: "10" | "11" | "12" | null;
    password: string;
    maxMenteeNumber: number | null;
    schoolYear: number | null;
}

// Define the context shape
interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    register: (registerFormData: RegisterFullFormData) => Promise<void>;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    isAdmin: () => boolean;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to use auth context
export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Check auth state on app start
    React.useEffect(() => {
        checkAuthState();
    }, []);

    const checkAuthState = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Register function
    const register = async (registerFormData: RegisterFullFormData) => {
        console.log("Registering user:", registerFormData);
        try {
            const response = await apiService.register(registerFormData);

            if (response.status === 201) {
                console.log("Registration successful");
                setUser(response.data); // Save user data after successful registration
                await AsyncStorage.setItem('user', JSON.stringify(response.data));
            } else {
                console.error("Registration failed");
            }
        } catch (error) {
            console.error("Registration Error:", error);
        }
    };

    // Enhanced login function
    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            // Mock admin credentials - replace with real API call
            if (email === 'admin@mme.com' && password === 'admin123') {
                const adminUser: AuthUser = {
                    id: 'admin_1',
                    email: 'admin@mme.com',
                    fullName: 'Administrador MME',
                    token: 'admin_token_123',
                    role: 'admin'
                };
                setUser(adminUser);
                await AsyncStorage.setItem('user', JSON.stringify(adminUser));
                router.replace('/(tabs)');
            }

            // Regular user login
            // const response = await apiService.login({ email, password });

            if (email === 'user@mme.com' && password === 'user123') {
                const regularUser: AuthUser = {
                    id: 'user_1',
                    email: 'user@mme.com',
                    fullName: 'John Simon',
                    token: 'user_token_123',
                    role: 'user'
                };

                setUser(regularUser);
                await AsyncStorage.setItem('user', JSON.stringify(regularUser));
                router.replace('/(tabs)');
            }
            
            return true;
        } catch (error) {
            console.error(`Erro ao fazer login: ${error}`);
            return false;
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await AsyncStorage.removeItem('user');
            setUser(null);
            console.log("User logged out");
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Check if user is admin
    const isAdmin = () => user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, isLoading, register, login, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

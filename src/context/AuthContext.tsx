import React, { createContext, useState, ReactNode } from "react";
import apiService from "../services/apiService";
import { useNavigation } from "@react-navigation/native";

// Define the shape of user data
interface AuthUser {
    id: string;
    email: string;
    fullName?: string;
    token: string;
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
    register: (registerFormData: RegisterFullFormData) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const navigation = useNavigation();
    // Register function
    const register = async (registerFormData: RegisterFullFormData) => {
        console.log("Registering user:", registerFormData);
        try {
            const response = await apiService.register(registerFormData);

            if (response.status === 201) {
                console.log("Registration successful");
                setUser(response.data); // Save user data after successful registration
            } else {
                console.error("Registration failed");
            }
        } catch (error) {
            console.error("Registration Error:", error);
        }
    };

    // Login function
    const login = async (email: string, password: string) => {
        try {
            const response = await apiService.login({ email, password });
            setUser(response.user); // Save user data after login
            console.log(response.user);
        } catch (error) {
            alert(`Erro ao fazer login: ${error}`);
        }
    };

    // Logout function
    const logout = () => {
        setUser(null);
        console.log("User logged out");
    };

    return (
        <AuthContext.Provider value={{ user, register, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

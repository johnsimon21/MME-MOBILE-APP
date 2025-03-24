import {create} from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthState = {
  isAuthenticated: boolean;
  setAuthenticated: (auth: boolean) => void;
  checkAuthStatus: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  setAuthenticated: (auth) => set({ isAuthenticated: auth }),

  checkAuthStatus: async () => {
    const token = await AsyncStorage.getItem("authToken");
    set({ isAuthenticated: !!token });
  },
}));

// src/infrastructure/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../state/authStore";

export const logout = async () => {
  await AsyncStorage.removeItem("authToken");
  useAuthStore.getState().setAuthenticated(false);
};

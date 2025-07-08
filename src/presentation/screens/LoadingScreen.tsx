// src/presentation/screens/LoadingScreen.tsx
import React from "react";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import tw from "twrnc";

export default function LoadingScreen({ navigation }: any) {
  const { checkAuthStatus, isAuthenticated } = useAuthStor();

  useEffect(() => {
    const checkAuth = async () => {
      await checkAuthStatus();
      navigation.replace(isAuthenticated ? "AppNavigator" : "AuthNavigator");
    };

    checkAuth();
  }, [isAuthenticated]);

  return (
    <View style={tw`flex-1 items-center justify-center`}>
      <ActivityIndicator size="large" />
    </View>
  );
}

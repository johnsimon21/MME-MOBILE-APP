// src/presentation/navigation/RootNavigator.tsx
import * as React from 'react';

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import LoadingScreen from "../screens/LoadingScreen";
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loading" component={LoadingScreen} />
        <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
        <Stack.Screen name="AppNavigator" component={AppNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

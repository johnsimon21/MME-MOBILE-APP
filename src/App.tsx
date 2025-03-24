// In App.js in a new project

import * as React from 'react';
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from './presentation/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  )
}


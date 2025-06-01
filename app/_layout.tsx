import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { View } from 'react-native';
import { FloatingOptionsButton } from '@/components/ui/FloatingUnfoldVerticalButton';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { FloatingButtonProvider } from '@/src/context/FloatingButtonContext';
import { SupportProvider } from '@/src/context/SupportContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isLoading]);

  if (!loaded || isLoading) {
    return null;
  }

  const hideSettingsOn = [
    '/settings',
    '/voice-call',
    '/normal-call',
    '/notifications',
    '/+not-found',
    '/support',
    '/auth/LoginScreen',
     '/faq',
    '/chat-support',
    '/create-ticket',
    '/quick-questions'
  ];

  const shouldShowSettings = user &&
    !hideSettingsOn.includes(pathname) &&
    !pathname.includes('/ChatScreen') &&
    !pathname.includes('/auth/');

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <SupportProvider>
          <FloatingButtonProvider>
            <View style={{ flex: 1 }}> 
              <Stack>
                <Stack.Screen name="auth/LoginScreen" options={{ headerShown: false }} />
                <Stack.Screen name="auth/RegisterScreen" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
                <Stack.Screen name="user" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ headerShown: false }} />
                <Stack.Screen name="notifications" options={{ headerShown: false }} />
                <Stack.Screen name="support" options={{ headerShown: false }} />
                <Stack.Screen name="faq" options={{ headerShown: false }} />
                <Stack.Screen name="chat-support" options={{ headerShown: false }} />
                <Stack.Screen name="create-ticket" options={{ headerShown: false }} />
                <Stack.Screen
                  name="voice-call"
                  options={{
                    headerShown: false,
                    presentation: 'modal',
                    animation: 'slide_from_bottom'
                  }}
                />
                <Stack.Screen
                  name="normal-ca
                  ll"
                  options={{
                    headerShown: false,
                    presentation: 'modal',
                    animation: 'slide_from_bottom'
                  }}
                />
              </Stack>
              <StatusBar style="auto" />
              {shouldShowSettings && <FloatingOptionsButton />}
            </View>
          </FloatingButtonProvider>
        </SupportProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}

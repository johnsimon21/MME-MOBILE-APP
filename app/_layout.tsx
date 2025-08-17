import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { use, useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { View } from 'react-native';
import { FloatingButtonProvider } from '@/src/context/FloatingButtonContext';
import { SupportProvider } from '@/src/context/SupportContext';
import { FloatingOptionsButton } from '@/src/presentation/components/ui/FloatingUnfoldVerticalButton';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { SocketProvider } from '@/src/context/SocketContext';
import { ChatProvider } from '@/src/context/ChatContext';
import { SessionProvider } from '@/src/context/SessionContext';
import { SettingsProvider } from '@/src/context/SettingsContext';
import { NotificationProvider } from '@/src/context/NotificationContext';
import { LoadingScreen } from '@/src/components/LoadingScreen';
import { UserRole } from '@/src/interfaces/index.interface';
import { DashboardProvider } from '@/src/context/DashboardContext';
import { DashboardErrorBoundary } from '@/src/components/dashboard/DashboardErrorBoundary';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const router = useRouter();

  const { user, isLoading, isInitializing, isAuthenticated } = useAuth();

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded && !isLoading && !isInitializing) {
      SplashScreen.hideAsync();
      console.log(`Java Simon - App initialized`)
    }
  }, [loaded, isLoading, isInitializing]);

  // Handle navigation based on authentication state
  useEffect(() => {
    if (!isInitializing && loaded) {
      const authRoutes = ['/auth/LoginScreen', '/auth/RegisterScreen', '/auth/ForgotPasswordScreen', '/auth/ResetPasswordScreen'];
      const protectedRoutes = ['/(tabs)', '/support', '/notifications', '/user'];
      
      if (isAuthenticated && user) {
        // User is authenticated, redirect to main app if on auth routes
        if (authRoutes.includes(pathname)) {
          console.log('🔄 User authenticated, redirecting to main app...');
          router.replace('/(tabs)');
        }
      } else {
        // User is not authenticated, redirect to login if on protected routes
        if (protectedRoutes.some(route => pathname.startsWith(route))) {
          console.log('🔄 User not authenticated, redirecting to login...');
          router.replace('/auth/LoginScreen');
        }
      }
    }
  }, [isAuthenticated, user, isInitializing, loaded, pathname, router]);

  // Show loading screen during initialization
  if (!loaded || isInitializing) {
    return <LoadingScreen />;
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
    !pathname.includes('/Mensagens') &&
    !pathname.includes('/auth/');

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="auth/LoginScreen" options={{ headerShown: false }} />
          <Stack.Screen name="auth/ForgotPasswordScreen" options={{ headerShown: false }} />
          <Stack.Screen name="auth/ResetPasswordScreen" options={{ headerShown: false }} />
          <Stack.Screen name="auth/RegisterScreen" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="user" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="support" options={{ headerShown: false }} />
          <Stack.Screen name="faq" options={{ headerShown: false }} />
          <Stack.Screen name="chat-support" options={{ headerShown: false }} />
          <Stack.Screen name="my-tickets" options={{ headerShown: false }} />
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
    </ThemeProvider>
  );
}

class SocketErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    console.error('Socket Error Boundary caught an error:', error);
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Socket Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render children without socket functionality
      return this.props.children;
    }

    return this.props.children;
  }
}

const ConditionalSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, isInitializing } = useAuth();

  return (
    <SupportProvider>
      <SettingsProvider>
        {isAuthenticated && user && !isInitializing ? (
          <SocketErrorBoundary>
            <SocketProvider>
              <NotificationProvider>
                <ChatProvider>
                  <SessionProvider>
                    <DashboardErrorBoundary>
                      <DashboardProvider>
                        {children}
                      </DashboardProvider>
                    </DashboardErrorBoundary>
                  </SessionProvider>
                </ChatProvider>
              </NotificationProvider>
            </SocketProvider>
          </SocketErrorBoundary>
        ) : (
          children
        )}
      </SettingsProvider>
    </SupportProvider>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ConditionalSocketProvider>
        <FloatingButtonProvider>
          <RootLayoutContent />
        </FloatingButtonProvider>
      </ConditionalSocketProvider>
    </AuthProvider>
  );
}

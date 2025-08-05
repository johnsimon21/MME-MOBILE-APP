import * as React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, Platform } from "react-native";
import tw from "twrnc";
import { MessagesScreen } from "@/src/presentation/screens/MessagesScreen";
import { ChatScreen } from "@/src/presentation/screens/ChatScreen";
import { AnalyticsScreen } from "@/src/presentation/screens/AnalyticsScreen";
import Home from ".";
import { SessionManagementScreen } from "@/src/presentation/screens/SessionManagementScreen";
import { EducationalResourcesScreen } from "@/src/presentation/screens/EducationalResourcesScreen";
import { ProfileScreen } from "@/src/presentation/screens/ProfileScreen";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { AdminDashboardScreen } from "@/src/presentation/screens/AdminDashboardScreen";
import { AdminReportsScreen } from "@/src/presentation/screens/AdminReportsScreen";
import { UserProfileScreen } from "@/src/presentation/screens/UserProfileScreen";
import { SupportScreen } from "@/src/presentation/screens/SupportScreen";
import SettingsScreen from "@/src/presentation/screens/SettingsScreen";
import { AuthGuard } from "@/src/components/auth/AuthGuard";
import { useAuth } from "@/src/context/AuthContext";
import { useAuthState } from "@/src/hooks/useAuthState";
import { useChatSafe } from "@/src/context/ChatContext"; // Use the safe version
import { useNotificationContextSafe } from "@/src/context/NotificationContext";
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

// Create Stack & Tabs
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Icon Component
const TabIcon = ({
  focused,
  iconName,
  label,
  badge
}: {
  focused: boolean;
  iconName: string;
  label: string;
  badge?: number;
}) => {
  return (
    <View style={tw`items-center justify-center relative w-15`}>
      {/* Icon Container with Background */}
      <View style={tw`
                w-12 h-8 rounded-full items-center justify-center
                ${focused ? 'bg-indigo-500 shadow-lg' : 'bg-transparent'}
            `}>
        <Ionicons
          name={iconName as any}
          size={focused ? 22 : 20}
          color={focused ? "#FFFFFF" : "#9CA3AF"}
        />
      </View>

      {/* Label */}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={tw`
                    text-xs mt-1 font-medium text-center
                    ${focused ? 'text-indigo-600' : 'text-gray-500'}
                `}
      >
        {label}
      </Text>

      {/* Badge */}
      {badge && badge > 0 && (
        <View style={tw`
          absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full 
          items-center justify-center border-2 border-white
        `}>
          <Text style={tw`text-white text-xs font-bold`}>
            {badge > 9 ? '9+' : badge.toString()}
          </Text>
        </View>
      )}
    </View>
  );
};

function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Messages" component={MessagesScreen} />
    </Stack.Navigator>
  );
}

// Admin Tab Navigator
function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          let iconName;
          let label;
          let badge;

          if (route.name === "Dashboard") {
            iconName = "analytics";
            label = "Dashboard";
          } else if (route.name === "Sessões Admin") {
            iconName = "people";
            label = "Sessões";
            badge = 3; // Example badge
          } else if (route.name === "Relatórios") {
            iconName = "document-text";
            label = "Relatórios";
          } else if (route.name === "Support") {
            iconName = "help-circle";
            label = "Suporte";
            badge = 1; // Example badge
          }

          return (
            <TabIcon
              focused={focused}
              iconName={iconName!}
              label={label!}
              badge={badge}
            />
          );
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 20,
          right: 20,
          elevation: 8,
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          height: Platform.OS === 'ios' ? 95 : 75,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 12,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          borderTopWidth: 0,
          marginBottom: 5,
          marginHorizontal: 4,
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarLabelStyle: {
          display: 'none',
        },
        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#9CA3AF",
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Sessões Admin" component={SessionManagementScreen} />
      <Tab.Screen name="Relatórios" component={AdminReportsScreen} />
      <Tab.Screen name="Support" component={SupportScreen} />
    </Tab.Navigator>
  );
}

// Regular User Tab Navigator
function UserTabNavigator() {
  const { isMentor } = useAuthState();
  const chatContext = useChatSafe(); // Use safe version
  
  // Force re-render when unread count changes
  const unreadCount = chatContext?.getUnreadCount() || 0;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          let iconName;
          let label;
          let badge;

          if (route.name === "Mensagens") {
            iconName = "chatbubble-ellipses";
            label = "Mensagens";
            // Use the unreadCount variable to ensure re-renders
            badge = unreadCount > 0 ? unreadCount : undefined;
          } else if (route.name === "Emparelhamento") {
            iconName = "apps";
            label = "Home";
          } else if (route.name === "Gerenciamento de sessões" && isMentor) {
            iconName = "calendar";
            label = "Sessões";
            badge = 2;
          } else if (route.name === "Recursos educacionais") {
            iconName = "library";
            label = "Recursos";
          }

          return (
            <TabIcon
              focused={focused}
              iconName={iconName!}
              label={label!}
              badge={badge}
            />
          );
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 20,
          right: 20,
          elevation: 8,
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 12,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          borderTopWidth: 0,
          marginBottom: 5,
          marginHorizontal: 5,
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarLabelStyle: {
          display: 'none',
        },
        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#9CA3AF",
      })}
    >
      <Tab.Screen name="Emparelhamento" component={Home} />
      <Tab.Screen name="Mensagens" component={MessagesStack} />
      {isMentor && <Tab.Screen name="Gerenciamento de sessões" component={SessionManagementScreen} options={{ tabBarShowLabel: isMentor }} />}
      <Tab.Screen name="Recursos educacionais" component={EducationalResourcesScreen} />
    </Tab.Navigator>
  );
}

// Main Stack Navigator with role-based routing
function MainStack() {
  const { isAuthenticated, isLoading, isCoordinator } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('&&&&&&&&&&&&& User not authenticated &&&&&&&&&&&&&');
      router.replace('/auth/LoginScreen');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AuthGuard>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="TabNavigator"
          component={isCoordinator ? AdminTabNavigator : UserTabNavigator}
        />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen as React.ComponentType<any>} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{headerShown: false}} />
        <Stack.Screen 
          name="ChatScreen" 
          component={ChatScreen as React.ComponentType<any>} 
          options={{ 
            headerShown: false,
            presentation: 'card'
          }} 
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen as React.ComponentType<any>} 
          options={{ 
            headerShown: false,
            presentation: 'card'
          }} 
        />
      </Stack.Navigator>
    </AuthGuard>
  );
}

// Component to handle chat loading safely
function ChatLoader() {
  const chatContext = useChatSafe();

  useFocusEffect(
    useCallback(() => {
      if (chatContext?.loadChats) {
        const timer = setTimeout(() => {
          chatContext.loadChats();
        }, 1000);

        return () => clearTimeout(timer);
      }
    }, [chatContext?.loadChats])
  );

  return null;
}

export default function TabLayout() {
  return (
    <>
      <MainStack />
      <ChatLoader />
    </>
  );
}

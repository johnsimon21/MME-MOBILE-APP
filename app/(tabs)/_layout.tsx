import * as React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { MessagesScreen } from "@/src/presentation/screens/MessagesScreen";
import { ChatScreen } from "@/src/presentation/screens/ChatScreen";
import { AnalyticsScreen } from "@/src/presentation/screens/AnalyticsScreen";
import Home from ".";
import { SessionManagementScreen } from "@/src/presentation/screens/SessionManagementScreen";
import { EducationalResourcesScreen } from "@/src/presentation/screens/EducationalResourcesScreen";
import { ProfileScreen } from "@/src/presentation/screens/ProfileScreen";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { AdminDashboardScreen } from "@/src/presentation/screens/AdminDashboardScreen";
import { AdminReportsScreen } from "@/src/presentation/screens/AdminReportsScreen";

// Create Stack & Tabs
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen as React.ComponentType<any>} />
    </Stack.Navigator>
  );
}

// Admin Tab Navigator
function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Dashboard") iconName = "analytics";
          else if (route.name === "Sessões Admin") iconName = "reader";
          else if (route.name === "Relatórios") iconName = "document-text";

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: tw`bg-white shadow-md h-16`,
        tabBarItemStyle: tw`justify-center`,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Sessões Admin" component={SessionManagementScreen} />
      <Tab.Screen name="Relatórios" component={AdminReportsScreen} />
    </Tab.Navigator>
  );
}

// Regular User Tab Navigator (your existing one)
function UserTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Tarefas") iconName = "bar-chart";
          else if (route.name === "Mensagens") iconName = "chatbubble-ellipses";
          else if (route.name === "Emparelhamento") iconName = "apps";
          else if (route.name === "Gerenciamento de sessões") iconName = "reader";
          else if (route.name === "Recursos educacionais") iconName = "library";

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: "blue",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: tw`bg-white shadow-md h-16`,
        tabBarItemStyle: tw`justify-center`,
        tabBarLabelStyle: { display: "none" },
      })}
    >
      <Tab.Screen name="Tarefas" component={AnalyticsScreen} />
      <Tab.Screen name="Mensagens" component={MessagesStack} />
      <Tab.Screen name="Emparelhamento" component={Home} />
      <Tab.Screen name="Gerenciamento de sessões" component={SessionManagementScreen} />
      <Tab.Screen name="Recursos educacionais" component={EducationalResourcesScreen} />
    </Tab.Navigator>
  );
}

// Main Stack Navigator with role-based routing
function MainStack() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/LoginScreen');
    }
  }, [user, isLoading]);

  if (isLoading) {
    return null; // Or loading screen
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="TabNavigator" 
        component={user.role === 'admin' ? AdminTabNavigator : UserTabNavigator} 
      />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// Export the MainStack instead of TabNavigator
export default function TabLayout() {
  return <MainStack />;
}

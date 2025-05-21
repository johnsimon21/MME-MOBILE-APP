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

// Main Stack Navigator that includes the Profile screen
function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TabNavigator" component={TabNavigator} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// Bottom Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Tarefas") iconName = "bar-chart";
          else if (route.name === "Mensagens") iconName = "chatbubble-ellipses";
          else if (route.name === "Emparelhamento") iconName = "apps";
          else if (route.name === "Gerenciamento de sessões")
            iconName = "reader";
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
      <Tab.Screen
        name="Gerenciamento de sessões"
        component={SessionManagementScreen}
      />
      <Tab.Screen
        name="Recursos educacionais"
        component={EducationalResourcesScreen}
      />
    </Tab.Navigator>
  );
}

// Export the MainStack instead of TabNavigator
export default function TabLayout() {
  return <MainStack />;
}

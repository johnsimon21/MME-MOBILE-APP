import * as React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Home } from "../screens/Home";
import { MessagesScreen } from "../screens/MessagesScreen";
import tw from "twrnc";
import { AnalyticsScreen } from "../screens/AnalyticsScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { SessionManagement } from "../screens/SessionManagementScreen";
import { EducationalResourcesScreen } from "../screens/EducationalResourcesScreen";

function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen as React.ComponentType<any>} />
    </Stack.Navigator>
  );
}

// Create Stack & Tabs
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
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
        tabBarStyle: tw`bg-white border-t shadow-md h-16`,
        tabBarItemStyle: tw`justify-center`,
        tabBarLabelStyle: { display: "none" },
      })}
    >
      <Tab.Screen name="Tarefas" component={AnalyticsScreen} />
      <Tab.Screen name="Mensagens" component={MessagesStack} />
      <Tab.Screen name="Emparelhamento" component={Home} />
      <Tab.Screen name="Gerenciamento de sessões" component={SessionManagement} />
      <Tab.Screen name="Recursos educacionais" component={EducationalResourcesScreen} />
    </Tab.Navigator>
  );
}

// Main App Navigator with Stack
export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={BottomTabNavigator} />
    </Stack.Navigator>
  );
}

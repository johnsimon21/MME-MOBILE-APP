import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, TouchableOpacity, BackHandler, Platform, StatusBar, Alert, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import tw from "twrnc";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

interface NavbarProps {
  title: string;
  displayProfile?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
  theme?: 'light' | 'dark' | 'gradient';
  showNotifications?: boolean;
  notificationCount?: number;
  subtitle?: string;
  rightActions?: Array<{
    icon: string;
    onPress: () => void;
    badge?: number;
  }>;
}

export function Navbar({
  title,
  displayProfile = true,
  showBackButton = false,
  onBackPress,
  theme = 'light',
  showNotifications = false,
  notificationCount = 0,
  subtitle,
  rightActions = []
}: NavbarProps) {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (showProfileMenu) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [showProfileMenu]);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const handleProfilePress = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleLogout = () => {
    Alert.alert(
      "Sair",
      "Tem certeza que deseja sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: () => {
            logout();
            setShowProfileMenu(false);
          }
        }
      ]
    );
  };

  const navigateToProfile = () => {
    setShowProfileMenu(false);
    // @ts-ignore
    router.push('Profile');
  };

  const navigateToSettings = () => {
    setShowProfileMenu(false);
    router.push('/settings');
  };

  const navigateToNotifications = () => {
    router.push('/notifications');
  };

  const getNavbarContent = () => {
    const baseContent = (
      <>
        {/* Left Section */}
        <View style={tw`flex-row items-center flex-1`}>
          {showBackButton && (
            <TouchableOpacity
              style={tw`w-10 h-10 rounded-full items-center justify-center mr-3 ${theme === 'dark' ? 'bg-white bg-opacity-20' : 'bg-gray-100'
                }`}
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={theme === 'dark' ? "#FFFFFF" : "#4F46E5"}
              />
            </TouchableOpacity>
          )}

          <View style={tw`flex-1`}>
            <Text style={tw`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text style={tw`text-sm ${theme === 'dark' ? 'text-white text-opacity-80' : 'text-gray-500'
                }`} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {/* Right Section */}
        <View style={tw`flex-row items-center`}>
          {/* Custom Right Actions */}
          {rightActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={tw`w-10 h-10 rounded-full items-center justify-center mr-2 relative ${theme === 'dark' ? 'bg-white bg-opacity-20' : 'bg-gray-100'
                }`}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <Feather
                name={action.icon as any}
                size={18}
                color={theme === 'dark' ? "#FFFFFF" : "#4F46E5"}
              />
              {action.badge && action.badge > 0 && (
                <View style={tw`absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center`}>
                  <Text style={tw`text-white text-xs font-bold`}>
                    {action.badge > 9 ? '9+' : action.badge.toString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {/* Notifications */}
          {showNotifications && (
            <TouchableOpacity
              style={tw`w-10 h-10 rounded-full items-center justify-center mr-2 relative ${theme === 'dark' ? 'bg-white bg-opacity-20' : 'bg-gray-100'
                }`}
              onPress={navigateToNotifications}
              activeOpacity={0.7}
            >
              <Feather
                name="bell"
                size={18}
                color={theme === 'dark' ? "#FFFFFF" : "#4F46E5"}
              />
              {notificationCount > 0 && (
                <View style={tw`absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center`}>
                  <Text style={tw`text-white text-xs font-bold`}>
                    {notificationCount > 9 ? '9+' : notificationCount.toString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Profile */}
          {displayProfile && (
            <TouchableOpacity
              style={tw`w-10 h-10 rounded-full items-center justify-center relative ${theme === 'dark' ? 'bg-white bg-opacity-20' : 'bg-indigo-100'
                }`}
              onPress={handleProfilePress}
              activeOpacity={0.7}
            >
              <Feather
                name="user"
                size={18}
                color={theme === 'dark' ? "#FFFFFF" : "#4F46E5"}
              />
              {showProfileMenu && (
                <View style={tw`absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full`} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </>
    );

    if (theme === 'gradient') {
      return (
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={tw`flex-row items-center px-4 pt-12 pb-4`}
        >
          {baseContent}
        </LinearGradient>
      );
    }

    return (
      <View style={tw`flex-row items-center px-4 pt-12 pb-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'
        }`}>
        {baseContent}
      </View>
    );
  };

  return (
    <>
      <StatusBar
        barStyle={theme === 'dark' ? "light-content" : "dark-content"}
        backgroundColor={theme === 'gradient' ? '#4F46E5' : theme === 'dark' ? '#111827' : '#FFFFFF'}
      />

      {/* Main Navbar */}
      <View style={tw`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'
        } ${Platform.OS === 'ios' ? '' : 'elevation-4'} shadow-sm`}>
        {getNavbarContent()}
      </View>

      {/* Profile Dropdown Menu */}
      {showProfileMenu && (
        <>
          {/* Overlay */}
          <TouchableOpacity
            style={tw`absolute top-0 left-0 right-0 bottom-0 z-40`}
            onPress={() => setShowProfileMenu(false)}
            activeOpacity={1}
          >
            <View style={tw`flex-1 bg-black bg-opacity-20`} />
          </TouchableOpacity>

          {/* Dropdown Menu */}
          <Animated.View
            style={[
              tw`absolute top-20 right-4 bg-white rounded-2xl shadow-2xl z-50 min-w-48`,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0],
                    })
                  },
                  { scale: scaleAnim }
                ],
                opacity: slideAnim,
              }
            ]}
          >
            {/* User Info */}
            <View style={tw`p-4 border-b border-gray-100`}>
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-12 h-12 bg-indigo-100 rounded-full items-center justify-center mr-3`}>
                  <Text style={tw`text-indigo-600 font-bold text-lg`}>
                    {user?.fullName?.charAt(0) || 'U'}
                  </Text>
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`font-semibold text-gray-800`} numberOfLines={1}>
                    {user?.fullName || 'Usuário'}
                  </Text>
                  <Text style={tw`text-sm text-gray-500`} numberOfLines={1}>
                    {user?.email || 'email@exemplo.com'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Menu Items */}
            <View style={tw`py-2`}>
              <TouchableOpacity
                style={tw`flex-row items-center px-4 py-3`}
                onPress={navigateToProfile}
                activeOpacity={0.7}
              >
                <Feather name="user" size={18} color="#6B7280" style={tw`mr-3`} />
                <Text style={tw`text-gray-700 font-medium`}>Meu Perfil</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`flex-row items-center px-4 py-3`}
                onPress={navigateToSettings}
                activeOpacity={0.7}
              >
                <Feather name="settings" size={18} color="#6B7280" style={tw`mr-3`} />
                <Text style={tw`text-gray-700 font-medium`}>Configurações</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`flex-row items-center px-4 py-3`}
                onPress={() => {
                  setShowProfileMenu(false);
                  router.push('/support');
                }}
                activeOpacity={0.7}
              >
                <Feather name="help-circle" size={18} color="#6B7280" style={tw`mr-3`} />
                <Text style={tw`text-gray-700 font-medium`}>Suporte</Text>
              </TouchableOpacity>

              <View style={tw`border-t border-gray-100 mt-2 pt-2`}>
                <TouchableOpacity
                  style={tw`flex-row items-center px-4 py-3`}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <Feather name="log-out" size={18} color="#EF4444" style={tw`mr-3`} />
                  <Text style={tw`text-red-500 font-medium`}>Sair</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </>
      )}
    </>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, Image, TouchableOpacity, BackHandler, Platform, StatusBar } from "react-native";
import { useNavigation } from "@react-navigation/native";
import tw from "twrnc";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface NavbarProps {
  title: string;
  displayProfile?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
  theme?: 'light' | 'dark';
}

export function Navbar({ 
  title, 
  displayProfile = true, 
  showBackButton = false,
  onBackPress,
  theme = 'light'
}: NavbarProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [userName, setUserName] = useState("User");
  const navigation = useNavigation();
  const menuRef = useRef(null);

  // Set status bar appearance based on theme
  useEffect(() => {
    // For iOS, we can set the style directly
    // For Android, we need to set the background color and style
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle(theme === 'light' ? 'dark-content' : 'light-content');
    } else {
      StatusBar.setBackgroundColor(theme === 'light' ? 'white' : '#121212');
      StatusBar.setBarStyle(theme === 'light' ? 'dark-content' : 'light-content');
    }
  }, [theme]);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setUserName(user.name || "User");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
  const handleBackPress = () => {
    if (menuVisible) {
      setMenuVisible(false);
      return true;
    }
    return false;
  };

  // Correct way to add BackHandler event listener
  const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
  
  // Return cleanup function
  return () => backHandler.remove();
}, [menuVisible]);

  const handleLogout = async () => {
   confirm("Tens a certeza que queres sair?")
  };

  const handleProfileView = () => {
    setMenuVisible(false);
    // navigation.navigate('Profile');
    alert("Ver perfil");
  };

  const handleBackButton = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const backgroundColor = theme === 'light' ? 'bg-white' : 'bg-gray-900';
  const textColor = theme === 'light' ? 'text-gray-800' : 'text-white';
  const bottomBarColor = theme === 'light' ? 'bg-[#F7F7F7]' : 'bg-gray-800';

  return (
    <View style={tw`${backgroundColor} flex-row justify-between items-center min-h-20 pt-10 pb-6 shadow-sm`}>
      {/* Status Bar - This is just a visual representation, the actual control happens in the useEffect */}
      <StatusBar 
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme === 'light' ? 'white' : '#121212'}
        translucent={true}
      />
      
      <View style={tw`flex-row items-center`}>
        {showBackButton && (
          <TouchableOpacity 
            onPress={handleBackButton}
            style={tw`px-2 ml-2`}
          >
            <Text style={tw`text-2xl ${textColor}`}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={tw`text-lg font-semibold px-4 ${textColor}`}>{title}</Text>
      </View>

      {/* Profile Section */}
      {displayProfile && (
        <Pressable 
          onPress={() => setMenuVisible(!menuVisible)}
          style={tw`flex-col items-center px-4`}
        >
          <View style={tw`w-10 h-10 bg-gray-300 rounded-full justify-center items-center`}>
            <Text style={tw`text-gray-600 font-bold`}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={tw`text-sm mt-1 ${textColor}`}>{userName}</Text>
        </Pressable>
      )}

      {/* Dropdown Menu */}
      {menuVisible && (
        <View 
          ref={menuRef}
          style={tw`absolute right-4 top-20 z-50 ${backgroundColor} p-2 shadow-lg rounded-lg w-40 border border-gray-100`}
        >
          <TouchableOpacity 
            onPress={handleProfileView}
            style={tw`py-3 px-4 border-b border-gray-100`}
          >
            <Text style={tw`${textColor}`}>Ver perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleLogout}
            style={tw`py-3 px-4`}
          >
            <Text style={tw`text-red-500`}>Sair</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Bottom rounded edge */}
      <View style={tw`absolute bottom-0 left-0 right-0 ${bottomBarColor} w-full h-4 rounded-t-4`}></View>
    </View>
  );
}

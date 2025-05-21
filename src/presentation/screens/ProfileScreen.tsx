import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import tw from "twrnc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Navbar } from "../components/ui/navbar";

interface UserData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export function ProfileScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editedData, setEditedData] = useState<UserData | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const userDataString = await AsyncStorage.getItem('user');
      if (userDataString) {
        const parsedData = JSON.parse(userDataString);
        setUserData(parsedData);
        setEditedData(parsedData);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!editedData) return;
    
    try {
      setIsLoading(true);
      await AsyncStorage.setItem('user', JSON.stringify(editedData));
      setUserData(editedData);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error saving user data:", error);
      Alert.alert("Error", "Failed to save profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedData(userData);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-white`}>
        <Navbar title="Profile" showBackButton={true} theme="light" />
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-white`}>
      <Navbar title="Profile" showBackButton={true} theme="light" />
      
      <ScrollView style={tw`flex-1 px-4 pt-4`}>
        {/* Profile Header */}
        <View style={tw`items-center mb-6`}>
          <View style={tw`w-24 h-24 bg-gray-300 rounded-full justify-center items-center mb-4`}>
            <Text style={tw`text-gray-600 font-bold text-4xl`}>
              {userData?.name?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          
          {!isEditing ? (
            <TouchableOpacity 
              onPress={() => setIsEditing(true)}
              style={tw`bg-blue-500 py-2 px-6 rounded-full`}
            >
              <Text style={tw`text-white font-semibold`}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={tw`flex-row`}>
              <TouchableOpacity 
                onPress={handleSaveChanges}
                style={tw`bg-green-500 py-2 px-6 rounded-full mr-2`}
              >
                <Text style={tw`text-white font-semibold`}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleCancel}
                style={tw`bg-red-500 py-2 px-6 rounded-full`}
              >
                <Text style={tw`text-white font-semibold`}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Profile Information */}
        <View style={tw`bg-gray-50 rounded-lg p-4 mb-4`}>
          <Text style={tw`text-lg font-bold mb-4 text-gray-800`}>Personal Information</Text>
          
          <View style={tw`mb-4`}>
            <Text style={tw`text-gray-500 mb-1`}>Name</Text>
            {isEditing ? (
              <TextInput
                style={tw`bg-white border border-gray-300 rounded-md p-2`}
                value={editedData?.name}
                onChangeText={(text) => setEditedData({...editedData!, name: text})}
              />
            ) : (
              <Text style={tw`text-gray-800 font-medium`}>{userData?.name}</Text>
            )}
          </View>
          
          <View style={tw`mb-4`}>
            <Text style={tw`text-gray-500 mb-1`}>Email</Text>
            {isEditing ? (
              <TextInput
                style={tw`bg-white border border-gray-300 rounded-md p-2`}
                value={editedData?.email}
                onChangeText={(text) => setEditedData({...editedData!, email: text})}
                keyboardType="email-address"
              />
            ) : (
              <Text style={tw`text-gray-800 font-medium`}>{userData?.email}</Text>
            )}
          </View>
          
          <View style={tw`mb-4`}>
            <Text style={tw`text-gray-500 mb-1`}>Phone</Text>
            {isEditing ? (
              <TextInput
                style={tw`bg-white border border-gray-300 rounded-md p-2`}
                value={editedData?.phone || ""}
                onChangeText={(text) => setEditedData({...editedData!, phone: text})}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={tw`text-gray-800 font-medium`}>{userData?.phone || "Not provided"}</Text>
            )}
          </View>
          
          <View>
            <Text style={tw`text-gray-500 mb-1`}>Address</Text>
            {isEditing ? (
              <TextInput
                style={tw`bg-white border border-gray-300 rounded-md p-2`}
                value={editedData?.address || ""}
                onChangeText={(text) => setEditedData({...editedData!, address: text})}
                multiline
              />
            ) : (
              <Text style={tw`text-gray-800 font-medium`}>{userData?.address || "Not provided"}</Text>
            )}
          </View>
        </View>

        {/* Account Settings */}
        <View style={tw`bg-gray-50 rounded-lg p-4 mb-4`}>
          <Text style={tw`text-lg font-bold mb-4 text-gray-800`}>Account Settings</Text>
          
          <TouchableOpacity style={tw`py-3 border-b border-gray-200`}>
            <Text style={tw`text-gray-800`}>Change Password</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={tw`py-3 border-b border-gray-200`}>
            <Text style={tw`text-gray-800`}>Notification Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={tw`py-3`}>
            <Text style={tw`text-red-500`}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
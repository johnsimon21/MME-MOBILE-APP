import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import tw from 'twrnc';

export const LoadingScreen = () => (
  <View style={tw`flex-1 justify-center items-center bg-white`}>
    <ActivityIndicator size="large" color="#4285F4" />
    <Text style={tw`mt-4 text-gray-600`}>Carregando...</Text>
  </View>
);
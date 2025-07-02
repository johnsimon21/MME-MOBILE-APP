import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { auth } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import tw from 'twrnc';

export const FirebaseTest: React.FC = () => {
  const [authState, setAuthState] = useState<string>('Checking...');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthState(`✅ User: ${user.email}`);
      } else {
        setAuthState('❌ No user authenticated');
      }
    });

    return unsubscribe;
  }, []);

  const testFirebase = () => {
    console.log('🔥 Firebase Auth:', auth);
    console.log('🔥 Current User:', auth.currentUser);
    alert('Check console for Firebase info');
  };

  if (!__DEV__) return null;

  return (
    <View style={tw`m-4 p-4 bg-green-100 rounded-lg`}>
      <Text style={tw`text-sm font-bold mb-2`}>🔥 Firebase Test</Text>
      <Text style={tw`text-xs mb-2`}>Auth State: {authState}</Text>
      
      <TouchableOpacity
        onPress={testFirebase}
        style={tw`p-2 bg-green-500 rounded`}
      >
        <Text style={tw`text-white text-xs text-center`}>
          Test Firebase Connection
        </Text>
      </TouchableOpacity>
    </View>
  );
};
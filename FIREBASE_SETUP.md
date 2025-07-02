# Firebase Setup Instructions

## 1. Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `meu-mentor-eiffel`
3. Go to Project Settings > General
4. In "Your apps" section, add a new app or find your existing app
5. Copy the Firebase configuration object

## 2. Update Environment Configuration

Update `src/config/env.ts` with your actual Firebase config:

```typescript
export const ENV = {
  FIREBASE_CONFIG: {
    apiKey: "your-actual-api-key",
    authDomain: "meu-mentor-eiffel.firebaseapp.com",
    projectId: "meu-mentor-eiffel",
    storageBucket: "meu-mentor-eiffel.appspot.com",
    messagingSenderId: "your-actual-sender-id",
    appId: "your-actual-app-id"
  },
  // ... rest of config
};
```

## 3. Authentication Flow

The authentication flow now works as follows:

1. **User enters credentials** in LoginScreen
2. **Backend login** called with email/password
3. **Backend returns custom token** after validation
4. **Firebase signInWithCustomToken** called with custom token
5. **Firebase returns ID token** automatically
6. **User data fetched** from Firestore
7. **App state updated** with authenticated user
8. **All API calls** use Firebase ID token automatically

## 4. Development vs Production

- **Development**: Uses localhost backend
- **Production**: Uses your production backend URL
- **Firebase**: Same project for both (you can create separate projects if needed)

## 5. Testing the Integration

1. Start your backend server
2. Run the React Native app
3. Try logging in with existing credentials
4. Check console logs for Firebase authentication flow
5. Verify API calls include Firebase ID token

## 6. Troubleshooting

- **"Firebase app not initialized"**: Check firebase config
- **"Custom token invalid"**: Verify backend Firebase admin setup
- **"Network error"**: Check backend URL and connectivity
- **"Token expired"**: Token refresh is handled automatically
```

## **11. Create Development Helper Component**

```typescript:src/components/dev/FirebaseDebugInfo.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import tw from 'twrnc';

export const FirebaseDebugInfo: React.FC = () => {
  const { user, firebaseUser, isAuthenticated, idToken, getIdToken } = useAuth();

  if (!__DEV__) return null;

  const handleGetToken = async () => {
    try {
      const token = await getIdToken();
      console.log('🔑 Current ID Token:', token);
      alert('Token logged to console');
    } catch (error) {
      console.error('Error getting token:', error);
    }
  };

  return (
    <View style={tw`m-4 p-4 bg-gray-100 rounded-lg`}>
      <Text style={tw`text-sm font-bold mb-2`}>🔥 Firebase Debug Info</Text>
      
      <Text style={tw`text-xs mb-1`}>
        Authenticated: {isAuthenticated ? '✅' : '❌'}
      </Text>
      
      <Text style={tw`text-xs mb-1`}>
        Firebase User: {firebaseUser?.uid ? '✅' : '❌'}
      </Text>
      
      <Text style={tw`text-xs mb-1`}>
        App User: {user?.email || 'None'}
      </Text>
      
      <Text style={tw`text-xs mb-1`}>
        Role: {user?.role || 'None'}
      </Text>
      
      <TouchableOpacity
        onPress={handleGetToken}
        style={tw`mt-2 p-2 bg-blue-500 rounded`}
      >
        <Text style={tw`text-white text-xs text-center`}>
          Log Current Token
        </Text>
      </TouchableOpacity>
    </View>
  );
};
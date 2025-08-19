// Environment configuration using Expo environment variables
export const ENV = {
  // 🔥 FRONTEND Firebase Config (Web App Config)
  FIREBASE_CONFIG: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDutAFOSxYSaq6ZaxKg3MCLe9mscz4SWE4",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "meu-mentor-eiffel.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "meu-mentor-eiffel", 
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "meu-mentor-eiffel.firebasestorage.app",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "522028357639",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:522028357639:web:f0085373a46e341cd3f2a2",
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-EY91NW9C3T"
  },

  // API Configuration
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__
    ? 'http://192.168.1.103:3000/api'
    : 'https://jsonplaceholder.typicode.com'), // Fallback API for testing

  // Other environment variables
  DEBUG_MODE: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true' || __DEV__ || true, // Enable debug for crash diagnosis
  ENABLE_LOGGING: process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true' || __DEV__ || true, // Enable logging for crash diagnosis
  
  // App Configuration
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'MME - Meu Mentor Eiffel',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT || (__DEV__ ? 'development' : 'production'),
};
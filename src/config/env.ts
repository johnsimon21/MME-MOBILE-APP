// Environment configuration
const IP = '192.168.1.166' // '192.168.1.11' //  '192.168.101.92'; 

export const ENV = {
  // 🔥 FRONTEND Firebase Config (Web App Config)
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyDutAFOSxYSaq6ZaxKg3MCLe9mscz4SWE4",
    authDomain: "meu-mentor-eiffel.firebaseapp.com",
    projectId: "meu-mentor-eiffel", 
    storageBucket: "meu-mentor-eiffel.firebasestorage.app",
    messagingSenderId: "522028357639",
    appId: "1:522028357639:web:f0085373a46e341cd3f2a2",
    measurementId: "G-EY91NW9C3T"
  },

  // API Configuration
  API_BASE_URL: __DEV__
    ? `http://${IP}:3000/api`
    : 'https://your-production-domain.com/',

  // Other environment variables
  DEBUG_MODE: __DEV__,
  ENABLE_LOGGING: __DEV__,
};
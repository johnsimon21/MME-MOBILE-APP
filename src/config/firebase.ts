import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// 🔥 WEB APP CONFIG (NOT service account)
// Get this from Firebase Console → Project Settings → Your apps → Web app
const firebaseConfig = {
  apiKey: "AIzaSyDutAFOSxYSaq6ZaxKg3MCLe9mscz4SWE4",
  authDomain: "meu-mentor-eiffel.firebaseapp.com",
  projectId: "meu-mentor-eiffel",
  storageBucket: "meu-mentor-eiffel.firebasestorage.app",
  messagingSenderId: "522028357639",
  appId: "1:522028357639:web:f0085373a46e341cd3f2a2",
  measurementId: "G-EY91NW9C3T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

if (process.env.NODE_ENV === 'development') {
  console.log('🔥 Firebase initialized for project:', firebaseConfig.projectId);
}

export { auth, db, storage };
export default app;
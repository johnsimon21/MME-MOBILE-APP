import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { ENV } from './env';

// 🔥 WEB APP CONFIG (NOT service account)
// Get this from Firebase Console → Project Settings → Your apps → Web app
const firebaseConfig = ENV.FIREBASE_CONFIG;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

if (ENV.DEBUG_MODE) {
  console.log('🔥 Firebase initialized for project:', firebaseConfig.projectId);
  console.log('🔥 Environment:', ENV.ENVIRONMENT);
  console.log('🔥 API URL:', ENV.API_BASE_URL);
}

export { auth, db, storage };
export default app;
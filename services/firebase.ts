import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const getEnv = (key: string): string => {
  return (process.env[key] as string) || '';
};

const useFirebase = getEnv('VITE_USE_FIREBASE') === 'true';

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID')
};

let auth: any = null;
let db: any = null;
let isFirebaseEnabled = false;

if (useFirebase && firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseEnabled = true;
    console.log("PTDocAI: Production Mode Enabled (Firebase)");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.log("PTDocAI: Development Mode Enabled (LocalStorage)");
}

export { auth, db, isFirebaseEnabled };
export default { auth, db, isFirebaseEnabled };
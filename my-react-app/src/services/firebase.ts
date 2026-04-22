import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 1. Import Storage

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "zentravel-c550a.firebaseapp.com",
  projectId: "zentravel-c550a",
  storageBucket: "zentravel-c550a.firebasestorage.app",
  messagingSenderId: "18966002960",
  appId: "1:18966002960:web:17cab74e4880e12ab13995",
  measurementId: "G-50B899Y46W"
};

if (!firebaseConfig.apiKey) {
  console.warn("Firebase API Key is missing! Check your .env file and restart your terminal.");
}

const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); 
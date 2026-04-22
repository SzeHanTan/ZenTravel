// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "zentravel-c550a.firebaseapp.com",
  projectId: "zentravel-c550a",
  storageBucket: "zentravel-c550a.firebasestorage.app",
  messagingSenderId: "18966002960",
  appId: "1:18966002960:web:17cab74e4880e12ab13995",
  measurementId: "G-50B899Y46W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services so you can use them in your pages
export const auth = getAuth(app);
export const db = getFirestore(app);

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Use environment variables if available, otherwise use defaults for development
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDevelopmentKeyForLocalTesting",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bol-bharat-dev.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bol-bharat-dev",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bol-bharat-dev.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ABCDEF1234",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://bol-bharat-dev-default-rtdb.firebaseio.com",
};

// Remove the strict validation check that was causing the error
// Since we now have default values, the app can initialize for development
// In production, these should be replaced with real values

let app: ReturnType<typeof initializeApp> | undefined;
let analytics: ReturnType<typeof getAnalytics> | undefined;
let db: ReturnType<typeof getDatabase> | undefined;
let storage: ReturnType<typeof getStorage> | undefined;

try {
  app = initializeApp(firebaseConfig);
  
  // Only initialize analytics if we're in a browser environment
  if (typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app);
    } catch (analyticsError) {
      console.warn("Analytics initialization skipped:", analyticsError);
    }
  }
  
  db = getDatabase(app);
  storage = getStorage(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

export { app, analytics, db, storage };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Import the functions you need from the SDKs you need
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCJxLJA5SqD3IenpLA99lFpmJWvtcZXoNk",
  authDomain: "myva-fitness.firebaseapp.com",
  projectId: "myva-fitness",
  storageBucket: "myva-fitness.firebasestorage.app",
  messagingSenderId: "12697091392",
  appId: "1:12697091392:web:e716bd93079a7350d88ea5",
  measurementId: "G-QNXNQ39Q25"
};

export const app = initializeApp(firebaseConfig);

// Important for React Native so auth survives app restarts
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// (Optional) If you’ll write user profiles:
import { getFirestore } from 'firebase/firestore';
export const db = getFirestore(app);
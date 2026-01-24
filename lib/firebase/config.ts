// Configuration Firebase

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuration Firebase de votre projet
const firebaseConfig = {
  apiKey: "AIzaSyCelnZTQR1ACPayc1GxC4vQz93t1z0m3iM",
  authDomain: "padelmatch06.firebaseapp.com",
  projectId: "padelmatch06",
  storageBucket: "padelmatch06.firebasestorage.app",
  messagingSenderId: "248975894384",
  appId: "1:248975894384:web:b2d004851f1b4a9c5911b5",
};

// Initialiser Firebase (éviter la double initialisation)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Exporter les services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

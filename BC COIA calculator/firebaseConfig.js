// Firebase Configuration Module for Browser ES Modules
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7W-i3STvtErLJYtSfr-oEKEIzATPlYwQ",
  authDomain: "interestcalculator-7d80f.firebaseapp.com",
  projectId: "interestcalculator-7d80f",
  storageBucket: "interestcalculator-7d80f.firebasestorage.app",
  messagingSenderId: "85486510795",
  appId: "1:85486510795:web:3d237a290b1d732066f14e",
  measurementId: "G-KV0P35EX6B"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(firebaseApp);

// Log initialization
console.log("Firebase initialized successfully");

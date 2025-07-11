import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
// Updated with actual values from google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyC4rcRMN91L6otxTqYbi5cmffCK4LcjV9w",
  authDomain: "retaurant-block-twenty-9.firebaseapp.com",
  projectId: "retaurant-block-twenty-9",
  storageBucket: "retaurant-block-twenty-9.firebasestorage.app",
  messagingSenderId: "721539899518",
  appId: "1:721539899518:web:842dd60eb460ef199bf82f",
  measurementId: "G-MT9G4D64YL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { auth, db, storage };
export default app; 
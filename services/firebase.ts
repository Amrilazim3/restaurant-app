import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
// Updated with actual values from google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyBYoMiysGPXiaqT-8fVUJ5_zY542qXUwOE",
  authDomain: "retaurant-block-twenty-9.firebaseapp.com",
  projectId: "retaurant-block-twenty-9",
  storageBucket: "retaurant-block-twenty-9.firebasestorage.app",
  messagingSenderId: "721539899518",
  appId: "1:721539899518:android:44bcef895822fd299bf82f"
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
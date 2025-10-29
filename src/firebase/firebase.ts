import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBgw8uazMmaKeG0Yx6-YQFxYz-y1ocpS1I",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "i-repair-laxus.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "i-repair-laxus",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "i-repair-laxus.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "571739654699",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:571739654699:web:46890fee7944e33020b86e",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-HFVWNM21J0"
};

// Initialize Firebase with error handling
const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

console.log('✅ Firebase initialized successfully');

// Export Firebase services for web
export { auth, db, storage };

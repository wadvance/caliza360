import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Proyecto Firebase: caliza360
const firebaseConfig = {
  apiKey: "AIzaSyAfcinHAhD075EwXkMvB66WbXhFdgsGbw8",
  authDomain: "caliza360.firebaseapp.com",
  projectId: "caliza360",
  storageBucket: "caliza360.firebasestorage.app",
  messagingSenderId: "321221946315",
  appId: "1:321221946315:web:95426f02208db5040ca44e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCot7nlld9zzIZgYhg6_mv43-qE4xPNuSc",
  authDomain: "brgyreport-8088a.firebaseapp.com",
  databaseURL: "https://brgyreport-8088a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "brgyreport-8088a",
  storageBucket: "brgyreport-8088a.firebasestorage.app",
  messagingSenderId: "468374693974",
  appId: "1:468374693974:web:f48fa4c719223bf0a733f7",
  measurementId: "G-JQNCSXEM3C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exports
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// ✅ Corrected export
export {
  sendPasswordResetEmail,
  collection,
  addDoc,
  serverTimestamp,
};

export default app;

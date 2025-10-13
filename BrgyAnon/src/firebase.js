// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { serverTimestamp };

export default app;

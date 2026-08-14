import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDdE4EvCBWap2FCCMFKef9_r0JAV0faT3s",
  authDomain: "acads-criers-club.firebaseapp.com",
  projectId: "acads-criers-club",
  storageBucket: "acads-criers-club.firebasestorage.app",
  messagingSenderId: "607225586157",
  appId: "1:607225586157:web:35fdf42977fbfd208187e4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
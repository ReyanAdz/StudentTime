// src/firebase/firebase-config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDOZb6ke1RDUqWAV51xXRiQ8rRvx6ShmDo",
  authDomain: "studenttime-1b277.firebaseapp.com",
  projectId: "studenttime-1b277",
  storageBucket: "studenttime-1b277.firebasestorage.app",
  messagingSenderId: "567456438207",
  appId: "1:567456438207:web:f6016d04447507f0d5730a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, firebaseConfig }; // ✅ now this can be imported elsewhere

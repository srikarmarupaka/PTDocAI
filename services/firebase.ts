import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA0k6LXPxLGCY5_BtWr4EV22TCGbN1wqfY",
  authDomain: "pentestdoc-204a4.firebaseapp.com",
  projectId: "pentestdoc-204a4",
  storageBucket: "pentestdoc-204a4.firebasestorage.app",
  messagingSenderId: "3206417964",
  appId: "1:3206417964:web:e1446a822ba61cafdd8b89",
  measurementId: "G-BKJVFMSMEM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

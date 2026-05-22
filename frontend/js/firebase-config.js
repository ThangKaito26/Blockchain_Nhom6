// ============================================================
// frontend/js/firebase-config.js – Cấu hình Firebase (ES Module)
// ============================================================
// Sử dụng Firebase SDK v11.6.1 qua CDN (ES module)
// Import file này bằng: import { ... } from './firebase-config.js'
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  onSnapshot,
  deleteDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ── Firebase Configuration ──────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDV7AE-F-Hb5-niPw1-vQP5MVV2XrfLB1Y",
  authDomain: "blockchainnhom6.firebaseapp.com",
  projectId: "blockchainnhom6",
  storageBucket: "blockchainnhom6.firebasestorage.app",
  messagingSenderId: "849345391995",
  appId: "1:849345391995:web:fee6316b9f393e092161de",
  measurementId: "G-VNTH0T6HS9"
};

// ── Khởi tạo Firebase ───────────────────────────────────────
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Giữ phiên đăng nhập (localStorage)
setPersistence(auth, browserLocalPersistence);

// ── Export ───────────────────────────────────────────────────
export {
  auth,
  db,
  googleProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  // Firestore helpers
  collection,
  addDoc,
  doc,
  onSnapshot,
  deleteDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp
};

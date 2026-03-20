import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA76BpTulS4Wz5HbZiO5GwxTLtcBsts6Kw",
  authDomain: "medcontrol-d3215.firebaseapp.com",
  projectId: "medcontrol-d3215",
  storageBucket: "medcontrol-d3215.firebasestorage.app",
  messagingSenderId: "277007400219",
  appId: "1:277007400219:web:90dd7b6b1a8cf4288027be"
};

const app = initializeApp(firebaseConfig);

// 🔥 ISSO AQUI É O MAIS IMPORTANTE
const db = getFirestore(app);
const auth = getAuth(app);

// 🔥 EXPORTAR
export { db, auth };
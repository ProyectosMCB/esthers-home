// ==========================================================
// CONFIGURACIÓN DE FIREBASE
// ==========================================================
// 1. Ve a https://console.firebase.google.com
// 2. Crea un proyecto nuevo (gratis, plan Spark)
// 3. Dentro del proyecto: Configuración del proyecto > Tus apps > Web (</>)
// 4. Copia el objeto "firebaseConfig" que te da Firebase y pégalo abajo,
//    reemplazando los valores de ejemplo.
// 5. En el menú lateral de Firebase, activa:
//    - Authentication > Sign-in method > Google (activar)
//    - Authentication > Sign-in method > Correo electrónico/contraseña (activar)
//    - Firestore Database > Crear base de datos (modo producción)
//
// IMPORTANTE: usamos DOS instancias de Firebase (default + "adminApp").
// Esto es a propósito: Firebase solo permite una sesión activa por instancia,
// así que separamos "huésped" (Google) de "admin" (correo/contraseña) en dos
// instancias distintas para que nunca se pisen entre sí, sin importar si
// pruebas todo en el mismo navegador o hasta en la misma pestaña.
// ==========================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBcZdvBzBOb1TKMHAgB9RRPaxmTMxm2Ar4",
  authDomain: "departamento-5b6ae.firebaseapp.com",
  projectId: "departamento-5b6ae",
  storageBucket: "departamento-5b6ae.firebasestorage.app",
  messagingSenderId: "821214405197",
  appId: "1:821214405197:web:007e14927e88ab26a4f204",
  measurementId: "G-1K96SZSCVB"
};

// App "default" — usada por los huéspedes (index.html, login con Google)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// App "adminApp" — completamente aparte, usada solo por login.html / admin.html
const adminApp = initializeApp(firebaseConfig, "adminApp");
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

// Analytics es opcional (solo estadísticas de visitas) — no afecta login ni reservas.
try {
  getAnalytics(app);
} catch (err) {
  console.warn("Analytics no se pudo inicializar (no afecta el resto del sitio):", err);
}

// ===== Huéspedes (index.html) =====
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseSignIn = () => signInWithPopup(auth, googleProvider);
window.firebaseSignOut = () => signOut(auth);
window.firebaseOnAuthChange = (callback) => onAuthStateChanged(auth, callback);

// ===== Admin (login.html / admin.html) =====
window.firebaseAdminDb = adminDb;
window.firebaseSignInAdmin = (email, password) => signInWithEmailAndPassword(adminAuth, email, password);
window.firebaseSignOutAdmin = () => signOut(adminAuth);
window.firebaseOnAdminAuthChange = (callback) => onAuthStateChanged(adminAuth, callback);

// ===== Funciones de Firestore compartidas (funcionan con cualquiera de las dos bases) =====
window.firebaseCollection = collection;
window.firebaseAddDoc = addDoc;
window.firebaseGetDocs = getDocs;
window.firebaseUpdateDoc = updateDoc;
window.firebaseDeleteDoc = deleteDoc;
window.firebaseDoc = doc;
window.firebaseGetDoc = getDoc;
window.firebaseSetDoc = setDoc;
window.firebaseQuery = query;
window.firebaseOrderBy = orderBy;

// Avisa al resto del sitio que Firebase ya está listo para usarse
window.firebaseReady = true;
window.dispatchEvent(new Event("firebaseReady"));
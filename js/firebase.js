import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

// ===============================
// INICIALIZAÇÃO DO FIREBASE
// ===============================

const app = initializeApp(firebaseConfig);

// ===============================
// SERVIÇOS
// ===============================

export const auth = getAuth(app);

export const db = getFirestore(app);

// ===============================
// EXPORTAÇÕES
// ===============================

export {
    onAuthStateChanged,
    signOut,
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc
};
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';


// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAmoz2sG3pyOFEQ_OqwsDZ-tMiWaSa3Qdw",
    authDomain: "fidelis-59ca9.firebaseapp.com",
    databaseURL: "https://fidelis-59ca9-default-rtdb.firebaseio.com",
    projectId: "fidelis-59ca9",
    storageBucket: "fidelis-59ca9.firebasestorage.app",
    messagingSenderId: "231971853900",
    appId: "1:231971853900:web:4911e38f51183cf6b1c6e9",
    measurementId: "G-2Z5EWYCB7F"
  };

// Inicializa o Firebase App e Auth
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
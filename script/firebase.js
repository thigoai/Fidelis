import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';


const firebaseConfig = {
    apiKey: "AIzaSyAlxs6P9Z3Odzi_o_ciVx3H91xdrdeEbIQ",
    authDomain: "fidelis2-3dcb4.firebaseapp.com",
    projectId: "fidelis2-3dcb4",
    storageBucket: "fidelis2-3dcb4.firebasestorage.app",
    messagingSenderId: "1027242471882",
    appId: "1:1027242471882:web:5f1557000ad594371f5f33"
};

// Inicializa o Firebase App e Auth
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);


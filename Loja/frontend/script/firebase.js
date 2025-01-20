import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyDTCUOChzYTvKAICUSM7ngYXBH7mqZZS0g",
    authDomain: "fidelis-e1283.firebaseapp.com",
    projectId: "fidelis-e1283",
    storageBucket: "fidelis-e1283.firebasestorage.app",
    messagingSenderId: "120572619345",
    appId: "1:120572619345:web:9b8435271d95c4d56ea670",
    measurementId: "G-GTYJR7DW78"
};

// Inicializa o Firebase App e Auth
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

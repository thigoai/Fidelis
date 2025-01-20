import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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
  
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

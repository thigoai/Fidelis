const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Inicialização do Firebase
firebase.initializeApp({
    apiKey: "AIzaSyAmoz2sG3pyOFEQ_OqwsDZ-tMiWaSa3Qdw",
    authDomain: "fidelis-59ca9.firebaseapp.com",
    projectId: "fidelis-59ca9",
});

const db = firebase.firestore();

module.exports = db;

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyDTCUOChzYTvKAICUSM7ngYXBH7mqZZS0g",
    authDomain: "fidelis-e1283.firebaseapp.com",
    projectId: "fidelis-e1283",
    storageBucket: "fidelis-e1283.firebasestorage.app",
    messagingSenderId: "120572619345",
    appId: "1:120572619345:web:9b8435271d95c4d56ea670",
    measurementId: "G-GTYJR7DW78"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Exemplo de autenticação
/*signInWithEmailAndPassword(auth, "eaedoido455@gmail.com", "123456")
    .then((userCredential) => {
        // Usuário autenticado
        var user = userCredential.user;
        console.log("Usuário autenticado:", user);
        window.location.href = "hub.html";
    })
    .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.error("Erro de autenticação:", errorCode, errorMessage);
    });*/

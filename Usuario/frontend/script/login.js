import { auth } from './firebase.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';

const form = {
    loginEmail: () => document.getElementById('loginEmail'),
    loginPassword: () => document.getElementById('loginPassword')
};

function login() {
    const email = form.loginEmail().value;
    const password = form.loginPassword().value;

    signInWithEmailAndPassword(auth, email, password)
        .then(response => {
            console.log('Sucesso:', response);
            
            window.location.href = "./hub.html";
        })
        .catch(error => {
            console.error('Erro:', error.message);
        });
}

document.querySelector('.form').addEventListener('submit', (event) => {
    event.preventDefault();
    login();
});

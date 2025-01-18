import { auth } from './firebase.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';

const form = {
    signEmail: () => document.getElementById('signEmail'),
    signPassword: () => document.getElementById('signPassword'),
    confirmPassword: () => document.getElementById('confirmPassword')
};

async function register() {
    const email = form.signEmail().value;
    const password = form.signPassword().value;
    const confirmPassword = form.confirmPassword().value;

    if (password !== confirmPassword) {
        alert('As senhas não coincidem. Tente novamente.');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        window.location.href = `dadosAdicionais.html?uid=${user.uid}`;
    } catch (error) {
        console.error('Erro no cadastro:', error.message);
        alert('Erro ao cadastrar: ' + error.message);
    }
}

// Listener no formulário
document.querySelector('.form').addEventListener('submit', (event) => {
    event.preventDefault();
    register();
});

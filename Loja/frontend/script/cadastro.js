import { auth } from './firebase.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';

const form = {
    signEmail: () => document.getElementById('signEmail'),
    signPassword: () => document.getElementById('signPassword')
};

function register() {
    const email = form.signEmail().value;
    const password = form.signPassword().value;

    createUserWithEmailAndPassword(auth, email, password)
        .then(response => {
            console.log('Cadastro bem-sucedido:', response.user);
            alert('Usuário cadastrado com sucesso!');
            // Redirecionar o usuário, se necessário
            // window.location.href = "/Usuario/hub.html";
        })
        .catch(error => {
            console.error('Erro no cadastro:', error.message);
            alert('Erro ao cadastrar: ' + error.message);
        });
}

// Listener no formulário
document.querySelector('.form').addEventListener('submit', (event) => {
    event.preventDefault();
    register();
});

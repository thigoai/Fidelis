import { auth } from './firebase.js';

auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("Usuário logado:", user.email);
    } else {
        console.log("Nenhum usuário logado. Redirecionando para a página de login.");
        window.location.href = "login.html"; 
    }
});

document.getElementById('logoutButton').addEventListener('click', (e) => {
    e.preventDefault();

    auth.signOut()
        .then(() => {
            window.location.href = "login.html";
        })
        .catch((error) => {
            console.error("Erro ao deslogar o usuário:", error);
        });
});

auth.onAuthStateChanged((user) => {
    if (user) {
        const profilePicture = document.getElementById('profilePicture');
        if (user.photoURL) {
            profilePicture.src = user.photoURL;
        }
        document.querySelector('.profile-container .dropdown-menu li:first-child a')
            .textContent = `Meu Perfil (${user.displayName || user.email})`;
    }
});